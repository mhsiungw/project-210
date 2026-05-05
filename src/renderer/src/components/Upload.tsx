import { useEffect, useRef, useState } from 'react'
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
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewBufferRef = useRef<ArrayBuffer | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      previewBufferRef.current = null
      return
    }

    let objectUrl: string | null = null
    setStatus('generating')

    file
      .arrayBuffer()
      .then(buf => renderFirstPagePreview(buf))
      .then(previewBuf => {
        previewBufferRef.current = previewBuf
        const blob = new Blob([previewBuf], { type: 'image/png' })
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
        setStatus('idle')
      })
      .catch(() => {
        setUploadError('Failed to generate preview.')
        setStatus('error')
      })

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  function validateAndSetFile(selected: File): void {
    setValidationError(null)
    setUploadError(null)
    setStatus('idle')
    setPreviewUrl(null)
    previewBufferRef.current = null

    if (selected.type !== 'application/pdf') {
      setValidationError('Only PDF files are allowed.')
      setFile(null)
      return
    }

    if (selected.size >= MAX_FILE_SIZE) {
      setValidationError('File must be smaller than 2MB.')
      setFile(null)
      return
    }

    setFile(selected)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const selected = e.target.files?.[0]
    if (selected) validateAndSetFile(selected)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) validateAndSetFile(dropped)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(): void {
    setIsDragging(false)
  }

  async function handleUpload(): Promise<void> {
    if (!file || !previewBufferRef.current) return

    setStatus('uploading')
    setUploadError(null)

    try {
      const buffer = await file.arrayBuffer()
      await window.api.uploadToS3(buffer, file.name, previewBufferRef.current)
      setStatus('success')
      setFile(null)
      onUploadSuccess?.()
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setStatus('error')
      setUploadError(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  function handleReset(): void {
    setFile(null)
    setValidationError(null)
    setUploadError(null)
    setStatus('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  const isGenerating = status === 'generating'
  const isUploading = status === 'uploading'
  const uploadDisabled = !file || isGenerating || isUploading || !previewBufferRef.current

  return (
    <div className="max-w-120">
      <h2 className="mb-4">Upload PDF</h2>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'border-2 border-dashed rounded-lg text-center cursor-pointer mb-4 overflow-hidden transition-[border-color,background] duration-200',
          isDragging ? 'border-primary bg-[#f0f7ff]' : 'border-border bg-[#fafafa]',
          previewUrl ? 'p-3' : 'p-8',
        ].join(' ')}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="PDF preview"
              className="max-w-full rounded block mx-auto mb-2"
            />
            <p className="m-0 text-[0.85rem] text-muted">{file?.name}</p>
            <p className="mt-1 m-0 text-[0.8rem] text-[#888]">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : ''}
            </p>
          </>
        ) : (
          <p className="m-0 text-muted">
            {isGenerating ? 'Generating preview…' : 'Drag & drop a PDF here, or click to select'}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {validationError && <p className="text-error mb-3 text-[0.9rem]">{validationError}</p>}

      {uploadError && <p className="text-error mb-3 text-[0.9rem]">{uploadError}</p>}

      {status === 'success' && (
        <p className="text-success mb-3 text-[0.9rem]">File uploaded successfully.</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={uploadDisabled}
          className={[
            'px-5 py-2 text-white border-none rounded-md font-semibold',
            uploadDisabled ? 'bg-bordercursor-not-allowed' : 'bg-primary cursor-pointer',
          ].join(' ')}
        >
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>

        {(file || status !== 'idle') && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-transparent border border-borderrounded-md cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
