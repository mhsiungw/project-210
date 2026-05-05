import { useCallback, useEffect, useState } from 'react'
import Upload from '@renderer/components/Upload'

const CLOUDFRONT_BASE = 'https://d11m54w1vy523e.cloudfront.net'

export function Home(): JSX.Element {
  const [previews, setPreviews] = useState<string[]>([])

  const fetchPreviews = useCallback(() => {
    window.api.getS3Previews().then(setPreviews)
  }, [])

  useEffect(() => {
    fetchPreviews()
  }, [fetchPreviews])

  return (
    <div>
      <Upload onUploadSuccess={fetchPreviews} />

      {previews.length > 0 && (
        <div
          style={{
            marginTop: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
          }}
        >
          {previews.map(key => (
            <img
              key={key}
              src={`${CLOUDFRONT_BASE}/${key}`}
              alt={key}
              style={{
                width: '100%',
                aspectRatio: '3 / 4',
                objectFit: 'cover',
                borderRadius: 6,
                border: '1px solid #e0e0e0',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
