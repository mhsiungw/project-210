import './index.css'
import { StrictMode } from 'react'

const mq = window.matchMedia('(prefers-color-scheme: dark)')
const applyTheme = (dark: boolean): void => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}
applyTheme(mq.matches)
mq.addEventListener('change', e => applyTheme(e.matches))
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createHashRouter, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { store } from '@renderer/store'
import App from '@renderer/App'

const createRouter = navigator.userAgent.includes('Electron') ? createHashRouter : createBrowserRouter
const router = createRouter([{ path: '*', element: <App /> }])

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
)
