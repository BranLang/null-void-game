import * as THREE from 'three'
import { colorOr, glowMat, mat, param, type MatOpts, type PropContext } from './registry'
import { FX_LAYER, toon } from '../toon'
import { hashString } from '../textures'

/**
 * Shared building blocks for the prop kit (nature, architecture, furniture,
 * tech, magic): one anime palette, cached unit geometries that are scaled
 * per mesh, a merge step that bakes a prop's static parts into one mesh per
 * material, flames, and seeded canvas textures.
 *
 * Conventions: 1 unit = 1 tile, base at y = 0, centred on the cell, front
 * faces +Z. Wall-mounted props put their back on the cell edge z = -0.5
 * (WALL_Z) so they hug the wall behind the cell they are placed on.
 */

export type V3 = [number, number, number]
export type Rand = () => number
type Mat = ReturnType<typeof mat>

export const WALL_Z = -0.5

/** Anime / dark-fantasy palette: clean, slightly saturated base colours. */
export const PAL = {
  woodDark: '#5a3424',
  wood: '#8a5636',
  woodLight: '#b47a4c',
  woodPale: '#d6a873',
  woodGrey: '#8f7f6c',
  bark: '#6b4433',
  barkDark: '#45291f',
  stone: '#a8a092',
  stoneDark: '#76706a',
  stoneLight: '#cfc7b7',
  white: '#f3ecdc',
  whiteShade: '#ddd2bc',
  andesite: '#3d3944',
  andesiteDark: '#29262f',
  obsidian: '#1c1826',
  iron: '#4b515d',
  ironDark: '#2f333c',
  steel: '#5f6776',
  brass: '#d6a548',
  copper: '#c9733f',
  rust: '#94532f',
  gold: '#f0c050',
  leaf: '#5daa45',
  leafDark: '#3b7f3d',
  leafLight: '#97d65c',
  jungle: '#2f8050',
  jungleDark: '#1f5a3d',
  spruce: '#2f6a52',
  moss: '#6c9c3c',
  grass: '#74b84a',
  bioLeaf: '#24706e',
  dirt: '#7a5638',
  sand: '#d8be86',
  snow: '#f2f7fc',
  ice: '#bfe8ff',
  cream: '#f5e8c8',
  linen: '#e6d3a8',
  silk: '#8040c0',
  red: '#d04a3a',
  crimson: '#a82838',
  indigo: '#3f5cb0',
  teal: '#2fa69a',
  orange: '#f08a3a',
  rope: '#c9a46a',
  bone: '#f0e5c8',
  paper: '#f7f0dc',
  ink: '#1a1020',
  // glow colours (use with glowMat / emissive)
  flame: '#ff8a2a',
  flameCore: '#fff1b0',
  ember: '#ff5a1a',
  warm: '#ffbf66',
  spira: '#b066ff',
  spiraCore: '#f2dcff',
  glyph: '#7ff6ff',
  bio: '#5ff5d8',
  tech: '#58b8ff',
  infera: '#ff3a3a',
} as const

// ---------------------------------------------------------------------------
// params & randomness
// ---------------------------------------------------------------------------

export function bool(ctx: PropContext, key: string, fallback = false): boolean {
  const v = param<string | number | boolean>(ctx, key, fallback)
  return v === true || v === 'true' || v === 1 || v === '1'
}

export function num(ctx: PropContext, key: string, fallback: number): number {
  const v = param<string | number | boolean>(ctx, key, fallback)
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN
  return Number.isFinite(n) ? n : fallback
}

export function str(ctx: PropContext, key: string, fallback: string): string {
  const v = param<string | number | boolean>(ctx, key, fallback)
  return typeof v === 'string' ? v : fallback
}

/** Colour from params[key], then the placement's colour override, then the fallback. */
export function tint(ctx: PropContext, fallback: string, key = 'color'): string {
  const v = ctx.params[key]
  return typeof v === 'string' && v ? v : colorOr(ctx, fallback)
}

/** Small deterministic generator (mulberry32). */
export function seeded(key: string | number): Rand {
  let a = typeof key === 'number' ? key >>> 0 : hashString(key)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(r: Rand, arr: readonly T[]): T {
  return arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))]
}

export function range(r: Rand, a: number, b: number): number {
  return a + r() * (b - a)
}

