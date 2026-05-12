import { JSX } from 'react'
import { Link } from 'react-router-dom'
import { RiFileLine, RiLogoutBoxLine } from '@remixicon/react'
import { supabase } from '@renderer/lib/supabase'
import { useAppSelector } from '@renderer/store'

export default function Sidebar(): JSX.Element {
  const email = useAppSelector(s => s.auth.session?.user.email)

  return (
    <nav className="flex flex-col h-full gap-1">
      <Link className="btn flex gap-2" to="/">
        <RiFileLine color="rgba(70,146,221,1)" />
        Books
      </Link>
      <div className="mt-auto flex flex-col gap-2 text-sm">
        {email && (
          <p className="px-2 truncate" title={email}>
            {email}
          </p>
        )}
        <button className="btn flex gap-2" onClick={() => supabase.auth.signOut()}>
          <RiLogoutBoxLine />
          Sign out
        </button>
      </div>
    </nav>
  )
}
