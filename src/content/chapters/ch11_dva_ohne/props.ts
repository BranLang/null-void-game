/**
 * Custom props for the dream "Two Fires": chalk drawings and the script for
 * the voice in the underground hall, the city of light that grows from black
 * dust like coral (and crumbles back), the spinning vortex gate, Sai without
 * its ring, the blade of pulsing yellow light, the low embers of the second
 * fire, and a headboard for the bed in Renn's manor.
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
  dome,
  torus,
  plane,
  rock,
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
  canvasTex,
  uniqueGlow,
  glowMat,
  additive,
  WALL_Z,
  type Rand,
} from '../../../engine/props/kit'

// ---------------------------------------------------------------------------------- chalk on the wall
function chalkLine(g: CanvasRenderingContext2D, r: Rand, pts: [number, number][], color: string, width: number): void {
  for (let pass = 0; pass < 3; pass++) {
    g.strokeStyle = color
    g.globalAlpha = 0.45 + r() * 0.35
    g.lineWidth = width * (0.7 + r() * 0.5)
    g.beginPath()
    pts.forEach(([x, y], i) => {
      const jx = x + (r() - 0.5) * width * 0.8
      const jy = y + (r() - 0.5) * width * 0.8
      if (i === 0) g.moveTo(jx, jy)
      else g.lineTo(jx, jy)
    })
    g.stroke()
  }
  g.globalAlpha = 1
}

function circlePts(cx: number, cy0: number, rad: number, from = 0, to = Math.PI * 2, n = 28): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n
    out.push([cx + Math.cos(a) * rad, cy0 + Math.sin(a) * rad])
  }
  return out
}

function chalkTex(subject: string): THREE.CanvasTexture {
  return canvasTex(`ch11-chalk-${subject}`, 256, 256, (g, w, h, r) => {
    g.clearRect(0, 0, w, h)
    g.lineCap = 'round'
    g.lineJoin = 'round'
    if (subject === 'sun' || subject === 'sun_half') {
      const full = subject === 'sun'
      const yellow = '#ffd84a'
      chalkLine(g, r, circlePts(w / 2, h / 2, 46, 0, full ? Math.PI * 2 : Math.PI * 1.15), yellow, 9)
      if (full) {
        g.fillStyle = 'rgba(255,216,74,0.35)'
        g.beginPath()
        g.arc(w / 2, h / 2, 40, 0, Math.PI * 2)
        g.fill()
      }
      const rays = full ? 12 : 5
      for (let i = 0; i < rays; i++) {
        const a = (i / 12) * Math.PI * 2 - 0.2
        chalkLine(g, r, [[w / 2 + Math.cos(a) * 60, h / 2 + Math.sin(a) * 60], [w / 2 + Math.cos(a) * 92, h / 2 + Math.sin(a) * 92]], yellow, 7)
      }
    } else if (subject === 'garden') {
      chalkLine(g, r, [[10, 210], [246, 214]], '#7a5a3a', 6)
      for (let i = 0; i < 6; i++) {
        const x = 26 + i * 40
        chalkLine(g, r, [[x, 210], [x + (r() - 0.5) * 10, 120 + r() * 30]], '#5ac25a', 6)
        for (let k = 0; k < 3; k++) {
          const y = 140 + k * 20 + r() * 10
          chalkLine(g, r, [[x, y], [x + 18, y - 12]], '#5ac25a', 5)
          chalkLine(g, r, [[x, y + 6], [x - 16, y - 6]], '#5ac25a', 5)
        }
        g.fillStyle = i % 2 ? 'rgba(255,120,80,0.8)' : 'rgba(255,190,60,0.8)'
        g.beginPath()
        g.arc(x + 6, 120 + r() * 20, 9, 0, Math.PI * 2)
        g.fill()
      }
      chalkLine(g, r, [[20, 236], [80, 230], [140, 238], [200, 230], [246, 236]], '#6ac8ff', 6)
    } else if (subject === 'house') {
      // a house with a door bigger than the whole house
      chalkLine(g, r, [[70, 200], [70, 130], [130, 92], [190, 130], [190, 200], [70, 200]], '#ff9a6a', 7)
      chalkLine(g, r, [[96, 236], [96, 70], [164, 70], [164, 236]], '#9ad0ff', 8)
      g.fillStyle = 'rgba(154,208,255,0.25)'
      g.fillRect(98, 72, 64, 162)
      chalkLine(g, r, circlePts(152, 160, 5), '#ffe08a', 4)
    } else if (subject === 'figure') {
      // a tall figure in white beside a small one
      chalkLine(g, r, circlePts(100, 70, 16), '#ffffff', 6)
      chalkLine(g, r, [[100, 86], [80, 220], [120, 220], [100, 86]], '#ffffff', 6)
      chalkLine(g, r, circlePts(168, 150, 11), '#ffd84a', 5)
      chalkLine(g, r, [[168, 161], [154, 226], [182, 226], [168, 161]], '#ffd84a', 5)
      chalkLine(g, r, [[112, 130], [160, 176]], '#ffffff', 5)
    } else {
      // script for the voice: dense columns of tiny signs
      g.fillStyle = 'rgba(40,36,60,0.75)'
      for (let col = 0; col < 14; col++) {
        const x = 8 + col * 18
        for (let row = 0; row < 30; row++) {
          const y = 6 + row * 8.3
          const k = Math.floor(r() * 5)
          if (k === 0) g.fillRect(x, y, 10, 2)
          else if (k === 1) {
            g.fillRect(x + 4, y - 2, 2, 6)
            g.fillRect(x, y + 1, 10, 1.6)
          } else if (k === 2) {
            g.beginPath()
            g.arc(x + 5, y + 1, 3, 0, Math.PI * 2)
            g.fill()
          } else if (k === 3) {
            g.fillRect(x, y - 2, 2, 6)
            g.fillRect(x + 8, y - 2, 2, 6)
          } else g.fillRect(x + 2, y, 6, 3)
        }
      }
    }
  })
}

/** A drawing on the wall behind the cell. params: subject, w, h, y (height of the centre). */
registerProp('ch11_chalk', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const subject = str(ctx, 'subject', 'sun')
    const w = num(ctx, 'w', 0.9)
    const h = num(ctx, 'h', w)
    const y = num(ctx, 'y', 0.75)
    const m = new THREE.MeshBasicMaterial({ map: chalkTex(subject), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    m.userData.fx = true
    const g = new THREE.Group()
    g.add(fx(plane(w, h, m, 0, y, WALL_Z + 0.015)))
    return g
  },
})

