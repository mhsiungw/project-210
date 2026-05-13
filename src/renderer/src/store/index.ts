import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import selectedBook from './selectedBook'
import { emptyApi } from './api/emptyApi'
import { auth } from './api/auth'

export const store = configureStore({
  reducer: {
    selectedBook,
    [emptyApi.reducerPath]: emptyApi.reducer,
    [auth.reducerPath]: auth.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(emptyApi.middleware, auth.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
