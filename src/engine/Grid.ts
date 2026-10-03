import type { FloorType, MapDef, TileSpec, Vec2 } from '../content/types'

export const LEVEL_HEIGHT = 0.5

export interface Cell {
  x: number
  y: number
  floor: FloorType | null
  h: number
  wall: boolean
  wallH: number
  /** walkable before dynamic blockers are applied */
  baseWalk: boolean
  stairs: boolean
  leap: boolean
  tag?: string
  spec: TileSpec
}

const UNWALKABLE_FLOORS: ReadonlySet<FloorType> = new Set<FloorType>(['water', 'deep', 'canal', 'lava', 'void'])

/** Parse an ASCII map into cells. */
export function parseMap(def: MapDef): Cell[][] {
  const height = def.rows.length
  const width = Math.max(...def.rows.map((r) => r.length))
  const cells: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      const ch = def.rows[y][x] ?? ' '
      const spec: TileSpec = ch === ' ' ? { floor: null } : def.legend[ch] ?? missing(ch)
      const floor = spec.floor === undefined ? 'stone' : spec.floor
      const wall = !!spec.wall
      const walk = spec.walk ?? (!wall && floor !== null && !UNWALKABLE_FLOORS.has(floor))
      row.push({
        x,
        y,
        floor,
        h: spec.h ?? 0,
        wall,
        wallH: spec.wallH ?? 2.4,
        baseWalk: walk && !spec.leap,
        stairs: !!spec.stairs,
        leap: !!spec.leap,
        tag: spec.tag,
        spec,
      })
    }
    cells.push(row)
  }
  return cells
}

function missing(ch: string): TileSpec {
  console.warn(`[map] character '${ch}' is not in the legend`)
  return { floor: 'stone' }
}

interface Node {
  x: number
  y: number
  g: number
  f: number
  parent: Node | null
}

export class Grid {
  readonly cells: Cell[][]
  readonly width: number
  readonly height: number
  /** dynamic blockers (solid props, actors) keyed "x,y" with a ref count */
  private blocked = new Map<string, number>()
  /** while true, leap cells are passable (Sai's light hour) */
  leapOpen = false

  constructor(def: MapDef) {
    this.cells = parseMap(def)
    this.height = this.cells.length
    this.width = this.cells[0]?.length ?? 0
  }

  cell(x: number, y: number): Cell | null {
    if (x < 0 || y < 0 || y >= this.height || x >= this.width) return null
    return this.cells[y][x]
  }

  findTag(tag: string): Vec2 | null {
    for (const row of this.cells) for (const c of row) if (c.tag === tag) return [c.x, c.y]
    return null
  }

  allTagged(tag: string): Vec2[] {
    const out: Vec2[] = []
    for (const row of this.cells) for (const c of row) if (c.tag === tag) out.push([c.x, c.y])
    return out
  }

  block(x: number, y: number, on = true): void {
    const k = `${x},${y}`
    const n = (this.blocked.get(k) ?? 0) + (on ? 1 : -1)
    if (n <= 0) this.blocked.delete(k)
    else this.blocked.set(k, n)
  }

  isBlocked(x: number, y: number): boolean {
    return this.blocked.has(`${x},${y}`)
  }

  walkable(x: number, y: number, ignoreDynamic = false): boolean {
    const c = this.cell(x, y)
    if (!c) return false
    const base = c.baseWalk || (c.leap && this.leapOpen)
    if (!base) return false
    return ignoreDynamic || !this.isBlocked(x, y)
  }

  /** Floor height (world units) at a fractional grid position. */
  heightAt(x: number, y: number): number {
    const c = this.cell(Math.round(x), Math.round(y))
    if (!c) return 0
    if (c.leap) return c.h * LEVEL_HEIGHT
    return c.h * LEVEL_HEIGHT
  }

  /** Can a character step from a to b (adjacent cells)? */
  canStep(ax: number, ay: number, bx: number, by: number, ignoreDynamic = false): boolean {
    const a = this.cell(ax, ay)
    const b = this.cell(bx, by)
    if (!a || !b) return false
    if (!this.walkable(bx, by, ignoreDynamic)) return false
    const dh = Math.abs(a.h - b.h)
    if (dh === 0) return true
    if (dh === 1 && (a.stairs || b.stairs)) return true
    return false
  }

