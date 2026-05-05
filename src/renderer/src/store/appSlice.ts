import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  currentPdfUrl: string
}

const initialState: AppState = {
  currentPdfUrl: '',
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentPDFUrl(state, action: PayloadAction<string>) {
      state.currentPdfUrl = action.payload
    },
  },
})

export const { setCurrentPDFUrl } = appSlice.actions
export default appSlice.reducer
