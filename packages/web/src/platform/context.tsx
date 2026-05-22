import { createContext, useContext, type ReactNode } from 'react'

export interface Platform {
  openExternal(url: string): Promise<void>
}

const PlatformContext = createContext<Platform | null>(null)

export function PlatformProvider({
  platform,
  children,
}: {
  platform: Platform
  children: ReactNode
}): React.ReactElement {
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>
}

export function usePlatform(): Platform {
  const p = useContext(PlatformContext)
  if (!p) throw new Error('usePlatform: PlatformProvider not mounted')
  return p
}
