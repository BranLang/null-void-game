/**
 * FLOW: the Water Spira routing puzzle. Yera "leads water" through roots,
 * veins and old stone channels: rotate the tiles until glowing water runs from
 * the glyph (source) into every target.
 *
 * params: { level?: 'tree' | 'lungs' | 'wound' | 'canal' }   (default 'tree')
 * result: { success: true, score: 0..1 (moves compared with the shortest solution), data: { moves, par } }
 *         skipped: { success: true, score: 0, data: { skipped: true } }
 *
 * Every layout is stored in its SOLVED orientation and scrambled with a seeded
 * PRNG, so each level always starts the same way and is guaranteed solvable.
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import { l, type L } from '../../i18n/i18n'

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

type LevelId = 'tree' | 'lungs' | 'wound' | 'canal'
type ThemeId = 'roots' | 'veins' | 'flesh' | 'stone'
type Kind = 'pipe' | 'empty' | 'block' | 'source' | 'target'
type RGB = readonly [number, number, number]

interface LevelDef {
  title: L
  subtitle: L
  done: L
  /** Solved layout: box-drawing pipes, '.' empty soil, '#' blocked, 'S' source, 'A'..'C' targets. */
  grid: readonly string[]
  targets: readonly L[]
  seed: number
  theme: ThemeId
}

const LEVELS: Record<LevelId, LevelDef> = {
  tree: {
    title: l('Korene', 'The Roots'),
    subtitle: l(
      'Strom si pamätá každú kvapku. Jeden koreň leží rozdrvený pod kameňom — voda musí k temnej vetve nájsť inú cestu.',
      'The tree remembers every drop. One root lies crushed beneath a stone — the water must find another way to the dark branch.',
    ),
    done: l('Temná vetva sa napila. Strom si vydýchol.', 'The dark branch drinks. The tree breathes out.'),
    grid: ['.┐─┘┌A', '┘┌──┘┐', '.│#┐│.', '┌└┐└┘.', '.│S└..'],
    targets: [l('Temná vetva', 'The dark branch')],
    seed: 7,
    theme: 'roots',
  },
  lungs: {
    title: l('Pľúca', 'The Lungs'),
    subtitle: l('Vyveď vodu tou istou cestou, ktorou prišla. Pomaly.', 'Lead the water out the same way it came in. Slowly.'),
    done: l('Voda odchádza tou istou cestou, ktorou prišla. Hrudník sa zdvihne.', 'The water leaves the way it came. The chest rises.'),
    grid: ['┌┐S┌─┐', '│┌┴─┐┘', '┤│┬─││', '┌┘┐#└┐', '└A└┘B┘', '──┘┌┐│'],
    targets: [l('Ľavé pľúco', 'Left lung'), l('Pravé pľúco', 'Right lung')],
    seed: 21,
    theme: 'veins',
  },
  wound: {
    title: l('Rana', 'The Wound'),
    subtitle: l('Voda pozná cestu do tela. Stačí jej ju ukázať.', 'Water knows the way into a body. You only have to show it.'),
    done: l('Rana sa zaceľuje pod chladným svetlom.', 'The wound closes beneath the cool light.'),
    grid: ['└┌─┐', 'S┘#│', '─┌─┘', '┐A.│'],
    targets: [l('Rana', 'The wound')],
    seed: 3,
    theme: 'flesh',
  },
  canal: {
    title: l('Kanál', 'The Canal'),
    subtitle: l(
      'Staré kamenné žľaby si ešte pamätajú, kade kedysi tiekla voda.',
      'The old stone channels still remember where the water once ran.',
    ),
    done: l('Staré žľaby sa znova rozospievali.', 'The old channels sing again.'),
    grid: ['┌─┬┐┌─A', '└┼┌─┤#┌', 'S─┘#│┐#', '┐┴│┌└┐┘', '─┘#└─└B'],
    targets: [l('Horná nádrž', 'Upper basin'), l('Dolná nádrž', 'Lower basin')],
    seed: 11,
    theme: 'stone',
  },
}

interface ThemeDef {
  outer: string
  body: string
  groove: string
  light: string
  detail: string
  cellA: string
  cellB: string
  decor: 'roots' | 'capillaries' | 'chips'
  block: 'crushed' | 'heart' | 'clot' | 'rubble'
  emblem: 'branch' | 'lung' | 'wound' | 'basin'
  mote: RGB
}

const THEMES: Record<ThemeId, ThemeDef> = {
  roots: {
    outer: '#120b07',
    body: '#3e2a1b',
    groove: '#1d130c',
    light: 'rgba(170,124,82,0.55)',
    detail: '#2c1d13',
    cellA: 'rgba(34,26,20,0.62)',
    cellB: 'rgba(14,11,9,0.72)',
    decor: 'roots',
    block: 'crushed',
    emblem: 'branch',
    mote: [150, 230, 170],
  },
  veins: {
    outer: '#1a070d',
    body: '#4c1828',
    groove: '#230a12',
    light: 'rgba(200,96,120,0.45)',
    detail: '#3a1020',
    cellA: 'rgba(42,16,26,0.58)',
    cellB: 'rgba(16,6,10,0.72)',
    decor: 'capillaries',
    block: 'heart',
    emblem: 'lung',
    mote: [140, 220, 255],
  },
  flesh: {
    outer: '#1c0b0a',
    body: '#5a2620',
    groove: '#2a100d',
    light: 'rgba(214,130,104,0.45)',
    detail: '#43181a',
    cellA: 'rgba(48,24,20,0.58)',
    cellB: 'rgba(20,10,9,0.72)',
    decor: 'capillaries',
    block: 'clot',
    emblem: 'wound',
    mote: [255, 200, 170],
  },
  stone: {
    outer: '#0b0d10',
    body: '#353b44',
    groove: '#0f1215',
    light: 'rgba(170,184,200,0.45)',
    detail: '#1b1f25',
    cellA: 'rgba(40,46,54,0.62)',
    cellB: 'rgba(14,17,21,0.75)',
    decor: 'chips',
    block: 'rubble',
    emblem: 'basin',
    mote: [170, 220, 255],
  },
}

const TEXT = {
  hint: l(
    'Otáčaj dieliky, kým voda nedotečie do cieľa. Klik alebo Enter otočí dielik, pravý klik alebo Q späť; kurzor posúvaš šípkami.',
    'Turn the tiles until the water reaches its goal. Click or Enter turns a tile, right-click or Q turns it back; arrow keys move the cursor.',
  ),
  moves: l('Ťahy: {n}', 'Moves: {n}'),
  reset: l('Začať odznova', 'Start over'),
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const W = 760
const H = 480
const BIT = [1, 2, 4, 8] // N E S W
const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]
const CHAR_MASK: Record<string, number> = {
  '─': 10,
  '│': 5,
  '┌': 6,
  '┐': 12,
  '└': 3,
  '┘': 9,
  '├': 7,
  '┤': 13,
  '┬': 14,
  '┴': 11,
  '┼': 15,
}
const FILL_SPEED = 4.4
const DRAIN_SPEED = 3.2

const opp = (d: number): number => (d + 2) % 4
const mod4 = (n: number): number => ((n % 4) + 4) % 4
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
const easeOutBack = (t: number): number => {
  const c1 = 1.6
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function rotMask(m: number, k: number): number {
  let r = m
  for (let i = 0; i < mod4(k); i++) r = ((r << 1) | (r >> 3)) & 15
  return r
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rgba = (c: RGB, a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
]

const AQUA: RGB = [95, 242, 224]
const AQUA_CORE: RGB = [214, 255, 250]

const glowCache = new Map<string, HTMLCanvasElement>()
function glowSprite(c: RGB): HTMLCanvasElement {
  const key = c.join(',')
  const hit = glowCache.get(key)
  if (hit) return hit
  const s = document.createElement('canvas')
  s.width = s.height = 128
  const g = s.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, rgba(c, 1))
  grd.addColorStop(0.18, rgba(c, 0.6))
  grd.addColorStop(0.45, rgba(c, 0.18))
  grd.addColorStop(1, rgba(c, 0))
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  glowCache.set(key, s)
  return s
}

function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number): void {
  if (a <= 0.003 || r <= 0) return
  const prevOp = g.globalCompositeOperation
  const prevA = g.globalAlpha
  g.globalCompositeOperation = 'lighter'
  g.globalAlpha = Math.min(1, a)
  g.drawImage(glowSprite(c), x - r, y - r, r * 2, r * 2)
  g.globalAlpha = prevA
  g.globalCompositeOperation = prevOp
}

function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

/** Keeps the canvas inside small windows (CSS scale only; drawing stays in W x H units). */
function makeFitter(canvas: HTMLCanvasElement, card: HTMLElement, w: number, h: number): (force?: boolean) => void {
  let lw = -1
  let lh = -1
  let last = 0
  return (force = false) => {
    const iw = window.innerWidth
    const ih = window.innerHeight
    const now = performance.now()
    if (!force && iw === lw && ih === lh && now - last < 500) return
    lw = iw
    lh = ih
    last = now
    const other = card.scrollHeight - canvas.getBoundingClientRect().height
    const s = Math.max(0.3, Math.min(1, (Math.min(iw * 0.94, 960) - 56) / w, (ih * 0.92 - other - 8) / h))
    const cw = `${Math.round(w * s)}px`
    const ch = `${Math.round(h * s)}px`
    if (canvas.style.width !== cw) canvas.style.width = cw
    if (canvas.style.height !== ch) canvas.style.height = ch
  }
}

