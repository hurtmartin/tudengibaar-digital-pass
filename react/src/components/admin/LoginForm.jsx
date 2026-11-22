import { useId, useState } from 'react'
import { adminLogin } from '../../lib/api.js'

export default function LoginForm({ t, onLoggedIn }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(false)
  const inputId = useId()

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy || !password) return
    setBusy(true)
    try {
      await adminLogin(password)
      onLoggedIn()
    } catch (err) {
      setError(err.code === 'bad_password' ? t.badPassword : (t.adminErrors[err.code] ?? t.adminErrorFallback))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-6 flex w-full max-w-xs flex-col gap-3" noValidate>
      <label htmlFor={inputId} className="text-sm font-bold text-ink">
        {t.adminPassword}
      </label>
      <div className="relative">
      <input
        id={inputId}
        type={visible ? 'text' : 'password'}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setError(null)
        }}
        autoComplete="current-password"
        aria-invalid={Boolean(error)}
        className={`h-13 w-full rounded-xl border-2 bg-space pr-13 pl-4 text-base font-semibold text-ink outline-none transition-colors focus:border-neon ${
          error ? 'border-danger' : 'border-white/15'
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t.hidePassword : t.showPassword}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1 my-auto flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-neon"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
      </div>
      <p role="alert" className="min-h-5 text-sm font-semibold text-danger">
        {error}
      </p>
      <button
        type="submit"
        disabled={busy || !password}
        aria-busy={busy}
        className="h-13 cursor-pointer rounded-xl bg-neon font-extrabold tracking-wider text-space uppercase transition-[opacity,filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
      >
        {busy ? t.loading : t.login}
      </button>
    </form>
  )
}
