import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'main',
    environment: 'node',
    include: ['packages/desktop/main/**/*.{test,spec}.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@main': resolve('packages/desktop/main'),
      '@app/shared': resolve('packages/shared/src'),
    },
  },
})
