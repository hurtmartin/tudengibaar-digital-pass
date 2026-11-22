import { describe, expect, it } from 'vitest'
import { findBursts } from '../src/bursts.js'

const S = 1000
// n votes for one contestant from one IP, `every` ms apart, starting at `start`
const series = (ip, number, n, every, start = 0) => Array.from({ length: n }, (_, i) => ({ ip, number, at: start + i * every }))
const sorted = (votes) => votes.sort((a, b) => a.ip.localeCompare(b.ip) || a.at - b.at)

describe('findBursts', () => {
  it('flags 10+ votes for one contestant from one IP, each within a minute of the last', () => {
    const bursts = findBursts(sorted(series('1.1.1.1', 7, 48, 1 * S)))
    expect(bursts).toEqual([{ ip: '1.1.1.1', number: 7, count: 48, from: 0, to: 47 * S, others: 0 }])
  })

  it('ignores small groups and slow trickles', () => {
    const votes = [...series('1.1.1.1', 7, 9, 1 * S), ...series('2.2.2.2', 7, 30, 61 * S)]
    expect(findBursts(sorted(votes))).toEqual([])
  })

  it('splits a burst at a gap over a minute', () => {
    const votes = [...series('1.1.1.1', 7, 10, S), ...series('1.1.1.1', 7, 12, S, 10 * 60 * S)]
    expect(findBursts(sorted(votes)).map((b) => b.count)).toEqual([12, 10])
  })

  it('counts votes for other contestants from the same IP during the burst', () => {
    const votes = [...series('1.1.1.1', 7, 20, S), ...series('1.1.1.1', 12, 3, 5 * S, 2 * S), ...series('1.1.1.1', 3, 1, S, 99 * S)]
    expect(findBursts(sorted(votes))[0]).toMatchObject({ number: 7, count: 20, others: 3 })
  })

  it('keeps IPs apart', () => {
    const votes = [...series('1.1.1.1', 7, 6, S), ...series('2.2.2.2', 7, 6, S)]
    expect(findBursts(sorted(votes))).toEqual([])
  })
})
