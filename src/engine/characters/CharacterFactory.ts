import * as THREE from 'three'
import type { Accessory, CharacterLook, Species } from './look'
import { toon, markFx } from '../toon'
import { faceGeometry, faceTexture, type Expression, type FaceSpec, type FaceStyle } from './Face'

/**
 * Builds a rigged, cel-shaded anime character from a CharacterLook. The rig
 * is a hierarchy of Groups (no skinning) animated procedurally by the
 * Animator. The model faces +Z; its left side is +X.
 */
export interface Rig {
  root: THREE.Group
  body: THREE.Group
  hips: THREE.Group
  spine: THREE.Group
  chest: THREE.Group
  neck: THREE.Group
  head: THREE.Group
  armL: THREE.Group
  armR: THREE.Group
  elbowL: THREE.Group
  elbowR: THREE.Group
  handL: THREE.Group
  handR: THREE.Group
  legL: THREE.Group
  legR: THREE.Group
  kneeL: THREE.Group
  kneeR: THREE.Group
  tail: THREE.Group[]
  ears: THREE.Object3D[]
  skirt: THREE.Object3D | null
  /** height of the eyes above the feet */
  eyeHeight: number
  /** top of the head */
  height: number
}

export interface FaceControl {
  mesh: THREE.Mesh
  spec: FaceSpec
  expr: Expression
  blink: boolean
  mouth: boolean
  apply(): void
}

export interface CharacterModel {
  rig: Rig
  materials: THREE.Material[]
  glyphMaterial: THREE.MeshBasicMaterial
  glyphColor: THREE.Color
  species: Species
  quadruped: false
  face: FaceControl | null
}

const geoCache = new Map<string, THREE.BufferGeometry>()
function G(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(key)
  if (!g) {
    g = make()
    geoCache.set(key, g)
  }
  return g
}

