import { useRef, useState, JSX } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { usePostBookMutation } from '@renderer/store/api/book'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

const MAX_FILE_SIZE = 10 * 1024 * 1024

async function renderFirstPagePreview(pdfBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1 })
  const scale = Math.min(800 / viewport.width, 2)
  const scaledViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = scaledViewport.width
  canvas.height = scaledViewport.height
  await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: scaledViewport })
    .promise

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob =>
        blob
          ? blob.arrayBuffer().then(resolve).catch(reject)
          : reject(new Error('Canvas export failed')),
      'image/png'
    )
  })
}

export default function Upload(): JSX.Element {
  const [postBook, { isLoading, isError, error }] = usePostBookMutation()
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File): boolean {
    setValidationError(null)
    if (file.type !== 'application/pdf') {
      setValidationError('Only PDF files are allowed.')
      return false
    }
    if (file.size >= MAX_FILE_SIZE) {
      setValidationError('File must be smaller than 10MB.')
      return false
    }
    return true
  }

  async function handleUpload(file: File): Promise<void> {
    const buffer = await file.arrayBuffer()
    const previewBuffer = await renderFirstPagePreview(buffer.slice(0))
    await postBook({ buffer, fileName: file.name, previewBuffer })
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const selected = e.target.files?.[0]
    if (!selected || !validateFile(selected)) return
    handleUpload(selected)
  }

  return (
    <div>
      <button onClick={() => inputRef.current?.click()} className="btn border" disabled={isLoading}>
        <p>Upload</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </button>

      {validationError && <p className="text-error mb-3 text-[0.9rem]">{validationError}</p>}
      {isError && (
        <p className="text-error mb-3 text-[0.9rem]">
          {error instanceof Error ? error.message : 'Upload failed.'}
        </p>
      )}
    </div>
  )
}
