import { JSX } from 'react'
import Upload from '@renderer/components/Upload'
import { BookGrid } from '@renderer/components/BookGrid'
import { useGetBooksQuery } from '@renderer/store/api/book'

export function Home(): JSX.Element {
  const { data: books = [] } = useGetBooksQuery()

  return (
    <div>
      <Upload />
      <BookGrid books={books} />
    </div>
  )
}
