import { useRef, useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import { RiFileLine, RiSettings2Line } from '@remixicon/react'
import { SettingContextMenu } from './SettingContextMenu'

export default function Sidebar(): JSX.Element {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const toggleSettings = (): void => {
    if (menuPos) {
      setMenuPos(null)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuPos({ x: rect.left, y: rect.top })
  }

  return (
    <nav className="relative flex flex-col justify-between h-full gap-1">
      <div>
        <Link className="btn flex gap-2" to="/">
          <RiFileLine color="rgba(70,146,221,1)" />
          Books
        </Link>
      </div>
      <div className="flex justify-end">
        <button
          ref={triggerRef}
          className="cursor-pointer"
          onClick={toggleSettings}
          aria-label="Settings"
        >
          <RiSettings2Line color="rgba(255,255,255,1)" />
        </button>
      </div>
      {menuPos && (
        <SettingContextMenu
          x={menuPos.x}
          y={menuPos.y}
          triggerRef={triggerRef}
          onClose={() => setMenuPos(null)}
        />
      )}
    </nav>
  )
}
