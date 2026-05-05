import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Upload from '@renderer/components/Upload'
import { useAppDispatch } from '@renderer/store'
import { setCurrentPDFUrl } from '@renderer/store/appSlice'

const CLOUDFRONT_BASE = 'https://d11m54w1vy523e.cloudfront.net'

export function Home(): JSX.Element {
  const [previews, setPreviews] = useState<string[]>([])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

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
        <div className="mt-8 grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {previews.map(key => {
            const pdfKey = key.replace('-preview.png', '.pdf')
            const pdfUrl = `${CLOUDFRONT_BASE}/${pdfKey}`

            return (
              <img
                key={key}
                src={`${CLOUDFRONT_BASE}/${key}`}
                onDoubleClick={() => {
                  dispatch(setCurrentPDFUrl(pdfUrl))
                  navigate('/pdf-notes')
                }}
                alt={key}
                className="w-full aspect-3/4 object-cover rounded-md border border-[#e0e0e0]"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