function m(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function shade(c: string, k: number): string {
  return '#' + new THREE.Color(c).multiplyScalar(k).getHexString()
}

let spotTexCache: Map<string, THREE.CanvasTexture> | null = null
function spotTexture(base: string, spot: string, kind: 'spots' | 'stripes'): THREE.CanvasTexture {
  spotTexCache ??= new Map()
  const key = `${base}|${spot}|${kind}`
  const hit = spotTexCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 128, 128)
  let s = 1234567
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  ctx.strokeStyle = spot
  ctx.fillStyle = spot
  if (kind === 'spots') {
    for (let i = 0; i < 24; i++) {
      const x = r() * 128
      const y = r() * 128
      ctx.globalAlpha = 0.5
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.arc(x, y, 4 + r() * 4, r() * 2, r() * 2 + 4.2)
      ctx.stroke()
    }
  } else {
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = 0.5
      ctx.fillRect(0, i * 14 + r() * 4, 128, 3 + r() * 3)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  spotTexCache.set(key, tex)
  return tex
}

interface Dims {
  thigh: number
  shin: number
  hipY: number
  torso: number
  shoulderW: number
  hipW: number
  headR: number
  upperArm: number
  forearm: number
  limbR: number
  torsoR: number
  scale: number
  hunch: number
  female: boolean
}

function dims(look: CharacterLook): Dims {
  const b = look.build ?? 'average'
  const w = b === 'broad' ? 1.24 : b === 'slim' ? 0.9 : b === 'small' ? 0.92 : b === 'old' ? 0.96 : b === 'child' ? 0.92 : 1
  const female = (look.face ?? 'female') === 'female'
  const headK = b === 'child' ? 1.3 : 1
  const scale = (look.height ?? 1) * (b === 'child' ? 0.6 : b === 'small' ? 0.9 : b === 'old' ? 0.94 : 1)
  return {
    thigh: 0.42,
    shin: 0.41,
    hipY: 0.9,
    torso: b === 'broad' ? 0.47 : 0.44,
    shoulderW: (female ? 0.165 : 0.19) * w,
    hipW: (female ? 0.09 : 0.085) * w,
    headR: 0.175 * headK,
    upperArm: 0.28,
    forearm: 0.26,
    limbR: (female ? 0.044 : 0.05) * (b === 'broad' ? 1.22 : 1),
    torsoR: (female ? 0.145 : 0.165) * w,
    scale,
    hunch: b === 'old' ? 0.3 : 0,
    female,
  }
}

export function buildCharacter(look: CharacterLook): CharacterModel {
  const d = dims(look)
  const mats: THREE.Material[] = []
  const T = (color: string, flat = false, opts: { emissive?: string; ei?: number; side?: THREE.Side } = {}) => {
    const mt = toon(color, { flat, rim: true, ...opts })
    mats.push(mt)
    return mt
  }
  const isMako = look.species === 'mako'
  const caste = look.caste ?? 'pursang'
  const animalHead = caste === 'ghorki' && look.species !== 'human' && !isMako
  const pattern = look.furPattern && look.furPattern !== 'none' ? look.furPattern : null
  const skin = T(isMako ? look.metal ?? '#6f757c' : look.skin)
  if (pattern && !isMako) {
    skin.map = spotTexture(look.skin, shade(look.skin, 0.58), pattern)
    skin.color.set('#ffffff')
  }
  const hairColor = look.hair?.color ?? look.fur ?? look.skin
  const furColor = look.fur ?? hairColor
  const fur = T(furColor)
  const furTip = T(look.furTip ?? '#f4ede4')
  const earInner = T(look.species === 'fox' || look.species === 'wolf' ? (look.furTip ?? '#f4ede4') : '#e8a6a6')
  const hair = T(hairColor)
  const o = look.outfit
  const cloth1 = T(o.primary)
  const cloth2 = T(o.secondary ?? shade(o.primary, 0.62))
  const trim = T(o.trim ?? '#c9a45c')
  const leather = T('#3b2a1f')
  const pantsM = T(o.pants ?? o.secondary ?? shade(o.primary, 0.5))
  const metal = T('#9aa0a8', true)
  const dark = T('#17161b')
  const glyphColor = new THREE.Color(look.glyph ?? '#7ff6ff')
  const glyphMat = new THREE.MeshBasicMaterial({ color: glyphColor.clone().multiplyScalar(0.4), toneMapped: false })
  mats.push(glyphMat)

  const root = new THREE.Group()
  root.name = 'character'
  const body = new THREE.Group()
  root.add(body)
  const hips = new THREE.Group()
  hips.position.y = d.hipY
  body.add(hips)

  const robeLike = o.type === 'robe' || o.type === 'dress' || o.type === 'silk'
  const legMat = robeLike ? (o.type === 'silk' ? skin : cloth2) : pantsM
  const boots = o.boots ?? (robeLike ? 'short' : 'tall')

  // ---------------------------------------------------------------- legs
  const mkLeg = (side: 1 | -1) => {
    const leg = new THREE.Group()
    leg.position.set(side * d.hipW, 0, 0)
    hips.add(leg)
    leg.add(m(G(`thigh${d.limbR}`, () => new THREE.CylinderGeometry(d.limbR * 1.45, d.limbR * 1.1, d.thigh, 10).translate(0, -d.thigh / 2, 0)), legMat))
    const knee = new THREE.Group()
    knee.position.y = -d.thigh
    leg.add(knee)
    knee.add(m(G(`shin${d.limbR}`, () => new THREE.CylinderGeometry(d.limbR * 1.05, d.limbR * 0.78, d.shin, 10).translate(0, -d.shin / 2, 0)), boots === 'tall' ? leather : legMat))
    if (boots === 'tall') {
      knee.add(m(G(`bootcuff${d.limbR}`, () => new THREE.CylinderGeometry(d.limbR * 1.35, d.limbR * 1.25, 0.06, 10)), leather, 0, -0.03, 0))
    }
    if (boots !== 'none') {
      knee.add(m(G('boot', () => new THREE.CapsuleGeometry(0.045, 0.1, 3, 8).rotateX(Math.PI / 2).translate(0, -0.035, 0.035)), leather, 0, -d.shin + 0.035, 0))
    } else {
      knee.add(m(G('foot', () => new THREE.CapsuleGeometry(0.035, 0.08, 3, 6).rotateX(Math.PI / 2).translate(0, -0.03, 0.03)), skin, 0, -d.shin + 0.03, 0))
    }
    return { leg, knee }
  }
  const L = mkLeg(1)
  const R = mkLeg(-1)

  // ---------------------------------------------------------------- torso
  const spine = new THREE.Group()
  spine.rotation.x = d.hunch
  hips.add(spine)
  const torsoGeo = G(`torso${d.torsoR}${d.torso}${d.female}`, () => {
    const pts: THREE.Vector2[] = []
    const steps = 8
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // waist narrower, chest fuller, shoulders rounded
      const waist = 0.78
      let r = d.torsoR * (t < 0.35 ? THREE.MathUtils.lerp(0.92, waist, t / 0.35) : THREE.MathUtils.lerp(waist, 1, Math.min(1, (t - 0.35) / 0.45)))
      if (t > 0.88) r *= 1 - (t - 0.88) * 2.4
      pts.push(new THREE.Vector2(r, t * d.torso))
    }
    const g = new THREE.LatheGeometry(pts, 12)
    g.scale(1, 1, 0.74)
    return g
  })
  spine.add(m(torsoGeo, o.type === 'armor' ? metal : cloth1))
  if (d.female && o.type !== 'armor') {
    spine.add(m(G(`bust${d.torsoR}`, () => new THREE.SphereGeometry(d.torsoR * 0.42, 10, 8).scale(1.6, 0.9, 0.8)), cloth1, 0, d.torso * 0.66, d.torsoR * 0.48))
  }
  // corset / bodice
  if (o.corset) {
    const cm = T(o.corset)
    spine.add(m(G(`corset${d.torsoR}`, () => new THREE.CylinderGeometry(d.torsoR * 0.86, d.torsoR * 0.82, d.torso * 0.42, 12).scale(1, 1, 0.78)), cm, 0, d.torso * 0.28, 0))
    for (let i = 0; i < 3; i++) spine.add(m(G('lace', () => new THREE.BoxGeometry(0.06, 0.008, 0.01)), dark, 0, d.torso * (0.14 + i * 0.1), d.torsoR * 0.66))
  }
  // waist belt(s)
  const belts = o.belts ?? (o.type === 'coat' || o.type === 'jacket' || o.type === 'vest' ? 1 : 0)
  const beltRing = (y: number, r: number) => m(G(`belt${r.toFixed(3)}`, () => new THREE.TorusGeometry(r, 0.016, 5, 16).rotateX(Math.PI / 2).scale(1, 1, 0.78)), leather, 0, y, 0)
  if (robeLike) spine.add(m(G(`sashring${d.torsoR}`, () => new THREE.TorusGeometry(d.torsoR * 0.8, 0.024, 5, 16).rotateX(Math.PI / 2).scale(1, 1, 0.78)), trim, 0, 0.06, 0))
  for (let i = 0; i < belts; i++) {
    spine.add(beltRing(0.04 + i * 0.05, d.torsoR * 0.82))
    spine.add(m(G('buckle', () => new THREE.BoxGeometry(0.035, 0.03, 0.012)), trim, 0, 0.04 + i * 0.05, d.torsoR * 0.66))
    if (i > 0) spine.add(m(G('pouch', () => new THREE.BoxGeometry(0.06, 0.06, 0.04)), leather, d.torsoR * 0.7, 0.02, d.torsoR * 0.35))
  }
  if (belts >= 2) {
    // cross strap over the chest
    const strap = m(G(`strap${d.torso}`, () => new THREE.BoxGeometry(0.03, d.torso * 1.15, 0.012)), leather, 0, d.torso * 0.55, d.torsoR * 0.7)
    strap.rotation.z = 0.55
    spine.add(strap)
  }
  if (o.type === 'armor') {
    spine.add(m(G('tabard', () => new THREE.BoxGeometry(0.16, 0.42, 0.02)), cloth1, 0, d.torso * 0.45, d.torsoR * 0.74))
  }
  if (o.type === 'apron') {
    spine.add(m(G('apron', () => new THREE.BoxGeometry(0.2, 0.62, 0.02)), trim, 0, d.torso * 0.25, d.torsoR * 0.72))
  }
  if (o.type === 'vest') {
    spine.add(m(G(`vestfront${d.torsoR}`, () => new THREE.BoxGeometry(d.torsoR * 0.55, d.torso * 0.9, 0.012)), cloth2, 0, d.torso * 0.5, d.torsoR * 0.72))
  }

  // ---------------------------------------------------------------- skirt / coat tails
  let skirt: THREE.Object3D | null = null
  const skirtLen =
    o.type === 'robe' || o.type === 'silk' ? 0.8 : o.type === 'dress' ? 0.66 : o.type === 'coat' ? 0.68 : o.type === 'tunic' || o.type === 'rags' || o.type === 'apron' ? 0.3 : 0
  if (skirtLen > 0) {
    const flare = o.type === 'coat' ? 1.55 : o.type === 'silk' ? 1.5 : 1.75
    const open = o.type === 'coat'
    const g = new THREE.CylinderGeometry(d.torsoR * 0.9, d.torsoR * flare, skirtLen, 16, 2, open, open ? Math.PI * 0.14 : 0, open ? Math.PI * 1.72 : Math.PI * 2)
    g.scale(1, 1, 0.84)
    g.translate(0, -skirtLen / 2 + 0.04, 0)
    if (open) g.rotateY(Math.PI)
    const sm = m(g, open ? T(o.primary, false, { side: THREE.DoubleSide }) : cloth1)
    hips.add(sm)
    skirt = sm
    if (o.type === 'robe' || o.type === 'silk') hips.add(m(G('sash', () => new THREE.BoxGeometry(0.05, 0.6, 0.012)), trim, 0, -0.3, d.torsoR * 0.82))
    if (o.type === 'rags') sm.scale.set(1, 1, 1)
  }

  // ---------------------------------------------------------------- chest, arms
  const chest = new THREE.Group()
  chest.position.y = d.torso
  spine.add(chest)
  if (o.furCollar) {
    const fc = T(o.furCollar)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const tuft = m(G('collartuft', () => new THREE.SphereGeometry(0.04, 7, 5).scale(1.25, 0.85, 1)), fc, Math.sin(a) * 0.1, (Math.cos(a) > 0 ? -0.025 : 0.012), Math.cos(a) * 0.075)
      tuft.rotation.set(0, a, 0.3)
      chest.add(tuft)
    }
  }
  if (o.hood) {
    chest.add(m(G('hoodback', () => new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(1.1, 0.7, 1)), cloth1, 0, 0.0, -0.08))
  }
  if (o.emblem) {
    const em = m(G('emblem', () => new THREE.BoxGeometry(0.045, 0.06, 0.01)), trim, d.shoulderW * 0.95, -0.07, 0.04)
    em.rotation.y = 1.0
    chest.add(em)
  }
  const sleeves = o.sleeves ?? (o.type === 'vest' || o.type === 'rags' || o.type === 'silk' ? 'short' : 'long')
  const sleeveR = d.limbR * (o.type === 'robe' ? 1.55 : 1.18)
  const mkArm = (side: 1 | -1) => {
    const arm = new THREE.Group()
    arm.position.set(side * d.shoulderW, -0.045, 0)
    arm.rotation.z = side * 0.1
    chest.add(arm)
    arm.add(m(G(`shoulder${sleeveR}`, () => new THREE.SphereGeometry(sleeveR * 1.3, 10, 8)), o.type === 'armor' ? metal : sleeves === 'none' ? skin : cloth1))
    arm.add(m(G(`upper${sleeveR}`, () => new THREE.CylinderGeometry(sleeveR, sleeveR * 0.9, d.upperArm, 10).translate(0, -d.upperArm / 2, 0)), sleeves === 'none' ? skin : o.type === 'vest' ? cloth2 : cloth1))
    const elbow = new THREE.Group()
    elbow.position.y = -d.upperArm
    arm.add(elbow)
    const bareFore = sleeves !== 'long' || o.type === 'robe'
    elbow.add(m(G(`fore${d.limbR}`, () => new THREE.CylinderGeometry(d.limbR * 0.98, d.limbR * 0.76, d.forearm, 10).translate(0, -d.forearm / 2, 0)), bareFore ? skin : cloth1))
    if (o.type === 'robe') {
      elbow.add(m(G(`cuff${sleeveR}`, () => new THREE.CylinderGeometry(sleeveR * 1.0, sleeveR * 1.45, 0.16, 10, 1, true).translate(0, -0.08, 0)), T(o.primary, false, { side: THREE.DoubleSide })))
    } else if (!bareFore) {
      elbow.add(m(G(`rollcuff${d.limbR}`, () => new THREE.TorusGeometry(d.limbR * 1.02, 0.014, 5, 10).rotateX(Math.PI / 2)), cloth2, 0, -d.forearm * 0.82, 0))
    }
    if (o.bandage && side === -1) {
      const band = T('#e9e2d4')
      for (let i = 0; i < 4; i++) elbow.add(m(G('bandage', () => new THREE.TorusGeometry(d.limbR * 0.92, 0.012, 4, 10).rotateX(Math.PI / 2 + 0.25)), band, 0, -0.05 - i * 0.045, 0))
    }
    // glyph tattoo on the forearm
    const tattoo = look.tattoo ?? (look.glyph ? 'forearms' : 'none')
    if (tattoo !== 'none') {
      const glyphs = new THREE.Group()
      for (let i = 0; i < 3; i++) glyphs.add(m(G(`band${i}${d.limbR}`, () => new THREE.TorusGeometry(d.limbR * 0.95, 0.005, 3, 12).rotateX(Math.PI / 2)), glyphMat, 0, -0.07 - i * 0.055, 0))
      glyphs.add(m(G('tline', () => new THREE.BoxGeometry(0.007, d.forearm * 0.75, 0.007)), glyphMat, 0, -d.forearm * 0.45, d.limbR * 0.9))
      if (tattoo === 'arms' || tattoo === 'full') glyphs.add(m(G('tline2', () => new THREE.BoxGeometry(0.007, d.upperArm * 0.8, 0.007)), glyphMat, 0, d.upperArm * 0.5, sleeveR * 1.0))
      markFx(glyphs)
      glyphs.traverse((g) => (g.castShadow = false))
      elbow.add(glyphs)
    }
    const hand = new THREE.Group()
    hand.position.y = -d.forearm
    elbow.add(hand)
    const glove = o.gloves ? T(o.gloves) : null
    hand.add(m(G('hand', () => new THREE.SphereGeometry(0.04, 8, 6).scale(0.9, 1.25, 0.7)), glove ?? skin, 0, -0.03, 0))
    return { arm, elbow, hand }
  }
  const AL = mkArm(1)
  const AR = mkArm(-1)

  // ---------------------------------------------------------------- head
  const neck = new THREE.Group()
  neck.position.y = 0.035
  chest.add(neck)
  neck.add(m(G('neck', () => new THREE.CylinderGeometry(0.042, 0.05, 0.1, 8).translate(0, 0.05, 0)), skin))
  const head = new THREE.Group()
  head.position.y = 0.085 + d.headR
  neck.add(head)
  const headMat = animalHead ? fur : skin
  head.add(
    m(
      G(`head${d.headR}${animalHead}`, () => {
        const g = new THREE.SphereGeometry(d.headR, 20, 16)
        // anime head: slightly narrower jaw
        const p = g.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < p.count; i++) {
          const y = p.getY(i)
          if (y < 0) {
            const k = 1 + (y / d.headR) * 0.22
            p.setX(i, p.getX(i) * k)
            p.setZ(i, p.getZ(i) * (1 + (y / d.headR) * 0.08))
          }
        }
        g.scale(0.94, 1.02, 0.96)
        g.computeVertexNormals()
        return g
      }),
      headMat,
    ),
  )
  // muzzle for Mezra / Ghorki
  if ((caste === 'mezra' || animalHead) && look.species !== 'human' && !isMako) {
    const longSnout = ['wolf', 'fox', 'goat'].includes(look.species)
    const len = animalHead ? (longSnout ? 0.15 : 0.09) : 0.05
    head.add(m(G(`snout${len}`, () => new THREE.SphereGeometry(d.headR * 0.42, 10, 8).scale(1, 0.8, 1 + len * 6)), animalHead ? fur : furTip, 0, -d.headR * 0.36, d.headR * 0.62 + len * 0.6))
    head.add(m(G('nose', () => new THREE.SphereGeometry(0.016, 6, 5)), dark, 0, -d.headR * 0.28, d.headR * 0.78 + len * 1.15))
  }
  // anime face decal
  let face: FaceControl | null = null
  if (isMako) {
    for (const side of [1, -1] as const) {
      const ring = new THREE.Mesh(G('makoeye', () => new THREE.TorusGeometry(0.026, 0.007, 6, 14)), new THREE.MeshBasicMaterial({ color: new THREE.Color('#9fe8ff').multiplyScalar(2.4), toneMapped: false }))
      ring.position.set(side * d.headR * 0.34, d.headR * 0.02, d.headR * 0.93)
      markFx(ring)
      head.add(ring)
    }
  } else {
    const style: FaceStyle = animalHead ? 'beast' : look.face ?? (look.build === 'child' ? 'child' : look.build === 'old' ? 'old' : 'female')
    const spec: FaceSpec = {
      iris: look.eyes ?? '#6a4a2a',
      brow: shade(hairColor, hairColor === '#ffffff' ? 0.7 : 0.8),
      style,
      slit: (caste !== 'pursang' && ['cat', 'leopard', 'lynx', 'fox'].includes(look.species)) || animalHead,
      mark: look.mark,
      special: 'none',
      skin: look.skin,
    }
    const fmat = new THREE.MeshToonMaterial({ map: faceTexture(spec, 'neutral', false, false), transparent: true, alphaTest: 0.02, depthWrite: false })
    mats.push(fmat)
    const fm = new THREE.Mesh(G(`face${d.headR}`, () => faceGeometry(d.headR * 1.012)), fmat)
    fm.renderOrder = 2
    markFx(fm)
    head.add(fm)
    face = {
      mesh: fm,
      spec,
      expr: 'neutral',
      blink: false,
      mouth: false,
      apply() {
        fmat.map = faceTexture(this.spec, this.expr, this.blink, this.mouth)
        fmat.needsUpdate = true
      },
    }
  }
  // ears
  const ears: THREE.Object3D[] = []
  const earShape = earFor(look.species)
  if (earShape) {
    for (const side of [1, -1] as const) {
      if (look.ear === 'missing' && side === 1) continue
      const ear = new THREE.Group()
      ear.position.set(side * d.headR * earShape.x, d.headR * earShape.y, -d.headR * 0.12)
      ear.rotation.z = -side * earShape.tilt
      ear.rotation.y = side * 0.25
      head.add(ear)
      const em = m(G(`ear${look.species}`, earShape.geo), earShape.skinColored ? skin : fur)
      if (look.ear === 'torn' && side === 1) {
        em.scale.set(0.85, 0.72, 1)
        em.rotation.z = 0.25
      }
      ear.add(em)
      if (earShape.inner) {
        const inner = m(G(`earin${look.species}`, () => earShape.geo().scale(0.62, 0.72, 0.5).translate(0, -0.005, 0.012)), earInner)
        inner.castShadow = false
        ear.add(inner)
      }
      if (look.species === 'lynx') ear.add(m(G('tuft', () => new THREE.ConeGeometry(0.01, 0.08, 4).translate(0, 0.17, 0)), dark))
      ears.push(ear)
    }
  }
  if (look.species === 'goat') {
    for (const side of [1, -1] as const) {
      const horn = m(G('horn', () => new THREE.ConeGeometry(0.026, 0.2, 7).translate(0, 0.1, 0)), T('#d8cbb0'), side * d.headR * 0.42, d.headR * 0.78, -d.headR * 0.2)
      horn.rotation.x = -0.65
      horn.rotation.z = -side * 0.3
      head.add(horn)
    }
  }
  if (look.hair && look.hair.style !== 'bald') addHair(head, look.hair.style, hair, d.headR, look.hairShine ?? shade(hairColor, 2.2))
  for (const a of look.accessories ?? []) addHeadAccessory(head, a, d.headR, { metal, dark, leather, trim, cloth1, T })

  // ---------------------------------------------------------------- tail
  const tail: THREE.Group[] = []
  const tailKind = look.tail ?? tailFor(look.species)
  if (tailKind !== 'none') {
    const segs = tailKind === 'long' ? 9 : tailKind === 'bushy' ? 8 : tailKind === 'stub' ? 2 : 1
    const len = tailKind === 'long' ? 0.08 : tailKind === 'bushy' ? 0.085 : 0.055
    const base = new THREE.Group()
    base.position.set(0, -0.07, -d.torsoR * 0.68)
    base.rotation.x = tailKind === 'long' ? -1.0 : tailKind === 'bushy' ? -0.75 : -1.25
    hips.add(base)
    let parent: THREE.Object3D = base
    for (let i = 0; i < segs; i++) {
      const seg = new THREE.Group()
      seg.position.y = i === 0 ? 0 : len
      parent.add(seg)
      let r: number
      if (tailKind === 'bushy') r = 0.03 + Math.sin(((i + 0.6) / segs) * Math.PI) * 0.06
      else if (tailKind === 'puff') r = 0.055
      else r = 0.026 * (1 - i / (segs * 1.5))
      const isTip = tailKind === 'bushy' && i >= segs - 2
      const g = G(`tailseg${tailKind}${i}`, () => (tailKind === 'puff' ? new THREE.SphereGeometry(r, 8, 6) : tailKind === 'bushy' ? new THREE.SphereGeometry(r, 9, 7).scale(1, 1.25, 1).translate(0, len / 2, 0) : new THREE.CylinderGeometry(r * 0.88, r, len * 1.2, 8).translate(0, len / 2, 0)))
      seg.add(m(g, isTip ? furTip : fur))
      tail.push(seg)
      parent = seg
    }
  }

  for (const a of look.accessories ?? []) addBodyAccessory(a, { hips, chest, spine, handL: AL.hand, handR: AR.hand, elbowL: AL.elbow, d, metal, dark, leather, trim, cloth1, T, glyphMat })

  root.scale.setScalar(d.scale)
  const headWorldY = (d.hipY + d.torso + 0.035 + 0.085 + d.headR) * d.scale
  return {
    rig: {
      root,
      body,
      hips,
      spine,
      chest,
      neck,
      head,
      armL: AL.arm,
      armR: AR.arm,
      elbowL: AL.elbow,
      elbowR: AR.elbow,
      handL: AL.hand,
      handR: AR.hand,
      legL: L.leg,
      legR: R.leg,
      kneeL: L.knee,
      kneeR: R.knee,
      tail,
      ears,
      skirt,
      eyeHeight: headWorldY,
      height: headWorldY + d.headR * d.scale + (earShape && !earShape.skinColored ? 0.12 * d.scale : 0),
    },
    materials: mats,
    glyphMaterial: glyphMat,
    glyphColor,
    species: look.species,
    quadruped: false,
    face,
  }
}

