/**
 * Painted plates of Nyau. Coordinates are normalized image coordinates
 * (u right, v down). Trace them over a 5 % grid of the image.
 */
import type { PlateDef, UV } from '../../engine/plate/plateMath'

const pct = (pts: [number, number][]): UV[] => pts.map(([u, v]) => [u / 100, v / 100])

function ellipse(cu: number, cv: number, ru: number, rv: number, n = 20): UV[] {
  const out: UV[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push([(cu + Math.cos(a) * ru) / 100, (cv + Math.sin(a) * rv) / 100])
  }
  return out
}

/** Lantern / small upright occluder: a narrow box from top to base. */
function upright(u: number, top: number, base: number, halfW = 2.2): { poly: UV[]; base: number } {
  return { poly: pct([[u - halfW, top], [u + halfW, top], [u + halfW, base], [u - halfW, base]]), base: base / 100 }
}

/** The moonlit temple garden: marble paths, two ponds, the bridge to the pavilion. */
export const NYAU_GARDEN: PlateDef = {
  src: 'assets/ref/nyau_garden_empty.png',
  aspect: 1,
  width: 16,
  tint: '#d6d2f0',
  walk: [
    // lower loop around the pond, the S-curve and the plaza
    pct([[0, 83], [12, 79], [20, 76], [23, 68], [26, 62], [30, 57], [40, 53], [55, 51], [68, 53], [80, 56], [88, 62], [92, 70], [91, 80], [86, 86], [76, 91], [55, 93], [38, 92], [28, 88], [22, 90], [8, 97], [0, 99]]),
    // upper S path to the gate in the balustrade
    pct([[24, 62], [22, 55], [21, 45], [20, 37], [16, 29], [14, 25], [20, 22], [26, 28], [29, 34], [29, 42], [31, 48], [36, 52], [40, 54]]),
    // bridge and pavilion
    pct([[55, 50], [62, 44], [70, 40], [73, 37], [80, 30], [88, 33], [88, 40], [80, 43], [70, 46], [64, 50], [60, 55]]),
  ],
  block: [
    ellipse(62, 72, 23, 13),
    // lanterns
    pct([[23, 37], [26, 37], [26, 39], [23, 39]]),
    pct([[32, 56], [35, 56], [35, 58.5], [32, 58.5]]),
    pct([[53.5, 60], [56.5, 60], [56.5, 62.5], [53.5, 62.5]]),
    pct([[42.5, 80], [45.5, 80], [45.5, 82.5], [42.5, 82.5]]),
    pct([[31, 88], [34.5, 88], [34.5, 90.5], [31, 90.5]]),
  ],
  occluders: [
    upright(24.5, 31, 38.5),
    upright(43.5, 46, 54),
    upright(33.5, 53, 58.5),
    upright(55, 55, 62),
    upright(19.5, 66, 75.5, 2.6),
    upright(44, 71, 82, 2.6),
    upright(33, 81, 90.5, 2.6),
    upright(88, 80, 86.5, 1.8),
    // tree on the island inside the S
    { poly: pct([[31, 29], [52, 29], [53, 44], [45, 50], [38, 50], [31, 44]]), base: 0.5 },
    // right-hand tree
    { poly: pct([[84, 50], [100, 46], [100, 76], [94, 78], [86, 68]]), base: 0.78 },
    // foreground plants
    { poly: pct([[38, 94], [60, 96], [75, 91], [100, 86], [100, 100], [38, 100]]), base: 1 },
  ],
}
