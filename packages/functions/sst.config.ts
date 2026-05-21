// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

const APP_NAME = 'project-210'

export default $config({
  app(input) {
    return {
      name: APP_NAME,
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    }
  },
  async run() {
    const { config: loadEnv } = await import('dotenv')
    const tls = await import('@pulumi/tls')
    loadEnv({ path: `../../env/.env.${$app.stage}` })

    const supabaseUrl = process.env.SUPABASE_URL
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')

    const webOrigins = process.env.WEB_ORIGIN
    if (!webOrigins) throw new Error('Missing WEB_ORIGIN')

    const webOriginsForCors =
      $app.stage === 'production'
        ? [webOrigins]
        : [webOrigins, 'http://localhost:5173', 'http://localhost:5174']

    // policy: allow CloudFront service principal to read objects. enforceHttps is
    // handled by SST's default DenyHTTP statement. The AWS:SourceArn condition is
    // intentionally omitted to avoid a cyclic dependency (bucket ↔ distribution).
    const bucket = new sst.aws.Bucket('Bucket', {
      policy: [
        {
          effect: 'allow',
          principals: [{ type: 'service', identifiers: ['cloudfront.amazonaws.com'] }],
          actions: ['s3:GetObject'],
          paths: ['*'],
        },
      ],
    })

    const cfKeyPair = new tls.PrivateKey('CfKeyPair', { algorithm: 'RSA', rsaBits: 2048 })

    const cfPublicKey = new aws.cloudfront.PublicKey('CfPublicKey', {
      name: `${APP_NAME}-${$app.stage}-key`,
      encodedKey: cfKeyPair.publicKeyPem,
    })
    const cfKeyGroup = new aws.cloudfront.KeyGroup('CfKeyGroup', {
      name: `${APP_NAME}-${$app.stage}-keygroup`,
      items: [cfPublicKey.id],
    })

    // Origin Access Control (sigv4) lets CloudFront authenticate to S3 without OAI
    const oac = new aws.cloudfront.OriginAccessControl('Oac', {
      name: `${APP_NAME}-${$app.stage}-oac`,
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    })

    const originId = 'S3Origin'

    const distribution = new aws.cloudfront.Distribution('Distribution', {
      enabled: true,
      httpVersion: 'http2',
      isIpv6Enabled: true,
      priceClass: 'PriceClass_All',
      origins: [
        {
          originId,
          domainName: bucket.nodes.bucket.bucketRegionalDomainName,
          originAccessControlId: oac.id,
          // empty string required when using OAC instead of legacy OAI
          s3OriginConfig: { originAccessIdentity: '' },
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: originId,
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        trustedKeyGroups: [cfKeyGroup.id],
        // AWS managed CachingOptimized policy
        cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
        compress: true,
      },
      restrictions: {
        geoRestriction: { restrictionType: 'none' },
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
    })

    const cloudfrontPrivateKey = new sst.Linkable('CLOUDFRONT_PRIVATE_KEY', {
      properties: { value: cfKeyPair.privateKeyPem },
    })

    const cloudfrontKeyPairId = new sst.Linkable('CLOUDFRONT_KEY_PAIR_ID', {
      properties: { value: cfPublicKey.id },
    })

    const books = new sst.aws.Function('Books', {
      handler: 'functions/books.handler',
      runtime: 'nodejs22.x',
      link: [cloudfrontPrivateKey, cloudfrontKeyPairId, bucket],
      environment: {
        S3_BUCKET_NAME: bucket.name,
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        CLOUDFRONT_BASE_URL: $interpolate`https://${distribution.domainName}`,
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
        allowOrigins: webOriginsForCors,
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
      cloudfront: $interpolate`https://${distribution.domainName}`,
    }
  },
})
