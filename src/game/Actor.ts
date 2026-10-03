import * as THREE from 'three'
import type { ActorDef, Pose, Vec2 } from '../content/types'
import { CAST, type CastMember } from '../content/characters'
import { buildCharacter, buildQuadruped, type CharacterModel, type QuadrupedModel } from '../engine/characters/CharacterFactory'
import { Animator } from '../engine/characters/Animator'
import type { Expression } from '../engine/characters/Face'
import { PhantomVisual, type PhantomForm } from '../engine/fx/Phantom'
import type { World } from '../engine/World'
import { l, type L } from '../i18n/i18n'
import { SpriteCharacter, yawToDir } from '../engine/characters/SpriteCharacter'
import { SPRITES } from '../content/sprites'

/** Screen-relative facing (0 = towards camera) to a world yaw for a model facing +Z. */
export function facingToYaw(deg: number): number {
  return Math.PI / 4 + THREE.MathUtils.degToRad(deg)
}

export class Actor {
  readonly root = new THREE.Group()
  model: CharacterModel | QuadrupedModel | null = null
  phantom: PhantomVisual | null = null
  sprite: SpriteCharacter | null = null
  private pose: Pose = 'stand'
  private mood: Expression | null = null
  animator: Animator | null = null
  x: number
  y: number
  yaw: number
  private targetYaw: number
  private path: Vec2[] = []
  private speed = 2.6
  private arrive: (() => void) | null = null
  running = false
  visible = true
  castId: string
  /** extra vertical offset (floating Samael, carried) */
  lift = 0
  private stepAcc = 0
  onStep: (() => void) | null = null
  /** the player is not a dynamic blocker; NPCs are */
  readonly blocks: boolean
  private blockedCell: Vec2 | null = null
  private bobT = Math.random() * 10

  constructor(
    readonly id: string,
    readonly def: ActorDef,
    private world: World,
    isPlayer = false,
  ) {
    this.castId = def.character
    this.x = def.at[0]
    this.y = def.at[1]
    this.yaw = this.targetYaw = facingToYaw(def.facing ?? 0)
    this.blocks = !isPlayer && def.solid !== false && !def.phantom
    this.build(def.character)
    this.root.userData.actorId = id
    this.world.scene.add(this.root)
    this.setVisible(!def.hidden)
    if (def.pose) this.setPose(def.pose)
    this.syncTransform(true)
  }

  get cast(): CastMember | undefined {
    return CAST[this.castId]
  }

  get name(): L {
    return this.def.name ?? this.cast?.name ?? l(this.id, this.id)
  }

  private build(castId: string): void {
    if (this.model) this.root.remove(this.model.rig.root)
    if (this.phantom) this.root.remove(this.phantom.group)
    if (this.sprite) {
      this.root.remove(this.sprite.root)
      this.sprite.dispose()
    }
    this.model = null
    this.phantom = null
    this.sprite = null
    const cast = CAST[castId]
    if (!cast) console.warn(`[actor] unknown cast id '${castId}'`)
    const special = cast?.special
    const plate = this.world.def.plate
    if (plate && SPRITES[castId]) {
      this.sprite = new SpriteCharacter(SPRITES[castId], 1.45 * (this.def.scale ?? 1) * (special === 'samael' ? 1.6 : 1), plate.tint ?? '#ffffff')
      this.root.add(this.sprite.root)
      this.animator = null
    } else if (special === 'phantom' || special === 'samael' || this.def.phantom) {
      const form: PhantomForm = (this.def.phantom?.form as PhantomForm) ?? (special === 'samael' ? 'samael' : 'humanoid')
      this.phantom = new PhantomVisual(form, this.def.phantom?.fibers, this.def.phantom?.reach)
      this.root.add(this.phantom.group)
      this.animator = null
    } else if (cast) {
      const look = cast.look
      this.model = 'quadruped' in look ? buildQuadruped(look) : buildCharacter(look)
      if (this.def.scale) this.model.rig.root.scale.multiplyScalar(this.def.scale)
      this.root.add(this.model.rig.root)
      const prevPose = this.animator?.pose
      this.animator = new Animator(this.model)
      if (prevPose) this.animator.pose = prevPose
    }
    this.castId = castId
  }

  costume(castId: string): void {
    this.build(castId)
  }

  get height(): number {
    if (this.sprite) return this.sprite.height
    if (this.model) return this.model.rig.height
    return this.phantom?.form === 'samael' ? 3.4 : 1.9
  }

  /** world position of the head (for barks, emotes, camera focus) */
  headWorld(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(this.x, this.root.position.y + this.height + 0.15, this.y)
  }

  worldPos(out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(this.root.position)
  }

  cell(): Vec2 {
    return [Math.round(this.x), Math.round(this.y)]
  }

  setVisible(v: boolean): void {
    this.visible = v
    this.root.visible = v
    this.updateBlock()
  }

  setPose(p: Pose): void {
    this.pose = p
    if (this.animator) this.animator.pose = p
  }

  setMood(m: Expression): void {
    this.mood = m
    if (this.animator) this.animator.expression = m
  }

  setTalking(on: boolean): void {
    if (this.animator) this.animator.talking = on
  }

  lookAt(p: THREE.Vector3 | null): void {
    if (this.animator) this.animator.lookAt = p
  }

  faceYaw(yaw: number, instant = false): void {
    this.targetYaw = yaw
    if (instant) this.yaw = yaw
  }

