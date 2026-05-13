import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'renderer',
    environment: 'happy-dom',
    include: ['packages/shared/src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@app/shared': resolve('packages/shared/src'),
    },
  },
})
