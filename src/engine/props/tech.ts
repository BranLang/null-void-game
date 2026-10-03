import * as THREE from 'three'
import { registerProp } from './registry'
import {
  PAL,
  M,
  F,
  glowMat,
  bx,
  cy,
  cn,
  ball,
  dome,
  rod,
  chain,
  leaf,
  torus,
  ring,
  extrude,
  rock,
  rot,
  fx,
  keep,
  finalize,
  cachedBuild,
  cachedGeo,
  cachedMat,
  wrap,
  seeded,
  variant,
  shade,
  bool,
  num,
  tint,
  canvasTex,
  texMat,
  additive,
  uniqueGlow,
  uniqueGlowToon,
  type V3,
} from './kit'

// ---------------------------------------------------------------------------
// shared: Spira crystals (also used by magic.ts skeletons)
// ---------------------------------------------------------------------------

export function crystalGeo(): THREE.BufferGeometry {
  return cachedGeo('crystal', () => {
    const g = new THREE.LatheGeometry(
      [new THREE.Vector2(0, 0), new THREE.Vector2(0.78, 0.05), new THREE.Vector2(1, 0.2), new THREE.Vector2(1, 0.7), new THREE.Vector2(0, 1)],
      6,
    )
    const flat = g.toNonIndexed()
    flat.computeVertexNormals()
    return flat
  })
}

/** Per-placement crystal material (pulsed by pulseCrystals). */
export function crystalMat(color: string = PAL.spira): THREE.MeshToonMaterial {
  const m = uniqueGlowToon(shade(color, 0.85), color, 1.25, true)
  m.userData.base = 1.25
  return m
}

/** A crystal of radius r and height h whose base sits at p, tilted towards dir. */
export function crystal(material: THREE.Material, r: number, h: number, p: V3, tiltX = 0, tiltZ = 0, rotY = 0): THREE.Mesh {
  const m = new THREE.Mesh(crystalGeo(), material)
  m.scale.set(r, h, r)
  m.position.set(p[0], p[1], p[2])
  m.rotation.set(tiltX, rotY, tiltZ)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export function pulseCrystals(obj: THREE.Object3D, t: number): void {
  const m = obj.userData.crystalMat as THREE.MeshToonMaterial | undefined
  if (!m) return
  const base = Number(m.userData.base) || 1.2
  const p = Number(obj.userData.phase) || 0
  m.emissiveIntensity = base * (0.82 + 0.22 * Math.sin(t * 1.8 + p) + 0.06 * Math.sin(t * 5.3 + p))
}

// ---------------------------------------------------------------------------
// loft: hard-surface hulls from a cross-section swept along Z
// ---------------------------------------------------------------------------

interface LoftRing {
  z: number
  s: number
  y?: number
  sx?: number
}

function loftGeo(key: string, section: [number, number][], rings: LoftRing[], uvScale = 1): THREE.BufferGeometry {
  return cachedGeo(`loft|${key}`, () => {
    const n = section.length
    const per: number[] = [0]
    for (let i = 1; i <= n; i++) {
      const a = section[i - 1]
      const b = section[i % n]
      per.push(per[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]))
    }
    const pos: number[] = []
    const uv: number[] = []
    const P = (k: number, i: number): V3 => {
      const r = rings[k]
      const p = section[i % n]
      return [p[0] * (r.sx ?? r.s), p[1] * r.s + (r.y ?? 0), r.z]
    }
    const push = (p: V3, u: number, v: number) => {
      pos.push(p[0], p[1], p[2])
      uv.push(u * uvScale, v * uvScale)
    }
    for (let k = 0; k < rings.length - 1; k++) {
      for (let i = 0; i < n; i++) {
        const a = P(k, i)
        const b = P(k, i + 1)
        const c = P(k + 1, i + 1)
        const d = P(k + 1, i)
        const z0 = rings[k].z
        const z1 = rings[k + 1].z
        push(a, z0, per[i])
        push(b, z0, per[i + 1])
        push(c, z1, per[i + 1])
        push(a, z0, per[i])
        push(c, z1, per[i + 1])
        push(d, z1, per[i])
      }
    }
    const cap = (k: number, front: boolean) => {
      const r = rings[k]
      if (r.s < 1e-3) return
      const centre: V3 = [0, (r.y ?? 0) + (section.reduce((s, p) => s + p[1], 0) / n) * r.s, r.z]
      for (let i = 0; i < n; i++) {
        const a = P(k, i)
        const b = P(k, i + 1)
        if (front) {
          push(centre, centre[0], centre[1])
          push(a, a[0], a[1])
          push(b, b[0], b[1])
        } else {
          push(centre, centre[0], centre[1])
          push(b, b[0], b[1])
          push(a, a[0], a[1])
        }
      }
    }
    cap(0, false)
    cap(rings.length - 1, true)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    g.computeBoundingSphere()
    return g
  })
}

