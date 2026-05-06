import { ipcMain, IpcMainInvokeEvent } from 'electron'
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3'
import { IPC, IpcApi } from '@shared/ipcChannels'
import { prisma } from '@main/db'
import { Book } from '@prisma/client'

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
  uploadToS3: async (
    _event,
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ): Promise<Awaited<ReturnType<IpcApi['uploadToS3']>>> => {
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

    return { key, previewKey }
  },
  getS3Previews: async (): Promise<string[]> => {
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
  fetchPDF: async (_, url: string): Promise<ArrayBuffer> => {
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    return buf
  },
  fetchBooks: async (): Promise<Book[]> => {
    const books = await prisma.book.findMany()
    return books
  },
}

export function registerListeners(): void {
  ipcMain.handle(IPC.S3_UPLOAD, listeners.uploadToS3)

  ipcMain.handle(IPC.S3_GET_PREVIEWS, listeners.getS3Previews)

  ipcMain.handle(IPC.FETCH_PDF, listeners.fetchPDF)

  ipcMain.handle(IPC.FETCH_BOOKS, listeners.fetchBooks)
}
