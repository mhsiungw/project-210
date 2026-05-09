import { useRef, useCallback } from 'react'

export function useThrottle<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number
): (...args: T) => void {
  const lastCall = useRef<number>(0)
  return useCallback(
    (...args: T) => {
      const now = Date.now()
      if (now - lastCall.current >= ms) {
        lastCall.current = now
        fn(...args)
      }
    },
    [fn, ms]
  )
}
