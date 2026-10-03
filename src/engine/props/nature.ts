import * as THREE from 'three'
import { registerProp } from './registry'
import { LIQUID_SURFACE } from '../MapBuilder'
import { buildPillar } from './architecture'
import {
  PAL,
  M,
  F,
  glowMat,
  cy,
  cn,
  ball,
  dome,
  rod,
  chain,
  leaf,
  rock,
  extrude,
  cachedGeo,
  keep,
  finalize,
  cachedBuild,
  wrap,
  seeded,
  pick,
  range,
  variant,
  shade,
  bool,
  num,
  tint,
  uniqueGlow,
  type Rand,
  type V3,
} from './kit'

/** Random point on an ellipsoid surface, biased away from the top. */
function onBlob(r: Rand, c: V3, rx: number, ry: number, rz: number, k = 0.95): V3 {
  const a = r() * Math.PI * 2
  const y = range(r, -0.7, 0.55)
  const s = Math.sqrt(1 - y * y)
  return [c[0] + Math.cos(a) * s * rx * k, c[1] + y * ry * k, c[2] + Math.sin(a) * s * rz * k]
}

// ---------------------------------------------------------------------------
// tree (canopy colour, bio -> bioluminescent aquamarine leaf clusters, size)
// ---------------------------------------------------------------------------

function buildTree(r: Rand, leafCol: string, bio: boolean): THREE.Group {
  const g = new THREE.Group()
  const bark = M(bio ? '#5d4a56' : PAL.bark)
  const lean = (r() - 0.5) * 0.3
  const top: V3 = [lean, 1.55, lean * 0.4]
  g.add(chain([[0, -0.05, 0], [lean * 0.35, 0.78, 0.02], top], 0.17, 0.085, bark, 10))
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + r()
    g.add(rod([0, 0.24, 0], [Math.cos(a) * 0.33, -0.03, Math.sin(a) * 0.33], 0.085, 0.035, bark, 7))
  }
  for (let i = 0; i < 2; i++) {
    const a = r() * Math.PI * 2
    g.add(rod([lean * 0.55, 1.08 + i * 0.18, lean * 0.2], [lean + Math.cos(a) * 0.5, 1.68 + r() * 0.2, lean * 0.4 + Math.sin(a) * 0.5], 0.055, 0.03, bark, 6))
  }
  const dark = M(shade(leafCol, 0.7))
  const mid = M(leafCol)
  const light = M(shade(leafCol, 1.25))
  const c: V3 = [lean, 2.05, lean * 0.4]
  const blobs: { c: V3; rx: number; ry: number; rz: number }[] = []
  const add = (p: V3, rx: number, ry: number, rz: number, m: THREE.Material) => {
    g.add(ball(rx, ry, rz, m, p[0], p[1], p[2], 16))
    blobs.push({ c: p, rx, ry, rz })
  }
  add(c, 0.82, 0.68, 0.8, mid)
  const n = 4
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.6
    const rr = 0.55 + r() * 0.12
    const s = 0.48 + r() * 0.12
    const low = i % 2 === 0
    add([c[0] + Math.cos(a) * rr, c[1] + (low ? -0.24 : 0.08) + r() * 0.08, c[2] + Math.sin(a) * rr], s, s * 0.84, s, low ? dark : mid)
  }
  add([c[0] + 0.08, c[1] + 0.46, c[2] + 0.1], 0.52, 0.42, 0.5, light)
  if (bio) {
    const glow = glowMat(PAL.bio, 3)
    for (let i = 0; i < 16; i++) {
      const b = blobs[i % blobs.length]
      const p = onBlob(r, b.c, b.rx, b.ry, b.rz)
      const s = 0.06 + r() * 0.05
      g.add(ball(s, s, s, glow, p[0], p[1], p[2], 6))
      g.add(ball(s * 0.7, s * 0.7, s * 0.7, glow, p[0] + s, p[1] - s * 0.6, p[2] + s * 0.4, 6))
    }
    for (let i = 0; i < 6; i++) {
      const b = blobs[1 + (i % (blobs.length - 1))]
      const x = b.c[0] + (r() - 0.5) * b.rx
      const z = b.c[2] + (r() - 0.5) * b.rz
      const y0 = b.c[1] - b.ry * 0.6
      const len = 0.35 + r() * 0.45
      g.add(rod([x, y0, z], [x, y0 - len, z], 0.012, 0.01, glow, 4))
      g.add(ball(0.04, 0.05, 0.04, glow, x, y0 - len, z, 6))
    }
  }
  return g
}

