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

export default function Upload(): JSX.Element {
  // return <div>123</div>

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
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ marginBottom: '1rem' }}>Upload PDF</h2>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${isDragging ? '#0070f3' : '#ccc'}`,
          borderRadius: 8,
          padding: previewUrl ? '0.75rem' : '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#f0f7ff' : '#fafafa',
          marginBottom: '1rem',
          transition: 'border-color 0.2s, background 0.2s',
          overflow: 'hidden',
        }}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="PDF preview"
              style={{
                maxWidth: '100%',
                borderRadius: 4,
                display: 'block',
                margin: '0 auto 0.5rem',
              }}
            />
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>{file?.name}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#888' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : ''}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, color: '#555' }}>
            {isGenerating ? 'Generating preview…' : 'Drag & drop a PDF here, or click to select'}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {validationError && (
        <p style={{ color: '#d32f2f', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
          {validationError}
        </p>
      )}

      {uploadError && (
        <p style={{ color: '#d32f2f', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{uploadError}</p>
      )}

      {status === 'success' && (
        <p style={{ color: '#2e7d32', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
          File uploaded successfully.
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleUpload}
          disabled={uploadDisabled}
          style={{
            padding: '0.5rem 1.25rem',
            background: uploadDisabled ? '#ccc' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: uploadDisabled ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>

        {(file || status !== 'idle') && (
          <button
            onClick={handleReset}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
