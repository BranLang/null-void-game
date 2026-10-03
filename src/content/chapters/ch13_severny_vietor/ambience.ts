/** Lighting moods of chapter 13: heavy-hour Kitsune, the hold, the tundra, the Diera, Hel, the depths. */
import type { AmbienceDef } from '../../types'

/** Kitsune in the heavy hour: grey light without shadows, mist crawling through the ruins. */
export const heavyKitsune: AmbienceDef = {
  sky: { top: '#3a3d45', bottom: '#686a6e', stars: 0, clouds: 0.75 },
  fog: { color: '#55585e', near: 3, far: 24 },
  hemi: { sky: '#959ba6', ground: '#3a3832', intensity: 1.0 },
  sun: { color: '#c8c8c2', intensity: 0.5, dir: [-0.2, 1, 0.3], shadows: false },
  exposure: 0.95,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.86 },
  grade: { tint: '#dcdee0', saturation: 0.58, contrast: 1.1, vignette: 0.58, grain: 0.06 },
  particles: [{ kind: 'dust', count: 70, color: '#9a9a96' }],
  music: 'null_void',
  sounds: ['wind', 'drone'],
}

/** The Itaka's hold: dark steel and the violet pulse of the Spira boiler. */
export const hold: AmbienceDef = {
  sky: { top: '#050407', bottom: '#0c0a10', stars: 0 },
  hemi: { sky: '#a89ad0', ground: '#3a3044', intensity: 1.25 },
  sun: { color: '#c8b8ff', intensity: 0.45, dir: [-0.3, 1, 0.5], shadows: false },
  exposure: 1.2,
  bloom: { strength: 1.0, radius: 0.6, threshold: 0.72 },
  grade: { tint: '#e6dcff', saturation: 0.9, contrast: 1.12, vignette: 0.6, grain: 0.05 },
  particles: [{ kind: 'motes', count: 40, color: '#b98aff' }],
  music: null,
  sounds: ['machine', 'hum'],
}

/** The northern plateau at night: snow, a campfire and the aurora. */
export const tundra: AmbienceDef = {
  sky: { top: '#02040b', bottom: '#0e1a2c', stars: 1, aurora: 0.15, infera: { x: 0.12, y: 0.78 } },
  fog: { color: '#0b1220', near: 6, far: 30 },
  hemi: { sky: '#5a78a8', ground: '#1a1c24', intensity: 0.9 },
  sun: { color: '#9fb8ff', intensity: 0.75, dir: [0.4, 1, 0.5] },
  exposure: 1.05,
  bloom: { strength: 0.9, radius: 0.55, threshold: 0.78 },
  grade: { tint: '#dfe8ff', saturation: 0.82, contrast: 1.08, vignette: 0.48 },
  particles: [{ kind: 'snow', count: 420 }],
  music: null,
  sounds: ['wind', 'fire'],
}

/** The rim of the Diera: soot, warm stinking clouds, an orange glow from below. */
export const diera: AmbienceDef = {
  sky: { top: '#2a2420', bottom: '#5a4232', stars: 0, clouds: 0.6 },
  fog: { color: '#3e3028', near: 4, far: 26 },
  hemi: { sky: '#b08a6a', ground: '#2a1a12', intensity: 1.0 },
  sun: { color: '#ffb070', intensity: 0.9, dir: [0.2, 1, 0.35] },
  exposure: 1.0,
  bloom: { strength: 0.85, radius: 0.55, threshold: 0.75 },
  grade: { tint: '#ffe6cc', saturation: 0.78, contrast: 1.12, vignette: 0.55, grain: 0.06 },
  particles: [
    { kind: 'ash', count: 160, color: '#3a3430' },
    { kind: 'embers', count: 50 },
  ],
  music: 'iron_army',
  sounds: ['machine', 'wind'],
}

