import { useEffect, useRef } from 'react'

// Runs fn now and every `ms`, skipping ticks while the tab is hidden (phone locked, app switched)
// and catching up as soon as it's visible again. Stops on unmount.
export function usePolling(fn, ms) {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    const tick = () => {
      if (!document.hidden) fnRef.current()
    }
    tick()
    const timer = setInterval(tick, ms)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [ms])
}
