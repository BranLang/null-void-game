import * as THREE from 'three'

/**
 * Cel shading. Every lit surface uses MeshToonMaterial with a shared
 * banded gradient (shadow / mid / light). Characters additionally get an
 * anime-style rim light. Objects that must not receive ink outlines
 * (glows, particles, water, face decals) live on layer FX_LAYER.
 */
export const FX_LAYER = 1

let gradient: THREE.DataTexture | null = null

export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient
  // five texels: deep shadow, shadow, mid, light, light
  const tones = [118, 118, 196, 255, 255]
  const data = new Uint8Array(tones.length * 4)
  tones.forEach((v, i) => {
    data[i * 4] = v
    data[i * 4 + 1] = v
    data[i * 4 + 2] = v
    data[i * 4 + 3] = 255
  })
  gradient = new THREE.DataTexture(data, tones.length, 1, THREE.RGBAFormat)
  gradient.minFilter = THREE.NearestFilter
  gradient.magFilter = THREE.NearestFilter
  gradient.generateMipmaps = false
  gradient.needsUpdate = true
  return gradient
}

/** Global rim-light settings, updated by the scene ambience. */
export const rim = {
  color: { value: new THREE.Color('#9fc8ff') },
  strength: { value: 0.55 },
}

export interface ToonOpts {
  flat?: boolean
  emissive?: string
  ei?: number
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
  map?: THREE.Texture | null
  vertexColors?: boolean
  rim?: boolean
}

export function toon(color: string | THREE.Color, o: ToonOpts = {}): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient(),
    transparent: o.transparent ?? (o.opacity !== undefined && o.opacity < 1),
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
    map: o.map ?? null,
    vertexColors: o.vertexColors ?? false,
  })
  // MeshToonMaterial has no flatShading toggle in its typings for all versions; set via property bag
  ;(m as THREE.Material & { flatShading?: boolean }).flatShading = o.flat ?? false
  if (o.emissive) {
    m.emissive = new THREE.Color(o.emissive)
    m.emissiveIntensity = o.ei ?? 1
  }
  if (o.rim) applyRim(m)
  return m
}

/** Add an anime rim light to a toon material (characters). */
export function applyRim(m: THREE.MeshToonMaterial): void {
  const prev = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    prev?.call(m, shader, renderer)
    shader.uniforms.uRimColor = rim.color
    shader.uniforms.uRimStrength = rim.strength
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace(
        '#include <opaque_fragment>',
        `float rimF = 1.0 - clamp(normal.z, 0.0, 1.0);
        outgoingLight += uRimColor * smoothstep(0.55, 0.92, rimF) * uRimStrength * diffuseColor.rgb;
        #include <opaque_fragment>`,
      )
  }
  m.customProgramCacheKey = () => 'toon-rim'
}

/** Put an object (and its children) on the FX layer: no outlines, still rendered. */
export function markFx(obj: THREE.Object3D): void {
  obj.traverse((o) => o.layers.set(FX_LAYER))
}
