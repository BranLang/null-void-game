/**
 * Custom props of chapter 16 (also used by 17 and 18): the inside of the
 * Metaru (hull ribs overgrown with glowing plants, pigeons under the vault,
 * refugee bedding, Sayuri's tarp), Felix's forbidden electric box, the tin cup
 * Kiri turned upside down, and the original Book of El with its violet veins.
 */
import * as THREE from 'three'
import { registerProp } from '../../../engine/props/registry'
import {
  M,
  bool,
  num,
  tint,
  seeded,
  variant,
  shade,
  glowMat,
  uniqueGlow,
  bx,
  cy,
  cn,
  ball,
  rod,
  chain,
  leaf,
  torus,
  plane,
  rot,
  keep,
  finalize,
  cachedBuild,
  wrap,
  type V3,
} from '../../../engine/props/kit'

// --------------------------------------------------------------------------- hull rib
/** A structural rib of the hull rising along the wall like a cathedral arch, overgrown with plants that carry their own light. */
registerProp('ch16_hull_rib', {
  solid: false,
  light: (ctx) => (bool(ctx, 'glow', true) ? { color: '#7dffc0', intensity: 0.95, distance: 4.4, y: 2.1 } : null),
  build: (ctx) => {
    const h = num(ctx, 'h', 4)
    const glow = bool(ctx, 'glow', true)
    const v = variant(ctx, 3)
    return cachedBuild(`c16rib|${h}|${glow}|${v}`, () => {
      const r = seeded('c16rib' + v)
      const g = new THREE.Group()
      const iron = M('#2c3239')
      const bolt = M('#4a525c')
      const n = Math.max(4, Math.round(h / 0.5))
      const dphi = 0.62 / n
      const pts: V3[] = []
      let y = 0
      let z = 0.16
      pts.push([0, 0, z])
      for (let i = 0; i < n; i++) {
        const phi = i * dphi
        y += Math.cos(phi) * 0.5
        z -= Math.sin(phi) * 0.5
        pts.push([0, y, z])
      }
      g.add(chain(pts, 0.11, 0.08, iron, 8))
      g.add(bx(0.32, 0.12, 0.32, iron, 0, 0, 0.16))
      for (let i = 1; i < pts.length; i += 2) g.add(ball(0.03, 0.03, 0.03, bolt, 0.09, pts[i][1], pts[i][2] + 0.06, 6))
      if (glow) {
        const leafA = M('#2f8a5a', { emissive: '#5dffa8', ei: 1.5 })
        const leafB = M('#3a9a70', { emissive: '#8affd0', ei: 1.2 })
        const moss = M('#2a6a48', { emissive: '#46d890', ei: 0.9 })
        // dense irregular stripes along the rib
        for (let i = 1; i < pts.length - 1; i++) {
          if (r() < 0.25) continue
          const p = pts[i]
          g.add(ball(0.13 + r() * 0.08, 0.09, 0.1, moss, (r() - 0.5) * 0.12, p[1], p[2] + 0.07, 8))
          for (let k = 0; k < 3; k++) {
            const a = r() * Math.PI * 2
            const len = 0.12 + r() * 0.14
            g.add(leaf([0, p[1], p[2] + 0.08], [Math.cos(a) * len, p[1] + Math.sin(a) * len * 0.6, p[2] + 0.12 + r() * 0.05], 0.06, 0.02, k % 2 ? leafA : leafB))
          }
        }
        // hanging fronds, like seaweed
        for (let f = 0; f < 3; f++) {
          const top = pts[Math.min(pts.length - 1, n - 1 - f * 2)]
          const x = (r() - 0.5) * 0.5
          const len = 0.8 + r() * 1.1
          const strand: V3[] = []
          for (let s = 0; s <= 4; s++) strand.push([x + Math.sin(s * 1.3 + f) * 0.06, top[1] - (s / 4) * len, top[2] + 0.1 + s * 0.02])
          g.add(chain(strand, 0.018, 0.01, moss, 5, false))
          for (let s = 1; s <= 4; s++) g.add(leaf(strand[s], [strand[s][0] + 0.07, strand[s][1] - 0.05, strand[s][2] + 0.04], 0.05, 0.018, s % 2 ? leafA : leafB))
        }
      }
      return g
    })
  },
})

