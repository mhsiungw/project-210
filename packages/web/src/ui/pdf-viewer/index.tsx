import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { Document, Page, pdfjs } from 'react-pdf'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useThrottle } from '../hooks/useThrottle'
import { PdfToolbar } from './PdfToolbar'

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
const PAGE_GAP = 4
const OVERSCAN = 2

type PageDim = { w: number; h: number }

interface PdfViewerProps {
  url: string
  defaultPage?: number
  onPageChange?: (page: number) => void
}

export function PdfViewer({ url, defaultPage = 1, onPageChange }: PdfViewerProps): JSX.Element {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [containerWidth, setContainerWidth] = useState(0)
  const [pageDims, setPageDims] = useState<PageDim[]>([])
  const [currentPage, setCurrentPage] = useState(defaultPage)

  const pageWidth = containerWidth > 0 ? containerWidth * scale : undefined
  const setThrottledContainerWidth = useThrottle(setContainerWidth, 700)

  const containerRef = useRef<HTMLDivElement>(null)
  const currentPageRef = useRef(defaultPage)
  const onPageChangeRef = useRef(onPageChange)
  useEffect(() => {
    onPageChangeRef.current = onPageChange
  }, [onPageChange])
  const didInitialScroll = useRef(false)
  const isLayoutChanging = useRef(false)

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: pageDims.length,
    getScrollElement: () => containerRef.current,
    estimateSize: i => {
      if (!pageWidth) return 0
      return pageDims[i].h * (pageWidth / pageDims[i].w) + PAGE_GAP
    },
    overscan: OVERSCAN,
    onChange: instance => {
      if (isLayoutChanging.current) return
      const offset = instance.scrollOffset ?? 0
      const height = instance.scrollRect?.height ?? 0
      const mid = offset + height / 2
      const items = instance.getVirtualItems()
      const hit = items.find(it => it.start <= mid && mid < it.end)
      if (hit) {
        const page = hit.index + 1
        currentPageRef.current = page
        setCurrentPage(page)
        onPageChangeRef.current?.(page)
      }
    },
  })

  const scrollToPage = useCallback(
    (pageNum: number, behavior: ScrollBehavior = 'smooth'): void => {
      if (pageNum < 1 || pageNum > pageDims.length) return
      virtualizer.scrollToIndex(pageNum - 1, { align: 'start', behavior })
    },
    [virtualizer, pageDims.length]
  )

  useEffect(() => {
    if (didInitialScroll.current) return
    if (pageDims.length === 0 || !containerRef.current || !pageWidth) return
    scrollToPage(defaultPage, 'instant')
    didInitialScroll.current = true
  }, [pageDims.length, pageWidth, defaultPage, scrollToPage])

  // restore scroll position after zoom or container resize
  useEffect(() => {
    if (pageDims.length === 0 || !didInitialScroll.current) return
    virtualizer.measure()
    scrollToPage(currentPageRef.current, 'instant')
    isLayoutChanging.current = false
  }, [pageWidth, pageDims.length, virtualizer, scrollToPage])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      isLayoutChanging.current = true
      setThrottledContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [setThrottledContainerWidth])

  const handleScaleDown = (): void => {
    isLayoutChanging.current = true
    setScale(s => Math.max(SCALE_MIN, parseFloat((s - SCALE_STEP).toFixed(2))))
  }

  const handleScaleUp = (): void => {
    isLayoutChanging.current = true
    setScale(s => Math.min(SCALE_MAX, parseFloat((s + SCALE_STEP).toFixed(2))))
  }

  const handlePrev = (): void => {
    if (currentPage > 1) scrollToPage(currentPage - 1)
  }

  const handleNext = (): void => {
    if (currentPage < numPages) scrollToPage(currentPage + 1)
  }

  const handleLoadSuccess = useCallback(async (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages)
    const dims: PageDim[] = new Array(pdf.numPages)
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const vp = page.getViewport({ scale: 1 })
      dims[i - 1] = { w: vp.width, h: vp.height }
    }
    setPageDims(dims)
  }, [])

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div className="flex flex-col w-full h-full relative">
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto bg-reader-canvas pb-20">
        <div className="flex flex-col items-center min-w-min">
          <Document
            file={url}
            options={PDF_OPTIONS}
            onLoadSuccess={handleLoadSuccess}
            loading={<div className="text-white p-8">Loading PDF…</div>}
            error={<div className="text-error p-8">Failed to load PDF.</div>}
          >
            <div
              style={{
                position: 'relative',
                height: virtualizer.getTotalSize(),
                width: pageWidth,
              }}
            >
              {virtualItems.map(item => (
                <div
                  key={item.key}
                  style={{
                    position: 'absolute',
                    top: item.start,
                    left: 0,
                    width: pageWidth,
                    height: item.size - PAGE_GAP,
                  }}
                >
                  <Page
                    pageNumber={item.index + 1}
                    width={pageWidth}
                    renderAnnotationLayer
                    renderTextLayer
                  />
                </div>
              ))}
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
