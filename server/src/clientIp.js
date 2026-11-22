import { getConnInfo } from '@hono/node-server/conninfo'

// Behind Apache/Passenger the socket peer is the proxy, so prefer the last X-Forwarded-For hop
// (the one the proxy appended; earlier entries are client-controlled). Only used for soft limits.
export function clientIp(c) {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) return forwarded.split(',').at(-1).trim()
  try {
    return getConnInfo(c).remote.address ?? 'unknown'
  } catch {
    return 'unknown' // no socket, e.g. app.request() in tests
  }
}
