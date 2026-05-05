import { Link } from 'react-router-dom'

export default function Sidebar(): JSX.Element {
  return (
    <nav className="flex flex-col h-full gap-1 bg-sidebar">
      <Link to="/">Home</Link>
      <Link to="/pdf-notes">Carrie + Notes</Link>
    </nav>
  )
}
