import { useCallback, useEffect, useState } from 'react'
import Upload from '@renderer/components/Upload'
import { BookGrid } from '@renderer/components/BookGrid'
import type { Book } from '@prisma/client'

export function Home(): JSX.Element {
  const [books, setBooks] = useState<Book[]>([])

  const fetchBooks = useCallback(() => {
    window.api.getBooks().then(setBooks)
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  return (
    <div>
      <Upload onUploadSuccess={fetchBooks} />
      <BookGrid books={books} />
    </div>
  )
}
