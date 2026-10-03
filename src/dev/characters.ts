import * as THREE from 'three'
import { Renderer } from '../engine/Renderer'
import { CameraRig } from '../engine/CameraRig'
import { CAST } from '../content/characters'
import { buildCharacter, buildQuadruped } from '../engine/characters/CharacterFactory'
import { Animator } from '../engine/characters/Animator'
import type { Pose } from '../content/types'

const params = new URLSearchParams(location.search)
const filter = params.get('filter')
const pose = (params.get('pose') ?? 'stand') as Pose
const zoom = Number(params.get('zoom') ?? '1')
const renderer = new Renderer(document.body)
renderer.setBloom(0.7, 0.4, 0.85)
const rig = new CameraRig()
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight('#c8d4ff', '#4a4050', 1.6))
const sun = new THREE.DirectionalLight('#ffe8d0', 2.2)
sun.position.set(-6, 12, 8)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
const sc = sun.shadow.camera as THREE.OrthographicCamera
sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12
scene.add(sun)
scene.add(sun.target)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshToonMaterial({ color: params.get('ground') ?? '#6a6478' }))
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const ids = Object.keys(CAST).filter((id) => !filter || filter.split(',').some((f) => id === f || (f.endsWith('*') && id.startsWith(f.slice(0, -1))))).filter((id) => !CAST[id].special)
const anims: { a: Animator; root: THREE.Object3D }[] = []
const labels: { el: HTMLDivElement; p: THREE.Vector3 }[] = []
const cols = Math.ceil(Math.sqrt(ids.length * 1.6))
ids.forEach((id, i) => {
  const look = CAST[id].look
  const model = 'quadruped' in look ? buildQuadruped(look) : buildCharacter(look)
  const root = model.rig.root
  const x = (i % cols) * 1.6 - (cols * 1.6) / 2
  const z = Math.floor(i / cols) * 1.8 - 2
  root.position.set(x, 0, z)
  root.rotation.y = Math.PI / 4 + (params.has('turn') ? Math.PI : 0)
  scene.add(root)
  const a = new Animator(model)
  a.pose = pose
  if (params.has('walk')) a.speed = 2.5
  if (params.has('talk')) a.talking = true
  if (params.get('expr')) a.expression = params.get('expr') as never
  a.setGlyph(params.has('glow') ? 3 : 0.6)
  anims.push({ a, root })
  const el = document.createElement('div')
  el.className = 'lbl'
  el.textContent = id
  document.body.appendChild(el)
  labels.push({ el, p: new THREE.Vector3(x + 0.3, 0, z + 0.3) })
})
rig.setViewHeight(10)
rig.maxZoom = 12
renderer.outline.debug = Number(params.get('debug') ?? '0')
rig.setZoom(zoom, true)
const focus = params.get('focus')?.split(',').map(Number)
rig.snapTo(focus ? new THREE.Vector3(focus[0], focus[1], focus[2]) : new THREE.Vector3(0, 0.8, 0))
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  for (const { a, root } of anims) a.update(dt, root)
  rig.update(dt)
  renderer.render(scene, rig.camera, now / 1000)
  for (const l of labels) {
    const s = rig.toScreen(l.p)
    l.el.style.left = `${s.x}px`
    l.el.style.top = `${s.y}px`
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
