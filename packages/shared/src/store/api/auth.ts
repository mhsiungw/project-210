import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { AuthSession } from '@app/shared/service/auth'
import { getSession, signInWithOtp, verifyOtp, signOut } from '@app/shared/service/auth'

export const auth = createApi({
  reducerPath: 'auth',
  baseQuery: fakeBaseQuery<string>(),
  tagTypes: ['Session'],
  endpoints: builder => ({
    getSession: builder.query<AuthSession | null, void>({
      queryFn: async () => {
        try {
          return { data: await getSession() }
        } catch (e) {
          return { error: (e as Error).message }
        }
      },
      providesTags: ['Session'],
    }),
    signInWithOtp: builder.mutation<void, { email: string }>({
      queryFn: async ({ email }) => {
        try {
          await signInWithOtp(email)
          return { data: undefined }
        } catch (e) {
          return { error: (e as Error).message }
        }
      },
    }),
    verifyOtp: builder.mutation<AuthSession | null, { email: string; token: string }>({
      queryFn: async ({ email, token }) => {
        try {
          return { data: await verifyOtp(email, token) }
        } catch (e) {
          return { error: (e as Error).message }
        }
      },
      invalidatesTags: ['Session'],
    }),
    signOut: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          await signOut()
          return { data: undefined }
        } catch (e) {
          return { error: (e as Error).message }
        }
      },
      invalidatesTags: ['Session'],
    }),
  }),
})

export const {
  useGetSessionQuery,
  useSignInWithOtpMutation,
  useVerifyOtpMutation,
  useSignOutMutation,
} = auth
