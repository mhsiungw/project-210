/**
 * Decide whether a reading position is worth persisting.
 *
 *   next === null  -> viewer never reported a page (PDF not loaded / no scroll yet).
 *                     Persisting here would overwrite a real saved page with a default.
 *   next < 1       -> not a valid 1-indexed page.
 *   next === saved -> no change; skip the pointless write.
 *
 * Only a real, changed, loaded page returns true.
 */
export function shouldPersistPage(next: number | null, saved: number): boolean {
  if (next == null) return false
  if (next < 1) return false
  return next !== saved
}
