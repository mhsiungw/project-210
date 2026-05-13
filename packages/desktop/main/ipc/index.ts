import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import type { Book, Translation } from '@app/db'
import * as Sentry from '@sentry/electron/main'
import { prisma } from '@app/db'
import { IPC, type IpcApi } from '../../ipcChannels'
import type { BookDto, TranslationDto } from '@app/shared/api/types'

// Only the main frame of our renderer is allowed to invoke IPC handlers.
// This prevents injected iframes or cross-origin sub-frames from reaching privileged APIs.
function isMainFrame(event: IpcMainInvokeEvent): boolean {
  return event.senderFrame === event.sender.mainFrame
}

function assertMainFrame(event: IpcMainInvokeEvent): void {
  if (!isMainFrame(event)) {
    throw new Error(`IPC rejected: sender is not the main renderer frame`)
  }
}

const s3 = new S3Client({ region: 'us-east-1' })

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

type IpcHandlers = {
  [K in keyof IpcApi]: (
    event: IpcMainInvokeEvent,
    ...args: Parameters<IpcApi[K]>
  ) => ReturnType<IpcApi[K]>
}

const handlers: IpcHandlers = {
  postBook: async (event, buffer, fileName, previewBuffer) => {
    assertMainFrame(event)
    const base = `uploads/${Date.now()}-${fileName}`
    const key = base
    const previewKey = base.replace(/\.pdf$/i, '') + '-preview.png'

    try {
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
        data: { file_name: fileName, s3_key: key, s3_preview_key: previewKey },
      })
    } catch (err) {
      Sentry.captureException(err, { tags: { channel: IPC.POST_BOOK } })
      throw err
    }
  },

  deleteBook: async (event, bookId) => {
    assertMainFrame(event)
    try {
      const book = await prisma.book.findUnique({ where: { id: bookId } })
      await prisma.translation.deleteMany({ where: { book_id: bookId } })
      await prisma.book.delete({ where: { id: bookId } })
      if (book) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: process.env.S3_BUCKET,
            Delete: { Objects: [{ Key: book.s3_key }, { Key: book.s3_preview_key }] },
          })
        )
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { channel: IPC.DELETE_BOOK } })
      throw err
    }
  },

  getPDF: async (event, url) => {
    assertMainFrame(event)
    try {
      const res = await fetch(url)
      return res.arrayBuffer()
    } catch (err) {
      Sentry.captureException(err, { tags: { channel: IPC.GET_PDF } })
      throw err
    }
  },

  getBooks: async event => {
    assertMainFrame(event)
    try {
      const books = await prisma.book.findMany()
      return books.map(toBookDto)
    } catch (err) {
      Sentry.captureException(err, { tags: { channel: IPC.GET_BOOKS } })
      throw err
    }
  },

  putBook: async (event, book) => {
    assertMainFrame(event)
    try {
      const updated = await prisma.book.update({
        where: { id: book.id },
        data: { current_page: book.currentPage },
      })
      return toBookDto(updated)
    } catch (err) {
      Sentry.captureException(err, { tags: { channel: IPC.PUT_BOOK } })
      throw err
    }
  },

  getTranslation: async (event, bookId) => {
    assertMainFrame(event)
    try {
      const t = await prisma.translation.findFirst({
        where: { book_id: bookId },
        orderBy: { created_at: 'desc' },
      })
      return t ? toTranslationDto(t) : null
    } catch (err) {
      Sentry.captureException(err, { tags: { channel: IPC.GET_TRANSLATION } })
      throw err
    }
  },

  postTranslation: async (event, bookId, text, id) => {
    assertMainFrame(event)
    try {
      const result = id
        ? await prisma.translation.update({ where: { id }, data: { text } })
        : await prisma.translation.create({ data: { book_id: bookId, text } })
      return toTranslationDto(result)
    } catch (err) {
      Sentry.captureException(err, { tags: { channel: IPC.POST_TRANSLATION } })
      throw err
    }
  },
}

export function registerListeners(): void {
  ipcMain.handle(IPC.GET_BOOKS, handlers.getBooks)
  ipcMain.handle(IPC.POST_BOOK, handlers.postBook)
  ipcMain.handle(IPC.PUT_BOOK, handlers.putBook)
  ipcMain.handle(IPC.DELETE_BOOK, handlers.deleteBook)
  ipcMain.handle(IPC.GET_PDF, handlers.getPDF)
  ipcMain.handle(IPC.GET_TRANSLATION, handlers.getTranslation)
  ipcMain.handle(IPC.POST_TRANSLATION, handlers.postTranslation)
}
