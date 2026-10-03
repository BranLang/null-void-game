import * as THREE from 'three'
import { FX_LAYER } from './toon'

/**
 * Isometric orthographic camera. Yaw 45°, pitch ~35° (true isometric is
 * 35.264°). The rig follows a target smoothly, supports scripted focus moves,
 * zoom and screen shake.
 */
export class CameraRig {
  readonly camera: THREE.OrthographicCamera
  readonly target = new THREE.Vector3()
  private desired = new THREE.Vector3()
  private follow: (() => THREE.Vector3 | null) | null = null
  private zoom = 1
  private desiredZoom = 1
  private viewHeight = 12.5
  private shakeTime = 0
  private shakeDuration = 0
  private shakeIntensity = 0
  private tween: {
    from: THREE.Vector3
    to: THREE.Vector3
    zoomFrom: number
    zoomTo: number
    t: number
    dur: number
    resolve: () => void
  } | null = null
  readonly yaw = Math.PI / 4
  readonly pitch = THREE.MathUtils.degToRad(35)
  private readonly dir: THREE.Vector3
  private bounds: THREE.Box2 | null = null
  minZoom = 0.6
  maxZoom = 1.8

  constructor() {
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 600)
    this.camera.layers.enable(FX_LAYER)
    this.dir = new THREE.Vector3(
      Math.cos(this.pitch) * Math.sin(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.cos(this.yaw),
    ).normalize()
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  /** Unit vector on the ground plane pointing "up the screen". */
  get screenUp(): THREE.Vector3 {
    return new THREE.Vector3(-this.dir.x, 0, -this.dir.z).normalize()
  }

  /** Unit vector on the ground plane pointing "right on the screen". */
  get screenRight(): THREE.Vector3 {
    const up = this.screenUp
    return new THREE.Vector3(-up.z, 0, up.x)
  }

  /** Direction from the scene towards the camera (for wall cut-away). */
  get towardCamera(): THREE.Vector3 {
    return this.dir.clone()
  }

  /** Painted plate bounds: the view never shows past the edges of the image. */
  private plate: { center: THREE.Vector3; w: number; h: number } | null = null

  setPlate(center: THREE.Vector3 | null, w = 0, h = 0): void {
    this.plate = center ? { center: center.clone(), w, h } : null
    this.resize()
  }

  resize(): void {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight)
    let h = this.viewHeight / this.zoom
    if (this.plate) {
      const cover = Math.min(this.plate.h, this.plate.w / aspect, this.viewHeight)
      h = Math.min(cover / this.zoom, cover)
    }
    this.camera.left = (-h * aspect) / 2
    this.camera.right = (h * aspect) / 2
    this.camera.top = h / 2
    this.camera.bottom = -h / 2
    this.camera.updateProjectionMatrix()
  }

  setViewHeight(h: number): void {
    this.viewHeight = h
    this.resize()
  }

  setBounds(minX: number, minZ: number, maxX: number, maxZ: number): void {
    this.bounds = new THREE.Box2(new THREE.Vector2(minX, minZ), new THREE.Vector2(maxX, maxZ))
  }

  followTarget(fn: (() => THREE.Vector3 | null) | null): void {
    this.follow = fn
  }

  snapTo(p: THREE.Vector3): void {
    this.target.copy(p)
    this.desired.copy(p)
    this.apply()
  }

  setZoom(z: number, instant = false): void {
    this.desiredZoom = THREE.MathUtils.clamp(z, this.minZoom, this.maxZoom)
    if (instant) {
      this.zoom = this.desiredZoom
      this.resize()
    }
  }

  getZoom(): number {
    return this.desiredZoom
  }

  nudgeZoom(delta: number): void {
    this.setZoom(this.desiredZoom * (1 - delta))
  }

  /** Scripted camera move. Resolves when finished. */
  focus(p: THREE.Vector3, ms = 900, zoom?: number): Promise<void> {
    if (this.tween) this.tween.resolve()
    return new Promise((resolve) => {
      this.follow = null
      this.tween = {
        from: this.target.clone(),
        to: p.clone(),
        zoomFrom: this.zoom,
        zoomTo: zoom ?? this.zoom,
        t: 0,
        dur: Math.max(1, ms) / 1000,
        resolve,
      }
    })
  }

  shake(intensity = 0.25, ms = 400): void {
    this.shakeIntensity = Math.max(this.shakeIntensity * (this.shakeTime > 0 ? 1 : 0), intensity)
    this.shakeDuration = ms / 1000
    this.shakeTime = ms / 1000
  }

  update(dt: number, reducedMotion = false): void {
    if (this.tween) {
      const tw = this.tween
      tw.t += dt
      const k = Math.min(1, tw.t / tw.dur)
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      this.target.lerpVectors(tw.from, tw.to, e)
      this.desired.copy(this.target)
      this.zoom = THREE.MathUtils.lerp(tw.zoomFrom, tw.zoomTo, e)
      this.desiredZoom = this.zoom
      this.resize()
      if (k >= 1) {
        this.tween = null
        tw.resolve()
      }
    } else {
      if (this.follow) {
        const p = this.follow()
        if (p) this.desired.copy(p)
      }
      const k = 1 - Math.exp(-dt * 5)
      this.target.lerp(this.desired, k)
      if (Math.abs(this.zoom - this.desiredZoom) > 1e-4) {
        this.zoom += (this.desiredZoom - this.zoom) * (1 - Math.exp(-dt * 8))
        this.resize()
      }
    }
    if (this.bounds) {
      this.target.x = THREE.MathUtils.clamp(this.target.x, this.bounds.min.x, this.bounds.max.x)
      this.target.z = THREE.MathUtils.clamp(this.target.z, this.bounds.min.y, this.bounds.max.y)
    }
    this.clampToPlate()
    this.apply()
    if (this.shakeTime > 0 && !reducedMotion) {
      this.shakeTime -= dt
      const k = Math.max(0, this.shakeTime / this.shakeDuration)
      const s = this.shakeIntensity * k
      this.camera.position.x += (Math.random() - 0.5) * s
      this.camera.position.y += (Math.random() - 0.5) * s
      this.camera.position.z += (Math.random() - 0.5) * s
    }
  }

  private clampToPlate(): void {
    const p = this.plate
    if (!p) return
    const right = new THREE.Vector3(-this.dir.z, 0, this.dir.x).negate()
    const up = new THREE.Vector3().crossVectors(this.dir, right)
    const d = this.target.clone().sub(p.center)
    const halfW = (this.camera.right - this.camera.left) / 2
    const halfH = (this.camera.top - this.camera.bottom) / 2
    const sx = d.dot(right)
    const sy = d.dot(up)
    const depth = d.dot(this.dir)
    const cx = THREE.MathUtils.clamp(sx, -p.w / 2 + halfW, p.w / 2 - halfW)
    const cy = THREE.MathUtils.clamp(sy, -p.h / 2 + halfH, p.h / 2 - halfH)
    if (cx === sx && cy === sy) return
    this.target.copy(p.center).addScaledVector(right, cx).addScaledVector(up, cy).addScaledVector(this.dir, depth)
  }

  private apply(): void {
    const dist = 100
    this.camera.position.copy(this.target).addScaledVector(this.dir, dist)
    this.camera.lookAt(this.target)
  }

  /** Project a world position into CSS pixel coordinates. */
  toScreen(p: THREE.Vector3): { x: number; y: number; visible: boolean } {
    const v = p.clone().project(this.camera)
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
      visible: v.z > -1 && v.z < 1,
    }
  }
}