  facePoint(x: number, y: number, instant = false): void {
    if (Math.abs(x - this.x) + Math.abs(y - this.y) < 1e-3) return
    this.faceYaw(Math.atan2(x - this.x, y - this.y), instant)
  }

  teleport(x: number, y: number): void {
    this.x = x
    this.y = y
    this.path = []
    this.syncTransform(true)
    this.updateBlock()
  }

  /** Follow a path of cells. Resolves on arrival (or when interrupted). */
  follow(path: Vec2[], speed = 2.6, run = false): Promise<void> {
    this.arrive?.()
    this.path = [...path]
    this.speed = speed
    this.running = run
    return new Promise((resolve) => {
      this.arrive = resolve
      if (!this.path.length) this.finishPath()
    })
  }

  stop(): void {
    this.path = []
    this.finishPath()
  }

  get moving(): boolean {
    return this.path.length > 0
  }

  private finishPath(): void {
    const a = this.arrive
    this.arrive = null
    a?.()
  }

  /** Free movement (player WASD): velocity in tiles per second; returns actual displacement. */
  move(vx: number, vy: number, dt: number, canEnter: (fx: number, fy: number, tx: number, ty: number) => boolean): { dx: number; dy: number } {
    const nx = this.x + vx * dt
    const ny = this.y + vy * dt
    const probe = 0.32
    const ok = (tx: number, ty: number) => {
      const lx = tx + Math.sign(vx) * probe * (vx !== 0 ? 1 : 0)
      const ly = ty + Math.sign(vy) * probe * (vy !== 0 ? 1 : 0)
      return canEnter(Math.round(this.x), Math.round(this.y), Math.round(lx), Math.round(ly)) && canEnter(Math.round(this.x), Math.round(this.y), Math.round(tx), Math.round(ty))
    }
    let dx = 0
    let dy = 0
    if (ok(nx, ny)) {
      dx = nx - this.x
      dy = ny - this.y
    } else if (vx !== 0 && ok(nx, this.y)) {
      dx = nx - this.x
    } else if (vy !== 0 && ok(this.x, ny)) {
      dy = ny - this.y
    }
    this.x += dx
    this.y += dy
    if (Math.abs(dx) + Math.abs(dy) > 1e-5) this.faceYaw(Math.atan2(vx, vy))
    return { dx, dy }
  }

  private updateBlock(): void {
    if (!this.blocks) return
    const cell = this.visible ? this.cell() : null
    const same = cell && this.blockedCell && cell[0] === this.blockedCell[0] && cell[1] === this.blockedCell[1]
    if (same) return
    if (this.blockedCell) this.world.grid.block(this.blockedCell[0], this.blockedCell[1], false)
    this.blockedCell = cell
    if (cell) this.world.grid.block(cell[0], cell[1], true)
  }

  release(): void {
    if (this.blockedCell) this.world.grid.block(this.blockedCell[0], this.blockedCell[1], false)
    this.blockedCell = null
    this.world.scene.remove(this.root)
    this.sprite?.dispose()
  }

  private syncTransform(instant = false): void {
    const groundY = this.world.grid.heightAt(this.x, this.y)
    const targetY = groundY + this.lift
    this.root.position.x = this.x
    this.root.position.z = this.y
    this.root.position.y = instant ? targetY : THREE.MathUtils.lerp(this.root.position.y, targetY, 0.25)
    this.root.rotation.y = this.sprite ? 0 : this.yaw
  }

  /** Per-frame update; `speedNow` is the current horizontal speed for animation. */
  update(dt: number, freeSpeed = 0): void {
    let speedNow = freeSpeed
    if (this.path.length) {
      const [tx, ty] = this.path[0]
      const dx = tx - this.x
      const dy = ty - this.y
      const d = Math.hypot(dx, dy)
      const step = this.speed * dt
      if (d <= step) {
        this.x = tx
        this.y = ty
        this.path.shift()
        if (!this.path.length) this.finishPath()
      } else {
        this.x += (dx / d) * step
        this.y += (dy / d) * step
        this.faceYaw(Math.atan2(dx, dy))
      }
      speedNow = this.speed
    }
    // smooth rotation
    let diff = this.targetYaw - this.yaw
    diff = THREE.MathUtils.euclideanModulo(diff + Math.PI, Math.PI * 2) - Math.PI
    this.yaw += diff * (1 - Math.exp(-dt * 12))
    this.syncTransform()
    this.updateBlock()
    if (this.animator) {
      this.animator.speed = speedNow
      this.animator.running = this.running || speedNow > 3.6
      this.animator.update(dt, this.root)
    }
    if (this.sprite) {
      const sp = this.sprite
      sp.dir = yawToDir(this.yaw)
      const posed: Partial<Record<Pose, string>> = { kneel: 'kneel', pray: 'kneel', sit: 'kneel', cast: 'cast' }
      if (speedNow > 0.2) {
        sp.state = 'walk'
        sp.rate = Math.max(0.6, speedNow / 2.6)
      } else if (posed[this.pose]) sp.state = posed[this.pose]!
      else if (this.mood === 'happy') sp.state = 'happy'
      else sp.state = 'idle'
      sp.update(dt)
    }
    if (this.phantom) {
      this.bobT += dt
      this.phantom.update(dt, this.root)
    }
    if (speedNow > 0.2 && this.onStep) {
      this.stepAcc += dt * speedNow
      if (this.stepAcc > 0.85) {
        this.stepAcc = 0
        this.onStep()
      }
    }
  }
}
