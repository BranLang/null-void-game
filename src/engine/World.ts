import * as THREE from 'three'
import type { AmbienceDef, PlacedProp, PropSpec, SceneDef, Vec2 } from '../content/types'
import { Grid, LEVEL_HEIGHT } from './Grid'
import { buildMap } from './MapBuilder'
import { Sky } from './fx/Sky'
import { Particles, setParticlePixelScale } from './fx/Particles'
import { disposeLiquids, updateLiquids } from './fx/Water'
import { getProp, type PropLight } from './props/registry'
import { cutaway } from './materials'
import { rim, FX_LAYER, markFx } from './toon'
import { glyphTexture, hashString } from './textures'
import type { CameraRig } from './CameraRig'
import type { Renderer } from './Renderer'

interface LightSource {
  pos: THREE.Vector3
  light: PropLight
  seed: number
  enabled: () => boolean
}

interface Decal {
  mesh: THREE.Mesh
  t: number
  dur: number
  grow: number
  spin: number
}

export interface Marker {
  id: string
  obj: THREE.Object3D
  base: THREE.Vector3
  active: boolean
}

/** Linear-blendable snapshot of the lighting part of an AmbienceDef. */
interface LightState {
  hemiSky: THREE.Color
  hemiGround: THREE.Color
  hemiI: number
  sunColor: THREE.Color
  sunI: number
  sunDir: THREE.Vector3
  fogColor: THREE.Color
  fogNear: number
  fogFar: number
  exposure: number
  bloom: number
  tint: THREE.Color
  saturation: number
  contrast: number
  vignette: number
}

const CAM_DIST = 60

export class World {
  readonly scene = new THREE.Scene()
  readonly grid: Grid
  readonly sky = new Sky()
  readonly particles: Particles
  private hemi = new THREE.HemisphereLight('#8090b0', '#202028', 1)
  private sun = new THREE.DirectionalLight('#ffffff', 1)
  private pool: THREE.PointLight[] = []
  private lights: LightSource[] = []
  private animated: { obj: THREE.Object3D; fn: (o: THREE.Object3D, t: number, dt: number) => void }[] = []
  readonly props = new Map<string, { obj: THREE.Object3D; cells: Vec2[]; solid: boolean }>()
  private decals: Decal[] = []
  readonly markers = new Map<string, Marker>()
  private floorMeshes: THREE.Mesh[] = []
  private raycaster = new THREE.Raycaster()
  private time = 0
  private lightTimer = 0
  private lightState: LightState
  private tween: { from: LightState; to: LightState; t: number; dur: number; resolve: () => void } | null = null
  readonly mapGroup: THREE.Group
  readonly fxGroup = new THREE.Group()

