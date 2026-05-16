import './env.js'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { S3Client } from '@aws-sdk/client-s3'
import { PrismaClient } from '@app/db'
import { PrismaPg } from '@prisma/adapter-pg'
import { createBookRoutes } from './routes/books.js'
import { createTranslationRoutes } from './routes/translations.js'
import { createAuth, createSupabaseClient, createSupabaseVerifyToken } from './middleware/auth.js'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const s3 = new S3Client({ region: 'us-east-1' })
const supabase = createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
const auth = createAuth(createSupabaseVerifyToken(supabase))
const config = {
  cloudfrontBaseUrl: process.env.CLOUDFRONT_BASE_URL!,
  s3Bucket: process.env.S3_BUCKET!,
}

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5174',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)

app.route('/api/books', createBookRoutes({ prisma, s3, config, auth }))
app.route('/api/translations', createTranslationRoutes({ prisma, auth }))

app.get('/api/pdf', async c => {
  const url = c.req.query('url')
  if (!url) return c.json({ error: 'url is required' }, 400)
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  return c.body(buffer, 200, { 'Content-Type': 'application/pdf' })
})

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`web-server listening on :${port}`)
})
