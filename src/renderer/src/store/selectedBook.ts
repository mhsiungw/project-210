import { Book } from '@prisma/client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type BookState = Omit<Book, 'created_at'> & { created_at: string }

const initialState: BookState = {
  id: '',
  title: '',
  url: '',
  preview_url: '',
  total_pages: 0,
  current_page: 0,
  created_at: '',
}

const selectedBook = createSlice({
  name: 'selectedBook',
  initialState,
  reducers: {
    setSelectedBook(_, action: PayloadAction<BookState>) {
      const { id, title, url, preview_url, total_pages, current_page, created_at } = action.payload
      return {
        id,
        title,
        url,
        preview_url,
        total_pages,
        current_page,
        created_at,
      }
    },
  },
})

export const { setSelectedBook } = selectedBook.actions
export default selectedBook.reducer
