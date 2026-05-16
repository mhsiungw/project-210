import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PutObjectCommand,
  DeleteObjectsCommand,
  type PutObjectCommandInput,
  type DeleteObjectsCommandInput,
} from '@aws-sdk/client-s3'
import type { Book } from '@app/db'
import { createTestApp, type TestApp } from '../../test-utils/createTestApp.js'

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  total_pages: 10,
  current_page: 3,
  file_name: 'foo.pdf',
  user_id: 'test-user-id',
  s3_key: 'uploads/123-foo.pdf',
  s3_preview_key: 'uploads/123-foo-preview.png',
  ...overrides,
})

describe('GET /api/books', () => {
  let ctx: TestApp
  beforeEach(() => {
    ctx = createTestApp()
  })

  it('returns books for the authenticated user with the expected shape', async () => {
    const book = makeBook()
    ctx.prisma.book.findMany.mockResolvedValue([book])

    const res = await ctx.app.request('/api/books')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([
      {
        id: 'book-1',
        fileName: 'foo.pdf',
        s3Key: 'uploads/123-foo.pdf',
        s3PreviewKey: 'uploads/123-foo-preview.png',
        s3KeyUrl: 'https://cdn.test/uploads/123-foo.pdf',
        s3PreviewKeyUrl: 'https://cdn.test/uploads/123-foo-preview.png',
        totalPages: 10,
        currentPage: 3,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    expect(ctx.prisma.book.findMany).toHaveBeenCalledWith({
      where: { user_id: 'test-user-id' },
    })
  })
})

describe('POST /api/books', () => {
  let ctx: TestApp
  beforeEach(() => {
    ctx = createTestApp()
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
  })

  it('uploads pdf and preview to S3 with correct keys/content-types and creates the row', async () => {
    ctx.s3Mock.on(PutObjectCommand).resolves({})
    ctx.prisma.book.create.mockResolvedValue(makeBook())

    const form = new FormData()
    form.append(
      'pdf',
      new File([new Uint8Array([1, 2, 3])], 'foo.pdf', { type: 'application/pdf' })
    )
    form.append('preview', new File([new Uint8Array([4, 5])], 'foo.png', { type: 'image/png' }))
    form.append('fileName', 'foo.pdf')

    const res = await ctx.app.request('/api/books', { method: 'POST', body: form })

    expect(res.status).toBe(201)

    const puts = ctx.s3Mock.commandCalls(PutObjectCommand)
    expect(puts).toHaveLength(2)
    const inputs = puts.map(c => c.args[0].input as PutObjectCommandInput)

    const pdf = inputs.find(i => i.ContentType === 'application/pdf')!
    expect(pdf.Bucket).toBe('test-bucket')
    expect(pdf.Key).toBe('uploads/1700000000000-foo.pdf')

    const preview = inputs.find(i => i.ContentType === 'image/png')!
    expect(preview.Bucket).toBe('test-bucket')
    expect(preview.Key).toBe('uploads/1700000000000-foo-preview.png')

    expect(ctx.prisma.book.create).toHaveBeenCalledWith({
      data: {
        file_name: 'foo.pdf',
        s3_key: 'uploads/1700000000000-foo.pdf',
        s3_preview_key: 'uploads/1700000000000-foo-preview.png',
        user_id: 'test-user-id',
      },
    })
  })
})

describe('PUT /api/books/:id', () => {
  let ctx: TestApp
  beforeEach(() => {
    ctx = createTestApp()
  })

  it('returns 404 when the book is not found for this user', async () => {
    ctx.prisma.book.findFirst.mockResolvedValue(null)

    const res = await ctx.app.request('/api/books/book-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'book-1', currentPage: 5 }),
    })

    expect(res.status).toBe(404)
    expect(ctx.prisma.book.findFirst).toHaveBeenCalledWith({
      where: { id: 'book-1', user_id: 'test-user-id' },
    })
    expect(ctx.prisma.book.update).not.toHaveBeenCalled()
  })

  it('updates current_page and returns the mapped DTO', async () => {
    const existing = makeBook({ current_page: 1 })
    ctx.prisma.book.findFirst.mockResolvedValue(existing)
    ctx.prisma.book.update.mockResolvedValue(makeBook({ current_page: 7 }))

    const res = await ctx.app.request('/api/books/book-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'book-1', currentPage: 7 }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { currentPage: number }
    expect(body.currentPage).toBe(7)
    expect(ctx.prisma.book.update).toHaveBeenCalledWith({
      where: { id: 'book-1' },
      data: { current_page: 7 },
    })
  })
})

describe('DELETE /api/books/:id', () => {
  let ctx: TestApp
  beforeEach(() => {
    ctx = createTestApp()
  })

  it('returns 404 when the book is not found for this user', async () => {
    ctx.prisma.book.findFirst.mockResolvedValue(null)

    const res = await ctx.app.request('/api/books/book-1', { method: 'DELETE' })

    expect(res.status).toBe(404)
    expect(ctx.prisma.translation.deleteMany).not.toHaveBeenCalled()
    expect(ctx.prisma.book.delete).not.toHaveBeenCalled()
    expect(ctx.s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(0)
  })

  it('deletes translations, then the book, then S3 objects (ordering pinned)', async () => {
    const book = makeBook()
    ctx.prisma.book.findFirst.mockResolvedValue(book)

    const order: string[] = []
    ctx.prisma.translation.deleteMany.mockImplementation((async (): Promise<{ count: number }> => {
      order.push('translations')
      return { count: 2 }
    }) as never)
    ctx.prisma.book.delete.mockImplementation((async (): Promise<Book> => {
      order.push('book')
      return book
    }) as never)
    ctx.s3Mock.on(DeleteObjectsCommand).callsFake(() => {
      order.push('s3')
      return {}
    })

    const res = await ctx.app.request('/api/books/book-1', { method: 'DELETE' })

    expect(res.status).toBe(204)
    expect(order).toEqual(['translations', 'book', 's3'])

    expect(ctx.prisma.translation.deleteMany).toHaveBeenCalledWith({
      where: { book_id: 'book-1' },
    })
    expect(ctx.prisma.book.delete).toHaveBeenCalledWith({ where: { id: 'book-1' } })

    const deletes = ctx.s3Mock.commandCalls(DeleteObjectsCommand)
    expect(deletes).toHaveLength(1)
    const input = deletes[0].args[0].input as DeleteObjectsCommandInput
    expect(input.Bucket).toBe('test-bucket')
    expect(input.Delete?.Objects).toEqual([
      { Key: 'uploads/123-foo.pdf' },
      { Key: 'uploads/123-foo-preview.png' },
    ])
  })
})
