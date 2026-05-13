import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { File } from 'react-pdf/dist/shared/types.js'
import { Document, Page, pdfjs } from 'react-pdf'
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

interface PdfViewerProps {
  file: File
  defaultPage?: number
}

type PageDim = { w: number; h: number }
const PAGE_GAP = 4
const OVERSCAN = 2

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

  // virtualisation
  const [pageDims, setPageDims] = useState<PageDim[]>([])
  const [range, setRange] = useState<[number, number]>([0, 0])
  const { offsets, totalHeight } = useMemo(() => {
    if (!pageWidth || pageDims.length === 0) {
      return { offsets: [] as number[], totalHeight: 0 }
    }

    const offs = new Array<number>(pageDims.length)
    let cursor = 0
    for (let i = 0; i < pageDims.length; i++) {
      offs[i] = cursor
      const h = pageDims[i].h * (pageWidth / pageDims[i].w)
      cursor += h + PAGE_GAP
    }
    return { offsets: offs, totalHeight: cursor }
  }, [pageDims, pageWidth])
  const scaledHeight = (i: number): number => pageDims[i].h * (pageWidth! / pageDims[i].w)
  const findFirstVisible = useCallback(
    (scrollTop: number): number => {
      let lo = 0
      let hi = offsets.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        const bottom = offsets[mid] + scaledHeight(mid)
        if (bottom <= scrollTop) {
          lo = mid + 1
        } else {
          hi = mid
        }
      }
      return lo
    },
    [offsets, pageDims, pageWidth]
  )
  const recomputeRange = useCallback(() => {
    const c = containerRef.current
    if (!c || offsets.length === 0) return
    const start = Math.max(0, findFirstVisible(c.scrollTop) - OVERSCAN)
    let end = start
    while (end < offsets.length - 1 && offsets[end] < c.scrollTop + c.clientHeight) {
      end++
    }
    end = Math.min(offsets.length - 1, end + OVERSCAN)
    setRange(prev => (prev[0] === start && prev[1] === end ? prev : [start, end]))

    const mid = c.scrollTop + c.clientHeight / 2
    const idx = findFirstVisible(mid)
    setCurrentPage(idx + 1)
  }, [offsets, findFirstVisible])

  useEffect(() => {
    const c = containerRef.current
    if (!c) return
    recomputeRange()
    const onScroll = (): void => recomputeRange()
    c.addEventListener('scroll', onScroll, { passive: true })
    return () => c.removeEventListener('scroll', onScroll)
  }, [recomputeRange])

  useEffect(() => {
    recomputeRange()
  }, [totalHeight, recomputeRange])

  const didInitialScroll = useRef(false)
  useEffect(() => {
    if (didInitialScroll.current) return
    if (offsets.length === 0 || !containerRef.current) return
    scrollToPage(defaultPage, 'instant')
    didInitialScroll.current = true
    // also seed currentPageBeforeChange so zoom restore works on first interaction
    currentPageBeforeChange.current = defaultPage
  }, [offsets, defaultPage])

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  // virtualisation ends

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      currentPageBeforeChange.current = currentPageRef.current
      setThrottledContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [setThrottledContainerWidth])

  useEffect(() => {
    if (offsets.length === 0) return
    const idx = currentPageBeforeChange.current - 1
    const c = containerRef.current
    if (!c || offsets[idx] === undefined) return
    c.scrollTo({ top: offsets[idx], behavior: 'smooth' })
  }, [scale, containerWidth, offsets])

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
    const c = containerRef.current
    if (!c || offsets[idx] === undefined) return
    c.scrollTo({ top: offsets[idx], behavior: behaviour })
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
          overflow: 'auto',
          background: '#525659',
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 'min-content',
          }}
        >
          <Document
            file={file}
            options={PDF_OPTIONS}
            onLoadSuccess={async pdf => {
              setNumPages(pdf.numPages)
              pageRefs.current = new Array(pdf.numPages).fill(null)

              const dims: PageDim[] = new Array(pdf.numPages)
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i)
                const vp = page.getViewport({ scale: 1 })
                dims[i - 1] = { w: vp.width, h: vp.height }
              }

              setPageDims(dims)
            }}
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
                      height: scaledHeight(i),
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
