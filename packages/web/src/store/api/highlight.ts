import { createSelector } from '@reduxjs/toolkit'
import type { HighlightDto } from '@app/db/dto'
import type { NewHighlight } from '@web/client'
import type { RootState, ThunkExtra } from '@web/store'
import { emptyApi, toQueryError } from './emptyApi'

// Highlights are discrete create/delete/edit actions (NOT a debounced blob like
// Translation). Every mutation patches the getHighlights(bookId) cache optimistically
// so the paint feels instant; on failure the patch is undone. No tag invalidation —
// a refetch would re-flash overlays mid-read, the same reason putBook patches in place.

const highlightApi = emptyApi.injectEndpoints({
  endpoints: builder => ({
    getHighlights: builder.query<HighlightDto[], string>({
      queryFn: async (bookId, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.getHighlights(bookId) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      providesTags: (_result, _error, bookId) => [{ type: 'Highlight', id: bookId }],
    }),

    postHighlight: builder.mutation<HighlightDto, NewHighlight>({
      queryFn: async (input, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.postHighlight(input) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      async onQueryStarted(input, { dispatch, queryFulfilled }) {
        const tempId = `temp-${crypto.randomUUID()}`
        const optimistic: HighlightDto = { id: tempId, ...input }
        const patch = dispatch(
          highlightApi.util.updateQueryData('getHighlights', input.bookId, draft => {
            draft.push(optimistic)
          })
        )
        try {
          const { data: saved } = await queryFulfilled
          // Swap the temp row for the server row (real id, created_at).
          dispatch(
            highlightApi.util.updateQueryData('getHighlights', input.bookId, draft => {
              const idx = draft.findIndex(h => h.id === tempId)
              if (idx !== -1) draft[idx] = saved
            })
          )
        } catch {
          patch.undo()
        }
      },
    }),

    putHighlightNote: builder.mutation<
      HighlightDto,
      { id: string; bookId: string; note: string | null }
    >({
      queryFn: async ({ id, note }, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.putHighlightNote(id, note) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      async onQueryStarted({ id, bookId, note }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          highlightApi.util.updateQueryData('getHighlights', bookId, draft => {
            const cached = draft.find(h => h.id === id)
            if (cached) cached.note = note ?? undefined
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteHighlight: builder.mutation<void, { id: string; bookId: string }>({
      queryFn: async ({ id }, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.deleteHighlight(id) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      async onQueryStarted({ id, bookId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          highlightApi.util.updateQueryData('getHighlights', bookId, draft => {
            const idx = draft.findIndex(h => h.id === id)
            if (idx !== -1) draft.splice(idx, 1)
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
  }),
})

export const {
  useGetHighlightsQuery,
  usePostHighlightMutation,
  usePutHighlightNoteMutation,
  useDeleteHighlightMutation,
} = highlightApi

export { highlightApi }

// ── Repaint selector (D5-A) ───────────────────────────────────────────────────
// Group a book's highlights by 1-based page number. Memoized per bookId so the
// group-by runs once per cache change, not once per page mount under virtualization.

const EMPTY: HighlightDto[] = []

const makeSelectHighlightsByPage = (
  bookId: string
): ((state: RootState) => Map<number, HighlightDto[]>) =>
  createSelector(
    (state: RootState) => highlightApi.endpoints.getHighlights.select(bookId)(state).data ?? EMPTY,
    highlights => {
      const byPage = new Map<number, HighlightDto[]>()
      for (const h of highlights) {
        const arr = byPage.get(h.page)
        if (arr) arr.push(h)
        else byPage.set(h.page, [h])
      }
      return byPage
    }
  )

const selectorCache = new Map<string, ReturnType<typeof makeSelectHighlightsByPage>>()

/** Stable, memoized selector mapping page → highlights for a book. */
export function selectHighlightsByPage(
  bookId: string
): (state: RootState) => Map<number, HighlightDto[]> {
  let selector = selectorCache.get(bookId)
  if (!selector) {
    selector = makeSelectHighlightsByPage(bookId)
    selectorCache.set(bookId, selector)
  }
  return selector
}
