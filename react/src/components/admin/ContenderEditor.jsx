import { useId, useRef, useState } from 'react'
import { addContender, bulkContenders } from '../../lib/api.js'

const MAX_DESCRIPTION = 67 // same limit as the server (validate.js) and the DB CHECK (schema.sql)

const inputClass =
  'h-12 rounded-xl border-2 border-white/15 bg-space px-3 text-base font-semibold text-ink outline-none transition-colors focus:border-neon'
const buttonClass =
  'h-12 cursor-pointer rounded-xl bg-neon px-5 font-extrabold tracking-wider text-space uppercase transition-[opacity,filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon'

export default function ContenderEditor({ t, act }) {
  const errorText = (code) => t.adminErrors[code] ?? t.adminErrorFallback
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-surface/85 p-4">
      <SingleAdd t={t} act={act} errorText={errorText} />
      <BulkAdd t={t} act={act} errorText={errorText} />
    </section>
  )
}

function SingleAdd({ t, act, errorText }) {
  const [number, setNumber] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(null) // success line for the last add
  const [busy, setBusy] = useState(false)
  const numberRef = useRef(null)
  const numberId = useId()
  const descriptionId = useId()
  const length = [...description.trim()].length

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    const result = await act(() => addContender(Number(number), description))
    setBusy(false)
    if (result.ok) {
      setAdded(t.contenderAdded(Number(number), description.trim()))
      setNumber('')
      setDescription('')
      setError(null)
      // Ready for the next one: adding a whole list is number, description, Enter, repeat
      numberRef.current?.focus()
    } else {
      setAdded(null)
      setError(errorText(result.code))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <h2 className="text-lg font-extrabold text-ink">{t.addContender}</h2>
      <div className="flex gap-2">
        <div className="flex w-20 flex-col gap-1">
          <label htmlFor={numberId} className="text-xs font-bold text-muted">
            {t.number}
          </label>
          <input
            id={numberId}
            ref={numberRef}
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={number}
            onChange={(e) => {
              setNumber(e.target.value.slice(0, 2))
              setAdded(null)
            }}
            className={`${inputClass} w-full text-center`}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={descriptionId} className="flex justify-between text-xs font-bold text-muted">
            {t.description}
            <span className={`tabular-nums ${length > MAX_DESCRIPTION ? 'text-danger' : ''}`}>
              {length}/{MAX_DESCRIPTION}
            </span>
          </label>
          <input
            id={descriptionId}
            type="text"
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>
      </div>
      {/* One line reserved for either message, so the button doesn't jump */}
      <p role="status" className={`min-h-5 text-sm font-semibold ${error ? 'text-danger' : 'text-neon'}`}>
        {error ?? added}
      </p>
      <button type="submit" disabled={busy || !number || length === 0} aria-busy={busy} className={buttonClass}>
        {busy ? t.saving : t.add}
      </button>
    </form>
  )
}

function BulkAdd({ t, act, errorText }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null) // { added, errors } from the server
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const textId = useId()

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    const res = await act(() => bulkContenders(text))
    setBusy(false)
    if (!res.ok) return setError(errorText(res.code))
    setError(null)
    const lines = text.split(/\r?\n/)
    // Keep the sent lines: errors name them by text, since the box below only keeps the failed ones
    setResult({ ...res.data, lines })
    // Keep only the failed lines in the box, so they can be fixed and re-sent
    const failed = new Set(res.data.errors.map((e) => e.line))
    setText(lines.filter((_, i) => failed.has(i + 1)).join('\n'))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={textId} className="text-lg font-extrabold text-ink">
        {t.bulkAdd}
      </label>
      <p className="text-xs text-muted">{t.bulkHint}</p>
      <textarea
        id={textId}
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'7, punane tulnukas\n12, hõbedane robot'}
        className="rounded-xl border-2 border-white/15 bg-space p-3 font-mono text-sm text-ink outline-none placeholder:text-white/30 focus:border-neon"
      />
      {result && (
        <div role="status" className="text-sm">
          <p className="font-semibold text-neon">{t.bulkAdded(result.added)}</p>
          {result.errors.map((e) => (
            <p key={e.line} className="text-danger">
              {t.lineError(result.lines[e.line - 1].trim(), errorText(e.error))}
            </p>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !text.trim()} aria-busy={busy} className={buttonClass}>
        {busy ? t.saving : t.add}
      </button>
    </form>
  )
}
