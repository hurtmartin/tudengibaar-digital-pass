import { useId, useState } from 'react'
import { useOutletContext } from 'react-router'
import InfoTip, { InfoList } from '../components/InfoTip.jsx'
import { CONTEST_PAGE_SIZE, VOTE_SPARK_COLORS } from '../constants.js'
import { EVENTS } from '../data/events.js'
import { useContest } from '../hooks/useContest.js'

const OPENS_AT = EVENTS.contest.time.split('–')[0]

export default function ContestPage() {
  const { t } = useOutletContext()
  const { state, contenders, myVote, loading, error, busy, vote, retry } = useContest()
  // Only a vote cast just now gets the celebration, not one loaded on page open
  const [justVoted, setJustVoted] = useState(false)
  // Changing reopens the form but keeps the current vote until a new one is confirmed
  const [changing, setChanging] = useState(false)
  async function handleVote(number) {
    const ok = await vote(number)
    setJustVoted(ok)
    if (ok) setChanging(false)
  }
  const describe = (n) => contenders.find((c) => c.number === n)?.description

  if (loading) return <Message>{t.loading}</Message>
  // No data at all: the server or the Wi-Fi is down. The contest can still run on paper.
  if (state === null) {
    return (
      <Message>
        {t.unavailable}
        <RetryButton t={t} onClick={retry} />
      </Message>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-5 pt-4">
      {error && error !== 'voting_not_open' && (
        <p role="alert" className="w-full rounded-xl border border-danger/60 bg-danger/10 px-4 py-3 text-center text-sm font-semibold text-danger">
          {error === 'rate_limited'
            ? t.rateLimited
            : ['unknown_contender', 'invalid_number'].includes(error)
              ? t.voteFailed
              : t.unavailable}
        </p>
      )}

      {state === 'closed' && <Message>{t.votingOpensAt(OPENS_AT)}</Message>}

      {state === 'locked' && (
        <Message>
          <span className="text-glow text-2xl font-black text-neon uppercase">{t.votingClosed}</span>
          {myVote ? <VoteCard label={t.youVoted} number={myVote} description={describe(myVote)} /> : t.didNotVote}
        </Message>
      )}

      {state === 'open' && myVote !== null && !changing && (
        <>
          <VoteCard
            label={t.youVoted}
            number={myVote}
            description={describe(myVote)}
            celebrate={justVoted}
            info={
              <InfoTip ariaLabel={t.whatsNext} closeLabel={t.close} onGreen className="-my-3 -ml-2">
                <InfoList items={t.whatsNextSteps} />
              </InfoTip>
            }
          />
          {/* Secondary action, so a quiet grey instead of the card's green */}
          <button
            type="button"
            onClick={() => {
              setChanging(true)
              // Cancelling brings the card back; it shouldn't celebrate a vote that didn't change
              setJustVoted(false)
            }}
            className="min-h-12 rounded-xl border-2 border-white/15 px-6 font-extrabold tracking-wider text-muted uppercase transition-[transform,color,border-color] active:scale-[0.98] active:border-white/30 active:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
          >
            {t.changeVote}
          </button>
        </>
      )}

      {state === 'open' && (myVote === null || changing) && (
        <VoteForm
          t={t}
          contenders={contenders}
          describe={describe}
          busy={busy}
          onVote={handleVote}
          initialPick={changing ? myVote : null}
          onCancel={changing ? () => setChanging(false) : null}
        />
      )}
    </div>
  )
}

function VoteForm({ t, contenders, describe, busy, onVote, initialPick, onCancel }) {
  // The box is a search; a tapped row is a separate pick, so switching is one tap and the list never collapses
  const [query, setQuery] = useState('')
  // When changing a vote, start with the current one picked and its page open
  const [picked, setPicked] = useState(initialPick)
  const [page, setPage] = useState(() =>
    Math.max(0, Math.floor(contenders.findIndex((c) => c.number === initialPick) / CONTEST_PAGE_SIZE)),
  )
  const inputId = useId()
  const typed = query === '' ? null : Number(query)
  // A tap wins; otherwise an exact typed number ("12") selects too
  const selected = picked ?? (typed !== null && describe(typed) !== undefined ? typed : null)
  const description = selected === null ? undefined : describe(selected)
  // Like a search: "1" shows #1 and #10–19, nothing typed shows everyone
  const matches = contenders.filter((c) => String(c.number).startsWith(query))
  const pageCount = Math.ceil(matches.length / CONTEST_PAGE_SIZE)
  // Clamped, in case the list shrinks while on a later page (a poll removed contestants)
  const current = Math.min(page, Math.max(pageCount - 1, 0))
  const shown = matches.slice(current * CONTEST_PAGE_SIZE, (current + 1) * CONTEST_PAGE_SIZE)

  return (
    <form
      className="flex w-full flex-col items-center gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (description && !busy) onVote(selected)
      }}
    >
      {/* The ⓘ sits right after the label; its panel opens full width under this row.
          Its 44px tap area is pulled in (-ml-1.5) so the icon sits ~6px from the text; pl-[38px] balances it so the label stays centred. */}
      <div className="relative flex w-full items-center justify-center pl-[38px]">
        <label htmlFor={inputId} className="text-lg font-bold text-ink">
          {t.enterNumber}
        </label>
        <InfoTip ariaLabel={t.contestInfoLabel} closeLabel={t.close} className="-ml-1.5">
          <InfoList items={t.contestSteps} />
        </InfoTip>
      </div>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        autoComplete="off"
        value={query}
        // Digits only; leading zeros dropped so "07" finds #7. Typing replaces any tapped pick.
        onChange={(e) => {
          setQuery(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 2))
          setPicked(null)
          setPage(0)
        }}
        className="h-24 w-36 rounded-2xl border-2 border-white/15 bg-surface text-center text-6xl font-black text-ink tabular-nums outline-none transition-colors focus:border-neon"
      />
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 px-4 text-sm font-semibold text-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-neon"
        >
          {t.cancelChange}
        </button>
      )}

      {matches.length > 0 && (
        <ul aria-label={t.contestants} className="flex w-full flex-col gap-1">
          {shown.map((c) => (
            <li key={c.number}>
              {/* Picks without focusing the input, so the phone keyboard stays closed */}
              <button
                type="button"
                onClick={() => setPicked(c.number)}
                aria-pressed={c.number === selected}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2 text-left text-sm transition-colors active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-neon ${
                  c.number === selected ? 'bg-neon/15 text-neon' : 'bg-surface/60 text-muted active:bg-surface'
                }`}
              >
                <span className={`w-8 shrink-0 font-extrabold tabular-nums ${c.number === selected ? '' : 'text-ink/80'}`}>
                  #{c.number}
                </span>
                <span className="min-w-0 break-words">{c.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {pageCount > 1 && (
        <nav className="flex items-center gap-4 text-sm font-bold text-muted tabular-nums">
          <PageButton label={t.prevPage} disabled={current === 0} onClick={() => setPage(current - 1)}>
            ‹
          </PageButton>
          <span aria-live="polite">
            {current + 1} / {pageCount}
          </span>
          <PageButton label={t.nextPage} disabled={current === pageCount - 1} onClick={() => setPage(current + 1)}>
            ›
          </PageButton>
        </nav>
      )}

      {/* Pinned to the bottom of the screen while the list scrolls, so the choice and Confirm stay in reach.
          Sticky (not fixed): at the end of the list it settles back into place above the footer. */}
      <div className="sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 mt-2 w-full">
        <div
          className={`flex min-h-16 w-full items-center gap-3 rounded-2xl bg-space/90 py-2 pr-2 pl-4 backdrop-blur ${
            description ? 'glow-neon' : 'border-2 border-dashed border-white/15'
          }`}
        >
          <span role="status" aria-live="polite" className="min-w-0 flex-1 text-left">
            {description ? (
              <span className="line-clamp-2 font-extrabold text-ink">
                #{selected} – {description}
              </span>
            ) : matches.length === 0 ? (
              <span className="font-semibold text-danger">{t.noSuchContestant}</span>
            ) : (
              <span className="font-extrabold text-muted/60">#? – {t.selectedPlaceholder}</span>
            )}
          </span>
          <button
            type="submit"
            disabled={!description || busy}
            className="h-12 shrink-0 rounded-xl bg-neon px-5 text-sm font-extrabold tracking-wider text-space uppercase transition-[transform,opacity] active:scale-[0.98] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </form>
  )
}

function PageButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full bg-surface/85 text-2xl leading-none text-ink transition-opacity disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-neon"
    >
      {children}
    </button>
  )
}

// Stars fly out from the card and settle into a UFO outline: a wide saucer ring with a dome on top.
const SAUCER = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * 2 * Math.PI
  return [Math.cos(a) * 165, Math.sin(a) * 58]
})
// Upper half-circle sitting on the saucer's top edge
const DOME = Array.from({ length: 7 }, (_, i) => {
  const a = Math.PI + ((i + 1) / 8) * Math.PI
  return [Math.cos(a) * 75, -48 + Math.sin(a) * 58]
})
const SPARKS = [...SAUCER, ...DOME].map(([x, y], i) => ({
  size: i % 3 === 0 ? 16 : 12,
  color: VOTE_SPARK_COLORS[i % 2],
  delay: 80 + (i % 5) * 40,
  style: { '--dx': `${Math.round(x)}px`, '--dy': `${Math.round(y)}px`, '--rot': `${i % 2 ? 90 : -90}deg` },
}))

// info: optional ⓘ shown next to the label; its panel opens full width under the card
function VoteCard({ label, number, description, celebrate = false, info = null }) {
  return (
    <div
      // Filled green: the vote is in (same "done" look as the home buttons)
      className={`glow-neon relative flex w-full flex-col items-center gap-1 rounded-2xl bg-neon px-4 py-4 text-center ${
        celebrate ? 'animate-vote-pop' : ''
      }`}
    >
      {celebrate &&
        SPARKS.map((spark, i) => (
          <svg
            key={i}
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="animate-spark pointer-events-none absolute top-1/2 left-1/2 z-10"
            style={{
              ...spark.style,
              width: spark.size,
              height: spark.size,
              color: spark.color,
              filter: `drop-shadow(0 0 4px ${spark.color})`,
              animationDelay: `${spark.delay}ms`,
            }}
          >
            {/* Four-pointed star */}
            <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" fill="currentColor" />
          </svg>
        ))}
      {label && (
        <span className={`flex items-center text-xs font-bold tracking-[0.2em] text-space/70 uppercase ${info ? 'pl-9' : ''}`}>
          {label}
          {info}
        </span>
      )}
      <span className="text-xl font-extrabold text-space">
        #{number}
        {description && ` – ${description}`}
      </span>
    </div>
  )
}

function Message({ children }) {
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center text-lg font-semibold text-ink">
      {children}
    </div>
  )
}

function RetryButton({ t, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 rounded-xl bg-neon px-6 font-extrabold tracking-wider text-space uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
    >
      {t.retry}
    </button>
  )
}
