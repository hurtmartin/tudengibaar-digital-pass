import { useState } from 'react'
import { deleteBurst } from '../../lib/api.js'
import TwoTapButton from './TwoTapButton.jsx'

const clock = (ms) => new Date(ms).toTimeString().slice(0, 5)
const duration = (ms) => (ms < 60_000 ? `${Math.max(1, Math.round(ms / 1000))} s` : `${Math.round(ms / 60_000)} min`)

// Bursts the server flagged (many votes for one contestant from one IP in a short time).
// Venue Wi-Fi shares one IP too, so nothing is removed automatically: the admin judges and deletes.
export default function SuspiciousVotes({ t, bursts, rows, act }) {
  const describe = (n) => rows.find((r) => r.number === n)?.description
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-surface/85 p-4">
      <h2 className="flex items-baseline justify-between gap-2 text-lg font-extrabold text-ink">
        {t.suspiciousTitle}
        {bursts.length > 0 && <span className="text-sm font-black text-danger tabular-nums">{bursts.length}</span>}
      </h2>
      <p className="text-xs text-muted">{t.suspiciousHint}</p>
      {bursts.length === 0 ? (
        <p className="py-1 text-sm text-muted">{t.suspiciousNone}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bursts.map((b) => (
            <BurstRow key={`${b.ip}-${b.number}-${b.from}`} t={t} burst={b} description={describe(b.number)} act={act} />
          ))}
        </ul>
      )}
    </section>
  )
}

function BurstRow({ t, burst, description, act }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Deleting votes can't be undone, so the button needs a second tap (like locking voting)
  async function handleDelete() {
    setBusy(true)
    const result = await act(() => deleteBurst(burst))
    setBusy(false)
    // On success the next results no longer contain this burst, so the row disappears
    if (!result.ok) setError(t.adminErrors[result.code] ?? t.adminErrorFallback)
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-extrabold text-ink">
          #{burst.number}
          {description && ` – ${description}`}
        </span>
        <span className="shrink-0 text-base font-black text-danger tabular-nums">{t.burstVotes(burst.count)}</span>
      </div>
      <p className="text-muted tabular-nums">
        {t.burstDetail(duration(burst.to - burst.from), clock(burst.from), burst.ip, burst.others)}
      </p>
      <TwoTapButton
        label={t.burstDelete(burst.count)}
        armedLabel={t.burstDeleteConfirm}
        busyLabel={t.saving}
        busy={busy}
        onPress={handleDelete}
        idleClass="border-2 border-danger text-danger hover:bg-danger/10"
        armedClass="bg-danger text-space"
        className="min-h-11 px-4 text-xs"
      />
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
    </li>
  )
}
