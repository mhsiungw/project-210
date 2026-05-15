import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'

export type PageDim = { w: number; h: number }
const PAGE_GAP = 4
const OVERSCAN = 2

interface UsePdfVirtualizerOptions {
  defaultPage: number
  containerRef: RefObject<HTMLDivElement | null>
  pageWidth: number | undefined
}

interface UsePdfVirtualizerResult {
  pageDims: PageDim[]
  setPageDims: (dims: PageDim[]) => void
  range: [number, number]
  offsets: number[]
  totalHeight: number
  scaledHeights: number[]
  scrollToPage: (pageNum: number, behaviour?: ScrollBehavior) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  captureCurrentPage: () => void
}

export function usePdfVirtualizer({
  defaultPage,
  containerRef,
  pageWidth,
}: UsePdfVirtualizerOptions): UsePdfVirtualizerResult {
  const [pageDims, setPageDims] = useState<PageDim[]>([])
  const [range, setRange] = useState<[number, number]>([0, 0])
  const [currentPage, setCurrentPage] = useState(defaultPage)

  const currentPageRef = useRef(currentPage)
  const currentPageBeforeChange = useRef(defaultPage)
  const didInitialScroll = useRef(false)

  const { offsets, scaledHeights, totalHeight } = useMemo(() => {
    if (!pageWidth || pageDims.length === 0) {
      return { offsets: [] as number[], scaledHeights: [] as number[], totalHeight: 0 }
    }
    const offs = new Array<number>(pageDims.length)
    const heights = new Array<number>(pageDims.length)
    let cursor = 0
    for (let i = 0; i < pageDims.length; i++) {
      offs[i] = cursor
      const h = pageDims[i].h * (pageWidth / pageDims[i].w)
      heights[i] = h
      cursor += h + PAGE_GAP
    }
    return { offsets: offs, scaledHeights: heights, totalHeight: cursor }
  }, [pageDims, pageWidth])

  const findFirstVisible = useCallback(
    (scrollTop: number): number => {
      let lo = 0
      let hi = offsets.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        const bottom = offsets[mid] + scaledHeights[mid]
        if (bottom <= scrollTop) {
          lo = mid + 1
        } else {
          hi = mid
        }
      }
      return lo
    },
    [offsets, scaledHeights]
  )

  const recomputeRange = useCallback(() => {
    const c = containerRef.current
    if (!c || offsets.length === 0) return
    const start = Math.max(0, findFirstVisible(c.scrollTop) - OVERSCAN)
    let end = start
    while (end < offsets.length - 1 && offsets[end] < c.scrollTop + c.clientHeight) {
      end++
    }
    end = Math.min(offsets.length - 1, end + OVERSCAN)
    setRange(prev => (prev[0] === start && prev[1] === end ? prev : [start, end]))

    const mid = c.scrollTop + c.clientHeight / 2
    const idx = findFirstVisible(mid)
    setCurrentPage(idx + 1)
  }, [offsets, findFirstVisible])

  const scrollToPage = useCallback(
    (pageNum: number, behaviour: ScrollBehavior = 'smooth'): void => {
      const idx = pageNum - 1
      const c = containerRef.current
      if (!c || offsets[idx] === undefined) return
      c.scrollTo({ top: offsets[idx], behavior: behaviour })
    },
    [offsets]
  )

  const captureCurrentPage = useCallback((): void => {
    currentPageBeforeChange.current = currentPageRef.current
  }, [])

  useEffect(() => {
    const c = containerRef.current
    if (!c) return
    recomputeRange()
    const onScroll = (): void => recomputeRange()
    c.addEventListener('scroll', onScroll, { passive: true })
    return () => c.removeEventListener('scroll', onScroll)
  }, [recomputeRange])

  useEffect(() => {
    recomputeRange()
  }, [totalHeight, recomputeRange])

  useEffect(() => {
    if (didInitialScroll.current) return
    if (offsets.length === 0 || !containerRef.current) return
    scrollToPage(defaultPage, 'instant')
    didInitialScroll.current = true
    currentPageBeforeChange.current = defaultPage
  }, [offsets, defaultPage, scrollToPage])

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  // restore scroll position after zoom or container resize
  useEffect(() => {
    if (offsets.length === 0) return
    const idx = currentPageBeforeChange.current - 1
    const c = containerRef.current
    if (!c || offsets[idx] === undefined) return
    c.scrollTo({ top: offsets[idx], behavior: 'smooth' })
  }, [pageWidth, offsets])

  return {
    pageDims,
    setPageDims,
    range,
    offsets,
    totalHeight,
    scaledHeights,
    scrollToPage,
    currentPage,
    setCurrentPage,
    captureCurrentPage,
  }
}
