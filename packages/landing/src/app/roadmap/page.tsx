import type { JSX } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

type Milestone = {
  title: string
  status: 'shipped' | 'in-progress' | 'planned'
  description: string
}

const milestones: Milestone[] = [
  {
    title: 'Users can use their own API key to ask AI questions',
    status: 'in-progress',
    description: '',
  },
]

const statusLabel: Record<Milestone['status'], string> = {
  shipped: 'Shipped',
  'in-progress': 'In progress',
  planned: 'Planned',
}

export default function RoadmapPage(): JSX.Element {
  return (
    <Container className="flex flex-col gap-12 pt-28 pb-16 sm:pt-40 sm:pb-24">
      <div className="flex flex-col gap-4">
        <Typography variant="h1" className="text-[clamp(2.5rem,8vw,3rem)] text-zinc-200">
          Roadmap
        </Typography>
        <Typography variant="body1" className="max-w-2xl text-gray-500">
          What we&apos;re building next for Project 210.
        </Typography>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {milestones.map(m => (
          <li key={m.title} className="flex gap-3">
            <span aria-hidden className="text-gray-500">
              -
            </span>
            <Typography variant="body1" className="text-zinc-200">
              <span className="font-semibold">{m.title}</span>
              <span className="text-gray-400"> {m.description}</span>
              <span className="ml-2 text-gray-500 text-xs uppercase">
                ({statusLabel[m.status]})
              </span>
            </Typography>
          </li>
        ))}
      </ul>
    </Container>
  )
}
