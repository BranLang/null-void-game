/**
 * Custom props for Renn's manor (also used by ch10 and ch11): the hewn stone
 * fireplace, the cracked leather couch, glass vitrines, the vault door, black
 * veins climbing walls, the "centre" of the swarm and the Approacher that
 * drives off when it becomes visible.
 */
import * as THREE from 'three'
import { registerProp, getProp, type PropContext } from '../../../engine/props/registry'
import {
  PAL,
  M,
  F,
  bx,
  cy,
  ball,
  blob,
  rod,
  torus,
  plane,
  rot,
  keep,
  fx,
  flame,
  flicker,
  finalize,
  bool,
  num,
  str,
  tint,
  shade,
  seeded,
  rock,
  canvasTex,
  uniqueGlow,
  additive,
  glowMat,
  WALL_Z,
} from '../../../engine/props/kit'

// ---------------------------------------------------------------------------------- fireplace
registerProp('ch12_fireplace', {
  solid: true,
  footprint: [
    [-1, 0],
    [1, 0],
  ],
  light: (ctx) => (bool(ctx, 'lit') ? { color: '#ff9a4a', intensity: 3.2, distance: 8, y: 0.7, flicker: true } : null),
  build: (ctx) => {
    const lit = bool(ctx, 'lit')
    const g = new THREE.Group()
    const stone = F('#8f877b')
    const stoneD = F('#6c655c')
    const stoneL = F('#b2aa9c')
    const soot = M('#1c1714')
    const z = WALL_Z
    // chimney breast against the wall
    g.add(bx(2.7, 3.4, 0.5, stoneD, 0, 0, z + 0.25))
    // hewn blocks of the surround
    const r = seeded('fireplace')
    for (let row = 0; row < 5; row++) {
      for (const s of [-1, 1]) {
        const w = 0.42 + r() * 0.08
        g.add(bx(w, 0.3, 0.62, row % 2 ? stone : stoneL, s * (1.02 + r() * 0.04), row * 0.31, z + 0.42))
      }
    }
    // lintel and mantel
    g.add(bx(2.6, 0.34, 0.68, stoneL, 0, 1.55, z + 0.44))
    g.add(bx(2.9, 0.12, 0.86, stone, 0, 1.89, z + 0.48))
    // firebox
    g.add(bx(1.6, 1.5, 0.08, soot, 0, 0.05, z + 0.12))
    g.add(bx(1.7, 0.08, 0.7, stoneD, 0, 0, z + 0.45))
    // andirons and logs
    const iron = M(PAL.ironDark)
    for (const x of [-0.45, 0.45]) g.add(bx(0.06, 0.32, 0.5, iron, x, 0.06, z + 0.5))
    const bark = M(PAL.bark)
    const charred = M('#2a1d18')
    g.add(rot(cy(0.1, 0.1, 1.0, lit ? bark : charred, 0, 0.18, z + 0.48, 8), 0, 0, Math.PI / 2))
    g.add(rot(cy(0.09, 0.09, 0.9, charred, 0.05, 0.3, z + 0.38, 8), 0.2, 0.4, Math.PI / 2))
    if (!lit) {
      // cold ash
      g.add(blob(0.55, 0.06, 0.25, M('#6f6a66'), 0, 0.08, z + 0.5))
    }
    const merged = finalize(g)
    if (lit) {
      const flames: THREE.Object3D[] = []
      merged.add(ball(0.42, 0.07, 0.2, glowMat(PAL.ember, 2.6), 0, 0.16, z + 0.5, 10))
      for (const [x, s] of [
        [0, 2.6],
        [-0.28, 1.8],
        [0.3, 2.0],
        [0.12, 1.4],
      ] as const) {
        const f = flame(s, ctx.rand() * 10)
        f.position.set(x, 0.18, z + 0.5)
        merged.add(f)
        flames.push(f)
      }
      merged.userData.flames = flames
    }
    return merged
  },
  animate: (obj, t) => flicker(obj, t),
})

