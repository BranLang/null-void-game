import * as THREE from 'three'
import type { FloorType, WallType } from '../content/types'
import { Grid, LEVEL_HEIGHT, type Cell } from './Grid'
import { capMaterial, floorMaterial, FLOOR_SIDE, LIQUID_COLORS, wallMaterial } from './materials'
import { hashString } from './textures'
import { createLiquidMaterial } from './fx/Water'

/** Bottom of every floor slab: maps read like dioramas cut out of the world. */
const SLAB_BOTTOM = -1.6
const LIQUIDS = new Set<FloorType>(['water', 'deep', 'canal', 'lava'])
const BED: Partial<Record<FloorType, number>> = { water: -0.55, canal: -0.6, deep: -1.3, lava: -0.5 }
export const LIQUID_SURFACE = -0.14

interface GeoBuilder {
  pos: number[]
  nor: number[]
  uv: number[]
  col: number[]
  base: number[]
  idx: number[]
}

function newBuilder(): GeoBuilder {
  return { pos: [], nor: [], uv: [], col: [], base: [], idx: [] }
}

function quad(
  b: GeoBuilder,
  p: [number, number, number][],
  n: [number, number, number],
  uv: [number, number][],
  color: THREE.Color,
  base: [number, number, number, number],
): void {
  const i0 = b.pos.length / 3
  for (let i = 0; i < 4; i++) {
    b.pos.push(...p[i])
    b.nor.push(...n)
    b.uv.push(...uv[i])
    b.col.push(color.r, color.g, color.b)
    b.base.push(...base)
  }
  b.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3)
}

function toGeometry(b: GeoBuilder): THREE.BufferGeometry | null {
  if (!b.idx.length) return null
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3))
  g.setAttribute('aBase', new THREE.Float32BufferAttribute(b.base, 4))
  g.setIndex(b.idx)
  g.computeBoundingSphere()
  return g
}

function jitter(x: number, y: number, amount = 0.07): number {
  const h = hashString(`${x}:${y}`)
  return 1 - amount + ((h % 1000) / 1000) * amount * 2
}

function topOf(c: Cell | null): number {
  if (!c || c.floor === null || c.floor === 'void') return -Infinity
  if (LIQUIDS.has(c.floor)) return BED[c.floor] ?? -0.6
  return c.h * LEVEL_HEIGHT
}

/**
 * Add the four vertical sides of a box column from `bottomOf(neighbour)` up to `top`.
 * Faces are skipped where a neighbour is at least as tall.
 */
function addSides(
  b: GeoBuilder,
  grid: Grid,
  c: Cell,
  top: number,
  neighbourTop: (n: Cell | null) => number,
  color: THREE.Color,
  base: [number, number, number, number],
  floorBottom: number,
): void {
  const x = c.x
  const z = c.y
  const dirs: { dx: number; dz: number; n: [number, number, number] }[] = [
    { dx: 1, dz: 0, n: [1, 0, 0] },
    { dx: -1, dz: 0, n: [-1, 0, 0] },
    { dx: 0, dz: 1, n: [0, 0, 1] },
    { dx: 0, dz: -1, n: [0, 0, -1] },
  ]
  for (const d of dirs) {
    const nb = grid.cell(x + d.dx, z + d.dz)
    const bottom = Math.max(floorBottom, neighbourTop(nb))
    if (bottom >= top - 1e-4) continue
    const h0 = bottom
    const h1 = top
    // face corners (counter-clockwise seen from outside)
    let p: [number, number, number][]
    if (d.dx === 1)
      p = [
        [x + 0.5, h0, z + 0.5],
        [x + 0.5, h0, z - 0.5],
        [x + 0.5, h1, z - 0.5],
        [x + 0.5, h1, z + 0.5],
      ]
    else if (d.dx === -1)
      p = [
        [x - 0.5, h0, z - 0.5],
        [x - 0.5, h0, z + 0.5],
        [x - 0.5, h1, z + 0.5],
        [x - 0.5, h1, z - 0.5],
      ]
    else if (d.dz === 1)
      p = [
        [x - 0.5, h0, z + 0.5],
        [x + 0.5, h0, z + 0.5],
        [x + 0.5, h1, z + 0.5],
        [x - 0.5, h1, z + 0.5],
      ]
    else
      p = [
        [x + 0.5, h0, z - 0.5],
        [x - 0.5, h0, z - 0.5],
        [x - 0.5, h1, z - 0.5],
        [x + 0.5, h1, z - 0.5],
      ]
    const shade = d.dx === 1 || d.dz === 1 ? 0.92 : 1
    const col = color.clone().multiplyScalar(shade)
    quad(b, p, d.n, [
      [0, h0],
      [1, h0],
      [1, h1],
      [0, h1],
    ], col, base)
  }
}

export interface BuiltMap {
  group: THREE.Group
  liquids: THREE.Mesh[]
  bounds: THREE.Box3
}

