import * as THREE from 'three'
import type { Vec2 } from '../content/types'
import type { World } from '../engine/World'
import { segDistance } from '../engine/fx/Phantom'
import { FX_LAYER } from '../engine/toon'
import type { Actor } from './Actor'

/**
 * Stealth. Guards see in vision cones (the veil hides you from eyes);
 * prízraky are blind and search with fibers, and a fiber touch finds you
 * even under the veil. Running is loud.
 */
interface GuardState {
  actor: Actor
  waypoint: number
  pause: number
  meter: number
  cone: THREE.Mesh
  baseYaw: number
  suspicious: number
  sweepT: number
}

interface PhantomState {
  actor: Actor
  meter: number
  touchCooldown: number
  wait: number
  alertT: number
  target: Vec2 | null
  waypoint: number
}

export interface StealthContext {
  world: World
  player: Actor
  veiled: () => boolean
  running: () => boolean
  forgiving: () => boolean
  blindCheck: (actor: Actor) => boolean
}

export class Stealth {
  armed = false
  private guards: GuardState[] = []
  private phantoms: PhantomState[] = []
  /** highest detection 0..1 */
  level = 0
  /** set when the player has just been touched by a fiber */
  touched = false
  onCaught: (() => void) | null = null
  private caught = false

  constructor(private ctx: StealthContext) {}

