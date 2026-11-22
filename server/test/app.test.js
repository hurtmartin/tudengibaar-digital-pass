import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDb } from '../src/db.js'

const staticDir = mkdtempSync(join(tmpdir(), 'pass-static-'))
writeFileSync(join(staticDir, 'index.html'), '<!doctype html><title>spa</title>')
writeFileSync(join(staticDir, 'app.js'), 'console.log(1)')

const db = openDb(':memory:')
afterAll(() => db.close())

describe.each([
  ['/', ''],
  ['/tudengibaar/', '/tudengibaar'],
])('app with BASE_PATH=%s', (basePath, prefix) => {
  const app = createApp(db, { adminPasswordSha256: '0'.repeat(64), staticDir, basePath })

  it('reports health with the SQLite version', async () => {
    const res = await app.request(`${prefix}/api/health`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, sqlite: expect.stringMatching(/^3\./) })
  })

  it('serves static files', async () => {
    const res = await app.request(`${prefix}/app.js`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('console.log(1)')
  })

  it('falls back to index.html for deep links and unknown files', async () => {
    for (const path of ['/', '/bingo', '/tudengibaar.db']) {
      const res = await app.request(`${prefix}${path}`)
      expect(res.status).toBe(200)
      expect(await res.text()).toContain('<title>spa</title>')
    }
  })

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await app.request(`${prefix}/api/nope`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'not_found' })
  })
})
