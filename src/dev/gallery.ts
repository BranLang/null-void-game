import * as THREE from 'three'
import { Renderer } from '../engine/Renderer'
import { CameraRig } from '../engine/CameraRig'
import { getProp, propTypes } from '../engine/props'
import type { PropContext, PropDef, PropLight } from '../engine/props/registry'
import { FX_LAYER, toon } from '../engine/toon'
import { LIQUID_SURFACE } from '../engine/MapBuilder'

/**
 * DEV ONLY prop gallery (served at /gallery.html by `npx vite`).
 * Renders every registered prop (plus notable parameter variants) on its
 * own little tile slab, labelled, animated and lit like in the game.
 *
 *   ?filter=tree,lamp   substrings matched against "type params"
 *   ?night=1            night lighting (props' point lights dominate)
 *   ?variants=0         only the default build of every prop
 *   ?zoom=2             zoom factor on top of the auto fit
 *   ?ref=0              hide the 1.7 m reference figure
 *   ?outline=0          disable the ink outline pass
 * Drag to pan, mouse wheel to zoom.
 */

type Params = Record<string, string | number | boolean>

interface Variant {
  params?: Params
  color?: string
}

const VARIANTS: Record<string, Variant[]> = {
  tree: [{ params: { bio: true } }, { params: { canopy: '#e0803a' } }],
  temple_tree: [{ params: { dark: true } }],
  spruce: [{ params: { snow: true } }, { params: { black: true } }],
  bush: [{ params: { flowers: true } }],
  flowers: [{ params: { glow: true } }],
  rock: [{ params: { moss: true } }],
  mushroom: [{ params: { glow: false } }, { color: '#c77dff' }],
  vine_pillar: [{ params: { broken: true } }],
  pillar: [{ params: { broken: true } }, { params: { style: 'stone' } }, { params: { style: 'andesite', glow: true } }],
  arch: [{ params: { style: 'andesite' } }],
  door: [{ params: { open: true } }, { params: { style: 'iron' } }],
  gate: [{ params: { open: true } }],
  window: [{ params: { lit: false, shutters: true, flowers: true } }, { params: { arch: true, style: 'white' } }],
  lantern: [{ params: { style: 'hanging' } }, { params: { style: 'ground' } }],
  paper_lantern: [{ params: { float: true } }, { params: { pole: true }, color: '#ff5a8a' }],
  torch: [{ params: { standing: true } }],
  banner: [{ params: { wall: true, emblem: 'star' }, color: '#2f6fb0' }],
  gravestone: [{ params: { broken: true } }, { params: { shape: 'cross' } }],
  fountain: [{ params: { glow: true } }],
  railing: [{ params: { style: 'iron' } }],
  fence: [{ params: { picket: true } }],
  mosaic: [{ params: { black: true } }],
  sluice: [{ params: { open: true } }],
  crate: [{ params: { stack: 2 } }],
  barrel: [{ params: { lying: true } }],
  sack: [{ params: { count: 3 } }],
  table: [{ params: { round: true, cloth: '#7d3fb0' } }, { params: { items: true } }],
  bench: [{ params: { style: 'stone', back: true } }],
  chest: [{ params: { open: true } }],
  safe: [{ params: { open: true } }],
  basket: [{ params: { fill: 'fish' } }],
  bowl: [{ params: { frozen: true } }],
  stall: [{ params: { goods: 'cloth' }, color: '#2f6fb0' }],
  chalkboard: [{ params: { wall: true } }],
  painting: [{ params: { covered: true } }, { params: { subject: 'portrait' } }],
  clock: [{ params: { hours: 21 } }, { params: { standing: true } }],
  rug: [{ params: { round: true }, color: '#2f5a9a' }],
  shelf: [{ params: { glow: true } }],
  cauldron: [{ params: { fire: false }, color: '#b066ff' }],
  cage: [{ params: { open: true } }],
  gear: [{ params: { standing: true } }],
  pipe: [{ params: { vertical: true } }],
  obsidian_block: [{ params: { glyph: true } }],
  skeleton: [{ params: { crystals: true } }],
  veins: [{ params: { glow: true } }],
  clothes_pile: [{ params: { dust: true } }],
  glyph_circle: [{ color: '#c77dff', params: { light: true } }],
  drone: [{ params: { ground: true } }],
}

/** Props meant to sit in a water cell get a water tile instead of a floor tile. */
const WATER = new Set(['lily', 'bridge', 'dock_post', 'sluice', 'waterwheel'])
/** Wall-mounted props get a strip of wall behind them. */
const WALL = new Set(['window', 'torch', 'mosaic', 'painting', 'clock', 'awning', 'shelf', 'banner', 'chalkboard', 'bookshelf', 'cabinet', 'ladder'])

