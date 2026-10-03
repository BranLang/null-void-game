import type { AbilityId } from './GameAPI'
import { l, type L } from '../i18n/i18n'

/**
 * Spira: glyph magic written into the skin and woken by words. Casting with
 * the haiku is slow and safe; casting raw (without the haiku) is instant and
 * stronger, but the body pays: frost in the fingers, nosebleeds, strain.
 */
export interface AbilityDef {
  id: AbilityId
  name: L
  color: string
  /** romanised haiku lines shown while casting */
  haiku: string[]
  /** translation lines */
  meaning: L[]
  /** seconds of the safe cast */
  castTime: number
  /** strain added by a raw cast */
  rawStrain: number
  /** strain added by a safe cast */
  safeStrain: number
  icon: string
}

const svg = (body: string, color: string) =>
  `<svg viewBox="0 0 40 40" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  veil: {
    id: 'veil',
    name: l('Závoj', 'Veil'),
    color: '#b77dff',
    haiku: ['Hi wo keshite', 'Shizukesa kotae', 'Koe yori mo'],
    meaning: [l('Keď zhasneš oheň,', 'When you put out the fire,'), l('ticho ti odpovedá,', 'silence answers you,'), l('plnšie ako hlas.', 'fuller than a voice.')],
    castTime: 1.4,
    rawStrain: 0.3,
    safeStrain: 0.02,
    icon: svg('<circle cx="20" cy="20" r="13" stroke-dasharray="3 4"/><path d="M12 22c4-6 12-6 16 0"/><circle cx="20" cy="21" r="2.5"/>', '#b77dff'),
  },
  ice: {
    id: 'ice',
    name: l('Ľad', 'Ice'),
    color: '#cfe8ff',
    haiku: ['Mizu yo', 'Mu-hi no kokoro', 'Shizuka ni'],
    meaning: [l('Voda,', 'Water,'), l('srdce bez ohňa,', 'a heart without fire,'), l('stíš sa.', 'be still.')],
    castTime: 1.2,
    rawStrain: 0.34,
    safeStrain: 0.08,
    icon: svg('<path d="M20 6v28M8 13l24 14M32 13L8 27"/><path d="M17 8l3 3 3-3M17 32l3-3 3 3"/>', '#cfe8ff'),
  },
  fire: {
    id: 'fire',
    name: l('Oheň', 'Fire'),
    color: '#ff8a3a',
    haiku: ['Hi'],
    meaning: [l('Oheň.', 'Fire.')],
    castTime: 0.5,
    rawStrain: 0.28,
    safeStrain: 0.12,
    icon: svg('<path d="M20 34c-6 0-9-4-9-9 0-6 6-9 6-15 3 2 5 5 5 8 1-2 2-3 2-5 4 3 5 7 5 12 0 5-3 9-9 9z"/>', '#ff8a3a'),
  },
  slow: {
    id: 'slow',
    name: l('Spomalenie', 'Slow field'),
    color: '#5ff2e0',
    haiku: ['Mizu', 'Toki no wa', 'Tomare'],
    meaning: [l('Voda,', 'Water,'), l('kruh času,', 'ring of time,'), l('zastav.', 'stop.')],
    castTime: 0.9,
    rawStrain: 0.25,
    safeStrain: 0.06,
    icon: svg('<circle cx="20" cy="20" r="13"/><path d="M20 12v8l5 4"/>', '#5ff2e0'),
  },
  flow: {
    id: 'flow',
    name: l('Prúd', 'Flow'),
    color: '#5ff2e0',
    haiku: ['Mizu no te de', 'Iki no michi hirake', 'Shizuka nare'],
    meaning: [l('Vodnou rukou', 'With a hand of water,'), l('otvor cestu dychu,', 'open the path of breath,'), l('buď tichá.', 'be still.')],
    castTime: 1.4,
    rawStrain: 0.2,
    safeStrain: 0.03,
    icon: svg('<path d="M8 24c4-4 8 4 12 0s8 4 12 0"/><path d="M8 16c4-4 8 4 12 0s8 4 12 0"/>', '#5ff2e0'),
  },
  air: {
    id: 'air',
    name: l('Vzduch', 'Air'),
    color: '#9fffb0',
    haiku: ['Kaze'],
    meaning: [l('Vietor.', 'Wind.')],
    castTime: 0.6,
    rawStrain: 0.25,
    safeStrain: 0.1,
    icon: svg('<path d="M6 16h20a4 4 0 1 0-4-4M6 24h26a4 4 0 1 1-4 4"/>', '#9fffb0'),
  },
  push: {
    id: 'push',
    name: l('Päsť', 'Push'),
    color: '#e0a050',
    haiku: ['Chi no ishi yo', 'Katachi wo kizame', 'Tsuchi shizuka'],
    meaning: [l('Kameň zeme,', 'Stone of the earth,'), l('vyryj tvar,', 'carve the shape,'), l('zem je tichá.', 'the soil is still.')],
    castTime: 0.8,
    rawStrain: 0.3,
    safeStrain: 0.08,
    icon: svg('<circle cx="20" cy="20" r="12"/><path d="M14 20h12M22 15l5 5-5 5"/>', '#e0a050'),
  },
  shield: {
    id: 'shield',
    name: l('Štít', 'Shield'),
    color: '#ffc85a',
    haiku: ['Skjöldr'],
    meaning: [l('Štít.', 'Shield.')],
    castTime: 0.5,
    rawStrain: 0.25,
    safeStrain: 0.1,
    icon: svg('<path d="M20 6l12 5v8c0 8-5 13-12 15-7-2-12-7-12-15v-8z"/>', '#ffc85a'),
  },
  sora: {
    id: 'sora',
    name: l('Sora', 'Sora'),
    color: '#d8b0ff',
    haiku: ['Sora'],
    meaning: [l('Vedomie.', 'Consciousness.')],
    castTime: 0.3,
    rawStrain: 1,
    safeStrain: 1,
    icon: svg('<path d="M20 4l4 12h12l-10 7 4 13-10-8-10 8 4-13L4 16h12z"/>', '#d8b0ff'),
  },
}

/** Player Spira state: strain, veil concentration and the cast in progress. */
export class SpiraState {
  strain = 0
  veilActive = false
  concentration = 1
  /** ability being cast safely (haiku), with elapsed time */
  casting: { id: AbilityId; t: number } | null = null
  /** set after strain overflows; counts down while the player staggers */
  collapse = 0

  update(dt: number, opts: { running: boolean; moving: boolean }): { veilDropped: boolean; collapsed: boolean } {
    let veilDropped = false
    let collapsed = false
    if (this.veilActive) {
      const drain = opts.running ? 0.09 : opts.moving ? 0.035 : 0.018
      this.concentration -= drain * dt
      if (this.concentration <= 0) {
        this.concentration = 0
        this.veilActive = false
        veilDropped = true
      }
    } else this.concentration = Math.min(1, this.concentration + dt * 0.09)
    this.strain = Math.max(0, this.strain - dt * (this.veilActive ? 0.02 : 0.055))
    if (this.strain >= 1 && this.collapse <= 0) {
      this.collapse = 1.8
      this.strain = 0.62
      if (this.veilActive) {
        this.veilActive = false
        veilDropped = true
      }
      collapsed = true
    }
    if (this.collapse > 0) this.collapse -= dt
    return { veilDropped, collapsed }
  }
}
