import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ApiClient, ApiClientProvider, PlatformProvider, createAppStore, App } from '@app/shared'
import { supabase } from '@app/shared/features/auth'
import { createHttpTransport } from './transport-http'
import { webPlatform } from './platform'
import '@app/shared/styles/global.css'

const applyTheme = (dark: boolean): void => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}
const mq = window.matchMedia('(prefers-color-scheme: dark)')
applyTheme(mq.matches)
mq.addEventListener('change', e => applyTheme(e.matches))

const transport = createHttpTransport(import.meta.env.VITE_API_URL, async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
})
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
