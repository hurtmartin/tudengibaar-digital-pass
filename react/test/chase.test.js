import { describe, expect, it } from 'vitest'
import { isChaseComplete, planetStatus, solvePlanet } from '../src/lib/chase.js'

const START = { solvedCount: 0, celebrated: false }

describe('planetStatus', () => {
  it('makes the first planet next and the rest locked at the start', () => {
    expect(planetStatus(0, 0)).toBe('next')
    expect(planetStatus(1, 0)).toBe('locked')
    expect(planetStatus(7, 0)).toBe('locked')
  })

  it('marks planets before solvedCount as solved', () => {
    expect(planetStatus(0, 3)).toBe('solved')
    expect(planetStatus(2, 3)).toBe('solved')
    expect(planetStatus(3, 3)).toBe('next')
  })
})

describe('solvePlanet', () => {
  it('advances when the next planet is solved', () => {
    expect(solvePlanet(START, 0, 8)).toEqual({ solvedCount: 1, celebrated: false })
  })

  it('rejects a locked planet', () => {
    expect(solvePlanet(START, 2, 8)).toBe(START)
  })

  it('rejects an already solved planet', () => {
    const state = { solvedCount: 3, celebrated: false }
    expect(solvePlanet(state, 1, 8)).toBe(state)
  })

  it('completes on the 8th solve, once', () => {
    let state = START
    for (let i = 0; i < 8; i++) state = solvePlanet(state, i, 8)
    expect(state).toEqual({ solvedCount: 8, celebrated: true })
    expect(isChaseComplete(state.solvedCount, 8)).toBe(true)
    expect(solvePlanet(state, 8, 8)).toBe(state)
  })

  it('is not complete before the last planet', () => {
    expect(isChaseComplete(7, 8)).toBe(false)
  })
})
