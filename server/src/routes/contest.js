import { Hono } from 'hono'
import { clientIp } from '../clientIp.js'
import { voter } from '../middleware/voter.js'
import { createRateLimiter } from '../rateLimit.js'
import { parseNumber } from '../validate.js'

const MINUTE = 60 * 1000

export function contestRoutes(db, { isProd, cookiePath }) {
  const app = new Hono()
  // Per phone (voter cookie): stops one person hammering the button
  const allowVoter = createRateLimiter({ limit: 10, windowMs: MINUTE })
  // Per network: venue Wi-Fi puts the whole party behind one IP, so this is only a ceiling against scripts
  const allowIp = createRateLimiter({ limit: 600, windowMs: MINUTE })

  app.use(voter({ isProd, cookiePath }))

  // Shared by PUT and DELETE. The voter limit is checked first, so one spamming phone uses up only its own allowance.
  app.use('/vote', async (c, next) => {
    if (!allowVoter(c.get('voterId')) || !allowIp(clientIp(c))) return c.json({ error: 'rate_limited' }, 429)
    await next()
  })

  app.get('/', (c) =>
    c.json({
      state: db.getContestState(),
      contenders: db.listContenders(),
      myVote: db.getVote(c.get('voterId')),
    }),
  )

  app.put('/vote', async (c) => {
    const body = await c.req.json().catch(() => null)
    const number = parseNumber(body?.number)
    if (number === null) return c.json({ error: 'invalid_number' }, 400)

    // Closed/locked or unknown number throw a DbError, mapped to 409/404 in app.js.
    // The IP is stored so suspicious bursts can be spotted afterwards.
    db.castVote(c.get('voterId'), number, clientIp(c))
    return c.json({ myVote: number })
  })

  app.delete('/vote', (c) => {
    db.clearVote(c.get('voterId'))
    return c.json({ myVote: null })
  })

  return app
}