interface EarShape {
  geo: () => THREE.BufferGeometry
  x: number
  y: number
  tilt: number
  skinColored?: boolean
  inner?: boolean
}

function earFor(s: Species): EarShape | null {
  // flattened cones read as anime animal ears
  const flatCone = (r: number, h: number) => () => new THREE.ConeGeometry(r, h, 3).rotateY(Math.PI / 6).scale(1, 1, 0.42).translate(0, h / 2, 0)
  switch (s) {
    case 'cat':
    case 'leopard':
      return { geo: flatCone(0.07, 0.15), x: 0.55, y: 0.74, tilt: 0.3, inner: true }
    case 'lynx':
      return { geo: flatCone(0.075, 0.17), x: 0.55, y: 0.74, tilt: 0.22, inner: true }
    case 'fox':
      return { geo: flatCone(0.085, 0.21), x: 0.55, y: 0.72, tilt: 0.32, inner: true }
    case 'wolf':
      return { geo: flatCone(0.08, 0.18), x: 0.5, y: 0.77, tilt: 0.18, inner: true }
    case 'rabbit':
      return { geo: () => new THREE.CapsuleGeometry(0.032, 0.24, 3, 8).scale(1, 1, 0.5).translate(0, 0.15, 0), x: 0.34, y: 0.82, tilt: 0.12, inner: true }
    case 'goat':
      return { geo: () => new THREE.CapsuleGeometry(0.024, 0.08, 2, 6).rotateZ(Math.PI / 2).translate(0.05, 0, 0), x: 0.8, y: 0.35, tilt: -0.2 }
    case 'bear':
      return { geo: () => new THREE.SphereGeometry(0.045, 8, 6), x: 0.62, y: 0.72, tilt: 0 }
    case 'human':
      return { geo: () => new THREE.SphereGeometry(0.028, 6, 5).scale(0.5, 1, 0.8), x: 0.95, y: 0, tilt: 0, skinColored: true }
    default:
      return null
  }
}

