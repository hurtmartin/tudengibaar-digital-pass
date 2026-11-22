import Ufo from '../Ufo.jsx'
import { BINGO_UFO_FLY_OUT } from '../../constants.js'

// Cell centers as a % of the grid, for drawing over the squares
const C = [12.5, 37.5, 62.5, 87.5]


// Where the UFO is at the line's end, as a translate % from the card centre
function flyOffset(from, to) {
  // Along the line it flies past the edge; across it, it stays on the line's row or column
  return from === to ? from - 50 : Math.sign(to - 50) * BINGO_UFO_FLY_OUT
}

// A beam is drawn along the completed row, column or diagonal while the UFO flies along it
// `small` shrinks the saucer when several fly at once
export function LineEffect({ cells, small }) {
  const [first, last] = [cells[0], cells[cells.length - 1]]
  const [x1, y1, x2, y2] = [C[first % 4], C[Math.floor(first / 4)], C[last % 4], C[Math.floor(last / 4)]]
  // Tilt into the direction of flight
  const tilt = x2 < x1 ? -1 : 1
  const ufoPath = {
    '--ufo-x0': `${flyOffset(x2, x1)}%`,
    '--ufo-y0': `${flyOffset(y2, y1)}%`,
    '--ufo-x1': `${flyOffset(x1, x2)}%`,
    '--ufo-y1': `${flyOffset(y1, y2)}%`,
    '--ufo-r0': `${-10 * tilt}deg`,
    '--ufo-r1': `${6 * tilt}deg`,
  }
  return (
    <div className="pointer-events-none absolute -inset-2.5 z-10 overflow-hidden rounded-3xl" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-2.5 size-[calc(100%-1.25rem)]">
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          pathLength="1"
          strokeDasharray="1"
          className="animate-beam"
          stroke="var(--color-neon)"
          strokeWidth="5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: 'drop-shadow(0 0 6px var(--color-neon))' }}
        />
      </svg>
      <div className="animate-ufo-line absolute inset-2.5 flex items-center justify-center" style={ufoPath}>
        <Ufo className={`${small ? 'w-[24%]' : 'w-[32%]'} drop-shadow-[0_0_14px_rgba(52,200,108,0.7)]`} />
      </div>
    </div>
  )
}

// Rings burst out of each corner square in turn, clockwise from top left
const CORNERS = [
  [C[0], C[0]],
  [C[3], C[0]],
  [C[3], C[3]],
  [C[0], C[3]],
]

export function CornersEffect() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {[0, 1].flatMap((wave) =>
        CORNERS.map(([left, top], i) => (
          <span
            key={`${wave}-${i}`}
            className="animate-corner-burst absolute aspect-square w-[24%] rounded-full border-[3px] border-neon shadow-[0_0_18px_var(--color-neon),inset_0_0_18px_var(--color-neon)]"
            style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${wave * 650 + i * 140}ms` }}
          />
        )),
      )}
    </div>
  )
}
