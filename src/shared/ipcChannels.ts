import type { Book, Translation } from '@prisma/client'

export const IPC = {
  POST_BOOK: 'POST_BOOK',
  GET_BOOK_PREVIEWS: 'GET_BOOK_PREVIEWS',
  GET_BOOKS: 'GET_BOOKS',
  PUT_BOOK: 'PUT_BOOK',

  GET_PDF: 'GET_PDF',

  GET_TRANSLATION: 'GET_TRANSLATION',
  POST_TRANSLATION: 'POST_TRANSLATION',
} as const

export interface IpcApi {
  postBook: (
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ) => Promise<{ key: string; previewKey: string }>
  getBookPreviews: () => Promise<string[]>
  getBooks: () => Promise<Book[]>
  putBook: (book: Omit<Book, 'created_at'>) => Promise<Book>
  getPDF: (url: string) => Promise<ArrayBuffer>

  getTranslation: (bookId: string) => Promise<Translation | null>
  postTranslation: (bookId: string, translationText: string, id?: string) => Promise<Translation>
}

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
