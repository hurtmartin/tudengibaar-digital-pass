import { Link, useOutletContext } from 'react-router'

export default function NotFoundPage() {
  const { t } = useOutletContext()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="text-glow text-6xl font-black text-neon">404</p>
      <p className="text-lg font-semibold text-ink">{t.notFound}</p>
      <Link
        to="/"
        className="rounded-xl bg-neon px-6 py-3 font-extrabold uppercase tracking-wider text-space focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
      >
        {t.backHome}
      </Link>
    </div>
  )
}
