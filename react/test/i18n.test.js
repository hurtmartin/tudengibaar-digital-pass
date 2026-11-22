import { describe, expect, it } from 'vitest'
import en from '../src/i18n/en.js'
import et from '../src/i18n/et.js'

// Every key path, e.g. "stateLabel.open"; arrays count as one leaf with their length
function shape(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix + key
    if (Array.isArray(value)) return [`${path}[${value.length}]`]
    if (value && typeof value === 'object') return shape(value, `${path}.`)
    return [`${path}:${typeof value}`]
  })
}

describe('i18n', () => {
  it('has the same keys, value types and list lengths in both languages', () => {
    expect(shape(en).sort()).toEqual(shape(et).sort())
  })
})
