/**
 * Props of the pirate camp, shared by Arkot's evening (c7_camp) and Yera's
 * rescue (c7_rescue). `burning` shows the fighters already turned to wrecks.
 */
import type { PlacedProp } from '../../types'
import './props'

export function campProps(burning: boolean): PlacedProp[] {
  return [
    // the fighters on their cradles (east clearing) and what the fire leaves of them
    { type: 'ch07_fighter', at: [28, 11], offset: [0, 0.5], id: 'fighterA', hidden: burning },
    { type: 'ch07_fighter', at: [28, 18], offset: [0, 0.5], id: 'fighterB', hidden: burning, color: '#c4b08a' },
    { type: 'ch07_wreck', at: [28, 11], offset: [0, 0.5], id: 'wreckA', hidden: !burning },
    { type: 'ch07_wreck', at: [28, 18], offset: [0, 0.5], id: 'wreckB', hidden: !burning },
    // shelters and tents
    { type: 'ch07_leanto', at: [8, 11] },
    { type: 'ch07_leanto', at: [20, 11] },
    { type: 'ch07_leanto', at: [5, 23] },
    { type: 'ch07_leanto', at: [8, 25] },
    { type: 'ch07_leanto', at: [11, 19], id: 'prisonShelter' },
    { type: 'tent', at: [14, 12], color: '#6a5a48' },
    { type: 'tent', at: [6, 15], rot: 90, color: '#5a4e40' },
    { type: 'tent', at: [4, 19], color: '#6a5a48' },
    { type: 'tent', at: [21, 19], rot: 90, color: '#5e5040' },
    { type: 'tent', at: [22, 14], color: '#665644' },
    { type: 'tent', at: [17, 21], color: '#5a4e40' },
    // fires: the card game, the cook fire, the small fire on the north edge
    { type: 'campfire', at: [17, 17], id: 'cardfire' },
    { type: 'ch07_cards', at: [16, 18] },
    { type: 'cauldron', at: [19, 14] },
    { type: 'campfire', at: [19, 9], id: 'outerfire' },
    { type: 'campfire', at: [7, 21] },
    { type: 'ch07_stumpgun', at: [18, 10], id: 'stumpGun' },
    { type: 'ch07_stumpgun', at: [18, 10], id: 'stumpEmpty', params: { gun: false }, hidden: true },
    // the prisoners' corner
    { type: 'log', at: [14, 19] },
    { type: 'rope_coil', at: [13, 19] },
    { type: 'ch07_jug', at: [11, 21], id: 'jugFull' },
    { type: 'ch07_jug', at: [11, 21], id: 'jugSpilled', params: { spilled: true }, hidden: true },
    // supplies and what is left of Korteg's ship
    { type: 'crate', at: [17, 23], params: { stack: 2 } },
    { type: 'crate', at: [18, 23] },
    { type: 'barrel', at: [19, 24] },
    { type: 'barrel', at: [20, 23], params: { lying: true } },
    { type: 'sack', at: [16, 24], params: { count: 2 } },
    { type: 'ch07_pile', at: [23, 23], id: 'kortegPile' },
    { type: 'propeller', at: [25, 24], rot: 20, params: { speed: 0 } },
    { type: 'anchor', at: [22, 25], rot: 70 },
    { type: 'crate', at: [23, 22] },
    { type: 'barrel', at: [23, 20] },
    // torches along the paths
    { type: 'torch', at: [10, 14], params: { standing: true } },
    { type: 'torch', at: [15, 22], params: { standing: true } },
    { type: 'torch', at: [21, 17], params: { standing: true } },
    { type: 'torch', at: [24, 15], params: { standing: true } },
    // stumps and logs of the felled ring
    { type: 'stump', at: [12, 13] },
    { type: 'stump', at: [4, 16] },
    { type: 'log', at: [9, 23], rot: 30 },
    { type: 'rock', at: [2, 22] },
    { type: 'rock', at: [25, 10] },
    { type: 'grass', at: [6, 18] },
    { type: 'grass', at: [21, 22] },
    { type: 'reeds', at: [8, 26] },
    { type: 'reeds', at: [20, 26] },
    { type: 'reeds', at: [27, 26] },
    // Mother's Hair, the fixed star above the northern trees
    { type: 'ch07_star', at: [17, 1], params: { h: 6.5 }, id: 'star' },
  ]
}
