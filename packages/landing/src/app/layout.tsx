import type { JSX, ReactNode } from 'react'
import type { Metadata } from 'next'
import Providers from '../components/Providers'
import AppAppBar from '../components/AppAppBar'
import Footer from '../components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project 210',
  appleWebApp: { title: 'Project 210' },
  manifest: '/assets/site.webmanifest',
  icons: {
    icon: [
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    shortcut: '/assets/favicon.ico',
    apple: { url: '/assets/apple-touch-icon.png', sizes: '180x180' },
  },
}

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
