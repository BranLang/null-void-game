/**
 * Extras for chapters 4–6: dockhands and loaders, Renn's fox veterans, old
 * pilots, temple guards and priestesses, villa servants, the dock guard with
 * their carbines, and Arkot in a borrowed temple robe.
 */
import type { CharacterLook } from '../../../../engine/characters/look'
import { CAST, crowdLook, type CrowdKind } from '../../../characters'
import { l, type L } from '../../../../i18n/i18n'

function extra(id: string, name: L, look: CharacterLook, color?: string): void {
  CAST[id] = { name, look, color }
}

function crowd(kind: CrowdKind, seed: number, over: Partial<CharacterLook> = {}): CharacterLook {
  const base = crowdLook(kind, seed)
  return { ...base, ...over, outfit: { ...base.outfit, ...(over.outfit ?? {}) } }
}

// ------------------------------------------------------------------ Arkot in the temple robe
extra(
  'c4_arkot_robe',
  l('Arkot', 'Arkot'),
  {
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
    outfit: { type: 'robe', primary: '#efe8ff', secondary: '#d2c6f4', trim: '#9a78e0', hood: true },
    tattoo: 'none',
  },
  '#e6c27a',
)

// ------------------------------------------------------------------ the aerodock
extra('c4_dock_old', l('Starý dokár', 'Old dockhand'), {
  species: 'cat',
  caste: 'ghorki',
  build: 'old',
  face: 'old',
  skin: '#9a7a5a',
  fur: '#8a7a68',
  hair: { style: 'cropped', color: '#b8b0a4' },
  eyes: '#8a7a3a',
  outfit: { type: 'vest', primary: '#5a4a3a', secondary: '#a89a80', pants: '#3e3428', sleeves: 'short' },
  accessories: ['pipe'],
})
extra('c4_dock_oily', l('Dokár', 'Dockhand'), {
  species: 'lynx',
  caste: 'mezra',
  build: 'average',
  face: 'male',
  skin: '#7a5a40',
  fur: '#8a6a4a',
  hair: { style: 'wild', color: '#3a2a1e' },
  eyes: '#a0802a',
  outfit: { type: 'apron', primary: '#4a4036', trim: '#2a2420', pants: '#2e2822', sleeves: 'none' },
})
extra('c4_foreman', l('Dokový majster', 'Dock master'), crowd('dock', 41, { build: 'broad', face: 'male', outfit: { type: 'coat', primary: '#4a3e30', trim: '#b89050' } }))
extra('c4_loader1', l('Nakladač', 'Loader'), crowd('dock', 12, { outfit: { type: 'vest', primary: '#6a5a44', sleeves: 'none' } }))
extra('c4_loader2', l('Nakladač', 'Loader'), crowd('dock', 23, { face: 'male', outfit: { type: 'tunic', primary: '#5a4a3a' } }))
extra('c4_loader3', l('Nakladač', 'Loader'), crowd('dock', 37, { face: 'male', outfit: { type: 'vest', primary: '#4a4a3e', sleeves: 'short' } }))
extra('c4_loader4', l('Nakladačka', 'Loader'), crowd('dock', 58, { face: 'female', outfit: { type: 'apron', primary: '#7a6a50' } }))

const veteran = (seed: number, primary: string): CharacterLook => ({
  species: 'fox',
  caste: 'pursang',
  build: seed % 2 ? 'old' : 'broad',
  face: 'old',
  skin: '#dcc0a4',
  fur: '#a8a29a',
  furTip: '#ece8e2',
  hair: { style: seed % 2 ? 'cropped' : 'short', color: '#c4beb6' },
  eyes: '#8a6a3a',
  outfit: { type: 'jacket', primary, secondary: '#c8b898', pants: '#2c2a26', belts: 1, gloves: '#2a2018' },
  mark: 'scar',
})
extra('c4_vet1', l('Rennov veterán', "Renn's veteran"), veteran(1, '#4a3e30'))
extra('c4_vet2', l('Rennov veterán', "Renn's veteran"), veteran(2, '#3e4648'))
extra('c4_vet3', l('Rennov veterán', "Renn's veteran"), veteran(3, '#56483a'))

extra('c4_pilot1', l('Starý pilot', 'Old pilot'), crowd('nyau', 71, { face: 'old', build: 'old', outfit: { type: 'coat', primary: '#2a3048', trim: '#d6b25a', furCollar: '#8a7a6a' } }))
extra('c4_pilot2', l('Starý pilot', 'Old pilot'), crowd('nyau', 83, { face: 'old', build: 'average', outfit: { type: 'coat', primary: '#3a2a2a', trim: '#c8a050' } }))
extra('c4_cards1', l('Hráč', 'Card player'), crowd('dock', 91, { face: 'male' }))
extra('c4_cards2', l('Hráčka', 'Card player'), crowd('dock', 97, { face: 'female' }))
extra('c4_barkeep', l('Krčmár', 'Barkeep'), crowd('nyau', 103, { face: 'male', build: 'broad', outfit: { type: 'apron', primary: '#e0d6c4', trim: '#6a5a48' } }))

