/**
 * Custom props for chapter 7 (the pirate camp and the rescue). Registered at
 * import time with the `ch07_` prefix. `runeGlyph()` is also used by chapter 9
 * (Tami's command glyph against the draugr).
 */
import * as THREE from 'three'
import { registerProp } from '../../../engine/props/registry'
import {
  PAL,
  M,
  F,
  bx,
  cy,
  cn,
  ball,
  rod,
  leaf,
  rock,
  plane,
  decal,
  finalize,
  cachedBuild,
  wrap,
  seeded,
  variant,
  shade,
  bool,
  num,
  str,
  tint,
  canvasTex,
  texMat,
  additive,
  flame,
  flicker,
  keep,
  fx,
  type V3,
} from '../../../engine/props/kit'

// ---------------------------------------------------------------------------
// ch07_fighter: a light pirate fighter on a timber cradle (hydrogen bag)
// ---------------------------------------------------------------------------

function envelopeTex(color: string): THREE.CanvasTexture {
  return canvasTex(`ch07-env|${color}`, 256, 128, (g, w, h, r) => {
    g.fillStyle = color
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 12; i++) {
      g.fillStyle = `rgba(0,0,0,${i % 2 ? 0.1 : 0.02})`
      g.fillRect((i * w) / 12, 0, w / 12, h)
    }
    // patches sewn over old holes
    for (let i = 0; i < 9; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(90,60,40,0.55)' : 'rgba(210,190,150,0.5)'
      const pw = 8 + r() * 18
      const ph = 6 + r() * 12
      g.fillRect(r() * w, r() * h, pw, ph)
    }
    g.fillStyle = 'rgba(40,20,20,0.75)'
    g.fillRect(0, h * 0.46, w, 7)
    // crude red teeth painted on the flank
    g.fillStyle = '#8a1f1f'
    for (const u of [0.18, 0.68]) {
      for (let k = 0; k < 6; k++) {
        g.beginPath()
        g.moveTo(u * w + k * 7, h * 0.55)
        g.lineTo(u * w + k * 7 + 3.5, h * 0.7)
        g.lineTo(u * w + k * 7 + 7, h * 0.55)
        g.fill()
      }
    }
  })
}

