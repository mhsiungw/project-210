# @app/functions

SST v3 (ion) Lambda package with Prisma + PostgreSQL, S3 presigned URLs, and CloudFront signed URLs.

## Setup

```bash
pnpm install              # postinstall runs `pnpm -F @app/db generate`
```

If you change `packages/db/prisma/schema.prisma`, re-run `pnpm db:generate` from
the repo root.

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

## Prisma

The schema lives in `@app/db` ([packages/db/prisma/schema.prisma](../db/prisma/schema.prisma))
and uses the `prisma-client` generator (Prisma 7) together with the
`@prisma/adapter-pg` driver adapter. Queries run through a pure-JS `pg`
connection, so there is **no Rust query engine binary** to ship — SST's
esbuild bundle resolves the generated client from
`packages/db/generated/client/` and packs everything needed into the Lambda
zip. No `binaryTargets`, `nodejs.install`, or `copyFiles` configuration is
required.
