import type { BookDto, TranslationDto } from './types'

export const IPC = {
  POST_BOOK: 'POST_BOOK',
  GET_BOOKS: 'GET_BOOKS',
  PUT_BOOK: 'PUT_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',

  GET_PDF: 'GET_PDF',

  GET_TRANSLATION: 'GET_TRANSLATION',
  POST_TRANSLATION: 'POST_TRANSLATION',
} as const

export interface IpcApi {
  postBook: (buffer: ArrayBuffer, fileName: string, previewBuffer: ArrayBuffer) => Promise<void>
  getBooks: () => Promise<BookDto[]>
  putBook: (book: BookDto) => Promise<BookDto>
  deleteBook(bookId: string): Promise<void>
  getPDF: (url: string) => Promise<ArrayBuffer>
  getTranslation: (bookId: string) => Promise<TranslationDto | null>
  postTranslation: (bookId: string, text: string, id?: string) => Promise<TranslationDto>
}

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
