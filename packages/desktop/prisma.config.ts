import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Run from repo root: prisma migrate dev --config packages/desktop/prisma.config.ts
// Paths below are relative to the repo root (Prisma resolves from CWD).
export default defineConfig({
  schema: 'packages/desktop/prisma/schema.prisma',
  migrations: {
    path: 'packages/desktop/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
