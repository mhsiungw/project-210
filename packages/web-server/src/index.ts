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
  cloudfrontKeyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
  cloudfrontPrivateKey: process.env.CLOUDFRONT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
}

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? [
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)

app.route('/api/books', createBookRoutes({ prisma, s3, config, auth }))
app.route('/api/translations', createTranslationRoutes({ prisma, auth }))

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`web-server listening on :${port}`)
})
