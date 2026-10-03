import * as THREE from 'three'
import type { FloorType, WallType } from '../content/types'

/**
 * Procedural canvas textures for floors and walls. Everything is painted at
 * runtime from a seeded random generator, so the game needs no texture files
 * and every material stays in one coherent, slightly painterly style.
 */

const SIZE = 128

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

function canvas(size = SIZE): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  return [c, ctx]
}

function speckle(ctx: CanvasRenderingContext2D, r: () => number, n: number, colors: string[], min = 1, max = 3): void {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)]
    const s = min + r() * (max - min)
    ctx.globalAlpha = 0.25 + r() * 0.5
    ctx.fillRect(r() * SIZE, r() * SIZE, s, s)
  }
  ctx.globalAlpha = 1
}

function noiseWash(ctx: CanvasRenderingContext2D, r: () => number, alpha = 0.08): void {
  for (let i = 0; i < 40; i++) {
    const x = r() * SIZE
    const y = r() * SIZE
    const rad = 8 + r() * 30
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    const dark = r() > 0.5
    g.addColorStop(0, dark ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, SIZE, SIZE)
  }
}

function flagstones(ctx: CanvasRenderingContext2D, r: () => number, base: string, grout: string, split = 2): void {
  ctx.fillStyle = grout
  ctx.fillRect(0, 0, SIZE, SIZE)
  const cell = SIZE / split
  for (let y = 0; y < split; y++) {
    for (let x = 0; x < split; x++) {
      const inset = 2 + r() * 2
      ctx.fillStyle = base
      ctx.globalAlpha = 1
      ctx.fillRect(x * cell + inset, y * cell + inset, cell - inset * 2, cell - inset * 2)
      ctx.fillStyle = r() > 0.5 ? '#000' : '#fff'
      ctx.globalAlpha = 0.04 + r() * 0.08
      ctx.fillRect(x * cell + inset, y * cell + inset, cell - inset * 2, cell - inset * 2)
    }
  }
  ctx.globalAlpha = 1
}

function planks(ctx: CanvasRenderingContext2D, r: () => number, base: string, line: string, n = 4, vertical = false): void {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, SIZE, SIZE)
  const w = SIZE / n
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r() > 0.5 ? '#000' : '#fff'
    ctx.globalAlpha = 0.03 + r() * 0.07
    if (vertical) ctx.fillRect(i * w, 0, w, SIZE)
    else ctx.fillRect(0, i * w, SIZE, w)
    ctx.globalAlpha = 0.5
    ctx.fillStyle = line
    if (vertical) ctx.fillRect(i * w, 0, 1.5, SIZE)
    else ctx.fillRect(0, i * w, SIZE, 1.5)
    // grain
    ctx.globalAlpha = 0.12
    for (let g = 0; g < 6; g++) {
      ctx.beginPath()
      const o = r() * w
      if (vertical) {
        ctx.moveTo(i * w + o, 0)
        ctx.bezierCurveTo(i * w + o + 3, SIZE * 0.3, i * w + o - 3, SIZE * 0.6, i * w + o, SIZE)
      } else {
        ctx.moveTo(0, i * w + o)
        ctx.bezierCurveTo(SIZE * 0.3, i * w + o + 3, SIZE * 0.6, i * w + o - 3, SIZE, i * w + o)
      }
      ctx.strokeStyle = line
      ctx.stroke()
    }
    // butt joint
    ctx.globalAlpha = 0.5
    const j = r() * SIZE
    if (vertical) ctx.fillRect(i * w, j, w, 1.2)
    else ctx.fillRect(j, i * w, 1.2, w)
  }
  ctx.globalAlpha = 1
}

function blocks(ctx: CanvasRenderingContext2D, r: () => number, base: string, mortar: string, rows = 4, cols = 2): void {
  ctx.fillStyle = mortar
  ctx.fillRect(0, 0, SIZE, SIZE)
  const h = SIZE / rows
  const w = SIZE / cols
  for (let y = 0; y < rows; y++) {
    const off = y % 2 ? w / 2 : 0
    for (let x = -1; x < cols + 1; x++) {
      ctx.fillStyle = base
      ctx.fillRect(x * w + off + 1.5, y * h + 1.5, w - 3, h - 3)
      ctx.fillStyle = r() > 0.5 ? '#000' : '#fff'
      ctx.globalAlpha = 0.03 + r() * 0.09
      ctx.fillRect(x * w + off + 1.5, y * h + 1.5, w - 3, h - 3)
      ctx.globalAlpha = 1
    }
  }
}

