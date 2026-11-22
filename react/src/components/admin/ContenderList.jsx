import { useCallback, useState } from 'react'
import { ADMIN_UNDO_MS } from '../../constants.js'
import { addContender, deleteContender } from '../../lib/api.js'
import UndoBar from '../UndoBar.jsx'

// All contestants by number. Ones without votes can be deleted; the delete happens at once and an undo bar
// brings the contestant back (same number and description) for ADMIN_UNDO_MS.
export default function ContenderList({ t, rows, act }) {
  const [undo, setUndo] = useState(null) // { number, description } of the contestant just deleted
  const [error, setError] = useState(null)
  const closeUndo = useCallback(() => setUndo(null), [])
  const sorted = [...rows].sort((a, b) => a.number - b.number)
  const errorText = (number, code) => `#${number}: ${t.adminErrors[code] ?? t.adminErrorFallback}`

  async function handleDelete({ number, description }) {
    setError(null)
    const result = await act(() => deleteContender(number))
    if (result.ok) setUndo({ number, description })
    else setError(errorText(number, result.code))
  }

  async function handleUndo() {
    const { number, description } = undo
    setUndo(null)
    const result = await act(() => addContender(number, description))
    if (!result.ok) setError(errorText(number, result.code))
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-surface/85 p-4">
      <h2 className="flex items-baseline justify-between gap-2 text-lg font-extrabold text-ink">
        {t.tabContenders}
        <span className="text-xs font-semibold text-muted tabular-nums">{t.contenderCount(rows.length)}</span>
      </h2>

      {sorted.length === 0 ? (
        <p className="py-2 text-sm text-muted">{t.noContenders}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {sorted.map((r) => (
            <li key={r.number} className="flex min-h-12 items-center gap-3 text-sm">
              <span className="w-10 shrink-0 font-extrabold text-ink tabular-nums">#{r.number}</span>
              <span className="min-w-0 flex-1 break-words text-ink">{r.description}</span>
              <span className="shrink-0 text-xs text-muted tabular-nums">{t.voteCount(r.votes)}</span>
              {/* Contestants with votes can't be deleted (the server refuses too); the empty slot keeps rows aligned */}
              {r.votes === 0 ? (
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  aria-label={t.deleteContender(r.number)}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-neon"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              ) : (
                <span className="size-11 shrink-0" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}

      {sorted.some((r) => r.votes > 0) && <p className="text-xs text-muted">{t.hasVotesNote}</p>}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {undo && (
        <UndoBar
          key={undo.number}
          message={t.contenderDeleted(undo.number)}
          undoLabel={t.undo}
          onUndo={handleUndo}
          onDone={closeUndo}
          ms={ADMIN_UNDO_MS}
        />
      )}
    </section>
  )
}
