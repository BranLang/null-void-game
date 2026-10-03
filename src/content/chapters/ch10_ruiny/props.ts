/**
 * Custom props for chapter 10: the dead of the outer ruins with Spira crystals
 * grown into their ribs, Kitsune's spirit lamps, and the jar of green acid in
 * the Itaka's hold where the crystals smoulder violet.
 */
import * as THREE from 'three'
import { registerProp } from '../../../engine/props/registry'
import { PAL, M, F, bx, cy, ball, rod, chain, keep, fx, finalize, bool, num, str, tint, shade, seeded, glowMat, uniqueGlow, type V3 } from '../../../engine/props/kit'
import { crystal, crystalMat } from '../../../engine/props/tech'

// ---------------------------------------------------------------------------------- bones
/**
 * A skeleton of one of the Varietas who died sitting against a wall.
 * params: pose 'sit' | 'heap' | 'lean'; crystals (default true); best (a big
 * dark-violet crystal in the spine); dead (that crystal cracked and grey);
 * cloth (colour of the rags).
 */
registerProp('ch10_bones', {
  solid: true,
  light: (ctx) => {
    if (bool(ctx, 'best')) return { color: '#8a3aff', intensity: 2.4, distance: 4.5, y: 0.6 }
    return bool(ctx, 'crystals', true) ? { color: '#a070ff', intensity: 1.2, distance: 3.2, y: 0.5 } : null
  },
  build: (ctx) => {
    const pose = str(ctx, 'pose', 'sit')
    const crystals = bool(ctx, 'crystals', true)
    const best = bool(ctx, 'best')
    const dead = bool(ctx, 'dead')
    const cloth = tint(ctx, '#4a4038', 'cloth')
    const r = seeded('bones' + Math.floor(ctx.rand() * 997))
    const g = new THREE.Group()
    const bone = M(PAL.bone)
    const boneD = M('#cbbd98')
    const rag = M(cloth)
    const ragD = M(shade(cloth, 0.7))
    const lean = pose === 'heap' ? 0.9 : pose === 'lean' ? 0.55 : 0.18
    // pelvis sits near the back of the cell, against the wall
    const pz = -0.22
    const pelvis: V3 = [0, 0.14, pz]
    g.add(ball(0.16, 0.08, 0.11, boneD, pelvis[0], pelvis[1], pelvis[2], 10))
    // spine leaning back against the wall, or slumped forward
    const spine: V3[] = []
    for (let i = 0; i <= 6; i++) {
      const k = i / 6
      const side = pose === 'lean' ? Math.sin(k * 1.4) * 0.22 : 0
      spine.push([side, 0.16 + k * 0.56 * (1 - lean * 0.35), pz - 0.06 * k + Math.sin(lean) * k * 0.42])
    }
    g.add(chain(spine, 0.03, 0.025, bone, 6, false))
    for (const p of spine) g.add(bx(0.06, 0.04, 0.05, boneD, p[0], p[1] - 0.02, p[2]))
    const top = spine[spine.length - 1]
    // ribs: arcs from the spine curling forward
    const ribTips: V3[] = []
    for (let k = 0; k < 5; k++) {
      const s0 = spine[2 + Math.min(3, k)]
      const y = s0[1] - 0.03 * k
      for (const s of [-1, 1]) {
        const pts: V3[] = [
          [s0[0] + s * 0.03, y, s0[2]],
          [s0[0] + s * 0.14, y - 0.02, s0[2] + 0.05],
          [s0[0] + s * 0.16, y - 0.06, s0[2] + 0.15],
          [s0[0] + s * 0.07, y - 0.08, s0[2] + 0.21],
        ]
        g.add(chain(pts, 0.014, 0.01, k % 2 ? bone : boneD, 5, false))
        ribTips.push(pts[2])
      }
    }
    // skull, tilted
    const skull = new THREE.Group()
    skull.position.set(top[0] + (pose === 'lean' ? 0.12 : 0), top[1] + 0.1, top[2] + 0.04)
    skull.rotation.set(0.5 + lean * 0.6, (r() - 0.5) * 0.8, pose === 'lean' ? 0.7 : (r() - 0.5) * 0.4)
    skull.add(ball(0.1, 0.1, 0.11, bone, 0, 0, 0, 12))
    skull.add(ball(0.07, 0.05, 0.07, bone, 0, -0.06, 0.06, 8))
    for (const s of [-1, 1]) skull.add(ball(0.025, 0.025, 0.012, M('#1a1418'), s * 0.04, 0.0, 0.095, 6))
    g.add(skull)
    // arms hanging, legs folded in front
    for (const s of [-1, 1]) {
      const sh: V3 = [top[0] + s * 0.14, top[1] - 0.08, top[2] + 0.02]
      const el: V3 = [sh[0] + s * 0.05, sh[1] - 0.24, sh[2] + 0.1]
      const wr: V3 = [el[0] - s * 0.02, 0.05, el[2] + 0.16]
      g.add(rod(sh, el, 0.02, 0.018, bone, 6))
      g.add(rod(el, wr, 0.016, 0.014, boneD, 6))
      if (pose === 'heap') {
        g.add(rod([s * 0.1, 0.05, pz + 0.05], [s * 0.18, 0.05, pz + 0.45], 0.024, 0.02, bone, 6))
        g.add(rod([s * 0.18, 0.05, pz + 0.45], [s * 0.05, 0.04, pz + 0.7], 0.02, 0.016, boneD, 6))
      } else {
        const knee: V3 = [s * 0.13, 0.3, pz + 0.38]
        const foot: V3 = [s * 0.15, 0.04, pz + 0.62]
        g.add(rod([s * 0.08, 0.13, pz + 0.02], knee, 0.026, 0.022, bone, 6))
        g.add(rod(knee, foot, 0.02, 0.018, boneD, 6))
      }
    }
    // rags that fall apart at a touch
    g.add(bx(0.32, 0.16, 0.3, rag, 0, 0.04, pz + 0.12))
    for (let i = 0; i < 4; i++) {
      const piece = bx(0.12 + r() * 0.14, 0.02, 0.1 + r() * 0.12, i % 2 ? rag : ragD, (r() - 0.5) * 0.5, 0.01, pz + 0.2 + r() * 0.4)
      piece.rotation.y = r() * Math.PI
      g.add(piece)
    }
    const merged = finalize(g)
    const mats: THREE.MeshToonMaterial[] = []
    merged.userData.phase = ctx.rand() * 10
    // crystals grown into the ribs and the spine
    if (crystals) {
      const m = crystalMat(PAL.spira)
      const cg = new THREE.Group()
      for (const tip of ribTips) {
        if (r() < 0.45) continue
        const h = 0.07 + r() * 0.08
        cg.add(crystal(m, 0.02 + h * 0.15, h, tip, (r() - 0.5) * 0.9, (r() - 0.5) * 0.9, r() * 6))
      }
      for (let i = 1; i < spine.length - 1; i += 2) {
        const p = spine[i]
        const h = 0.06 + r() * 0.07
        cg.add(crystal(m, 0.02 + h * 0.15, h, [p[0] + 0.03, p[1], p[2] + 0.04], 0.6, (r() - 0.5) * 0.8, r() * 6))
      }
      merged.add(finalize(cg))
      mats.push(m)
    }
    if (best || dead) {
      const p = spine[3]
      const col = dead ? '#8a8690' : '#6a1fd0'
      const bm = dead ? M('#9a96a0') : crystalMat(col)
      const big = crystal(bm, 0.07, 0.26, [p[0] + 0.02, p[1] - 0.05, p[2] + 0.07], 0.9, 0.15, 0.4)
      merged.add(big)
      if (!dead) {
        const core = ball(0.035, 0.05, 0.035, uniqueGlow('#d8a8ff', 2.4), p[0] + 0.02, p[1] + 0.05, p[2] + 0.16, 8)
        keep(core)
        merged.add(fx(core))
        merged.userData.core = core
        mats.push(bm as THREE.MeshToonMaterial)
      }
    }
    merged.userData.mats = mats
    return merged
  },
  animate: (obj, t) => {
    const mats = obj.userData.mats as THREE.MeshToonMaterial[] | undefined
    const p = Number(obj.userData.phase) || 0
    if (mats) for (const m of mats) m.emissiveIntensity = (Number(m.userData.base) || 1.2) * (0.82 + 0.22 * Math.sin(t * 1.8 + p) + 0.06 * Math.sin(t * 5.3 + p))
    const core = obj.userData.core as THREE.Mesh | undefined
    if (core) {
      const k = 0.6 + 0.4 * Math.sin(t * 1.1)
      core.scale.setScalar(0.85 + 0.25 * k)
      const m = core.material as THREE.MeshBasicMaterial
      m.color.copy(m.userData.base as THREE.Color).multiplyScalar(0.55 + 0.6 * k)
    }
  },
})

