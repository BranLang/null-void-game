import * as THREE from 'three'
import { registerProp } from './registry'
import { stripeTex } from './architecture'
import {
  PAL,
  WALL_Z,
  M,
  F,
  glowMat,
  bx,
  cy,
  cn,
  ball,
  rod,
  leaf,
  torus,
  ring,
  plane,
  lathe,
  rot,
  fx,
  keep,
  finalize,
  cachedBuild,
  cachedGeo,
  wrap,
  seeded,
  pick,
  variant,
  shade,
  bool,
  num,
  str,
  tint,
  canvasTex,
  texMat,
  flame,
  flicker,
  type Rand,
} from './kit'

const BOOK_COLS = ['#c0392b', '#2e6fb0', '#3e9a52', '#e0a030', '#8a44c8', '#d06a30', '#2a9a9a', '#efe0c0', '#5a3a8a', '#a8323e']

// ---------------------------------------------------------------------------
// crate, barrel, sack
// ---------------------------------------------------------------------------

function addCrate(g: THREE.Group, s: number, col: string, x: number, y: number, z: number, ry: number): void {
  const c = new THREE.Group()
  c.position.set(x, y, z)
  c.rotation.y = ry
  const body = M(col)
  const frame = M(shade(col, 0.66))
  const t = 0.075
  c.add(bx(s - 0.05, s - 0.05, s - 0.05, body, 0, 0.025))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.add(bx(t, s, t, frame, sx * (s / 2 - t / 2), 0, sz * (s / 2 - t / 2)))
  for (const yy of [0, s - t]) {
    for (const sz of [-1, 1]) c.add(bx(s, t, t, frame, 0, yy, sz * (s / 2 - t / 2)))
    for (const sx of [-1, 1]) c.add(bx(t, t, s, frame, sx * (s / 2 - t / 2), yy, 0))
  }
  const dl = (s - 2 * t) * Math.SQRT2 * 0.95
  for (const sz of [-1, 1]) {
    const b = bx(dl, 0.07, 0.035, frame, 0, 0, 0)
    b.position.set(0, s / 2, sz * (s / 2 - 0.01))
    b.rotation.z = Math.PI / 4
    c.add(b)
  }
  for (const sx of [-1, 1]) {
    const b = bx(0.035, 0.07, dl, frame, 0, 0, 0)
    b.position.set(sx * (s / 2 - 0.01), s / 2, 0)
    b.rotation.x = Math.PI / 4
    c.add(b)
  }
  g.add(c)
}

registerProp('crate', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, '#c08a52')
    const stack = Math.max(1, Math.min(3, Math.round(num(ctx, 'stack', 1))))
    const v = variant(ctx, 4)
    const inner = cachedBuild(`crate|${col}|${stack}|${v}`, () => {
      const r = seeded('crate' + v)
      const g = new THREE.Group()
      let y = 0
      let s = 0.74 + r() * 0.06
      for (let i = 0; i < stack; i++) {
        addCrate(g, s, col, (r() - 0.5) * 0.06, y, (r() - 0.5) * 0.06, (r() - 0.5) * (i ? 0.6 : 0.15))
        y += s
        s *= 0.86
      }
      return g
    })
    return wrap(inner, Math.floor(ctx.rand() * 4) * (Math.PI / 2))
  },
})

registerProp('barrel', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.wood)
    const lying = bool(ctx, 'lying')
    const inner = cachedBuild(`barrel|${col}|${lying}`, () => {
      const g = new THREE.Group()
      const b = new THREE.Group()
      b.add(lathe('barrel', [[0, 0], [0.25, 0], [0.29, 0.12], [0.31, 0.42], [0.29, 0.72], [0.25, 0.84], [0, 0.84]], M(col), 16))
      const hoop = M(PAL.ironDark)
      for (const [y, rr] of [[0.1, 0.292], [0.7, 0.292], [0.33, 0.312], [0.48, 0.312]] as const) b.add(cy(rr, rr, 0.045, hoop, 0, y, 0, 16))
      b.add(cy(0.235, 0.235, 0.012, M(shade(col, 1.25)), 0, 0.838, 0, 16))
      b.add(rot(bx(0.36, 0.01, 0.03, M(shade(col, 0.7)), 0, 0.85, 0), 0, 0.4, 0))
      if (lying) {
        b.rotation.x = Math.PI / 2
        b.position.set(0, 0.31, -0.42)
      }
      g.add(b)
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

registerProp('sack', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, '#cfae78')
    const count = Math.max(1, Math.min(3, Math.round(num(ctx, 'count', 1))))
    const v = variant(ctx, 3)
    const inner = cachedBuild(`sack|${col}|${count}|${v}`, () => {
      const r = seeded('sack' + v)
      const g = new THREE.Group()
      const burlap = M(col)
      const dark = M(shade(col, 0.72))
      const rope = M(PAL.rope)
      const one = (x: number, z: number, ry: number, tilt: number, s: number) => {
        const sk = new THREE.Group()
        sk.position.set(x, 0, z)
        sk.rotation.set(tilt, ry, 0)
        sk.scale.setScalar(s)
        sk.add(ball(0.25, 0.27, 0.21, burlap, 0, 0.25, 0, 14))
        sk.add(cy(0.07, 0.1, 0.1, burlap, 0, 0.47, 0, 10))
        sk.add(cy(0.078, 0.078, 0.03, rope, 0, 0.5, 0, 10))
        sk.add(cy(0.11, 0.065, 0.08, burlap, 0, 0.53, 0, 10))
        const stamp = cy(0.065, 0.065, 0.006, dark, 0, 0, 0, 12)
        stamp.rotation.x = Math.PI / 2
        stamp.position.set(0, 0.26, 0.207)
        sk.add(stamp)
        g.add(sk)
      }
      one(0, 0, r() - 0.5, 0, 1)
      if (count > 1) one(0.3, 0.12, r() * 3, -0.25, 0.85)
      if (count > 2) one(-0.28, 0.18, r() * 3, 0.2, 0.8)
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// table, chair, stool, bench, bed
// ---------------------------------------------------------------------------

registerProp('table', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.wood)
    const round = bool(ctx, 'round')
    const cloth = str(ctx, 'cloth', '')
    const items = bool(ctx, 'items')
    const v = items ? variant(ctx, 3) : 0
    return cachedBuild(`table|${col}|${round}|${cloth}|${items}|${v}`, () => {
      const g = new THREE.Group()
      const wood = M(col)
      const top = M(shade(col, 1.18))
      const H = 0.74
      if (round) {
        g.add(cy(0.44, 0.44, 0.055, top, 0, H - 0.055, 0, 24))
        g.add(cy(0.06, 0.08, H - 0.06, wood, 0, 0, 0, 10))
        g.add(rot(bx(0.6, 0.05, 0.08, wood, 0, 0), 0, Math.PI / 4, 0))
        g.add(rot(bx(0.6, 0.05, 0.08, wood, 0, 0), 0, -Math.PI / 4, 0))
        if (cloth) {
          g.add(cy(0.47, 0.47, 0.015, M(cloth), 0, H, 0, 24))
          const skirt = new THREE.Mesh(cachedGeo('skirt', () => new THREE.CylinderGeometry(0.475, 0.5, 1, 24, 1, true)), M(cloth, { side: THREE.DoubleSide }))
          skirt.scale.set(1, 0.2, 1)
          skirt.position.set(0, H - 0.09, 0)
          skirt.castShadow = true
          g.add(skirt)
        }
      } else {
        for (const x of [-0.42, 0.42]) for (const z of [-0.25, 0.25]) g.add(bx(0.08, H - 0.06, 0.08, wood, x, 0, z))
        g.add(bx(0.86, 0.08, 0.05, wood, 0, H - 0.14, -0.25))
        g.add(bx(0.86, 0.08, 0.05, wood, 0, H - 0.14, 0.25))
        g.add(bx(1.04, 0.06, 0.66, top, 0, H - 0.06))
        if (cloth) {
          const cm = M(cloth)
          g.add(bx(1.08, 0.015, 0.7, cm, 0, H))
          g.add(bx(1.08, 0.22, 0.015, cm, 0, H - 0.21, 0.35))
          g.add(bx(1.08, 0.22, 0.015, cm, 0, H - 0.21, -0.35))
          g.add(bx(0.015, 0.22, 0.7, cm, 0.54, H - 0.21))
          g.add(bx(0.015, 0.22, 0.7, cm, -0.54, H - 0.21))
        }
      }
      if (items) {
        const r = seeded('tableitems' + v)
        const y = H + (cloth ? 0.015 : 0)
        g.add(lathe('jug', [[0, 0], [0.06, 0], [0.08, 0.06], [0.07, 0.14], [0.045, 0.19], [0.05, 0.22], [0.04, 0.22]], M('#d0784a'), 12).translateY(y).translateX(-0.25))
        g.add(cy(0.11, 0.08, 0.018, M('#f2ecdc'), 0.12, y, 0.1, 16))
        g.add(cy(0.11, 0.08, 0.018, M('#f2ecdc'), -0.05, y, -0.15, 16))
        g.add(ball(0.09, 0.05, 0.06, M('#d29a52'), 0.12, y + 0.05, 0.1, 10))
        g.add(cy(0.035, 0.03, 0.08, M('#8a5a3a'), 0.3, y, -0.12 + r() * 0.1, 10))
      }
      return g
    })
  },
})

registerProp('chair', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.wood)
    return cachedBuild(`chair|${col}`, () => {
      const g = new THREE.Group()
      const wood = M(col)
      const seat = M(shade(col, 1.18))
      for (const x of [-0.18, 0.18]) {
        g.add(bx(0.055, 0.45, 0.055, wood, x, 0, 0.18))
        g.add(bx(0.055, 0.98, 0.055, wood, x, 0, -0.19))
      }
      g.add(bx(0.46, 0.06, 0.46, seat, 0, 0.44))
      g.add(bx(0.36, 0.09, 0.035, seat, 0, 0.66, -0.19))
      g.add(bx(0.36, 0.12, 0.035, seat, 0, 0.85, -0.19))
      g.add(bx(0.36, 0.04, 0.04, wood, 0, 0.16, 0.18))
      return g
    })
  },
})

