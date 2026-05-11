import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'main',
    environment: 'node',
    include: ['src/main/**/*.{test,spec}.ts', 'src/preload/**/*.{test,spec}.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@main': resolve('src/main'),
      '@preload': resolve('src/preload'),
      '@shared': resolve('src/shared'),
    },
  },
})
