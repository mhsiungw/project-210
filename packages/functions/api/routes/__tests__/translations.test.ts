import { describe, it, expect, beforeEach } from 'vitest'
import type { Translation } from '@app/db'
import { createTestApp, type TestApp } from '../../test-utils/createTestApp.ts'

const makeTranslation = (overrides: Partial<Translation> = {}): Translation => ({
  id: 'tr-1',
  created_at: new Date('2026-02-01T00:00:00.000Z'),
  book_id: 'book-1',
  text: 'hola',
  ...overrides,
})

describe('GET /api/translations/:bookId', () => {
  let ctx: TestApp
  beforeEach(() => {
    ctx = createTestApp()
  })

  it('returns the most recent translation for the book', async () => {
    ctx.prisma.translation.findFirst.mockResolvedValue(makeTranslation())

    const res = await ctx.app.request('/api/translations/book-1')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'tr-1',
      bookId: 'book-1',
      text: 'hola',
      createdAt: '2026-02-01T00:00:00.000Z',
    })
    expect(ctx.prisma.translation.findFirst).toHaveBeenCalledWith({
      where: { book_id: 'book-1' },
      orderBy: { created_at: 'desc' },
    })
  })

  it('returns 404 when no translation exists', async () => {
    ctx.prisma.translation.findFirst.mockResolvedValue(null)

    const res = await ctx.app.request('/api/translations/book-1')

    expect(res.status).toBe(404)
    expect(await res.json()).toBeNull()
  })
})

describe('POST /api/translations', () => {
  let ctx: TestApp
  beforeEach(() => {
    ctx = createTestApp()
  })

  it('creates a new translation when no id is provided', async () => {
    ctx.prisma.translation.create.mockResolvedValue(makeTranslation())

    const res = await ctx.app.request('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: 'book-1', text: 'hola' }),
    })

    expect(res.status).toBe(201)
    expect(ctx.prisma.translation.create).toHaveBeenCalledWith({
      data: { book_id: 'book-1', text: 'hola' },
    })
    expect(ctx.prisma.translation.update).not.toHaveBeenCalled()
  })

  it('updates an existing translation when id is provided', async () => {
    ctx.prisma.translation.update.mockResolvedValue(makeTranslation({ text: 'adios' }))

    const res = await ctx.app.request('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'tr-1', bookId: 'book-1', text: 'adios' }),
    })

    expect(res.status).toBe(201)
    expect(ctx.prisma.translation.update).toHaveBeenCalledWith({
      where: { id: 'tr-1' },
      data: { text: 'adios' },
    })
    expect(ctx.prisma.translation.create).not.toHaveBeenCalled()
  })
})
