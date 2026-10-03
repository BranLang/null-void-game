import * as THREE from 'three'
import type { FloorType, WallType } from '../content/types'
import { floorTexture, wallTexture } from './textures'
import { toonGradient } from './toon'

/**
 * Shared materials. Walls get a small vertex-shader patch that lowers any
 * wall standing between the camera and the player ("cut-away"), so the
 * isometric view never hides the character behind a building.
 */

export const cutaway = {
  player: { value: new THREE.Vector3(0, 0, 0) },
  camDir: { value: new THREE.Vector3(1, 0, 1).normalize() },
  radius: { value: 4.5 },
  enabled: { value: 1 },
}

const FLOOR_PROPS: Partial<Record<FloorType, { rough: number; metal?: number; emissive?: string; ei?: number }>> = {
  ice: { rough: 0.25, metal: 0.1 },
  metal: { rough: 0.5, metal: 0.6 },
  obsidian: { rough: 0.2, metal: 0.3 },
  marble: { rough: 0.45 },
  white: { rough: 0.7 },
  snow: { rough: 0.95 },
  deck: { rough: 0.8 },
  dream: { rough: 1, emissive: '#d8d4ff', ei: 0.15 },
}

const WALL_PROPS: Partial<Record<WallType, { rough: number; metal?: number; transparent?: boolean; opacity?: number; emissive?: string; ei?: number }>> = {
  metal: { rough: 0.5, metal: 0.6 },
  iron: { rough: 0.55, metal: 0.7 },
  rust: { rough: 0.9, metal: 0.3 },
  obsidian: { rough: 0.15, metal: 0.4 },
  ice: { rough: 0.2, transparent: true, opacity: 0.75 },
  glass: { rough: 0.05, metal: 0.2, transparent: true, opacity: 0.35 },
  marble: { rough: 0.45 },
  dream: { rough: 1, emissive: '#e6e2ff', ei: 0.2 },
}

/** Which wall texture to use on the sides of a raised floor block. */
export const FLOOR_SIDE: Partial<Record<FloorType, WallType>> = {
  stone: 'stone',
  cobble: 'stone',
  marble: 'marble',
  white: 'white',
  grass: 'rock',
  moss: 'rock',
  dirt: 'rock',
  mud: 'rock',
  sand: 'rock',
  blacksand: 'obsidian',
  gravel: 'rock',
  snow: 'rock',
  ice: 'ice',
  wood: 'plank',
  deck: 'plank',
  metal: 'iron',
  roof: 'white',
  tile: 'white',
  carpet: 'wood',
  rock: 'rock',
  obsidian: 'obsidian',
  ash: 'rock',
  andesite: 'andesite',
  dream: 'dream',
}

const floorMats = new Map<string, THREE.MeshToonMaterial>()
const wallMats = new Map<string, THREE.MeshToonMaterial>()
const capMats = new Map<string, THREE.MeshToonMaterial>()

export function floorMaterial(type: FloorType): THREE.MeshToonMaterial {
  let m = floorMats.get(type)
  if (!m) {
    const p = FLOOR_PROPS[type] ?? { rough: 0.9 }
    m = new THREE.MeshToonMaterial({
      map: floorTexture(type),
      gradientMap: toonGradient(),
      vertexColors: true,
    })
    if (p.emissive) {
      m.emissive = new THREE.Color(p.emissive)
      m.emissiveIntensity = p.ei ?? 0.2
    }
    floorMats.set(type, m)
  }
  return m
}

/** Material for walls and raised-block sides. `cut` enables the camera cut-away. */
export function wallMaterial(type: WallType, cut: boolean): THREE.MeshToonMaterial {
  const key = `${type}:${cut}`
  let m = wallMats.get(key)
  if (!m) {
    const p = WALL_PROPS[type] ?? { rough: 0.9 }
    m = new THREE.MeshToonMaterial({
      map: wallTexture(type),
      gradientMap: toonGradient(),
      vertexColors: true,
      transparent: !!p.transparent,
      opacity: p.opacity ?? 1,
    })
    if (p.emissive) {
      m.emissive = new THREE.Color(p.emissive)
      m.emissiveIntensity = p.ei ?? 0.2
    }
    if (cut) applyCutaway(m)
    wallMats.set(key, m)
  }
  return m
}

export function capMaterial(type: WallType): THREE.MeshToonMaterial {
  let m = capMats.get(type)
  if (!m) {
    const base = wallMaterial(type, true)
    m = base.clone()
    m.color = new THREE.Color(0.72, 0.72, 0.72)
    applyCutaway(m)
    capMats.set(type, m)
  }
  return m
}

/**
 * Patch a material: vertices carrying the attribute `aBase` (x, y, z of the
 * wall's foot, w = wall height + 2) are pulled down when the wall stands
 * between the camera and the player. Meshes without the attribute read the
 * WebGL default (0,0,0,1) and are left untouched.
 */
export function applyCutaway(m: THREE.Material): void {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uCutPlayer = cutaway.player
    shader.uniforms.uCutDir = cutaway.camDir
    shader.uniforms.uCutRadius = cutaway.radius
    shader.uniforms.uCutOn = cutaway.enabled
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec4 aBase;
        uniform vec3 uCutPlayer;
        uniform vec3 uCutDir;
        uniform float uCutRadius;
        uniform float uCutOn;
        varying float vCut;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vCut = 0.0;
        if (uCutOn > 0.5 && aBase.w > 1.5) {
          vec2 d = aBase.xz - uCutPlayer.xz;
          float along = dot(d, normalize(uCutDir.xz));
          float side = length(d - normalize(uCutDir.xz) * along);
          float inFront = smoothstep(-0.3, 0.6, along);
          float near = 1.0 - smoothstep(uCutRadius * 0.55, uCutRadius, length(d));
          float lateral = 1.0 - smoothstep(1.6, 3.6, side);
          float k = inFront * near * lateral;
          float lowTop = aBase.y + 0.35;
          if (transformed.y > lowTop) transformed.y = mix(transformed.y, lowTop, k);
          vCut = k;
        }`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vCut;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb *= mix(1.0, 0.75, vCut);')
  }
  m.customProgramCacheKey = () => 'cutaway'
}

export const LIQUID_COLORS: Record<'water' | 'deep' | 'canal' | 'lava', { shallow: string; deep: string }> = {
  water: { shallow: '#2f6f86', deep: '#123a52' },
  deep: { shallow: '#1d4f6e', deep: '#081d33' },
  canal: { shallow: '#2a7f8a', deep: '#0f3b48' },
  lava: { shallow: '#ff7a1a', deep: '#a11d05' },
}
