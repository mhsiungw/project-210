import { useState, useEffect, useCallback } from 'react'
import { useAppSelector } from '@renderer/store'
import { useBlocker } from 'react-router-dom'
import { PdfViewer } from '@renderer/components/pdf-viewer'

export function PdfNotes(): JSX.Element {
  const [translationText, setTranslationText] = useState('')
  const selectedBook = useAppSelector(state => state.selectedBook)
  const { id: bookId, url: selectedBookUrl, current_page } = selectedBook
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation !== nextLocation
  )

  const [pdfData, setPdfData] = useState(new ArrayBuffer())

  useEffect(() => {
    if (typeof selectedBookUrl == 'string') {
      window.api.getPDF(selectedBookUrl).then(setPdfData)
    }
  }, [selectedBookUrl])

  const getTranslation = useCallback(async () => {
    const translation = await window.api.getTranslation(selectedBook.id)
    setTranslationText(translation.text || '')
  }, [selectedBook.id])

  useEffect(() => {
    getTranslation()
  }, [getTranslation])

  useEffect(() => {
    if (blocker.state === 'blocked') {
      window.api.postTranslation(bookId, translationText).then(() => {
        blocker.proceed()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state])

  return (
    <div className="flex flex-1 gap-4">
      <div className="flex flex-1">
        <textarea
          className="flex-1 rounded p-3 border border-border resize-none outline-none"
          placeholder="Write your notes here..."
          value={translationText}
          onChange={e => {
            setTranslationText(e.target.value)
          }}
        />
      </div>
      <div className="flex-1 rounded border border-border p-3 max-w-[calc((100vw-150px)/2)]">
        <PdfViewer file={pdfData} defaultPage={current_page || 1} />
        {/* <Pdf /> */}
      </div>
    </div>
  )
}
