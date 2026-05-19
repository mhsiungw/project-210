import { Hono, type MiddlewareHandler } from 'hono'
import type { PrismaClient, Translation } from '@app/db'
import type { TranslationDto } from '@app/shared/client/types'

type Variables = { userId: string }

export type TranslationRoutesDeps = {
  prisma: PrismaClient
  auth: MiddlewareHandler<{ Variables: Variables }>
}

const toTranslationDto = (t: Translation): TranslationDto => ({
  id: t.id,
  bookId: t.book_id ?? '',
  text: t.text ?? '',
  createdAt: t.created_at.toISOString(),
})

export const createTranslationRoutes = ({
  prisma,
  auth,
}: TranslationRoutesDeps): Hono<{ Variables: Variables }> => {
  return new Hono<{ Variables: Variables }>()
    .use(auth)
    .get('/:bookId', async c => {
      const t = await prisma.translation.findFirst({
        where: { book_id: c.req.param('bookId') },
        orderBy: { created_at: 'desc' },
      })
      if (!t) return c.json(null, 404)
      return c.json(toTranslationDto(t))
    })
    .post('/', async c => {
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
}