function tailFor(s: Species): 'long' | 'bushy' | 'stub' | 'puff' | 'none' {
  switch (s) {
    case 'cat':
    case 'leopard':
      return 'long'
    case 'fox':
    case 'wolf':
      return 'bushy'
    case 'lynx':
    case 'goat':
    case 'bear':
      return 'stub'
    case 'rabbit':
      return 'puff'
    default:
      return 'none'
  }
}

/** Anime hair: a cap plus clumped locks (bangs, side locks, back) and a shine band. */
function addHair(head: THREE.Group, style: string, mat: THREE.Material, r: number, shine: string): void {
  // crown over the top, and a shell around the back/sides that leaves the face open
  const cap = new THREE.Mesh(G(`hcap${r}`, () => new THREE.SphereGeometry(r * 1.07, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.34).translate(0, r * 0.03, -r * 0.02)), mat)
  cap.castShadow = true
  head.add(cap)
  const shell = new THREE.Mesh(
    G(`hshell${r}`, () => new THREE.SphereGeometry(r * 1.07, 20, 10, Math.PI / 2 + Math.PI * 0.36, Math.PI * 1.28, Math.PI * 0.3, Math.PI * 0.34).translate(0, r * 0.03, -r * 0.02)),
    mat,
  )
  shell.castShadow = true
  head.add(shell)
  const lockGeo = (len: number, w: number) =>
    G(`lock${len.toFixed(3)}${w.toFixed(3)}`, () => {
      const g = new THREE.ConeGeometry(w, len, 5, 3)
      g.rotateX(Math.PI) // point down
      g.translate(0, -len / 2, 0)
      g.scale(1, 1, 0.5)
      // gentle curve
      const p = g.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < p.count; i++) {
        const t = -p.getY(i) / len
        p.setZ(i, p.getZ(i) + Math.sin(t * Math.PI * 0.7) * w * 0.9)
      }
      g.computeVertexNormals()
      return g
    })
  const lock = (len: number, w: number, angle: number, elev: number, tiltOut: number, z = 0) => {
    const l = new THREE.Mesh(lockGeo(len, w), mat)
    const rr = r * 1.02
    l.position.set(Math.sin(angle) * rr * Math.cos(elev), Math.sin(elev) * rr, Math.cos(angle) * rr * Math.cos(elev) + z)
    l.rotation.set(-tiltOut * Math.cos(angle) * 0.6, angle, tiltOut * Math.sin(angle) * 0.6)
    l.castShadow = true
    head.add(l)
    return l
  }
  // bangs over the forehead (all styles except cropped/mane)
  const bangs = style !== 'cropped' && style !== 'mane'
  if (bangs) {
    const n = 6
    for (let i = 0; i < n; i++) {
      const a = -0.75 + (i / (n - 1)) * 1.5
      const l = lock(r * (0.62 + (i % 2) * 0.16), r * 0.24, a, 0.62, 0.35)
      l.rotation.z += (a > 0 ? -1 : 1) * 0.15
    }
  }
  const side = (len: number) => {
    lock(len, r * 0.26, 1.35, 0.35, 0.2)
    lock(len, r * 0.26, -1.35, 0.35, 0.2)
  }
  switch (style) {
    case 'long':
      side(r * 2.2)
      for (let i = 0; i < 7; i++) lock(r * (2.7 + (i % 3) * 0.25), r * 0.36, Math.PI - 1.1 + (i / 6) * 2.2, 0.5, 0.18)
      break
    case 'bob':
      side(r * 1.25)
      for (let i = 0; i < 7; i++) lock(r * 1.15, r * 0.4, Math.PI - 1.25 + (i / 6) * 2.5, 0.45, 0.32)
      break
    case 'short':
      side(r * 0.8)
      for (let i = 0; i < 6; i++) lock(r * 0.75, r * 0.38, Math.PI - 1.2 + (i / 5) * 2.4, 0.5, 0.45)
      break
    case 'wild':
      side(r * 1.0)
      for (let i = 0; i < 10; i++) {
        const l = lock(r * (0.8 + (i % 3) * 0.3), r * 0.3, (i / 10) * Math.PI * 2, 0.75, 1.1)
        l.rotation.x -= 0.4
      }
      break
    case 'bun':
      side(r * 0.9)
      {
        const bun = new THREE.Mesh(G(`hbun${r}`, () => new THREE.SphereGeometry(r * 0.42, 10, 8)), mat)
        bun.position.set(0, r * 0.5, -r * 0.88)
        bun.castShadow = true
        head.add(bun)
      }
      break
    case 'braid':
      side(r * 1.4)
      for (let i = 0; i < 5; i++) lock(r * 0.9, r * 0.36, Math.PI - 0.9 + (i / 4) * 1.8, 0.45, 0.3)
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(G(`hbraid${r}`, () => new THREE.SphereGeometry(r * 0.19, 8, 6).scale(1, 1.3, 1)), mat)
        b.position.set(r * 0.25, -r * 0.35 - i * r * 0.36, -r * 0.95 - i * 0.004)
        b.castShadow = true
        head.add(b)
      }
      break
    case 'ponytail':
      side(r * 1.1)
      {
        const tail = new THREE.Mesh(lockGeo(r * 2.4, r * 0.4), mat)
        tail.position.set(0, r * 0.45, -r * 1.0)
        tail.castShadow = true
        head.add(tail)
      }
      break
    case 'mane':
      for (let i = 0; i < 12; i++) lock(r * 1.1, r * 0.4, (i / 12) * Math.PI * 2, 0.2, 0.9)
      break
    case 'cropped':
      break
  }
  // anime hair shine
  const shineMat = new THREE.MeshBasicMaterial({ color: shine, transparent: true, opacity: 0.55 })
  const band = new THREE.Mesh(G(`hshine${r}`, () => new THREE.TorusGeometry(r * 0.92, r * 0.06, 3, 24, Math.PI * 0.9).rotateX(Math.PI / 2).rotateY(Math.PI * 0.05)), shineMat)
  band.position.y = r * 0.62
  band.rotation.y = Math.PI * 0.55
  band.scale.set(1.05, 1, 1.05)
  markFx(band)
  head.add(band)
}

