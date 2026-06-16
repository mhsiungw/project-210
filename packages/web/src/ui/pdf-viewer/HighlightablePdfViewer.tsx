import { useCallback, useRef, useState, type JSX } from 'react'
import { useAppSelector } from '@web/store'
import {
  selectHighlightsByPage,
  useGetHighlightsQuery,
  usePostHighlightMutation,
} from '@web/store/api/highlight'
import { PdfViewer, type PageSize, type PdfViewerHandle, type SelectionCapture } from './index'
import { denormalizeRects } from './geometry'

// Default paint: amber, translucent. No picker UI in v1 (Resolved Decision #4);
// the color column exists so a palette is a later zero-migration change.
const DEFAULT_COLOR = 'rgba(250, 204, 21, 0.4)'

interface Props {
  bookId: string
  url: string
  defaultPage?: number
  onPageChange?: (page: number) => void
}

/**
 * PdfViewer wired to the highlight store: loads a book's highlights, repaints
 * them per page under virtualization, and captures new selections.
 *
 *   selection ─(mouseup)─> popover ─(confirm)─> optimistic POST ─> repaint
 *   stored rects ─(per page render)─> denormalize × page size ─> overlay divs
 */
export function HighlightablePdfViewer({
  bookId,
  url,
  defaultPage,
  onPageChange,
}: Props): JSX.Element {
  useGetHighlightsQuery(bookId)
  const byPage = useAppSelector(selectHighlightsByPage(bookId))
  const [postHighlight] = usePostHighlightMutation()
  const viewerRef = useRef<PdfViewerHandle>(null)
  const [pending, setPending] = useState<SelectionCapture | null>(null)
  const [note, setNote] = useState('')

  const handleCapture = useCallback((capture: SelectionCapture): void => {
    setPending(capture)
    setNote('')
  }, [])

  const dismiss = useCallback((): void => {
    setPending(null)
    setNote('')
  }, [])

  const confirm = useCallback(async (): Promise<void> => {
    if (!pending) return
    const { page, rects, text } = pending
    dismiss()
    window.getSelection()?.removeAllRanges()
    await postHighlight({
      bookId,
      page,
      rects,
      text,
      note: note.trim() || undefined,
      color: DEFAULT_COLOR,
    })
  }, [pending, note, postHighlight, bookId, dismiss])

  // Repaint: overlay is purely visual (pointer-events: none) so it never blocks a
  // new selection. data-highlight-id reserves the seam for later click-to-edit.
  const renderPageOverlay = useCallback(
    (pageNumber: number, size: PageSize): JSX.Element | null => {
      const highlights = byPage.get(pageNumber)
      if (!highlights?.length) return null
      return (
        <div className="absolute inset-0 pointer-events-none">
          {highlights.flatMap(h =>
            denormalizeRects(h.rects, size.width, size.height).map((px, i) => (
              <div
                key={`${h.id}-${i}`}
                data-highlight-id={h.id}
                style={{
                  position: 'absolute',
                  left: px.left,
                  top: px.top,
                  width: px.width,
                  height: px.height,
                  background: h.color ?? DEFAULT_COLOR,
                  borderRadius: 2,
                }}
              />
            ))
          )}
        </div>
      )
    },
    [byPage]
  )

  return (
    <>
      <PdfViewer
        ref={viewerRef}
        url={url}
        defaultPage={defaultPage}
        onPageChange={onPageChange}
        renderPageOverlay={renderPageOverlay}
        onSelectionCapture={handleCapture}
      />
      {pending && (
        <div
          className="fixed z-50 flex flex-col gap-2 rounded border border-border bg-white p-2 shadow-lg"
          style={{
            left: pending.anchor.left,
            top: pending.anchor.top + pending.anchor.height + 4,
          }}
        >
          <input
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="rounded border border-border px-2 py-1 text-sm outline-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={dismiss} className="rounded px-2 py-1 text-sm text-muted">
              Cancel
            </button>
            <button
              onClick={confirm}
              className="rounded bg-amber-300 px-2 py-1 text-sm font-medium"
            >
              Highlight
            </button>
          </div>
        </div>
      )}
    </>
  )
}
