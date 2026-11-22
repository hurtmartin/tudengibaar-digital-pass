import { PATTERNS } from '../../lib/lines.js'
import { CornersEffect, LineEffect } from './WinEffects.jsx'
import Square from './Square.jsx'

export default function BingoGrid({ cells, marked, winCells, near, celebration, onToggle }) {
  const lines = celebration?.filter((kind) => kind in PATTERNS && kind !== 'corners') ?? []
  return (
    <div className="bingo-card rounded-3xl p-2">
      {/* Inline-size container so square text scales with the card (cqw) */}
      <div className="relative grid aspect-square grid-cols-4 grid-rows-4 gap-1.5 [container-type:inline-size]">
        {cells.map((cell, index) => (
          <Square
            key={index}
            title={cell.title}
            artist={cell.artist}
            marked={marked.has(index)}
            inWin={winCells.has(index)}
            near={near.has(index)}
            onToggle={() => onToggle(index)}
          />
        ))}

        {/* Every win from the same tap plays at once: one beam and saucer per line */}
        {celebration?.includes('corners') && <CornersEffect />}
        {lines.map((kind) => (
          <LineEffect key={kind} cells={PATTERNS[kind]} small={lines.length > 1} />
        ))}
      </div>
    </div>
  )
}
