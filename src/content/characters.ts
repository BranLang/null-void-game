/**
 * The cast of Null Void: Eltária. Looks follow the novel (and the anime key
 * art): Yera, a Pursang cat with black hair and blue eyes; Tami, a fox with
 * copper hair and human blue eyes; Arkot, a leopard Mezra; Flint, a lynx with
 * a torn ear, and so on.
 */
import type { CharacterLook } from '../engine/characters/look'
import { l, type L } from '../i18n/i18n'

export interface QuadLook {
  quadruped: true
  color: string
  eyes?: string
  scale?: number
  kind?: 'wolf' | 'pterosaur'
}

export interface CastMember {
  name: L
  look: CharacterLook | QuadLook
  /** painted portrait in public/assets/portraits (optional) */
  portrait?: string
  /** colour of the speaker name in dialogue */
  color?: string
  /** prízrak / dust creature rendered by the effects system instead of a body */
  special?: 'phantom' | 'samael' | 'dust'
}

const AQUA = '#5ff2e0'
const VIOLET = '#b77dff'

export const CAST: Record<string, CastMember> = {
  // ------------------------------------------------------------------ Yera
  yera_temple: {
    name: l('Yera', 'Yera'),
    portrait: 'yera',
    color: '#8fd8ff',
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'slim',
      skin: '#f3dcc8',
      hair: { style: 'long', color: '#17141d' },
      hairShine: '#7a5ab0',
      fur: '#1d1a22',
      eyes: '#3d7fe0',
      outfit: { type: 'robe', primary: '#ece6f4', secondary: '#c9bedb', trim: '#7d4fc0' },
      glyph: AQUA,
      tattoo: 'forearms',
    },
  },
  yera_festival: {
    name: l('Yera', 'Yera'),
    portrait: 'yera',
    color: '#8fd8ff',
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'slim',
      skin: '#f3dcc8',
      hair: { style: 'long', color: '#17141d' },
      hairShine: '#7a5ab0',
      fur: '#1d1a22',
      eyes: '#3d7fe0',
      outfit: { type: 'silk', primary: '#5d2a8a', secondary: '#3d1a60', trim: '#d9b45a', boots: 'none' },
      accessories: ['mask_cat'],
      glyph: AQUA,
      tattoo: 'forearms',
    },
  },
  yera: {
    name: l('Yera', 'Yera'),
    portrait: 'yera',
    color: '#8fd8ff',
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'slim',
      skin: '#f3dcc8',
      hair: { style: 'bob', color: '#17141d' },
      hairShine: '#7a5ab0',
      fur: '#1d1a22',
      eyes: '#3d7fe0',
      outfit: {
        type: 'coat',
        primary: '#5a3b28',
        secondary: '#3a2a22',
        trim: '#c8a060',
        furCollar: '#d9c9ad',
        emblem: true,
        pants: '#25242b',
        corset: '#3c2a21',
        belts: 2,
        gloves: '#2a221d',
        boots: 'tall',
      },
      accessories: ['chronograph', 'pendant'],
      glyph: AQUA,
      tattoo: 'forearms',
    },
  },
  // ------------------------------------------------------------------ Arkot & Flint
  arkot: {
    name: l('Arkot', 'Arkot'),
    color: '#e6c27a',
    look: {
      species: 'leopard',
      caste: 'mezra',
      build: 'broad',
      height: 1.08,
      face: 'male',
      skin: '#a8774f',
      furPattern: 'spots',
      fur: '#c99a58',
      furTip: '#ead6b0',
      hair: { style: 'short', color: '#2a1c13' },
      eyes: '#a8c04a',
      outfit: { type: 'vest', primary: '#6b5a44', secondary: '#d4c4a4', pants: '#4a3b2c', belts: 1, sleeves: 'short' },
      glyph: '#e0a050',
      tattoo: 'none',
    },
  },
  arkot_glyph: {
    name: l('Arkot', 'Arkot'),
    color: '#e6c27a',
    look: {
      species: 'leopard',
      caste: 'mezra',
      build: 'broad',
      height: 1.08,
      face: 'male',
      skin: '#a8774f',
      furPattern: 'spots',
      fur: '#c99a58',
      furTip: '#ead6b0',
      hair: { style: 'short', color: '#2a1c13' },
      eyes: '#a8c04a',
      outfit: { type: 'jacket', primary: '#4e4034', secondary: '#d4c4a4', pants: '#3d3226', belts: 1, gloves: '#2e241c' },
      glyph: '#e0a050',
      tattoo: 'forearms',
    },
  },
  flint: {
    name: l('Flint', 'Flint'),
    color: '#f0a060',
    look: {
      species: 'lynx',
      caste: 'mezra',
      build: 'average',
      face: 'male',
      skin: '#d9b48c',
      fur: '#b98a5c',
      furTip: '#efe0c8',
      ear: 'torn',
      hair: { style: 'wild', color: '#7a4a2a' },
      eyes: '#d8a628',
      outfit: { type: 'jacket', primary: '#34485e', secondary: '#c9b99a', pants: '#2c2a2a', belts: 1 },
      accessories: ['revolver', 'scarf'],
      mark: 'freckles',
    },
  },
  // ------------------------------------------------------------------ Temple of El
  soril: {
    name: l('Soril', 'Soril'),
    color: '#c9b6ff',
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'small',
      height: 0.92,
      face: 'old',
      skin: '#e8d2c0',
      hair: { style: 'bun', color: '#5a5462' },
      fur: '#4a4452',
      eyes: '#7a6aa8',
      outfit: { type: 'robe', primary: '#2a1d3d', secondary: '#1c142a', trim: '#c9c6dc', hood: true },
      accessories: ['pendant'],
      glyph: VIOLET,
      tattoo: 'arms',
    },
  },
  soril_young: {
    name: l('Soril', 'Soril'),
    color: '#c9b6ff',
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'slim',
      skin: '#ecd7c4',
      hair: { style: 'braid', color: '#3a3442' },
      fur: '#36303f',
      eyes: '#7a6aa8',
      outfit: { type: 'coat', primary: '#3b3048', secondary: '#241c2e', trim: '#c9c6dc', furCollar: '#9a90a8', pants: '#24202a', belts: 1, gloves: '#2a2430' },
      accessories: ['pendant'],
      glyph: AQUA,
      tattoo: 'forearms',
    },
  },
  nira: {
    name: l('Nira', 'Nira'),
    color: '#a8c4d8',
    look: {
      species: 'cat',
      caste: 'mezra',
      build: 'average',
      height: 1.08,
      skin: '#c9a888',
      fur: '#57534f',
      hair: { style: 'short', color: '#3c3a3a' },
      eyes: '#b0b8a0',
      outfit: { type: 'armor', primary: '#2d4a6e', secondary: '#1d2f46', trim: '#c9d0d8', pants: '#1d2533' },
      accessories: ['eyepatch', 'spear'],
      glyph: '#d8b45a',
      tattoo: 'full',
    },
  },
  riss: {
    name: l('Riss', 'Riss'),
    color: '#a8c4d8',
    look: {
      species: 'cat',
      caste: 'mezra',
      face: 'male',
      skin: '#d8b896',
      fur: '#8a6a48',
      hair: { style: 'cropped', color: '#6a4a30' },
      eyes: '#8a7a3a',
      outfit: { type: 'armor', primary: '#2d4a6e', secondary: '#1d2f46', trim: '#c9d0d8', pants: '#1d2533' },
      accessories: ['spear', 'helmet'],
    },
  },
  miret: {
    name: l('Miret', 'Miret'),
    color: '#d8c4e8',
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'small',
      skin: '#e6c8b0',
      hair: { style: 'bob', color: '#2e2018' },
      fur: '#2e2018',
      eyes: '#6a4a2a',
      outfit: { type: 'robe', primary: '#ece6f4', secondary: '#c9bedb', trim: '#7d4fc0' },
      glyph: AQUA,
    },
  },
  liri: {
    name: l('Liri', 'Liri'),
    color: '#d8c4e8',
    look: {
      species: 'cat',
      caste: 'pursang',
      skin: '#f0d6c0',
      hair: { style: 'ponytail', color: '#c8a070' },
      fur: '#c8a070',
      eyes: '#4a8a4a',
      outfit: { type: 'robe', primary: '#ece6f4', secondary: '#c9bedb', trim: '#7d4fc0' },
    },
  },
  father: {
    name: l('Otec', 'Father'),
    color: '#c8d0ff',
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'average',
      height: 1.1,
      face: 'male',
      skin: '#ecd4c0',
      hair: { style: 'short', color: '#141218' },
      fur: '#18161c',
      eyes: '#4a6ab0',
      outfit: { type: 'coat', primary: '#1d2640', secondary: '#121828', trim: '#d0b060', pants: '#141a2a' },
    },
  },
  mother: {
    name: l('Matka', 'Mother'),
    color: '#c8d0ff',
    look: {
      species: 'cat',
      caste: 'pursang',
      skin: '#f0d8c6',
      hair: { style: 'bun', color: '#16141a' },
      fur: '#1a1820',
      eyes: '#3d7fe0',
      outfit: { type: 'dress', primary: '#3a2f52', secondary: '#272038', trim: '#c8b8e0' },
    },
  },
  brother: {
    name: l('Braček', 'Little brother'),
    look: {
      species: 'cat',
      caste: 'pursang',
      build: 'child',
      face: 'child',
      skin: '#f2dac8',
      hair: { style: 'short', color: '#16141a' },
      fur: '#1a1820',
      eyes: '#3d7fe0',
      outfit: { type: 'tunic', primary: '#4a5a8a', pants: '#2a3048' },
    },
  },
  // ------------------------------------------------------------------ Itaka & Kitsune
  tami: {
    name: l('Tami', 'Tami'),
    portrait: 'tami',
    color: '#ffb070',
    look: {
      species: 'fox',
      caste: 'pursang',
      build: 'slim',
      skin: '#f2d8c4',
      hair: { style: 'braid', color: '#c4561e' },
      hairShine: '#ffb070',
      fur: '#c95f22',
      furTip: '#f7f1ea',
      eyes: '#3f9be0',
      outfit: {
        type: 'coat',
        primary: '#3f3a2e',
        secondary: '#2a2620',
        trim: '#9a8a60',
        pants: '#3a3a2a',
        belts: 2,
        gloves: '#2e261e',
        bandage: true,
        boots: 'tall',
      },
      accessories: ['goggles', 'scarf', 'pistols', 'rapier'],
      glyph: '#5a86ff',
      tattoo: 'forearms',
    },
  },
  saburo: {
    name: l('Saburo', 'Saburo'),
    color: '#e8c890',
    look: {
      species: 'fox',
      caste: 'pursang',
      build: 'old',
      face: 'old',
      skin: '#e0c4aa',
      hair: { style: 'short', color: '#a8a39c' },
      fur: '#9a958e',
      furTip: '#e8e4dc',
      eyes: '#8a6a3a',
      outfit: { type: 'coat', primary: '#4a3a2c', secondary: '#2e241c', trim: '#b89050', pants: '#2a2420', belts: 1 },
      accessories: ['tricorn', 'pipe', 'cane'],
    },
  },
  dara: {
    name: l('Dara', 'Dara'),
    color: '#e8b088',
    look: {
      species: 'fox',
      caste: 'mezra',
      skin: '#d8b090',
      ear: 'missing',
      hair: { style: 'ponytail', color: '#8a4a26' },
      fur: '#a85a2a',
      furTip: '#f0e8de',
      eyes: '#b08a3a',
      outfit: { type: 'jacket', primary: '#4a3e30', secondary: '#c8b898', pants: '#2c2a26', belts: 1, gloves: '#2a2018' },
      accessories: ['goggles'],
    },
  },
  yori: {
    name: l('Yori', 'Yori'),
    color: '#f0d0a0',
    look: {
      species: 'cat',
      caste: 'mezra',
      build: 'small',
      face: 'child',
      skin: '#e8c8a8',
      hair: { style: 'wild', color: '#c8a070' },
      fur: '#d0a878',
      eyes: '#6a9a3a',
      outfit: { type: 'apron', primary: '#8a7a64', trim: '#e8e0d0', pants: '#4a4034' },
    },
  },
  kiri: {
    name: l('Kiri', 'Kiri'),
    color: '#d8c8a8',
    look: {
      species: 'fox',
      caste: 'mezra',
      build: 'old',
      face: 'old',
      skin: '#d8bca0',
      hair: { style: 'cropped', color: '#b8b2aa' },
      fur: '#a8a29a',
      furTip: '#ece8e2',
      eyes: '#7a6a4a',
      outfit: { type: 'jacket', primary: '#56483a', pants: '#3a3228', belts: 1 },
      accessories: ['carbine'],
    },
  },
  toru: {
    name: l('Toru', 'Toru'),
    color: '#d8c8a8',
    look: {
      species: 'fox',
      caste: 'mezra',
      build: 'old',
      face: 'old',
      skin: '#d0b498',
      hair: { style: 'short', color: '#c8c2ba' },
      fur: '#b0aaa2',
      furTip: '#ece8e2',
      eyes: '#6a5a3a',
      outfit: { type: 'coat', primary: '#3e4648', pants: '#2a2e30', belts: 1 },
      accessories: ['carbine', 'goggles'],
    },
  },
  goji: {
    name: l('Goji', 'Goji'),
    color: '#ffc070',
    look: {
      species: 'fox',
      caste: 'mezra',
      build: 'slim',
      face: 'male',
      height: 0.94,
      skin: '#e2c2a2',
      hair: { style: 'wild', color: '#d0702e' },
      fur: '#d36a2a',
      furTip: '#f6efe6',
      eyes: '#c88a2a',
      outfit: { type: 'apron', primary: '#5a4a38', trim: '#7a6248', pants: '#3a3228', belts: 2, gloves: '#3a2a1e' },
      accessories: ['goggles', 'satchel'],
      glyph: '#ff9a40',
      tattoo: 'forearms',
    },
  },
  sayuri: {
    name: l('Sayuri', 'Sayuri'),
    color: '#bfe8ff',
    look: {
      species: 'fox',
      caste: 'pursang',
      build: 'old',
      face: 'old',
      height: 0.88,
      skin: '#e8d4c4',
      hair: { style: 'bun', color: '#efebe6' },
      fur: '#e6e0d8',
      furTip: '#ffffff',
      eyes: '#6a8aa8',
      outfit: { type: 'robe', primary: '#5a6a72', secondary: '#3e4a50', trim: '#d8d0b8' },
      glyph: '#7fc8ff',
      tattoo: 'full',
    },
  },
  aether: {
    name: l('Aether', 'Aether'),
    color: '#e6e6f0',
    look: { quadruped: true, color: '#b8bcc6', eyes: '#ffb02e', scale: 2.3 },
  },
  felix: {
    name: l('Felix', 'Felix'),
    color: '#9fe8ff',
    look: {
      species: 'mako',
      build: 'slim',
      face: 'male',
      skin: '#7a8088',
      metal: '#6f767e',
      hair: { style: 'wild', color: '#c8c8c8' },
      outfit: { type: 'apron', primary: '#4a4038', trim: '#6a5a48', pants: '#2e2a26' },
      accessories: ['goggles'],
    },
  },
  maks: {
    name: l('Maks', 'Maks'),
    color: '#9a9aa8',
    look: {
      species: 'human',
      build: 'average',
      height: 0.96,
      face: 'male',
      skin: '#d8c0ac',
      hair: { style: 'short', color: '#141414' },
      eyes: '#1a1a1a',
      outfit: { type: 'suit', primary: '#0f0f13', secondary: '#0a0a0d', trim: '#2a2a30', pants: '#0f0f13', belts: 1 },
      accessories: ['darkglasses'],
    },
  },
  el: {
    name: l('El', 'El'),
    color: '#e6d8ff',
    look: {
      species: 'human',
      build: 'slim',
      skin: '#f2e2d6',
      hair: { style: 'long', color: '#f2f0f8' },
      hairShine: '#c8b8ff',
      eyes: '#a060e0',
      outfit: { type: 'dress', primary: '#f4f2fa', secondary: '#d8d4e8', trim: '#b8a8e0', boots: 'none' },
    },
  },
  el_child: {
    name: l('Dievča', 'Girl'),
    color: '#e6d8ff',
    look: {
      species: 'human',
      build: 'child',
      face: 'child',
      skin: '#f2e2d6',
      hair: { style: 'long', color: '#f2f0f8' },
      eyes: '#a060e0',
      outfit: { type: 'dress', primary: '#f4f2fa', trim: '#b8a8e0', boots: 'none' },
    },
  },
  dream_mother: {
    name: l('Matka', 'Mother'),
    color: '#ffffff',
    look: {
      species: 'human',
      build: 'slim',
      height: 1.08,
      skin: '#f6f2f0',
      hair: { style: 'long', color: '#ffffff' },
      eyes: '#ffffff',
      outfit: { type: 'robe', primary: '#ffffff', secondary: '#eeeeee', trim: '#e0e0ff' },
      accessories: ['staff'],
    },
  },
  samael: {
    name: l('Samael', 'Samael'),
    color: '#c38bff',
    special: 'samael',
    look: {
      species: 'human',
      face: 'male',
      skin: '#121016',
      hair: { style: 'long', color: '#08080a' },
      eyes: '#c070ff',
      outfit: { type: 'rags', primary: '#0c0b0f' },
    },
  },
  phantom: {
    name: l('Prízrak', 'Phantom'),
    special: 'phantom',
    look: { species: 'human', skin: '#000000', outfit: { type: 'rags', primary: '#000000' } },
  },
  // ------------------------------------------------------------------ Chapter 0 airship
  ballast_boy: {
    name: l('Chlapec od záťaže', 'Ballast boy'),
    look: {
      species: 'cat',
      caste: 'mezra',
      build: 'small',
      face: 'child',
      skin: '#dcbc9c',
      hair: { style: 'short', color: '#3a2a1e' },
      fur: '#7a5a3a',
      eyes: '#6a5a2a',
      outfit: { type: 'tunic', primary: '#7a6a52', pants: '#4a3e30' },
    },
  },
  dama: {
    name: l('Dáma z Dissu', 'The Diss woman'),
    look: {
      species: 'cat',
      caste: 'mezra',
      face: 'old',
      skin: '#c8a080',
      hair: { style: 'bun', color: '#4a3020' },
      fur: '#8a6040',
      eyes: '#8a6a2a',
      outfit: { type: 'dress', primary: '#6a3a3a', secondary: '#4a2828', trim: '#d8b878' },
      accessories: ['satchel'],
    },
  },
  loader: {
    name: l('Starý nakladač', 'Old loader'),
    look: {
      species: 'cat',
      caste: 'ghorki',
      build: 'broad',
      face: 'old',
      skin: '#9a7a5a',
      fur: '#7a6a5a',
      hair: { style: 'cropped', color: '#6a5a4a' },
      eyes: '#8a7a3a',
      outfit: { type: 'vest', primary: '#5a4a3a', secondary: '#a89a80', pants: '#3e3428', sleeves: 'none' },
    },
  },
  // ------------------------------------------------------------------ the north
  wolf_hunter: {
    name: l('Vlčí lovec', 'Wolf hunter'),
    look: {
      species: 'wolf',
      caste: 'ghorki',
      build: 'broad',
      height: 1.12,
      face: 'male',
      skin: '#8a8a8e',
      fur: '#7a7a80',
      furTip: '#d8d8dc',
      hair: { style: 'mane', color: '#5a5a60' },
      eyes: '#e0a030',
      outfit: { type: 'coat', primary: '#3a3430', secondary: '#2a2420', furCollar: '#a8a8a8', pants: '#2a2622', belts: 2 },
      accessories: ['rifle'],
    },
  },
  wolf_elder: {
    name: l('Jednooký starec', 'One-eyed elder'),
    look: {
      species: 'wolf',
      caste: 'ghorki',
      build: 'old',
      face: 'old',
      skin: '#9a9a9e',
      fur: '#b0b0b4',
      furTip: '#ececf0',
      hair: { style: 'mane', color: '#c8c8cc' },
      eyes: '#e0a030',
      outfit: { type: 'robe', primary: '#4a3a30', secondary: '#2e241e', trim: '#b08a50' },
      accessories: ['eyepatch', 'staff'],
    },
  },
}