// ---------------------------------------------------------------------------------- the city of light
type CityKind = 'terrace' | 'arch' | 'tower' | 'dome'

function buildCity(kind: CityKind, w: number, h: number, stone: THREE.Material, seam: THREE.Material, warm: THREE.Material, r: Rand): THREE.Group {
  const g = new THREE.Group()
  if (kind === 'terrace') {
    const tiers = Math.max(1, Math.round(h))
    for (let i = 0; i < tiers; i++) {
      const s = 1 - i * 0.22
      const y = i * 0.32
      g.add(bx(w * s, 0.3, w * 0.7 * s, stone, 0, y, -i * 0.12))
      g.add(bx(w * s + 0.02, 0.035, 0.03, seam, 0, y + 0.29, (w * 0.7 * s) / 2 - i * 0.12))
      // little lit windows along the face
      for (let k = 0; k < Math.floor(w * s * 2.2); k++) {
        const x = -w * s * 0.45 + (k + 0.5) * ((w * s * 0.9) / Math.floor(w * s * 2.2))
        if (r() < 0.6) g.add(bx(0.07, 0.11, 0.02, warm, x, y + 0.08, (w * 0.7 * s) / 2 - i * 0.12 + 0.005))
      }
    }
  } else if (kind === 'arch') {
    for (const s of [-1, 1]) {
      g.add(cy(0.14, 0.17, h * 0.7, stone, s * w * 0.4, 0, 0, 10))
      g.add(cy(0.18, 0.18, 0.06, seam, s * w * 0.4, h * 0.7, 0, 10))
    }
    const arc = torus(w * 0.4, 0.13, stone, 0, h * 0.7, 0, 8, 20, Math.PI)
    g.add(arc)
    g.add(torus(w * 0.4, 0.035, seam, 0, h * 0.7, 0.12, 6, 20, Math.PI))
  } else if (kind === 'tower') {
    g.add(cy(0.3, 0.38, h, stone, 0, 0, 0, 12))
    for (let i = 0; i < Math.floor(h / 0.5); i++) g.add(cy(0.31, 0.31, 0.03, seam, 0, 0.3 + i * 0.5, 0, 12))
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3
      g.add(bx(0.06, 0.12, 0.02, warm, Math.sin(a) * 0.31, h * 0.6 + (i % 2) * 0.3, Math.cos(a) * 0.31).rotateY(a))
    }
    g.add(cn(0.36, 0.5, stone, 0, h, 0, 12))
    g.add(ball(0.07, 0.07, 0.07, glowMat('#fff6d8', 3), 0, h + 0.55, 0, 8))
  } else {
    g.add(cy(w * 0.42, w * 0.46, 0.5, stone, 0, 0, 0, 16))
    g.add(dome(w * 0.44, w * 0.38, w * 0.44, stone, 0, 0.5, 0, 16))
    g.add(cy(w * 0.45, w * 0.45, 0.03, seam, 0, 0.5, 0, 16))
    g.add(bx(0.22, 0.34, 0.02, warm, 0, 0, w * 0.45))
  }
  return g
}

