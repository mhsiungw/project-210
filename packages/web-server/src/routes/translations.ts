import { Hono } from 'hono'
import { prisma } from '@app/db'
import type { Translation } from '@app/db'
import type { TranslationDto } from '@app/shared/api/types'
import { auth } from '../middleware/auth.js'

type Variables = { userId: string }

function toTranslationDto(t: Translation): TranslationDto {
  return {
    id: t.id,
    bookId: t.book_id ?? '',
    text: t.text ?? '',
    createdAt: t.created_at.toISOString(),
  }
}

export const translationRoutes = new Hono<{ Variables: Variables }>()
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
    const { bookId, text, id } = await c.req.json<{ bookId: string; text: string; id?: string }>()
    const result = id
      ? await prisma.translation.update({ where: { id }, data: { text } })
      : await prisma.translation.create({ data: { book_id: bookId, text } })
    return c.json(toTranslationDto(result), 201)
  })