interface AccMats {
  metal: THREE.Material
  dark: THREE.Material
  leather: THREE.Material
  trim: THREE.Material
  cloth1: THREE.Material
  T: (color: string, flat?: boolean) => THREE.MeshToonMaterial
}

function addHeadAccessory(head: THREE.Group, a: Accessory, r: number, mt: AccMats): void {
  const add = (geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const mm = new THREE.Mesh(geo, material)
    mm.position.set(x, y, z)
    mm.castShadow = true
    head.add(mm)
    return mm
  }
  switch (a) {
    case 'goggles': {
      const brass = mt.T('#a0773a')
      const glass = new THREE.MeshBasicMaterial({ color: '#7fb6c8' })
      for (const s of [1, -1]) {
        const ring = add(G('goggle', () => new THREE.TorusGeometry(0.033, 0.012, 6, 12)), brass, s * r * 0.36, r * 0.74, r * 0.64)
        ring.rotation.x = -1.05
        const lens = add(G('goglens', () => new THREE.CircleGeometry(0.03, 12)), glass, s * r * 0.36, r * 0.75, r * 0.65)
        lens.rotation.x = -1.05
      }
      add(G(`gband${r}`, () => new THREE.TorusGeometry(r * 1.05, 0.011, 4, 18).rotateX(Math.PI / 2 - 0.5)), mt.leather, 0, r * 0.6, 0)
      break
    }
    case 'darkglasses': {
      const lens = mt.T('#0b0b0d', true)
      for (const s of [1, -1]) add(G('dglass', () => new THREE.CylinderGeometry(0.04, 0.04, 0.012, 14).rotateX(Math.PI / 2)), lens, s * r * 0.35, r * 0.04, r * 0.96)
      add(G('dbridge', () => new THREE.BoxGeometry(0.04, 0.006, 0.006)), mt.metal, 0, r * 0.06, r * 0.98)
      break
    }
    case 'tricorn': {
      const hat = mt.T('#2a2320')
      add(G(`tricorn${r}`, () => new THREE.CylinderGeometry(r * 1.5, r * 1.55, 0.05, 3)), hat, 0, r * 0.9, 0).rotation.y = Math.PI / 6
      add(G(`tricrown${r}`, () => new THREE.CylinderGeometry(r * 0.78, r * 0.88, r * 0.55, 10)), hat, 0, r * 1.1, 0)
      break
    }
    case 'helmet':
      add(G(`helmet${r}`, () => new THREE.SphereGeometry(r * 1.13, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)), mt.metal, 0, r * 0.06, 0)
      break
    case 'mask_cat':
    case 'mask_leopard':
    case 'mask_rabbit': {
      const color = a === 'mask_cat' ? '#f3efe8' : a === 'mask_leopard' ? '#d8a050' : '#e8e0d8'
      add(G(`mask${r}`, () => new THREE.SphereGeometry(r * 1.03, 14, 8, Math.PI / 2 - 0.95, 1.9, Math.PI * 0.28, Math.PI * 0.32)), mt.T(color), 0, 0, 0.002)
      if (a === 'mask_cat') {
        const crack = add(G('maskcrack', () => new THREE.BoxGeometry(0.005, r * 0.55, 0.01)), new THREE.MeshBasicMaterial({ color: new THREE.Color('#3f8fff').multiplyScalar(1.8), toneMapped: false }), r * 0.2, r * 0.12, r * 0.98)
        crack.rotation.z = 0.4
        markFx(crack)
      }
      break
    }
    case 'pipe':
      add(G('pipe', () => new THREE.CylinderGeometry(0.007, 0.007, 0.11, 5).rotateX(Math.PI / 2.3)), mt.leather, r * 0.22, -r * 0.48, r * 0.95)
      add(G('pipebowl', () => new THREE.CylinderGeometry(0.02, 0.015, 0.035, 7)), mt.leather, r * 0.22, -r * 0.44, r * 1.25)
      break
    case 'scarf':
      add(G(`scarf${r}`, () => new THREE.TorusGeometry(r * 0.5, 0.032, 6, 14).rotateX(Math.PI / 2)), mt.cloth1, 0, -r * 1.12, 0)
      break
    case 'veil_cloth':
      add(G(`veilc${r}`, () => new THREE.SphereGeometry(r * 1.22, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62)), mt.cloth1, 0, 0, -r * 0.05)
      break
    case 'eyepatch':
      add(G('patch', () => new THREE.CylinderGeometry(0.04, 0.04, 0.018, 10).rotateX(Math.PI / 2)), mt.T('#4e4e52'), -r * 0.34, r * 0.04, r * 0.97)
      add(G(`patchband${r}`, () => new THREE.TorusGeometry(r * 1.0, 0.006, 3, 18).rotateX(Math.PI / 2 + 0.3)), mt.dark, 0, r * 0.15, 0)
      break
  }
}

