export const IPC = {
  PING: 'ping',
  S3_UPLOAD: 's3-upload',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