// ---------------------------------------------------------------------------------- couch
registerProp('ch12_couch', {
  solid: true,
  footprint: [
    [-1, 0],
    [1, 0],
  ],
  build: (ctx) => {
    const leather = tint(ctx, '#6a3a26')
    const g = new THREE.Group()
    const L = M(leather)
    const Ld = M(shade(leather, 0.75))
    const Ll = M(shade(leather, 1.18))
    const wood = M(PAL.woodDark)
    // base and seat cushions
    g.add(bx(2.5, 0.28, 0.9, Ld, 0, 0.08))
    for (const x of [-0.8, 0, 0.8]) g.add(bx(0.78, 0.16, 0.74, x === 0 ? Ll : L, x, 0.36, 0.06))
    // back and arms
    g.add(bx(2.5, 0.6, 0.24, L, 0, 0.36, -0.36))
    for (const x of [-0.8, 0, 0.8]) g.add(bx(0.74, 0.46, 0.08, Ll, x, 0.48, -0.22))
    for (const s of [-1, 1]) {
      g.add(bx(0.24, 0.5, 0.9, Ld, s * 1.25, 0.28))
      g.add(rot(cy(0.14, 0.14, 0.9, L, s * 1.25, 0.78, -0.45, 12), Math.PI / 2, 0, 0))
    }
    for (const x of [-1.15, 1.15]) for (const z of [-0.36, 0.36]) g.add(cy(0.05, 0.04, 0.09, wood, x, 0, z, 8))
    // cracks: fine pale lines on the leather
    const crack = M(shade(leather, 1.45))
    const r = seeded('couch-cracks')
    for (let i = 0; i < 14; i++) {
      const x = -1.1 + r() * 2.2
      const piece = bx(0.12 + r() * 0.16, 0.012, 0.012, crack, x, 0.52 + r() * 0.04, -0.2 + r() * 0.5)
      piece.rotation.y = r() * Math.PI
      g.add(piece)
    }
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------------- vitrine
registerProp('ch12_vitrine', {
  solid: true,
  build: (ctx) => {
    const item = str(ctx, 'item', 'compass')
    const g = new THREE.Group()
    const wood = M(PAL.woodDark)
    const velvet = M('#5a1f2e')
    for (const x of [-0.3, 0.3]) for (const z of [-0.22, 0.22]) g.add(cy(0.03, 0.025, 0.72, wood, x, 0, z, 8))
    g.add(bx(0.72, 0.08, 0.56, wood, 0, 0.72))
    g.add(bx(0.62, 0.02, 0.46, velvet, 0, 0.8))
    if (item === 'sword') {
      g.add(rot(bx(0.05, 0.012, 0.5, M('#16141a'), 0, 0.83, 0.02), 0, 0.5, 0))
      g.add(rot(bx(0.16, 0.03, 0.03, M(PAL.brass), -0.1, 0.83, 0.18), 0, 0.5, 0))
    } else if (item === 'map') {
      g.add(rot(bx(0.42, 0.006, 0.3, M('#d8c8a0'), 0, 0.82, 0), 0, 0.2, 0))
      g.add(rot(bx(0.2, 0.008, 0.006, M('#7a3020'), 0.02, 0.825, 0.02), 0, 0.9, 0))
    } else {
      g.add(cy(0.12, 0.12, 0.04, M(PAL.brass), 0, 0.81, 0, 18))
      g.add(cy(0.1, 0.1, 0.01, M(PAL.cream), 0, 0.85, 0, 18))
      g.add(rot(bx(0.16, 0.006, 0.02, glowMat('#9fe8ff', 1.6), 0, 0.862, 0), 0, 0.8, 0))
    }
    // glass case
    const glass = new THREE.MeshToonMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.18, depthWrite: false })
    glass.userData.keepTransparent = true
    const box = bx(0.66, 0.42, 0.5, glass, 0, 0.8)
    box.castShadow = false
    g.add(box)
    g.add(bx(0.7, 0.03, 0.54, wood, 0, 1.22))
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------------- vault door
registerProp('ch12_vault_door', {
  solid: true,
  build: (ctx) => {
    const open = bool(ctx, 'open')
    const g = new THREE.Group()
    const steel = M('#59616c')
    const steelD = M('#3a4048')
    const brass = M(PAL.brass)
    // frame set into the wall behind
    g.add(bx(1.5, 2.3, 0.3, steelD, 0, 0, 0.18))
    const hole = cy(0.82, 0.82, 0.05, M('#07080b'), 0, 0, 0, 28)
    hole.rotation.x = Math.PI / 2
    hole.position.set(0, 1.08, 0.34)
    g.add(hole)
    const merged = finalize(g)
    // the door leaf: thick disc with a wheel
    const leaf = new THREE.Group()
    const disc = cy(0.78, 0.78, 0.22, steel, 0, 0, 0, 28)
    disc.rotation.x = Math.PI / 2
    leaf.add(disc)
    const rim = torus(0.78, 0.04, steelD, 0, 0, 0.11, 6, 32)
    leaf.add(rim)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      leaf.add(ball(0.03, 0.03, 0.02, brass, Math.cos(a) * 0.66, Math.sin(a) * 0.66, 0.12, 6))
    }
    const wheel = new THREE.Group()
    wheel.add(torus(0.3, 0.03, brass, 0, 0, 0, 6, 24))
    for (let i = 0; i < 4; i++) {
      const spoke = bx(0.04, 0.6, 0.03, brass, 0, -0.3, 0)
      const piv = new THREE.Group()
      piv.add(spoke)
      piv.rotation.z = (i / 4) * Math.PI
      wheel.add(piv)
    }
    wheel.add(cy(0.07, 0.07, 0.08, brass, 0, -0.04, 0, 12).rotateX(Math.PI / 2))
    wheel.position.z = 0.2
    keep(wheel)
    leaf.add(wheel)
    finalize(leaf)
    keep(leaf)
    const hinge = new THREE.Group()
    hinge.position.set(0.82, 1.08, 0.44)
    leaf.position.set(-0.82, 0, 0)
    hinge.add(leaf)
    hinge.rotation.y = open ? 1.6 : 0
    keep(hinge)
    merged.add(hinge)
    merged.userData.wheel = wheel
    merged.userData.spin = bool(ctx, 'spin')
    return merged
  },
  animate: (obj, _t, dt) => {
    if (!obj.userData.spin) return
    const w = obj.userData.wheel as THREE.Object3D | undefined
    if (w) w.rotation.z += dt * 2.4
  },
})

// ---------------------------------------------------------------------------------- veins on walls
function wallVeinsTex(seed: number): THREE.CanvasTexture {
  return canvasTex(`ch12-wallveins-${seed}`, 256, 256, (g, w, h, r) => {
    g.clearRect(0, 0, w, h)
    g.strokeStyle = '#07050a'
    g.lineCap = 'round'
    const branch = (x: number, y: number, a: number, len: number, width: number, depth: number): void => {
      let cx = x
      let cyy = y
      const steps = 6 + Math.floor(r() * 4)
      for (let i = 0; i < steps; i++) {
        a += (r() - 0.5) * 0.7
        const nx = cx + Math.cos(a) * (len / steps)
        const ny = cyy + Math.sin(a) * (len / steps)
        g.lineWidth = Math.max(0.6, width * (1 - i / steps))
        g.beginPath()
        g.moveTo(cx, cyy)
        g.lineTo(nx, ny)
        g.stroke()
        cx = nx
        cyy = ny
        if (depth > 0 && r() < 0.35) branch(cx, cyy, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6), len * 0.5, width * 0.6, depth - 1)
      }
    }
    for (let i = 0; i < 7; i++) branch(w / 2 + (r() - 0.5) * 40, h, -Math.PI / 2 + (r() - 0.5) * 1.6, 150 + r() * 80, 7, 3)
    for (let i = 0; i < 4; i++) branch(r() * w, h * 0.7 + r() * 60, -Math.PI / 2 + (r() - 0.5) * 2.4, 90, 4, 2)
  })
}

/** Black veins climbing a wall (back at the cell edge). params: size, grow (animate on show). */
registerProp('ch12_wallveins', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const size = num(ctx, 'size', 2.4)
    const v = Math.floor(ctx.rand() * 3)
    const m = new THREE.MeshBasicMaterial({ map: wallVeinsTex(v), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    m.userData.fx = true
    const root = new THREE.Group()
    const inner = new THREE.Group()
    const p = plane(size, size, m, 0, size / 2, WALL_Z + 0.02)
    inner.add(fx(p))
    keep(inner)
    root.add(inner)
    root.userData.inner = inner
    root.userData.grow = bool(ctx, 'grow')
    if (root.userData.grow) inner.scale.set(1, 0.01, 1)
    return root
  },
  animate: (obj, t) => {
    if (!obj.userData.grow) return
    const u = obj.userData
    if (u.t0 === undefined) u.t0 = t
    const k = Math.min(1, (t - (u.t0 as number)) / 2.2)
    const e = 1 - Math.pow(1 - k, 3)
    ;(u.inner as THREE.Object3D).scale.set(0.6 + 0.4 * e, Math.max(0.01, e), 1)
  },
})

// ---------------------------------------------------------------------------------- the centre
/** The main mass of the swarm. params: smile (a mouth spreads), frozen (rimed with frost). */
registerProp('ch12_centre', {
  solid: false,
  castShadow: false,
  light: (ctx) => (bool(ctx, 'smile') ? { color: '#b77dff', intensity: 1.6, distance: 4, y: 1.6 } : null),
  build: (ctx) => {
    const smile = bool(ctx, 'smile')
    const frozen = bool(ctx, 'frozen')
    const root = new THREE.Group()
    const body = new THREE.Group()
    const dark = new THREE.MeshBasicMaterial({ color: frozen ? '#1b2230' : '#050407', transparent: true, opacity: 0.86 })
    const dark2 = new THREE.MeshBasicMaterial({ color: frozen ? '#2a3446' : '#0b0810', transparent: true, opacity: 0.6, depthWrite: false })
    const r = seeded('centre')
    const shells: THREE.Object3D[] = []
    for (let i = 0; i < 7; i++) {
      const y = 0.2 + i * 0.28
      const s = 0.62 - Math.abs(i - 2.5) * 0.06
      const b = blob(s, 0.3, s * 0.9, i % 2 ? dark : dark2, (r() - 0.5) * 0.1, y, (r() - 0.5) * 0.1, 1)
      b.userData.phase = r() * 10
      shells.push(b)
      body.add(b)
    }
    body.add(blob(0.36, 0.34, 0.32, dark, 0, 2.15, 0.04, 1))
    if (frozen) {
      const rime = new THREE.MeshToonMaterial({ color: '#dcefff', transparent: true, opacity: 0.55 })
      for (let i = 0; i < 18; i++) {
        const a = r() * Math.PI * 2
        const y = 0.2 + r() * 2
        body.add(blob(0.08 + r() * 0.1, 0.02, 0.08, rime, Math.cos(a) * 0.5, y, Math.sin(a) * 0.5, 0))
      }
    }
    if (smile) {
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 6, 24, Math.PI * 0.85), uniqueGlow('#c8a0ff', 2.2))
      mouth.rotation.z = Math.PI + Math.PI * 0.075
      mouth.position.set(0, 2.12, 0.36)
      body.add(mouth)
      // the mouth faces the camera (iso view from +x +z)
    }
    fx(body)
    keep(body)
    body.rotation.y = Math.PI / 4
    root.add(body)
    root.userData.shells = shells
    root.userData.frozen = frozen
    return root
  },
  animate: (obj, t) => {
    if (obj.userData.frozen) return
    const shells = obj.userData.shells as THREE.Object3D[] | undefined
    if (!shells) return
    for (const s of shells) {
      const p = Number(s.userData.phase) || 0
      s.position.x = Math.sin(t * 1.3 + p) * 0.08
      s.position.z = Math.cos(t * 1.1 + p) * 0.08
      s.rotation.y = t * 0.4 + p
    }
  },
})

