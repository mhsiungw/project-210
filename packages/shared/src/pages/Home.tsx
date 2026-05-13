import type { JSX } from 'react'
import Upload from '../features/books/Upload'
import { BookGrid } from '../features/books/BookGrid'
import { useGetBooksQuery } from '../features/books/api'

export function Home(): JSX.Element {
  const { data: books = [] } = useGetBooksQuery()

  return (
    <div>
      <Upload />
      <BookGrid books={books} />
    </div>
  )
}
