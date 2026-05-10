import { contextBridge, ipcRenderer } from 'electron'
import { IPC, IpcApi } from '@shared/ipcChannels'

contextBridge.exposeInMainWorld('api', {
  postBook: (buffer, fileName, previewBuffer) =>
    ipcRenderer.invoke(IPC.POST_BOOK, buffer, fileName, previewBuffer),
  getPDF: url => ipcRenderer.invoke(IPC.GET_PDF, url),
  getBooks: () => ipcRenderer.invoke(IPC.GET_BOOKS),
  putBook: book => ipcRenderer.invoke(IPC.PUT_BOOK, book),
  getTranslation: bookId => ipcRenderer.invoke(IPC.GET_TRANSLATION, bookId),
  postTranslation: (bookId, translationText, id) =>
    ipcRenderer.invoke(IPC.POST_TRANSLATION, bookId, translationText, id),
} satisfies IpcApi)
