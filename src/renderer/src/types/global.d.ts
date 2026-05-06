import type { IpcApi } from '@shared/ipcChannels'

declare module '*.css'
declare module 'react-pdf/dist/Page/AnnotationLayer.css'
declare module 'react-pdf/dist/Page/TextLayer.css'

export declare global {
  interface Window {
    api: IpcApi
  }
}
