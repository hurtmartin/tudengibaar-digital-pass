import { useCallback, useEffect, useMemo, useState } from 'react'
import CARDS from '../data/bingo-cards.json'
import { completedPatterns, nearCells, PATTERNS, patternCells } from '../lib/lines.js'
import { loadJSON, saveJSON } from '../lib/storage.js'

const CELEBRATIONS = [...Object.keys(PATTERNS), 'full']
const CELL_COUNT = 16

function freshBingo() {
  const card = CARDS[Math.floor(Math.random() * CARDS.length)]
  return { cardId: card.id, marked: [], celebrated: [] }
}

// Keeps saved progress valid if the card data changed after it was stored
function loadBingo() {
  const saved = loadJSON('bingo', null)
  if (!CARDS.some((c) => c.id === saved?.cardId)) return freshBingo()
  return {
    cardId: saved.cardId,
    marked: Array.isArray(saved.marked)
      ? [...new Set(saved.marked)].filter((i) => Number.isInteger(i) && i >= 0 && i < CELL_COUNT)
      : [],
    celebrated: Array.isArray(saved.celebrated) ? saved.celebrated.filter((c) => CELEBRATIONS.includes(c)) : [],
  }
}

export function useBingo() {
  const [bingo, setBingo] = useState(loadBingo)
  // Celebrations waiting to be shown, one per tap (all the wins that tap completed); the first one is on screen
  const [queue, setQueue] = useState([])
  // The card as it was before the last reset, while it can still be undone
  const [beforeReset, setBeforeReset] = useState(null)

  useEffect(() => saveJSON('bingo', bingo), [bingo])

  const card = CARDS.find((c) => c.id === bingo.cardId)
  const marked = useMemo(() => new Set(bingo.marked), [bingo.marked])
  const winCells = useMemo(() => patternCells(bingo.marked), [bingo.marked])
  const near = useMemo(() => nearCells(bingo.marked, bingo.celebrated), [bingo.marked, bingo.celebrated])

  // Stable so the toast's auto-dismiss timer isn't restarted on every render
  const dismissCelebration = useCallback(() => setQueue((q) => q.slice(1)), [])
  const dismissUndo = useCallback(() => setBeforeReset(null), [])

  // Each celebration fires once per card: the flags persist and unmarking never clears them.
  // The full card replaces any pattern wins it completes at the same time.
  function toggle(idx) {
    // Marking after a reset keeps the fresh card; an undo would silently drop the new marks
    setBeforeReset(null)
    if (marked.has(idx)) {
      setBingo({ ...bingo, marked: bingo.marked.filter((i) => i !== idx) })
      return
    }
    const next = [...bingo.marked, idx]
    const won = next.length === CELL_COUNT ? ['full'] : completedPatterns(next)
    const fresh = won.filter((kind) => !bingo.celebrated.includes(kind))
    setBingo({ ...bingo, marked: next, celebrated: [...bingo.celebrated, ...fresh] })
    if (fresh.length) setQueue((q) => [...q, fresh])
  }

  return {
    card,
    marked,
    toggle,
    winCells,
    near,
    celebration: queue[0] ?? null,
    dismissCelebration,
    // Same card, clean slate
    reset: () => {
      setQueue([])
      setBeforeReset(bingo)
      setBingo({ cardId: bingo.cardId, marked: [], celebrated: [] })
    },
    canUndoReset: beforeReset !== null,
    undoReset: () => {
      setBingo(beforeReset)
      setBeforeReset(null)
    },
    dismissUndo,
  }
}
