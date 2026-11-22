import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import AnswerSheet from '../components/chase/AnswerSheet.jsx'
import { FullCelebration, Toast } from '../components/Celebration.jsx'
import PlanetCanvas from '../components/chase/PlanetCanvas.jsx'
import { CHASE_GLIDE, ROUTE_DRAW_MS } from '../constants.js'
import InfoTip, { InfoList } from '../components/InfoTip.jsx'
import { PLANETS } from '../data/planets.js'
import { useChase } from '../hooks/useChase.js'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function scrollToPlanet(index, smooth) {
  document
    .getElementById(PLANETS[index].id)
    ?.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto', block: 'center' })
}

// On opening the page: a slow glide down to the next planet, after a short pause so the top is seen first.
// Any touch, wheel or key stops it where it is, so the guest is never forced there.
// The browser's smooth scroll is too fast to stop and can't be slowed, so this steps it per frame.
// Returns a function that cancels it.
const STOP_EVENTS = ['touchstart', 'wheel', 'pointerdown', 'keydown']
function glideToPlanet(index) {
  const el = document.getElementById(PLANETS[index].id)
  if (!el) return () => {}
  let delay, frame
  const stop = () => {
    clearTimeout(delay)
    cancelAnimationFrame(frame)
    for (const type of STOP_EVENTS) window.removeEventListener(type, stop)
  }
  for (const type of STOP_EVENTS) window.addEventListener(type, stop, { passive: true })

  // Where the planet is centred; measured each frame, so images loading meanwhile don't throw it off
  const target = () => {
    const { top, height } = el.getBoundingClientRect()
    const max = document.documentElement.scrollHeight - innerHeight
    return Math.min(Math.max(scrollY + top + height / 2 - innerHeight / 2, 0), max)
  }
  delay = setTimeout(() => {
    const from = scrollY
    // Longer trips take longer, up to a cap
    const { baseMs, msPerPx, maxMs } = CHASE_GLIDE
    const duration = Math.min(baseMs + Math.abs(target() - from) * msPerPx, maxMs)
    const start = performance.now()
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2 // ease-in-out cubic
      scrollTo(0, from + (target() - from) * eased)
      if (p < 1) frame = requestAnimationFrame(step)
      else stop()
    }
    frame = requestAnimationFrame(step)
  }, CHASE_GLIDE.delayMs)
  return stop
}

export default function ChasePage() {
  const { t } = useOutletContext()
  const { solvedCount, total, statusOf, submit, justSolved, celebrating, dismiss } = useChase()
  const [openIndex, setOpenIndex] = useState(null)
  const [toast, setToast] = useState(null)
  const [showComplete, setShowComplete] = useState(false)
  const closeSheet = useCallback(() => setOpenIndex(null), [])
  const closeToast = useCallback(() => setToast(null), [])
  // The next planet when the page opened (progress is saved, so this survives a reload)
  const [startAt] = useState(solvedCount)

  // Bring the next planet into view on open: a stoppable glide, or a jump with reduced motion.
  // The browser's own scroll restore is off meanwhile, so a reload doesn't jump back to the old position.
  useEffect(() => {
    const { scrollRestoration } = history
    history.scrollRestoration = 'manual'
    let stopGlide = () => {}
    if (startAt < total) {
      if (prefersReducedMotion()) scrollToPlanet(startAt, false)
      else stopGlide = glideToPlanet(startAt)
    }
    return () => {
      stopGlide()
      history.scrollRestoration = scrollRestoration
    }
  }, [startAt, total])

  // After a solve, bring the newly unlocked planet into view
  useEffect(() => {
    if (justSolved === null || justSolved + 1 >= total) return
    const timer = setTimeout(() => scrollToPlanet(justSolved + 1, true), prefersReducedMotion() ? 0 : ROUTE_DRAW_MS)
    return () => clearTimeout(timer)
  }, [justSolved, total])

  // Let the finished route glow for a moment before the takeover
  useEffect(() => {
    if (!celebrating) return
    const timer = setTimeout(() => setShowComplete(true), prefersReducedMotion() ? 0 : ROUTE_DRAW_MS)
    return () => clearTimeout(timer)
  }, [celebrating])

  function handlePlanet(i) {
    const status = statusOf(i)
    if (status === 'next') return setOpenIndex(i)
    // key restarts the toast when the same message is triggered again
    setToast({ key: Date.now(), message: status === 'solved' ? t.solvedToast : t.findFirst(solvedCount + 1) })
    // A locked planet also shows where the next one is
    if (status === 'locked') scrollToPlanet(solvedCount, true)
  }

  return (
    <>
      <PlanetCanvas
        planets={PLANETS}
        solvedCount={solvedCount}
        statusOf={statusOf}
        justSolved={justSolved}
        t={t}
        onPlanet={handlePlanet}
      >
        <div className="relative z-20 flex flex-col items-center">
          <InfoTip label={t.howTo} closeLabel={t.close} chevron>
            <InfoList items={t.chaseSteps} note={t.disclaimer} />
          </InfoTip>
          <p className="-mt-1 text-xs font-semibold text-muted tabular-nums">{t.chaseProgress(solvedCount, total)}</p>
        </div>
      </PlanetCanvas>

      {openIndex !== null && (
        <AnswerSheet
          key={openIndex}
          number={openIndex + 1}
          total={total}
          t={t}
          onSubmit={(answer) => submit(openIndex, answer)}
          onClose={closeSheet}
        />
      )}

      {toast && <Toast key={toast.key} message={toast.message} onDone={closeToast} />}
      {showComplete && (
        <FullCelebration
          title={t.chaseTitle}
          text={t.chaseText}
          closeLabel={t.fullClose}
          onClose={() => {
            setShowComplete(false)
            dismiss()
          }}
        />
      )}
    </>
  )
}
