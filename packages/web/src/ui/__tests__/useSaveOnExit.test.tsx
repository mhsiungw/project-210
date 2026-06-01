import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { useBlocker } from 'react-router-dom'
import { useSaveOnExit } from '../hooks/useSaveOnExit'

vi.mock('react-router-dom', () => ({ useBlocker: vi.fn() }))

const mockedUseBlocker = vi.mocked(useBlocker)

function unblocked(): ReturnType<typeof useBlocker> {
  return { state: 'unblocked', proceed: undefined, reset: undefined, location: undefined } as never
}

function blocked(proceed: () => void): ReturnType<typeof useBlocker> {
  return { state: 'blocked', proceed, reset: vi.fn(), location: {} } as never
}

function Harness({ save, flush }: { save: () => Promise<void>; flush: () => void }): null {
  useSaveOnExit(save, flush)
  return null
}

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

const noop = (): void => {}
const noopAsync = async (): Promise<void> => {}

beforeEach(() => {
  mockedUseBlocker.mockReturnValue(unblocked())
  setVisibility('visible')
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useSaveOnExit', () => {
  it('runs the async save and then proceeds when navigation is blocked', async () => {
    const proceed = vi.fn()
    const save = vi.fn().mockResolvedValue(undefined)
    mockedUseBlocker.mockReturnValue(blocked(proceed))

    render(<Harness save={save} flush={noop} />)

    await vi.waitFor(() => expect(proceed).toHaveBeenCalledTimes(1))
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('still proceeds when the async save rejects (user is never trapped)', async () => {
    const proceed = vi.fn()
    const save = vi.fn().mockRejectedValue(new Error('network down'))
    mockedUseBlocker.mockReturnValue(blocked(proceed))

    render(<Harness save={save} flush={noop} />)

    await vi.waitFor(() => expect(proceed).toHaveBeenCalledTimes(1))
  })

  it('runs the synchronous flush on pagehide, not the async save', () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const flush = vi.fn()
    render(<Harness save={save} flush={flush} />)

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    expect(flush).toHaveBeenCalledTimes(1)
    expect(save).not.toHaveBeenCalled()
  })

  it('flushes on visibilitychange only when hidden', () => {
    const flush = vi.fn()
    render(<Harness save={noopAsync} flush={flush} />)

    act(() => {
      setVisibility('visible')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(flush).not.toHaveBeenCalled()

    act(() => {
      setVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('removes its listeners on unmount (no leak, no flush after teardown)', () => {
    const flush = vi.fn()
    const { unmount } = render(<Harness save={noopAsync} flush={flush} />)

    unmount()
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
      setVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(flush).not.toHaveBeenCalled()
  })
})
