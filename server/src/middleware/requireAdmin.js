import { getCookie } from 'hono/cookie'

export const SESSION_COOKIE = 'admin_session'

export function requireAdmin(db) {
  return async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE)
    if (!token || !db.isSessionValid(token)) return c.json({ error: 'unauthorized' }, 401)
    await next()
  }
}
