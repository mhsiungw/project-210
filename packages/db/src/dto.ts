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

/** A single rectangle, normalized 0..1 against the unscaled page viewport. */
export interface HighlightRect {
  x: number
  y: number
  w: number
  h: number
}

export interface HighlightDto {
  id: string
  bookId: string
  page: number
  rects: HighlightRect[]
  text: string
  note?: string
  color?: string
  createdAt?: string
}
