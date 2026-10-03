import * as THREE from 'three'
import { registerProp } from './registry'
import { toon } from '../toon'
import { crystal, crystalMat, pulseCrystals } from './tech'
import {
  PAL,
  M,
  F,
  glowMat,
  bx,
  cy,
  cn,
  ball,
  rod,
  chain,
  leaf,
  torus,
  ring,
  plane,
  decal,
  rot,
  fx,
  keep,
  finalize,
  cachedBuild,
  cachedMat,
  wrap,
  seeded,
  pick,
  range,
  variant,
  shade,
  bool,
  num,
  tint,
  canvasTex,
  texMat,
  additive,
  glyphCanvasTex,
  flame,
  flicker,
  type Rand,
  type V3,
} from './kit'

// ---------------------------------------------------------------------------
// book_pedestal (stone lectern with the black Book of El)
// ---------------------------------------------------------------------------

function veinTex(): THREE.CanvasTexture {
  return canvasTex('book-veins', 256, 192, (g, w, h, r) => {
    g.fillStyle = '#000000'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#b679ff'
    g.shadowColor = '#b679ff'
    g.shadowBlur = 6
    g.lineCap = 'round'
    const vein = (x: number, y: number, a: number, width: number, depth: number) => {
      let px = x
      let py = y
      let ang = a
      const steps = 6 + Math.floor(r() * 6)
      for (let i = 0; i < steps; i++) {
        ang += (r() - 0.5) * 0.9
        const nx = px + Math.cos(ang) * 9
        const ny = py + Math.sin(ang) * 9
        g.lineWidth = Math.max(0.6, width * (1 - i / steps))
        g.beginPath()
        g.moveTo(px, py)
        g.lineTo(nx, ny)
        g.stroke()
        px = nx
        py = ny
        if (depth > 0 && r() < 0.25) vein(px, py, ang + (r() > 0.5 ? 0.9 : -0.9), width * 0.6, depth - 1)
      }
    }
    for (let i = 0; i < 7; i++) vein(r() * w, r() > 0.5 ? 0 : h, r() * Math.PI * 2, 3, 2)
    // faint five-point sigil in the middle
    g.lineWidth = 2
    g.globalAlpha = 0.55
    g.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
      const x = w / 2 + Math.cos(a) * 34
      const y = h / 2 + Math.sin(a) * 34
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
    g.globalAlpha = 1
  })
}

function obsidianTex(): THREE.CanvasTexture {
  return canvasTex('obsidian-cover', 128, 96, (g, w, h, r) => {
    const grad = g.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#2a2236')
    grad.addColorStop(0.5, '#120f18')
    grad.addColorStop(1, '#1e1828')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 20; i++) {
      g.fillStyle = `rgba(160,130,220,${r() * 0.06})`
      g.fillRect(r() * w, r() * h, 10 + r() * 30, 1)
    }
  })
}

registerProp('book_pedestal', {
  solid: true,
  light: { color: '#9a6bff', intensity: 1.4, distance: 3.6, y: 1.25 },
  build: (ctx) => {
    const g = new THREE.Group()
    const stone = M('#7c7684')
    const stoneD = M('#5c5764')
    g.add(bx(0.58, 0.1, 0.52, stoneD))
    g.add(bx(0.46, 0.06, 0.4, stone, 0, 0.1))
    g.add(cy(0.13, 0.17, 0.72, stone, 0, 0.16, 0, 12))
    g.add(ring(0.155, 0.025, stoneD, 0, 0.4, 0, 5, 16))
    g.add(bx(0.32, 0.07, 0.28, stoneD, 0, 0.88))
    const lectern = new THREE.Group()
    lectern.position.set(0, 0.95, 0)
    lectern.rotation.x = 0.38
    lectern.add(bx(0.54, 0.06, 0.42, stone, 0, 0))
    lectern.add(bx(0.54, 0.05, 0.03, stoneD, 0, 0.05, 0.2))
    const cover = toon('#ffffff', { map: obsidianTex(), emissive: '#ffffff', ei: 1.3 })
    cover.emissiveMap = veinTex()
    const obsidian = M('#15111c')
    const book = new THREE.Group()
    book.position.set(0, 0.06, -0.01)
    book.rotation.y = 0.12
    book.add(bx(0.38, 0.018, 0.29, obsidian, 0, 0))
    book.add(bx(0.36, 0.05, 0.27, M('#efe4c8'), 0, 0.018))
    book.add(bx(0.38, 0.02, 0.29, cover, 0, 0.068))
    book.add(bx(0.03, 0.09, 0.29, obsidian, -0.19, 0))
    for (const z of [-0.1, 0.1]) book.add(bx(0.035, 0.03, 0.03, M(PAL.gold), 0.19, 0.075, z))
    lectern.add(book)
    g.add(lectern)
    g.userData.cover = cover
    g.userData.phase = ctx.rand() * 10
    return finalize(g)
  },
  animate: (obj, t) => {
    const m = obj.userData.cover as THREE.MeshToonMaterial | undefined
    if (m) m.emissiveIntensity = 1.1 + 0.5 * Math.sin(t * 1.3 + (Number(obj.userData.phase) || 0))
  },
})