const qs = new URLSearchParams(location.search)
const night = qs.get('night') === '1'
const filters = (qs.get('filter') ?? '')
  .toLowerCase()
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const showVariants = qs.get('variants') !== '0'
const zoomParam = Number(qs.get('zoom') ?? '1') || 1
const showRef = qs.get('ref') !== '0'

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// renderer, camera, lights
// ---------------------------------------------------------------------------

const app = document.getElementById('app') ?? document.body
const labelLayer = document.getElementById('labels') ?? document.body
const hud = document.getElementById('hud')
const renderer = new Renderer(app)
renderer.gradeSettings.vignette = 0.12
renderer.gradeSettings.grain = 0
renderer.setOutlines(qs.get('outline') !== '0')
if (night) {
  renderer.setBloom(0.95, 0.55, 0.72)
  renderer.setExposure(1.05)
} else {
  renderer.setBloom(0.6, 0.45, 0.85)
}
const rig = new CameraRig()
rig.minZoom = 0.05
rig.maxZoom = 40
const scene = new THREE.Scene()
scene.background = new THREE.Color(night ? '#0a0b14' : '#3b4356')

const hemi = night ? new THREE.HemisphereLight('#5a6aaa', '#141018', 0.55) : new THREE.HemisphereLight('#dfe8ff', '#5a4a40', 1.55)
scene.add(hemi)
const sun = night ? new THREE.DirectionalLight('#a8b8ff', 0.55) : new THREE.DirectionalLight('#fff0d8', 2.4)
sun.castShadow = true
scene.add(sun)
scene.add(sun.target)

// ---------------------------------------------------------------------------
// entries
// ---------------------------------------------------------------------------

interface Entry {
  type: string
  params: Params
  color?: string
  label: string
  sub: string
  seed: number
}

const entries: Entry[] = []
for (const type of propTypes()) {
  const list: Variant[] = [{}]
  if (showVariants) list.push(...(VARIANTS[type] ?? []))
  list.forEach((v, i) => {
    const params = v.params ?? {}
    const bits = Object.entries(params).map(([k, val]) => (val === true ? k : `${k}=${String(val)}`))
    if (v.color) bits.push(v.color)
    const sub = bits.join(' ')
    const hay = `${type} ${sub}`.toLowerCase()
    if (filters.length && !filters.some((f) => hay.includes(f))) return
    entries.push({ type, params, color: v.color, label: type, sub, seed: hash(`${type}|${i}`) })
  })
}

// ---------------------------------------------------------------------------
// build every item on its own tile slab
// ---------------------------------------------------------------------------

function gridTexture(base: string, line: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  if (g) {
    g.fillStyle = base
    g.fillRect(0, 0, 64, 64)
    g.strokeStyle = line
    g.lineWidth = 2
    g.strokeRect(1, 1, 62, 62)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.magFilter = THREE.NearestFilter
  return t
}

const slabSide = toon(night ? '#24222c' : '#4a4652')
const waterMat = new THREE.MeshBasicMaterial({ color: night ? '#1d4a66' : '#3a8cb0', transparent: true, opacity: 0.72, depthWrite: false })
const bedMat = toon(night ? '#141820' : '#2a3a44')
const wallMat = toon(night ? '#4a4652' : '#d8cfbf')

function slabFor(entryType: string, box: THREE.Box3): THREE.Group {
  const g = new THREE.Group()
  const x0 = Math.floor(Math.min(box.min.x, -0.5) + 0.5) - 0.5 - 1
  const x1 = Math.ceil(Math.max(box.max.x, 0.5) - 0.5) + 0.5 + 1
  const z0 = Math.floor(Math.min(box.min.z, -0.5) + 0.5) - 0.5 - 1
  const z1 = Math.ceil(Math.max(box.max.z, 0.5) - 0.5) + 0.5 + 1
  const w = x1 - x0
  const d = z1 - z0
  const water = WATER.has(entryType)
  const top = water ? -0.62 : 0
  const tex = gridTexture(night ? '#2c2a34' : '#5b5664', night ? '#24222b' : '#514c5a')
  tex.repeat.set(w, d)
  const topMat = toon('#ffffff', { map: tex })
  const geo = new THREE.BoxGeometry(w, 0.3, d)
  const slab = new THREE.Mesh(geo, [slabSide, slabSide, water ? bedMat : topMat, slabSide, slabSide, slabSide])
  slab.position.set((x0 + x1) / 2, top - 0.15, (z0 + z1) / 2)
  slab.receiveShadow = true
  g.add(slab)
  if (water) {
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(w, d), waterMat)
    surf.rotation.x = -Math.PI / 2
    surf.position.set((x0 + x1) / 2, LIQUID_SURFACE, (z0 + z1) / 2)
    surf.layers.set(FX_LAYER)
    surf.renderOrder = 1
    g.add(surf)
  }
  if (WALL.has(entryType)) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w - 2, 2.4, 0.2), wallMat)
    wall.position.set((x0 + x1) / 2, 1.2, -0.6)
    wall.receiveShadow = true
    wall.castShadow = true
    g.add(wall)
  }
  return g
}

