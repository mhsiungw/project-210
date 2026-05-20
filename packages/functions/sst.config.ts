// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'lambda-function',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    }
  },
  async run() {
    const { config: loadEnv } = await import('dotenv')
    loadEnv({ path: `../../env/.env.${$app.stage}` })

    const supabaseUrl = process.env.SUPABASE_URL
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')

    const s3Bucket = process.env.S3_BUCKET
    if (!s3Bucket) throw new Error('Missing S3_BUCKET')

    const cloudfrontBaseUrl = process.env.CLOUDFRONT_BASE_URL
    if (!cloudfrontBaseUrl) throw new Error('Missing CLOUDFRONT_BASE_URL')

    const webOrigins = [
      process.env.WEB_ORIGIN ?? '',
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean)

    const cloudfrontPrivateKey = new sst.Linkable('CLOUDFRONT_PRIVATE_KEY', {
      properties: { value: process.env.CLOUDFRONT_PRIVATE_KEY ?? '' },
    })

    const cloudfrontKeyPairId = new sst.Linkable('CLOUDFRONT_KEY_PAIR_ID', {
      properties: { value: process.env.CLOUDFRONT_KEY_PAIR_ID ?? '' },
    })

    const bucket = sst.aws.Bucket.get('Bucket', s3Bucket)

    const books = new sst.aws.Function('Books', {
      handler: 'functions/books.handler',
      runtime: 'nodejs22.x',
      link: [cloudfrontPrivateKey, cloudfrontKeyPairId, bucket],
      environment: {
        S3_BUCKET_NAME: bucket.name,
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        CLOUDFRONT_BASE_URL: cloudfrontBaseUrl,
      },
    })

    const translations = new sst.aws.Function('Translations', {
      handler: 'functions/translations.handler',
      runtime: 'nodejs22.x',
      link: [cloudfrontPrivateKey, cloudfrontKeyPairId, bucket],
      environment: {
        S3_BUCKET_NAME: bucket.name,
        DATABASE_URL: process.env.DATABASE_URL ?? '',
      },
    })

    const api = new sst.aws.ApiGatewayV2('Api', {
      cors: {
        allowOrigins: webOrigins,
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    })

    const supabaseAuthorizer = api.addAuthorizer({
      name: 'supabase',
      jwt: {
        issuer: `${supabaseUrl}/auth/v1`,
        audiences: ['authenticated'],
      },
    })

    const authed = { auth: { jwt: { authorizer: supabaseAuthorizer.id } } }

    api.route('GET /api/books', books.arn, authed)
    api.route('POST /api/books', books.arn, authed)
    api.route('PUT /api/books/{id}', books.arn, authed)
    api.route('DELETE /api/books/{id}', books.arn, authed)
    api.route('GET /api/translations/{bookId}', translations.arn, authed)
    api.route('POST /api/translations', translations.arn, authed)

    return {
      api: api.url,
      bucket: bucket.name,
    }
  },
})
