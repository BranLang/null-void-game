/**
 * Renn's manor: the great hall, shared by ch10 (the evening by the fire) and
 * ch12 (the morning the swarm comes). The hall follows the novel: a huge stone
 * fireplace with the portrait of Tami's mother, a cracked leather couch, tall
 * arched windows to the garden, the stairs to the first floor, paintings by one
 * hand, glass vitrines and the one covered canvas.
 */
import type { MapDef, PlacedProp, Vec2 } from '../../types'
import './props'

// 20 x 15. Back wall (row 0) and left wall (x 0); the stairs rise at the back right.
export const HALL_MAP: MapDef = {
  rows: [
    '############K#%%%###',
    '#.............666...',
    '#....,,,,,....555...',
    '#....,,,,,....444...',
    '#....,,,,,....333...',
    '#....,,,,,....222...',
    '#.............111...',
    '#...................',
    '#...................',
    '#...................',
    'D...................',
    'D...................',
    '#...................',
    '#...................',
    '#...................',
  ],
  legend: {
    '#': { floor: 'stone', wall: 'stone', wallH: 3.6 },
    '%': { floor: 'stone', h: 6, wall: 'stone', wallH: 3.2 },
    '.': { floor: 'wood', tint: '#b8967a' },
    ',': { floor: 'carpet', tint: '#a8504a' },
    K: { floor: 'wood', tint: '#8a705a', tag: 'kitchen' },
    D: { floor: 'wood', tint: '#8a705a', tag: 'door' },
    '6': { floor: 'wood', h: 6, stairs: true, tint: '#9a7a5e', tag: 'landing' },
    '5': { floor: 'wood', h: 5, stairs: true, tint: '#a4846a' },
    '4': { floor: 'wood', h: 4, stairs: true, tint: '#9a7a5e' },
    '3': { floor: 'wood', h: 3, stairs: true, tint: '#a4846a' },
    '2': { floor: 'wood', h: 2, stairs: true, tint: '#9a7a5e' },
    '1': { floor: 'wood', h: 1, stairs: true, tint: '#a4846a', tag: 'stairfoot' },
  },
}

/** Key places in the hall. */
export const HALL = {
  fire: [7, 2] as Vec2,
  couch: [[10, 2], [10, 3], [10, 4]] as Vec2[],
  armchair: [4, 3] as Vec2,
  door: [1, 10] as Vec2,
  doorOut: [0, 10] as Vec2,
  kitchen: [12, 1] as Vec2,
  stairFoot: [15, 7] as Vec2,
  landing: [15, 1] as Vec2,
  bench: [[5, 2], [5, 3]] as Vec2[],
}

export type HallMode = 'evening' | 'morning'

/** Furniture, paintings and lights. `morning` = rainy grey dawn, windows glow cold blue. */
export function hallProps(mode: HallMode): PlacedProp[] {
  const glass = mode === 'morning' ? '#9fb6e0' : '#3a4660'
  const lit = true
  const win = (at: Vec2, rot: number): PlacedProp => ({
    type: 'window',
    at,
    rot,
    scale: 1.55,
    params: { arch: true, style: 'stone', lit, color: glass, light: mode === 'morning' },
  })
  return [
    // back wall
    { type: 'bookshelf', at: [1, 1] },
    { type: 'bookshelf', at: [2, 1] },
    win([4, 1], 0),
    { type: 'ch12_fireplace', at: [7, 1], params: { lit: true } },
    { type: 'painting', at: [7, 1], y: 1.15, params: { subject: 'portrait', w: 1.1 } },
    win([10, 1], 0),
    { type: 'bookshelf', at: [13, 1] },
    { type: 'painting', at: [18, 1], params: { subject: 'sea', w: 1.2 } },
    { type: 'painting', at: [17, 1], y: 0.9, params: { subject: 'sai', w: 0.6 } },
    // left wall (rot 90 = backs against the wall on the left)
    win([1, 3], 90),
    { type: 'painting', at: [1, 5], rot: 90, params: { subject: 'portrait', w: 0.7 } },
    win([1, 7], 90),
    { type: 'door', at: [0, 10], rot: 90, id: 'door_a' },
    { type: 'door', at: [0, 11], rot: 90, id: 'door_b' },
    { type: 'door', at: [0, 10], rot: 90, id: 'door_a_open', hidden: true, params: { open: true }, solid: false },
    { type: 'door', at: [0, 11], rot: 90, id: 'door_b_open', hidden: true, params: { open: true }, solid: false },
    { type: 'painting', at: [1, 13], rot: 90, params: { covered: true, w: 1.2 }, id: 'covered' },
    { type: 'door', at: [12, 0], params: { open: true }, solid: false },
    // the hearth corner
    { type: 'ch12_couch', at: [10, 3], rot: 270 },
    { type: 'bench', at: [5, 2], rot: 90, params: { back: true } },
    { type: 'bench', at: [5, 3], rot: 90, params: { back: true } },
    { type: 'rug', at: [7, 3], params: { round: true, w: 2.4 }, color: '#7a2a2e' },
    { type: 'table', at: [7, 5], params: { round: true }, scale: 0.8 },
    { type: 'candles', at: [7, 5], y: 0.62 },
    { type: 'chair', at: [3, 5], rot: 45, color: '#6a3a26' },
    // the rest of the hall
    { type: 'ch12_vitrine', at: [3, 8], params: { item: 'compass' } },
    { type: 'ch12_vitrine', at: [12, 9], params: { item: 'sword' } },
    { type: 'ch12_vitrine', at: [17, 10], params: { item: 'map' } },
    { type: 'table', at: [6, 12], params: { cloth: '#d8ccb4' } },
    { type: 'table', at: [7, 12], params: { cloth: '#d8ccb4' } },
    { type: 'chair', at: [6, 11], rot: 0 },
    { type: 'chair', at: [7, 13], rot: 180 },
    { type: 'candles', at: [7, 12], y: 0.78 },
    { type: 'sack', at: [2, 12] },
    { type: 'sack', at: [3, 13] },
    { type: 'crate', at: [2, 14] },
    { type: 'lantern', at: [12, 6], params: { style: 'post' } },
    { type: 'lantern', at: [3, 6], params: { style: 'post' } },
    { type: 'lantern', at: [15, 12], params: { style: 'post' } },
    { type: 'statue_pedestal', at: [18, 6] },
    { type: 'bookshelf', at: [19, 8], rot: 270 },
    { type: 'bookshelf', at: [19, 9], rot: 270 },
    { type: 'rug', at: [10, 10], params: { w: 3, d: 2 }, color: '#5a3a4a' },
    { type: 'railing', at: [13, 4], rot: 90, params: { style: 'wood' } },
    { type: 'railing', at: [13, 2], rot: 90, params: { style: 'wood' } },
  ]
}
