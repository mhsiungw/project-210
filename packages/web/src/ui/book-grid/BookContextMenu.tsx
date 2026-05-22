import type { JSX } from 'react'
import { RiDeleteBinLine } from '@remixicon/react'
import type { BookDto } from '@app/db/dto'
import { useDeleteBookMutation } from '@web/store/api/book'
import { ContextMenu } from '@app/ui'

interface Props {
  book: BookDto
  x: number
  y: number
  onClose: () => void
}

export function BookContextMenu({ book, x, y, onClose }: Props): JSX.Element {
  const [deleteBook] = useDeleteBookMutation()

  const handleDelete = (): void => {
    deleteBook(book.id)
    onClose()
  }

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <button onClick={handleDelete} className="flex justify-center items-center gap-2 btn p-2">
        <RiDeleteBinLine className="text-accent" />
        <span>Delete</span>
      </button>
    </ContextMenu>
  )
}
