import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3'
import { IPC } from '@shared/ipcChannels'

const s3 = new S3Client({
  region: 'us-east-1',
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

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle(IPC.PING, (): string => 'pong')

ipcMain.handle(
  IPC.S3_UPLOAD,
  async (
    _event,
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ): Promise<{ key: string; previewKey: string }> => {
    const base = `uploads/${Date.now()}-${fileName}`
    const key = base
    const previewKey = base.replace(/\.pdf$/i, '') + '-preview.png'

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: 'project-210',
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: 'application/pdf',
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: 'project-210',
          Key: previewKey,
          Body: Buffer.from(previewBuffer),
          ContentType: 'image/png',
        })
      ),
    ])

    return { key, previewKey }
  }
)

ipcMain.handle(IPC.S3_GET_PREVIEWS, async (): Promise<string[]> => {
  let token: string | undefined
  let response: ListObjectsV2CommandOutput
  const allObjects = []

  console.log(IPC.S3_GET_PREVIEWS)

  do {
    response = await s3.send(
      new ListObjectsV2Command({
        Bucket: 'project-210',
        ContinuationToken: token,
      })
    )
    allObjects.push(...(response.Contents ?? []))
    token = response.NextContinuationToken
  } while (response.IsTruncated)
  return allObjects.map(obj => obj.Key!).filter(key => key.endsWith('-preview.png'))
})
