import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export function Pdf(): JSX.Element {
  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState<number>(1)

  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (numPages === 0) return
    const saved = Number(localStorage.getItem('currentPage')) || 1
    pageRefs.current[saved - 1]?.scrollIntoView()
  })

  useEffect(() => {
    const observers = pageRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) localStorage.setItem('currentPage', String(i + 1))
        },
        { threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })

    return () => observers.forEach(obs => obs?.disconnect())
  })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) =>
      setContainerWidth(() => {
        console.log(entry.contentRect.width)
        return entry.contentRect.width
      })
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col max-w-[calc((100vw-150px)/2)] h-full overflow-auto">
      <div ref={containerRef} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
      <Document
        file="/Carrie.pdf"
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
  )
}
