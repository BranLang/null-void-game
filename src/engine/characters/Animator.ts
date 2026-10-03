import * as THREE from 'three'
import type { Pose } from '../../content/types'
import type { CharacterModel, QuadrupedModel } from './CharacterFactory'
import type { Expression } from './Face'

/**
 * Procedural animation: poses blended smoothly, with walk/run cycles,
 * breathing, tail sway, ear twitches, blinking, look-at and talking.
 */
interface PoseTarget {
  hipsY: number
  bodyRotX: number
  bodyY: number
  spineX: number
  neckX: number
  armLX: number
  armLZ: number
  armRX: number
  armRZ: number
  elbowLX: number
  elbowRX: number
  legLX: number
  legRX: number
  kneeLX: number
  kneeRX: number
}

const ZERO: PoseTarget = {
  hipsY: 0,
  bodyRotX: 0,
  bodyY: 0,
  spineX: 0,
  neckX: 0,
  armLX: 0,
  armLZ: 0,
  armRX: 0,
  armRZ: 0,
  elbowLX: -0.12,
  elbowRX: -0.12,
  legLX: 0,
  legRX: 0,
  kneeLX: 0,
  kneeRX: 0,
}

const POSES: Record<Pose, Partial<PoseTarget>> = {
  stand: {},
  sit: { hipsY: -0.44, legLX: -1.5, legRX: -1.5, kneeLX: 1.45, kneeRX: 1.45, armLX: -0.35, armRX: -0.35, elbowLX: -0.6, elbowRX: -0.6, spineX: 0.05 },
  kneel: { hipsY: -0.43, kneeLX: 1.65, kneeRX: 1.65, legLX: 0.05, legRX: 0.05, spineX: 0.08, armLX: -0.2, armRX: -0.2 },
  pray: { hipsY: -0.43, kneeLX: 1.65, kneeRX: 1.65, spineX: 0.12, neckX: 0.4, armLX: -1.05, armRX: -1.05, armLZ: -0.55, armRZ: 0.55, elbowLX: -1.75, elbowRX: -1.75 },
  lie: { bodyRotX: -Math.PI / 2, bodyY: 0.14, armLZ: 0.25, armRZ: -0.25 },
  cast: { armLX: -1.35, armRX: -1.35, armLZ: -0.2, armRZ: 0.2, elbowLX: -0.15, elbowRX: -0.15, spineX: -0.06 },
  crouch: { hipsY: -0.32, legLX: -1.0, legRX: -0.7, kneeLX: 1.7, kneeRX: 1.45, spineX: 0.55, neckX: -0.3, armLX: -0.5, armRX: -0.5, elbowLX: -0.8, elbowRX: -0.8 },
  carry: { armLX: -0.95, armRX: -0.95, armLZ: -0.25, armRZ: 0.25, elbowLX: -0.75, elbowRX: -0.75, spineX: -0.08 },
  dance: { armLZ: 0.6, armRZ: -0.6 },
  point: { armRX: -1.5, elbowRX: 0 },
  armsUp: { armLZ: 2.3, armRZ: -2.3, armLX: -0.35, armRX: -0.35, elbowLX: -0.1, elbowRX: -0.1, neckX: -0.25 },
  hug: { armLX: -1.2, armRX: -1.2, armLZ: -0.7, armRZ: 0.7, elbowLX: -1.1, elbowRX: -1.1 },
  fight: { hipsY: -0.06, legLX: -0.35, legRX: 0.3, kneeLX: 0.35, kneeRX: 0.25, armLX: -1.0, armRX: -0.7, elbowLX: -1.5, elbowRX: -1.6, spineX: 0.1 },
  slump: { spineX: 0.45, neckX: 0.55, armLX: 0.1, armRX: 0.1, hipsY: -0.02 },
}

function damp(cur: number, target: number, k: number, dt: number): number {
  return cur + (target - cur) * (1 - Math.exp(-k * dt))
}

