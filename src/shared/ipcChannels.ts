export const IPC = {
  PING: 'ping',
  S3_UPLOAD: 's3-upload',
  S3_GET_PREVIEWS: 's3-get-previews',
  FETCH_PDF: 'fetch-pdf',
  FETCH_BOOKS: 'fetch-books',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
