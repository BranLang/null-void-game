import * as THREE from 'three'

/**
 * Anime faces painted on a canvas and wrapped onto the front of the head.
 * Each character gets textures for a set of expressions, plus blink and
 * talking-mouth variants, generated lazily and cached.
 */
export type Expression = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fear' | 'pain' | 'determined' | 'tender' | 'closed' | 'blank'

export type FaceStyle = 'female' | 'male' | 'child' | 'old' | 'beast'

export interface FaceSpec {
  iris: string
  brow: string
  style: FaceStyle
  /** slit pupils (Mezra/Ghorki felines) */
  slit?: boolean
  /** freckles / scars */
  mark?: 'scar' | 'freckles' | 'none'
  /** empty sockets (Maks without glasses), glowing (possessed) */
  special?: 'empty' | 'violet' | 'none'
  skin: string
}

export const FACE_W = 256
export const FACE_H = 160
/** angular size of the face cap on the head sphere */
export const FACE_PHI = Math.PI * 0.78
export const FACE_THETA_START = Math.PI * 0.27
export const FACE_THETA_LEN = Math.PI * 0.5

const cache = new Map<string, THREE.CanvasTexture>()

export function faceTexture(spec: FaceSpec, expr: Expression, blink: boolean, mouthOpen: boolean): THREE.CanvasTexture {
  const key = `${spec.iris}|${spec.brow}|${spec.style}|${spec.slit}|${spec.mark}|${spec.special}|${expr}|${blink}|${mouthOpen}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = FACE_W
  c.height = FACE_H
  const ctx = c.getContext('2d')!
  paintFace(ctx, spec, expr, blink, mouthOpen)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  return tex
}

function shade(hex: string, k: number): string {
  const col = new THREE.Color(hex)
  col.multiplyScalar(k)
  return '#' + col.getHexString()
}

function paintFace(ctx: CanvasRenderingContext2D, s: FaceSpec, expr: Expression, blink: boolean, mouthOpen: boolean): void {
  ctx.clearRect(0, 0, FACE_W, FACE_H)
  const cx = FACE_W / 2
  const male = s.style === 'male' || s.style === 'old'
  const child = s.style === 'child'
  const eyeY = 74
  const eyeDX = male ? 30 : 31
  const eyeW = male ? 21 : child ? 22 : 21
  let open = male ? 0.62 : child ? 1.05 : 0.92
  if (expr === 'surprised' || expr === 'fear') open *= 1.25
  if (expr === 'angry' || expr === 'determined') open *= 0.78
  if (expr === 'pain') open *= 0.45
  const closed = blink || expr === 'closed' || expr === 'happy' || expr === 'tender'
  const ink = '#1b1218'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // blush
  if (expr === 'tender' || expr === 'happy') {
    for (const side of [-1, 1]) {
      const g = ctx.createRadialGradient(cx + side * 40, eyeY + 22, 0, cx + side * 40, eyeY + 22, 16)
      g.addColorStop(0, 'rgba(255,110,120,0.45)')
      g.addColorStop(1, 'rgba(255,110,120,0)')
      ctx.fillStyle = g
      ctx.fillRect(cx + side * 40 - 18, eyeY + 6, 36, 32)
    }
  }
  if (s.mark === 'freckles') {
    ctx.fillStyle = 'rgba(140,70,40,0.5)'
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1
      ctx.beginPath()
      ctx.arc(cx + side * (28 + (i * 7) % 18), eyeY + 18 + (i * 5) % 8, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (s.mark === 'scar') {
    ctx.strokeStyle = 'rgba(150,60,60,0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx + 38, eyeY - 6)
    ctx.lineTo(cx + 30, eyeY + 26)
    ctx.stroke()
  }

  for (const side of [-1, 1] as const) {
    const ex = cx + side * eyeDX
    // ---- brows
    let browTilt = 0
    let browLift = 0
    if (expr === 'angry' || expr === 'determined') browTilt = expr === 'angry' ? 0.42 : 0.22
    if (expr === 'sad' || expr === 'fear' || expr === 'pain') browTilt = -0.35
    if (expr === 'surprised' || expr === 'fear') browLift = 6
    ctx.strokeStyle = s.brow
    ctx.lineWidth = male ? 4.2 : 2.6
    ctx.beginPath()
    const by = eyeY - 22 - browLift
    const inner = ex - side * 12
    const outer = ex + side * 15
    ctx.moveTo(inner, by + browTilt * 9)
    ctx.quadraticCurveTo(ex + side * 2, by - 4 - browTilt * 2, outer, by + 2 - browTilt * 4)
    ctx.stroke()

    if (s.special === 'empty') {
      ctx.fillStyle = '#050307'
      ctx.beginPath()
      ctx.ellipse(ex, eyeY, eyeW * 0.8, 10, 0, 0, Math.PI * 2)
      ctx.fill()
      continue
    }

    if (closed) {
      // closed eye: happy arc or soft lash line
      ctx.strokeStyle = ink
      ctx.lineWidth = 3.4
      ctx.beginPath()
      if (expr === 'happy') {
        ctx.moveTo(ex - eyeW * 0.8, eyeY + 4)
        ctx.quadraticCurveTo(ex, eyeY - 9, ex + eyeW * 0.8, eyeY + 4)
      } else {
        ctx.moveTo(ex - eyeW * 0.85, eyeY + 1)
        ctx.quadraticCurveTo(ex, eyeY + 8, ex + eyeW * 0.85, eyeY + 1)
        if (!male) {
          ctx.moveTo(ex + side * eyeW * 0.85, eyeY + 1)
          ctx.lineTo(ex + side * (eyeW + 4), eyeY - 2)
        }
      }
      ctx.stroke()
      continue
    }

    const h = 14 * open
    // ---- sclera
    ctx.fillStyle = '#fbf8f4'
    ctx.beginPath()
    ctx.moveTo(ex - eyeW, eyeY)
    ctx.quadraticCurveTo(ex - side * 2, eyeY - h * 1.25, ex + eyeW, eyeY - (male ? 0 : side * 1))
    ctx.quadraticCurveTo(ex, eyeY + h * 0.95, ex - eyeW, eyeY)
    ctx.fill()
    // ---- iris
    const irisR = (male ? 8.5 : child ? 11 : 10) * (expr === 'fear' ? 0.75 : 1)
    const irisH = irisR * (male ? 1.1 : 1.3)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(ex - eyeW, eyeY)
    ctx.quadraticCurveTo(ex - side * 2, eyeY - h * 1.25, ex + eyeW, eyeY - (male ? 0 : side * 1))
    ctx.quadraticCurveTo(ex, eyeY + h * 0.95, ex - eyeW, eyeY)
    ctx.clip()
    const iy = eyeY - 1
    const grad = ctx.createLinearGradient(0, iy - irisH, 0, iy + irisH)
    if (s.special === 'violet') {
      grad.addColorStop(0, '#2a0a4a')
      grad.addColorStop(1, '#c87bff')
    } else {
      grad.addColorStop(0, shade(s.iris, 0.35))
      grad.addColorStop(0.55, s.iris)
      grad.addColorStop(1, shade(s.iris, 1.55))
    }
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(ex, iy, irisR, irisH, 0, 0, Math.PI * 2)
    ctx.fill()
    // pupil
    ctx.fillStyle = shade(s.iris, 0.18)
    ctx.beginPath()
    if (s.slit) ctx.ellipse(ex, iy, irisR * 0.22, irisH * 0.8, 0, 0, Math.PI * 2)
    else ctx.ellipse(ex, iy, irisR * 0.45, irisH * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    // highlights
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(ex - irisR * 0.38, iy - irisH * 0.38, irisR * 0.32, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(ex + irisR * 0.35, iy + irisH * 0.42, irisR * 0.14, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // ---- upper lash line (thick, winged for female)
    ctx.strokeStyle = ink
    ctx.lineWidth = male ? 3.2 : 4.4
    ctx.beginPath()
    ctx.moveTo(ex - side * eyeW * 1.02, eyeY + 1)
    ctx.quadraticCurveTo(ex - side * 2, eyeY - h * 1.3, ex + side * eyeW, eyeY - (male ? 0 : 2))
    if (!male) ctx.lineTo(ex + side * (eyeW + 5), eyeY - 6)
    ctx.stroke()
    // lower lash
    ctx.lineWidth = 1.4
    ctx.globalAlpha = 0.75
    ctx.beginPath()
    ctx.moveTo(ex - side * eyeW * 0.5, eyeY + h * 0.62)
    ctx.quadraticCurveTo(ex + side * eyeW * 0.3, eyeY + h * 0.75, ex + side * eyeW * 0.95, eyeY + 1)
    ctx.stroke()
    ctx.globalAlpha = 1
    if (s.style === 'old') {
      ctx.lineWidth = 1.2
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(ex + side * (eyeW + 2), eyeY + 4)
      ctx.lineTo(ex + side * (eyeW + 8), eyeY + 9)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  if (s.style === 'beast') return

  // ---- nose: small anime tick
  ctx.strokeStyle = shade(s.skin, 0.6)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx + 1, eyeY + 18)
  ctx.lineTo(cx - 2, eyeY + 23)
  ctx.stroke()

  // ---- mouth
  const my = eyeY + 38
  ctx.strokeStyle = '#5a2a2c'
  ctx.fillStyle = '#7a2e34'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  const talking = mouthOpen
  if (expr === 'surprised' || expr === 'fear' || (talking && expr !== 'happy')) {
    const w = talking ? 6 : 5
    const hh = talking ? 4.5 : 6
    ctx.ellipse(cx, my, w, hh, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (expr === 'happy' || expr === 'tender') {
    ctx.moveTo(cx - 9, my - 2)
    ctx.quadraticCurveTo(cx, my + (talking ? 8 : 5), cx + 9, my - 2)
    if (talking) ctx.fill()
    else ctx.stroke()
  } else if (expr === 'sad' || expr === 'pain') {
    ctx.moveTo(cx - 8, my + 3)
    ctx.quadraticCurveTo(cx, my - 3, cx + 8, my + 3)
    ctx.stroke()
  } else if (expr === 'angry') {
    ctx.moveTo(cx - 8, my + 1)
    ctx.lineTo(cx + 8, my - 1)
    ctx.stroke()
  } else {
    ctx.moveTo(cx - 6, my)
    ctx.quadraticCurveTo(cx, my + 1.5, cx + 6, my)
    ctx.stroke()
  }
}

/** Cap geometry for the face decal (front of a head sphere of radius r). */
export function faceGeometry(r: number): THREE.BufferGeometry {
  return new THREE.SphereGeometry(r, 28, 18, Math.PI / 2 - FACE_PHI / 2, FACE_PHI, FACE_THETA_START, FACE_THETA_LEN)
}
