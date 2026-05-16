import { Hono, type MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { S3Client } from '@aws-sdk/client-s3'
import { mockClient, type AwsClientStub } from 'aws-sdk-client-mock'
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended'
import type { PrismaClient } from '@app/db'
import { createBookRoutes, type BookRoutesConfig } from '../routes/books.js'
import { createTranslationRoutes } from '../routes/translations.js'

type Variables = { userId: string }

export type TestAppOverrides = {
  prisma?: PrismaClient
  s3?: S3Client
  config?: BookRoutesConfig
  auth?: MiddlewareHandler<{ Variables: Variables }>
  userId?: string
}

export type TestApp = {
  app: Hono
  prisma: DeepMockProxy<PrismaClient>
  s3Mock: AwsClientStub<S3Client>
  s3: S3Client
  config: BookRoutesConfig
  auth: MiddlewareHandler<{ Variables: Variables }>
  userId: string
}

export const createTestApp = (overrides: TestAppOverrides = {}): TestApp => {
  const userId = overrides.userId ?? 'test-user-id'
  const prisma = (overrides.prisma ?? mockDeep<PrismaClient>()) as DeepMockProxy<PrismaClient>
  const s3 = overrides.s3 ?? new S3Client({ region: 'us-east-1' })
  const s3Mock = mockClient(s3)
  const config: BookRoutesConfig = overrides.config ?? {
    cloudfrontBaseUrl: 'https://cdn.test',
    s3Bucket: 'test-bucket',
  }
  const auth =
    overrides.auth ??
    createMiddleware<{ Variables: Variables }>(async (c, next) => {
      c.set('userId', userId)
      await next()
    })

  const app = new Hono()
  app.route('/api/books', createBookRoutes({ prisma, s3, config, auth }))
  app.route('/api/translations', createTranslationRoutes({ prisma, auth }))

  return { app, prisma, s3Mock, s3, config, auth, userId }
}
