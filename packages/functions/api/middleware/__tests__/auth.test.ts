import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createAuth, type VerifyToken } from '../auth.ts'

const buildApp = (verifyToken: VerifyToken) => {
  const app = new Hono<{ Variables: { userId: string } }>()
  app.use('*', createAuth(verifyToken))
  app.get('/', c => c.json({ userId: c.get('userId') }))
  return app
}

describe('createAuth', () => {
  it('rejects with 401 when no Authorization header is sent', async () => {
    const verifyToken = vi.fn<VerifyToken>()
    const app = buildApp(verifyToken)

    const res = await app.request('/')

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(verifyToken).not.toHaveBeenCalled()
  })

  it('rejects with 401 when the token is invalid', async () => {
    const verifyToken = vi.fn<VerifyToken>().mockResolvedValue(null)
    const app = buildApp(verifyToken)

    const res = await app.request('/', {
      headers: { Authorization: 'Bearer bad-token' },
    })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(verifyToken).toHaveBeenCalledWith('bad-token')
  })

  it('rejects with 401 when the token is expired (verifier returns null)', async () => {
    // The middleware treats expired tokens the same as invalid ones: verifyToken
    // returns null for both, so this exercises the same branch with intent named.
    const verifyToken = vi.fn<VerifyToken>().mockResolvedValue(null)
    const app = buildApp(verifyToken)

    const res = await app.request('/', {
      headers: { Authorization: 'Bearer expired-token' },
    })

    expect(res.status).toBe(401)
    expect(verifyToken).toHaveBeenCalledWith('expired-token')
  })

  it('sets userId and forwards to the handler on a valid token', async () => {
    const verifyToken = vi.fn<VerifyToken>().mockResolvedValue({ userId: 'u-42' })
    const app = buildApp(verifyToken)

    const res = await app.request('/', {
      headers: { Authorization: 'Bearer good-token' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: 'u-42' })
  })
})
