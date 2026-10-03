/**
 * Chapter 13 extras: the Kitsune foxes at the amphitheatre, the wolves of
 * the Diera and Hel (pups, hunters, the scarred patrol leader, the women of
 * the elder), the drinkers in the bar and the voice in the dark.
 */
import { CAST, crowdLook } from '../../characters'
import type { CharacterLook } from '../../../engine/characters/look'
import { l } from '../../../i18n/i18n'

const fox = (seed: number): CharacterLook => crowdLook('kitsune', seed)
/** Hel crowd: wolves without the hunters' rifles. */
const wolfFolk = (seed: number): CharacterLook => ({ ...crowdLook('wolf', seed), accessories: [] })

for (let i = 1; i <= 8; i++) CAST[`c13_fox${i}`] = { name: l('Kitsunčan', 'Kitsune fox'), look: fox(1300 + i * 7) }
CAST.c13_runner1 = { name: l('Kitsunčan', 'Kitsune fox'), look: fox(1391) }
CAST.c13_runner2 = { name: l('Kitsunčanka', 'Kitsune fox'), look: fox(1397) }

for (let i = 1; i <= 10; i++) CAST[`c13_hunter${i}`] = { name: l('Vlčí lovec', 'Wolf hunter'), look: crowdLook('wolf', 1400 + i * 11) }

CAST.c13_scar = {
  name: l('Vlk s jazvou', 'The scarred wolf'),
  color: '#d8b070',
  look: {
    species: 'wolf',
    caste: 'mezra',
    build: 'average',
    height: 1.06,
    face: 'male',
    skin: '#9a9496',
    fur: '#6e6a6c',
    furTip: '#d0ccc8',
    hair: { style: 'cropped', color: '#4a4648' },
    eyes: '#e0a030',
    mark: 'scar',
    outfit: { type: 'coat', primary: '#3a342e', secondary: '#2a2420', furCollar: '#8a8680', pants: '#26221e', belts: 2 },
    accessories: ['rifle'],
  },
}

const pup = (seed: number, fur: string): CharacterLook => ({
  species: 'wolf',
  caste: 'mezra',
  build: 'child',
  face: 'child',
  height: 0.62 + (seed % 3) * 0.05,
  skin: '#b8b2b0',
  fur,
  furTip: '#ecebe8',
  hair: { style: 'wild', color: fur },
  eyes: '#f0c040',
  outfit: { type: 'tunic', primary: seed % 2 ? '#5a4a3a' : '#4a4038', pants: '#3a3028', boots: 'none' },
})
CAST.c13_pup1 = { name: l('Vlča', 'Wolf pup'), look: pup(1, '#8a8682') }
CAST.c13_pup2 = { name: l('Vlča', 'Wolf pup'), look: pup(2, '#6a6460') }
CAST.c13_pup3 = { name: l('Vlča', 'Wolf pup'), look: pup(3, '#a8a29c') }
CAST.c13_pup4 = { name: l('Vlča', 'Wolf pup'), look: pup(4, '#5a5450') }
CAST.c13_pup5 = { name: l('Vlča', 'Wolf pup'), look: pup(5, '#9a948e') }
CAST.c13_pup6 = { name: l('Vlča', 'Wolf pup'), look: { ...pup(6, '#7a746e'), height: 0.55 } }

const elderWoman = (seed: number): CharacterLook => ({
  species: 'wolf',
  caste: 'mezra',
  build: 'slim',
  face: 'female',
  skin: '#aaa4a2',
  fur: seed ? '#8a8480' : '#b4aea8',
  furTip: '#eeeae6',
  hair: { style: 'braid', color: seed ? '#6a6460' : '#9a948e' },
  eyes: '#e8b040',
  outfit: { type: 'dress', primary: '#c8742a', secondary: '#9a5420', trim: '#2a2632' },
  accessories: ['pendant'],
})
CAST.c13_woman1 = { name: l('Žena zo svorky', 'Woman of the pack'), look: elderWoman(0) }
CAST.c13_woman2 = { name: l('Žena zo svorky', 'Woman of the pack'), look: elderWoman(1) }
CAST.c13_blue = {
  name: l('Vlčica v modrom', 'The she-wolf in blue'),
  look: { ...elderWoman(0), outfit: { type: 'robe', primary: '#3a5a8a', secondary: '#24385a', trim: '#c8c0b0' } },
}

for (let i = 1; i <= 18; i++) CAST[`c13_crowd${i}`] = { name: l('Vlk z Helu', 'Wolf of Hel'), look: wolfFolk(1500 + i * 13) }
for (let i = 1; i <= 3; i++) {
  CAST[`c13_young${i}`] = {
    name: l('Mladý vlk', 'Young wolf'),
    look: { ...crowdLook('wolf', 1600 + i * 5), build: 'slim', accessories: ['pendant'], outfit: { type: 'vest', primary: '#2e2a26', pants: '#22201c', sleeves: 'none' } },
  }
}
for (let i = 1; i <= 4; i++) CAST[`c13_drinker${i}`] = { name: l('Pijan', 'Drinker'), look: { ...crowdLook('wolf', 1700 + i * 9), caste: 'ghorki', build: 'broad', accessories: [] } }
for (let i = 1; i <= 4; i++) {
  CAST[`c13_widow${i}`] = {
    name: l('Vlčica', 'She-wolf'),
    look: { ...crowdLook('wolf', 1800 + i * 17), face: 'female', accessories: [], outfit: { type: 'dress', primary: ['#4a3e34', '#3a3430', '#5a4a3a', '#2e2a26'][i - 1] } },
  }
}
CAST.c13_oldwolf = { name: l('Stará vlčica', 'Old she-wolf'), look: { ...elderWoman(1), build: 'old', face: 'old', outfit: { type: 'robe', primary: '#3a342e', trim: '#6a5a48' } } }

/** The voice that sits down beside Maks in the dark (never shown). */
CAST.c13_voice = {
  name: l('Hlas v tme', 'A voice in the dark'),
  color: '#c8c0b0',
  special: 'dust',
  look: { species: 'human', skin: '#000000', outfit: { type: 'suit', primary: '#000000' } },
}
