import { useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

const MAX_FILE_SIZE = 2 * 1024 * 1024

type UploadStatus = 'idle' | 'generating' | 'uploading' | 'success' | 'error'

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

export default function Upload({ onUploadSuccess }: { onUploadSuccess?: () => void }): JSX.Element {
  const [validationError, setValidationError] = useState<string | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validateAndSetFile(selected: File): boolean {
    setValidationError(null)
    setUploadError(null)
    setStatus('idle')

    if (selected.type !== 'application/pdf') {
      setValidationError('Only PDF files are allowed.')
      return false
    }

    if (selected.size >= MAX_FILE_SIZE) {
      setValidationError('File must be smaller than 2MB.')
      return false
    }
    return true
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!validateAndSetFile(selected)) return

    handleUpload(selected)
  }

  async function handleUpload(file: File): Promise<void> {
    if (!file) return

    setStatus('uploading')
    setUploadError(null)

    try {
      const buffer = await file.arrayBuffer()
      const previewBuffer = await renderFirstPagePreview(buffer.slice(0))
      console.log('buffer', buffer)
      console.log('previewBuffer', previewBuffer)
      await window.api.postBook(buffer, file.name, previewBuffer)
      setStatus('success')
      onUploadSuccess?.()
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setStatus('error')
      setUploadError(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  const isUploading = status === 'uploading'

  return (
    <div>
      <button onClick={() => inputRef.current?.click()} className="btn border">
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

      {uploadError && <p className="text-error mb-3 text-[0.9rem]">{uploadError}</p>}

      {status === 'success' && (
        <p className="text-success mb-3 text-[0.9rem]">File uploaded successfully.</p>
      )}

      {isUploading && <div>Uploading...</div>}
    </div>
  )
}
