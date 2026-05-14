import type { Transport } from '@app/shared/client/transport'
import type { BookDto } from '@app/shared/client/types'

export function createHttpTransport(baseUrl: string, getToken: () => Promise<string>): Transport {
  async function authHeader(): Promise<HeadersInit> {
    return { Authorization: `Bearer ${await getToken()}` }
  }

  return {
    async invoke<T>(method: string, ...args: unknown[]): Promise<T> {
      console.log('method', method)
      switch (method) {
        case 'getBooks': {
          const res = await fetch(`${baseUrl}/api/books`, { headers: await authHeader() })
          return res.json()
        }
        case 'postBook': {
          const [buffer, fileName, previewBuffer] = args as [ArrayBuffer, string, ArrayBuffer]
          const form = new FormData()
          form.append('pdf', new Blob([buffer], { type: 'application/pdf' }), fileName)
          form.append('preview', new Blob([previewBuffer], { type: 'image/png' }))
          form.append('fileName', fileName)
          await fetch(`${baseUrl}/api/books`, {
            method: 'POST',
            headers: await authHeader(),
            body: form,
          })
          return undefined as T
        }
        case 'putBook': {
          const [book] = args as [BookDto]
          const res = await fetch(`${baseUrl}/api/books/${book.id}`, {
            method: 'PUT',
            headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
            body: JSON.stringify(book),
          })
          return res.json()
        }
        case 'deleteBook': {
          const [bookId] = args as [string]
          await fetch(`${baseUrl}/api/books/${bookId}`, {
            method: 'DELETE',
            headers: await authHeader(),
          })
          return undefined as T
        }
        case 'getPDF': {
          const [url] = args as [string]
          const res = await fetch(`${baseUrl}/api/pdf?url=${encodeURIComponent(url)}`, {
            headers: await authHeader(),
          })
          return res.arrayBuffer() as unknown as T
        }
        case 'getTranslation': {
          const [bookId] = args as [string]
          const res = await fetch(`${baseUrl}/api/translations/${bookId}`, {
            headers: await authHeader(),
          })
          if (res.status === 404) return null as T
          return res.json()
        }
        case 'postTranslation': {
          const [bookId, text, id] = args as [string, string, string?]
          const res = await fetch(`${baseUrl}/api/translations`, {
            method: 'POST',
            headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, text, id }),
          })
          return res.json()
        }
        default:
          throw new Error(`httpTransport: unknown method "${method}"`)
      }
    },
  }
}
