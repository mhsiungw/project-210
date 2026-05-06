import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IpcApi } from '@shared/ipcChannels'
import type { Book } from '@prisma/client'

contextBridge.exposeInMainWorld('api', {
  uploadToS3: (
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ): Promise<{ key: string; previewKey: string }> =>
    ipcRenderer.invoke(IPC.S3_UPLOAD, buffer, fileName, previewBuffer),
  getS3Previews: (): Promise<string[]> => ipcRenderer.invoke(IPC.S3_GET_PREVIEWS),
  fetchPDF: (url: string): Promise<ArrayBuffer> => ipcRenderer.invoke(IPC.FETCH_PDF, url),
  fetchBooks: (): Promise<Book[]> => ipcRenderer.invoke(IPC.FETCH_BOOKS),
} satisfies IpcApi)
