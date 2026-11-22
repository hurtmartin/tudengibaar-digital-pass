export const GRID_SIZE = 4

const LINE = [0, 1, 2, 3]

// Win patterns by cell index (0–15): every row, every column, both diagonals and the four corners
export const PATTERNS = {
  ...Object.fromEntries(LINE.map((r) => [`row-${r}`, LINE.map((c) => r * GRID_SIZE + c)])),
  ...Object.fromEntries(LINE.map((c) => [`col-${c}`, LINE.map((r) => r * GRID_SIZE + c)])),
  'diag-main': [0, 5, 10, 15],
  'diag-anti': [3, 6, 9, 12],
  corners: [0, 3, 12, 15],
}

// Names of every pattern whose cells are all marked
export function completedPatterns(markedIdx) {
  const marked = new Set(markedIdx)
  return Object.keys(PATTERNS).filter((name) => PATTERNS[name].every((i) => marked.has(i)))
}

// Set of cell indexes that belong to at least one completed pattern
export function patternCells(markedIdx) {
  return new Set(completedPatterns(markedIdx).flatMap((name) => PATTERNS[name]))
}

// Unmarked cells that are the last one missing from a win not had yet (a pattern or the full card)
export function nearCells(markedIdx, won) {
  const marked = new Set(markedIdx)
  const near = new Set()
  const goals = Object.entries(PATTERNS)
  if (!won.includes('full')) goals.push(['full', Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)])
  for (const [name, cells] of goals) {
    if (won.includes(name)) continue
    const missing = cells.filter((i) => !marked.has(i))
    if (missing.length === 1) near.add(missing[0])
  }
  return near
}
