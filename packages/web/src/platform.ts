import type { Platform } from '@app/shared/platform/context'

export const webPlatform: Platform = {
  openExternal(url: string): Promise<void> {
    window.open(url, '_blank', 'noopener,noreferrer')
    return Promise.resolve()
  },
}
