// Spots likely scripted voting: many votes for one contestant from one IP, each within GAP_MS of the last.
// Venue Wi-Fi puts real voters behind one IP too, so this only flags; the admin decides what to delete.
// `others` (votes from the same IP for other contestants during the burst) helps tell a crowd from a script:
// a crowd spreads its votes, a script doesn't.
export const BURST_GAP_MS = 60 * 1000
export const BURST_MIN_VOTES = 10

// votes: [{ ip, number, at }] sorted by ip, then at
export function findBursts(votes, { gapMs = BURST_GAP_MS, minVotes = BURST_MIN_VOTES } = {}) {
  const byIp = new Map()
  for (const v of votes) {
    if (!byIp.has(v.ip)) byIp.set(v.ip, [])
    byIp.get(v.ip).push(v)
  }

  const bursts = []
  for (const [ip, ipVotes] of byIp) {
    const open = new Map() // contestant number → burst being built
    const close = (b) => b.count >= minVotes && bursts.push(b)
    for (const v of ipVotes) {
      const b = open.get(v.number)
      if (b && v.at - b.to <= gapMs) {
        b.count += 1
        b.to = v.at
      } else {
        if (b) close(b)
        open.set(v.number, { ip, number: v.number, count: 1, from: v.at, to: v.at })
      }
    }
    for (const b of open.values()) close(b)
    for (const b of bursts) {
      if (b.ip !== ip) continue
      b.others = ipVotes.filter((v) => v.number !== b.number && v.at >= b.from && v.at <= b.to).length
    }
  }
  return bursts.sort((a, b) => b.count - a.count || a.from - b.from)
}
