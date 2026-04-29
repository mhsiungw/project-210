import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  count: number
  pingResponse: string | null
}

const initialState: AppState = {
  count: 0,
  pingResponse: null,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    increment(state) {
      state.count += 1
    },
    decrement(state) {
      state.count -= 1
    },
    reset(state) {
      state.count = 0
    },
    setPingResponse(state, action: PayloadAction<string>) {
      state.pingResponse = action.payload
    },
  },
})

export const { increment, decrement, reset, setPingResponse } = appSlice.actions
export default appSlice.reducer