function cracks(ctx: CanvasRenderingContext2D, r: () => number, color: string, n = 3, alpha = 0.35): void {
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 1
  for (let i = 0; i < n; i++) {
    let x = r() * SIZE
    let y = r() * SIZE
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let s = 0; s < 6; s++) {
      x += (r() - 0.5) * 24
      y += (r() - 0.5) * 24
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function finish(c: HTMLCanvasElement, nearest = false): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  if (nearest) tex.magFilter = THREE.NearestFilter
  return tex
}

type Painter = (ctx: CanvasRenderingContext2D, r: () => number) => void

const FLOOR_PAINTERS: Partial<Record<FloorType, Painter>> = {
  stone: (ctx, r) => {
    flagstones(ctx, r, '#8a8a86', '#5d5c58', 2)
    noiseWash(ctx, r)
    cracks(ctx, r, '#4a4844', 2)
  },
  cobble: (ctx, r) => {
    ctx.fillStyle = '#4e4a44'
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let i = 0; i < 26; i++) {
      const x = r() * SIZE
      const y = r() * SIZE
      const rx = 9 + r() * 9
      const ry = 7 + r() * 7
      ctx.fillStyle = `hsl(35, ${8 + r() * 8}%, ${42 + r() * 18}%)`
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, r() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    noiseWash(ctx, r)
  },
  marble: (ctx, r) => {
    flagstones(ctx, r, '#e9e5dc', '#bdb6a8', 1)
    cracks(ctx, r, '#9a948a', 4, 0.25)
    noiseWash(ctx, r, 0.04)
  },
  white: (ctx, r) => {
    flagstones(ctx, r, '#d9d4c8', '#a9a294', 2)
    noiseWash(ctx, r, 0.05)
  },
  grass: (ctx, r) => {
    ctx.fillStyle = '#4c6b34'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.1)
    speckle(ctx, r, 500, ['#3d5a28', '#5d7d3c', '#6b8a45', '#2f4a20'], 1, 3)
  },
  moss: (ctx, r) => {
    ctx.fillStyle = '#3a4d2c'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.14)
    speckle(ctx, r, 380, ['#2c3d22', '#4b623a', '#556e40'], 2, 5)
  },
  dirt: (ctx, r) => {
    ctx.fillStyle = '#5e4a36'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.12)
    speckle(ctx, r, 300, ['#4a3a2a', '#6e5841', '#3e3024'], 1, 3)
  },
  mud: (ctx, r) => {
    ctx.fillStyle = '#3e3326'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.16)
    speckle(ctx, r, 120, ['#2e261c', '#54473a'], 3, 7)
  },
  sand: (ctx, r) => {
    ctx.fillStyle = '#c2a878'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.06)
    speckle(ctx, r, 700, ['#a88f62', '#d6be8f', '#b39a6b'], 1, 2)
  },
  blacksand: (ctx, r) => {
    ctx.fillStyle = '#222024'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.08)
    speckle(ctx, r, 700, ['#333036', '#121114', '#45404a'], 1, 2)
  },
  gravel: (ctx, r) => {
    ctx.fillStyle = '#6a655d'
    ctx.fillRect(0, 0, SIZE, SIZE)
    speckle(ctx, r, 900, ['#55514b', '#7f796f', '#8f897d', '#46423d'], 1.5, 4)
  },
  snow: (ctx, r) => {
    ctx.fillStyle = '#e4ebf2'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.05)
    speckle(ctx, r, 200, ['#cfd8e3', '#ffffff'], 1, 3)
  },
  ice: (ctx, r) => {
    ctx.fillStyle = '#a9cbe0'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.08)
    cracks(ctx, r, '#ffffff', 6, 0.45)
  },
  wood: (ctx, r) => planks(ctx, r, '#7a5a3a', '#3e2c1c', 4),
  deck: (ctx, r) => {
    planks(ctx, r, '#4f3b2a', '#20160e', 5)
    speckle(ctx, r, 30, ['#1a1a1a'], 1.5, 2)
  },
  metal: (ctx, r) => {
    ctx.fillStyle = '#4d5156'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.08)
    ctx.strokeStyle = '#2b2e32'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2)
    ctx.fillStyle = '#7d8187'
    for (const [x, y] of [[8, 8], [SIZE - 8, 8], [8, SIZE - 8], [SIZE - 8, SIZE - 8], [SIZE / 2, 8], [SIZE / 2, SIZE - 8]]) {
      ctx.beginPath()
      ctx.arc(x, y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    cracks(ctx, r, '#8a8f95', 3, 0.15)
  },
  roof: (ctx, r) => {
    ctx.fillStyle = '#7a3b2a'
    ctx.fillRect(0, 0, SIZE, SIZE)
    const rows = 6
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < 6; x++) {
        const off = y % 2 ? SIZE / 12 : 0
        ctx.fillStyle = `hsl(12, ${40 + r() * 15}%, ${28 + r() * 10}%)`
        ctx.beginPath()
        ctx.arc(x * (SIZE / 6) + off + SIZE / 12, y * (SIZE / rows) + SIZE / 12, SIZE / 12, 0, Math.PI)
        ctx.fill()
      }
    }
  },
  tile: (ctx, r) => {
    const n = 4
    const s = SIZE / n
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#2e5a6a' : '#d8cdb4'
        ctx.fillRect(x * s, y * s, s, s)
      }
    ctx.strokeStyle = '#a08a5e'
    ctx.globalAlpha = 0.6
    for (let i = 0; i <= n; i++) {
      ctx.beginPath()
      ctx.moveTo(i * s, 0)
      ctx.lineTo(i * s, SIZE)
      ctx.moveTo(0, i * s)
      ctx.lineTo(SIZE, i * s)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    noiseWash(ctx, r, 0.05)
  },
  carpet: (ctx, r) => {
    ctx.fillStyle = '#4a1f3a'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.strokeStyle = '#b08a4a'
    ctx.lineWidth = 3
    ctx.strokeRect(10, 10, SIZE - 20, SIZE - 20)
    ctx.lineWidth = 1
    ctx.strokeRect(18, 18, SIZE - 36, SIZE - 36)
    ctx.fillStyle = '#6a2f52'
    ctx.beginPath()
    ctx.moveTo(SIZE / 2, 30)
    ctx.lineTo(SIZE - 30, SIZE / 2)
    ctx.lineTo(SIZE / 2, SIZE - 30)
    ctx.lineTo(30, SIZE / 2)
    ctx.fill()
    noiseWash(ctx, r, 0.05)
  },
  rock: (ctx, r) => {
    ctx.fillStyle = '#5b5650'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.18)
    cracks(ctx, r, '#3b3733', 5, 0.4)
    speckle(ctx, r, 200, ['#6d6861', '#48443f'], 2, 4)
  },
  obsidian: (ctx, r) => {
    ctx.fillStyle = '#121016'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.06)
    cracks(ctx, r, '#3a2a5a', 3, 0.35)
  },
  ash: (ctx, r) => {
    ctx.fillStyle = '#5c5a58'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.1)
    speckle(ctx, r, 600, ['#4a4846', '#77746f', '#2f2e2d'], 1, 2)
  },
  andesite: (ctx, r) => {
    flagstones(ctx, r, '#2d2b2c', '#161515', 2)
    noiseWash(ctx, r, 0.08)
  },
  dream: (ctx, r) => {
    ctx.fillStyle = '#e8e6f0'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.04)
  },
}

