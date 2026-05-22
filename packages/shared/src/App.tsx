import type { JSX } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './pages/Home'
import { PdfNotes } from './pages/PdfNotes'
import { Login } from './pages/Login'
import Sidebar from './ui/side-bar/index'
import { GlobalLoader } from './ui/GlobalLoader'
import { useGetSessionQuery } from './store/api/auth'

export default function App(): JSX.Element {
  const { data: session, isLoading: isLogining } = useGetSessionQuery()
  const isLogin = useLocation().pathname === '/login'

  if (isLogining) {
    return <GlobalLoader />
  }

  if (!session && !isLogin) {
    return <Navigate to="/login" replace />
  }

  if (session && isLogin) {
    return <Navigate to="/" replace />
  }

  if (isLogin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className="flex gap-4">
      <GlobalLoader />
      <div className="min-w-37.5 bg-sidebar p-2">
        <Sidebar />
      </div>
      <main className="flex flex-1 max-w-[calc(100vw-150px)] overflow-hidden p-2">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pdf-notes/:userId/:bookId" element={<PdfNotes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