  constructor(
    readonly def: SceneDef,
    private renderer: Renderer,
    private rig: CameraRig,
  ) {
    this.grid = new Grid(def.map)
    const built = buildMap(this.grid)
    this.mapGroup = built.group
    this.scene.add(built.group)
    built.group.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && mesh.geometry?.attributes.normal && !mesh.name.startsWith('liquid')) this.floorMeshes.push(mesh)
    })
    for (const lq of built.liquids) markFx(lq)
    this.scene.add(this.sky.mesh)
    markFx(this.sky.mesh)
    this.scene.add(this.hemi)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(renderer.shadowMapSize, renderer.shadowMapSize)
    this.sun.shadow.bias = -0.0006
    this.sun.shadow.normalBias = 0.02
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera
    sc.left = -16
    sc.right = 16
    sc.top = 16
    sc.bottom = -16
    sc.near = 0.5
    sc.far = 80
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)
    for (let i = 0; i < 8; i++) {
      const pl = new THREE.PointLight('#ffffff', 0, 6, 1.6)
      pl.visible = false
      this.pool.push(pl)
      this.scene.add(pl)
    }
    this.particles = new Particles([-0.5, -0.5, this.grid.width - 0.5, this.grid.height - 0.5])
    this.scene.add(this.particles.group)
    this.scene.add(this.fxGroup)
    this.lightState = this.stateFrom(def.ambience)
    this.applyAmbience(def.ambience, true)
    // props from the legend and from the explicit list
    for (const row of this.grid.cells)
      for (const c of row) {
        if (!c.spec.prop) continue
        const spec: PropSpec = typeof c.spec.prop === 'string' ? { type: c.spec.prop } : c.spec.prop
        this.placeProp({ ...spec, at: [c.x, c.y] })
      }
    for (const p of def.props ?? []) this.placeProp(p)
  }

  // ------------------------------------------------------------------ coordinates
  worldPos(x: number, y: number, out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(x, this.grid.heightAt(x, y), y)
  }

  // ------------------------------------------------------------------ props
  placeProp(p: PlacedProp): THREE.Object3D | null {
    const def = getProp(p.type)
    if (!def) {
      console.warn(`[world] unknown prop '${p.type}'`)
      return null
    }
    let s = hashString(`${p.type}:${p.at[0]}:${p.at[1]}`) || 1
    const rand = () => {
      s ^= s << 13
      s ^= s >>> 17
      s ^= s << 5
      return ((s >>> 0) % 100000) / 100000
    }
    const ctx = { params: p.params ?? {}, color: p.color ? new THREE.Color(p.color) : undefined, rand }
    const obj = def.build(ctx)
    const [x, y] = p.at
    const off = p.offset ?? [0, 0]
    const base = this.grid.cell(x, y)
    obj.position.set(x + off[0], (base ? base.h * LEVEL_HEIGHT : 0) + (p.y ?? 0), y + off[1])
    obj.rotation.y = THREE.MathUtils.degToRad(p.rot ?? 0)
    if (p.scale) obj.scale.multiplyScalar(p.scale)
    const cast = def.castShadow ?? true
    obj.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        const basic = (m.material as THREE.Material & { isMeshBasicMaterial?: boolean }).isMeshBasicMaterial
        m.castShadow = cast && !basic
        m.receiveShadow = true
        if (basic) m.layers.set(FX_LAYER)
      }
    })
    this.scene.add(obj)
    const solid = p.solid ?? def.solid ?? false
    const quarter = Math.round((p.rot ?? 0) / 90) & 3
    const cells: Vec2[] = [[x, y]]
    for (const [fx, fy] of def.footprint ?? []) {
      const r: Vec2 = quarter === 0 ? [fx, fy] : quarter === 1 ? [fy, -fx] : quarter === 2 ? [-fx, -fy] : [-fy, fx]
      cells.push([x + r[0], y + r[1]])
    }
    const hidden = !!p.hidden
    obj.visible = !hidden
    if (solid && !hidden) for (const [cx, cy] of cells) this.grid.block(cx, cy)
    const lightDef = typeof def.light === 'function' ? def.light(ctx) : def.light
    if (lightDef) {
      const lp = obj.position.clone()
      lp.y += lightDef.y
      this.lights.push({ pos: lp, light: lightDef, seed: rand() * 100, enabled: () => obj.visible })
    }
    if (def.animate) this.animated.push({ obj, fn: def.animate })
    const id = p.id ?? `${p.type}@${x},${y}`
    this.props.set(id, { obj, cells, solid })
    return obj
  }

  setPropVisible(id: string, visible: boolean): void {
    const p = this.props.get(id)
    if (!p || p.obj.visible === visible) return
    p.obj.visible = visible
    if (p.solid) for (const [x, y] of p.cells) this.grid.block(x, y, visible)
  }

  /** Register an extra light source (e.g. a lantern carried by an actor). */
  addLight(pos: THREE.Vector3, light: PropLight, enabled: () => boolean = () => true): void {
    this.lights.push({ pos, light, seed: Math.random() * 100, enabled })
  }

  // ------------------------------------------------------------------ markers for interactables
  addMarker(id: string, at: Vec2, height = 1.6): void {
    const g = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2a0').multiplyScalar(1.25), toneMapped: false, transparent: true, opacity: 0.85 })
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), mat)
    gem.scale.y = 1.6
    g.add(gem)
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.19, 24), mat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = -height + 0.04
    g.add(ring)
    const base = this.worldPos(at[0], at[1]).add(new THREE.Vector3(0, height, 0))
    g.position.copy(base)
    markFx(g)
    this.scene.add(g)
    this.markers.set(id, { id, obj: g, base, active: false })
  }

  removeMarker(id: string): void {
    const m = this.markers.get(id)
    if (!m) return
    this.scene.remove(m.obj)
    this.markers.delete(id)
  }

  // ------------------------------------------------------------------ effects
  glyph(at: THREE.Vector3, color: string, opts: { scale?: number; ms?: number; style?: 'mother' | 'rune' } = {}): void {
    const mat = new THREE.MeshBasicMaterial({
      map: glyphTexture(opts.style ?? 'mother'),
      color: new THREE.Color(color).multiplyScalar(2.4),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.copy(at).add(new THREE.Vector3(0, 0.05, 0))
    mesh.layers.set(FX_LAYER)
    this.fxGroup.add(mesh)
    this.decals.push({ mesh, t: 0, dur: (opts.ms ?? 1600) / 1000, grow: opts.scale ?? 2.2, spin: 0.8 })
  }

  /** Expanding ring (shockwaves, Sora bursts, slow fields). */
  ring(at: THREE.Vector3, color: string, scale = 4, ms = 900): void {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 48), mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.copy(at).add(new THREE.Vector3(0, 0.08, 0))
    mesh.layers.set(FX_LAYER)
    this.fxGroup.add(mesh)
    this.decals.push({ mesh, t: 0, dur: ms / 1000, grow: scale, spin: 0 })
  }

  // ------------------------------------------------------------------ ambience
  private stateFrom(a: AmbienceDef, base?: LightState): LightState {
    const b = base
    return {
      hemiSky: new THREE.Color(a.hemi?.sky ?? (b ? '#' + b.hemiSky.getHexString() : '#8090b0')),
      hemiGround: new THREE.Color(a.hemi?.ground ?? (b ? '#' + b.hemiGround.getHexString() : '#202028')),
      hemiI: a.hemi?.intensity ?? b?.hemiI ?? 1,
      sunColor: new THREE.Color(a.sun?.color ?? (b ? '#' + b.sunColor.getHexString() : '#ffffff')),
      sunI: a.sun?.intensity ?? (a.sun === undefined && b ? b.sunI : 0),
      sunDir: a.sun ? new THREE.Vector3(...a.sun.dir).normalize() : b?.sunDir.clone() ?? new THREE.Vector3(-0.5, 1, 0.4).normalize(),
      fogColor: new THREE.Color(a.fog?.color ?? (b ? '#' + b.fogColor.getHexString() : '#000000')),
      fogNear: a.fog ? a.fog.near : b?.fogNear ?? 1000,
      fogFar: a.fog ? a.fog.far : b?.fogFar ?? 2000,
      exposure: a.exposure ?? b?.exposure ?? 1,
      bloom: a.bloom?.strength ?? b?.bloom ?? 0.6,
      tint: new THREE.Color(a.grade?.tint ?? (b ? '#' + b.tint.getHexString() : '#ffffff')),
      saturation: a.grade?.saturation ?? b?.saturation ?? 1,
      contrast: a.grade?.contrast ?? b?.contrast ?? 1,
      vignette: a.grade?.vignette ?? b?.vignette ?? 0.35,
    }
  }

  private applyLightState(s: LightState): void {
    this.hemi.color.copy(s.hemiSky)
    this.hemi.groundColor.copy(s.hemiGround)
    this.hemi.intensity = s.hemiI
    this.sun.color.copy(s.sunColor)
    this.sun.intensity = s.sunI
    this.sun.visible = s.sunI > 0.01
    this.sunDirection.copy(s.sunDir)
    if (s.fogFar < 900) {
      if (!(this.scene.fog instanceof THREE.Fog)) this.scene.fog = new THREE.Fog(s.fogColor, CAM_DIST + s.fogNear, CAM_DIST + s.fogFar)
      const f = this.scene.fog as THREE.Fog
      f.color.copy(s.fogColor)
      f.near = CAM_DIST + s.fogNear
      f.far = CAM_DIST + s.fogFar
    } else this.scene.fog = null
    this.renderer.setExposure(s.exposure)
    const g = this.renderer.gradeSettings
    g.tint.copy(s.tint)
    g.saturation = s.saturation
    g.contrast = s.contrast
    g.vignette = s.vignette
    // rim light follows the sky colour so characters separate from the night
    rim.color.value.copy(s.hemiSky).lerp(new THREE.Color('#ffffff'), 0.35)
  }

  private sunDirection = new THREE.Vector3(-0.5, 1, 0.4).normalize()

  applyAmbience(a: AmbienceDef, initial = false): void {
    this.sky.set(a.sky)
    this.lightState = this.stateFrom(a)
    this.applyLightState(this.lightState)
    this.renderer.setBloom(a.bloom?.strength ?? 0.6, a.bloom?.radius ?? 0.5, a.bloom?.threshold ?? 0.82)
    this.renderer.gradeSettings.grain = a.grade?.grain ?? 0.035
    this.sun.castShadow = a.sun?.shadows ?? true
    if (initial) for (const p of a.particles ?? []) this.particles.add(p)
  }

  /** Smoothly blend to a partial ambience over ms. */
  blendAmbience(a: Partial<AmbienceDef>, ms: number): Promise<void> {
    if (a.sky) this.sky.set({ ...a.sky })
    if (a.particles) for (const p of a.particles) this.particles.add(p)
    if (a.bloom) this.renderer.setBloom(a.bloom.strength, a.bloom.radius ?? 0.5, a.bloom.threshold ?? 0.82)
    const to = this.stateFrom(a as AmbienceDef, this.lightState)
    if (a.sun === undefined) to.sunI = this.lightState.sunI
    if (ms <= 0) {
      this.lightState = to
      this.applyLightState(to)
      return Promise.resolve()
    }
    this.tween?.resolve()
    return new Promise((resolve) => {
      this.tween = { from: this.cloneState(this.lightState), to, t: 0, dur: ms / 1000, resolve }
    })
  }

  private cloneState(s: LightState): LightState {
    return { ...s, hemiSky: s.hemiSky.clone(), hemiGround: s.hemiGround.clone(), sunColor: s.sunColor.clone(), sunDir: s.sunDir.clone(), fogColor: s.fogColor.clone(), tint: s.tint.clone() }
  }

  // ------------------------------------------------------------------ picking
  pickCell(ndcX: number, ndcY: number): Vec2 | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.rig.camera)
    this.raycaster.layers.set(0)
    const hits = this.raycaster.intersectObjects(this.floorMeshes, false)
    for (const h of hits) {
      if (h.face && h.face.normal.y > 0.5) return [Math.round(h.point.x), Math.round(h.point.z)]
    }
    return null
  }

  pickObject(ndcX: number, ndcY: number, objects: THREE.Object3D[]): THREE.Object3D | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.rig.camera)
    this.raycaster.layers.enableAll()
    const hits = this.raycaster.intersectObjects(objects, true)
    return hits[0]?.object ?? null
  }

  // ------------------------------------------------------------------ update
  update(dt: number, focus: THREE.Vector3): void {
    this.time += dt
    if (this.tween) {
      const tw = this.tween
      tw.t += dt
      const k = Math.min(1, tw.t / tw.dur)
      const e = k * k * (3 - 2 * k)
      const f = tw.from
      const t = tw.to
      const s: LightState = {
        hemiSky: f.hemiSky.clone().lerp(t.hemiSky, e),
        hemiGround: f.hemiGround.clone().lerp(t.hemiGround, e),
        hemiI: THREE.MathUtils.lerp(f.hemiI, t.hemiI, e),
        sunColor: f.sunColor.clone().lerp(t.sunColor, e),
        sunI: THREE.MathUtils.lerp(f.sunI, t.sunI, e),
        sunDir: f.sunDir.clone().lerp(t.sunDir, e).normalize(),
        fogColor: f.fogColor.clone().lerp(t.fogColor, e),
        fogNear: THREE.MathUtils.lerp(Math.min(f.fogNear, 200), Math.min(t.fogNear, 200), e),
        fogFar: THREE.MathUtils.lerp(Math.min(f.fogFar, 400), Math.min(t.fogFar, 400), e),
        exposure: THREE.MathUtils.lerp(f.exposure, t.exposure, e),
        bloom: THREE.MathUtils.lerp(f.bloom, t.bloom, e),
        tint: f.tint.clone().lerp(t.tint, e),
        saturation: THREE.MathUtils.lerp(f.saturation, t.saturation, e),
        contrast: THREE.MathUtils.lerp(f.contrast, t.contrast, e),
        vignette: THREE.MathUtils.lerp(f.vignette, t.vignette, e),
      }
      if (k >= 1) {
        s.fogNear = t.fogNear
        s.fogFar = t.fogFar
      }
      this.lightState = s
      this.applyLightState(s)
      if (k >= 1) {
        this.tween = null
        tw.resolve()
      }
    }
    // sun follows the camera focus so the shadow map stays sharp
    this.sun.position.copy(focus).addScaledVector(this.sunDirection, 40)
    this.sun.target.position.copy(focus)
    // camera cut-away
    cutaway.player.value.copy(focus)
    cutaway.camDir.value.copy(this.rig.towardCamera)
    // particles in world units -> pixels
    const cam = this.rig.camera
    setParticlePixelScale(this.renderer.renderer.getPixelRatio() * (window.innerHeight / (cam.top - cam.bottom)))
    this.particles.update(dt)
    updateLiquids(this.time)
    this.sky.update(this.time, window.innerWidth / Math.max(1, window.innerHeight))
    for (const a of this.animated) if (a.obj.visible) a.fn(a.obj, this.time, dt)
    // point light pool: nearest enabled sources to the focus
    this.lightTimer -= dt
    if (this.lightTimer <= 0) {
      this.lightTimer = 0.2
      const sorted = this.lights.filter((l) => l.enabled()).sort((a, b) => a.pos.distanceToSquared(focus) - b.pos.distanceToSquared(focus))
      this.pool.forEach((pl, i) => {
        const src = sorted[i]
        if (!src || src.pos.distanceTo(focus) > 22) {
          pl.visible = false
          pl.userData.src = null
          return
        }
        pl.visible = true
        pl.position.copy(src.pos)
        pl.color.set(src.light.color)
        pl.distance = src.light.distance
        pl.userData.src = src
      })
    }
    for (const pl of this.pool) {
      const src = pl.userData.src as LightSource | null
      if (!src) continue
      const fl = src.light.flicker ? 0.85 + Math.sin(this.time * 13 + src.seed) * 0.08 + Math.sin(this.time * 31 + src.seed * 2) * 0.05 : 1
      pl.intensity = src.light.intensity * fl
    }
    // decals
    this.decals = this.decals.filter((d) => {
      d.t += dt
      const k = d.t / d.dur
      const s = 0.2 + d.grow * Math.min(1, k * 1.8)
      d.mesh.scale.set(s, s, s)
      d.mesh.rotation.z += d.spin * dt
      ;(d.mesh.material as THREE.MeshBasicMaterial).opacity = k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.4)
      if (k >= 1) {
        this.fxGroup.remove(d.mesh)
        d.mesh.geometry.dispose()
        ;(d.mesh.material as THREE.Material).dispose()
        return false
      }
      return true
    })
    // markers bob
    for (const m of this.markers.values()) {
      m.obj.position.y = m.base.y + Math.sin(this.time * 2.4) * 0.06
      m.obj.children[0].rotation.y += dt * 1.5
      const s = m.active ? 1.35 : 1
      m.obj.children[0].scale.set(s, s * 1.6, s)
      m.obj.children[1].visible = m.active
    }
  }

  dispose(): void {
    this.particles.dispose()
    disposeLiquids()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.geometry && !m.geometry.userData.shared) {
        // geometries are cached in builders; only dispose map geometry
        if (o.parent === this.mapGroup) m.geometry.dispose()
      }
    })
  }
}
