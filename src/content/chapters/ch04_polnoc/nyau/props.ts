/**
 * Custom props for chapters 4–6 (Nyau): the glowing mosaic of El descending,
 * glowing lichen, the Itaka gliding in out of the fog, the obsidian door to
 * the vaults, the original Book of El lying open, the stone cabinet, and the
 * little brother's chalk airship. Registered on import (names prefixed with
 * the chapter that introduces them).
 */
import * as THREE from 'three'
import { getProp, registerProp, type PropContext } from '../../../../engine/props/registry'
import {
  PAL,
  WALL_Z,
  M,
  additive,
  ball,
  bool,
  bx,
  cachedBuild,
  canvasTex,
  chain,
  cy,
  decal,
  finalize,
  fx,
  glowMat,
  keep,
  num,
  plane,
  range,
  rod,
  seeded,
  shade,
  texMat,
  uniqueGlow,
  wrap,
  type Rand,
} from '../../../../engine/props/kit'

// ============================================================================ helpers

/** Paint a small low-res picture, then lay it out as glass tesserae with grout. */
function tesserae(g: CanvasRenderingContext2D, w: number, h: number, r: Rand, cols: number, rows: number, paint: (s: CanvasRenderingContext2D) => void): void {
  const src = document.createElement('canvas')
  src.width = cols
  src.height = rows
  const s = src.getContext('2d')
  if (!s) return
  paint(s)
  const data = s.getImageData(0, 0, cols, rows).data
  const cw = w / cols
  const ch = h / rows
  g.fillStyle = '#0c0a16'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const k = 0.88 + r() * 0.24
      const R = Math.min(255, data[i] * k)
      const G = Math.min(255, data[i + 1] * k)
      const B = Math.min(255, data[i + 2] * k)
      g.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`
      const jx = (r() - 0.5) * 0.6
      const jy = (r() - 0.5) * 0.6
      g.fillRect(x * cw + 0.8 + jx, y * ch + 0.8 + jy, cw - 1.6, ch - 1.6)
    }
}

// ============================================================================ c4_el_mosaic

/** El as a girl with long white hair and violet eyes descending with open arms, stars set true to the sky, the forest and little cat-eared figures beneath. */
function elMosaicTex(): THREE.CanvasTexture {
  return canvasTex('c4-el-mosaic', 320, 480, (g, w, h, r) =>
    tesserae(g, w, h, r, 40, 60, (s) => {
      const cols = 40
      const rows = 60
      const bg = s.createLinearGradient(0, 0, 0, rows)
      bg.addColorStop(0, '#141a52')
      bg.addColorStop(0.45, '#2a1858')
      bg.addColorStop(0.75, '#1c2a5e')
      bg.addColorStop(1, '#10283c')
      s.fillStyle = bg
      s.fillRect(0, 0, cols, rows)
      const cx = cols / 2
      // descending light
      const ray = s.createLinearGradient(0, 0, 0, 44)
      ray.addColorStop(0, 'rgba(150,170,255,0.55)')
      ray.addColorStop(1, 'rgba(150,170,255,0)')
      s.fillStyle = ray
      s.beginPath()
      s.moveTo(cx - 3, 0)
      s.lineTo(cx + 3, 0)
      s.lineTo(cx + 14, 44)
      s.lineTo(cx - 14, 44)
      s.closePath()
      s.fill()
      // stars, placed as if copied from the night sky
      const sr = seeded('el-stars')
      for (let i = 0; i < 34; i++) {
        const x = Math.floor(sr() * (cols - 4)) + 2
        const y = Math.floor(sr() * 40) + 2
        if (Math.abs(x - cx) < 7 && y > 12 && y < 40) continue
        s.fillStyle = sr() > 0.8 ? '#ffe9a8' : sr() > 0.5 ? '#bfe6ff' : '#ffffff'
        s.fillRect(x, y, 1, 1)
        if (sr() > 0.85) s.fillRect(x + 1, y, 1, 1)
      }
      // hair, flowing white
      s.fillStyle = '#f4f2fb'
      s.beginPath()
      s.moveTo(cx - 3, 13)
      s.quadraticCurveTo(cx - 8, 22, cx - 6, 33)
      s.lineTo(cx + 6, 33)
      s.quadraticCurveTo(cx + 8, 22, cx + 3, 13)
      s.closePath()
      s.fill()
      // robe
      s.fillStyle = '#e6ddf7'
      s.beginPath()
      s.moveTo(cx - 2, 20)
      s.lineTo(cx + 2, 20)
      s.lineTo(cx + 7, 42)
      s.lineTo(cx - 7, 42)
      s.closePath()
      s.fill()
      s.fillStyle = '#c3b2ee'
      s.fillRect(cx - 1, 24, 2, 18)
      // outstretched arms
      s.fillStyle = '#e6ddf7'
      s.fillRect(cx - 12, 22, 24, 2)
      s.fillStyle = '#f2dcd0'
      s.fillRect(cx - 14, 22, 2, 2)
      s.fillRect(cx + 12, 22, 2, 2)
      // face and violet eyes
      s.fillStyle = '#f2dcd0'
      s.beginPath()
      s.arc(cx, 16, 2.6, 0, Math.PI * 2)
      s.fill()
      s.fillStyle = '#a060e0'
      s.fillRect(cx - 2, 16, 1, 1)
      s.fillRect(cx + 1, 16, 1, 1)
      // forest
      s.fillStyle = '#123c30'
      s.fillRect(0, 46, cols, rows - 46)
      for (let i = 0; i < 12; i++) {
        const x = 1 + i * 3.4
        s.fillStyle = i % 2 ? '#1f6a4a' : '#2a7a55'
        s.beginPath()
        s.moveTo(x, 50)
        s.lineTo(x + 1.8, 42 + (i % 3))
        s.lineTo(x + 3.6, 50)
        s.closePath()
        s.fill()
      }
      // glowing plants
      s.fillStyle = '#5ff5d8'
      for (let i = 0; i < 9; i++) s.fillRect(2 + i * 4.3, 51 + (i % 2), 1, 1)
      // little figures with cat ears and tails, arms raised to her
      const pal = ['#e0b070', '#d89060', '#c8c0b0', '#f0d0a0', '#b08060']
      for (let i = 0; i < 5; i++) {
        const x = 7 + i * 6.4
        s.fillStyle = pal[i]
        s.fillRect(x, 54, 2, 4)
        s.fillRect(x, 52, 2, 2)
        s.fillRect(x - 1, 51, 1, 1)
        s.fillRect(x + 2, 51, 1, 1)
        s.fillRect(x - 1, 53, 1, 1)
        s.fillRect(x + 2, 53, 1, 1)
        s.fillRect(x + 2, 57, 2, 1)
      }
      // an animal or two
      s.fillStyle = '#9a8a70'
      s.fillRect(31, 57, 4, 2)
      s.fillRect(34, 56, 2, 1)
      // gold border
      s.strokeStyle = '#d6a548'
      s.lineWidth = 1
      s.strokeRect(0.5, 0.5, cols - 1, rows - 1)
    }),
  )
}

registerProp('c4_el_mosaic', {
  solid: false,
  light: (ctx) => (bool(ctx, 'light', true) ? { color: '#7a6aff', intensity: 1.3, distance: 4.5, y: 1.6 } : null),
  build: (ctx) => {
    const w = num(ctx, 'w', 1.7)
    const g = new THREE.Group()
    const frame = M(PAL.whiteShade)
    const brass = M(PAL.brass)
    const z = WALL_Z
    const tex = elMosaicTex()
    const m = texMat('c4-el-mosaic', tex, { emissiveMap: tex, emissive: '#ffffff', ei: 0.85 })
    g.add(bx(w + 0.16, 2.62, 0.06, frame, 0, 0.26, z + 0.03))
    g.add(plane(w, 2.38, m, 0, 1.5, z + 0.065))
    g.add(bx(w + 0.24, 0.09, 0.12, brass, 0, 2.72, z + 0.06))
    g.add(bx(w + 0.24, 0.09, 0.12, brass, 0, 0.22, z + 0.06))
    return finalize(g)
  },
})

// ============================================================================ c4_lichen

function lichenTex(): THREE.CanvasTexture {
  return canvasTex('c4-lichen', 128, 128, (g, w, h, r) => {
    g.clearRect(0, 0, w, h)
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2
      const d = Math.pow(r(), 0.7) * w * 0.38
      const x = w / 2 + Math.cos(a) * d
      const y = h / 2 + Math.sin(a) * d
      const rad = 3 + r() * 9
      const grad = g.createRadialGradient(x, y, 0, x, y, rad)
      grad.addColorStop(0, 'rgba(255,255,255,0.95)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.beginPath()
      g.arc(x, y, rad, 0, Math.PI * 2)
      g.fill()
    }
  })
}

/** Patch of glowing lichen on the floor, or on a wall (`wall: true`, back on the cell edge). */
registerProp('c4_lichen', {
  solid: false,
  castShadow: false,
  light: (ctx) => (bool(ctx, 'light') ? { color: ctx.params.color ? String(ctx.params.color) : '#6ff0d0', intensity: 0.9, distance: 2.8, y: 0.6 } : null),
  build: (ctx) => {
    const color = typeof ctx.params.color === 'string' ? ctx.params.color : '#6ff0d0'
    const size = num(ctx, 'size', 1)
    const wall = bool(ctx, 'wall')
    const g = new THREE.Group()
    const m = additive(color, 1.9, 0.9, lichenTex())
    if (wall) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.95 * size, 1.25 * size), m)
      p.position.set((ctx.rand() - 0.5) * 0.2, 0.25 + 0.62 * size + ctx.rand() * 0.5, WALL_Z + 0.03)
      fx(p)
      g.add(p)
    } else {
      const d = decal(1.05 * size, 1.05 * size, m, 0.02)
      d.rotation.z = ctx.rand() * Math.PI
      g.add(d)
    }
    const dot = glowMat(color, 2.6)
    const n = 5 + Math.floor(ctx.rand() * 5)
    for (let i = 0; i < n; i++) {
      const a = ctx.rand() * Math.PI * 2
      const rr = ctx.rand() * 0.38 * size
      const sz = 0.025 + ctx.rand() * 0.03
      if (wall) g.add(ball(sz, sz, sz * 0.5, dot, Math.cos(a) * rr, 0.6 + Math.sin(a) * rr + 0.4 * size, WALL_Z + 0.04, 5))
      else g.add(ball(sz, sz * 0.5, sz, dot, Math.cos(a) * rr, 0.02, Math.sin(a) * rr, 5))
    }
    return finalize(g)
  },
})

// ============================================================================ c4_itaka_glide

const ITAKA_FOOT: [number, number][] = []
for (let x = -1; x <= 1; x++) for (let z = -3; z <= 3; z++) if (x || z) ITAKA_FOOT.push([x, z])

interface GlideState {
  inner: THREE.Object3D
  t: number
  dur: number
  from: THREE.Vector3
  mode: 'arrive' | 'lift'
}

const ease = (k: number) => 1 - Math.pow(1 - k, 3)
const easeIn = (k: number) => k * k * k

/**
 * The Itaka as a prop that moves when it becomes visible: `mode: 'arrive'`
 * glides in from a local offset (fx, fy, fz) and settles on its skids;
 * `mode: 'lift'` rises from its berth. Start it hidden and show it with
 * g.propVisible(id, true) to play the move.
 */
registerProp('c4_itaka_glide', {
  solid: true,
  footprint: ITAKA_FOOT,
  light: { color: '#ffbb77', intensity: 1.5, distance: 5, y: 2.1 },
  build: (ctx: PropContext) => {
    const base = getProp('itaka')
    const inner = base ? base.build(ctx) : new THREE.Group()
    const g = new THREE.Group()
    g.add(inner)
    const mode = ctx.params.mode === 'lift' ? 'lift' : 'arrive'
    const from = new THREE.Vector3(num(ctx, 'fx', 0), num(ctx, 'fy', 5), num(ctx, 'fz', -16))
    if (mode === 'arrive') inner.position.copy(from)
    const st: GlideState = { inner, t: 0, dur: num(ctx, 'dur', 9), from, mode }
    g.userData.glide = st
    return g
  },
  animate: (obj, time, dt) => {
    const st = obj.userData.glide as GlideState | undefined
    if (!st) return
    getProp('itaka')?.animate?.(st.inner, time, dt)
    if (!obj.visible) return
    st.t = Math.min(st.dur, st.t + dt)
    const k = st.t / st.dur
    const sway = Math.sin(time * 0.35) * 0.035
    if (st.mode === 'arrive') {
      const e = ease(k)
      st.inner.position.set(st.from.x * (1 - e) + sway, st.from.y * (1 - e) * (1 - e * 0.15), st.from.z * (1 - e))
      st.inner.rotation.z = Math.sin(time * 0.5) * 0.01 * (1 - e)
    } else {
      const e = easeIn(k)
      st.inner.position.set(sway, e * 14, e * 6)
    }
  },
})

// ============================================================================ c4_night_tree

function buildNightTree(r: Rand, glowCol: string, canopy: string): THREE.Group {
  const g = new THREE.Group()
  const bark = M('#4c3c52')
  const barkDark = M('#35283c')
  const lean = (r() - 0.5) * 0.35
  const top: [number, number, number] = [lean, 1.7, lean * 0.4]
  g.add(chain([[0, -0.05, 0], [lean * 0.35, 0.85, 0.03], top], 0.2, 0.1, bark, 10))
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + r()
    g.add(rod([0, 0.28, 0], [Math.cos(a) * 0.42, -0.04, Math.sin(a) * 0.42], 0.1, 0.04, barkDark, 7))
  }
  for (let i = 0; i < 3; i++) {
    const a = r() * Math.PI * 2
    g.add(rod([lean * 0.5, 1.1 + i * 0.16, lean * 0.2], [lean + Math.cos(a) * 0.62, 1.8 + r() * 0.25, lean * 0.4 + Math.sin(a) * 0.62], 0.06, 0.03, bark, 6))
  }
  // violet sap glowing in the bast
  const sap = glowMat(glowCol, 2.4)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + r() * 0.5
    const pts: [number, number, number][] = []
    for (let k = 0; k <= 5; k++) {
      const t = k / 5
      const ang = a + Math.sin(t * 4 + i) * 0.3
      const rr = 0.19 - t * 0.08
      pts.push([Math.cos(ang) * rr + lean * t * 0.9, t * 1.6, Math.sin(ang) * rr + lean * 0.35 * t])
    }
    g.add(chain(pts, 0.018, 0.012, sap, 4, false))
  }
  const cols = [M(shade(canopy, 0.7)), M(canopy), M(shade(canopy, 1.3))]
  const c: [number, number, number] = [lean, 2.2, lean * 0.4]
  const blobs: { c: [number, number, number]; rx: number; ry: number; rz: number }[] = []
  const add = (p: [number, number, number], rx: number, ry: number, rz: number, m: THREE.Material) => {
    g.add(ball(rx, ry, rz, m, p[0], p[1], p[2], 16))
    blobs.push({ c: p, rx, ry, rz })
  }
  add(c, 0.95, 0.72, 0.92, cols[1])
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r() * 0.6
    const rr = 0.62 + r() * 0.14
    const s = 0.5 + r() * 0.14
    add([c[0] + Math.cos(a) * rr, c[1] + (i % 2 ? 0.1 : -0.26) + r() * 0.08, c[2] + Math.sin(a) * rr], s, s * 0.8, s, cols[i % 2 ? 1 : 0])
  }
  add([c[0] + 0.08, c[1] + 0.5, c[2] + 0.1], 0.56, 0.42, 0.54, cols[2])
  const glow = glowMat(glowCol, 3)
  const glow2 = glowMat('#8fe8ff', 3)
  for (let i = 0; i < 22; i++) {
    const b = blobs[i % blobs.length]
    const a = r() * Math.PI * 2
    const y = range(r, -0.7, 0.5)
    const s0 = Math.sqrt(1 - y * y)
    const p: [number, number, number] = [b.c[0] + Math.cos(a) * s0 * b.rx * 1.02, b.c[1] + y * b.ry * 1.02, b.c[2] + Math.sin(a) * s0 * b.rz * 1.02]
    const s = 0.05 + r() * 0.05
    g.add(ball(s, s, s, i % 5 === 0 ? glow2 : glow, p[0], p[1], p[2], 6))
  }
  for (let i = 0; i < 8; i++) {
    const b = blobs[1 + (i % (blobs.length - 1))]
    const x = b.c[0] + (r() - 0.5) * b.rx
    const z = b.c[2] + (r() - 0.5) * b.rz
    const y0 = b.c[1] - b.ry * 0.55
    const len = 0.4 + r() * 0.55
    g.add(rod([x, y0, z], [x, y0 - len, z], 0.012, 0.01, glow, 4))
    g.add(ball(0.04, 0.05, 0.04, glow, x, y0 - len, z, 6))
  }
  // fallen glowing petals around the roots
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2
    const d = 0.6 + r() * 0.9
    g.add(ball(0.045, 0.012, 0.045, glow, Math.cos(a) * d, 0.02, Math.sin(a) * d, 4))
  }
  return g
}

/** A Nyau night tree: violet sap burning in the bast, glowing clusters, hanging strands. */
registerProp('c4_night_tree', {
  solid: true,
  light: (ctx) => ({ color: typeof ctx.params.glow === 'string' ? ctx.params.glow : '#b47aff', intensity: bool(ctx, 'dim') ? 0.8 : 1.7, distance: 5.5, y: 2.3 }),
  build: (ctx) => {
    const glowCol = typeof ctx.params.glow === 'string' ? ctx.params.glow : '#b47aff'
    const canopy = typeof ctx.params.canopy === 'string' ? ctx.params.canopy : '#26426a'
    const size = num(ctx, 'size', 1)
    const v = Math.floor(ctx.rand() * 4)
    const inner = cachedBuild(`c4ntree|${glowCol}|${canopy}|${v}`, () => buildNightTree(seeded('ntree' + v), glowCol, canopy))
    return wrap(inner, ctx.rand() * Math.PI * 2, size * (0.9 + ctx.rand() * 0.25))
  },
})

// ============================================================================ c5_obsidian_door

function pentaTex(): THREE.CanvasTexture {
  return canvasTex('c5-penta', 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    const cx = w / 2
    const cyy = h / 2
    const R = w * 0.4
    g.strokeStyle = '#ffffff'
    g.lineWidth = 5
    g.lineJoin = 'round'
    g.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
      const x = cx + Math.cos(a) * R
      const y = cyy + Math.sin(a) * R
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
    g.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
      g.beginPath()
      g.arc(cx + Math.cos(a) * R, cyy + Math.sin(a) * R, 7, 0, Math.PI * 2)
      g.stroke()
    }
  })
}

/** Smooth black block set into the obsidian wall; `glow` lights its five-line glyph. */
registerProp('c5_obsidian_door', {
  solid: true,
  light: (ctx) => (bool(ctx, 'glow') ? { color: '#b77dff', intensity: 2.2, distance: 4.5, y: 1.3 } : null),
  build: (ctx) => {
    const glow = bool(ctx, 'glow')
    const g = new THREE.Group()
    const black = M('#120f19', { emissive: '#1c1530', ei: 0.25 })
    const rim = M('#2a2238')
    g.add(bx(1.0, 2.5, 0.42, black, 0, 0))
    g.add(bx(1.04, 0.08, 0.46, rim, 0, 2.5))
    g.add(bx(1.04, 0.06, 0.46, rim, 0, 0))
    // a sheen line, like glass
    g.add(bx(0.03, 2.1, 0.01, M('#3c3452'), -0.3, 0.2, 0.215))
    const m = additive('#b77dff', glow ? 3 : 0.35, glow ? 1 : 0.6, pentaTex(), true)
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), m)
    p.position.set(0, 1.35, 0.222)
    fx(p)
    keep(p)
    g.add(p)
    g.userData.glyph = p
    g.userData.glow = glow
    return finalize(g)
  },
  animate: (obj, t) => {
    const p = obj.userData.glyph as THREE.Mesh | undefined
    if (!p) return
    const m = p.material as THREE.MeshBasicMaterial
    m.opacity = obj.userData.glow ? 0.78 + 0.22 * Math.sin(t * 2.2) : 0.35 + 0.15 * Math.sin(t * 0.7)
    if (obj.userData.glow) p.rotation.z = t * 0.15
  },
})

// ============================================================================ c5_book_open

function veinTex(): THREE.CanvasTexture {
  return canvasTex('c5-veins', 128, 96, (g, w, h, r) => {
    g.fillStyle = '#000000'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#ffffff'
    for (let i = 0; i < 9; i++) {
      g.lineWidth = 0.6 + r() * 1.4
      g.beginPath()
      let x = r() * w
      let y = r() * h
      g.moveTo(x, y)
      for (let k = 0; k < 7; k++) {
        x += (r() - 0.5) * 34
        y += (r() - 0.5) * 26
        g.lineTo(x, y)
      }
      g.stroke()
    }
  })
}

function pageTex(): THREE.CanvasTexture {
  return canvasTex('c5-page', 128, 96, (g, w, h, r) => {
    g.fillStyle = '#efe2c0'
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(120,90,50,0.12)'
    for (let i = 0; i < 30; i++) g.fillRect(r() * w, r() * h, 6 + r() * 20, 2)
    g.fillStyle = 'rgba(40,24,30,0.75)'
    for (const ox of [8, 70]) {
      for (let y = 10; y < h - 8; y += 6) {
        let x = ox
        while (x < ox + 50) {
          const len = 2 + r() * 7
          g.fillRect(x, y, len, 1.4)
          x += len + 2
        }
      }
    }
    // a small drawing on the right page
    g.strokeStyle = 'rgba(60,40,60,0.8)'
    g.lineWidth = 1.2
    g.beginPath()
    g.arc(96, 50, 12, 0, Math.PI * 2)
    g.stroke()
  })
}

/** The original Book of El lying open between its two obsidian tablets; the veins breathe violet. */
registerProp('c5_book_open', {
  solid: false,
  light: (ctx) => (bool(ctx, 'white') ? null : { color: '#9a6bff', intensity: 1.2, distance: 3.2, y: 0.4 }),
  build: (ctx) => {
    const g = new THREE.Group()
    const closed = bool(ctx, 'closed')
    const white = bool(ctx, 'white')
    const black = white ? M('#f2ecdc') : M('#100c16')
    const veins = white ? uniqueGlow('#e8c060', 1.1, 0.8) : uniqueGlow('#b07aff', 2.2, 0.9)
    veins.map = veinTex()
    veins.blending = THREE.AdditiveBlending
    veins.transparent = true
    veins.depthWrite = false
    const pages = texMat('c5-page', pageTex())
    const book = new THREE.Group()
    if (closed) {
      book.add(bx(0.46, 0.05, 0.34, black, 0, 0))
      book.add(bx(0.44, 0.07, 0.32, M('#e8dcc0'), 0, 0.05))
      book.add(bx(0.46, 0.05, 0.34, black, 0, 0.12))
      const v = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.32), veins)
      v.rotation.x = -Math.PI / 2
      v.position.set(0, 0.172, 0)
      book.add(keep(v))
    } else {
      for (const s of [-1, 1]) {
        const half = new THREE.Group()
        half.position.set(s * 0.235, 0, 0)
        half.rotation.z = -s * 0.06
        half.add(bx(0.46, 0.045, 0.34, black, 0, 0))
        const v = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), veins)
        v.rotation.x = Math.PI / 2
        v.position.set(0, -0.002, 0)
        half.add(keep(v))
        const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), pages)
        pg.rotation.x = -Math.PI / 2
        pg.position.set(0, 0.075, 0)
        if (s > 0) pg.scale.x = -1
        half.add(bx(0.42, 0.028, 0.3, M('#e9dcbc'), 0, 0.045))
        half.add(pg)
        book.add(half)
      }
      // a faint violet light rising from the gutter
      if (!white) {
        const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), additive('#9a60ff', 0.6, 0.35))
        halo.rotation.x = -Math.PI / 2
        halo.position.y = 0.09
        book.add(fx(keep(halo)))
      }
    }
    book.position.y = num(ctx, 'y', 0)
    book.rotation.y = (ctx.rand() - 0.5) * 0.2
    g.add(book)
    g.userData.veins = veins
    g.userData.white = white
    return finalize(g)
  },
  animate: (obj, t) => {
    const m = obj.userData.veins as THREE.MeshBasicMaterial | undefined
    if (m && !obj.userData.white) m.color.copy(m.userData.base as THREE.Color).multiplyScalar(0.55 + 0.45 * Math.sin(t * 1.1))
  },
})

// ============================================================================ c5_cabinet

/** Stone cabinet set into the wall (back on the cell edge), sealed with a violet glyph; `open` shows the dark hollow. */
registerProp('c5_cabinet', {
  solid: true,
  light: (ctx) => (bool(ctx, 'open') ? null : { color: '#a070ff', intensity: 1, distance: 3, y: 1.2 }),
  build: (ctx) => {
    const open = bool(ctx, 'open')
    const g = new THREE.Group()
    const stone = M('#6f6a78')
    const dark = M('#4a4552')
    const z = WALL_Z
    g.add(bx(1.0, 1.9, 0.36, dark, 0, 0, z + 0.18))
    g.add(bx(1.06, 0.1, 0.42, stone, 0, 1.9, z + 0.21))
    g.add(bx(1.06, 0.12, 0.42, stone, 0, 0, z + 0.21))
    if (open) {
      g.add(bx(0.76, 1.3, 0.02, M('#0c0a10'), 0, 0.32, z + 0.37))
      g.add(bx(0.7, 0.04, 0.2, stone, 0, 0.9, z + 0.28))
    } else {
      g.add(bx(0.8, 1.4, 0.06, stone, 0, 0.26, z + 0.38))
      const m = additive('#b77dff', 2.4, 0.85, pentaTex())
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), m)
      p.position.set(0, 1.0, z + 0.42)
      g.add(fx(p))
    }
    return finalize(g)
  },
})

// ============================================================================ c6_chalk

/** The little brother's chalk drawing on the flagstones: an airship. Or a fish. */
registerProp('c6_chalk', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const tex = canvasTex('c6-chalk', 256, 256, (g, w, h, r) => {
      g.clearRect(0, 0, w, h)
      g.strokeStyle = 'rgba(255,255,255,0.92)'
      g.lineWidth = 5
      g.lineCap = 'round'
      const wob = () => (r() - 0.5) * 4
      // envelope
      g.beginPath()
      g.ellipse(128 + wob(), 96 + wob(), 84, 38, 0, 0, Math.PI * 2)
      g.stroke()
      // gondola
      g.beginPath()
      g.moveTo(92, 150)
      g.lineTo(166, 150)
      g.lineTo(156, 176)
      g.lineTo(102, 176)
      g.closePath()
      g.stroke()
      // ropes
      for (const x of [100, 128, 156]) {
        g.beginPath()
        g.moveTo(x, 132)
        g.lineTo(x + wob(), 150)
        g.stroke()
      }
      // tail fin, or a fish tail
      g.beginPath()
      g.moveTo(44, 96)
      g.lineTo(18, 70)
      g.lineTo(22, 122)
      g.closePath()
      g.stroke()
      // a sun in the corner
      g.strokeStyle = 'rgba(255,224,140,0.9)'
      g.beginPath()
      g.arc(214, 206, 18, 0, Math.PI * 2)
      g.stroke()
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        g.beginPath()
        g.moveTo(214 + Math.cos(a) * 26, 206 + Math.sin(a) * 26)
        g.lineTo(214 + Math.cos(a) * 36, 206 + Math.sin(a) * 36)
        g.stroke()
      }
    })
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 })
    m.polygonOffset = true
    m.polygonOffsetFactor = -2
    m.userData.fx = true
    const g = new THREE.Group()
    const d = decal(1.6, 1.6, m, 0.02)
    d.rotation.z = (ctx.rand() - 0.5) * 0.6
    g.add(d)
    // a stub of chalk
    g.add(cy(0.025, 0.025, 0.09, M('#f4f0e6'), 0.62, 0, 0.5, 6).rotateZ(Math.PI / 2))
    return g
  },
})
