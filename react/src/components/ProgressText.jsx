import { useEffect, useState } from 'react'
import { PROGRESS_FILL_MS } from '../constants.js'

// Text as a progress bar: grey underneath, a glowing green copy on top clipped to `progress` (0–1) of the
// text's width from the left. The fill slides from 0 on first show and from the old value on each change.
// The box is as wide as the text (inline-block), so the fraction is of the text, not of the row.
// The negative insets leave room for the glow above, below and left of the clip.
export default function ProgressText({ progress, className = '', children }) {
  const [shown, setShown] = useState(0)

  // One frame at 0 first, so the browser has a start point to transition from
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(progress))
    return () => cancelAnimationFrame(frame)
  }, [progress])

  return (
    <span className={`relative inline-block self-start text-muted tabular-nums ${className}`}>
      {children}
      <span
        aria-hidden="true"
        className="text-glow absolute inset-0 text-neon transition-[clip-path] ease-out-soft motion-reduce:transition-none"
        style={{ transitionDuration: `${PROGRESS_FILL_MS}ms`, clipPath: `inset(-12px ${(1 - shown) * 100}% -12px -12px)` }}
      >
        {children}
      </span>
    </span>
  )
}
