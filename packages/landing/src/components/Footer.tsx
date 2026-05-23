'use client'
import type { JSX } from 'react'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

export default function Footer(): JSX.Element {
  return (
    <Container className="flex flex-col items-center justify-between gap-8 border-t border-white/10 py-12 text-center md:flex-row md:items-start md:text-left">
      <div className="flex flex-col gap-2">
        <Typography
          variant="h6"
          component="a"
          href="/"
          className="font-bold text-zinc-200 no-underline"
        >
          Project 210
        </Typography>
        <Typography variant="body2" className="max-w-md text-gray-500">
          Learn languages with your favourite books
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          © {new Date().getFullYear()} Project 210
        </Typography>
      </div>
      <nav>
        <ul className="m-0 flex list-none flex-col items-center gap-2 p-0 md:flex-row md:items-start md:gap-4">
          <li>
            <Link variant="body2" href="/privacy" className="text-gray-500">
              Privacy
            </Link>
          </li>
          <li>
            <Link variant="body2" href="/terms" className="text-gray-500">
              Terms
            </Link>
          </li>
          <li>
            <Link variant="body2" href="mailto:minhsiungw@gmail.com" className="text-gray-500">
              Contact
            </Link>
          </li>
          <li>
            <Link
              variant="body2"
              href="https://github.com/mhsiungw/project-210"
              className="text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
          </li>
        </ul>
      </nav>
    </Container>
  )
}
