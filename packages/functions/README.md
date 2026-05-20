# @app/functions

SST v3 (ion) Lambda package with Prisma + PostgreSQL, S3 presigned URLs, and CloudFront signed URLs.

## Setup

```bash
pnpm install
pnpm generate
```

## Environment

`sst.config.ts` uses `dotenv` to load `env/.env.<stage>` from the repo root
into `process.env` at the top of `run()`, keyed off `$app.stage`. Required
keys:

```bash
# Postgres connection string used by the Prisma PG driver adapter
DATABASE_URL=postgres://user:pass@host:5432/db

# CloudFront trusted-signer private key, PEM contents base64-encoded
CLOUDFRONT_PRIVATE_KEY=<base64 of cloudfront-private-key.pem>

# CloudFront key pair ID
CLOUDFRONT_KEY_PAIR_ID=APKAEXAMPLE...
```

Generate the base64 value with `base64 < ../../env/private_key.pem`.

## Deploy

```bash
pnpm deploy:staging    # loads env/.env.staging,    deploys --stage staging
pnpm deploy:prod       # loads env/.env.production, deploys --stage production
```

For local iteration with live Lambda (loads `env/.env.<your-username>`):

```bash
pnpm dev
```

## Prisma binary targets

`prisma/schema.prisma` declares:

```prisma
binaryTargets = ["native", "rhel-openssl-3.0.x"]
```

AWS Lambda's Node.js 22 runtime ships on Amazon Linux 2023, which links against
OpenSSL 3. Prisma needs the `rhel-openssl-3.0.x` query engine binary to be
bundled alongside the function or it will fail at cold start with a
`PRISMA_QUERY_ENGINE_LIBRARY` load error. `native` is kept so `prisma generate`
also produces a binary that runs on your local machine.

The `sst.config.ts` uses `nodejs.install: ["@prisma/client", "prisma"]` plus
`copyFiles` to ensure both the Prisma client + engine and `schema.prisma` end
up inside the deployed Lambda bundle.
