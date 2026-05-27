import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import Upload, { type UploadPayload } from '@web/ui/Upload'

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

function selectFile(file: File): void {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

describe('Upload', () => {
  it('rejects non-PDF files with a validation error', () => {
    render(<Upload onUpload={vi.fn()} />)
    selectFile(new File(['hi'], 'note.txt', { type: 'text/plain' }))
    expect(screen.getByText('Only PDF files are allowed.')).toBeInTheDocument()
  })

  it('rejects files >= 10MB', () => {
    render(<Upload onUpload={vi.fn()} />)
    selectFile(makePdfFile('big.pdf', 10 * 1024 * 1024))
    expect(screen.getByText('File must be smaller than 10MB.')).toBeInTheDocument()
  })

  it('calls onUpload with buffers and filename for a valid PDF', async () => {
    const onUpload = vi.fn((_payload: UploadPayload) => Promise.resolve())
    render(<Upload onUpload={onUpload} />)
    selectFile(makePdfFile('book.pdf', 2048))

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1))
    const [{ buffer, fileName, previewBuffer }] = onUpload.mock.calls[0]
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(fileName).toBe('book.pdf')
    expect(previewBuffer).toBeInstanceOf(ArrayBuffer)
  })

  it('renders errorMessage when provided', () => {
    render(<Upload onUpload={vi.fn()} errorMessage="Error: boom" />)
    expect(screen.getByText('Error: boom')).toBeInTheDocument()
  })
})
