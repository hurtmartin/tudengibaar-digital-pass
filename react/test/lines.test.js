import { describe, expect, it } from 'vitest'
import { completedPatterns, nearCells, patternCells } from '../src/lib/lines.js'

const ALL = Array.from({ length: 16 }, (_, i) => i)

describe('completedPatterns', () => {
  it('finds the main diagonal', () => {
    expect(completedPatterns([0, 5, 10, 15])).toEqual(['diag-main'])
  })

  it('finds the anti diagonal', () => {
    expect(completedPatterns([3, 6, 9, 12])).toEqual(['diag-anti'])
  })

  it('finds the four corners', () => {
    expect(completedPatterns([0, 3, 12, 15])).toEqual(['corners'])
  })

  it('finds a row and a column', () => {
    expect(completedPatterns([4, 5, 6, 7])).toEqual(['row-1'])
    expect(completedPatterns([1, 5, 9, 13])).toEqual(['col-1'])
  })

  it('lists every pattern on a full card', () => {
    expect(completedPatterns(ALL)).toHaveLength(11)
  })

  it('drops a pattern once one of its cells is unmarked', () => {
    expect(completedPatterns([0, 5, 10])).toEqual([])
  })
})

describe('patternCells', () => {
  it('returns the cells of completed patterns only', () => {
    expect([...patternCells([0, 5, 10, 15, 1])].sort((a, b) => a - b)).toEqual([0, 5, 10, 15])
  })
})

describe('nearCells', () => {
  it('returns the one cell missing from a pattern', () => {
    expect([...nearCells([4, 5, 6], [])]).toEqual([7])
  })

  it('ignores patterns already won', () => {
    expect([...nearCells([4, 5, 6], ['row-1'])]).toEqual([])
  })

  it('returns the last cell of the full card until the card is won', () => {
    expect(nearCells(ALL.slice(1), ['row-0', 'col-0', 'diag-main', 'corners'])).toEqual(new Set([0]))
    expect(nearCells(ALL.slice(1), ['full', ...completedPatterns(ALL)])).toEqual(new Set())
  })

  it('is empty when nothing is one away', () => {
    expect(nearCells([0, 1], [])).toEqual(new Set())
  })
})
