import { Link, Route, Routes } from 'react-router-dom'
import { Home } from '@renderer/pages/Home'
import { Upload } from '@renderer/pages/Upload'
import { PdfNotes } from '@renderer/pages/PdfNotes'

export default function App(): JSX.Element {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      <nav style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/pdf-notes">Carrie + Notes</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/pdf-notes" element={<PdfNotes />} />
      </Routes>
    </div>
  )
}
