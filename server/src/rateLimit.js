// Fixed-window counter per key (usually IP). In memory, so each Passenger process counts on its own:
// a soft limit against scripted spam, not a security boundary.
export function createRateLimiter({ limit, windowMs }) {
  const windows = new Map()

  return function allow(key, now = Date.now()) {
    let w = windows.get(key)
    if (!w || now - w.start >= windowMs) {
      // Drop stale keys now and then so the map can't grow forever
      if (windows.size > 10_000) for (const [k, old] of windows) if (now - old.start >= windowMs) windows.delete(k)
      w = { start: now, count: 0 }
      windows.set(key, w)
    }
    w.count += 1
    return w.count <= limit
  }
}
