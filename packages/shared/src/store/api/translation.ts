import type { TranslationDto } from '@app/shared/client/types'
import type { ThunkExtra } from '@app/shared/store'
import { emptyApi, toQueryError } from './emptyApi'

const translationApi = emptyApi.injectEndpoints({
  endpoints: builder => ({
    getTranslation: builder.query<TranslationDto | null, string>({
      queryFn: async (bookId, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.getTranslation(bookId) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      providesTags: (_result, _error, bookId) => [{ type: 'Translation', id: bookId }],
    }),
    postTranslation: builder.mutation<
      TranslationDto,
      { bookId: string; text: string; id?: string }
    >({
      queryFn: async ({ bookId, text, id }, api) => {
        try {
          const { apiClient } = api.extra as ThunkExtra
          return { data: await apiClient.postTranslation(bookId, text, id) }
        } catch (e) {
          return { error: toQueryError(e) }
        }
      },
      invalidatesTags: (_result, _error, { bookId }) => [{ type: 'Translation', id: bookId }],
    }),
  }),
})

export const { useGetTranslationQuery, usePostTranslationMutation } = translationApi
