/**
 * Dev-only static scene viewer: renders a scene's map, props and actors without
 * the game shell. ?scene=<id>&zoom=1&x=..&y=.. ; WASD pans, wheel zooms.
 */
import * as THREE from 'three'
import { Renderer } from '../engine/Renderer'
import { CameraRig } from '../engine/CameraRig'
import { World } from '../engine/World'
import '../engine/props'
import { Actor } from '../game/Actor'
import type { ChapterDef, SceneDef } from '../content/types'

const mods = import.meta.glob<{ default: ChapterDef }>('../content/chapters/*/index.ts', { eager: true })
const scenes = new Map<string, SceneDef>()
for (const m of Object.values(mods)) for (const s of m.default.scenes) scenes.set(s.id, s)
const params = new URLSearchParams(location.search)
const id = params.get('scene') ?? [...scenes.keys()][0]
const def = scenes.get(id)!
const info = document.getElementById('info')!
info.textContent = `${id}  (${[...scenes.keys()].join(', ')})`
const renderer = new Renderer(document.body)
const rig = new CameraRig()
const world = new World(def, renderer, rig)
const actors: Actor[] = []
const player = new Actor('player', { id: 'player', character: def.player.character, at: def.player.at, facing: def.player.facing }, world, true)
actors.push(player)
for (const a of def.actors ?? []) {
  const act = new Actor(a.id, { ...a, hidden: params.has('all') ? false : a.hidden }, world)
  actors.push(act)
}
for (const it of def.interactables ?? []) {
  if (it.prop) world.placeProp({ ...it.prop, at: it.at })
  if (it.marker !== false) world.addMarker(it.id, it.at, 1.3)
}
rig.setViewHeight(def.camera?.viewHeight ?? 12.5)
rig.maxZoom = 6
rig.minZoom = 0.2
rig.setZoom(Number(params.get('zoom') ?? def.camera?.zoom ?? 1), true)
const fx = params.get('x')
const fy = params.get('y')
const focus = fx && fy ? world.worldPos(Number(fx), Number(fy)) : player.worldPos()
rig.snapTo(focus.clone().add(new THREE.Vector3(0, 0.6, 0)))
const keys = new Set<string>()
addEventListener('keydown', (e) => keys.add(e.code))
addEventListener('keyup', (e) => keys.delete(e.code))
addEventListener('wheel', (e) => rig.nudgeZoom(Math.sign(e.deltaY) * 0.1))
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const up = rig.screenUp
  const right = rig.screenRight
  const mv = new THREE.Vector3()
  if (keys.has('KeyW')) mv.add(up)
  if (keys.has('KeyS')) mv.sub(up)
  if (keys.has('KeyD')) mv.add(right)
  if (keys.has('KeyA')) mv.sub(right)
  rig.target.addScaledVector(mv, dt * 8)
  rig.snapTo(rig.target)
  for (const a of actors) a.update(dt)
  world.update(dt, rig.target)
  rig.update(dt)
  renderer.render(world.scene, rig.camera, now / 1000)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
