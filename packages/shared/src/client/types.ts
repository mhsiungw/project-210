export interface BookDto {
  id: string
  fileName: string
  s3Key: string
  s3PreviewKey: string
  s3KeyUrl: string
  s3PreviewKeyUrl: string
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
