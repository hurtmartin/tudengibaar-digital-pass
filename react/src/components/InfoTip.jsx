import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackToClose } from '../hooks/useBackToClose.js'

// Short bullet list, the usual content of an info panel: easier to scan than a paragraph.
// `note` is a grey line under the list for something that isn't a step (e.g. "no prizes").
export function InfoList({ items, note }) {
  return (
    <>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-neon">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {note && <p className="mt-3 text-sm text-muted">{note}</p>}
    </>
  )
}

// The panel is rendered at the end of <body> (so the dim layer can cover everything, even inside a card with its
// own stacking), so its spot is measured: full width of the nearest positioned ancestor, just below it.
// Taller content scrolls inside the panel, since the page behind is locked.
function measureBelow(root) {
  const anchor = root.offsetParent ?? root
  const { left, width, bottom } = anchor.getBoundingClientRect()
  const top = bottom + 4
  return { left, width, top, maxHeight: `calc(100dvh - ${top + 16}px)` }
}

// An ⓘ button that opens a short explanation panel below it (bingo's and the chase's how-to use it too, with
// `label` and `chevron`). `label` shows text next to the icon; without it the button is icon-only and `ariaLabel`
// names it. `onGreen`: dark icon for use on the filled green vote card.
// The panel spans the nearest `relative` ancestor, just below it, so give that one the full width.
// While open, the rest of the page dims and blurs so only the panel stands out. It closes with its ✕, Escape,
// the phone's Back, or a tap on the dimmed page (which only closes it, it never presses what's underneath).
export default function InfoTip({ label, ariaLabel, closeLabel, children, className = '', onGreen = false, chevron = false }) {
  // Where the panel goes (viewport px) while open; null = closed
  const [place, setPlace] = useState(null)
  const open = place !== null
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const closeRef = useRef(null)
  const panelId = useId()

  const onClosed = useCallback(() => {
    setPlace(null)
    buttonRef.current?.focus({ preventScroll: true })
  }, [])
  const closePanel = useBackToClose(open, onClosed)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && closePanel()
    const onResize = () => setPlace(measureBelow(rootRef.current))
    // The page under the dim layer stays put, so the panel stays next to its button
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open, closePanel])

  return (
    <div ref={rootRef} className={className}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label ? undefined : ariaLabel}
        onClick={() => (open ? closePanel() : setPlace(measureBelow(rootRef.current)))}
        className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-neon ${
          onGreen
            ? 'text-space/70 hover:text-space'
            : open
              ? 'text-neon'
              : label
                ? 'text-ink/90 hover:text-neon'
                : 'text-muted hover:text-neon'
        } ${label ? 'px-3' : ''}`}
      >
        <svg viewBox="0 0 24 24" className={label ? 'size-4' : 'size-5'} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v5.5M12 7.6v.1" />
        </svg>
        {label}
        {chevron && (
          <svg
            viewBox="0 0 24 24"
            className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>
      {open &&
        createPortal(
          <>
            <div className="animate-fade-in fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closePanel} aria-hidden="true" />
            <div
              id={panelId}
              className="animate-panel-in fixed z-50 overflow-y-auto rounded-2xl border border-neon/50 bg-surface p-4 pr-12 text-left text-base leading-relaxed font-medium tracking-normal text-ink normal-case shadow-[0_12px_40px_-8px_rgba(0,0,0,0.9)]"
              style={place}
            >
              <button
                ref={closeRef}
                type="button"
                onClick={closePanel}
                aria-label={closeLabel}
                className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-neon"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
              {children}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
