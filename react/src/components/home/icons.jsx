import { useId } from 'react'

// PLACEHOLDER icons for the home buttons, until custom button art replaces them.
// Music and shirt paths are from Lucide (lucide.dev, ISC licence); the planet is drawn here.
// To swap one: replace its component, or pass a different `icon` to EventButton in HomePage.jsx.

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export function MusicIcon() {
  return (
    <Icon>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Icon>
  )
}

export function ShirtIcon() {
  return (
    <Icon>
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </Icon>
  )
}

// The ring as two halves of a tilted ellipse (drawn flat, then rotated): the front half passes in front of the
// planet, the back half behind it. Both run between the ellipse's left and right ends, so they meet cleanly there.
const RING_TILT = 'rotate(-20 12 12)'
// Flat (11.5 × 2.4) so the visible front arc runs close to the planet's middle instead of hanging low
const RING_FRONT = 'M0.5 12a11.5 2.4 0 0 0 23 0'
const RING_BACK = 'M0.5 12a11.5 2.4 0 0 1 23 0'

export function PlanetIcon() {
  const id = useId()
  return (
    <Icon>
      <defs>
        {/* Cuts a gap in the planet's outline where the front of the ring crosses it */}
        <mask id={`${id}-planet`} maskUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="white" stroke="none" />
          <path d={RING_FRONT} transform={RING_TILT} fill="none" stroke="black" strokeWidth="5" />
        </mask>
        {/* Stops the back of the ring short of the planet, so it reads as passing behind */}
        <mask id={`${id}-back`} maskUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="white" stroke="none" />
          <circle cx="12" cy="12" r="9.3" fill="black" stroke="none" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="7.9" mask={`url(#${id}-planet)`} />
      <path d={RING_BACK} transform={RING_TILT} mask={`url(#${id}-back)`} />
      <path d={RING_FRONT} transform={RING_TILT} />
    </Icon>
  )
}
