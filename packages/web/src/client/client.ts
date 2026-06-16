import type { Transport } from './transport'
import type { BookDto, TranslationDto, HighlightDto, HighlightRect } from '@app/db/dto'

export interface NewHighlight {
  bookId: string
  page: number
  rects: HighlightRect[]
  text: string
  note?: string
  color?: string
}

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

  postTranslation(bookId: string, text: string): Promise<TranslationDto> {
    return this.transport.invoke<TranslationDto>('postTranslation', bookId, text)
  }

  getHighlights(bookId: string): Promise<HighlightDto[]> {
    return this.transport.invoke<HighlightDto[]>('getHighlights', bookId)
  }

  postHighlight(input: NewHighlight): Promise<HighlightDto> {
    return this.transport.invoke<HighlightDto>('postHighlight', input)
  }

  putHighlightNote(id: string, note: string | null): Promise<HighlightDto> {
    return this.transport.invoke<HighlightDto>('putHighlightNote', id, note)
  }

  deleteHighlight(id: string): Promise<void> {
    return this.transport.invoke<void>('deleteHighlight', id)
  }
}
