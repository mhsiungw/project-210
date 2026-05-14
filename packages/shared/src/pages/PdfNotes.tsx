import { useState, useEffect, type JSX } from 'react'
import { useBlocker } from 'react-router-dom'
import { useApiClient } from '@app/shared/client/context'
import { useAppSelector } from '@app/shared/store'
import { useGetBooksQuery } from '@app/shared/store/api/book'
import {
  useGetTranslationQuery,
  usePostTranslationMutation,
} from '@app/shared/store/api/translation'
import { PdfViewer } from '@app/shared/ui/pdf-viewer'

export function PdfNotes(): JSX.Element {
  const apiClient = useApiClient()
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftText(savedTranslation?.text ?? '')
  }, [savedTranslation?.id, savedTranslation?.text])

  useEffect(() => {
    if (book?.s3KeyUrl) {
      apiClient.getPDF(book.s3KeyUrl).then(setPdfData)
    }
  }, [book?.s3KeyUrl, apiClient])

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
