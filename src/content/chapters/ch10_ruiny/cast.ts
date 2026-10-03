/** Generic Kitsune folk for chapter 10 (extends the shared cast). */
import { CAST, crowdLook } from '../../characters'
import { l } from '../../../i18n/i18n'

CAST['c10_babka'] = {
  name: l('Stará líška', 'Old vixen'),
  color: '#d8c8a8',
  look: {
    species: 'fox',
    caste: 'mezra',
    build: 'old',
    face: 'old',
    height: 0.9,
    skin: '#d8bca0',
    hair: { style: 'bun', color: '#c8c2b8' },
    fur: '#a8a29a',
    furTip: '#efebe6',
    eyes: '#7a6a4a',
    outfit: { type: 'dress', primary: '#5a4e42', secondary: '#3e362e', trim: '#a89070' },
    accessories: ['cane'],
  },
}

CAST['c10_lamplighter'] = {
  name: l('Lampár', 'The lamplighter'),
  color: '#e8d0a0',
  look: {
    species: 'fox',
    caste: 'mezra',
    build: 'old',
    face: 'old',
    skin: '#d0b498',
    hair: { style: 'short', color: '#b8b2aa' },
    fur: '#9a948c',
    furTip: '#ece8e2',
    eyes: '#6a5a3a',
    outfit: { type: 'coat', primary: '#3e4648', secondary: '#2a2e30', pants: '#2a2e30', belts: 1 },
    accessories: ['staff'],
  },
}

const kid = (seed: number, hair: string, outfit: string) => ({
  ...crowdLook('kitsune', seed),
  species: 'fox' as const,
  caste: 'mezra' as const,
  fur: hair,
  furTip: '#f6efe6',
  build: 'child' as const,
  face: 'child' as const,
  height: 0.62,
  hair: { style: 'wild' as const, color: hair },
  outfit: { type: 'tunic' as const, primary: outfit, pants: '#4a4034' },
  accessories: [],
})

CAST['c10_kid1'] = { name: l('Líščiatko', 'Fox kit'), color: '#ffc890', look: kid(101, '#d0702e', '#7a6a4a') }
CAST['c10_kid2'] = { name: l('Líščiatko', 'Fox kit'), color: '#ffc890', look: kid(102, '#c4561e', '#4a5a3a') }
CAST['c10_kid3'] = { name: l('Líščiatko', 'Fox kit'), color: '#ffc890', look: kid(103, '#e08a4a', '#6a4a5a') }
