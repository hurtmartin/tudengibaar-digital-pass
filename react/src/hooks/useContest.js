import { useCallback, useEffect, useState } from 'react'
import { deleteVote, getContest, putVote } from '../lib/api.js'
import { saveJSON } from '../lib/storage.js'
import { usePolling } from './usePolling.js'

const POLL_MS = 10_000

// The server is the source of truth; this mirrors GET /api/contest and refetches when a write is refused
export function useContest() {
  const [data, setData] = useState(null) // { state, contenders, myVote }
  const [error, setError] = useState(null) // ApiError code of the last failed request
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setData(await getContest())
      setError(null)
    } catch (err) {
      setError(err.code)
    }
  }, [])

  usePolling(refresh, POLL_MS)

  // Keep home's cached copy current, so its contest button is right the moment you go back
  const state = data?.state
  const myVote = data?.myVote
  useEffect(() => {
    if (state !== undefined) saveJSON('contest', { state, myVote })
  }, [state, myVote])

  // Resolves true when the server accepted the change
  async function write(call) {
    setBusy(true)
    try {
      const { myVote } = await call()
      setData((d) => ({ ...d, myVote }))
      setError(null)
      return true
    } catch (err) {
      setError(err.code)
      // 409: voting was locked meanwhile; refetch so the locked view shows
      if (err.status === 409) await refresh()
      return false
    } finally {
      setBusy(false)
    }
  }

  return {
    state: data?.state ?? null,
    contenders: data?.contenders ?? [],
    myVote: data?.myVote ?? null,
    loading: data === null && error === null,
    error,
    busy,
    vote: (number) => write(() => putVote(number)),
    unvote: () => write(deleteVote),
    retry: refresh,
  }
}