export function buildMap(grid: Grid): BuiltMap {
  const group = new THREE.Group()
  group.name = 'map'
  const floorTops = new Map<FloorType, GeoBuilder>()
  const floorSides = new Map<WallType, GeoBuilder>()
  const walls = new Map<WallType, GeoBuilder>()
  const caps = new Map<WallType, GeoBuilder>()
  const get = <K, V>(m: Map<K, V>, k: K, mk: () => V): V => {
    let v = m.get(k)
    if (!v) {
      v = mk()
      m.set(k, v)
    }
    return v
  }
  const liquidCells: Record<string, Cell[]> = {}
  const tmp = new THREE.Color()
  const noBase: [number, number, number, number] = [0, 0, 0, 0]

  for (const row of grid.cells) {
    for (const c of row) {
      if (c.floor === null || c.floor === 'void') continue
      const x = c.x
      const z = c.y
      const isLiquid = LIQUIDS.has(c.floor)
      const top = topOf(c)
      if (isLiquid) {
        ;(liquidCells[c.floor] ??= []).push(c)
      }
      const floorType: FloorType = isLiquid ? (c.floor === 'lava' ? 'ash' : 'blacksand') : c.floor
      const j = jitter(x, z)
      tmp.set(c.spec.tint ?? '#ffffff').multiplyScalar(j)
      // top face
      const tb = get(floorTops, floorType, newBuilder)
      quad(
        tb,
        [
          [x - 0.5, top, z + 0.5],
          [x + 0.5, top, z + 0.5],
          [x + 0.5, top, z - 0.5],
          [x - 0.5, top, z - 0.5],
        ],
        [0, 1, 0],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        tmp,
        noBase,
      )
      // sides of the slab
      const sideType: WallType = c.spec.side ?? FLOOR_SIDE[floorType] ?? 'rock'
      const sb = get(floorSides, sideType, newBuilder)
      const sideCol = tmp.clone().multiplyScalar(0.78)
      addSides(sb, grid, c, top, (n) => topOf(n), sideCol, noBase, SLAB_BOTTOM)

      // walls
      if (c.wall) {
        const wt = c.spec.wall as WallType
        const wb = get(walls, wt, newBuilder)
        const wallTop = top + c.wallH
        const base: [number, number, number, number] = [x, top, z, c.wallH + 2]
        const wcol = new THREE.Color(1, 1, 1).multiplyScalar(jitter(x, z, 0.05))
        addSides(
          wb,
          grid,
          c,
          wallTop,
          (n) => (n && n.wall ? topOf(n) + n.wallH : top),
          wcol,
          base,
          top,
        )
        const cb = get(caps, wt, newBuilder)
        quad(
          cb,
          [
            [x - 0.5, wallTop, z + 0.5],
            [x + 0.5, wallTop, z + 0.5],
            [x + 0.5, wallTop, z - 0.5],
            [x - 0.5, wallTop, z - 0.5],
          ],
          [0, 1, 0],
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
          wcol,
          base,
        )
      }
    }
  }

  const addMesh = (geo: THREE.BufferGeometry | null, mat: THREE.Material, shadows = true) => {
    if (!geo) return
    const mesh = new THREE.Mesh(geo, mat)
    mesh.receiveShadow = true
    mesh.castShadow = shadows
    group.add(mesh)
  }
  for (const [type, b] of floorTops) addMesh(toGeometry(b), floorMaterial(type), false)
  for (const [type, b] of floorSides) addMesh(toGeometry(b), wallMaterial(type, false))
  for (const [type, b] of walls) addMesh(toGeometry(b), wallMaterial(type, true))
  for (const [type, b] of caps) addMesh(toGeometry(b), capMaterial(type))

  const liquids: THREE.Mesh[] = []
  for (const [type, cells] of Object.entries(liquidCells)) {
    const mesh = buildLiquid(grid, cells, type as 'water' | 'deep' | 'canal' | 'lava')
    group.add(mesh)
    liquids.push(mesh)
  }

  const bounds = new THREE.Box3(new THREE.Vector3(-0.5, SLAB_BOTTOM, -0.5), new THREE.Vector3(grid.width - 0.5, 4, grid.height - 0.5))
  return { group, liquids, bounds }
}

/** One plane per liquid type; a mask texture marks which cells hold liquid. */
function buildLiquid(grid: Grid, cells: Cell[], type: 'water' | 'deep' | 'canal' | 'lava'): THREE.Mesh {
  const w = grid.width
  const h = grid.height
  const data = new Uint8Array(w * h * 4)
  for (const c of cells) {
    const i = (c.y * w + c.x) * 4
    data[i] = 255
    data[i + 3] = 255
  }
  const mask = new THREE.DataTexture(data, w, h, THREE.RGBAFormat)
  mask.magFilter = THREE.LinearFilter
  mask.minFilter = THREE.LinearFilter
  mask.flipY = false
  mask.needsUpdate = true
  const colors = LIQUID_COLORS[type]
  const mat = createLiquidMaterial({
    mask,
    size: new THREE.Vector2(w, h),
    shallow: colors.shallow,
    deep: colors.deep,
    lava: type === 'lava',
    glow: type === 'canal' ? 1 : 0,
  })
  const geo = new THREE.PlaneGeometry(w, h, 1, 1)
  geo.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(w / 2 - 0.5, LIQUID_SURFACE, h / 2 - 0.5)
  mesh.receiveShadow = false
  mesh.renderOrder = 1
  mesh.name = `liquid-${type}`
  return mesh
}
