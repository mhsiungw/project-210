import type { JSX } from 'react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Container from '@mui/material/Container'

async function loadPolicy(): Promise<string> {
  const raw = await readFile(path.join(process.cwd(), 'src/app/privacy/privacy.html'), 'utf8')
  return raw
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<span style="display: block;[\s\S]*?<\/span>/i, '')
    .replace(/<\/?bdt[^>]*>/gi, '')
    .replace(/__________/g, 'Project 210')
}

export default async function PrivacyPage(): Promise<JSX.Element> {
  const html = await loadPolicy()
  return (
    <Container className="flex flex-col pt-28 pb-16 sm:pt-40 sm:pb-24">
      <div
        className="privacy-embed max-w-3xl"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Container>
  )
}
