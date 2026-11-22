import { getCookie, setCookie } from 'hono/cookie'

const COOKIE = 'voter_id'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// Gives every device a random voter id in an httpOnly cookie; the server only trusts this id.
export function voter({ isProd, cookiePath }) {
  return async (c, next) => {
    let id = getCookie(c, COOKIE)
    if (!id || !UUID.test(id)) {
      id = crypto.randomUUID()
      setCookie(c, COOKIE, id, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: isProd,
        maxAge: 2 * 24 * 60 * 60,
        path: cookiePath,
      })
    }
    c.set('voterId', id)
    await next()
  }
}
