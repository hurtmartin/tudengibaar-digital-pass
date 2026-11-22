export default function Square({ title, artist, marked, inWin, near, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => {
        // Short buzz as tap feedback; Android only, iOS has no vibrate
        navigator.vibrate?.(12)
        onToggle()
      }}
      aria-pressed={marked}
      className={`relative flex min-h-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl p-1 text-center transition-[transform,background-color,box-shadow] duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon ${
        // Marked squares are filled, not crossed out, so the song stays readable
        marked
          ? `bg-neon-dim ${inWin ? 'glow-neon' : 'border border-neon/60'}`
          : 'border border-white/15 bg-surface-2/80 hover:border-white/30 hover:bg-surface-2'
      }`}
    >
      <span className="line-clamp-3 text-[clamp(0.7rem,3.8cqw,0.875rem)] leading-tight font-bold break-words hyphens-auto text-ink">
        {title}
      </span>
      <span
        className={`max-w-full truncate text-[clamp(0.625rem,3cqw,0.75rem)] leading-tight font-medium ${
          marked ? 'text-ink' : 'text-muted'
        }`}
      >
        {artist}
      </span>
      {/* One tap from a win: a pulsing dashed outline points at the square */}
      {near && (
        <span
          className="animate-route-pulse pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-neon"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
