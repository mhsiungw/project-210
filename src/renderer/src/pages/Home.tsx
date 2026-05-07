import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Upload from '@renderer/components/Upload'
import { useAppDispatch } from '@renderer/store'
import { setCurrentPDFUrl } from '@renderer/store/appSlice'
import type { Book } from '@prisma/client'

export function Home(): JSX.Element {
  const [books, setBooks] = useState<Book[]>([])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const fetchBooks = useCallback(() => {
    window.api.getBooks().then(setBooks)
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  return (
    <div>
      <Upload onUploadSuccess={fetchBooks} />

      {books.length > 0 && (
        <div className="mt-8 grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {books.map(({ id, preview_url, url }) => {
            return (
              <img
                key={id}
                src={preview_url}
                onDoubleClick={() => {
                  dispatch(setCurrentPDFUrl(url))
                  navigate('/pdf-notes')
                }}
                alt={id}
                className="w-full aspect-3/4 object-cover rounded-md border border-[#e0e0e0]"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
