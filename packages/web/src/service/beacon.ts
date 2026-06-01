import type { BookDto } from '@app/db/dto'
import { getAccessTokenSync } from '@web/service/auth'

const baseUrl = import.meta.env.VITE_API_URL

/**
 * Fire-and-forget writes for the page-exit path (pagehide / tab close).
 *
 * Why not the RTK mutations? Those go through the async transport, which awaits
 * supabase.auth.getSession() before fetching. During teardown that await never
 * resolves, so the request is never sent. Here we read the token synchronously
 * and set keepalive so the browser delivers the request even as the page dies.
 *
 * Page-alive writes (in-app navigation) still use the RTK mutations for full
 * cache correctness. These are only for useSaveOnExit's pagehide path.
 * Routes mirror transport-http.ts.
 */
function beacon(method: string, path: string, body: unknown): void {
  const token = getAccessTokenSync()
  if (!token) return
  void fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}

export function beaconSaveBook(book: BookDto): void {
  beacon('PUT', `/books/${book.id}`, book)
}

export function beaconSaveTranslation(bookId: string, text: string): void {
  beacon('POST', '/translations', { bookId, text })
}
