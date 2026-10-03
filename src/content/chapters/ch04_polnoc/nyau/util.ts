/**
 * Small scripting helpers shared by chapters 4–6.
 */
import type { Vec2 } from '../../../types'
import type { GameAPI } from '../../../../game/GameAPI'

/**
 * A companion that walks a few steps behind the player (call from onUpdate).
 * It follows the player's trail so it never steps onto the player's cell.
 */
export function follower(id: string, opts: { gap?: number; interval?: number } = {}): (g: GameAPI, dt: number) => void {
  const trail: Vec2[] = []
  let timer = 0
  const gap = opts.gap ?? 1.6
  return (g, dt) => {
    const p = g.pos('player')
    const last = trail[trail.length - 1]
    if (!last || last[0] !== p[0] || last[1] !== p[1]) {
      trail.push(p)
      if (trail.length > 10) trail.shift()
    }
    timer -= dt
    if (timer > 0) return
    timer = opts.interval ?? 0.3
    const d = g.dist(id, 'player')
    if (d <= gap) return
    const target = trail.length >= 2 ? trail[trail.length - 2] : p
    void g.walk(id, target, { speed: d > 3.2 ? 4.4 : 3.0 })
  }
}

/** True when `who` stands within `r` tiles of any of the cells. */
export function nearAny(g: GameAPI, who: string, cells: readonly Vec2[], r: number): boolean {
  const [x, y] = g.pos(who)
  for (const c of cells) if (Math.hypot(c[0] - x, c[1] - y) <= r) return true
  return false
}

/** A guard that cannot see you in the dark unless you come close (or `lit` is set). */
export function darkSight(guardId: string, litFlag: string, close = 2.2): (g: GameAPI) => boolean {
  return (g) => !g.flag(litFlag) && g.dist(guardId, 'player') > close
}
