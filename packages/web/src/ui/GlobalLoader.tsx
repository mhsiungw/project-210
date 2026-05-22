import type { JSX } from 'react'
import { RiLoader5Line } from '@remixicon/react'
import { useAppSelector } from '@web/store'

export function GlobalLoader(): JSX.Element | null {
  const isFetching = useAppSelector(
    state =>
      Object.values(state.api.queries).some(q => q?.status === 'pending') ||
      Object.values(state.api.mutations).some(m => m?.status === 'pending')
  )
  if (!isFetching) return null
  return (
    <div className="fixed inset-0 bg-bg-overlay/20 z-50 flex justify-center items-center">
      <RiLoader5Line size={36} className="animate-spin text-accent" />
    </div>
  )
}
