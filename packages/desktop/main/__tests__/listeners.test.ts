import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  app: { getPath: vi.fn(), getVersion: vi.fn() },
}))

vi.mock('@sentry/electron/main', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = vi.fn()
  },
  PutObjectCommand: vi.fn(),
  DeleteObjectsCommand: vi.fn(),
}))

vi.mock('../db', () => ({
  prisma: {
    book: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    translation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}))

import { ipcMain } from 'electron'
import { registerListeners } from '../ipc'
import { IPC } from '../../ipcChannels'

describe('registerListeners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers all expected IPC handlers', () => {
    registerListeners()

    const handleMock = vi.mocked(ipcMain.handle)
    const registeredChannels = handleMock.mock.calls.map(([channel]) => channel)

    expect(registeredChannels).toContain(IPC.POST_BOOK)
    expect(registeredChannels).toContain(IPC.GET_BOOKS)
    expect(registeredChannels).toContain(IPC.PUT_BOOK)
    expect(registeredChannels).toContain(IPC.DELETE_BOOK)
    expect(registeredChannels).toContain(IPC.GET_PDF)
    expect(registeredChannels).toContain(IPC.GET_TRANSLATION)
    expect(registeredChannels).toContain(IPC.POST_TRANSLATION)
  })
})
