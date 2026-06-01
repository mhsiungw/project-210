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

function Harness({ save }: { save: () => Promise<void> }): null {
  useSaveOnExit(save)
  return null
}

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

beforeEach(() => {
  mockedUseBlocker.mockReturnValue(unblocked())
  setVisibility('visible')
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useSaveOnExit', () => {
  it('saves and then proceeds when navigation is blocked', async () => {
    const proceed = vi.fn()
    const save = vi.fn().mockResolvedValue(undefined)
    mockedUseBlocker.mockReturnValue(blocked(proceed))

    render(<Harness save={save} />)

    await vi.waitFor(() => expect(proceed).toHaveBeenCalledTimes(1))
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('still proceeds when the save rejects (user is never trapped)', async () => {
    const proceed = vi.fn()
    const save = vi.fn().mockRejectedValue(new Error('network down'))
    mockedUseBlocker.mockReturnValue(blocked(proceed))

    render(<Harness save={save} />)

    await vi.waitFor(() => expect(proceed).toHaveBeenCalledTimes(1))
  })

  it('saves on pagehide (tab close / refresh)', () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<Harness save={save} />)

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('saves on visibilitychange only when hidden', () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<Harness save={save} />)

    act(() => {
      setVisibility('visible')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(save).not.toHaveBeenCalled()

    act(() => {
      setVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('removes its listeners on unmount (no leak, no save after teardown)', () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { unmount } = render(<Harness save={save} />)

    unmount()
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
      setVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(save).not.toHaveBeenCalled()
  })
})
