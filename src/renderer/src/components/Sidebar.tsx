import { Link } from 'react-router-dom'
import { RiFileLine } from '@remixicon/react'

export default function Sidebar(): JSX.Element {
  return (
    <nav className="flex flex-col h-full gap-1">
      <Link className="btn flex gap-2" to="/">
        <RiFileLine color="rgba(70,146,221,1)" />
        Books
      </Link>
    </nav>
  )
}