registerProp('tree', {
  solid: true,
  light: (ctx) => (bool(ctx, 'bio') ? { color: PAL.bio, intensity: 1.8, distance: 5, y: 2.1 } : null),
  build: (ctx) => {
    const bio = bool(ctx, 'bio')
    const size = num(ctx, 'size', 1)
    const leafCol = tint(ctx, bio ? PAL.bioLeaf : PAL.leaf, 'canopy')
    const v = variant(ctx, 4)
    const inner = cachedBuild(`tree|${leafCol}|${bio}|${v}`, () => buildTree(seeded('tree' + v), leafCol, bio))
    return wrap(inner, ctx.rand() * Math.PI * 2, size * (0.9 + ctx.rand() * 0.2))
  },
})

// ---------------------------------------------------------------------------
// temple_tree (ancient glowing tree of El; dark -> a dead black branch)
// ---------------------------------------------------------------------------

registerProp('temple_tree', {
  solid: true,
  footprint: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  light: { color: PAL.bio, intensity: 4, distance: 11, y: 3.6 },
  build: (ctx) => {
    const dark = bool(ctx, 'dark')
    const r = seeded('temple' + Math.floor(ctx.rand() * 997))
    const g = new THREE.Group()
    const bark = M('#7d6c66')
    const barkDark = M('#594842')
    g.add(chain([[0, -0.1, 0], [0.12, 1.2, 0.05], [-0.06, 2.3, 0.12], [0.05, 3.1, 0]], 0.7, 0.36, bark, 14))
    // twisting ridges
    for (let i = 0; i < 4; i++) {
      const pts: V3[] = []
      for (let k = 0; k <= 6; k++) {
        const t = k / 6
        const a = (i * Math.PI) / 2 + t * 2.3
        const rr = 0.64 - t * 0.27
        pts.push([Math.cos(a) * rr + 0.04, t * 3.0, Math.sin(a) * rr + 0.04])
      }
      g.add(chain(pts, 0.12, 0.06, barkDark, 7))
    }
    // buttress roots
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + r() * 0.4
      const L = 1.25 + r() * 0.3
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      g.add(chain([[ca * 0.4, 0.8, sa * 0.4], [ca * 0.88, 0.34, sa * 0.88], [ca * L, 0.04, sa * L], [ca * (L + 0.28), -0.08, sa * (L + 0.28)]], 0.25, 0.05, i % 2 ? bark : barkDark, 9))
    }
    // limbs and canopy
    const canopy = [M('#1d5a58'), M('#2a7a72'), M('#3f9c8a')]
    const blobs: { c: V3; rx: number; ry: number; rz: number }[] = []
    const darkIndex = 1
    const black = M('#0f0c12')
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      if (dark && i === darkIndex) {
        const pts: V3[] = [[0.05, 2.7, 0], [ca * 0.9, 3.2, sa * 0.9], [ca * 1.7, 3.35, sa * 1.7], [ca * 2.35, 3.1, sa * 2.35]]
        g.add(chain(pts, 0.22, 0.05, black, 8))
        for (let k = 1; k < 4; k++) {
          const p = pts[k]
          const b = a + (k % 2 ? 0.7 : -0.7)
          g.add(chain([p, [p[0] + Math.cos(b) * 0.4, p[1] + 0.35, p[2] + Math.sin(b) * 0.4], [p[0] + Math.cos(b) * 0.55, p[1] + 0.6, p[2] + Math.sin(b) * 0.6]], 0.06, 0.012, black, 5))
        }
        // black veins creeping down the trunk from the dead branch
        for (let k = 0; k < 4; k++) {
          const off = (k - 1.5) * 0.35
          const vein: V3[] = []
          for (let j = 0; j <= 5; j++) {
            const t = j / 5
            const ang = a + off + Math.sin(t * 5 + k) * 0.25
            const rr = 0.5 + t * 0.24
            vein.push([Math.cos(ang) * rr, 2.7 - t * 2.6, Math.sin(ang) * rr])
          }
          g.add(chain(vein, 0.045, 0.02, black, 5, false))
        }
        continue
      }
      const end: V3 = [ca * 1.75, 4.15 + r() * 0.3, sa * 1.75]
      g.add(chain([[0.05, 2.8, 0], [ca * 0.95, 3.6, sa * 0.95], end], 0.25, 0.1, bark, 9))
      const s = 1.05 + r() * 0.25
      const c: V3 = [end[0], end[1] + 0.25, end[2]]
      g.add(ball(s, s * 0.68, s, canopy[i % 2], c[0], c[1], c[2], 18))
      blobs.push({ c, rx: s, ry: s * 0.68, rz: s })
    }
    const topC: V3 = [0, 4.95, 0]
    g.add(ball(1.35, 0.85, 1.3, canopy[2], topC[0], topC[1], topC[2], 20))
    blobs.push({ c: topC, rx: 1.35, ry: 0.85, rz: 1.3 })
    // glowing leaf clusters (one material per tree, it breathes)
    const glow = uniqueGlow(PAL.bio, 3)
    for (let i = 0; i < 34; i++) {
      const b = blobs[i % blobs.length]
      const p = onBlob(r, b.c, b.rx, b.ry, b.rz)
      const s = 0.09 + r() * 0.07
      g.add(ball(s, s, s, glow, p[0], p[1], p[2], 6))
      g.add(ball(s * 0.65, s * 0.65, s * 0.65, glow, p[0] + s * 0.9, p[1] - s * 0.5, p[2] - s * 0.3, 6))
    }
    // glowing petals fallen around the roots
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2
      const d = 0.9 + r() * 1.0
      g.add(ball(0.05, 0.015, 0.05, glow, Math.cos(a) * d, 0.02, Math.sin(a) * d, 4))
    }
    // hanging glowing strands sway in animate()
    const strands: THREE.Object3D[] = []
    for (let i = 0; i < 10; i++) {
      const b = blobs[i % blobs.length]
      const ang = r() * Math.PI * 2
      const rad = r() * 0.6
      const top: V3 = [b.c[0] + Math.cos(ang) * b.rx * rad, b.c[1] - b.ry * 0.7, b.c[2] + Math.sin(ang) * b.rz * rad]
      const len = 0.9 + r() * 0.9
      const s = new THREE.Group()
      s.position.set(top[0], top[1], top[2])
      s.add(rod([0, 0, 0], [0, -len, 0], 0.014, 0.01, glow, 4))
      for (let k = 1; k <= 3; k++) s.add(ball(0.045, 0.055, 0.045, glow, 0, (-len * k) / 3, 0, 6))
      finalize(s)
      keep(s)
      s.userData.phase = r() * 10
      g.add(s)
      strands.push(s)
    }
    g.userData.glow = glow
    g.userData.strands = strands
    return finalize(g)
  },
  animate: (obj, t) => {
    const glow = obj.userData.glow as THREE.MeshBasicMaterial | undefined
    if (glow) glow.color.copy(glow.userData.base as THREE.Color).multiplyScalar(0.85 + 0.15 * Math.sin(t * 0.9))
    const strands = obj.userData.strands as THREE.Object3D[] | undefined
    if (!strands) return
    for (const s of strands) {
      const p = Number(s.userData.phase) || 0
      s.rotation.z = Math.sin(t * 0.7 + p) * 0.06
      s.rotation.x = Math.cos(t * 0.55 + p) * 0.05
    }
  },
})

