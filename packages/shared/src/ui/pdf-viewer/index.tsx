import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { File } from 'react-pdf/dist/shared/types.js'
import { Document, Page, pdfjs } from 'react-pdf'
import { useThrottle } from '../hooks/useThrottle'
import { PdfToolbar } from './PdfToolbar'
import { usePdfVirtualizer, type PageDim } from './usePdfVirtualizer'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const PDF_OPTIONS = { wasmUrl: new URL('./wasm/', location.href).href }

const SCALE_STEP = 0.1
const SCALE_MIN = 0.5
const SCALE_MAX = 2.0
const DEFAULT_SCALE = 1.0

interface PdfViewerProps {
  file: File
  defaultPage?: number
}

export function PdfViewer({ file, defaultPage = 1 }: PdfViewerProps): JSX.Element {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [containerWidth, setContainerWidth] = useState(0)
  const pageWidth = containerWidth > 0 ? containerWidth * scale : undefined
  const setThrottledContainerWidth = useThrottle(setContainerWidth, 700)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  const {
    pageDims,
    setPageDims,
    range,
    offsets,
    totalHeight,
    scaledHeights,
    scrollToPage,
    currentPage,
    captureCurrentPage,
  } = usePdfVirtualizer({ defaultPage, containerRef, pageWidth })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      captureCurrentPage()
      setThrottledContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [setThrottledContainerWidth, captureCurrentPage])

  const handleScaleDown = (): void => {
    captureCurrentPage()
    setScale(s => Math.max(SCALE_MIN, parseFloat((s - SCALE_STEP).toFixed(2))))
  }

  const handleScaleUp = (): void => {
    captureCurrentPage()
    setScale(s => Math.min(SCALE_MAX, parseFloat((s + SCALE_STEP).toFixed(2))))
  }

  const handlePrev = (): void => {
    if (currentPage > 1) scrollToPage(currentPage - 1)
  }

  const handleNext = (): void => {
    if (currentPage < numPages) scrollToPage(currentPage + 1)
  }

  const handleLoadSuccess = useCallback(
    async (pdf: PDFDocumentProxy) => {
      setNumPages(pdf.numPages)
      pageRefs.current = new Array(pdf.numPages).fill(null)

      const dims: PageDim[] = new Array(pdf.numPages)
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 1 })
        dims[i - 1] = { w: vp.width, h: vp.height }
      }

      setPageDims(dims)
    },
    [setPageDims]
  )

  return (
    <div className="flex flex-col w-full h-full relative">
      <div ref={containerRef} className="overflow-auto bg-[#525659] pb-20">
        <div className="flex flex-col items-center min-w-min">
          <Document
            file={file}
            options={PDF_OPTIONS}
            onLoadSuccess={handleLoadSuccess}
            loading={<div style={{ color: '#fff', padding: 32 }}>Loading PDF…</div>}
            error={<div style={{ color: '#faa', padding: 32 }}>Failed to load PDF.</div>}
          >
            <div style={{ position: 'relative', height: totalHeight, width: pageWidth }}>
              {pageDims.map((_, i) => {
                const inWindow = i >= range[0] && i <= range[1]
                return (
                  <div
                    key={i}
                    ref={el => {
                      pageRefs.current[i] = el
                    }}
                    style={{
                      position: 'absolute',
                      top: offsets[i],
                      left: 0,
                      width: pageWidth,
                      height: scaledHeights[i],
                    }}
                  >
                    {inWindow && (
                      <Page
                        pageNumber={i + 1}
                        width={pageWidth}
                        renderAnnotationLayer
                        renderTextLayer
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </Document>
        </div>
      </div>

      <PdfToolbar
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        scaleMin={SCALE_MIN}
        scaleMax={SCALE_MAX}
        onPrev={handlePrev}
        onNext={handleNext}
        onScaleDown={handleScaleDown}
        onScaleUp={handleScaleUp}
      />
    </div>
  )
}
