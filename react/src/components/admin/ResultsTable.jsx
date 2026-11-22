// Live results, read-only (deleting contestants lives on the Osalejad tab, so a mis-click here changes nothing).
// Rows come from the server sorted by votes, then number. Ties share a place and the next place is skipped
// (1, 1, 3). First place is tinted and labelled "Juhib", or "Viik" on every row tied for first, so the
// winner can't be misread. The share column shows from sm up; on a phone the names need the room.
export default function ResultsTable({ t, rows, totalVotes }) {
  const max = Math.max(0, ...rows.map((r) => r.votes))
  const leaders = max > 0 ? rows.filter((r) => r.votes === max).length : 0

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-surface/85 p-4">
      <h2 className="text-lg font-extrabold text-ink">{t.results}</h2>

      {rows.length === 0 ? (
        <p className="py-2 text-sm text-muted">{t.noContenders}</p>
      ) : (
        <table className="w-full border-separate border-spacing-y-1 text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="w-10 pb-1 pl-2 text-left font-semibold">{t.rank}</th>
              <th scope="col" className="w-14 pb-1 text-left font-semibold">{t.numberShort}</th>
              <th scope="col" className="pb-1 text-left font-semibold">{t.contender}</th>
              <th scope="col" className="w-14 pr-2 pb-1 text-right font-semibold sm:pr-0">{t.votes}</th>
              <th scope="col" className="hidden w-20 pr-2 pb-1 text-right font-semibold sm:table-cell">{t.share}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rank = rows.findIndex((o) => o.votes === r.votes) + 1
              const leading = leaders > 0 && r.votes === max
              const cell = `py-2 ${leading ? 'bg-neon/10' : ''}`
              return (
                <tr key={r.number}>
                  <td className={`${cell} rounded-l-lg pl-2 font-black tabular-nums ${leading ? 'text-neon' : 'text-muted'}`}>{rank}.</td>
                  <td className={`${cell} font-extrabold text-ink tabular-nums`}>#{r.number}</td>
                  <td className={`${cell} pr-3`}>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="break-words text-ink">{r.description}</span>
                      {leading && (
                        <span className="rounded-full bg-neon px-2 text-[0.7rem] font-black tracking-wider text-space uppercase">
                          {leaders > 1 ? t.tie : t.leader}
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block h-1.5 rounded-full bg-white/10">
                      <span
                        className="block h-full origin-left rounded-full bg-neon transition-transform duration-500 ease-out-soft"
                        style={{ transform: `scaleX(${max ? r.votes / max : 0})` }}
                      />
                    </span>
                  </td>
                  <td className={`${cell} rounded-r-lg pr-2 text-right text-base font-black text-ink tabular-nums sm:rounded-r-none sm:pr-0`}>{r.votes}</td>
                  <td className={`${cell} hidden rounded-r-lg pr-2 text-right text-muted tabular-nums sm:table-cell`}>
                    {totalVotes ? `${Math.round((r.votes / totalVotes) * 100)}%` : '–'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
