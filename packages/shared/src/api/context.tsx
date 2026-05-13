import { createContext, useContext, type ReactNode } from 'react'
import type { ApiClient } from './client'

const ApiClientContext = createContext<ApiClient | null>(null)

export function ApiClientProvider({
  client,
  children,
}: {
  client: ApiClient
  children: ReactNode
}): React.ReactElement {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>
}

export function useApiClient(): ApiClient {
  const c = useContext(ApiClientContext)
  if (!c) throw new Error('useApiClient: ApiClientProvider not mounted')
  return c
}