registerProp('stool', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.woodLight)
    return cachedBuild(`stool|${col}`, () => {
      const g = new THREE.Group()
      const wood = M(shade(col, 0.8))
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2
        g.add(rod([Math.cos(a) * 0.12, 0.44, Math.sin(a) * 0.12], [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], 0.028, 0.024, wood, 6))
      }
      g.add(ring(0.15, 0.015, wood, 0, 0.18, 0, 4, 16))
      g.add(cy(0.2, 0.19, 0.06, M(col), 0, 0.43, 0, 18))
      return g
    })
  },
})

registerProp('bench', {
  solid: true,
  build: (ctx) => {
    const stone = str(ctx, 'style', 'wood') === 'stone'
    const back = bool(ctx, 'back')
    const col = tint(ctx, stone ? PAL.white : PAL.wood)
    return cachedBuild(`bench|${stone}|${back}|${col}`, () => {
      const g = new THREE.Group()
      const m = M(col)
      const dark = M(shade(col, stone ? 0.82 : 0.72))
      if (stone) {
        g.add(bx(0.2, 0.34, 0.32, dark, -0.36, 0))
        g.add(bx(0.2, 0.34, 0.32, dark, 0.36, 0))
        g.add(bx(1.02, 0.1, 0.4, m, 0, 0.34))
      } else {
        for (const x of [-0.4, 0.4]) {
          g.add(bx(0.07, 0.4, 0.07, dark, x, 0, 0.1))
          g.add(bx(0.07, 0.4, 0.07, dark, x, 0, -0.1))
          g.add(bx(0.07, 0.05, 0.3, dark, x, 0.12))
        }
        g.add(bx(1.0, 0.06, 0.36, m, 0, 0.4))
      }
      if (back) {
        const by = stone ? 0.44 : 0.46
        if (stone) {
          g.add(bx(1.02, 0.46, 0.1, m, 0, by, -0.16))
        } else {
          for (const x of [-0.4, 0.4]) g.add(bx(0.06, 0.5, 0.06, dark, x, by - 0.02, -0.16))
          g.add(bx(0.96, 0.1, 0.04, m, 0, by + 0.18, -0.16))
          g.add(bx(0.96, 0.12, 0.04, m, 0, by + 0.34, -0.16))
        }
      }
      return g
    })
  },
})

registerProp('bed', {
  solid: true,
  footprint: [[0, 1]],
  build: (ctx) => {
    const blanket = tint(ctx, '#8a3a5a')
    const wood = str(ctx, 'wood', PAL.wood)
    return cachedBuild(`bed|${blanket}|${wood}`, () => {
      const g = new THREE.Group()
      const w = M(wood)
      const wd = M(shade(wood, 0.75))
      g.add(bx(0.98, 1.02, 0.08, w, 0, 0, -0.44))
      g.add(bx(0.86, 0.1, 0.1, wd, 0, 0.9, -0.44))
      g.add(bx(0.98, 0.62, 0.07, w, 0, 0, 1.42))
      for (const x of [-0.45, 0.45]) g.add(bx(0.07, 0.2, 1.84, wd, x, 0.16, 0.5))
      g.add(bx(0.86, 0.17, 1.8, M('#f0e6d0'), 0, 0.28, 0.49))
      const bm = M(blanket)
      g.add(bx(0.92, 0.07, 1.22, bm, 0, 0.42, 0.8))
      g.add(bx(0.93, 0.26, 0.04, bm, 0, 0.2, 1.39))
      g.add(rod([-0.46, 0.5, 0.2], [0.46, 0.5, 0.2], 0.05, 0.05, M(shade(blanket, 1.25)), 10))
      g.add(ball(0.3, 0.075, 0.16, M('#ece6da'), 0, 0.53, -0.24, 14))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// bookshelf, cabinet, shelf
// ---------------------------------------------------------------------------

function fillBooks(g: THREE.Group, r: Rand, x0: number, x1: number, y: number, maxH: number, z: number, depth: number): void {
  let x = x0
  while (x < x1 - 0.04) {
    if (r() < 0.12) {
      x += 0.06 + r() * 0.1
      continue
    }
    if (r() < 0.12 && x1 - x > 0.3) {
      // a lying stack
      let yy = y
      for (let k = 0; k < 2 + Math.floor(r() * 2); k++) {
        const h = 0.045 + r() * 0.02
        g.add(bx(0.24, h, depth * 0.9, M(pick(r, BOOK_COLS)), x + 0.12, yy, z))
        yy += h
      }
      x += 0.27
      continue
    }
    const w = 0.055 + r() * 0.045
    const h = Math.min(maxH, 0.2 + r() * 0.14)
    const b = bx(w, h, depth, M(pick(r, BOOK_COLS)), x + w / 2, y, z)
    if (r() < 0.1) {
      b.rotation.z = -0.22
      b.position.x += 0.03
    }
    g.add(b)
    x += w + 0.006
  }
}

registerProp('bookshelf', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.woodDark)
    const v = variant(ctx, 4)
    return cachedBuild(`bookshelf|${col}|${v}`, () => {
      const r = seeded('books' + v)
      const g = new THREE.Group()
      const wood = M(col)
      const light = M(shade(col, 1.3))
      const zc = WALL_Z + 0.19
      g.add(bx(0.06, 2.0, 0.38, wood, -0.47, 0, zc))
      g.add(bx(0.06, 2.0, 0.38, wood, 0.47, 0, zc))
      g.add(bx(1.04, 0.07, 0.42, wood, 0, 1.98, zc))
      g.add(bx(1.0, 0.12, 0.38, wood, 0, 0, zc))
      g.add(bx(0.9, 1.9, 0.02, M(shade(col, 0.7)), 0, 0.08, WALL_Z + 0.01))
      const levels = [0.12, 0.58, 1.04, 1.5]
      for (const y of levels) {
        g.add(bx(0.9, 0.04, 0.36, light, 0, y - 0.04, zc))
        fillBooks(g, r, -0.44, 0.44, y, 0.4, zc + 0.03, 0.26)
      }
      return g
    })
  },
})

registerProp('cabinet', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, '#b4ab9c')
    return cachedBuild(`cabinet|${col}`, () => {
      const g = new THREE.Group()
      const stone = M(col)
      const dark = M(shade(col, 0.78))
      const zc = WALL_Z + 0.25
      g.add(bx(0.96, 0.09, 0.5, dark, 0, 0, zc))
      g.add(bx(0.9, 1.08, 0.44, stone, 0, 0.09, zc))
      g.add(bx(1.0, 0.08, 0.52, dark, 0, 1.17, zc))
      const fz = zc + 0.22
      for (const s of [-1, 1]) {
        g.add(bx(0.38, 0.86, 0.025, M(shade(col, 1.1)), s * 0.21, 0.2, fz))
        g.add(bx(0.28, 0.7, 0.03, dark, s * 0.21, 0.28, fz + 0.005))
        g.add(ball(0.025, 0.025, 0.02, M(PAL.brass), s * 0.05, 0.66, fz + 0.03, 8))
      }
      g.add(lathe('vase', [[0, 0], [0.06, 0], [0.09, 0.08], [0.07, 0.18], [0.04, 0.24], [0.06, 0.28], [0.045, 0.28]], M(PAL.teal), 12).translateY(1.25).translateX(0.28).translateZ(zc))
      return g
    })
  },
})

