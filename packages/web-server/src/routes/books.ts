import { Hono } from 'hono'
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { prisma } from '@app/db'
import type { Book } from '@app/db'
import type { BookDto } from '@app/shared/api/types'
import { auth } from '../middleware/auth.js'

type Variables = { userId: string }

const s3 = new S3Client({ region: 'us-east-1' })

function toBookDto(book: Book): BookDto {
  return {
    id: book.id,
    fileName: book.file_name,
    s3Key: book.s3_key,
    s3PreviewKey: book.s3_preview_key,
    s3KeyUrl: `${process.env.CLOUDFRONT_BASE_URL}/${book.s3_key}`,
    s3PreviewKeyUrl: `${process.env.CLOUDFRONT_BASE_URL}/${book.s3_preview_key}`,
    totalPages: book.total_pages ?? 0,
    currentPage: book.current_page ?? 0,
    createdAt: book.created_at.toISOString(),
  }
}

export const bookRoutes = new Hono<{ Variables: Variables }>()
  .use(auth)
  .get('/', async c => {
    const books = await prisma.book.findMany()
    return c.json(books.map(toBookDto))
  })
  .post('/', async c => {
    const form = await c.req.formData()
    const pdfFile = form.get('pdf') as File
    const previewFile = form.get('preview') as File
    const fileName = form.get('fileName') as string

    const base = `uploads/${Date.now()}-${fileName}`
    const previewKey = base.replace(/\.pdf$/i, '') + '-preview.png'

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: base,
          Body: Buffer.from(await pdfFile.arrayBuffer()),
          ContentType: 'application/pdf',
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: previewKey,
          Body: Buffer.from(await previewFile.arrayBuffer()),
          ContentType: 'image/png',
        })
      ),
    ])

    await prisma.book.create({
      data: { file_name: fileName, s3_key: base, s3_preview_key: previewKey },
    })

    return c.body(null, 201)
  })
  .put('/:id', async c => {
    const book: BookDto = await c.req.json()
    const updated = await prisma.book.update({
      where: { id: c.req.param('id') },
      data: { current_page: book.currentPage },
    })
    return c.json(toBookDto(updated))
  })
  .delete('/:id', async c => {
    const bookId = c.req.param('id')
    const book = await prisma.book.findUnique({ where: { id: bookId } })
    await prisma.translation.deleteMany({ where: { book_id: bookId } })
    await prisma.book.delete({ where: { id: bookId } })
    if (book) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET,
          Delete: { Objects: [{ Key: book.s3_key }, { Key: book.s3_preview_key }] },
        })
      )
    }
    return c.body(null, 204)
  })