registerProp('ch07_fighter', {
  solid: false,
  build: (ctx) => {
    const color = tint(ctx, '#cdbb92')
    return cachedBuild(`ch07_fighter|${color}`, () => {
      const g = new THREE.Group()
      const timber = M('#5a4434')
      const timberD = M('#3e2e24')
      // cradle: two long beams on trestles
      for (const s of [-1, 1]) {
        g.add(bx(0.18, 0.16, 3.7, timber, s * 0.55, 0, 0))
        for (const z of [-1.4, 0, 1.4]) g.add(bx(0.22, 0.32, 0.22, timberD, s * 0.55, 0, z))
      }
      for (const z of [-1.5, -0.5, 0.5, 1.5]) g.add(bx(1.3, 0.1, 0.16, timber, 0, 0.3, z))
      // gondola: a slim skiff
      const hull = M('#4a3a30')
      g.add(bx(0.62, 0.36, 2.5, hull, 0, 0.42, -0.1))
      const bow = cn(0.31, 0.7, hull, 0, 0, 0, 4)
      bow.rotation.x = Math.PI / 2
      bow.rotation.y = Math.PI / 4
      bow.position.set(0, 0.6, 1.5)
      bow.scale.set(1, 1, 0.55)
      g.add(bow)
      g.add(bx(0.66, 0.05, 2.5, M('#2c221c'), 0, 0.78, -0.1))
      const rail = M('#6a5240')
      for (const s of [-1, 1]) g.add(rod([s * 0.33, 0.95, -1.3], [s * 0.33, 0.95, 1.1], 0.02, 0.02, rail, 5))
      // envelope
      const env = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 14), texMat(`ch07-env|${color}`, envelopeTex(color)))
      env.scale.set(0.82, 0.74, 2.15)
      env.position.set(0, 2.45, 0)
      env.castShadow = true
      g.add(env)
      // glossy highlight band (moonlight on the wet bag)
      g.add(ball(0.5, 0.06, 1.5, M(shade(color, 1.35)), 0.25, 3.12, -0.1, 12))
      // ropes from the bag to the gondola
      const rope = M(PAL.rope)
      for (const s of [-1, 1]) for (const z of [-1.1, 0, 1.0]) g.add(rod([s * 0.3, 0.9, z], [s * 0.66, 2.1, z * 1.2], 0.012, 0.012, rope, 4))
      // tail fins and a small pusher propeller
      const fin = M('#3a2a24')
      g.add(rot3(bx(0.04, 0.5, 0.5, fin, 0, 0, 0), 0, 0, 0, [0, 2.95, -2.0]))
      g.add(rot3(bx(0.04, 0.5, 0.5, fin, 0, 0, 0), 0, 0, Math.PI / 2, [0, 2.45, -2.0]))
      g.add(rod([0, 0.6, -1.35], [0, 0.6, -1.7], 0.05, 0.05, M(PAL.ironDark), 6))
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2
        g.add(leaf([0, 0.6, -1.72], [Math.cos(a) * 0.32, 0.6 + Math.sin(a) * 0.32, -1.72], 0.09, 0.02, M(PAL.woodLight)))
      }
      // loose mooring lines to stakes
      for (const [sx, sz] of [[-1, 1.6], [1, -1.4], [1, 1.2]] as const) {
        g.add(rod([sx * 0.4, 0.8, sz * 0.9], [sx * 1.1, 0.02, sz], 0.012, 0.012, rope, 4))
        g.add(cy(0.03, 0.03, 0.18, timberD, sx * 1.1, 0, sz, 5))
      }
      // a ragged pennant
      g.add(rod([0, 3.15, 1.6], [0, 3.75, 1.6], 0.015, 0.015, timberD, 4))
      g.add(bx(0.02, 0.18, 0.34, M('#2a1616'), 0, 3.55, 1.42))
      return g
    })
  },
})

/** Rotate a mesh and move it (helper for odd parts). */
function rot3<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, p: V3): T {
  o.rotation.set(x, y, z)
  o.position.set(p[0], p[1], p[2])
  return o
}

// ---------------------------------------------------------------------------
// ch07_wreck: the burning fighter (charred ribs, rags of the bag, flames)
// ---------------------------------------------------------------------------

