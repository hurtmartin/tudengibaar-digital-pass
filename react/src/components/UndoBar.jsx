import { useEffect } from 'react'

// A bar at the bottom (in thumb reach) offering to undo what just happened, for `ms`; then onDone.
// Used after a bingo reset and after deleting a contestant in admin.
export default function UndoBar({ message, undoLabel, onUndo, onDone, ms }) {
  useEffect(() => {
    const timer = setTimeout(onDone, ms)
    return () => clearTimeout(timer)
  }, [onDone, ms])

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        role="status"
        className="animate-toast-up flex items-center gap-4 rounded-2xl border border-white/15 bg-surface py-2 pr-2 pl-5 text-sm font-semibold text-ink shadow-[0_12px_40px_-8px_rgba(0,0,0,0.9)]"
      >
        {message}
        <button
          type="button"
          onClick={onUndo}
          className="min-h-11 cursor-pointer rounded-xl px-4 font-extrabold text-neon transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-neon"
        >
          {undoLabel}
        </button>
      </div>
    </div>
  )
}
