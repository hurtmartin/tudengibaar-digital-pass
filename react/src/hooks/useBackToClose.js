import { useCallback, useEffect } from 'react'

// While `open`, the phone's Back closes the overlay instead of leaving the page: opening adds a
// history entry, Back removes it. Returns `close`, to use for every other way of closing (✕, Esc,
// tap outside), so the extra entry is removed there too and Back afterwards behaves normally.
// `onClose` must be stable (useCallback).
export function useBackToClose(open, onClose) {
  useEffect(() => {
    if (!open) return
    // The check skips a second entry when StrictMode runs the effect twice
    if (!history.state?.overlay) history.pushState({ overlay: true }, '')
    window.addEventListener('popstate', onClose)
    return () => window.removeEventListener('popstate', onClose)
  }, [open, onClose])

  return useCallback(() => {
    if (history.state?.overlay) history.back()
    else onClose()
  }, [onClose])
}