interface Item {
  entry: Entry
  def: PropDef
  root: THREE.Group
  obj: THREE.Object3D
  light: THREE.PointLight | null
  lightDef: PropLight | null
  label: HTMLDivElement
  anchor: THREE.Vector3
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const items: Item[] = []

function makeCtx(e: Entry): PropContext {
  return { params: e.params, color: e.color ? new THREE.Color(e.color) : undefined, rand: seeded(e.seed) }
}

function addLabel(text: string, sub: string): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'lbl'
  el.textContent = text
  if (sub) {
    const s = document.createElement('small')
    s.textContent = sub
    el.appendChild(s)
  }
  labelLayer.appendChild(el)
  return el
}

function refFigure(): THREE.Object3D {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.26, 6, 12), toon('#b8b4c4'))
  body.position.y = 0.85
  body.castShadow = true
  g.add(body)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), toon('#e06a5a'))
  nose.rotation.x = Math.PI / 2
  nose.position.set(0, 1.45, 0.25)
  g.add(nose)
  return g
}

const refDef: PropDef = { build: refFigure }
const allEntries: Entry[] = showRef ? [{ type: '_ref', params: {}, label: '1.7 m reference', sub: 'front = +Z', seed: 1 }, ...entries] : entries

rig.snapTo(new THREE.Vector3())
rig.camera.updateMatrixWorld(true)
const R = new THREE.Vector3().setFromMatrixColumn(rig.camera.matrixWorld, 0)
const U = new THREE.Vector3().setFromMatrixColumn(rig.camera.matrixWorld, 1)
const G = rig.screenUp
const kY = G.dot(U)

const corner = new THREE.Vector3()
for (const e of allEntries) {
  const def = e.type === '_ref' ? refDef : getProp(e.type)
  if (!def) continue
  let obj: THREE.Object3D
  try {
    obj = def.build(makeCtx(e))
  } catch (err) {
    console.error(`[gallery] ${e.type} failed to build`, err)
    continue
  }
  if (def.castShadow === false) obj.traverse((o) => (o.castShadow = false))
  const root = new THREE.Group()
  root.add(obj)
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(obj)
  if (box.isEmpty()) box.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 0.2, 0.5))
  root.add(slabFor(e.type, box))
  root.updateMatrixWorld(true)
  const all = new THREE.Box3().setFromObject(root)
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? all.max.x : all.min.x, i & 2 ? all.max.y : all.min.y, i & 4 ? all.max.z : all.min.z)
    const x = corner.dot(R)
    const y = corner.dot(U)
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  let lightDef: PropLight | null = null
  if (def.light) lightDef = typeof def.light === 'function' ? def.light(makeCtx(e)) : def.light
  items.push({
    entry: e,
    def,
    root,
    obj,
    light: null,
    lightDef,
    label: addLabel(e.label, e.sub),
    anchor: new THREE.Vector3(),
    minX,
    maxX,
    minY,
    maxY,
  })
}

// ---------------------------------------------------------------------------
// layout: shelf packing in screen space, so labels form tidy rows
// ---------------------------------------------------------------------------

const PAD = 0.35
const LABEL_H = 0.9
const aspect = window.innerWidth / Math.max(1, window.innerHeight)
let area = 0
let widest = 0
for (const it of items) {
  const w = it.maxX - it.minX + PAD
  area += w * (it.maxY - it.minY + PAD + LABEL_H)
  widest = Math.max(widest, w)
}
const rowWidth = Math.max(widest, Math.sqrt(area * aspect) * 1.02)
const rows: Item[][] = [[]]
let cursor = 0
for (const it of items) {
  const w = it.maxX - it.minX + PAD
  if (cursor + w > rowWidth && rows[rows.length - 1].length) {
    rows.push([])
    cursor = 0
  }
  rows[rows.length - 1].push(it)
  cursor += w
}

