import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Run `save` whenever the user leaves the current view.
 *
 *   in-app navigation ─► useBlocker intercepts ─► save() ─► proceed()
 *   tab close / refresh ─► pagehide          ─► save()
 *   tab backgrounded    ─► visibilitychange  ─► save() (hidden only)
 *
 * react-router allows only ONE active blocker at a time, so a view with
 * several things to persist (notes draft, reading position, ...) must funnel
 * them through a single `save`. proceed() runs in `finally` so a rejected
 * save never traps the user on the page.
 */
export function useSaveOnExit(save: () => Promise<void>): void {
  // Keep the latest save without re-registering the blocker/listeners each render.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])

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
    const flush = (): void => {
      void saveRef.current().catch(() => {})
    }
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
