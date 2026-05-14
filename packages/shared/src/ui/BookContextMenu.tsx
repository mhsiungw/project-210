import { useEffect, useRef, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { RiDeleteBinLine } from '@remixicon/react'
import type { BookDto } from '@app/shared/api/types'
import { useDeleteBookMutation } from '@app/shared/store/api/book'

interface Props {
  book: BookDto
  x: number
  y: number
  onClose: () => void
}

export function BookContextMenu({ book, x, y, onClose }: Props): JSX.Element {
  const [deleteBook] = useDeleteBookMutation()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMouseDown = (e: MouseEvent): void => {
      if (!menuRef.current?.contains(e.target as Node)) onClose()
    }
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    const onScroll = (): void => onClose()

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { capture: true })

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [onClose])

  const handleDelete = (): void => {
    deleteBook(book.id)
    onClose()
  }

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', left: x + 4, top: y + 4 }}
      className="flex justify-center items-center gap-2 btn z-50 hover:bg-muted bg-context-menu"
    >
      <RiDeleteBinLine color="rgba(70,146,221,1)" />
      <button onClick={handleDelete}>Delete</button>
    </div>,
    document.body
  )
}
