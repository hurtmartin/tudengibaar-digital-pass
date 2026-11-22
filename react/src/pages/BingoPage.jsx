import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import BingoGrid from '../components/bingo/BingoGrid.jsx'
import { FullCelebration, Toast } from '../components/Celebration.jsx'
import { BINGO_RESET_CONFIRM_MS, BINGO_UNDO_MS } from '../constants.js'
import HowTo from '../components/bingo/HowTo.jsx'
import UndoBar from '../components/UndoBar.jsx'
import { useBingo } from '../hooks/useBingo.js'

// One toast per tap. Pattern names are like "row-2", "col-0", "diag-main", "corners";
// for a single win the part before the dash picks the text, several wins get a combo text.
function toastFor(t, celebration) {
  if (!celebration || celebration.includes('full')) return undefined
  if (celebration.length === 2) return t.doubleToast
  if (celebration.length > 2) return t.multiToast(celebration.length)
  const kind = celebration[0].split('-')[0]
  return { row: t.rowToast, col: t.colToast, diag: t.diagToast, corners: t.cornersToast }[kind]
}

export default function BingoPage() {
  const { t } = useOutletContext()
  const { card, marked, toggle, winCells, near, celebration, dismissCelebration, reset, canUndoReset, undoReset, dismissUndo } =
    useBingo()
  const toast = toastFor(t, celebration)

  return (
    <>
      <HowTo t={t} />

      {/* The card fills what's left of the screen above the footer */}
      <section className="mt-3 flex min-h-0 flex-1 items-center justify-center [container-type:size]">
        {/* Square card sized to whichever is smaller: the width, or the height minus the reset row (2.75rem + gap) */}
        <div className="flex w-[min(100cqw,calc(100cqh-3.5rem))] flex-col gap-3">
          <BingoGrid
            cells={card.cells}
            marked={marked}
            winCells={winCells}
            near={near}
            celebration={celebration}
            onToggle={toggle}
          />
          <ResetButton t={t} onReset={reset} />
        </div>
      </section>

      {toast && <Toast key={celebration.join()} message={toast} onDone={dismissCelebration} />}
      {celebration?.includes('full') && (
        <FullCelebration title={t.fullTitle} text={t.fullText} closeLabel={t.fullClose} onClose={dismissCelebration} />
      )}
      {canUndoReset && <UndoBar message={t.resetDone} undoLabel={t.undo} onUndo={undoReset} onDone={dismissUndo} ms={BINGO_UNDO_MS} />}
    </>
  )
}

function ResetButton({ t, onReset }) {
  const [armed, setArmed] = useState(false)

  // A second tap soon after confirms the reset
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), BINGO_RESET_CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [armed])

  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false)
          onReset()
        } else {
          setArmed(true)
        }
      }}
      className={`mx-auto min-h-11 rounded-full px-3 text-xs font-semibold underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-neon ${
        armed ? 'text-danger' : 'text-muted'
      }`}
    >
      {armed ? t.resetConfirm : t.reset}
    </button>
  )
}