  /**
   * A* path from start to goal over 8 neighbours (no corner cutting).
   * Returns the list of cells to visit (excluding the start), or null.
   */
  findPath(start: Vec2, goal: Vec2, opts: { ignoreDynamic?: boolean; maxNodes?: number } = {}): Vec2[] | null {
    const [sx, sy] = start
    let [gx, gy] = goal
    if (!this.cell(sx, sy)) return null
    if (!this.walkable(gx, gy, opts.ignoreDynamic)) {
      const near = this.nearestWalkable(gx, gy, 3, opts.ignoreDynamic)
      if (!near) return null
      ;[gx, gy] = near
    }
    if (sx === gx && sy === gy) return []
    const key = (x: number, y: number) => y * this.width + x
    const open: Node[] = []
    const best = new Map<number, number>()
    const closed = new Set<number>()
    const h = (x: number, y: number) => {
      const dx = Math.abs(x - gx)
      const dy = Math.abs(y - gy)
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
    }
    open.push({ x: sx, y: sy, g: 0, f: h(sx, sy), parent: null })
    best.set(key(sx, sy), 0)
    const maxNodes = opts.maxNodes ?? 6000
    let expanded = 0
    while (open.length) {
      let bi = 0
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i
      const cur = open.splice(bi, 1)[0]
      const ck = key(cur.x, cur.y)
      if (closed.has(ck)) continue
      closed.add(ck)
      if (cur.x === gx && cur.y === gy) {
        const path: Vec2[] = []
        let n: Node | null = cur
        while (n && n.parent) {
          path.push([n.x, n.y])
          n = n.parent
        }
        return path.reverse()
      }
      if (++expanded > maxNodes) break
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const nx = cur.x + dx
          const ny = cur.y + dy
          if (!this.canStep(cur.x, cur.y, nx, ny, opts.ignoreDynamic)) continue
          if (dx && dy) {
            // no corner cutting
            if (!this.canStep(cur.x, cur.y, cur.x + dx, cur.y, opts.ignoreDynamic)) continue
            if (!this.canStep(cur.x, cur.y, cur.x, cur.y + dy, opts.ignoreDynamic)) continue
          }
          const nk = key(nx, ny)
          if (closed.has(nk)) continue
          const g = cur.g + (dx && dy ? Math.SQRT2 : 1)
          if (g >= (best.get(nk) ?? Infinity)) continue
          best.set(nk, g)
          open.push({ x: nx, y: ny, g, f: g + h(nx, ny), parent: cur })
        }
      }
    }
    return null
  }

  nearestWalkable(x: number, y: number, radius = 4, ignoreDynamic = false): Vec2 | null {
    for (let r = 0; r <= radius; r++) {
      let best: Vec2 | null = null
      let bestD = Infinity
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          if (this.walkable(x + dx, y + dy, ignoreDynamic)) {
            const d = dx * dx + dy * dy
            if (d < bestD) {
              bestD = d
              best = [x + dx, y + dy]
            }
          }
        }
      }
      if (best) return best
    }
    return null
  }

  /** True when no wall blocks the straight line between two grid points. */
  lineOfSight(ax: number, ay: number, bx: number, by: number): boolean {
    const dist = Math.hypot(bx - ax, by - ay)
    const steps = Math.ceil(dist * 3)
    const eyeA = (this.cell(Math.round(ax), Math.round(ay))?.h ?? 0) + 2
    const eyeB = (this.cell(Math.round(bx), Math.round(by))?.h ?? 0) + 2
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const x = Math.round(ax + (bx - ax) * t)
      const y = Math.round(ay + (by - ay) * t)
      const c = this.cell(x, y)
      if (!c) continue
      if (c.wall && c.wallH > 1.2) return false
      const eye = eyeA + (eyeB - eyeA) * t
      if (c.h > eye) return false
      if (c.spec.prop && typeof c.spec.prop !== 'string' && c.spec.prop.params?.blocksSight) return false
    }
    return true
  }
}
