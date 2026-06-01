import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Persist work whenever the user leaves the current view. Two paths, because
 * the two exit triggers have different constraints:
 *
 *   in-app navigation ─► useBlocker ─► save()  ─► proceed()
 *     The page stays alive, so save() can do async work (auth token, fetch)
 *     and update RTK caches. We await it before proceeding.
 *
 *   tab close / refresh ─► pagehide        ─► flush()
 *   tab backgrounded     ─► visibilitychange ─► flush()
 *     The page is tearing down. No async continuation will run, so flush()
 *     must be fully synchronous (read token from storage, fire a keepalive
 *     fetch). See service/beacon.ts.
 *
 * react-router allows only ONE active blocker at a time, so a view with several
 * things to persist must funnel them through a single save/flush pair.
 * proceed() runs in `finally` so a rejected save never traps the user.
 */
export function useSaveOnExit(save: () => Promise<void>, flush: () => void): void {
  // Keep the latest callbacks without re-registering the blocker/listeners.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])
  const flushRef = useRef(flush)
  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation !== nextLocation
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    let cancelled = false
    void (async () => {
      try {
        await saveRef.current()
      } catch {
        // A failed save must not trap the user; the next getBooks reconciles.
      } finally {
        if (!cancelled) blocker.proceed()
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state])

  useEffect(() => {
    const onHide = (): void => flushRef.current()
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') flushRef.current()
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
