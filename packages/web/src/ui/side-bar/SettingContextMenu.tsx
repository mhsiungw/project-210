import type { JSX, RefObject } from 'react'
import { RiLogoutBoxLine } from '@remixicon/react'
import { useGetSessionQuery, useSignOutMutation } from '@web/store/api/auth'
import { ContextMenu } from '../ContextMenu'

interface Props {
  x: number
  y: number
  triggerRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
}

export function SettingContextMenu({ x, y, onClose }: Props): JSX.Element {
  const { data: session } = useGetSessionQuery()
  const [signOut] = useSignOutMutation()
  const email = session?.email

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <div className="flex flex-col gap-2 text-sm">
        {email && (
          <p className="p-2 truncate" title={email}>
            {email}
          </p>
        )}
        <button className="btn flex gap-2" onClick={() => signOut()}>
          <RiLogoutBoxLine />
          Sign out
        </button>
      </div>
    </ContextMenu>
  )
}