// ------------------------------------------------------------------ the temple
const templeGuard = (seed: number): CharacterLook =>
  crowd('guard', seed, {
    species: 'cat',
    caste: 'mezra',
    outfit: { type: 'armor', primary: '#3a2a5e', secondary: '#24183e', trim: '#c9c6dc', pants: '#1e1830' },
    accessories: ['spear', 'helmet'],
  })
extra('c4_tguard1', l('Chrámová stráž', 'Temple guard'), templeGuard(5))
extra('c4_tguard2', l('Chrámová stráž', 'Temple guard'), templeGuard(17))
extra('c4_tguard3', l('Chrámová stráž', 'Temple guard'), templeGuard(29))
extra('c4_priestess', l('Kňažka', 'Priestess'), crowd('novice', 13, { build: 'slim', face: 'female', hair: { style: 'bun', color: '#d8d0e0' }, outfit: { type: 'robe', primary: '#ece6f4', secondary: '#c9bedb', trim: '#7d4fc0' } }))
extra('c6_priestess1', l('Kňažka', 'Priestess'), crowd('novice', 31, { face: 'female', hair: { style: 'bun', color: '#3a2a20' }, outfit: { type: 'robe', primary: '#ece6f4', secondary: '#c9bedb', trim: '#7d4fc0' } }))
extra('c6_priestess2', l('Kňažka', 'Priestess'), crowd('novice', 47, { face: 'old', build: 'old', hair: { style: 'bun', color: '#a8a0b0' }, outfit: { type: 'robe', primary: '#2a1d3d', secondary: '#1c142a', trim: '#c9c6dc' } }))
extra('c6_novice', l('Novicka', 'Novice'), crowd('novice', 53, { face: 'child', build: 'small', outfit: { type: 'robe', primary: '#ece6f4', secondary: '#c9bedb', trim: '#7d4fc0' } }))

// ------------------------------------------------------------------ the villa
extra('c6_servant1', l('Slúžka', 'Maid'), crowd('nyau', 113, { face: 'female', outfit: { type: 'apron', primary: '#d8d0c0', trim: '#5a4a6a' } }))
extra('c6_servant2', l('Sluha', 'Servant'), crowd('nyau', 127, { face: 'male', outfit: { type: 'apron', primary: '#c8c0b0', trim: '#4a3a5a' } }))
extra('c6_servant3', l('Správkyňa', 'Housekeeper'), crowd('nyau', 139, { face: 'old', build: 'old', outfit: { type: 'dress', primary: '#4a3a5a', trim: '#d8c8a0' } }))
extra('c6_cook', l('Kuchár', 'Cook'), crowd('nyau', 151, { face: 'male', build: 'broad', outfit: { type: 'apron', primary: '#ece6dc', trim: '#8a7a6a' } }))

// ------------------------------------------------------------------ the dock guard (rin)
const dockGuard = (seed: number): CharacterLook =>
  crowd('guard', seed, {
    caste: 'mezra',
    outfit: { type: 'coat', primary: '#2f4f80', secondary: '#1e3456', trim: '#c8c0a0', pants: '#1c2232', belts: 1 },
    accessories: ['carbine', 'helmet'],
  })
extra('c6_guard1', l('Dokový gardista', 'Dock guard'), dockGuard(61))
extra('c6_guard2', l('Dokový gardista', 'Dock guard'), dockGuard(67))
extra('c6_guard3', l('Dokový gardista', 'Dock guard'), dockGuard(73))
extra('c6_guard4', l('Dokový gardista', 'Dock guard'), dockGuard(79))
extra('c6_guard5', l('Poddôstojník', 'Sergeant'), dockGuard(89))
extra('c6_mech1', l('Mechanik', 'Mechanic'), crowd('dock', 211, { face: 'male', outfit: { type: 'apron', primary: '#4a4036' } }))
extra('c6_mech2', l('Mechanik', 'Mechanic'), crowd('dock', 223, { face: 'male', outfit: { type: 'vest', primary: '#5a4a3a', sleeves: 'none' } }))
extra('c6_mech3', l('Mechanička', 'Mechanic'), crowd('dock', 229, { face: 'female', outfit: { type: 'jacket', primary: '#3e3a32' } }))
extra('c6_officer', l('Posádkový dôstojník', 'Crew officer'), crowd('nyau', 233, { face: 'male', build: 'broad', outfit: { type: 'coat', primary: '#5a3a2a', trim: '#d0a050' } }))
