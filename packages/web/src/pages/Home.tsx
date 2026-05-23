import type { JSX } from 'react'
import { Upload } from '@app/ui'
import { BookGrid } from '@web/ui/book-grid/BookGrid'
import { useGetBooksQuery, usePostBookMutation } from '@web/store/api/book'

export function Home(): JSX.Element {
  const { data: books = [] } = useGetBooksQuery()
  const [postBook, { isLoading, isError, error }] = usePostBookMutation()
  const errorMessage = !isError
    ? null
    : error && 'data' in error
      ? String(error.data)
      : 'Upload failed.'

  return (
    <div>
      <Upload onUpload={postBook} isLoading={isLoading} errorMessage={errorMessage} />
      <BookGrid books={books} />
    </div>
  )
}
