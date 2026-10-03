/**
 * Shared content for chapters 16–18 (the siege of the Metaru, the voice, the
 * Gōstar): extra cast (the people of Kitsune in the hull), ambience presets
 * and the maps that the three chapters reuse: the hangar of the Metaru,
 * Felix's workshop and the streets on the slope down to the square.
 */
import type { AmbienceDef, MapDef, PlacedProp } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { CAST, crowdLook, type CastMember } from '../../characters'
import type { CharacterLook } from '../../../engine/characters/look'
import { l } from '../../../i18n/i18n'
import './props'

// =========================================================================== cast
const yeraBase = CAST.yera.look as CharacterLook

/** Yera in the Metaru: grandmother's coat and, on her left hand, the ancient glove from Felix. */
CAST['c16_yera'] = {
  ...CAST.yera,
  look: { ...yeraBase, accessories: ['chronograph', 'pendant', 'glove'] },
}

const fox = (o: Partial<CharacterLook> & { outfit: CharacterLook['outfit'] }): CharacterLook => ({
  species: 'fox',
  caste: 'pursang',
  skin: '#e8cdb6',
  fur: '#c9632a',
  furTip: '#f4ede4',
  eyes: '#7a5a2a',
  hair: { style: 'short', color: '#b8581e' },
  ...o,
})

const people: Record<string, CastMember> = {
  c16_brewer: {
    name: l('Sládok', 'The brewer'),
    look: fox({ caste: 'mezra', build: 'broad', face: 'male', fur: '#b0581e', hair: { style: 'cropped', color: '#8a4a20' }, outfit: { type: 'apron', primary: '#6a5034', trim: '#c8b090', pants: '#3a3026', belts: 1 } }),
  },
  c16_mother: {
    name: l('Rodička', 'The young mother'),
    look: fox({ build: 'slim', face: 'female', hair: { style: 'long', color: '#a8501c' }, outfit: { type: 'dress', primary: '#7a6a5a', secondary: '#5a4a3e' } }),
  },
  c16_greywoman: {
    name: l('Šedivá žena', 'The grey woman'),
    look: fox({ build: 'old', face: 'old', fur: '#a8a29a', hair: { style: 'bun', color: '#c8c2ba' }, outfit: { type: 'robe', primary: '#4e4a46', secondary: '#3a3632' } }),
  },
  c16_elder: {
    name: l('Najstarší z radu', 'The eldest in the queue'),
    look: fox({ build: 'old', face: 'old', fur: '#9a948c', hair: { style: 'short', color: '#d8d2ca' }, outfit: { type: 'coat', primary: '#4a4036', pants: '#2e2a26' }, accessories: ['cane'] }),
  },
  c16_womanbaby: {
    name: l('Žena s dieťaťom', 'The woman with the baby'),
    look: fox({ build: 'slim', face: 'female', fur: '#d07a3a', hair: { style: 'braid', color: '#b0601e' }, outfit: { type: 'coat', primary: '#5a5048', pants: '#3a3430' } }),
  },
  c16_burned: {
    name: l('Muž s popálenými rukami', 'The man with burned hands'),
    look: fox({ caste: 'mezra', face: 'male', fur: '#b86a30', hair: { style: 'wild', color: '#8a4a20' }, outfit: { type: 'vest', primary: '#5a4a3a', secondary: '#a89a80', pants: '#3a3228', sleeves: 'short', bandage: true } }),
  },
  c16_rib: {
    name: l('Chlapec so zlomeným rebrom', 'The boy with a broken rib'),
    look: fox({ build: 'small', face: 'child', hair: { style: 'wild', color: '#c86a2a' }, outfit: { type: 'tunic', primary: '#6a7a5a', pants: '#3a3a2e' } }),
  },
}
for (let i = 0; i < 3; i++) {
  people[`c16_young${i}`] = {
    name: l('Mladý lišiak', 'A young fox'),
    look: { ...crowdLook('kitsune', 160 + i * 7), species: 'fox', build: 'average', accessories: i === 0 ? ['carbine'] : [] },
  }
}
for (let i = 0; i < 4; i++) {
  people[`c16_child${i}`] = {
    name: l('Dieťa', 'A child'),
    look: fox({ build: 'child', face: 'child', fur: ['#d87a3a', '#c9632a', '#a8a29a', '#b0581e'][i], hair: { style: i % 2 ? 'ponytail' : 'wild', color: '#b0601e' }, outfit: { type: 'tunic', primary: ['#7a6a52', '#5a6a7a', '#8a5a4a', '#6a7a5a'][i], pants: '#3a3428' } }),
  }
}
for (let i = 0; i < 14; i++) {
  people[`c16_ref${i}`] = {
    name: l('Utečenec z Kitsune', 'A refugee from Kitsune'),
    look: crowdLook(i % 3 === 0 ? 'refugee' : 'kitsune', 40 + i * 13),
  }
}
Object.assign(CAST, people)

