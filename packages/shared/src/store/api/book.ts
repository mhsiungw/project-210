import { HttpError, type BookDto } from '@app/shared/client'
import type { ThunkExtra } from '@app/shared/store'
import { emptyApi } from './emptyApi'

function toQueryError(
  e: unknown
): { status: number; data: string } | { status: 'FETCH_ERROR'; error: string } {
  return e instanceof HttpError
    ? { status: e.status, data: e.message }
    : { status: 'FETCH_ERROR' as const, error: String(e) }
}

const bookApi = emptyApi.injectEndpoints({
  endpoints: builder => ({
    getBooks: builder.query<BookDto[], void>({
      queryFn: async (_arg, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.getBooks() }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      providesTags: ['Book'],
    }),
    putBook: builder.mutation<void, BookDto>({
      queryFn: async (book, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          await apiClient.putBook(book)
          return { data: undefined }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      invalidatesTags: ['Book'],
    }),
    postBook: builder.mutation<
      void,
      { buffer: ArrayBuffer; fileName: string; previewBuffer: ArrayBuffer }
    >({
      queryFn: async ({ buffer, fileName, previewBuffer }, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.postBook(buffer, fileName, previewBuffer) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      invalidatesTags: ['Book'],
    }),
    deleteBook: builder.mutation<void, string>({
      queryFn: async (bookId, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.deleteBook(bookId) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      invalidatesTags: ['Book'],
    }),
  }),
})

export const { useGetBooksQuery, usePutBookMutation, usePostBookMutation, useDeleteBookMutation } =
  bookApi
