type PdfToolBarProps = {
  currentPage: number
  numPages: number
  onPrev: () => void
  onNext: () => void
}

export function PdfToolBar({
  currentPage,
  numPages,
  onPrev,
  onNext,
}: PdfToolBarProps): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-3 bg-black/60 text-white px-4 py-2 text-sm select-none">
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="disabled:opacity-30 hover:opacity-70 transition-opacity"
      >
        ‹
      </button>
      <span>
        {currentPage} / {numPages}
      </span>
      <button
        onClick={onNext}
        disabled={currentPage >= numPages}
        className="disabled:opacity-30 hover:opacity-70 transition-opacity"
      >
        ›
      </button>
    </div>
  )
}
