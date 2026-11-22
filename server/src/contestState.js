export const CONTEST_STATE = Object.freeze({ CLOSED: 'closed', OPEN: 'open', LOCKED: 'locked' })

// locked → open lets an admin undo a lock pressed by mistake
const TRANSITIONS = Object.freeze({
  closed: ['open'],
  open: ['locked'],
  locked: ['open'],
})

export function isContestState(value) {
  return Object.values(CONTEST_STATE).includes(value)
}

export function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to) ?? false
}