// =========================================================================== ambience
/** The hangar at dawn: grey light from the ventilation shafts, green from the plants, yellow from the oil lamps. */
export const HALL_DAWN: AmbienceDef = {
  sky: { top: '#07090a', bottom: '#101614', stars: 0 },
  fog: { color: '#0c1210', near: 12, far: 40 },
  hemi: { sky: '#8fb4a6', ground: '#2a2420', intensity: 0.78 },
  exposure: 1.06,
  bloom: { strength: 0.95, radius: 0.6, threshold: 0.76 },
  grade: { tint: '#e6efe6', saturation: 0.9, contrast: 1.06, vignette: 0.5 },
  particles: [
    { kind: 'dust', count: 110, color: '#c8d8c4' },
    { kind: 'spores', count: 46, color: '#8dffc4', id: 'spores' },
  ],
  music: 'dungeon_water',
  sounds: ['crowd', 'hum', 'water'],
}

/** Light hour: children play in the green light; the hull breathes easier. */
export const HALL_LIGHT: AmbienceDef = {
  ...HALL_DAWN,
  hemi: { sky: '#a6d8be', ground: '#3a3228', intensity: 0.98 },
  grade: { tint: '#eef6ea', saturation: 1, contrast: 1.04, vignette: 0.42 },
}

/** Heavy hour: air like a hand pressing everything down. The pigeons fall silent. */
export const HALL_HEAVY: AmbienceDef = {
  sky: { top: '#040506', bottom: '#0a0c0c', stars: 0 },
  fog: { color: '#070908', near: 8, far: 30 },
  hemi: { sky: '#4f6a62', ground: '#18140f', intensity: 0.5 },
  exposure: 0.98,
  bloom: { strength: 1.05, radius: 0.6, threshold: 0.7 },
  grade: { tint: '#dfe6df', saturation: 0.78, contrast: 1.08, vignette: 0.62 },
  particles: [{ kind: 'dust', count: 80, color: '#a8b8a8' }],
  music: 'dungeon_water',
  sounds: ['hum', 'water'],
}

/** Evening at the last barrel. Yeast breaks through the oil and the fear. */
export const HALL_EVENING: AmbienceDef = {
  ...HALL_DAWN,
  hemi: { sky: '#86a69a', ground: '#3a2a1e', intensity: 0.68 },
  grade: { tint: '#f4e8d8', saturation: 0.96, contrast: 1.06, vignette: 0.52 },
  sounds: ['crowd', 'hum'],
}

/** Felix's workshop: oil, hot pitch and beer malt, one yellow lamp. */
export const WORKSHOP_AMB: AmbienceDef = {
  sky: { top: '#060504', bottom: '#0e0b08', stars: 0 },
  fog: { color: '#0d0a07', near: 10, far: 30 },
  hemi: { sky: '#b09878', ground: '#2a1e14', intensity: 0.62 },
  exposure: 1.05,
  bloom: { strength: 0.9, radius: 0.55, threshold: 0.75 },
  grade: { tint: '#f6e8d4', saturation: 0.92, contrast: 1.07, vignette: 0.55 },
  particles: [{ kind: 'dust', count: 70, color: '#e8d4b0' }],
  music: 'dungeon_water',
  sounds: ['hum', 'machine'],
}

/** Kitsune in the rain at night: shutters gone blind, hearths cold. */
export const TOWN_RAIN: AmbienceDef = {
  sky: { top: '#04060a', bottom: '#111722', stars: 0, clouds: 0.8 },
  fog: { color: '#0a0f17', near: 9, far: 32 },
  hemi: { sky: '#4e5e7c', ground: '#14161c', intensity: 0.9 },
  sun: { color: '#8ea2cc', intensity: 0.7, dir: [-0.4, 1, 0.5] },
  exposure: 1.02,
  bloom: { strength: 0.85, threshold: 0.8 },
  grade: { tint: '#d8e2f2', saturation: 0.66, contrast: 1.1, vignette: 0.56 },
  particles: [{ kind: 'rain', count: 950, id: 'rain' }],
  music: 'black_dust',
  sounds: ['rain', 'wind'],
}