registerProp('shelf', {
  solid: false,
  build: (ctx) => {
    const glow = bool(ctx, 'glow')
    const v = variant(ctx, 3)
    return cachedBuild(`shelf|${glow}|${v}`, () => {
      const r = seeded('shelf' + v)
      const g = new THREE.Group()
      const wood = M(PAL.wood)
      const dark = M(PAL.woodDark)
      const zc = WALL_Z + 0.13
      for (const y of [1.22, 1.66]) {
        g.add(bx(0.92, 0.04, 0.26, wood, 0, y, zc))
        for (const x of [-0.36, 0.36]) {
          const br = bx(0.035, 0.2, 0.035, dark, x, y - 0.17, WALL_Z + 0.12)
          br.rotation.x = 0.7
          g.add(br)
        }
        let x = -0.4
        while (x < 0.36) {
          const kind = r()
          const zz = zc + (r() - 0.5) * 0.06
          if (kind < 0.35) {
            const h = 0.12 + r() * 0.1
            const potion = glow && r() < 0.6
            const c = pick(r, ['#8a44c8', '#3e9a52', '#2e6fb0', '#c0392b'])
            g.add(cy(0.04, 0.045, h, potion ? glowMat(c, 2.6) : M(c, { opacity: 0.85 }), x + 0.05, y + 0.04, zz, 10))
            g.add(cy(0.015, 0.015, 0.05, M(c), x + 0.05, y + 0.04 + h, zz, 6))
            g.add(cy(0.02, 0.02, 0.02, M(PAL.woodLight), x + 0.05, y + 0.09 + h, zz, 6))
            x += 0.11
          } else if (kind < 0.65) {
            g.add(cy(0.06, 0.055, 0.12, M(pick(r, ['#d0784a', '#efe0c0', '#2a9a9a'])), x + 0.07, y + 0.04, zz, 12))
            g.add(cy(0.064, 0.064, 0.02, M(PAL.woodDark), x + 0.07, y + 0.16, zz, 12))
            x += 0.16
          } else if (kind < 0.85) {
            g.add(bx(0.14, 0.1, 0.14, M(pick(r, ['#8a5a3a', '#6a4a8a', '#c08a52'])), x + 0.08, y + 0.04, zz))
            x += 0.18
          } else {
            fillBooks(g, r, x, Math.min(0.42, x + 0.2), y + 0.04, 0.3, zz, 0.18)
            x += 0.22
          }
        }
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// chest, safe (open -> lid / door ajar; scripts can use userData.lid / door)
// ---------------------------------------------------------------------------

registerProp('chest', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    const gold = bool(ctx, 'gold', open)
    const col = tint(ctx, '#8a4a2e')
    const g = new THREE.Group()
    const wood = M(col)
    const band = M(PAL.ironDark)
    const brass = M(PAL.brass)
    g.add(bx(0.74, 0.36, 0.46, wood))
    for (const x of [-0.24, 0.24]) g.add(bx(0.06, 0.37, 0.47, band, x, 0))
    g.add(bx(0.75, 0.05, 0.47, band, 0, 0))
    if (open) {
      g.add(bx(0.66, 0.02, 0.38, M('#2a160e'), 0, 0.3))
      if (gold) {
        const coin = glowMat(PAL.gold, 1.6)
        const r = seeded('gold')
        for (let i = 0; i < 9; i++) g.add(ball(0.06, 0.035, 0.06, i % 3 ? M(PAL.gold) : coin, (r() - 0.5) * 0.5, 0.33, (r() - 0.5) * 0.26, 8))
      }
    }
    const lid = new THREE.Group()
    lid.position.set(0, 0.36, -0.23)
    const dome = new THREE.Mesh(cachedGeo('halfcylZ', () => new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI)), wood)
    dome.rotation.z = Math.PI / 2
    dome.scale.set(0.23, 0.74, 0.23)
    dome.position.set(0, 0, 0.23)
    dome.castShadow = true
    lid.add(dome)
    for (const x of [-0.24, 0.24]) {
      const strap = new THREE.Mesh(cachedGeo('halfcylZ', () => new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI)), band)
      strap.rotation.z = Math.PI / 2
      strap.scale.set(0.236, 0.06, 0.236)
      strap.position.set(x, 0, 0.23)
      lid.add(strap)
    }
    lid.add(bx(0.11, 0.13, 0.03, brass, 0, -0.08, 0.47))
    finalize(lid)
    lid.rotation.x = open ? -1.25 : 0
    keep(lid)
    g.add(lid)
    g.userData.lid = lid
    return finalize(g)
  },
})

registerProp('safe', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    const col = tint(ctx, '#3f5548')
    const g = new THREE.Group()
    const steel = M(col)
    const dark = M(shade(col, 0.7))
    const brass = M(PAL.brass)
    for (const x of [-0.25, 0.25]) for (const z of [-0.22, 0.22]) g.add(bx(0.08, 0.06, 0.08, dark, x, 0, z))
    g.add(bx(0.64, 0.74, 0.56, steel, 0, 0.06))
    g.add(bx(0.66, 0.05, 0.58, dark, 0, 0.78))
    if (open) g.add(bx(0.5, 0.58, 0.02, M('#1a1a1e'), 0, 0.14, 0.27))
    const door = new THREE.Group()
    door.position.set(0.28, 0, 0.285)
    door.add(bx(0.54, 0.62, 0.05, steel, -0.27, 0.12))
    door.add(bx(0.46, 0.54, 0.02, dark, -0.27, 0.16, 0.03))
    const dial = cy(0.075, 0.075, 0.03, brass, 0, 0, 0, 16)
    dial.rotation.x = Math.PI / 2
    dial.position.set(-0.27, 0.5, 0.05)
    door.add(dial)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      door.add(rod([-0.27, 0.3, 0.05], [-0.27 + Math.cos(a) * 0.09, 0.3 + Math.sin(a) * 0.09, 0.07], 0.012, 0.012, brass, 5))
    }
    door.add(bx(0.18, 0.05, 0.01, brass, -0.27, 0.66, 0.035))
    for (const y of [0.2, 0.6]) door.add(cy(0.022, 0.022, 0.1, dark, 0, y, 0.0, 8))
    finalize(door)
    door.rotation.y = open ? 1.2 : 0
    keep(door)
    g.add(door)
    g.userData.door = door
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------
// pot, basket, bowl (shallow bowl of water on a stand; frozen -> white ice)
// ---------------------------------------------------------------------------

const POTS: [number, number][][] = [
  [[0, 0], [0.13, 0], [0.21, 0.1], [0.25, 0.28], [0.22, 0.46], [0.13, 0.56], [0.11, 0.6], [0.14, 0.64], [0.12, 0.66], [0.09, 0.62]],
  [[0, 0], [0.08, 0], [0.16, 0.12], [0.22, 0.35], [0.2, 0.55], [0.1, 0.7], [0.08, 0.78], [0.11, 0.82], [0.09, 0.83], [0.07, 0.79]],
  [[0, 0], [0.18, 0], [0.28, 0.12], [0.3, 0.24], [0.24, 0.34], [0.2, 0.36], [0.22, 0.39], [0.19, 0.39], [0.17, 0.35]],
]

registerProp('pot', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, '#c86a40')
    const v = variant(ctx, 3)
    const inner = cachedBuild(`pot|${col}|${v}`, () => {
      const g = new THREE.Group()
      const prof = POTS[v]
      g.add(lathe(`pot${v}`, prof, M(col), 18))
      const top = prof[Math.floor(prof.length * 0.45)]
      g.add(cy(top[0] + 0.006, top[0] + 0.006, 0.05, M(shade(col, 0.62)), 0, top[1] - 0.025, 0, 18))
      g.add(cy(top[0] * 0.92 + 0.004, top[0] * 0.92 + 0.004, 0.022, M(PAL.cream), 0, top[1] - 0.12, 0, 18))
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2, 0.9 + ctx.rand() * 0.25)
  },
})