// ---------------------------------------------------------------------------
// Routes: sampled polylines (local tile space, solved orientation)
// ---------------------------------------------------------------------------

interface Route {
  pts: number[]
  cum: number[]
  total: number
  /** start: direction index, or -1 for the tile centre */
  a: number
  /** end: direction index */
  b: number
  /** offset polyline used for the bark/stone highlight */
  hl: number[]
}

function makeRoute(fn: (t: number) => [number, number], a: number, b: number, hlOffset: number, samples = 16): Route {
  const pts: number[] = []
  const cum: number[] = [0]
  for (let i = 0; i <= samples; i++) {
    const [x, y] = fn(i / samples)
    pts.push(x, y)
    if (i > 0) cum.push(cum[i - 1] + Math.hypot(x - pts[(i - 1) * 2], y - pts[(i - 1) * 2 + 1]))
  }
  const hl: number[] = []
  const n = samples + 1
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1)
    const i1 = Math.min(n - 1, i + 1)
    const dx = pts[i1 * 2] - pts[i0 * 2]
    const dy = pts[i1 * 2 + 1] - pts[i0 * 2 + 1]
    const len = Math.hypot(dx, dy) || 1
    hl.push(pts[i * 2] - (dy / len) * hlOffset, pts[i * 2 + 1] + (dx / len) * hlOffset)
  }
  return { pts, cum, total: cum[cum.length - 1], a, b, hl }
}

function buildRoutes(kind: Kind, mask: number, cell: number, rnd: () => number): Route[] {
  const h = cell / 2
  const dirs = [0, 1, 2, 3].filter((d) => mask & BIT[d])
  const hlOff = cell * 0.07
  if (kind === 'pipe' && dirs.length === 2) {
    const [a, b] = dirs
    const ax = DX[a] * h
    const ay = DY[a] * h
    const bx = DX[b] * h
    const by = DY[b] * h
    const straight = opp(a) === b
    const wob = (rnd() - 0.5) * cell * (straight ? 0.14 : 0.08)
    const nx0 = -(by - ay)
    const ny0 = bx - ax
    const nl = Math.hypot(nx0, ny0) || 1
    return [
      makeRoute(
        (t) => {
          let x: number
          let y: number
          if (straight) {
            x = lerp(ax, bx, t)
            y = lerp(ay, by, t)
          } else {
            const u = 1 - t
            x = u * u * ax + t * t * bx
            y = u * u * ay + t * t * by
          }
          const s = Math.pow(Math.sin(Math.PI * t), 2) * wob
          return [x + (nx0 / nl) * s, y + (ny0 / nl) * s]
        },
        a,
        b,
        hlOff,
      ),
    ]
  }
  return dirs.map((d) => {
    const ex = DX[d] * h
    const ey = DY[d] * h
    const wob = (rnd() - 0.5) * cell * 0.08
    return makeRoute(
      (t) => {
        const s = Math.pow(Math.sin(Math.PI * t), 2) * wob
        return [ex * t + (-ey / h) * s, ey * t + (ex / h) * s]
      },
      -1,
      d,
      hlOff,
      10,
    )
  })
}

/** Adds the part [f0, f1] (fractions of length, in flow direction) of a route to the current path. Returns the head point. */
function tracePartial(g: CanvasRenderingContext2D, r: Route, f0: number, f1: number, reverse: boolean, pts = r.pts): [number, number] {
  const L = r.total
  let s0 = f0 * L
  let s1 = f1 * L
  if (reverse) {
    const t0 = L - s1
    s1 = L - s0
    s0 = t0
  }
  let started = false
  let hx = 0
  let hy = 0
  let fx = 0
  let fy = 0
  for (let i = 0; i < r.cum.length - 1; i++) {
    const c0 = r.cum[i]
    const c1 = r.cum[i + 1]
    if (c1 < s0 || c0 > s1) continue
    const x0 = pts[i * 2]
    const y0 = pts[i * 2 + 1]
    const x1 = pts[i * 2 + 2]
    const y1 = pts[i * 2 + 3]
    const seg = c1 - c0 || 1
    const ta = Math.max(0, (s0 - c0) / seg)
    const tb = Math.min(1, (s1 - c0) / seg)
    if (!started) {
      fx = lerp(x0, x1, ta)
      fy = lerp(y0, y1, ta)
      g.moveTo(fx, fy)
      started = true
    }
    hx = lerp(x0, x1, tb)
    hy = lerp(y0, y1, tb)
    g.lineTo(hx, hy)
  }
  return reverse ? [fx, fy] : [hx, hy]
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

interface Cell {
  x: number
  y: number
  kind: Kind
  base: number
  turns: number
  angle: number
  tw: { from: number; to: number; t: number } | null
  fill: number
  entry: number
  flowEntry: number
  connected: boolean
  parent: Cell | null
  onPath: boolean
  target: number
  ripple: number
  bloom: number
  shake: number
  routes: Route[]
  decor: number[]
  specks: number[]
  seed: number
}

interface Board {
  cols: number
  rows: number
  cells: Cell[]
  source: Cell
  targets: Cell[]
  initTurns: number[]
}

function cellAt(b: Board, x: number, y: number): Cell | null {
  if (x < 0 || y < 0 || x >= b.cols || y >= b.rows) return null
  return b.cells[y * b.cols + x]
}

const worldMask = (c: Cell): number => (c.kind === 'pipe' ? rotMask(c.base, c.turns) : c.kind === 'source' || c.kind === 'target' ? c.base : 0)

/** BFS from the source through settled, mutually open channels. Returns cells in flow order. */
function computeFlow(b: Board): Cell[] {
  for (const c of b.cells) {
    c.connected = false
    c.parent = null
  }
  const order: Cell[] = [b.source]
  b.source.connected = true
  for (let i = 0; i < order.length; i++) {
    const c = order[i]
    if (c.tw || c.kind === 'target') continue
    const m = worldMask(c)
    for (let d = 0; d < 4; d++) {
      if (!(m & BIT[d])) continue
      const n = cellAt(b, c.x + DX[d], c.y + DY[d])
      if (!n || n.connected || n.tw) continue
      if (!(worldMask(n) & BIT[opp(d)])) continue
      n.connected = true
      n.parent = c
      n.entry = opp(d)
      order.push(n)
    }
  }
  return order
}

/** Clockwise clicks from the current turns to an orientation equivalent to the solved one. */
function clicksCW(c: Cell): number {
  let best = 4
  for (let k = 0; k < 4; k++) if (rotMask(c.base, k) === c.base) best = Math.min(best, mod4(k - c.turns))
  return best
}

function buildBoard(def: LevelDef, cell: number): Board {
  const rows = def.grid.length
  const cols = Array.from(def.grid[0]).length
  const cells: Cell[] = []
  const rnd = mulberry32(def.seed * 7919 + 13)
  let source: Cell | null = null
  const targets: Cell[] = []
  for (let y = 0; y < rows; y++) {
    const chars = Array.from(def.grid[y])
    for (let x = 0; x < cols; x++) {
      const ch = chars[x] ?? '.'
      let kind: Kind = 'empty'
      let base = 0
      let target = -1
      if (ch in CHAR_MASK) {
        kind = 'pipe'
        base = CHAR_MASK[ch]
      } else if (ch === '#') kind = 'block'
      else if (ch === 'S') kind = 'source'
      else if (ch >= 'A' && ch <= 'C') {
        kind = 'target'
        target = ch.charCodeAt(0) - 65
      }
      const c: Cell = {
        x,
        y,
        kind,
        base,
        turns: 0,
        angle: 0,
        tw: null,
        fill: 0,
        entry: -1,
        flowEntry: -1,
        connected: false,
        parent: null,
        onPath: false,
        target,
        ripple: 0,
        bloom: 0,
        shake: 0,
        routes: [],
        decor: [],
        specks: [],
        seed: Math.floor(rnd() * 1e9),
      }
      cells.push(c)
      if (kind === 'source') source = c
      if (kind === 'target') targets[target] = c
    }
  }
  if (!source) throw new Error('flow: level without source')
  const board: Board = { cols, rows, cells, source, targets, initTurns: [] }
  // openings of the source and targets come from their solved neighbours
  for (const c of [source, ...targets]) {
    for (let d = 0; d < 4; d++) {
      const n = cellAt(board, c.x + DX[d], c.y + DY[d])
      if (n && n.kind === 'pipe' && n.base & BIT[opp(d)]) c.base |= BIT[d]
    }
  }
  // intended route = BFS tree in the solved state
  computeFlow(board)
  for (const t of targets) {
    let p = t.parent
    while (p && p.kind === 'pipe') {
      p.onPath = true
      p = p.parent
    }
  }
  if (import.meta.env.DEV) {
    if (targets.some((t) => !t.connected)) console.error('[flow] level is not solvable in its stored orientation')
    if (targets.some((t) => [0, 1, 2, 3].filter((d) => t.base & BIT[d]).length !== 1)) console.error('[flow] a target must have exactly one opening')
  }
  // decoration
  for (const c of cells) {
    const r = mulberry32(c.seed)
    c.routes = c.kind === 'pipe' || c.kind === 'source' || c.kind === 'target' ? buildRoutes(c.kind, c.base, cell, r) : []
    for (const rt of c.routes) {
      const n = c.kind === 'pipe' ? 2 + Math.floor(r() * 3) : 1
      for (let i = 0; i < n; i++) {
        const t = 0.2 + r() * 0.6
        const idx = Math.min(rt.pts.length / 2 - 2, Math.floor(t * (rt.pts.length / 2 - 1)))
        const px = rt.pts[idx * 2]
        const py = rt.pts[idx * 2 + 1]
        const dx = rt.pts[idx * 2 + 2] - px
        const dy = rt.pts[idx * 2 + 3] - py
        const len = Math.hypot(dx, dy) || 1
        const side = r() < 0.5 ? -1 : 1
        const nx = (-dy / len) * side
        const ny = (dx / len) * side
        const along = (r() - 0.3) * 0.9
        const ox = px + nx * cell * 0.13
        const oy = py + ny * cell * 0.13
        const hl = cell * (0.07 + r() * 0.1)
        c.decor.push(ox, oy, ox + (nx + (dx / len) * along) * hl, oy + (ny + (dy / len) * along) * hl)
      }
    }
    const ns = 4 + Math.floor(r() * 5)
    for (let i = 0; i < ns; i++) c.specks.push((r() - 0.5) * cell * 0.8, (r() - 0.5) * cell * 0.8, 0.8 + r() * 2.4, r())
  }
  // deterministic scramble; retry until no target is already watered
  let seed = def.seed
  for (let attempt = 0; attempt < 50; attempt++) {
    const sr = mulberry32(seed)
    for (const c of cells) {
      if (c.kind !== 'pipe') continue
      const sym180 = rotMask(c.base, 2) === c.base
      const sym90 = rotMask(c.base, 1) === c.base
      if (sym90) c.turns = 0
      else if (c.onPath) c.turns = sym180 ? (sr() < 0.5 ? 1 : 3) : 1 + Math.floor(sr() * 3)
      else c.turns = Math.floor(sr() * 4)
      c.angle = (c.turns * Math.PI) / 2
    }
    computeFlow(board)
    if (!targets.some((t) => t.connected)) break
    seed += 101
  }
  board.initTurns = cells.map((c) => c.turns)
  return board
}

// ---------------------------------------------------------------------------
// Background art (painted once per level)
// ---------------------------------------------------------------------------

interface Layout {
  gx: number
  gy: number
  cell: number
  cols: number
  rows: number
  sx: number
  sy: number
  tx: number[]
  ty: number[]
}

function taper(g: CanvasRenderingContext2D, pts: number[], w0: number, w1: number): void {
  const n = pts.length / 2
  const left: number[] = []
  const right: number[] = []
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1)
    const i1 = Math.min(n - 1, i + 1)
    const dx = pts[i1 * 2] - pts[i0 * 2]
    const dy = pts[i1 * 2 + 1] - pts[i0 * 2 + 1]
    const len = Math.hypot(dx, dy) || 1
    const w = lerp(w0, w1, i / (n - 1)) / 2
    left.push(pts[i * 2] - (dy / len) * w, pts[i * 2 + 1] + (dx / len) * w)
    right.push(pts[i * 2] + (dy / len) * w, pts[i * 2 + 1] - (dx / len) * w)
  }
  g.beginPath()
  g.moveTo(left[0], left[1])
  for (let i = 1; i < n; i++) g.lineTo(left[i * 2], left[i * 2 + 1])
  for (let i = n - 1; i >= 0; i--) g.lineTo(right[i * 2], right[i * 2 + 1])
  g.closePath()
  g.fill()
}

