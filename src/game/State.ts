import type { L } from '../i18n/i18n'

export type FlagValue = boolean | number | string

export interface SaveData {
  version: 1
  chapterId: string
  sceneId: string
  spawn?: string
  player?: { x: number; y: number; facing: number }
  flags: Record<string, FlagValue>
  rel: Record<string, number>
  items: string[]
  codex: string[]
  abilities: string[]
  objective: L | null
  playtime: number
  savedAt: number
  thumb?: string
  chapterTitle?: L
  sceneName?: L
}

/** Mutable state of one playthrough. */
export class GameState {
  chapterId = ''
  sceneId = ''
  flags: Record<string, FlagValue> = {}
  rel: Record<string, number> = {}
  items = new Set<string>()
  codex = new Set<string>()
  abilities = new Set<string>()
  objective: L | null = null
  playtime = 0

  reset(): void {
    this.chapterId = ''
    this.sceneId = ''
    this.flags = {}
    this.rel = {}
    this.items.clear()
    this.codex.clear()
    this.abilities.clear()
    this.objective = null
    this.playtime = 0
  }

  toSave(extra: Partial<SaveData> = {}): SaveData {
    return {
      version: 1,
      chapterId: this.chapterId,
      sceneId: this.sceneId,
      flags: { ...this.flags },
      rel: { ...this.rel },
      items: [...this.items],
      codex: [...this.codex],
      abilities: [...this.abilities],
      objective: this.objective,
      playtime: Math.round(this.playtime),
      savedAt: Date.now(),
      ...extra,
    }
  }

  fromSave(d: SaveData): void {
    this.reset()
    this.chapterId = d.chapterId
    this.sceneId = d.sceneId
    this.flags = { ...d.flags }
    this.rel = { ...d.rel }
    d.items.forEach((i) => this.items.add(i))
    d.codex.forEach((c) => this.codex.add(c))
    ;(d.abilities ?? []).forEach((a) => this.abilities.add(a))
    this.objective = d.objective
    this.playtime = d.playtime
  }
}

/** Persistent profile shared by all save slots (chapter select, codex gallery). */
export interface Profile {
  chapters: string[]
  codex: string[]
  finished: boolean
}

const PROFILE_KEY = 'nvs.profile'

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Profile>
      return { chapters: p.chapters ?? [], codex: p.codex ?? [], finished: !!p.finished }
    }
  } catch {
    /* storage unavailable */
  }
  return { chapters: [], codex: [], finished: false }
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable */
  }
}