registerProp('ch07_wreck', {
  solid: false,
  light: { color: '#ff7a2a', intensity: 4.2, distance: 9, y: 1.2, flicker: true },
  build: (ctx) => {
    const g = new THREE.Group()
    const r = seeded('ch07wreck' + variant(ctx, 2))
    const char = M('#1e1612')
    const charL = M('#3a2a20')
    for (const s of [-1, 1]) {
      g.add(bx(0.18, 0.14, 3.6, char, s * 0.55, 0, 0))
      for (const z of [-1.4, 0, 1.4]) g.add(bx(0.22, 0.28, 0.22, charL, s * 0.55, 0, z))
    }
    // collapsed gondola
    const hull = rot3(bx(0.6, 0.3, 2.3, char, 0, 0, 0), 0.08, 0.12, -0.25, [0.05, 0.3, 0])
    g.add(hull)
    // ribs of the burnt frame
    for (let i = 0; i < 6; i++) {
      const z = -1.6 + i * 0.62
      const h = 0.9 + r() * 1.1
      const lean = (r() - 0.5) * 0.7
      g.add(rod([-0.55, 0.3, z], [lean - 0.2, 0.3 + h, z + (r() - 0.5) * 0.3], 0.04, 0.025, i % 2 ? char : charL, 5))
      g.add(rod([0.55, 0.3, z], [lean + 0.25, 0.25 + h * 0.8, z + (r() - 0.5) * 0.3], 0.04, 0.025, char, 5))
    }
    // shreds of the envelope
    const rag = M('#2c2420', { side: THREE.DoubleSide })
    for (let i = 0; i < 5; i++) g.add(rot3(plane(0.6 + r() * 0.5, 0.35 + r() * 0.3, rag), -0.6 + r(), r() * 3, (r() - 0.5) * 0.8, [(r() - 0.5) * 1.2, 0.2 + r() * 0.8, -1.4 + i * 0.7]))
    // embers on the ground
    const ember = additive('#ff5a1a', 2.6, 0.9)
    for (let i = 0; i < 9; i++) g.add(ball(0.06 + r() * 0.08, 0.03, 0.06 + r() * 0.08, ember, (r() - 0.5) * 2.2, 0.03, (r() - 0.5) * 3.4, 6))
    const flames: THREE.Object3D[] = []
    const spots: [number, number, number, number][] = [
      [0, 0.45, 0, 3.4],
      [0.3, 0.4, -1.1, 2.6],
      [-0.35, 0.35, 1.0, 2.8],
      [0.5, 0.1, 1.5, 1.6],
      [-0.6, 0.1, -1.6, 1.8],
      [0.1, 0.6, 0.6, 2.2],
    ]
    for (const [x, y, z, s] of spots) {
      const f = flame(s, r() * 10)
      f.position.set(x, y, z)
      g.add(f)
      flames.push(f)
    }
    g.userData.flames = flames
    return finalize(g)
  },
  animate: (obj, t) => flicker(obj, t),
})

// ---------------------------------------------------------------------------
// ch07_leanto: a shelter of poles covered with spruce branches
// ---------------------------------------------------------------------------

