import { useEffect, useState } from 'react'
import { loadJSON, saveJSON } from '../lib/storage.js'

export function useLang() {
  const [lang, setLang] = useState(() => (loadJSON('lang', 'et') === 'en' ? 'en' : 'et'))

  useEffect(() => {
    saveJSON('lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  return [lang, setLang]
}
