/**
 * Lighting presets for Nyau in chapters 4–6: the white tidal city by day,
 * the aerodock in morning fog, the glowing night gardens, the temple at night,
 * interiors lit by spirit lamps, the vaults under the temple, and the dawn of
 * the new rin.
 */
import type { AmbienceDef } from '../../../types'

/** Hot, humid afternoon in the aerodock: oil, ethanol, flies. */
export const dockDay: AmbienceDef = {
  sky: { top: '#6fa8e0', bottom: '#f6e6c8', stars: 0, clouds: 0.25 },
  fog: { color: '#eadcc2', near: 16, far: 58 },
  hemi: { sky: '#c4d8ff', ground: '#6a5a48', intensity: 1.2 },
  sun: { color: '#ffe6c2', intensity: 2.25, dir: [-0.55, 1, 0.35], shadows: true },
  exposure: 1.02,
  bloom: { strength: 0.55, radius: 0.5, threshold: 0.86 },
  grade: { tint: '#fff6e8', saturation: 1.06, contrast: 1.04, vignette: 0.24 },
  particles: [
    { kind: 'dust', count: 120, color: '#e8d8b0' },
    { kind: 'motes', count: 40, color: '#fff0c0' },
  ],
  music: null,
  sounds: ['crowd', 'sea', 'machine'],
}

/** Morning on the aerodock, the sea fog still lying on the far water. */
export const dockFog: AmbienceDef = {
  sky: { top: '#9aaac4', bottom: '#f0e6d6', stars: 0, clouds: 0.4 },
  fog: { color: '#d6d8dc', near: 6, far: 40 },
  hemi: { sky: '#dce4f4', ground: '#7a6c5c', intensity: 1.55 },
  sun: { color: '#ffe2bc', intensity: 1.9, dir: [0.55, 0.75, 0.3], shadows: true },
  exposure: 1.12,
  bloom: { strength: 0.55, radius: 0.55, threshold: 0.86 },
  grade: { tint: '#f6f4f0', saturation: 0.92, contrast: 1.02, vignette: 0.26 },
  particles: [
    { kind: 'steam', count: 26, color: '#dfe3ea', area: [6, 0, 33, 7] },
    { kind: 'dust', count: 70, color: '#e6dccc' },
  ],
  music: null,
  sounds: ['sea', 'wind', 'crowd'],
}

/** Dusk over the aerodock, lamps lit, the tavern warm. */
export const dockDusk: AmbienceDef = {
  sky: { top: '#262046', bottom: '#e08a5c', stars: 0.25, sai: { x: 0.8, y: 0.74, r: 0.06 } },
  fog: { color: '#3a2c3c', near: 10, far: 42 },
  hemi: { sky: '#8a7ab8', ground: '#2e2224', intensity: 0.85 },
  sun: { color: '#ff9a62', intensity: 0.9, dir: [0.7, 0.35, 0.2], shadows: true },
  exposure: 1.05,
  bloom: { strength: 0.85, radius: 0.55, threshold: 0.78 },
  grade: { tint: '#ffe6d8', saturation: 1.0, contrast: 1.05, vignette: 0.4 },
  particles: [{ kind: 'motes', count: 50, color: '#ffc890' }],
  music: null,
  sounds: ['sea', 'crowd'],
}

/** A Nyau night: crickets, cicadas, glowing trees and fireflies like small blue souls. */
export const gardenNight: AmbienceDef = {
  sky: { top: '#05060f', bottom: '#1d1838', stars: 0.95, sai: { x: 0.78, y: 0.8, r: 0.065 }, infera: { x: 0.16, y: 0.86 } },
  fog: { color: '#0d0b1c', near: 8, far: 34 },
  hemi: { sky: '#6a68b0', ground: '#141022', intensity: 0.9 },
  sun: { color: '#aebcff', intensity: 0.85, dir: [-0.4, 1, 0.5] },
  exposure: 1.08,
  bloom: { strength: 1.05, radius: 0.6, threshold: 0.72 },
  grade: { tint: '#e4deff', saturation: 0.98, contrast: 1.06, vignette: 0.46 },
  particles: [
    { kind: 'fireflies', count: 70, color: '#7fd8ff' },
    { kind: 'spores', count: 50, color: '#c08aff' },
    { kind: 'motes', count: 40, color: '#9fe8ff' },
  ],
  music: 'moss',
  sounds: ['night', 'water'],
}

/** The Temple of El at night: it belongs to silence. Mosaics glow by their own light. */
export const templeNight: AmbienceDef = {
  sky: { top: '#06050f', bottom: '#1a1236', stars: 0.9, sai: { x: 0.82, y: 0.78, r: 0.06 }, infera: { x: 0.2, y: 0.9 } },
  fog: { color: '#0c0918', near: 8, far: 32 },
  hemi: { sky: '#5c4c96', ground: '#120e1e', intensity: 0.8 },
  sun: { color: '#a8b0ff', intensity: 0.7, dir: [-0.45, 1, 0.55] },
  exposure: 1.1,
  bloom: { strength: 1.1, radius: 0.6, threshold: 0.7 },
  grade: { tint: '#e2dcff', saturation: 0.95, contrast: 1.07, vignette: 0.5 },
  particles: [
    { kind: 'motes', count: 60, color: '#b8a0ff' },
    { kind: 'fireflies', count: 24, color: '#8fe0ff' },
  ],
  music: 'temple',
  sounds: ['night', 'water'],
}

