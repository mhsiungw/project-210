import { createMiddleware } from 'hono/factory'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Variables = { userId: string }

export type VerifyToken = (token: string) => Promise<{ userId: string } | null>

export const createSupabaseVerifyToken = (supabase: SupabaseClient): VerifyToken => {
  return async token => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return { userId: user.id }
  }
}

export const createAuth = (verifyToken: VerifyToken) =>
  createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) return c.json({ error: 'Unauthorized' }, 401)

    const result = await verifyToken(token)
    if (!result) return c.json({ error: 'Unauthorized' }, 401)

    c.set('userId', result.userId)
    await next()
  })

export const createSupabaseClient = (url: string, anonKey: string): SupabaseClient =>
  createClient(url, anonKey)