/** Variant index 0..n-1 drawn from the placement seed. */
export function variant(ctx: PropContext, n: number): number {
  return Math.min(n - 1, Math.floor(ctx.rand() * n))
}

/** Multiply a colour (linear space) — k < 1 darker, k > 1 lighter. */
export function shade(hex: string, k: number): string {
  return '#' + new THREE.Color(hex).multiplyScalar(k).getHexString()
}

export function mix(a: string, b: string, t: number): string {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()
}

// ---------------------------------------------------------------------------
// materials
// ---------------------------------------------------------------------------

/** Smooth cel-shaded material (soft anime shading for organic / round shapes). */
export function M(color: string, o: MatOpts = {}): Mat {
  return mat(color, { flat: false, ...o })
}

/** Faceted cel-shaded material (rocks, crystals, ice). */
export function F(color: string, o: MatOpts = {}): Mat {
  return mat(color, { flat: true, ...o })
}

export { glowMat }

const customMats = new Map<string, THREE.Material>()

export function cachedMat<T extends THREE.Material>(key: string, make: () => T): T {
  let m = customMats.get(key) as T | undefined
  if (!m) {
    m = make()
    customMats.set(key, m)
  }
  return m
}

export interface TexMatOpts {
  emissiveMap?: THREE.Texture
  emissive?: string
  ei?: number
  transparent?: boolean
  side?: THREE.Side
  alphaTest?: number
  flat?: boolean
}

/** Cached toon material carrying a canvas texture. */
export function texMat(key: string, map: THREE.Texture, o: TexMatOpts = {}): THREE.MeshToonMaterial {
  return cachedMat(`tex|${key}`, () => {
    const m = toon('#ffffff', { map, transparent: o.transparent, side: o.side, emissive: o.emissive, ei: o.ei, flat: o.flat ?? false })
    if (o.emissiveMap) m.emissiveMap = o.emissiveMap
    if (o.alphaTest !== undefined) m.alphaTest = o.alphaTest
    return m
  })
}

/** A per-placement emissive toon material (for pulsing crystals, books...). */
export function uniqueGlowToon(color: string, emissive: string, ei: number, flat = true): THREE.MeshToonMaterial {
  return toon(color, { flat, emissive, ei })
}

/** A per-placement unlit glow material (its colour can be animated). */
export function uniqueGlow(color: string, intensity: number, opacity = 1): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    transparent: opacity < 1,
    opacity,
    toneMapped: false,
  })
  m.userData.fx = true
  m.userData.base = new THREE.Color(color).multiplyScalar(intensity)
  return m
}

/** Additive, unlit, double sided (holograms, light cones, decals). */
export function additive(color: string, intensity: number, opacity: number, map: THREE.Texture | null = null, unique = false): THREE.MeshBasicMaterial {
  const make = () => {
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      map,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
    m.userData.fx = true
    return m
  }
  return unique ? make() : cachedMat(`add|${color}|${intensity}|${opacity}|${map ? map.uuid : ''}`, make)
}

// ---------------------------------------------------------------------------
// geometry helpers (unit geometries cached, scaled per mesh)
// ---------------------------------------------------------------------------

const geoCache = new Map<string, THREE.BufferGeometry>()

export function cachedGeo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key) as T | undefined
  if (!g) {
    g = make()
    geoCache.set(key, g)
  }
  return g
}

const q = (v: number): number => Math.round(v * 20) / 20
const UP = new THREE.Vector3(0, 1, 0)

