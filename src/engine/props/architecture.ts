import * as THREE from 'three'
import { registerProp, type PropContext } from './registry'
import {
  PAL,
  WALL_Z,
  M,
  glowMat,
  bx,
  cy,
  cn,
  ball,
  rod,
  chain,
  torus,
  ring,
  plane,
  extrude,
  rock,
  rot,
  fx,
  keep,
  finalize,
  cachedBuild,
  cachedGeo,
  wrap,
  seeded,
  pick,
  range,
  variant,
  shade,
  bool,
  num,
  str,
  tint,
  canvasTex,
  texMat,
  cachedMat,
  flame,
  flicker,
  lathe,
} from './kit'

// ---------------------------------------------------------------------------
// shared styles
// ---------------------------------------------------------------------------

export type StoneStyle = 'white' | 'stone' | 'andesite'

const STYLE: Record<StoneStyle, { base: string; shade: string; trim: string }> = {
  white: { base: PAL.white, shade: PAL.whiteShade, trim: '#ead9b4' },
  stone: { base: PAL.stone, shade: PAL.stoneDark, trim: PAL.stoneLight },
  andesite: { base: PAL.andesite, shade: PAL.andesiteDark, trim: '#545060' },
}

function stoneStyle(ctx: PropContext, fallback: StoneStyle = 'white'): StoneStyle {
  const s = str(ctx, 'style', fallback)
  return s === 'white' || s === 'stone' || s === 'andesite' ? s : fallback
}

/** Optional colour override ('' when none). */
function optColor(ctx: PropContext): string {
  return tint(ctx, '')
}

function stoneMats(style: StoneStyle, color: string) {
  const st = STYLE[style]
  return {
    base: M(color || st.base),
    shade: M(color ? shade(color, 0.78) : st.shade),
    trim: M(color ? shade(color, 1.12) : st.trim),
  }
}

// ---------------------------------------------------------------------------
// pillar
// ---------------------------------------------------------------------------

export interface PillarOpts {
  h: number
  broken: boolean
  style: StoneStyle
  color?: string
  glow?: boolean
  seed: number
}

export function buildPillar(o: PillarOpts): THREE.Group {
  const r = seeded('pillar' + o.seed)
  const m = stoneMats(o.style, o.color ?? '')
  const g = new THREE.Group()
  g.add(bx(0.8, 0.16, 0.8, m.shade))
  g.add(bx(0.68, 0.1, 0.68, m.base, 0, 0.16))
  g.add(cy(0.31, 0.34, 0.1, m.trim, 0, 0.26, 0, 20))
  const shaftTop = o.broken ? 0.36 + range(r, 0.5, 1.15) : o.h - 0.26
  g.add(cy(0.235, 0.265, shaftTop - 0.36, m.base, 0, 0.36, 0, 20))
  // two carved rings keep the shaft readable at isometric distance
  g.add(cy(0.27, 0.27, 0.05, m.trim, 0, 0.5, 0, 20))
  if (!o.broken) {
    g.add(cy(0.27, 0.27, 0.05, m.trim, 0, shaftTop - 0.2, 0, 20))
    g.add(cy(0.32, 0.24, 0.12, m.trim, 0, shaftTop, 0, 20))
    g.add(bx(0.72, 0.14, 0.72, m.shade, 0, shaftTop + 0.12))
  } else {
    const stub = cy(0.2, 0.235, 0.2, m.base, 0, 0, 0, 20)
    stub.position.set(0.03, shaftTop + 0.04, -0.02)
    stub.rotation.set(0.32, 0, 0.22)
    g.add(stub)
    g.add(rot(bx(0.14, 0.12, 0.1, m.base, -0.12, shaftTop - 0.02, 0.1), 0.4, 0.5, 0.3))
    // fallen pieces at the foot
    g.add(rock(Math.floor(r() * 6), 0.13, 0.22, 0.12, m.base, 0.34, 0, 0.3))
    g.add(rock(Math.floor(r() * 6), 0.09, 0.16, 0.08, m.shade, -0.33, 0, 0.36))
    const drum = cy(0.15, 0.15, 0.26, m.base, 0, 0, 0, 20)
    drum.position.set(-0.28, 0.12, -0.33)
    drum.rotation.set(0, 0.6, Math.PI / 2)
    g.add(drum)
  }
  if (o.glow) {
    const ember = glowMat(PAL.ember, 3)
    g.add(cy(0.345, 0.345, 0.03, ember, 0, 0.29, 0, 20))
    const top = Math.min(shaftTop, 1.6)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4
      const crack = bx(0.025, top - 0.5, 0.025, ember, Math.sin(a) * 0.255, 0.42, Math.cos(a) * 0.255)
      crack.rotation.z = (r() - 0.5) * 0.25
      g.add(crack)
    }
  }
  return g
}

registerProp('pillar', {
  solid: true,
  build: (ctx) => {
    const style = stoneStyle(ctx)
    const h = num(ctx, 'h', 2.4)
    const broken = bool(ctx, 'broken')
    const color = optColor(ctx)
    const glow = bool(ctx, 'glow')
    const v = broken ? variant(ctx, 4) : 0
    const inner = cachedBuild(`pillar|${style}|${h}|${broken}|${color}|${glow}|${v}`, () => buildPillar({ h, broken, style, color, glow, seed: v }))
    return wrap(inner, broken ? Math.floor(ctx.rand() * 4) * (Math.PI / 2) : 0)
  },
})

// ---------------------------------------------------------------------------
// arch (fits a one-tile gap in a wall by default; `w` widens it)
// ---------------------------------------------------------------------------

function buildArch(style: StoneStyle, color: string, w: number, d: number): THREE.Group {
  const m = stoneMats(style, color)
  const g = new THREE.Group()
  const postW = 0.17
  const half = w / 2
  const inner = half - postW
  const postH = 1.7
  for (const s of [-1, 1]) {
    const x = s * (half - postW / 2)
    g.add(bx(postW + 0.05, 0.14, d + 0.06, m.shade, x, 0))
    g.add(bx(postW, postH, d, m.base, x, 0))
    g.add(bx(postW + 0.05, 0.09, d + 0.05, m.trim, x, postH - 0.09))
  }
  const Rc = inner + 0.09
  const n = 9
  for (let i = 0; i < n; i++) {
    const th = Math.PI * (1 - (i + 0.5) / n)
    const key = i === Math.floor(n / 2)
    const blk = bx(((Math.PI * Rc) / n) * 1.05, key ? 0.27 : 0.18, key ? d + 0.06 : d, key ? m.trim : i % 2 ? m.base : m.shade)
    blk.position.set(Math.cos(th) * Rc, postH + Math.sin(th) * Rc, 0)
    blk.rotation.z = th - Math.PI / 2
    g.add(blk)
  }
  const topY = postH + Rc + 0.16
  for (const s of [-1, 1]) {
    const sw = postW + 0.1
    g.add(bx(sw, topY - postH, d * 0.96, m.base, s * (half - sw / 2), postH))
  }
  g.add(bx(w + 0.08, 0.13, d + 0.08, m.trim, 0, topY))
  return g
}

registerProp('arch', {
  solid: false,
  build: (ctx) => {
    const style = stoneStyle(ctx)
    const w = num(ctx, 'w', 1)
    const d = num(ctx, 'd', 0.5)
    const color = optColor(ctx)
    return cachedBuild(`arch|${style}|${w}|${d}|${color}`, () => buildArch(style, color, w, d))
  },
})

// ---------------------------------------------------------------------------
// door (in a doorframe; `open` swings the leaf inward — scripts may rotate userData.leaf)
// ---------------------------------------------------------------------------