// --------------------------------------------------------------------------- pigeons
function pigeon(seed: number): THREE.Group {
  const r = seeded('pigeon' + seed)
  const g = new THREE.Group()
  const grey = M(r() > 0.3 ? '#8c919c' : '#6e7380')
  const dark = M('#4a4e58')
  const neck = M('#5f8a80', { emissive: '#3a5a6a', ei: 0.25 })
  g.add(ball(0.065, 0.058, 0.1, grey, 0, 0.07, 0, 10))
  g.add(leaf([0.04, 0.09, 0.02], [0.05, 0.07, -0.11], 0.06, 0.02, dark))
  g.add(leaf([-0.04, 0.09, 0.02], [-0.05, 0.07, -0.11], 0.06, 0.02, dark))
  g.add(leaf([0, 0.08, -0.06], [0, 0.06, -0.17], 0.06, 0.015, dark))
  g.add(ball(0.04, 0.045, 0.04, neck, 0, 0.115, 0.06, 8))
  const head = new THREE.Group()
  head.position.set(0, 0.15, 0.075)
  head.add(ball(0.032, 0.032, 0.034, grey, 0, 0, 0, 8))
  head.add(rot(cn(0.009, 0.03, M('#d9c8a4'), 0, 0, 0.03, 5), Math.PI / 2, 0, 0))
  head.add(ball(0.006, 0.006, 0.006, M('#c8501e'), 0.02, 0.008, 0.016, 4))
  head.add(ball(0.006, 0.006, 0.006, M('#c8501e'), -0.02, 0.008, 0.016, 4))
  g.add(head)
  g.add(rod([0.02, 0.02, 0.01], [0.02, 0, 0.02], 0.006, 0.006, M('#c86a6a'), 4))
  g.add(rod([-0.02, 0.02, 0.01], [-0.02, 0, 0.02], 0.006, 0.006, M('#c86a6a'), 4))
  g.userData.head = head
  g.userData.phase = r() * 10
  return g
}

/** A few pigeons on a short iron beam high under the vault. */
registerProp('ch16_pigeons', {
  solid: false,
  build: (ctx) => {
    const n = Math.max(1, Math.min(5, Math.round(num(ctx, 'n', 3))))
    const beam = bool(ctx, 'beam', true)
    const g = new THREE.Group()
    if (beam) g.add(bx(1.0, 0.06, 0.14, M('#30363e'), 0, -0.06, 0))
    const birds: THREE.Group[] = []
    for (let i = 0; i < n; i++) {
      const b = pigeon(i + Math.floor(ctx.rand() * 50))
      b.position.set(n === 1 ? 0 : -0.38 + (i / (n - 1)) * 0.76, 0, (ctx.rand() - 0.5) * 0.05)
      b.rotation.y = (ctx.rand() - 0.5) * 1.6
      b.userData.baseYaw = b.rotation.y
      keep(b)
      g.add(b)
      birds.push(b)
    }
    g.userData.birds = birds
    return finalize(g)
  },
  animate: (obj, t) => {
    const birds = obj.userData.birds as THREE.Group[] | undefined
    if (!birds) return
    for (const b of birds) {
      const p = Number(b.userData.phase) || 0
      const head = b.userData.head as THREE.Object3D | undefined
      const bob = Math.max(0, Math.sin(t * 3.1 + p))
      if (head) head.position.z = 0.075 + bob * 0.018
      b.rotation.y = (Number(b.userData.baseYaw) || 0) + Math.sin(t * 0.37 + p) * 0.5 * (Math.sin(t * 0.11 + p) > 0.6 ? 1 : 0.2)
    }
  },
})

// --------------------------------------------------------------------------- the forbidden box
/** Felix's flat dark box, opened like a shell: a cold, dead, bluish light without a wick. */
registerProp('ch16_laptop', {
  solid: false,
  light: { color: '#a8dcff', intensity: 1.7, distance: 3.6, y: 0.35 },
  build: () =>
    cachedBuild('c16laptop', () => {
      const g = new THREE.Group()
      const shell = M('#1b1d22')
      const keys = M('#2b2f37')
      g.add(bx(0.46, 0.024, 0.32, shell, 0, 0, 0.03))
      g.add(bx(0.38, 0.004, 0.16, keys, 0, 0.024, 0.06))
      g.add(bx(0.12, 0.003, 0.07, M('#262a31'), 0, 0.024, 0.15))
      const lid = new THREE.Group()
      lid.position.set(0, 0.024, -0.13)
      lid.rotation.x = -0.3
      lid.add(bx(0.46, 0.31, 0.016, shell, 0, 0, 0))
      lid.add(plane(0.4, 0.25, glowMat('#c4e8ff', 2.3), 0, 0.16, 0.0095))
      g.add(lid)
      return g
    }),
})

