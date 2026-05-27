import type { JSX, ReactNode } from 'react'

interface ToolbarButtonProps {
  onClick: () => void
  disabled?: boolean
  title?: string
  children: ReactNode
}

function ToolbarButton({ onClick, disabled, title, children }: ToolbarButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="bg-transparent border-none text-white text-lg leading-none px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors duration-150 hover:bg-white/15 disabled:text-white/30 disabled:cursor-default disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

export interface PdfToolbarProps {
  currentPage: number
  numPages: number
  scale: number
  scaleMin: number
  scaleMax: number
  onPrev: () => void
  onNext: () => void
  onScaleDown: () => void
  onScaleUp: () => void
}

export function PdfToolbar({
  currentPage,
  numPages,
  scale,
  scaleMin,
  scaleMax,
  onPrev,
  onNext,
  onScaleDown,
  onScaleUp,
}: PdfToolbarProps): JSX.Element {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-1000 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm select-none backdrop-blur-sm bg-reader-toolbar shadow-md">
      <ToolbarButton onClick={onPrev} disabled={currentPage <= 1} title="Previous page">
        ‹
      </ToolbarButton>
      <span className="min-w-22.5 text-center">
        Page {numPages > 0 ? currentPage : '—'} of {numPages || '—'}
      </span>
      <ToolbarButton onClick={onNext} disabled={currentPage >= numPages} title="Next page">
        ›
      </ToolbarButton>

      <div className="w-px h-5 mx-1 bg-white/20" />

      <ToolbarButton onClick={onScaleDown} disabled={scale <= scaleMin} title="Zoom out">
        −
      </ToolbarButton>
      <span className="min-w-12 text-center">{Math.round(scale * 100)}%</span>
      <ToolbarButton onClick={onScaleUp} disabled={scale >= scaleMax} title="Zoom in">
        +
      </ToolbarButton>
    </div>
  )
}
