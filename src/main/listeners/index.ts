import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { IPC, IpcApi } from '@shared/ipcChannels'
import { prisma } from '@main/db'
import { Book, Translation } from '@prisma/client'
import type { BookDto, TranslationDto } from '@shared/types'

const s3 = new S3Client({
  region: 'us-east-1',
})

type IpcHandlers = {
  [K in keyof IpcApi]: (
    event: IpcMainInvokeEvent,
    ...args: Parameters<IpcApi[K]>
  ) => ReturnType<IpcApi[K]>
}

function toBookDto(book: Book): BookDto {
  return {
    id: book.id,
    fileName: book.file_name,
    s3Key: book.s3_key,
    s3PreviewKey: book.s3_preview_key,
    s3KeyUrl: `${process.env.CLOUDFRONT_BASE_URL}/${book.s3_key}`,
    s3PreviewKeyUrl: `${process.env.CLOUDFRONT_BASE_URL}/${book.s3_preview_key}`,
    totalPages: book.total_pages ?? 0,
    currentPage: book.current_page ?? 0,
    createdAt: book.created_at.toISOString(),
  }
}

function toTranslationDto(t: Translation): TranslationDto {
  return {
    id: t.id,
    bookId: t?.book_id || '',
    text: t?.text || '',
    createdAt: t.created_at.toISOString(),
  }
}

const listeners: IpcHandlers = {
  postBook: async (_event, buffer, fileName, previewBuffer): Promise<void> => {
    const base = `uploads/${Date.now()}-${fileName}`
    const key = base
    const previewKey = base.replace(/\.pdf$/i, '') + '-preview.png'

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: 'application/pdf',
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: previewKey,
          Body: Buffer.from(previewBuffer),
          ContentType: 'image/png',
        })
      ),
    ])

    await prisma.book.create({
      data: {
        file_name: fileName,
        s3_key: key,
        s3_preview_key: previewKey,
      },
    })
  },
  deleteBook: async (_, bookId) => {
    const book = await prisma.book.findUnique({ where: { id: bookId } })

    await prisma.translation.deleteMany({ where: { book_id: bookId } })
    await prisma.book.delete({ where: { id: bookId } })

    if (book) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET,
          Delete: {
            Objects: [{ Key: book.s3_key }, { Key: book.s3_preview_key }],
          },
        })
      )
    }
  },
  getPDF: async (_, url): Promise<ArrayBuffer> => {
    const res = await fetch(url)
    return res.arrayBuffer()
  },
  getBooks: async (): Promise<BookDto[]> => {
    const books = await prisma.book.findMany()
    return books.map(toBookDto)
  },
  putBook: async (_event, book): Promise<BookDto> => {
    const updated = await prisma.book.update({
      where: { id: book.id },
      data: {
        current_page: book.currentPage,
      },
    })
    return toBookDto(updated)
  },
  getTranslation: async (_event, bookId): Promise<TranslationDto | null> => {
    const t = await prisma.translation.findFirst({
      where: { book_id: bookId },
      orderBy: { created_at: 'desc' },
    })
    return t ? toTranslationDto(t) : null
  },
  postTranslation: async (_event, bookId, text, id): Promise<TranslationDto> => {
    const result = id
      ? await prisma.translation.update({ where: { id }, data: { text } })
      : await prisma.translation.create({ data: { book_id: bookId, text } })
    return toTranslationDto(result)
  },
}

export function registerListeners(): void {
  ipcMain.handle(IPC.POST_BOOK, listeners.postBook)
  ipcMain.handle(IPC.GET_PDF, listeners.getPDF)
  ipcMain.handle(IPC.GET_BOOKS, listeners.getBooks)
  ipcMain.handle(IPC.DELETE_BOOK, listeners.deleteBook)
  ipcMain.handle(IPC.PUT_BOOK, listeners.putBook)
  ipcMain.handle(IPC.GET_TRANSLATION, listeners.getTranslation)
  ipcMain.handle(IPC.POST_TRANSLATION, listeners.postTranslation)
}
