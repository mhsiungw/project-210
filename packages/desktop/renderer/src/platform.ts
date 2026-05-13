import type { Platform } from '@app/shared/platform/context'

// TODO: wire openExternal via preload (shell.openExternal) when a UI consumer is added.
export const desktopPlatform: Platform = {
  openExternal(_url: string): Promise<void> {
    return Promise.reject(new Error('openExternal: not yet wired up in preload'))
  },
}
