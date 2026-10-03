/**
 * Extra cast for chapter 7: Korteg's surviving crew, the pirates of the
 * northern band, and costume variants (Flint without a gun, Yera with the
 * temple knife).
 */
import { CAST, crowdLook } from '../../characters'
import type { CharacterLook } from '../../../engine/characters/look'
import { l } from '../../../i18n/i18n'

const flint = CAST.flint.look as CharacterLook
const yera = CAST.yera.look as CharacterLook

CAST['c7_flint'] = {
  name: l('Flint', 'Flint'),
  color: CAST.flint.color,
  look: { ...flint, accessories: [], outfit: { ...flint.outfit, primary: '#3a4048', secondary: '#9a8a6e' } },
}

CAST['c7_yera_knife'] = {
  name: l('Yera', 'Yera'),
  portrait: 'yera',
  color: CAST.yera.color,
  look: { ...yera, accessories: [...(yera.accessories ?? []), 'knife'] },
}

CAST['c7_mechanic'] = {
  name: l('Starý mechanik', 'The old mechanic'),
  look: {
    species: 'cat',
    caste: 'mezra',
    build: 'old',
    face: 'old',
    skin: '#c8a888',
    fur: '#8a8478',
    hair: { style: 'cropped', color: '#9a948a' },
    eyes: '#7a6a3a',
    outfit: { type: 'vest', primary: '#4a4038', secondary: '#8a7a64', pants: '#3a332c', belts: 1 },
    accessories: ['goggles'],
  },
}

CAST['c7_loader1'] = {
  name: l('Nakladač', 'Loader'),
  look: { ...crowdLook('dock', 41), outfit: { type: 'vest', primary: '#5a4a3a', secondary: '#a89a80', pants: '#3e3428', sleeves: 'none' } },
}

CAST['c7_loader2'] = {
  name: l('Nakladač', 'Loader'),
  look: { ...crowdLook('dock', 77), species: 'leopard', furPattern: 'spots', outfit: { type: 'tunic', primary: '#6a5a44', pants: '#3e3428' } },
}

const pirate = (seed: number, extra: Partial<CharacterLook> = {}): CharacterLook => ({ ...crowdLook('pirate', seed), ...extra })

CAST['c7_scar'] = {
  name: l('Pirát s jazvou', 'The scarred pirate'),
  color: '#c8a090',
  look: pirate(5, { species: 'bear', build: 'broad', height: 1.12, mark: 'scar', face: 'male', accessories: ['revolver', 'knife'] }),
}
CAST['c7_smoker'] = {
  name: l('Malý pirát', 'The small pirate'),
  color: '#c8a090',
  look: pirate(9, { species: 'cat', build: 'small', face: 'male', accessories: ['pipe', 'carbine'] }),
}
CAST['c7_kicker'] = {
  name: l('Pirát', 'Pirate'),
  color: '#c8a090',
  look: pirate(13, { species: 'wolf', face: 'male', accessories: ['knife'] }),
}
CAST['c7_overseer'] = {
  name: l('Dozorca', 'Overseer'),
  color: '#c8a090',
  look: pirate(21, { species: 'lynx', face: 'male', build: 'average', accessories: ['carbine'] }),
}
for (let i = 1; i <= 10; i++) {
  CAST[`c7_pirate${i}`] = {
    name: l('Pirát', 'Pirate'),
    color: '#c8a090',
    look: pirate(100 + i * 17),
  }
}
