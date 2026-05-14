import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { Provider } from 'react-redux'
import { render, type RenderResult } from '@testing-library/react'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { emptyApi as api } from '../../store/api/emptyApi'
import selectedBook from '../../store/selectedBook'
import type { RootState } from '../../store'
import { GlobalLoader } from '../GlobalLoader'

function makeStore(apiState: Record<string, unknown> = {}): ReturnType<typeof configureStore> {
  return configureStore({
    reducer: combineReducers({
      selectedBook,
      [api.reducerPath]: api.reducer,
    }),
    middleware: getDefault => getDefault().concat(api.middleware),
    preloadedState: {
      [api.reducerPath]: {
        queries: apiState,
        mutations: {},
        provided: {},
        subscriptions: {},
        config: {
          online: true,
          focused: true,
          middlewareRegistered: true,
          refetchOnFocus: false,
          refetchOnReconnect: false,
          refetchOnMountOrArgChange: false,
          keepUnusedDataFor: 60,
          reducerPath: api.reducerPath,
          invalidationBehavior: 'delayed',
        },
      },
    } as Partial<RootState>,
  })
}

function renderWithStore(apiState?: Record<string, unknown>): RenderResult {
  const store = makeStore(apiState)
  return render(
    <Provider store={store}>
      <GlobalLoader />
    </Provider>
  )
}

describe('GlobalLoader', () => {
  it('renders nothing when no queries are pending', () => {
    const { container } = renderWithStore()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the overlay when a query is pending', () => {
    const { container } = renderWithStore({ getBooks: { status: 'pending' } })
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders nothing when all queries are fulfilled', () => {
    const { container } = renderWithStore({ getBooks: { status: 'fulfilled' } })
    expect(container).toBeEmptyDOMElement()
  })
})
