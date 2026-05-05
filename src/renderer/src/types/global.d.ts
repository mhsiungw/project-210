declare module '*.css'
declare module 'react-pdf/dist/Page/AnnotationLayer.css'
declare module 'react-pdf/dist/Page/TextLayer.css'

export declare global {
  interface Window {
    api: {
      ping: () => Promise<string>
      uploadToS3: (
        buffer: ArrayBuffer,
        fileName: string,
        previewBuffer: ArrayBuffer
      ) => Promise<{ key: string; previewKey: string }>
      getS3Previews: () => Promise<string[]>
    }
  }
}
