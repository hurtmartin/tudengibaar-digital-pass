import { describe, expect, it } from 'vitest'
import { EVENTS, isLive } from '../src/data/events.js'

const at = (iso) => new Date(iso).getTime()

describe('isLive', () => {
  it('is live from the start up to (not including) the end', () => {
    expect(isLive(EVENTS.bingo, at('2026-12-04T22:14:59+02:00'))).toBe(false)
    expect(isLive(EVENTS.bingo, at('2026-12-04T22:15:00+02:00'))).toBe(true)
    expect(isLive(EVENTS.bingo, at('2026-12-04T23:00:00+02:00'))).toBe(false)
  })

  it('puts the contest after midnight, on 5 Dec', () => {
    expect(isLive(EVENTS.contest, at('2026-12-05T01:00:00+02:00'))).toBe(true)
    expect(isLive(EVENTS.contest, at('2026-12-04T01:00:00+02:00'))).toBe(false)
  })

  it('is never live for the all-night chase', () => {
    expect(isLive(EVENTS.chase, at('2026-12-04T23:30:00+02:00'))).toBe(false)
  })
})
