import type { JSX, ReactNode } from 'react'
import { ErrorBoundary } from '@sentry/react'

export function AppErrorBoundary({ children }: { children: ReactNode }): JSX.Element {
  return <ErrorBoundary fallback={<p>Something went wrong.</p>}>{children}</ErrorBoundary>
}
