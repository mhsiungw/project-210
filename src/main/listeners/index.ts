import { ipcMain, IpcMainInvokeEvent } from 'electron'
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3'
import { IPC, IpcApi } from '@shared/ipcChannels'
import { prisma } from '@main/db'
import { Book, Translation } from '@prisma/client'

const s3 = new S3Client({
  region: 'us-east-1',
})

type IpcHandlers = {
  [K in keyof IpcApi]: (
    event: IpcMainInvokeEvent,
    ...args: Parameters<IpcApi[K]>
  ) => ReturnType<IpcApi[K]>
}

const listeners: IpcHandlers = {
  postBook: async (
    _event,
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ): Promise<{ key: string; previewKey: string }> => {
    const base = `uploads/${Date.now()}-${fileName}`
    const key = base
    const previewKey = base.replace(/\.pdf$/i, '') + '-preview.png'

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: 'project-210',
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: 'application/pdf',
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: 'project-210',
          Key: previewKey,
          Body: Buffer.from(previewBuffer),
          ContentType: 'image/png',
        })
      ),
    ])

    await prisma.book.create({
      data: {
        file_name: fileName,
        url: `https://d11m54w1vy523e.cloudfront.net/${key}`,
        preview_url: `https://d11m54w1vy523e.cloudfront.net/${previewKey}`,
      },
    })

    return { key, previewKey }
  },
  getBookPreviews: async (): Promise<string[]> => {
    let token: string | undefined
    let response: ListObjectsV2CommandOutput
    const allObjects = []

    do {
      response = await s3.send(
        new ListObjectsV2Command({
          Bucket: 'project-210',
          ContinuationToken: token,
        })
      )
      allObjects.push(...(response.Contents ?? []))
      token = response.NextContinuationToken
    } while (response.IsTruncated)
    return allObjects.map(obj => obj.Key!).filter(key => key.endsWith('-preview.png'))
  },
  getPDF: async (_, url: string): Promise<ArrayBuffer> => {
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    return buf
  },
  getBooks: async (): Promise<Book[]> => {
    const books = await prisma.book.findMany()
    console.log(books)
    return books
  },
  putBook: async (_event, book: Omit<Book, 'created_at'>): Promise<Book> => {
    return prisma.book.update({
      where: { id: book.id },
      data: {
        file_name: book.file_name,
        url: book.url,
        preview_url: book.preview_url,
        total_pages: book.total_pages,
        current_page: book.current_page,
      },
    })
  },
  getTranslation: async (_event, bookId: string): Promise<Translation> => {
    const translation = await prisma.translation.findFirst({
      where: { book_id: bookId },
      orderBy: { created_at: 'desc' },
    })
    if (!translation) throw new Error(`No translation found for book ${bookId}`)
    return translation
  },
  postTranslation: async (
    _event,
    bookId: string,
    translationText: string,
    id?: string
  ): Promise<Translation> => {
    if (id) {
      return prisma.translation.update({
        where: { id },
        data: { text: translationText },
      })
    }
    return prisma.translation.create({
      data: { book_id: bookId, text: translationText },
    })
  },
}

export function registerListeners(): void {
  ipcMain.handle(IPC.POST_BOOK, listeners.postBook)

  ipcMain.handle(IPC.GET_BOOK_PREVIEWS, listeners.getBookPreviews)

  ipcMain.handle(IPC.GET_PDF, listeners.getPDF)

  ipcMain.handle(IPC.GET_BOOKS, listeners.getBooks)

  ipcMain.handle(IPC.PUT_BOOK, listeners.putBook)

  ipcMain.handle(IPC.GET_TRANSLATION, listeners.getTranslation)
  ipcMain.handle(IPC.POST_TRANSLATION, listeners.postTranslation)
}
