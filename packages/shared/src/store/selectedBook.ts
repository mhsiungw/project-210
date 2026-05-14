import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface SelectedBookState {
  id: string | null
}

const selectedBook = createSlice({
  name: 'selectedBook',
  initialState: { id: null } as SelectedBookState,
  reducers: {
    setSelectedBookId(_, action: PayloadAction<string>) {
      return { id: action.payload }
    },
  },
})

export const { setSelectedBookId } = selectedBook.actions
export default selectedBook.reducer
