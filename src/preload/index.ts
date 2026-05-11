import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IpcApi } from '@shared/ipcChannels'

contextBridge.exposeInMainWorld('api', {
  postBook: (buffer, fileName, previewBuffer) =>
    ipcRenderer.invoke(IPC.POST_BOOK, buffer, fileName, previewBuffer),
  getBooks: () => ipcRenderer.invoke(IPC.GET_BOOKS),
  putBook: book => ipcRenderer.invoke(IPC.PUT_BOOK, book),
  deleteBook: bookId => ipcRenderer.invoke(IPC.DELETE_BOOK, bookId),
  getPDF: url => ipcRenderer.invoke(IPC.GET_PDF, url),
  getTranslation: bookId => ipcRenderer.invoke(IPC.GET_TRANSLATION, bookId),
  postTranslation: (bookId, translationText, id) =>
    ipcRenderer.invoke(IPC.POST_TRANSLATION, bookId, translationText, id),
} satisfies IpcApi)
