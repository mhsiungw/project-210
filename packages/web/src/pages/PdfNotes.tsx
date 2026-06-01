import { useState, useEffect, useRef, useCallback, type JSX } from 'react'
import { useParams } from 'react-router-dom'
import { useGetBooksQuery, usePutBookMutation } from '@web/store/api/book'
import { useGetTranslationQuery, usePostTranslationMutation } from '@web/store/api/translation'
import { PdfViewer } from '@web/ui/pdf-viewer'
import { shouldPersistPage } from '@web/ui/pdf-viewer/shouldPersistPage'
import { useSaveOnExit } from '@web/ui/hooks/useSaveOnExit'
import { beaconSaveBook, beaconSaveTranslation } from '@web/service/beacon'

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
  const [putBook] = usePutBookMutation()
  const [draftText, setDraftText] = useState('')

  // Latest reading position reported by the viewer. null until the PDF loads
  // and the user scrolls; shouldPersistPage treats null as "nothing to save".
  const pageRef = useRef<number | null>(null)

  // Seed draft from DB on initial load only (keyed on id, not text, so typing doesn't reset)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftText(savedTranslation?.text ?? '')
  }, [savedTranslation?.id, savedTranslation?.text])

  // Page-alive exit (in-app nav): RTK mutations keep caches correct.
  const save = useCallback(async (): Promise<void> => {
    if (!bookId) return
    const tasks: Promise<unknown>[] = [postTranslation({ bookId, text: draftText })]
    if (book && shouldPersistPage(pageRef.current, book.currentPage || 1)) {
      tasks.push(putBook({ ...book, currentPage: pageRef.current as number }))
    }
    await Promise.all(tasks)
  }, [bookId, draftText, book, postTranslation, putBook])

  // Teardown exit (tab close / refresh): synchronous keepalive beacons, because
  // the async RTK path never completes once the page starts unloading.
  const flush = useCallback((): void => {
    if (!bookId) return
    beaconSaveTranslation(bookId, draftText)
    if (book && shouldPersistPage(pageRef.current, book.currentPage || 1)) {
      beaconSaveBook({ ...book, currentPage: pageRef.current as number })
    }
  }, [bookId, draftText, book])

  useSaveOnExit(save, flush)

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
          <PdfViewer
            url={book?.s3KeyUrl}
            defaultPage={book?.currentPage || 1}
            onPageChange={page => {
              pageRef.current = page
            }}
          />
        )}
      </div>
    </div>
  )
}
