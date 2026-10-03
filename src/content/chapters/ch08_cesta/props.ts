/**
 * Custom props for chapter 8 (the Itaka's deck and hold, the forest camps).
 * Registered at import time with the `ch08_` prefix; chapter 7 also uses the
 * deck pieces for its night epilogue on the Itaka.
 */
import * as THREE from 'three'
import { registerProp } from '../../../engine/props/registry'
import {
  PAL,
  WALL_Z,
  M,
  F,
  bx,
  cy,
  cn,
  ball,
  dome,
  rod,
  chain,
  leaf,
  torus,
  ring,
  plane,
  decal,
  extrude,
  rock,
  rot,
  finalize,
  cachedBuild,
  wrap,
  seeded,
  variant,
  bool,
  num,
  tint,
  canvasTex,
  texMat,
  additive,
  glowMat,
  keep,
  fx,
  type V3,
} from '../../../engine/props/kit'

const STEEL = '#3e434c'
const DARK = '#262a31'
const MID = '#4c525d'

// ---------------------------------------------------------------------------
// ch08_helm: the Itaka's wheel with a brass binnacle (wheel faces +Z)
// ---------------------------------------------------------------------------

registerProp('ch08_helm', {
  solid: true,
  build: () => {
    const g = new THREE.Group()
    const wood = M('#6a3e26')
    const woodL = M('#8a5636')
    const brass = M(PAL.brass)
    g.add(bx(0.34, 0.08, 0.34, M(DARK), 0, 0, 0))
    g.add(bx(0.2, 0.95, 0.2, M(STEEL), 0, 0.08, -0.05))
    g.add(rod([0, 1.0, -0.05], [0, 1.0, 0.16], 0.05, 0.05, brass, 8))
    const wheel = new THREE.Group()
    wheel.position.set(0, 1.0, 0.2)
    wheel.add(torus(0.36, 0.035, woodL, 0, 0, 0, 6, 28))
    wheel.add(torus(0.12, 0.03, wood, 0, 0, 0, 6, 16))
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      wheel.add(rod([Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0], [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0], 0.022, 0.03, wood, 6))
      wheel.add(ball(0.035, 0.035, 0.035, woodL, Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0, 6))
    }
    wheel.add(ball(0.06, 0.06, 0.05, brass, 0, 0, 0.02, 8))
    finalize(wheel)
    keep(wheel)
    g.add(wheel)
    g.userData.wheel = wheel
    // binnacle with the compass
    g.add(cy(0.12, 0.15, 0.85, M(STEEL), 0.42, 0, -0.1, 12))
    g.add(dome(0.13, 0.11, 0.13, M('#bfe6ff', { transparent: true, opacity: 0.55 }), 0.42, 0.86, -0.1, 14))
    g.add(cy(0.135, 0.135, 0.04, brass, 0.42, 0.84, -0.1, 14))
    g.add(cy(0.09, 0.09, 0.01, M(PAL.cream), 0.42, 0.88, -0.1, 14))
    g.add(rot(bx(0.012, 0.004, 0.13, M('#b03028'), 0.42, 0.89, -0.1), 0, 0.6, 0))
    return finalize(g)
  },
  animate: (obj, t) => {
    const w = obj.userData.wheel as THREE.Object3D | undefined
    if (w) w.rotation.z = Math.sin(t * 0.35) * 0.18
  },
})

// ---------------------------------------------------------------------------
// ch08_bell: the cracked cast-iron bell on the prow
// ---------------------------------------------------------------------------

