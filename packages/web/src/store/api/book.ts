import type { BookDto } from '@web/client'
import type { ThunkExtra } from '@web/store'
import { emptyApi, toQueryError } from './emptyApi'

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
      // Patch the cached book in place rather than invalidating ['Book'].
      // A refetch re-signs every CloudFront URL, which changes s3KeyUrl and
      // forces <Document file={url}> to reload the whole PDF mid-read.
      async onQueryStarted(book, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          bookApi.util.updateQueryData('getBooks', undefined, draft => {
            const cached = draft.find(b => b.id === book.id)
            if (cached) cached.currentPage = book.currentPage
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
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
