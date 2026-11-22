import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { DbError } from './db.js'
import { adminRoutes } from './routes/admin.js'
import { contestRoutes } from './routes/contest.js'

// Rules the DB enforces, as HTTP statuses. Routes just call db.* and let these bubble up.
const DB_ERROR_STATUS = {
  voting_not_open: 409,
  unknown_contender: 404,
  duplicate_number: 409,
  invalid_contender: 400,
  has_votes: 409,
  not_found: 404,
}

// Built from config instead of env so tests can create it with an in-memory DB and no port
export function createApp(db, { adminPasswordSha256, staticDir, basePath = '/', isProd = false }) {
  // '/' → '', '/tudengibaar/' → '/tudengibaar'; every route below hangs off it
  const base = basePath.replace(/\/+$/, '')
  const app = new Hono()

  const api = new Hono()
  api.get('/health', (c) => c.json({ ok: true, sqlite: db.sqliteVersion() }))
  api.route('/contest', contestRoutes(db, { isProd, cookiePath: `${base}/api/contest` }))
  api.route('/admin', adminRoutes(db, { adminPasswordSha256, isProd, cookiePath: `${base}/api/admin` }))
  app.route(`${base}/api`, api)
  app.all(`${base}/api/*`, (c) => c.json({ error: 'not_found' }, 404))

  if (staticDir) {
    app.use(`${base}/*`, serveStatic({ root: staticDir, rewriteRequestPath: (path) => path.slice(base.length) }))
    // SPA fallback: deep links like /bingo get index.html and the router takes over
    app.get(`${base}/*`, serveStatic({ root: staticDir, path: 'index.html' }))
  }

  app.onError((err, c) => {
    if (err instanceof DbError && DB_ERROR_STATUS[err.code]) return c.json({ error: err.code }, DB_ERROR_STATUS[err.code])
    console.error(err)
    return c.json({ error: 'internal' }, 500)
  })

  return app
}
