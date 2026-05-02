import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipcChannels'

contextBridge.exposeInMainWorld('api', {
  ping: (): Promise<string> => ipcRenderer.invoke(IPC.PING),
  uploadToS3: (
    buffer: ArrayBuffer,
    fileName: string,
    previewBuffer: ArrayBuffer
  ): Promise<{ key: string; previewKey: string }> =>
    ipcRenderer.invoke(IPC.S3_UPLOAD, buffer, fileName, previewBuffer),
})
