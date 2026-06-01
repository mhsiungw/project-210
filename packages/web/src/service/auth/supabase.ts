import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

const supabase = createClient(url, anonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export interface AuthSession {
  userId: string
  email: string | null
  accessToken: string
  refreshToken: string
  expiresAt: number | null
}

function toAuthSession(session: Session): AuthSession {
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  }
}

export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

/**
 * Synchronous read of the access token straight from localStorage.
 *
 * getAccessToken() awaits supabase.auth.getSession(), which also refreshes
 * near-expiry tokens. That await makes it unusable from a `pagehide` handler:
 * the page tears down before the promise resolves, so no request is ever sent.
 * This reads the persisted session directly so the exit-save path can fire a
 * keepalive fetch with zero await.
 *
 * Couples to supabase-js v2's storage shape: session JSON under an
 * `sb-<project-ref>-auth-token` localStorage key. Keyed off the suffix so a
 * project-ref change won't break it; a supabase-js major bump might — grep
 * for this function if auth storage ever changes.
 */
export function getAccessTokenSync(): string {
  try {
    const key = Object.keys(localStorage).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    if (!key) return ''
    const raw = localStorage.getItem(key)
    if (!raw) return ''
    const session = JSON.parse(raw) as { access_token?: string; expires_at?: number }
    if (!session.access_token) return ''
    // Skip a doomed request if the token is already expired (expires_at is unix seconds).
    if (typeof session.expires_at === 'number' && session.expires_at * 1000 <= Date.now()) {
      return ''
    }
    return session.access_token
  } catch {
    return ''
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  return data.session ? toAuthSession(data.session) : null
}

export async function signInWithOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw new Error(error.message)
}

export async function verifyOtp(email: string, token: string): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw new Error(error.message)
  return data.session ? toAuthSession(data.session) : null
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}
