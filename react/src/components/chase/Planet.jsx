// Placeholder art is told apart by hue; locked planets are only lightly greyed so they still look inviting
function planetFilter(hue, status) {
  const parts = []
  if (hue) parts.push(`hue-rotate(${hue}deg)`)
  if (status === 'locked') parts.push('saturate(.55) brightness(.8)')
  return parts.join(' ') || undefined
}

export default function Planet({ planet, index, status, unlocking, label, onClick }) {
  return (
    <button
      type="button"
      id={planet.id}
      onClick={onClick}
      aria-label={label}
      className="absolute aspect-square min-w-16 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon"
      style={{ left: `${planet.x}%`, top: `${planet.y}%`, width: `${planet.size}%` }}
    >
      {/* Wrappers: float (always) > pop (just unlocked, after the route line draws in) */}
      <span className="animate-float block size-full" style={{ animationDelay: `${(index % 4) * -1.5}s` }}>
        <span className={`relative block size-full ${unlocking ? 'animate-unlock [animation-delay:1.2s]' : ''}`}>
          {status === 'next' && (
            <span className="animate-planet-pulse absolute -inset-[15%] rounded-full bg-neon/30 blur-xl" aria-hidden="true" />
          )}
          <img
            src={planet.img}
            alt=""
            draggable={false}
            className="relative size-full select-none"
            style={{ filter: planetFilter(planet.hue, status) }}
          />
          {status === 'solved' && <span className="glow-neon absolute inset-[4%] rounded-full" aria-hidden="true" />}
          {/* One badge for number + state, so there's one place to look. The number stays on every planet,
              so "find planet 3 first" can be followed. Solved = solid green with ✓, like a finished home button. */}
          <span
            className={`absolute top-[2%] left-[2%] flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full border-2 px-1.5 text-xs font-extrabold tabular-nums ${
              {
                locked: 'border-white/30 bg-space text-ink/80',
                next: 'border-neon bg-space text-neon',
                solved: 'border-neon bg-neon text-space shadow-[0_0_10px_var(--color-neon)]',
              }[status]
            }`}
            aria-hidden="true"
          >
            {status === 'locked' && (
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            )}
            {status === 'solved' && (
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5 10 17.5 19 7" />
              </svg>
            )}
            {index + 1}
          </span>
        </span>
      </span>
      {unlocking && (
        <span
          className="animate-corner-burst absolute top-1/2 left-1/2 size-[130%] rounded-full border-[3px] border-neon shadow-[0_0_18px_var(--color-neon),inset_0_0_18px_var(--color-neon)] [animation-delay:1.2s]"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
