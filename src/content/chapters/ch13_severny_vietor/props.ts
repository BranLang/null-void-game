/**
 * Chapter 13 props: the Itaka without her bow cannon, blue-spirit bottles,
 * the overturned table, iron grates over Hel's lava fissures, wall reliefs
 * (wolves; the four smooth-faced humans), the tower console with the drone
 * map, the blue light strips of the tower and the Itaka's helm.
 */
import * as THREE from 'three'
import '../../../engine/props'
import { getProp, registerProp, type PropContext } from '../../../engine/props/registry'
import { PAL, M, F, bx, cy, ball, rod, plane, finalize, cachedBuild, glowMat, canvasTex, texMat, keep, fx, WALL_Z, num, tint, bool, str, seeded } from '../../../engine/props/kit'

// ---------------------------------------------------------------------------------- Itaka without the bow cannon
// The stock Itaka model bakes its bow cannon "Felix" into the merged hull meshes. We build the
// stock model and cut away every triangle that lies wholly inside the cannon's box at the bow.
const CANNON_BOX = new THREE.Box3(new THREE.Vector3(-0.5, 1.56, 1.56), new THREE.Vector3(0.5, 2.45, 3.85))

function stripCannon(root: THREE.Object3D): void {
  const v = new THREE.Vector3()
  // finalize() leaves the merged static meshes as direct children in the prop's own space;
  // animated parts (rotors) are flagged and stay untouched
  for (const o of [...root.children]) {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || o.userData.anim) continue
    const geo = mesh.geometry
    const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined
    if (!pos || geo.index) continue
    const keepTri: number[] = []
    for (let t = 0; t < pos.count; t += 3) {
      let inside = 0
      for (let k = 0; k < 3; k++) {
        v.fromBufferAttribute(pos, t + k).applyMatrix4(mesh.matrix)
        if (CANNON_BOX.containsPoint(v)) inside++
      }
      if (inside < 3) keepTri.push(t)
    }
    if (keepTri.length * 3 === pos.count) continue
    const out = new THREE.BufferGeometry()
    for (const name of Object.keys(geo.attributes)) {
      const a = geo.getAttribute(name) as THREE.BufferAttribute
      const arr = new Float32Array(keepTri.length * 3 * a.itemSize)
      let w = 0
      for (const t of keepTri) for (let k = 0; k < 3; k++) for (let c = 0; c < a.itemSize; c++) arr[w++] = a.getComponent(t + k, c)
      out.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize))
    }
    out.computeBoundingSphere()
    mesh.geometry = out
  }
}

const itaka = getProp('itaka')
registerProp('c13_itaka_bare', {
  solid: true,
  footprint: itaka?.footprint,
  light: itaka?.light,
  build: (ctx: PropContext) => {
    const g = itaka ? itaka.build(ctx) : new THREE.Group()
    stripCannon(g)
    return g
  },
  animate: itaka?.animate,
})

// ---------------------------------------------------------------------------------- bottles
registerProp('c13_bottle', {
  solid: false,
  build: (ctx) => {
    const color = tint(ctx, '#3f7cff')
    const count = Math.max(1, Math.round(num(ctx, 'count', 2)))
    const empty = bool(ctx, 'empty')
    return cachedBuild(`c13bottle|${color}|${count}|${empty}`, () => {
      const g = new THREE.Group()
      const r = seeded('c13bottle' + count)
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * 0.14 + (r() - 0.5) * 0.04
        const z = (r() - 0.5) * 0.1
        const glass = M(color, { opacity: 0.78, transparent: true })
        g.add(cy(0.045, 0.05, 0.2, glass, x, 0, z, 10))
        g.add(cy(0.018, 0.04, 0.06, glass, x, 0.2, z, 8))
        g.add(cy(0.019, 0.019, 0.03, M('#5a3a24'), x, 0.26, z, 6))
        if (!empty && i < count - 1) g.add(cy(0.04, 0.045, 0.12, glowMat(color, 1.6, 0.85), x, 0.012, z, 10))
      }
      return g
    })
  },
})

