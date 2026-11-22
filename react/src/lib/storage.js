// v3 digital pass: one object { lang, bingo, chase, contest }; each hook owns one field.
// `contest` is only a cache of the server's { state, myVote } so home can draw the right button before it answers.
const PASS_KEY = 'tudengibaar-pass:v3'

function readPass() {
  try {
    const saved = JSON.parse(localStorage.getItem(PASS_KEY))
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export function loadJSON(key, fallback) {
  return readPass()[key] ?? fallback
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PASS_KEY, JSON.stringify({ ...readPass(), [key]: value }))
  } catch {
    // Storage blocked: state lives only in memory this session
  }
}
