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
  regions: {
    // the fourth branch of El's tree, gone dark
    branch: { poly: pct([[31, 30], [42, 28], [44, 37], [39, 45], [31, 43]]), color: '#0b0818', opacity: 0 },
    // the light flowing back
    glow: { poly: pct([[30, 28], [53, 28], [54, 45], [44, 50], [31, 45]]), color: '#b78cff', opacity: 0, additive: true },
  },
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

/** A Nyau street at night: the diagonal avenue under the glowing trees. */
export const NYAU_STREET: PlateDef = {
  src: 'assets/ref/nyau_street_empty.png',
  aspect: 1,
  width: 17,
  tint: '#d8d4f2',
  walk: [pct([[0, 76], [10, 71], [35, 58], [55, 48], [75, 38], [100, 26], [100, 54], [86, 61], [62, 73], [45, 81], [18, 94], [0, 100]])],
  block: [
    pct([[27.5, 60], [31, 60], [31, 63.5], [27.5, 63.5]]),
    pct([[52.5, 47.5], [55.5, 47.5], [55.5, 50.5], [52.5, 50.5]]),
    pct([[45.5, 78.5], [49, 78.5], [49, 82], [45.5, 82]]),
    pct([[84.5, 59.5], [88, 59.5], [88, 63], [84.5, 63]]),
  ],
  occluders: [
    { poly: pct([[20, 36], [38, 36], [38, 48], [32, 52], [31, 63], [27, 63], [26, 50], [20, 48]]), base: 0.63 },
    { poly: pct([[45, 23], [62, 23], [62, 35], [56, 40], [56, 50], [52, 50], [52, 38], [45, 33]]), base: 0.5 },
    { poly: pct([[39, 60], [56, 60], [56, 72], [50, 74], [50, 82], [45, 82], [45, 72], [39, 72]]), base: 0.82 },
    { poly: pct([[15, 72], [33, 72], [33, 86], [26, 88], [26, 95], [22, 95], [22, 86], [15, 84]]), base: 0.95 },
    { poly: pct([[76, 41], [93, 41], [93, 54], [87, 56], [87, 62], [84, 62], [84, 55], [76, 52]]), base: 0.62 },
    { poly: pct([[90, 32], [100, 32], [100, 56], [96, 56]]), base: 0.56 },
    { poly: pct([[70, 10], [85, 10], [85, 24], [80, 26], [80, 38], [76, 38], [76, 26], [70, 22]]), base: 0.38 },
  ],
}

/** The Saéli villa: the inner courtyard with the family's brightest tree. */
export const NYAU_VILLA: PlateDef = {
  src: 'assets/ref/nyau_saeli_villa_empty.png',
  aspect: 1,
  width: 18,
  tint: '#d4cef0',
  walk: [
    pct([[18, 52], [28, 46], [36, 44], [62, 44], [74, 46], [84, 52], [80, 60], [76, 72], [74, 80], [64, 84], [56, 82], [46, 86], [36, 84], [28, 80], [26, 72], [24, 62]]),
    pct([[28, 78], [38, 84], [20, 94], [8, 100], [0, 100], [0, 90], [14, 86]]),
  ],
  block: [ellipse(53, 67, 12.5, 7.5)],
  occluders: [
    { poly: pct([[46, 55], [61, 55], [62, 70], [46, 70]]), base: 0.68 },
    { poly: pct([[34, 34], [70, 34], [72, 54], [34, 56]]), base: 0.66 },
  ],
}

/** The temple forecourt: braziers, planters, the great door and the stairs down to the city. */
export const NYAU_TEMPLE: PlateDef = {
  src: 'assets/ref/nyau_temple_empty.png',
  aspect: 1,
  width: 18,
  tint: '#f2e8f4',
  walk: [
    pct([[0, 74], [10, 68], [25, 59], [40, 55], [55, 60], [66, 57], [70, 52], [82, 52], [86, 58], [95, 62], [100, 64], [100, 68], [84, 76], [80, 80], [88, 90], [84, 94], [74, 84], [50, 92], [34, 98], [20, 100], [0, 100]]),
    pct([[18, 52], [28, 44], [40, 40], [55, 40], [52, 48], [42, 52], [30, 56]]),
    pct([[68, 48], [78, 46], [84, 52], [80, 58], [70, 56]]),
  ],
  block: [
    pct([[22, 69], [28, 69], [28, 73], [22, 73]]),
    pct([[43, 56], [49, 56], [49, 61], [43, 61]]),
    pct([[62, 67], [68, 67], [68, 71], [62, 71]]),
    pct([[45, 79], [51, 79], [51, 83], [45, 83]]),
    pct([[31, 84], [43, 84], [43, 90], [31, 90]]),
    pct([[10, 75], [21, 75], [21, 80], [10, 80]]),
    pct([[52, 52], [62, 52], [62, 58], [52, 58]]),
    pct([[72, 62], [82, 62], [82, 68], [72, 68]]),
  ],
  occluders: [
    upright(25, 62, 73, 3.2),
    upright(46, 52, 61, 3.2),
    upright(65, 61, 71, 3.2),
    upright(48, 72, 83, 3.2),
    upright(84, 48, 58, 1.6),
    { poly: pct([[30, 80], [44, 80], [44, 90], [30, 90]]), base: 0.9 },
  ],
}
