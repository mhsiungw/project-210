import { configureStore } from '@reduxjs/toolkit'
import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'
import type { ApiClient } from '../api/client'
import selectedBook from '../features/books/selectedBook'
import { auth } from '../features/auth/api'
import { emptyApi } from './api/emptyApi'

export interface ThunkExtra {
  apiClient: ApiClient
}

interface CreateStoreOptions {
  apiClient: ApiClient
  preloadedState?: Parameters<typeof configureStore>[0]['preloadedState']
}

// Return type is intentionally inferred so RootState reflects the actual reducer shape.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildStore({ apiClient, preloadedState }: CreateStoreOptions) {
  return configureStore({
    reducer: {
      selectedBook,
      [emptyApi.reducerPath]: emptyApi.reducer,
      [auth.reducerPath]: auth.reducer,
    },
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: { apiClient } satisfies ThunkExtra } }).concat(
        emptyApi.middleware,
        auth.middleware
      ),
    preloadedState,
  })
}

export type AppStore = ReturnType<typeof buildStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

export function createAppStore(opts: CreateStoreOptions): AppStore {
  return buildStore(opts)
}

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
