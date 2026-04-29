import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { increment, decrement, reset, setPingResponse } from '@renderer/store/appSlice'
import { useGetPostQuery } from '@renderer/store/api'

export function Home(): JSX.Element {
  const dispatch = useAppDispatch()
  const count = useAppSelector(state => state.app.count)
  const pingResponse = useAppSelector(state => state.app.pingResponse)
  const [pinging, setPinging] = useState(false)
  const [postId, setPostId] = useState(1)
  const { data: post, isFetching } = useGetPostQuery(postId)

  const handlePing = async (): Promise<void> => {
    setPinging(true)
    const response = await window.api.ping()
    dispatch(setPingResponse(response))
    setPinging(false)
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 600 }}>
      <section>
        <h2>Redux Counter</h2>
        <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{count}</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => dispatch(increment())}>+</button>
          <button onClick={() => dispatch(decrement())}>−</button>
          <button onClick={() => dispatch(reset())}>Reset</button>
        </div>
      </section>

      <section>
        <h2>IPC Ping / Pong</h2>
        <button onClick={handlePing} disabled={pinging}>
          {pinging ? 'Pinging…' : 'Send Ping'}
        </button>
        {pingResponse !== null && (
          <p>
            Main process replied: <strong>{pingResponse}</strong>
          </p>
        )}
      </section>

      <section>
        <h2>RTK Query — Post #{postId}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button onClick={() => setPostId(id => Math.max(1, id - 1))}>Prev</button>
          <button onClick={() => setPostId(id => id + 1)}>Next</button>
        </div>
        {isFetching ? (
          <p>Loading…</p>
        ) : post ? (
          <>
            <p>
              <strong>{post.title}</strong>
            </p>
            <p style={{ color: '#666' }}>{post.body}</p>
          </>
        ) : null}
      </section>
    </main>
  )
}
