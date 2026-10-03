/**
 * Maps of chapter 7. North is row 0 (the far edge): the forest path north
 * leads to the glade where the Itaka waits. The fighters stand on their
 * cradles in the clearing on the east edge; the prisoners lie under a
 * lean-to in the middle of the camp; the stream runs along the south.
 */
import type { MapDef, TileSpec } from '../../types'
import './props'

const forest: Record<string, TileSpec> = {
  T: { floor: 'moss', tint: '#6e7e66', prop: { type: 'spruce', params: { size: 1.45 } } },
  P: { floor: 'moss', tint: '#6e7e66', prop: { type: 'tree', params: { size: 1.25 } } },
  B: { floor: 'grass', tint: '#6e7e62', prop: { type: 'bush', params: { size: 1.2 } } },
  o: { floor: 'moss', tint: '#7a8a70', prop: { type: 'boulder', params: { size: 1.2 } } },
  ';': { floor: 'moss', tint: '#8a9a80' },
  ',': { floor: 'grass', tint: '#8a9a78' },
}

export const CAMP_MAP: MapDef = {
  rows: [
    'TTTTTTTPTTTTTTT;;TTTTTTTTTPTTTTTTT', // 0
    'TTTTPTTTTTTTTTT;;;TTTTTTTTTTTTTTTT', // 1
    'TTTTTTTTTTTTTT;;;TTTTTTPTTTTTTTTTT', // 2
    'TTTTTTTTTPTTTT;;,;TTTTTTTTTTTTTTTT', // 3
    'TTTT;;TTTTTTTT;;;;oTTTTTTTTTTTTTTT', // 4
    'TTT;;;TTTTTTTTT;;;;;TTTTTTTTTPTTTT', // 5
    'TTT;;;;TTTTTTTTTo;;;TTTTTTTTTTTTTT', // 6
    'TPT;;;;;TTTTTTT;;;;;;TTTTTTTTTTTTT', // 7
    'TTTT;;;;;TTTT.;;;;,;;;TTTT,,,,TTTT', // 8
    'TTTT;;;;;TTTT...;...;.TTTS,,,,STTT', // 9
    'TTTTT;;;;...T........T.T,,,ccc,,TT', // 10
    'RRTTT;.................,,,,ccc,,,B', // 11
    'RRTTTx.x.,................,ccc,S,B', // 12
    'RRRT......................,ccc,,,,', // 13
    'RRR......x................,,,,,,,,', // 14
    'RRTT......................,,,,,,S,', // 15
    'RRR...x.....x.............,,,,,,,,', // 16
    'RR........x...............,ccc,,,B', // 17
    'RRR...,...................,ccc,S,,', // 18
    'RR.....,x.................,ccc,,,B', // 19
    'RR...,..................,,,ccc,,,B', // 20
    'RRR.......m...........,.S,,,,,,,BB', // 21
    'RR.T,......mmmm......,....S,,,BBBB', // 22
    'RRRT......................,.,,BBBB', // 23
    'RRRTT.....................,,,,,BBB', // 24
    'RRTTT.T...........,,....,,,,,,,BBB', // 25
    'RRRBBBBmmmmmmmmmmmmmmmmmmmmmmmmmBB', // 26
    'RRwwwwwwwwwwww__wwwwwwwwwwwwwwwwww', // 27
    'RRwwwwwwwwwwww__wwwwwwwwwwwwwwwwww', // 28
    'BBB,,,BB,,,BBBB,,BBB,,BBB,,,BBBBBB', // 29
  ],
  legend: {
    ...forest,
    R: { floor: 'rock', wall: 'rock', wallH: 2.7 },
    '.': { floor: 'dirt', tint: '#a89a88' },
    m: { floor: 'mud' },
    w: { floor: 'water' },
    _: { floor: 'wood', tint: '#8a7a68' },
    x: { floor: 'dirt', tint: '#a89a88', prop: { type: 'ch07_twigs' } },
    c: { floor: 'wood', tint: '#6a5a4a', walk: false },
    S: { floor: 'grass', tint: '#8a9a78', prop: { type: 'stump' } },
  },
}

/** Cells covered with dry twigs: stepping on them near a pirate makes noise. */
export const TWIGS: [number, number][] = (() => {
  const out: [number, number][] = []
  CAMP_MAP.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'x') out.push([x, y])
  })
  return out
})()

export const GLADE_MAP: MapDef = {
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTBBBB', // 0
    'TTTTTTTPTTTTTTTTTTPTTTBBBB', // 1
    'TTTTTTTTTT,,TT,,TTTTTTBBBB', // 2
    'TTTTTTTT,T,,,,,,,,,TTTBBBB', // 3
    'TTTTTT,,,,,,,,,,,,,TTTBBBB', // 4
    'TTTTTT,,,,,,,,,,,,,,,TBBBB', // 5
    'TTTT,,,,,,,,,,,,,,,,,TBBBB', // 6
    'TTT,,,,,,,,,,,,,,,,,,T,BBB', // 7
    'TTT,,,,,,,,,,,,,,,,,,,,BBB', // 8
    'TTT,,,,,,,,,,,,,,,,,,,,BBB', // 9
    'TT,,,,,,,,,,,,,,,,,,,,,BBB', // 10
    'TT,,,,,,,,,,,,,,,,,,,,,BBB', // 11
    'TT,,,,,,,,,,,,,,,,,,,,;;;;', // 12
    'TTT,,,,,,,,,,,,,,,,,,,,;;;', // 13
    'TTT,,,,,,,,,,,,,,,,,,,,,BB', // 14
    'TTT,,,,,,,,,,,,,,,,,,,BBBB', // 15
    'TTTT,,,,,,,,,,,,,,,,,P,BBB', // 16
    'TTTTT,,,,,,,,,,,,,,,,TBBBB', // 17
    'TTTTTT,,,,,,,,,,,,,,TTBBBB', // 18
    'BBBBBBB,,,,,,,,,,,,BBBBBBB', // 19
    'BBBBBBBB;,,,,,,,B,BBBBBBBB', // 20
    'BBBBBBBBB;;;,,,,BBBBBBBBBB', // 21
    'BBBBBBBBB;;;;;;BBBBBBBBBBB', // 22
    'BBBBBBBBB;;;;;;BBBBBBBBBBB', // 23
  ],
  legend: { ...forest },
}
