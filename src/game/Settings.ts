import { DEFAULT_BINDINGS, type Bindings } from '../engine/Input'
import type { Quality } from '../engine/Renderer'
import { getLang, type Lang } from '../i18n/i18n'

export interface Settings {
  lang: Lang
  music: number
  sfx: number
  ambience: number
  /** characters per second, 0 = instant */
  textSpeed: number
  textScale: number
  quality: Quality
  outlines: boolean
  reducedMotion: boolean
  /** minigames: offer skip after one failure */
  assistSkip: boolean
  /** minigames & timed sequences run slower */
  assistSlow: boolean
  /** stealth: guards notice the player more slowly */
  assistStealth: boolean
  autoAdvance: boolean
  screenShake: boolean
  bindings: Bindings
}

export const DEFAULT_SETTINGS: Settings = {
  lang: getLang(),
  music: 0.6,
  sfx: 0.8,
  ambience: 0.7,
  textSpeed: 55,
  textScale: 1,
  quality: 'high',
  outlines: true,
  reducedMotion: false,
  assistSkip: false,
  assistSlow: false,
  assistStealth: false,
  autoAdvance: false,
  screenShake: true,
  bindings: structuredClone(DEFAULT_BINDINGS),
}

const KEY = 'nvs.settings'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<Settings>
      return { ...DEFAULT_SETTINGS, ...s, bindings: { ...DEFAULT_BINDINGS, ...(s.bindings ?? {}) } }
    }
  } catch {
    /* ignore */
  }
  const prefersReduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return { ...DEFAULT_SETTINGS, reducedMotion: prefersReduced }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
