import { defineConfig, env } from 'prisma/config'

// Env vars come from ../../env/ via dotenv-cli (see this package's scripts).
export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
