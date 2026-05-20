import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import type { Translation } from '@app/db'
import type { TranslationDto } from '@app/shared/client/types'
import { prisma } from '../lib/prisma.js'

const toTranslationDto = (t: Translation): TranslationDto => ({
  id: t.id,
  bookId: t.book_id ?? '',
  text: t.text ?? '',
  createdAt: t.created_at.toISOString(),
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
  .get('/translations/:bookId', async c => {
    const t = await prisma.translation.findFirst({
      where: { book_id: c.req.param('bookId') },
      orderBy: { created_at: 'desc' },
    })
    if (!t) return c.json(null, 404)
    return c.json(toTranslationDto(t))
  })
  .post('/translations', async c => {
    const { bookId, text, id } = await c.req.json<{
      bookId: string
      text: string
      id?: string
    }>()
    const result = id
      ? await prisma.translation.update({ where: { id }, data: { text } })
      : await prisma.translation.create({ data: { book_id: bookId, text } })
    return c.json(toTranslationDto(result), 201)
  })

export const handler = handle(app)
