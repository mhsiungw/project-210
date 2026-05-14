import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../features/auth/supabase'

export const auth = createApi({
  reducerPath: 'auth',
  baseQuery: fakeBaseQuery<string>(),
  tagTypes: ['Session'],
  endpoints: builder => ({
    getSession: builder.query<Session | null, void>({
      queryFn: async () => {
        const { data, error } = await supabase.auth.getSession()
        if (error) return { error: error.message }
        return { data: data.session }
      },
      providesTags: ['Session'],
    }),
    signInWithOtp: builder.mutation<void, { email: string }>({
      queryFn: async ({ email }) => {
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) return { error: error.message }
        return { data: undefined }
      },
    }),
    verifyOtp: builder.mutation<
      { session: Session | null; user: User | null },
      { email: string; token: string }
    >({
      queryFn: async ({ email, token }) => {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        })
        if (error) return { error: error.message }
        return { data: { session: data.session, user: data.user } }
      },
      invalidatesTags: ['Session'],
    }),
    signOut: builder.mutation<void, void>({
      queryFn: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) return { error: error.message }
        return { data: undefined }
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
