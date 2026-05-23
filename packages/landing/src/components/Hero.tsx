'use client'
import type { JSX } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function Hero(): JSX.Element {
  return (
    <Container className="flex flex-col items-center pt-28 pb-16 sm:pt-40 sm:pb-24 sm:flex-row">
      <div className="flex basis-[30%] shrink-0 items-center sm:w-[70%]">
        <Typography
          variant="h1"
          className="flex flex-col items-center text-[clamp(3rem,10vw,3.5rem)] sm:flex-row text-zinc-200"
        >
          Learn languages with your favourite books
        </Typography>
      </div>
      <div className="flex-1">
        <img
          src="/app-example.jpg"
          alt="Project 210 app"
          className="mt-16 aspect-16/10 w-full self-center rounded border border-gray-200 object-cover shadow-[0_0_12px_8px_hsla(220,25%,80%,0.2)] outline-6 outline-[hsla(220,25%,80%,0.2)] sm:mt-20"
        />
      </div>
    </Container>
  )
}
