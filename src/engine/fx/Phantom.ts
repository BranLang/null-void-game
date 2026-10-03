import * as THREE from 'three'
import { FX_LAYER } from '../toon'

/**
 * Prízraky: beings woven from dust. They have no eyes; they search with
 * hair-thin black fibers that sweep through the dark. The fibers are real
 * gameplay geometry: the stealth system tests them against the player.
 */
export type PhantomForm = 'crawler' | 'humanoid' | 'wall' | 'listener' | 'watcher' | 'samael'

export interface FiberSeg {
  ax: number
  az: number
  bx: number
  bz: number
}

export class PhantomVisual {
  readonly group = new THREE.Group()
  private body = new THREE.Group()
  private fibers: THREE.LineSegments
  private fiberPos: Float32Array
  private dust: THREE.Points
  private dustPos: Float32Array
  private dustSeed: Float32Array
  private eyesMat: THREE.MeshBasicMaterial
  private t = Math.random() * 10
  /** world-space fiber segments, refreshed each update */
  readonly segments: FiberSeg[] = []
  /** 0 calm .. 1 hunting: fibers reach further and move faster */
  alert = 0
  /** fibers can be retracted entirely (cutscenes) */
  fibersOn = true

  constructor(
    readonly form: PhantomForm,
    readonly fiberCount = form === 'samael' ? 46 : form === 'watcher' ? 0 : 12,
    readonly reach = form === 'samael' ? 5.5 : 2.6,
  ) {
    const shell = new THREE.MeshBasicMaterial({ color: '#050407', transparent: true, opacity: form === 'watcher' ? 0.45 : 0.88 })
    const add = (geo: THREE.BufferGeometry, x = 0, y = 0, z = 0, rx = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, shell)
      m.position.set(x, y, z)
      m.rotation.set(rx, 0, rz)
      this.body.add(m)
      return m
    }
    switch (form) {
      case 'crawler':
        add(new THREE.CapsuleGeometry(0.2, 0.6, 3, 8).rotateX(Math.PI / 2), 0, 0.45, 0)
        add(new THREE.SphereGeometry(0.17, 8, 6), 0, 0.4, 0.5)
        for (const [x, z] of [
          [0.2, 0.3],
          [-0.2, 0.3],
          [0.2, -0.3],
          [-0.2, -0.3],
        ])
          add(new THREE.CylinderGeometry(0.03, 0.02, 0.6, 5), x * 1.4, 0.22, z, z > 0 ? -0.5 : 0.5, x > 0 ? -0.5 : 0.5)
        break
      case 'listener':
        add(new THREE.SphereGeometry(0.42, 10, 8).scale(1, 0.8, 1), 0, 0.42, 0)
        add(new THREE.SphereGeometry(0.2, 8, 6), 0, 0.8, 0.18)
        break
      case 'wall':
        add(new THREE.CapsuleGeometry(0.2, 0.9, 3, 8).scale(1, 1, 0.25), 0, 1.3, -0.42)
        add(new THREE.SphereGeometry(0.16, 8, 6).scale(1, 1, 0.3), 0, 2.05, -0.42)
        break
      case 'watcher':
        add(new THREE.CapsuleGeometry(0.22, 1.6, 3, 8), 0, 1.2, 0)
        break
      case 'samael': {
        // no shape, only height: a writhing column with a wax-white face low to the ground
        add(new THREE.ConeGeometry(0.9, 3.4, 10, 4, true), 0, 1.7, 0)
        add(new THREE.SphereGeometry(0.8, 12, 8).scale(1, 0.6, 1), 0, 0.5, 0)
        const wax = new THREE.MeshToonMaterial({ color: '#efe8dc' })
        const face = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10).scale(0.85, 1.1, 0.6), wax)
        face.position.set(0, 0.75, 0.62)
        this.body.add(face)
        break
      }
      default:
        add(new THREE.CapsuleGeometry(0.17, 0.85, 3, 8), 0, 0.95, 0)
        add(new THREE.SphereGeometry(0.17, 8, 6), 0, 1.65, 0)
        add(new THREE.CylinderGeometry(0.035, 0.025, 0.75, 5), 0.24, 1.05, 0, 0, 0.25)
        add(new THREE.CylinderGeometry(0.035, 0.025, 0.75, 5), -0.24, 1.05, 0, 0, -0.25)
    }
    this.group.add(this.body)
    // eyes: violet for Samael's humanoid shape, pits of flowing dust otherwise
    this.eyesMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#b77dff').multiplyScalar(2.6), toneMapped: false })
    if (form === 'samael' || form === 'humanoid') {
      for (const s of [1, -1]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(form === 'samael' ? 0.05 : 0.03, 6, 4), form === 'samael' ? new THREE.MeshBasicMaterial({ color: '#100c14' }) : this.eyesMat)
        e.position.set(s * (form === 'samael' ? 0.1 : 0.06), form === 'samael' ? 0.8 : 1.68, form === 'samael' ? 0.82 : 0.15)
        this.body.add(e)
      }
    }
    // fibers
    this.fiberPos = new Float32Array(Math.max(1, this.fiberCount) * 6)
    const fg = new THREE.BufferGeometry()
    fg.setAttribute('position', new THREE.BufferAttribute(this.fiberPos, 3))
    this.fibers = new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: new THREE.Color('#2a1638'), transparent: true, opacity: 0.85 }))
    this.fibers.frustumCulled = false
    this.group.add(this.fibers)
    // dust swirl
    const n = form === 'samael' ? 420 : 110
    this.dustPos = new Float32Array(n * 3)
    this.dustSeed = new Float32Array(n)
    for (let i = 0; i < n; i++) this.dustSeed[i] = Math.random()
    const dg = new THREE.BufferGeometry()
    dg.setAttribute('position', new THREE.BufferAttribute(this.dustPos, 3))
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#0d0912', size: form === 'samael' ? 0.09 : 0.06, transparent: true, opacity: 0.8, depthWrite: false }))
    this.dust.frustumCulled = false
    this.group.add(this.dust)
    this.group.traverse((o) => o.layers.set(FX_LAYER))
  }

  setOpacity(o: number): void {
    this.group.traverse((c) => {
      const m = (c as THREE.Mesh).material as THREE.Material | undefined
      if (m && 'opacity' in m) {
        m.transparent = true
        ;(m as THREE.Material & { opacity: number }).opacity = Math.min((m.userData.baseOpacity ??= (m as THREE.Material & { opacity: number }).opacity) as number, o)
      }
    })
  }

  /** dt in seconds. `worldYaw` = root rotation (fibers are computed in world space). */
  update(dt: number, root: THREE.Object3D): void {
    this.t += dt
    const t = this.t
    const speed = 0.6 + this.alert * 1.6
    // body undulation
    this.body.position.y = Math.sin(t * 1.7) * 0.04
    this.body.scale.set(1 + Math.sin(t * 2.3) * 0.03, 1 + Math.sin(t * 1.9) * 0.04, 1)
    this.eyesMat.color.set('#b77dff').multiplyScalar(2 + Math.sin(t * 3) * 0.6 + this.alert * 1.5)
    // dust orbit
    const R = this.form === 'samael' ? 1.3 : 0.55
    const H = this.form === 'samael' ? 3.2 : this.form === 'crawler' || this.form === 'listener' ? 0.9 : 1.9
    for (let i = 0; i < this.dustSeed.length; i++) {
      const s = this.dustSeed[i]
      const a = t * (0.6 + s) + s * 40
      const r = R * (0.4 + 0.6 * ((s * 7.3) % 1)) * (1 + Math.sin(t * 2 + s * 20) * 0.15)
      this.dustPos[i * 3] = Math.cos(a) * r
      this.dustPos[i * 3 + 1] = ((s * 13.7 + t * 0.2 * (s - 0.5)) % 1 + 1) % 1 * H
      this.dustPos[i * 3 + 2] = Math.sin(a) * r
    }
    this.dust.geometry.attributes.position.needsUpdate = true
    // fibers: sweep around the body, longer when alert
    this.segments.length = 0
    const n = this.fiberCount
    const origin = new THREE.Vector3()
    root.getWorldPosition(origin)
    const yaw = root.rotation.y
    const baseY = this.form === 'samael' ? 2.4 : this.form === 'crawler' ? 0.55 : 1.2
    for (let i = 0; i < n; i++) {
      const phase = i * 2.399
      const ang = phase + Math.sin(t * speed * 0.5 + i) * 0.9 + t * speed * 0.15 * (i % 2 ? 1 : -1)
      const len = this.fibersOn ? this.reach * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * speed + phase * 1.7))) * (0.75 + this.alert * 0.4) : 0
      const lx = Math.sin(ang) * len
      const lz = Math.cos(ang) * len
      const o = i * 6
      this.fiberPos[o] = Math.sin(ang) * 0.2
      this.fiberPos[o + 1] = baseY * (0.6 + 0.4 * ((i * 0.37) % 1))
      this.fiberPos[o + 2] = Math.cos(ang) * 0.2
      this.fiberPos[o + 3] = lx
      this.fiberPos[o + 4] = 0.05 + Math.max(0, Math.sin(t * 2 + i)) * 0.2
      this.fiberPos[o + 5] = lz
      // world-space segment on the ground plane (undo the root yaw)
      const cy = Math.cos(yaw)
      const sy = Math.sin(yaw)
      const wx0 = origin.x + (Math.sin(ang) * 0.2 * cy + Math.cos(ang) * 0.2 * sy)
      const wz0 = origin.z + (-Math.sin(ang) * 0.2 * sy + Math.cos(ang) * 0.2 * cy)
      const wx1 = origin.x + (lx * cy + lz * sy)
      const wz1 = origin.z + (-lx * sy + lz * cy)
      if (len > 0.3) this.segments.push({ ax: wx0, az: wz0, bx: wx1, bz: wz1 })
    }
    this.fibers.geometry.attributes.position.needsUpdate = true
    ;(this.fibers.material as THREE.LineBasicMaterial).color.set(this.alert > 0.5 ? '#5a2a7a' : '#2a1638')
  }
}

/** Distance from point (px, pz) to segment. */
export function segDistance(px: number, pz: number, s: FiberSeg): number {
  const dx = s.bx - s.ax
  const dz = s.bz - s.az
  const l2 = dx * dx + dz * dz
  let k = l2 > 0 ? ((px - s.ax) * dx + (pz - s.az) * dz) / l2 : 0
  k = Math.max(0, Math.min(1, k))
  return Math.hypot(px - (s.ax + dx * k), pz - (s.az + dz * k))
}
