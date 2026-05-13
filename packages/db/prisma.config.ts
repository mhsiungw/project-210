import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Run from repo root: prisma migrate dev --config packages/db/prisma.config.ts
export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
