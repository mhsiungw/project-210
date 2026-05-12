import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Session } from '@supabase/supabase-js'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  session: Session | null
}

const auth = createSlice({
  name: 'auth',
  initialState: { status: 'loading', session: null } as AuthState,
  reducers: {
    setSession(_, action: PayloadAction<Session | null>) {
      return {
        status: action.payload ? 'authenticated' : 'unauthenticated',
        session: action.payload,
      }
    },
  },
})

export const { setSession } = auth.actions
export default auth.reducer
