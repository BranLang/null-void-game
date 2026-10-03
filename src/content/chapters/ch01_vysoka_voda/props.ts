/**
 * Chapter 1 props: the cargo airship (hydrogen envelope seen from the deck,
 * the winch, the jar of dying Nyau flowers), the drowned city of the bay
 * (broken tower, rising flood, the tidal front, the gondola's shadow), Nyau's
 * tide-locks (chain towers, raised reservoirs, the temple dome) and the
 * aerodock (mooring towers, the dock scales, lantern skeletons for Tōr).
 */
import * as THREE from 'three'
import { registerProp } from '../../../engine/props/registry'
import {
  PAL,
  M,
  bx,
  cy,
  cn,
  ball,
  dome,
  rod,
  ring,
  torus,
  decal,
  rock,
  rot,
  fx,
  keep,
  finalize,
  cachedBuild,
  cachedGeo,
  canvasTex,
  texMat,
  glowMat,
  uniqueGlow,
  seeded,
  range,
  bool,
  num,
  tint,
  type V3,
} from '../../../engine/props/kit'

// ------------------------------------------------------------------ envelope
function goreTex(color: string): THREE.CanvasTexture {
  return canvasTex(`c1-gores|${color}`, 512, 256, (g, w, h) => {
    g.fillStyle = color
    g.fillRect(0, 0, w, h)
    const n = 24
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)'
      g.fillRect((i * w) / n, 0, w / n, h)
      g.fillStyle = 'rgba(70,45,30,0.4)'
      g.fillRect((i * w) / n, 0, 2, h)
    }
    // stitched seams across the gores
    g.fillStyle = 'rgba(70,45,30,0.25)'
    for (const v of [0.18, 0.36, 0.64, 0.82]) g.fillRect(0, v * h, w, 2)
    // guild band
    g.fillStyle = '#9a2c38'
    g.fillRect(0, h * 0.47, w, 10)
    // patches, the airship is old
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(${120 + i * 5},${90 + i * 3},60,0.22)`
      g.fillRect(((i * 97) % w) + 8, ((i * 53) % (h - 30)) + 10, 22, 14)
    }
  })
}

/**
 * The hydrogen envelope seen from the deck: a long ribbed bag high above the
 * gondola with its rigging running down to the deck edges. Place it on the
 * deck centre with `y` = params.drop.
 */
registerProp('c1_envelope', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const len = num(ctx, 'len', 20)
    const wid = num(ctx, 'w', 5)
    const drop = num(ctx, 'drop', 7)
    const deck = num(ctx, 'deck', 4)
    const color = tint(ctx, '#cdb98e')
    const g = new THREE.Group()
    const env = new THREE.Mesh(
      cachedGeo('c1-env', () => new THREE.SphereGeometry(1, 40, 20).rotateZ(Math.PI / 2)),
      texMat(`c1-gores|${color}`, goreTex(color)),
    )
    env.scale.set(len / 2, wid * 0.42, wid / 2)
    env.castShadow = false
    g.add(env)
    // keel catwalk under the bag
    const wood = M(PAL.woodDark)
    g.add(bx(len * 0.72, 0.12, 0.34, wood, 0, -wid * 0.42 - 0.08, 0))
    // frame rings
    const ringM = M('#6a4a34')
    for (let i = -3; i <= 3; i++) {
      const x = (i / 3.6) * (len / 2)
      const k = Math.sqrt(Math.max(0.05, 1 - (x / (len / 2)) ** 2))
      const r = torus(1, 0.012, ringM, x, 0, 0, 4, 32)
      r.rotation.y = Math.PI / 2
      r.scale.set(wid * 0.5 * k * 1.01, wid * 0.42 * k * 1.01, 1)
      g.add(r)
    }
    // rigging down to the deck edges
    const rope = M('#4a3a2e')
    for (let i = 0; i < 6; i++) {
      const x = -len * 0.34 + (i * len * 0.68) / 5
      for (const s of [-1, 1]) {
        g.add(rod([x, -wid * 0.36, s * wid * 0.22], [x * 0.92, -drop + 0.6, s * deck], 0.018, 0.018, rope, 4))
        g.add(rod([x, -wid * 0.36, s * wid * 0.22], [x * 0.92 + 1.2, -drop + 0.6, s * deck], 0.012, 0.012, rope, 4))
      }
    }
    // tail fins
    const finM = M('#9a2c38', { side: THREE.DoubleSide })
    for (const s of [-1, 1]) {
      const fin = bx(2.2, 0.06, 1.4, finM, -len / 2 + 1.4, 0, s * (wid * 0.5 + 0.5))
      g.add(fin)
    }
    const vfin = bx(2.2, 1.6, 0.06, finM, -len / 2 + 1.4, wid * 0.36, 0)
    g.add(vfin)
    return finalize(g)
  },
})

// ------------------------------------------------------------------ winch
registerProp('c1_winch', {
  solid: true,
  build: () =>
    cachedBuild('c1-winch', () => {
      const g = new THREE.Group()
      const wood = M(PAL.wood)
      const dark = M(PAL.woodDark)
      const iron = M(PAL.ironDark)
      for (const s of [-1, 1]) {
        g.add(bx(0.1, 0.78, 0.5, dark, s * 0.38, 0, 0))
        g.add(bx(0.14, 0.08, 0.6, wood, s * 0.38, 0, 0))
      }
      const drum = cy(0.2, 0.2, 0.62, M('#8a6a44'), 0, 0, 0, 14)
      drum.rotation.z = Math.PI / 2
      drum.position.set(0.31, 0.56, 0)
      g.add(drum)
      // rope wound around the drum
      const rope = M(PAL.rope)
      for (let i = 0; i < 6; i++) g.add(rot(torus(0.215, 0.025, rope, -0.22 + i * 0.09, 0.56, 0, 5, 16), 0, Math.PI / 2, 0))
      g.add(rod([0.1, 0.4, 0.15], [0.3, 0.02, 0.6], 0.025, 0.025, rope, 4))
      // crank
      g.add(rod([0.45, 0.56, 0], [0.56, 0.56, 0], 0.03, 0.03, iron, 6))
      g.add(rod([0.56, 0.56, 0], [0.56, 0.82, 0.12], 0.025, 0.025, iron, 6))
      g.add(rod([0.56, 0.82, 0.12], [0.7, 0.82, 0.12], 0.035, 0.035, wood, 6))
      return g
    }),
})

// ------------------------------------------------------------------ dying flowers in a jar
registerProp('c1_flower_jar', {
  solid: false,
  light: { color: '#c6ffd2', intensity: 1.5, distance: 4.2, y: 0.45 },
  build: (ctx) => {
    const g = new THREE.Group()
    const glass = M('#bfe4e8', { transparent: true, opacity: 0.38 })
    const jar = cy(0.11, 0.1, 0.24, glass, 0, 0, 0, 14)
    g.add(jar)
    g.add(ring(0.11, 0.012, M('#9ac8cc'), 0, 0.24, 0, 4, 16))
    const water = cy(0.095, 0.09, 0.12, M('#7ac8b8', { emissive: '#2a6a5a', ei: 0.5, transparent: true, opacity: 0.6 }), 0, 0.01, 0, 12)
    fx(water)
    g.add(water)
    const stem = M('#3b6a3a')
    const r = seeded('c1-flowers')
    const blossom = uniqueGlow('#c8ffd6', 2.2)
    const core = glowMat('#eafff0', 3)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + r() * 0.4
      const lean = 0.08 + r() * 0.12
      const top: V3 = [Math.cos(a) * lean, 0.42 + r() * 0.18, Math.sin(a) * lean]
      g.add(rod([Math.cos(a) * 0.03, 0.05, Math.sin(a) * 0.03], top, 0.008, 0.006, stem, 4))
      const head = new THREE.Group()
      head.position.set(top[0], top[1], top[2])
      for (let k = 0; k < 5; k++) {
        const pa = (k / 5) * Math.PI * 2
        const p = ball(0.045, 0.012, 0.022, blossom, Math.cos(pa) * 0.035, 0, Math.sin(pa) * 0.035, 6)
        p.rotation.y = -pa
        head.add(p)
      }
      head.add(ball(0.018, 0.018, 0.018, core, 0, 0.004, 0, 6))
      g.add(head)
    }
    g.userData.glow = blossom
    g.userData.seed = ctx.rand() * 10
    return finalize(g)
  },
  animate: (obj, t) => {
    const m = obj.userData.glow as THREE.MeshBasicMaterial | undefined
    if (!m) return
    const base = m.userData.base as THREE.Color
    const s = Number(obj.userData.seed) || 0
    m.color.copy(base).multiplyScalar(0.72 + 0.12 * Math.sin(t * 0.8 + s) + 0.04 * Math.sin(t * 5.1 + s))
  },
})

// ------------------------------------------------------------------ dock scales
registerProp('c1_scale', {
  solid: true,
  build: () =>
    cachedBuild('c1-scale', () => {
      const g = new THREE.Group()
      const wood = M(PAL.woodDark)
      const light = M(PAL.woodLight)
      const iron = M(PAL.ironDark)
      const brass = M(PAL.brass)
      // platform
      g.add(bx(0.95, 0.12, 0.95, light, 0, 0, 0))
      g.add(bx(0.8, 0.04, 0.8, iron, 0, 0.12, 0))
      // gallows frame
      g.add(bx(0.12, 2.3, 0.12, wood, -0.42, 0, -0.38))
      g.add(bx(0.12, 2.3, 0.12, wood, 0.42, 0, -0.38))
      g.add(bx(1.0, 0.12, 0.14, wood, 0, 2.2, -0.38))
      g.add(rot(bx(0.08, 0.6, 0.08, wood, -0.3, 1.75, -0.38), 0, 0, 0.8))
      g.add(rot(bx(0.08, 0.6, 0.08, wood, 0.3, 1.75, -0.38), 0, 0, -0.8))
      // balance beam
      g.add(rod([0, 2.2, -0.38], [0, 1.95, -0.2], 0.02, 0.02, iron, 5))
      g.add(rod([-0.55, 1.95, -0.2], [0.55, 1.9, -0.2], 0.035, 0.035, iron, 8))
      g.add(ball(0.06, 0.06, 0.06, brass, 0, 1.93, -0.2, 8))
      // hook with a sack
      g.add(rod([-0.5, 1.95, -0.2], [-0.5, 1.4, -0.2], 0.01, 0.01, M(PAL.rope), 4))
      g.add(ball(0.22, 0.26, 0.2, M('#cfae78'), -0.5, 1.15, -0.2, 12))
      g.add(ball(0.08, 0.06, 0.08, M('#b8955e'), -0.5, 1.42, -0.2, 8))
      // counterweights on the other arm
      g.add(rod([0.5, 1.9, -0.2], [0.5, 1.55, -0.2], 0.01, 0.01, iron, 4))
      for (let i = 0; i < 3; i++) g.add(cy(0.09 - i * 0.015, 0.09 - i * 0.015, 0.07, iron, 0.5, 1.4 + i * 0.07, -0.2, 12))
      // chalk tally board
      g.add(bx(0.5, 0.36, 0.04, M('#2e3a34'), 0.25, 0.9, -0.44))
      const chalk = M('#e8e6dc')
      for (let i = 0; i < 5; i++) g.add(bx(0.02, 0.14, 0.01, chalk, 0.08 + i * 0.05, 1.0, -0.415))
      g.add(rot(bx(0.24, 0.02, 0.01, chalk, 0.18, 1.07, -0.414), 0, 0, -0.5))
      return g
    }),
})

// ------------------------------------------------------------------ lantern skeletons for Tōr
registerProp('c1_lantern_frames', {
  solid: false,
  build: (ctx) => {
    const kind = num(ctx, 'kind', 0)
    return cachedBuild(`c1-frames|${kind}`, () => {
      const g = new THREE.Group()
      const bamboo = M('#c9b06a')
      const dark = M('#8f7a3a')
      const r = seeded('c1-frames' + kind)
      if (kind === 0) {
        // crosses lying in a heap
        for (let i = 0; i < 7; i++) {
          const a = r() * Math.PI
          const cx = range(r, -0.3, 0.3)
          const cz = range(r, -0.3, 0.3)
          const y = 0.03 + i * 0.03
          const l = 0.55 + r() * 0.25
          g.add(rod([cx - Math.cos(a) * l, y, cz - Math.sin(a) * l], [cx + Math.cos(a) * l, y, cz + Math.sin(a) * l], 0.012, 0.012, bamboo, 4))
          g.add(rod([cx - Math.cos(a + 1.57) * l, y + 0.015, cz - Math.sin(a + 1.57) * l], [cx + Math.cos(a + 1.57) * l, y + 0.015, cz + Math.sin(a + 1.57) * l], 0.012, 0.012, bamboo, 4))
          g.add(ball(0.025, 0.02, 0.025, dark, cx, y + 0.01, cz, 5))
        }
      } else if (kind === 1) {
        // finished skeletons stacked, waiting for silk
        for (let i = 0; i < 3; i++) {
          const ox = -0.25 + i * 0.25
          const oz = (r() - 0.5) * 0.2
          const h = 0.6 + r() * 0.15
          const R = 0.17
          for (const yy of [0.02, h * 0.5, h]) g.add(rot(ring(R, 0.008, bamboo, ox, yy, oz, 3, 12), 0, 0, 0))
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2 + 0.4
            g.add(rod([ox + Math.cos(a) * R, 0.02, oz + Math.sin(a) * R], [ox + Math.cos(a) * R, h, oz + Math.sin(a) * R], 0.008, 0.008, bamboo, 3))
          }
        }
      } else {
        // a long bundle of rods tied with rope
        for (let i = 0; i < 12; i++) {
          const ox = ((i % 4) - 1.5) * 0.04
          const oy = 0.05 + Math.floor(i / 4) * 0.04
          g.add(rod([ox, oy, -0.85], [ox + (r() - 0.5) * 0.02, oy, 0.85], 0.016, 0.016, i % 3 ? bamboo : dark, 4))
        }
        for (const z of [-0.5, 0.5]) g.add(rot(torus(0.11, 0.018, M(PAL.rope), 0, 0.1, z, 4, 12), 0, 0, 0))
      }
      return g
    })
  },
})

// ------------------------------------------------------------------ mooring tower
registerProp('c1_mooring_tower', {
  solid: true,
  light: (ctx) => (bool(ctx, 'dark') ? null : { color: '#ffc27a', intensity: 2.4, distance: 7, y: num(ctx, 'h', 6) + 0.4 }),
  build: (ctx) => {
    const h = num(ctx, 'h', 6)
    const dark = bool(ctx, 'dark')
    return cachedBuild(`c1-mtower|${h}|${dark}`, () => {
      const g = new THREE.Group()
      const iron = M('#4a4440')
      const wood = M(PAL.woodDark)
      const b = 0.42
      const t = 0.2
      const corners: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]
      for (const [sx, sz] of corners) g.add(rod([sx * b, 0, sz * b], [sx * t, h, sz * t], 0.035, 0.03, iron, 6))
      const levels = Math.max(3, Math.round(h / 0.9))
      for (let i = 1; i < levels; i++) {
        const y = (i / levels) * h
        const w = b + (t - b) * (i / levels)
        for (let k = 0; k < 4; k++) {
          const [ax, az] = corners[k]
          const [bx2, bz2] = corners[(k + 1) % 4]
          g.add(rod([ax * w, y, az * w], [bx2 * w, y, bz2 * w], 0.016, 0.016, iron, 4))
          const y2 = ((i + 1) / levels) * h
          const w2 = b + (t - b) * ((i + 1) / levels)
          if (i < levels - 1) g.add(rod([ax * w, y, az * w], [bx2 * w2, y2, bz2 * w2], 0.01, 0.01, iron, 3))
        }
      }
      g.add(bx(0.5, 0.25, 0.5, M(PAL.stoneDark), 0, 0, 0))
      g.add(bx(0.7, 0.08, 0.7, wood, 0, h, 0))
      g.add(cn(0.32, 0.5, M('#7a3a2e'), 0, h + 0.08, 0, 4).rotateY(Math.PI / 4))
      // mooring arm
      g.add(rod([0, h - 0.2, 0], [1.1, h - 0.35, 0], 0.04, 0.03, iron, 6))
      g.add(torus(0.08, 0.02, M(PAL.brass), 1.12, h - 0.42, 0, 4, 10))
      if (!dark) g.add(bx(0.16, 0.2, 0.16, glowMat(PAL.warm, 3), 0, h + 0.2, 0))
      g.add(rod([1.12, h - 0.48, 0], [1.4, 0.05, 0.4], 0.012, 0.012, M(PAL.rope), 4))
      return g
    })
  },
})

// ------------------------------------------------------------------ drowned city: broken tower
registerProp('c1_ruin_tower', {
  solid: true,
  build: () =>
    cachedBuild('c1-ruin-tower', () => {
      const g = new THREE.Group()
      const stone = M('#8a8676')
      const wet = M('#6a6a5e')
      const weed = M('#3f5a3a')
      const R = 0.78
      g.add(cy(R + 0.08, R + 0.12, 0.3, wet, 0, 0, 0, 20))
      g.add(cy(R, R, 1.1, stone, 0, 0.3, 0, 20))
      // the break: segments whose tops follow a slanted clean cut
      const n = 18
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const hgt = 0.35 + (Math.cos(a - 0.6) + 1) * 0.55
        const seg = bx(0.3, hgt, 0.22, stone, Math.cos(a) * (R - 0.1), 1.4, Math.sin(a) * (R - 0.1))
        seg.rotation.y = -a + Math.PI / 2
        g.add(seg)
      }
      // a dark doorway and slits
      g.add(bx(0.36, 0.62, 0.06, M('#22221e'), 0, 0.3, R - 0.01))
      g.add(bx(0.08, 0.3, 0.05, M('#22221e'), 0.35, 1.1, R - 0.08))
      // sea grass and shells at the foot
      const r = seeded('c1-weed')
      for (let i = 0; i < 12; i++) {
        const a = r() * Math.PI * 2
        g.add(rod([Math.cos(a) * (R + 0.05), 0, Math.sin(a) * (R + 0.05)], [Math.cos(a) * (R + 0.2), 0.25 + r() * 0.3, Math.sin(a) * (R + 0.2)], 0.025, 0.006, weed, 3))
      }
      for (let i = 0; i < 6; i++) g.add(ball(0.06, 0.03, 0.05, M('#e8dcc8'), range(r, -1, 1), 0.02, range(r, 0.8, 1.1)))
      return g
    }),
})

// ------------------------------------------------------------------ wet rubble on the seabed
registerProp('c1_rubble', {
  solid: false,
  build: (ctx) => {
    const v = Math.floor(ctx.rand() * 4)
    return cachedBuild(`c1-rubble|${v}`, () => {
      const g = new THREE.Group()
      const r = seeded('c1-rubble' + v)
      const stone = M('#7e7a6c')
      for (let i = 0; i < 4; i++) g.add(rock(Math.floor(r() * 6), 0.12 + r() * 0.12, 0.08 + r() * 0.08, 0.1 + r() * 0.1, stone, range(r, -0.35, 0.35), 0, range(r, -0.35, 0.35)))
      if (v % 2) g.add(ball(0.05, 0.025, 0.04, M('#e8dcc8'), 0.1, 0.02, -0.2, 6))
      g.add(rod([0.2, 0, 0.1], [0.28, 0.3, 0.16], 0.02, 0.005, M('#3f5a3a'), 3))
      return g
    })
  },
})

// ------------------------------------------------------------------ the rising flood
function waterTex(): THREE.CanvasTexture {
  const t = canvasTex('c1-water', 256, 256, (g, w, h, r) => {
    g.fillStyle = '#3c7686'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 140; i++) {
      const x = r() * w
      const y = r() * h
      const l = 10 + r() * 30
      g.strokeStyle = `rgba(200,235,240,${0.08 + r() * 0.16})`
      g.lineWidth = 1 + r() * 1.5
      g.beginPath()
      g.moveTo(x, y)
      g.quadraticCurveTo(x + l / 2, y - 3, x + l, y)
      g.stroke()
    }
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** A flat sheet of water that rises from `from` to `to` (world units) over `dur` seconds once shown. */
registerProp('c1_flood', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const w = num(ctx, 'w', 20)
    const d = num(ctx, 'd', 20)
    const g = new THREE.Group()
    const tex = waterTex().clone()
    tex.needsUpdate = true
    tex.repeat.set(w / 6, d / 6)
    const mat = new THREE.MeshToonMaterial({ color: '#7fb4bf', map: tex, transparent: true, opacity: 0.9, emissive: new THREE.Color('#123c48'), emissiveIntensity: 0.6 })
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat)
    sheet.receiveShadow = true
    g.add(sheet)
    g.userData.sheet = sheet
    g.userData.from = num(ctx, 'from', -1.2)
    g.userData.to = num(ctx, 'to', 2.2)
    g.userData.dur = num(ctx, 'dur', 5)
    g.userData.t = 0
    sheet.position.y = Number(g.userData.from)
    return g
  },
  animate: (obj, _t, dt) => {
    const sheet = obj.userData.sheet as THREE.Mesh | undefined
    if (!sheet) return
    obj.userData.t = (Number(obj.userData.t) || 0) + dt
    const k = Math.min(1, Number(obj.userData.t) / Number(obj.userData.dur))
    const e = k * k * (3 - 2 * k)
    sheet.position.y = Number(obj.userData.from) + (Number(obj.userData.to) - Number(obj.userData.from)) * e
    const tex = (sheet.material as THREE.MeshToonMaterial).map
    if (tex) {
      tex.offset.x += dt * 0.02
      tex.offset.y += dt * 0.008
    }
  },
})

// ------------------------------------------------------------------ the tidal front
function waveShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-1.4, 0)
  s.quadraticCurveTo(-0.6, 0.15, 0, 1.0)
  s.quadraticCurveTo(0.35, 1.55, 0.75, 1.5)
  s.quadraticCurveTo(0.95, 1.45, 0.9, 1.25)
  s.quadraticCurveTo(0.55, 1.2, 0.5, 0.75)
  s.quadraticCurveTo(0.6, 0.2, 0.9, 0)
  s.closePath()
  return s
}

/**
 * The brown wall with a white crest, as long as the bay, moving exactly as
 * fast as a horse runs. Local +Z is its direction of travel. Shown -> moves.
 */
registerProp('c1_tide', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const w = num(ctx, 'w', 24)
    const g = new THREE.Group()
    const body = new THREE.Mesh(
      cachedGeo(`c1-wave|${w}`, () => {
        const geo = new THREE.ExtrudeGeometry(waveShape(), { depth: w, bevelEnabled: false, curveSegments: 10 })
        geo.translate(0, 0, -w / 2)
        geo.rotateY(-Math.PI / 2)
        return geo
      }),
      M('#7a5a3c'),
    )
    const hk = num(ctx, 'h', 1.3)
    body.scale.set(1, hk, 1)
    g.add(body)
    // crest of foam along the top
    const foam = M('#f4f2ea', { emissive: '#8aa0a8', ei: 0.25 })
    g.add(rod([-w / 2, 1.45 * hk, 0.6], [w / 2, 1.45 * hk, 0.6], 0.26, 0.26, foam, 10))
    const r = seeded('c1-foam')
    for (let i = 0; i < Math.round(w * 1.4); i++) {
      g.add(ball(0.18 + r() * 0.16, 0.12, 0.18, foam, -w / 2 + r() * w, 1.5 * hk + r() * 0.12, 0.5 + r() * 0.35, 6))
    }
    // spray skirt in front
    g.add(bx(w, 0.08, 0.9, M('#b8c4bc', { transparent: true, opacity: 0.6 }), 0, 0, 1.1))
    const holder = new THREE.Group()
    holder.add(finalize(g))
    keep(holder.children[0])
    holder.userData.inner = holder.children[0]
    holder.userData.speed = num(ctx, 'speed', 2.8)
    holder.userData.dist = num(ctx, 'dist', 22)
    holder.userData.t = 0
    return holder
  },
  animate: (obj, _t, dt) => {
    const inner = obj.userData.inner as THREE.Object3D | undefined
    if (!inner) return
    obj.userData.t = (Number(obj.userData.t) || 0) + dt
    const z = Math.min(Number(obj.userData.dist), Number(obj.userData.t) * Number(obj.userData.speed))
    inner.position.z = z
    inner.position.y = Math.sin(Number(obj.userData.t) * 2.2) * 0.05
  },
})

// ------------------------------------------------------------------ gondola shadow drifting over the bay
registerProp('c1_shadow', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const g = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false })
    const s = decal(5.5, 2.4, mat, 0.03, true)
    g.add(s)
    const s2 = decal(1.6, 0.9, mat, 0.035, true)
    s2.position.x = 0.4
    g.add(s2)
    fx(g)
    const holder = new THREE.Group()
    holder.add(g)
    holder.userData.inner = g
    holder.userData.range = num(ctx, 'range', 16)
    holder.userData.speed = num(ctx, 'speed', 0.7)
    return holder
  },
  animate: (obj, t) => {
    const inner = obj.userData.inner as THREE.Object3D | undefined
    if (!inner) return
    const range = Number(obj.userData.range)
    inner.position.x = ((t * Number(obj.userData.speed)) % range) - range / 2
  },
})

// ------------------------------------------------------------------ raised water (reservoirs, the only water that is not at sea level)
registerProp('c1_pool', {
  solid: false,
  castShadow: false,
  build: () =>
    cachedBuild('c1-pool', () => {
      const g = new THREE.Group()
      const tex = waterTex()
      const m = texMat('c1-pool', tex, { emissive: '#1d5a66', ei: 0.55 })
      const top = bx(1.0, 0.04, 1.0, m, 0, -0.2, 0)
      fx(top)
      g.add(top)
      return g
    }),
})

// ------------------------------------------------------------------ tide-lock tower with drum and chains
registerProp('c1_chain_tower', {
  solid: true,
  build: (ctx) => {
    const h = num(ctx, 'h', 3.2)
    return cachedBuild(`c1-ctower|${h}`, () => {
      const g = new THREE.Group()
      const stone = M(PAL.white)
      const shadeM = M(PAL.whiteShade)
      const wood = M(PAL.woodDark)
      const iron = M('#3a3a40')
      g.add(bx(1.1, h, 1.0, stone, 0, 0, -0.1))
      g.add(bx(1.2, 0.14, 1.1, shadeM, 0, h, -0.1))
      for (const y of [h * 0.35, h * 0.7]) g.add(bx(1.14, 0.06, 1.04, shadeM, 0, y, -0.1))
      // drum housing on top
      g.add(bx(0.18, 0.7, 0.8, wood, -0.5, h + 0.14, -0.1))
      g.add(bx(0.18, 0.7, 0.8, wood, 0.5, h + 0.14, -0.1))
      const drum = cy(0.34, 0.34, 0.85, M('#6a4a30'), 0, 0, 0, 16)
      drum.rotation.z = Math.PI / 2
      drum.position.set(0, h + 0.55, -0.1)
      g.add(drum)
      for (let i = 0; i < 5; i++) g.add(rot(torus(0.35, 0.03, iron, -0.3 + i * 0.15, h + 0.55, -0.1, 4, 14), 0, Math.PI / 2, 0))
      g.add(cn(0.75, 0.55, M('#9a4a34'), 0, h + 0.85, -0.1, 4).rotateY(Math.PI / 4))
      // the chains, thick as a man's thigh, down into the water
      for (const x of [-0.22, 0.22]) {
        for (let i = 0; i < Math.ceil((h + 1.6) / 0.22); i++) {
          const y = h + 0.3 - i * 0.22
          const link = torus(0.09, 0.03, iron, x, y, 0.52, 4, 10)
          link.rotation.y = i % 2 ? Math.PI / 2 : 0
          link.rotation.x = Math.PI / 2
          link.scale.set(1, 1.5, 1)
          g.add(link)
        }
      }
      // dark gate arch at the foot
      g.add(bx(0.6, 0.9, 0.04, M('#1c2226'), 0, 0, 0.41))
      g.add(rot(torus(0.3, 0.06, shadeM, 0, 0.9, 0.42, 4, 12, Math.PI), 0, 0, 0))
      return g
    })
  },
})

// ------------------------------------------------------------------ the white dome of the Temple of El (far away, big)
registerProp('c1_dome', {
  solid: true,
  light: { color: '#ffd9a0', intensity: 1.6, distance: 7, y: 2.4 },
  build: () =>
    cachedBuild('c1-dome', () => {
      const g = new THREE.Group()
      const white = M(PAL.white)
      const shadeM = M(PAL.whiteShade)
      const gold = M(PAL.gold, { emissive: '#7a5a20', ei: 0.3 })
      g.add(cy(1.5, 1.6, 0.4, shadeM, 0, 0, 0, 24))
      g.add(cy(1.3, 1.3, 1.0, white, 0, 0.4, 0, 24))
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        g.add(bx(0.1, 0.8, 0.1, shadeM, Math.cos(a) * 1.31, 0.5, Math.sin(a) * 1.31))
        g.add(bx(0.14, 0.4, 0.04, M('#ffd27a', { emissive: '#ff9a3a', ei: 0.6 }), Math.cos(a + 0.26) * 1.3, 0.7, Math.sin(a + 0.26) * 1.3).rotateY(-a - 0.26 + Math.PI / 2))
      }
      g.add(cy(1.36, 1.36, 0.1, shadeM, 0, 1.4, 0, 24))
      g.add(dome(1.3, 1.25, 1.3, white, 0, 1.5, 0, 24))
      g.add(cy(0.2, 0.26, 0.3, gold, 0, 2.7, 0, 10))
      g.add(cn(0.08, 0.7, gold, 0, 3.0, 0, 8))
      g.add(ball(0.1, 0.1, 0.1, gold, 0, 3.0, 0, 8))
      return g
    }),
})

// ------------------------------------------------------------------ sweeps (vahadlá) lifting river water up the western slope
registerProp('c1_sweep', {
  solid: true,
  build: (ctx) => {
    const g = new THREE.Group()
    const wood = M(PAL.wood)
    const dark = M(PAL.woodDark)
    g.add(bx(0.14, 1.3, 0.14, dark, 0, 0, 0))
    g.add(bx(0.3, 0.1, 0.3, M(PAL.stoneDark), 0, 0, 0))
    const arm = new THREE.Group()
    arm.position.set(0, 1.3, 0)
    arm.add(rod([-1.0, 0, 0], [0.9, 0, 0], 0.04, 0.03, wood, 6))
    arm.add(cy(0.12, 0.12, 0.2, M(PAL.stoneDark), -1.0, -0.1, 0, 8))
    arm.add(rod([0.9, 0, 0], [0.9, -0.7, 0], 0.01, 0.01, M(PAL.rope), 4))
    arm.add(cy(0.1, 0.08, 0.16, M('#8a6a44'), 0.9, -0.86, 0, 8))
    finalize(arm)
    keep(arm)
    g.add(arm)
    g.userData.arm = arm
    g.userData.phase = ctx.rand() * Math.PI * 2
    return finalize(g)
  },
  animate: (obj, t) => {
    const arm = obj.userData.arm as THREE.Object3D | undefined
    if (arm) arm.rotation.z = Math.sin(t * 1.1 + Number(obj.userData.phase)) * 0.35
  },
})

// ------------------------------------------------------------------ lantern-lit cabin porthole that shows the amber moon
registerProp('c1_porthole', {
  solid: false,
  build: () =>
    cachedBuild('c1-porthole', () => {
      const g = new THREE.Group()
      const z = -0.5
      const brass = M(PAL.brass)
      g.add(rot(torus(0.26, 0.05, brass, 0, 1.25, z + 0.04, 6, 20), 0, 0, 0))
      const glass = new THREE.Mesh(cachedGeo('c1-disc', () => new THREE.CircleGeometry(0.24, 24)), M('#1a2236', { emissive: '#3a2a20', ei: 0.4 }))
      glass.position.set(0, 1.25, z + 0.03)
      g.add(glass)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        g.add(ball(0.025, 0.025, 0.02, M(PAL.ironDark), Math.cos(a) * 0.3, 1.25 + Math.sin(a) * 0.3, z + 0.05, 5))
      }
      return g
    }),
})

// ------------------------------------------------------------------ a crate turned into a table / toolbox
registerProp('c1_toolbox', {
  solid: true,
  build: () =>
    cachedBuild('c1-toolbox', () => {
      const g = new THREE.Group()
      const wood = M('#9a6a40')
      const dark = M(PAL.woodDark)
      g.add(bx(0.86, 0.5, 0.62, wood, 0, 0, 0))
      for (const x of [-0.43, 0.43]) g.add(bx(0.04, 0.52, 0.64, dark, x, 0, 0))
      g.add(bx(0.9, 0.05, 0.66, M(PAL.woodLight), 0, 0.5, 0))
      g.add(bx(0.2, 0.06, 0.04, M(PAL.ironDark), 0, 0.32, 0.32))
      // tools sticking out, a rope coil, scattered dice
      g.add(rod([-0.3, 0.55, -0.15], [-0.05, 0.58, -0.22], 0.015, 0.015, M(PAL.iron), 5))
      g.add(rot(torus(0.09, 0.02, M(PAL.rope), 0.28, 0.57, -0.18, 4, 12), Math.PI / 2, 0, 0))
      const bone = M('#f0e6cc')
      const dice: V3[] = [
        [0.05, 0.57, 0.12],
        [0.16, 0.57, 0.05],
        [-0.12, 0.57, 0.16],
      ]
      for (const [x, y, z] of dice) g.add(rot(bx(0.05, 0.05, 0.05, bone, x, y - 0.02, z), 0, x * 9, 0))
      return g
    }),
})

// ------------------------------------------------------------------ helper: sacks of corn stacked high (cargo)
registerProp('c1_cargo', {
  solid: true,
  build: (ctx) => {
    const v = Math.floor(ctx.rand() * 3)
    return cachedBuild(`c1-cargo|${v}`, () => {
      const g = new THREE.Group()
      const r = seeded('c1-cargo' + v)
      const sack = [M('#cfae78'), M('#bf9e68'), M('#d8bc88')]
      const n = 4 + v
      for (let i = 0; i < n; i++) {
        const layer = i < 3 ? 0 : i < 5 ? 1 : 2
        const x = (layer === 0 ? (i - 1) * 0.3 : layer === 1 ? (i - 3.5) * 0.3 : 0) + (r() - 0.5) * 0.05
        const s = ball(0.2, 0.15, 0.3, sack[i % 3], x, 0.14 + layer * 0.24, (r() - 0.5) * 0.08, 10)
        s.rotation.y = (r() - 0.5) * 0.4
        g.add(s)
      }
      g.add(rod([-0.4, 0.05, 0.3], [0.4, 0.62, -0.25], 0.012, 0.012, M(PAL.rope), 4))
      return g
    })
  },
})

// ------------------------------------------------------------------ stone gate in the cliff (tide-lock gate)
registerProp('c1_lockgate', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    return cachedBuild(`c1-lockgate|${open}`, () => {
      const g = new THREE.Group()
      const white = M(PAL.white)
      const shadeM = M(PAL.whiteShade)
      const z = -0.5
      g.add(bx(1.0, 1.5, 0.2, shadeM, 0, 0, z + 0.1))
      g.add(bx(0.7, 1.1, 0.06, M('#16202a'), 0, 0, z + 0.22))
      g.add(rot(torus(0.35, 0.08, white, 0, 1.1, z + 0.22, 4, 14, Math.PI), 0, 0, 0))
      const doorY = open ? 0.9 : 0
      const plank = M(PAL.wood)
      for (let i = 0; i < 4; i++) g.add(bx(0.66, 0.24, 0.05, i % 2 ? plank : M(PAL.woodLight), 0, doorY + 0.02 + i * 0.26, z + 0.27))
      g.add(bx(0.7, 0.05, 0.07, M(PAL.ironDark), 0, doorY + 0.5, z + 0.29))
      return g
    })
  },
})

// ------------------------------------------------------------------ the scale-woman's cargo ledger on a small crate
registerProp('c1_ledger', {
  solid: true,
  build: () =>
    cachedBuild('c1-ledger', () => {
      const g = new THREE.Group()
      g.add(bx(0.62, 0.46, 0.5, M('#b07a48'), 0, 0, 0))
      g.add(bx(0.64, 0.04, 0.52, M(PAL.woodDark), 0, 0.46, 0))
      const book = new THREE.Group()
      book.add(bx(0.36, 0.09, 0.27, M('#5a2a24'), 0, 0, 0))
      book.add(bx(0.34, 0.075, 0.25, M(PAL.paper), 0.01, 0.007, 0))
      book.add(bx(0.03, 0.095, 0.27, M('#3a1a16'), -0.17, 0, 0))
      book.position.set(-0.04, 0.5, 0.02)
      book.rotation.y = 0.25
      g.add(book)
      g.add(rod([0.16, 0.52, -0.1], [0.24, 0.52, 0.1], 0.008, 0.008, M('#2a2a2a'), 4))
      g.add(rot(torus(0.07, 0.015, M(PAL.rope), 0.2, 0.5, -0.16, 4, 10), Math.PI / 2, 0, 0))
      return g
    }),
})
