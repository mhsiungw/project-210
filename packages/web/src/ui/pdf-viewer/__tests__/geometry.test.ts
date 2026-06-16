import { describe, it, expect } from 'vitest'
import { normalizeRects, denormalizeRects, type Box } from '../geometry'
import type { HighlightRect } from '@app/db/dto'

// A page box offset from the viewport origin, like a wrapper mid-scroll.
const box: Box = { left: 100, top: 200, width: 500, height: 800 }

// Helper: build a DOMRect-ish object (normalizeRects only reads l/t/w/h).
const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({ left, top, width, height }) as DOMRect

describe('normalizeRects', () => {
  it('normalizes a viewport rect to 0..1 against the page box', () => {
    const [r] = normalizeRects([rect(110, 210, 50, 20)], box)
    expect(r.x).toBeCloseTo(0.02) // (110-100)/500
    expect(r.y).toBeCloseTo(0.0125) // (210-200)/800
    expect(r.w).toBeCloseTo(0.1) // 50/500
    expect(r.h).toBeCloseTo(0.025) // 20/800
  })

  it('clamps values that fall outside the box to 0..1', () => {
    const [r] = normalizeRects([rect(50, 100, 9999, 9999)], box)
    expect(r.x).toBe(0) // left of box → clamped to 0
    expect(r.y).toBe(0)
    expect(r.w).toBe(1) // absurd width → clamped to 1
    expect(r.h).toBe(1)
  })

  it('returns [] for a degenerate box (never divides by zero)', () => {
    expect(
      normalizeRects([rect(0, 0, 10, 10)], { left: 0, top: 0, width: 0, height: 800 })
    ).toEqual([])
  })

  it('handles multiple rects (multi-line selection)', () => {
    const out = normalizeRects([rect(100, 200, 250, 16), rect(100, 216, 500, 16)], box)
    expect(out).toHaveLength(2)
    expect(out[0].w).toBeCloseTo(0.5)
    expect(out[1].w).toBeCloseTo(1)
  })
})

describe('denormalizeRects', () => {
  it('projects normalized rects back to page-local pixels', () => {
    const norm: HighlightRect = { x: 0.25, y: 0.1, w: 0.5, h: 0.2 }
    const [px] = denormalizeRects([norm], 400, 800)
    expect(px).toEqual({ left: 100, top: 80, width: 200, height: 160 })
  })
})

describe('round-trip + scale invariance (the zoom/resize success criterion)', () => {
  it('normalize → denormalize returns the original page-local rect', () => {
    const original = rect(180, 260, 120, 40) // viewport coords
    const [norm] = normalizeRects([original], box)
    const [px] = denormalizeRects([norm], box.width, box.height)
    // denormalize yields page-local coords (origin-subtracted)
    expect(px.left).toBeCloseTo(original.left - box.left)
    expect(px.top).toBeCloseTo(original.top - box.top)
    expect(px.width).toBeCloseTo(original.width)
    expect(px.height).toBeCloseTo(original.height)
  })

  it('the same normalized rect scales proportionally with page size (zoom)', () => {
    const norm: HighlightRect = { x: 0.25, y: 0.1, w: 0.5, h: 0.2 }
    const [small] = denormalizeRects([norm], 400, 800)
    const [large] = denormalizeRects([norm], 800, 1600) // 2x zoom

    expect(large.left).toBeCloseTo(small.left * 2)
    expect(large.top).toBeCloseTo(small.top * 2)
    expect(large.width).toBeCloseTo(small.width * 2)
    expect(large.height).toBeCloseTo(small.height * 2)
  })
})
