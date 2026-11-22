import { Link } from 'react-router'
import ProgressText from '../ProgressText.jsx'

// One full-width row: icon, then name and status, then (while live) a "now" chip on the right.
// done: darker green fill, the app's "finished" signal, kept quieter than what's still open.
// live: the event's time slot is running now, so it gets the chip and an outline (not when done).
// icon: a placeholder until custom button art arrives (see icons.jsx).
export default function EventButton({ to, name, detail, progress, icon, liveLabel, done = false, live = false }) {
  const showLive = live && !done
  return (
    <Link
      to={to}
      className={`glow-neon flex min-h-20 items-center gap-4 rounded-2xl px-4 py-3 text-left transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon ${
        done ? 'bg-neon-dim' : 'bg-surface/85'
        // An outline, because glow-neon already owns box-shadow
      } ${showLive ? 'outline-2 outline-offset-4 outline-neon/70' : ''}`}
    >
      <span className={`shrink-0 ${done ? 'text-ink' : 'text-neon'}`}>{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base leading-tight font-extrabold tracking-wide text-ink uppercase">{name}</span>
        {done ? (
          <span className="text-sm font-bold text-ink tabular-nums">✓ {detail}</span>
        ) : progress == null ? (
          <span className="text-glow text-sm font-bold text-neon tabular-nums">{detail}</span>
        ) : (
          <ProgressText progress={progress} className="text-sm font-bold">
            {detail}
          </ProgressText>
        )}
      </span>
      {showLive && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-neon px-2 py-0.5 text-[0.65rem] font-black tracking-wider text-space uppercase">
          <span className="animate-route-pulse size-1.5 rounded-full bg-space" aria-hidden="true" />
          {liveLabel}
        </span>
      )}
    </Link>
  )
}