registerProp('ch07_leanto', {
  solid: true,
  footprint: [[1, 0]],
  build: (ctx) => {
    const v = variant(ctx, 3)
    return cachedBuild(`ch07_leanto|${v}`, () => {
      const r = seeded('leanto' + v)
      const g = new THREE.Group()
      const pole = M(PAL.woodDark)
      const cx = 0.5
      for (const x of [cx - 0.95, cx + 0.95]) {
        g.add(rod([x, 0, 0.42], [x, 1.45, 0.42], 0.05, 0.045, pole, 6))
        g.add(rod([x, 0, -0.5], [x, 0.35, -0.5], 0.045, 0.045, pole, 6))
      }
      g.add(rod([cx - 1.05, 1.45, 0.42], [cx + 1.05, 1.45, 0.42], 0.05, 0.05, pole, 6))
      // slanted roof of boughs
      const greens = [M('#2e5a3e'), M('#244a34'), M('#3a6a46')]
      for (let i = 0; i < 9; i++) {
        const x = cx - 0.95 + i * 0.24 + (r() - 0.5) * 0.08
        g.add(leaf([x, 1.5, 0.5], [x + (r() - 0.5) * 0.15, 0.25, -0.62], 0.34, 0.08, greens[i % 3]))
      }
      for (let i = 0; i < 5; i++) {
        const x = cx - 0.8 + i * 0.4
        g.add(leaf([x, 1.2, 0.2], [x + 0.18, 0.7, -0.3], 0.28, 0.07, greens[(i + 1) % 3]))
      }
      // bedding of branches and a blanket on the ground
      g.add(bx(1.7, 0.05, 0.75, M('#3a3024'), cx, 0, -0.05))
      g.add(bx(0.7, 0.04, 0.5, M('#5a3a3a'), cx - 0.35, 0.05, -0.05))
      g.add(rot3(bx(0.4, 0.12, 0.25, M('#4a4034'), 0, 0, 0), 0, 0.3, 0, [cx + 0.55, 0.05, -0.2]))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// runeGlyph(): Tami's golden glyph — five thin golden lines and angular runes,
// no circles, no arcs (shared with chapter 9).
// ---------------------------------------------------------------------------

const RUNES: [number, number][][] = [
  // simple futhark-like strokes in a unit cell (-1..1)
  [[0, -1], [0, 1], [0, -0.3], [0.7, -0.9]],
  [[0, -1], [0, 1], [0, -0.6], [0.6, -0.1], [0, 0.3]],
  [[-0.6, -1], [0, 1], [0.6, -1]],
  [[0, -1], [0, 1], [-0.6, -0.4], [0.6, 0.2]],
  [[0, 1], [0, -1], [0.6, -0.4], [0, 0.1], [0.6, 0.6]],
  [[-0.6, 1], [0, -1], [0.6, 1], [-0.3, 0.2], [0.3, 0.2]],
]

export function runeGlyphTexture(): THREE.CanvasTexture {
  return canvasTex('ch07-runeglyph', 512, 512, (g, w, h, r) => {
    g.translate(w / 2, h / 2)
    g.strokeStyle = '#ffffff'
    g.fillStyle = '#ffffff'
    g.lineCap = 'square'
    g.lineJoin = 'miter'
    g.shadowColor = '#ffffff'
    g.shadowBlur = 14
    // outer straight-edged decagon (never a circle)
    const R = w * 0.46
    g.lineWidth = 7
    g.beginPath()
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 10
      if (i === 0) g.moveTo(Math.cos(a) * R, Math.sin(a) * R)
      else g.lineTo(Math.cos(a) * R, Math.sin(a) * R)
    }
    g.stroke()
    g.lineWidth = 3
    g.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + Math.PI / 5 + (i * 2 * Math.PI) / 5
      const k = R * 0.86
      if (i === 0) g.moveTo(Math.cos(a) * k, Math.sin(a) * k)
      else g.lineTo(Math.cos(a) * k, Math.sin(a) * k)
    }
    g.stroke()
    // the five thin lines: a pentagram
    const P = R * 0.8
    g.lineWidth = 6
    g.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
      if (i === 0) g.moveTo(Math.cos(a) * P, Math.sin(a) * P)
      else g.lineTo(Math.cos(a) * P, Math.sin(a) * P)
    }
    g.stroke()
    // angular runes between the frames
    g.lineWidth = 4
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + Math.PI / 10 + (i * 2 * Math.PI) / 10
      const rr = R * 0.93
      g.save()
      g.translate(Math.cos(a) * rr * 0.97, Math.sin(a) * rr * 0.97)
      g.rotate(a + Math.PI / 2)
      const rune = RUNES[Math.floor(r() * RUNES.length)]
      g.beginPath()
      const s = 13
      g.moveTo(rune[0][0] * s * 0.6, rune[0][1] * s)
      g.lineTo(rune[1][0] * s * 0.6, rune[1][1] * s)
      for (let k = 2; k + 1 < rune.length; k += 2) {
        g.moveTo(rune[k][0] * s * 0.6, rune[k][1] * s)
        g.lineTo(rune[k + 1][0] * s * 0.6, rune[k + 1][1] * s)
      }
      g.stroke()
      g.restore()
    }
    // straight cuts at the five points
    g.lineWidth = 5
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
      g.save()
      g.rotate(a)
      g.beginPath()
      g.moveTo(P - 16, -16)
      g.lineTo(P + 6, 0)
      g.lineTo(P - 16, 16)
      g.stroke()
      g.restore()
    }
    // central diamond
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(0, -22)
    g.lineTo(18, 0)
    g.lineTo(0, 22)
    g.lineTo(-18, 0)
    g.closePath()
    g.stroke()
  })
}

/** A standing (vertical) rune glyph of the given colour and size, faces +Z. */
export function runeGlyph(color: string, size: number, key: string): THREE.Group {
  const g = new THREE.Group()
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(color, 2.6, 0.95, runeGlyphTexture(), true))
  disc.scale.set(size, size, 1)
  disc.position.set(0, size * 0.5 + 0.35, 0)
  keep(disc)
  g.add(disc)
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(color, 0.9, 0.35, runeGlyphTexture(), true))
  halo.scale.set(size * 1.25, size * 1.25, 1)
  halo.position.set(0, size * 0.5 + 0.35, -0.02)
  keep(halo)
  g.add(halo)
  fx(g)
  g.userData.discs = [disc, halo]
  g.userData.key = key
  return g
}

