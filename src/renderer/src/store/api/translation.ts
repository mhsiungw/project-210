import type { TranslationDto } from '@shared/types'
import { emptyApi } from './emptyApi'

const translationApi = emptyApi.injectEndpoints({
  endpoints: builder => ({
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

export const { useGetTranslationQuery, usePostTranslationMutation } = translationApi
