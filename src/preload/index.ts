import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IpcApi } from '@shared/ipcChannels'
import type { Book, Translation } from '@prisma/client'

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
  putBook: (book: Omit<Book, 'created_at'>): Promise<Book> =>
    ipcRenderer.invoke(IPC.PUT_BOOK, book),
  getTranslation: (bookId: string) => ipcRenderer.invoke(IPC.GET_TRANSLATION, bookId),
  postTranslation: (bookId: string, translationText: string, id?: string): Promise<Translation> =>
    ipcRenderer.invoke(IPC.POST_TRANSLATION, bookId, translationText, id),
} satisfies IpcApi)