// ---------------------------------------------------------------------------------- spirit lamp
/** Kitsune's spirit (ethanol) street lamp on an iron post. params: lit */
registerProp('ch10_lamp', {
  solid: true,
  light: (ctx) => (bool(ctx, 'lit') ? { color: '#ffd28a', intensity: 2.6, distance: 6.5, y: 2.3, flicker: true } : null),
  build: (ctx) => {
    const lit = bool(ctx, 'lit')
    const g = new THREE.Group()
    const iron = M('#2e3036')
    const brass = M(PAL.brass)
    g.add(cy(0.12, 0.15, 0.16, F(PAL.stoneDark), 0, 0, 0, 8))
    g.add(cy(0.045, 0.06, 2.1, iron, 0, 0.1, 0, 8))
    g.add(cy(0.07, 0.07, 0.06, brass, 0, 1.0, 0, 10))
    // hook arm
    g.add(rod([0, 2.1, 0], [0.28, 2.28, 0], 0.025, 0.02, iron, 6))
    g.add(rod([0.28, 2.28, 0], [0.3, 2.16, 0], 0.012, 0.012, iron, 4))
    // lamp head
    g.add(cy(0.12, 0.08, 0.05, iron, 0.3, 2.08, 0, 6))
    g.add(cy(0.03, 0.13, 0.08, iron, 0.3, 2.34, 0, 6))
    const glass = lit ? glowMat('#ffd890', 2.6) : M('#3a4048', { opacity: 0.85, transparent: true })
    g.add(cy(0.09, 0.07, 0.2, glass, 0.3, 2.13, 0, 6))
    if (lit) g.add(ball(0.035, 0.05, 0.035, glowMat('#fff2c0', 3.2), 0.3, 2.2, 0, 8))
    return finalize(g)
  },
})

