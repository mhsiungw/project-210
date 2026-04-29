import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipcChannels'

contextBridge.exposeInMainWorld('api', {
  ping: (): Promise<string> => ipcRenderer.invoke(IPC.PING),
})
