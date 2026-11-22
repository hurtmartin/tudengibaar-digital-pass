// Same origin as the page; BASE_URL follows BASE_PATH, so a subpath deploy needs no change here
const API = `${import.meta.env.BASE_URL}api`

export class ApiError extends Error {
  // status 0 = no response at all (offline, server down)
  constructor(status, code) {
    super(code)
    this.status = status
    this.code = code
  }
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network')
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'unknown')
  return data
}

export const getContest = () => request('GET', '/contest')
export const putVote = (number) => request('PUT', '/contest/vote', { number })
export const deleteVote = () => request('DELETE', '/contest/vote')

export const adminLogin = (password) => request('POST', '/admin/login', { password })
export const adminLogout = () => request('POST', '/admin/logout')
export const adminSession = () => request('GET', '/admin/session')
export const getResults = () => request('GET', '/admin/results')
export const addContender = (number, description) => request('POST', '/admin/contenders', { number, description })
export const bulkContenders = (text) => request('POST', '/admin/contenders/bulk', { text })
export const deleteContender = (number) => request('DELETE', `/admin/contenders/${number}`)
export const setContestState = (state) => request('PUT', '/admin/contest-state', { state })
export const deleteBurst = ({ ip, number, from, to }) => request('POST', '/admin/bursts/delete', { ip, number, from, to })
