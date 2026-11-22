import { describe, expect, it } from 'vitest'
import { normalizeCode } from '../src/lib/normalize.js'

describe('normalizeCode', () => {
  it('ignores case and extra spaces', () => {
    expect(normalizeCode('  Suur   KARU ')).toBe('suur karu')
  })

  it('drops Estonian accents', () => {
    expect(normalizeCode('Õun')).toBe(normalizeCode('oun'))
    expect(normalizeCode('Äär')).toBe(normalizeCode('aar'))
    expect(normalizeCode('öö')).toBe(normalizeCode('oo'))
    expect(normalizeCode('šokolaad žürii')).toBe(normalizeCode('sokolaad zurii'))
  })

  it('treats ü, y and u as the same letter', () => {
    expect(normalizeCode('müts')).toBe(normalizeCode('myts'))
    expect(normalizeCode('müts')).toBe(normalizeCode('muts'))
  })

  it('matches a decomposed õ (o + combining tilde) too', () => {
    expect(normalizeCode('õun')).toBe(normalizeCode('õun'))
  })
})
