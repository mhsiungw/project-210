import { app, BrowserWindow } from 'electron'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '@app/db'
import * as Sentry from '@sentry/electron/main'

const __dirname = dirname(fileURLToPath(import.meta.url))

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  enableLogs: true,
  enabled: process.env.VITE_ENVIRONMENT === 'production',
})

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, 'logo.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.on('ready-to-show', () => win.show())

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  app.dock?.setIcon(join(__dirname, 'logo.png'))
  if (process.env.NODE_ENV === 'development') {
    try {
      const { installExtension, REDUX_DEVTOOLS } = await import('electron-devtools-installer')
      await installExtension(REDUX_DEVTOOLS)
    } catch {
      // Extension install fails on some Electron/MV3 combos — app works without it
    }
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  createWindow()
})

app.on('before-quit', async () => {
  await prisma.$disconnect()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