registerProp('ch08_bell', {
  solid: true,
  build: () =>
    cachedBuild('ch08_bell', () => {
      const g = new THREE.Group()
      const iron = M('#2c2a2e')
      const frame = M(DARK)
      for (const s of [-1, 1]) g.add(rod([s * 0.32, 0, 0], [s * 0.12, 1.45, 0], 0.035, 0.03, frame, 6))
      g.add(rod([-0.2, 1.45, 0], [0.2, 1.45, 0], 0.03, 0.03, frame, 6))
      g.add(cy(0.025, 0.025, 0.1, frame, 0, 1.35, 0, 6))
      const bell = new THREE.Group()
      bell.add(cy(0.12, 0.26, 0.42, iron, 0, 0.88, 0, 18))
      bell.add(dome(0.12, 0.08, 0.12, iron, 0, 1.3, 0, 14))
      bell.add(cy(0.28, 0.28, 0.035, M('#3a3638'), 0, 0.86, 0, 18))
      // the long crack
      bell.add(rot(bx(0.012, 0.44, 0.012, M('#0c0a0c'), 0.0, 0.0, 0), 0, 0, 0.22).translateX(0.12).translateY(0.9).translateZ(0.17))
      bell.add(ball(0.035, 0.05, 0.035, M('#4a4448'), 0, 0.8, 0, 8))
      g.add(bell)
      g.add(rod([0, 0.82, 0], [0.24, 0.35, 0.18], 0.008, 0.008, M(PAL.rope), 4))
      return g
    }),
})

// ---------------------------------------------------------------------------
// ch08_rotor: a swivelling rotor on its boom (boom points +Z from the hull)
// ---------------------------------------------------------------------------

registerProp('ch08_rotor', {
  solid: false,
  build: (ctx) => {
    const g = new THREE.Group()
    const mid = M(MID)
    const dark = M(DARK)
    const spira = glowMat(PAL.spira, 3)
    const y0 = num(ctx, 'y0', 0.1)
    const root: V3 = [0, y0, -0.45]
    const tip: V3 = [0, y0 + 0.65, 0.75]
    g.add(rod(root, tip, 0.1, 0.08, mid, 8))
    g.add(ball(0.13, 0.13, 0.13, dark, root[0], root[1], root[2], 8))
    g.add(cy(0.14, 0.17, 0.42, dark, tip[0], tip[1] - 0.16, tip[2], 12))
    g.add(ring(0.62, 0.06, mid, tip[0], tip[1] + 0.3, tip[2], 6, 30))
    g.add(ring(0.16, 0.04, spira, tip[0], tip[1] + 0.29, tip[2], 5, 16))
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) g.add(rod([tip[0], tip[1] + 0.28, tip[2]], [tip[0] + Math.cos(a) * 0.6, tip[1] + 0.3, tip[2] + Math.sin(a) * 0.6], 0.016, 0.016, dark, 4))
    const rotor = new THREE.Group()
    rotor.position.set(tip[0], tip[1] + 0.36, tip[2])
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      const b = leaf([0, 0, 0], [Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56], 0.15, 0.03, M('#5a606b'))
      b.rotateY(0.3)
      rotor.add(b)
    }
    rotor.add(cy(0.08, 0.08, 0.08, M(PAL.brass), 0, -0.04, 0, 10))
    finalize(rotor)
    keep(rotor)
    g.add(rotor)
    g.userData.rotor = rotor
    g.userData.speed = num(ctx, 'speed', 2.4)
    return finalize(g)
  },
  animate: (obj, _t, dt) => {
    const r = obj.userData.rotor as THREE.Object3D | undefined
    if (r) r.rotation.y += dt * (Number(obj.userData.speed) || 2.4)
  },
})

// ---------------------------------------------------------------------------
// ch08_stack: exhaust stack with the violet Spira glow
// ---------------------------------------------------------------------------

registerProp('ch08_stack', {
  solid: true,
  light: { color: '#a070ff', intensity: 1.2, distance: 3.5, y: 1.6 },
  build: () =>
    cachedBuild('ch08_stack', () => {
      const g = new THREE.Group()
      const dark = M(DARK)
      const spira = glowMat(PAL.spira, 3.2)
      g.add(cy(0.24, 0.3, 0.2, M(MID), 0, 0, 0, 14))
      g.add(cy(0.17, 0.2, 1.5, dark, 0, 0.2, 0, 14))
      g.add(ring(0.18, 0.04, spira, 0, 1.7, 0, 5, 18))
      g.add(cy(0.15, 0.15, 0.02, spira, 0, 1.69, 0, 14))
      g.add(ring(0.2, 0.025, M(PAL.brass), 0, 0.9, 0, 5, 18))
      return g
    }),
})

