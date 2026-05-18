import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')
const _require = createRequire(import.meta.url)
const pdfjsDist = dirname(_require.resolve('pdfjs-dist/package.json'))

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
      targets: [{ src: `${pdfjsDist}/wasm/*.wasm`, dest: 'wasm' }],
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
})
