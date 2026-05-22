import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Provider } from 'react-redux'
import { render, fireEvent, screen, waitFor, type RenderResult } from '@testing-library/react'
import { ApiClient } from '@web/client'
import { createAppStore, type AppStore } from '@web/store'
import Upload from '../Upload'

const renderMock = vi.fn(() => ({ promise: Promise.resolve() }))
const getPageMock = vi.fn(() =>
  Promise.resolve({
    getViewport: ({ scale }: { scale: number }) => ({ width: 800 * scale, height: 600 * scale }),
    render: renderMock,
  })
)

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => ({
    promise: Promise.resolve({ getPage: getPageMock }),
  }),
}))

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({})) as never
  HTMLCanvasElement.prototype.toBlob = function (cb) {
    cb(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }))
  }
})

function makePdfFile(name = 'book.pdf', size = 1024): File {
  const file = new File([new Uint8Array(size)], name, { type: 'application/pdf' })
  return file
}

interface Harness {
  store: AppStore
  postBook: ReturnType<typeof vi.fn>
  result: RenderResult
}

function renderUpload(postBookImpl?: (...args: unknown[]) => Promise<unknown>): Harness {
  const postBook = vi.fn(postBookImpl ?? (() => Promise.resolve()))
  const transport = {
    invoke: (method: string, ...args: unknown[]) =>
      method === 'postBook' ? postBook(...args) : Promise.resolve(),
  }
  const apiClient = new ApiClient(transport as never)
  const store = createAppStore({ apiClient })
  const result = render(
    <Provider store={store}>
      <Upload />
    </Provider>
  )
  return { store, postBook, result }
}

function selectFile(file: File): void {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

describe('Upload', () => {
  it('rejects non-PDF files with a validation error', () => {
    renderUpload()
    selectFile(new File(['hi'], 'note.txt', { type: 'text/plain' }))
    expect(screen.getByText('Only PDF files are allowed.')).toBeInTheDocument()
  })

  it('rejects files >= 10MB', () => {
    renderUpload()
    selectFile(makePdfFile('big.pdf', 10 * 1024 * 1024))
    expect(screen.getByText('File must be smaller than 10MB.')).toBeInTheDocument()
  })

  it('uploads a valid PDF via apiClient.postBook', async () => {
    const { postBook } = renderUpload()
    selectFile(makePdfFile('book.pdf', 2048))

    await waitFor(() => expect(postBook).toHaveBeenCalledTimes(1))
    const [buffer, fileName, previewBuffer] = postBook.mock.calls[0]
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(fileName).toBe('book.pdf')
    expect(previewBuffer).toBeInstanceOf(ArrayBuffer)
  })

  it('shows the error message when the mutation rejects', async () => {
    renderUpload(() => Promise.reject(new Error('boom')))
    selectFile(makePdfFile())
    expect(await screen.findByText('Error: boom')).toBeInTheDocument()
  })
})
