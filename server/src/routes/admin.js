import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { findBursts } from '../bursts.js'
import { clientIp } from '../clientIp.js'
import { canTransition, isContestState } from '../contestState.js'
import { DbError } from '../db.js'
import { requireAdmin, SESSION_COOKIE } from '../middleware/requireAdmin.js'
import { createRateLimiter } from '../rateLimit.js'
import { parseBulk, parseDescription, parseNumber } from '../validate.js'

const SESSION_MS = 12 * 60 * 60 * 1000

export function adminRoutes(db, { adminPasswordSha256, isProd, cookiePath }) {
  const app = new Hono()
  const allowLogin = createRateLimiter({ limit: 5, windowMs: 60 * 1000 })
  const expected = Buffer.from(adminPasswordSha256, 'hex')
  const cookieOptions = { httpOnly: true, sameSite: 'Strict', secure: isProd, path: cookiePath }

  // --- Public: the only routes registered before requireAdmin ---

  app.post('/login', async (c) => {
    if (!allowLogin(clientIp(c))) return c.json({ error: 'rate_limited' }, 429)
    const body = await c.req.json().catch(() => null)
    const password = typeof body?.password === 'string' ? body.password : ''
    // Both sides are 32-byte digests, so timingSafeEqual never sees different lengths
    const given = createHash('sha256').update(password).digest()
    if (!timingSafeEqual(given, expected)) return c.json({ error: 'bad_password' }, 401)

    const token = randomBytes(32).toString('base64url')
    db.createSession(token, Date.now() + SESSION_MS)
    setCookie(c, SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MS / 1000 })
    return c.body(null, 204)
  })

  app.post('/logout', (c) => {
    const token = getCookie(c, SESSION_COOKIE)
    if (token) db.deleteSession(token)
    deleteCookie(c, SESSION_COOKIE, cookieOptions)
    return c.body(null, 204)
  })

  // Lets the UI choose between the login form and the dashboard
  app.get('/session', (c) => {
    const token = getCookie(c, SESSION_COOKIE)
    return token && db.isSessionValid(token) ? c.body(null, 204) : c.json({ error: 'unauthorized' }, 401)
  })

  // --- Everything registered below this line requires a valid session ---
  app.use('*', requireAdmin(db))

  app.get('/results', (c) => {
    const rows = db.results()
    return c.json({
      state: db.getContestState(),
      totalVotes: rows.reduce((sum, r) => sum + r.votes, 0),
      rows,
      bursts: findBursts(db.voteLog()),
    })
  })

  // Deletes exactly the votes of one reported burst: same IP and contestant, inside its time range
  app.post('/bursts/delete', async (c) => {
    const body = await c.req.json().catch(() => null)
    const number = parseNumber(body?.number)
    const { ip, from, to } = body ?? {}
    const validRange = Number.isSafeInteger(from) && Number.isSafeInteger(to) && from <= to
    if (typeof ip !== 'string' || ip === '' || number === null || !validRange) return c.json({ error: 'invalid_burst' }, 400)
    return c.json({ deleted: db.deleteBurst(ip, number, from, to) })
  })

  app.post('/contenders', async (c) => {
    const body = await c.req.json().catch(() => null)
    const number = parseNumber(body?.number)
    if (number === null) return c.json({ error: 'invalid_number' }, 400)
    const description = parseDescription(body?.description)
    if (description === null) return c.json({ error: 'invalid_description' }, 400)
    db.addContender(number, description) // duplicate → 409 via app.onError
    return c.json({ number, description }, 201)
  })

  // Valid lines are inserted even when others fail; every failure is reported with its line number
  app.post('/contenders/bulk', async (c) => {
    const body = await c.req.json().catch(() => null)
    const { ok, errors } = parseBulk(body?.text)
    let added = 0
    for (const { line, number, description } of ok) {
      try {
        db.addContender(number, description)
        added += 1
      } catch (err) {
        if (!(err instanceof DbError)) throw err
        errors.push({ line, error: err.code })
      }
    }
    errors.sort((a, b) => a.line - b.line)
    return c.json({ added, errors })
  })

  app.delete('/contenders/:number', (c) => {
    const number = parseNumber(c.req.param('number'))
    if (number === null) return c.json({ error: 'invalid_number' }, 400)
    db.deleteContender(number) // missing → 404, has votes → 409 via app.onError
    return c.body(null, 204)
  })

  app.put('/contest-state', async (c) => {
    const body = await c.req.json().catch(() => null)
    const to = body?.state
    if (!isContestState(to)) return c.json({ error: 'invalid_state' }, 400)
    const from = db.getContestState()
    // Compare-and-set, so two admins pressing at once can't skip a state
    if (!canTransition(from, to) || !db.setContestState(from, to)) return c.json({ error: 'invalid_transition' }, 409)
    return c.json({ state: to })
  })

  return app
}