/** The temple by day: white stone, incense, cool shade under the colonnade. */
export const templeDay: AmbienceDef = {
  sky: { top: '#7ab4ea', bottom: '#f8eee0', stars: 0 },
  fog: { color: '#e8e2f0', near: 18, far: 60 },
  hemi: { sky: '#d0dcff', ground: '#7a6a5a', intensity: 1.25 },
  sun: { color: '#fff0d8', intensity: 2.0, dir: [-0.5, 1, 0.4], shadows: true },
  exposure: 1.0,
  bloom: { strength: 0.55, radius: 0.5, threshold: 0.86 },
  grade: { tint: '#fbf6ff', saturation: 1.0, contrast: 1.04, vignette: 0.26 },
  particles: [{ kind: 'motes', count: 50, color: '#fff2d8' }],
  music: 'temple',
  sounds: ['wind'],
}

/** Soril's study: stone walls, one table, two chairs, a window where light only blinks. */
export const studyDay: AmbienceDef = {
  sky: { top: '#2a2630', bottom: '#4a4450', stars: 0 },
  fog: { color: '#1a1820', near: 10, far: 34 },
  hemi: { sky: '#d6ccbe', ground: '#3a3230', intensity: 0.8 },
  sun: { color: '#fff0d8', intensity: 1.1, dir: [-0.3, 1, -0.6], shadows: true },
  exposure: 1.0,
  bloom: { strength: 0.6, radius: 0.5, threshold: 0.82 },
  grade: { tint: '#f6f0e8', saturation: 0.9, contrast: 1.06, vignette: 0.42 },
  particles: [{ kind: 'dust', count: 70, color: '#e8dcc8' }],
  music: null,
  sounds: ['wind'],
}

/** The vaults beneath the temple: old parchment and wax, cold and damp; violet in the dark. */
export const vault: AmbienceDef = {
  sky: { top: '#030206', bottom: '#0a0812', stars: 0 },
  fog: { color: '#07050c', near: 5, far: 24 },
  hemi: { sky: '#3c3060', ground: '#08060c', intensity: 0.5 },
  exposure: 1.12,
  bloom: { strength: 1.15, radius: 0.6, threshold: 0.66 },
  grade: { tint: '#e6dcff', saturation: 0.92, contrast: 1.1, vignette: 0.56 },
  particles: [
    { kind: 'dust', count: 90, color: '#c8b8e8' },
    { kind: 'motes', count: 30, color: '#b07aff' },
  ],
  music: 'null_void',
  sounds: ['cave', 'hum'],
}

/** Inside the Saéli villa at night: stone corridors breathing incense, spirit lamps turned low. */
export const villaNight: AmbienceDef = {
  sky: { top: '#05050c', bottom: '#181630', stars: 0.9, sai: { x: 0.8, y: 0.82, r: 0.06 }, infera: { x: 0.2, y: 0.88 } },
  fog: { color: '#0c0a16', near: 8, far: 32 },
  hemi: { sky: '#62609e', ground: '#16121e', intensity: 0.85 },
  sun: { color: '#aab8ff', intensity: 0.75, dir: [-0.4, 1, 0.5] },
  exposure: 1.06,
  bloom: { strength: 0.95, radius: 0.55, threshold: 0.74 },
  grade: { tint: '#e2deff', saturation: 0.92, contrast: 1.06, vignette: 0.48 },
  particles: [
    { kind: 'fireflies', count: 30, color: '#9fe0ff' },
    { kind: 'motes', count: 30, color: '#c8b8ff' },
  ],
  music: null,
  sounds: ['night'],
}

/** First light over Nyau: the violet glow of the trees fading, grey turning warm white. */
export const villaDawn: AmbienceDef = {
  sky: { top: '#5a6aa8', bottom: '#f6c8b0', stars: 0.15, sai: { x: 0.7, y: 0.7, r: 0.07 } },
  fog: { color: '#d8cad6', near: 12, far: 46 },
  hemi: { sky: '#c0c8f0', ground: '#5a4a50', intensity: 1.1 },
  sun: { color: '#ffd8bc', intensity: 1.5, dir: [0.7, 0.45, 0.3], shadows: true },
  exposure: 1.02,
  bloom: { strength: 0.7, radius: 0.55, threshold: 0.8 },
  grade: { tint: '#fff0ec', saturation: 0.98, contrast: 1.04, vignette: 0.32 },
  particles: [{ kind: 'motes', count: 50, color: '#ffe0d0' }],
  music: null,
  sounds: ['night', 'water'],
}

/** The aerodock at the dawn of the new rin: a pale pink stripe in the east, a clear sky, the light hour. */
export const dockDawn: AmbienceDef = {
  sky: { top: '#4a5aa0', bottom: '#f8c4a6', stars: 0.1, sai: { x: 0.62, y: 0.86, r: 0.09 }, clouds: 0.2 },
  fog: { color: '#d6c6d0', near: 10, far: 44 },
  hemi: { sky: '#c4c8f0', ground: '#5a4a48', intensity: 1.1 },
  sun: { color: '#ffd2b4', intensity: 1.45, dir: [0.7, 0.42, 0.25], shadows: true },
  exposure: 1.03,
  bloom: { strength: 0.75, radius: 0.55, threshold: 0.8 },
  grade: { tint: '#fff0ee', saturation: 1.0, contrast: 1.05, vignette: 0.34 },
  particles: [
    { kind: 'lanterns', count: 18, color: '#ffb066' },
    { kind: 'steam', count: 40, color: '#f0eef4', area: [6, 0, 33, 8] },
  ],
  music: null,
  sounds: ['crowd', 'sea'],
}