/**
 * A building of the dream city. It grows out of the ground (like coral) when
 * it becomes visible; with `fall` it crumbles back into dust instead.
 * params: kind, w, h, delay, fall
 */
registerProp('ch11_city', {
  solid: false,
  light: (ctx) => (str(ctx, 'kind', 'terrace') === 'tower' && !bool(ctx, 'fall') ? { color: '#ffe6b8', intensity: 1.6, distance: 6, y: num(ctx, 'h', 2.4) } : null),
  build: (ctx) => {
    const kindS = str(ctx, 'kind', 'terrace')
    const kind: CityKind = kindS === 'arch' || kindS === 'tower' || kindS === 'dome' ? kindS : 'terrace'
    const w = num(ctx, 'w', 2.4)
    const h = num(ctx, 'h', kind === 'tower' ? 2.6 : kind === 'arch' ? 2.2 : 3)
    const fall = bool(ctx, 'fall')
    const r = seeded(`city-${kind}-${w}-${h}-${Math.floor(ctx.rand() * 99)}`)
    const stoneCol = tint(ctx, '#f2eefa')
    const stone = new THREE.MeshToonMaterial({ color: stoneCol, emissive: new THREE.Color('#d8d0ff'), emissiveIntensity: fall ? 0.05 : 0.22 })
    const seam = uniqueGlow('#ffe6b0', fall ? 0.6 : 2.4)
    const warm = uniqueGlow('#ffd890', fall ? 0.4 : 2.6)
    const root = new THREE.Group()
    const inner = finalize(buildCity(kind, w, h, stone, seam, warm, r))
    keep(inner)
    root.add(inner)
    root.userData.inner = inner
    root.userData.delay = num(ctx, 'delay', 0)
    root.userData.fall = fall
    root.userData.mats = { stone, seam, warm }
    if (!fall) inner.scale.set(1, 0.02, 1)
    return root
  },
  animate: (obj, t) => {
    const u = obj.userData
    if (u.t0 === undefined) u.t0 = t
    const inner = u.inner as THREE.Object3D
    const k = Math.max(0, Math.min(1, (t - (u.t0 as number) - (u.delay as number)) / (u.fall ? 3.2 : 2.4)))
    const mats = u.mats as { stone: THREE.MeshToonMaterial; seam: THREE.MeshBasicMaterial; warm: THREE.MeshBasicMaterial }
    if (u.fall) {
      inner.scale.set(1 + k * 0.08, Math.max(0.05, 1 - k * 0.88), 1 + k * 0.08)
      inner.position.y = -k * 0.25
      inner.rotation.z = Math.sin(k * 3) * 0.04
      mats.stone.color.set('#cfc9d8').lerp(new THREE.Color('#1a1820'), k)
      mats.seam.color.copy(mats.seam.userData.base as THREE.Color).multiplyScalar(1 - k)
      mats.warm.color.copy(mats.warm.userData.base as THREE.Color).multiplyScalar(1 - k)
    } else {
      // coral growth: rises in small pulses
      const e = k < 1 ? k + Math.sin(k * Math.PI * 6) * 0.03 * (1 - k) : 1
      inner.scale.set(1, Math.max(0.02, e), 1)
      const breathe = 0.85 + 0.15 * Math.sin(t * 1.4)
      mats.seam.color.copy(mats.seam.userData.base as THREE.Color).multiplyScalar(breathe * (0.3 + 0.7 * k))
    }
  },
})

// ---------------------------------------------------------------------------------- the vortex gate
function vortexTex(): THREE.CanvasTexture {
  return canvasTex('ch11-vortex', 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    const cx = w / 2
    const cyy = h / 2
    for (let i = 0; i < 240; i++) {
      const a = i * 0.21
      const rad = 20 + i * 0.42
      g.strokeStyle = `rgba(255,${120 + (i % 60)},${60 + (i % 90)},${0.05 + (i / 240) * 0.35})`
      g.lineWidth = 2 + (i / 240) * 3
      g.beginPath()
      g.arc(cx, cyy, rad, a, a + 0.9)
      g.stroke()
    }
  })
}

