// Same limits as the DB CHECKs; these give clear 400s, the DB is the backstop.
export const MAX_DESCRIPTION = 67 // also in schema.sql (CHECK) and react ContenderEditor.jsx

// Integer 1–99. Accepts a number or a digit-only string (form fields and bulk text are strings).
export function parseNumber(x) {
  const n = typeof x === 'string' && /^\s*\d{1,2}\s*$/.test(x) ? Number(x) : x
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null
}

// Trimmed, 1–MAX_DESCRIPTION characters counted as code points (NFC, so õ is always one), like SQLite's length()
export function parseDescription(s) {
  if (typeof s !== 'string') return null
  const text = s.normalize('NFC').trim()
  const length = [...text].length
  return length >= 1 && length <= MAX_DESCRIPTION ? text : null
}

// One contender per line: "7, punane tulnukas". Blank lines are skipped; bad lines are reported, not fatal.
// `line` (1-based) is kept on good lines too, so DB-level errors can point at the right line.
export function parseBulk(text) {
  const ok = []
  const errors = []
  const seen = new Set()
  String(text ?? '')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = i + 1
      if (!raw.trim()) return
      const comma = raw.indexOf(',')
      if (comma === -1) return errors.push({ line, error: 'invalid_line' })
      const number = parseNumber(raw.slice(0, comma))
      const description = parseDescription(raw.slice(comma + 1))
      if (number === null) return errors.push({ line, error: 'invalid_number' })
      if (description === null) return errors.push({ line, error: 'invalid_description' })
      if (seen.has(number)) return errors.push({ line, error: 'duplicate_number' })
      seen.add(number)
      ok.push({ line, number, description })
    })
  return { ok, errors }
}
