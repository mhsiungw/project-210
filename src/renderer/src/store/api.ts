import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BookDto, TranslationDto } from '@shared/types'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Book', 'Translation'],
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
    getTranslation: builder.query<TranslationDto | null, string>({
      queryFn: async bookId => ({ data: await window.api.getTranslation(bookId) }),
      providesTags: (_result, _error, bookId) => [{ type: 'Translation', id: bookId }],
    }),
    postTranslation: builder.mutation<
      TranslationDto,
      { bookId: string; text: string; id?: string }
    >({
      queryFn: async ({ bookId, text, id }) => ({
        data: await window.api.postTranslation(bookId, text, id),
      }),
      invalidatesTags: (_result, _error, { bookId }) => [{ type: 'Translation', id: bookId }],
    }),
  }),
})

export const {
  useGetBooksQuery,
  usePostBookMutation,
  useGetTranslationQuery,
  usePostTranslationMutation,
  useDeleteBookMutation,
} = api
