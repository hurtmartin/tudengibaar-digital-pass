import { describe, expect, it } from 'vitest'
import { MAX_DESCRIPTION, parseBulk, parseDescription, parseNumber } from '../src/validate.js'

describe('parseNumber', () => {
  it.each([
    [7, 7],
    ['7', 7],
    [' 12 ', 12],
    [1, 1],
    [99, 99],
    [7.5, null],
    ['7.5', null],
    [0, null],
    [100, null],
    ['100', null],
    ['', null],
    ['abc', null],
    [null, null],
    [undefined, null],
    [true, null],
  ])('%j → %j', (input, expected) => {
    expect(parseNumber(input)).toBe(expected)
  })
})

describe('parseDescription', () => {
  it('trims', () => {
    expect(parseDescription('  punane tulnukas  ')).toBe('punane tulnukas')
  })

  it('accepts MAX_DESCRIPTION characters and rejects one more, counting õäöü as one each', () => {
    const max = 'õäöü'.repeat(MAX_DESCRIPTION).slice(0, MAX_DESCRIPTION)
    expect(parseDescription(max)).toBe(max)
    expect(parseDescription(max + 'x')).toBeNull()
  })

  it('counts a decomposed õ (o + combining tilde) as one character', () => {
    const decomposed = 'õ'.repeat(MAX_DESCRIPTION)
    expect(parseDescription(decomposed)).toBe('õ'.repeat(MAX_DESCRIPTION))
  })

  it('counts emoji by code point', () => {
    expect(parseDescription('👽'.repeat(MAX_DESCRIPTION))).toBe('👽'.repeat(MAX_DESCRIPTION))
    expect(parseDescription('👽'.repeat(MAX_DESCRIPTION + 1))).toBeNull()
  })

  it('rejects empty, whitespace-only and non-strings', () => {
    expect(parseDescription('')).toBeNull()
    expect(parseDescription('   ')).toBeNull()
    expect(parseDescription(7)).toBeNull()
  })
})

describe('parseBulk', () => {
  it('parses good lines and reports blank-skipped bad and duplicate lines', () => {
    const text = ['7, punane tulnukas', '', 'kaheksa, roheline', '12, hõbedane robot, kiivriga', '7, teine seitse'].join('\n')
    expect(parseBulk(text)).toEqual({
      ok: [
        { line: 1, number: 7, description: 'punane tulnukas' },
        { line: 4, number: 12, description: 'hõbedane robot, kiivriga' },
      ],
      errors: [
        { line: 3, error: 'invalid_number' },
        { line: 5, error: 'duplicate_number' },
      ],
    })
  })

  it('reports a line without a comma, an empty description and a too-long one', () => {
    expect(parseBulk('7 punane\r\n8,\r\n9, ' + 'x'.repeat(MAX_DESCRIPTION + 1)).errors).toEqual([
      { line: 1, error: 'invalid_line' },
      { line: 2, error: 'invalid_description' },
      { line: 3, error: 'invalid_description' },
    ])
  })
})