function quadPts(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n = 14): number[] {
  const out: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    out.push(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1)
  }
  return out
}

function treeBranch(g: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, w: number, depth: number, r: () => number): void {
  const x1 = x + Math.cos(ang) * len
  const y1 = y + Math.sin(ang) * len
  const bend = (r() - 0.5) * len * 0.35
  const cx = (x + x1) / 2 + Math.cos(ang + Math.PI / 2) * bend
  const cy = (y + y1) / 2 + Math.sin(ang + Math.PI / 2) * bend
  taper(g, quadPts(x, y, cx, cy, x1, y1, 10), w, w * 0.62)
  if (depth <= 0) return
  const spread = 0.35 + r() * 0.35
  treeBranch(g, x1, y1, ang - spread, len * (0.66 + r() * 0.14), w * 0.62, depth - 1, r)
  treeBranch(g, x1, y1, ang + spread * (0.8 + r() * 0.4), len * (0.66 + r() * 0.14), w * 0.62, depth - 1, r)
}

function vignette(g: CanvasRenderingContext2D, strength: number): void {
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, `rgba(0,0,0,${strength})`)
  g.fillStyle = v
  g.fillRect(0, 0, W, H)
}

function lobePath(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, mirror: boolean): void {
  // drawn as the LEFT lobe (inner edge at x1); mirrored horizontally for the right lobe
  const w = x1 - x0
  const h = y1 - y0
  const X = (fx: number): number => (mirror ? x1 - fx * w : x0 + fx * w)
  const Y = (fy: number): number => y0 + fy * h
  g.beginPath()
  g.moveTo(X(0.78), Y(0))
  g.bezierCurveTo(X(0.38), Y(-0.02), X(0.04), Y(0.28), X(0.02), Y(0.66))
  g.bezierCurveTo(X(0), Y(0.92), X(0.22), Y(1), X(0.5), Y(1))
  g.bezierCurveTo(X(0.75), Y(1), X(1.02), Y(0.99), X(1), Y(0.9))
  g.bezierCurveTo(X(0.7), Y(0.68), X(0.98), Y(0.36), X(0.78), Y(0))
  g.closePath()
}

