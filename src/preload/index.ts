import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IpcApi } from '@shared/ipcChannels'
import type { Book } from '@prisma/client'

contextBridge.exposeInMainWorld('api', {
  postBook: (
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ): Promise<{ key: string; previewKey: string }> =>
    ipcRenderer.invoke(IPC.POST_BOOK, buffer, fileName, previewBuffer),
  getBookPreviews: (): Promise<string[]> => ipcRenderer.invoke(IPC.GET_BOOK_PREVIEWS),
  getPDF: (url: string): Promise<ArrayBuffer> => ipcRenderer.invoke(IPC.GET_PDF, url),
  getBooks: (): Promise<Book[]> => ipcRenderer.invoke(IPC.GET_BOOKS),
} satisfies IpcApi)
