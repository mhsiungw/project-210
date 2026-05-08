interface ToolbarButtonProps {
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, disabled, title, children }: ToolbarButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 20,
        lineHeight: 1,
        padding: '2px 6px',
        borderRadius: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
      }}
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
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(40, 40, 40, 0.92)',
        backdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: '8px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        zIndex: 1000,
        color: '#fff',
        fontSize: 14,
        userSelect: 'none',
      }}
    >
      <ToolbarButton onClick={onPrev} disabled={currentPage <= 1} title="Previous page">
        ‹
      </ToolbarButton>
      <span style={{ minWidth: 90, textAlign: 'center' }}>
        Page {numPages > 0 ? currentPage : '—'} of {numPages || '—'}
      </span>
      <ToolbarButton onClick={onNext} disabled={currentPage >= numPages} title="Next page">
        ›
      </ToolbarButton>

      <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', height: 20, margin: '0 4px' }} />

      <ToolbarButton onClick={onScaleDown} disabled={scale <= scaleMin} title="Zoom out">
        −
      </ToolbarButton>
      <span style={{ minWidth: 48, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
      <ToolbarButton onClick={onScaleUp} disabled={scale >= scaleMax} title="Zoom in">
        +
      </ToolbarButton>
    </div>
  )
}
