import { useState, useEffect, useCallback } from 'react'
import { useAppSelector } from '@renderer/store'
import { useBlocker } from 'react-router-dom'
import { Pdf } from '../components/Pdf'

export function PdfNotes(): JSX.Element {
  const [translationText, setTranslationText] = useState('')
  const selectedBook = useAppSelector(state => state.selectedBook)
  const { id: bookId } = selectedBook
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation !== nextLocation
  )

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
      <div className="flex-1 rounded border border-border p-3">
        <Pdf />
      </div>
    </div>
  )
}
