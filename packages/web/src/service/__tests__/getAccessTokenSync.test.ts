// Companion to the tab-close regression: the exit-save reads the token without
// awaiting supabase.auth.getSession(). This pins the synchronous localStorage
// read and the expiry guard (don't fire a doomed request with a dead token).
import { describe, it, expect, afterEach } from 'vitest'
import { getAccessTokenSync } from '@web/service/auth/supabase'

const KEY = 'sb-testproject-auth-token'
const future = (): number => Math.floor(Date.now() / 1000) + 3600
const past = (): number => Math.floor(Date.now() / 1000) - 10

afterEach(() => {
  localStorage.clear()
})

describe('getAccessTokenSync', () => {
  it('reads access_token synchronously from the sb-*-auth-token key', () => {
    localStorage.setItem(KEY, JSON.stringify({ access_token: 'tok', expires_at: future() }))
    expect(getAccessTokenSync()).toBe('tok')
  })

  it('returns empty when the token is already expired', () => {
    localStorage.setItem(KEY, JSON.stringify({ access_token: 'tok', expires_at: past() }))
    expect(getAccessTokenSync()).toBe('')
  })

  it('returns empty when no session key is present', () => {
    expect(getAccessTokenSync()).toBe('')
  })

  it('returns empty on malformed JSON instead of throwing', () => {
    localStorage.setItem(KEY, 'not-json')
    expect(getAccessTokenSync()).toBe('')
  })
})
