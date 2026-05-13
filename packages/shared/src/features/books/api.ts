import type { BookDto } from '../../api/types'
import type { ThunkExtra } from '../../store'
import { emptyApi } from '../../store/api/emptyApi'

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
