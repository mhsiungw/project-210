import { JSX } from 'react'
import { ErrorBoundary } from '@sentry/react'

export function AppErrorBoundary({ children }: { children: React.ReactNode }): JSX.Element {
  return <ErrorBoundary fallback={<p>Something went wrong.</p>}>{children}</ErrorBoundary>
}