registerProp('basket', {
  solid: false,
  build: (ctx) => {
    const f = str(ctx, 'fill', 'fruit')
    const fill = f === 'fish' || f === 'bread' || f === 'empty' ? f : 'fruit'
    const v = variant(ctx, 3)
    const inner = cachedBuild(`basket|${fill}|${v}`, () => {
      const r = seeded('basket' + v)
      const g = new THREE.Group()
      const wick = M('#c89a5a')
      const wick2 = M('#a87a42')
      g.add(cy(0.25, 0.19, 0.22, wick, 0, 0, 0, 14))
      g.add(cy(0.237, 0.215, 0.05, wick2, 0, 0.07, 0, 14))
      g.add(ring(0.25, 0.022, wick2, 0, 0.22, 0, 5, 20))
      const y = 0.22
      if (fill === 'empty') {
        g.add(cy(0.23, 0.23, 0.01, M('#6a4a2a'), 0, y - 0.03, 0, 14))
      } else if (fill === 'fruit') {
        const cols = ['#f08a30', '#d83a2a', '#9ac83a', '#f0c040']
        for (let i = 0; i < 8; i++) {
          const a = r() * Math.PI * 2
          const d = Math.sqrt(r()) * 0.16
          g.add(ball(0.065, 0.065, 0.065, M(pick(r, cols)), Math.cos(a) * d, y + 0.02 + (i > 5 ? 0.06 : 0), Math.sin(a) * d, 10))
        }
      } else if (fill === 'fish') {
        const fm = M('#9ab8c8')
        for (let i = 0; i < 3; i++) {
          const a = i * 1.2 + r()
          g.add(leaf([Math.cos(a) * 0.15, y + 0.03, Math.sin(a) * 0.15], [-Math.cos(a) * 0.15, y + 0.06, -Math.sin(a) * 0.15], 0.1, 0.06, fm))
        }
      } else {
        const bm = M('#d8a052')
        for (let i = 0; i < 3; i++) g.add(ball(0.14, 0.07, 0.08, bm, (i - 1) * 0.1, y + 0.04, (r() - 0.5) * 0.1, 10).rotateY(r()))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

registerProp('bowl', {
  solid: true,
  build: (ctx) => {
    const frozen = bool(ctx, 'frozen')
    return cachedBuild(`bowl|${frozen}`, () => {
      const g = new THREE.Group()
      const stone = M(PAL.stoneLight)
      const dark = M(PAL.stone)
      g.add(cy(0.17, 0.2, 0.06, dark, 0, 0, 0, 16))
      g.add(cy(0.05, 0.065, 0.66, stone, 0, 0.06, 0, 12))
      g.add(cy(0.13, 0.07, 0.06, dark, 0, 0.7, 0, 16))
      g.add(lathe('shallowbowl', [[0, 0], [0.12, 0], [0.24, 0.05], [0.29, 0.12], [0.27, 0.12], [0.2, 0.07], [0, 0.06]], M('#e6ddcc'), 22).translateY(0.75))
      if (frozen) {
        const ice = M('#d6ecfa', { emissive: '#9fd8ff', ei: 0.18 })
        g.add(ball(0.26, 0.04, 0.26, ice, 0, 0.86, 0, 16))
        const shard = F('#f4fbff', { emissive: '#bfe8ff', ei: 0.4 })
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2
          const s = cn(0.03, 0.09 + (i % 3) * 0.04, shard, Math.cos(a) * 0.15, 0.86, Math.sin(a) * 0.15, 5)
          s.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4)
          g.add(s)
        }
        g.add(ring(0.28, 0.02, M('#e4f2fc'), 0, 0.87, 0, 5, 24))
      } else {
        const water = cy(0.25, 0.25, 0.01, M('#4aa8d0', { emissive: '#1d6a90', ei: 0.35 }), 0, 0.84, 0, 22)
        fx(water)
        g.add(water)
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// cart, stall (market stall, footprint 2x1), tent
// ---------------------------------------------------------------------------

function spokedWheel(R: number, mat: THREE.Material, hub: THREE.Material): THREE.Group {
  const w = new THREE.Group()
  w.add(rot(torus(R, 0.04, mat, 0, 0, 0, 6, 20), 0, Math.PI / 2, 0))
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    w.add(rod([0, 0, 0], [0, Math.sin(a) * R, Math.cos(a) * R], 0.018, 0.018, mat, 5))
  }
  w.add(rot(cy(0.06, 0.06, 0.1, hub, 0, -0.05, 0, 10), 0, 0, Math.PI / 2))
  return w
}

registerProp('cart', {
  solid: true,
  build: (ctx) => {
    const load = bool(ctx, 'load', true)
    const col = tint(ctx, PAL.woodLight)
    return wrap(
      cachedBuild(`cart|${load}|${col}`, () => {
        const g = new THREE.Group()
        const wood = M(col)
        const dark = M(shade(col, 0.68))
        g.add(bx(0.72, 0.07, 1.0, wood, 0, 0.4, -0.05))
        for (const s of [-1, 1]) g.add(bx(0.05, 0.24, 1.0, dark, s * 0.36, 0.45, -0.05))
        g.add(bx(0.72, 0.24, 0.05, dark, 0, 0.45, -0.53))
        g.add(bx(0.72, 0.16, 0.05, dark, 0, 0.45, 0.43))
        for (const s of [-1, 1]) {
          const w = spokedWheel(0.32, dark, M(PAL.ironDark))
          w.position.set(s * 0.44, 0.32, -0.12)
          g.add(w)
          g.add(rod([s * 0.28, 0.44, 0.42], [s * 0.24, 0.5, 0.9], 0.03, 0.025, dark, 6))
        }
        g.add(rod([-0.46, 0.32, -0.12], [0.46, 0.32, -0.12], 0.025, 0.025, M(PAL.ironDark), 6))
        g.add(rod([0, 0.4, 0.38], [0, 0, 0.42], 0.03, 0.03, dark, 6))
        if (load) {
          const burlap = M('#cfae78')
          g.add(ball(0.2, 0.15, 0.25, burlap, -0.14, 0.6, -0.2, 12))
          g.add(ball(0.18, 0.14, 0.22, burlap, 0.14, 0.6, 0.1, 12))
          addCrate(g, 0.3, '#c08a52', 0.12, 0.47, -0.32, 0.2)
        }
        return g
      }),
      0,
    )
  },
})

registerProp('stall', {
  solid: true,
  footprint: [[1, 0]],
  build: (ctx) => {
    const col = tint(ctx, PAL.red)
    const goods = str(ctx, 'goods', 'fruit')
    const v = variant(ctx, 3)
    return cachedBuild(`stall|${col}|${goods}|${v}`, () => {
      const r = seeded('stall' + v)
      const g = new THREE.Group()
      const wood = M(PAL.wood)
      const dark = M(PAL.woodDark)
      const cx = 0.5
      g.add(bx(1.8, 0.72, 0.62, wood, cx, 0, 0.05))
      g.add(bx(1.86, 0.06, 0.68, M(PAL.woodLight), cx, 0.72, 0.05))
      g.add(plane(1.8, 0.46, texMat(`valance|${col}`, stripeTex(col, true), { side: THREE.DoubleSide, alphaTest: 0.5 }), cx, 0.5, 0.37))
      for (const x of [cx - 0.88, cx + 0.88]) {
        g.add(bx(0.07, 1.95, 0.07, dark, x, 0, 0.36))
        g.add(bx(0.07, 2.2, 0.07, dark, x, 0, -0.26))
      }
      const back: [number, number] = [2.24, -0.34]
      const front: [number, number] = [1.92, 0.52]
      const len = Math.hypot(back[0] - front[0], back[1] - front[1])
      const roof = plane(2.0, len, texMat(`stripes|${col}`, stripeTex(col, false), { side: THREE.DoubleSide }), cx, (back[0] + front[0]) / 2, (back[1] + front[1]) / 2)
      roof.rotation.x = -Math.atan2(front[1] - back[1], back[0] - front[0])
      g.add(roof)
      g.add(plane(2.0, 0.18, texMat(`valance|${col}`, stripeTex(col, true), { side: THREE.DoubleSide, alphaTest: 0.5 }), cx, front[0] - 0.09, front[1]))
      const y = 0.78
      if (goods === 'cloth') {
        const cols = ['#8040c0', '#2fa69a', '#f0c050', '#d04a3a', '#3f5cb0']
        for (let i = 0; i < 5; i++) {
          const roll = cy(0.07, 0.07, 0.5, M(cols[i]), 0, 0, 0, 12)
          roll.rotation.x = Math.PI / 2
          roll.position.set(cx - 0.7 + i * 0.34, y + 0.07, 0.05)
          g.add(roll)
        }
      } else if (goods === 'fish') {
        const fm = M('#9ab8c8')
        for (let i = 0; i < 7; i++) g.add(leaf([cx - 0.75 + i * 0.24, y + 0.03, -0.1], [cx - 0.68 + i * 0.24, y + 0.04, 0.22], 0.09, 0.05, fm))
        g.add(bx(1.5, 0.04, 0.5, M('#dff4ff'), cx, y - 0.02, 0.05))
      } else {
        const cols = ['#f08a30', '#d83a2a', '#9ac83a', '#f0c040', '#8a44c8']
        for (let p = 0; p < 4; p++) {
          const px = cx - 0.62 + p * 0.42
          const c = M(cols[(p + v) % cols.length])
          for (let i = 0; i < 6; i++) {
            const lvl = i < 4 ? 0 : 1
            const ox = lvl ? (i - 4.5) * 0.11 : ((i % 2) - 0.5) * 0.11
            const oz = lvl ? 0 : (Math.floor(i / 2) - 0.5) * 0.11
            g.add(ball(0.06, 0.06, 0.06, c, px + ox, y + 0.06 + lvl * 0.09, 0.05 + oz, 10))
          }
        }
        g.add(cy(0.07, 0.07, 0.16, M('#d0784a'), cx + 0.82, y, -0.15 + r() * 0.05, 12))
      }
      return g
    })
  },
})

registerProp('tent', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, '#d8c08c')
    return cachedBuild(`tent|${col}`, () => {
      const g = new THREE.Group()
      const canvas = M(col, { side: THREE.DoubleSide })
      const dark = M(shade(col, 0.7), { side: THREE.DoubleSide })
      const H = 1.3
      const W = 0.72
      const L = 1.5
      const slope = Math.hypot(W, H)
      for (const s of [-1, 1]) {
        const p = plane(L, slope, canvas, s * (W / 2), H / 2, 0)
        p.rotation.set(0, (s * Math.PI) / 2, 0)
        p.rotateX(-Math.atan2(W, H))
        g.add(p)
        // rolled-up door flaps tied back along the front edges
        g.add(rod([s * W * 0.92, 0.08, L / 2 + 0.01], [s * 0.08, H - 0.1, L / 2 + 0.01], 0.045, 0.03, dark, 7))
      }
      const tri = cachedGeo('tri', () => {
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 0, 1, 0], 3))
        geo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3))
        return geo
      })
      const back = new THREE.Mesh(tri, canvas)
      back.scale.set(W, H, 1)
      back.position.set(0, 0, -L / 2)
      back.castShadow = true
      g.add(back)
      const inside = new THREE.Mesh(tri, M('#2a1e18', { side: THREE.DoubleSide }))
      inside.scale.set(W * 0.9, H * 0.9, 1)
      inside.position.set(0, 0.01, -L / 2 + 0.04)
      g.add(inside)
      g.add(bx(W * 1.7, 0.01, L * 0.95, M(shade(col, 0.5)), 0, 0, 0))
      const pole = M(PAL.woodDark)
      g.add(rod([0, H + 0.04, -L / 2 - 0.02], [0, H + 0.04, L / 2 + 0.02], 0.025, 0.025, pole, 6))
      for (const z of [-L / 2 - 0.02, L / 2 + 0.02]) g.add(cy(0.025, 0.025, H + 0.12, pole, 0, 0, z, 6))
      const rope = M(PAL.rope)
      for (const z of [-1, 1]) g.add(rod([0, H + 0.08, z * (L / 2 + 0.02)], [0, 0, z * (L / 2 + 0.38)], 0.008, 0.008, rope, 4))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// desk (with papers), chalkboard, painting, clock, rug
// ---------------------------------------------------------------------------

registerProp('desk', {
  solid: true,
  build: (ctx) => {
    const col = tint(ctx, PAL.wood)
    const v = variant(ctx, 3)
    return cachedBuild(`desk|${col}|${v}`, () => {
      const r = seeded('desk' + v)
      const g = new THREE.Group()
      const wood = M(col)
      const dark = M(shade(col, 0.72))
      const H = 0.76
      g.add(bx(1.06, 0.05, 0.6, M(shade(col, 1.15)), 0, H - 0.05))
      g.add(bx(0.38, H - 0.05, 0.56, wood, -0.32, 0))
      for (let i = 0; i < 3; i++) {
        g.add(bx(0.32, 0.18, 0.02, M(shade(col, 1.2)), -0.32, 0.06 + i * 0.21, 0.285))
        g.add(ball(0.022, 0.022, 0.015, M(PAL.brass), -0.32, 0.15 + i * 0.21, 0.3, 6))
      }
      for (const z of [-0.25, 0.25]) g.add(bx(0.06, H - 0.05, 0.06, dark, 0.47, 0, z))
      g.add(bx(0.6, 0.35, 0.03, dark, 0.15, 0.36, -0.27))
      const paper = [M('#f7f0dc'), M('#efe4c8'), M('#fbf8ee')]
      for (let i = 0; i < 5; i++) {
        const p = bx(0.2, 0.004, 0.28, paper[i % 3], 0.1 + (r() - 0.5) * 0.45, H + i * 0.004, (r() - 0.5) * 0.25)
        p.rotation.y = (r() - 0.5) * 1.2
        g.add(p)
      }
      g.add(cy(0.035, 0.04, 0.06, M('#1c1a2a'), 0.38, H, -0.18, 10))
      g.add(leaf([0.38, H + 0.05, -0.18], [0.3, H + 0.26, -0.1], 0.05, 0.012, M('#ffffff')))
      g.add(bx(0.2, 0.05, 0.26, M('#7a2a3a'), -0.3, H, -0.08))
      g.add(cy(0.03, 0.03, 0.09, M(PAL.cream), -0.42, H, 0.2, 8))
      return g
    })
  },
})

function chalkTex(): THREE.CanvasTexture {
  return canvasTex('chalkboard', 512, 360, (g, w, h, r) => {
    const grad = g.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#24352e')
    grad.addColorStop(1, '#1b2924')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    // old erased smudges
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(255,255,255,${0.025 + r() * 0.04})`
      g.beginPath()
      g.ellipse(r() * w, r() * h, 30 + r() * 80, 10 + r() * 30, r() * 3, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = 'rgba(245,245,235,0.9)'
    g.fillStyle = 'rgba(245,245,235,0.9)'
    g.lineWidth = 3
    g.lineCap = 'round'
    // a pentagram glyph in a circle
    const cx = 110
    const cyy = 120
    g.beginPath()
    g.arc(cx, cyy, 70, 0, Math.PI * 2)
    g.stroke()
    g.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
      const x = cx + Math.cos(a) * 64
      const y = cyy + Math.sin(a) * 64
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
    // ringed moon Sai
    g.beginPath()
    g.arc(410, 90, 34, 0, Math.PI * 2)
    g.stroke()
    g.beginPath()
    g.ellipse(410, 90, 62, 16, -0.3, 0, Math.PI * 2)
    g.stroke()
    // text lines
    g.font = 'italic 26px Georgia, serif'
    const lines = ['Spira = 5 · ✧', 'Sai: 21h ⟶ 0', 'El ≠ Infera', 'x² + 3y = ?']
    lines.forEach((t, i) => g.fillText(t, 210 + (i % 2) * 14, 60 + i * 44))
    // arrows and underline
    g.beginPath()
    g.moveTo(190, 120)
    g.lineTo(240, 210)
    g.lineTo(228, 196)
    g.moveTo(240, 210)
    g.lineTo(224, 212)
    g.stroke()
    g.beginPath()
    g.moveTo(40, 250)
    for (let x = 40; x < 480; x += 20) g.lineTo(x, 250 + Math.sin(x * 0.08) * 6)
    g.stroke()
    g.font = '22px Georgia, serif'
    g.fillText('1 · 2 · 3 · 5 · 8 · 13', 60, 300)
    g.fillText('Ahil', 400, 320)
  })
}

registerProp('chalkboard', {
  solid: true,
  build: (ctx) => {
    const onWall = bool(ctx, 'wall')
    return cachedBuild(`chalkboard|${onWall}`, () => {
      const g = new THREE.Group()
      const wood = M(PAL.wood)
      const dark = M(PAL.woodDark)
      const board = new THREE.Group()
      board.add(bx(1.26, 0.92, 0.05, wood, 0, -0.46, 0))
      board.add(plane(1.14, 0.8, texMat('chalkboard', chalkTex()), 0, 0, 0.027))
      board.add(bx(1.1, 0.03, 0.08, dark, 0, -0.48, 0.05))
      board.add(bx(0.08, 0.02, 0.02, M('#ffffff'), 0.2, -0.45, 0.06))
      board.add(bx(0.06, 0.02, 0.02, M('#ffe08a'), 0.32, -0.45, 0.06))
      if (onWall) {
        board.position.set(0, 1.45, WALL_Z + 0.03)
      } else {
        board.position.set(0, 1.12, 0)
        board.rotation.x = -0.12
        g.add(rod([-0.5, 0, 0.12], [-0.46, 1.72, -0.03], 0.03, 0.025, dark, 6))
        g.add(rod([0.5, 0, 0.12], [0.46, 1.72, -0.03], 0.03, 0.025, dark, 6))
        g.add(rod([0, 0, -0.45], [0, 1.6, -0.06], 0.03, 0.025, dark, 6))
      }
      g.add(board)
      return g
    })
  },
})

type Subject = 'sai' | 'portrait' | 'sea'

function paintingTex(subject: Subject): THREE.CanvasTexture {
  return canvasTex(`painting|${subject}`, 256, 192, (g, w, h, r) => {
    if (subject === 'portrait') {
      const bg = g.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#3a2a4a')
      bg.addColorStop(1, '#1a1222')
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#6a3a8a'
      g.beginPath()
      g.ellipse(w / 2, h + 20, 80, 70, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#f0d0b0'
      g.beginPath()
      g.ellipse(w / 2, h * 0.5, 30, 38, 0, 0, Math.PI * 2)
      g.fill()
      // fox ears (Varietas)
      g.fillStyle = '#d87a3a'
      for (const s of [-1, 1]) {
        g.beginPath()
        g.moveTo(w / 2 + s * 14, h * 0.32)
        g.lineTo(w / 2 + s * 40, h * 0.08)
        g.lineTo(w / 2 + s * 36, h * 0.38)
        g.closePath()
        g.fill()
      }
      g.fillStyle = '#c8602a'
      g.beginPath()
      g.ellipse(w / 2, h * 0.36, 34, 16, 0, Math.PI, Math.PI * 2)
      g.fill()
      g.fillStyle = '#2a1a1a'
      g.fillRect(w / 2 - 15, h * 0.5, 8, 4)
      g.fillRect(w / 2 + 7, h * 0.5, 8, 4)
      return
    }
    const sky = g.createLinearGradient(0, 0, 0, h * 0.65)
    sky.addColorStop(0, '#1d2a5a')
    sky.addColorStop(1, subject === 'sai' ? '#e88a4a' : '#7ab0d8')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    if (subject === 'sai') {
      g.fillStyle = '#f0a040'
      g.beginPath()
      g.arc(w * 0.32, h * 0.3, 34, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = 'rgba(255,230,190,0.85)'
      g.lineWidth = 4
      g.beginPath()
      g.ellipse(w * 0.32, h * 0.3, 62, 13, -0.25, 0, Math.PI * 2)
      g.stroke()
    }
    const sea = g.createLinearGradient(0, h * 0.62, 0, h)
    sea.addColorStop(0, '#2a6a8a')
    sea.addColorStop(1, '#14304a')
    g.fillStyle = sea
    g.fillRect(0, h * 0.62, w, h)
    g.fillStyle = 'rgba(255,200,120,0.5)'
    for (let i = 0; i < 12; i++) g.fillRect(w * 0.32 - 20 + r() * 40, h * 0.66 + i * 5, 10 + r() * 20, 2)
    // white city on the cliff
    g.fillStyle = '#2a2030'
    g.beginPath()
    g.moveTo(w * 0.6, h * 0.62)
    g.lineTo(w * 0.7, h * 0.42)
    g.lineTo(w, h * 0.38)
    g.lineTo(w, h * 0.62)
    g.closePath()
    g.fill()
    g.fillStyle = '#f3ecdc'
    for (let i = 0; i < 7; i++) g.fillRect(w * 0.7 + i * 10, h * 0.42 - 6 - r() * 14, 8, 20)
    // painterly strokes
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(255,255,255,${r() * 0.06})`
      g.fillRect(r() * w, r() * h, 6 + r() * 14, 2)
    }
  })
}

registerProp('painting', {
  solid: false,
  build: (ctx) => {
    const covered = bool(ctx, 'covered')
    const s = str(ctx, 'subject', 'sai')
    const subject: Subject = s === 'portrait' || s === 'sea' ? s : 'sai'
    const w = num(ctx, 'w', 0.9)
    return cachedBuild(`painting|${covered}|${subject}|${w}`, () => {
      const g = new THREE.Group()
      const h = w * 0.72
      const cy0 = 1.5
      const z = WALL_Z
      const gold = M(PAL.gold)
      const goldD = M(shade(PAL.gold, 0.7))
      const t = 0.07
      g.add(bx(w + 2 * t, t, 0.05, gold, 0, cy0 + h / 2, z + 0.025))
      g.add(bx(w + 2 * t, t, 0.05, gold, 0, cy0 - h / 2 - t, z + 0.025))
      g.add(bx(t, h, 0.05, gold, -w / 2 - t / 2, cy0 - h / 2, z + 0.025))
      g.add(bx(t, h, 0.05, gold, w / 2 + t / 2, cy0 - h / 2, z + 0.025))
      g.add(bx(w, h, 0.02, goldD, 0, cy0 - h / 2, z + 0.01))
      g.add(plane(w, h, texMat(`painting|${subject}`, paintingTex(subject)), 0, cy0, z + 0.022))
      if (covered) {
        const cloth = M('#dcd6cc')
        const fold = M('#c4bdb0')
        g.add(bx(w + 0.22, h + 0.16, 0.05, cloth, 0, cy0 - h / 2 - 0.04, z + 0.07))
        g.add(rot(bx(w + 0.26, 0.4, 0.04, cloth, 0, cy0 - h / 2 - 0.42, z + 0.1), 0.12, 0, 0))
        for (const x of [-w * 0.3, 0, w * 0.28]) g.add(rot(bx(0.06, h + 0.5, 0.05, fold, x, cy0 - h / 2 - 0.42, z + 0.1), 0.06, 0, (x - 0.1) * 0.1))
        g.add(ball(w * 0.55, 0.06, 0.06, cloth, 0, cy0 + h / 2 + 0.08, z + 0.08, 10))
      }
      return g
    })
  },
})

function dialTex(hours: number): THREE.CanvasTexture {
  return canvasTex(`dial|${hours}`, 256, 256, (g, w) => {
    const c = w / 2
    g.fillStyle = '#f3ead2'
    g.beginPath()
    g.arc(c, c, c, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#3a2a1a'
    g.lineWidth = 4
    g.beginPath()
    g.arc(c, c, c - 6, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = '#2a1e14'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `bold ${hours > 12 ? 20 : 28}px Georgia, serif`
    for (let i = 1; i <= hours; i++) {
      const a = -Math.PI / 2 + (i / hours) * Math.PI * 2
      g.fillText(String(i), c + Math.cos(a) * (c - 34), c + Math.sin(a) * (c - 34))
      g.fillRect(c + Math.cos(a) * (c - 14) - 2, c + Math.sin(a) * (c - 14) - 2, 4, 4)
    }
    g.strokeStyle = 'rgba(58,42,26,0.4)'
    g.lineWidth = 2
    g.beginPath()
    g.arc(c, c, c * 0.45, 0, Math.PI * 2)
    g.stroke()
  })
}

registerProp('clock', {
  solid: false,
  build: (ctx) => {
    const hours = num(ctx, 'hours', 12) > 12 ? 21 : 12
    const standing = bool(ctx, 'standing')
    const g = new THREE.Group()
    const wood = M(tint(ctx, PAL.woodDark))
    const brass = M(PAL.brass)
    const dial = texMat(`dial|${hours}`, dialTex(hours))
    const circle = cachedGeo('circle', () => new THREE.CircleGeometry(0.5, 40))
    let centre: THREE.Vector3
    let R: number
    if (standing) {
      const zc = WALL_Z + 0.17
      g.add(bx(0.56, 0.12, 0.34, wood, 0, 0, zc))
      g.add(bx(0.46, 1.86, 0.28, wood, 0, 0.12, zc))
      g.add(bx(0.56, 0.1, 0.34, wood, 0, 1.98, zc))
      g.add(rot(cn(0.3, 0.16, wood, 0, 2.08, zc, 4), 0, Math.PI / 4, 0))
      g.add(plane(0.26, 0.62, M('#2a2a34'), 0, 0.82, zc + 0.142))
      R = 0.17
      centre = new THREE.Vector3(0, 1.66, zc + 0.145)
      g.add(torus(R + 0.02, 0.02, brass, centre.x, centre.y, centre.z, 6, 24))
      const pend = new THREE.Group()
      pend.position.set(0, 1.12, zc + 0.12)
      pend.add(rod([0, 0, 0], [0, -0.45, 0], 0.01, 0.01, brass, 4))
      const disc = cy(0.06, 0.06, 0.015, brass, 0, 0, 0, 16)
      disc.rotation.x = Math.PI / 2
      disc.position.set(0, -0.47, 0)
      pend.add(disc)
      finalize(pend)
      keep(pend)
      g.add(pend)
      g.userData.pendulum = pend
    } else {
      R = 0.23
      centre = new THREE.Vector3(0, 1.75, WALL_Z + 0.075)
      const caseM = cy(0.27, 0.27, 0.07, wood, 0, 0, 0, 28)
      caseM.rotation.x = Math.PI / 2
      caseM.position.set(0, 1.75, WALL_Z + 0.035)
      g.add(caseM)
      g.add(torus(0.26, 0.02, brass, 0, 1.75, WALL_Z + 0.072, 6, 28))
    }
    const face = new THREE.Mesh(circle, dial)
    face.scale.setScalar(R * 2)
    face.position.copy(centre)
    g.add(face)
    const hands: THREE.Object3D[] = []
    for (const [len, wdt] of [[R * 0.55, 0.018], [R * 0.82, 0.011]] as const) {
      const hand = new THREE.Group()
      hand.position.set(centre.x, centre.y, centre.z + 0.008 + hands.length * 0.004)
      hand.add(bx(wdt, len, 0.006, M('#1a1410'), 0, -0.02, 0))
      finalize(hand)
      keep(hand)
      g.add(hand)
      hands.push(hand)
    }
    g.add(ball(0.014, 0.014, 0.01, brass, centre.x, centre.y, centre.z + 0.016, 6))
    g.userData.hands = hands
    g.userData.hours = hours
    return finalize(g)
  },
  animate: (obj, t) => {
    const hands = obj.userData.hands as THREE.Object3D[] | undefined
    if (hands) {
      const hours = Number(obj.userData.hours) || 12
      hands[1].rotation.z = -(t / 60) * Math.PI * 2
      hands[0].rotation.z = -(t / (60 * hours)) * Math.PI * 2 - 1.1
    }
    const p = obj.userData.pendulum as THREE.Object3D | undefined
    if (p) p.rotation.z = Math.sin(t * Math.PI) * 0.18
  },
})

function rugTex(color: string, round: boolean): THREE.CanvasTexture {
  return canvasTex(`rug|${color}|${round}`, 256, round ? 256 : 168, (g, w, h) => {
    const light = '#f0d8a0'
    const dark = shade(color, 0.6)
    if (round) {
      g.clearRect(0, 0, w, h)
      g.fillStyle = color
      g.beginPath()
      g.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = light
      g.lineWidth = 6
      g.beginPath()
      g.arc(w / 2, h / 2, w / 2 - 14, 0, Math.PI * 2)
      g.stroke()
      g.lineWidth = 3
      g.beginPath()
      g.arc(w / 2, h / 2, w / 2 - 30, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = dark
      g.beginPath()
      g.arc(w / 2, h / 2, 46, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = light
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        g.beginPath()
        g.arc(w / 2 + Math.cos(a) * 72, h / 2 + Math.sin(a) * 72, 7, 0, Math.PI * 2)
        g.fill()
      }
      return
    }
    g.fillStyle = color
    g.fillRect(0, 0, w, h)
    g.fillStyle = dark
    g.fillRect(10, 10, w - 20, h - 20)
    g.fillStyle = color
    g.fillRect(20, 20, w - 40, h - 40)
    g.strokeStyle = light
    g.lineWidth = 3
    g.strokeRect(14, 14, w - 28, h - 28)
    // zigzag border band
    g.beginPath()
    for (let x = 24; x <= w - 24; x += 12) {
      g.lineTo(x, (x / 12) % 2 ? 26 : 32)
    }
    g.stroke()
    g.beginPath()
    for (let x = 24; x <= w - 24; x += 12) {
      g.lineTo(x, (x / 12) % 2 ? h - 26 : h - 32)
    }
    g.stroke()
    // medallion
    g.fillStyle = light
    g.beginPath()
    g.moveTo(w / 2, h / 2 - 40)
    g.lineTo(w / 2 + 60, h / 2)
    g.lineTo(w / 2, h / 2 + 40)
    g.lineTo(w / 2 - 60, h / 2)
    g.closePath()
    g.fill()
    g.fillStyle = dark
    g.beginPath()
    g.moveTo(w / 2, h / 2 - 22)
    g.lineTo(w / 2 + 32, h / 2)
    g.lineTo(w / 2, h / 2 + 22)
    g.lineTo(w / 2 - 32, h / 2)
    g.closePath()
    g.fill()
    // fringe
    g.fillStyle = light
    for (let y = 4; y < h; y += 6) {
      g.fillRect(0, y, 6, 2)
      g.fillRect(w - 6, y, 6, 2)
    }
  })
}

registerProp('rug', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const color = tint(ctx, '#9a2a3a')
    const round = bool(ctx, 'round')
    const w = num(ctx, 'w', round ? 1.3 : 1.5)
    const d = num(ctx, 'd', round ? w : 0.98)
    const m = texMat(`rug|${color}|${round}`, rugTex(color, round), { transparent: round, alphaTest: round ? 0.5 : undefined })
    const geo = round ? cachedGeo('circle', () => new THREE.CircleGeometry(0.5, 40)) : cachedGeo('plane', () => new THREE.PlaneGeometry(1, 1))
    const rug = new THREE.Mesh(geo, m)
    rug.rotation.x = -Math.PI / 2
    rug.rotation.z = 0
    rug.scale.set(w, d, 1)
    rug.position.y = 0.008
    rug.receiveShadow = true
    rug.castShadow = false
    const g = new THREE.Group()
    g.add(rug)
    return g
  },
})

// ---------------------------------------------------------------------------
// cauldron (bubbling; fire underneath), cage, workbench, ladder
// ---------------------------------------------------------------------------

registerProp('cauldron', {
  solid: true,
  light: (ctx) => (bool(ctx, 'fire', true) ? { color: '#ff8a3a', intensity: 2.2, distance: 5, y: 0.3, flicker: true } : { color: tint(ctx, '#7be08a'), intensity: 1.2, distance: 3.5, y: 0.8 }),
  build: (ctx) => {
    const fire = bool(ctx, 'fire', true)
    const liquid = tint(ctx, '#7be08a')
    const g = new THREE.Group()
    const iron = M('#34363c')
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5
      g.add(rod([Math.cos(a) * 0.25, 0.28, Math.sin(a) * 0.25], [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], 0.035, 0.03, iron, 6))
    }
    g.add(lathe('cauldron', [[0, 0.2], [0.18, 0.2], [0.33, 0.3], [0.38, 0.46], [0.35, 0.62], [0.31, 0.68], [0.34, 0.7], [0.32, 0.72], [0.29, 0.69]], iron, 22))
    g.add(ring(0.33, 0.025, M('#4a4c54'), 0, 0.71, 0, 6, 24))
    for (const s of [-1, 1]) g.add(rot(torus(0.06, 0.012, iron, s * 0.37, 0.62, 0, 4, 10), 0, Math.PI / 2, 0))
    g.add(cy(0.3, 0.3, 0.01, glowMat(liquid, 1.6), 0, 0.66, 0, 20))
    const bubbles = new THREE.Group()
    const bm = glowMat(liquid, 2.4)
    const r = seeded('bubbles')
    for (let i = 0; i < 5; i++) {
      const a = r() * Math.PI * 2
      const d = r() * 0.2
      const s = 0.03 + r() * 0.025
      const b = new THREE.Group()
      b.position.set(Math.cos(a) * d, 0.68, Math.sin(a) * d)
      b.add(ball(s, s, s, bm, 0, 0, 0, 6))
      b.userData.phase = r() * 6
      bubbles.add(b)
    }
    keep(bubbles)
    fx(bubbles)
    g.add(bubbles)
    g.userData.bubbles = bubbles
    if (fire) {
      const bark = M(PAL.bark)
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2
        g.add(rod([Math.cos(a) * 0.22, 0.03, Math.sin(a) * 0.22], [-Math.cos(a) * 0.06, 0.08, -Math.sin(a) * 0.06], 0.04, 0.035, bark, 6))
      }
      g.add(ball(0.12, 0.04, 0.12, glowMat(PAL.ember, 2.6), 0, 0.04, 0, 8))
      const flames: THREE.Object3D[] = []
      for (const [x, z, s] of [[0, 0, 0.75], [0.08, 0.05, 0.55], [-0.07, -0.05, 0.6]] as const) {
        const f = flame(s, ctx.rand() * 10)
        f.position.set(x, 0.05, z)
        g.add(f)
        flames.push(f)
      }
      g.userData.flames = flames
    }
    return finalize(g)
  },
  animate: (obj, t) => {
    flicker(obj, t)
    const b = obj.userData.bubbles as THREE.Object3D | undefined
    if (!b) return
    for (const c of b.children) {
      const p = Number(c.userData.phase) || 0
      const k = (t * 0.8 + p) % 1
      c.position.y = 0.67 + k * 0.05
      c.scale.setScalar(0.4 + Math.sin(k * Math.PI) * 0.8)
    }
  },
})

registerProp('cage', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    return cachedBuild(`cage|${open}`, () => {
      const g = new THREE.Group()
      const iron = M('#3d3634')
      const R = 0.45
      g.add(cy(0.5, 0.52, 0.08, iron, 0, 0, 0, 20))
      g.add(cy(0.42, 0.42, 0.01, M('#c8a85a'), 0, 0.08, 0, 16))
      g.add(ring(R, 0.025, iron, 0, 1.75, 0, 5, 24))
      g.add(ring(R, 0.018, iron, 0, 0.9, 0, 5, 24))
      const n = 14
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        if (open && (i === 3 || i === 4)) continue
        g.add(cy(0.016, 0.016, 1.68, iron, Math.cos(a) * R, 0.08, Math.sin(a) * R, 6))
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        g.add(rod([Math.cos(a) * R, 1.75, Math.sin(a) * R], [Math.cos(a) * R * 0.55, 1.98, Math.sin(a) * R * 0.55], 0.018, 0.018, iron, 5))
        g.add(rod([Math.cos(a) * R * 0.55, 1.98, Math.sin(a) * R * 0.55], [0, 2.05, 0], 0.018, 0.018, iron, 5))
      }
      g.add(torus(0.07, 0.016, iron, 0, 2.12, 0, 5, 14))
      if (open) {
        const a0 = (3.5 / n) * Math.PI * 2
        const door = new THREE.Group()
        door.position.set(Math.cos(a0 - 0.22) * R, 0.08, Math.sin(a0 - 0.22) * R)
        door.rotation.y = -a0 - 1.2
        for (let k = 0; k < 3; k++) door.add(cy(0.016, 0.016, 1.6, iron, k * 0.16, 0, 0, 6))
        door.add(bx(0.36, 0.035, 0.03, iron, 0.16, 0.3))
        door.add(bx(0.36, 0.035, 0.03, iron, 0.16, 1.3))
        g.add(door)
      }
      return g
    })
  },
})

registerProp('workbench', {
  solid: true,
  build: (ctx) => {
    const v = variant(ctx, 2)
    return cachedBuild(`workbench|${v}`, () => {
      const g = new THREE.Group()
      const wood = M(PAL.woodLight)
      const dark = M(PAL.woodDark)
      const iron = M(PAL.iron)
      const steel = M('#c8ccd4')
      const zc = -0.12
      for (const x of [-0.46, 0.46]) for (const z of [zc - 0.24, zc + 0.24]) g.add(bx(0.08, 0.8, 0.08, dark, x, 0, z))
      g.add(bx(1.06, 0.08, 0.62, wood, 0, 0.8, zc))
      g.add(bx(0.96, 0.04, 0.52, dark, 0, 0.18, zc))
      g.add(bx(0.22, 0.14, 0.2, M('#8a5a3a'), -0.25, 0.22, zc))
      g.add(cy(0.09, 0.08, 0.18, M('#5a6a7a'), 0.25, 0.22, zc, 12))
      // vice on the front-right corner
      g.add(bx(0.1, 0.13, 0.12, iron, 0.4, 0.88, zc + 0.26))
      g.add(bx(0.1, 0.13, 0.05, iron, 0.4, 0.88, zc + 0.38))
      g.add(rod([0.4, 0.92, zc + 0.3], [0.4, 0.92, zc + 0.5], 0.015, 0.015, iron, 6))
      g.add(rod([0.33, 0.92, zc + 0.5], [0.47, 0.92, zc + 0.5], 0.01, 0.01, iron, 5))
      // tools on top
      g.add(rod([-0.35, 0.89, zc + 0.12], [-0.12, 0.89, zc + 0.2], 0.015, 0.015, M(PAL.wood), 6))
      g.add(rot(bx(0.05, 0.05, 0.11, iron, -0.1, 0.865, zc + 0.2), 0, 0.35, 0))
      g.add(rot(bx(0.34, 0.006, 0.09, steel, 0.05, 0.885, zc - 0.12), 0, -0.2, 0))
      g.add(rot(bx(0.1, 0.03, 0.06, M('#c0392b'), -0.15, 0.885, zc - 0.1), 0, -0.2, 0))
      g.add(rot(bx(0.18, 0.06, 0.07, M(PAL.woodPale), 0.18, 0.88, zc + 0.12), 0, 0.5, 0))
      // pegboard with hanging tools
      if (v === 0) {
        g.add(bx(1.06, 0.72, 0.03, dark, 0, 0.88, zc - 0.33))
        g.add(rot(bx(0.03, 0.26, 0.015, steel, -0.3, 1.2, zc - 0.31), 0, 0, 0.2))
        g.add(rot(bx(0.24, 0.06, 0.015, steel, 0.05, 1.35, zc - 0.31), 0, 0, -0.3))
        g.add(torus(0.07, 0.012, M(PAL.rope), 0.32, 1.25, zc - 0.31, 4, 14))
      }
      return g
    })
  },
})

registerProp('ladder', {
  solid: false,
  build: () =>
    cachedBuild('ladder', () => {
      const g = new THREE.Group()
      const wood = M(PAL.woodLight)
      const dark = M(PAL.wood)
      const b: [number, number] = [0.0, WALL_Z + 0.58]
      const t: [number, number] = [2.5, WALL_Z + 0.06]
      for (const x of [-0.2, 0.2]) g.add(rod([x, b[0], b[1]], [x, t[0], t[1]], 0.035, 0.035, dark, 6))
      for (let i = 1; i <= 7; i++) {
        const k = i / 8
        const y = b[0] + (t[0] - b[0]) * k
        const z = b[1] + (t[1] - b[1]) * k
        g.add(rod([-0.2, y, z], [0.2, y, z], 0.022, 0.022, wood, 6))
      }
      return g
    }),
})