// ---------------------------------------------------------------------------------- overturned table and glass
registerProp('c13_table_fallen', {
  solid: true,
  build: () =>
    cachedBuild('c13_table_fallen', () => {
      const g = new THREE.Group()
      const stone = M('#4a4440')
      const dark = M('#2e2a28')
      const top = bx(1.04, 0.66, 0.1, stone, 0, 0, 0)
      top.position.set(0, 0.5, 0.12)
      top.rotation.x = -0.18
      g.add(top)
      for (const x of [-0.36, 0.36]) {
        const leg = rod([x, 0.62, 0.1], [x, 0.66, -0.55], 0.06, 0.06, dark, 6)
        g.add(leg)
      }
      const shard = M('#3f7cff', { opacity: 0.8, transparent: true })
      const shard2 = M('#c83a2a', { opacity: 0.8, transparent: true })
      const r = seeded('c13shards')
      for (let i = 0; i < 9; i++) {
        const s = bx(0.05 + r() * 0.05, 0.012, 0.03 + r() * 0.04, i % 4 === 0 ? shard2 : shard, (r() - 0.5) * 1.2, 0, 0.35 + r() * 0.5)
        s.rotation.y = r() * 3
        g.add(s)
      }
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), glowMat('#2a5ad8', 0.9, 0.35))
      puddle.rotation.x = -Math.PI / 2
      puddle.position.set(0.15, 0.012, 0.55)
      g.add(puddle)
      return g
    }),
})

// ---------------------------------------------------------------------------------- iron grate over a lava fissure
registerProp('c13_grate', {
  solid: false,
  castShadow: false,
  build: () =>
    cachedBuild('c13_grate', () => {
      const g = new THREE.Group()
      const iron = M('#2a2626')
      for (let i = 0; i < 5; i++) g.add(bx(0.07, 0.05, 1.0, iron, -0.4 + i * 0.2, -0.04, 0))
      for (const z of [-0.42, 0, 0.42]) g.add(bx(1.0, 0.04, 0.07, iron, 0, -0.03, z))
      return g
    }),
})

// ---------------------------------------------------------------------------------- reliefs
function paintWolves(c: CanvasRenderingContext2D, w: number, h: number, r: () => number): void {
  c.fillStyle = '#8a6a48'
  c.fillRect(0, 0, w, h)
  for (let i = 0; i < 900; i++) {
    c.fillStyle = `rgba(40,26,16,${0.05 + r() * 0.08})`
    c.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 4)
  }
  c.strokeStyle = 'rgba(40,24,14,0.85)'
  c.fillStyle = 'rgba(60,40,26,0.55)'
  c.lineWidth = 3
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 5; k++) {
      const x = 30 + k * 95 + (row % 2) * 40 + r() * 10
      const y = 70 + row * 110
      c.beginPath()
      c.ellipse(x, y, 30, 14, 0, 0, Math.PI * 2)
      c.moveTo(x + 26, y - 8)
      c.lineTo(x + 46, y - 26)
      c.lineTo(x + 44, y - 8)
      c.moveTo(x + 40, y - 22)
      c.lineTo(x + 36, y - 38)
      c.moveTo(x - 26, y + 6)
      c.lineTo(x - 50, y - 10)
      for (const lx of [-18, -6, 10, 22]) {
        c.moveTo(x + lx, y + 10)
        c.lineTo(x + lx + (r() - 0.5) * 8, y + 34)
      }
      c.fill()
      c.stroke()
    }
  }
}

function paintFour(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.fillStyle = '#2a2630'
  c.fillRect(0, 0, w, h)
  c.strokeStyle = 'rgba(200,200,220,0.85)'
  c.lineWidth = 2
  // perfect arcs and hard edges no chisel could cut
  for (let i = 0; i < 6; i++) {
    c.beginPath()
    c.arc(w / 2, h * 1.05, 70 + i * 34, Math.PI, 0)
    c.stroke()
  }
  c.fillStyle = 'rgba(214,214,228,0.9)'
  for (let k = 0; k < 4; k++) {
    const x = 70 + k * 120
    const y = 110
    c.beginPath()
    c.ellipse(x, y, 16, 22, 0, 0, Math.PI * 2)
    c.fill()
    c.fillRect(x - 20, y + 26, 40, 120)
    c.fillRect(x - 32, y + 34, 12, 70)
    c.fillRect(x + 20, y + 34, 12, 70)
    c.fillRect(x - 18, y + 146, 14, 60)
    c.fillRect(x + 4, y + 146, 14, 60)
  }
  c.fillStyle = 'rgba(214,214,228,0.4)'
  c.fillRect(0, h - 26, w, 3)
}

