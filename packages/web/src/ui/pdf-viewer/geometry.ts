import type { HighlightRect } from '@app/db/dto'

// Highlight anchoring math (D2-A). Highlights are stored as rectangles normalized
// 0..1 against the rendered page box, NOT as pixels and NOT against the text layer.
// Normalizing and repainting against the *same* box (the page wrapper) is what makes
// a highlight scale-invariant: zoom changes the box size, the normalized rect is
// unchanged, so denormalize × new size lands it back on the same words.
//
//   capture:  pixel rect ──/ box ──> {x,y,w,h} in 0..1   (normalizeRects)
//   repaint:  {x,y,w,h}  ──× W,H ──> pixel rect           (denormalizeRects)

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export interface PixelRect {
  left: number
  top: number
  width: number
  height: number
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/**
 * Normalize viewport-space client rects to 0..1 against a page box.
 * Returns [] for a degenerate box so callers never divide by zero.
 */
export function normalizeRects(rects: ArrayLike<DOMRect>, box: Box): HighlightRect[] {
  if (box.width <= 0 || box.height <= 0) return []
  return Array.from(rects).map(r => ({
    x: clamp01((r.left - box.left) / box.width),
    y: clamp01((r.top - box.top) / box.height),
    w: clamp01(r.width / box.width),
    h: clamp01(r.height / box.height),
  }))
}

/** Project normalized rects back to pixels for a rendered page of the given size. */
export function denormalizeRects(
  rects: HighlightRect[],
  width: number,
  height: number
): PixelRect[] {
  return rects.map(r => ({
    left: r.x * width,
    top: r.y * height,
    width: r.w * width,
    height: r.h * height,
  }))
}
