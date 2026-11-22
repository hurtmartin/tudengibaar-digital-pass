import { useCallback, useEffect, useState } from 'react'
import { PLANETS } from '../data/planets.js'
import { planetStatus, solvePlanet } from '../lib/chase.js'
import { checkCode } from '../lib/hash.js'
import { loadJSON, saveJSON } from '../lib/storage.js'

const TOTAL = PLANETS.length

function loadChase() {
  const saved = loadJSON('chase', null)
  const n = saved?.solvedCount
  return {
    solvedCount: Number.isInteger(n) ? Math.min(Math.max(n, 0), TOTAL) : 0,
    celebrated: saved?.celebrated === true,
  }
}

export function useChase() {
  const [chase, setChase] = useState(loadChase)
  const [celebrating, setCelebrating] = useState(false)
  // Index solved in this visit, so only a fresh solve animates (not a reload)
  const [justSolved, setJustSolved] = useState(null)

  useEffect(() => saveJSON('chase', chase), [chase])

  const statusOf = (i) => planetStatus(i, chase.solvedCount)

  // Locked or solved planets are rejected before the answer is even checked
  async function submit(i, answer) {
    if (statusOf(i) !== 'next') return false
    if (!(await checkCode(answer, PLANETS[i].hash))) return false
    const next = solvePlanet(chase, i, TOTAL)
    setChase(next)
    setJustSolved(i)
    if (next.celebrated && !chase.celebrated) setCelebrating(true)
    return true
  }

  const dismiss = useCallback(() => setCelebrating(false), [])

  return { solvedCount: chase.solvedCount, total: TOTAL, statusOf, submit, justSolved, celebrating, dismiss }
}
