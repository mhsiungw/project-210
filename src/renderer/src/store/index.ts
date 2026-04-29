import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import appReducer from './appSlice'
import { exampleApi } from './api'

export const store = configureStore({
  reducer: {
    app: appReducer,
    [exampleApi.reducerPath]: exampleApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(exampleApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