/** A spinning black ring whose inner edge burns. Grows when shown; `closing` shrinks it shut. */
registerProp('ch11_vortex', {
  solid: false,
  castShadow: false,
  light: (ctx) => (bool(ctx, 'closing') ? null : { color: '#ff7a3a', intensity: 2.2, distance: 7, y: 1.6 }),
  build: (ctx) => {
    const root = new THREE.Group()
    const inner = new THREE.Group()
    const black = new THREE.MeshBasicMaterial({ color: '#030205' })
    inner.add(torus(1.25, 0.28, black, 0, 0, 0, 10, 40))
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.08, 48), new THREE.MeshBasicMaterial({ color: '#000000' }))
    inner.add(disc)
    const burn = uniqueGlow('#ff8a3a', 2.8)
    inner.add(torus(1.04, 0.05, burn, 0, 0, 0.02, 8, 48))
    const swirl = new THREE.Mesh(new THREE.CircleGeometry(1.05, 48), additive('#ffb070', 1.6, 0.9, vortexTex(), true))
    swirl.position.z = 0.03
    keep(swirl)
    inner.add(swirl)
    const violet = uniqueGlow('#b77dff', 2.2)
    inner.add(torus(1.5, 0.02, violet, 0, 0, -0.05, 6, 48))
    fx(inner)
    keep(inner)
    inner.position.y = 1.55
    root.add(inner)
    root.userData.inner = inner
    root.userData.swirl = swirl
    root.userData.burn = burn
    root.userData.closing = bool(ctx, 'closing')
    inner.scale.setScalar(root.userData.closing ? 1 : 0.05)
    return root
  },
  animate: (obj, t, dt) => {
    const u = obj.userData
    if (u.t0 === undefined) u.t0 = t
    const k = t - (u.t0 as number)
    const inner = u.inner as THREE.Object3D
    ;(u.swirl as THREE.Object3D).rotation.z -= dt * 2.6
    const burn = u.burn as THREE.MeshBasicMaterial
    burn.color.copy(burn.userData.base as THREE.Color).multiplyScalar(0.7 + 0.3 * Math.sin(t * 9))
    if (u.closing) inner.scale.setScalar(Math.max(0.001, 1 - k / 0.9))
    else inner.scale.setScalar(Math.min(1, 0.05 + k / 1.6))
  },
})