registerProp('c13_relief', {
  solid: false,
  build: (ctx) => {
    const kind = str(ctx, 'kind', 'wolves') === 'four' ? 'four' : 'wolves'
    const w = num(ctx, 'w', 1.8)
    return cachedBuild(`c13relief|${kind}|${w}`, () => {
      const g = new THREE.Group()
      const tex = kind === 'four' ? canvasTex('c13-relief-four', 512, 320, (c, cw, ch) => paintFour(c, cw, ch)) : canvasTex('c13-relief-wolves', 512, 320, (c, cw, ch, r) => paintWolves(c, cw, ch, r))
      const mat = texMat(`c13relief-${kind}`, tex, kind === 'four' ? { emissive: '#ffffff', ei: 0.25, emissiveMap: tex } : {})
      const hgt = w * 0.62
      g.add(bx(w + 0.12, hgt + 0.12, 0.08, M(kind === 'four' ? '#1c1a20' : '#5a4430'), 0, 0.5, WALL_Z + 0.04))
      g.add(plane(w, hgt, mat, 0, 0.56 + hgt / 2, WALL_Z + 0.085))
      return g
    })
  },
})

// ---------------------------------------------------------------------------------- tower console with the drone map
function paintMap(c: CanvasRenderingContext2D, w: number, h: number, r: () => number): void {
  c.fillStyle = '#03101c'
  c.fillRect(0, 0, w, h)
  c.strokeStyle = 'rgba(90,190,255,0.9)'
  c.lineWidth = 3
  for (let ring = 0; ring < 6; ring++) {
    c.beginPath()
    c.ellipse(w / 2, h / 2, 40 + ring * 34, 24 + ring * 20, 0, 0, Math.PI * 2)
    c.stroke()
  }
  c.lineWidth = 2
  for (let i = 0; i < 24; i++) {
    const a = r() * Math.PI * 2
    c.beginPath()
    c.moveTo(w / 2 + Math.cos(a) * 30, h / 2 + Math.sin(a) * 18)
    c.lineTo(w / 2 + Math.cos(a) * 220, h / 2 + Math.sin(a) * 130)
    c.stroke()
  }
  for (let i = 0; i < 70; i++) {
    c.fillStyle = r() > 0.85 ? 'rgba(255,90,90,0.95)' : 'rgba(160,230,255,0.95)'
    c.beginPath()
    c.arc(r() * w, r() * h, 2.5, 0, Math.PI * 2)
    c.fill()
  }
}

registerProp('c13_console', {
  solid: true,
  light: { color: '#58b8ff', intensity: 1.6, distance: 4, y: 1.1 },
  build: () =>
    cachedBuild('c13_console', () => {
      const g = new THREE.Group()
      const metal = M('#3f4652')
      const dark = M('#262b33')
      g.add(cy(0.36, 0.42, 0.85, metal, 0, 0, 0, 12))
      const top = cy(0.62, 0.5, 0.08, dark, 0, 0.85, 0, 24)
      g.add(top)
      const screen = new THREE.Mesh(new THREE.CircleGeometry(0.56, 32), texMat('c13console', canvasTex('c13-console-map', 512, 320, paintMap), { emissive: '#ffffff', ei: 1.4, emissiveMap: canvasTex('c13-console-map', 512, 320, paintMap) }))
      screen.rotation.x = -Math.PI / 2
      screen.position.y = 0.94
      g.add(screen)
      g.add(cy(0.64, 0.64, 0.02, glowMat(PAL.tech, 2.6), 0, 0.84, 0, 24))
      return g
    }),
})

