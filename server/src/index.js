import { serve } from '@hono/node-server'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { openDb } from './db.js'

// All host specifics come from env (cPanel → Setup Node.js App → Environment variables)
const env = process.env
const isProd = env.NODE_ENV === 'production'
const adminPasswordSha256 = env.ADMIN_PASSWORD_SHA256 ?? ''

if (!/^[0-9a-f]{64}$/i.test(adminPasswordSha256)) {
  console.error('ADMIN_PASSWORD_SHA256 must be 64 hex chars. Generate one with: npm run admin-password')
  process.exit(1)
}
// In production the DB must live outside public_html, so there is no safe default
if (isProd && !env.DB_PATH) {
  console.error('DB_PATH is required in production (a path outside public_html)')
  process.exit(1)
}

const dbPath = env.DB_PATH ?? 'tudengibaar.db'
mkdirSync(dirname(dbPath), { recursive: true })
const db = openDb(dbPath)

// public/ only exists after a web build is copied in; in dev Vite serves the frontend
const staticDir = fileURLToPath(new URL('../public', import.meta.url))

const app = createApp(db, {
  adminPasswordSha256: adminPasswordSha256.toLowerCase(),
  isProd,
  basePath: env.BASE_PATH ?? '/',
  staticDir: existsSync(staticDir) ? staticDir : undefined,
})

// Passenger intercepts listen() itself, so PORT only matters when run directly
const port = Number(env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, () => console.log(`tudengibaar-pass listening on :${port} (db: ${dbPath})`))
