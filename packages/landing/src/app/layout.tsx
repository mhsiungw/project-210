import type { JSX, ReactNode } from 'react'
import Providers from '../components/Providers'
import AppAppBar from '../components/AppAppBar'
import Footer from '../components/Footer'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <AppAppBar />
          <main
            className="w-full flex-1 bg-no-repeat"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.04), transparent 60%)',
            }}
          >
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
