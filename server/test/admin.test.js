import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDb } from '../src/db.js'
import { MAX_DESCRIPTION } from '../src/validate.js'

const PASSWORD = 'Test1234Test1234'
const HASH = createHash('sha256').update(PASSWORD).digest('hex')

let db
let app
let ipCounter = 0

beforeEach(() => {
  db = openDb(':memory:')
  app = createApp(db, { adminPasswordSha256: HASH })
})
afterEach(() => db.close())

// A browser at one IP that keeps the cookies it is given
function client(ip = `10.1.0.${++ipCounter}`) {
  const jar = new Map()
  return async (method, path, body) => {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    const res = await app.request(`/api/admin${path}`, {
      method,
      headers: { cookie, 'x-forwarded-for': ip, ...(body !== undefined && { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    for (const set of res.headers.getSetCookie()) {
      const [pair, ...attrs] = set.split(';')
      const [name, value] = pair.split('=')
      if (attrs.some((a) => /max-age=0/i.test(a)) || value === '') jar.delete(name)
      else jar.set(name, value)
    }
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: res.headers.get('set-cookie') }
  }
}

async function loggedIn() {
  const req = client()
  expect((await req('POST', '/login', { password: PASSWORD })).status).toBe(204)
  return req
}

describe('login / session / logout', () => {
  it('rejects a wrong password with 401', async () => {
    expect(await client()('POST', '/login', { password: 'nope' })).toMatchObject({ status: 401, body: { error: 'bad_password' } })
  })

  it('rate-limits the 6th attempt in a minute with 429', async () => {
    const req = client()
    for (let i = 0; i < 5; i++) expect((await req('POST', '/login', { password: 'nope' })).status).toBe(401)
    expect(await req('POST', '/login', { password: PASSWORD })).toMatchObject({ status: 429, body: { error: 'rate_limited' } })
  })

  it('sets a strict httpOnly session cookie on the right password', async () => {
    const res = await client()('POST', '/login', { password: PASSWORD })
    expect(res.status).toBe(204)
    expect(res.setCookie).toMatch(/^admin_session=[\w-]{43};/)
    expect(res.setCookie).toMatch(/HttpOnly/)
    expect(res.setCookie).toMatch(/SameSite=Strict/)
    expect(res.setCookie).toMatch(/Path=\/api\/admin/)
    expect(res.setCookie).toMatch(/Max-Age=43200/)
  })

  it('protects admin routes: 401 without a cookie, 200 with it, 401 after logout', async () => {
    expect(await client()('GET', '/results')).toMatchObject({ status: 401, body: { error: 'unauthorized' } })
    const req = await loggedIn()
    expect((await req('GET', '/session')).status).toBe(204)
    expect((await req('GET', '/results')).status).toBe(200)
    expect((await req('POST', '/logout')).status).toBe(204)
    expect((await req('GET', '/results')).status).toBe(401)
    expect((await req('GET', '/session')).status).toBe(401)
    expect(db.raw.prepare('SELECT COUNT(*) FROM sessions').pluck().get()).toBe(0)
  })

  it('rejects a forged or expired session token', async () => {
    db.createSession('expired', Date.now() - 1)
    for (const token of ['forged', 'expired']) {
      const res = await app.request('/api/admin/results', { headers: { cookie: `admin_session=${token}` } })
      expect(res.status).toBe(401)
    }
    expect(db.raw.prepare('SELECT COUNT(*) FROM sessions').pluck().get()).toBe(0) // expired one cleaned up
  })
})

describe('contenders', () => {
  it('adds one, and rejects a duplicate number with 409 and bad input with 400', async () => {
    const req = await loggedIn()
    expect(await req('POST', '/contenders', { number: 7, description: ' punane tulnukas ' })).toMatchObject({
      status: 201,
      body: { number: 7, description: 'punane tulnukas' },
    })
    expect(await req('POST', '/contenders', { number: 7, description: 'teine' })).toMatchObject({
      status: 409,
      body: { error: 'duplicate_number' },
    })
    expect((await req('POST', '/contenders', { number: 100, description: 'x' })).body).toEqual({ error: 'invalid_number' })
    expect((await req('POST', '/contenders', { number: 8, description: 'x'.repeat(MAX_DESCRIPTION + 1) })).body).toEqual({
      error: 'invalid_description',
    })
  })

  it('bulk-adds valid lines and reports bad, duplicate and already-registered lines', async () => {
    const req = await loggedIn()
    db.addContender(3, 'juba olemas')
    const text = ['7, punane tulnukas', 'x, halb', '', '3, uuesti kolm', '7, teine seitse', '12, robot'].join('\n')
    expect(await req('POST', '/contenders/bulk', { text })).toMatchObject({
      status: 200,
      body: {
        added: 2,
        errors: [
          { line: 2, error: 'invalid_number' },
          { line: 4, error: 'duplicate_number' },
          { line: 5, error: 'duplicate_number' },
        ],
      },
    })
    expect(db.listContenders().map((c) => c.number)).toEqual([3, 7, 12])
  })

  it('deletes a contender without votes; 404 when missing, 409 when it has votes', async () => {
    const req = await loggedIn()
    db.addContender(7, 'a')
    db.addContender(8, 'b')
    db.setContestState('closed', 'open')
    db.castVote('voter-1', 8, 'ip')
    expect((await req('DELETE', '/contenders/7')).status).toBe(204)
    expect(await req('DELETE', '/contenders/7')).toMatchObject({ status: 404, body: { error: 'not_found' } })
    expect(await req('DELETE', '/contenders/8')).toMatchObject({ status: 409, body: { error: 'has_votes' } })
  })
})

describe('contest state', () => {
  it('allows only closed→open, open→locked, locked→open', async () => {
    const req = await loggedIn()
    expect(await req('PUT', '/contest-state', { state: 'locked' })).toMatchObject({
      status: 409,
      body: { error: 'invalid_transition' },
    })
    expect(await req('PUT', '/contest-state', { state: 'paused' })).toMatchObject({ status: 400, body: { error: 'invalid_state' } })
    expect(await req('PUT', '/contest-state', { state: 'open' })).toMatchObject({ status: 200, body: { state: 'open' } })
    expect(await req('PUT', '/contest-state', { state: 'locked' })).toMatchObject({ status: 200, body: { state: 'locked' } })
    expect(await req('PUT', '/contest-state', { state: 'open' })).toMatchObject({ status: 200, body: { state: 'open' } })
    expect((await req('PUT', '/contest-state', { state: 'closed' })).status).toBe(409)
  })
})

describe('results', () => {
  it('includes zero-vote contenders, sorted by votes desc then number asc, with a total', async () => {
    const req = await loggedIn()
    for (const n of [5, 9, 2]) db.addContender(n, `c${n}`)
    db.setContestState('closed', 'open')
    db.castVote('a', 9, 'ip')
    db.castVote('b', 9, 'ip')
    db.castVote('c', 5, 'ip')
    expect((await req('GET', '/results')).body).toEqual({
      state: 'open',
      totalVotes: 3,
      rows: [
        { number: 9, description: 'c9', votes: 2 },
        { number: 5, description: 'c5', votes: 1 },
        { number: 2, description: 'c2', votes: 0 },
      ],
      bursts: [],
    })
  })
})

describe('suspicious bursts', () => {
  // 15 votes for #7 from one IP a second apart, plus a normal voter elsewhere
  function stuffBallots() {
    db.addContender(7, 'tulnukas')
    db.addContender(8, 'robot')
    db.setContestState('closed', 'open')
    for (let i = 0; i < 15; i++) db.castVote(`bot-${i}`, 7, '6.6.6.6', 1_000_000 + i * 1000)
    db.castVote('human', 8, '6.6.6.6', 1_005_000)
    db.castVote('elsewhere', 7, '7.7.7.7', 1_005_000)
  }

  it('reports a burst in the results', async () => {
    const req = await loggedIn()
    stuffBallots()
    expect((await req('GET', '/results')).body.bursts).toEqual([
      { ip: '6.6.6.6', number: 7, count: 15, from: 1_000_000, to: 1_014_000, others: 1 },
    ])
  })

  it('deletes exactly that burst, also after voting is locked', async () => {
    const req = await loggedIn()
    stuffBallots()
    db.setContestState('open', 'locked')
    const burst = (await req('GET', '/results')).body.bursts[0]
    expect(await req('POST', '/bursts/delete', burst)).toMatchObject({ status: 200, body: { deleted: 15 } })
    const after = (await req('GET', '/results')).body
    expect(after.bursts).toEqual([])
    // The human on the same IP and the voter elsewhere keep their votes
    expect(after.rows).toEqual([
      { number: 7, description: 'tulnukas', votes: 1 },
      { number: 8, description: 'robot', votes: 1 },
    ])
  })

  it('rejects a malformed delete request', async () => {
    const req = await loggedIn()
    for (const body of [{}, { ip: '', number: 7, from: 0, to: 1 }, { ip: '1.1.1.1', number: 7, from: 5, to: 1 }, { ip: '1.1.1.1', number: 'x', from: 0, to: 1 }]) {
      expect(await req('POST', '/bursts/delete', body)).toMatchObject({ status: 400, body: { error: 'invalid_burst' } })
    }
  })

  it('requires admin', async () => {
    expect((await client()('POST', '/bursts/delete', { ip: '1.1.1.1', number: 7, from: 0, to: 1 })).status).toBe(401)
  })
})
