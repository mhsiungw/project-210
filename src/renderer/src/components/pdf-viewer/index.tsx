import { useCallback, useEffect, useRef, useState } from 'react'
import { File } from 'react-pdf/dist/shared/types.js'
import { Document, Page, pdfjs } from 'react-pdf'
import { useThrottle } from '@renderer/hooks'
import { PdfToolbar } from './pdfToolbar'

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
  const [currentPage, setCurrentPage] = useState(defaultPage)
  const currentPageRef = useRef(currentPage)
  const currentPageBeforeChange = useRef(defaultPage)
  const [containerWidth, setContainerWidth] = useState(0)
  const pageWidth = containerWidth > 0 ? containerWidth * scale : undefined
  const setThrottledContainerWidth = useThrottle(setContainerWidth, 700)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)

  const rafId = useRef<number | null>(null)
  const isRestoring = useRef(false)

  //   useEffect(() => {
  //   setNumPages(0)
  //   setCurrentPage(defaultPage)
  //   pageRefs.current = []
  //   observerRef.current?.disconnect()
  //   observerRef.current = null
  //   currentPageBeforeChange.current = defaultPage
  //   }, [file, defaultPage])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      currentPageBeforeChange.current = currentPageRef.current
      setThrottledContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [setThrottledContainerWidth])

  // Intersection observer to determine current page
  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const ratios = new Map<number, number>()

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const idx = pageRefs.current.indexOf(entry.target as HTMLDivElement)
          if (idx !== -1) {
            ratios.set(idx, entry.intersectionRatio)
          }
        })

        let maxRatio = -1
        let bestIdx = 0
        ratios.forEach((ratio, idx) => {
          if (ratio > maxRatio) {
            maxRatio = ratio
            bestIdx = idx
          }
        })

        if (maxRatio > 0) {
          setCurrentPage(bestIdx + 1)
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    pageRefs.current.forEach(ref => {
      if (ref) observerRef.current!.observe(ref)
    })
  }, [])

  // Re-setup observer when pages change
  useEffect(() => {
    if (numPages > 0) {
      setupIntersectionObserver()
    }
    return () => observerRef.current?.disconnect()
  }, [numPages, setupIntersectionObserver, defaultPage])

  useEffect(() => {
    if (isRestoring.current || numPages === 0) return
    if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    const idx = currentPageBeforeChange.current - 1

    const c = containerRef.current
    const p = pageRefs.current[idx]
    if (!c || !p) return
    isRestoring.current = true
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      c.scrollTo({
        top: p.offsetTop,
        behavior: 'smooth',
      })
      isRestoring.current = false
    })
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [scale, containerWidth, numPages])

  const handleScaleDown = (): void => {
    currentPageBeforeChange.current = currentPage
    setScale(s => Math.max(SCALE_MIN, parseFloat((s - SCALE_STEP).toFixed(2))))
  }

  const handleScaleUp = (): void => {
    currentPageBeforeChange.current = currentPage
    setScale(s => Math.min(SCALE_MAX, parseFloat((s + SCALE_STEP).toFixed(2))))
  }

  const scrollToPage = (pageNum: number, behaviour: ScrollBehavior = 'smooth'): void => {
    const idx = pageNum - 1
    const ref = pageRefs.current[idx]
    if (ref && containerRef.current) {
      containerRef.current.scrollTo({
        top: ref.offsetTop,
        behavior: behaviour,
      })
    }
  }

  const handlePrev = (): void => {
    if (currentPage > 1) scrollToPage(currentPage - 1)
  }

  const handleNext = (): void => {
    if (currentPage < numPages) scrollToPage(currentPage + 1)
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#525659',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: 80,
        }}
      >
        <Document
          file={file}
          options={PDF_OPTIONS}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages)
            pageRefs.current = new Array(numPages).fill(null)
          }}
          loading={<div style={{ color: '#fff', padding: 32 }}>Loading PDF…</div>}
          error={<div style={{ color: '#faa', padding: 32 }}>Failed to load PDF.</div>}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              ref={el => {
                pageRefs.current[i] = el
              }}
              style={{ margin: '8px 0' }}
            >
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                renderAnnotationLayer
                renderTextLayer
                onRenderSuccess={page => {
                  if (page.pageNumber === defaultPage) {
                    scrollToPage(defaultPage, 'instant')
                  }
                }}
              />
            </div>
          ))}
        </Document>
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
