export function planetStatus(index, solvedCount) {
  if (index < solvedCount) return 'solved'
  return index === solvedCount ? 'next' : 'locked'
}

export function isChaseComplete(solvedCount, total) {
  return solvedCount >= total
}

// Only the `next` planet can be solved, so solved planets never have gaps.
// `celebrated` flips once, on the solve that completes the chase.
export function solvePlanet(chase, index, total) {
  if (planetStatus(index, chase.solvedCount) !== 'next' || isChaseComplete(chase.solvedCount, total)) return chase
  const solvedCount = chase.solvedCount + 1
  return { solvedCount, celebrated: chase.celebrated || isChaseComplete(solvedCount, total) }
}