/** A grey rainy morning over the dead streets. */
export const TOWN_GREY: AmbienceDef = {
  sky: { top: '#3a4048', bottom: '#626a74', stars: 0, clouds: 0.9 },
  fog: { color: '#4a525c', near: 7, far: 30 },
  hemi: { sky: '#9aa6b8', ground: '#2a2a2e', intensity: 1.0 },
  sun: { color: '#c8ccd4', intensity: 0.55, dir: [-0.3, 1, 0.6] },
  exposure: 1.0,
  bloom: { strength: 0.55, threshold: 0.86 },
  grade: { tint: '#e2e6ea', saturation: 0.5, contrast: 1.08, vignette: 0.5 },
  particles: [{ kind: 'rain', count: 700, id: 'rain' }],
  music: 'null_void',
  sounds: ['rain', 'wind'],
}

// =========================================================================== maps
/** The hangar of the Metaru: the hull on the top and left, the gate on the left, Felix's door at the top right. */
export const HALL_MAP: MapDef = {
  rows: [
    '#HHHHHHHHHHHHHHHHHHHHHHHHHHDHHHH',
    'Lwwwwwwwwpwwwwwwwwp....p.._d_.p.',
    'Lwwwwwwww.wwwwwwww........___...',
    'Lwwwwwwww........wwwwww...___...',
    'Lwww.............wwwwww...___...',
    'Lwww..,,,,,,,.............___...',
    'Lwww..,,,,,,,.............___...',
    'Lwww..,,,,,,,.............___...',
    'Lp........................___...',
    'Gg_____________________________.',
    'L______________________________.',
    'Lp..............................',
    'Lwww.....wwwwww.................',
    'Lwww.....wwwwww.................',
    'Lwww.....wwwwww.................',
    'L..............,,,,,,,..........',
    'Lp.............,,,,,,,..........',
    'L..............,,,,,,,..........',
    'L..............,,,,,,,..........',
    'L..............,,,,,,,..........',
    'L...............................',
    'L...............................',
  ],
  legend: {
    '#': { floor: 'metal', wall: 'metal', wallH: 4.2 },
    H: { floor: 'metal', walk: false, prop: { type: 'metaru_wall', params: { h: 4.5 } } },
    L: { floor: 'metal', walk: false, prop: { type: 'metaru_wall', rot: 90, params: { h: 4.5 } } },
    G: { floor: 'metal', walk: false, tag: 'gate' },
    D: { floor: 'metal', walk: false, tag: 'workdoor' },
    g: { floor: 'metal', tint: '#7a8088', tag: 'gate_in' },
    d: { floor: 'metal', tint: '#7a8088', tag: 'work_in' },
    '.': { floor: 'metal', tint: '#9aa0a8' },
    ',': { floor: 'metal', tint: '#747a82' },
    _: { floor: 'tile', tint: '#6e747c' },
    w: { floor: 'wood', tint: '#8a7258' },
    p: { floor: 'moss', tint: '#5a8a6a', prop: { type: 'mushroom', color: '#6dffb8', scale: 1.2 } },
  },
}

/** Felix's workshop, deep in the belly of the ship. Open towards the hangar at the front edge. */
export const WORKSHOP_MAP: MapDef = {
  rows: [
    '#HHHHHHHHHHHHHH',
    'L,,,,...,,,,,,.',
    'L,,,,...,,,,,,.',
    'L,,,,..........',
    'L...wwwww......',
    'L...wwwww......',
    'L...wwwww......',
    'L...wwwww......',
    'L..............',
    'L..............',
    'L..............',
    'Leeee..........',
  ],
  legend: {
    '#': { floor: 'metal', wall: 'metal', wallH: 3.6 },
    H: { floor: 'metal', walk: false, prop: { type: 'metaru_wall', params: { h: 3.5, vines: false } } },
    L: { floor: 'metal', walk: false, prop: { type: 'metaru_wall', rot: 90, params: { h: 3.5, vines: false } } },
    '.': { floor: 'metal', tint: '#8a8680' },
    ',': { floor: 'metal', tint: '#5e5a54' },
    w: { floor: 'wood', tint: '#7a5e44' },
    e: { floor: 'metal', tint: '#8a8680', tag: 'out' },
  },
}

