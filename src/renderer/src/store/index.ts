import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import selectedBook from './selectedBook'
import { api } from './api'
import { auth } from './auth'

export const store = configureStore({
  reducer: {
    selectedBook,
    [api.reducerPath]: api.reducer,
    [auth.reducerPath]: auth.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(api.middleware, auth.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
