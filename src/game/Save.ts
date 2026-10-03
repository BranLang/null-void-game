import type { SaveData } from './State'

export type SlotId = 'auto' | '1' | '2' | '3'
export const SLOTS: SlotId[] = ['auto', '1', '2', '3']

const key = (slot: SlotId) => `nvs.save.${slot}`

export interface StorageLike {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
}

function storage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export class SaveStore {
  constructor(private store: StorageLike | null = storage()) {}

  read(slot: SlotId): SaveData | null {
    const raw = this.store?.getItem(key(slot))
    if (!raw) return null
    try {
      const d = JSON.parse(raw) as SaveData
      if (d.version !== 1 || !d.chapterId || !d.sceneId) return null
      return d
    } catch {
      return null
    }
  }

  write(slot: SlotId, data: SaveData): boolean {
    if (!this.store) return false
    try {
      this.store.setItem(key(slot), JSON.stringify(data))
      return true
    } catch {
      // quota exceeded: retry without the thumbnail
      try {
        const { thumb: _thumb, ...rest } = data
        this.store.setItem(key(slot), JSON.stringify(rest))
        return true
      } catch {
        return false
      }
    }
  }

  remove(slot: SlotId): void {
    this.store?.removeItem(key(slot))
  }

  list(): { slot: SlotId; data: SaveData | null }[] {
    return SLOTS.map((slot) => ({ slot, data: this.read(slot) }))
  }

  /** Most recent save across all slots. */
  latest(): { slot: SlotId; data: SaveData } | null {
    let best: { slot: SlotId; data: SaveData } | null = null
    for (const { slot, data } of this.list()) {
      if (data && (!best || data.savedAt > best.data.savedAt)) best = { slot, data }
    }
    return best
  }
}