// ---------------------------------------------------------------------------
// ch08_hatch: the deck hatch down to the hold
// ---------------------------------------------------------------------------

registerProp('ch08_hatch', {
  solid: false,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    return cachedBuild(`ch08_hatch|${open}`, () => {
      const g = new THREE.Group()
      const steel = M(MID)
      g.add(bx(0.98, 0.1, 0.98, steel, 0, 0, 0))
      g.add(bx(0.78, 0.11, 0.78, M('#0c0d10'), 0, 0, 0))
      for (let i = 0; i < 3; i++) g.add(bx(0.6, 0.02, 0.06, M(PAL.wood), 0, 0.05 - i * 0.18, -0.25 + i * 0.2))
      if (!open) {
        const lid = bx(0.8, 0.06, 0.8, M('#5a4636'), 0, 0.1, 0)
        g.add(lid)
        for (let i = 0; i < 4; i++) g.add(bx(0.8, 0.065, 0.04, M('#3a2c22'), 0, 0.1, -0.3 + i * 0.2))
        g.add(torus(0.07, 0.015, M(PAL.brass), 0, 0.18, 0.2, 5, 12).rotateX(Math.PI / 2))
      } else {
        const lid = bx(0.8, 0.8, 0.06, M('#5a4636'), 0, 0.1, -0.45)
        g.add(lid)
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch08_navtable: Renn's Sai tables on the navigation table
// ---------------------------------------------------------------------------

function saiTableTex(): THREE.CanvasTexture {
  return canvasTex('ch08-saitables', 512, 256, (g, w, h, r) => {
    g.fillStyle = '#e8d8a8'
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(120,80,30,0.15)'
    for (let i = 0; i < 40; i++) g.fillRect(r() * w, r() * h, 20 + r() * 40, 3)
    g.strokeStyle = '#3a2814'
    g.lineWidth = 1
    // columns of numbers
    g.fillStyle = '#3a2814'
    g.font = '9px Georgia, serif'
    for (let c = 0; c < 9; c++) {
      g.beginPath()
      g.moveTo(14 + c * 54, 8)
      g.lineTo(14 + c * 54, h - 8)
      g.stroke()
      for (let k = 0; k < 18; k++) g.fillText(String(Math.floor(r() * 900 + 100)), 18 + c * 54, 20 + k * 13)
    }
    // the Sai curve, snaking across the page
    g.strokeStyle = '#7a2a1a'
    g.lineWidth = 2.5
    g.beginPath()
    for (let x = 0; x <= w; x += 4) {
      const y = h * 0.5 + Math.sin(x / 38) * h * 0.3 + Math.sin(x / 11) * 4
      if (x === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
    // marginal notes in the old speech
    g.fillStyle = '#5a3a1a'
    g.font = 'italic 10px Georgia, serif'
    g.fillText('ljós · þungt · 3° austur', 20, h - 14)
    g.fillText('Renn', w - 50, h - 14)
  })
}

registerProp('ch08_navtable', {
  solid: true,
  light: { color: '#ffc27a', intensity: 1.6, distance: 3.8, y: 1.1, flicker: true },
  build: () =>
    cachedBuild('ch08_navtable', () => {
      const g = new THREE.Group()
      const wood = M('#5a3424')
      g.add(bx(1.0, 0.06, 0.66, M('#7a4a30'), 0, 0.8, 0))
      for (const [x, z] of [[-0.44, -0.28], [0.44, -0.28], [-0.44, 0.28], [0.44, 0.28]]) g.add(bx(0.07, 0.8, 0.07, wood, x, 0, z))
      const scroll = plane(0.92, 0.5, texMat('ch08-saitables', saiTableTex()), 0, 0, 0)
      scroll.rotation.x = -Math.PI / 2
      scroll.position.set(0, 0.865, 0)
      g.add(scroll)
      for (const s of [-1, 1]) g.add(rot(cy(0.035, 0.035, 0.56, M('#e0cc98'), 0, 0, 0, 10), Math.PI / 2, 0, 0).translateX(s * 0.47).translateY(0.885))
      // brass weights, dividers and a small lamp
      g.add(cy(0.05, 0.05, 0.05, M(PAL.brass), -0.38, 0.86, -0.18, 10))
      g.add(cy(0.05, 0.05, 0.05, M(PAL.brass), 0.38, 0.86, 0.18, 10))
      g.add(rod([0.1, 0.87, 0.05], [0.22, 0.87, -0.1], 0.008, 0.006, M('#c8c8d0'), 4))
      g.add(rod([0.1, 0.87, 0.05], [0.26, 0.87, 0.06], 0.008, 0.006, M('#c8c8d0'), 4))
      g.add(cy(0.06, 0.07, 0.04, M(PAL.brass), -0.34, 0.86, 0.2, 10))
      g.add(ball(0.05, 0.07, 0.05, glowMat(PAL.warm, 2.6), -0.34, 0.95, 0.2, 8))
      return g
    }),
})

// ---------------------------------------------------------------------------
// ch08_instruments: barometers and pressure gauges on a brass stand
// ---------------------------------------------------------------------------

registerProp('ch08_instruments', {
  solid: true,
  build: () =>
    cachedBuild('ch08_instruments', () => {
      const g = new THREE.Group()
      g.add(bx(0.7, 1.05, 0.22, M(STEEL), 0, 0, 0))
      const brass = M(PAL.brass)
      const face = M(PAL.cream)
      for (const [x, y, r] of [[-0.18, 0.78, 0.11], [0.18, 0.78, 0.11], [0, 0.45, 0.14]] as const) {
        g.add(rot(cy(r + 0.02, r + 0.02, 0.04, brass, 0, 0, 0, 16), Math.PI / 2, 0, 0).translateX(x).translateY(y).translateZ(0.12))
        g.add(rot(cy(r, r, 0.045, face, 0, 0, 0, 16), Math.PI / 2, 0, 0).translateX(x).translateY(y).translateZ(0.125))
        g.add(rot(bx(0.006, r * 0.8, 0.004, M(PAL.ink), x, y - r * 0.1, 0.152), 0, 0, 0.7))
      }
      g.add(bx(0.74, 0.05, 0.26, brass, 0, 1.05, 0))
      return g
    }),
})

// ---------------------------------------------------------------------------
// ch08_sandbag: a ballast sack of sand (on its hook or on the floor)
// ---------------------------------------------------------------------------

registerProp('ch08_sandbag', {
  solid: false,
  build: (ctx) => {
    const hung = bool(ctx, 'hung', true)
    return cachedBuild(`ch08_sandbag|${hung}`, () => {
      const g = new THREE.Group()
      const burlap = M('#b89a68')
      const z = hung ? WALL_Z + 0.2 : 0
      const y = hung ? 0.55 : 0.22
      g.add(ball(0.2, 0.26, 0.18, burlap, 0, y, z, 12))
      g.add(cy(0.06, 0.09, 0.12, M('#9a7c4a'), 0, y + 0.22, z, 8))
      g.add(torus(0.07, 0.015, M(PAL.rope), 0, y + 0.3, z, 4, 10))
      if (hung) {
        g.add(rod([0, y + 0.34, z], [0, 1.25, WALL_Z + 0.05], 0.012, 0.012, M(PAL.rope), 4))
        g.add(bx(0.06, 0.12, 0.06, M(PAL.ironDark), 0, 1.22, WALL_Z + 0.03))
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch08_acidfire: low, bluish, caustic flames (the boiler fire)
// ---------------------------------------------------------------------------

registerProp('ch08_acidfire', {
  solid: false,
  light: { color: '#6ad8ff', intensity: 2.6, distance: 5, y: 0.4, flicker: true },
  build: (ctx) => {
    const g = new THREE.Group()
    const r = seeded('acid' + variant(ctx, 3))
    g.add(decal(1.1, 1.1, additive('#2ad0c0', 0.9, 0.5), 0.015, true))
    const flames: THREE.Mesh[] = []
    for (let i = 0; i < 7; i++) {
      const a = r() * Math.PI * 2
      const d = r() * 0.35
      const f = cn(0.07 + r() * 0.05, 0.25 + r() * 0.25, additive(i % 2 ? '#5ae6ff' : '#9af0d0', 2.4, 0.85, null, true), Math.cos(a) * d, 0, Math.sin(a) * d, 6)
      f.userData.phase = r() * 10
      f.userData.base = f.scale.y
      keep(f)
      g.add(f)
      flames.push(f)
    }
    fx(g)
    g.userData.acid = flames
    return g
  },
  animate: (obj, t) => {
    const fl = obj.userData.acid as THREE.Mesh[] | undefined
    if (!fl) return
    for (const f of fl) {
      const p = Number(f.userData.phase) || 0
      const b = Number(f.userData.base) || 0.3
      f.scale.y = b * (0.75 + 0.35 * Math.abs(Math.sin(t * 9 + p)))
      f.rotation.y = t * 2 + p
    }
  },
})

// ---------------------------------------------------------------------------
// ch08_jar: a heavy glass jar with green acid and a violet Spira crystal
// ---------------------------------------------------------------------------

registerProp('ch08_jar', {
  solid: true,
  light: { color: '#a070ff', intensity: 0.9, distance: 2.6, y: 0.3 },
  build: () =>
    cachedBuild('ch08_jar', () => {
      const g = new THREE.Group()
      g.add(cy(0.17, 0.17, 0.42, M('#b8e8c8', { transparent: true, opacity: 0.4 }), 0, 0, 0, 14))
      g.add(cy(0.15, 0.15, 0.3, M('#7ad86a', { transparent: true, opacity: 0.55 }), 0, 0.02, 0, 14))
      g.add(cy(0.18, 0.18, 0.05, M(PAL.brass), 0, 0.42, 0, 14))
      g.add(cn(0.05, 0.16, glowMat(PAL.spira, 3), 0, 0.03, 0, 6))
      return g
    }),
})

// ---------------------------------------------------------------------------
// ch08_ants: the slow stream of glowing blue insects along the roots
// ---------------------------------------------------------------------------

registerProp('ch08_ants', {
  solid: false,
  castShadow: false,
  light: { color: '#4a9aff', intensity: 0.7, distance: 2.4, y: 0.1 },
  build: (ctx) => {
    const g = new THREE.Group()
    const len = num(ctx, 'len', 3)
    const n = Math.round(len * 14)
    const mat = additive('#4ab0ff', 2.8, 0.95)
    const geo = new THREE.SphereGeometry(0.022, 5, 4)
    const ants: THREE.Mesh[] = []
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mat)
      m.userData.u = i / n
      keep(m)
      g.add(m)
      ants.push(m)
    }
    fx(g)
    g.userData.ants = ants
    g.userData.len = len
    g.userData.seed = ctx.rand() * 10
    return g
  },
  animate: (obj, t) => {
    const ants = obj.userData.ants as THREE.Mesh[] | undefined
    if (!ants) return
    const len = Number(obj.userData.len) || 3
    const s = Number(obj.userData.seed) || 0
    for (const a of ants) {
      const u = ((Number(a.userData.u) + t * 0.035) % 1 + 1) % 1
      const x = (u - 0.5) * len
      a.position.set(x, 0.03, Math.sin(u * 9 + s) * 0.18 + Math.sin(u * 23 + s) * 0.04)
    }
  },
})

// ---------------------------------------------------------------------------
// ch08_stone: Yori's round pebble from the shore (lift with `y`)
// ---------------------------------------------------------------------------

registerProp('ch08_stone', {
  solid: false,
  build: (ctx) => {
    const glow = bool(ctx, 'glow')
    return cachedBuild(`ch08_stone|${glow}`, () => {
      const g = new THREE.Group()
      g.add(rock(3, 0.09, 0.07, 0.08, F('#8a8478'), 0, 0.0, 0))
      if (glow) g.add(ring(0.16, 0.012, glowMat('#e0a050', 2.4), 0, -0.02, 0, 4, 20))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch08_porthole: a round window in the cabin wall, streaming with rain
// ---------------------------------------------------------------------------

function portholeTex(night: boolean): THREE.CanvasTexture {
  return canvasTex(`ch08-porthole|${night}`, 128, 128, (g, w, h, r) => {
    const sky = g.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, night ? '#101826' : '#5a6a7a')
    sky.addColorStop(1, night ? '#1e2a3a' : '#8a98a6')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(220,235,255,0.45)'
    for (let i = 0; i < 26; i++) {
      const x = r() * w
      const y = r() * h
      g.lineWidth = 1 + r() * 1.5
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x - 3 + r() * 2, y + 10 + r() * 22)
      g.stroke()
    }
  })
}

registerProp('ch08_porthole', {
  solid: false,
  build: (ctx) => {
    const night = bool(ctx, 'night')
    return cachedBuild(`ch08_porthole|${night}`, () => {
      const g = new THREE.Group()
      const brass = M(PAL.brass)
      const y = 1.5
      g.add(torus(0.28, 0.05, brass, 0, y, WALL_Z + 0.03, 6, 24))
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), texMat(`ch08-porthole|${night}`, portholeTex(night)))
      glass.position.set(0, y, WALL_Z + 0.02)
      g.add(glass)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        g.add(ball(0.02, 0.02, 0.02, brass, Math.cos(a) * 0.28, y + Math.sin(a) * 0.28, WALL_Z + 0.07, 5))
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch08_bigroot: a buttress root of a giant tree, high enough to sit on
// ---------------------------------------------------------------------------

function rootShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(2.2, 0)
  s.quadraticCurveTo(0.8, 0.25, 0.3, 1.4)
  s.lineTo(0, 1.6)
  s.lineTo(0, 0)
  return s
}

registerProp('ch08_bigroot', {
  solid: true,
  footprint: [[1, 0]],
  build: (ctx) => {
    const v = variant(ctx, 2)
    return cachedBuild(`ch08_bigroot|${v}`, () => {
      const g = new THREE.Group()
      const bark = M('#6a5644')
      const fin = extrude('ch08root', rootShape, 0.36, bark, 10)
      fin.position.set(-0.4, 0, 0)
      g.add(fin)
      g.add(ball(0.35, 0.1, 0.3, M(PAL.moss), 0.6, 0.55, 0.12, 10))
      g.add(ball(0.22, 0.08, 0.2, M(PAL.moss), 1.2, 0.25, 0.12, 8))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch08_bunk: a narrow bunk with a grey blanket
// ---------------------------------------------------------------------------

registerProp('ch08_bunk', {
  solid: true,
  footprint: [[0, 1]],
  build: (ctx) => {
    const col = tint(ctx, '#6a6a72')
    return cachedBuild(`ch08_bunk|${col}`, () => {
      const g = new THREE.Group()
      const wood = M('#5a3424')
      g.add(bx(0.8, 0.3, 1.9, wood, 0, 0, 0.45))
      g.add(bx(0.74, 0.12, 1.82, M('#d8d0bc'), 0, 0.3, 0.45))
      g.add(bx(0.76, 0.1, 1.2, M(col), 0, 0.36, 0.75))
      g.add(ball(0.22, 0.08, 0.14, M('#efe8d8'), 0, 0.46, -0.3, 10))
      g.add(bx(0.84, 0.55, 0.06, wood, 0, 0, -0.5))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch08_cot: a folding chair on deck (Saburo's seat at the stern)
// ---------------------------------------------------------------------------

registerProp('ch08_chair', {
  solid: true,
  build: () =>
    cachedBuild('ch08_chair', () => {
      const g = new THREE.Group()
      const wood = M('#6a4a32')
      const canvas = M('#8a7a5a', { side: THREE.DoubleSide })
      for (const s of [-1, 1]) {
        g.add(rod([s * 0.25, 0, -0.25], [s * 0.25, 0.45, 0.2], 0.02, 0.02, wood, 5))
        g.add(rod([s * 0.25, 0, 0.2], [s * 0.25, 0.45, -0.25], 0.02, 0.02, wood, 5))
        g.add(rod([s * 0.25, 0.45, -0.25], [s * 0.25, 0.95, -0.35], 0.02, 0.02, wood, 5))
      }
      g.add(rot(plane(0.5, 0.5, canvas, 0, 0.42, -0.02), -Math.PI / 2 + 0.2, 0, 0))
      g.add(rot(plane(0.5, 0.45, canvas, 0, 0.72, -0.31), 0.2, 0, 0))
      return g
    }),
})

// ---------------------------------------------------------------------------
// ch08_far_pillar: a white pillar of Kitsune rising out of the far forest
// ---------------------------------------------------------------------------

registerProp('ch08_far_pillar', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const h = num(ctx, 'h', 14)
    const broken = bool(ctx, 'broken')
    const v = variant(ctx, 3)
    return cachedBuild(`ch08_far|${h}|${broken}|${v}`, () => {
      const r = seeded('farp' + v)
      const g = new THREE.Group()
      const white = M('#f3ecdc')
      const shadeM = M('#d8ccb4')
      g.add(cy(0.85, 1.0, h, white, 0, 0, 0, 16))
      for (let k = 1; k < 5; k++) g.add(cy(0.9, 0.9, 0.18, shadeM, 0, (h * k) / 5, 0, 16))
      if (!broken) {
        g.add(cy(1.2, 0.9, 0.5, shadeM, 0, h, 0, 16))
        g.add(bx(2.6, 0.45, 2.6, white, 0, h + 0.5, 0))
      } else {
        g.add(rot(cy(0.8, 0.85, 0.8, white, 0, 0, 0, 12), 0.35, 0, 0.2).translateY(h + 0.2))
      }
      // vines and moss swallowing the stone
      const vine = M('#2f6a34')
      for (let k = 0; k < 3; k++) {
        const pts: V3[] = []
        for (let i = 0; i <= 8; i++) {
          const t = i / 8
          const a = k * 2.1 + t * 5
          pts.push([Math.cos(a) * 0.95, t * h * (0.6 + r() * 0.3), Math.sin(a) * 0.95])
        }
        g.add(chain(pts, 0.08, 0.05, vine, 5, false))
      }
      g.add(ball(1.3, 0.5, 1.3, M(PAL.jungleDark), 0, 0.2, 0, 12))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch08_canopy: a cushion of jungle crowns seen from above (dawn flight)
// ---------------------------------------------------------------------------

registerProp('ch08_canopy', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const bio = bool(ctx, 'bio')
    return wrap(
      cachedBuild(`ch08_canopy|${v}|${bio}`, () => {
        const r = seeded('canopy' + v)
        const g = new THREE.Group()
        const greens = [M(PAL.jungleDark), M(PAL.jungle), M('#2a6a4a')]
        for (let i = 0; i < 6; i++) {
          const s = 1.2 + r() * 0.9
          g.add(ball(s, s * 0.55, s, greens[i % 3], (r() - 0.5) * 3, r() * 0.6, (r() - 0.5) * 3, 12))
        }
        if (bio) {
          const glow = glowMat('#7ff5c8', 1.6)
          for (let i = 0; i < 14; i++) g.add(ball(0.08, 0.05, 0.08, glow, (r() - 0.5) * 3.4, 0.9 + r() * 0.5, (r() - 0.5) * 3.4, 5))
        }
        return g
      }),
      ctx.rand() * Math.PI * 2,
      0.9 + ctx.rand() * 0.4,
    )
  },
})