// ---------------------------------------------------------------------------
// spruce (stacked cones; black -> cursed black forest, snow)
// ---------------------------------------------------------------------------

function buildSpruce(r: Rand, needle: string, black: boolean, snow: boolean): THREE.Group {
  const g = new THREE.Group()
  g.add(cy(0.07, 0.12, 0.7, M(black ? '#1a1619' : PAL.barkDark), 0, 0, 0, 8))
  const cols = [M(needle), M(shade(needle, black ? 1.35 : 0.8))]
  const snowM = M(PAL.snow)
  const tiers = 4
  for (let i = 0; i < tiers; i++) {
    const R = 0.82 - i * 0.165
    const H = 0.96 - i * 0.1
    const y = 0.42 + i * 0.52
    const tilt = black ? 0.18 : 0.05
    const tier = cn(R, H, cols[i % 2], 0, y, 0, black ? 7 : 12)
    tier.rotation.set((r() - 0.5) * tilt, r() * Math.PI, (r() - 0.5) * tilt)
    g.add(tier)
    if (snow) {
      const cap = cn(R * 0.68, H * 0.5, snowM, 0, y + H * 0.5, 0, 12)
      cap.rotation.copy(tier.rotation)
      g.add(cap)
    }
  }
  if (snow) g.add(ball(0.6, 0.07, 0.6, snowM, 0, 0.0, 0, 16))
  return g
}

registerProp('spruce', {
  solid: true,
  build: (ctx) => {
    const black = bool(ctx, 'black')
    const snow = bool(ctx, 'snow')
    const needle = tint(ctx, black ? '#1d1b24' : PAL.spruce)
    const v = variant(ctx, 4)
    const inner = cachedBuild(`spruce|${needle}|${black}|${snow}|${v}`, () => buildSpruce(seeded('spruce' + v), needle, black, snow))
    return wrap(inner, ctx.rand() * Math.PI * 2, num(ctx, 'size', 1) * (0.85 + ctx.rand() * 0.3))
  },
})

// ---------------------------------------------------------------------------
// deadtree
// ---------------------------------------------------------------------------

