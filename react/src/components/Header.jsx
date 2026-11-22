import { Link } from 'react-router'
import LangToggle from './LangToggle.jsx'

export default function Header({ t, lang, onLangChange, title, isHome }) {
  const heading = title ?? t.passTitle
  return (
    // Home: the header grows, keeping the top bar up and pushing the title down onto the event list,
    // so title + list sit centred together (Layout gives the leftover space equally to header and main)
    <header className={`flex flex-col gap-3 ${isHome ? 'flex-auto justify-between' : ''}`}>
      <div className="flex items-center justify-between">
        {isHome ? (
          <p className="text-sm font-extrabold tracking-wide text-ink">{t.edition}</p>
        ) : (
          <Link
            to="/"
            aria-label={t.backHome}
            className="-ml-2 flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:text-neon focus-visible:outline-2 focus-visible:outline-neon"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </Link>
        )}
        <LangToggle lang={lang} onChange={onLangChange} label={t.langLabel} />
      </div>

      <h1 className="flex flex-col items-center text-center leading-none uppercase">
        <span className="text-lg font-extrabold tracking-[0.32em] text-ink">{t.title}</span>
        {/* Titles longer than 8 letters (PLANEEDID) don't fit a 360px phone at 5xl */}
        <span className={`text-glow mt-1 font-black tracking-[0.18em] text-neon ${heading.length > 8 ? 'text-4xl' : 'text-5xl'}`}>
          {heading}
        </span>
      </h1>
    </header>
  )
}
