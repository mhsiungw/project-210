import type { Transport } from '@app/shared/api/transport'

// TODO: replace with a real HTTP implementation when the web backend exists.
export const httpTransport: Transport = {
  invoke<T>(_method: string, ..._args: unknown[]): Promise<T> {
    return Promise.reject(new Error('httpTransport: not implemented'))
  },
}
