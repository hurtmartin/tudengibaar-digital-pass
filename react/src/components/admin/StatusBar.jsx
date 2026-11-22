import { useEffect, useState } from 'react'
import { ADMIN_STALE_MS } from '../../constants.js'
import { setContestState } from '../../lib/api.js'
import TwoTapButton from './TwoTapButton.jsx'

// The one move allowed from each state (same rules as the server's contestState.js)
const NEXT = { closed: 'open', open: 'locked', locked: 'open' }

// Pinned to the top of the admin page, so the voting state and its button are always in reach.
// Also says when the numbers were last refreshed, and warns once refreshes have been failing for a while.
export default function StatusBar({ t, state, totalVotes, updated, pollError, onRetry, act }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const now = useSecondClock()
  const next = NEXT[state]
  const staleSeconds = updated ? Math.floor((now - updated.getTime()) / 1000) : 0
  const stale = updated !== null && now - updated.getTime() > ADMIN_STALE_MS

  async function handlePress() {
    setBusy(true)
    const result = await act(() => setContestState(next))
    setBusy(false)
    setError(result.ok ? null : (t.adminErrors[result.code] ?? t.adminErrorFallback))
  }

  return (
    <section
      aria-label={t.tabVoting}
      className="sticky top-2 z-30 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-surface/95 p-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-4"
    >
      <StateBadge t={t} state={state} />

      <div className="flex min-w-0 flex-1 flex-col text-sm">
        <span className="font-extrabold text-ink tabular-nums">{t.totalVotes(totalVotes)}</span>
        {stale ? (
          // No live region: the seconds tick, and a screen reader would read every tick
          <span className="flex flex-wrap items-center gap-x-2 font-semibold text-danger tabular-nums">
            <WarningIcon />
            {t.staleFor(staleSeconds)}
            {pollError && ` · ${t.adminErrors[pollError] ?? t.adminErrorFallback}`}
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 cursor-pointer rounded-lg px-2 font-extrabold text-ink underline underline-offset-4 hover:text-neon focus-visible:outline-2 focus-visible:outline-neon"
            >
              {t.retry}
            </button>
          </span>
        ) : (
          <span className="text-muted tabular-nums">{updated && t.updatedAt(updated.toTimeString().slice(0, 8))}</span>
        )}
      </div>

      <TwoTapButton
        key={state}
        confirm={next === 'locked'}
        label={next === 'locked' ? t.lockVoting : state === 'locked' ? t.reopenVoting : t.openVoting}
        armedLabel={t.lockConfirm}
        busyLabel={t.saving}
        busy={busy}
        onPress={handlePress}
        idleClass={next === 'locked' ? 'border-2 border-danger text-danger hover:bg-danger/10' : 'bg-neon text-space hover:brightness-110'}
        armedClass="bg-danger text-space"
        className="h-12 w-full px-5 sm:w-auto sm:min-w-60"
      />

      {error && (
        <p role="alert" className="w-full text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </section>
  )
}

// State as icon + word, never colour alone: grey ring (closed), pulsing green dot (open), lock (locked)
function StateBadge({ t, state }) {
  const style = {
    closed: 'border-white/30 text-muted',
    open: 'border-neon text-neon glow-neon',
    locked: 'border-danger text-danger',
  }[state]
  return (
    <span
      aria-live="polite"
      className={`flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-lg font-black tracking-widest uppercase ${style}`}
    >
      {state === 'open' && <span className="animate-route-pulse size-2.5 rounded-full bg-neon" aria-hidden="true" />}
      {state === 'closed' && <span className="size-2.5 rounded-full border-2 border-current" aria-hidden="true" />}
      {state === 'locked' && (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      )}
      {t.stateLabel[state]}
    </span>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17.5v.01" />
    </svg>
  )
}

// Current time, ticking every second, for "not updated for n s"
function useSecondClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}
