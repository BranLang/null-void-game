/**
 * Small scripting helpers shared by chapters 4–6.
 */
import type { Vec2 } from '../../../types'
import type { GameAPI } from '../../../../game/GameAPI'
import type { L } from '../../../../i18n/i18n'
import type { Expression } from '../../../../engine/characters/Face'

/** True when `who` stands within `r` tiles of any of the cells. */
export function nearAny(g: GameAPI, who: string, cells: readonly Vec2[], r: number): boolean {
  const [x, y] = g.pos(who)
  for (const c of cells) if (Math.hypot(c[0] - x, c[1] - y) <= r) return true
  return false
}

/**
 * Night sight for temple watchers: two glowing robes in the dark pass for
 * sisters at prayer, so a watcher only notices you up close, unless the
 * flag `litFlag` is set (lichen lighting up Arkot's spots).
 */
export function darkSight(guardId: string, litFlag: string, close = 2.2): (g: GameAPI) => boolean {
  return (g) => !g.flag(litFlag) && g.dist(guardId, 'player') > close
}

/** A dialogue line: speaker (actor/cast id, or null for narration), text, optional mood. */
export type Line = [string | null, L, Expression?]

/** Play dialogue lines back to back. */
export async function lines(g: GameAPI, list: Line[]): Promise<void> {
  for (const [who, text, mood] of list) {
    if (who === null) await g.narrate(text)
    else await g.say(who, text, mood ? { mood } : undefined)
  }
}