export class Animator {
  pose: Pose = 'stand'
  /** horizontal speed in world units per second (set by the actor) */
  speed = 0
  running = false
  talking = false
  /** world point to look at (head turns), or null */
  lookAt: THREE.Vector3 | null = null
  expression: Expression = 'neutral'
  private cur: PoseTarget = { ...ZERO }
  private phase = 0
  private t = Math.random() * 10
  private blinkTimer = 2 + Math.random() * 3
  private blinkLeft = 0
  private mouthTimer = 0
  private earTimer = 3 + Math.random() * 4
  private earTwitch = 0
  private glyphGlow = 0.4
  private glyphTarget = 0.4
  private baseArmZ: { l: number; r: number } | null = null

  constructor(private model: CharacterModel | QuadrupedModel) {}

  /** 0 = dim, 1 = normal, 3 = blazing while casting */
  setGlyph(level: number): void {
    this.glyphTarget = level
  }

  update(dt: number, root: THREE.Object3D): void {
    this.t += dt
    if (this.model.quadruped) {
      this.updateQuad(dt)
      return
    }
    const r = this.model.rig
    if (!this.baseArmZ) this.baseArmZ = { l: r.armL.rotation.z, r: r.armR.rotation.z }
    const target: PoseTarget = { ...ZERO, ...POSES[this.pose] }
    const moving = this.speed > 0.15 && (this.pose === 'stand' || this.pose === 'carry' || this.pose === 'fight')
    if (moving) {
      const run = this.running
      this.phase += dt * this.speed * (run ? 2.3 : 3.1)
      const s = Math.sin(this.phase)
      const c = Math.cos(this.phase)
      const A = run ? 0.85 : 0.52
      target.legLX += s * A
      target.legRX -= s * A
      target.kneeLX += Math.max(0, -c) * (run ? 1.3 : 0.75) + 0.08
      target.kneeRX += Math.max(0, c) * (run ? 1.3 : 0.75) + 0.08
      if (this.pose !== 'carry') {
        target.armLX -= s * A * 0.75
        target.armRX += s * A * 0.75
        target.elbowLX -= run ? 0.9 : 0.25
        target.elbowRX -= run ? 0.9 : 0.25
      }
      target.spineX += run ? 0.22 : 0.04
      target.hipsY += Math.abs(Math.cos(this.phase)) * (run ? 0.05 : 0.025) - 0.02
    } else if (this.pose === 'stand') {
      // breathing and a little weight shift
      target.spineX += Math.sin(this.t * 1.6) * 0.012
      target.armLZ += Math.sin(this.t * 1.6) * 0.02
      target.armRZ -= Math.sin(this.t * 1.6) * 0.02
    }
    if (this.pose === 'dance') {
      target.hipsY += Math.abs(Math.sin(this.t * 3.2)) * 0.05
      target.armLZ += Math.sin(this.t * 3.2) * 0.4
      target.armRZ += Math.sin(this.t * 3.2) * 0.4
      target.spineX += Math.sin(this.t * 1.6) * 0.06
    }
    if (this.talking) {
      target.neckX += Math.sin(this.t * 7) * 0.03
      if (this.pose === 'stand' && !moving) {
        target.armRX += -0.25 + Math.sin(this.t * 2.3) * 0.12
        target.elbowRX += -0.5
      }
    }

    const k = 12
    for (const key of Object.keys(target) as (keyof PoseTarget)[]) this.cur[key] = damp(this.cur[key], target[key], k, dt)
    const p = this.cur
    r.hips.position.y = r.hips.userData.baseY ??= r.hips.position.y
    r.hips.position.y = (r.hips.userData.baseY as number) + p.hipsY
    r.body.rotation.x = p.bodyRotX
    r.body.position.y = p.bodyY
    r.spine.rotation.x = (r.spine.userData.baseX ??= r.spine.rotation.x) + p.spineX
    r.neck.rotation.x = p.neckX
    r.armL.rotation.x = p.armLX
    r.armR.rotation.x = p.armRX
    r.armL.rotation.z = this.baseArmZ.l + p.armLZ
    r.armR.rotation.z = this.baseArmZ.r + p.armRZ
    r.elbowL.rotation.x = p.elbowLX
    r.elbowR.rotation.x = p.elbowRX
    r.legL.rotation.x = p.legLX
    r.legR.rotation.x = p.legRX
    r.kneeL.rotation.x = p.kneeLX
    r.kneeR.rotation.x = p.kneeRX
    if (r.skirt) r.skirt.rotation.x = moving ? Math.sin(this.phase * 2) * 0.04 : 0

    // head look-at (yaw relative to the body), with limits
    let yaw = 0
    if (this.lookAt) {
      const headPos = new THREE.Vector3()
      r.head.getWorldPosition(headPos)
      const dx = this.lookAt.x - headPos.x
      const dz = this.lookAt.z - headPos.z
      const worldYaw = Math.atan2(dx, dz)
      yaw = THREE.MathUtils.euclideanModulo(worldYaw - root.rotation.y + Math.PI, Math.PI * 2) - Math.PI
      yaw = THREE.MathUtils.clamp(yaw, -1.0, 1.0)
    } else if (!moving) {
      yaw = Math.sin(this.t * 0.37) * 0.15
    }
    r.neck.rotation.y = damp(r.neck.rotation.y, yaw, 6, dt)

    // tail sway
    r.tail.forEach((seg, i) => {
      const amp = moving ? 0.18 : 0.1
      seg.rotation.z = Math.sin(this.t * (moving ? 4 : 1.6) - i * 0.55) * amp
      seg.rotation.x = (i === 0 ? 0 : 0.06) + Math.sin(this.t * 1.1 - i * 0.4) * 0.03
    })
    // ears twitch
    this.earTimer -= dt
    if (this.earTimer <= 0) {
      this.earTwitch = 0.25
      this.earTimer = 2.5 + Math.random() * 5
    }
    this.earTwitch = Math.max(0, this.earTwitch - dt)
    r.ears.forEach((e, i) => {
      const tw = this.earTwitch > 0 ? Math.sin(this.earTwitch * 40) * 0.25 * (i === 0 ? 1 : 0.4) : 0
      e.rotation.x = tw
    })

    // face: blink, talking mouth, expression
    const face = this.model.face
    if (face) {
      this.blinkTimer -= dt
      let blink = false
      if (this.blinkLeft > 0) {
        this.blinkLeft -= dt
        blink = true
      } else if (this.blinkTimer <= 0) {
        this.blinkLeft = 0.12
        this.blinkTimer = 2.2 + Math.random() * 3.8
        blink = true
      }
      let mouth = false
      if (this.talking) {
        this.mouthTimer += dt
        mouth = Math.floor(this.mouthTimer * 9) % 2 === 0
      }
      if (face.blink !== blink || face.mouth !== mouth || face.expr !== this.expression) {
        face.blink = blink
        face.mouth = mouth
        face.expr = this.expression
        face.apply()
      }
    }

    // glyph glow
    this.glyphGlow = damp(this.glyphGlow, this.glyphTarget, 6, dt)
    const g = this.model.glyphMaterial
    g.color.copy(this.model.glyphColor).multiplyScalar(0.25 + this.glyphGlow * 1.1)
  }

