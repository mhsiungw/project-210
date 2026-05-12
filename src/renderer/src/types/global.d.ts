/// <reference types="vite/client" />

import type { IpcApi } from '@shared/ipcChannels'

export declare global {
  interface Window {
    api: IpcApi
  }
}
