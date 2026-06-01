import { describe, it, expect } from 'vitest'
import { shouldPersistPage } from '../pdf-viewer/shouldPersistPage'

describe('shouldPersistPage', () => {
  // REGRESSION (data loss): leaving a book before the PDF loads / before any
  // scroll must NOT overwrite the stored page. pageRef is null in that window.
  it('does not persist when the viewer never reported a page (null)', () => {
    expect(shouldPersistPage(null, 5)).toBe(false)
  })

  it('does not persist when the page is unchanged (no-op write)', () => {
    expect(shouldPersistPage(5, 5)).toBe(false)
  })

  it('persists when the page actually changed', () => {
    expect(shouldPersistPage(5, 1)).toBe(true)
  })

  it('persists when moving back to an earlier page', () => {
    expect(shouldPersistPage(2, 9)).toBe(true)
  })

  it('does not persist an invalid page below 1', () => {
    expect(shouldPersistPage(0, 5)).toBe(false)
  })
})