const WALL_PAINTERS: Record<WallType, Painter> = {
  stone: (ctx, r) => {
    blocks(ctx, r, '#77746d', '#4b4944', 4, 2)
    noiseWash(ctx, r, 0.08)
  },
  white: (ctx, r) => {
    ctx.fillStyle = '#e2dccf'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.05)
    cracks(ctx, r, '#b7ae9c', 2, 0.25)
  },
  marble: (ctx, r) => {
    blocks(ctx, r, '#ece7dc', '#c9c1b1', 3, 1)
    cracks(ctx, r, '#a8a195', 3, 0.2)
  },
  brick: (ctx, r) => blocks(ctx, r, '#8a4a34', '#4a3328', 8, 3),
  wood: (ctx, r) => planks(ctx, r, '#6b4c30', '#2e2015', 4, true),
  plank: (ctx, r) => planks(ctx, r, '#5c432c', '#241911', 5, false),
  metal: (ctx, r) => FLOOR_PAINTERS.metal!(ctx, r),
  iron: (ctx, r) => {
    ctx.fillStyle = '#2f3236'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.06)
    ctx.fillStyle = '#4d5157'
    for (let y = 8; y < SIZE; y += 30) for (let x = 6; x < SIZE; x += 20) ctx.fillRect(x, y, 2.5, 2.5)
  },
  rust: (ctx, r) => {
    ctx.fillStyle = '#5a3a28'
    ctx.fillRect(0, 0, SIZE, SIZE)
    noiseWash(ctx, r, 0.15)
    speckle(ctx, r, 400, ['#7a4a2a', '#3a2418', '#8a5a34'], 1, 4)
  },
  obsidian: (ctx, r) => FLOOR_PAINTERS.obsidian!(ctx, r),
  rock: (ctx, r) => FLOOR_PAINTERS.rock!(ctx, r),
  andesite: (ctx, r) => {
    blocks(ctx, r, '#2a2829', '#141313', 3, 2)
    noiseWash(ctx, r, 0.06)
  },
  hedge: (ctx, r) => {
    ctx.fillStyle = '#2f4a26'
    ctx.fillRect(0, 0, SIZE, SIZE)
    speckle(ctx, r, 700, ['#3d5e30', '#24391d', '#4f7340', '#1b2b16'], 2, 6)
  },
  ice: (ctx, r) => FLOOR_PAINTERS.ice!(ctx, r),
  glass: (ctx) => {
    ctx.fillStyle = '#9fc4d8'
    ctx.fillRect(0, 0, SIZE, SIZE)
  },
  dream: (ctx, r) => FLOOR_PAINTERS.dream!(ctx, r),
}

