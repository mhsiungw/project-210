import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { init } from '@sentry/electron/renderer'
import { init as reactInit } from '@sentry/react'
import { ErrorBoundary } from '@sentry/react'
import { ApiClient, ApiClientProvider, PlatformProvider, createAppStore, App } from '@app/shared'
import { ipcTransport } from './transport-ipc'
import { desktopPlatform } from './platform'
import '@app/shared/styles/global.css'

init(
  {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: import.meta.env.VITE_ENVIRONMENT === 'production',
  },
  reactInit
)

const applyTheme = (dark: boolean): void => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}
const mq = window.matchMedia('(prefers-color-scheme: dark)')
applyTheme(mq.matches)
mq.addEventListener('change', e => applyTheme(e.matches))

const apiClient = new ApiClient(ipcTransport)
const store = createAppStore({ apiClient })
const router = createHashRouter([{ path: '*', element: <App /> }])

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ApiClientProvider client={apiClient}>
          <PlatformProvider platform={desktopPlatform}>
            <RouterProvider router={router} />
          </PlatformProvider>
        </ApiClientProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
)
