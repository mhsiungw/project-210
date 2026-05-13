import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    name: 'main',
    environment: 'node',
    include: ['main/**/*.{test,spec}.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'main'),
      '@app/shared': resolve(__dirname, '../shared/src'),
    },
  },
})
