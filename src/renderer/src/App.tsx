import { Route, Routes } from 'react-router-dom'
import { Home } from '@renderer/pages/Home'
import { PdfNotes } from '@renderer/pages/PdfNotes'
import Sidebar from '@renderer/components/Sidebar'
import { GlobalLoader } from '@renderer/components/GlobalLoader'

export default function App(): JSX.Element {
  return (
    <div className="flex gap-4">
      <GlobalLoader />
      <div className="min-w-37.5 bg-sidebar p-2">
        <Sidebar />
      </div>
      <main className="flex flex-1 max-w-[calc(100vw-150px)] overflow-hidden p-2">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pdf-notes" element={<PdfNotes />} />
        </Routes>
      </main>
    </div>
  )
}