// ---------------------------------------------------------------------------------- blue light strip (tower walls)
registerProp('c13_bluelight', {
  solid: false,
  light: { color: '#58b8ff', intensity: 1.1, distance: 3.2, y: 1.2 },
  build: () =>
    cachedBuild('c13_bluelight', () => {
      const g = new THREE.Group()
      g.add(bx(0.08, 2.0, 0.04, glowMat(PAL.tech, 3), 0, 0.2, WALL_Z + 0.04))
      g.add(bx(0.16, 0.04, 0.06, M('#2a2f38'), 0, 0.18, WALL_Z + 0.04))
      return fx(g)
    }),
})

// ---------------------------------------------------------------------------------- the Itaka's helm
registerProp('c13_helm', {
  solid: true,
  build: () => {
    const g = new THREE.Group()
    const wood = M(PAL.woodDark)
    const brass = M(PAL.brass)
    g.add(bx(0.22, 0.9, 0.22, wood, 0, 0, 0))
    const wheel = new THREE.Group()
    wheel.position.set(0, 1.05, 0.14)
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 6, 20), wood)
    wheel.add(ringMesh)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const spoke = rod([0, 0, 0], [Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0], 0.016, 0.022, wood, 5)
      wheel.add(spoke)
    }
    wheel.add(cy(0.07, 0.07, 0.08, brass, 0, -0.04, 0, 10).rotateX(Math.PI / 2))
    keep(wheel)
    g.add(wheel)
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------------- floating soup pot (frozen mid-air by the glyph)
registerProp('c13_pot', {
  solid: false,
  build: (ctx) => {
    const tilt = num(ctx, 'tilt', 0)
    return cachedBuild(`c13pot|${tilt}`, () => {
      const g = new THREE.Group()
      const iron = M('#2a2a2e')
      const pot = new THREE.Group()
      pot.add(cy(0.2, 0.16, 0.24, iron, 0, 0, 0, 14))
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 5, 16), iron)
      rim.rotation.x = Math.PI / 2
      rim.position.y = 0.24
      pot.add(rim)
      pot.add(cy(0.18, 0.18, 0.02, M('#b8743a'), 0, 0.2, 0, 14))
      pot.add(rod([-0.2, 0.24, 0], [0, 0.42, 0], 0.01, 0.01, iron, 4))
      pot.add(rod([0.2, 0.24, 0], [0, 0.42, 0], 0.01, 0.01, iron, 4))
      pot.rotation.z = tilt
      g.add(pot)
      return g
    })
  },
})

// ---------------------------------------------------------------------------------- wolf grave stone
registerProp('c13_wolfstone', {
  solid: true,
  build: (ctx) => {
    const v = Math.floor(ctx.rand() * 3)
    return cachedBuild(`c13wolfstone|${v}`, () => {
      const g = new THREE.Group()
      const stone = F('#4a4650')
      g.add(bx(0.5, 0.42 + v * 0.06, 0.18, stone, 0, 0, 0))
      g.add(ball(0.25, 0.08, 0.09, stone, 0, 0.44 + v * 0.06, 0, 8))
      const glyph = M('#cfc8b8')
      g.add(bx(0.18, 0.1, 0.01, glyph, 0, 0.26, 0.095))
      g.add(bx(0.05, 0.08, 0.01, glyph, 0.09, 0.35, 0.095))
      g.add(cy(0.035, 0.03, 0.06, M(PAL.brass), -0.16, 0, 0.16, 6))
      g.add(cy(0.03, 0.03, 0.08, M('#c8b070'), 0.17, 0, 0.15, 6))
      return g
    })
  },
})

// ---------------------------------------------------------------------------------- dying campfire embers
registerProp('c13_embers', {
  solid: true,
  light: { color: '#ff5a1a', intensity: 1.1, distance: 3.2, y: 0.25, flicker: true },
  build: () =>
    cachedBuild('c13_embers', () => {
      const g = new THREE.Group()
      const stone = F(PAL.stoneDark)
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        g.add(ball(0.11, 0.08, 0.1, stone, Math.cos(a) * 0.38, 0.03, Math.sin(a) * 0.38, 6))
      }
      g.add(ball(0.24, 0.05, 0.24, M('#2a2420'), 0, 0.02, 0, 10))
      for (let i = 0; i < 6; i++) {
        const a = i * 1.7
        g.add(ball(0.05, 0.03, 0.05, glowMat(PAL.ember, 2.2), Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14, 6))
      }
      return g
    }),
})
