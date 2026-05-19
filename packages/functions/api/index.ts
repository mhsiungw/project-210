import './process-shim.ts'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { S3Client } from '@aws-sdk/client-s3'
import { PrismaClient } from '../../db/generated/client/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'
import { createBookRoutes } from './routes/books.ts'
import { createTranslationRoutes } from './routes/translations.ts'
import { createAuth, createSupabaseClient, createSupabaseVerifyToken } from './middleware/auth.ts'

const env = (key: string): string => {
  const value = Deno.env.get(key)
  if (!value) throw new Error(`Missing env: ${key}`)
  return value
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env('DATABASE_URL') }),
})

const s3 = new S3Client({
  region: env('AWS_REGION'),
  credentials: {
    accessKeyId: env('AWS_ACCESS_KEY_ID'),
    secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
  },
})

const supabase = createSupabaseClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'))
const auth = createAuth(createSupabaseVerifyToken(supabase))

const config = {
  cloudfrontBaseUrl: env('CLOUDFRONT_BASE_URL'),
  s3Bucket: env('S3_BUCKET'),
  cloudfrontKeyPairId: env('CLOUDFRONT_KEY_PAIR_ID'),
  cloudfrontPrivateKey: env('CLOUDFRONT_PRIVATE_KEY').replace(/\\n/g, '\n'),
}

const app = new Hono().basePath('/api')

app.use(
  '/*',
  cors({
    origin: Deno.env.get('WEB_ORIGIN')?.split(',') ?? [
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)

app.route('/books', createBookRoutes({ prisma, s3, config, auth }))
app.route('/translations', createTranslationRoutes({ prisma, auth }))

Deno.serve(app.fetch)
