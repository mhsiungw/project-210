import 'dotenv/config'
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { prisma } from '@app/db'
import { registerListeners } from './ipc'
import * as Sentry from '@sentry/electron/main'

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
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
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

registerListeners()
