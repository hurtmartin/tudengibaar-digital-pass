import { useEffect, useState } from 'react'
import { ADMIN_CONFIRM_MS } from '../../constants.js'

// A button for actions that need a second tap (locking voting, deleting votes). The first tap arms it: the
// label asks for confirmation and a bar along the bottom empties over ADMIN_CONFIRM_MS, showing how long the
// second tap counts. `confirm={false}` makes it a plain one-tap button with the same look.
// The parent keys it (e.g. by contest state), so a change from elsewhere disarms it.
export default function TwoTapButton({ confirm = true, label, armedLabel, busyLabel, busy, onPress, idleClass, armedClass, className = '' }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), ADMIN_CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [armed])

  function handleClick() {
    if (confirm && !armed) return setArmed(true)
    setArmed(false)
    onPress()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
      className={`relative cursor-pointer overflow-hidden rounded-xl font-extrabold tracking-wider uppercase transition-[transform,opacity,background-color,color] duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon ${
        armed ? armedClass : idleClass
      } ${className}`}
    >
      {busy ? busyLabel : armed ? armedLabel : label}
      {armed && (
        <span
          aria-hidden="true"
          className="animate-drain absolute inset-x-0 bottom-0 h-1 origin-left bg-space/45"
          style={{ animationDuration: `${ADMIN_CONFIRM_MS}ms` }}
        />
      )}
    </button>
  )
}
