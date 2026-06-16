import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { prisma, Prisma, type Highlight, type HighlightDto, type HighlightRect } from '@app/db'
import { findOwnedBook } from '../lib/ownership.js'

const toHighlightDto = (h: Highlight): HighlightDto => ({
  id: h.id,
  bookId: h.book_id,
  page: h.page,
  rects: (h.rects as unknown as HighlightRect[]) ?? [],
  text: h.text,
  note: h.note ?? undefined,
  color: h.color ?? undefined,
  createdAt: h.created_at.toISOString(),
})

type Variables = { userId: string }
type Bindings = { event: APIGatewayProxyEventV2WithJWTAuthorizer }

const app = new Hono<{ Variables: Variables; Bindings: Bindings }>()
  .basePath('/api')
  .use(async (c, next) => {
    const userId = c.env.event.requestContext.authorizer.jwt.claims.sub as string | undefined
    if (!userId) return c.body(null, 401)
    c.set('userId', userId)
    await next()
  })
  // List a book's highlights. Ownership checked on the book before any read.
  .get('/highlights/:bookId', async c => {
    const bookId = c.req.param('bookId')
    const book = await findOwnedBook(c.get('userId'), bookId)
    if (!book) return c.body(null, 404)
    const highlights = await prisma.highlight.findMany({
      where: { book_id: bookId },
      orderBy: [{ page: 'asc' }, { created_at: 'asc' }],
    })
    return c.json(highlights.map(toHighlightDto))
  })
  // Create a highlight on a book the caller owns.
  .post('/highlights', async c => {
    const { bookId, page, rects, text, note, color } = await c.req.json<{
      bookId: string
      page: number
      rects: HighlightRect[]
      text: string
      note?: string
      color?: string
    }>()
    const book = await findOwnedBook(c.get('userId'), bookId)
    if (!book) return c.body(null, 404)
    const created = await prisma.highlight.create({
      data: {
        book_id: bookId,
        page,
        rects: rects as unknown as Prisma.InputJsonValue,
        text,
        note: note ?? null,
        color: color ?? null,
      },
    })
    return c.json(toHighlightDto(created), 201)
  })
  // Edit a highlight's note. Ownership proven by joining through the book.
  .put('/highlights/:id', async c => {
    const id = c.req.param('id')
    const { note } = await c.req.json<{ note: string | null }>()
    const existing = await prisma.highlight.findFirst({
      where: { id, books: { user_id: c.get('userId') } },
    })
    if (!existing) return c.body(null, 404)
    const updated = await prisma.highlight.update({ where: { id }, data: { note: note ?? null } })
    return c.json(toHighlightDto(updated))
  })
  // Delete a highlight the caller owns (via its book).
  .delete('/highlights/:id', async c => {
    const id = c.req.param('id')
    const existing = await prisma.highlight.findFirst({
      where: { id, books: { user_id: c.get('userId') } },
    })
    if (!existing) return c.body(null, 404)
    await prisma.highlight.delete({ where: { id } })
    return c.body(null, 204)
  })

export const handler = handle(app)
