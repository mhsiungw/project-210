import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useAppSelector } from '@renderer/store'
import { setSelectedBook } from '@renderer/store/selectedBook'
import { PdfToolBar } from './PdfToolBar'
import { useAppDispatch } from '@renderer/store'

function useThrottle<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  const lastCall = useRef<number>(0)
  return useCallback(
    (...args: T) => {
      const now = Date.now()
      if (now - lastCall.current >= ms) {
        lastCall.current = now
        fn(...args)
      }
    },
    [fn, ms]
  )
}

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export function Pdf(): JSX.Element {
  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState<number>(1)
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const resizeTimer = useRef<ReturnType<typeof setTimeout>>()
  const pageBeforeResize = useRef(1)
  const currentPageRef = useRef(1)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const throttledPutBook = useThrottle((book: typeof selectedBook) => {
    window.api.putBook(book)
  }, 2000)
  const selectedBook = useAppSelector(state => state.selectedBook)
  const { url: selectedBookUrl, current_page } = selectedBook
  const selectedBookCurrentPage = current_page ?? 1
  const dispatch = useAppDispatch()

  const scrollToPage = (page: number): void => {
    pageRefs.current[page - 1]?.scrollIntoView()
  }

  useEffect(() => {
    if (typeof selectedBookUrl == 'string') {
      window.api.getPDF(selectedBookUrl).then(setPdfData)
    }
  }, [selectedBookUrl])

  useEffect(() => {
    throttledPutBook(selectedBook)
  }, [selectedBook, throttledPutBook])

  useEffect(() => {
    if (numPages === 0) return
    const saved = Number(localStorage.getItem('currentPage')) || 1
    pageRefs.current[saved - 1]?.scrollIntoView()
  }, [numPages])

  useEffect(() => {
    return () => {
      if (!selectedBook.id) {
        return
      }
      window.api.putBook(selectedBook)
    }
  }, [selectedBook])

  useEffect(() => {
    const observers = pageRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (isResizing.current) return
          if (entry.isIntersecting) {
            console.log('%ccurrent_page to be set', 'color: green;', i + 1)
            const nextSelectedBook = { ...selectedBook, current_page: i + 1 }
            dispatch(setSelectedBook(nextSelectedBook))
          }
        },
        { threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })

    return () => observers.forEach(obs => obs?.disconnect())
  }, [numPages])

  useEffect(() => {
    currentPageRef.current = selectedBookCurrentPage
  }, [selectedBookCurrentPage])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      if (!isResizing.current) {
        pageBeforeResize.current = currentPageRef.current
      }
      isResizing.current = true
      clearTimeout(resizeTimer.current)
      resizeTimer.current = setTimeout(() => {
        isResizing.current = false
        scrollToPage(pageBeforeResize.current)
      }, 1000)
      setContainerWidth(() => {
        return entry.contentRect.width
      })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col max-w-[calc((100vw-150px)/2)] h-full overflow-auto relative">
      <div ref={containerRef} />
      <div className="flex items-center gap-4">
        <div>
          <button onClick={() => setScale(p => Math.max(1, parseFloat((p - 0.5).toFixed(1))))}>
            Prev
          </button>
          <span>scale: {scale}</span>
          <button onClick={() => setScale(p => Math.min(2, parseFloat((p + 0.5).toFixed(1))))}>
            Next
          </button>
        </div>
      </div>
      <div>
        <Document
          file={pdfData ? pdfData : null}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages)
          }}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i + 1}
              ref={el => {
                pageRefs.current[i] = el
              }}
            >
              <Page pageNumber={i + 1} width={containerWidth * scale} />
            </div>
          ))}
        </Document>
      </div>
      <div className="sticky bottom-4 z-10 ">
        <PdfToolBar
          currentPage={selectedBookCurrentPage}
          numPages={numPages}
          onPrev={() => scrollToPage(selectedBookCurrentPage - 1)}
          onNext={() => scrollToPage(selectedBookCurrentPage + 1)}
        />
      </div>
    </div>
  )
}
