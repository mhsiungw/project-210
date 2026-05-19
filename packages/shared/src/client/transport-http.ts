import type { Transport } from '@app/shared/client/transport'
import type { BookDto } from '@app/shared/client/types'

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`)
  }
}

function assertOk(res: Response): void {
  if (!res.ok) throw new HttpError(res.status)
}

export function createHttpTransport(baseUrl: string, getToken: () => Promise<string>): Transport {
  async function authHeader(): Promise<HeadersInit> {
    return { Authorization: `Bearer ${await getToken()}` }
  }

  return {
    async invoke<T>(method: string, ...args: unknown[]): Promise<T> {
      switch (method) {
        case 'getBooks': {
          const res = await fetch(`${baseUrl}/books`, { headers: await authHeader() })
          assertOk(res)
          return res.json()
        }
        case 'postBook': {
          const [buffer, fileName, previewBuffer] = args as [ArrayBuffer, string, ArrayBuffer]
          const form = new FormData()
          form.append('pdf', new Blob([buffer], { type: 'application/pdf' }), fileName)
          form.append('preview', new Blob([previewBuffer], { type: 'image/png' }))
          form.append('fileName', fileName)
          const res = await fetch(`${baseUrl}/books`, {
            method: 'POST',
            headers: await authHeader(),
            body: form,
          })
          assertOk(res)
          return undefined as T
        }
        case 'putBook': {
          const [book] = args as [BookDto]
          const res = await fetch(`${baseUrl}/books/${book.id}`, {
            method: 'PUT',
            headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
            body: JSON.stringify(book),
          })
          assertOk(res)
          return res.json()
        }
        case 'deleteBook': {
          const [bookId] = args as [string]
          const res = await fetch(`${baseUrl}/books/${bookId}`, {
            method: 'DELETE',
            headers: await authHeader(),
          })
          assertOk(res)
          return undefined as T
        }
        case 'getPDF': {
          const [url] = args as [string]
          const res = await fetch(`${baseUrl}/pdf?url=${encodeURIComponent(url)}`, {
            headers: await authHeader(),
          })
          assertOk(res)
          return res.arrayBuffer() as unknown as T
        }
        case 'getTranslation': {
          const [bookId] = args as [string]
          const res = await fetch(`${baseUrl}/translations/${bookId}`, {
            headers: await authHeader(),
          })
          if (res.status === 404) return null as T
          assertOk(res)
          return res.json()
        }
        case 'postTranslation': {
          const [bookId, text, id] = args as [string, string, string?]
          const res = await fetch(`${baseUrl}/translations`, {
            method: 'POST',
            headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, text, id }),
          })
          assertOk(res)
          return res.json()
        }
        default:
          throw new Error(`httpTransport: unknown method "${method}"`)
      }
    },
  }
}
