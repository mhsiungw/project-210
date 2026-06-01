// Regression: reading position lost on tab close.
// The exit-save went through the RTK/transport path, which awaits
// supabase.auth.getSession() before fetching and used no keepalive. On a real
// tab close the page tore down during that await, so the request was never
// sent (or was cancelled). The beacon must read the token SYNCHRONOUSLY and
// fetch with keepalive so the write survives page unload.
// Found by /qa on 2026-06-01
// Report: .gstack/qa-reports/qa-report-localhost-2026-06-01.md
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { BookDto } from '@app/db/dto'

vi.mock('@web/service/auth', () => ({ getAccessTokenSync: vi.fn() }))
import { getAccessTokenSync } from '@web/service/auth'
import { beaconSaveBook, beaconSaveTranslation } from '@web/service/beacon'

const mockedToken = vi.mocked(getAccessTokenSync)
const book = { id: 'b1', currentPage: 58, fileName: 'x.pdf' } as BookDto

let fetchSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchSpy = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetchSpy)
  mockedToken.mockReturnValue('test-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('beacon exit-save (regression: tab-close persistence)', () => {
  it('dispatches the book write SYNCHRONOUSLY with keepalive + bearer auth', () => {
    beaconSaveBook(book)

    // The core of the bug: fetch must already be called by the time the sync
    // function returns — no await before the request, or teardown drops it.
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toContain('/books/b1')
    expect(opts.method).toBe('PUT')
    expect(opts.keepalive).toBe(true)
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
    expect(JSON.parse(opts.body as string).currentPage).toBe(58)
  })

  it('dispatches the translation write with keepalive', () => {
    beaconSaveTranslation('b1', 'my notes')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toContain('/translations')
    expect(opts.method).toBe('POST')
    expect(opts.keepalive).toBe(true)
    expect(JSON.parse(opts.body as string)).toEqual({ bookId: 'b1', text: 'my notes' })
  })

  it('skips the write when there is no valid token (expired/missing)', () => {
    mockedToken.mockReturnValue('')
    beaconSaveBook(book)
    beaconSaveTranslation('b1', 'notes')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