export function animateRuneGlyph(obj: THREE.Object3D, t: number): void {
  const discs = obj.userData.discs as THREE.Mesh[] | undefined
  if (!discs) return
  const [d, h] = discs
  const pulse = 0.8 + 0.2 * Math.sin(t * 5.3) + 0.06 * Math.sin(t * 17)
  ;(d.material as THREE.MeshBasicMaterial).opacity = 0.9 * pulse
  ;(h.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.15 * Math.sin(t * 3.1)
  d.rotation.z = Math.sin(t * 0.7) * 0.05
  h.rotation.z = -t * 0.15
}

registerProp('ch07_rune_shield', {
  solid: false,
  light: { color: '#ffc85a', intensity: 4, distance: 8, y: 1.4 },
  build: (ctx) => runeGlyph(tint(ctx, '#ffc85a'), num(ctx, 'size', 2.4), 'shield'),
  animate: (obj, t) => animateRuneGlyph(obj, t),
})

// ---------------------------------------------------------------------------
// ch07_ramp: the Itaka's boarding ramp
// ---------------------------------------------------------------------------

registerProp('ch07_ramp', {
  solid: false,
  build: () =>
    cachedBuild('ch07_ramp', () => {
      const g = new THREE.Group()
      const steel = M('#3e434c')
      const plank = M('#5a4a3c')
      const L = 2.2
      const tilt = Math.atan2(1.15, L)
      const ramp = new THREE.Group()
      ramp.add(bx(0.9, 0.06, L, steel, 0, 0, 0))
      for (let i = 0; i < 9; i++) ramp.add(bx(0.86, 0.04, 0.08, plank, 0, 0.06, -L / 2 + 0.15 + i * 0.24))
      for (const s of [-1, 1]) ramp.add(bx(0.05, 0.12, L, M('#262a31'), s * 0.45, 0.02, 0))
      ramp.rotation.x = -tilt
      ramp.position.set(0, 0.55, 0)
      g.add(ramp)
      for (const s of [-1, 1]) g.add(rod([s * 0.46, 1.6, -L / 2], [s * 0.46, 0.62, L / 2], 0.015, 0.015, M(PAL.rope), 4))
      return g
    }),
})

// ---------------------------------------------------------------------------
// small camp props: jug, stump with the revolver, twigs, card blanket, crater
// ---------------------------------------------------------------------------

registerProp('ch07_jug', {
  solid: false,
  build: (ctx) => {
    const spilled = bool(ctx, 'spilled')
    return cachedBuild(`ch07_jug|${spilled}`, () => {
      const g = new THREE.Group()
      const clay = M('#9a5a3a')
      const jug = new THREE.Group()
      jug.add(ball(0.16, 0.18, 0.16, clay, 0, 0.18, 0, 12))
      jug.add(cy(0.07, 0.1, 0.12, clay, 0, 0.32, 0, 10))
      jug.add(cy(0.08, 0.07, 0.03, M(shade('#9a5a3a', 0.8)), 0, 0.44, 0, 10))
      if (spilled) {
        jug.rotation.z = Math.PI / 2
        jug.position.set(0.1, 0.0, 0)
        g.add(decal(0.9, 0.6, additive('#5a7a8a', 0.6, 0.45), 0.01, true))
      }
      g.add(jug)
      return g
    })
  },
})

registerProp('ch07_stumpgun', {
  solid: true,
  build: (ctx) => {
    const gun = bool(ctx, 'gun', true)
    return cachedBuild(`ch07_stumpgun|${gun}`, () => {
      const g = new THREE.Group()
      const bark = M(PAL.bark)
      g.add(cy(0.3, 0.36, 0.42, bark, 0, 0, 0, 14))
      g.add(cy(0.28, 0.28, 0.02, M('#cfa46e'), 0, 0.415, 0, 14))
      // bottle and fish bones
      g.add(cy(0.05, 0.06, 0.2, M('#2f5a3a', { transparent: true, opacity: 0.85 }), -0.14, 0.43, 0.06, 8))
      g.add(cy(0.02, 0.02, 0.07, M('#2f5a3a'), -0.14, 0.63, 0.06, 6))
      const bone = M(PAL.bone)
      g.add(rod([0.02, 0.44, -0.16], [0.2, 0.44, -0.08], 0.008, 0.008, bone, 4))
      for (let i = 0; i < 4; i++) g.add(rod([0.05 + i * 0.04, 0.44, -0.15 + i * 0.02], [0.08 + i * 0.04, 0.44, -0.22 + i * 0.02], 0.004, 0.004, bone, 3))
      if (gun) {
        const steel = M('#3a3d44')
        const grip = M('#5a3a24')
        g.add(bx(0.24, 0.035, 0.05, steel, 0.06, 0.435, 0.1))
        g.add(cy(0.035, 0.035, 0.06, steel, 0, 0.44, 0.1, 8).rotateZ(Math.PI / 2))
        g.add(rot3(bx(0.05, 0.03, 0.12, grip, 0, 0, 0), 0, 0.5, 0, [-0.08, 0.435, 0.14]))
      }
      return g
    })
  },
})

registerProp('ch07_twigs', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const inner = cachedBuild(`ch07_twigs|${v}`, () => {
      const r = seeded('twigs' + v)
      const g = new THREE.Group()
      const dry = [M('#8a6a44'), M('#a8885a'), M('#6a5034')]
      for (let i = 0; i < 9; i++) {
        const a = r() * Math.PI
        const L = 0.25 + r() * 0.3
        const x = (r() - 0.5) * 0.6
        const z = (r() - 0.5) * 0.6
        g.add(rod([x - Math.cos(a) * L * 0.5, 0.025, z - Math.sin(a) * L * 0.5], [x + Math.cos(a) * L * 0.5, 0.03, z + Math.sin(a) * L * 0.5], 0.014, 0.01, dry[i % 3], 4))
      }
      // a few dead leaves
      const leafM = M('#9a6a3a')
      for (let i = 0; i < 5; i++) g.add(ball(0.05, 0.008, 0.035, leafM, (r() - 0.5) * 0.6, 0.012, (r() - 0.5) * 0.6, 5))
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

registerProp('ch07_cards', {
  solid: false,
  castShadow: false,
  build: () =>
    cachedBuild('ch07_cards', () => {
      const g = new THREE.Group()
      g.add(bx(1.0, 0.02, 0.7, M('#5a3434'), 0, 0, 0))
      g.add(bx(0.96, 0.021, 0.04, M('#c8a85a'), 0, 0, 0.3))
      const r = seeded('cards')
      const card = M('#efe6d0')
      const back = M('#6a2a2a')
      for (let i = 0; i < 9; i++) {
        const c = bx(0.07, 0.006, 0.1, i % 3 ? card : back, (r() - 0.5) * 0.7, 0.022, (r() - 0.5) * 0.45)
        c.rotation.y = r() * 3
        g.add(c)
      }
      // bones instead of coins
      const bone = M(PAL.bone)
      for (let i = 0; i < 7; i++) g.add(rod([(r() - 0.5) * 0.6, 0.03, (r() - 0.5) * 0.4], [(r() - 0.5) * 0.6, 0.03, (r() - 0.5) * 0.4], 0.012, 0.012, bone, 4))
      g.add(cy(0.04, 0.05, 0.16, M('#3a5a3a'), 0.36, 0.02, -0.22, 8))
      return g
    }),
})

registerProp('ch07_crater', {
  solid: false,
  build: (ctx) => {
    const v = variant(ctx, 3)
    const inner = cachedBuild(`ch07_crater|${v}`, () => {
      const r = seeded('crater' + v)
      const g = new THREE.Group()
      g.add(decal(2.4, 2.4, M('#1c1610'), 0.012, true))
      g.add(decal(1.5, 1.5, M('#100c08'), 0.014, true))
      const clod = F('#3a2c20')
      const stone = F(PAL.stoneDark)
      for (let i = 0; i < 12; i++) {
        const a = r() * Math.PI * 2
        const d = 0.8 + r() * 0.6
        g.add(rock(i, 0.08 + r() * 0.12, 0.06 + r() * 0.08, 0.08 + r() * 0.1, i % 3 ? clod : stone, Math.cos(a) * d, 0, Math.sin(a) * d))
      }
      // torn roots sticking out
      const root = M(PAL.barkDark)
      for (let i = 0; i < 4; i++) {
        const a = r() * Math.PI * 2
        g.add(rod([Math.cos(a) * 0.6, 0.0, Math.sin(a) * 0.6], [Math.cos(a) * 0.95, 0.35 + r() * 0.2, Math.sin(a) * 0.95], 0.04, 0.015, root, 5))
      }
      return g
    })
    return wrap(inner, ctx.rand() * Math.PI * 2)
  },
})

// ---------------------------------------------------------------------------
// ch07_pile: what is left of Korteg's cargo hull (planks, ribs, a rudder)
// ---------------------------------------------------------------------------

registerProp('ch07_pile', {
  solid: true,
  footprint: [[1, 0]],
  build: (ctx) => {
    const v = variant(ctx, 2)
    return cachedBuild(`ch07_pile|${v}`, () => {
      const r = seeded('pile' + v)
      const g = new THREE.Group()
      const wood = [M('#7a4a32'), M('#5a3a2a'), M('#8a6a4a')]
      for (let i = 0; i < 10; i++) {
        const p = bx(1.6 + r() * 0.5, 0.06, 0.22, wood[i % 3], 0.5 + (r() - 0.5) * 0.3, 0.06 * (i % 5), (r() - 0.5) * 0.6)
        p.rotation.y = (r() - 0.5) * 0.6
        p.rotation.z = (r() - 0.5) * 0.1
        g.add(p)
      }
      // a curved rib leaning on the pile
      const rib: V3[] = [[-0.2, 0, -0.3], [0.1, 0.7, -0.35], [0.6, 1.05, -0.3], [1.1, 0.9, -0.28]]
      for (let i = 0; i < rib.length - 1; i++) g.add(rod(rib[i], rib[i + 1], 0.07, 0.06, wood[1], 6))
      // the rudder with Korteg's guild stripe
      const rud = bx(0.06, 0.8, 0.55, M('#7a4a32'), 1.15, 0.0, 0.25)
      rud.rotation.z = 0.35
      g.add(rud)
      g.add(bx(0.07, 0.12, 0.56, M('#a8323e'), 1.0, 0.45, 0.25).rotateZ(0.35))
      return g
    })
  },
})

// ---------------------------------------------------------------------------
// ch07_star: Mother's Hair — a glowing marker high above the trees
// ---------------------------------------------------------------------------

registerProp('ch07_star', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const g = new THREE.Group()
    const col = str(ctx, 'color', '#e8f0ff')
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), additive(col, 3.2, 1, null, true))
    core.position.y = num(ctx, 'h', 9)
    keep(core)
    g.add(core)
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(col, 1.4, 0.5, null, true))
    halo.position.y = core.position.y
    halo.scale.setScalar(0.7)
    keep(halo)
    g.add(halo)
    fx(g)
    g.userData.star = [core, halo]
    return g
  },
  animate: (obj, t) => {
    const s = obj.userData.star as THREE.Mesh[] | undefined
    if (!s) return
    s[1].scale.setScalar(0.6 + 0.12 * Math.sin(t * 2.1))
    s[1].lookAt(s[1].position.clone().add(new THREE.Vector3(1, 0.8, 1)))
  },
})
