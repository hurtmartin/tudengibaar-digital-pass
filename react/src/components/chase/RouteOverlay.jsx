import { useEffect, useId, useRef, useState } from 'react'
import { ROUTE_EDGE, ROUTE_WOBBLE } from '../../constants.js'


// Repeatable "random" number in -1..1, so the route is the same on every load
function jitter(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

// Smooth curve through the points (Catmull-Rom spline written as cubic Béziers)
function smoothPath(pts) {
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]]
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`
  }
  return d
}

// Winding road from a down to b (pixels), drawn loosely by hand: right towards the edge, turn, across to the
// left edge, turn, back right into b. Segment `i` seeds the wobble. The next planet must be lower than the last.
function curve(a, b, width, i) {
  const gap = b.y - a.y
  const j = (k) => jitter(i * 10 + k) * ROUTE_WOBBLE
  const right = { x: width * (1 - ROUTE_EDGE) + j(1) * width * 0.06, y: a.y + gap * (0.25 + j(2) * 0.1) }
  const left = { x: width * ROUTE_EDGE + j(3) * width * 0.06, y: a.y + gap * (0.75 + j(4) * 0.1) }
  return smoothPath([
    a,
    // Between the planet and the turn, so a planet near the edge never makes the path double back
    { x: (a.x + right.x) / 2, y: a.y + gap * j(5) * 0.08 },
    right,
    { x: width * (0.5 + j(6) * 0.15), y: a.y + gap * (0.5 + j(7) * 0.1) },
    left,
    { x: (left.x + b.x) / 2, y: b.y + gap * j(8) * 0.08 },
    b,
  ])
}

// The whole route between consecutive planets, dashed. Grey where it's still ahead; green from planet 1 up to the
// next planet to find. Planets are positioned in % of the canvas; a curve needs pixels, so the canvas size is tracked.
export default function RouteOverlay({ planets, solvedCount, drawIndex, complete }) {
  const maskId = useId()
  const svgRef = useRef(null)
  const [size, setSize] = useState(null)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    )
    observer.observe(svgRef.current)
    return () => observer.disconnect()
  }, [])

  const toPx = (p) => ({ x: (p.x / 100) * size.w, y: (p.y / 100) * size.h })
  const paths = size ? planets.slice(1).map((b, i) => curve(toPx(planets[i]), toPx(b), size.w, i)) : []

  return (
    <svg ref={svgRef} className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
      {paths.map((d, i) => {
        // Segment i leads from planet i to i+1, so it turns green once planet i is solved
        const done = i < solvedCount
        const draws = i === drawIndex
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" />
            {/* Only the newest green segment draws in: a solid mask path grows and reveals the dashes over the grey */}
            {done && draws && (
              <mask id={`${maskId}-${i}`} maskUnits="userSpaceOnUse">
                <path d={d} fill="none" stroke="white" strokeWidth="12" pathLength="1" strokeDasharray="1" className="animate-draw" />
              </mask>
            )}
            {done && (
              <path
                d={d}
                fill="none"
                mask={draws ? `url(#${maskId}-${i})` : undefined}
                stroke="var(--color-neon)"
                strokeWidth={complete ? 4 : 3}
                strokeDasharray="8 8"
                strokeLinecap="round"
                className={complete ? 'animate-route-pulse' : ''}
                style={{ filter: 'drop-shadow(0 0 4px var(--color-neon))' }}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
