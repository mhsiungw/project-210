import { Link, Route, Routes } from 'react-router-dom'
import { Home } from '@renderer/pages/Home'
import { About } from '@renderer/pages/About'

export default function App(): JSX.Element {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      <nav style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}