// ---------------------------------------------------------------------------
// obsidian_block (black block; glyph -> glowing five-point glyph on top)
// ---------------------------------------------------------------------------

registerProp('obsidian_block', {
  solid: true,
  light: (ctx) => (bool(ctx, 'glyph') ? { color: tint(ctx, PAL.glyph, 'glyphColor'), intensity: 1.6, distance: 4, y: 1.1 } : null),
  build: (ctx) => {
    const glyph = bool(ctx, 'glyph')
    const gc = tint(ctx, PAL.glyph, 'glyphColor')
    const g = new THREE.Group()
    const side = M('#1d1826')
    const top = M('#2e2840')
    g.add(bx(0.86, 0.68, 0.86, side, 0, 0))
    g.add(bx(0.8, 0.08, 0.8, top, 0, 0.68))
    g.add(bx(0.9, 0.06, 0.9, M('#14111b'), 0, 0))
    const r = seeded('obs' + variant(ctx, 3))
    for (let i = 0; i < 4; i++) {
      const a = r() * Math.PI * 2
      const s = cn(0.05 + r() * 0.04, 0.12 + r() * 0.1, F('#241e30'), Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55, 4)
      s.rotation.set((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6)
      g.add(s)
    }
    if (glyph) {
      const m = additive(gc, 2.8, 1, glyphCanvasTex(), true)
      const d = decal(0.72, 0.72, m, 0.765)
      keep(d)
      g.add(d)
      g.userData.glyph = d
      const edge = glowMat(gc, 2.2)
      g.add(bx(0.8, 0.012, 0.012, edge, 0, 0.755, 0.4))
      g.add(bx(0.012, 0.012, 0.8, edge, 0.4, 0.755, 0))
    }
    return finalize(g)
  },
  animate: (obj, t) => {
    const d = obj.userData.glyph as THREE.Mesh | undefined
    if (!d) return
    d.rotation.z = t * 0.2
    ;(d.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.sin(t * 1.6)
  },
})

// ---------------------------------------------------------------------------
// dustpile (black dust heap)
// ---------------------------------------------------------------------------

registerProp('dustpile', {
  solid: false,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const inner = cachedBuild(`dust|${v}`, () => {
      const r = seeded('dust' + v)
      const g = new THREE.Group()
      const mats = [M('#1c1a21'), M('#2a2630'), M('#141217')]
      g.add(ball(0.3, 0.13, 0.26, mats[0], 0, 0.02, 0, 14))
      for (let i = 0; i < 4; i++) {
        const a = r() * Math.PI * 2
        const d = 0.15 + r() * 0.12
        const s = 0.1 + r() * 0.08
        g.add(ball(s, s * 0.45, s, mats[1 + (i % 2)], Math.cos(a) * d, 0.01, Math.sin(a) * d, 10))
      }
      for (let i = 0; i < 12; i++) {
        const a = r() * Math.PI * 2
        const d = 0.3 + r() * 0.2
        g.add(ball(0.025, 0.012, 0.025, mats[i % 3], Math.cos(a) * d, 0.005, Math.sin(a) * d, 4))
      }
      const glint = glowMat(PAL.spira, 2.6)
      for (let i = 0; i < 3; i++) {
        const a = r() * Math.PI * 2
        g.add(ball(0.012, 0.012, 0.012, glint, Math.cos(a) * 0.15, 0.1 + r() * 0.04, Math.sin(a) * 0.12, 4))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// veins (flat black spreading veins on the floor; glow -> violet aura)
// ---------------------------------------------------------------------------

function veinsTex(v: number, glow: boolean): THREE.CanvasTexture {
  return canvasTex(`veins|${v}|${glow}`, 512, 512, (g, w, h) => {
    const r = seeded('veins' + v)
    g.clearRect(0, 0, w, h)
    g.lineCap = 'round'
    g.lineJoin = 'round'
    if (glow) {
      g.strokeStyle = '#c690ff'
      g.shadowColor = '#c690ff'
      g.shadowBlur = 14
    } else {
      g.strokeStyle = '#08060c'
      g.shadowColor = 'rgba(60,20,90,0.8)'
      g.shadowBlur = 5
    }
    const branch = (x: number, y: number, a: number, width: number, len: number, depth: number) => {
      let px = x
      let py = y
      let ang = a
      const steps = Math.floor(len)
      for (let i = 0; i < steps; i++) {
        ang += (r() - 0.5) * 0.7
        const nx = px + Math.cos(ang) * 12
        const ny = py + Math.sin(ang) * 12
        const t = i / steps
        g.lineWidth = Math.max(1, width * (1 - t * 0.85)) * (glow ? 0.6 : 1)
        g.beginPath()
        g.moveTo(px, py)
        g.lineTo(nx, ny)
        g.stroke()
        px = nx
        py = ny
        const dx = px - w / 2
        const dy = py - h / 2
        if (dx * dx + dy * dy > (w / 2 - 12) * (w / 2 - 12)) break
        if (depth > 0 && r() < 0.22) branch(px, py, ang + (r() > 0.5 ? 1 : -1) * (0.5 + r() * 0.6), width * 0.62, len * 0.6, depth - 1)
      }
    }
    const n = 7
    for (let i = 0; i < n; i++) branch(w / 2, h / 2, (i / n) * Math.PI * 2 + r() * 0.5, 13, 16 + r() * 6, 3)
    g.shadowBlur = 0
    g.fillStyle = glow ? '#e0c0ff' : '#060408'
    g.beginPath()
    g.arc(w / 2, h / 2, glow ? 10 : 22, 0, Math.PI * 2)
    g.fill()
  })
}

registerProp('veins', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const size = num(ctx, 'size', 2.4)
    const glow = bool(ctx, 'glow')
    const g = new THREE.Group()
    const black = cachedMat(`veins|${v}`, () => {
      const m = new THREE.MeshBasicMaterial({ map: veinsTex(v, false), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
      m.userData.fx = true
      return m
    })
    const d = decal(size, size, black, 0.01)
    d.rotation.z = ctx.rand() * Math.PI * 2
    g.add(d)
    if (glow) {
      const a = decal(size, size, additive(PAL.spira, 1.6, 0.9, veinsTex(v, true)), 0.014)
      a.rotation.z = d.rotation.z
      g.add(a)
    }
    return g
  },
})

// ---------------------------------------------------------------------------
// skeleton (old giant ribcage; crystals -> violet crystals growing from bones)
// ---------------------------------------------------------------------------

registerProp('skeleton', {
  solid: true,
  footprint: [
    [0, -1],
    [0, 1],
  ],
  light: (ctx) => (bool(ctx, 'crystals') ? { color: '#a070ff', intensity: 2.6, distance: 6.5, y: 1.0 } : null),
  build: (ctx) => {
    const crystals = bool(ctx, 'crystals')
    const r = seeded('skel' + variant(ctx, 2))
    const g = new THREE.Group()
    const bone = M(PAL.bone)
    const boneD = M('#d8caa6')
    const spineY = (z: number) => 1.25 - Math.max(0, -z - 0.6) * 0.75 - Math.max(0, z - 0.9) * 0.5
    // spine
    const spine: V3[] = []
    for (let i = 0; i <= 13; i++) {
      const z = -1.7 + i * 0.24
      spine.push([0, spineY(z), z])
      const v = bx(0.17, 0.15, 0.13, i % 2 ? bone : boneD, 0, spineY(z) - 0.075, z)
      g.add(v)
      g.add(cn(0.05, 0.16, boneD, 0, spineY(z) + 0.05, z - 0.02, 5))
    }
    g.add(chain(spine, 0.05, 0.04, bone, 6, false))
    // ribs
    const ribTips: { p: V3; s: number }[] = []
    for (let k = 0; k < 6; k++) {
      const z = -0.65 + k * 0.28
      const y0 = spineY(z)
      const sz = 1 - Math.abs(k - 2) * 0.1
      for (const s of [-1, 1]) {
        const pts: V3[] = [
          [s * 0.08, y0, z],
          [s * 0.62 * sz, y0 - 0.05, z + 0.05],
          [s * 0.98 * sz, y0 * 0.58, z + 0.1],
          [s * 0.9 * sz, 0.02, z + 0.14],
          [s * 0.78 * sz, -0.15, z + 0.15],
        ]
        g.add(chain(pts, 0.05, 0.03, k % 2 ? bone : boneD, 7))
        ribTips.push({ p: pts[2], s })
      }
    }
    // skull, half sunk at the front
    const skull = new THREE.Group()
    skull.position.set(0.05, 0.42, 1.55)
    skull.rotation.set(0.35, 0.25, 0.1)
    skull.add(ball(0.34, 0.27, 0.36, bone, 0, 0, 0, 16))
    skull.add(rod([0, -0.05, 0.15], [0, -0.14, 0.72], 0.21, 0.12, bone, 8))
    for (const s of [-1, 1]) {
      skull.add(ball(0.09, 0.08, 0.06, M('#1a1418'), s * 0.15, 0.06, 0.3, 10))
      skull.add(chain([[s * 0.2, 0.18, -0.1], [s * 0.45, 0.35, -0.35], [s * 0.55, 0.28, -0.7]], 0.065, 0.02, boneD, 7))
    }
    g.add(skull)
    const jaw = rod([0.35, 0.05, 1.45], [0.55, 0.06, 2.0], 0.07, 0.05, boneD, 7)
    g.add(jaw)
    // scattered long bones
    for (let i = 0; i < 2; i++) {
      const a = r() * Math.PI * 2
      const c: V3 = [-0.75 + i * 1.4, 0.05, -1.3 + r() * 0.4]
      const e: V3 = [c[0] + Math.cos(a) * 0.55, 0.05, c[2] + Math.sin(a) * 0.55]
      g.add(rod(c, e, 0.045, 0.04, bone, 7))
      g.add(ball(0.07, 0.06, 0.07, bone, c[0], c[1], c[2], 8))
      g.add(ball(0.07, 0.06, 0.07, bone, e[0], e[1], e[2], 8))
    }
    if (crystals) {
      const m = crystalMat(PAL.spira)
      for (const t of ribTips) {
        if (r() < 0.35) continue
        const h = 0.25 + r() * 0.35
        g.add(crystal(m, 0.05 + h * 0.08, h, t.p, (r() - 0.5) * 0.5, -t.s * (0.5 + r() * 0.4), r() * 6))
      }
      for (let i = 0; i < 5; i++) {
        const sp = spine[3 + i * 2]
        const h = 0.3 + r() * 0.4
        g.add(crystal(m, 0.06 + h * 0.08, h, [sp[0], sp[1] + 0.05, sp[2]], (r() - 0.5) * 0.8, (r() - 0.5) * 0.8, r() * 6))
      }
      for (let i = 0; i < 4; i++) {
        const a = r() * Math.PI * 2
        const d = 0.4 + r() * 0.5
        const h = 0.3 + r() * 0.5
        g.add(crystal(m, 0.07 + h * 0.08, h, [Math.cos(a) * d, -0.02, Math.sin(a) * d * 1.4], Math.sin(a) * 0.4, -Math.cos(a) * 0.4, r() * 6))
      }
      g.add(crystal(m, 0.05, 0.3, [0.2, 0.55, 1.83], 0.6, -0.4, 0))
      g.userData.crystalMat = m
      g.userData.phase = ctx.rand() * 10
    }
    return finalize(g)
  },
  animate: (obj, t) => pulseCrystals(obj, t),
})

// ---------------------------------------------------------------------------
// glyph_circle (ground decal: circle + pentagram; color; light)
// ---------------------------------------------------------------------------

registerProp('glyph_circle', {
  solid: false,
  castShadow: false,
  light: (ctx) => (bool(ctx, 'light') ? { color: tint(ctx, PAL.glyph), intensity: 2, distance: 5, y: 0.5 } : null),
  build: (ctx) => {
    const color = tint(ctx, PAL.glyph)
    const size = num(ctx, 'size', 2.2)
    const g = new THREE.Group()
    const m = additive(color, 2.6, 0.95, glyphCanvasTex(), true)
    m.polygonOffset = true
    m.polygonOffsetFactor = -3
    m.polygonOffsetUnits = -3
    const d = decal(size, size, m, 0.016)
    keep(d)
    g.add(d)
    g.userData.glyph = d
    g.userData.phase = ctx.rand() * 10
    return g
  },
  animate: (obj, t, dt) => {
    const d = obj.userData.glyph as THREE.Mesh | undefined
    if (!d) return
    d.rotation.z += dt * 0.12
    const p = Number(obj.userData.phase) || 0
    ;(d.material as THREE.MeshBasicMaterial).opacity = 0.72 + 0.23 * Math.sin(t * 1.5 + p)
  },
})

// ---------------------------------------------------------------------------
// star_wall (black stone wall, carved constellations, red circle "Infera")
// ---------------------------------------------------------------------------

function paintStars(g: CanvasRenderingContext2D, w: number, h: number, r: Rand, glow: boolean): void {
  if (!glow) {
    g.fillStyle = '#17151c'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.02 + r() * 0.04})`
      g.beginPath()
      g.arc(r() * w, r() * h, 8 + r() * 30, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = 'rgba(0,0,0,0.5)'
    g.lineWidth = 2
    for (let y = 64; y < h; y += 96) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w, y)
      g.stroke()
    }
  } else {
    g.fillStyle = '#000000'
    g.fillRect(0, 0, w, h)
  }
  const star = glow ? 'rgba(190,225,255,1)' : 'rgba(10,8,14,0.9)'
  const line = glow ? 'rgba(130,190,255,0.55)' : 'rgba(8,6,10,0.7)'
  for (let c = 0; c < 8; c++) {
    const cx = 40 + r() * (w - 80)
    const cyy = 40 + r() * (h - 80)
    const pts: [number, number][] = []
    const n = 4 + Math.floor(r() * 4)
    let x = cx
    let y = cyy
    for (let i = 0; i < n; i++) {
      x += (r() - 0.5) * 70
      y += (r() - 0.5) * 60
      pts.push([Math.max(10, Math.min(w - 10, x)), Math.max(10, Math.min(h - 10, y))])
    }
    g.strokeStyle = line
    g.lineWidth = glow ? 1.6 : 3
    g.beginPath()
    pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
    g.stroke()
    g.fillStyle = star
    for (const [px, py] of pts) {
      g.beginPath()
      g.arc(px, py, 2 + r() * 3, 0, Math.PI * 2)
      g.fill()
    }
  }
  // scattered lone stars
  r()
  for (let i = 0; i < 70; i++) {
    g.fillStyle = glow ? `rgba(200,230,255,${0.3 + r() * 0.5})` : 'rgba(10,8,14,0.6)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
  // Infera: red circle
  const ix = w * 0.68
  const iy = h * 0.34
  g.strokeStyle = glow ? '#ff3a3a' : 'rgba(60,10,10,0.9)'
  g.lineWidth = glow ? 5 : 7
  g.beginPath()
  g.arc(ix, iy, 34, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = glow ? '#ff6a5a' : 'rgba(40,6,6,0.9)'
  g.beginPath()
  g.arc(ix, iy, 7, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = glow ? 2 : 3
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    g.beginPath()
    g.moveTo(ix + Math.cos(a) * 42, iy + Math.sin(a) * 42)
    g.lineTo(ix + Math.cos(a) * 56, iy + Math.sin(a) * 56)
    g.stroke()
  }
}

registerProp('star_wall', {
  solid: true,
  footprint: [
    [-1, 0],
    [1, 0],
  ],
  light: { color: '#b8c8ff', intensity: 1, distance: 4.5, y: 1.4 },
  build: () =>
    cachedBuild('star_wall', () => {
      const g = new THREE.Group()
      const stone = M('#1f1c25')
      const dark = M('#141218')
      const zc = -0.3
      g.add(bx(3.0, 0.16, 0.42, dark, 0, 0, zc))
      g.add(bx(2.9, 2.5, 0.3, stone, 0, 0.16, zc))
      g.add(bx(3.0, 0.12, 0.38, dark, 0, 2.66, zc))
      const map = canvasTex('starwall-map', 512, 448, (c, w, h, r) => paintStars(c, w, h, r, false))
      const emis = canvasTex('starwall-glow', 512, 448, (c, w, h) => paintStars(c, w, h, seeded('starwall-map'), true))
      const m = texMat('star_wall', map, { emissiveMap: emis, emissive: '#ffffff', ei: 1.8 })
      g.add(plane(2.8, 2.38, m, 0, 1.38, zc + 0.152))
      for (const x of [-1.45, 1.45]) g.add(bx(0.14, 2.6, 0.36, dark, x, 0.12, zc))
      return g
    }),
})

// ---------------------------------------------------------------------------
// clothes_pile (clothes left behind — tragic scenes; dust -> black dust over them)
// ---------------------------------------------------------------------------

registerProp('clothes_pile', {
  solid: false,
  build: (ctx) => {
    const main = tint(ctx, '#7a5a9a')
    const dust = bool(ctx, 'dust')
    const v = variant(ctx, 3)
    const inner = cachedBuild(`clothes|${main}|${dust}|${v}`, () => {
      const r = seeded('clothes' + v)
      const g = new THREE.Group()
      const robe = M(main)
      const robeD = M(shade(main, 0.75))
      const shirt = M(pick(r, ['#efe4cc', '#d8d0c0', '#c8d0d8']))
      const cloak = M(pick(r, ['#4a5a6e', '#5a4a3a', '#3a4a3a']))
      g.add(ball(0.36, 0.055, 0.27, robe, 0, 0.03, 0, 14))
      g.add(ball(0.18, 0.05, 0.14, robeD, 0.18, 0.06, 0.1, 10))
      g.add(rot(bx(0.34, 0.04, 0.26, shirt, -0.12, 0.05, -0.05), 0, 0.5, 0.05))
      g.add(leaf([-0.2, 0.08, 0.05], [-0.42, 0.04, 0.25], 0.09, 0.04, shirt))
      g.add(chain([[0.3, 0.05, -0.25], [0.05, 0.1, -0.2], [-0.15, 0.09, 0.0], [-0.3, 0.05, 0.22]], 0.06, 0.045, cloak, 7))
      const shoe = M('#4a3428')
      g.add(rot(ball(0.07, 0.045, 0.11, shoe, 0.38, 0.04, 0.22, 8), 0, 0.4, 0))
      g.add(rot(ball(0.07, 0.045, 0.11, shoe, 0.46, 0.035, 0.08, 8), 0, -0.3, 0.3))
      g.add(rot(torus(0.1, 0.015, M('#3a2a20'), -0.05, 0.1, 0.18, 4, 14), Math.PI / 2 - 0.2, 0, 0))
      g.add(bx(0.03, 0.02, 0.04, M(PAL.brass), 0.05, 0.11, 0.18))
      if (dust) {
        const dm = M('#1c1a21')
        for (let i = 0; i < 7; i++) {
          const a = r() * Math.PI * 2
          const d = r() * 0.35
          g.add(ball(0.09 + r() * 0.06, 0.03, 0.09, dm, Math.cos(a) * d, 0.07, Math.sin(a) * d, 8))
        }
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// spirit_flame (floating violet flame with orbiting sparks)
// ---------------------------------------------------------------------------

registerProp('spirit_flame', {
  solid: false,
  castShadow: false,
  light: (ctx) => ({ color: tint(ctx, '#a070ff'), intensity: 2.2, distance: 5, y: 1.2, flicker: true }),
  build: (ctx) => {
    const color = tint(ctx, PAL.spira)
    const g = new THREE.Group()
    const holder = new THREE.Group()
    holder.position.y = 0.95
    const f = flame(2.2, ctx.rand() * 10, color, PAL.spiraCore)
    holder.add(f)
    const sparks = new THREE.Group()
    const sm = glowMat(color, 3.2)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      sparks.add(ball(0.03, 0.03, 0.03, sm, Math.cos(a) * 0.32, 0.15 + (i % 2) * 0.25, Math.sin(a) * 0.32, 6))
    }
    fx(sparks)
    keep(sparks)
    holder.add(sparks)
    holder.add(fx(ring(0.2, 0.012, glowMat(color, 2.4), 0, -0.02, 0, 4, 24)))
    keep(holder)
    holder.userData.phase = ctx.rand() * 10
    g.add(holder)
    g.add(fx(decal(0.8, 0.8, additive(color, 0.9, 0.45, glowDiscTex()), 0.012, true)))
    g.userData.flames = [f]
    g.userData.spirit = { holder, sparks }
    return finalize(g)
  },
  animate: (obj, t) => {
    flicker(obj, t)
    const s = obj.userData.spirit as { holder: THREE.Object3D; sparks: THREE.Object3D } | undefined
    if (!s) return
    const p = Number(s.holder.userData.phase) || 0
    s.holder.position.y = 0.95 + Math.sin(t * 1.4 + p) * 0.08
    s.sparks.rotation.y = t * 1.6
  },
})

function glowDiscTex(): THREE.CanvasTexture {
  return canvasTex('glow-disc', 128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grad.addColorStop(0, 'rgba(255,255,255,0.9)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
  })
}

// ---------------------------------------------------------------------------
// ice_spike (frozen spikes erupting from the ground), frost_patch (decal)
// ---------------------------------------------------------------------------

registerProp('ice_spike', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const inner = cachedBuild(`icespike|${v}`, () => {
      const r = seeded('ice' + v)
      const g = new THREE.Group()
      const ice = F('#bfe8ff', { emissive: '#5fb8ff', ei: 0.35 })
      const ice2 = F('#e6f6ff', { emissive: '#8fd0ff', ei: 0.3 })
      g.add(ball(0.38, 0.1, 0.34, M('#f4fbff'), 0, 0.0, 0, 14))
      g.add(cn(0.17, 1.25, ice, 0, -0.05, 0, 5).rotateZ(0.08))
      const n = 4
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r()
        const h = 0.45 + r() * 0.45
        const s = cn(0.08 + r() * 0.05, h, i % 2 ? ice : ice2, 0, 0, 0, 5)
        s.position.set(Math.cos(a) * 0.18, h / 2 - 0.05, Math.sin(a) * 0.18)
        s.rotation.set(Math.sin(a) * 0.5, r() * 3, -Math.cos(a) * 0.5)
        g.add(s)
      }
      for (let i = 0; i < 6; i++) {
        const a = r() * Math.PI * 2
        const d = 0.3 + r() * 0.15
        const s = cn(0.03, 0.12 + r() * 0.1, ice2, Math.cos(a) * d, -0.02, Math.sin(a) * d, 4)
        s.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6)
        g.add(s)
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

function frostTex(v: number): THREE.CanvasTexture {
  return canvasTex(`frost|${v}`, 256, 256, (g, w, h, r) => {
    g.clearRect(0, 0, w, h)
    const grad = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2)
    grad.addColorStop(0, 'rgba(235,248,255,0.75)')
    grad.addColorStop(0.6, 'rgba(210,236,255,0.45)')
    grad.addColorStop(1, 'rgba(210,236,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(255,255,255,0.85)'
    g.lineCap = 'round'
    const dendrite = (x: number, y: number, a: number, len: number, depth: number) => {
      const nx = x + Math.cos(a) * len
      const ny = y + Math.sin(a) * len
      g.lineWidth = Math.max(0.8, depth * 0.9)
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(nx, ny)
      g.stroke()
      if (depth <= 0) return
      for (let k = 1; k <= 3; k++) {
        const t = k / 4
        const px = x + Math.cos(a) * len * t
        const py = y + Math.sin(a) * len * t
        dendrite(px, py, a + Math.PI / 3, len * 0.35, depth - 1)
        dendrite(px, py, a - Math.PI / 3, len * 0.35, depth - 1)
      }
    }
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2
      const d = r() * 60
      dendrite(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, r() * Math.PI * 2, 30 + r() * 40, 2)
    }
    g.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < 40; i++) g.fillRect(range(r, 30, w - 30), range(r, 30, h - 30), 1.5, 1.5)
  })
}

registerProp('frost_patch', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const size = num(ctx, 'size', 1.8)
    const m = cachedMat(`frost|${v}`, () => {
      const mt = toon('#ffffff', { map: frostTex(v), transparent: true })
      mt.depthWrite = false
      mt.polygonOffset = true
      mt.polygonOffsetFactor = -2
      mt.polygonOffsetUnits = -2
      return mt
    })
    const g = new THREE.Group()
    const d = decal(size, size, m, 0.011)
    d.rotation.z = ctx.rand() * Math.PI * 2
    g.add(d)
    return g
  },
})
