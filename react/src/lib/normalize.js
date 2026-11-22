// Shared by the app and scripts/hash-code.js, so both hash the same string.
// Forgiving: trims, collapses whitespace, lowercases, and drops accents so a phone without Estonian
// letters still works: õ ä ö → o a o, š ž → s z, and ü and y → u (y is how ü is often typed).
export function normalizeCode(input) {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/y/g, 'u')
}