interface BodyAccCtx extends AccMats {
  hips: THREE.Group
  chest: THREE.Group
  spine: THREE.Group
  handL: THREE.Group
  handR: THREE.Group
  elbowL: THREE.Group
  d: Dims
  glyphMat: THREE.Material
}

function addBodyAccessory(a: Accessory, c: BodyAccCtx): void {
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const mm = new THREE.Mesh(geo, material)
    mm.position.set(x, y, z)
    mm.castShadow = true
    parent.add(mm)
    return mm
  }
  const R = c.d.torsoR
  const glowBlue = () => {
    const mt = new THREE.MeshBasicMaterial({ color: new THREE.Color('#4fb8ff').multiplyScalar(2.2), toneMapped: false })
    return mt
  }
  switch (a) {
    case 'pistols':
      for (const s of [1, -1]) add(c.hips, G('pistol', () => new THREE.BoxGeometry(0.035, 0.12, 0.075)), c.dark, s * R * 1.0, -0.06, 0.03)
      break
    case 'revolver':
      add(c.hips, G('revolver', () => new THREE.BoxGeometry(0.035, 0.11, 0.085)), c.dark, -R * 1.0, -0.06, 0.03)
      break
    case 'knife':
      add(c.hips, G('knife', () => new THREE.BoxGeometry(0.02, 0.15, 0.03)), c.metal, R * 0.95, -0.08, 0.05)
      break
    case 'rapier': {
      const sw = add(c.hips, G('rapier', () => new THREE.BoxGeometry(0.02, 0.8, 0.03).translate(0, -0.4, 0)), c.metal, R * 0.95, 0.0, -0.02)
      sw.rotation.x = 0.35
      add(c.hips, G('hilt', () => new THREE.TorusGeometry(0.035, 0.008, 4, 10)), c.trim, R * 0.95, 0.04, 0.0)
      break
    }
    case 'rifle':
    case 'carbine':
      add(c.spine, G('rifle', () => new THREE.BoxGeometry(0.04, 0.85, 0.055)), c.dark, 0.04, 0.24, -R * 0.82).rotation.z = -0.55
      break
    case 'coilgun': {
      const g = add(c.handR, G('coilgun', () => new THREE.BoxGeometry(0.045, 0.07, 0.6).translate(0, 0, 0.22)), c.dark, 0, -0.04, 0)
      const coils = new THREE.Group()
      for (let i = 0; i < 3; i++) add(coils, G('coil', () => new THREE.TorusGeometry(0.038, 0.009, 5, 10)), glowBlue(), 0, 0, 0.18 + i * 0.1)
      markFx(coils)
      g.add(coils)
      break
    }
    case 'spear':
      add(c.handR, G('spear', () => new THREE.CylinderGeometry(0.013, 0.013, 2.0, 6)), c.leather, 0, 0.1, 0)
      add(c.handR, G('spearhead', () => new THREE.ConeGeometry(0.03, 0.18, 4)), c.metal, 0, 1.19, 0)
      break
    case 'staff':
      add(c.handR, G('staff', () => new THREE.CylinderGeometry(0.018, 0.024, 1.5, 6)), c.leather, 0, 0.2, 0)
      break
    case 'cane':
      add(c.handR, G('cane', () => new THREE.CylinderGeometry(0.014, 0.014, 0.85, 6).translate(0, -0.42, 0)), c.leather, 0, -0.02, 0)
      break
    case 'lantern': {
      const l = add(c.handL, G('hlantern', () => new THREE.BoxGeometry(0.08, 0.12, 0.08)), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb34a').multiplyScalar(2.6), toneMapped: false }), 0, -0.12, 0)
      markFx(l)
      break
    }
    case 'satchel':
      add(c.hips, G('satchel', () => new THREE.BoxGeometry(0.15, 0.13, 0.06)), c.leather, R * 0.95, -0.02, 0.0).rotation.y = Math.PI / 2
      break
    case 'book':
      add(c.handL, G('hbook', () => new THREE.BoxGeometry(0.12, 0.16, 0.04)), c.T('#0e0c12', true), 0, -0.08, 0.04)
      break
    case 'pendant': {
      const p = add(c.chest, G('pendant', () => new THREE.OctahedronGeometry(0.02, 0)), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.6), toneMapped: false }), 0, -0.1, R * 0.8)
      markFx(p)
      break
    }
    case 'chronograph':
      add(c.elbowL, G('chrono', () => new THREE.CylinderGeometry(0.026, 0.026, 0.014, 12)), c.trim, 0, -c.d.forearm * 0.85, c.d.limbR)
      break
    case 'glove':
      add(c.handL, G('gloveL', () => new THREE.SphereGeometry(0.046, 8, 6).scale(0.95, 1.3, 0.75)), c.T('#cfd6e6'), 0, -0.03, 0)
      break
    default:
      break
  }
}

