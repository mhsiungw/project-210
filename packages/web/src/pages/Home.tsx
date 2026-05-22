import type { JSX } from 'react'
import Upload from '@web/ui/Upload'
import { BookGrid } from '@web/ui/book-grid/BookGrid'
import { useGetBooksQuery } from '@web/store/api/book'

export function Home(): JSX.Element {
  const { data: books = [] } = useGetBooksQuery()

  return (
    <div>
      <Upload />
      <BookGrid books={books} />
    </div>
  )
}
