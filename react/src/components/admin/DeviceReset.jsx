import { useCallback, useEffect, useState } from 'react'
import { ADMIN_UNDO_MS } from '../../constants.js'
import { PLANETS } from '../../data/planets.js'
import { deleteVote, getContest, putVote } from '../../lib/api.js'
import { loadJSON, saveJSON } from '../../lib/storage.js'
import UndoBar from '../UndoBar.jsx'

// Progress kept in this browser. `contest` is only home's cached copy of the vote; `lang` is left alone.
const LOCAL_KEYS = ['bingo', 'chase', 'contest']

// Soft reset of THIS browser's progress: bingo card, planet chase and its contest vote. Bingo and the chase live
// only on the phone, so this can't reach anyone else's; to help a guest, log in to /admin on their phone.
// Resets at once; "Võta tagasi" puts everything back, the vote too (re-cast, so only while voting is open).
export default function DeviceReset({ t }) {
  const [myVote, setMyVote] = useState(null)
  const [undo, setUndo] = useState(null) // { local, vote }: what was here before the reset
  const [note, setNote] = useState(null) // why the vote couldn't be cleared or restored
  const [busy, setBusy] = useState(false)
  const [, setStorageVersion] = useState(0) // localStorage isn't React state: bump after writing so the summary redraws
  const closeUndo = useCallback(() => setUndo(null), [])

  useEffect(() => {
    getContest().then(
      (d) => setMyVote(d.myVote),
      () => {}, // offline: the vote just isn't shown; the local reset still works
    )
  }, [])

  const voteError = (code) => (code === 'voting_not_open' ? t.deviceVoteNotOpen : (t.adminErrors[code] ?? t.adminErrorFallback))
  // Writing undefined drops the key (JSON.stringify skips it), so the pages start fresh
  const writeLocal = (values) => LOCAL_KEYS.forEach((k) => saveJSON(k, values[k] ?? undefined))

  async function handleReset() {
    setBusy(true)
    setNote(null)
    const local = Object.fromEntries(LOCAL_KEYS.map((k) => [k, loadJSON(k, null)]))
    writeLocal({})
    let vote = null
    if (myVote !== null) {
      try {
        await deleteVote()
        vote = myVote
        setMyVote(null)
      } catch (err) {
        setNote(`${t.deviceVoteKept}: ${voteError(err.code)}`)
      }
    }
    setBusy(false)
    setStorageVersion((v) => v + 1)
    setUndo({ local, vote })
  }

  async function handleUndo() {
    const { local, vote } = undo
    setUndo(null)
    writeLocal(local)
    setStorageVersion((v) => v + 1)
    if (vote === null) return
    try {
      await putVote(vote)
      setMyVote(vote)
    } catch (err) {
      setNote(`${t.deviceVoteNotRestored}: ${voteError(err.code)}`)
    }
  }

  const marked = loadJSON('bingo', null)?.marked?.length ?? 0
  const solved = loadJSON('chase', null)?.solvedCount ?? 0
  const hasProgress = LOCAL_KEYS.some((k) => loadJSON(k, null) !== null) || myVote !== null

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-surface/85 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg font-extrabold text-ink">{t.deviceTitle}</h2>
        <p className="text-xs text-muted">{t.deviceHint}</p>
        <p className="text-sm font-semibold text-ink tabular-nums">{t.deviceSummary(marked, solved, PLANETS.length, myVote)}</p>
        {note && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {note}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleReset}
        disabled={busy || !hasProgress}
        aria-busy={busy}
        className="min-h-11 shrink-0 cursor-pointer rounded-xl border-2 border-danger px-5 text-sm font-extrabold tracking-wider text-danger uppercase transition-[background-color,opacity] hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
      >
        {busy ? t.saving : t.deviceReset}
      </button>

      {undo && (
        <UndoBar message={t.deviceResetDone} undoLabel={t.undo} onUndo={handleUndo} onDone={closeUndo} ms={ADMIN_UNDO_MS} />
      )}
    </section>
  )
}