// ---------------------------------------------------------------------------------- Sai without its ring
function moonTex(): THREE.CanvasTexture {
  return canvasTex('ch11-moon', 256, 256, (g, w, h, r) => {
    const grad = g.createRadialGradient(w * 0.42, h * 0.4, 10, w / 2, h / 2, w / 2)
    grad.addColorStop(0, '#ffd59a')
    grad.addColorStop(0.7, '#e09a4a')
    grad.addColorStop(1, '#a8622a')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(120,60,20,${0.08 + r() * 0.14})`
      g.beginPath()
      g.arc(r() * w, r() * h, 6 + r() * 26, 0, Math.PI * 2)
      g.fill()
    }
  })
}

function haloTex(): THREE.CanvasTexture {
  return canvasTex('ch11-halo', 128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grad.addColorStop(0, 'rgba(255,190,110,0.55)')
    grad.addColorStop(0.45, 'rgba(255,160,80,0.18)')
    grad.addColorStop(1, 'rgba(255,140,60,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
  })
}

/** The amber moon hanging over the dream, bare, without the ring it should have. params: r, y */
registerProp('ch11_moon', {
  solid: false,
  castShadow: false,
  build: (ctx) => {
    const rad = num(ctx, 'r', 1.6)
    const y = num(ctx, 'y', 8)
    const g = new THREE.Group()
    const moon = new THREE.Mesh(new THREE.SphereGeometry(rad, 32, 20), new THREE.MeshBasicMaterial({ map: moonTex(), color: new THREE.Color('#ffffff').multiplyScalar(1.25), toneMapped: false }))
    moon.position.y = y
    g.add(moon)
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(rad * 5, rad * 5), new THREE.MeshBasicMaterial({ map: haloTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }))
    halo.position.y = y
    const dir = new THREE.Vector3(Math.cos(0.61) * Math.sin(Math.PI / 4), Math.sin(0.61), Math.cos(0.61) * Math.cos(Math.PI / 4))
    halo.lookAt(halo.position.clone().add(dir))
    g.add(halo)
    return fx(g)
  },
})

// ---------------------------------------------------------------------------------- the yellow blade
/** A blade of pulsing yellow light that grows out of a chest, then cuts down. */
registerProp('ch11_blade', {
  solid: false,
  castShadow: false,
  light: { color: '#ffd84a', intensity: 2.4, distance: 5, y: 0.6 },
  build: () => {
    const root = new THREE.Group()
    const blade = new THREE.Group()
    const steel = M('#7a7468')
    const core = uniqueGlow('#ffd84a', 3)
    blade.add(bx(0.07, 0.02, 1.0, steel, 0, -0.01, 0.5))
    blade.add(bx(0.025, 0.026, 0.98, core, 0, -0.013, 0.5))
    const tip = cn(0.05, 0.22, steel, 0, 0, 0)
    tip.rotation.x = Math.PI / 2
    tip.position.set(0, 0, 1.0)
    blade.add(tip)
    keep(blade)
    blade.position.set(0, 0.62, -0.4)
    root.add(blade)
    root.userData.blade = blade
    root.userData.core = core
    return root
  },
  animate: (obj, t) => {
    const u = obj.userData
    if (u.t0 === undefined) u.t0 = t
    const k = t - (u.t0 as number)
    const blade = u.blade as THREE.Object3D
    const core = u.core as THREE.MeshBasicMaterial
    core.color.copy(core.userData.base as THREE.Color).multiplyScalar(0.55 + 0.45 * Math.abs(Math.sin(t * 5.2)))
    if (k < 0.6) blade.scale.set(1, 1, Math.max(0.01, k / 0.6))
    else blade.scale.set(1, 1, 1)
    if (k > 2.2) {
      const c = Math.min(1, (k - 2.2) / 0.55)
      blade.position.y = 0.62 - c * 0.95
      blade.rotation.x = c * 0.5
    }
    blade.visible = k < 3.4
  },
})

// ---------------------------------------------------------------------------------- the second fire
registerProp('ch11_embers', {
  solid: true,
  light: { color: '#ff4a1a', intensity: 1.6, distance: 4.5, y: 0.3, flicker: true },
  build: (ctx) => {
    const g = new THREE.Group()
    const r = seeded('embers')
    const stone = F('#2a2628')
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r() * 0.2
      g.add(rock(i, 0.11, 0.1, 0.1, stone, Math.cos(a) * 0.38, -0.01, Math.sin(a) * 0.38))
    }
    g.add(ball(0.28, 0.06, 0.28, M('#2a1d18'), 0, 0.02, 0, 10))
    const merged = finalize(g)
    merged.add(ball(0.22, 0.05, 0.22, glowMat(PAL.ember, 2.2), 0, 0.05, 0, 10))
    const flames: THREE.Object3D[] = []
    for (const [x, z, s] of [
      [0.05, 0.02, 0.7],
      [-0.08, -0.04, 0.5],
    ] as const) {
      const f = flame(s, ctx.rand() * 10, '#ff5a1a', '#ffb060')
      f.position.set(x, 0.05, z)
      merged.add(f)
      flames.push(f)
    }
    merged.userData.flames = flames
    return merged
  },
  animate: (obj, t) => flicker(obj, t),
})

// ---------------------------------------------------------------------------------- headboard and pillows
/** Headboard with pillows for a bed built from raised map cells. params: w (cells across) */
registerProp('ch11_bedhead', {
  solid: false,
  build: (ctx) => {
    const w = num(ctx, 'w', 2)
    const g = new THREE.Group()
    const wood = M(PAL.woodDark)
    const sheet = M('#efe8dc')
    const blanket = M(tint(ctx, '#5a3a5a'))
    // the prop sits on the mattress (raised cell): build down to the floor too
    g.add(bx(w + 0.06, 1.1, 0.1, wood, (w - 1) / 2, -0.5, -0.48))
    g.add(bx(w + 0.16, 0.08, 0.14, M(shade(PAL.woodDark, 1.2)), (w - 1) / 2, 0.6, -0.48))
    for (let i = 0; i < w; i++) g.add(ball(0.32, 0.09, 0.2, sheet, i, 0.08, -0.25, 12))
    g.add(bx(w - 0.1, 0.06, 1.6, blanket, (w - 1) / 2, -0.01, 0.95))
    return finalize(g)
  },
})
