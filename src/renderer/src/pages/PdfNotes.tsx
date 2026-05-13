import { useState, useEffect, JSX } from 'react'
import { useBlocker } from 'react-router-dom'
import { useAppSelector } from '@renderer/store'
import { useGetBooksQuery } from '@renderer/store/api/book'
import { useGetTranslationQuery, usePostTranslationMutation } from '@renderer/store/api/translation'
import { PdfViewer } from '@renderer/components/pdf-viewer'

export function PdfNotes(): JSX.Element {
  const selectedBookId = useAppSelector(state => state.selectedBook.id)

  const { book } = useGetBooksQuery(undefined, {
    selectFromResult: ({ data }) => ({
      book: data?.find(b => b.id === selectedBookId),
    }),
  })

  const { data: savedTranslation } = useGetTranslationQuery(selectedBookId ?? '', {
    skip: !selectedBookId,
  })

  const [postTranslation] = usePostTranslationMutation()
  const [draftText, setDraftText] = useState('')
  const [pdfData, setPdfData] = useState(new ArrayBuffer())

  // Seed draft from DB on initial load only (keyed on id, not text, so typing doesn't reset)
  useEffect(() => {
    setDraftText(savedTranslation?.text ?? '')
  }, [savedTranslation?.id, savedTranslation?.text])

  useEffect(() => {
    if (book?.s3KeyUrl) {
      window.api.getPDF(book.s3KeyUrl).then(setPdfData)
    }
  }, [book?.s3KeyUrl])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation !== nextLocation
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    if (!selectedBookId) {
      blocker.proceed()
      return
    }

    postTranslation({ bookId: selectedBookId, text: draftText, id: savedTranslation?.id }).then(
      () => blocker.proceed()
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state])

  return (
    <div className="flex flex-1 gap-4">
      <div className="flex flex-1">
        <textarea
          className="flex-1 rounded p-3 border border-border resize-none outline-none"
          placeholder="Write your notes here..."
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
        />
      </div>
      <div className="flex-1 rounded border border-border p-3 max-w-[calc((100vw-150px)/2)]">
        <PdfViewer file={pdfData} defaultPage={book?.currentPage || 1} />
      </div>
    </div>
  )
}
