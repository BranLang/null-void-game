/**
 * The Itaka's deck, floating in the sky (shared by chapter 7's night epilogue
 * and chapter 8). The hull runs along X: stern and the raised bridge on the
 * left (x 3–8), the bow cannon "Felix" on the right.
 */
import type { MapDef, PlacedProp } from '../../types'
import './props'

export const DECK_MAP: MapDef = {
  rows: [
    '                          ',
    '                          ',
    '    =====------------     ',
    '   !bbbbb............/    ',
    '   !bbbbb............./   ',
    '   !bbbbbs............./  ',
    '   !bbbbbs..............| ',
    '   !bbbbbs.............v  ',
    '   !bbbbb.............v   ',
    '   !bbbbb............v    ',
    '    =====------------     ',
    '                          ',
    '                          ',
  ],
  legend: {
    '.': { floor: 'deck', side: 'metal' },
    b: { floor: 'deck', h: 2, side: 'metal', tint: '#d8c8b0' },
    s: { floor: 'deck', h: 1, stairs: true, side: 'metal' },
    '-': { floor: 'deck', side: 'metal', prop: { type: 'railing', params: { style: 'iron' } } },
    '=': { floor: 'deck', h: 2, side: 'metal', tint: '#d8c8b0', prop: { type: 'railing', params: { style: 'iron' } } },
    '!': { floor: 'deck', h: 2, side: 'metal', tint: '#d8c8b0', prop: { type: 'railing', rot: 90, params: { style: 'iron' } } },
    '/': { floor: 'deck', side: 'metal', prop: { type: 'railing', rot: -45, params: { style: 'iron' } } },
    v: { floor: 'deck', side: 'metal', prop: { type: 'railing', rot: 45, params: { style: 'iron' } } },
    '|': { floor: 'deck', side: 'metal', prop: { type: 'railing', rot: 90, params: { style: 'iron' } } },
  },
}

/** Fixed deck furniture: cannon, bell, helm, rotors, stacks, hatch, cargo. */
export function deckProps(opts: { hatchOpen?: boolean } = {}): PlacedProp[] {
  return [
    { type: 'cannon', at: [21, 6], rot: 90, id: 'felix' },
    { type: 'ch08_bell', at: [19, 4], rot: 90, id: 'bell' },
    { type: 'ch08_helm', at: [7, 6], rot: 90, id: 'helm' },
    { type: 'ch08_navtable', at: [5, 4], id: 'navtable' },
    { type: 'ch08_instruments', at: [5, 8], rot: 180 },
    { type: 'ch08_stack', at: [4, 4] },
    { type: 'ch08_stack', at: [4, 8] },
    { type: 'ch08_hatch', at: [12, 8], params: { open: !!opts.hatchOpen }, id: 'hatch' },
    { type: 'ch08_rotor', at: [7, 1], rot: 180, params: { speed: 2.2 } },
    { type: 'ch08_rotor', at: [7, 11], params: { speed: -2.4 } },
    { type: 'ch08_rotor', at: [16, 1], rot: 180, params: { speed: 2.6 } },
    { type: 'ch08_rotor', at: [16, 11], params: { speed: -2.2 } },
    { type: 'crate', at: [11, 3] },
    { type: 'crate', at: [14, 3], params: { stack: 2 } },
    { type: 'barrel', at: [15, 3] },
    { type: 'barrel', at: [16, 9] },
    { type: 'rope_coil', at: [18, 8] },
    { type: 'rope_coil', at: [10, 9] },
    { type: 'sack', at: [17, 9], params: { count: 2 } },
    { type: 'crate', at: [19, 8] },
  ]
}
