import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const _require = createRequire(import.meta.url)
const pdfjsDist = dirname(_require.resolve('pdfjs-dist/package.json'))
const db = resolve(__dirname, '../db/src')
const shared = resolve(__dirname, '../shared/src')
const desktop = __dirname
const envDir = resolve(__dirname, '../../env')

export default defineConfig({
  main: {
    envDir,
    build: {
      lib: { entry: resolve(desktop, 'main/index.ts') },
      watch: {},
      externalizeDeps: { exclude: ['@app/db', '@app/shared'] },
      rollupOptions: {
        external: [/^@prisma\//],
      },
    },
    resolve: {
      alias: {
        '@main': resolve(desktop, 'main'),
        '@app/db': db,
        '@app/shared': shared,
      },
    },
    plugins: [
      viteStaticCopy({
        environment: 'ssr',
        targets: [{ src: `${shared}/assets/logo.png`, dest: '.', rename: { stripBase: true } }],
      }),
    ],
  },
  renderer: {
    envDir,
    root: resolve(desktop, 'renderer'),
    build: {
      rollupOptions: {
        input: resolve(desktop, 'renderer/index.html'),
      },
    },
    resolve: {
      alias: {
        '@renderer': resolve(desktop, 'renderer/src'),
        '@app/shared': shared,
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [{ src: `${pdfjsDist}/wasm/*.wasm`, dest: 'wasm' }],
      }),
    ],
  },
})