  register(actor: Actor): void {
    if (actor.def.guard) {
      const g = actor.def.guard
      const range = g.range ?? 6
      const fov = THREE.MathUtils.degToRad(g.fov ?? 70)
      const geo = new THREE.CircleGeometry(range, 24, Math.PI / 2 - fov / 2, fov)
      geo.rotateX(-Math.PI / 2)
      const mat = new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })
      const cone = new THREE.Mesh(geo, mat)
      cone.layers.set(FX_LAYER)
      cone.renderOrder = 3
      cone.visible = false
      this.ctx.world.scene.add(cone)
      this.guards.push({ actor, waypoint: 0, pause: 0, meter: 0, cone, baseYaw: actor.yaw, suspicious: 0, sweepT: Math.random() * 6 })
    }
    if (actor.def.phantom || actor.phantom) {
      this.phantoms.push({ actor, meter: 0, touchCooldown: 0, wait: Math.random() * 2, alertT: 0, target: null, waypoint: 0 })
    }
  }

  unregister(actor: Actor): void {
    const g = this.guards.find((x) => x.actor === actor)
    if (g) {
      this.ctx.world.scene.remove(g.cone)
      g.cone.geometry.dispose()
    }
    this.guards = this.guards.filter((x) => x.actor !== actor)
    this.phantoms = this.phantoms.filter((x) => x.actor !== actor)
  }

  get hasThreats(): boolean {
    return this.guards.length > 0 || this.phantoms.length > 0
  }

  reset(): void {
    this.caught = false
    this.level = 0
    for (const g of this.guards) g.meter = 0
    for (const p of this.phantoms) p.meter = 0
  }

  update(dt: number): void {
    const { player, world } = this.ctx
    const veiled = this.ctx.veiled()
    const running = this.ctx.running()
    const assist = this.ctx.forgiving() ? 0.5 : 1
    let maxMeter = 0
    this.touched = false

    // ---------------------------------------------------------------- guards
    for (const g of this.guards) {
      const a = g.actor
      const spec = a.def.guard!
      const visibleActor = a.visible
      g.cone.visible = this.armed && visibleActor
      if (!visibleActor) continue
      // patrol
      if (!a.moving && spec.patrol?.length) {
        if (g.pause > 0) g.pause -= dt
        else {
          g.waypoint = (g.waypoint + 1) % spec.patrol.length
          const target = spec.patrol[g.waypoint]
          const path = world.grid.findPath(a.cell(), target, { ignoreDynamic: true })
          if (path?.length) void a.follow(path, 1.6).then(() => (g.pause = (spec.pause ?? 1800) / 1000))
          else g.pause = 1
        }
      }
      // look: sweep while standing, turn to noise when suspicious
      g.sweepT += dt
      if (!a.moving) {
        if (g.suspicious > 0) {
          g.suspicious -= dt
          a.facePoint(player.x, player.y)
        } else if (spec.sweep) {
          const sweep = THREE.MathUtils.degToRad(spec.sweep)
          a.faceYaw(g.baseYaw + Math.sin(g.sweepT * 0.6) * sweep)
        }
      } else g.baseYaw = a.yaw
      g.cone.position.set(a.x, a.root.position.y + 0.05, a.y)
      g.cone.rotation.y = a.yaw
      if (!this.armed) continue
      const blind = this.ctx.blindCheck(a)
      const dx = player.x - a.x
      const dz = player.y - a.y
      const dist = Math.hypot(dx, dz)
      const range = spec.range ?? 6
      const fov = THREE.MathUtils.degToRad(spec.fov ?? 70)
      let ang = Math.atan2(dx, dz) - a.yaw
      ang = THREE.MathUtils.euclideanModulo(ang + Math.PI, Math.PI * 2) - Math.PI
      const inCone = dist <= range && Math.abs(ang) <= fov / 2
      const los = inCone && world.grid.lineOfSight(a.x, a.y, player.x, player.y)
      const sees = !blind && los && !veiled && player.visible
      if (sees) g.meter += dt * (1.9 - (dist / range) * 1.1) * (running ? 1.4 : 1) * assist
      else g.meter = Math.max(0, g.meter - dt * 0.45)
      // noise
      if (running && !veiled && dist < 3.2 && !blind) {
        g.suspicious = 1.6
        g.meter += dt * 0.25 * assist
      }
      const mat = g.cone.material as THREE.MeshBasicMaterial
      mat.color.set(g.meter > 0.05 ? '#ff7a4a' : '#ffe08a').lerp(new THREE.Color('#ff3040'), Math.min(1, g.meter))
      mat.opacity = 0.14 + Math.min(1, g.meter) * 0.18
      maxMeter = Math.max(maxMeter, g.meter)
    }

    // ---------------------------------------------------------------- phantoms
    for (const p of this.phantoms) {
      const a = p.actor
      if (!a.visible) continue
      const spec = a.def.phantom ?? {}
      const vis = a.phantom
      if (vis) vis.alert = THREE.MathUtils.damp(vis.alert, p.alertT > 0 ? 1 : 0, 3, dt)
      p.touchCooldown -= dt
      p.alertT -= dt
      // movement
      if (!a.moving) {
        p.wait -= dt
        if (p.wait <= 0) {
          let target: Vec2 | null = null
          if (p.alertT > 0 && p.target) target = p.target
          else if (spec.patrol?.length) {
            p.waypoint = (p.waypoint + 1) % spec.patrol.length
            target = spec.patrol[p.waypoint]
          } else if (spec.roam) {
            const [x0, y0, x1, y1] = spec.roam
            for (let tries = 0; tries < 8 && !target; tries++) {
              const c: Vec2 = [x0 + Math.floor(Math.random() * (x1 - x0 + 1)), y0 + Math.floor(Math.random() * (y1 - y0 + 1))]
              if (world.grid.walkable(c[0], c[1], true)) target = c
            }
          }
          if (target) {
            const path = world.grid.findPath(a.cell(), target, { ignoreDynamic: true })
            if (path?.length) void a.follow(path.slice(0, 8), (spec.speed ?? 0.9) * (p.alertT > 0 ? 1.7 : 1))
          }
          p.wait = 1.2 + Math.random() * 2.4
        }
      }
      if (!this.armed || !vis) continue
      // fiber touch: the veil does not help against touch
      let touch = false
      for (const s of vis.segments) {
        if (segDistance(player.x, player.y, s) < 0.27) {
          touch = true
          break
        }
      }
      if (touch && p.touchCooldown <= 0) {
        p.meter += 0.62 * assist
        p.touchCooldown = 0.9
        p.alertT = 5
        p.target = player.cell()
        a.facePoint(player.x, player.y)
        this.touched = true
      } else if (!touch) p.meter = Math.max(0, p.meter - dt * 0.18)
      // walking straight into the dust itself
      const d = Math.hypot(player.x - a.x, player.y - a.y)
      if (d < 0.7) p.meter = 1
      maxMeter = Math.max(maxMeter, p.meter)
    }

    this.level = Math.min(1, maxMeter)
    if (this.armed && this.level >= 1 && !this.caught) {
      this.caught = true
      this.onCaught?.()
    }
  }

  dispose(): void {
    for (const g of this.guards) {
      this.ctx.world.scene.remove(g.cone)
      g.cone.geometry.dispose()
    }
    this.guards = []
    this.phantoms = []
  }
}