// ---------------------------------------------------------------------------
// Quadrupeds: Aether (giant wolf), wolves, pterosaurs.
// ---------------------------------------------------------------------------

export interface QuadRig {
  root: THREE.Group
  body: THREE.Group
  head: THREE.Group
  legs: THREE.Group[]
  tail: THREE.Group[]
  height: number
  eyeHeight: number
}

export interface QuadrupedModel {
  rig: QuadRig
  materials: THREE.Material[]
  quadruped: true
  species: 'wolf' | 'pterosaur'
  glyphMaterial: THREE.MeshBasicMaterial
  glyphColor: THREE.Color
  face: null
}

export function buildQuadruped(opts: { color: string; eyes?: string; scale?: number; kind?: 'wolf' | 'pterosaur' }): QuadrupedModel {
  const kind = opts.kind ?? 'wolf'
  const mats: THREE.Material[] = []
  const T = (c: string, side?: THREE.Side) => {
    const mt = toon(c, { rim: true, side })
    mats.push(mt)
    return mt
  }
  const furM = T(opts.color)
  const belly = T('#' + new THREE.Color(opts.color).lerp(new THREE.Color('#ffffff'), 0.4).getHexString())
  const eye = new THREE.MeshBasicMaterial({ color: new THREE.Color(opts.eyes ?? '#ffb02e').multiplyScalar(2.2), toneMapped: false })
  const dark = T('#121214')
  mats.push(eye)
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const legs: THREE.Group[] = []
  const tail: THREE.Group[] = []
  const head = new THREE.Group()
  if (kind === 'pterosaur') {
    body.position.y = 2.5
    body.add(m(new THREE.CapsuleGeometry(0.16, 0.6, 3, 8).rotateX(Math.PI / 2), furM))
    for (const s of [1, -1]) {
      const wing = new THREE.Group()
      wing.position.set(s * 0.14, 0.05, 0)
      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.lineTo(s * 1.8, 0.2)
      shape.lineTo(s * 0.6, -0.6)
      shape.lineTo(0, -0.3)
      wing.add(m(new THREE.ShapeGeometry(shape).rotateX(Math.PI / 2), T('#6a5444', THREE.DoubleSide)))
      body.add(wing)
      legs.push(wing)
    }
    head.position.set(0, 0.1, 0.5)
    head.add(m(new THREE.ConeGeometry(0.07, 0.6, 6).rotateX(Math.PI / 2).translate(0, 0, 0.25), furM))
    head.add(m(new THREE.ConeGeometry(0.05, 0.35, 5).rotateX(-Math.PI / 2.4).translate(0, 0.1, -0.1), furM))
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), eye)
    e.position.set(0.05, 0.05, 0.1)
    markFx(e)
    head.add(e)
    body.add(head)
  } else {
    body.position.y = 0.62
    body.add(m(new THREE.CapsuleGeometry(0.24, 0.72, 5, 10).rotateX(Math.PI / 2), furM))
    body.add(m(new THREE.SphereGeometry(0.31, 12, 10).scale(1, 1.08, 1.1), furM, 0, 0.08, 0.38))
    for (const [x, z] of [
      [0.14, 0.38],
      [-0.14, 0.38],
      [0.14, -0.36],
      [-0.14, -0.36],
    ] as const) {
      const leg = new THREE.Group()
      leg.position.set(x, -0.1, z)
      leg.add(m(new THREE.CylinderGeometry(0.06, 0.042, 0.52, 8).translate(0, -0.26, 0), furM))
      leg.add(m(new THREE.CapsuleGeometry(0.04, 0.06, 3, 6).rotateX(Math.PI / 2).translate(0, -0.53, 0.03), dark))
      body.add(leg)
      legs.push(leg)
    }
    head.position.set(0, 0.28, 0.62)
    head.add(m(new THREE.SphereGeometry(0.2, 14, 10), furM))
    head.add(m(new THREE.ConeGeometry(0.1, 0.3, 8).rotateX(Math.PI / 2).translate(0, -0.05, 0.22), belly))
    head.add(m(new THREE.SphereGeometry(0.028, 6, 5), dark, 0, -0.03, 0.37))
    for (const s of [1, -1]) {
      head.add(m(new THREE.ConeGeometry(0.065, 0.17, 3).scale(1, 1, 0.5).translate(0, 0.085, 0), furM, s * 0.1, 0.14, -0.04))
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), eye)
      e.position.set(s * 0.08, 0.04, 0.16)
      markFx(e)
      head.add(e)
    }
    body.add(head)
    const base = new THREE.Group()
    base.position.set(0, 0.08, -0.55)
    base.rotation.x = -2.2
    body.add(base)
    let parent: THREE.Object3D = base
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Group()
      seg.position.y = i === 0 ? 0 : 0.1
      const r = 0.05 + Math.sin(((i + 1) / 5) * Math.PI) * 0.05
      seg.add(m(new THREE.SphereGeometry(r, 8, 6).scale(1, 1.3, 1).translate(0, 0.05, 0), i === 4 ? belly : furM))
      parent.add(seg)
      tail.push(seg)
      parent = seg
    }
  }
  const scale = opts.scale ?? 1
  root.scale.setScalar(scale)
  return {
    rig: { root, body, head, legs, tail, height: (kind === 'pterosaur' ? 2.8 : 1.15) * scale, eyeHeight: (kind === 'pterosaur' ? 2.6 : 0.95) * scale },
    materials: mats,
    quadruped: true,
    species: kind,
    glyphMaterial: eye,
    glyphColor: new THREE.Color(opts.eyes ?? '#ffb02e'),
    face: null,
  }
}
