import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { openDb } from '../src/db.js'

let db
beforeEach(() => {
  db = openDb(':memory:')
})
afterEach(() => db.close())

describe('openDb', () => {
  it('creates every table', () => {
    const tables = db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").pluck().all()
    expect(tables).toEqual(['contenders', 'sessions', 'settings', 'votes'])
  })

  it('turns foreign keys on: a vote for an unknown contender is rejected', () => {
    expect(() =>
      db.raw.prepare("INSERT INTO votes (voter_id, contender_number, ip, updated_at) VALUES ('v1', 42, 'x', 0)").run(),
    ).toThrow(/FOREIGN KEY/)
  })

  it('starts closed with one settings row', () => {
    expect(db.getContestState()).toBe('closed')
    expect(db.raw.prepare('SELECT COUNT(*) FROM settings').pluck().get()).toBe(1)
  })

  it('rejects an invalid state string at the DB level', () => {
    expect(() => db.raw.prepare("UPDATE settings SET contest_state = 'paused'").run()).toThrow(/CHECK/)
  })
})
