/// <reference types="vite/client" />

import type { BookDto, TranslationDto } from '@app/shared/api/types'

declare global {
  interface Window {
    api: {
      postBook(buffer: ArrayBuffer, fileName: string, previewBuffer: ArrayBuffer): Promise<void>
      getBooks(): Promise<BookDto[]>
      putBook(book: BookDto): Promise<BookDto>
      deleteBook(bookId: string): Promise<void>
      getPDF(url: string): Promise<ArrayBuffer>
      getTranslation(bookId: string): Promise<TranslationDto | null>
      postTranslation(bookId: string, text: string, id?: string): Promise<TranslationDto>
    }
  }
}
