import * as THREE from 'three'
import type { ParticleKind, ParticleSpec } from '../../content/types'
import { FX_LAYER } from '../toon'

/**
 * CPU-simulated point particles rendered with a soft round sprite shader.
 * Continuous systems (rain, lanterns, black dust...) come from the scene
 * ambience; bursts are one-shot effects for spells and impacts.
 */
interface KindDef {
  count: number
  color: string
  size: number
  additive: boolean
  opacity: number
}

const KINDS: Record<ParticleKind, KindDef> = {
  dust: { count: 160, color: '#d8d0c0', size: 0.05, additive: false, opacity: 0.45 },
  motes: { count: 120, color: '#ffe6b0', size: 0.06, additive: true, opacity: 0.7 },
  fireflies: { count: 50, color: '#c8ff7a', size: 0.12, additive: true, opacity: 1 },
  lanterns: { count: 40, color: '#ffae4a', size: 0.42, additive: true, opacity: 0.95 },
  rain: { count: 900, color: '#a8c4e8', size: 0.05, additive: false, opacity: 0.55 },
  snow: { count: 600, color: '#ffffff', size: 0.07, additive: false, opacity: 0.9 },
  embers: { count: 80, color: '#ff8a3a', size: 0.07, additive: true, opacity: 1 },
  ash: { count: 260, color: '#8a8580', size: 0.05, additive: false, opacity: 0.7 },
  blackdust: { count: 420, color: '#0a0810', size: 0.07, additive: false, opacity: 0.9 },
  leaves: { count: 60, color: '#6a8a3a', size: 0.1, additive: false, opacity: 0.95 },
  petals: { count: 80, color: '#f4c8e0', size: 0.08, additive: false, opacity: 0.95 },
  spores: { count: 140, color: '#7ff6ff', size: 0.07, additive: true, opacity: 0.9 },
  bubbles: { count: 60, color: '#bfefff', size: 0.06, additive: true, opacity: 0.6 },
  steam: { count: 90, color: '#e8eef4', size: 0.9, additive: false, opacity: 0.18 },
  clouds: { count: 40, color: '#e8e4f0', size: 6, additive: false, opacity: 0.22 },
  stars: { count: 120, color: '#ffffff', size: 0.05, additive: true, opacity: 0.9 },
}

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uPxPerUnit;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.5, aSize * uPxPerUnit);
  }
`
const frag = /* glsl */ `
  uniform float uOpacity;
  uniform float uSoft;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = mix(smoothstep(0.5, 0.42, d), smoothstep(0.5, 0.0, d), uSoft);
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
  }
