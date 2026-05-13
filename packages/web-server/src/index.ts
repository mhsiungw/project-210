import './env.js'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bookRoutes } from './routes/books.js'
import { translationRoutes } from './routes/translations.js'

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5174',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)

app.route('/api/books', bookRoutes)
app.route('/api/translations', translationRoutes)

app.get('/api/pdf', async c => {
  const url = c.req.query('url')
  if (!url) return c.json({ error: 'url is required' }, 400)
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  return c.body(buffer, 200, { 'Content-Type': 'application/pdf' })
})

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`web-server listening on :${port}`)
})
