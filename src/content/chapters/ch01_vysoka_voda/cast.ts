/**
 * Chapter 1 extras: Arkot's mother (a memory), the people of the drowned
 * city and the Nyau aerodock. Registered at module load.
 */
import { CAST, crowdLook } from '../../characters'
import type { CharacterLook } from '../../../engine/characters/look'
import { l } from '../../../i18n/i18n'

CAST['c1_mother'] = {
  name: l('Matka', 'Mother'),
  color: '#e0b080',
  look: {
    species: 'leopard',
    caste: 'mezra',
    build: 'average',
    face: 'old',
    skin: '#b58f6c',
    fur: '#c9a77a',
    furPattern: 'spots',
    furTip: '#efe2c8',
    hair: { style: 'bun', color: '#3a2a20' },
    eyes: '#8a6a3a',
    outfit: { type: 'apron', primary: '#6a5a48', secondary: '#8a7a64', trim: '#d8c8a8', sleeves: 'short' },
    accessories: ['knife'],
  },
}

/** seabed gatherers with baskets on their backs */
for (let i = 0; i < 8; i++) {
  const base = crowdLook('dock', 70 + i * 7)
  const look: CharacterLook = { ...base, outfit: { ...base.outfit, primary: ['#6a6254', '#5a5446', '#7a6e58', '#4e4a40'][i % 4] }, accessories: ['satchel'] }
  CAST[`c1_gatherer${i}`] = { name: l('Zberač', 'Gatherer'), look }
}

CAST['c1_dockwoman'] = {
  name: l('Dokárka', 'Dock woman'),
  color: '#d8c4a0',
  look: {
    species: 'cat',
    caste: 'mezra',
    build: 'broad',
    face: 'old',
    height: 1.02,
    skin: '#c8a07c',
    fur: '#8a6a4a',
    hair: { style: 'bun', color: '#5a4030' },
    eyes: '#7a8a3a',
    outfit: { type: 'apron', primary: '#5a6a72', secondary: '#3e4a50', trim: '#d8d0b8', sleeves: 'short', belts: 1 },
    accessories: ['satchel'],
  },
}

CAST['c1_porter'] = {
  name: l('Nosička', 'Porter'),
  look: {
    species: 'lynx',
    caste: 'ghorki',
    build: 'average',
    face: 'female',
    skin: '#b89070',
    fur: '#a8845a',
    furTip: '#e8dcc4',
    hair: { style: 'braid', color: '#6a4a2a' },
    eyes: '#a07a2a',
    outfit: { type: 'tunic', primary: '#7a6a50', pants: '#4a4034', belts: 1 },
    accessories: ['satchel'],
  },
}

const scarf = (seed: number, hair: string): CharacterLook => ({
  species: 'cat',
  caste: 'mezra',
  build: 'slim',
  face: 'female',
  skin: seed % 2 ? '#e6c6a6' : '#d0a882',
  fur: hair,
  hair: { style: seed % 2 ? 'ponytail' : 'long', color: hair },
  eyes: seed % 2 ? '#4a7ab0' : '#6a8a3a',
  outfit: { type: 'dress', primary: '#3f6fb0', secondary: '#2d5490', trim: '#e8e0d0' },
  accessories: ['scarf'],
})
CAST['c1_bluescarf1'] = { name: l('Dievča v modrej šatke', 'Girl in a blue scarf'), look: scarf(1, '#3a2a20') }
CAST['c1_bluescarf2'] = { name: l('Dievča v modrej šatke', 'Girl in a blue scarf'), look: scarf(2, '#c49a6a') }

CAST['c1_foreman'] = {
  name: l('Predák', 'Foreman'),
  color: '#e8c890',
  look: {
    species: 'bear',
    caste: 'mezra',
    build: 'broad',
    face: 'male',
    height: 1.1,
    skin: '#a8876a',
    fur: '#6a4a30',
    hair: { style: 'cropped', color: '#4a3020' },
    eyes: '#6a5a2a',
    outfit: { type: 'vest', primary: '#4a5a44', secondary: '#c8b898', pants: '#3a3428', belts: 1 },
    accessories: ['book'],
  },
}

for (let i = 0; i < 6; i++) CAST[`c1_docker${i}`] = { name: l('Nosič', 'Dockhand'), look: crowdLook('dock', 200 + i * 13) }
for (let i = 0; i < 4; i++) CAST[`c1_townsfolk${i}`] = { name: l('Nyauan', 'Nyauan'), look: crowdLook('nyau', 300 + i * 17) }
