/**
 * Small helpers shared by chapters 1–3 (Arkot's and Yera's Nyau).
 *
 * `behavior: 'wander'` on ActorDef is not implemented by the engine, so busy
 * places (aerodock, festival, docks) animate their crowds with waypoints:
 * every few seconds a wanderer strolls to another of its (known walkable)
 * cells. onUpdate only runs while no cinematic holds the game, so crowds
 * freeze politely during dialogue.
 */
import type { GameAPI } from '../../../game/GameAPI'
import type { Vec2 } from '../../types'

export interface Wanderer {
  id: string
  points: Vec2[]
  speed: number
  next: number
}

export function wanderers(list: { id: string; points: Vec2[]; speed?: number }[]): Wanderer[] {
  return list.map((w, i) => ({ id: w.id, points: w.points, speed: w.speed ?? 1.3, next: 1 + i * 0.7 }))
}

export function updateWanderers(g: GameAPI, ws: Wanderer[], dt: number): void {
  for (const w of ws) {
    w.next -= dt
    if (w.next > 0) continue
    w.next = 3 + Math.random() * 5
    const p = w.points[Math.floor(Math.random() * w.points.length)]
    if (g.dist(w.id, p) < 0.5) continue
    if (g.dist(w.id, 'player') < 1.6) continue
    void g.walk(w.id, p, { speed: w.speed })
  }
}

/** Reset timers (call from onEnter so a reloaded scene does not burst into motion). */
export function resetWanderers(ws: Wanderer[]): void {
  ws.forEach((w, i) => (w.next = 1.5 + i * 0.6))
}
