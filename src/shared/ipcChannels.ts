import type { Book } from '@prisma/client'

export const IPC = {
  POST_BOOK: 'POST_BOOK',
  GET_BOOK_PREVIEWS: 'GET_BOOK_PREVIEWS',
  GET_PDF: 'GET_PDF',
  GET_BOOKS: 'GET_BOOKS',
} as const

export interface IpcApi {
  postBook: (
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ) => Promise<{ key: string; previewKey: string }>
  getBookPreviews: () => Promise<string[]>
  getPDF: (url: string) => Promise<ArrayBuffer>
  getBooks: () => Promise<Book[]>
}

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
