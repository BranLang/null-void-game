import * as THREE from 'three'
import { FX_LAYER } from '../toon'
import { loadTexture, VIEW_DIR, VIEW_QUAT } from '../plate/PlateLayer'
import { groundToScreen, SCREEN_PER_VERTICAL } from '../plate/plateMath'

/** Layout of public/assets/sprites/<id>/sheet.json (written by scripts/pack_sprites.py). */
export interface SpriteSheetMeta {
  cell: [number, number]
  cols: number
  foot: [number, number]
  charPx: number
  anims: Record<string, { frames: number[]; fps: number; loop?: boolean }>
}

interface Sheet {
  meta: SpriteSheetMeta
  texture: THREE.Texture
}

const sheets = new Map<string, Promise<Sheet>>()

export function loadSpriteSheet(id: string): Promise<Sheet> {
  let p = sheets.get(id)
  if (!p) {
    const base = `assets/sprites/${id}/`
    p = Promise.all([fetch(base + 'sheet.json').then((r) => r.json() as Promise<SpriteSheetMeta>), loadTexture(base + 'sheet.png')]).then(([meta, texture]) => {
      texture.generateMipmaps = true
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.magFilter = THREE.LinearFilter
      return { meta, texture }
    })
    p.catch(() => sheets.delete(id))
    sheets.set(id, p)
  }
  return p
}

const loaded = new Map<string, Sheet>()

export async function preloadSprites(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      loadSpriteSheet(id)
        .then((s) => void loaded.set(id, s))
        .catch((e) => console.warn(`[sprite] ${id}`, e)),
    ),
  )
}

export type SpriteDir = 's' | 'se' | 'e' | 'ne' | 'n' | 'nw' | 'w' | 'sw'
const DIRS: SpriteDir[] = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se']
const MIRROR: Record<SpriteDir, SpriteDir> = { s: 's', n: 'n', e: 'w', w: 'e', se: 'sw', sw: 'se', ne: 'nw', nw: 'ne' }
/** fallbacks for a missing direction (after trying its mirror) */
const NEAR: Record<SpriteDir, SpriteDir[]> = {
  s: ['se', 'sw'],
  n: ['ne', 'nw'],
  e: ['se', 'ne'],
  w: ['sw', 'nw'],
  se: ['e', 's'],
  sw: ['w', 's'],
  ne: ['e', 'n'],
  nw: ['w', 'n'],
}

/** Screen direction of a world yaw (atan2(vx, vz) convention used by Actor). */
export function yawToDir(yaw: number): SpriteDir {
  const [sx, sup] = groundToScreen(Math.sin(yaw), Math.cos(yaw))
  const a = Math.atan2(sup, sx)
  const i = Math.round(a / (Math.PI / 4))
  return DIRS[((i % 8) + 8) % 8]
}

const blobTexture = (() => {
  let tex: THREE.Texture | null = null
  return () => {
    if (tex) return tex
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32)
    grad.addColorStop(0, 'rgba(0,0,0,0.55)')
    grad.addColorStop(0.6, 'rgba(0,0,0,0.25)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    tex = new THREE.CanvasTexture(c)
    return tex
  }
})()

/**
 * A billboarded 2D character (painted / pixel sprite) for plate scenes.
 * The quad always faces the camera; its pivot is at the feet.
 */
export class SpriteCharacter {
  readonly root = new THREE.Group()
  readonly height: number
  private mesh: THREE.Mesh
  private mat: THREE.MeshBasicMaterial
  private sheet: Sheet | null
  private anim = ''
  private flip = false
  private t = 0
  private frame = -1
  state = 'idle'
  dir: SpriteDir = 's'
  /** playback speed multiplier for walk cycles */
  rate = 1
  private shadow: THREE.Mesh

