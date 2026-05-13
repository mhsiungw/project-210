import type { BookDto } from '@shared/types'
import { emptyApi } from './emptyApi'

const bookApi = emptyApi.injectEndpoints({
  endpoints: builder => ({
    getBooks: builder.query<BookDto[], void>({
      queryFn: async () => ({ data: await window.api.getBooks() }),
      providesTags: ['Book'],
    }),
    postBook: builder.mutation<
      void,
      { buffer: ArrayBuffer; fileName: string; previewBuffer: ArrayBuffer }
    >({
      queryFn: async ({ buffer, fileName, previewBuffer }) => ({
        data: await window.api.postBook(buffer, fileName, previewBuffer),
      }),
      invalidatesTags: ['Book'],
    }),
    deleteBook: builder.mutation<void, string>({
      queryFn: async bookId => ({ data: await window.api.deleteBook(bookId) }),
      invalidatesTags: ['Book'],
    }),
  }),
})

export const { useGetBooksQuery, usePostBookMutation, useDeleteBookMutation } = bookApi
