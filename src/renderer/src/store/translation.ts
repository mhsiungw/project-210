import { Translation } from '@prisma/client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type TranslationState = Omit<Translation, 'created_at'> & { created_at: string }

const initialState: TranslationState = {
  id: '',
  created_at: '',
  book_id: '',
  text: '',
}

const translation = createSlice({
  name: 'selectedBook',
  initialState,
  reducers: {
    setTranslation(_, action: PayloadAction<TranslationState>) {
      return { ...action.payload }
    },
  },
})

export const { setTranslation } = translation.actions
export default translation.reducer
