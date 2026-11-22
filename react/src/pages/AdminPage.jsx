import { useCallback, useEffect, useId, useState } from 'react'
import { useOutletContext } from 'react-router'
import AdminTabs from '../components/admin/AdminTabs.jsx'
import ContenderEditor from '../components/admin/ContenderEditor.jsx'
import ContenderList from '../components/admin/ContenderList.jsx'
import DeviceReset from '../components/admin/DeviceReset.jsx'
import LoginForm from '../components/admin/LoginForm.jsx'
import ResultsTable from '../components/admin/ResultsTable.jsx'
import StatusBar from '../components/admin/StatusBar.jsx'
import SuspiciousVotes from '../components/admin/SuspiciousVotes.jsx'
import { usePolling } from '../hooks/usePolling.js'
import { adminLogout, adminSession, getResults } from '../lib/api.js'

const POLL_MS = 5_000

export default function AdminPage() {
  const { t } = useOutletContext()
  const [authed, setAuthed] = useState(null) // null = still asking the server
  const [checkError, setCheckError] = useState(null) // code when the server couldn't be asked at all
  const loggedOut = useCallback(() => setAuthed(false), [])

  // Only a 401 means "not logged in". Anything else (offline, cold start, 5xx) says so and offers a retry,
  // instead of showing the login form as if the session had ended.
  const checkSession = useCallback(
    () =>
      adminSession().then(
        () => setAuthed(true),
        (err) => (err.status === 401 ? setAuthed(false) : setCheckError(err.code)),
      ),
    [],
  )

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (checkError) {
    return (
      <LoadError
        t={t}
        code={checkError}
        onRetry={() => {
          setCheckError(null)
          checkSession()
        }}
      />
    )
  }
  if (authed === null) return <p className="py-10 text-center text-muted">{t.loading}</p>
  if (!authed) return <LoginForm t={t} onLoggedIn={() => setAuthed(true)} />
  return <Dashboard t={t} onLoggedOut={loggedOut} />
}

// Only mounted while logged in, so polling stops at logout.
// Sticky status bar on top, then two tabs: Hääletus (live results, suspicious votes) and Osalejad (setup).
// Both tab panels stay mounted (the hidden one just isn't shown), so typed text and an undo bar survive a switch.
function Dashboard({ t, onLoggedOut }) {
  const [data, setData] = useState(null)
  const [updated, setUpdated] = useState(null) // time of the last good refresh
  const [error, setError] = useState(null) // code of the last failed refresh, cleared by a good one
  const [tab, setTab] = useState(null) // null = not picked yet
  const idPrefix = useId()

  const refresh = useCallback(async () => {
    try {
      setData(await getResults())
      setUpdated(new Date())
      setError(null)
    } catch (err) {
      if (err.status === 401) onLoggedOut()
      else setError(err.code)
    }
  }, [onLoggedOut])

  usePolling(refresh, POLL_MS)

  // Runs an admin write, then refreshes. Resolves to { ok, data } or { ok: false, code } for the caller to show.
  const act = useCallback(
    async (call) => {
      try {
        const result = await call()
        await refresh()
        return { ok: true, data: result }
      } catch (err) {
        if (err.status === 401) onLoggedOut()
        return { ok: false, code: err.code }
      }
    },
    [refresh, onLoggedOut],
  )

  // Before the party there's nothing to watch yet, so start on Osalejad until contestants exist
  const activeTab = tab ?? (data?.rows.length === 0 ? 'contenders' : 'voting')
  const panel = (id) => ({
    id: `${idPrefix}-${id}-panel`,
    role: 'tabpanel',
    'aria-labelledby': `${idPrefix}-${id}`,
    hidden: activeTab !== id,
  })

  if (!data) {
    return error ? (
      <LoadError t={t} code={error} onRetry={refresh} />
    ) : (
      <p className="py-10 text-center text-muted">{t.loading}</p>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <StatusBar
        t={t}
        state={data.state}
        totalVotes={data.totalVotes}
        updated={updated}
        pollError={error}
        onRetry={refresh}
        act={act}
      />

      <AdminTabs
        t={t}
        tab={activeTab}
        onChange={setTab}
        idPrefix={idPrefix}
        burstCount={data.bursts.length}
        contenderCount={data.rows.length}
      />

      <div {...panel('voting')} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <ResultsTable t={t} rows={data.rows} totalVotes={data.totalVotes} />
        <SuspiciousVotes t={t} bursts={data.bursts} rows={data.rows} act={act} />
      </div>
      <div {...panel('contenders')} className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ContenderList t={t} rows={data.rows} act={act} />
        <ContenderEditor t={t} act={act} />
      </div>

      {/* Not part of the contest: this browser's own guest progress, so it sits apart from the tabs */}
      <DeviceReset t={t} />

      <button
        type="button"
        onClick={async () => {
          await adminLogout().catch(() => {})
          onLoggedOut()
        }}
        className="mx-auto mt-4 min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold text-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-neon"
      >
        {t.logout}
      </button>
    </div>
  )
}

// The server couldn't be reached (or failed): the reason and a retry, in place of the page
function LoadError({ t, code, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center text-sm font-semibold text-danger">
      {t.adminErrors[code] ?? t.adminErrorFallback}
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 cursor-pointer rounded-xl border-2 border-white/15 px-5 font-extrabold text-ink hover:border-neon focus-visible:outline-2 focus-visible:outline-neon"
      >
        {t.retry}
      </button>
    </div>
  )
}
