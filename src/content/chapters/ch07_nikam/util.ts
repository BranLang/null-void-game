/**
 * Small scripting helpers shared by chapters 7–9 (all written by the same
 * hand): exact player position, follower chains, cells next to a target.
 */
import type { GameAPI } from '../../../game/GameAPI'
import type { Vec2 } from '../../types'

/** Exact (fractional) position of an actor, recovered from two distances. */
export function exactPos(g: GameAPI, who = 'player'): Vec2 {
  const d0 = g.dist(who, [0, 0])
  const d1 = g.dist(who, [100, 0])
  if (!Number.isFinite(d0) || !Number.isFinite(d1)) return g.pos(who)
  const x = (d0 * d0 - d1 * d1 + 10000) / 200
  const y = Math.sqrt(Math.max(0, d0 * d0 - x * x))
  return [x, y]
}

/** A cell `gap` tiles away from `target`, on the side of `from`. */
export function besideCell(target: Vec2, from: Vec2, gap = 1): Vec2 {
  const dx = from[0] - target[0]
  const dy = from[1] - target[1]
  const d = Math.hypot(dx, dy) || 1
  return [Math.round(target[0] + (dx / d) * gap), Math.round(target[1] + (dy / d) * gap)]
}

/**
 * Keep a line of followers walking after a leader. Call from onUpdate with a
 * timer; each follower trails the one ahead of it by `gap` tiles.
 */
export function chainFollow(g: GameAPI, leader: string, followers: string[], gap = 1.3, speed = 3.1, run = false): void {
  let ahead = leader
  for (const id of followers) {
    const d = g.dist(id, ahead)
    if (d > gap + 0.6) {
      const target = besideCell(g.pos(ahead), g.pos(id), gap)
      void g.walk(id, target, { speed: d > gap + 3 ? speed * 1.35 : speed, run: run || d > gap + 3 })
    }
    ahead = id
  }
}

/** Is the cell inside the inclusive rectangle? */
export function inRect(c: Vec2, r: [number, number, number, number]): boolean {
  return c[0] >= r[0] && c[0] <= r[2] && c[1] >= r[1] && c[1] <= r[3]
}

/** Face an actor toward a cell or actor and set its pose in one call. */
export function place(g: GameAPI, id: string, at: Vec2, face: Vec2 | string | number, pose: Parameters<GameAPI['pose']>[1] = 'stand'): void {
  g.teleport(id, at)
  g.face(id, face)
  g.pose(id, pose)
}