registerProp('door', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    const style = str(ctx, 'style', 'wood')
    const g = new THREE.Group()
    const frameCol = style === 'white' ? PAL.white : style === 'iron' ? PAL.ironDark : PAL.woodDark
    const frame = M(frameCol)
    g.add(bx(0.15, 2.26, 0.32, frame, -0.475, 0))
    g.add(bx(0.15, 2.26, 0.32, frame, 0.475, 0))
    g.add(bx(1.12, 0.17, 0.34, frame, 0, 2.2))
    g.add(bx(0.82, 0.03, 0.3, M(PAL.stoneDark), 0, 0))
    const leaf = new THREE.Group()
    leaf.position.set(-0.41, 0.03, 0)
    const lw = 0.82
    if (style === 'iron') {
      const plate = M(PAL.steel)
      leaf.add(bx(lw, 2.08, 0.07, plate, lw / 2, 0))
      leaf.add(bx(lw - 0.12, 0.9, 0.02, M(shade(PAL.steel, 0.82)), lw / 2, 1.06, 0.04))
      leaf.add(bx(lw - 0.12, 0.8, 0.02, M(shade(PAL.steel, 0.82)), lw / 2, 0.14, 0.04))
      for (const y of [0.1, 1.0, 1.98]) for (const x of [0.08, lw / 2, lw - 0.08]) leaf.add(ball(0.025, 0.025, 0.015, M(PAL.iron), x, y, 0.045, 6))
      leaf.add(torus(0.06, 0.015, M(PAL.brass), lw - 0.14, 1.0, 0.06, 6, 14))
    } else {
      const c = tint(ctx, style === 'white' ? '#f1e9d8' : PAL.wood)
      const p1 = M(c)
      const p2 = M(shade(c, 0.86))
      for (let i = 0; i < 4; i++) leaf.add(bx(lw / 4 - 0.008, 2.08, 0.07, i % 2 ? p2 : p1, lw / 8 + (i * lw) / 4, 0))
      const band = M(style === 'white' ? PAL.brass : PAL.ironDark)
      leaf.add(bx(lw + 0.01, 0.09, 0.09, band, lw / 2, 0.38))
      leaf.add(bx(lw + 0.01, 0.09, 0.09, band, lw / 2, 1.62))
      const brace = bx(0.08, 1.34, 0.08, M(shade(c, 0.75)), lw / 2, 0.4)
      brace.rotation.z = Math.atan2(lw - 0.14, 1.24)
      leaf.add(brace)
      leaf.add(torus(0.065, 0.016, M(PAL.brass), lw - 0.14, 1.02, 0.065, 6, 14))
    }
    finalize(leaf)
    leaf.rotation.y = open ? 1.45 : 0
    keep(leaf)
    g.add(leaf)
    g.userData.leaf = leaf
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------
// gate (iron bars between stone posts, two leaves)
// ---------------------------------------------------------------------------

registerProp('gate', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    const style = stoneStyle(ctx, 'stone')
    const m = stoneMats(style, '')
    const iron = M(tint(ctx, PAL.ironDark))
    const g = new THREE.Group()
    for (const s of [-1, 1]) {
      g.add(bx(0.2, 2.3, 0.26, m.base, s * 0.46, 0))
      g.add(bx(0.26, 0.1, 0.32, m.trim, s * 0.46, 2.3))
      g.add(rot(cn(0.19, 0.24, m.shade, s * 0.46, 2.4, 0, 4), 0, Math.PI / 4, 0))
    }
    const leaves: THREE.Group[] = []
    for (const s of [-1, 1]) {
      const leaf = new THREE.Group()
      leaf.position.set(s * 0.36, 0, 0)
      const dir = -s
      for (let i = 0; i < 4; i++) {
        const x = dir * (0.045 + i * 0.09)
        const top = 1.9 + (s < 0 ? i : 3 - i) * 0.04
        leaf.add(cy(0.016, 0.016, top - 0.06, iron, x, 0.06, 0, 6))
        leaf.add(cn(0.035, 0.1, iron, x, top, 0, 4))
      }
      leaf.add(bx(0.36, 0.045, 0.03, iron, dir * 0.18, 0.24))
      leaf.add(bx(0.36, 0.045, 0.03, iron, dir * 0.18, 1.64))
      leaf.add(torus(0.1, 0.014, iron, dir * 0.18, 0.95, 0, 5, 16))
      finalize(leaf)
      leaf.rotation.y = open ? -s * 1.3 : 0
      keep(leaf)
      g.add(leaf)
      leaves.push(leaf)
    }
    g.userData.leaves = leaves
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------
// window (wall-mounted, back on z = -0.5; lit pane glows)
// ---------------------------------------------------------------------------

function glassTex(): THREE.CanvasTexture {
  return canvasTex('window-glass', 64, 96, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, h * 0.7)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#b8b8b8')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    // curtains drawn darker at the sides
    g.fillStyle = 'rgba(70,40,40,0.55)'
    for (const s of [0, 1]) {
      g.beginPath()
      const x0 = s ? w : 0
      const dx = s ? -1 : 1
      g.moveTo(x0, 0)
      g.lineTo(x0 + dx * 20, 0)
      g.quadraticCurveTo(x0 + dx * 8, h * 0.45, x0 + dx * 16, h)
      g.lineTo(x0, h)
      g.closePath()
      g.fill()
    }
  })
}

function glassMat(color: string): THREE.MeshBasicMaterial {
  return cachedMat(`glass|${color}`, () => {
    const m = new THREE.MeshBasicMaterial({ map: glassTex(), color: new THREE.Color(color).multiplyScalar(2.6), toneMapped: false })
    m.userData.fx = true
    return m
  })
}

