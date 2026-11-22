import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDb } from '../src/db.js'

let db
let app
let ipCounter = 0

beforeEach(() => {
  db = openDb(':memory:')
  db.addContender(7, 'punane tulnukas')
  db.addContender(12, 'hõbedane robot')
  app = createApp(db, { adminPasswordSha256: '0'.repeat(64) })
})
afterEach(() => db.close())

// A phone: keeps its cookie between requests, like a browser would
function phone(ip = `10.0.0.${++ipCounter}`) {
  let cookie = ''
  return async (method, path, body) => {
    const res = await app.request(`/api/contest${path}`, {
      method,
      headers: { cookie, 'x-forwarded-for': ip, ...(body && { 'content-type': 'application/json' }) },
      body: body && JSON.stringify(body),
    })
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    return { status: res.status, body: await res.json(), setCookie: set }
  }
}

const open = () => db.setContestState('closed', 'open')
const voteRows = () => db.raw.prepare('SELECT COUNT(*) FROM votes').pluck().get()

describe('GET /api/contest', () => {
  it('sets an httpOnly voter cookie on the first visit only', async () => {
    const req = phone()
    const first = await req('GET', '')
    expect(first.setCookie).toMatch(/^voter_id=[0-9a-f-]{36};/)
    expect(first.setCookie).toMatch(/HttpOnly/)
    expect(first.setCookie).toMatch(/SameSite=Lax/)
    expect(first.setCookie).toMatch(/Path=\/api\/contest/)
    expect((await req('GET', '')).setCookie).toBeNull()
  })

  it('returns state, contenders and no vote yet', async () => {
    expect((await phone()('GET', '')).body).toEqual({
      state: 'closed',
      contenders: [
        { number: 7, description: 'punane tulnukas' },
        { number: 12, description: 'hõbedane robot' },
      ],
      myVote: null,
    })
  })
})

describe('PUT /api/contest/vote', () => {
  it('rejects votes while closed and while locked', async () => {
    const req = phone()
    expect(await req('PUT', '/vote', { number: 7 })).toMatchObject({ status: 409, body: { error: 'voting_not_open' } })
    open()
    db.setContestState('open', 'locked')
    expect(await req('PUT', '/vote', { number: 7 })).toMatchObject({ status: 409, body: { error: 'voting_not_open' } })
    expect(voteRows()).toBe(0)
  })

  it('rejects an unknown contender with 404 and bad input with 400', async () => {
    open()
    const req = phone()
    expect(await req('PUT', '/vote', { number: 42 })).toMatchObject({ status: 404, body: { error: 'unknown_contender' } })
    expect(await req('PUT', '/vote', { number: 0 })).toMatchObject({ status: 400, body: { error: 'invalid_number' } })
    expect(await req('PUT', '/vote', { number: 'x' })).toMatchObject({ status: 400, body: { error: 'invalid_number' } })
  })

  it('records a vote, and a second vote replaces it (one row, not two)', async () => {
    open()
    const req = phone()
    expect(await req('PUT', '/vote', { number: 7 })).toMatchObject({ status: 200, body: { myVote: 7 } })
    expect(await req('PUT', '/vote', { number: 12 })).toMatchObject({ status: 200, body: { myVote: 12 } })
    expect(voteRows()).toBe(1)
    expect((await req('GET', '')).body.myVote).toBe(12)
  })

  it('rate-limits each phone to 10 vote requests per minute', async () => {
    open()
    const req = phone('10.8.8.8')
    for (let i = 0; i < 10; i++) expect((await req('PUT', '/vote', { number: 7 })).status).toBe(200)
    expect(await req('PUT', '/vote', { number: 7 })).toMatchObject({ status: 429, body: { error: 'rate_limited' } })
    // Another phone on the same Wi-Fi is not affected
    expect((await phone('10.8.8.8')('PUT', '/vote', { number: 12 })).status).toBe(200)
  })

  it('lets a whole party on one Wi-Fi vote (200 phones, one IP)', async () => {
    open()
    const party = Array.from({ length: 200 }, () => phone('10.7.7.7'))
    const statuses = await Promise.all(party.map((req, i) => req('PUT', '/vote', { number: i % 2 ? 7 : 12 }).then((r) => r.status)))
    expect(statuses.every((s) => s === 200)).toBe(true)
    expect(voteRows()).toBe(200)
  })

  it('caps one IP at 600 vote requests per minute', async () => {
    open()
    for (let i = 0; i < 600; i++) expect((await phone('10.6.6.6')('PUT', '/vote', { number: 7 })).status).toBe(200)
    expect((await phone('10.6.6.6')('PUT', '/vote', { number: 7 })).status).toBe(429)
    // Other networks still vote
    expect((await phone('10.6.6.7')('PUT', '/vote', { number: 7 })).status).toBe(200)
  })
})

describe('DELETE /api/contest/vote', () => {
  it('removes the vote while open', async () => {
    open()
    const req = phone()
    await req('PUT', '/vote', { number: 7 })
    expect(await req('DELETE', '/vote')).toMatchObject({ status: 200, body: { myVote: null } })
    expect(voteRows()).toBe(0)
  })

  it('is blocked once voting is locked, and the vote stays', async () => {
    open()
    const req = phone()
    await req('PUT', '/vote', { number: 7 })
    db.setContestState('open', 'locked')
    expect(await req('DELETE', '/vote')).toMatchObject({ status: 409, body: { error: 'voting_not_open' } })
    expect((await req('GET', '')).body.myVote).toBe(7)
  })
})
