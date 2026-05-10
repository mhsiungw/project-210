export interface BookDto {
  id: string
  fileName: string
  url: string
  previewUrl: string
  totalPages: number
  currentPage: number
  createdAt?: string
}

export interface TranslationDto {
  id: string
  bookId: string
  text: string
  createdAt?: string
}
