import * as THREE from 'three'
import { CAST } from '../content/characters'
import { buildCharacter } from '../engine/characters/CharacterFactory'
import { Animator } from '../engine/characters/Animator'
import type { Expression } from '../engine/characters/Face'

/**
 * Dialogue portraits. Characters with painted anime art (public/assets/portraits)
 * use it; everyone else gets a cel-shaded head-and-shoulders render of their
 * 3D model, so the whole cast has a consistent portrait.
 */
export class Portraits {
  private cache = new Map<string, HTMLCanvasElement>()
  private target = new THREE.WebGLRenderTarget(320, 320)

  constructor(private renderer: THREE.WebGLRenderer) {
    this.target.texture.colorSpace = THREE.SRGBColorSpace
  }

  /** URL of painted art, a rendered canvas, or null (narrator / phantoms). */
  get(castId: string, mood: Expression = 'neutral'): string | HTMLCanvasElement | null {
    const cast = CAST[castId]
    if (!cast) return null
    if (cast.portrait && !import.meta.env.VITE_PROCEDURAL) return `assets/portraits/${cast.portrait}.webp`
    if (cast.special || 'quadruped' in cast.look) return this.renderQuad(castId)
    const key = `${castId}|${mood}`
    const hit = this.cache.get(key)
    if (hit) return hit
    const canvas = this.render(castId, mood)
    if (canvas) this.cache.set(key, canvas)
    return canvas
  }

  private renderQuad(castId: string): HTMLCanvasElement | null {
    const hit = this.cache.get(castId)
    if (hit) return hit
    const c = document.createElement('canvas')
    c.width = c.height = 160
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(80, 70, 10, 80, 80, 90)
    g.addColorStop(0, CAST[castId]?.color ?? '#6a5aa0')
    g.addColorStop(1, '#0b0912')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 160, 160)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '700 64px Cinzel, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((CAST[castId]?.name.sk ?? '?').slice(0, 1), 80, 86)
    this.cache.set(castId, c)
    return c
  }

  private render(castId: string, mood: Expression): HTMLCanvasElement | null {
    const cast = CAST[castId]
    if (!cast || 'quadruped' in cast.look) return null
    const model = buildCharacter(cast.look)
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight('#dfe6ff', '#3a3048', 1.5))
    const key = new THREE.DirectionalLight('#fff2e0', 2.2)
    key.position.set(-1.5, 2.5, 3)
    scene.add(key)
    const rimL = new THREE.DirectionalLight(cast.color ?? '#a0c8ff', 1.6)
    rimL.position.set(2, 1.5, -2.5)
    scene.add(rimL)
    scene.add(model.rig.root)
    const anim = new Animator(model)
    anim.expression = mood
    anim.update(0.016, model.rig.root)
    if (model.face) {
      model.face.expr = mood
      model.face.blink = false
      model.face.mouth = false
      model.face.apply()
    }
    model.rig.root.updateMatrixWorld(true)
    const head = new THREE.Vector3()
    model.rig.head.getWorldPosition(head)
    const cam = new THREE.PerspectiveCamera(24, 1, 0.05, 20)
    cam.position.set(head.x + 0.18, head.y + 0.02, head.z + 1.55)
    cam.lookAt(head.x, head.y - 0.06, head.z)
    const r = this.renderer
    const prevTarget = r.getRenderTarget()
    const prevClear = r.getClearColor(new THREE.Color())
    const prevAlpha = r.getClearAlpha()
    r.setRenderTarget(this.target)
    r.setClearColor(0x000000, 0)
    r.clear()
    r.render(scene, cam)
    const w = this.target.width
    const h = this.target.height
    const buf = new Uint8Array(w * h * 4)
    r.readRenderTargetPixels(this.target, 0, 0, w, h, buf)
    r.setRenderTarget(prevTarget)
    r.setClearColor(prevClear, prevAlpha)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    const img = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      const src = (h - 1 - y) * w * 4
      img.data.set(buf.subarray(src, src + w * 4), y * w * 4)
    }
    ctx.putImageData(img, 0, 0)
    // ink outline around the silhouette for the anime look
    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    const o = out.getContext('2d')!
    o.filter = 'drop-shadow(0 0 1.5px #120a18) drop-shadow(0 0 1px #120a18)'
    o.drawImage(canvas, 0, 0)
    // dispose per-character materials
    model.materials.forEach((m) => m.dispose())
    return out
  }
}
