/**
 * Localisation. Every player-facing string in the game is an `L`: a pair of
 * Slovak (the novel's original language) and English text. Keeping both
 * languages side by side in the content files means TypeScript refuses to
 * compile a line that is missing a translation.
 */
export type Lang = 'sk' | 'en'

export interface L {
  sk: string
  en: string
}

let current: Lang = detectLanguage()
const listeners = new Set<(lang: Lang) => void>()

function detectLanguage(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  return langs.some((l) => /^(sk|cs)\b/i.test(l ?? '')) ? 'sk' : 'en'
}

export function getLang(): Lang {
  return current
}

export function setLang(lang: Lang): void {
  if (lang === current) return
  current = lang
  if (typeof document !== 'undefined') document.documentElement.lang = lang
  for (const fn of listeners) fn(lang)
}

export function onLangChange(fn: (lang: Lang) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Resolve a localised string, with `{name}` placeholder substitution. */
export function t(s: L | string, vars?: Record<string, string | number>): string {
  let out = typeof s === 'string' ? s : s[current] || s.en || s.sk
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  }
  return out
}

/** Shorthand constructor for content files: `l('Ahoj', 'Hello')`. */
export function l(sk: string, en: string): L {
  return { sk, en }
}