// ---------------------------------------------------------------------------------- the Approacher driving off
/** The Approacher that starts driving forward (+Z) when it becomes visible. params: delay, accel, max */
registerProp('ch12_drive', {
  solid: false,
  build: (ctx: PropContext) => {
    const base = getProp('approacher')
    const root = new THREE.Group()
    const inner = new THREE.Group()
    if (base) inner.add(base.build(ctx))
    // exhaust shimmer (spirit fuel burns clean but the cold air steams)
    const steam = additive('#cfd8e8', 0.8, 0.25)
    for (let i = 0; i < 3; i++) {
      const puff = ball(0.12 + i * 0.05, 0.1 + i * 0.04, 0.12 + i * 0.05, steam, 0.33, 1.25 + i * 0.18, 0.5 - 0.88 - i * 0.12, 8)
      puff.castShadow = false
      inner.add(fx(puff))
    }
    keep(inner)
    root.add(inner)
    root.userData.inner = inner
    root.userData.delay = num(ctx, 'delay', 0.4)
    root.userData.accel = num(ctx, 'accel', 2.6)
    root.userData.max = num(ctx, 'max', 30)
    return root
  },
  animate: (obj, t) => {
    const u = obj.userData
    if (u.t0 === undefined) u.t0 = t
    const k = Math.max(0, t - (u.t0 as number) - (u.delay as number))
    const d = Math.min(u.max as number, 0.5 * (u.accel as number) * k * k)
    const inner = u.inner as THREE.Object3D
    inner.position.z = d
    inner.position.y = Math.abs(Math.sin(t * 23)) * 0.015
    inner.rotation.x = k > 0 && k < 0.6 ? -0.03 * Math.sin((k / 0.6) * Math.PI) : 0
  },
})

// ---------------------------------------------------------------------------------- stone rubble used by the stair scene
registerProp('ch12_rubble', {
  solid: false,
  build: (ctx) => {
    const g = new THREE.Group()
    const r = seeded('ch12-rubble' + Math.floor(ctx.rand() * 4))
    const c = tint(ctx, '#7a736a')
    for (let i = 0; i < 5; i++) g.add(rock(i, 0.08 + r() * 0.1, 0.06 + r() * 0.06, 0.08 + r() * 0.08, F(i % 2 ? c : shade(c, 0.8)), (r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7))
    g.add(rod([-0.3, 0.02, 0.2], [0.25, 0.02, -0.1], 0.02, 0.015, M(PAL.woodDark), 5))
    return finalize(g)
  },
})