function prep(m: THREE.Mesh): THREE.Mesh {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Box with its base at y. */
export function bx(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(
    cachedGeo('box', () => new THREE.BoxGeometry(1, 1, 1)),
    material,
  )
  m.scale.set(w, h, d)
  m.position.set(x, y + h / 2, z)
  return prep(m)
}

function cylGeo(rt: number, rb: number, seg: number): THREE.BufferGeometry {
  return cachedGeo(`cyl|${rt}|${rb}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, 1, seg))
}

/** Cylinder / frustum with its base at y. */
export function cy(rt: number, rb: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 12): THREE.Mesh {
  const r = Math.max(rt, rb, 1e-4)
  const m = new THREE.Mesh(cylGeo(q(rt / r), q(rb / r), seg), material)
  m.scale.set(r, h, r)
  m.position.set(x, y + h / 2, z)
  return prep(m)
}

/** Cone with its base at y. */
export function cn(r: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 8): THREE.Mesh {
  return cy(0, r, h, material, x, y, z, seg)
}

/** Ellipsoid blob centred at (x, y, z). */
export function blob(rx: number, ry: number, rz: number, material: THREE.Material, x = 0, y = 0, z = 0, detail = 1): THREE.Mesh {
  const m = new THREE.Mesh(
    cachedGeo(`ico|${detail}`, () => new THREE.IcosahedronGeometry(1, detail)),
    material,
  )
  m.scale.set(rx, ry, rz)
  m.position.set(x, y, z)
  return prep(m)
}

/** Sphere (icosahedron) centred at (x, y, z). */
export function ico(r: number, material: THREE.Material, x = 0, y = 0, z = 0, detail = 1): THREE.Mesh {
  return blob(r, r, r, material, x, y, z, detail)
}

/** Smooth UV sphere centred at (x, y, z) — rounder silhouettes for the ink lines. */
export function ball(rx: number, ry: number, rz: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  const m = new THREE.Mesh(
    cachedGeo(`sph|${seg}`, () => new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.7)))),
    material,
  )
  m.scale.set(rx, ry, rz)
  m.position.set(x, y, z)
  return prep(m)
}

/** Upper half sphere (domes, mushroom caps), base at y. */
export function dome(rx: number, ry: number, rz: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  const m = new THREE.Mesh(
    cachedGeo(`dome|${seg}`, () => new THREE.SphereGeometry(1, seg, Math.max(4, Math.round(seg / 3)), 0, Math.PI * 2, 0, Math.PI / 2)),
    material,
  )
  m.scale.set(rx, ry, rz)
  m.position.set(x, y, z)
  return prep(m)
}

/** Cylinder between two points, radius ra at a and rb at b. */
export function rod(a: V3, b: V3, ra: number, rb: number, material: THREE.Material, seg = 8): THREE.Mesh {
  const A = new THREE.Vector3(a[0], a[1], a[2])
  const B = new THREE.Vector3(b[0], b[1], b[2])
  const dir = B.clone().sub(A)
  const len = dir.length() || 1e-4
  const r = Math.max(ra, rb, 1e-4)
  const m = new THREE.Mesh(cylGeo(q(rb / r), q(ra / r), seg), material)
  m.scale.set(r, len, r)
  m.position.copy(A).add(B).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.divideScalar(len))
  return prep(m)
}

/** Chain of rods through points (roots, vines, ribs). Radius lerps r0 -> r1. */
export function chain(points: V3[], r0: number, r1: number, material: THREE.Material, seg = 7, joints = true): THREE.Group {
  const g = new THREE.Group()
  const n = points.length - 1
  for (let i = 0; i < n; i++) {
    const ra = r0 + (r1 - r0) * (i / n)
    const rb = r0 + (r1 - r0) * ((i + 1) / n)
    g.add(rod(points[i], points[i + 1], ra, rb, material, seg))
    if (joints && i > 0) g.add(ico(ra * 1.0, material, points[i][0], points[i][1], points[i][2], 1))
  }
  return g
}

/** Ellipsoid stretched between a and b (leaves, fronds, petals, feathers). */
export function leaf(a: V3, b: V3, w: number, t: number, material: THREE.Material, detail = 1): THREE.Mesh {
  const A = new THREE.Vector3(a[0], a[1], a[2])
  const B = new THREE.Vector3(b[0], b[1], b[2])
  const yAxis = B.clone().sub(A)
  const len = yAxis.length() || 1e-4
  yAxis.divideScalar(len)
  const xAxis = new THREE.Vector3().crossVectors(yAxis, UP)
  if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0)
  xAxis.normalize()
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize()
  const m = new THREE.Mesh(
    cachedGeo(`ico|${detail}`, () => new THREE.IcosahedronGeometry(1, detail)),
    material,
  )
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis))
  m.scale.set(w / 2, len / 2, t / 2)
  m.position.copy(A).add(B).multiplyScalar(0.5)
  return prep(m)
}

/** Torus in the XY plane (faces +Z). Use rot() to lay it down. */
export function torus(R: number, tube: number, material: THREE.Material, x = 0, y = 0, z = 0, radial = 8, tubular = 20, arc = Math.PI * 2): THREE.Mesh {
  const k = Math.max(0.005, Math.round((tube / R) * 200) / 200)
  const m = new THREE.Mesh(
    cachedGeo(`tor|${k}|${radial}|${tubular}|${arc.toFixed(3)}`, () => new THREE.TorusGeometry(1, k, radial, tubular, arc)),
    material,
  )
  m.scale.setScalar(R)
  m.position.set(x, y, z)
  return prep(m)
}

/** Horizontal ring (torus lying in the XZ plane) centred at height y. */
export function ring(R: number, tube: number, material: THREE.Material, x = 0, y = 0, z = 0, radial = 6, tubular = 20): THREE.Mesh {
  const m = torus(R, tube, material, x, y, z, radial, tubular)
  m.rotation.x = Math.PI / 2
  return m
}

/** Vertical plane facing +Z centred at (x, y, z). */
export function plane(w: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(
    cachedGeo('plane', () => new THREE.PlaneGeometry(1, 1)),
    material,
  )
  m.scale.set(w, h, 1)
  m.position.set(x, y, z)
  return prep(m)
}

/** Flat ground decal (facing up) at height y. No shadows, FX layer (no ink lines). */
export function decal(w: number, d: number, material: THREE.Material, y = 0.012, round = false): THREE.Mesh {
  const geo = round
    ? cachedGeo('circle', () => new THREE.CircleGeometry(0.5, 40))
    : cachedGeo('plane', () => new THREE.PlaneGeometry(1, 1))
  const m = new THREE.Mesh(geo, material)
  m.rotation.x = -Math.PI / 2
  m.scale.set(w, d, 1)
  m.position.y = y
  return fx(m)
}

/** Cached lathe geometry (profile points [radius, y], bottom to top). */
export function lathe(key: string, pts: [number, number][], material: THREE.Material, seg = 16): THREE.Mesh {
  const g = cachedGeo(`lathe|${key}|${seg}`, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg))
  return prep(new THREE.Mesh(g, material))
}

/** Cached extruded shape (shape in XY, extruded along +Z by depth, centred on z). */
export function extrude(key: string, shape: () => THREE.Shape, depth: number, material: THREE.Material, curveSegments = 8): THREE.Mesh {
  const g = cachedGeo(`ext|${key}|${depth}`, () => {
    const geo = new THREE.ExtrudeGeometry(shape(), { depth, bevelEnabled: false, curveSegments })
    geo.translate(0, 0, -depth / 2)
    return geo
  })
  return prep(new THREE.Mesh(g, material))
}

export function rot<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0): T {
  o.rotation.set(x, y, z)
  return o
}

export function at<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0): T {
  o.position.set(x, y, z)
  return o
}

export function grp(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group()
  for (const c of children) g.add(c)
  return g
}

// ---------------------------------------------------------------------------
// flags
// ---------------------------------------------------------------------------

/** Glows, decals, water: no shadows, FX layer (soft, no ink outline). */
export function fx<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.layers.set(FX_LAYER)
    c.castShadow = false
    c.receiveShadow = false
  })
  return o
}

export function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false
  })
  return o
}

/** Keep an object out of the static merge (animated parts, script handles). */
export function keep<T extends THREE.Object3D>(o: T): T {
  o.userData.anim = true
  return o
}

// ---------------------------------------------------------------------------
// static merge: one mesh per material for everything not kept
// ---------------------------------------------------------------------------

interface Part {
  geo: THREE.BufferGeometry
  m: THREE.Matrix4
}

interface Bucket {
  material: THREE.Material
  cast: boolean
  receive: boolean
  order: number
  layers: number
  parts: Part[]
}

const flatCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()

function nonIndexed(g: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!g.index) return g
  let f = flatCache.get(g)
  if (!f) {
    f = g.toNonIndexed()
    flatCache.set(g, f)
  }
  return f
}

function usesUv(m: THREE.Material): boolean {
  const s = m as THREE.Material & { map?: THREE.Texture | null; emissiveMap?: THREE.Texture | null; alphaMap?: THREE.Texture | null }
  return !!(s.map || s.emissiveMap || s.alphaMap)
}

function isGlow(m: THREE.Material): boolean {
  return m instanceof THREE.MeshBasicMaterial || m.userData.fx === true
}

function mergeParts(parts: Part[], withUv: boolean): THREE.BufferGeometry {
  let count = 0
  const flats = parts.map((p) => {
    const g = nonIndexed(p.geo)
    count += g.getAttribute('position').count
    return g
  })
  const pos = new Float32Array(count * 3)
  const nor = new Float32Array(count * 3)
  const uv = withUv ? new Float32Array(count * 2) : null
  const v = new THREE.Vector3()
  const nm = new THREE.Matrix3()
  let o = 0
  parts.forEach((p, k) => {
    const g = flats[k]
    const P = g.getAttribute('position')
    const N = g.hasAttribute('normal') ? g.getAttribute('normal') : null
    const U = g.hasAttribute('uv') ? g.getAttribute('uv') : null
    nm.getNormalMatrix(p.m)
    const flip = p.m.determinant() < 0
    for (let i = 0; i < P.count; i++) {
      const j = flip ? (i % 3 === 1 ? i + 1 : i % 3 === 2 ? i - 1 : i) : i
      const t = (o + i) * 3
      v.fromBufferAttribute(P, j).applyMatrix4(p.m)
      pos[t] = v.x
      pos[t + 1] = v.y
      pos[t + 2] = v.z
      if (N) {
        v.fromBufferAttribute(N, j).applyMatrix3(nm).normalize()
        nor[t] = v.x
        nor[t + 1] = v.y
        nor[t + 2] = v.z
      }
      if (uv && U) {
        uv[(o + i) * 2] = U.getX(j)
        uv[(o + i) * 2 + 1] = U.getY(j)
      }
    }
    o += P.count
  })
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.computeBoundingSphere()
  geo.computeBoundingBox()
  return geo
}

function prune(o: THREE.Object3D): void {
  for (const c of [...o.children]) {
    if (c.userData.anim) continue
    prune(c)
    if ((c.type === 'Group' || c.type === 'Object3D') && c.children.length === 0) c.removeFromParent()
  }
}

/**
 * Bake every static mesh below `root` into one mesh per material (draw calls
 * stay low however many parts a prop has). Objects flagged with keep() — and
 * their subtrees — stay untouched so animate() and scripts can move them.
 * Glow materials end up on the FX layer without shadows.
 */
export function finalize<T extends THREE.Object3D>(root: T): T {
  root.updateMatrixWorld(true)
  const inv = root.matrixWorld.clone().invert()
  const buckets = new Map<string, Bucket>()
  const merged: THREE.Mesh[] = []
  const visit = (o: THREE.Object3D): void => {
    for (const c of o.children) {
      if (c.userData.anim || c.userData.noMerge || !c.visible) continue
      if (c instanceof THREE.Mesh && c.children.length === 0 && !Array.isArray(c.material)) {
        const material = c.material as THREE.Material
        const glow = isGlow(material)
        const cast = c.castShadow && !glow
        const layers = glow ? 1 << FX_LAYER : c.layers.mask
        const key = `${material.uuid}|${cast}|${c.renderOrder}|${layers}`
        let b = buckets.get(key)
        if (!b) {
          b = { material, cast, receive: c.receiveShadow && !glow, order: c.renderOrder, layers, parts: [] }
          buckets.set(key, b)
        }
        b.parts.push({ geo: c.geometry, m: inv.clone().multiply(c.matrixWorld) })
        merged.push(c)
      } else {
        visit(c)
      }
    }
  }
  visit(root)
  for (const me of merged) me.removeFromParent()
  prune(root)
  for (const b of buckets.values()) {
    const mesh = new THREE.Mesh(mergeParts(b.parts, usesUv(b.material)), b.material)
    mesh.castShadow = b.cast
    mesh.receiveShadow = b.receive
    mesh.renderOrder = b.order
    mesh.layers.mask = b.layers
    root.add(mesh)
  }
  // glow parts inside kept subtrees: FX layer, no shadows
  root.traverse((c) => {
    if (c instanceof THREE.Mesh && !Array.isArray(c.material) && isGlow(c.material)) {
      c.layers.set(FX_LAYER)
      c.castShadow = false
      c.receiveShadow = false
    }
  })
  return root
}

interface TplMesh {
  geo: THREE.BufferGeometry
  material: THREE.Material
  cast: boolean
  receive: boolean
  order: number
  layers: number
}

const templates = new Map<string, TplMesh[]>()

/**
 * Build a static prop once per key and share the merged geometry between
 * placements. Use only for props without animated parts.
 */
export function cachedBuild(key: string, build: () => THREE.Object3D): THREE.Group {
  let t = templates.get(key)
  if (!t) {
    const root = finalize(build())
    t = []
    for (const c of root.children) {
      if (c instanceof THREE.Mesh && !Array.isArray(c.material)) {
        t.push({ geo: c.geometry, material: c.material, cast: c.castShadow, receive: c.receiveShadow, order: c.renderOrder, layers: c.layers.mask })
      } else if (import.meta.env.DEV) {
        console.warn(`[props] cachedBuild(${key}) dropped a non-mesh child`)
      }
    }
    templates.set(key, t)
  }
  const g = new THREE.Group()
  for (const m of t) {
    const me = new THREE.Mesh(m.geo, m.material)
    me.castShadow = m.cast
    me.receiveShadow = m.receive
    me.renderOrder = m.order
    me.layers.mask = m.layers
    g.add(me)
  }
  return g
}

/** Wrap a prop so the World can freely set the outer transform. */
export function wrap(inner: THREE.Object3D, rotY = 0, scale = 1): THREE.Group {
  const g = new THREE.Group()
  inner.rotation.y = rotY
  inner.scale.setScalar(scale)
  g.add(inner)
  return g
}

// ---------------------------------------------------------------------------
// fire
// ---------------------------------------------------------------------------

/** Stylised anime flame: teardrop body with a hot core. Animate with flicker(). */
export function flame(size: number, phase: number, color: string = PAL.flame, core: string = PAL.flameCore): THREE.Group {
  const g = new THREE.Group()
  const outer = glowMat(color, 2.8, 0.82)
  const inner = glowMat(core, 3.4)
  g.add(ball(0.085 * size, 0.09 * size, 0.085 * size, outer, 0, 0.085 * size, 0, 10))
  g.add(cn(0.083 * size, 0.3 * size, outer, 0, 0.09 * size, 0, 10))
  g.add(rot(cn(0.04 * size, 0.15 * size, outer, 0.055 * size, 0.07 * size, 0, 6), 0, 0, -0.45))
  g.add(rot(cn(0.035 * size, 0.13 * size, outer, -0.05 * size, 0.07 * size, 0.015 * size, 6), 0.25, 0, 0.5))
  g.add(ball(0.05 * size, 0.055 * size, 0.05 * size, inner, 0, 0.075 * size, 0, 8))
  g.add(cn(0.048 * size, 0.17 * size, inner, 0, 0.08 * size, 0, 8))
  fx(g)
  keep(g)
  g.userData.phase = phase
  return g
}

/** Flicker every flame registered in obj.userData.flames. */
export function flicker(obj: THREE.Object3D, time: number): void {
  const list = obj.userData.flames as THREE.Object3D[] | undefined
  if (!list) return
  for (const f of list) {
    const p = Number(f.userData.phase) || 0
    const s = 1 + Math.sin(time * 12.3 + p) * 0.1 + Math.sin(time * 27.1 + p * 1.7) * 0.06
    const w = 1 - Math.sin(time * 9.7 + p * 2.1) * 0.07
    f.scale.set(w, s, w)
    f.rotation.y = time * 1.3 + p
  }
}

// ---------------------------------------------------------------------------
// canvas textures
// ---------------------------------------------------------------------------

const texCache = new Map<string, THREE.CanvasTexture>()

export type Painter = (g: CanvasRenderingContext2D, w: number, h: number, r: Rand) => void

/** Seeded canvas texture, cached by key. */
export function canvasTex(key: string, w: number, h: number, draw: Painter, srgb = true): THREE.CanvasTexture {
  let t = texCache.get(key)
  if (!t) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')
    if (!g) throw new Error('2D canvas unavailable')
    draw(g, w, h, seeded(key))
    t = new THREE.CanvasTexture(c)
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    texCache.set(key, t)
  }
  return t
}

/** Five-point Spira glyph (pentagram in a double circle with rune ticks), white on transparent. */
export function glyphCanvasTex(): THREE.CanvasTexture {
  return canvasTex('glyph5', 512, 512, (g, w, h, r) => {
    g.translate(w / 2, h / 2)
    g.strokeStyle = '#ffffff'
    g.fillStyle = '#ffffff'
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.shadowColor = '#ffffff'
    g.shadowBlur = 10
    const R = w * 0.46
    g.lineWidth = 9
    g.beginPath()
    g.arc(0, 0, R, 0, Math.PI * 2)
    g.stroke()
    g.lineWidth = 4
    g.beginPath()
    g.arc(0, 0, R * 0.86, 0, Math.PI * 2)
    g.stroke()
    // rune ticks between the circles
    g.lineWidth = 4
    for (let i = 0; i < 20; i++) {
      g.save()
      g.rotate((i / 20) * Math.PI * 2)
      g.beginPath()
      const k = Math.floor(r() * 4)
      const a = R * 0.885
      const b = R * 0.975
      if (k === 0) {
        g.moveTo(a, -8)
        g.lineTo(b, 0)
        g.lineTo(a, 8)
      } else if (k === 1) {
        g.moveTo(a, 0)
        g.lineTo(b, 0)
        g.moveTo((a + b) / 2, -9)
        g.lineTo((a + b) / 2, 9)
      } else if (k === 2) {
        g.arc((a + b) / 2, 0, 6, 0, Math.PI * 2)
      } else {
        g.moveTo(a, -7)
        g.lineTo(b, 7)
        g.moveTo(a, 7)
        g.lineTo(b, -7)
      }
      g.stroke()
      g.restore()
    }
    // pentagram
    const P = R * 0.84
    g.lineWidth = 8
    g.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
      if (i === 0) g.moveTo(Math.cos(a) * P, Math.sin(a) * P)
      else g.lineTo(Math.cos(a) * P, Math.sin(a) * P)
    }
    g.stroke()
    // inner circle and point dots
    g.lineWidth = 4
    g.beginPath()
    g.arc(0, 0, P * Math.cos((2 * Math.PI) / 5) / Math.cos(Math.PI / 5) * 0.98, 0, Math.PI * 2)
    g.stroke()
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
      g.beginPath()
      g.arc(Math.cos(a) * P, Math.sin(a) * P, 13, 0, Math.PI * 2)
      g.fill()
    }
    g.beginPath()
    g.arc(0, 0, 10, 0, Math.PI * 2)
    g.fill()
  })
}

/** Jittered faceted rock geometry (smooth normals so ink lines only trace the silhouette). */
export function rockGeo(v: number): THREE.BufferGeometry {
  return cachedGeo(`rock|${v}`, () => {
    const g = new THREE.IcosahedronGeometry(1, 1)
    const r = seeded(`rock${v}`)
    const P = g.getAttribute('position')
    const disp = new Map<string, number>()
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i)
      const y = P.getY(i)
      const z = P.getZ(i)
      const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`
      let k = disp.get(key)
      if (k === undefined) {
        k = 0.82 + r() * 0.3
        disp.set(key, k)
      }
      let ny = y * k
      if (ny < -0.3) ny = -0.3 + (ny + 0.3) * 0.15
      P.setXYZ(i, x * k, ny + 0.3, z * k)
    }
    // smooth normals: merge by position, compute, then expand back
    const idx = new Map<string, number>()
    const verts: number[] = []
    const index: number[] = []
    for (let i = 0; i < P.count; i++) {
      const key = `${P.getX(i).toFixed(3)},${P.getY(i).toFixed(3)},${P.getZ(i).toFixed(3)}`
      let n = idx.get(key)
      if (n === undefined) {
        n = verts.length / 3
        verts.push(P.getX(i), P.getY(i), P.getZ(i))
        idx.set(key, n)
      }
      index.push(n)
    }
    const ig = new THREE.BufferGeometry()
    ig.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    ig.setIndex(index)
    ig.computeVertexNormals()
    const out = ig.toNonIndexed()
    out.computeBoundingSphere()
    ig.dispose()
    g.dispose()
    return out
  })
}

/** A rock mesh (base near y = 0). */
export function rock(v: number, sx: number, sy: number, sz: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = prep(new THREE.Mesh(rockGeo(v % 6), material))
  m.scale.set(sx, sy, sz)
  m.position.set(x, y, z)
  return m
}