/** Hel: black andesite, lava under iron grates, light from above and below. */
export const hel: AmbienceDef = {
  sky: { top: '#0a0606', bottom: '#2a120a', stars: 0 },
  fog: { color: '#1c0e0a', near: 6, far: 30 },
  hemi: { sky: '#8a6a58', ground: '#3a1408', intensity: 0.85 },
  sun: { color: '#ffd2a0', intensity: 0.55, dir: [0, 1, 0.15] },
  exposure: 1.05,
  bloom: { strength: 1.0, radius: 0.6, threshold: 0.7 },
  grade: { tint: '#ffe2c8', saturation: 0.85, contrast: 1.14, vignette: 0.52, grain: 0.05 },
  particles: [
    { kind: 'embers', count: 70 },
    { kind: 'ash', count: 90, color: '#2a2220' },
  ],
  music: 'iron_army',
  sounds: ['machine', 'cave'],
}

/** The shaft of the tower: snow falling on black andesite, white northern light. */
export const shaft: AmbienceDef = {
  sky: { top: '#5a6068', bottom: '#9aa2aa', stars: 0, clouds: 0.5 },
  fog: { color: '#4a5058', near: 5, far: 26 },
  hemi: { sky: '#c8d4e8', ground: '#1a1a20', intensity: 1.05 },
  sun: { color: '#e8eef8', intensity: 0.8, dir: [-0.2, 1, 0.4] },
  exposure: 1.0,
  bloom: { strength: 0.8, radius: 0.55, threshold: 0.78 },
  grade: { tint: '#e8eef6', saturation: 0.62, contrast: 1.08, vignette: 0.45 },
  particles: [{ kind: 'snow', count: 300 }],
  music: null,
  sounds: ['wind', 'hum'],
}

/** The depths of Hel: low corridors, blue spirit haze, oil lamps. */
export const depths: AmbienceDef = {
  sky: { top: '#030306', bottom: '#0a0a12', stars: 0 },
  fog: { color: '#0c1220', near: 5, far: 24 },
  hemi: { sky: '#4a5a80', ground: '#140f0c', intensity: 0.6 },
  exposure: 1.1,
  bloom: { strength: 0.95, radius: 0.6, threshold: 0.72 },
  grade: { tint: '#d8e2ff', saturation: 0.78, contrast: 1.12, vignette: 0.6, grain: 0.07 },
  particles: [{ kind: 'steam', count: 40, color: '#5a7ab8' }],
  music: null,
  sounds: ['cave', 'drone'],
}

/** The Itaka's deck in the cold north wind. */
export const deck: AmbienceDef = {
  sky: { top: '#0a0e18', bottom: '#3a4458', stars: 0.7, clouds: 0.8 },
  fog: { color: '#2a3040', near: 8, far: 34 },
  hemi: { sky: '#8a9ab8', ground: '#2a2420', intensity: 1.0 },
  sun: { color: '#c8d4ff', intensity: 0.9, dir: [-0.4, 1, 0.5] },
  exposure: 1.0,
  bloom: { strength: 0.75, radius: 0.55, threshold: 0.8 },
  grade: { tint: '#e2e8f6', saturation: 0.78, contrast: 1.06, vignette: 0.45 },
  particles: [{ kind: 'clouds', count: 26 }],
  music: 'medley',
  sounds: ['wind'],
}

/** The empty bar after everyone has gone: the last lamp, and the dust coming home. */
export const sleep: AmbienceDef = {
  sky: { top: '#010102', bottom: '#050508', stars: 0 },
  fog: { color: '#05060a', near: 3, far: 18 },
  hemi: { sky: '#3a4058', ground: '#08070a', intensity: 0.45 },
  exposure: 1.0,
  bloom: { strength: 0.9, radius: 0.6, threshold: 0.7 },
  grade: { tint: '#cfd4e6', saturation: 0.45, contrast: 1.15, vignette: 0.7, grain: 0.08 },
  particles: [{ kind: 'blackdust', count: 260, at: [4, 4], radius: 4 }],
  music: 'black_dust',
  sounds: ['void'],
}
