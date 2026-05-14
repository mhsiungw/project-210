import type { TranslationDto } from '../../api/types'
import type { ThunkExtra } from '..'
import { emptyApi } from './emptyApi'

const translationApi = emptyApi.injectEndpoints({
  endpoints: builder => ({
    getTranslation: builder.query<TranslationDto | null, string>({
      queryFn: async (bookId, api) => {
        const { apiClient } = api.extra as ThunkExtra
        return { data: await apiClient.getTranslation(bookId) }
      },
      providesTags: (_result, _error, bookId) => [{ type: 'Translation', id: bookId }],
    }),
    postTranslation: builder.mutation<
      TranslationDto,
      { bookId: string; text: string; id?: string }
    >({
      queryFn: async ({ bookId, text, id }, api) => {
        const { apiClient } = api.extra as ThunkExtra
        return { data: await apiClient.postTranslation(bookId, text, id) }
      },
      invalidatesTags: (_result, _error, { bookId }) => [{ type: 'Translation', id: bookId }],
    }),
  }),
})

export const { useGetTranslationQuery, usePostTranslationMutation } = translationApi
