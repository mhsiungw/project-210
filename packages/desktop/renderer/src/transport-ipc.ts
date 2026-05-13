import type { Transport } from '@app/shared/api/transport'

export const ipcTransport: Transport = {
  invoke<T>(method: string, ...args: unknown[]): Promise<T> {
    const fn = (window.api as unknown as Record<string, (...a: unknown[]) => Promise<T>>)[method]
    if (typeof fn !== 'function') {
      return Promise.reject(new Error(`ipcTransport: unknown method "${method}"`))
    }
    return fn(...args)
  },
}
