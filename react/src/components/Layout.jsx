import { Outlet, useLocation } from 'react-router'
import { useLang } from '../hooks/useLang.js'
import { STRINGS } from '../i18n/index.js'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import Starfield from './Starfield.jsx'

export default function Layout() {
  const [lang, setLang] = useLang()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const t = STRINGS[lang]
  // Route title shown big in neon; home shows none (it has the event buttons instead)
  const title = { '/bingo': t.bingoTitle, '/contest': t.contestTitle, '/chase': t.chasePageTitle, '/admin': t.adminTitle }[pathname]

  return (
    <>
      <Starfield />
      {/* Bingo is one fixed screen (the card sizes to it); other pages scroll. Admin is mostly used on a laptop, so it's wider. */}
      <div className={`mx-auto flex ${pathname === '/bingo' ? 'h-dvh min-h-[34rem]' : 'min-h-dvh'} w-full ${pathname === '/admin' ? 'max-w-5xl' : 'max-w-md'} flex-col gap-3 overflow-x-clip px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]`}>
        <Header t={t} lang={lang} onLangChange={setLang} title={title} isHome={isHome} />
        <main className={`flex min-h-0 flex-col ${isHome ? 'flex-auto' : 'flex-1'}`}>
          <Outlet context={{ t, lang }} />
        </main>
        <Footer t={t} />
      </div>
    </>
  )
}