  constructor(
    readonly id: string,
    /** on-screen height of the character in world units */
    screenHeight = 1.45,
    tint: THREE.ColorRepresentation = '#ffffff',
  ) {
    this.sheet = loaded.get(id) ?? null
    this.height = screenHeight / SCREEN_PER_VERTICAL
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, depthWrite: false, fog: false, toneMapped: false, color: tint, side: THREE.DoubleSide })
    const geo = new THREE.PlaneGeometry(1, 1)
    this.mesh = new THREE.Mesh(geo, this.mat)
    this.mesh.quaternion.copy(VIEW_QUAT)
    this.mesh.layers.set(FX_LAYER)
    this.mesh.frustumCulled = false
    const holder = new THREE.Group()
    holder.add(this.mesh)
    this.root.add(holder)
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, fog: false, toneMapped: false }),
    )
    this.shadow.rotation.x = -Math.PI / 2
    this.shadow.scale.set(screenHeight * 0.42, screenHeight * 0.24, 1)
    this.shadow.position.y = 0.02
    this.shadow.layers.set(FX_LAYER)
    this.root.add(this.shadow)
    if (this.sheet) this.layout(screenHeight)
    else {
      this.mesh.visible = false
      void loadSpriteSheet(id).then((s) => {
        this.sheet = s
        loaded.set(id, s)
        this.layout(screenHeight)
        this.mesh.visible = true
      })
    }
  }

  private layout(screenHeight: number): void {
    const s = this.sheet!
    const { cell, foot, charPx } = s.meta
    const worldPerPx = screenHeight / charPx
    const w = cell[0] * worldPerPx
    const h = cell[1] * worldPerPx
    this.mesh.scale.set(w, h, 1)
    // pivot at the feet: shift the quad so the foot anchor sits at the origin (in the camera plane)
    const offX = (0.5 - foot[0]) * w
    const offY = (foot[1] - 0.5) * h
    this.offX = offX
    this.offY = offY
    this.place(false)
    this.mat.map = s.texture.clone()
    this.mat.map.needsUpdate = true
    this.mat.map.repeat.set(1 / s.meta.cols, cell[1] / (s.texture.image as HTMLImageElement).height)
    this.mat.needsUpdate = true
    this.anim = ''
  }

  private offX = 0
  private offY = 0

  private place(flip: boolean): void {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(VIEW_QUAT)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(VIEW_QUAT)
    // nudge towards the camera so the sprite wins against the ground it stands on
    this.mesh.position
      .copy(right.multiplyScalar(flip ? -this.offX : this.offX))
      .addScaledVector(up, this.offY)
      .addScaledVector(VIEW_DIR, 0.35)
  }

  set tint(c: THREE.ColorRepresentation) {
    this.mat.color.set(c)
  }

  set opacity(o: number) {
    this.mat.opacity = o
    ;(this.shadow.material as THREE.MeshBasicMaterial).opacity = o
  }

  private resolve(state: string, dir: SpriteDir): { name: string; flip: boolean } | null {
    const anims = this.sheet!.meta.anims
    const tryDir = (st: string, d: SpriteDir) => {
      if (anims[`${st}_${d}`]) return { name: `${st}_${d}`, flip: false }
      if (anims[`${st}_${MIRROR[d]}`]) return { name: `${st}_${MIRROR[d]}`, flip: true }
      return null
    }
    for (const st of [state, state === 'run' ? 'walk' : 'idle', 'idle']) {
      const hit = tryDir(st, dir) ?? NEAR[dir].map((d) => tryDir(st, d)).find(Boolean) ?? tryDir(st, 's') ?? tryDir(st, 'n')
      if (hit) return hit
    }
    const any = Object.keys(anims)[0]
    return any ? { name: any, flip: false } : null
  }

  update(dt: number): void {
    const s = this.sheet
    if (!s || !this.mat.map) return
    const r = this.resolve(this.state, this.dir)
    if (!r) return
    if (r.name !== this.anim) {
      this.anim = r.name
      this.t = 0
    }
    this.flip = r.flip
    const a = s.meta.anims[r.name]
    this.t += dt * a.fps * (r.name.startsWith('walk') ? this.rate : 1)
    const n = a.frames.length
    const k = a.loop === false ? Math.min(n - 1, Math.floor(this.t)) : Math.floor(this.t) % n
    const cellIndex = a.frames[k]
    const flipNow = this.flip
    if (cellIndex === this.frame && this.mesh.scale.x > 0 === !flipNow) return
    this.frame = cellIndex
    const cols = s.meta.cols
    const rows = Math.round((s.texture.image as HTMLImageElement).height / s.meta.cell[1])
    const col = cellIndex % cols
    const row = Math.floor(cellIndex / cols)
    const map = this.mat.map
    map.offset.set(col / cols, 1 - (row + 1) / rows)
    this.mesh.scale.x = Math.abs(this.mesh.scale.x) * (flipNow ? -1 : 1)
    this.place(flipNow)
  }

  dispose(): void {
    this.mat.map?.dispose()
    this.mat.dispose()
    this.mesh.geometry.dispose()
    this.shadow.geometry.dispose()
    ;(this.shadow.material as THREE.Material).dispose()
  }
}
