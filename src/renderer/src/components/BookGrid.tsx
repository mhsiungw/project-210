import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@renderer/store'
import { setSelectedBook } from '@renderer/store/selectedBook'
import type { Book } from '@prisma/client'

interface Props {
  books: Book[]
}

export function BookGrid({ books }: Props): JSX.Element | null {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  if (books.length === 0) return null

  return (
    <div className="mt-8 grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {books.map(book => {
        const { id, preview_url } = book
        return (
          <img
            key={id}
            src={preview_url}
            onDoubleClick={() => {
              dispatch(setSelectedBook({ ...book, created_at: book.created_at.toISOString() }))
              navigate('/pdf-notes')
            }}
            alt={id}
            className="w-full aspect-3/4 object-cover rounded-md border border-[#e0e0e0]"
          />
        )
      })}
    </div>
  )
}
