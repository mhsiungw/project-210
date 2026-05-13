import type { Transport } from './transport'
import type { BookDto, TranslationDto } from './types'

export class ApiClient {
  constructor(private readonly transport: Transport) {}

  getBooks(): Promise<BookDto[]> {
    return this.transport.invoke<BookDto[]>('getBooks')
  }

  postBook(buffer: ArrayBuffer, fileName: string, previewBuffer: ArrayBuffer): Promise<void> {
    return this.transport.invoke<void>('postBook', buffer, fileName, previewBuffer)
  }

  putBook(book: BookDto): Promise<BookDto> {
    return this.transport.invoke<BookDto>('putBook', book)
  }

  deleteBook(bookId: string): Promise<void> {
    return this.transport.invoke<void>('deleteBook', bookId)
  }

  getPDF(url: string): Promise<ArrayBuffer> {
    return this.transport.invoke<ArrayBuffer>('getPDF', url)
  }

  getTranslation(bookId: string): Promise<TranslationDto | null> {
    return this.transport.invoke<TranslationDto | null>('getTranslation', bookId)
  }

  postTranslation(bookId: string, text: string, id?: string): Promise<TranslationDto> {
    return this.transport.invoke<TranslationDto>('postTranslation', bookId, text, id)
  }
}
