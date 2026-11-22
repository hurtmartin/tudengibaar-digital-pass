import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import EventButton from '../components/home/EventButton.jsx'
import { MusicIcon, PlanetIcon, ShirtIcon } from '../components/home/icons.jsx'
import { EVENTS, isLive } from '../data/events.js'
import { useChase } from '../hooks/useChase.js'
import { getContest } from '../lib/api.js'
import { loadJSON, saveJSON } from '../lib/storage.js'

export default function HomePage() {
  const { t } = useOutletContext()
  const { solvedCount, total } = useChase()

  // Read once on open, not useBingo(): that would deal a card just for looking at home.
  // "full" stays celebrated until a reset.
  const [cardFull] = useState(() => loadJSON('bingo', null)?.celebrated?.includes('full') ?? false)
  const now = useNow()
  const bingoOver = now >= EVENTS.bingo.endsAt.getTime()

  // Start from the last known answer so a reload doesn't flash the outlined button, then check the server once
  // (the contest page itself polls). Offline just keeps the cached answer.
  const [contest, setContest] = useState(() => loadJSON('contest', null))
  useEffect(() => {
    getContest().then(({ state, myVote }) => {
      setContest({ state, myVote })
      saveJSON('contest', { state, myVote })
    }, () => {})
  }, [])
  const voted = contest?.myVote != null
  const contestOver = contest?.state === 'locked'

  return (
    // One full-width row per activity, in the night's order, right under the title; Layout centres the two together
    <div className="mt-6 flex flex-col gap-3">
      <EventButton
        to={EVENTS.bingo.path}
        icon={<MusicIcon />}
        name={t.bingoEvent}
        detail={cardFull ? t.doneCardFull : bingoOver ? t.doneOver : EVENTS.bingo.time}
        done={cardFull || bingoOver}
        live={isLive(EVENTS.bingo, now)}
        liveLabel={t.liveNow}
      />
      <EventButton
        to={EVENTS.contest.path}
        icon={<ShirtIcon />}
        name={t.contestEvent}
        detail={voted ? t.doneVoted : contestOver ? t.doneOver : EVENTS.contest.time}
        done={voted || contestOver}
        live={isLive(EVENTS.contest, now)}
        liveLabel={t.liveNow}
      />
      <EventButton
        to={EVENTS.chase.path}
        icon={<PlanetIcon />}
        name={t.chaseEvent}
        detail={t.chaseProgress(solvedCount, total)}
        progress={solvedCount / total}
        done={solvedCount >= total}
      />
    </div>
  )
}

// The current time, refreshed every 30 s, so "now" chips and "over" states follow the clock while home stays open
function useNow() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])
  return now
}