/** Generic townsfolk: deterministic variations for crowds, guards, pirates. */
export type CrowdKind = 'nyau' | 'festival' | 'dock' | 'guard' | 'pirate' | 'kitsune' | 'wolf' | 'refugee' | 'novice'

const SPECIES_POOL: Record<CrowdKind, CharacterLook['species'][]> = {
  nyau: ['cat', 'cat', 'cat', 'leopard', 'rabbit', 'lynx', 'goat'],
  festival: ['cat', 'cat', 'leopard', 'rabbit', 'lynx', 'goat', 'fox'],
  dock: ['cat', 'leopard', 'lynx', 'wolf', 'bear'],
  guard: ['cat', 'leopard', 'lynx'],
  pirate: ['wolf', 'lynx', 'bear', 'cat', 'leopard'],
  kitsune: ['fox', 'fox', 'fox', 'fox', 'cat'],
  wolf: ['wolf'],
  refugee: ['fox', 'fox', 'cat', 'fox'],
  novice: ['cat'],
}

export function crowdLook(kind: CrowdKind, seed: number): CharacterLook {
  let s = (seed * 2654435761) >>> 0
  const rnd = () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 10000) / 10000
  }
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]
  const species = pick(SPECIES_POOL[kind])
  const caste: CharacterLook['caste'] = kind === 'novice' ? 'pursang' : pick(['pursang', 'mezra', 'mezra', 'ghorki'])
  const furs = ['#2a2420', '#5a4030', '#8a6a48', '#c49a6a', '#d8c8b0', '#6a6a70', '#a85a2a', '#efe8e0']
  const skins = ['#f2dac6', '#e6c6a6', '#d0a882', '#b08660', '#8a6a4e']
  const fur = species === 'fox' ? pick(['#c9632a', '#b0581e', '#d87a3a', '#a8a29a']) : pick(furs)
  const female = rnd() > 0.5
  const palettes: Record<CrowdKind, string[]> = {
    nyau: ['#e8e2d6', '#c8b8e0', '#a8c8d8', '#d8c098', '#8aa8c8', '#e0b8b0'],
    festival: ['#c8406a', '#e0a030', '#5a3a9a', '#2a8a8a', '#d8d0c0', '#8a2a4a'],
    dock: ['#6a5a44', '#4a4a3e', '#5a4a3a', '#7a6a50'],
    guard: ['#2d4a6e'],
    pirate: ['#3a2a24', '#4a3a2a', '#2a2a2a', '#5a2a2a'],
    kitsune: ['#6a5a3e', '#4a5a3a', '#7a6a4a', '#5a4a3a', '#8a7a5a'],
    wolf: ['#3a3430', '#4a3e34', '#2e2a26'],
    refugee: ['#5a5048', '#4a4440', '#6a5e52'],
    novice: ['#ece6f4'],
  }
  const primary = pick(palettes[kind])
  const outfitType: CharacterLook['outfit']['type'] =
    kind === 'guard' ? 'armor' : kind === 'novice' ? 'robe' : kind === 'pirate' ? pick(['vest', 'jacket', 'rags']) : kind === 'dock' ? pick(['vest', 'tunic', 'apron']) : female ? pick(['dress', 'tunic', 'coat']) : pick(['tunic', 'vest', 'coat', 'jacket'])
  const accessories: CharacterLook['accessories'] = []
  if (kind === 'guard') accessories.push(rnd() > 0.5 ? 'spear' : 'carbine', 'helmet')
  if (kind === 'pirate') accessories.push(pick(['knife', 'revolver', 'carbine']))
  if (kind === 'wolf') accessories.push('rifle')
  if (kind === 'festival' && rnd() > 0.3) accessories.push(pick(['mask_cat', 'mask_leopard', 'mask_rabbit']))
  return {
    species,
    caste,
    build: pick(['slim', 'average', 'average', 'broad', 'small']),
    height: 0.92 + rnd() * 0.16,
    face: female ? 'female' : 'male',
    skin: pick(skins),
    fur,
    furPattern: species === 'leopard' ? 'spots' : 'none',
    hair: { style: pick(female ? ['long', 'bob', 'bun', 'braid', 'ponytail'] : ['short', 'cropped', 'wild', 'short']), color: rnd() > 0.5 ? fur : pick(furs) },
    eyes: pick(['#4a7ab0', '#6a8a3a', '#a07a2a', '#5a4a3a', '#8a5aa0']),
    outfit: { type: outfitType, primary, secondary: undefined, trim: kind === 'festival' ? '#e0c060' : undefined, belts: kind === 'pirate' ? 2 : undefined },
    accessories,
  }
}

export function castMember(id: string): CastMember | undefined {
  return CAST[id]
}
