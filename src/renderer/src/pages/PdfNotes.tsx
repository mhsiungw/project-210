import { useState, useEffect, useCallback } from 'react'
import { useBlocker } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { setTranslation } from '@renderer/store/translation'
import { PdfViewer } from '@renderer/components/pdf-viewer'

export function PdfNotes(): JSX.Element {
  const dispatch = useAppDispatch()
  const translation = useAppSelector(state => state.translation)
  const selectedBook = useAppSelector(state => state.selectedBook)
  const { id: bookId, url: selectedBookUrl, current_page } = selectedBook
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation !== nextLocation
  )

  const [pdfData, setPdfData] = useState(new ArrayBuffer())

  useEffect(() => {
    if (selectedBookUrl && typeof selectedBookUrl === 'string') {
      window.api.getPDF(selectedBookUrl).then(setPdfData)
    }
  }, [selectedBookUrl])

  const getTranslation = useCallback(async () => {
    const translation = await window.api.getTranslation(selectedBook.id)

    if (!translation) return

    const { created_at, ...rest } = translation
    dispatch(setTranslation({ ...rest, created_at: created_at.toISOString() }))
  }, [dispatch, selectedBook.id])

  useEffect(() => {
    if (!selectedBookUrl) {
      return
    }

    getTranslation()
  }, [getTranslation, selectedBookUrl])

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (!selectedBookUrl) {
        blocker.proceed()
        return
      }

      window.api.postTranslation(bookId, translation.text || '', translation?.id).then(() => {
        blocker.proceed()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state, selectedBookUrl])

  return (
    <div className="flex flex-1 gap-4 ">
      <div className="flex flex-1">
        <textarea
          className="flex-1 rounded p-3 border border-border resize-none outline-none"
          placeholder="Write your notes here..."
          value={translation.text || ''}
          onChange={e => {
            dispatch(setTranslation({ ...translation, text: e.target.value }))
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
