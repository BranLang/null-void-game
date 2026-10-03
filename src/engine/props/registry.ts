import * as THREE from 'three'
import type { Vec2 } from '../../content/types'
import { toon } from '../toon'

export interface PropContext {
  /** colour override from the content (or undefined) */
  color?: THREE.Color
  params: Record<string, string | number | boolean>
  /** deterministic per-placement seed, use rand() for variation */
  rand: () => number
}

export interface PropLight {
  color: string
  intensity: number
  distance: number
  /** height above the prop's base */
  y: number
  flicker?: boolean
}

export interface PropDef {
  build: (ctx: PropContext) => THREE.Object3D
  /** Blocks movement on its cell(s) by default */
  solid?: boolean
  /** Extra cells covered (relative to the anchor cell, before rotation) */
  footprint?: Vec2[]
  light?: PropLight | ((ctx: PropContext) => PropLight | null)
  /** Called every frame for animated props (water wheels, flames, crystals) */
  animate?: (obj: THREE.Object3D, time: number, dt: number) => void
  castShadow?: boolean
}

const registry = new Map<string, PropDef>()

export function registerProp(type: string, def: PropDef): void {
  registry.set(type, def)
}

export function getProp(type: string): PropDef | undefined {
  return registry.get(type)
}

export function propTypes(): string[] {
  return [...registry.keys()].sort()
}

// ---------------------------------------------------------------------------
// Shared helpers for prop builders
// ---------------------------------------------------------------------------

const matCache = new Map<string, THREE.MeshToonMaterial>()
const glowCache = new Map<string, THREE.MeshBasicMaterial>()

export interface MatOpts {
  /** kept for compatibility; toon materials ignore roughness */
  rough?: number
  /** kept for compatibility; toon materials ignore metalness */
  metal?: number
  emissive?: string
  ei?: number
  flat?: boolean
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
}

/** Cached cel-shaded (toon) material. */
export function mat(color: string | THREE.Color, o: MatOpts = {}): THREE.MeshToonMaterial {
  const c = typeof color === 'string' ? color : '#' + color.getHexString()
  const key = `${c}|${o.emissive ?? ''}|${o.ei ?? 0}|${o.flat ?? true}|${o.opacity ?? 1}|${o.side ?? 0}`
  let m = matCache.get(key)
  if (!m) {
    m = toon(c, {
      flat: o.flat ?? true,
      emissive: o.emissive,
      ei: o.ei,
      transparent: o.transparent,
      opacity: o.opacity,
      side: o.side,
    })
    matCache.set(key, m)
  }
  return m
}

/** Unlit glowing material for flames, crystals and glyph light (blooms). */
export function glowMat(color: string, intensity = 2.5, opacity = 1): THREE.MeshBasicMaterial {
  const key = `${color}|${intensity}|${opacity}`
  let m = glowCache.get(key)
  if (!m) {
    const c = new THREE.Color(color).multiplyScalar(intensity)
    m = new THREE.MeshBasicMaterial({ color: c, transparent: opacity < 1, opacity, toneMapped: false })
    m.userData.fx = true
    glowCache.set(key, m)
  }
  return m
}

export function mesh(geo: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  return mesh(new THREE.BoxGeometry(w, h, d), material, x, y + h / 2, z)
}

export function cyl(rt: number, rb: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 8): THREE.Mesh {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y + h / 2, z)
}

export function sphere(r: number, material: THREE.Material, x = 0, y = 0, z = 0, detail = 1): THREE.Mesh {
  return mesh(new THREE.IcosahedronGeometry(r, detail), material, x, y, z)
}

export function cone(r: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, seg = 7): THREE.Mesh {
  return mesh(new THREE.ConeGeometry(r, h, seg), material, x, y + h / 2, z)
}

export function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group()
  for (const c of children) g.add(c)
  return g
}

export function param<T extends string | number | boolean>(ctx: PropContext, key: string, fallback: T): T {
  const v = ctx.params[key]
  return (v === undefined ? fallback : v) as T
}

export function colorOr(ctx: PropContext, fallback: string): string {
  return ctx.color ? '#' + ctx.color.getHexString() : fallback
}