// ---------------------------------------------------------------------------------- acid jar
/** Thick glass jar of green acid. params: crystals (0..9 smouldering at the bottom). */
registerProp('ch10_jar', {
  solid: true,
  light: (ctx) => {
    const n = num(ctx, 'crystals', 0)
    return n > 0 ? { color: '#9a5aff', intensity: 0.8 + n * 0.12, distance: 3.2, y: 0.45 } : { color: '#7be08a', intensity: 0.5, distance: 2.4, y: 0.5 }
  },
  build: (ctx) => {
    const n = Math.max(0, Math.min(9, Math.round(num(ctx, 'crystals', 0))))
    const g = new THREE.Group()
    const r = seeded('jar')
    const acid = new THREE.MeshToonMaterial({ color: '#4fb86a', emissive: new THREE.Color('#2a8a40'), emissiveIntensity: 0.6, transparent: true, opacity: 0.72 })
    acid.userData.keepTransparent = true
    const glass = new THREE.MeshToonMaterial({ color: '#d8f0e0', transparent: true, opacity: 0.22, depthWrite: false })
    glass.userData.keepTransparent = true
    g.add(cy(0.22, 0.22, 0.04, M('#3a3a34'), 0, 0, 0, 16))
    g.add(cy(0.19, 0.19, 0.5, acid, 0, 0.04, 0, 16))
    const shell = cy(0.21, 0.21, 0.62, glass, 0, 0.03, 0, 16)
    shell.castShadow = false
    g.add(shell)
    g.add(cy(0.17, 0.2, 0.06, M('#5a4a3a'), 0, 0.66, 0, 16))
    const merged = finalize(g)
    if (n > 0) {
      const cm = uniqueGlow('#9a4aff', 1.6)
      const cg = new THREE.Group()
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2
        const d = r() * 0.12
        cg.add(crystal(cm, 0.025, 0.07 + r() * 0.04, [Math.cos(a) * d, 0.05, Math.sin(a) * d], (r() - 0.5) * 1.4, (r() - 0.5) * 1.4, r() * 6))
      }
      keep(cg)
      merged.add(fx(cg))
      merged.userData.smoulder = cm
    }
    return merged
  },
  animate: (obj, t) => {
    const m = obj.userData.smoulder as THREE.MeshBasicMaterial | undefined
    if (!m) return
    m.color.copy(m.userData.base as THREE.Color).multiplyScalar(0.55 + 0.25 * Math.sin(t * 0.9) + 0.1 * Math.sin(t * 2.7))
  },
})