const floorCache = new Map<string, THREE.CanvasTexture>()
const wallCache = new Map<string, THREE.CanvasTexture>()

export function floorTexture(type: FloorType): THREE.CanvasTexture | null {
  const painter = FLOOR_PAINTERS[type]
  if (!painter) return null
  let tex = floorCache.get(type)
  if (!tex) {
    const [c, ctx] = canvas()
    painter(ctx, rng(hashString(type)))
    tex = finish(c)
    floorCache.set(type, tex)
  }
  return tex
}

export function wallTexture(type: WallType): THREE.CanvasTexture {
  let tex = wallCache.get(type)
  if (!tex) {
    const [c, ctx] = canvas()
    WALL_PAINTERS[type](ctx, rng(hashString('w' + type)))
    tex = finish(c)
    wallCache.set(type, tex)
  }
  return tex
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Soft round sprite used by particles and glows. */
let glowTex: THREE.CanvasTexture | null = null
export function glowTexture(): THREE.CanvasTexture {
  if (glowTex) return glowTex
  const [c, ctx] = canvas(64)
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.65)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}

/** Five-pointed glyph (pentagram in a circle) used for Spira effects. */
const glyphCache = new Map<string, THREE.CanvasTexture>()
export function glyphTexture(style: 'mother' | 'rune' = 'mother'): THREE.CanvasTexture {
  const cached = glyphCache.get(style)
  if (cached) return cached
  const [c, ctx] = canvas(256)
  ctx.translate(128, 128)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 5
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 12
  if (style === 'mother') {
    ctx.beginPath()
    ctx.arc(0, 0, 112, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 98, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 4
  }
  ctx.beginPath()
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
    const x = Math.cos(a) * 96
    const y = Math.sin(a) * 96
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    ctx.beginPath()
    ctx.arc(Math.cos(a) * 96, Math.sin(a) * 96, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  }
  if (style === 'rune') {
    // angular cuts of Renn's runes instead of the circle
    ctx.lineWidth = 3
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5 + Math.PI / 5
      ctx.save()
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(108, -10)
      ctx.lineTo(118, 0)
      ctx.lineTo(108, 10)
      ctx.moveTo(100, -14)
      ctx.lineTo(100, 14)
      ctx.stroke()
      ctx.restore()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  glyphCache.set(style, tex)
  return tex
}
