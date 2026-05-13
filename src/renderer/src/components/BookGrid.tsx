import { useState, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@renderer/store'
import { setSelectedBookId } from '@renderer/store/selectedBook'
import type { BookDto } from '@shared/types'
import { BookContextMenu } from './BookContextMenu'

interface Props {
  books: BookDto[]
}

interface CtxMenu {
  book: BookDto
  x: number
  y: number
}

export function BookGrid({ books }: Props): JSX.Element | null {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null)

  if (books.length === 0) return null

  return (
    <>
      <div className="mt-8 grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
        {books.map(book => (
          <div
            onContextMenu={e => {
              e.preventDefault()
              setCtxMenu({ book, x: e.clientX, y: e.clientY })
            }}
            className="cursor-pointer flex flex-col gap-0.5"
            key={book.id}
          >
            <img
              src={book.s3PreviewKeyUrl}
              onDoubleClick={() => {
                dispatch(setSelectedBookId(book.id))
                navigate('/pdf-notes')
              }}
              alt={book.id}
              className="w-full aspect-3/4 object-cover rounded-md border border-[#e0e0e0]"
            />
            <div className="text-center">{book.fileName}</div>
          </div>
        ))}
      </div>
      {ctxMenu && (
        <BookContextMenu
          book={ctxMenu.book}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  )
}