/** Riveted steel plates, tiling (one tile = 1 / uvScale units). */
function plateTex(color: string): THREE.CanvasTexture {
  const t = canvasTex(`plates|${color}`, 128, 128, (g, w, h, r) => {
    g.fillStyle = color
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.04})`
      g.fillRect((i % 2) * 64, Math.floor(i / 2) * 64, 64, 64)
    }
    g.strokeStyle = 'rgba(0,0,0,0.55)'
    g.lineWidth = 3
    g.strokeRect(1.5, 1.5, w - 3, h / 2 - 3)
    g.strokeRect(1.5, h / 2 + 1.5, w / 2 - 3, h / 2 - 3)
    g.strokeRect(w / 2 + 1.5, h / 2 + 1.5, w / 2 - 3, h / 2 - 3)
    g.fillStyle = 'rgba(255,255,255,0.35)'
    for (let x = 6; x < w; x += 10) {
      for (const y of [6, h / 2 - 6, h / 2 + 6, h - 6]) {
        g.beginPath()
        g.arc(x, y, 1.6, 0, Math.PI * 2)
        g.fill()
      }
    }
  })
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

function spinners(obj: THREE.Object3D, dt: number): void {
  const list = obj.userData.spin as THREE.Object3D[] | undefined
  if (!list) return
  for (const s of list) {
    const speed = Number(s.userData.speed) || 2
    const axis = String(s.userData.axis ?? 'y')
    if (axis === 'z') s.rotation.z += dt * speed
    else if (axis === 'x') s.rotation.x += dt * speed
    else s.rotation.y += dt * speed
  }
}

/** Propeller hub with n blades in the XY plane (spins about Z). */
function propellerBlades(n: number, len: number, wdt: number, blade: THREE.Material, hub: THREE.Material): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const b = leaf([0, 0, 0], [Math.cos(a) * len, Math.sin(a) * len, 0], wdt, wdt * 0.25, blade)
    b.rotateY(0.45)
    g.add(b)
  }
  g.add(rot(cn(0.06, 0.12, hub, 0, 0, 0, 10), Math.PI / 2, 0, 0))
  return g
}

// ---------------------------------------------------------------------------
// airship (large cargo airship, docked; footprint 3 x 5)
// ---------------------------------------------------------------------------

function envelopeTex(color: string): THREE.CanvasTexture {
  return canvasTex(`envelope|${color}`, 512, 256, (g, w, h) => {
    g.fillStyle = color
    g.fillRect(0, 0, w, h)
    const n = 16
    for (let i = 0; i < n; i++) {
      if (i % 2) {
        g.fillStyle = 'rgba(0,0,0,0.08)'
        g.fillRect((i * w) / n, 0, w / n, h)
      }
      g.fillStyle = 'rgba(60,40,30,0.35)'
      g.fillRect((i * w) / n, 0, 2, h)
    }
    g.fillStyle = 'rgba(60,40,30,0.3)'
    for (const v of [0.3, 0.7]) g.fillRect(0, v * h, w, 3)
    g.fillStyle = '#a8323e'
    g.fillRect(0, h * 0.47, w, 12)
    // guild emblem on both flanks
    for (const u of [0.25, 0.75]) {
      const x = u * w
      const y = h * 0.5
      g.fillStyle = '#f3ecdc'
      g.beginPath()
      g.arc(x, y, 30, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = '#a8323e'
      g.lineWidth = 6
      g.beginPath()
      g.arc(x, y, 22, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = '#a8323e'
      g.beginPath()
      g.moveTo(x, y - 14)
      g.lineTo(x + 12, y + 10)
      g.lineTo(x - 12, y + 10)
      g.closePath()
      g.fill()
    }
  })
}

function finShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(1.3, 0)
  s.lineTo(1.45, 1)
  s.lineTo(0.55, 1)
  s.closePath()
  return s
}

function gondolaShape(): THREE.Shape {
  // plan view, shape y = -world z (bow at +z)
  const s = new THREE.Shape()
  s.moveTo(-0.8, 2.2)
  s.lineTo(0.8, 2.2)
  s.lineTo(0.8, -1.3)
  s.quadraticCurveTo(0.6, -2.3, 0, -2.6)
  s.quadraticCurveTo(-0.6, -2.3, -0.8, -1.3)
  s.closePath()
  return s
}

const AIRSHIP_FOOT: [number, number][] = []
for (let x = -1; x <= 1; x++) for (let z = -2; z <= 2; z++) if (x || z) AIRSHIP_FOOT.push([x, z])

registerProp('airship', {
  solid: true,
  footprint: AIRSHIP_FOOT,
  light: { color: '#ffbb77', intensity: 1.6, distance: 6, y: 1.2 },
  build: (ctx) => {
    const color = tint(ctx, '#d8c49a')
    const g = new THREE.Group()
    // envelope
    const env = new THREE.Mesh(
      cachedGeo('envelope', () => new THREE.SphereGeometry(1, 28, 16).rotateX(Math.PI / 2)),
      texMat(`envelope|${color}`, envelopeTex(color)),
    )
    env.scale.set(1.75, 1.55, 4.4)
    env.position.set(0, 4.7, 0)
    env.castShadow = true
    env.receiveShadow = true
    g.add(env)
    const trim = M(PAL.brass)
    const nose = cn(0.24, 0.42, trim, 0, 0, 0, 12)
    nose.rotation.x = Math.PI / 2
    nose.position.set(0, 4.7, 4.42)
    g.add(nose)
    // tail fins
    const finM = M('#a8323e')
    const finGeoScale: V3 = [1.25, 1.15, 1]
    const finsAt: [number, V3][] = [
      [0, [0, 5.7, -3.2]],
      [Math.PI, [0, 3.7, -3.2]],
      [Math.PI / 2, [1.15, 4.7, -3.2]],
      [-Math.PI / 2, [-1.15, 4.7, -3.2]],
    ]
    for (const [roll, p] of finsAt) {
      const fin = extrude('airfin', finShape, 0.08, finM)
      fin.scale.set(finGeoScale[0], finGeoScale[1], finGeoScale[2])
      const holder = new THREE.Group()
      holder.position.set(p[0], p[1], p[2])
      holder.rotation.z = -roll
      fin.rotation.y = Math.PI / 2
      fin.position.set(0, 0, 0.6)
      holder.add(fin)
      g.add(holder)
    }
    // gondola
    const hull = new THREE.Mesh(
      cachedGeo('gondola', () => {
        const geo = new THREE.ExtrudeGeometry(gondolaShape(), { depth: 0.85, bevelEnabled: false, curveSegments: 6 })
        geo.rotateX(-Math.PI / 2)
        return geo
      }),
      M('#7a4a32'),
    )
    hull.position.y = 0.5
    hull.castShadow = true
    hull.receiveShadow = true
    g.add(hull)
    const keel = new THREE.Mesh(hull.geometry, M('#3c2a24'))
    keel.scale.set(0.9, 0.25, 0.94)
    keel.position.y = 0.32
    g.add(keel)
    const roof = new THREE.Mesh(hull.geometry, M('#5a3a2a'))
    roof.scale.set(1.06, 0.08, 1.04)
    roof.position.y = 1.35
    g.add(roof)
    const glow = glowMat(PAL.warm, 2.8)
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) g.add(bx(0.03, 0.22, 0.32, glow, s * 0.81, 0.85, -1.7 + i * 0.75))
    }
    // deck rail
    const rail = M(PAL.woodDark)
    for (const s of [-1, 1]) {
      g.add(rod([s * 0.82, 1.65, -2.2], [s * 0.82, 1.65, 1.2], 0.025, 0.025, rail, 6))
      for (let i = 0; i < 5; i++) g.add(cy(0.02, 0.02, 0.3, rail, s * 0.82, 1.38, -2.1 + i * 0.82, 6))
    }
    // rigging
    const rope = M('#4a3a30')
    for (const s of [-1, 1]) {
      for (const z of [-1.9, -0.6, 0.6, 1.6]) g.add(rod([s * 0.78, 1.4, z], [s * 0.9, 3.35, z * 1.12], 0.012, 0.012, rope, 4))
    }
    // engines with pusher propellers
    const spin: THREE.Object3D[] = []
    for (const s of [-1, 1]) {
      g.add(rod([s * 0.8, 1.05, -1.4], [s * 1.35, 1.25, -1.5], 0.05, 0.05, M(PAL.ironDark), 6))
      const pod = rod([s * 1.35, 1.25, -1.0], [s * 1.35, 1.25, -1.95], 0.2, 0.15, M(PAL.copper), 12)
      g.add(pod)
      g.add(ball(0.2, 0.2, 0.2, M(PAL.copper), s * 1.35, 1.25, -1.0, 12))
      const prop = propellerBlades(3, 0.42, 0.14, M(PAL.woodLight), M(PAL.brass))
      prop.position.set(s * 1.35, 1.25, -2.02)
      finalize(prop)
      keep(prop)
      prop.userData.axis = 'z'
      prop.userData.speed = 5 * s
      g.add(prop)
      spin.push(prop)
    }
    // landing legs and mooring ropes
    for (const s of [-1, 1]) {
      for (const z of [-1.6, 1.0]) {
        g.add(rod([s * 0.6, 0.5, z], [s * 0.85, 0.02, z], 0.035, 0.035, M(PAL.ironDark), 6))
        g.add(cy(0.12, 0.12, 0.03, M(PAL.ironDark), s * 0.85, 0, z, 10))
      }
    }
    g.add(rod([0, 1.0, 2.5], [0.4, 0.0, 3.4], 0.015, 0.015, M(PAL.rope), 4))
    g.add(cy(0.04, 0.04, 0.25, M(PAL.woodDark), 0.4, 0, 3.4, 6))
    g.userData.spin = spin
    return finalize(g)
  },
  animate: (obj, _t, dt) => spinners(obj, dt),
})

// ---------------------------------------------------------------------------
// itaka (small, matte dark riveted steel, 4 swivelling rotors on booms,
// armoured gondola and a big bow cannon; docked on skids; ~7 x 3 tiles)
// ---------------------------------------------------------------------------

const ITAKA_FOOT: [number, number][] = []
for (let x = -1; x <= 1; x++) for (let z = -3; z <= 3; z++) if (x || z) ITAKA_FOOT.push([x, z])

const HULL_SECTION: [number, number][] = [
  [-0.62, 0.5],
  [-0.82, 0.15],
  [-0.74, -0.25],
  [-0.36, -0.55],
  [0.36, -0.55],
  [0.74, -0.25],
  [0.82, 0.15],
  [0.62, 0.5],
]

registerProp('itaka', {
  solid: true,
  footprint: ITAKA_FOOT,
  light: { color: '#ffbb77', intensity: 1.5, distance: 5, y: 2.1 },
  build: () => {
    const g = new THREE.Group()
    const steel = '#3e434c'
    const hullMat = texMat(`plates|${steel}`, plateTex(steel))
    const dark = M('#262a31')
    const mid = M('#4c525d')
    const brass = M('#b08f52')
    const accent = M('#8a2f2c')
    // hull: stern taper -> body -> bow taper
    const hull = new THREE.Mesh(
      loftGeo('itaka-hull', HULL_SECTION, [
        { z: -3.15, s: 0.62, y: 0.12 },
        { z: -2.6, s: 1 },
        { z: 1.5, s: 1 },
        { z: 2.75, s: 0.48, y: 0.18, sx: 0.4 },
      ], 0.8),
      hullMat,
    )
    hull.position.y = 1.15
    hull.castShadow = true
    hull.receiveShadow = true
    g.add(hull)
    // armour belt & accent stripe
    for (const s of [-1, 1]) {
      g.add(bx(0.06, 0.24, 4.2, mid, s * 0.83, 1.18, -0.55))
      g.add(bx(0.07, 0.06, 4.2, accent, s * 0.84, 1.44, -0.55))
      for (let i = 0; i < 4; i++) {
        const port = cy(0.075, 0.075, 0.04, dark, 0, 0, 0, 12)
        port.rotation.z = Math.PI / 2
        port.position.set(s * 0.865, 1.3, -1.9 + i * 0.9)
        g.add(port)
      }
    }
    // superstructure / bridge with amber slit windows
    g.add(bx(1.0, 0.5, 1.45, M(steel), 0, 1.65, 0.15))
    g.add(bx(1.08, 0.08, 1.55, dark, 0, 2.15, 0.15))
    const front = bx(0.98, 0.42, 0.06, mid, 0, 0, 0)
    front.position.set(0, 1.88, 0.92)
    front.rotation.x = -0.45
    g.add(front)
    const amber = glowMat(PAL.warm, 3)
    for (let i = 0; i < 3; i++) {
      const w = bx(0.22, 0.07, 0.02, amber, 0, 0, 0)
      w.position.set(-0.28 + i * 0.28, 1.95, 0.96)
      w.rotation.x = -0.45
      g.add(w)
    }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) g.add(bx(0.02, 0.07, 0.22, amber, s * 0.505, 1.9, -0.3 + i * 0.33))
    // mast, antenna, searchlight
    g.add(cy(0.03, 0.04, 0.7, dark, 0.25, 2.23, -0.25, 6))
    g.add(ball(0.05, 0.05, 0.05, glowMat('#ff5a3a', 3), 0.25, 2.95, -0.25, 6))
    g.add(cy(0.03, 0.03, 0.08, dark, -0.25, 2.23, 0.38, 6))
    g.add(rod([-0.25, 2.36, 0.28], [-0.25, 2.36, 0.46], 0.09, 0.11, brass, 12))
    const lens = cy(0.09, 0.09, 0.02, glowMat('#fff2c0', 3), 0, 0, 0, 12)
    lens.rotation.x = Math.PI / 2
    lens.position.set(-0.25, 2.36, 0.47)
    g.add(lens)
    // exhaust stacks with Spira glow
    const spira = glowMat(PAL.spira, 3.2)
    for (const s of [-1, 1]) {
      g.add(cy(0.11, 0.13, 0.55, dark, s * 0.3, 1.6, -2.3, 12))
      g.add(ring(0.11, 0.025, spira, s * 0.3, 2.15, -2.3, 5, 16))
      g.add(cy(0.09, 0.09, 0.02, spira, s * 0.3, 2.14, -2.3, 12))
    }
    g.add(bx(0.5, 0.18, 0.08, spira, 0, 1.2, -3.1))
    // skids
    for (const s of [-1, 1]) {
      g.add(bx(0.09, 0.08, 5.0, dark, s * 0.58, 0, -0.3))
      for (const z of [-2.2, -0.4, 1.4]) g.add(rod([s * 0.58, 0.07, z], [s * 0.42, 0.68, z], 0.04, 0.04, mid, 6))
    }
    // four swivelling rotors on booms
    const spin: THREE.Object3D[] = []
    for (const s of [-1, 1]) {
      for (const z of [1.15, -1.85]) {
        const root: V3 = [s * 0.78, 1.38, z]
        const tip: V3 = [s * 1.22, 1.85, z]
        g.add(rod(root, tip, 0.07, 0.055, mid, 8))
        g.add(ball(0.09, 0.09, 0.09, dark, root[0], root[1], root[2], 8))
        g.add(cy(0.1, 0.12, 0.34, dark, tip[0], tip[1] - 0.12, tip[2], 12))
        g.add(ring(0.46, 0.045, mid, tip[0], tip[1] + 0.22, tip[2], 6, 28))
        g.add(ring(0.12, 0.03, spira, tip[0], tip[1] + 0.21, tip[2], 5, 16))
        for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) g.add(rod([tip[0], tip[1] + 0.2, tip[2]], [tip[0] + Math.cos(a) * 0.45, tip[1] + 0.22, tip[2] + Math.sin(a) * 0.45], 0.012, 0.012, dark, 4))
        const rotor = new THREE.Group()
        rotor.position.set(tip[0], tip[1] + 0.27, tip[2])
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2
          const b = leaf([0, 0, 0], [Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42], 0.11, 0.025, M('#5a606b'))
          b.rotateY(0.3)
          rotor.add(b)
        }
        rotor.add(cy(0.06, 0.06, 0.06, brass, 0, -0.03, 0, 10))
        finalize(rotor)
        keep(rotor)
        rotor.userData.speed = 1.6 + (z > 0 ? 0.25 : 0)
        rotor.userData.axis = 'y'
        g.add(rotor)
        spin.push(rotor)
      }
    }
    // bow cannon "Felix"
    g.add(cy(0.3, 0.34, 0.14, dark, 0, 1.62, 1.95, 16))
    g.add(bx(0.42, 0.3, 0.5, M(steel), 0, 1.74, 1.9))
    g.add(rod([0, 1.9, 2.1], [0, 1.96, 3.5], 0.12, 0.095, mid, 14))
    g.add(rod([0, 1.958, 3.38], [0, 1.97, 3.62], 0.13, 0.13, dark, 14))
    const by = (z: number) => 1.9 + (z - 2.1) * (0.06 / 1.4)
    for (const z of [2.45, 2.9]) g.add(rod([0, by(z), z], [0, by(z + 0.08), z + 0.08], 0.125, 0.125, brass, 14))
    g.userData.spin = spin
    return finalize(g)
  },
  animate: (obj, _t, dt) => spinners(obj, dt),
})

// ---------------------------------------------------------------------------
// cannon (the big bow cannon "Felix" on a turntable)
// ---------------------------------------------------------------------------

registerProp('cannon', {
  solid: true,
  build: () =>
    cachedBuild('cannon', () => {
      const g = new THREE.Group()
      const steel = M('#4a505a')
      const dark = M('#2c3038')
      const brass = M(PAL.brass)
      g.add(cy(0.5, 0.54, 0.16, dark, 0, 0, 0, 24))
      g.add(cy(0.44, 0.46, 0.1, steel, 0, 0.16, 0, 24))
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        g.add(ball(0.025, 0.02, 0.025, brass, Math.cos(a) * 0.5, 0.16, Math.sin(a) * 0.5, 6))
      }
      for (const s of [-1, 1]) {
        g.add(bx(0.1, 0.52, 0.72, steel, s * 0.25, 0.24, -0.05))
        const tr = cy(0.09, 0.09, 0.12, brass, 0, 0, 0, 12)
        tr.rotation.z = Math.PI / 2
        tr.position.set(s * 0.31, 0.64, 0)
        g.add(tr)
      }
      const barrel = new THREE.Group()
      barrel.position.set(0, 0.64, 0)
      barrel.rotation.x = -0.14
      barrel.add(bx(0.44, 0.42, 0.52, steel, 0, -0.21, -0.55))
      barrel.add(bx(0.2, 0.07, 0.01, brass, 0, 0.0, -0.29))
      barrel.add(rod([0, 0, -0.3], [0, 0, 1.75], 0.19, 0.14, steel, 18))
      for (const z of [0.2, 0.75, 1.25]) barrel.add(rod([0, 0, z], [0, 0, z + 0.1], 0.19 - z * 0.02, 0.19 - z * 0.02, dark, 18))
      barrel.add(rod([0, 0, 1.68], [0, 0, 1.98], 0.2, 0.2, dark, 18))
      for (const s of [-1, 1]) barrel.add(bx(0.03, 0.08, 0.16, M('#111318'), s * 0.2, -0.04, 1.75))
      for (const s of [-1, 1]) barrel.add(rod([s * 0.1, 0.2, -0.25], [s * 0.1, 0.17, 0.85], 0.05, 0.05, dark, 10))
      g.add(barrel)
      return g
    }),
})

// ---------------------------------------------------------------------------
// boiler (Spira boiler: six riveted tanks with violet glowing seams)
// ---------------------------------------------------------------------------

registerProp('boiler', {
  solid: true,
  light: { color: '#a070ff', intensity: 2.2, distance: 5.5, y: 1.0 },
  build: (ctx) => {
    const g = new THREE.Group()
    const steel = M('#4a505a')
    const dark = M('#2c3038')
    const brass = M(PAL.brass)
    const seam = uniqueGlow(PAL.spira, 3.2)
    g.add(bx(1.08, 0.12, 0.78, dark, 0, 0, 0))
    const tanks: [number, number, number][] = [
      [-0.33, -0.17, 1.72],
      [0, -0.17, 1.92],
      [0.33, -0.17, 1.62],
      [-0.33, 0.18, 1.22],
      [0, 0.18, 1.36],
      [0.33, 0.18, 1.16],
    ]
    for (const [x, z, h] of tanks) {
      const r = 0.155
      g.add(cy(r, r, h - 0.12, steel, x, 0.12, z, 16))
      g.add(dome(r, r * 0.7, r, steel, x, h, z, 16))
      g.add(cy(r + 0.012, r + 0.012, 0.05, dark, x, 0.16, z, 16))
      for (let k = 1; k <= 2; k++) g.add(cy(r + 0.006, r + 0.006, 0.025, seam, x, 0.12 + ((h - 0.12) * k) / 3, z, 16))
      g.add(cy(0.03, 0.03, 0.12, brass, x, h + r * 0.6, z, 8))
    }
    for (const x of [-0.33, 0.33]) g.add(bx(0.03, 0.6, 0.02, seam, x, 0.35, 0.335))
    g.add(rod([-0.5, 1.98, -0.17], [0.5, 1.98, -0.17], 0.05, 0.05, M(PAL.copper), 10))
    for (const [x, , h] of tanks.slice(0, 3)) g.add(rod([x, h + 0.14, -0.17], [x, 1.98, -0.17], 0.03, 0.03, M(PAL.copper), 8))
    for (const [x, z, h] of tanks.slice(3)) g.add(rod([x, h + 0.14, z], [x, 1.5, -0.05], 0.03, 0.03, M(PAL.copper), 8))
    for (const x of [-0.17, 0.17]) {
      const face = cy(0.08, 0.08, 0.03, M(PAL.cream), 0, 0, 0, 16)
      face.rotation.x = Math.PI / 2
      face.position.set(x, 0.95, 0.35)
      g.add(face)
      g.add(torus(0.08, 0.012, brass, x, 0.95, 0.367, 5, 16))
      g.add(rot(bx(0.008, 0.06, 0.005, M(PAL.ink), x, 0.95, 0.37), 0, 0, 0.6))
    }
    g.add(torus(0.07, 0.014, M('#b03028'), 0.5, 0.7, 0.2, 5, 14).rotateY(Math.PI / 2))
    g.userData.seam = seam
    g.userData.phase = ctx.rand() * 10
    return finalize(g)
  },
  animate: (obj, t) => {
    const m = obj.userData.seam as THREE.MeshBasicMaterial | undefined
    if (!m) return
    const p = Number(obj.userData.phase) || 0
    m.color.copy(m.userData.base as THREE.Color).multiplyScalar(0.7 + 0.3 * Math.sin(t * 2.4 + p) + 0.1 * Math.sin(t * 7.1 + p))
  },
})

// ---------------------------------------------------------------------------
// crystal, crystal_cluster (violet Spira crystals, pulsing)
// ---------------------------------------------------------------------------

registerProp('crystal', {
  solid: true,
  light: (ctx) => ({ color: tint(ctx, '#a070ff'), intensity: 2.2, distance: 5, y: 0.6 }),
  build: (ctx) => {
    const color = tint(ctx, PAL.spira)
    const r = seeded('crystal' + variant(ctx, 4))
    const g = new THREE.Group()
    const m = crystalMat(color)
    g.add(rock(1, 0.28, 0.14, 0.26, F(PAL.stoneDark), 0, -0.02, 0))
    g.add(crystal(m, 0.17, 1.0, [0, 0.05, 0], (r() - 0.5) * 0.25, (r() - 0.5) * 0.25, r() * 6))
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + r()
      g.add(crystal(m, 0.06 + r() * 0.03, 0.3 + r() * 0.2, [Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14], Math.sin(a) * 0.6, -Math.cos(a) * 0.6, r() * 6))
    }
    g.userData.crystalMat = m
    g.userData.phase = ctx.rand() * 10
    return finalize(g)
  },
  animate: (obj, t) => pulseCrystals(obj, t),
})

registerProp('crystal_cluster', {
  solid: true,
  light: (ctx) => ({ color: tint(ctx, '#a070ff'), intensity: 3, distance: 6.5, y: 0.7 }),
  build: (ctx) => {
    const color = tint(ctx, PAL.spira)
    const r = seeded('cluster' + variant(ctx, 4))
    const g = new THREE.Group()
    const m = crystalMat(color)
    const stone = F(PAL.stoneDark)
    g.add(rock(2, 0.42, 0.18, 0.38, stone, 0, -0.04, 0))
    g.add(rock(4, 0.2, 0.12, 0.18, stone, 0.32, -0.03, 0.25))
    g.add(crystal(m, 0.2, 1.25, [0, 0.06, 0], 0.05, 0.08, r() * 6))
    const n = 7
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.5
      const d = 0.12 + r() * 0.16
      const h = 0.35 + r() * 0.55
      const tilt = 0.35 + r() * 0.4
      g.add(crystal(m, 0.07 + h * 0.08, h, [Math.cos(a) * d, 0.03, Math.sin(a) * d], Math.sin(a) * tilt, -Math.cos(a) * tilt, r() * 6))
    }
    g.userData.crystalMat = m
    g.userData.phase = ctx.rand() * 10
    return finalize(g)
  },
  animate: (obj, t) => pulseCrystals(obj, t),
})

// ---------------------------------------------------------------------------
// approacher ("približovadlo": boxy riveted 8-wheel ground vehicle, 1 x 2)
// ---------------------------------------------------------------------------

registerProp('approacher', {
  solid: true,
  footprint: [[0, 1]],
  build: (ctx) => {
    const color = tint(ctx, '#6a6a52')
    return cachedBuild(`approacher|${color}`, () => {
      const g = new THREE.Group()
      const body = texMat(`plates|${color}`, plateTex(color))
      const dark = M(shade(color, 0.55))
      const tyre = M('#1e1e22')
      const hub = M('#8a8f98')
      const zc = 0.5
      g.add(bx(0.86, 0.38, 1.9, body, 0, 0.3, zc))
      g.add(bx(0.8, 0.44, 1.15, body, 0, 0.68, zc - 0.32))
      const slope = bx(0.8, 0.06, 0.62, M(shade(color, 1.1)), 0, 0, 0)
      slope.position.set(0, 0.86, zc + 0.5)
      slope.rotation.x = 0.62
      g.add(slope)
      const amber = glowMat(PAL.warm, 2.8)
      for (const x of [-0.2, 0.2]) {
        const slit = bx(0.24, 0.05, 0.02, amber, 0, 0, 0)
        slit.position.set(x, 0.9, zc + 0.53)
        slit.rotation.x = 0.62
        g.add(slit)
      }
      for (const s of [-1, 1]) {
        g.add(bx(0.02, 0.06, 0.6, amber, s * 0.405, 0.9, zc - 0.35))
        g.add(bx(0.16, 0.05, 1.95, dark, s * 0.47, 0.5, zc))
        g.add(bx(0.06, 0.22, 0.3, dark, s * 0.46, 0.68, zc - 0.65))
        for (let i = 0; i < 4; i++) {
          const z = zc - 0.72 + i * 0.48
          const w = cy(0.18, 0.18, 0.13, tyre, 0, 0, 0, 16)
          w.rotation.z = Math.PI / 2
          w.position.set(s * 0.47, 0.18, z)
          g.add(w)
          const h = cy(0.08, 0.08, 0.14, hub, 0, 0, 0, 10)
          h.rotation.z = Math.PI / 2
          h.position.set(s * 0.475, 0.18, z)
          g.add(h)
        }
      }
      g.add(cy(0.17, 0.17, 0.05, dark, 0.1, 1.12, zc - 0.4, 14))
      g.add(bx(0.2, 0.03, 0.04, M(PAL.brass), 0.1, 1.17, zc - 0.4))
      for (const x of [-0.3, 0.3]) {
        const lamp = cy(0.06, 0.07, 0.06, dark, 0, 0, 0, 10)
        lamp.rotation.x = Math.PI / 2
        lamp.position.set(x, 0.58, zc + 0.97)
        g.add(lamp)
        const lens = cy(0.05, 0.05, 0.01, glowMat('#fff2c0', 3), 0, 0, 0, 10)
        lens.rotation.x = Math.PI / 2
        lens.position.set(x, 0.58, zc + 1.005)
        g.add(lens)
      }
      g.add(cy(0.045, 0.05, 0.5, dark, 0.33, 0.68, zc - 0.88, 8))
      g.add(cy(0.065, 0.045, 0.06, dark, 0.33, 1.18, zc - 0.88, 8))
      const spare = cy(0.17, 0.17, 0.1, tyre, 0, 0, 0, 16)
      spare.rotation.x = Math.PI / 2
      spare.position.set(-0.15, 0.62, zc - 0.97)
      g.add(spare)
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// pipe, gear, rope_coil, anchor, mast, propeller
// ---------------------------------------------------------------------------

registerProp('pipe', {
  solid: true,
  build: (ctx) => {
    const vertical = bool(ctx, 'vertical')
    const color = tint(ctx, '#6a727e')
    const r = num(ctx, 'r', 0.12)
    return cachedBuild(`pipe|${vertical}|${color}|${r}`, () => {
      const g = new THREE.Group()
      const m = M(color)
      const flange = M(shade(color, 0.7))
      const rust = M(PAL.rust)
      if (vertical) {
        const z = -0.32
        g.add(cy(r, r, 2.4, m, 0, 0, z, 14))
        for (const y of [0.05, 2.3]) g.add(cy(r + 0.045, r + 0.045, 0.06, flange, 0, y, z, 14))
        for (const y of [0.8, 1.7]) g.add(bx(r * 2 + 0.08, 0.06, 0.18, M(PAL.ironDark), 0, y, z - 0.08))
        g.add(cy(r + 0.004, r + 0.004, 0.3, rust, 0, 1.1, z, 14))
      } else {
        const y = 0.36
        g.add(rod([-0.5, y, 0], [0.5, y, 0], r, r, m, 14))
        for (const x of [-0.47, 0.47]) g.add(rod([x - 0.03, y, 0], [x + 0.03, y, 0], r + 0.045, r + 0.045, flange, 14))
        g.add(bx(0.1, y - r + 0.02, 0.32, M(PAL.ironDark), 0, 0))
        g.add(bx(0.16, 0.05, 0.36, M(PAL.ironDark), 0, 0))
        g.add(rod([0.14, y, 0], [0.36, y, 0], r + 0.004, r + 0.004, rust, 14))
      }
      return g
    })
  },
})

function gearShape(teeth: number, R: number, r0: number): THREE.Shape {
  const s = new THREE.Shape()
  const steps = teeth * 4
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const rr = i % 4 === 1 || i % 4 === 2 ? R : r0
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  s.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, R * 0.14, 0, Math.PI * 2, true)
  s.holes.push(hole)
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    const p = new THREE.Path()
    p.absarc(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, R * 0.17, 0, Math.PI * 2, true)
    s.holes.push(p)
  }
  return s
}

registerProp('gear', {
  solid: false,
  build: (ctx) => {
    const standing = bool(ctx, 'standing')
    const spinning = bool(ctx, 'spin', standing)
    const color = tint(ctx, PAL.brass)
    const g = new THREE.Group()
    const gear = extrude('gear12', () => gearShape(12, 0.45, 0.38), 0.08, M(color), 4)
    if (standing) {
      const dark = M(PAL.ironDark)
      g.add(bx(0.12, 0.62, 0.12, dark, 0, 0, -0.12))
      g.add(bx(0.4, 0.06, 0.3, dark, 0, 0, -0.05))
      g.add(rod([0, 0.58, -0.14], [0, 0.58, 0.08], 0.04, 0.04, M(PAL.iron), 8))
      const holder = new THREE.Group()
      holder.position.set(0, 0.58, 0.0)
      holder.add(gear)
      finalize(holder)
      if (spinning) {
        keep(holder)
        holder.userData.axis = 'z'
        holder.userData.speed = 0.6
        g.userData.spin = [holder]
      }
      g.add(holder)
    } else {
      gear.rotation.set(-Math.PI / 2 + 0.12, 0, 0.4)
      gear.position.y = 0.09
      g.add(gear)
      g.add(rock(3, 0.12, 0.08, 0.1, F(PAL.stoneDark), 0.3, -0.01, 0.2))
    }
    return finalize(g)
  },
  animate: (obj, _t, dt) => spinners(obj, dt),
})

class Spiral extends THREE.Curve<THREE.Vector3> {
  private readonly turns: number
  private readonly r0: number
  private readonly r1: number

  constructor(turns: number, r0: number, r1: number) {
    super()
    this.turns = turns
    this.r0 = r0
    this.r1 = r1
  }

  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = t * this.turns * Math.PI * 2
    const r = this.r0 + (this.r1 - this.r0) * t
    const lift = t > 0.88 ? (t - 0.88) * 0.6 : 0
    return target.set(Math.cos(a) * r, 0.035 + lift, Math.sin(a) * r)
  }
}

registerProp('rope_coil', {
  solid: false,
  build: (ctx) =>
    wrap(
      cachedBuild('rope_coil', () => {
        const g = new THREE.Group()
        const rope = M(tint(ctx, PAL.rope))
        const geo = cachedGeo('coil', () => new THREE.TubeGeometry(new Spiral(3.2, 0.08, 0.27), 120, 0.035, 6, false))
        const coil = new THREE.Mesh(geo, rope)
        coil.castShadow = true
        coil.receiveShadow = true
        g.add(coil)
        const top = new THREE.Mesh(geo, rope)
        top.scale.set(0.82, 1, 0.82)
        top.position.y = 0.06
        top.rotation.y = 1.3
        g.add(top)
        g.add(chain([[0.27, 0.04, 0], [0.38, 0.03, 0.14], [0.5, 0.03, 0.12]], 0.035, 0.035, rope, 6))
        return g
      }),
      ctx.rand() * Math.PI * 2,
    ),
})

registerProp('anchor', {
  solid: true,
  build: () =>
    cachedBuild('anchor', () => {
      const g = new THREE.Group()
      const iron = M('#3a3e46')
      g.add(cy(0.055, 0.065, 1.45, iron, 0, 0.2, 0, 10))
      g.add(torus(0.12, 0.028, iron, 0, 1.75, 0, 6, 18))
      g.add(rod([-0.38, 1.48, 0], [0.38, 1.48, 0], 0.04, 0.04, iron, 8))
      for (const s of [-1, 1]) g.add(ball(0.055, 0.055, 0.055, iron, s * 0.4, 1.48, 0, 8))
      const arms = torus(0.44, 0.055, iron, 0, 0.64, 0, 8, 20, Math.PI)
      arms.rotation.z = Math.PI
      g.add(arms)
      for (const s of [-1, 1]) {
        const fluke = cn(0.11, 0.28, iron, 0, 0, 0, 4)
        fluke.position.set(s * 0.46, 0.72, 0)
        fluke.rotation.z = -s * 0.5
        fluke.scale.z = 0.35
        g.add(fluke)
      }
      g.add(ball(0.28, 0.08, 0.22, M('#6b5038'), 0, 0.02, 0, 12))
      g.add(ring(0.12, 0.03, M(PAL.rope), 0, 1.6, 0, 5, 14))
      return g
    }),
})

registerProp('mast', {
  solid: true,
  build: (ctx) => {
    const flag = tint(ctx, PAL.red)
    return cachedBuild(`mast|${flag}`, () => {
      const g = new THREE.Group()
      const wood = M(PAL.wood)
      const dark = M(PAL.woodDark)
      const sail = M(PAL.cream)
      const rope = M('#4a3a30')
      g.add(bx(0.4, 0.14, 0.4, dark))
      g.add(cy(0.07, 0.11, 4.0, wood, 0, 0.1, 0, 12))
      g.add(rod([-1.0, 2.6, 0.06], [1.0, 2.6, 0.06], 0.045, 0.045, dark, 8))
      g.add(rod([-0.95, 2.48, 0.1], [0.95, 2.48, 0.1], 0.13, 0.13, sail, 12))
      g.add(rod([-0.6, 3.65, 0.06], [0.6, 3.65, 0.06], 0.035, 0.035, dark, 8))
      g.add(rod([-0.55, 3.56, 0.09], [0.55, 3.56, 0.09], 0.09, 0.09, sail, 12))
      g.add(cy(0.28, 0.24, 0.24, wood, 0, 3.08, 0, 14))
      g.add(cy(0.08, 0.08, 0.04, dark, 0, 4.1, 0, 10))
      for (const s of [-1, 1]) {
        g.add(rod([s * 1.0, 2.6, 0.06], [s * 0.45, 0.12, 0.15], 0.01, 0.01, rope, 4))
        g.add(rod([s * 0.28, 3.1, 0], [s * 0.6, 0.12, -0.1], 0.01, 0.01, rope, 4))
      }
      const flagM = M(flag, { side: THREE.DoubleSide })
      const f = new THREE.Mesh(cachedGeo('pennant', () => {
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.55, 0.1, 0, 0, 0.22, 0], 3))
        geo.computeVertexNormals()
        return geo
      }), flagM)
      f.position.set(0.03, 3.92, 0)
      g.add(f)
      return g
    })
  },
})

registerProp('propeller', {
  solid: true,
  build: (ctx) => {
    const speed = num(ctx, 'speed', 6)
    const g = new THREE.Group()
    const dark = M(PAL.ironDark)
    g.add(cy(0.22, 0.26, 0.08, dark, 0, 0, 0, 16))
    g.add(cy(0.05, 0.06, 0.95, M(PAL.iron), 0, 0.08, 0, 10))
    g.add(rod([0, 1.08, -0.35], [0, 1.08, 0.18], 0.16, 0.13, M(PAL.copper), 14))
    g.add(ball(0.16, 0.16, 0.16, M(PAL.copper), 0, 1.08, -0.35, 12))
    g.add(ring(0.165, 0.02, M(PAL.brass), 0, 1.08, -0.1, 5, 16).rotateX(Math.PI / 2))
    const prop = propellerBlades(4, 0.5, 0.16, M(PAL.woodLight), M(PAL.brass))
    prop.position.set(0, 1.08, 0.24)
    finalize(prop)
    keep(prop)
    prop.userData.axis = 'z'
    prop.userData.speed = speed
    g.add(prop)
    g.userData.spin = [prop]
    return finalize(g)
  },
  animate: (obj, _t, dt) => spinners(obj, dt),
})

// ---------------------------------------------------------------------------
// coil_gun (lean rifle with blue coils on a little stand)
// ---------------------------------------------------------------------------

registerProp('coil_gun', {
  solid: false,
  build: () =>
    cachedBuild('coil_gun', () => {
      const g = new THREE.Group()
      const wood = M(PAL.wood)
      const steel = M('#5a616c')
      const dark = M('#24272d')
      const blue = glowMat(PAL.tech, 3)
      g.add(bx(0.9, 0.04, 0.22, M(PAL.woodDark), 0.05, 0))
      for (const x of [-0.25, 0.32]) {
        g.add(bx(0.04, 0.28, 0.04, M(PAL.woodDark), x, 0.04))
        g.add(rot(bx(0.03, 0.08, 0.03, M(PAL.woodDark), x - 0.03, 0.3), 0, 0, 0.5))
        g.add(rot(bx(0.03, 0.08, 0.03, M(PAL.woodDark), x + 0.03, 0.3), 0, 0, -0.5))
      }
      const y = 0.34
      g.add(rod([-0.08, y, 0], [0.62, y, 0], 0.018, 0.016, steel, 8))
      g.add(bx(0.32, 0.085, 0.055, dark, -0.17, y - 0.045))
      const stock = bx(0.36, 0.08, 0.045, wood, -0.48, y - 0.07)
      stock.rotation.z = 0.12
      g.add(stock)
      g.add(rot(bx(0.035, 0.11, 0.035, wood, -0.22, y - 0.14), 0, 0, -0.3))
      for (let i = 0; i < 5; i++) g.add(rot(torus(0.034, 0.011, blue, 0.06 + i * 0.1, y, 0, 6, 14), 0, Math.PI / 2, 0))
      g.add(rod([-0.27, y + 0.065, 0], [-0.06, y + 0.065, 0], 0.022, 0.022, dark, 10))
      g.add(rod([-0.26, y - 0.1, 0], [-0.12, y - 0.1, 0], 0.02, 0.02, blue, 10))
      return g
    }),
})

// ---------------------------------------------------------------------------
// metaru_wall (segment of the giant curved metal hull of the Metaru)
// ---------------------------------------------------------------------------

registerProp('metaru_wall', {
  solid: true,
  build: (ctx) => {
    const h = num(ctx, 'h', 3.5)
    const vines = bool(ctx, 'vines', true)
    const glow = bool(ctx, 'glow', true)
    const v = variant(ctx, 3)
    return cachedBuild(`metaru|${h}|${vines}|${glow}|${v}`, () => {
      const r = seeded('metaru' + v)
      const g = new THREE.Group()
      const plates = [M('#4a525c'), M('#56606b')]
      const seam = M('#262b31')
      const rust = M('#7a4a30')
      const n = Math.max(3, Math.round(h / 0.5))
      const dphi = 0.62 / n
      let y = 0
      let z = 0.1
      const seamPts: V3[] = []
      for (let i = 0; i < n; i++) {
        const phi = i * dphi
        const p = bx(1.0, 0.5, 0.16, plates[i % 2], 0, 0, 0)
        p.position.set(0, y + Math.cos(phi) * 0.25, z - Math.sin(phi) * 0.25)
        p.rotation.x = -phi
        g.add(p)
        const sm = bx(1.0, 0.03, 0.18, seam, 0, 0, 0)
        sm.position.set(0, y, z)
        sm.rotation.x = -phi
        g.add(sm)
        seamPts.push([0, y, z])
        y += Math.cos(phi) * 0.5
        z -= Math.sin(phi) * 0.5
      }
      // ribs on the inner side
      for (const x of [-0.42, 0.42]) {
        let yy = 0
        let zz = 0.1
        for (let i = 0; i < n; i++) {
          const phi = i * dphi
          const rb = bx(0.08, 0.5, 0.12, seam, 0, 0, 0)
          rb.position.set(x, yy + Math.cos(phi) * 0.25, zz - 0.13 - Math.sin(phi) * 0.25)
          rb.rotation.x = -phi
          g.add(rb)
          yy += Math.cos(phi) * 0.5
          zz -= Math.sin(phi) * 0.5
        }
      }
      if (glow) {
        const s = seamPts[Math.min(2, seamPts.length - 1)]
        const strip = bx(1.0, 0.04, 0.03, glowMat(PAL.tech, 3), 0, 0, 0)
        strip.position.set(0, s[1], s[2] + 0.09)
        strip.rotation.x = -2 * dphi
        g.add(strip)
      }
      for (let i = 0; i < 3; i++) {
        const x = -0.35 + r() * 0.7
        g.add(bx(0.04 + r() * 0.05, 0.4 + r() * 0.5, 0.02, rust, x, 0.15 + r() * 0.3, 0.19))
      }
      g.add(bx(1.04, 0.14, 0.36, M('#3a3f46'), 0, 0, 0.05))
      if (vines) {
        const vine = M('#3f7a34')
        const leafM = [M(PAL.leaf), M(PAL.leafDark)]
        for (let k = 0; k < 2; k++) {
          const x = -0.3 + k * 0.55 + (r() - 0.5) * 0.1
          const top = seamPts[Math.min(seamPts.length - 1, 3 + k)]
          const pts: V3[] = [[x, top[1], top[2] + 0.12], [x + 0.05, top[1] * 0.6, 0.24], [x - 0.03, top[1] * 0.3, 0.26], [x, 0.1, 0.22]]
          g.add(chain(pts, 0.025, 0.02, vine, 5, false))
          for (let i = 0; i < pts.length; i++) g.add(leaf(pts[i], [pts[i][0] + 0.12, pts[i][1] - 0.06, pts[i][2] + 0.08], 0.12, 0.025, leafM[i % 2]))
        }
        g.add(ball(0.3, 0.1, 0.18, M(PAL.moss), -0.25, 0.14, 0.24, 10))
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// hologram (projected planet with rings of light, animated)
// ---------------------------------------------------------------------------

function planetTex(): THREE.CanvasTexture {
  return canvasTex('holo-planet', 256, 128, (g, w, h, r) => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = 'rgba(120,220,255,0.18)'
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(160,240,255,0.95)'
    for (let c = 0; c < 7; c++) {
      const cx = r() * w
      const cyy = h * 0.2 + r() * h * 0.6
      for (let i = 0; i < 9; i++) {
        g.beginPath()
        g.ellipse(cx + (r() - 0.5) * 40, cyy + (r() - 0.5) * 22, 6 + r() * 16, 4 + r() * 9, r() * 3, 0, Math.PI * 2)
        g.fill()
      }
    }
    g.strokeStyle = 'rgba(200,250,255,0.6)'
    g.lineWidth = 1
    for (let i = 1; i < 6; i++) {
      g.beginPath()
      g.moveTo(0, (i * h) / 6)
      g.lineTo(w, (i * h) / 6)
      g.stroke()
    }
    for (let i = 0; i < 12; i++) {
      g.beginPath()
      g.moveTo((i * w) / 12, 0)
      g.lineTo((i * w) / 12, h)
      g.stroke()
    }
  })
}

registerProp('hologram', {
  solid: true,
  light: { color: '#6ab8ff', intensity: 2.2, distance: 6, y: 1.6 },
  build: (ctx) => {
    const color = tint(ctx, '#7fd8ff')
    const g = new THREE.Group()
    const dark = M('#2e333c')
    const mid = M('#4a525e')
    g.add(cy(0.36, 0.42, 0.12, dark, 0, 0, 0, 20))
    g.add(cy(0.24, 0.3, 0.52, mid, 0, 0.12, 0, 16))
    g.add(cy(0.3, 0.26, 0.08, dark, 0, 0.64, 0, 20))
    g.add(ring(0.24, 0.025, glowMat(color, 3), 0, 0.72, 0, 5, 24))
    g.add(cy(0.12, 0.12, 0.02, glowMat('#ffffff', 3), 0, 0.71, 0, 16))
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      g.add(bx(0.03, 0.3, 0.02, glowMat(color, 2.4), Math.cos(a) * 0.255, 0.22, Math.sin(a) * 0.255).rotateY(-a))
    }
    const beam = new THREE.Mesh(cachedGeo('holobeam', () => new THREE.CylinderGeometry(0.5, 0.1, 1, 20, 1, true)), additive(color, 1.2, 0.16))
    beam.scale.set(1, 0.72, 1)
    beam.position.set(0, 1.08, 0)
    fx(beam)
    g.add(beam)
    const holo = new THREE.Group()
    holo.position.set(0, 1.78, 0)
    const planet = new THREE.Mesh(cachedGeo('holosphere', () => new THREE.SphereGeometry(0.42, 28, 18)), additive(color, 1.5, 0.85, planetTex(), true))
    holo.add(planet)
    const shell = new THREE.Mesh(cachedGeo('holoshell', () => new THREE.IcosahedronGeometry(0.47, 1)), cachedMat(`holowire|${color}`, () => {
      const m = additive(color, 1.6, 0.35, null, true)
      m.wireframe = true
      return m
    }))
    holo.add(shell)
    const rings: THREE.Object3D[] = []
    for (const [R, tilt] of [[0.66, 1.25], [0.8, 1.9]] as const) {
      const rg = new THREE.Group()
      rg.rotation.x = tilt
      rg.add(torus(R, 0.01, additive(color, 2.6, 0.9), 0, 0, 0, 4, 48))
      holo.add(rg)
      rings.push(rg)
    }
    const moon = new THREE.Group()
    moon.add(ball(0.07, 0.07, 0.07, additive('#ffd28a', 2.4, 0.9), 0.78, 0, 0, 10))
    moon.rotation.x = 0.3
    holo.add(moon)
    fx(holo)
    keep(holo)
    g.add(holo)
    g.userData.holo = { planet, rings, moon, mat: planet.material }
    return finalize(g)
  },
  animate: (obj, t, dt) => {
    const h = obj.userData.holo as { planet: THREE.Object3D; rings: THREE.Object3D[]; moon: THREE.Object3D; mat: THREE.MeshBasicMaterial } | undefined
    if (!h) return
    h.planet.rotation.y += dt * 0.35
    h.rings[0].rotation.z += dt * 0.5
    h.rings[1].rotation.z -= dt * 0.3
    h.moon.rotation.y += dt * 0.8
    h.mat.opacity = 0.78 + Math.sin(t * 13) * 0.04 + (Math.sin(t * 0.7) > 0.97 ? -0.3 : 0)
  },
})

// ---------------------------------------------------------------------------
// tower (seamless matte metal tower with blue light bands)
// ---------------------------------------------------------------------------

function towerFin(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(1, 0)
  s.quadraticCurveTo(0.3, 0.3, 0, 1)
  s.lineTo(0, 0)
  return s
}

registerProp('tower', {
  solid: true,
  light: { color: '#6ab8ff', intensity: 2.2, distance: 7, y: 1.4 },
  build: (ctx) => {
    const h = num(ctx, 'h', 9)
    const g = new THREE.Group()
    const metal = M('#3f4652')
    const metal2 = M('#4d5664')
    const blue = glowMat(PAL.tech, 3)
    const k = h / 9
    g.add(cy(0.62, 0.72, 0.3, metal2, 0, 0, 0, 8))
    g.add(cy(0.32, 0.48, 3.0 * k, metal, 0, 0.3, 0, 8))
    g.add(cy(0.22, 0.3, 3.0 * k, metal2, 0, 0.3 + 3.0 * k, 0, 8))
    g.add(cy(0.12, 0.2, 2.0 * k, metal, 0, 0.3 + 6.0 * k, 0, 8))
    g.add(cn(0.12, 0.8 * k, metal2, 0, 0.3 + 8.0 * k, 0, 8))
    const bands: [number, number][] = [[0.9, 0.46], [2.2, 0.38], [3.6, 0.29], [5.0, 0.26], [6.6, 0.19], [7.8, 0.14]]
    for (const [y, rr] of bands) g.add(cy(rr, rr, 0.05, blue, 0, y * k, 0, 8))
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 8
      const fin = extrude('towerfin', towerFin, 1, metal2, 8)
      fin.scale.set(0.75, 1.5, 0.1)
      fin.rotation.y = -a
      g.add(fin)
      const strip = bx(0.03, 2.4 * k, 0.03, blue, Math.cos(a) * 0.39, 0.5, Math.sin(a) * 0.39)
      strip.rotation.y = -a
      g.add(strip)
    }
    const beacon = ball(0.11, 0.11, 0.11, glowMat(PAL.tech, 3.6), 0, 0.3 + 8.85 * k, 0, 10)
    fx(beacon)
    keep(beacon)
    g.add(beacon)
    g.userData.beacon = beacon
    return finalize(g)
  },
  animate: (obj, t) => {
    const b = obj.userData.beacon as THREE.Object3D | undefined
    if (b) b.scale.setScalar(0.8 + 0.35 * Math.max(0, Math.sin(t * 2.2)))
  },
})

// ---------------------------------------------------------------------------
// drone (palm-sized metal insect, hovering)
// ---------------------------------------------------------------------------

registerProp('drone', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const ground = bool(ctx, 'ground')
    const g = new THREE.Group()
    const body = new THREE.Group()
    const metal = M('#6a7280')
    const dark = M('#2a2e36')
    body.add(ball(0.035, 0.028, 0.045, metal, 0, 0, 0, 10))
    body.add(ball(0.028, 0.024, 0.055, dark, 0, -0.004, -0.07, 10))
    body.add(ball(0.024, 0.022, 0.024, metal, 0, 0.004, 0.05, 8))
    body.add(ball(0.009, 0.009, 0.009, glowMat(PAL.tech, 3.6), 0.012, 0.01, 0.07, 6))
    body.add(ball(0.009, 0.009, 0.009, glowMat(PAL.tech, 3.6), -0.012, 0.01, 0.07, 6))
    for (const s of [-1, 1]) for (const z of [-0.02, 0.02, 0.05]) body.add(rod([s * 0.02, -0.01, z], [s * 0.06, -0.05, z + 0.01], 0.004, 0.003, dark, 4))
    const wings: THREE.Object3D[] = []
    const wingM = M('#cfe8ff', { opacity: 0.55, side: THREE.DoubleSide })
    for (const s of [-1, 1]) {
      for (const z of [0.01, -0.03]) {
        const w = new THREE.Group()
        w.position.set(s * 0.02, 0.022, z)
        w.add(leaf([0, 0, 0], [s * 0.1, 0.01, -0.02], 0.035, 0.004, wingM))
        w.userData.side = s
        keep(w)
        body.add(w)
        wings.push(w)
      }
    }
    body.position.y = ground ? 0.055 : 1.15
    body.userData.baseY = body.position.y
    body.userData.phase = ctx.rand() * 10
    keep(body)
    g.add(body)
    g.userData.drone = { body, wings, ground }
    return finalize(g)
  },
  animate: (obj, t) => {
    const d = obj.userData.drone as { body: THREE.Object3D; wings: THREE.Object3D[]; ground: boolean } | undefined
    if (!d) return
    const p = Number(d.body.userData.phase) || 0
    if (!d.ground) {
      d.body.position.y = Number(d.body.userData.baseY) + Math.sin(t * 2.3 + p) * 0.05
      d.body.rotation.y = Math.sin(t * 0.4 + p) * 0.8
    }
    const flap = d.ground ? Math.sin(t * 0.8 + p) * 0.1 : Math.sin(t * 60 + p) * 0.5
    for (const w of d.wings) w.rotation.z = flap * Number(w.userData.side)
  },
})

