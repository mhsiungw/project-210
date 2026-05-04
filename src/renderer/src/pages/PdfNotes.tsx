import { useState } from 'react'
import { Pdf } from '../components/Pdf'

export function PdfNotes(): JSX.Element {
  const [notes, setNotes] = useState(() => localStorage.getItem('pdf-notes') ?? '')

  return (
    <div className="flex flex-1 gap-4">
      <div className="flex flex-1">
        <textarea
          className="flex-1 rounded p-3 border border-border resize-none"
          placeholder="Write your notes here..."
          value={notes}
          onChange={e => {
            setNotes(e.target.value)
            localStorage.setItem('pdf-notes', e.target.value)
          }}
        />
      </div>
      <div className="flex-1 rounded border border-border p-3">
        <Pdf />
      </div>
    </div>
  )
}