const toWorld = (vx: number, vy: number): THREE.Vector3 => R.clone().multiplyScalar(vx).add(G.clone().multiplyScalar(vy / kY))
let rowTop = 0
let layoutW = 0
for (const row of rows) {
  const top = Math.max(...row.map((it) => it.maxY))
  const baseline = rowTop - top - PAD / 2
  let x = 0
  let bottom = Infinity
  for (const it of row) {
    const ox = x - it.minX + PAD / 2
    it.root.position.copy(toWorld(ox, baseline))
    it.anchor.copy(toWorld(ox, baseline + it.minY))
    x += it.maxX - it.minX + PAD
    bottom = Math.min(bottom, baseline + it.minY)
    scene.add(it.root)
  }
  layoutW = Math.max(layoutW, x)
  rowTop = bottom - LABEL_H
}
const layoutH = -rowTop

// lights declared by props (the World pools these; here one each, capped)
const MAX_LIGHTS = 28
let lightCount = 0
for (const it of items) {
  if (!it.lightDef || lightCount >= MAX_LIGHTS) continue
  const l = new THREE.PointLight(it.lightDef.color, it.lightDef.intensity, it.lightDef.distance, 2)
  l.position.copy(it.root.position).add(new THREE.Vector3(0, it.lightDef.y, 0))
  scene.add(l)
  it.light = l
  lightCount++
}

// camera fit + sun covering the whole layout. CameraRig keeps the camera 60
// units from its target, too close for a big layout (near-plane clipping), so
// the gallery pushes the camera back every frame and widens the depth range.
const centre = toWorld(layoutW / 2, -layoutH / 2)
const viewH = Math.max(layoutH, layoutW / aspect) * 1.04 + 0.5
rig.setViewHeight(viewH)
const pushBack = viewH * 1.5
rig.camera.far = 60 + pushBack + viewH * 3 + 50
rig.camera.updateProjectionMatrix()
rig.setZoom(zoomParam, true)
rig.snapTo(centre)
const radius = Math.max(layoutW, layoutH / kY) * 0.75 + 4
const sunDir = new THREE.Vector3(-0.55, 1, 0.42).normalize()
sun.position.copy(centre).addScaledVector(sunDir, 60)
sun.target.position.copy(centre)
const sc = sun.shadow.camera
sc.left = -radius
sc.right = radius
sc.top = radius
sc.bottom = -radius
sc.near = 1
sc.far = 160
sc.updateProjectionMatrix()
const mapSize = radius > 24 ? 4096 : 2048
sun.shadow.mapSize.set(mapSize, mapSize)
sun.shadow.bias = -0.0004
sun.shadow.normalBias = 0.02

if (hud) {
  hud.innerHTML = `<b>${items.length - (showRef ? 1 : 0)}</b> props/variants · ${lightCount} lights${lightCount >= MAX_LIGHTS ? ' (capped)' : ''} · drag = pan · wheel = zoom · <i>?filter=a,b ?night=1 ?variants=0 ?zoom=2</i>`
}

// ---------------------------------------------------------------------------
// interaction
// ---------------------------------------------------------------------------

let dragging = false
let lastX = 0
let lastY = 0
const panTarget = centre.clone()
renderer.canvas.addEventListener('pointerdown', (ev) => {
  dragging = true
  lastX = ev.clientX
  lastY = ev.clientY
})
window.addEventListener('pointerup', () => (dragging = false))
window.addEventListener('pointermove', (ev) => {
  if (!dragging) return
  const cam = rig.camera
  const wpp = (cam.top - cam.bottom) / window.innerHeight
  panTarget.addScaledVector(R, -(ev.clientX - lastX) * wpp)
  panTarget.addScaledVector(G, ((ev.clientY - lastY) * wpp) / kY)
  lastX = ev.clientX
  lastY = ev.clientY
  rig.snapTo(panTarget)
})
renderer.canvas.addEventListener(
  'wheel',
  (ev) => {
    ev.preventDefault()
    rig.setZoom(rig.getZoom() * (ev.deltaY > 0 ? 0.88 : 1.14), true)
  },
  { passive: false },
)

// ---------------------------------------------------------------------------
// frame loop
// ---------------------------------------------------------------------------

let last = performance.now()
let frames = 0
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const t = now / 1000
  for (const it of items) {
    it.def.animate?.(it.obj, t, dt)
    if (it.light && it.lightDef?.flicker) {
      const p = it.entry.seed % 100
      it.light.intensity = it.lightDef.intensity * (0.86 + 0.09 * Math.sin(t * 11 + p) + 0.05 * Math.sin(t * 23 + p * 1.3))
    }
  }
  rig.update(dt)
  rig.camera.position.addScaledVector(rig.towardCamera, pushBack)
  renderer.render(scene, rig.camera, t)
  for (const it of items) {
    const s = rig.toScreen(it.anchor)
    it.label.style.left = `${s.x}px`
    it.label.style.top = `${s.y}px`
  }
  frames++
  if (frames === 20) document.body.dataset.ready = '1'
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