registerProp('deadtree', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 4)
    const col = tint(ctx, '#7d6e62')
    const inner = cachedBuild(`deadtree|${col}|${v}`, () => {
      const r = seeded('dead' + v)
      const g = new THREE.Group()
      const bark = M(col)
      const lean = (r() - 0.5) * 0.4
      g.add(chain([[0, -0.05, 0], [lean * 0.3, 0.8, 0.05], [lean, 1.6, -0.05], [lean * 1.2, 2.1, 0.05]], 0.15, 0.05, bark, 8))
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + r()
        g.add(rod([0, 0.22, 0], [Math.cos(a) * 0.32, -0.03, Math.sin(a) * 0.32], 0.08, 0.03, bark, 6))
      }
      for (let i = 0; i < 5; i++) {
        const t = 0.35 + i * 0.13
        const a = r() * Math.PI * 2
        const s: V3 = [lean * t, 0.6 + t * 1.3, 0]
        const e: V3 = [s[0] + Math.cos(a) * (0.55 - i * 0.05), s[1] + 0.35 + r() * 0.2, s[2] + Math.sin(a) * (0.55 - i * 0.05)]
        g.add(rod(s, e, 0.05 - i * 0.005, 0.018, bark, 6))
        const b = a + (r() > 0.5 ? 0.8 : -0.8)
        g.add(rod(e, [e[0] + Math.cos(b) * 0.22, e[1] + 0.18, e[2] + Math.sin(b) * 0.22], 0.018, 0.006, bark, 5))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// bush (flowers -> small blossoms)
// ---------------------------------------------------------------------------

registerProp('bush', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.leafDark)
    const flowers = bool(ctx, 'flowers')
    const flowerCol = tint(ctx, '#ffb0d0', 'flowerColor')
    const v = variant(ctx, 4)
    const inner = cachedBuild(`bush|${col}|${flowers}|${flowerCol}|${v}`, () => {
      const r = seeded('bush' + v)
      const g = new THREE.Group()
      const mats = [M(shade(col, 0.82)), M(col), M(shade(col, 1.25))]
      const n = 4
      const blobs: { c: V3; s: number }[] = []
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r()
        const d = i === 0 ? 0 : 0.22 + r() * 0.05
        const s = i === 0 ? 0.38 : 0.26 + r() * 0.08
        const c: V3 = [Math.cos(a) * d, s * 0.85 + (i === 0 ? 0.05 : 0), Math.sin(a) * d]
        g.add(ball(s, s * 0.85, s, mats[i === 0 ? 2 : i % 2], c[0], c[1], c[2], 14))
        blobs.push({ c, s })
      }
      if (flowers) {
        const fm = M(flowerCol)
        const fc = M(PAL.gold)
        for (let i = 0; i < 9; i++) {
          const b = blobs[i % n]
          const p = onBlob(r, b.c, b.s, b.s * 0.85, b.s, 0.98)
          if (p[1] < 0.15) continue
          g.add(ball(0.05, 0.035, 0.05, fm, p[0], p[1], p[2], 8))
          g.add(ball(0.02, 0.02, 0.02, fc, p[0], p[1] + 0.025, p[2], 4))
        }
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2, num(ctx, 'size', 1) * (0.9 + ctx.rand() * 0.2))
  },
})

// ---------------------------------------------------------------------------
// flowers (decor; glow -> white / blue night flowers)
// ---------------------------------------------------------------------------

const FLOWER_COLS = ['#ffffff', '#ffd23f', '#ff7aa8', '#b07aff', '#ff8a4a']