function paintBackground(g: CanvasRenderingContext2D, level: LevelId, L: Layout): void {
  const r = mulberry32(level.length * 977 + 5)
  const gw = L.cols * L.cell
  const gh = L.rows * L.cell
  if (level === 'tree') {
    const grd = g.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, '#0c1813')
    grd.addColorStop(0.55, '#0c100c')
    grd.addColorStop(1, '#150e09')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
    // light shafts
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 150 + r() * 60
      const w = 30 + r() * 60
      const sh = g.createLinearGradient(0, 0, 0, H)
      sh.addColorStop(0, 'rgba(140,220,180,0.06)')
      sh.addColorStop(1, 'rgba(140,220,180,0)')
      g.fillStyle = sh
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x + w, 0)
      g.lineTo(x + w - 160, H)
      g.lineTo(x - 160 - w * 0.4, H)
      g.closePath()
      g.fill()
    }
    g.globalCompositeOperation = 'source-over'
    // tree silhouette rising behind the veins
    g.fillStyle = 'rgba(6,5,4,0.92)'
    const tr = mulberry32(42)
    taper(g, quadPts(L.sx + 6, H + 30, L.sx - 26, L.gy + gh * 0.7, L.sx - 4, L.gy + gh * 0.32), 130, 70)
    treeBranch(g, L.sx - 4, L.gy + gh * 0.34, -Math.PI / 2 - 0.55, 150, 62, 4, tr)
    treeBranch(g, L.sx - 4, L.gy + gh * 0.34, -Math.PI / 2 + 0.4, 160, 58, 4, tr)
    treeBranch(g, L.sx - 10, L.gy + gh * 0.55, Math.PI + 0.25, 190, 40, 3, tr)
    treeBranch(g, L.sx, L.gy + gh * 0.6, -0.25, 200, 38, 3, tr)
    // roots spreading in the soil
    for (const a of [-0.25, 0.15, Math.PI + 0.2, Math.PI - 0.15]) treeBranch(g, L.sx, H - 6, a, 150, 30, 2, tr)
    // the dark branch leaving the grid at the target
    const tx = L.gx + gw - 4
    const ty = L.ty[0]
    g.fillStyle = '#2a2232'
    taper(g, quadPts(tx, ty, tx + 60, ty - 6, W - 6, ty - 50), 22, 7)
    taper(g, quadPts(tx + 44, ty - 2, tx + 64, ty + 24, tx + 92, ty + 40), 9, 3)
    taper(g, quadPts(tx + 80, ty - 14, tx + 96, ty - 40, tx + 92, Math.max(4, ty - 62)), 8, 3)
    vignette(g, 0.6)
  } else if (level === 'lungs') {
    const grd = g.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, '#16080d')
    grd.addColorStop(1, '#070305')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
    // faint ribs
    g.strokeStyle = 'rgba(200,150,160,0.05)'
    g.lineWidth = 10
    for (let i = 0; i < 6; i++) {
      const y = L.gy + 40 + i * 70
      g.beginPath()
      g.moveTo(W / 2 - 20, y - 20)
      g.quadraticCurveTo(W * 0.12, y - 30, 16, y + 60)
      g.stroke()
      g.beginPath()
      g.moveTo(W / 2 + 20, y - 20)
      g.quadraticCurveTo(W * 0.88, y - 30, W - 16, y + 60)
      g.stroke()
    }
    // lobes
    const mid = L.sx
    const lobes: [number, number, number, number, boolean][] = [
      [L.gx - 48, L.gy + 22, mid - 14, L.gy + gh + 12, false],
      [mid + 14, L.gy + 22, L.gx + gw + 48, L.gy + gh + 12, true],
    ]
    for (const [x0, y0, x1, y1, mir] of lobes) {
      lobePath(g, x0, y0, x1, y1, mir)
      const lg = g.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, 10, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.8)
      lg.addColorStop(0, 'rgba(120,34,56,0.42)')
      lg.addColorStop(1, 'rgba(60,14,28,0.22)')
      g.fillStyle = lg
      g.fill()
      g.strokeStyle = 'rgba(230,140,160,0.18)'
      g.lineWidth = 2
      g.stroke()
      g.save()
      g.clip()
      for (let i = 0; i < 140; i++) {
        const ax = lerp(x0, x1, r())
        const ay = lerp(y0, y1, r())
        g.fillStyle = `rgba(${170 + r() * 60},70,90,${0.05 + r() * 0.08})`
        g.beginPath()
        g.arc(ax, ay, 3 + r() * 8, 0, Math.PI * 2)
        g.fill()
      }
      g.restore()
    }
    // trachea
    const tw = L.cell * 0.36
    g.fillStyle = '#3a1420'
    g.fillRect(mid - tw / 2, -2, tw, L.gy + 6)
    g.strokeStyle = 'rgba(230,160,170,0.22)'
    g.lineWidth = 2
    for (let y = 4; y < L.gy; y += 7) {
      g.beginPath()
      g.moveTo(mid - tw / 2, y)
      g.quadraticCurveTo(mid, y + 3, mid + tw / 2, y)
      g.stroke()
    }
    vignette(g, 0.65)
  } else if (level === 'wound') {
    const grd = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.6)
    grd.addColorStop(0, '#2e1915')
    grd.addColorStop(1, '#100807')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
    // vein network
    g.strokeStyle = 'rgba(150,40,40,0.18)'
    const vr = mulberry32(9)
    const vein = (x: number, y: number, ang: number, len: number, w: number, depth: number): void => {
      const x1 = x + Math.cos(ang) * len
      const y1 = y + Math.sin(ang) * len
      g.lineWidth = w
      g.beginPath()
      g.moveTo(x, y)
      g.quadraticCurveTo((x + x1) / 2 + (vr() - 0.5) * len * 0.5, (y + y1) / 2 + (vr() - 0.5) * len * 0.5, x1, y1)
      g.stroke()
      if (depth > 0) {
        vein(x1, y1, ang - 0.3 - vr() * 0.5, len * 0.7, w * 0.7, depth - 1)
        vein(x1, y1, ang + 0.3 + vr() * 0.5, len * 0.7, w * 0.7, depth - 1)
      }
    }
    for (let i = 0; i < 7; i++) vein(vr() * W, vr() < 0.5 ? -10 : H + 10, vr() * Math.PI * 2, 90 + vr() * 60, 4, 4)
    // Yera's glowing forearm tattoo leading into the glyph
    g.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = `rgba(95,242,224,${0.22 - k * 0.05})`
      g.lineWidth = 2.2 - k * 0.5
      g.beginPath()
      const off = (k - 1) * 16
      g.moveTo(0, L.sy + off * 1.6)
      g.bezierCurveTo(L.gx * 0.35, L.sy + off * 2 - 20, L.gx * 0.65, L.sy + off + 18, L.gx - 4, L.sy + off * 0.35)
      g.stroke()
    }
    for (let i = 0; i < 9; i++) {
      const x = 14 + i * ((L.gx - 30) / 8)
      g.fillStyle = 'rgba(95,242,224,0.35)'
      g.beginPath()
      g.arc(x, L.sy + Math.sin(i * 1.3) * 10, 1.6, 0, Math.PI * 2)
      g.fill()
    }
    g.globalCompositeOperation = 'source-over'
    vignette(g, 0.6)
  } else {
    const grd = g.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, '#111820')
    grd.addColorStop(1, '#080b0f')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
    // stone slabs
    const sh = 46
    for (let row = 0; row * sh < H; row++) {
      let x = row % 2 ? -40 : -10
      while (x < W) {
        const w = 70 + r() * 70
        const v = 26 + r() * 14
        g.fillStyle = `rgb(${v},${v + 4},${v + 10})`
        g.fillRect(x + 2, row * sh + 2, w - 4, sh - 4)
        g.fillStyle = 'rgba(255,255,255,0.035)'
        g.fillRect(x + 2, row * sh + 2, w - 4, 3)
        if (r() < 0.3) {
          g.fillStyle = 'rgba(80,120,70,0.16)'
          g.beginPath()
          g.ellipse(x + r() * w, row * sh + sh - 6, 14 + r() * 18, 4, 0, 0, Math.PI * 2)
          g.fill()
        }
        x += w
      }
    }
    // dry channels leaving the basins / feeding the spring
    g.fillStyle = '#07090c'
    const cw = L.cell * 0.3
    g.fillRect(0, L.sy - cw / 2, L.gx + 4, cw)
    for (let i = 0; i < L.tx.length; i++) g.fillRect(L.gx + gw - 4, L.ty[i] - cw / 2, W - (L.gx + gw - 4), cw)
    g.strokeStyle = 'rgba(180,200,220,0.12)'
    g.lineWidth = 1.5
    g.strokeRect(-2, L.sy - cw / 2, L.gx + 6, cw)
    for (let i = 0; i < L.tx.length; i++) g.strokeRect(L.gx + gw - 4, L.ty[i] - cw / 2, W, cw)
    vignette(g, 0.55)
  }
}

// ---------------------------------------------------------------------------
// The minigame
// ---------------------------------------------------------------------------

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: RGB
}

function isLevel(v: unknown): v is LevelId {
  return v === 'tree' || v === 'lungs' || v === 'wound' || v === 'canal'
}