/** The slope of Kitsune: the Metaru at the top left, streets down to the square with the well. */
export const TOWN_MAP: MapDef = {
  rows: [
    'MMMMMMMMMMMMMMMMffffffffffffff',
    'MMMMMMMMMMMMMMMMffffffffffffff',
    'PPPPPPPGPPPPPPPPffffffffffffff',
    'mmmmmmmmmmmmmmmmffYfffffffffff',
    'ffffff444ffffffffffffffffffYff',
    'fAAAAf444fAAAAffffffffffffffff',
    'fAAAAf444fAAAAffffffffffffffff',
    'fAAAAf444fAAAAffffffffffffffff',
    'ffffff444fAAAAfffnnnnnqqnnnnnf',
    'gBBBBg333gBBBBggggggggggUggggg',
    'gBBBBg333gBBBBggggUggggggggggg',
    'gBBBBg33333333333ggggggggUgggg',
    'gBBBBg33333333333gggUggggggggg',
    'gBBBBg333gBBBBg33ggggggggggggg',
    'hCCCCh222CCCCCh22hCCCCChhhhhhh',
    'hCCCCh222CCCCCh22hCCCCChhhhVhh',
    'hCCCCh222CCCCCh22hCCCCChhhhhhh',
    'hCCCCh222CCCCCh22hCCCCChhhhhhh',
    'hCCCCh222CCCCCh22hhhhhhEEEEEhh',
    'kkkkkk11111111111111111EEEEEkk',
    'kkkkkk11111111111111111EEEEEkk',
    'kkkkkk11111111111111111kkkkkkk',
    'kDDDDDkkkkkkkkkkkSSSSSSSSSSSSk',
    'kDDDDDkkkDDDDDDDkSSSSSSSSSSSSk',
    'kDDDDDkkkDDDDDDDkSSSSSSSSSSSSk',
    'kDDDDDkkkDDDDDDDkSSSSSSSSSSSSk',
    'kDDDDDkkkDDDDDDDkSSSSSWSSSSSSk',
    'kDDDDDkkkkkkkkkkkSSSSSSSSSSSSx',
    'kkkkkkkkkDDDDDDkkSSSSSSSSSSSSx',
    'kkkTkkkkkDDDDDDkkSSSSSSSSSSSSx',
    'kkkkkkTkkDDDDDDkkSSSSSSSSSSSSk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  ],
  legend: {
    M: { floor: 'metal', h: 4, wall: 'metal', wallH: 4.6 },
    P: { floor: 'metal', h: 4, walk: false, prop: { type: 'metaru_wall', params: { h: 3.4, glow: false } } },
    G: { floor: 'metal', h: 4, walk: false, tag: 'gate' },
    m: { floor: 'metal', h: 4, tint: '#6a7078', tag: 'apron' },
    f: { floor: 'grass', h: 4, tint: '#5e7258' },
    g: { floor: 'grass', h: 3, tint: '#5a6e56' },
    h: { floor: 'grass', h: 2, tint: '#566a52' },
    k: { floor: 'grass', h: 1, tint: '#526650' },
    q: { floor: 'cobble', h: 4, stairs: true, tint: '#7a7a74' },
    n: { floor: 'grass', h: 4, tint: '#5e7258', prop: { type: 'fence' } },
    '4': { floor: 'cobble', h: 4, stairs: true, tint: '#8a8a84' },
    '3': { floor: 'cobble', h: 3, stairs: true, tint: '#86867f' },
    '2': { floor: 'cobble', h: 2, stairs: true, tint: '#82827b' },
    '1': { floor: 'cobble', h: 1, stairs: true, tint: '#7e7e77' },
    S: { floor: 'stone', h: 1, tint: '#8a8a86' },
    W: { floor: 'stone', h: 1, tag: 'well', prop: { type: 'well' } },
    x: { floor: 'stone', h: 1, tint: '#8a8a86', tag: 'townexit' },
    A: { floor: 'stone', h: 4, wall: 'plank', wallH: 2.5 },
    B: { floor: 'stone', h: 3, wall: 'white', wallH: 2.6 },
    C: { floor: 'stone', h: 2, wall: 'plank', wallH: 2.4 },
    D: { floor: 'stone', h: 1, wall: 'white', wallH: 2.5 },
    E: { floor: 'stone', h: 2, wall: 'brick', wallH: 2.6 },
    T: { floor: 'grass', h: 1, tint: '#526650', prop: { type: 'tree' } },
    V: { floor: 'grass', h: 2, tint: '#566a52', prop: { type: 'tree' } },
    U: { floor: 'grass', h: 3, tint: '#5a6e56', prop: { type: 'tree' } },
    Y: { floor: 'grass', h: 4, tint: '#5e7258', prop: { type: 'tree' } },
  },
}

/** Doors, windows and the clutter of an abandoned town (shared by the town scenes of ch16–18). */
export const TOWN_PROPS: PlacedProp[] = [
  // the gate into the hull
  { type: 'door', at: [7, 2], params: { style: 'iron' }, id: 'gate_door' },
  { type: 'pipe', at: [3, 2], params: { vertical: true } },
  { type: 'pipe', at: [12, 2], params: { vertical: true } },
  { type: 'lantern', at: [5, 3], params: { style: 'ground' } },
  { type: 'lantern', at: [9, 3], params: { style: 'ground' } },
  // houses: doors (offset onto the wall face) and blind windows (wall-mounted) facing the streets
  { type: 'door', at: [5, 6], rot: 90, offset: [-0.42, 0] },
  { type: 'window', at: [5, 5], rot: 90, params: { lit: false, shutters: true } },
  { type: 'door', at: [9, 6], rot: -90, offset: [0.42, 0] },
  { type: 'window', at: [9, 7], rot: -90, params: { lit: false, shutters: true } },
  { type: 'door', at: [5, 11], rot: 90, offset: [-0.42, 0] },
  { type: 'window', at: [5, 9], rot: 90, params: { lit: false } },
  { type: 'door', at: [12, 11], offset: [0, -0.42] },
  { type: 'door', at: [5, 16], rot: 90, offset: [-0.42, 0] },
  { type: 'window', at: [14, 16], rot: 90, params: { lit: false, shutters: true } },
  { type: 'door', at: [20, 18], offset: [0, -0.42] },
  { type: 'awning', at: [25, 21], params: { w: 3 } },
  { type: 'sign', at: [22, 21] },
  { type: 'door', at: [3, 21], rot: 180, offset: [0, 0.42] },
  { type: 'door', at: [12, 22], rot: 180, offset: [0, 0.42] },
  { type: 'window', at: [10, 22], rot: 180, params: { lit: false, shutters: true } },
  // clothes on the thresholds: shirts buttoned to the neck, two shoes apart
  { type: 'clothes_pile', at: [5, 7], color: '#5a6a7a' },
  { type: 'clothes_pile', at: [9, 11], color: '#7a5a4a' },
  { type: 'clothes_pile', at: [14, 12], color: '#4a5a4a' },
  { type: 'clothes_pile', at: [3, 20], color: '#6a5a6a' },
  { type: 'clothes_pile', at: [16, 20], color: '#5a4a3a' },
  { type: 'clothes_pile', at: [12, 21], color: '#7a6a52' },
  // street clutter
  { type: 'barrel', at: [14, 21] },
  { type: 'crate', at: [15, 21] },
  { type: 'cart', at: [10, 20], rot: 90 },
  { type: 'bench', at: [19, 23] },
  { type: 'bench', at: [25, 28], rot: 90 },
  { type: 'lamppost', at: [18, 22], params: { style: 'iron' } },
  { type: 'lamppost', at: [27, 23], params: { style: 'iron' } },
  { type: 'stall', at: [26, 25] },
  { type: 'basket', at: [24, 24] },
  { type: 'bush', at: [17, 29] },
  { type: 'bush', at: [28, 22] },
  { type: 'rock', at: [16, 9], params: { moss: true } },
  { type: 'flowers', at: [21, 11] },
  { type: 'grass', at: [16, 10] },
  { type: 'grass', at: [20, 26] },
]

// =========================================================================== helpers
/** Spawn a list of extra actors that exist only from a certain story moment on. */
export function showAll(g: GameAPI, ids: string[], on: boolean): void {
  for (const id of ids) g.show(id, on)
}

/** Epilogue flags with defaults (earlier chapters are written independently). */
export function story(g: GameAPI): {
  faith: 'kept' | 'broken'
  toldArkot: boolean
  toldTami: boolean
  taughtArkot: boolean
  forgave: boolean
  arkot: number
  tami: number
  flint: number
  felix: number
  saburo: number
  goji: number
} {
  return {
    faith: g.flag('ch16.faith') === 'kept' ? 'kept' : 'broken',
    toldArkot: g.flag('ch05.toldArkot') === true,
    toldTami: g.flag('ch09.toldTami') === true,
    taughtArkot: g.flag('ch08.taughtArkot') !== false,
    forgave: g.flag('ch12.forgaveArkot') !== false,
    arkot: g.relation('arkot'),
    tami: g.relation('tami'),
    flint: g.relation('flint'),
    felix: g.relation('felix'),
    saburo: g.relation('saburo'),
    goji: g.relation('goji'),
  }
}
