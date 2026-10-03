import * as THREE from 'three'
import { FX_LAYER } from '../toon'
import { groundDepth, groundToScreen, plateFrame, type PlateDef, type UV } from './plateMath'

const YAW = Math.PI / 4
const PITCH = THREE.MathUtils.degToRad(35)
/** camera basis, identical to CameraRig */
export const VIEW_DIR = new THREE.Vector3(Math.cos(PITCH) * Math.sin(YAW), Math.sin(PITCH), Math.cos(PITCH) * Math.cos(YAW)).normalize()
export const VIEW_RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), VIEW_DIR).normalize()
export const VIEW_UP = new THREE.Vector3().crossVectors(VIEW_DIR, VIEW_RIGHT).normalize()
export const VIEW_QUAT = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(VIEW_RIGHT, VIEW_UP, VIEW_DIR))

// ------------------------------------------------------------------ texture cache
const textures = new Map<string, Promise<THREE.Texture>>()
const loader = new THREE.TextureLoader()

export function loadTexture(url: string): Promise<THREE.Texture> {
  let p = textures.get(url)
  if (!p) {
    p = loader.loadAsync(url).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      t.generateMipmaps = true
      t.minFilter = THREE.LinearMipmapLinearFilter
      return t
    })
    p.catch(() => textures.delete(url))
    textures.set(url, p)
  }
  return p
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`image ${url}`))
    img.src = url
  })
}

/** Load a plate's texture: one image, or a grid of tiles stitched into one canvas. */
export async function loadPlateTexture(def: PlateDef): Promise<THREE.Texture> {
  if (!def.tiles?.length) return loadTexture(def.src)
  const rows = await Promise.all(def.tiles.map((row) => Promise.all(row.map(loadImage))))
  const tw = rows[0][0].naturalWidth
  const th = rows[0][0].naturalHeight
  const cols = Math.max(...rows.map((r) => r.length))
  const max = 8192
  const scale = Math.min(1, max / Math.max(tw * cols, th * rows.length))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(tw * cols * scale)
  canvas.height = Math.round(th * rows.length * scale)
  const ctx = canvas.getContext('2d')!
  rows.forEach((row, y) => row.forEach((img, x) => ctx.drawImage(img, x * tw * scale, y * th * scale, tw * scale + 1, th * scale + 1)))
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.minFilter = THREE.LinearMipmapLinearFilter
  return tex
}

/**
 * The painted backdrop plus occluder cut-outs. The backdrop is a camera-facing
 * quad drawn first without depth. Each occluder is the same painting masked by
 * a polygon, on a camera-facing quad placed at the depth of its ground line, so
 * characters behind it are hidden by the depth test.
 */
export class PlateLayer {
  readonly group = new THREE.Group()
  readonly frame
  private materials: THREE.Material[] = []
  private geometries: THREE.BufferGeometry[] = []
  private masks: THREE.Texture[] = []

  constructor(
    readonly def: PlateDef,
    texture: THREE.Texture,
  ) {
    const f = (this.frame = plateFrame(def))
    const origin = new THREE.Vector3(f.cx, 0, f.cz)
    const exposure = def.exposure ?? 1
    const color = new THREE.Color(exposure, exposure, exposure)

    const bgGeo = new THREE.PlaneGeometry(f.W, f.H)
    const bgMat = new THREE.MeshBasicMaterial({ map: texture, color, depthTest: false, depthWrite: false, fog: false, toneMapped: false })
    const bg = new THREE.Mesh(bgGeo, bgMat)
    bg.quaternion.copy(VIEW_QUAT)
    bg.position.copy(origin).addScaledVector(VIEW_DIR, -60)
    bg.renderOrder = -1000
    bg.frustumCulled = false
    this.group.add(bg)
    this.materials.push(bgMat)
    this.geometries.push(bgGeo)

    for (const occ of def.occluders ?? []) this.addOccluder(occ.poly, occ.base, texture, origin, color)
    this.group.traverse((o) => o.layers.set(FX_LAYER))
    this.group.name = 'plate'
  }

  private addOccluder(poly: UV[], base: number | undefined, texture: THREE.Texture, origin: THREE.Vector3, color: THREE.Color): void {
    const f = this.frame
    let u0 = 1
    let v0 = 1
    let u1 = 0
    let v1 = 0
    for (const [u, v] of poly) {
      u0 = Math.min(u0, u)
      v0 = Math.min(v0, v)
      u1 = Math.max(u1, u)
      v1 = Math.max(v1, v)
    }
    const baseV = base ?? v1
    // ground point under the base line (centre of the occluder)
    const [gx, gz] = f.fromUV((u0 + u1) / 2, baseV)
    const depth = groundDepth(gx - f.cx, gz - f.cz)
    const w = (u1 - u0) * f.W
    const h = (v1 - v0) * f.H
    const geo = new THREE.PlaneGeometry(w, h)
    const uv = geo.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) {
      // PlaneGeometry uv: (0,1) top-left; texture v is flipped relative to image v
      const su = uv.getX(i)
      const sv = uv.getY(i)
      uv.setXY(i, u0 + su * (u1 - u0), 1 - (v1 - sv * (v1 - v0)))
    }
    // mask canvas covering the bbox
    const res = 512
    const cw = Math.max(8, Math.round(res * (u1 - u0)))
    const ch = Math.max(8, Math.round(res * (v1 - v0) * this.def.aspect))
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, cw, ch)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    poly.forEach(([u, v], i) => {
      const x = ((u - u0) / (u1 - u0)) * cw
      const y = ((v - v0) / (v1 - v0)) * ch
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
    const mask = new THREE.CanvasTexture(canvas)
    // the mask uses the geometry's original 0..1 uv, so give it its own transform
    mask.flipY = true
    const mat = new THREE.MeshBasicMaterial({ map: texture, color, alphaMap: mask, alphaTest: 0.5, fog: false, toneMapped: false })
    // alphaMap normally shares map's uv; remap it in the shader to the bbox-local uv
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uBox = { value: new THREE.Vector4(u0, 1 - v1, u1 - u0, v1 - v0) }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec4 uBox;')
        .replace('#include <alphamap_fragment>', 'diffuseColor.a *= texture2D( alphaMap, (vAlphaMapUv - uBox.xy) / uBox.zw ).g;')
    }
    const mesh = new THREE.Mesh(geo, mat)
    const [sx, sup] = groundToScreen(0, 0)
    mesh.quaternion.copy(VIEW_QUAT)
    mesh.position
      .copy(origin)
      .addScaledVector(VIEW_RIGHT, sx + ((u0 + u1) / 2 - 0.5) * f.W)
      .addScaledVector(VIEW_UP, sup + (0.5 - (v0 + v1) / 2) * f.H)
      .addScaledVector(VIEW_DIR, depth)
    mesh.renderOrder = -500
    this.group.add(mesh)
    this.materials.push(mat)
    this.geometries.push(geo)
    this.masks.push(mask)
  }

  dispose(): void {
    this.materials.forEach((m) => m.dispose())
    this.geometries.forEach((g) => g.dispose())
    this.masks.forEach((t) => t.dispose())
  }
}