registerProp('flowers', {
  solid: false,
  castShadow: false,
  light: (ctx) => (bool(ctx, 'glow') ? { color: '#9fd8ff', intensity: 0.8, distance: 2.6, y: 0.35 } : null),
  build: (ctx) => {
    const glow = bool(ctx, 'glow')
    const col = tint(ctx, '')
    const v = variant(ctx, 4)
    const inner = cachedBuild(`flowers|${glow}|${col}|${v}`, () => {
      const r = seeded('flowers' + v)
      const g = new THREE.Group()
      const stem = M(PAL.leafDark)
      const leafM = M(PAL.leaf)
      const heads = glow ? [glowMat('#eef8ff', 3), glowMat('#7fc8ff', 3)] : [M(col || pick(r, FLOWER_COLS)), M(col ? shade(col, 1.15) : pick(r, FLOWER_COLS))]
      const centre = glow ? glowMat('#ffffff', 3.4) : M(PAL.gold)
      const n = 6 + Math.floor(r() * 3)
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2
        const d = Math.sqrt(r()) * 0.32
        const x = Math.cos(a) * d
        const z = Math.sin(a) * d
        const h = 0.16 + r() * 0.18
        const tx = x + (r() - 0.5) * 0.06
        const tz = z + (r() - 0.5) * 0.06
        g.add(rod([x, 0, z], [tx, h, tz], 0.012, 0.01, stem, 4))
        g.add(ball(0.055, 0.035, 0.055, heads[i % 2], tx, h + 0.01, tz, 8))
        g.add(ball(0.022, 0.018, 0.022, centre, tx, h + 0.035, tz, 6))
        if (i % 2 === 0) g.add(leaf([x, 0, z], [x + Math.cos(a + 1) * 0.12, 0.09, z + Math.sin(a + 1) * 0.12], 0.06, 0.015, leafM))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// grass tuft, reeds
// ---------------------------------------------------------------------------

registerProp('grass', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const col = tint(ctx, PAL.grass)
    const v = variant(ctx, 4)
    const inner = cachedBuild(`grass|${col}|${v}`, () => {
      const r = seeded('grass' + v)
      const g = new THREE.Group()
      const mats = [M(col), M(shade(col, 0.78)), M(shade(col, 1.2))]
      const n = 7 + Math.floor(r() * 4)
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2
        const d = r() * 0.14
        const x = Math.cos(a) * d
        const z = Math.sin(a) * d
        const h = 0.22 + r() * 0.24
        const out = 0.08 + r() * 0.1
        g.add(leaf([x, -0.02, z], [x + Math.cos(a) * out, h, z + Math.sin(a) * out], 0.07, 0.018, mats[i % 3]))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2, 0.85 + ctx.rand() * 0.3)
  },
})

registerProp('reeds', {
  solid: false,
  build: (ctx) => {
    const v = variant(ctx, 4)
    const inner = cachedBuild(`reeds|${v}`, () => {
      const r = seeded('reeds' + v)
      const g = new THREE.Group()
      const stalk = M('#8a9a4a')
      const leafM = M('#6f8a3c')
      const head = M('#6a4026')
      const n = 6 + Math.floor(r() * 3)
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2
        const d = r() * 0.25
        const x = Math.cos(a) * d
        const z = Math.sin(a) * d
        const h = 0.85 + r() * 0.45
        const tx = x + (r() - 0.5) * 0.18
        const tz = z + (r() - 0.5) * 0.18
        g.add(rod([x, -0.05, z], [tx, h, tz], 0.018, 0.01, stalk, 5))
        if (i % 2 === 0) {
          const t0 = 0.72
          const t1 = 0.86
          g.add(rod([x + (tx - x) * t0, h * t0, z + (tz - z) * t0], [x + (tx - x) * t1, h * t1, z + (tz - z) * t1], 0.035, 0.035, head, 7))
        } else {
          g.add(leaf([x, 0, z], [x + Math.cos(a) * 0.2, h * 0.7, z + Math.sin(a) * 0.2], 0.06, 0.015, leafM))
        }
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// rock (knee high), boulder (large)
// ---------------------------------------------------------------------------

registerProp('rock', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.stone)
    const v = variant(ctx, 4)
    const moss = bool(ctx, 'moss', v === 1)
    const inner = cachedBuild(`rock|${col}|${moss}|${v}`, () => {
      const r = seeded('rockp' + v)
      const g = new THREE.Group()
      const m = F(col)
      const m2 = F(shade(col, 0.85))
      g.add(rock(v, 0.34, 0.3, 0.3, m, 0, 0, 0))
      g.add(rock(v + 2, 0.15, 0.13, 0.13, m2, 0.3, 0, 0.18))
      if (r() > 0.4) g.add(rock(v + 3, 0.1, 0.08, 0.09, m, -0.28, 0, 0.22))
      if (moss) g.add(ball(0.24, 0.07, 0.2, M(PAL.moss), 0.02, 0.38, -0.02, 10))
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2, num(ctx, 'size', 1))
  },
})

registerProp('boulder', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.stone)
    const v = variant(ctx, 3)
    const moss = bool(ctx, 'moss', v !== 2)
    const inner = cachedBuild(`boulder|${col}|${moss}|${v}`, () => {
      const g = new THREE.Group()
      const m = F(col)
      const m2 = F(shade(col, 0.82))
      g.add(rock(v + 1, 0.62, 0.78, 0.58, m, 0, 0, 0))
      g.add(rock(v + 4, 0.28, 0.26, 0.26, m2, 0.42, 0, 0.32))
      g.add(rock(v, 0.18, 0.16, 0.16, m, -0.42, 0, 0.36))
      if (moss) {
        const mm = M(PAL.moss)
        g.add(ball(0.42, 0.12, 0.36, mm, 0.0, 0.98, -0.05, 12))
        g.add(ball(0.16, 0.06, 0.14, mm, 0.38, 0.32, 0.3, 8))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2, num(ctx, 'size', 1))
  },
})

// ---------------------------------------------------------------------------
// stump, log, roots
// ---------------------------------------------------------------------------

registerProp('stump', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const inner = cachedBuild(`stump|${v}`, () => {
      const r = seeded('stump' + v)
      const g = new THREE.Group()
      const bark = M(PAL.bark)
      g.add(cy(0.27, 0.33, 0.36, bark, 0, 0, 0, 14))
      g.add(cy(0.25, 0.25, 0.02, M('#d8ad74'), 0, 0.355, 0, 14))
      g.add(cy(0.15, 0.15, 0.01, M('#b88a52'), 0, 0.37, 0, 12))
      g.add(cy(0.05, 0.05, 0.01, M('#9a6c3e'), 0, 0.376, 0, 8))
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + r()
        g.add(rod([Math.cos(a) * 0.2, 0.2, Math.sin(a) * 0.2], [Math.cos(a) * 0.46, -0.03, Math.sin(a) * 0.46], 0.09, 0.03, bark, 7))
      }
      if (r() > 0.4) g.add(ball(0.12, 0.05, 0.1, M(PAL.moss), 0.18, 0.3, 0.1, 8))
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

registerProp('log', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const inner = cachedBuild(`log|${v}`, () => {
      const r = seeded('log' + v)
      const g = new THREE.Group()
      const bark = M(PAL.bark)
      const L = 1.35
      g.add(rod([-L / 2, 0.19, 0], [L / 2, 0.19, 0], 0.2, 0.18, bark, 14))
      for (const s of [-1, 1]) {
        const end = cy(0.17, 0.17, 0.02, M('#d6aa70'), 0, 0, 0, 14)
        end.rotation.z = Math.PI / 2
        end.position.set(s * (L / 2 + 0.002), 0.19, 0)
        g.add(end)
      }
      g.add(rod([0.15, 0.3, 0.05], [0.32, 0.55, 0.2], 0.05, 0.03, bark, 6))
      g.add(ball(0.3, 0.08, 0.16, M(PAL.moss), -0.2 + r() * 0.2, 0.36, 0, 10))
      g.add(ball(0.05, 0.03, 0.05, M('#e6d2b0'), 0.4, 0.22, 0.18, 6))
      return g
    })
    return wrap(inner, ctx.rand() < 0.5 ? 0 : Math.PI)
  },
})

registerProp('roots', {
  solid: false,
  build: (ctx) => {
    const v = variant(ctx, 4)
    const inner = cachedBuild(`roots|${v}`, () => {
      const r = seeded('roots' + v)
      const g = new THREE.Group()
      const bark = M(PAL.barkDark)
      const bark2 = M(PAL.bark)
      const n = 5 + Math.floor(r() * 2)
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const L = 0.45 + r() * 0.15
        const ox = (r() - 0.5) * 0.4
        const oz = (r() - 0.5) * 0.4
        const pts: V3[] = []
        for (let k = 0; k <= 4; k++) {
          const t = k / 4
          const wob = Math.sin(t * 6 + i) * 0.06
          pts.push([ox + ca * (t - 0.5) * L * 2 - sa * wob, Math.sin(t * Math.PI) * (0.1 + r() * 0.04) - 0.03, oz + sa * (t - 0.5) * L * 2 + ca * wob])
        }
        g.add(chain(pts, 0.06, 0.03, i % 2 ? bark : bark2, 6))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// mushroom (glowing caps; color; glow=false -> plain red caps)
// ---------------------------------------------------------------------------

registerProp('mushroom', {
  solid: false,
  light: (ctx) => (bool(ctx, 'glow', true) ? { color: tint(ctx, '#58d6ff'), intensity: 1, distance: 2.8, y: 0.35 } : null),
  build: (ctx) => {
    const glow = bool(ctx, 'glow', true)
    const col = tint(ctx, glow ? '#58d6ff' : '#d0503a')
    const v = variant(ctx, 4)
    const inner = cachedBuild(`mushroom|${glow}|${col}|${v}`, () => {
      const r = seeded('mush' + v)
      const g = new THREE.Group()
      const stem = M('#efe4cc')
      const cap = glow ? M(col, { emissive: col, ei: 1.6 }) : M(col)
      const gill = M(glow ? shade(col, 0.6) : '#e8d8bc')
      const spot = glow ? glowMat('#ffffff', 2.6) : M('#fff6e6')
      const n = 3 + Math.floor(r() * 3)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r()
        const d = i === 0 ? 0 : 0.12 + r() * 0.12
        const h = (i === 0 ? 0.3 : 0.12 + r() * 0.14) * (glow ? 1 : 0.9)
        const cr = h * 0.55 + 0.03
        const x = Math.cos(a) * d
        const z = Math.sin(a) * d
        const lean = (r() - 0.5) * 0.25
        const m = new THREE.Group()
        m.position.set(x, 0, z)
        m.rotation.set(lean, 0, (r() - 0.5) * 0.25)
        m.add(cy(cr * 0.28, cr * 0.36, h, stem, 0, 0, 0, 8))
        m.add(cy(cr * 0.95, cr * 0.95, 0.012, gill, 0, h - 0.004, 0, 14))
        m.add(dome(cr, cr * 0.62, cr, cap, 0, h, 0, 14))
        for (let k = 0; k < 3; k++) {
          const b = k * 2.1 + r()
          m.add(ball(cr * 0.14, cr * 0.08, cr * 0.14, spot, Math.cos(b) * cr * 0.5, h + cr * 0.48, Math.sin(b) * cr * 0.5, 4))
        }
        g.add(m)
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// palm, jungle_tree (huge Kitsune tree with buttress roots)
// ---------------------------------------------------------------------------

registerProp('palm', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 4)
    const inner = cachedBuild(`palm|${v}`, () => {
      const r = seeded('palm' + v)
      const g = new THREE.Group()
      const t1 = M('#8a6a48')
      const t2 = M('#a5825a')
      const bend = 0.35 + r() * 0.3
      const pts: V3[] = []
      for (let i = 0; i <= 6; i++) {
        const t = i / 6
        pts.push([bend * t * t, t * 2.6, 0])
      }
      for (let i = 0; i < 6; i++) g.add(rod(pts[i], pts[i + 1], 0.12 - i * 0.008, 0.115 - i * 0.008, i % 2 ? t1 : t2, 9))
      const top = pts[6]
      const fronds = [M('#4f9a3a'), M('#3c7f30'), M('#6ab64a')]
      const n = 8
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 0.3
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const p0: V3 = [top[0], top[1] + 0.02, top[2]]
        const p1: V3 = [top[0] + ca * 0.5, top[1] + 0.22, top[2] + sa * 0.5]
        const p2: V3 = [top[0] + ca * 0.95, top[1] + 0.05, top[2] + sa * 0.95]
        const p3: V3 = [top[0] + ca * 1.25, top[1] - 0.35, top[2] + sa * 1.25]
        const m = fronds[i % 3]
        g.add(leaf(p0, p1, 0.24, 0.035, m))
        g.add(leaf(p1, p2, 0.3, 0.035, m))
        g.add(leaf(p2, p3, 0.2, 0.03, m))
      }
      const nut = M('#5a3a22')
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1
        g.add(ball(0.09, 0.1, 0.09, nut, top[0] + Math.cos(a) * 0.12, top[1] - 0.12, top[2] + Math.sin(a) * 0.12, 10))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2, num(ctx, 'size', 1) * (0.9 + ctx.rand() * 0.2))
  },
})

function finShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(1, 0)
  s.quadraticCurveTo(0.22, 0.22, 0, 1)
  s.lineTo(0, 0)
  return s
}

registerProp('jungle_tree', {
  solid: true,
  footprint: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  build: (ctx) => {
    const v = variant(ctx, 3)
    const inner = cachedBuild(`jungle|${v}`, () => {
      const r = seeded('jungle' + v)
      const g = new THREE.Group()
      const bark = M('#7a6450')
      const barkDark = M('#5a4838')
      const lean = (r() - 0.5) * 0.3
      g.add(chain([[0, -0.1, 0], [0.05, 1.8, 0.03], [lean * 0.5, 3.6, 0], [lean, 5.0, lean * 0.3]], 0.58, 0.3, bark, 14))
      const nf = 6
      for (let i = 0; i < nf; i++) {
        const a = (i / nf) * Math.PI * 2 + r() * 0.3
        const fin = extrude('fin', finShape, 1, i % 2 ? bark : barkDark, 10)
        fin.scale.set(1.35 + r() * 0.35, 1.5 + r() * 0.6, 0.16)
        fin.rotation.y = -a
        fin.position.y = -0.05
        g.add(fin)
      }
      // a few branches into the crown
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + r()
        g.add(chain([[lean * 0.8, 4.4, 0], [lean + Math.cos(a) * 1.0, 5.1, Math.sin(a) * 1.0], [lean + Math.cos(a) * 1.7, 5.5, Math.sin(a) * 1.7]], 0.16, 0.07, bark, 8))
      }
      const greens = [M(PAL.jungleDark), M(PAL.jungle), M('#4a9a52')]
      const blobs: { c: V3; s: number }[] = []
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + r() * 0.4
        const d = i === 0 ? 0 : 1.4 + r() * 0.5
        const s = i === 0 ? 1.6 : 1.05 + r() * 0.35
        const c: V3 = [lean + Math.cos(a) * d, 5.6 + (i === 0 ? 0.55 : r() * 0.5 - 0.1), Math.sin(a) * d]
        g.add(ball(s, s * 0.62, s, greens[i === 0 ? 2 : i % 2], c[0], c[1], c[2], 18))
        blobs.push({ c, s })
      }
      // lianas hanging from the crown
      const vine = M('#3a6a2e')
      for (let i = 0; i < 7; i++) {
        const b = blobs[1 + (i % 6)]
        const x = b.c[0] + (r() - 0.5) * b.s
        const z = b.c[2] + (r() - 0.5) * b.s
        const y0 = b.c[1] - b.s * 0.45
        const y1 = 1.2 + r() * 1.6
        g.add(chain([[x, y0, z], [x + 0.08, (y0 + y1) / 2, z - 0.05], [x + 0.02, y1, z + 0.04]], 0.025, 0.018, vine, 5, false))
        g.add(leaf([x + 0.02, y1, z + 0.04], [x + 0.08, y1 - 0.18, z + 0.1], 0.1, 0.02, greens[1]))
      }
      // moss and ferns on the trunk
      g.add(ball(0.3, 0.12, 0.3, M(PAL.moss), 0.35, 1.4, 0.32, 10))
      g.add(ball(0.22, 0.1, 0.22, M(PAL.moss), -0.3, 2.6, 0.2, 10))
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// lily (glowing water lilies floating on the water surface)
// ---------------------------------------------------------------------------

registerProp('lily', {
  solid: false,
  light: (ctx) => ({ color: tint(ctx, '#ffc8e8'), intensity: 0.8, distance: 2.4, y: LIQUID_SURFACE + 0.25 }),
  build: (ctx) => {
    const col = tint(ctx, '#ffc8e8')
    const v = variant(ctx, 4)
    const inner = cachedBuild(`lily|${col}|${v}`, () => {
      const r = seeded('lily' + v)
      const g = new THREE.Group()
      const y = LIQUID_SURFACE + 0.012
      const padGeo = cachedGeo('lilypad', () => new THREE.CylinderGeometry(1, 1, 1, 18, 1, false, 0.3, Math.PI * 2 - 0.6))
      const pads = [M('#4f9a4a'), M('#6ab85a'), M('#3f8a44')]
      const n = 2 + Math.floor(r() * 3)
      const spots: V3[] = []
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2
        const d = i === 0 ? 0 : 0.22 + r() * 0.14
        const s = i === 0 ? 0.26 : 0.14 + r() * 0.1
        const pad = new THREE.Mesh(padGeo, pads[i % 3])
        pad.scale.set(s, 0.015, s)
        pad.position.set(Math.cos(a) * d, y, Math.sin(a) * d)
        pad.rotation.y = r() * Math.PI * 2
        pad.receiveShadow = true
        g.add(pad)
        spots.push([pad.position.x, y, pad.position.z])
      }
      const petal = M(col, { emissive: col, ei: 1.5 })
      const core = glowMat('#fff2a0', 3)
      for (let f = 0; f < (r() > 0.5 ? 2 : 1); f++) {
        const s = spots[f]
        const c: V3 = [s[0] + 0.03, s[1] + 0.02, s[2] - 0.02]
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2
          g.add(leaf(c, [c[0] + Math.cos(a) * 0.13, c[1] + 0.09, c[2] + Math.sin(a) * 0.13], 0.075, 0.025, petal))
        }
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + 0.3
          g.add(leaf(c, [c[0] + Math.cos(a) * 0.06, c[1] + 0.12, c[2] + Math.sin(a) * 0.06], 0.06, 0.02, petal))
        }
        g.add(ball(0.035, 0.03, 0.035, core, c[0], c[1] + 0.06, c[2], 6))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// vine_pillar (white Kitsune pillar swallowed by vines)
// ---------------------------------------------------------------------------

registerProp('vine_pillar', {
  solid: true,
  build: (ctx) => {
    const broken = bool(ctx, 'broken')
    const h = num(ctx, 'h', 2.4)
    const v = variant(ctx, 3)
    const inner = cachedBuild(`vinepillar|${broken}|${h}|${v}`, () => {
      const r = seeded('vinep' + v)
      const g = buildPillar({ h, broken, style: 'white', seed: v + 7 })
      const top = broken ? 1.0 : h - 0.3
      const vine = M('#3f7a34')
      const leaves = [M(PAL.leaf), M(PAL.leafDark), M(PAL.leafLight)]
      for (let k = 0; k < 2; k++) {
        const pts: V3[] = []
        const steps = 9
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const a = k * Math.PI + t * Math.PI * 2.4
          const rr = 0.29 + Math.sin(t * 9) * 0.015
          pts.push([Math.cos(a) * rr, 0.25 + t * (top - 0.25), Math.sin(a) * rr])
        }
        g.add(chain(pts, 0.03, 0.022, vine, 5, false))
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i]
          const out = Math.atan2(p[2], p[0]) + (r() - 0.5) * 0.8
          g.add(leaf(p, [p[0] + Math.cos(out) * 0.17, p[1] + 0.06, p[2] + Math.sin(out) * 0.17], 0.12, 0.025, leaves[i % 3]))
        }
      }
      // hanging vine from the top
      g.add(chain([[0.3, top + 0.1, 0.12], [0.36, top - 0.4, 0.2], [0.32, top - 0.85, 0.25]], 0.022, 0.016, vine, 5, false))
      g.add(leaf([0.32, top - 0.85, 0.25], [0.38, top - 1.0, 0.32], 0.12, 0.025, leaves[0]))
      // moss at the base
      g.add(ball(0.3, 0.1, 0.25, M(PAL.moss), 0.25, 0.2, 0.22, 10))
      g.add(ball(0.2, 0.08, 0.2, M(PAL.moss), -0.3, 0.17, -0.1, 10))
      return g
    })
    return wrap(inner, Math.floor(ctx.rand() * 4) * (Math.PI / 2))
  },
})