function runFlow(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const levelId: LevelId = isLevel(params.level) ? params.level : 'tree'
  const def = LEVELS[levelId]
  const theme = THEMES[def.theme]
  const rm = ctx.assist.reducedMotion
  const rows = def.grid.length
  const cols = Array.from(def.grid[0]).length
  const cell = Math.floor(Math.min(88, (W - 160) / cols, (H - 56) / rows))
  const gx = Math.round((W - cols * cell) / 2)
  const gy = Math.round((H - rows * cell) / 2)
  const board = buildBoard(def, cell)
  const center = (c: Cell): [number, number] => [gx + (c.x + 0.5) * cell, gy + (c.y + 0.5) * cell]
  const layout: Layout = {
    gx,
    gy,
    cell,
    cols,
    rows,
    sx: center(board.source)[0],
    sy: center(board.source)[1],
    tx: board.targets.map((t) => center(t)[0]),
    ty: board.targets.map((t) => center(t)[1]),
  }
  const par = Math.max(1, board.cells.filter((c) => c.kind === 'pipe' && c.onPath).reduce((s, c) => s + clicksCW(c), 0))

  return new Promise<MinigameResult>((resolve) => {
    const card = createCard(ctx, def.title, def.subtitle)
    card.hint.textContent = ctx.t(TEXT.hint)
    card.buttons.style.minHeight = '44px'
    const { canvas, ctx: g } = hiDpiCanvas(W, H)
    const dpr = canvas.width / W
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'pointer'
    canvas.setAttribute('aria-label', ctx.t(def.title))
    card.body.appendChild(canvas)

    // status row: targets + moves
    const status = document.createElement('div')
    status.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:10px;font-family:var(--nv-font-body);font-size:15px;color:var(--nv-text-dim)'
    const chips = def.targets.map((name) => {
      const s = document.createElement('span')
      s.textContent = `◇ ${ctx.t(name)}`
      s.style.cssText = 'padding:2px 12px;border-radius:999px;border:1px solid rgba(95,242,224,0.22);transition:all .35s;letter-spacing:.02em'
      status.appendChild(s)
      return s
    })
    const movesEl = document.createElement('span')
    movesEl.style.cssText = 'margin-left:6px;font-family:var(--nv-font-title);font-size:13px;letter-spacing:.12em;color:var(--nv-gold)'
    status.appendChild(movesEl)
    card.body.appendChild(status)

    const fit = makeFitter(canvas, card.card, W, H)

    // pre-painted layers
    const bg = document.createElement('canvas')
    bg.width = canvas.width
    bg.height = canvas.height
    const bgc = bg.getContext('2d')!
    bgc.scale(dpr, dpr)
    paintBackground(bgc, levelId, layout)

    const cellSprite = document.createElement('canvas')
    cellSprite.width = cellSprite.height = Math.ceil(cell * dpr)
    {
      const cs = cellSprite.getContext('2d')!
      cs.scale(dpr, dpr)
      roundRectPath(cs, 2, 2, cell - 4, cell - 4, cell * 0.14)
      const cg = cs.createLinearGradient(0, 0, 0, cell)
      cg.addColorStop(0, theme.cellA)
      cg.addColorStop(1, theme.cellB)
      cs.fillStyle = cg
      cs.fill()
      cs.strokeStyle = 'rgba(214,178,106,0.13)'
      cs.lineWidth = 1
      cs.stroke()
      roundRectPath(cs, 3.5, 3.5, cell - 7, cell - 7, cell * 0.12)
      cs.strokeStyle = 'rgba(255,255,255,0.025)'
      cs.stroke()
    }

    // state
    let moves = 0
    let resets = 0
    let elapsed = 0
    let solved = false
    let winT = 0
    let doneShown = false
    let score = 0
    let hover: Cell | null = null
    let kbd = false
    let cur = { x: Math.min(cols - 1, board.source.x + 1), y: board.source.y }
    let lastConnected = 1
    let waterCd = 0
    let flash = 0
    let shakeT = 0
    const reached = board.targets.map(() => false)
    const particles: Particle[] = []
    const rings: { x: number; y: number; t: number; c: RGB; big: boolean }[] = []
    const motes: Particle[] = []
    for (let i = 0; i < (rm ? 10 : 28); i++) {
      motes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 6, vy: -4 - Math.random() * 8, life: Math.random() * 10, max: 10, size: 1 + Math.random() * 2, color: theme.mote })
    }

    const updateStatus = () => {
      movesEl.textContent = ctx.t(TEXT.moves, { n: moves })
      chips.forEach((s, i) => {
        const on = reached[i]
        s.textContent = `${on ? '◆' : '◇'} ${ctx.t(def.targets[i])}`
        s.style.color = on ? 'var(--nv-aqua)' : 'var(--nv-text-dim)'
        s.style.borderColor = on ? 'rgba(95,242,224,0.7)' : 'rgba(95,242,224,0.22)'
        s.style.boxShadow = on ? '0 0 12px rgba(95,242,224,0.35)' : 'none'
      })
    }

    const finish = (r: MinigameResult) => {
      resolve(r)
    }

    const skipBtn = button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } }))
    const resetBtn = button(ctx.t(TEXT.reset), () => reset())
    const renderButtons = () => {
      card.buttons.replaceChildren()
      if (solved) {
        if (doneShown) {
          const b = button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { moves, par } }), true)
          card.buttons.appendChild(b)
        }
        return
      }
      card.buttons.appendChild(resetBtn)
      const stuck = resets > 0 || moves > par * 3 + 14 || elapsed > 150
      if (ctx.assist.skipAllowed && stuck) card.buttons.appendChild(skipBtn)
    }
    let skipVisible = false

    function reset(): void {
      if (solved) return
      resets++
      moves = 0
      board.cells.forEach((c, i) => {
        if (c.kind !== 'pipe') return
        c.turns = board.initTurns[i]
        c.angle = (c.turns * Math.PI) / 2
        c.tw = null
        c.fill = 0
        c.flowEntry = -1
      })
      for (const t of board.targets) {
        t.fill = 0
        t.flowEntry = -1
      }
      ctx.sfx('whoosh')
      updateStatus()
      renderButtons()
      ;(document.activeElement as HTMLElement | null)?.blur?.()
    }

    function splash(c: Cell, n: number): void {
      const [x, y] = center(c)
      for (let i = 0; i < (rm ? Math.ceil(n / 3) : n); i++) {
        const a = Math.random() * Math.PI * 2
        const sp = 30 + Math.random() * 90
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0, max: 0.5 + Math.random() * 0.5, size: 1.5 + Math.random() * 2.5, color: AQUA })
      }
    }

    function rotate(c: Cell, dir: 1 | -1): void {
      if (solved) return
      if (c.kind !== 'pipe' || c.base === 15) {
        c.shake = 1
        return
      }
      c.turns += dir
      c.tw = { from: c.angle, to: (c.turns * Math.PI) / 2, t: 0 }
      if (c.fill > 0.08) splash(c, 10)
      c.fill = 0
      c.flowEntry = -1
      c.ripple = 1
      moves++
      ctx.sfx('click')
      updateStatus()
      if (!skipVisible && ctx.assist.skipAllowed && moves > par * 3 + 14) {
        skipVisible = true
        renderButtons()
      }
    }

    function win(): void {
      solved = true
      winT = 0
      score = moves <= par ? 1 : Math.max(0.15, Math.round((par / moves) * 100) / 100)
      ctx.sfx('success')
      flash = 1
      if (!rm) shakeT = 0.25
      for (const t of board.targets) {
        const [x, y] = center(t)
        rings.push({ x, y, t: 0, c: AQUA, big: true })
        for (let i = 0; i < (rm ? 14 : 46); i++) {
          const a = Math.random() * Math.PI * 2
          const sp = 40 + Math.random() * 180
          particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.8 + Math.random() * 0.9, size: 1.5 + Math.random() * 3, color: Math.random() < 0.3 ? AQUA_CORE : AQUA })
        }
      }
      canvas.style.cursor = 'default'
      renderButtons()
    }

    // ------------------------------------------------------------------ input
    const toLocal = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]
    }
    const pick = (x: number, y: number): Cell | null => {
      const cx = Math.floor((x - gx) / cell)
      const cy = Math.floor((y - gy) / cell)
      return cellAt(board, cx, cy)
    }
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      const [x, y] = toLocal(e)
      const c = pick(x, y)
      kbd = false
      if (!c) return
      cur = { x: c.x, y: c.y }
      rotate(c, e.button === 2 ? -1 : 1)
    })
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return
      const [x, y] = toLocal(e)
      hover = pick(x, y)
      if (hover) kbd = false
    })
    canvas.addEventListener('pointerleave', () => {
      hover = null
    })

    ctx.onKey((e) => {
      if (solved) {
        if (doneShown && !e.repeat && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE')) {
          e.preventDefault()
          finish({ success: true, score, data: { moves, par } })
        }
        return
      }
      const mv: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        KeyW: [0, -1],
        KeyS: [0, 1],
        KeyA: [-1, 0],
        KeyD: [1, 0],
      }
      const m = mv[e.code]
      if (m) {
        e.preventDefault()
        if (kbd) cur = { x: Math.max(0, Math.min(cols - 1, cur.x + m[0])), y: Math.max(0, Math.min(rows - 1, cur.y + m[1])) }
        kbd = true
        hover = null
        ctx.sfx('tick')
        return
      }
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE' || e.code === 'NumpadEnter') {
        e.preventDefault()
        if (e.repeat) return
        kbd = true
        const c = cellAt(board, cur.x, cur.y)
        if (c) rotate(c, 1)
      } else if (e.code === 'KeyQ' || e.code === 'Backspace') {
        e.preventDefault()
        if (e.repeat) return
        kbd = true
        const c = cellAt(board, cur.x, cur.y)
        if (c) rotate(c, -1)
      }
    })

    // dev hook so automated checks can solve the puzzle by clicking
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__nvFlow = {
        par,
        solution: () =>
          board.cells.filter((c) => c.kind === 'pipe' && c.onPath && clicksCW(c) > 0).map((c) => ({ x: c.x, y: c.y, clicks: clicksCW(c) })),
        clientPos: (x: number, y: number) => {
          const r = canvas.getBoundingClientRect()
          return { x: r.left + ((gx + (x + 0.5) * cell) / W) * r.width, y: r.top + ((gy + (y + 0.5) * cell) / H) * r.height }
        },
      }
    }

    updateStatus()
    renderButtons()

    // ------------------------------------------------------------------ drawing
    const lw = cell * 0.3

    const strokeRoutes = (c: Cell, width: number, color: string, pts?: 'hl') => {
      g.lineWidth = width
      g.strokeStyle = color
      g.beginPath()
      for (const r of c.routes) tracePartial(g, r, 0, 1, false, pts ? r.hl : r.pts)
      g.stroke()
      if (c.routes.length > 1 || c.routes[0]?.a === -1) {
        if (!pts) {
          g.fillStyle = color
          g.beginPath()
          g.arc(0, 0, width / 2, 0, Math.PI * 2)
          g.fill()
        }
      }
    }

    function drawChannel(c: Cell): void {
      g.lineJoin = 'round'
      g.lineCap = 'butt'
      strokeRoutes(c, lw, theme.outer)
      strokeRoutes(c, lw * 0.76, theme.body)
      g.lineCap = 'round'
      strokeRoutes(c, lw * 0.08, theme.light, 'hl')
      g.lineCap = 'butt'
      strokeRoutes(c, lw * 0.4, theme.groove)
      // decor: root hairs / capillaries / chips
      if (c.decor.length) {
        g.lineCap = 'round'
        g.strokeStyle = theme.detail
        g.lineWidth = theme.decor === 'chips' ? 2.4 : theme.decor === 'capillaries' ? 1 : 1.6
        g.beginPath()
        for (let i = 0; i < c.decor.length; i += 4) {
          if (theme.decor === 'chips') {
            const mx = (c.decor[i] + c.decor[i + 2]) / 2
            const my = (c.decor[i + 1] + c.decor[i + 3]) / 2
            g.moveTo(c.decor[i], c.decor[i + 1])
            g.lineTo(lerp(c.decor[i], mx, 0.6), lerp(c.decor[i + 1], my, 0.6))
          } else {
            g.moveTo(c.decor[i], c.decor[i + 1])
            g.quadraticCurveTo(
              lerp(c.decor[i], c.decor[i + 2], 0.5) + (c.decor[i + 3] - c.decor[i + 1]) * 0.25,
              lerp(c.decor[i + 1], c.decor[i + 3], 0.5) - (c.decor[i + 2] - c.decor[i]) * 0.25,
              c.decor[i + 2],
              c.decor[i + 3],
            )
          }
        }
        g.stroke()
      }
    }

    function drawWater(c: Cell, time: number, boost: number): void {
      const f = c.kind === 'source' ? 1 : c.fill
      if (f <= 0) return
      const k = mod4(c.turns)
      const e = c.kind === 'source' ? -1 : mod4(c.flowEntry - k)
      const segs: [Route, number, number, boolean][] = []
      if (c.kind === 'source') for (const r of c.routes) segs.push([r, 0, 1, false])
      else if (c.kind === 'target') segs.push([c.routes[0], 0, f, true])
      else if (c.routes.length === 1) {
        const r = c.routes[0]
        segs.push([r, 0, f, r.a !== e])
      } else {
        for (const r of c.routes) {
          if (r.b === e) segs.push([r, 0, Math.min(1, f * 2), true])
          else if (f > 0.5) segs.push([r, 0, (f - 0.5) * 2, false])
        }
      }
      const junction = c.routes.length > 1 && f > 0.5
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.lineJoin = 'round'
      g.lineCap = 'round'
      const pass = (width: number, color: string) => {
        g.lineWidth = width
        g.strokeStyle = color
        g.beginPath()
        for (const [r, a, b, rev] of segs) if (b > a) tracePartial(g, r, a, b, rev)
        g.stroke()
        if (junction) {
          g.fillStyle = color
          g.beginPath()
          g.arc(0, 0, width / 2, 0, Math.PI * 2)
          g.fill()
        }
      }
      const pulse = 0.85 + 0.15 * Math.sin(time * 3 + c.x + c.y) + boost * 0.6
      pass(lw * 1.25, rgba(AQUA, 0.07 * pulse))
      pass(lw * 0.42, rgba(AQUA, 0.55 * Math.min(1, pulse)))
      pass(lw * 0.17, rgba(AQUA_CORE, 0.85))
      // shimmer travelling with the current
      g.setLineDash([cell * 0.07, cell * 0.22])
      g.lineDashOffset = -time * cell * (1.1 + boost * 2)
      g.lineWidth = lw * 0.1
      g.strokeStyle = 'rgba(255,255,255,0.75)'
      g.beginPath()
      for (const [r, a, b, rev] of segs) if (b > a) tracePartial(g, r, a, b, rev)
      g.stroke()
      g.setLineDash([])
      g.restore()
      // advancing head
      if (c.kind !== 'source' && f < 1) {
        for (const [r, a, b, rev] of segs) {
          if (b <= a || b >= 1) continue
          g.beginPath()
          const [hx, hy] = tracePartial(g, r, a, b, rev)
          glow(g, hx, hy, cell * 0.28, AQUA, 0.9)
        }
      }
    }

    function drawGlyph(time: number): void {
      const R = cell * 0.34
      glow(g, 0, 0, cell * 0.95, AQUA, 0.35 + 0.1 * Math.sin(time * 2.2))
      g.fillStyle = '#071311'
      g.beginPath()
      g.arc(0, 0, R, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = 'rgba(95,242,224,0.95)'
      g.lineWidth = 2
      g.stroke()
      g.save()
      g.rotate(time * 0.5)
      g.strokeStyle = 'rgba(95,242,224,0.7)'
      g.lineWidth = 1.4
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        g.beginPath()
        g.arc(0, 0, R * 0.78, a, a + 0.32)
        g.stroke()
        g.beginPath()
        g.moveTo(Math.cos(a + 0.42) * R * 0.66, Math.sin(a + 0.42) * R * 0.66)
        g.lineTo(Math.cos(a + 0.42) * R * 0.86, Math.sin(a + 0.42) * R * 0.86)
        g.stroke()
      }
      g.restore()
      // water sigil: a drop over two waves
      g.strokeStyle = 'rgba(214,255,250,0.95)'
      g.lineWidth = 1.8
      g.beginPath()
      g.moveTo(0, -R * 0.48)
      g.bezierCurveTo(R * 0.36, -R * 0.08, R * 0.3, R * 0.2, 0, R * 0.22)
      g.bezierCurveTo(-R * 0.3, R * 0.2, -R * 0.36, -R * 0.08, 0, -R * 0.48)
      g.stroke()
      g.beginPath()
      for (const yy of [R * 0.36, R * 0.5]) {
        g.moveTo(-R * 0.4, yy)
        g.quadraticCurveTo(-R * 0.2, yy - R * 0.1, 0, yy)
        g.quadraticCurveTo(R * 0.2, yy + R * 0.1, R * 0.4, yy)
      }
      g.stroke()
      glow(g, 0, 0, R * 0.6, AQUA_CORE, 0.35)
    }

    function drawEmblem(c: Cell, time: number): void {
      const b = easeOutCubic(clamp01(c.bloom))
      const R = cell * 0.3
      if (theme.emblem === 'branch') {
        const withered: RGB = [60, 52, 74]
        const alive: RGB = [110, 240, 196]
        glow(g, 0, 0, cell * (0.5 + b * 0.5), alive, b * 0.55)
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.3 + Math.sin(time * 1.5 + i) * 0.04 * b
          const droop = (1 - b) * 0.5
          g.save()
          g.rotate(a)
          g.translate(R * 0.55, 0)
          g.rotate(droop)
          const col = mix(withered, alive, b)
          g.fillStyle = rgba(col, 0.95)
          g.beginPath()
          g.ellipse(R * 0.25, 0, R * (0.42 + b * 0.12), R * 0.16, 0, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = rgba(mix([30, 26, 38], [200, 255, 230], b), 0.7)
          g.lineWidth = 1
          g.beginPath()
          g.moveTo(-R * 0.1, 0)
          g.lineTo(R * 0.6, 0)
          g.stroke()
          g.restore()
        }
        // blossom
        if (b > 0.02) {
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + time * 0.2
            g.fillStyle = rgba(mix([200, 255, 245], [255, 255, 255], 0.5), 0.92)
            g.beginPath()
            g.ellipse(Math.cos(a) * R * 0.28 * b, Math.sin(a) * R * 0.28 * b, R * 0.24 * b, R * 0.13 * b, a, 0, Math.PI * 2)
            g.fill()
          }
          glow(g, 0, 0, R * 0.9, AQUA_CORE, b * 0.8)
        }
        g.fillStyle = rgba(mix([40, 34, 48], [255, 240, 190], b), 1)
        g.beginPath()
        g.arc(0, 0, R * 0.16, 0, Math.PI * 2)
        g.fill()
      } else if (theme.emblem === 'lung') {
        glow(g, 0, 0, cell * 0.7, AQUA, b * 0.5)
        const r2 = mulberry32(c.seed)
        for (let i = 0; i < 9; i++) {
          const a = r2() * Math.PI * 2
          const d = Math.sqrt(r2()) * R * 0.75
          const rr = R * (0.18 + r2() * 0.14)
          const breathe = 1 + (b > 0 ? Math.sin(time * 2.4) * 0.06 * b : 0)
          g.fillStyle = rgba(mix([96, 30, 48], [120, 240, 230], b), 0.9)
          g.beginPath()
          g.arc(Math.cos(a) * d * breathe, Math.sin(a) * d * breathe, rr, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = rgba(mix([200, 110, 130], [230, 255, 255], b), 0.5)
          g.lineWidth = 1
          g.stroke()
        }
      } else if (theme.emblem === 'wound') {
        const open = 1 - b
        glow(g, 0, 0, cell * 0.7, [255, 70, 60], open * (0.35 + 0.1 * Math.sin(time * 3)))
        glow(g, 0, 0, cell * 0.7, AQUA, b * 0.6)
        g.save()
        g.rotate(-0.5)
        const len = R * 1.25
        const wdt = R * (0.05 + open * 0.38)
        g.fillStyle = rgba(mix([120, 14, 20], [180, 255, 240], b), 1)
        g.beginPath()
        g.moveTo(-len, 0)
        g.quadraticCurveTo(0, -wdt * 2, len, 0)
        g.quadraticCurveTo(0, wdt * 2, -len, 0)
        g.fill()
        g.fillStyle = rgba(mix([40, 4, 6], [230, 255, 250], b), 1)
        g.beginPath()
        g.moveTo(-len * 0.7, 0)
        g.quadraticCurveTo(0, -wdt * 1.1, len * 0.7, 0)
        g.quadraticCurveTo(0, wdt * 1.1, -len * 0.7, 0)
        g.fill()
        g.restore()
      } else {
        // stone basin
        g.fillStyle = '#4a515c'
        g.beginPath()
        g.arc(0, 0, R * 1.02, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = 'rgba(220,230,240,0.25)'
        g.lineWidth = 1.5
        g.stroke()
        g.fillStyle = '#0c0f13'
        g.beginPath()
        g.arc(0, 0, R * 0.78, 0, Math.PI * 2)
        g.fill()
        if (b > 0) {
          g.fillStyle = rgba(AQUA, 0.55 * b)
          g.beginPath()
          g.arc(0, 0, R * 0.78, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = rgba(AQUA_CORE, 0.6 * b)
          g.lineWidth = 1.2
          for (let i = 0; i < 2; i++) {
            const p = (time * 0.6 + i * 0.5) % 1
            g.globalAlpha = (1 - p) * b
            g.beginPath()
            g.arc(0, 0, R * 0.75 * p, 0, Math.PI * 2)
            g.stroke()
          }
          g.globalAlpha = 1
          glow(g, 0, 0, cell * 0.6, AQUA, b * 0.5)
        }
      }
    }

    function drawBlock(c: Cell, time: number): void {
      const R = cell * 0.36
      const r2 = mulberry32(c.seed)
      if (theme.block === 'crushed') {
        // splintered root stubs
        g.fillStyle = theme.outer
        g.strokeStyle = theme.body
        for (const s of [-1, 1]) {
          g.beginPath()
          g.moveTo(-lw * 0.5, (s * cell) / 2)
          g.lineTo(-lw * 0.5, s * cell * 0.28)
          g.lineTo(-lw * 0.2, s * cell * 0.2)
          g.lineTo(0, s * cell * 0.3)
          g.lineTo(lw * 0.25, s * cell * 0.18)
          g.lineTo(lw * 0.5, s * cell * 0.27)
          g.lineTo(lw * 0.5, (s * cell) / 2)
          g.closePath()
          g.fill()
          g.lineWidth = 2
          g.stroke()
        }
        // boulder
        const pts: number[] = []
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2
          const rr = R * (0.8 + r2() * 0.25)
          pts.push(Math.cos(a) * rr * 1.08, Math.sin(a) * rr * 0.9 + 2)
        }
        g.beginPath()
        g.moveTo(pts[0], pts[1])
        for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1])
        g.closePath()
        const sg = g.createLinearGradient(-R, -R, R, R)
        sg.addColorStop(0, '#6c6a66')
        sg.addColorStop(1, '#22211f')
        g.fillStyle = sg
        g.fill()
        g.strokeStyle = 'rgba(0,0,0,0.6)'
        g.lineWidth = 2
        g.stroke()
        g.strokeStyle = 'rgba(0,0,0,0.45)'
        g.lineWidth = 1.2
        g.beginPath()
        g.moveTo(-R * 0.3, -R * 0.6)
        g.lineTo(-R * 0.05, -R * 0.1)
        g.lineTo(R * 0.35, R * 0.15)
        g.moveTo(-R * 0.05, -R * 0.1)
        g.lineTo(-R * 0.25, R * 0.4)
        g.stroke()
        g.fillStyle = 'rgba(90,140,70,0.55)'
        g.beginPath()
        g.ellipse(-R * 0.2, -R * 0.62, R * 0.4, R * 0.12, -0.2, 0, Math.PI * 2)
        g.fill()
      } else if (theme.block === 'heart') {
        const ph = (time % 1.1) / 1.1
        const beat = Math.max(0, Math.sin(ph * Math.PI * 2 * 2)) * (ph < 0.5 ? 1 : 0) * (rm ? 0.3 : 1)
        const s = R * (1.05 + beat * 0.07)
        glow(g, 0, 0, cell * 0.7, [255, 60, 80], 0.18 + beat * 0.25)
        g.beginPath()
        g.moveTo(0, s * 0.85)
        g.bezierCurveTo(-s * 1.2, s * 0.05, -s * 0.75, -s * 0.95, 0, -s * 0.4)
        g.bezierCurveTo(s * 0.75, -s * 0.95, s * 1.2, s * 0.05, 0, s * 0.85)
        const hg = g.createRadialGradient(-s * 0.2, -s * 0.3, 2, 0, 0, s)
        hg.addColorStop(0, '#8e2236')
        hg.addColorStop(1, '#320812')
        g.fillStyle = hg
        g.fill()
        g.strokeStyle = 'rgba(255,150,170,0.35)'
        g.lineWidth = 1.2
        g.stroke()
      } else if (theme.block === 'clot') {
        for (let i = 0; i < 7; i++) {
          const a = r2() * Math.PI * 2
          const d = r2() * R * 0.5
          g.fillStyle = i % 2 ? '#3d1012' : '#290a0b'
          g.beginPath()
          g.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.35 + r2() * 0.25), 0, Math.PI * 2)
          g.fill()
        }
        g.strokeStyle = 'rgba(210,190,160,0.6)'
        g.lineWidth = 1.4
        g.beginPath()
        g.moveTo(-R * 0.7, -R * 0.1)
        g.quadraticCurveTo(0, -R * 0.35, R * 0.7, R * 0.05)
        for (let i = -2; i <= 2; i++) {
          g.moveTo(i * R * 0.28 - 3, -R * 0.35 + Math.abs(i) * 3)
          g.lineTo(i * R * 0.28 + 3, R * 0.05 + Math.abs(i) * 2)
        }
        g.stroke()
      } else {
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * R * 0.55
          const oy = i === 1 ? -R * 0.35 : R * 0.2
          const rr = R * (0.52 + r2() * 0.12)
          g.beginPath()
          for (let k = 0; k < 7; k++) {
            const a = (k / 7) * Math.PI * 2
            const q = rr * (0.8 + r2() * 0.3)
            if (k === 0) g.moveTo(ox + Math.cos(a) * q, oy + Math.sin(a) * q * 0.8)
            else g.lineTo(ox + Math.cos(a) * q, oy + Math.sin(a) * q * 0.8)
          }
          g.closePath()
          const sg = g.createLinearGradient(ox - rr, oy - rr, ox + rr, oy + rr)
          sg.addColorStop(0, '#6b7380')
          sg.addColorStop(1, '#262a31')
          g.fillStyle = sg
          g.fill()
          g.strokeStyle = 'rgba(0,0,0,0.55)'
          g.lineWidth = 1.5
          g.stroke()
        }
      }
    }

    function drawLevelDynamic(time: number, w: number): void {
      if (levelId === 'tree' && w > 0) {
        // the dark branch comes back to life: a glow runs along it, leaves unfold
        const tx = gx + cols * cell - 4
        const ty = layout.ty[0]
        const pts = quadPts(tx, ty, tx + 60, ty - 6, W - 6, ty - 50, 12)
        const twigs = [quadPts(tx + 44, ty - 2, tx + 64, ty + 24, tx + 92, ty + 40, 4), quadPts(tx + 80, ty - 14, tx + 96, ty - 40, tx + 92, Math.max(4, ty - 62), 4)]
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.lineCap = 'round'
        g.strokeStyle = rgba(AQUA, 0.35 * w)
        g.lineWidth = 5
        g.beginPath()
        const nShow = Math.max(1, Math.round(12 * clamp01(w * 1.5)))
        g.moveTo(pts[0], pts[1])
        for (let i = 1; i <= nShow; i++) g.lineTo(pts[i * 2], pts[i * 2 + 1])
        g.stroke()
        g.restore()
        const leaf = (x: number, y: number, ang: number, len: number, k: number, seed: number) => {
          g.save()
          g.translate(x, y)
          g.rotate(ang + Math.sin(time * 1.8 + seed) * 0.07)
          const col = mix([70, 140, 100], [128, 248, 204], k)
          g.fillStyle = rgba(col, 0.92 * k)
          g.beginPath()
          g.moveTo(0, 0)
          g.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0)
          g.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0)
          g.fill()
          g.strokeStyle = rgba([220, 255, 240], 0.5 * k)
          g.lineWidth = 0.8
          g.beginPath()
          g.moveTo(1, 0)
          g.lineTo(len * 0.85, 0)
          g.stroke()
          g.restore()
        }
        for (let i = 1; i < 12; i++) {
          const k = clamp01(w * 2.2 - i * 0.09)
          if (k <= 0) continue
          const x = pts[i * 2]
          const y = pts[i * 2 + 1]
          const ang = Math.atan2(y - pts[i * 2 - 1], x - pts[i * 2 - 2])
          const side = i % 2 ? 1 : -1
          leaf(x, y, ang + side * (0.75 + 0.25 * Math.sin(i * 2.3)), (14 + (i % 3) * 5) * k, k, i)
          if (i % 4 === 2) {
            const bx = x + Math.cos(ang - side * 1.2) * 6
            const by = y + Math.sin(ang - side * 1.2) * 6
            for (let p = 0; p < 5; p++) {
              const a = (p / 5) * Math.PI * 2 + time * 0.3
              g.fillStyle = rgba([235, 255, 250], 0.9 * k)
              g.beginPath()
              g.ellipse(bx + Math.cos(a) * 3.2 * k, by + Math.sin(a) * 3.2 * k, 3 * k, 1.7 * k, a, 0, Math.PI * 2)
              g.fill()
            }
            glow(g, bx, by, 14, AQUA_CORE, 0.6 * k)
          }
        }
        twigs.forEach((tp, ti) => {
          const k = clamp01(w * 2 - 0.5 - ti * 0.2)
          if (k <= 0) return
          for (let i = 2; i < 5; i++) {
            const x = tp[i * 2]
            const y = tp[i * 2 + 1]
            const ang = Math.atan2(y - tp[i * 2 - 1], x - tp[i * 2 - 2])
            leaf(x, y, ang + (i % 2 ? 0.8 : -0.8), 13 * k, k, i + ti * 7)
          }
        })
      }
      if (levelId === 'lungs' && w > 0) {
        const breathe = 0.5 + 0.5 * Math.sin(time * 2.2)
        const mid = layout.sx
        const lobes: [number, number, number, number, boolean][] = [
          [gx - 48, gy + 22, mid - 14, gy + rows * cell + 12, false],
          [mid + 14, gy + 22, gx + cols * cell + 48, gy + rows * cell + 12, true],
        ]
        g.save()
        g.globalCompositeOperation = 'lighter'
        for (const [x0, y0, x1, y1, mir] of lobes) {
          lobePath(g, x0, y0, x1, y1, mir)
          const lg = g.createRadialGradient((x0 + x1) / 2, y1 - (y1 - y0) * 0.35, 10, (x0 + x1) / 2, y1 - (y1 - y0) * 0.35, (x1 - x0) * 0.9)
          lg.addColorStop(0, rgba(AQUA, w * (0.2 + 0.12 * breathe)))
          lg.addColorStop(1, rgba(AQUA, w * 0.03))
          g.fillStyle = lg
          g.fill()
          g.strokeStyle = rgba(AQUA, w * (0.35 + 0.25 * breathe))
          g.lineWidth = 2
          g.stroke()
        }
        g.restore()
      }
      if (levelId === 'canal') {
        // the spring feeding the glyph, and the basins' outflow once watered
        const cw = cell * 0.3
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.fillStyle = rgba(AQUA, 0.35)
        g.fillRect(0, layout.sy - cw * 0.3, gx, cw * 0.6)
        g.setLineDash([10, 18])
        g.lineDashOffset = -time * 50
        g.strokeStyle = 'rgba(230,255,255,0.6)'
        g.lineWidth = 2
        g.beginPath()
        g.moveTo(0, layout.sy)
        g.lineTo(gx, layout.sy)
        for (let i = 0; i < board.targets.length; i++) {
          if (!reached[i]) continue
          g.moveTo(gx + cols * cell, layout.ty[i])
          g.lineTo(W, layout.ty[i])
        }
        g.stroke()
        g.setLineDash([])
        for (let i = 0; i < board.targets.length; i++) {
          const a = board.targets[i].bloom
          if (a <= 0) continue
          g.fillStyle = rgba(AQUA, 0.3 * a)
          g.fillRect(gx + cols * cell, layout.ty[i] - cw * 0.3, W - gx - cols * cell, cw * 0.6)
        }
        g.restore()
      }
      if (levelId === 'wound') {
        glow(g, gx - 30, layout.sy, 90, AQUA, 0.12 + 0.05 * Math.sin(time * 2))
      }
    }

    function draw(time: number): void {
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (shakeT > 0) g.translate((Math.random() - 0.5) * 6 * shakeT * 4, (Math.random() - 0.5) * 6 * shakeT * 4)
      g.drawImage(bg, 0, 0, W, H)
      const w = solved ? easeOutCubic(clamp01(winT / 1.2)) : 0
      drawLevelDynamic(time, w)
      // ambient motes
      for (const m of motes) glow(g, m.x, m.y, m.size * 4, m.color, 0.18 + 0.12 * Math.sin(m.life * 2))
      // cells
      for (const c of board.cells) {
        const [cx, cy] = center(c)
        let ox = 0
        if (c.shake > 0) ox = Math.sin(c.shake * 30) * 3 * c.shake * (rm ? 0 : 1)
        g.drawImage(cellSprite, cx - cell / 2 + ox, cy - cell / 2, cell, cell)
        g.save()
        g.translate(cx + ox, cy)
        if (c.kind === 'empty') {
          for (let i = 0; i < c.specks.length; i += 4) {
            g.fillStyle = `rgba(${theme.decor === 'chips' ? '150,160,175' : '140,110,90'},${0.08 + c.specks[i + 3] * 0.12})`
            g.beginPath()
            g.arc(c.specks[i], c.specks[i + 1], c.specks[i + 2], 0, Math.PI * 2)
            g.fill()
          }
        } else if (c.kind === 'block') {
          drawBlock(c, time)
        } else {
          g.rotate(c.angle)
          drawChannel(c)
          drawWater(c, time, w)
          g.rotate(-c.angle)
          if (c.kind === 'source') drawGlyph(time)
          if (c.kind === 'target') drawEmblem(c, time)
        }
        if (c.ripple > 0) {
          const p = 1 - c.ripple
          g.strokeStyle = `rgba(243,217,149,${0.55 * c.ripple})`
          g.lineWidth = 2
          g.beginPath()
          g.arc(0, 0, cell * (0.25 + p * 0.45), 0, Math.PI * 2)
          g.stroke()
        }
        g.restore()
      }
      // hover / keyboard cursor
      const sel = solved ? null : kbd ? cellAt(board, cur.x, cur.y) : hover
      if (sel) {
        const [cx, cy] = center(sel)
        const pulse = 0.65 + 0.35 * Math.sin(time * 5)
        roundRectPath(g, cx - cell / 2 + 2, cy - cell / 2 + 2, cell - 4, cell - 4, cell * 0.14)
        g.strokeStyle = sel.kind === 'pipe' ? `rgba(243,217,149,${0.55 + 0.35 * pulse})` : 'rgba(168,158,140,0.4)'
        g.lineWidth = kbd ? 2.5 : 1.6
        g.stroke()
        if (sel.kind === 'pipe') glow(g, cx, cy, cell * 0.8, [243, 217, 149], 0.08 * pulse)
      }
      // rings & particles
      for (const r of rings) {
        const p = r.t / (r.big ? 1.4 : 0.6)
        g.strokeStyle = rgba(r.c, Math.max(0, 0.7 * (1 - p)))
        g.lineWidth = r.big ? 3 * (1 - p) + 0.5 : 1.5
        g.beginPath()
        g.arc(r.x, r.y, (r.big ? 30 + p * 260 : 10 + p * 40) * (rm ? 0.6 : 1), 0, Math.PI * 2)
        g.stroke()
        if (r.big) glow(g, r.x, r.y, 60 + p * 140, AQUA, 0.5 * (1 - p))
      }
      for (const p of particles) {
        const a = 1 - p.life / p.max
        glow(g, p.x, p.y, p.size * 3, p.color, a * 0.9)
      }
      if (flash > 0) {
        g.fillStyle = `rgba(160,255,240,${flash * 0.22})`
        g.fillRect(0, 0, W, H)
      }
    }

    // ------------------------------------------------------------------ loop
    ctx.loop((rawDt, time) => {
      const dt = Math.max(0, rawDt)
      fit()
      elapsed += dt
      if (!skipVisible && ctx.assist.skipAllowed && elapsed > 150 && !solved) {
        skipVisible = true
        renderButtons()
      }
      // tweens & small animations
      for (const c of board.cells) {
        if (c.tw) {
          c.tw.t = Math.min(1, c.tw.t + dt / 0.22)
          const e = rm ? easeOutCubic(c.tw.t) : easeOutBack(c.tw.t)
          c.angle = lerp(c.tw.from, c.tw.to, e)
          if (c.tw.t >= 1) {
            c.angle = c.tw.to
            c.tw = null
          }
        }
        if (c.ripple > 0) c.ripple = Math.max(0, c.ripple - dt * 2.4)
        if (c.shake > 0) c.shake = Math.max(0, c.shake - dt * 3)
        if (c.kind === 'target') {
          const want = c.connected && c.fill >= 1 ? 1 : 0
          c.bloom = want ? Math.min(1, c.bloom + dt * 1.6) : Math.max(0, c.bloom - dt * 2)
        }
      }
      // water
      const order = computeFlow(board)
      for (const c of order) {
        if (c.kind === 'source') {
          c.fill = 1
          continue
        }
        if (c.flowEntry !== c.entry) {
          c.fill = 0
          c.flowEntry = c.entry
        }
        if (c.parent && c.parent.fill >= 1) c.fill = Math.min(1, c.fill + dt * FILL_SPEED)
      }
      for (const c of board.cells) if (!c.connected && c.kind !== 'source' && c.fill > 0) c.fill = Math.max(0, c.fill - dt * DRAIN_SPEED)
      waterCd -= dt
      if (order.length > lastConnected && waterCd <= 0 && !solved) {
        ctx.sfx('water')
        waterCd = 0.3
      }
      lastConnected = order.length
      // targets
      let all = true
      board.targets.forEach((t, i) => {
        const on = t.connected && t.fill >= 1
        if (on && !reached[i]) {
          reached[i] = true
          const [x, y] = center(t)
          rings.push({ x, y, t: 0, c: AQUA, big: false })
          ctx.sfx('chime')
          updateStatus()
        } else if (!on && reached[i]) {
          reached[i] = false
          updateStatus()
        }
        if (!on) all = false
      })
      if (all && !solved) win()
      if (solved) {
        winT += dt
        if (!doneShown && winT > 1.1) {
          doneShown = true
          card.hint.textContent = ctx.t(def.done)
          card.hint.style.color = 'var(--nv-aqua)'
          renderButtons()
          fit(true)
        }
      }
      // fx
      flash = Math.max(0, flash - dt * 1.5)
      shakeT = Math.max(0, shakeT - dt)
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].t += dt
        if (rings[i].t > (rings[i].big ? 1.4 : 0.6)) rings.splice(i, 1)
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life += dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 1 - dt * 2.2
        p.vy = p.vy * (1 - dt * 2.2) + dt * 40
        if (p.life >= p.max) particles.splice(i, 1)
      }
      for (const m of motes) {
        m.life += dt
        m.x += (m.vx + Math.sin(m.life * 0.7) * 6) * dt
        m.y += m.vy * dt * (solved ? 2.5 : 1)
        if (m.y < -10) {
          m.y = H + 10
          m.x = Math.random() * W
        }
        if (m.x < -10) m.x = W + 10
        if (m.x > W + 10) m.x = -10
      }
      draw(time)
    })
  })
}

registerMinigame('flow', () => ({ run: runFlow }))
