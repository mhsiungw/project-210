import { useState } from 'react'
import { Pdf } from '../components/Pdf'

export function PdfNotes(): JSX.Element {
  const [notes, setNotes] = useState(() => localStorage.getItem('pdf-notes') ?? '')

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 5rem)', gap: '1rem' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Notes</h2>
        <textarea
          style={{
            flex: 1,
            resize: 'none',
            padding: '0.75rem',
            fontFamily: 'inherit',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            outline: 'none',
            wordSpacing: '2px',
            letterSpacing: '1px',
            lineHeight: '1.3',
          }}
          placeholder="Write your notes here..."
          value={notes}
          onChange={e => {
            setNotes(e.target.value)
            localStorage.setItem('pdf-notes', e.target.value)
          }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', borderLeft: '1px solid #ccc', paddingLeft: '1rem' }}>
        <Pdf />
      </div>
    </div>
  )
}
