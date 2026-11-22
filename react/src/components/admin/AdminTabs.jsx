import { useRef } from 'react'

const TABS = ['voting', 'contenders']

// Two tabs: running the vote live, and setting up contestants. ARIA tabs pattern: ←/→ move between tabs,
// only the selected tab is in the Tab order. The voting tab shows a red count while there are suspicious bursts,
// so they're noticed from the other tab too.
// Tab ids are `${idPrefix}-${id}`, their panels `${idPrefix}-${id}-panel`.
export default function AdminTabs({ t, tab, onChange, idPrefix, burstCount, contenderCount }) {
  const refs = useRef({})

  function handleKeyDown(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const step = e.key === 'ArrowRight' ? 1 : -1
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length]
    onChange(next)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={t.adminTitle} onKeyDown={handleKeyDown} className="flex gap-1 rounded-2xl bg-surface/85 p-1 lg:self-start">
      {TABS.map((id) => {
        const selected = tab === id
        return (
          <button
            key={id}
            ref={(el) => (refs.current[id] = el)}
            id={`${idPrefix}-${id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-${id}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold tracking-wider uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon lg:flex-none ${
              selected ? 'bg-neon text-space' : 'text-muted hover:bg-white/5 hover:text-ink'
            }`}
          >
            {id === 'voting' ? t.tabVoting : t.tabContenders}
            {id === 'voting' && burstCount > 0 && (
              <span className="flex items-center rounded-full bg-danger px-2 text-xs font-black text-space tabular-nums">
                {burstCount}
                <span className="sr-only">{` ${t.suspiciousCount(burstCount)}`}</span>
              </span>
            )}
            {id === 'contenders' && <span className="tabular-nums opacity-70">{contenderCount}</span>}
          </button>
        )
      })}
    </div>
  )
}