  private updateQuad(dt: number): void {
    const q = this.model as QuadrupedModel
    const r = q.rig
    if (q.species === 'pterosaur') {
      const flap = Math.sin(this.t * 5)
      r.legs.forEach((w, i) => (w.rotation.z = (i === 0 ? 1 : -1) * flap * 0.5))
      r.body.position.y = 2.5 + Math.sin(this.t * 5 + 1) * 0.08
      return
    }
    const moving = this.speed > 0.15
    if (moving) this.phase += dt * this.speed * 3.2
    r.legs.forEach((leg, i) => {
      const s = Math.sin(this.phase + (i === 0 || i === 3 ? 0 : Math.PI))
      leg.rotation.x = damp(leg.rotation.x, moving ? s * 0.55 : 0, 10, dt)
    })
    if (this.pose === 'lie') {
      r.body.position.y = damp(r.body.position.y, 0.3, 5, dt)
      r.legs.forEach((leg) => (leg.rotation.x = -1.4))
    } else r.body.position.y = damp(r.body.position.y, 0.62 + (moving ? Math.abs(Math.sin(this.phase)) * 0.04 : Math.sin(this.t * 1.5) * 0.01), 10, dt)
    r.head.rotation.x = Math.sin(this.t * 1.2) * 0.04
    r.tail.forEach((seg, i) => (seg.rotation.z = Math.sin(this.t * (moving ? 6 : 2) - i * 0.6) * 0.2))
  }
}
