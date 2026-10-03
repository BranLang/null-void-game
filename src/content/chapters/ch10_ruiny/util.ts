/**
 * Gameplay helpers for chapter 10: Tami leading the way, the watchers at the
 * edge of vision (dangerous only if you walk toward them or linger close),
 * and the moss that Tami told Flint not to step on.
 */
import type { GameAPI } from '../../../game/GameAPI'
import type { Vec2 } from '../../types'
import { l, type L } from '../../../i18n/i18n'

/** Exact (fractional) position of an actor, triangulated from distances to two reference cells. */
export function exactPos(g: GameAPI, who: string): [number, number] | null {
  const d00 = g.dist(who, [0, 0])
  if (!Number.isFinite(d00)) return null
  const d10 = g.dist(who, [1, 0])
  const d01 = g.dist(who, [0, 1])
  return [(d00 * d00 - d10 * d10 + 1) / 2, (d00 * d00 - d01 * d01 + 1) / 2]
}

// ---------------------------------------------------------------------------------- leading
export interface Leader {
  id: string
  path: Vec2[]
  /** flag storing the index of the waypoint the leader is heading for / standing at */
  key: string
  /** the leader waits until the player is this close */
  near: number
  speed?: number
  busy: boolean
}

export function leaderAt(g: GameAPI, ld: Leader): number {
  return Math.min(ld.path.length - 1, Number(g.flag(ld.key)) || 0)
}

/** Put the leader at the waypoint stored in its flag (scene load, retry). */
export function placeLeader(g: GameAPI, ld: Leader): void {
  ld.busy = false
  g.teleport(ld.id, ld.path[leaderAt(g, ld)])
}

/** Advance the leader one waypoint at a time while the player keeps up. Returns true at the end. */
export function updateLeader(g: GameAPI, ld: Leader): boolean {
  const i = leaderAt(g, ld)
  const last = ld.path.length - 1
  if (ld.busy) return false
  if (i >= last) return g.dist(ld.id, ld.path[last]) < 0.8
  if (g.dist(ld.id, 'player') > ld.near) {
    if (Math.random() < 0.02) g.face(ld.id, 'player')
    return false
  }
  ld.busy = true
  g.set(ld.key, i + 1)
  void g.walk(ld.id, ld.path[i + 1], { speed: ld.speed ?? 2.5 }).then(() => {
    ld.busy = false
  })
  return false
}

// ---------------------------------------------------------------------------------- watchers
export interface Watcher {
  id: string
  home: Vec2
  att: number
  stage: 0 | 1 | 2
  drifting: boolean
}

export interface WatchState {
  prev: [number, number] | null
  barkT: number
  failing: boolean
}

export function newWatchers(list: [string, Vec2][]): Watcher[] {
  return list.map(([id, home]) => ({ id, home, att: 0, stage: 0, drifting: false }))
}

export function resetWatchers(ws: Watcher[], st: WatchState): void {
  for (const w of ws) {
    w.att = 0
    w.stage = 0
    w.drifting = false
  }
  st.prev = null
  st.barkT = 0
  st.failing = false
}

const TAMI_WARN: L[] = [
  l('Neotáčaj sa.', 'Don’t turn.'),
  l('Flint. Oči dopredu.', 'Flint. Eyes front.'),
  l('Nechaj ho tak. Ide sa ďalej.', 'Leave it be. We keep moving.'),
]

/**
 * Watchers only look. Walking straight toward one, or standing right next to
 * it, draws its attention; at full attention it turns toward you. Returns true
 * when the player has been noticed (the caller fails the scene).
 */
export function updateWatchers(g: GameAPI, ws: Watcher[], st: WatchState, dt: number, tami: string | null): boolean {
  const p = exactPos(g, 'player')
  if (!p || dt <= 0) return false
  if (!st.prev) {
    st.prev = p
    return false
  }
  const vx = (p[0] - st.prev[0]) / dt
  const vy = (p[1] - st.prev[1]) / dt
  st.prev = p
  const speed = Math.hypot(vx, vy)
  st.barkT -= dt
  for (const w of ws) {
    const wp = w.drifting ? exactPos(g, w.id) : w.home
    if (!wp) continue
    const dx = wp[0] - p[0]
    const dy = wp[1] - p[1]
    const d = Math.hypot(dx, dy)
    let gain = 0
    if (d < 4.6 && speed > 0.6 && speed < 12) {
      const cos = (vx * dx + vy * dy) / (speed * d)
      if (cos > 0.8) gain += 0.42 + (4.6 - d) * 0.14
    }
    if (d < 2) gain += 0.5
    w.att = Math.max(0, Math.min(1, w.att + (gain > 0 ? gain * dt : -0.26 * dt)))
    if (w.att >= 0.3 && w.stage === 0) {
      w.stage = 1
      g.emote(w.id, '?')
      g.sfx('heartbeat', 0.45)
      if (tami && st.barkT <= 0) {
        g.bark(tami, TAMI_WARN[Math.floor(Math.random() * TAMI_WARN.length)])
        st.barkT = 4
      }
    }
    if (w.att >= 0.66 && w.stage === 1) {
      w.stage = 2
      w.drifting = true
      g.emote(w.id, '!')
      g.face(w.id, 'player')
      g.shake(0.1, 400)
      g.sfx('bass', 0.35)
      void g.walk(w.id, 'player', { speed: 0.7 })
    }
    if (w.att < 0.12 && w.stage > 0) {
      w.stage = 0
      if (w.drifting) {
        void g.walk(w.id, w.home, { speed: 0.8 }).then(() => {
          w.drifting = false
        })
      }
    }
    if (w.att >= 1 && !st.failing) {
      st.failing = true
      return true
    }
  }
  return false
}

// ---------------------------------------------------------------------------------- moss
export function cellSet(rows: string[], chars: string): Set<string> {
  const out = new Set<string>()
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (chars.includes(row[x])) out.add(`${x},${y}`)
  })
  return out
}

export interface SlipState {
  last: string
  t: number
  count: number
  standAt: number
}

const SLIP_TAMI: L[] = [l('Mach.', 'Moss.'), l('Povedala som: mach nie.', 'I said: no moss.'), l('Pozeraj, kam stúpam.', 'Watch where I step.')]

/** Flint slips on moss: a stumble and a remark. Purely cosmetic, never a fail. */
export function updateSlip(g: GameAPI, moss: Set<string>, st: SlipState, dt: number, tami: string | null): void {
  st.t -= dt
  if (st.standAt > 0) {
    st.standAt -= dt
    if (st.standAt <= 0) g.pose('player', 'stand')
  }
  const [x, y] = g.pos('player')
  const key = `${x},${y}`
  if (key === st.last) return
  st.last = key
  if (!moss.has(key) || st.t > 0) return
  st.t = 2.5
  st.count++
  g.pose('player', 'crouch')
  st.standAt = 0.55
  g.shake(0.12, 300)
  g.sfx('whoosh', 0.4)
  g.bark('player', st.count % 2 ? l('Kark!', 'Kark!') : l('Rossa, klzké…', 'Rossa, it’s slick…'))
  if (tami) g.bark(tami, SLIP_TAMI[(st.count - 1) % SLIP_TAMI.length])
}
