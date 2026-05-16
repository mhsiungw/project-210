import type { JSX } from 'react'
import Upload from '@app/shared/ui/Upload'
import { BookGrid } from '@app/shared/ui/book-grid/BookGrid'
import { useGetBooksQuery } from '@app/shared/store/api/book'

export function Home(): JSX.Element {
  const { data: books = [] } = useGetBooksQuery()

  return (
    <div>
      <Upload />
      <BookGrid books={books} />
    </div>
  )
}
