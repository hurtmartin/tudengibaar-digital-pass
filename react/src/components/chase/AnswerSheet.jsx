import { useEffect, useId, useRef, useState } from 'react'
import { useBackToClose } from '../../hooks/useBackToClose.js'

// Bottom sheet for answering the `next` planet's riddle
export default function AnswerSheet({ number, total, t, onSubmit, onClose: onClosed }) {
  // Every way of closing goes through `onClose`, so the phone's Back closes the sheet too
  const onClose = useBackToClose(true, onClosed)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const inputRef = useRef(null)
  const titleId = useId()
  const inputId = useId()
  const errorId = useId()

  // Esc closes, background scroll locked, focus returns to the planet on close
  useEffect(() => {
    const previouslyFocused = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  function fail(message) {
    setError(message)
    setShakeKey((k) => k + 1)
    inputRef.current?.select()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (checking) return
    if (!answer.trim()) return fail(t.emptyAnswer)
    setChecking(true)
    let ok
    try {
      ok = await onSubmit(answer)
    } catch {
      // Checking needs Web Crypto, which browsers only give to HTTPS pages (and localhost).
      // Never leave the button stuck on "checking": say so and let them try again.
      ok = null
    }
    setChecking(false)
    if (ok) onClose()
    else fail(ok === null ? t.checkFailed : t.wrongAnswer)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-sheet-in relative w-full max-w-md rounded-t-3xl border-t border-x border-neon/40 bg-surface px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_-10px_rgba(52,200,108,0.35)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-extrabold text-ink">
            {t.planetOf(number, total)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-neon"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-base leading-relaxed text-ink/90">{t.planetHints[number - 1]}</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3" noValidate>
          <label htmlFor={inputId} className="text-sm font-bold text-ink">
            {t.answerLabel}
          </label>
          <div key={shakeKey} className={shakeKey ? 'animate-shake' : ''}>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                if (error) setError('')
              }}
              placeholder={t.answerPlaceholder}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className={`h-13 w-full rounded-xl border-2 bg-space px-4 text-base font-semibold text-ink placeholder:text-white/35 outline-none transition-colors focus:border-neon ${
                error ? 'border-danger' : 'border-white/15'
              }`}
            />
          </div>
          <p id={errorId} role="alert" className="min-h-5 text-sm font-semibold text-danger">
            {error}
          </p>
          <button
            type="submit"
            disabled={checking}
            className="h-13 rounded-xl bg-neon text-base font-extrabold uppercase tracking-wider text-space transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
          >
            {checking ? t.checking : t.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
