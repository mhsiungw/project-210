import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { Resource } from 'sst'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { prisma, type Book, type BookDto } from '@app/db'
import { signCloudFrontUrl } from '../lib/cloudfront.js'

const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60

const s3 = new S3Client({ region: process.env.AWS_REGION })

const cloudfrontBaseUrl = (): string => {
  const url = process.env.CLOUDFRONT_BASE_URL
  if (!url) throw new Error('CLOUDFRONT_BASE_URL is not set')
  return url
}

const signKey = (key: string): string => {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/')
  return signCloudFrontUrl(`${cloudfrontBaseUrl()}/${encodedKey}`, SIGNED_URL_TTL_SECONDS)
}

const toBookDto = (book: Book): BookDto => ({
  id: book.id,
  fileName: book.file_name,
  s3Key: book.s3_key,
  s3PreviewKey: book.s3_preview_key,
  s3KeyUrl: signKey(book.s3_key),
  s3PreviewKeyUrl: signKey(book.s3_preview_key),
  totalPages: book.total_pages ?? 0,
  currentPage: book.current_page ?? 0,
  createdAt: book.created_at.toISOString(),
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
  .get('/books', async c => {
    const books = await prisma.book.findMany({ where: { user_id: c.get('userId') } })
    return c.json(books.map(toBookDto))
  })
  .post('/books', async c => {
    const userId = c.get('userId')
    const existing = await prisma.book.findFirst({ where: { user_id: userId } })
    if (existing) return c.body(null, 409)

    const form = await c.req.formData()
    const pdfFile = form.get('pdf') as File
    const previewFile = form.get('preview') as File
    const fileName = form.get('fileName') as string
    const bookId = crypto.randomUUID()
    const base = `${userId}/${bookId}/${fileName}`
    const previewKey = base.replace(/\.pdf$/i, '') + '-preview.png'

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: Resource.Bucket.name,
          Key: base,
          Body: new Uint8Array(await pdfFile.arrayBuffer()),
          ContentType: 'application/pdf',
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: Resource.Bucket.name,
          Key: previewKey,
          Body: new Uint8Array(await previewFile.arrayBuffer()),
          ContentType: 'image/png',
        })
      ),
    ])

    await prisma.book.create({
      data: {
        id: bookId,
        file_name: fileName,
        s3_key: base,
        s3_preview_key: previewKey,
        user_id: userId,
      },
    })

    return c.body(null, 201)
  })
  .put('/books/:id', async c => {
    const userId = c.get('userId')
    const bookId = c.req.param('id')
    const body: BookDto = await c.req.json()
    const existing = await prisma.book.findFirst({ where: { id: bookId, user_id: userId } })
    if (!existing) return c.body(null, 404)
    const updated = await prisma.book.update({
      where: { id: bookId },
      data: { current_page: body.currentPage },
    })
    return c.json(toBookDto(updated))
  })
  .delete('/books/:id', async c => {
    const userId = c.get('userId')
    const bookId = c.req.param('id')
    const book = await prisma.book.findFirst({ where: { id: bookId, user_id: userId } })
    if (!book) return c.body(null, 404)
    await prisma.book.delete({ where: { id: bookId } })
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: Resource.Bucket.name,
        Delete: { Objects: [{ Key: book.s3_key }, { Key: book.s3_preview_key }] },
      })
    )
    return c.body(null, 204)
  })

export const handler = handle(app)
