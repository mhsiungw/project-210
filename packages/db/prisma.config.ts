import { defineConfig, env } from 'prisma/config'

// Env vars come from env/ via dotenv-cli (see root package.json db:* scripts).
// Run from repo root: pnpm db:migrate:dev
export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