`

const pxPerUnit = { value: 60 }

export function setParticlePixelScale(v: number): void {
  pxPerUnit.value = v
}

class System {
  readonly points: THREE.Points
  private pos: Float32Array
  private vel: Float32Array
  private life: Float32Array
  private seed: Float32Array
  private alpha: Float32Array
  private size: Float32Array
  private color: Float32Array
  private t = 0
  constructor(
    readonly spec: ParticleSpec,
    private area: [number, number, number, number],
    private def: KindDef,
    private burst = false,
  ) {
    const n = spec.count ?? def.count
    this.pos = new Float32Array(n * 3)
    this.vel = new Float32Array(n * 3)
    this.life = new Float32Array(n)
    this.seed = new Float32Array(n)
    this.alpha = new Float32Array(n)
    this.size = new Float32Array(n)
    this.color = new Float32Array(n * 3)
    const base = new THREE.Color(spec.color ?? def.color)
    for (let i = 0; i < n; i++) {
      this.seed[i] = Math.random()
      this.respawn(i, true)
      const c = base.clone()
      if (spec.kind === 'blackdust' && Math.random() < 0.07) c.set('#b77dff').multiplyScalar(2.2)
      if (spec.kind === 'lanterns') c.offsetHSL((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.1)
      if (spec.kind === 'leaves') c.offsetHSL((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.15)
      if (def.additive && spec.kind !== 'stars') c.multiplyScalar(1.6)
      this.color.set([c.r, c.g, c.b], i * 3)
      this.size[i] = def.size * (0.6 + Math.random() * 0.8)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.color, 3))
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: def.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uPxPerUnit: pxPerUnit,
        uOpacity: { value: def.opacity },
        uSoft: { value: ['steam', 'clouds', 'lanterns', 'fireflies', 'spores', 'motes', 'embers'].includes(spec.kind) ? 1 : 0.35 },
      },
    })
    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    this.points.layers.set(FX_LAYER)
    this.points.renderOrder = 5
  }

  private rand(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  private respawn(i: number, initial: boolean): void {
    const [x0, z0, x1, z1] = this.area
    const k = this.spec.kind
    const p = this.pos
    const v = this.vel
    const at = this.spec.at
    let x = this.rand(x0, x1)
    let z = this.rand(z0, z1)
    let y = 0
    v[i * 3] = v[i * 3 + 1] = v[i * 3 + 2] = 0
    this.life[i] = 1
    switch (k) {
      case 'rain':
        y = initial ? this.rand(0, 12) : 12
        v[i * 3 + 1] = -this.rand(14, 18)
        v[i * 3] = -1.2
        break
      case 'snow':
      case 'ash':
        y = initial ? this.rand(0, 10) : 10
        v[i * 3 + 1] = -this.rand(0.5, 1.1)
        break
      case 'leaves':
      case 'petals':
        y = initial ? this.rand(0, 8) : 8
        v[i * 3 + 1] = -this.rand(0.4, 0.8)
        break
      case 'lanterns':
        y = initial ? this.rand(0, 14) : this.rand(-0.5, 0.5)
        v[i * 3 + 1] = this.rand(0.35, 0.7)
        break
      case 'embers':
      case 'spores':
      case 'bubbles':
      case 'steam':
        y = initial ? this.rand(0, 4) : 0
        v[i * 3 + 1] = this.rand(0.3, 1.0) * (k === 'embers' ? 1.6 : 1)
        break
      case 'blackdust': {
        const cx = at ? at[0] : (x0 + x1) / 2
        const cz = at ? at[1] : (z0 + z1) / 2
        const r = (this.spec.radius ?? 1.2) * Math.sqrt(Math.random())
        const a = Math.random() * Math.PI * 2
        x = cx + Math.cos(a) * r
        z = cz + Math.sin(a) * r
        y = this.rand(0, 2.2)
        break
      }
      case 'clouds':
        y = this.rand(-6, -3)
        v[i * 3] = this.rand(0.3, 0.8)
        break
      default:
        y = this.rand(0.2, 3.5)
        v[i * 3] = this.rand(-0.15, 0.15)
        v[i * 3 + 1] = this.rand(-0.05, 0.1)
        v[i * 3 + 2] = this.rand(-0.15, 0.15)
    }
    p[i * 3] = x
    p[i * 3 + 1] = y
    p[i * 3 + 2] = z
  }

  /** returns false when a burst has finished */
  update(dt: number): boolean {
    this.t += dt
    const n = this.life.length
    const p = this.pos
    const v = this.vel
    const k = this.spec.kind
    const [x0, z0, x1, z1] = this.area
    let alive = 0
    for (let i = 0; i < n; i++) {
      const s = this.seed[i]
      if (this.burst) {
        this.life[i] -= dt * (0.9 + s * 0.8)
        if (this.life[i] <= 0) {
          this.alpha[i] = 0
          continue
        }
        alive++
        v[i * 3 + 1] -= dt * (k === 'snow' ? 1.5 : k === 'embers' || k === 'motes' ? -0.6 : 0.4)
        p[i * 3] += v[i * 3] * dt
        p[i * 3 + 1] += v[i * 3 + 1] * dt
        p[i * 3 + 2] += v[i * 3 + 2] * dt
        v[i * 3] *= 0.97
        v[i * 3 + 2] *= 0.97
        this.alpha[i] = Math.min(1, this.life[i] * 1.6)
        continue
      }
      switch (k) {
        case 'fireflies':
        case 'motes':
        case 'dust':
        case 'stars':
          p[i * 3] += (v[i * 3] + Math.sin(this.t * 0.7 + s * 30) * 0.12) * dt
          p[i * 3 + 1] += (v[i * 3 + 1] + Math.cos(this.t * 0.9 + s * 20) * 0.08) * dt
          p[i * 3 + 2] += (v[i * 3 + 2] + Math.cos(this.t * 0.6 + s * 40) * 0.12) * dt
          this.alpha[i] = k === 'fireflies' ? Math.max(0, Math.sin(this.t * (1 + s * 2) + s * 50)) : 0.5 + 0.5 * Math.sin(this.t * 1.3 + s * 60)
          if (p[i * 3 + 1] < 0 || p[i * 3 + 1] > 4.5) v[i * 3 + 1] *= -1
          break
        case 'blackdust': {
          const cx = this.spec.at ? this.spec.at[0] : (x0 + x1) / 2
          const cz = this.spec.at ? this.spec.at[1] : (z0 + z1) / 2
          const dx = p[i * 3] - cx
          const dz = p[i * 3 + 2] - cz
          const ang = 0.9 + s * 1.2
          p[i * 3] += (-dz * ang + Math.sin(this.t * 3 + s * 40) * 0.3) * dt
          p[i * 3 + 2] += (dx * ang + Math.cos(this.t * 3 + s * 30) * 0.3) * dt
          p[i * 3 + 1] += Math.sin(this.t * 2 + s * 20) * 0.6 * dt
          const r = Math.hypot(dx, dz)
          const maxR = this.spec.radius ?? 1.2
          if (r > maxR * 1.3) {
            p[i * 3] = cx + (dx / r) * maxR * 0.5
            p[i * 3 + 2] = cz + (dz / r) * maxR * 0.5
          }
          this.alpha[i] = 0.6 + 0.4 * Math.sin(this.t * 4 + s * 70)
          break
        }
        default:
          p[i * 3] += (v[i * 3] + (k === 'leaves' || k === 'petals' || k === 'snow' ? Math.sin(this.t * 1.5 + s * 30) * 0.4 : 0)) * dt
          p[i * 3 + 1] += v[i * 3 + 1] * dt
          p[i * 3 + 2] += v[i * 3 + 2] * dt
          if (k === 'lanterns') {
            p[i * 3] += Math.sin(this.t * 0.4 + s * 10) * 0.08 * dt
            this.alpha[i] = Math.min(1, (14 - p[i * 3 + 1]) / 4) * (0.85 + 0.15 * Math.sin(this.t * 3 + s * 30))
          } else if (k === 'embers' || k === 'spores' || k === 'steam' || k === 'bubbles') {
            this.alpha[i] = Math.max(0, 1 - p[i * 3 + 1] / (k === 'steam' ? 3 : 4)) * (k === 'embers' ? 0.6 + 0.4 * Math.sin(this.t * 12 + s * 40) : 1)
            if (k === 'steam') this.size[i] += dt * 0.4
          } else this.alpha[i] = 1
      }
      const y = p[i * 3 + 1]
      const out =
        (k === 'rain' && y < 0) ||
        ((k === 'snow' || k === 'ash' || k === 'leaves' || k === 'petals') && y < 0) ||
        (k === 'lanterns' && y > 14) ||
        ((k === 'embers' || k === 'spores' || k === 'bubbles') && y > 4) ||
        (k === 'steam' && y > 3) ||
        (k === 'clouds' && p[i * 3] > x1 + 6)
      if (out) {
        this.respawn(i, false)
        if (k === 'steam') this.size[i] = this.def.size * (0.6 + Math.random() * 0.8)
        if (k === 'clouds') p[i * 3] = x0 - 6
      }
      // keep wandering particles inside the area
      if (p[i * 3] < x0 - 1) p[i * 3] = x1
      if (p[i * 3] > x1 + 1 && k !== 'clouds') p[i * 3] = x0
      if (p[i * 3 + 2] < z0 - 1) p[i * 3 + 2] = z1
      if (p[i * 3 + 2] > z1 + 1) p[i * 3 + 2] = z0
    }
    const geo = this.points.geometry
    geo.attributes.position.needsUpdate = true
    geo.attributes.aAlpha.needsUpdate = true
    if (k === 'steam') geo.attributes.aSize.needsUpdate = true
    return !this.burst || alive > 0
  }

  /** Initialise a burst from a point. */
  burstFrom(x: number, y: number, z: number, speed: number, up: number): void {
    const n = this.life.length
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = speed * (0.3 + Math.random() * 0.7)
      this.pos.set([x, y, z], i * 3)
      this.vel.set([Math.cos(a) * s, up * (0.3 + Math.random()), Math.sin(a) * s], i * 3)
      this.life[i] = 0.6 + Math.random() * 0.6
      this.alpha[i] = 1
    }
  }

  dispose(): void {
    this.points.geometry.dispose()
    ;(this.points.material as THREE.Material).dispose()
  }
}

export class Particles {
  readonly group = new THREE.Group()
  private systems: System[] = []
  private bursts: System[] = []

  constructor(private mapArea: [number, number, number, number]) {
    this.group.name = 'particles'
  }

  add(spec: ParticleSpec): void {
    const area = spec.area ? ([spec.area[0] - 0.5, spec.area[1] - 0.5, spec.area[2] + 0.5, spec.area[3] + 0.5] as [number, number, number, number]) : this.mapArea
    const sys = new System(spec, area, KINDS[spec.kind])
    this.systems.push(sys)
    this.group.add(sys.points)
  }

  remove(id: string): void {
    this.systems = this.systems.filter((s) => {
      if (s.spec.id === id) {
        this.group.remove(s.points)
        s.dispose()
        return false
      }
      return true
    })
  }

  /** One-shot burst of particles. */
  burst(kind: ParticleKind, at: THREE.Vector3, opts: { color?: string; count?: number; speed?: number; up?: number } = {}): void {
    const spec: ParticleSpec = { kind, count: opts.count ?? 60, color: opts.color }
    const sys = new System(spec, [at.x - 1, at.z - 1, at.x + 1, at.z + 1], { ...KINDS[kind], count: opts.count ?? 60 }, true)
    sys.burstFrom(at.x, at.y, at.z, opts.speed ?? 2.5, opts.up ?? 1.5)
    this.bursts.push(sys)
    this.group.add(sys.points)
  }

  update(dt: number): void {
    for (const s of this.systems) s.update(dt)
    this.bursts = this.bursts.filter((b) => {
      const alive = b.update(dt)
      if (!alive) {
        this.group.remove(b.points)
        b.dispose()
      }
      return alive
    })
  }

  dispose(): void {
    for (const s of [...this.systems, ...this.bursts]) {
      this.group.remove(s.points)
      s.dispose()
    }
    this.systems = []
    this.bursts = []
  }
}
