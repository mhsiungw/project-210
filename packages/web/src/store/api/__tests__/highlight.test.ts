import { describe, it, expect, vi } from 'vitest'
import { createAppStore } from '@web/store'
import { highlightApi, selectHighlightsByPage } from '@web/store/api/highlight'
import type { ApiClient, NewHighlight } from '@web/client'
import type { HighlightDto } from '@app/db/dto'

const h = (over: Partial<HighlightDto> = {}): HighlightDto => ({
  id: 'h1',
  bookId: 'b1',
  page: 1,
  rects: [{ x: 0, y: 0, w: 0.1, h: 0.1 }],
  text: 'hola',
  ...over,
})

const input: NewHighlight = {
  bookId: 'b1',
  page: 2,
  rects: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.05 }],
  text: 'mundo',
}

function fakeClient(over: Partial<ApiClient> = {}): ApiClient {
  return {
    getHighlights: vi.fn(async () => [] as HighlightDto[]),
    postHighlight: vi.fn(async (i: NewHighlight) => h({ id: 'server-id', ...i })),
    putHighlightNote: vi.fn(async (id: string, note: string | null) =>
      h({ id, note: note ?? undefined })
    ),
    deleteHighlight: vi.fn(async () => undefined),
    ...over,
  } as unknown as ApiClient
}

const select = (bookId: string) => highlightApi.endpoints.getHighlights.select(bookId)

describe('highlight slice', () => {
  it('getHighlights populates the cache (persistence round-trip)', async () => {
    const store = createAppStore({
      apiClient: fakeClient({ getHighlights: vi.fn(async () => [h()]) }),
    })
    await store.dispatch(highlightApi.endpoints.getHighlights.initiate('b1'))
    expect(select('b1')(store.getState()).data).toHaveLength(1)
  })

  it('postHighlight paints optimistically, then swaps the temp row for the server row', async () => {
    const store = createAppStore({ apiClient: fakeClient() })
    await store.dispatch(highlightApi.endpoints.getHighlights.initiate('b1'))

    const promise = store.dispatch(highlightApi.endpoints.postHighlight.initiate(input))
    // Optimistic insert is synchronous — paint feels instant.
    const optimistic = select('b1')(store.getState()).data
    expect(optimistic).toHaveLength(1)
    expect(optimistic?.[0].id).toMatch(/^temp-/)

    await promise
    const settled = select('b1')(store.getState()).data
    expect(settled).toHaveLength(1)
    expect(settled?.[0].id).toBe('server-id') // temp replaced by server id
  })

  it('rolls the optimistic highlight back when the POST fails', async () => {
    const store = createAppStore({
      apiClient: fakeClient({
        postHighlight: vi.fn(async () => {
          throw new Error('boom')
        }),
      }),
    })
    await store.dispatch(highlightApi.endpoints.getHighlights.initiate('b1'))
    await store.dispatch(highlightApi.endpoints.postHighlight.initiate(input))
    expect(select('b1')(store.getState()).data).toHaveLength(0)
  })

  it('deleteHighlight optimistically removes the row', async () => {
    const store = createAppStore({
      apiClient: fakeClient({ getHighlights: vi.fn(async () => [h()]) }),
    })
    await store.dispatch(highlightApi.endpoints.getHighlights.initiate('b1'))
    await store.dispatch(
      highlightApi.endpoints.deleteHighlight.initiate({ id: 'h1', bookId: 'b1' })
    )
    expect(select('b1')(store.getState()).data).toHaveLength(0)
  })

  it('putHighlightNote optimistically updates the note', async () => {
    const store = createAppStore({
      apiClient: fakeClient({ getHighlights: vi.fn(async () => [h()]) }),
    })
    await store.dispatch(highlightApi.endpoints.getHighlights.initiate('b1'))
    await store.dispatch(
      highlightApi.endpoints.putHighlightNote.initiate({ id: 'h1', bookId: 'b1', note: 'verb' })
    )
    expect(select('b1')(store.getState()).data?.[0].note).toBe('verb')
  })
})

describe('selectHighlightsByPage (D5-A memoized grouping)', () => {
  it('groups highlights by 1-based page', async () => {
    const store = createAppStore({
      apiClient: fakeClient({
        getHighlights: vi.fn(async () => [
          h({ id: 'a', page: 1 }),
          h({ id: 'b', page: 1 }),
          h({ id: 'c', page: 3 }),
        ]),
      }),
    })
    await store.dispatch(highlightApi.endpoints.getHighlights.initiate('b1'))
    const byPage = selectHighlightsByPage('b1')(store.getState())
    expect(byPage.get(1)).toHaveLength(2)
    expect(byPage.get(3)).toHaveLength(1)
    expect(byPage.get(2)).toBeUndefined()
  })

  it('returns a stable reference while the cache is unchanged (memoized)', async () => {
    const store = createAppStore({
      apiClient: fakeClient({ getHighlights: vi.fn(async () => [h()]) }),
    })
    await store.dispatch(highlightApi.endpoints.getHighlights.initiate('b1'))
    const a = selectHighlightsByPage('b1')(store.getState())
    const b = selectHighlightsByPage('b1')(store.getState())
    expect(a).toBe(b)
  })
})
