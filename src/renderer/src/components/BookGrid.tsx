import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@renderer/store'
import { setSelectedBookId } from '@renderer/store/selectedBook'
import type { BookDto } from '@shared/types'

interface Props {
  books: BookDto[]
}

export function BookGrid({ books }: Props): JSX.Element | null {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  if (books.length === 0) return null

  return (
    <div className="mt-8 grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {books.map(book => (
        <img
          key={book.id}
          src={book.previewUrl}
          onDoubleClick={() => {
            dispatch(setSelectedBookId(book.id))
            navigate('/pdf-notes')
          }}
          alt={book.id}
          className="w-full aspect-3/4 object-cover rounded-md border border-[#e0e0e0]"
        />
      ))}
    </div>
  )
}
