import { useEffect, useRef, type JSX, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  x: number
  y: number
  onClose: () => void
  children: ReactNode
}

export function ContextMenu({ x, y, onClose, children }: Props): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMouseDown = (e: MouseEvent): void => {
      if (!menuRef.current?.contains(e.target as Node)) onClose()
    }
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    const onScroll = (): void => onClose()

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { capture: true })

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', left: x + 4, top: y + 4 }}
      className="flex justify-center items-center gap-2 btn z-50 hover:bg-muted bg-context-menu"
    >
      {children}
    </div>,
    document.body
  )
}
