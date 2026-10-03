import type { MapDef, TileSpec, Vec2 } from '../../content/types'

/**
 * Painted scene plates.
 *
 * A plate is one painted isometric image. The game world behind it is an
 * invisible grid on the ground plane (y = 0). Because the camera is
 * orthographic with a fixed yaw/pitch, every image pixel maps to exactly one
 * ground point, so walkable areas, spawn points and occluders can be authored
 * directly in normalized image coordinates (u right, v down, 0..1).
 *
 * This module is pure math (no three.js) so content files and tests can use it.
 */

export type UV = [number, number]

export interface PlateOccluder {
  /** polygon in image coordinates; the painted pixels inside it are drawn over characters behind it */
  poly: UV[]
  /** v of the occluder's ground line (characters whose feet are above it are hidden); default: lowest point of poly */
  base?: number
}

export interface PlateDef {
  /** image url relative to the page, e.g. 'assets/ref/nyau_garden_empty.png' */
  src: string
  /**
   * Large maps: a grid of painted tiles (rows of urls, same tile size, edges continuing
   * into each other, e.g. Flow outpainting). They are stitched at load time into one
   * texture (max 8192 px on the long side) and `src` is ignored. `aspect` is the aspect
   * of the whole stitched map.
   */
  tiles?: string[][]
  /** image height / width */
  aspect: number
  /** world units the image spans horizontally (larger = characters look smaller) */
  width: number
  /** walkable polygons */
  walk: UV[][]
  /** holes cut out of the walkable area */
  block?: UV[][]
  occluders?: PlateOccluder[]
  /** multiplies character sprite colours to sit them into the painting's light */
  tint?: string
  /** brightness of the painting itself (default 1) */
  exposure?: number
}

const YAW = Math.PI / 4
const PITCH = (35 * Math.PI) / 180
const CY = Math.cos(YAW)
const SY = Math.sin(YAW)
const SP = Math.sin(PITCH)
const CP = Math.cos(PITCH)

/** Screen offset (right, up) in world units of a ground offset (dx, dz). Must match CameraRig. */
export function groundToScreen(dx: number, dz: number): [number, number] {
  return [dx * CY - dz * SY, -SP * (dx * SY + dz * CY)]
}

/** Inverse of groundToScreen. */
export function screenToGround(sx: number, sup: number): [number, number] {
  const a = sx / CY // dx - dz   (yaw is 45°, so CY == SY)
  const b = -sup / (SP * SY) // dx + dz
  return [(a + b) / 2, (b - a) / 2]
}

/** Depth of a ground offset along the view direction (bigger = closer to the camera). */
export function groundDepth(dx: number, dz: number): number {
  return CP * (dx * SY + dz * CY)
}

export const SCREEN_PER_VERTICAL = CP

export interface PlateFrame {
  /** grid size */
  w: number
  h: number
  /** grid coordinates of the ground point under the image centre */
  cx: number
  cz: number
  W: number
  H: number
  toUV(x: number, z: number): UV
  /** ground point (grid coords, fractional) for an image point */
  fromUV(u: number, v: number): [number, number]
}

const frames = new WeakMap<PlateDef, PlateFrame>()

export function plateFrame(p: PlateDef): PlateFrame {
  const cached = frames.get(p)
  if (cached) return cached
  const W = p.width
  const H = p.width * p.aspect
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  for (const [u, v] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]) {
    const [dx, dz] = screenToGround((u - 0.5) * W, (0.5 - v) * H)
    minX = Math.min(minX, dx)
    maxX = Math.max(maxX, dx)
    minZ = Math.min(minZ, dz)
    maxZ = Math.max(maxZ, dz)
  }
  const cx = Math.ceil(-minX) + 1
  const cz = Math.ceil(-minZ) + 1
  const f: PlateFrame = {
    w: Math.ceil(maxX - minX) + 3,
    h: Math.ceil(maxZ - minZ) + 3,
    cx,
    cz,
    W,
    H,
    toUV(x, z) {
      const [sx, sup] = groundToScreen(x - cx, z - cz)
      return [0.5 + sx / W, 0.5 - sup / H]
    },
    fromUV(u, v) {
      const [dx, dz] = screenToGround((u - 0.5) * W, (0.5 - v) * H)
      return [cx + dx, cz + dz]
    },
  }
  frames.set(p, f)
  return f
}

export function insidePoly(u: number, v: number, poly: UV[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ui, vi] = poly[i]
    const [uj, vj] = poly[j]
    if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) inside = !inside
  }
  return inside
}

export function plateWalkable(p: PlateDef, u: number, v: number): boolean {
  return p.walk.some((poly) => insidePoly(u, v, poly)) && !(p.block ?? []).some((poly) => insidePoly(u, v, poly))
}

/**
 * Build the scene's (invisible) grid from the plate's walk polygons.
 * `tags` name cells for scripts (g.cell('tag')); `legend` adds or overrides tiles.
 */
export function plateMap(p: PlateDef, extra: { tags?: Record<string, UV>; cells?: { at: UV; spec: TileSpec }[] } = {}): MapDef {
  const f = plateFrame(p)
  const rows: string[][] = []
  for (let z = 0; z < f.h; z++) {
    const row: string[] = []
    for (let x = 0; x < f.w; x++) {
      const [u, v] = f.toUV(x, z)
      if (u < 0 || u > 1 || v < 0 || v > 1) row.push(' ')
      else row.push(plateWalkable(p, u, v) ? '.' : '#')
    }
    rows.push(row)
  }
  const legend: Record<string, TileSpec> = {
    '.': { floor: 'stone', walk: true },
    '#': { floor: 'stone', walk: false },
  }
  let code = 0
  const glyphs = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const put = (at: UV, spec: TileSpec) => {
    const [x, z] = plateAt(p)(at[0], at[1])
    if (z < 0 || z >= f.h || x < 0 || x >= f.w) return
    const ch = glyphs[code++ % glyphs.length]
    const base = legend[rows[z][x]] ?? { floor: 'stone' }
    legend[ch] = { ...base, ...spec }
    rows[z][x] = ch
  }
  for (const [tag, at] of Object.entries(extra.tags ?? {})) put(at, { tag })
  for (const c of extra.cells ?? []) put(c.at, c.spec)
  return { rows: rows.map((r) => r.join('')), legend }
}

/** Returns a converter from image coordinates to the nearest grid cell. */
export function plateAt(p: PlateDef): (u: number, v: number) => Vec2 {
  const f = plateFrame(p)
  return (u, v) => {
    const [x, z] = f.fromUV(u, v)
    return [Math.round(x), Math.round(z)]
  }
}