// --------------------------------------------------------------------------- bedding
/** Blankets, a pillow and a bundle spread on the steel floor: a family's whole territory. */
registerProp('ch16_bedroll', {
  solid: false,
  build: (ctx) => {
    const col = tint(ctx, '#6a5a4a')
    const v = variant(ctx, 3)
    const inner = cachedBuild(`c16bed|${col}|${v}`, () => {
      const g = new THREE.Group()
      g.add(ball(0.44, 0.045, 0.3, M(col), 0, 0.035, 0, 12))
      g.add(ball(0.2, 0.06, 0.28, M(shade(col, 0.78)), 0.24, 0.07, 0.01, 10))
      g.add(ball(0.12, 0.065, 0.17, M('#d8ccb0'), -0.32, 0.075, 0, 10))
      if (v > 0) g.add(ball(0.12, 0.11, 0.12, M('#8a7a5a'), 0.36, 0.11, 0.24, 9))
      if (v === 2) g.add(cy(0.05, 0.045, 0.09, M('#a8acb4'), -0.2, 0, 0.3, 10))
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// --------------------------------------------------------------------------- Sayuri's tarp
/** Canvas stretched between two steel ribs: a sheltered corner, open towards the camera. */
registerProp('ch16_tarp', {
  solid: false,
  build: (ctx) => {
    const col = tint(ctx, '#bfae8e')
    return cachedBuild(`c16tarp|${col}`, () => {
      const g = new THREE.Group()
      const steel = M('#3a4048')
      const cloth = M(col, { side: THREE.DoubleSide })
      const clothD = M(shade(col, 0.82), { side: THREE.DoubleSide })
      // two bent steel ribs
      for (const x of [-1, 1]) {
        const pts: V3[] = [
          [x, 0, -0.45],
          [x, 1.4, -0.42],
          [x * 0.95, 2.1, -0.15],
          [x * 0.9, 2.35, 0.3],
        ]
        g.add(chain(pts, 0.06, 0.05, steel, 7))
      }
      // back sheet, sagging
      const back = bx(2.0, 1.85, 0.03, cloth, 0, 0.12, -0.4)
      back.rotation.x = 0.05
      g.add(back)
      // roof sheet slanting back
      const roof = bx(2.0, 0.03, 0.85, clothD, 0, 2.05, -0.02)
      roof.rotation.x = -0.32
      g.add(roof)
      // side flap on the left
      const side = bx(0.03, 1.6, 0.9, cloth, -0.98, 0.1, -0.02)
      g.add(side)
      // ropes
      g.add(rod([-1, 2.2, 0.25], [-1.3, 0, 0.55], 0.01, 0.01, M('#c9a46a'), 4))
      g.add(rod([1, 2.2, 0.25], [1.3, 0, 0.55], 0.01, 0.01, M('#c9a46a'), 4))
      return g
    })
  },
})

// --------------------------------------------------------------------------- tin cup
/** The tin cup (plecháčik). `down: true` = turned upside down, not a drop left in it. */
registerProp('ch16_cup', {
  solid: false,
  build: (ctx) => {
    const down = bool(ctx, 'down')
    return cachedBuild(`c16cup|${down}`, () => {
      const g = new THREE.Group()
      const tin = M('#a9adb6')
      const dark = M('#3e4148')
      const body = cy(0.055, 0.047, 0.1, tin, 0, 0, 0, 14)
      if (down) body.rotation.x = Math.PI
      if (down) body.position.y = 0.05
      g.add(body)
      if (!down) g.add(cy(0.049, 0.049, 0.004, dark, 0, 0.094, 0, 14))
      else g.add(cy(0.046, 0.046, 0.004, M('#8c9098'), 0, 0.1, 0, 14))
      const handle = torus(0.03, 0.007, tin, 0.06, 0.05, 0, 5, 12)
      handle.rotation.y = Math.PI / 2
      g.add(handle)
      return g
    })
  },
})

// --------------------------------------------------------------------------- the Book of El
/** The original Book of El: covers dark and dull as obsidian, violet veins that pulse when touched. */
registerProp('ch16_book', {
  solid: false,
  light: { color: '#b77dff', intensity: 0.55, distance: 1.8, y: 0.2 },
  build: (ctx) => {
    const open = bool(ctx, 'open', true)
    const g = new THREE.Group()
    const cover = M('#100d15')
    const page = M('#e6d9bb')
    const pageD = M('#cdbf9e')
    const vein = uniqueGlow('#b77dff', 2.2, 0.85)
    if (open) {
      for (const s of [-1, 1]) {
        const half = new THREE.Group()
        half.position.set(s * 0.115, 0, 0)
        half.rotation.z = -s * 0.07
        half.add(bx(0.23, 0.012, 0.3, cover, 0, 0, 0))
        half.add(bx(0.21, 0.026, 0.28, s < 0 ? page : pageD, 0, 0.012, 0))
        for (let i = 0; i < 5; i++) half.add(bx(0.15, 0.002, 0.006, M('#5a4a3a'), s * 0.005, 0.039, -0.1 + i * 0.05))
        half.add(bx(0.234, 0.004, 0.006, vein, 0, 0.004, 0.152))
        half.add(bx(0.234, 0.004, 0.006, vein, 0, 0.004, -0.152))
        half.add(bx(0.006, 0.004, 0.3, vein, s * 0.117, 0.004, 0))
        g.add(half)
      }
    } else {
      g.add(bx(0.24, 0.06, 0.32, cover, 0, 0, 0))
      g.add(bx(0.225, 0.045, 0.012, page, 0, 0.008, 0.158))
      const veins: [number, number, number, number][] = [
        [0, -0.12, 0, 0.12],
        [0, -0.02, 0.07, 0.06],
        [0, 0.03, -0.07, 0.1],
        [0.07, 0.06, 0.09, 0.13],
        [0, -0.08, -0.06, -0.12],
      ]
      for (const [x0, z0, x1, z1] of veins) g.add(rod([x0, 0.062, z0], [x1, 0.062, z1], 0.004, 0.003, vein, 4))
    }
    g.userData.vein = vein
    return g
  },
  animate: (obj, t) => {
    const m = obj.userData.vein as THREE.MeshBasicMaterial | undefined
    if (m) m.opacity = 0.35 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.4))
  },
})
