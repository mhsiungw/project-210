export {}

declare module '*.css'
declare module 'react-pdf/dist/Page/AnnotationLayer.css'
declare module 'react-pdf/dist/Page/TextLayer.css'

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>
    }
  }
}
