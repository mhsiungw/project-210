import type { Book } from '@prisma/client'

export const IPC = {
  PING: 'ping',
  S3_UPLOAD: 's3-upload',
  S3_GET_PREVIEWS: 's3-get-previews',
  FETCH_PDF: 'fetch-pdf',
  FETCH_BOOKS: 'fetch-books',
} as const

export interface IpcApi {
  uploadToS3: (
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ) => Promise<{ key: string; previewKey: string }>
  getS3Previews: () => Promise<string[]>
  fetchPDF: (url: string) => Promise<ArrayBuffer>
  fetchBooks: () => Promise<Book[]>
}

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
