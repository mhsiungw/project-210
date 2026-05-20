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

    const cloudfrontPrivateKey = new sst.Linkable('CLOUDFRONT_PRIVATE_KEY', {
      properties: { value: process.env.CLOUDFRONT_PRIVATE_KEY ?? '' },
    })
    const cloudfrontKeyPairId = new sst.Linkable('CLOUDFRONT_KEY_PAIR_ID', {
      properties: { value: process.env.CLOUDFRONT_KEY_PAIR_ID ?? '' },
    })

    const bucket = sst.aws.Bucket.get('Bucket', 'project-210')

    const books = new sst.aws.Function('Books', {
      handler: 'functions/books.handler',
      link: [cloudfrontPrivateKey, cloudfrontKeyPairId, bucket],
      environment: {
        S3_BUCKET_NAME: bucket.name,
        DATABASE_URL: process.env.DATABASE_URL ?? '',
      },
      url: true,
    })

    const translations = new sst.aws.Function('Translations', {
      handler: 'functions/translations.handler',
      link: [cloudfrontPrivateKey, cloudfrontKeyPairId, bucket],
      environment: {
        S3_BUCKET_NAME: bucket.name,
        DATABASE_URL: process.env.DATABASE_URL ?? '',
      },
      url: true,
    })

    return {
      books: books.url,
      translations: translations.url,
      bucket: bucket.name,
    }
  },
})
