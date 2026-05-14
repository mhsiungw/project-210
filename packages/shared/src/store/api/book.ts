import type { BookDto } from '@app/shared/client'
import type { ThunkExtra } from '@app/shared/store'
import { emptyApi } from './emptyApi'

const bookApi = emptyApi.injectEndpoints({
  endpoints: builder => ({
    getBooks: builder.query<BookDto[], void>({
      queryFn: async (_arg, api) => {
        const { apiClient } = api.extra as ThunkExtra
        return { data: await apiClient.getBooks() }
      },
      providesTags: ['Book'],
    }),
    postBook: builder.mutation<
      void,
      { buffer: ArrayBuffer; fileName: string; previewBuffer: ArrayBuffer }
    >({
      queryFn: async ({ buffer, fileName, previewBuffer }, api) => {
        const { apiClient } = api.extra as ThunkExtra
        return { data: await apiClient.postBook(buffer, fileName, previewBuffer) }
      },
      invalidatesTags: ['Book'],
    }),
    deleteBook: builder.mutation<void, string>({
      queryFn: async (bookId, api) => {
        const { apiClient } = api.extra as ThunkExtra
        return { data: await apiClient.deleteBook(bookId) }
      },
      invalidatesTags: ['Book'],
    }),
  }),
})

export const { useGetBooksQuery, usePostBookMutation, useDeleteBookMutation } = bookApi
