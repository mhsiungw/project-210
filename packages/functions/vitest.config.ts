import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    name: 'functions',
    environment: 'node',
    include: ['api/**/*.{test,spec}.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@app/db': resolve(__dirname, '../db/src'),
      '@app/shared': resolve(__dirname, '../shared/src'),
    },
  },
})
