import { useState, useEffect, type JSX } from 'react'
import { useBlocker, useParams } from 'react-router-dom'
import { useGetBooksQuery } from '@web/store/api/book'
import { useGetTranslationQuery, usePostTranslationMutation } from '@web/store/api/translation'
import { PdfViewer } from '@app/ui/pdf-viewer'

export function PdfNotes(): JSX.Element {
  const { bookId } = useParams<{ userId: string; bookId: string }>()

  const { book } = useGetBooksQuery(undefined, {
    selectFromResult: ({ data }) => ({
      book: data?.find(b => b.id === bookId),
    }),
  })

  const { data: savedTranslation } = useGetTranslationQuery(bookId ?? '', {
    skip: !bookId,
  })

  const [postTranslation] = usePostTranslationMutation()
  const [draftText, setDraftText] = useState('')

  // Seed draft from DB on initial load only (keyed on id, not text, so typing doesn't reset)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftText(savedTranslation?.text ?? '')
  }, [savedTranslation?.id, savedTranslation?.text])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation !== nextLocation
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    if (!bookId) {
      blocker.proceed()
      return
    }

    const save = async (): Promise<void> => {
      await postTranslation({ bookId, text: draftText })
      blocker.proceed()
    }
    save()
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
        {book?.s3KeyUrl && typeof book?.s3KeyUrl === 'string' && (
          <PdfViewer url={book?.s3KeyUrl} defaultPage={book?.currentPage || 1} />
        )}
      </div>
    </div>
  )
}
