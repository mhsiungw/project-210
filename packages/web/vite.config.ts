import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')

export default defineConfig({
  envDir: resolve(root, 'env'),
  resolve: {
    alias: {
      '@app/shared': resolve(__dirname, '../shared/src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [{ src: resolve(root, 'node_modules/pdfjs-dist/wasm/*.wasm'), dest: 'wasm' }],
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
})
