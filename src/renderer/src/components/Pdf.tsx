import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export function Pdf(): JSX.Element {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(Number(localStorage.getItem('currentPage')) || 1)

  useEffect(() => {
    localStorage.setItem('currentPage', `${pageNumber}`)
  }, [pageNumber])

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
          Prev
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button
          onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
        >
          Next
        </button>
      </div>
      <Document
        file="/Carrie.pdf"
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages)
        }}
      >
        <Page pageNumber={pageNumber} scale={1.5} />
      </Document>
    </main>
  )
}
