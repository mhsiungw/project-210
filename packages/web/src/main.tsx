import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ApiClient } from '@web/client/client'
import { ApiClientProvider } from '@web/client/context'
import { PlatformProvider, type Platform } from '@web/platform/context'
import { createAppStore } from '@web/store'
import App from '@web/App'
import { getAccessToken } from '@web/service/auth'
import { createHttpTransport } from '@web/client/transport-http'
import '@web/styles/global.css'

const webPlatform: Platform = {
  openExternal(url: string): Promise<void> {
    window.open(url, '_blank', 'noopener,noreferrer')
    return Promise.resolve()
  },
}

const applyTheme = (dark: boolean): void => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}
const mq = window.matchMedia('(prefers-color-scheme: dark)')
applyTheme(mq.matches)
mq.addEventListener('change', e => applyTheme(e.matches))

const transport = createHttpTransport(import.meta.env.VITE_API_URL, getAccessToken)
const apiClient = new ApiClient(transport)
const store = createAppStore({ apiClient })
const router = createBrowserRouter([{ path: '*', element: <App /> }])

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <Provider store={store}>
      <ApiClientProvider client={apiClient}>
        <PlatformProvider platform={webPlatform}>
          <RouterProvider router={router} />
        </PlatformProvider>
      </ApiClientProvider>
    </Provider>
  </StrictMode>
)