registerProp('window', {
  solid: false,
  light: (ctx) => (bool(ctx, 'light') ? { color: tint(ctx, PAL.warm), intensity: 1.4, distance: 4.5, y: 1.45 } : null),
  build: (ctx) => {
    const lit = bool(ctx, 'lit', true)
    const style = str(ctx, 'style', 'wood')
    const arch = bool(ctx, 'arch')
    const shutters = bool(ctx, 'shutters')
    const flowers = bool(ctx, 'flowers')
    const glass = tint(ctx, PAL.warm)
    const key = `window|${lit}|${style}|${arch}|${shutters}|${flowers}|${glass}`
    return cachedBuild(key, () => {
      const g = new THREE.Group()
      const frameCol = style === 'white' ? PAL.white : style === 'iron' ? PAL.ironDark : style === 'stone' ? PAL.stone : PAL.woodDark
      const frame = M(frameCol)
      const z = WALL_Z
      const pane = lit ? glassMat(glass) : M('#2c3e52')
      const cyy = 1.42
      g.add(plane(0.62, 0.84, pane, 0, cyy, z + 0.03))
      g.add(bx(0.08, 0.98, 0.1, frame, -0.35, cyy - 0.49, z + 0.05))
      g.add(bx(0.08, 0.98, 0.1, frame, 0.35, cyy - 0.49, z + 0.05))
      g.add(bx(0.78, 0.08, 0.1, frame, 0, cyy + 0.42, z + 0.05))
      g.add(bx(0.78, 0.08, 0.1, frame, 0, cyy - 0.49, z + 0.05))
      g.add(bx(0.045, 0.84, 0.045, frame, 0, cyy - 0.42, z + 0.05))
      g.add(bx(0.62, 0.045, 0.045, frame, 0, cyy + 0.04, z + 0.05))
      g.add(bx(0.9, 0.06, 0.18, M(style === 'wood' ? PAL.stoneLight : shade(frameCol, 0.9)), 0, cyy - 0.55, z + 0.09))
      if (arch) {
        const half = new THREE.Mesh(cachedGeo('halfdisc', () => new THREE.CircleGeometry(0.31, 20, 0, Math.PI)), pane)
        half.position.set(0, cyy + 0.46, z + 0.03)
        g.add(half)
        g.add(torus(0.35, 0.045, frame, 0, cyy + 0.46, z + 0.05, 6, 16, Math.PI))
      } else {
        g.add(bx(0.86, 0.1, 0.14, frame, 0, cyy + 0.46, z + 0.07))
      }
      if (shutters) {
        const sc = M('#2f8f8a')
        const sd = M('#256f6b')
        for (const s of [-1, 1]) {
          g.add(bx(0.32, 0.94, 0.04, sc, s * 0.58, cyy - 0.47, z + 0.03))
          for (let i = 0; i < 4; i++) g.add(bx(0.26, 0.03, 0.02, sd, s * 0.58, cyy - 0.36 + i * 0.22, z + 0.06))
        }
      }
      if (flowers) {
        g.add(bx(0.8, 0.16, 0.2, M(PAL.woodLight), 0, cyy - 0.74, z + 0.17))
        const r = seeded('wflowers')
        const cols = ['#ff7aa8', '#ffd24a', '#ffffff', '#b07aff']
        for (let i = 0; i < 9; i++) g.add(ball(0.06, 0.055, 0.06, M(i % 3 === 0 ? PAL.leaf : pick(r, cols)), -0.33 + i * 0.083, cyy - 0.55 + r() * 0.04, z + 0.16 + (r() - 0.5) * 0.08, 8))
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// lamppost (street lamp)
// ---------------------------------------------------------------------------

registerProp('lamppost', {
  solid: true,
  light: (ctx) => ({ color: tint(ctx, '#ffc27a'), intensity: 3, distance: 7.5, y: 2.85 }),
  build: (ctx) => {
    const glass = tint(ctx, PAL.warm)
    const brass = str(ctx, 'style', 'iron') === 'brass'
    return cachedBuild(`lamppost|${glass}|${brass}`, () => {
      const g = new THREE.Group()
      const iron = M(brass ? '#3a4a48' : PAL.ironDark)
      const trim = M(brass ? PAL.brass : PAL.iron)
      g.add(cy(0.18, 0.22, 0.24, M(PAL.stoneDark), 0, 0, 0, 16))
      g.add(cy(0.11, 0.15, 0.14, iron, 0, 0.24, 0, 12))
      g.add(cy(0.045, 0.06, 2.2, iron, 0, 0.36, 0, 10))
      g.add(cy(0.075, 0.075, 0.06, trim, 0, 1.0, 0, 12))
      g.add(cy(0.07, 0.07, 0.05, trim, 0, 2.38, 0, 12))
      g.add(cy(0.19, 0.08, 0.12, iron, 0, 2.54, 0, 12))
      g.add(cy(0.19, 0.15, 0.38, glowMat(glass, 3), 0, 2.64, 0, 6))
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        g.add(rod([Math.cos(a) * 0.16, 2.64, Math.sin(a) * 0.16], [Math.cos(a) * 0.198, 3.03, Math.sin(a) * 0.198], 0.014, 0.014, iron, 4))
      }
      g.add(cn(0.28, 0.24, trim, 0, 3.02, 0, 6))
      g.add(ball(0.055, 0.055, 0.055, trim, 0, 3.29, 0, 8))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// lantern (post / hanging / ground)
// ---------------------------------------------------------------------------

/** Lantern hanging below its hook at the origin (about 0.37 tall). */
function lanternHead(glass: string): THREE.Group {
  const g = new THREE.Group()
  const metal = M(PAL.ironDark)
  const glow = glowMat(glass, 3)
  g.add(torus(0.035, 0.01, metal, 0, -0.03, 0, 4, 10))
  g.add(rot(cn(0.15, 0.1, metal, 0, -0.15, 0, 4), 0, Math.PI / 4, 0))
  g.add(bx(0.2, 0.025, 0.2, metal, 0, -0.17))
  g.add(bx(0.15, 0.19, 0.15, glow, 0, -0.355))
  for (const x of [-0.085, 0.085]) for (const z of [-0.085, 0.085]) g.add(bx(0.026, 0.2, 0.026, metal, x, -0.36, z))
  g.add(bx(0.2, 0.03, 0.2, metal, 0, -0.39))
  return g
}

function lanternStyle(ctx: PropContext): 'post' | 'hanging' | 'ground' {
  if (bool(ctx, 'hanging')) return 'hanging'
  const s = str(ctx, 'style', 'post')
  return s === 'hanging' || s === 'ground' ? s : 'post'
}

registerProp('lantern', {
  solid: true,
  light: (ctx) => {
    const s = lanternStyle(ctx)
    return { color: tint(ctx, '#ffb766'), intensity: 2.5, distance: 6, y: s === 'post' ? 1.3 : s === 'hanging' ? 1.85 : 0.2, flicker: true }
  },
  build: (ctx) => {
    const style = lanternStyle(ctx)
    const glass = tint(ctx, PAL.warm)
    const g = new THREE.Group()
    const head = finalize(lanternHead(glass))
    head.scale.setScalar(1.35)
    keep(head)
    if (style === 'post') {
      const wood = M(PAL.woodDark)
      g.add(bx(0.11, 1.78, 0.11, wood, 0, 0))
      g.add(bx(0.16, 0.12, 0.16, M(PAL.stoneDark), 0, 0))
      g.add(bx(0.52, 0.07, 0.07, wood, 0.22, 1.66))
      g.add(rot(bx(0.05, 0.3, 0.05, wood, 0.12, 1.42), 0, 0, -0.75))
      g.add(rod([0.42, 1.66, 0], [0.42, 1.6, 0], 0.01, 0.01, M(PAL.iron), 4))
      head.position.set(0.42, 1.62, 0)
    } else if (style === 'hanging') {
      g.add(rod([0, 2.42, 0], [0, 2.02, 0], 0.01, 0.01, M(PAL.iron), 4))
      g.add(bx(0.14, 0.03, 0.14, M(PAL.ironDark), 0, 2.4))
      head.position.set(0, 2.02, 0)
    } else {
      head.position.set(0, 0.53, 0)
    }
    head.userData.phase = ctx.rand() * 10
    g.add(head)
    if (style !== 'ground') g.userData.swing = head
    return finalize(g)
  },
  animate: (obj, t) => {
    const s = obj.userData.swing as THREE.Object3D | undefined
    if (!s) return
    const p = Number(s.userData.phase) || 0
    s.rotation.z = Math.sin(t * 1.3 + p) * 0.05
    s.rotation.x = Math.sin(t * 0.9 + p * 1.7) * 0.03
  },
})

// ---------------------------------------------------------------------------
// paper_lantern (festival lantern; float -> sky lantern bobbing at y 2.5)
// ---------------------------------------------------------------------------

registerProp('paper_lantern', {
  solid: false,
  light: (ctx) => {
    const y = bool(ctx, 'float') ? 2.5 : bool(ctx, 'pole') ? 1.6 : 2.05
    return { color: tint(ctx, '#ff9a4a'), intensity: 1.8, distance: 5, y }
  },
  build: (ctx) => {
    const color = tint(ctx, '#ff8a3c')
    const float = bool(ctx, 'float')
    const pole = bool(ctx, 'pole')
    const g = new THREE.Group()
    const body = new THREE.Group()
    const dark = M('#5a2418')
    if (float) {
      const shell = cy(0.19, 0.13, 0.4, glowMat(color, 2.6), 0, -0.2, 0, 4)
      shell.rotation.y = Math.PI / 4
      body.add(shell)
      body.add(rot(torus(0.135, 0.012, dark, 0, -0.2, 0, 4, 4), Math.PI / 2, 0, Math.PI / 4))
      body.add(ball(0.05, 0.06, 0.05, glowMat(PAL.flameCore, 3.6), 0, -0.16, 0, 8))
      body.position.set(0, 2.5, 0)
    } else {
      const glow = glowMat(color, 2.4)
      body.add(ball(0.24, 0.29, 0.24, glow, 0, 0, 0, 16))
      for (const [y, rr] of [[0, 0.245], [0.14, 0.214], [-0.14, 0.214]] as const) body.add(ring(rr, 0.012, dark, 0, y, 0, 4, 20))
      body.add(cy(0.1, 0.13, 0.06, dark, 0, 0.255, 0, 12))
      body.add(cy(0.13, 0.1, 0.06, dark, 0, -0.315, 0, 12))
      body.add(cn(0.04, 0.14, M(PAL.gold), 0, -0.47, 0, 6).rotateX(Math.PI))
      body.add(rod([0, 0.31, 0], [0, 0.45, 0], 0.008, 0.008, dark, 4))
      if (pole) {
        const bamboo = M('#b9a35a')
        g.add(cy(0.028, 0.034, 2.05, bamboo, 0, 0, 0, 8))
        for (const y of [0.5, 1.0, 1.5]) g.add(cy(0.036, 0.036, 0.03, M('#8f7a3a'), 0, y, 0, 8))
        g.add(chain([[0, 1.95, 0], [0.18, 2.06, 0], [0.36, 2.02, 0]], 0.022, 0.016, bamboo, 6))
        body.position.set(0.36, 1.57, 0)
      } else {
        body.position.set(0, 2.05, 0)
      }
    }
    finalize(body)
    keep(body)
    body.userData.phase = ctx.rand() * 10
    body.userData.baseY = body.position.y
    g.add(body)
    g.userData.body = body
    g.userData.float = float
    return finalize(g)
  },
  animate: (obj, t) => {
    const b = obj.userData.body as THREE.Object3D | undefined
    if (!b) return
    const p = Number(b.userData.phase) || 0
    if (obj.userData.float) {
      b.position.y = Number(b.userData.baseY) + Math.sin(t * 0.9 + p) * 0.12
      b.rotation.y = t * 0.3 + p
      b.rotation.z = Math.sin(t * 0.7 + p) * 0.06
    } else {
      b.rotation.z = Math.sin(t * 1.1 + p) * 0.06
    }
  },
})

// ---------------------------------------------------------------------------
// fire: brazier, campfire, torch, candles
// ---------------------------------------------------------------------------

registerProp('brazier', {
  solid: true,
  light: { color: '#ff9440', intensity: 3, distance: 7, y: 1.15, flicker: true },
  build: (ctx) => {
    const g = new THREE.Group()
    const iron = M(PAL.ironDark)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5
      g.add(rod([Math.cos(a) * 0.17, 0.66, Math.sin(a) * 0.17], [Math.cos(a) * 0.33, 0.02, Math.sin(a) * 0.33], 0.03, 0.025, iron, 6))
      g.add(ball(0.045, 0.03, 0.045, iron, Math.cos(a) * 0.33, 0.02, Math.sin(a) * 0.33, 8))
    }
    g.add(ring(0.25, 0.018, iron, 0, 0.32, 0, 5, 18))
    g.add(cy(0.34, 0.18, 0.22, iron, 0, 0.6, 0, 16))
    g.add(ring(0.34, 0.03, M(PAL.iron), 0, 0.82, 0, 6, 24))
    g.add(cy(0.31, 0.31, 0.02, M('#2a1a14'), 0, 0.79, 0, 16))
    const ember = glowMat(PAL.ember, 2.8)
    const r = seeded('brazier')
    for (let i = 0; i < 7; i++) {
      const a = r() * Math.PI * 2
      const d = r() * 0.2
      g.add(ball(0.07, 0.05, 0.07, i % 2 ? ember : M('#3a2219'), Math.cos(a) * d, 0.83, Math.sin(a) * d, 6))
    }
    const flames: THREE.Object3D[] = []
    const spots: [number, number, number][] = [[0, 0, 1.5], [0.12, 0.05, 1.05], [-0.1, -0.08, 1.15]]
    for (const [x, z, s] of spots) {
      const f = flame(s, ctx.rand() * 10)
      f.position.set(x, 0.82, z)
      g.add(f)
      flames.push(f)
    }
    g.userData.flames = flames
    return finalize(g)
  },
  animate: (obj, t) => flicker(obj, t),
})

registerProp('campfire', {
  solid: true,
  light: { color: '#ff8a3a', intensity: 3, distance: 7, y: 0.6, flicker: true },
  build: (ctx) => {
    const g = new THREE.Group()
    const r = seeded('campfire' + variant(ctx, 3))
    const stone = M(PAL.stoneDark)
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r() * 0.2
      g.add(rock(i, 0.11, 0.13, 0.1, i % 3 ? stone : M(PAL.stone), Math.cos(a) * 0.38, -0.01, Math.sin(a) * 0.38))
    }
    const bark = M(PAL.bark)
    const charred = M('#2a1d18')
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + r() * 0.3
      g.add(rod([Math.cos(a) * 0.32, 0.03, Math.sin(a) * 0.32], [Math.cos(a) * 0.05, 0.3, Math.sin(a) * 0.05], 0.05, 0.04, i % 2 ? bark : charred, 7))
    }
    g.add(ball(0.2, 0.06, 0.2, glowMat(PAL.ember, 2.6), 0, 0.03, 0, 10))
    const flames: THREE.Object3D[] = []
    for (const [x, z, s] of [[0, 0, 1.8], [0.1, 0.06, 1.2], [-0.09, -0.07, 1.3]] as const) {
      const f = flame(s, ctx.rand() * 10)
      f.position.set(x, 0.04, z)
      g.add(f)
      flames.push(f)
    }
    g.userData.flames = flames
    return finalize(g)
  },
  animate: (obj, t) => flicker(obj, t),
})

registerProp('torch', {
  solid: false,
  light: (ctx) => ({ color: '#ff9a4a', intensity: 1.8, distance: 5.5, y: bool(ctx, 'standing') ? 1.5 : 1.95, flicker: true }),
  build: (ctx) => {
    const standing = bool(ctx, 'standing')
    const g = new THREE.Group()
    const iron = M(PAL.ironDark)
    const wood = M(PAL.wood)
    const wrapM = M('#4a3428')
    let tip: [number, number, number]
    if (standing) {
      g.add(rod([0, 0, 0], [0, 1.3, 0], 0.04, 0.035, wood, 8))
      g.add(cy(0.06, 0.05, 0.14, wrapM, 0, 1.22, 0, 8))
      tip = [0, 1.36, 0]
    } else {
      const z = WALL_Z
      g.add(bx(0.12, 0.22, 0.03, iron, 0, 1.36, z + 0.015))
      g.add(rod([0, 1.44, z + 0.03], [0, 1.5, z + 0.2], 0.018, 0.018, iron, 5))
      g.add(rot(torus(0.05, 0.012, iron, 0, 1.5, z + 0.2, 4, 12), Math.PI / 2, 0, 0))
      g.add(rod([0, 1.3, z + 0.17], [0, 1.78, z + 0.25], 0.03, 0.04, wood, 7))
      g.add(rod([0, 1.7, z + 0.237], [0, 1.82, z + 0.256], 0.055, 0.06, wrapM, 8))
      tip = [0, 1.84, z + 0.26]
    }
    const f = flame(1.15, ctx.rand() * 10)
    f.position.set(tip[0], tip[1], tip[2])
    g.add(f)
    g.userData.flames = [f]
    return finalize(g)
  },
  animate: (obj, t) => flicker(obj, t),
})

registerProp('candles', {
  solid: false,
  light: { color: '#ffb060', intensity: 0.9, distance: 2.6, y: 0.32, flicker: true },
  build: (ctx) => {
    const g = new THREE.Group()
    const r = seeded('candles' + variant(ctx, 4))
    const wax = M(tint(ctx, '#f3ead2'))
    const n = 3 + Math.floor(r() * 3)
    const flames: THREE.Object3D[] = []
    if (bool(ctx, 'dish', true)) g.add(cy(0.17, 0.15, 0.025, M(PAL.brass), 0, 0, 0, 16))
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r()
      const d = i === 0 ? 0 : 0.08 + r() * 0.04
      const h = 0.08 + r() * 0.16
      const rr = 0.026 + r() * 0.012
      const x = Math.cos(a) * d
      const z = Math.sin(a) * d
      g.add(cy(rr, rr, h, wax, x, 0.02, z, 10))
      g.add(ball(rr * 0.6, rr * 0.9, rr * 0.6, wax, x + rr * 0.7, 0.02 + h - 0.01, z, 6))
      const f = flame(0.38, ctx.rand() * 10)
      f.position.set(x, 0.02 + h + 0.004, z)
      g.add(f)
      flames.push(f)
    }
    g.userData.flames = flames
    return finalize(g)
  },
  animate: (obj, t) => flicker(obj, t),
})

// ---------------------------------------------------------------------------
// banner (cloth on a pole, or `wall` hanging on a wall), waves gently
// ---------------------------------------------------------------------------

type Emblem = 'moon' | 'flame' | 'star' | 'wolf' | 'none'

function bannerTex(color: string, emblem: Emblem): THREE.CanvasTexture {
  return canvasTex(`banner|${color}|${emblem}`, 128, 296, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(w, 0)
    g.lineTo(w, h)
    g.lineTo(w / 2, h - 40)
    g.lineTo(0, h)
    g.closePath()
    g.fill()
    const gold = '#f0c050'
    g.strokeStyle = gold
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(12, 0)
    g.lineTo(12, h - 16)
    g.moveTo(w - 12, 0)
    g.lineTo(w - 12, h - 16)
    g.stroke()
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(0, 0, w, 18)
    g.fillStyle = gold
    g.strokeStyle = gold
    const cx = w / 2
    const cyy = h * 0.42
    if (emblem === 'moon') {
      g.beginPath()
      g.arc(cx, cyy, 26, 0, Math.PI * 2)
      g.fill()
      g.lineWidth = 5
      g.beginPath()
      g.ellipse(cx, cyy, 46, 13, -0.35, 0, Math.PI * 2)
      g.stroke()
    } else if (emblem === 'flame') {
      g.beginPath()
      g.moveTo(cx, cyy - 44)
      g.quadraticCurveTo(cx + 36, cyy, cx + 16, cyy + 30)
      g.quadraticCurveTo(cx, cyy + 40, cx - 16, cyy + 30)
      g.quadraticCurveTo(cx - 36, cyy, cx, cyy - 44)
      g.fill()
    } else if (emblem === 'star') {
      g.lineWidth = 6
      g.beginPath()
      for (let i = 0; i <= 5; i++) {
        const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
        const x = cx + Math.cos(a) * 36
        const y = cyy + Math.sin(a) * 36
        if (i === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.stroke()
      g.beginPath()
      g.arc(cx, cyy, 42, 0, Math.PI * 2)
      g.stroke()
    } else if (emblem === 'wolf') {
      g.beginPath()
      g.moveTo(cx - 30, cyy - 40)
      g.lineTo(cx - 14, cyy - 14)
      g.lineTo(cx + 14, cyy - 14)
      g.lineTo(cx + 30, cyy - 40)
      g.lineTo(cx + 28, cyy + 4)
      g.lineTo(cx, cyy + 40)
      g.lineTo(cx - 28, cyy + 4)
      g.closePath()
      g.fill()
      g.fillStyle = color
      g.fillRect(cx - 16, cyy - 2, 9, 6)
      g.fillRect(cx + 7, cyy - 2, 9, 6)
    }
  })
}

registerProp('banner', {
  solid: false,
  build: (ctx) => {
    const color = tint(ctx, PAL.silk)
    const e = str(ctx, 'emblem', 'moon')
    const emblem: Emblem = e === 'flame' || e === 'star' || e === 'wolf' || e === 'none' ? e : 'moon'
    const onWall = bool(ctx, 'wall')
    const g = new THREE.Group()
    const wood = M(PAL.woodDark)
    const gold = M(PAL.gold)
    const W = 0.56
    const H = 1.3
    let top: number
    let z: number
    if (onWall) {
      z = WALL_Z + 0.07
      top = 2.24
      g.add(rod([-0.36, top + 0.03, z], [0.36, top + 0.03, z], 0.022, 0.022, wood, 8))
      g.add(ball(0.04, 0.04, 0.04, gold, -0.37, top + 0.03, z, 8))
      g.add(ball(0.04, 0.04, 0.04, gold, 0.37, top + 0.03, z, 8))
      for (const x of [-0.3, 0.3]) g.add(bx(0.03, 0.06, 0.07, M(PAL.ironDark), x, top + 0.02, WALL_Z + 0.035))
    } else {
      z = 0.05
      top = 2.32
      g.add(cy(0.034, 0.04, 2.62, wood, 0, 0, -0.02, 8))
      g.add(bx(0.3, 0.08, 0.3, M(PAL.stoneDark), 0, 0, -0.02))
      g.add(rod([-0.34, top + 0.03, 0.02], [0.34, top + 0.03, 0.02], 0.02, 0.02, wood, 8))
      g.add(cn(0.05, 0.14, gold, 0, 2.62, -0.02, 8))
      g.add(ball(0.035, 0.035, 0.035, gold, -0.35, top + 0.03, 0.02, 8))
      g.add(ball(0.035, 0.035, 0.035, gold, 0.35, top + 0.03, 0.02, 8))
    }
    const geo = new THREE.PlaneGeometry(W, H, 2, 10)
    geo.translate(0, -H / 2, 0)
    const cloth = new THREE.Mesh(geo, texMat(`banner|${color}|${emblem}`, bannerTex(color, emblem), { side: THREE.DoubleSide, alphaTest: 0.5 }))
    cloth.position.set(0, top, z)
    cloth.castShadow = true
    cloth.receiveShadow = true
    keep(cloth)
    cloth.userData.base = Float32Array.from(geo.getAttribute('position').array)
    cloth.userData.phase = ctx.rand() * 10
    cloth.userData.amp = onWall ? 0.02 : 0.05
    g.add(cloth)
    g.userData.cloth = cloth
    return finalize(g)
  },
  animate: (obj, t) => {
    const cloth = obj.userData.cloth as THREE.Mesh | undefined
    if (!cloth) return
    const base = cloth.userData.base as Float32Array
    const p = Number(cloth.userData.phase) || 0
    const amp = Number(cloth.userData.amp) || 0.04
    const pos = cloth.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      const k = -y / 1.3
      pos.setZ(i, Math.sin(t * 2.1 + p + y * 3.2 + x * 2) * amp * k)
    }
    pos.needsUpdate = true
  },
})

// ---------------------------------------------------------------------------
// sign (Kitsune warning sign: white disc with a blank, open-mouthed face)
// ---------------------------------------------------------------------------

function faceTex(): THREE.CanvasTexture {
  return canvasTex('kitsune-face', 256, 256, (g, w, h, r) => {
    const cx = w / 2
    const grad = g.createRadialGradient(cx, h * 0.45, 20, cx, h / 2, w / 2)
    grad.addColorStop(0, '#fbf8f0')
    grad.addColorStop(0.75, '#ebe5d6')
    grad.addColorStop(1, '#bdb3a0')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    // grime streaks running down
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(90,80,60,${0.05 + r() * 0.08})`
      const x = r() * w
      g.fillRect(x, h * (0.4 + r() * 0.3), 2 + r() * 4, h)
    }
    // the open mouth: a tall dark oval, slightly crooked
    g.save()
    g.translate(cx, h * 0.6)
    g.rotate(0.06)
    g.fillStyle = '#2a1414'
    g.beginPath()
    g.ellipse(0, 0, 30, 46, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0c0606'
    g.beginPath()
    g.ellipse(0, 6, 20, 34, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
    // faint brows: no eyes at all, which is what makes it wrong
    g.strokeStyle = 'rgba(60,50,40,0.25)'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(cx - 52, h * 0.34)
    g.quadraticCurveTo(cx - 30, h * 0.3, cx - 12, h * 0.35)
    g.moveTo(cx + 12, h * 0.35)
    g.quadraticCurveTo(cx + 30, h * 0.3, cx + 52, h * 0.34)
    g.stroke()
  })
}

registerProp('sign', {
  solid: true,
  build: (ctx) =>
    wrap(
      cachedBuild('kitsune-sign', () => {
        const g = new THREE.Group()
        const wood = M('#4a3a30')
        g.add(rot(bx(0.1, 1.6, 0.1, wood, 0, 0, -0.02), 0.03, 0, -0.04))
        g.add(rot(bx(0.08, 0.36, 0.06, wood, 0, 1.1, 0.0), 0, 0, 0.9))
        const disc = cy(0.37, 0.37, 0.05, M('#e9e2d2'), 0, 0, 0, 28)
        disc.rotation.x = Math.PI / 2
        disc.position.set(0, 1.4, 0.06)
        g.add(disc)
        const face = new THREE.Mesh(cachedGeo('circle', () => new THREE.CircleGeometry(0.5, 40)), texMat('kitsune-face', faceTex()))
        face.scale.setScalar(0.7)
        face.position.set(0, 1.4, 0.0865)
        g.add(face)
        g.add(torus(0.37, 0.02, M('#8a2a2a'), 0, 1.4, 0.06, 6, 28))
        for (const x of [-0.2, 0.2]) g.add(ball(0.02, 0.02, 0.012, M(PAL.iron), x, 1.66, 0.09, 6))
        g.add(rod([0.02, 1.74, 0.06], [0.14, 1.3, 0.08], 0.014, 0.014, M('#d84a3a'), 4))
        return g
      }),
      (ctx.rand() - 0.5) * 0.3,
    ),
})

// ---------------------------------------------------------------------------
// signpost (wooden post with arrow boards)
// ---------------------------------------------------------------------------

function arrowShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, -0.075)
  s.lineTo(0.5, -0.075)
  s.lineTo(0.62, 0)
  s.lineTo(0.5, 0.075)
  s.lineTo(0, 0.075)
  s.lineTo(0.04, 0)
  s.closePath()
  return s
}

registerProp('signpost', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 4)
    return cachedBuild(`signpost|${v}`, () => {
      const r = seeded('signpost' + v)
      const g = new THREE.Group()
      const wood = M(PAL.woodDark)
      g.add(bx(0.11, 1.9, 0.11, wood))
      g.add(rot(cn(0.1, 0.12, wood, 0, 1.9, 0, 4), 0, Math.PI / 4, 0))
      const boardCols = ['#e8c48a', PAL.woodPale, '#d9a868']
      for (let i = 0; i < 3; i++) {
        const board = extrude('arrow', arrowShape, 0.045, M(boardCols[i]))
        const a = (r() - 0.5) * 2.2 + (i % 2 ? Math.PI : 0)
        board.scale.set(1.35, 1.5, 1)
        board.position.set(0, 1.6 - i * 0.32, 0)
        board.rotation.y = a
        board.translateX(-0.08)
        g.add(board)
        const text = bx(0.46, 0.03, 0.05, M('#5a3a24'), 0, 0, 0)
        text.position.copy(board.position)
        text.rotation.copy(board.rotation)
        text.translateX(0.37)
        text.translateY(-0.015)
        g.add(text)
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// gravestone
// ---------------------------------------------------------------------------

registerProp('gravestone', {
  solid: true,
  build: (ctx) => {
    const broken = bool(ctx, 'broken')
    const shapes = ['round', 'cross', 'slab'] as const
    const sp = str(ctx, 'shape', '')
    const shapeName = (shapes as readonly string[]).includes(sp) ? sp : shapes[variant(ctx, 3)]
    const v = variant(ctx, 3)
    const color = tint(ctx, '#9a958c')
    const inner = cachedBuild(`grave|${broken}|${shapeName}|${v}|${color}`, () => {
      const r = seeded('grave' + v)
      const g = new THREE.Group()
      const stone = M(color)
      const dark = M(shade(color, 0.7))
      const moss = M(PAL.moss)
      const s = new THREE.Group()
      s.position.z = -0.22
      s.rotation.set((r() - 0.5) * 0.12, (r() - 0.5) * 0.2, (r() - 0.5) * 0.12)
      g.add(bx(0.6, 0.08, 0.26, dark, 0, 0, -0.22))
      if (shapeName === 'cross') {
        const h = broken ? 0.45 : 0.9
        s.add(bx(0.13, h, 0.11, stone, 0, 0.08))
        if (!broken) {
          s.add(bx(0.44, 0.12, 0.11, stone, 0, 0.6))
          s.add(rot(torus(0.13, 0.025, stone, 0, 0.66, 0, 5, 18), 0, 0, 0))
        }
      } else {
        const w = shapeName === 'slab' ? 0.42 : 0.48
        const h = broken ? 0.32 : shapeName === 'slab' ? 0.72 : 0.5
        s.add(bx(w, h, 0.12, stone, 0, 0.08))
        if (!broken && shapeName === 'round') {
          const top = new THREE.Mesh(cachedGeo('halfcyl', () => new THREE.CylinderGeometry(1, 1, 1, 18, 1, false, Math.PI / 2, Math.PI)), stone)
          top.rotation.x = Math.PI / 2
          top.scale.set(w / 2, 0.12, w / 2)
          top.position.set(0, 0.08 + h, 0)
          top.castShadow = true
          top.receiveShadow = true
          s.add(top)
        }
        if (!broken && shapeName === 'slab') s.add(rot(bx(w * 0.72, w * 0.72, 0.121, stone, 0, 0.08 + h - w * 0.36), 0, 0, Math.PI / 4))
        if (!broken) {
          s.add(bx(0.05, 0.22, 0.02, dark, 0, 0.3, 0.062))
          s.add(bx(0.16, 0.05, 0.02, dark, 0, 0.42, 0.062))
        }
      }
      if (broken) {
        s.add(rot(bx(0.18, 0.1, 0.12, stone, -0.1, 0.38), 0, 0, 0.5))
        const piece = bx(0.44, 0.3, 0.11, stone, 0.08, 0.04, 0.22)
        piece.rotation.set(-1.35, 0.4, 0.1)
        g.add(piece)
      }
      g.add(s)
      g.add(ball(0.08, 0.04, 0.06, moss, -0.18, 0.1, -0.15, 8))
      g.add(ball(0.32, 0.1, 0.4, M('#6b5038'), 0, 0, 0.16, 12))
      g.add(ball(0.12, 0.06, 0.1, M(PAL.grass), 0.16, 0.06, 0.3, 8))
      return g
    })
    return inner
  },
})

// ---------------------------------------------------------------------------
// well
// ---------------------------------------------------------------------------

registerProp('well', {
  solid: true,
  build: () =>
    cachedBuild('well', () => {
      const g = new THREE.Group()
      const stone = M(PAL.stone)
      const stoneL = M(PAL.stoneLight)
      g.add(lathe('wellring', [[0.47, 0], [0.47, 0.6], [0.36, 0.6], [0.36, 0.2]], stone, 20))
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        const cap = bx(0.24, 0.1, 0.14, i % 2 ? stoneL : stone, Math.cos(a) * 0.415, 0.58, Math.sin(a) * 0.415)
        cap.rotation.y = -a + Math.PI / 2
        g.add(cap)
      }
      const water = cy(0.36, 0.36, 0.02, M('#2f6f8a', { emissive: '#14465a', ei: 0.4 }), 0, 0.3, 0, 20)
      fx(water)
      g.add(water)
      const wood = M(PAL.wood)
      g.add(bx(0.09, 1.45, 0.09, wood, -0.44, 0.45))
      g.add(bx(0.09, 1.45, 0.09, wood, 0.44, 0.45))
      const roof = M('#9a4a34')
      for (const s of [-1, 1]) {
        const p = bx(1.15, 0.05, 0.52, roof, 0, 0, 0)
        p.position.set(0, 1.98, s * 0.2)
        p.rotation.x = s * 0.62
        g.add(p)
      }
      g.add(bx(1.2, 0.07, 0.07, M(PAL.woodDark), 0, 2.1))
      g.add(rod([-0.5, 1.45, 0], [0.55, 1.45, 0], 0.035, 0.035, M(PAL.woodDark), 8))
      g.add(rod([0.55, 1.45, 0], [0.55, 1.32, 0.1], 0.015, 0.015, M(PAL.iron), 4))
      g.add(rod([0, 1.43, 0], [0, 0.95, 0], 0.01, 0.01, M(PAL.rope), 4))
      g.add(cy(0.1, 0.08, 0.15, M(PAL.woodLight), 0, 0.8, 0, 12))
      g.add(cy(0.103, 0.103, 0.025, M(PAL.ironDark), 0, 0.9, 0, 12))
      return g
    }),
})

// ---------------------------------------------------------------------------
// fountain (round basin; `glow` -> bioluminescent Nyau water)
// ---------------------------------------------------------------------------

registerProp('fountain', {
  solid: true,
  light: (ctx) => (bool(ctx, 'glow') ? { color: PAL.bio, intensity: 1.0, distance: 4.5, y: 1.1 } : null),
  build: (ctx) => {
    const glow = bool(ctx, 'glow')
    const style = stoneStyle(ctx)
    const g = new THREE.Group()
    const m = stoneMats(style, optColor(ctx))
    g.add(lathe('basin', [[0.49, 0], [0.5, 0.3], [0.47, 0.36], [0.42, 0.36], [0.42, 0.12]], m.base, 24))
    g.add(cy(0.5, 0.5, 0.05, m.shade, 0, 0, 0, 24))
    const waterMat = glow ? M('#2a9a96', { emissive: PAL.bio, ei: 0.5 }) : M('#3f9ac0', { emissive: '#1d5f80', ei: 0.35 })
    const water = cy(0.42, 0.42, 0.02, waterMat, 0, 0.27, 0, 24)
    fx(water)
    g.add(water)
    g.add(cy(0.08, 0.11, 0.62, m.trim, 0, 0.12, 0, 12))
    g.add(lathe('fbowl', [[0.04, 0], [0.22, 0.08], [0.25, 0.13], [0.21, 0.13], [0.05, 0.06]], m.base, 20).translateY(0.64))
    g.add(cy(0.2, 0.2, 0.015, waterMat, 0, 0.75, 0, 16))
    g.add(ball(0.06, 0.09, 0.06, m.trim, 0, 0.84, 0, 10))
    const curtain = new THREE.Mesh(cachedGeo('fcurtain', () => new THREE.CylinderGeometry(0.24, 0.31, 1, 20, 1, true)), M('#cfefff', { opacity: 0.4, side: THREE.DoubleSide }))
    curtain.scale.set(1, 0.48, 1)
    curtain.position.set(0, 0.52, 0)
    fx(curtain)
    g.add(curtain)
    const jet = cn(0.035, 0.28, M('#e6f8ff', { opacity: 0.55 }), 0, 0.88, 0, 8)
    fx(jet)
    g.add(jet)
    const rip = new THREE.Group()
    rip.position.y = 0.29
    rip.add(ring(0.12, 0.006, glow ? glowMat(PAL.bio, 2) : M('#e6f8ff', { opacity: 0.6 }), 0, 0, 0, 4, 32))
    fx(rip)
    keep(rip)
    g.add(rip)
    g.userData.ripple = rip
    return finalize(g)
  },
  animate: (obj, t) => {
    const r = obj.userData.ripple as THREE.Object3D | undefined
    if (!r) return
    const k = (t * 0.5) % 1
    r.scale.setScalar(0.6 + k * 2.4)
  },
})

// ---------------------------------------------------------------------------
// bridge (walkable plank segment running along Z) & dock post
// ---------------------------------------------------------------------------

registerProp('bridge', {
  solid: false,
  build: (ctx) => {
    const rails = bool(ctx, 'rails', true)
    const v = variant(ctx, 3)
    return cachedBuild(`bridge|${rails}|${v}`, () => {
      const r = seeded('bridge' + v)
      const g = new THREE.Group()
      const cols = [M(PAL.woodLight), M(PAL.wood), M('#9a6a42')]
      for (let i = 0; i < 6; i++) {
        const p = bx(1.02 + (r() - 0.5) * 0.06, 0.06, 0.155, cols[i % 3], (r() - 0.5) * 0.03, -0.02 + r() * 0.015, -0.42 + i * 0.168)
        p.rotation.y = (r() - 0.5) * 0.05
        g.add(p)
      }
      const beam = M(PAL.woodDark)
      g.add(bx(0.09, 0.1, 1.0, beam, -0.38, -0.12))
      g.add(bx(0.09, 0.1, 1.0, beam, 0.38, -0.12))
      if (rails) {
        const rope = M(PAL.rope)
        for (const s of [-1, 1]) {
          for (const z of [-0.45, 0.45]) g.add(cy(0.045, 0.05, 1.5, beam, s * 0.5, -0.75, z, 8))
          g.add(chain([[s * 0.5, 0.68, -0.45], [s * 0.5, 0.6, 0], [s * 0.5, 0.68, 0.45]], 0.018, 0.018, rope, 5, false))
        }
      }
      return g
    })
  },
})

registerProp('dock_post', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 3)
    return cachedBuild(`dockpost|${v}`, () => {
      const r = seeded('dock' + v)
      const g = new THREE.Group()
      const wood = M(PAL.woodGrey)
      const tilt = (r() - 0.5) * 0.1
      const post = new THREE.Group()
      post.rotation.set(tilt, 0, (r() - 0.5) * 0.1)
      post.add(cy(0.13, 0.14, 1.9, wood, 0, -0.9, 0, 12))
      post.add(cy(0.145, 0.145, 0.2, M('#3f5a34'), 0, -0.3, 0, 12))
      post.add(cy(0.14, 0.14, 0.04, M(PAL.ironDark), 0, 0.98, 0, 12))
      const rope = M(PAL.rope)
      post.add(ring(0.14, 0.025, rope, 0, 0.72, 0, 6, 16))
      post.add(ring(0.14, 0.025, rope, 0, 0.78, 0, 6, 16))
      post.add(chain([[0.13, 0.75, 0], [0.2, 0.55, 0.05], [0.22, 0.4, 0.02]], 0.022, 0.022, rope, 5, false))
      g.add(post)
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// statue_pedestal (empty: only the broken feet remain)
// ---------------------------------------------------------------------------

registerProp('statue_pedestal', {
  solid: true,
  build: (ctx) => {
    const style = stoneStyle(ctx)
    const stubs = bool(ctx, 'stubs', true)
    const color = optColor(ctx)
    return cachedBuild(`pedestal|${style}|${stubs}|${color}`, () => {
      const m = stoneMats(style, color)
      const g = new THREE.Group()
      g.add(bx(0.92, 0.15, 0.92, m.shade))
      g.add(bx(0.8, 0.12, 0.8, m.base, 0, 0.15))
      g.add(bx(0.58, 0.9, 0.58, m.base, 0, 0.27))
      g.add(bx(0.7, 0.1, 0.7, m.trim, 0, 1.17))
      g.add(bx(0.62, 0.07, 0.62, m.base, 0, 1.27))
      g.add(bx(0.32, 0.17, 0.02, M(PAL.brass), 0, 0.68, 0.295))
      if (stubs) {
        for (const s of [-1, 1]) {
          g.add(bx(0.11, 0.07, 0.2, m.trim, s * 0.1, 1.34, 0.03))
          g.add(cy(0.045, 0.05, 0.12, m.trim, s * 0.1, 1.4, -0.01, 8))
        }
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// mosaic (wall panel with a winged figure; black -> black wings)
// ---------------------------------------------------------------------------

function mosaicTex(black: boolean): THREE.CanvasTexture {
  return canvasTex(`mosaic|${black}`, 256, 448, (g, w, h, r) => {
    const cols = 32
    const rows = 56
    const cell = w / cols
    const src = document.createElement('canvas')
    src.width = cols
    src.height = rows
    const s = src.getContext('2d')
    if (!s) return
    const bg = s.createLinearGradient(0, 0, 0, rows)
    bg.addColorStop(0, '#203f86')
    bg.addColorStop(1, '#155d70')
    s.fillStyle = bg
    s.fillRect(0, 0, cols, rows)
    const cx = cols / 2
    // halo
    s.fillStyle = black ? '#7a4ab0' : '#f0c050'
    s.beginPath()
    s.arc(cx, 13, 6.5, 0, Math.PI * 2)
    s.fill()
    // wings
    const outer = black ? '#16121c' : '#f5ecd6'
    const innerC = black ? '#2c2240' : '#e0c890'
    for (const side of [-1, 1]) {
      s.fillStyle = outer
      s.beginPath()
      s.moveTo(cx + side * 2, 22)
      s.quadraticCurveTo(cx + side * 17, 3, cx + side * 15.5, 26)
      s.quadraticCurveTo(cx + side * 13, 38, cx + side * 3, 35)
      s.closePath()
      s.fill()
      s.fillStyle = innerC
      s.beginPath()
      s.moveTo(cx + side * 2, 24)
      s.quadraticCurveTo(cx + side * 12, 10, cx + side * 11, 26)
      s.quadraticCurveTo(cx + side * 9, 32, cx + side * 3, 31)
      s.closePath()
      s.fill()
    }
    // robe (temple purple) and pale inner stripe
    s.fillStyle = '#8a44c8'
    s.beginPath()
    s.moveTo(cx, 18)
    s.lineTo(cx + 7, 50)
    s.lineTo(cx - 7, 50)
    s.closePath()
    s.fill()
    s.fillStyle = '#f2e6c8'
    s.fillRect(cx - 1, 22, 2, 28)
    // head and hair
    s.fillStyle = '#f2d2b4'
    s.beginPath()
    s.arc(cx, 14, 3.2, 0, Math.PI * 2)
    s.fill()
    s.fillStyle = black ? '#e8e8f0' : '#3a2a20'
    s.fillRect(cx - 3.4, 10.5, 6.8, 2)
    // ground band and border
    s.fillStyle = '#2a7a5a'
    s.fillRect(0, 50, cols, 3)
    s.strokeStyle = '#d6a548'
    s.lineWidth = 2
    s.strokeRect(1, 1, cols - 2, rows - 2)
    const data = s.getImageData(0, 0, cols, rows).data
    g.fillStyle = '#d8ceb8'
    g.fillRect(0, 0, w, h)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const k = 0.9 + r() * 0.18
        g.fillStyle = `rgb(${Math.min(255, data[i] * k) | 0},${Math.min(255, data[i + 1] * k) | 0},${Math.min(255, data[i + 2] * k) | 0})`
        g.fillRect(x * cell + 0.7, y * cell + 0.7, cell - 1.4, cell - 1.4)
      }
    }
  })
}

registerProp('mosaic', {
  solid: false,
  build: (ctx) => {
    const black = bool(ctx, 'black')
    return cachedBuild(`mosaic|${black}`, () => {
      const g = new THREE.Group()
      const frame = M(PAL.whiteShade)
      const z = WALL_Z
      g.add(bx(1.1, 1.96, 0.06, frame, 0, 0.32, z + 0.03))
      g.add(plane(0.96, 1.74, texMat(`mosaic|${black}`, mosaicTex(black)), 0, 1.3, z + 0.062))
      g.add(bx(1.18, 0.08, 0.1, M(PAL.brass), 0, 2.26, z + 0.05))
      g.add(bx(1.18, 0.08, 0.1, M(PAL.brass), 0, 0.3, z + 0.05))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// names_wall (free-standing stone slab with scratched names)
// ---------------------------------------------------------------------------

const SYL = ['ar', 'el', 'mi', 'ra', 'to', 'ka', 'ne', 'li', 'sa', 'vo', 'du', 'ri', 'an', 'ta', 'ko', 'ze', 'na', 'lo', 've', 'is']

function namesTex(): THREE.CanvasTexture {
  return canvasTex('names-wall', 256, 384, (g, w, h, r) => {
    g.fillStyle = '#7c776f'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.05})`
      g.beginPath()
      g.arc(r() * w, r() * h, 6 + r() * 26, 0, Math.PI * 2)
      g.fill()
    }
    const name = (): string => {
      let s = ''
      const n = 2 + Math.floor(r() * 2)
      for (let i = 0; i < n; i++) s += SYL[Math.floor(r() * SYL.length)]
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
    g.textBaseline = 'middle'
    let y = 14
    while (y < h - 8) {
      let x = 8 + r() * 14
      const size = 11 + Math.floor(r() * 5)
      while (x < w - 30) {
        const t = name()
        g.save()
        g.translate(x, y + (r() - 0.5) * 3)
        g.rotate((r() - 0.5) * 0.12)
        g.font = `${r() > 0.5 ? 'italic ' : ''}${size}px Georgia, serif`
        g.strokeStyle = 'rgba(40,36,32,0.55)'
        g.lineWidth = 2
        g.strokeText(t, 1, 1)
        g.fillStyle = `rgba(236,230,216,${0.6 + r() * 0.35})`
        g.fillText(t, 0, 0)
        g.restore()
        x += g.measureText(t).width * (size / 10) + 14 + r() * 18
      }
      y += size + 4 + r() * 5
    }
    // scratches over everything
    g.strokeStyle = 'rgba(230,225,210,0.35)'
    g.lineWidth = 1
    for (let i = 0; i < 26; i++) {
      const x = r() * w
      const yy = r() * h
      g.beginPath()
      g.moveTo(x, yy)
      g.lineTo(x + (r() - 0.5) * 40, yy + (r() - 0.5) * 10)
      g.stroke()
    }
  })
}

registerProp('names_wall', {
  solid: true,
  build: () =>
    cachedBuild('names_wall', () => {
      const g = new THREE.Group()
      const stone = M('#8a857c')
      g.add(bx(1.24, 0.14, 0.36, M(PAL.stoneDark)))
      g.add(bx(1.1, 1.72, 0.22, stone, 0, 0.14))
      g.add(rot(bx(0.4, 0.14, 0.22, stone, -0.3, 1.82), 0, 0, 0.12))
      g.add(rot(bx(0.5, 0.1, 0.22, stone, 0.25, 1.83), 0, 0, -0.08))
      g.add(plane(1.0, 1.56, texMat('names-wall', namesTex()), 0, 0.98, 0.112))
      g.add(cy(0.035, 0.03, 0.1, M('#f3ead2'), 0.4, 0.14, 0.2, 8))
      return g
    }),
})

// ---------------------------------------------------------------------------
// sluice (tidal sluice gate across a canal; `open` raises the gate)
// ---------------------------------------------------------------------------

registerProp('sluice', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    const style = stoneStyle(ctx)
    const m = stoneMats(style, optColor(ctx))
    const g = new THREE.Group()
    for (const s of [-1, 1]) {
      g.add(bx(0.22, 2.0, 0.6, m.base, s * 0.5, -0.65))
      g.add(bx(0.28, 0.1, 0.66, m.trim, s * 0.5, 1.35))
      g.add(bx(0.04, 1.9, 0.12, M(PAL.ironDark), s * 0.37, -0.6))
    }
    g.add(bx(1.24, 0.18, 0.34, M(PAL.woodDark), 0, 1.3))
    const gate = new THREE.Group()
    const plank = M(PAL.wood)
    const plank2 = M(PAL.woodLight)
    for (let i = 0; i < 6; i++) gate.add(bx(0.74, 0.2, 0.08, i % 2 ? plank : plank2, 0, -0.6 + i * 0.2))
    gate.add(bx(0.76, 0.07, 0.1, M(PAL.ironDark), 0, -0.25))
    gate.add(bx(0.76, 0.07, 0.1, M(PAL.ironDark), 0, 0.4))
    gate.add(cy(0.025, 0.025, 1.4, M(PAL.iron), 0, 0.6, 0, 6))
    finalize(gate)
    gate.position.y = open ? 0.95 : 0
    keep(gate)
    g.add(gate)
    g.userData.gate = gate
    const wheel = new THREE.Group()
    wheel.position.set(0, 1.72, 0.08)
    wheel.add(torus(0.24, 0.025, M(PAL.iron), 0, 0, 0, 6, 20))
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI
      wheel.add(rod([Math.cos(a) * -0.23, Math.sin(a) * -0.23, 0], [Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0], 0.015, 0.015, M(PAL.iron), 5))
    }
    wheel.add(cy(0.05, 0.05, 0.08, M(PAL.brass), 0, -0.04, 0, 10).rotateX(Math.PI / 2))
    g.add(wheel)
    g.add(bx(0.12, 0.3, 0.12, M(PAL.ironDark), 0, 1.45, 0))
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------
// waterwheel (animated; axle along X, wheel spans three cells along Z)
// ---------------------------------------------------------------------------

registerProp('waterwheel', {
  solid: true,
  footprint: [
    [0, -1],
    [0, 1],
  ],
  build: () => {
    const g = new THREE.Group()
    const wood = M(PAL.woodLight)
    const dark = M(PAL.wood)
    const wheel = new THREE.Group()
    const R = 0.95
    for (const x of [-0.2, 0.2]) {
      const rim = torus(R, 0.045, dark, x, 0, 0, 5, 24)
      rim.rotation.y = Math.PI / 2
      wheel.add(rim)
      const rim2 = torus(R * 0.62, 0.03, dark, x, 0, 0, 5, 20)
      rim2.rotation.y = Math.PI / 2
      wheel.add(rim2)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        wheel.add(rod([x, 0, 0], [x, Math.sin(a) * R, Math.cos(a) * R], 0.028, 0.022, dark, 6))
      }
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const p = bx(0.46, 0.035, 0.26, i % 2 ? wood : M(PAL.woodLight), 0, 0, 0)
      p.position.set(0, Math.sin(a) * (R - 0.08), Math.cos(a) * (R - 0.08))
      p.rotation.x = -a
      wheel.add(p)
    }
    wheel.add(cy(0.12, 0.12, 0.5, M(PAL.ironDark), 0, -0.25, 0, 12).rotateZ(Math.PI / 2))
    finalize(wheel)
    wheel.position.set(0, 0.72, 0)
    keep(wheel)
    g.add(wheel)
    g.userData.wheel = wheel
    g.add(rod([-0.62, 0.72, 0], [0.62, 0.72, 0], 0.05, 0.05, M(PAL.iron), 8))
    for (const x of [-0.52, 0.52]) {
      g.add(rod([x, -0.3, -0.45], [x, 0.78, 0], 0.06, 0.05, dark, 6))
      g.add(rod([x, -0.3, 0.45], [x, 0.78, 0], 0.06, 0.05, dark, 6))
      g.add(bx(0.12, 0.12, 0.16, dark, x, 0.66, 0))
    }
    return finalize(g)
  },
  animate: (obj, _t, dt) => {
    const w = obj.userData.wheel as THREE.Object3D | undefined
    if (w) w.rotation.x -= dt * 0.55
  },
})

// ---------------------------------------------------------------------------
// railing & fence (segments along X through the cell centre)
// ---------------------------------------------------------------------------

registerProp('railing', {
  solid: true,
  build: (ctx) => {
    const s = str(ctx, 'style', 'white')
    const style = s === 'iron' || s === 'wood' ? s : 'white'
    const color = optColor(ctx)
    return cachedBuild(`railing|${style}|${color}`, () => {
      const g = new THREE.Group()
      if (style === 'white') {
        const m = stoneMats('white', color)
        g.add(bx(1.0, 0.09, 0.2, m.trim, 0, 0.8))
        g.add(bx(1.0, 0.1, 0.18, m.shade, 0, 0))
        for (let i = 0; i < 5; i++) g.add(lathe('baluster', [[0.04, 0], [0.065, 0.06], [0.05, 0.14], [0.08, 0.34], [0.045, 0.52], [0.06, 0.62], [0.06, 0.7]], m.base, 10).translateX(-0.4 + i * 0.2).translateY(0.1))
      } else if (style === 'iron') {
        const iron = M(color || PAL.ironDark)
        g.add(bx(1.0, 0.05, 0.06, iron, 0, 0.85))
        g.add(bx(1.0, 0.04, 0.05, iron, 0, 0.1))
        for (let i = 0; i < 7; i++) {
          const x = -0.42 + i * 0.14
          g.add(cy(0.014, 0.014, 0.8, iron, x, 0.06, 0, 6))
          if (i % 2 === 0) g.add(ball(0.03, 0.03, 0.03, M(PAL.brass), x, 0.92, 0, 6))
        }
        g.add(torus(0.08, 0.012, iron, -0.21, 0.5, 0, 4, 14))
        g.add(torus(0.08, 0.012, iron, 0.21, 0.5, 0, 4, 14))
      } else {
        const wood = M(color || PAL.wood)
        g.add(bx(0.09, 0.9, 0.09, wood, -0.45, 0))
        g.add(bx(0.09, 0.9, 0.09, wood, 0.45, 0))
        g.add(bx(1.0, 0.07, 0.1, M(PAL.woodLight), 0, 0.84))
        g.add(bx(1.0, 0.05, 0.06, wood, 0, 0.4))
      }
      return g
    })
  },
})

registerProp('fence', {
  solid: true,
  build: (ctx) => {
    const picket = bool(ctx, 'picket')
    const color = tint(ctx, PAL.woodLight)
    const v = variant(ctx, 4)
    return cachedBuild(`fence|${picket}|${color}|${v}`, () => {
      const r = seeded('fence' + v)
      const g = new THREE.Group()
      const wood = M(color)
      const dark = M(shade(color, 0.72))
      for (const x of [-0.46, 0.46]) g.add(rot(bx(0.1, 0.88 + r() * 0.08, 0.1, dark, x, 0), (r() - 0.5) * 0.06, 0, (r() - 0.5) * 0.08))
      if (picket) {
        g.add(bx(1.0, 0.06, 0.04, dark, 0, 0.22, -0.04))
        g.add(bx(1.0, 0.06, 0.04, dark, 0, 0.58, -0.04))
        for (let i = 0; i < 6; i++) {
          const x = -0.35 + i * 0.14
          g.add(bx(0.09, 0.7, 0.03, wood, x, 0.02, 0))
          g.add(rot(cn(0.065, 0.1, wood, x, 0.72, 0, 4), 0, Math.PI / 4, 0))
        }
      } else {
        const a = rot(bx(1.02, 0.08, 0.06, wood, 0, 0.32), 0, 0, (r() - 0.5) * 0.08)
        const b = rot(bx(1.02, 0.08, 0.06, wood, 0, 0.66), 0, 0, (r() - 0.5) * 0.08)
        g.add(a, b)
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// awning (wall-mounted striped canopy)
// ---------------------------------------------------------------------------

export function stripeTex(color: string, valance: boolean): THREE.CanvasTexture {
  return canvasTex(`stripes|${color}|${valance}`, 128, valance ? 32 : 128, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    const n = 8
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? '#f5ecd6' : color
      if (valance) {
        g.beginPath()
        g.moveTo((i * w) / n, 0)
        g.lineTo(((i + 1) * w) / n, 0)
        g.lineTo(((i + 1) * w) / n, h * 0.45)
        g.arc(((i + 0.5) * w) / n, h * 0.45, w / n / 2, 0, Math.PI)
        g.closePath()
        g.fill()
      } else {
        g.fillRect((i * w) / n, 0, w / n, h)
      }
    }
  })
}

registerProp('awning', {
  solid: false,
  build: (ctx) => {
    const color = tint(ctx, PAL.red)
    const w = num(ctx, 'w', 1)
    return cachedBuild(`awning|${color}|${w}`, () => {
      const g = new THREE.Group()
      const z0 = WALL_Z
      const back: [number, number] = [2.28, z0 + 0.02]
      const front: [number, number] = [1.9, z0 + 0.72]
      const len = Math.hypot(back[0] - front[0], back[1] - front[1])
      const cloth = plane(w, len, texMat(`stripes|${color}`, stripeTex(color, false), { side: THREE.DoubleSide }), 0, (back[0] + front[0]) / 2, (back[1] + front[1]) / 2)
      cloth.rotation.x = -Math.atan2(front[1] - back[1], back[0] - front[0])
      g.add(cloth)
      g.add(plane(w, 0.16, texMat(`valance|${color}`, stripeTex(color, true), { side: THREE.DoubleSide, alphaTest: 0.5 }), 0, front[0] - 0.08, front[1]))
      const iron = M(PAL.ironDark)
      for (const s of [-1, 1]) g.add(rod([s * (w / 2 - 0.04), 1.7, z0], [s * (w / 2 - 0.04), front[0], front[1]], 0.014, 0.014, iron, 5))
      g.add(rod([-w / 2, front[0], front[1]], [w / 2, front[0], front[1]], 0.02, 0.02, iron, 6))
      g.add(bx(w, 0.06, 0.05, M(PAL.woodDark), 0, back[0] - 0.02, z0 + 0.025))
      return g
    })
  },
})
