import { useEffect, useRef } from 'react'
import { TOAST_MS } from '../constants.js'
import Ufo from './Ufo.jsx'

export function Toast({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, TOAST_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div
        role="status"
        className="animate-toast-in glow-neon rounded-2xl bg-surface px-5 py-3 text-center text-base font-extrabold tracking-wide text-neon"
      >
        {message}
      </div>
    </div>
  )
}

// Full-screen takeover: the full bingo card and the finished planet chase
export function FullCelebration({ title, text, closeLabel, onClose }) {
  const buttonRef = useRef(null)

  useEffect(() => {
    buttonRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="full-title"
      className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-space/95 px-6 text-center backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className="animate-twinkle absolute size-1.5 rounded-full bg-neon"
            style={{ left: `${(i * 41) % 100}%`, top: `${(i * 67) % 100}%`, animationDelay: `${(i % 6) * 0.3}s` }}
          />
        ))}
      </div>

      <Ufo className="animate-float relative w-44 drop-shadow-[0_0_24px_rgba(52,200,108,0.7)]" />
      <h2 id="full-title" className="text-glow relative text-5xl font-black tracking-wider text-neon">
        {title}
      </h2>
      <p className="relative max-w-xs text-lg font-semibold leading-relaxed text-ink">{text}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClose}
        className="relative h-13 rounded-xl bg-neon px-8 text-base font-extrabold uppercase tracking-wider text-space transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon"
      >
        {closeLabel}
      </button>
    </div>
  )
}
