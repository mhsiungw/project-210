/// <reference types="node" />
import { defineConfig } from 'prisma/config'

// Env vars come from ../../env/ via dotenv-cli (see this package's scripts).
// `prisma generate` doesn't need a real URL, so fall back to '' to keep
// config-load from throwing in CI/Vercel where env files don't exist.
// `prisma migrate` will still fail loudly when DIRECT_URL is missing.
export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
})
