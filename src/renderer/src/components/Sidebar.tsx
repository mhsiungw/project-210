import { Link } from 'react-router-dom'

export default function Sidebar(): JSX.Element {
  return (
    <nav className="flex flex-col gap-1">
      <Link to="/">Home</Link>
      <Link to="/pdf-notes">Carrie + Notes</Link>
    </nav>
  )
}
