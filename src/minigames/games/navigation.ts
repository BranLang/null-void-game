/**
 * NAVIGATION: flying the Itaka across the wilderness.
 *
 * A parchment map with a start, a destination and twelve landing points
 * joined by legs. Each leg has a duration; legs with flowing current lines
 * are 30% faster in the direction of the current (Arkot reads the turbulent
 * boundary between warm and cold air). Sai's orbit swings gravity between the
 * light and the heavy hour: the Itaka may only be airborne outside the heavy
 * hour, so a leg must end before the next heavy hour begins, or crystals are
 * burned to brute-force through (one per heavy hour crossed; two at once risk
 * a boiler fire: 50% to lose one more crystal, or hours of repairs). Waiting
 * advances time. Events (hunter, storm, pterosaurs) and a bone field (harvest
 * a crystal) wait on some landing points. Reach the destination before the
 * supplies (days × 21 Ahil hours) run out.
 *
 * params: {
 *   map?: 'east' | 'north'   east = Nyau → Kitsune over the Eastern Wilderness (default)
 *                            north = Kitsune → the Diera (tundra, aurora, steam, the Pit)
 *   cycle?: number           Sai cycle in hours (default 20; heavy hour = cycle / 4)
 *   crystals?: number        starting Spira crystals (default 2)
 *   days?: number            supplies in Ahil days of 21 h (default 14)
 *   events?: EventId[] | Record<nodeId, EventId>   override the default events
 *                            (array = assigned to the map's event landing points in order; [] = none)
 * }
 * result: { success, score, data: { hoursUsed, crystalsLeft, choices: string[], route: string[] } }
 *         choices are e.g. 'hunter:dive', 'hunter:outrun', 'storm:wait', 'storm:push',
 *         'pterosaurs:watch', 'bones:harvest', 'bones:leave', 'fire:crystal', 'fire:repair'
 *         skipped: { success: true, score: 0, data: { skipped: true } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import type { L } from '../../i18n/i18n'

type MapId = 'east' | 'north'
type EventId = 'hunter' | 'storm' | 'pterosaurs'
type Txt = L | Record<MapId, L>

interface NavNode {
  id: string
  x: number
  y: number
  name: L
  flavor?: L
  bones?: boolean
  /** label offset (default: centred below the node) */
  lx?: number
  ly?: number
  la?: CanvasTextAlign
}

interface NavLeg {
  a: string
  b: string
  h: number
  /** air current direction: 'ab' = from a to b is 30% faster */
  wind?: 'ab' | 'ba'
  bend?: number
}

interface NavMapDef {
  title: L
  sub: L
  cartouche: L
  start: string
  end: string
  nodes: NavNode[]
  legs: NavLeg[]
  eventSlots: string[]
  terrain: (g: CanvasRenderingContext2D, rnd: () => number) => void
}

interface EventOption {
  id: string
  label: Txt
  hours?: number
  crystals?: number
  gain?: number
  result: Txt
}

interface EventDef {
  title: Txt
  text: Txt
  options: EventOption[]
}

const MW = 640
const MH = 480
const INK = '#3b2612'
const WIND_FACTOR = 0.7
const FIRE_REPAIR = 5

// --------------------------------------------------------------------------- text
const S = {
  hint: {
    sk: 'Vyber cieľ (klik alebo 1–9) a leť (Enter). Let musí skončiť pred ťažkou hodinou, inak treba spáliť kryštál (C). Čakanie: W = 1 h, L = do ľahkej hodiny.',
    en: 'Pick a landing point (click or 1–9) and fly (Enter). A leg must end before the heavy hour, otherwise burn a crystal (C). Waiting: W = 1 h, L = until the light hour.',
  },
  sai: { sk: 'Saiove hodiny', en: 'Sai clock' },
  cycle: { sk: 'cyklus {p} h · ťažká {h} h', en: 'cycle {p} h · heavy {h} h' },
  light: { sk: 'ĽAHKÁ', en: 'LIGHT' },
  heavy: { sk: 'ŤAŽKÁ', en: 'HEAVY' },
  heavyIn: { sk: 'ťažká o {h} h', en: 'heavy in {h} h' },
  lightIn: { sk: 'ľahká o {h} h', en: 'light in {h} h' },
  time: { sk: 'Deň {d} · {h}. hodina', en: 'Day {d} · hour {h}' },
  supplies: { sk: 'Zásoby', en: 'Supplies' },
  dh: { sk: '{d} d {h} h', en: '{d} d {h} h' },
  crystals: { sk: 'Kryštály', en: 'Crystals' },
  pick: { sk: 'Vyber na mape ďalšie miesto pristátia.', en: 'Choose the next landing point on the map.' },
  legHours: { sk: '{h} h letu', en: '{h} h of flight' },
  wind: { sk: '≋ prúd vzduchu: o 30 % rýchlejšie', en: '≋ air current: 30% faster' },
  fits: { sk: 'Pristane pred ťažkou hodinou.', en: 'Lands before the heavy hour.' },
  crosses: { sk: 'Let by zasiahol ťažkú hodinu ({k}×).', en: 'The leg would cross the heavy hour ({k}×).' },
  heavyNow: { sk: 'Ťažká hodina: bez kryštálu Itaka nevzlietne.', en: 'Heavy hour: the Itaka cannot lift without a crystal.' },
  tooLong: { sk: 'Bez kryštálov sa tento let nedá.', en: 'This leg is impossible without crystals.' },
  fly: { sk: 'Leť', en: 'Fly' },
  flyBurn: { sk: 'Leť a spáľ {k} {kw}', en: 'Fly, burn {k} {kw}' },
  fireRisk: { sk: 'riziko požiaru!', en: 'fire risk!' },
  waitFly: { sk: 'Počkaj {h} h a leť', en: 'Wait {h} h, then fly' },
  wait1: { sk: 'Čakať 1 h', en: 'Wait 1 h' },
  waitLight: { sk: 'Do ľahkej +{h} h', en: 'To light +{h} h' },
  waitLight0: { sk: 'Do ľahkej', en: 'To light' },
  burned: { sk: 'Kryštál vzplanul v kotle. Itaka drží výšku.', en: 'A crystal flares in the boiler. The Itaka holds her height.' },
  waited: { sk: 'Itaka čaká na zemi (+{h} h).', en: 'The Itaka waits on the ground (+{h} h).' },
  landed: { sk: 'Pristátie: {place}.', en: 'Landed: {place}.' },
  noSupplies: { sk: 'Zásoby došli skôr, než Itaka doletela.', en: 'The supplies ran out before the Itaka arrived.' },
  arrived: {
    sk: 'Itaka pristáva: {place}. Cesta trvala {d} d {h} h, zostali kryštály: {c}.',
    en: 'The Itaka moors at {place}. The journey took {d} d {h} h; crystals left: {c}.',
  },
  arrivedShort: { sk: 'Cieľ dosiahnutý', en: 'Destination reached' },
  stats: { sk: '{d} d {h} h na ceste · zásoby na {s} · kryštály {c}', en: '{d} d {h} h en route · supplies for {s} · crystals {c}' },
  ok: { sk: 'Ďalej', en: 'Onward' },
  needCrystals: { sk: 'chýbajú kryštály', en: 'not enough crystals' },
} satisfies Record<string, L>

const crystalWord = (k: number): L =>
  k === 1 ? { sk: 'kryštál', en: 'crystal' } : k >= 2 && k <= 4 ? { sk: 'kryštály', en: 'crystals' } : { sk: 'kryštálov', en: 'crystals' }

const EVENTS: Record<EventId, EventDef> = {
  hunter: {
    title: { sk: 'Loď bez vlajky', en: 'A ship without a flag' },
    text: {
      sk: 'Z oparu sa vynorí vzducholoď bez vlajky. Harpúny na prove, siete na bokoch. Lovci.',
      en: 'An airship without a flag slides out of the haze. Harpoons on the prow, nets on her flanks. Hunters.',
    },
    options: [
      {
        id: 'dive',
        label: { east: { sk: 'Ponoriť sa do kaňonu', en: 'Dive into the canyon' }, north: { sk: 'Ponoriť sa do údolia', en: 'Dive into the valley' } },
        hours: 9,
        result: {
          sk: 'Itaka klesne medzi skalné steny a čaká, kým tieň lovcov neprejde.',
          en: "The Itaka sinks between the rock walls and waits until the hunters' shadow passes.",
        },
      },
      {
        id: 'outrun',
        label: { sk: 'Uniknúť im', en: 'Outrun them' },
        crystals: 1,
        result: { sk: 'Kotol zavýja, Itaka sa odtrhne od oblakov a lovci zostanú za ňou.', en: 'The boiler howls, the Itaka tears free of the clouds and the hunters fall behind.' },
      },
    ],
  },
  storm: {
    title: { east: { sk: 'Búrka', en: 'Storm' }, north: { sk: 'Snehová búrka', en: 'Blizzard' } },
    text: {
      east: { sk: 'Na obzore rastie stena búrky. Blesky v nej tancujú ako žily.', en: 'A wall of storm grows on the horizon. Lightning dances inside it like veins.' },
      north: { sk: 'Zo severu sa valí biela stena. Sneh a ľad bičujú obal Itaky.', en: "A white wall rolls in from the north. Snow and ice lash the Itaka's envelope." },
    },
    options: [
      {
        id: 'wait',
        label: { sk: 'Pristáť a prečkať ju', en: 'Land and wait it out' },
        hours: 10,
        result: { sk: 'Ukotvia Itaku a čakajú, kým sa búrka vyzúri.', en: 'They anchor the Itaka and wait for the storm to spend itself.' },
      },
      {
        id: 'push',
        label: { sk: 'Prebiť sa: dva kryštály do kotla', en: 'Punch through: two crystals in the boiler' },
        crystals: 2,
        result: { sk: 'Kotol žiari fialovo a Itaka sa prederie cez búrku.', en: 'The boiler glows violet and the Itaka claws her way through the storm.' },
      },
    ],
  },
  pterosaurs: {
    title: { sk: 'Pterosaury', en: 'Pterosaurs' },
    text: {
      sk: 'Kŕdeľ pterosaurov sa vznáša vedľa Itaky. Ich blany presvitajú v jantárovom svetle Sai. Flint na ne hvízda.',
      en: "A flock of pterosaurs glides beside the Itaka, their wing membranes glowing in Sai's amber light. Flint whistles at them.",
    },
    options: [
      {
        id: 'watch',
        label: { sk: 'Pozorovať ich', en: 'Watch them' },
        result: { sk: 'Chvíľu letia spolu. Potom sa kŕdeľ stočí k slnku.', en: 'For a while they fly together. Then the flock wheels away towards the sun.' },
      },
    ],
  },
}

const BONES: EventDef = {
  title: { sk: 'Kosti a kryštály', en: 'Bones and crystals' },
  text: {
    east: {
      sk: 'Medzi čiernymi skalami ležia rebrá niečoho obrovského. Rastú z nich fialové kryštály. Pozdĺž vlákna, nikdy naprieč.',
      en: 'Among the black rocks lie the ribs of something enormous, violet crystals growing from them. Along the grain, never across.',
    },
    north: {
      sk: 'Z rebier kosteného hrebeňa vyrastajú fialové kryštály. Vietor medzi nimi spieva.',
      en: 'Violet crystals grow from the ribs of the bone ridge. The wind sings between them.',
    },
  },
  options: [
    {
      id: 'harvest',
      label: { sk: 'Vylomiť kryštál', en: 'Harvest a crystal' },
      hours: 3,
      gain: 1,
      result: { sk: 'Kliešte, pozdĺž vlákna. Ďalší kryštál pre kotol.', en: 'Pliers, along the grain. One more crystal for the boiler.' },
    },
    {
      id: 'leave',
      label: { sk: 'Nechať ich tak', en: 'Leave them be' },
      result: { sk: 'Tie kosti niekomu patrili. Itaka letí ďalej.', en: 'Those bones belonged to someone. The Itaka flies on.' },
    },
  ],
}

const FIRE = {
  title: { sk: 'Kotol horí!', en: 'The boiler is on fire!' },
  crystal: {
    sk: 'Dva kryštály naraz boli priveľa. Plamene olízali zásobník a ďalší kryštál praskol.',
    en: 'Two crystals at once were too much. Flames licked the store and another crystal cracked.',
  },
  repair: {
    sk: 'Dva kryštály naraz boli priveľa. Plamene uhasia, no oprava kotla trvá päť hodín.',
    en: 'Two crystals at once were too much. They put out the flames, but repairing the boiler takes five hours.',
  },
} satisfies Record<string, L>

// --------------------------------------------------------------------------- terrain doodles
function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function inkLine(g: CanvasRenderingContext2D, pts: [number, number][], color: string, w: number): void {
  g.strokeStyle = color
  g.lineWidth = w
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2
    const my = (pts[i][1] + pts[i + 1][1]) / 2
    g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
  }
  const last = pts[pts.length - 1]
  g.lineTo(last[0], last[1])
  g.stroke()
}

function tree(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.beginPath()
  g.arc(x, y, s, Math.PI * 0.9, Math.PI * 2.1)
  g.arc(x + s * 0.9, y + s * 0.2, s * 0.7, Math.PI * 1.2, Math.PI * 2.3)
  g.stroke()
  g.beginPath()
  g.moveTo(x + s * 0.3, y + s * 0.5)
  g.lineTo(x + s * 0.3, y + s * 1.3)
  g.stroke()
}

function mountain(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.beginPath()
  g.moveTo(x - s, y)
  g.lineTo(x, y - s * 1.1)
  g.lineTo(x + s, y)
  g.stroke()
  g.beginPath()
  for (let k = 1; k < 5; k++) {
    g.moveTo(x + (k * s) / 5, y - s * 1.1 + (k * s * 1.1) / 5)
    g.lineTo(x + (k * s) / 5 - 3, y)
  }
  g.stroke()
}

function terrainEast(g: CanvasRenderingContext2D, rnd: () => number): void {
  // river on no map
  inkLine(
    g,
    [
      [250, 492],
      [292, 452],
      [354, 420],
      [420, 430],
      [478, 412],
      [540, 440],
      [600, 470],
      [650, 478],
    ],
    'rgba(46,92,120,0.55)',
    3,
  )
  inkLine(
    g,
    [
      [256, 496],
      [298, 458],
      [356, 428],
      [422, 438],
      [480, 420],
      [544, 448],
      [604, 478],
    ],
    'rgba(46,92,120,0.25)',
    1.2,
  )
  // jungle canopy
  g.strokeStyle = 'rgba(52,84,40,0.55)'
  g.lineWidth = 1.2
  for (let k = 0; k < 70; k++) {
    const x = 20 + rnd() * 230
    const y = 130 + rnd() * 320
    if (Math.hypot(x - 40, y - 260) < 30) continue
    tree(g, x, y, 4 + rnd() * 4)
  }
  // chasms: jagged cracks
  g.strokeStyle = 'rgba(40,24,10,0.7)'
  g.lineWidth = 1.6
  for (let c = 0; c < 3; c++) {
    let x = 190 + c * 26
    let y = 92 + c * 6
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 0; k < 6; k++) {
      x += 6 + rnd() * 6
      y += (rnd() - 0.4) * 14
      g.lineTo(x, y)
    }
    g.stroke()
  }
  // black rocks, the remains of a war of gods
  for (let k = 0; k < 16; k++) {
    const x = 262 + rnd() * 70 - 20
    const y = 228 + rnd() * 70
    if (Math.hypot(x - 290, y - 262) < 16) continue
    const s = 4 + rnd() * 8
    g.fillStyle = `rgba(28,20,16,${0.45 + rnd() * 0.3})`
    g.beginPath()
    g.moveTo(x - s, y + s * 0.4)
    g.lineTo(x - s * 0.3, y - s)
    g.lineTo(x + s * 0.7, y - s * 0.4)
    g.lineTo(x + s, y + s * 0.5)
    g.closePath()
    g.fill()
  }
  // canyon walls
  g.strokeStyle = 'rgba(80,46,20,0.6)'
  g.lineWidth = 1.3
  for (const off of [-10, 10]) {
    g.beginPath()
    let y = 92
    g.moveTo(352 + off, y)
    while (y < 190) {
      y += 8
      g.lineTo(352 + off + (rnd() - 0.5) * 8, y)
    }
    g.stroke()
  }
  // ferns
  g.strokeStyle = 'rgba(52,84,40,0.5)'
  for (let k = 0; k < 14; k++) {
    const x = 384 + rnd() * 70
    const y = 280 + rnd() * 50
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + 4, y - 8, x + 10, y - 10)
    for (let j = 1; j < 4; j++) {
      g.moveTo(x + j * 2.5, y - j * 2.6)
      g.lineTo(x + j * 2.5 - 3, y - j * 2.6 - 3)
    }
    g.stroke()
  }
  // mountains and misty falls
  g.strokeStyle = 'rgba(59,38,18,0.55)'
  g.lineWidth = 1.2
  for (const [x, y, s] of [
    [430, 66, 18],
    [462, 58, 24],
    [500, 70, 16],
    [530, 62, 20],
    [570, 74, 14],
  ]) mountain(g, x, y, s)
  g.strokeStyle = 'rgba(46,92,120,0.5)'
  for (let k = 0; k < 4; k++) {
    g.beginPath()
    g.moveTo(492 + k * 3, 74)
    g.lineTo(492 + k * 3, 104 + k * 2)
    g.stroke()
  }
  // marsh reeds
  g.strokeStyle = 'rgba(52,84,40,0.5)'
  for (let k = 0; k < 18; k++) {
    const x = 450 + rnd() * 80
    const y = 360 + rnd() * 30
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + 1, y - 7 - rnd() * 5)
    g.moveTo(x - 4, y + 1)
    g.lineTo(x + 4, y + 1)
    g.stroke()
  }
  // white pillars
  for (let k = 0; k < 6; k++) {
    const x = 566 + k * 9 + (k % 2) * 3
    const h = 24 + (k % 3) * 9
    const y = 318 - h + (k % 2) * 6
    g.fillStyle = 'rgba(250,246,236,0.95)'
    g.strokeStyle = 'rgba(59,38,18,0.7)'
    g.lineWidth = 1
    g.fillRect(x, y, 6, h)
    g.strokeRect(x, y, 6, h)
  }
}

function terrainNorth(g: CanvasRenderingContext2D, rnd: () => number): void {
  // aurora wash
  for (let b = 0; b < 3; b++) {
    const grad = g.createLinearGradient(0, 10, 0, 120)
    grad.addColorStop(0, b === 1 ? 'rgba(150,90,200,0)' : 'rgba(60,170,120,0)')
    grad.addColorStop(0.5, b === 1 ? 'rgba(150,90,200,0.16)' : 'rgba(60,170,120,0.16)')
    grad.addColorStop(1, 'rgba(60,170,120,0)')
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(0, 30 + b * 18)
    for (let x = 0; x <= MW; x += 40) g.lineTo(x, 30 + b * 18 + Math.sin(x * 0.012 + b * 1.7) * 18)
    for (let x = MW; x >= 0; x -= 40) g.lineTo(x, 80 + b * 18 + Math.sin(x * 0.011 + b) * 14)
    g.closePath()
    g.fill()
  }
  // tundra hatching
  g.strokeStyle = 'rgba(59,38,18,0.25)'
  g.lineWidth = 1
  for (let k = 0; k < 160; k++) {
    const x = rnd() * MW
    const y = 230 + rnd() * 250
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + 5 + rnd() * 6, y)
    g.stroke()
  }
  // frozen lake
  g.fillStyle = 'rgba(150,200,230,0.25)'
  g.strokeStyle = 'rgba(46,92,120,0.5)'
  g.beginPath()
  g.ellipse(306, 372, 66, 22, 0, 0, Math.PI * 2)
  g.fill()
  g.stroke()
  g.beginPath()
  g.moveTo(262, 368)
  g.lineTo(290, 378)
  g.lineTo(312, 366)
  g.moveTo(330, 382)
  g.lineTo(348, 370)
  g.stroke()
  // steam plumes
  g.strokeStyle = 'rgba(120,110,100,0.45)'
  for (let k = 0; k < 4; k++) {
    const x = 160 + k * 18
    g.beginPath()
    for (let j = 0; j < 16; j++) {
      const yy = 334 - j * 3
      const xx = x + Math.sin(j * 0.8 + k) * 4
      if (j === 0) g.moveTo(xx, yy)
      else g.lineTo(xx, yy)
    }
    g.stroke()
  }
  // ice fangs
  g.strokeStyle = 'rgba(59,38,18,0.6)'
  g.fillStyle = 'rgba(220,235,245,0.6)'
  for (let k = 0; k < 7; k++) {
    const x = 132 + k * 11
    const h = 12 + (k % 3) * 6
    g.beginPath()
    g.moveTo(x - 5, 236)
    g.lineTo(x, 236 - h)
    g.lineTo(x + 5, 236)
    g.closePath()
    g.fill()
    g.stroke()
  }
  // bone ridge
  g.strokeStyle = 'rgba(90,70,50,0.6)'
  g.lineWidth = 2
  for (let k = 0; k < 6; k++) {
    g.beginPath()
    g.arc(470 + k * 12, 236, 12, Math.PI * 1.1, Math.PI * 1.9)
    g.stroke()
  }
  g.lineWidth = 1.2
  // mountains around the pass and the geysers
  g.strokeStyle = 'rgba(59,38,18,0.5)'
  for (const [x, y, s] of [
    [150, 88, 16],
    [176, 80, 20],
    [228, 92, 14],
    [420, 90, 14],
    [470, 84, 18],
    [520, 92, 14],
  ]) mountain(g, x, y, s)
  // geysers
  g.strokeStyle = 'rgba(46,92,120,0.45)'
  for (let k = 0; k < 3; k++) {
    g.beginPath()
    g.moveTo(476 + k * 12, 128)
    g.quadraticCurveTo(472 + k * 12, 112, 478 + k * 12, 100)
    g.stroke()
  }
  // the Pit
  const pg = g.createRadialGradient(286, 88, 2, 286, 88, 26)
  pg.addColorStop(0, 'rgba(20,12,6,0.85)')
  pg.addColorStop(1, 'rgba(20,12,6,0)')
  g.fillStyle = pg
  g.beginPath()
  g.ellipse(286, 88, 30, 14, 0, 0, Math.PI * 2)
  g.fill()
  // the Diera: a great dark hole
  const dg = g.createRadialGradient(392, 34, 4, 392, 34, 44)
  dg.addColorStop(0, 'rgba(10,6,4,0.95)')
  dg.addColorStop(0.6, 'rgba(10,6,4,0.55)')
  dg.addColorStop(1, 'rgba(10,6,4,0)')
  g.fillStyle = dg
  g.beginPath()
  g.ellipse(392, 34, 52, 22, 0, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = 'rgba(40,24,10,0.5)'
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    g.beginPath()
    g.moveTo(392 + Math.cos(a) * 46, 34 + Math.sin(a) * 19)
    g.lineTo(392 + Math.cos(a) * 58, 34 + Math.sin(a) * 25)
    g.stroke()
  }
}

// --------------------------------------------------------------------------- the maps
const MAPS: Record<MapId, NavMapDef> = {
  east: {
    title: { sk: 'Itaka nad Východnou divočinou', en: 'The Itaka over the Eastern Wilderness' },
    sub: {
      sk: 'Arkot číta hranicu medzi teplým a studeným vzduchom ako písmo. Kde prúdi, Itaka letí rýchlejšie.',
      en: 'Arkot reads the boundary between warm and cold air like handwriting. Where it flows, the Itaka flies faster.',
    },
    cartouche: { sk: 'Východná divočina', en: 'The Eastern Wilderness' },
    start: 'nyau',
    end: 'kitsune',
    eventSlots: ['canyon', 'chasms', 'plateau'],
    nodes: [
      { id: 'nyau', x: 40, y: 262, name: { sk: 'Nyau', en: 'Nyau' }, lx: 0, ly: 24 },
      { id: 'jungle', x: 104, y: 160, name: { sk: 'Okraj džungle', en: "Jungle's Edge" }, flavor: { sk: 'Džungľa pod nimi dýcha, z korún stúpa para.', en: 'The jungle breathes beneath them; steam rises from the canopy.' } },
      { id: 'deep', x: 102, y: 374, name: { sk: 'Prales', en: 'Deep Jungle' }, flavor: { sk: 'Koruny sú také husté, že pod nimi nevidno zem.', en: 'The canopy is so dense the ground is invisible beneath it.' } },
      { id: 'gorge', x: 166, y: 270, name: { sk: 'Lianová roklina', en: 'Vine Gorge' }, flavor: { sk: 'Liany visia nad roklinou ako struny obrovskej harfy.', en: 'Vines hang over the gorge like the strings of a giant harp.' } },
      { id: 'chasms', x: 228, y: 132, name: { sk: 'Prepadliská', en: 'The Chasms' }, flavor: { sk: 'Prepadliská bez dna. Vietor z nich stúpa ako dych.', en: 'Bottomless chasms. Wind rises out of them like breath.' } },
      { id: 'hollow', x: 232, y: 394, name: { sk: 'Hmlistá kotlina', en: 'Mist Hollow' }, flavor: { sk: 'Hmla v kotline je teplá a vonia dažďom.', en: 'The mist in the hollow is warm and smells of rain.' } },
      { id: 'blackrock', x: 292, y: 262, name: { sk: 'Čierne skaly', en: 'Black Rocks' }, bones: true, flavor: { sk: 'Čierna skala, akoby pozostatky vojny bohov.', en: 'Black rock, like the remains of a war of gods.' } },
      { id: 'canyon', x: 354, y: 140, name: { sk: 'Kaňon', en: 'The Canyon' }, flavor: { sk: 'Steny kaňonu sú hladké, akoby ich niekto vybrúsil.', en: 'The canyon walls are smooth, as if someone had polished them.' } },
      { id: 'river', x: 356, y: 394, name: { sk: 'Rieka bez mapy', en: 'River on No Map' }, flavor: { sk: 'Rieka, ktorá nie je na žiadnej mape.', en: 'A river that is on no map.' } },
      { id: 'plateau', x: 416, y: 264, name: { sk: 'Papraďová plošina', en: 'Fern Plateau' }, flavor: { sk: 'Paprade vysoké ako stromy sa vlnia v teplom vetre.', en: 'Ferns as tall as trees ripple in the warm wind.' } },
      { id: 'falls', x: 478, y: 132, name: { sk: 'Hmlisté vodopády', en: 'Misty Falls' }, flavor: { sk: 'Vodopády sa strácajú v hmle skôr, než dopadnú.', en: 'The falls vanish into mist before they land.' } },
      { id: 'marsh', x: 480, y: 388, name: { sk: 'Močiare', en: 'The Marshes' }, flavor: { sk: 'Močiare svetielkujú. Arkot drží Itaku vysoko.', en: 'The marshes glimmer. Arkot keeps the Itaka high.' } },
      { id: 'pillars', x: 546, y: 262, name: { sk: 'Biele stĺpy', en: 'White Pillars' }, flavor: { sk: 'Z hmly vyrastajú biele stĺpy. Kitsune je blízko.', en: 'White pillars rise from the mist. Kitsune is near.' } },
      { id: 'kitsune', x: 602, y: 168, name: { sk: 'Kitsune', en: 'Kitsune' }, lx: 0, ly: -22 },
    ],
    legs: [
      { a: 'nyau', b: 'jungle', h: 13 },
      { a: 'nyau', b: 'deep', h: 11 },
      { a: 'jungle', b: 'deep', h: 9, bend: 18 },
      { a: 'jungle', b: 'gorge', h: 12 },
      { a: 'deep', b: 'gorge', h: 13 },
      { a: 'gorge', b: 'chasms', h: 12 },
      { a: 'gorge', b: 'hollow', h: 10 },
      { a: 'chasms', b: 'blackrock', h: 14, wind: 'ab' },
      { a: 'hollow', b: 'blackrock', h: 13 },
      { a: 'blackrock', b: 'canyon', h: 12 },
      { a: 'blackrock', b: 'river', h: 13 },
      { a: 'canyon', b: 'plateau', h: 12 },
      { a: 'river', b: 'plateau', h: 11 },
      { a: 'plateau', b: 'falls', h: 13 },
      { a: 'plateau', b: 'marsh', h: 12 },
      { a: 'falls', b: 'pillars', h: 12, wind: 'ab' },
      { a: 'marsh', b: 'pillars', h: 14 },
      { a: 'pillars', b: 'kitsune', h: 9 },
      { a: 'jungle', b: 'chasms', h: 19, bend: -16 },
      { a: 'deep', b: 'hollow', h: 18, bend: 16 },
      { a: 'blackrock', b: 'plateau', h: 20, bend: 0 },
      { a: 'river', b: 'marsh', h: 21, wind: 'ab', bend: 14 },
      { a: 'plateau', b: 'pillars', h: 19, bend: 0 },
    ],
    terrain: terrainEast,
  },
  north: {
    title: { sk: 'Itaka letí na sever', en: 'The Itaka Flies North' },
    sub: {
      sk: 'Tundra pod nimi je biela a tichá, nad nimi tancuje polárna žiara. Niekde vpredu čaká Diera.',
      en: 'The tundra below is white and silent; above, the aurora dances. Somewhere ahead waits the Diera.',
    },
    cartouche: { sk: 'Cesta na sever', en: 'The Way North' },
    start: 'kitsune',
    end: 'diera',
    eventSlots: ['wolf', 'lake', 'steam'],
    nodes: [
      { id: 'kitsune', x: 320, y: 452, name: { sk: 'Kitsune', en: 'Kitsune' }, lx: 34, ly: 4, la: 'left' },
      { id: 'tundraW', x: 196, y: 408, name: { sk: 'Biela tundra', en: 'White Tundra' }, flavor: { sk: 'Tundra je biela a tichá. Tieň Itaky po nej kĺže ako ryba.', en: "The tundra is white and silent. The Itaka's shadow glides over it like a fish." } },
      { id: 'tundraE', x: 452, y: 404, name: { sk: 'Kamenné pole', en: 'Stone Field' }, flavor: { sk: 'Pole posiate balvanmi, ktoré tu nechal ľad.', en: 'A field strewn with boulders left behind by the ice.' } },
      { id: 'lake', x: 320, y: 358, name: { sk: 'Zamrznuté jazero', en: 'Frozen Lake' }, flavor: { sk: 'Jazero zamrzlo tak hladko, že sa v ňom zrkadlí Sai.', en: 'The lake froze so smooth that Sai is mirrored in it.' } },
      { id: 'steam', x: 190, y: 312, name: { sk: 'Parné pramene', en: 'Steam Springs' }, flavor: { sk: 'Z puklín v ľade stúpa para. Teplý vzduch narazí na studený a Arkot sa usmeje.', en: 'Steam rises from cracks in the ice. Warm air meets cold, and Arkot smiles.' } },
      { id: 'wolf', x: 456, y: 306, name: { sk: 'Vlčie údolie', en: 'Wolf Valley' }, flavor: { sk: 'V údolí zavýjajú vlky. Ich hlasy sa nesú ďaleko.', en: 'Wolves howl in the valley. Their voices carry far.' } },
      { id: 'aurora', x: 322, y: 258, name: { sk: 'Pod polárnou žiarou', en: 'Under the Aurora' }, flavor: { sk: 'Nad nimi tancuje polárna žiara, zelená a fialová.', en: 'Above them the aurora dances, green and violet.' } },
      { id: 'fangs', x: 180, y: 208, name: { sk: 'Ľadové tesáky', en: 'Ice Fangs' }, flavor: { sk: 'Ľadové tesáky trčia z bieleho poľa ako zuby.', en: 'Ice fangs jut from the white field like teeth.' } },
      { id: 'bone', x: 466, y: 206, name: { sk: 'Kostený hrebeň', en: 'Bone Ridge' }, bones: true, flavor: { sk: 'Hrebeň z kostí obrovského tvora.', en: 'A ridge made of the bones of an enormous creature.' } },
      { id: 'glacier', x: 320, y: 160, name: { sk: 'Ľadovec', en: 'The Glacier' }, flavor: { sk: 'Ľadovec praská pod Saiinou váhou ako starý dom.', en: "The glacier creaks under Sai's weight like an old house." } },
      { id: 'pass', x: 198, y: 112, name: { sk: 'Sivý priesmyk', en: 'Grey Pass' }, flavor: { sk: 'V sivom priesmyku kvíli vietor ako dieťa.', en: 'In the grey pass the wind wails like a child.' } },
      { id: 'geysers', x: 450, y: 110, name: { sk: 'Gejzíry', en: 'The Geysers' }, flavor: { sk: 'Gejzíry vystreľujú paru vysoko do studeného vzduchu.', en: 'Geysers shoot steam high into the cold air.' } },
      { id: 'pit', x: 300, y: 70, name: { sk: 'Jama', en: 'The Pit' }, lx: -18, ly: 4, la: 'right', flavor: { sk: 'Jama. Zem sa tu prepadá do tmy, ktorej nevidno dno.', en: 'The Pit. The ground falls away into a darkness with no visible bottom.' } },
      { id: 'diera', x: 392, y: 34, name: { sk: 'Diera', en: 'The Diera' }, lx: 26, ly: 4, la: 'left' },
    ],
    legs: [
      { a: 'kitsune', b: 'tundraW', h: 12 },
      { a: 'kitsune', b: 'tundraE', h: 13 },
      { a: 'tundraW', b: 'lake', h: 11 },
      { a: 'tundraE', b: 'lake', h: 12 },
      { a: 'lake', b: 'steam', h: 12 },
      { a: 'lake', b: 'wolf', h: 13 },
      { a: 'steam', b: 'aurora', h: 13, wind: 'ab' },
      { a: 'wolf', b: 'aurora', h: 12 },
      { a: 'aurora', b: 'fangs', h: 12 },
      { a: 'aurora', b: 'bone', h: 11 },
      { a: 'fangs', b: 'glacier', h: 13 },
      { a: 'bone', b: 'glacier', h: 12 },
      { a: 'glacier', b: 'pass', h: 11 },
      { a: 'glacier', b: 'geysers', h: 13 },
      { a: 'pass', b: 'pit', h: 12 },
      { a: 'geysers', b: 'pit', h: 10, wind: 'ab' },
      { a: 'pit', b: 'diera', h: 8 },
      { a: 'kitsune', b: 'lake', h: 20, bend: 0 },
      { a: 'lake', b: 'aurora', h: 19, bend: 0 },
      { a: 'steam', b: 'fangs', h: 20, bend: -14 },
      { a: 'wolf', b: 'bone', h: 18, wind: 'ab', bend: 14 },
      { a: 'aurora', b: 'glacier', h: 20, bend: 0 },
      { a: 'glacier', b: 'pit', h: 21, bend: 10 },
      { a: 'bone', b: 'geysers', h: 19, bend: 14 },
    ],
    terrain: terrainNorth,
  },
}

const CSS = `
.nvnav{display:flex;gap:14px;align-items:flex-start;justify-content:center;flex-wrap:wrap}
.nvnav-map{position:relative;border-radius:8px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.5)}
.nvnav-side{width:226px;display:flex;flex-direction:column;gap:8px;font-family:var(--nv-font-body);color:var(--nv-text)}
.nvnav-box{background:rgba(255,255,255,.03);border:1px solid var(--nv-line);border-radius:8px;padding:7px 10px}
.nvnav-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.nvnav-lab{font-family:var(--nv-font-title);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--nv-gold)}
.nvnav-val{font-size:calc(15px * var(--nv-text-scale))}
.nvnav-bar{height:6px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin:3px 0 6px}
.nvnav-bar>div{height:100%;background:linear-gradient(90deg,#b98b3e,#f3d995);transition:width .3s}
.nvnav-cr{display:flex;gap:5px;align-items:center;min-height:18px}
.nvnav-gem{width:11px;height:17px;clip-path:polygon(50% 0,100% 30%,80% 100%,20% 100%,0 30%);background:linear-gradient(180deg,#f0deff,#9257ff 55%,#3d1474);box-shadow:0 0 10px #b77dff;filter:drop-shadow(0 0 4px #b77dff)}
.nvnav-gem.out{background:rgba(255,255,255,.12);box-shadow:none;filter:none}
.nvnav-leg{min-height:112px;display:flex;flex-direction:column;gap:5px}
.nvnav-leg .nvnav-to{font-family:var(--nv-font-title);color:var(--nv-gold-bright);font-size:13px;letter-spacing:.06em}
.nvnav-leg .nvnav-note{font-size:14px;line-height:1.25;color:var(--nv-text-dim)}
.nvnav-leg .nvnav-warn{color:#ff9aa4}
.nvnav-leg .nvnav-okc{color:#8ff0d0}
.nvnav-leg .nvnav-windc{color:#7fe8f0}
.nvnav-side .nv-btn{padding:7px 10px;font-size:12px;letter-spacing:.06em;text-align:left}
.nvnav-waits{display:flex;gap:6px}
.nvnav-waits .nv-btn{flex:1;text-align:center;padding:6px 4px;font-size:11px;white-space:nowrap}
.nvnav-log{font-size:13px;font-style:italic;color:var(--nv-text-dim);line-height:1.28;height:52px;overflow:hidden}
.nvnav-log div:first-child{color:var(--nv-text)}
.nvnav-side.compact .nvnav-log,.nvnav-side.compact .nvnav-saisub{display:none}
.nvnav-side.compact{gap:6px}
.nvnav-side.compact .nvnav-leg{min-height:96px}
.nvnav-ev{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,6,3,.42);backdrop-filter:blur(1.5px)}
.nvnav-evc{width:min(380px,86%);padding:16px 18px;display:flex;flex-direction:column;gap:10px;animation:nv-fade-in .3s}
.nvnav-evc .nvnav-evt{font-family:var(--nv-font-title);color:var(--nv-gold);letter-spacing:.1em;text-transform:uppercase;font-size:15px;text-align:center}
.nvnav-evc .nvnav-evx{font-size:calc(16px * var(--nv-text-scale));line-height:1.35;text-align:center}
.nvnav-evc .nv-btn{font-size:13px;letter-spacing:.05em}
.nvnav-evc .nvnav-cost{opacity:.7;font-family:var(--nv-font-body);font-style:italic;letter-spacing:0}
`

// --------------------------------------------------------------------------- helpers
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const mod = (v: number, m: number) => ((v % m) + m) % m

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

function isL(v: Txt): v is L {
  return 'sk' in v && typeof (v as L).sk === 'string'
}

interface Curve {
  ax: number
  ay: number
  cx: number
  cy: number
  bx: number
  by: number
}

function legCurve(a: NavNode, b: NavNode, bend: number | undefined): Curve {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const k = bend ?? ((a.id.length * 7 + b.id.length * 3) % 2 ? 8 : -8)
  return { ax: a.x, ay: a.y, cx: mx + (-dy / len) * k, cy: my + (dx / len) * k, bx: b.x, by: b.y }
}

function curveAt(c: Curve, u: number): { x: number; y: number; tx: number; ty: number } {
  const v = 1 - u
  return {
    x: v * v * c.ax + 2 * v * u * c.cx + u * u * c.bx,
    y: v * v * c.ay + 2 * v * u * c.cy + u * u * c.by,
    tx: 2 * v * (c.cx - c.ax) + 2 * u * (c.bx - c.cx),
    ty: 2 * v * (c.cy - c.ay) + 2 * u * (c.by - c.cy),
  }
}

function buildMapArt(def: NavMapDef, ctx: MinigameContext): HTMLCanvasElement {
  const r = Math.min(2, window.devicePixelRatio || 1)
  const c = document.createElement('canvas')
  c.width = Math.round(MW * r)
  c.height = Math.round(MH * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  const rnd = mulberry(def.start.length * 977 + 13)
  const base = g.createRadialGradient(MW * 0.5, MH * 0.45, 60, MW * 0.5, MH * 0.5, 520)
  base.addColorStop(0, '#f1e3bf')
  base.addColorStop(0.6, '#e3cc9a')
  base.addColorStop(1, '#bf9c64')
  g.fillStyle = base
  g.fillRect(0, 0, MW, MH)
  for (let i = 0; i < 2400; i++) {
    g.fillStyle = `rgba(90,60,20,${rnd() * 0.07})`
    g.fillRect(rnd() * MW, rnd() * MH, 1 + rnd() * 2.5, 1)
  }
  for (let i = 0; i < 9; i++) {
    const x = rnd() * MW
    const y = rnd() * MH
    const rad = 30 + rnd() * 80
    const sg = g.createRadialGradient(x, y, rad * 0.2, x, y, rad)
    sg.addColorStop(0, 'rgba(140,95,40,0.09)')
    sg.addColorStop(1, 'rgba(140,95,40,0)')
    g.fillStyle = sg
    g.beginPath()
    g.arc(x, y, rad, 0, Math.PI * 2)
    g.fill()
  }
  // faint graticule
  g.strokeStyle = 'rgba(59,38,18,0.07)'
  g.lineWidth = 1
  for (let x = 40; x < MW; x += 80) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, MH)
    g.stroke()
  }
  for (let y = 40; y < MH; y += 80) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(MW, y)
    g.stroke()
  }
  def.terrain(g, rnd)
  // compass rose (bottom-left)
  const cx = 40
  const cy = 440
  g.strokeStyle = 'rgba(59,38,18,0.6)'
  g.fillStyle = 'rgba(59,38,18,0.7)'
  g.lineWidth = 1
  g.beginPath()
  g.arc(cx, cy, 18, 0, Math.PI * 2)
  g.stroke()
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4
    const len = k % 2 ? 11 : 24
    g.beginPath()
    g.moveTo(cx, cy)
    g.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len)
    g.stroke()
  }
  g.beginPath()
  g.moveTo(cx, cy - 28)
  g.lineTo(cx - 4, cy - 16)
  g.lineTo(cx + 4, cy - 16)
  g.closePath()
  g.fill()
  g.font = '600 9px Cinzel, serif'
  g.textAlign = 'center'
  g.fillText(ctx.lang === 'sk' ? 'S' : 'N', cx, cy - 32)
  // cartouche (top-left)
  g.font = '600 13px Cinzel, serif'
  const title = ctx.t(def.cartouche).toUpperCase()
  const tw = g.measureText(title).width + 28
  g.fillStyle = 'rgba(244,230,196,0.85)'
  g.strokeStyle = 'rgba(59,38,18,0.6)'
  g.beginPath()
  g.moveTo(12, 12)
  g.lineTo(12 + tw, 12)
  g.lineTo(20 + tw, 26)
  g.lineTo(12 + tw, 40)
  g.lineTo(12, 40)
  g.lineTo(4, 26)
  g.closePath()
  g.fill()
  g.stroke()
  g.fillStyle = INK
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  g.fillText(title, 26, 27)
  // edge burn
  const eg = g.createRadialGradient(MW / 2, MH / 2, 180, MW / 2, MH / 2, 520)
  eg.addColorStop(0, 'rgba(60,35,10,0)')
  eg.addColorStop(1, 'rgba(60,35,10,0.45)')
  g.fillStyle = eg
  g.fillRect(0, 0, MW, MH)
  return c
}

// --------------------------------------------------------------------------- the minigame
interface Tween {
  t: number
  dur: number
  update: (u: number) => void
  done: () => void
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
}

function runNavigation(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  const mapId: MapId = params.map === 'north' ? 'north' : 'east'
  const def = MAPS[mapId]
  const P = Math.round(clamp(num(params.cycle, 20), 8, 48))
  const HV = Math.max(2, Math.round(P / 4))
  const LIGHT = P - HV
  // legs were designed for a 15 h light window; shrink them if the window is shorter
  const SCALE = Math.min(1, LIGHT / 15)
  const START_CRYSTALS = Math.round(clamp(num(params.crystals, 2), 0, 9))
  const BUDGET = Math.round(clamp(num(params.days, 14), 1, 60) * 21)
  const reduced = ctx.assist.reducedMotion
  const pick = (v: Txt): L => (isL(v) ? v : v[mapId])
  const nodeById = new Map(def.nodes.map((n) => [n.id, n]))
  const node = (id: string) => nodeById.get(id)!

  // events per landing point
  const eventAt = new Map<string, EventId>()
  const isEventId = (v: unknown): v is EventId => v === 'hunter' || v === 'storm' || v === 'pterosaurs'
  if (Array.isArray(params.events)) {
    params.events.forEach((e, i) => {
      if (isEventId(e) && def.eventSlots[i]) eventAt.set(def.eventSlots[i], e)
    })
  } else if (params.events && typeof params.events === 'object') {
    for (const [k, v] of Object.entries(params.events as Record<string, unknown>)) if (nodeById.has(k) && isEventId(v)) eventAt.set(k, v)
  } else {
    ;(['hunter', 'storm', 'pterosaurs'] as EventId[]).forEach((e, i) => eventAt.set(def.eventSlots[i], e))
  }

  const legHours = (leg: NavLeg, from: string) => {
    const base = Math.max(1, Math.round(leg.h * SCALE))
    const withWind = (leg.wind === 'ab' && from === leg.a) || (leg.wind === 'ba' && from === leg.b)
    return withWind ? Math.max(1, Math.round(base * WIND_FACTOR)) : base
  }
  const windHelps = (leg: NavLeg, from: string) => (leg.wind === 'ab' && from === leg.a) || (leg.wind === 'ba' && from === leg.b)
  const cyc = (t: number) => mod(t, P)
  const isHeavy = (t: number) => cyc(t) >= LIGHT - 1e-9
  const heavyCount = (t0: number, d: number) => {
    let n = 0
    for (let k = Math.floor(t0 / P) - 1; k <= Math.ceil((t0 + d) / P) + 1; k++) {
      const ws = k * P + LIGHT
      if (Math.min(ws + HV, t0 + d) - Math.max(ws, t0) > 1e-6) n++
    }
    return n
  }
  const waitToLight = (t: number) => {
    const c = cyc(t)
    return c < 1e-9 ? 0 : P - c
  }

  /** best possible arrival time (ignoring events), for scoring */
  function optimalHours(): number {
    const best = new Map<string, number>()
    const queue: { n: string; t: number; c: number }[] = [{ n: def.start, t: 0, c: START_CRYSTALS }]
    while (queue.length) {
      let bi = 0
      for (let i = 1; i < queue.length; i++) if (queue[i].t < queue[bi].t) bi = i
      const s = queue.splice(bi, 1)[0]
      if (s.n === def.end) return s.t
      const key = `${s.n}|${s.t}|${s.c}`
      if (best.has(key) || s.t > BUDGET * 2) continue
      best.set(key, s.t)
      for (const leg of def.legs) {
        if (leg.a !== s.n && leg.b !== s.n) continue
        const to = leg.a === s.n ? leg.b : leg.a
        const d = legHours(leg, s.n)
        const k = heavyCount(s.t, d)
        if (k <= s.c) queue.push({ n: to, t: s.t + d, c: s.c - k })
        const w = waitToLight(s.t)
        if (w > 0 && heavyCount(s.t + w, d) === 0) queue.push({ n: to, t: s.t + w + d, c: s.c })
      }
    }
    return BUDGET
  }
  const OPTIMAL = optimalHours()

  return new Promise<MinigameResult>((resolve) => {
    let finished = false
    const cleanups: (() => void)[] = []
    const finish = (r: MinigameResult) => {
      if (finished) return
      finished = true
      for (const c of cleanups) c()
      resolve(r)
    }

    const style = el('style')
    style.textContent = CSS
    ctx.root.appendChild(style)
    const card = createCard(ctx, def.title, def.sub)
    card.card.style.width = 'min(944px, 98vw)'
    card.card.style.boxSizing = 'border-box'
    card.card.style.overflowY = 'auto'
    card.hint.textContent = ctx.t(S.hint)
    card.buttons.style.minHeight = '42px'

    const wrap = el('div', 'nvnav')
    card.body.appendChild(wrap)
    const mapBox = el('div', 'nvnav-map')
    wrap.appendChild(mapBox)
    const { canvas, ctx: g } = hiDpiCanvas(MW, MH)
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    canvas.style.borderRadius = '0'
    mapBox.appendChild(canvas)
    const evLayer = el('div', 'nvnav-ev')
    mapBox.appendChild(evLayer)

    const side = el('div', 'nvnav-side')
    wrap.appendChild(side)
    // sai clock
    const saiBox = el('div', 'nvnav-box')
    saiBox.style.cssText += 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px'
    const SC = 112
    const { canvas: saiCanvas, ctx: sg } = hiDpiCanvas(SC, SC)
    saiBox.appendChild(saiCanvas)
    const saiLab = el('div', 'nvnav-lab', ctx.t(S.sai))
    saiLab.title = ctx.t(S.cycle, { p: P, h: HV })
    const saiSub = el('div', 'nvnav-saisub', ctx.t(S.cycle, { p: P, h: HV }))
    saiSub.style.cssText = 'font-size:11.5px;color:var(--nv-text-dim);font-style:italic;line-height:1'
    saiBox.append(saiLab, saiSub)
    side.appendChild(saiBox)
    // stats
    const stats = el('div', 'nvnav-box')
    const timeVal = el('div', 'nvnav-val')
    timeVal.style.marginBottom = '4px'
    const supRow = el('div', 'nvnav-row')
    const supLab = el('div', 'nvnav-lab', ctx.t(S.supplies))
    const supVal = el('div', 'nvnav-val')
    supRow.append(supLab, supVal)
    const bar = el('div', 'nvnav-bar')
    const barFill = el('div')
    bar.appendChild(barFill)
    const crRowWrap = el('div', 'nvnav-row')
    const crLab = el('div', 'nvnav-lab', ctx.t(S.crystals))
    const crRow = el('div', 'nvnav-cr')
    crRowWrap.append(crLab, crRow)
    stats.append(timeVal, supRow, bar, crRowWrap)
    side.appendChild(stats)
    // leg info
    const legBox = el('div', 'nvnav-box nvnav-leg')
    side.appendChild(legBox)
    const waits = el('div', 'nvnav-waits')
    const wait1Btn = button(`${ctx.t(S.wait1)} (W)`, () => doWait(1))
    const waitLBtn = button('', () => doWait(waitToLight(time)))
    waits.append(wait1Btn, waitLBtn)
    side.appendChild(waits)
    const logBox = el('div', 'nvnav-log')
    side.appendChild(logBox)

    const fit = () => {
      const availW = window.innerWidth * 0.96 - 56
      const availH = window.innerHeight * 0.92 - 200
      const besides = availW - 240 >= 330
      const s = Math.max(0.42, Math.min(1, (besides ? availW - 240 : availW) / MW, (besides ? availH : availH - 420) / MH))
      canvas.style.width = `${Math.round(MW * s)}px`
      canvas.style.height = `${Math.round(MH * s)}px`
      // short screens: slimmer side panel (no log, smaller clock labels)
      side.classList.toggle('compact', besides && MH * s < 430)
    }
    fit()
    window.addEventListener('resize', fit)
    cleanups.push(() => window.removeEventListener('resize', fit))

    const art = buildMapArt(def, ctx)

    // ------------------------------------------------------------------ state
    let time = 0
    let crystals = START_CRYSTALS
    let cur = def.start
    let route: string[] = [def.start]
    let choices: string[] = []
    let resolved = new Set<string>()
    let selected: string | null = null
    let hover: string | null = null
    let mode: 'idle' | 'anim' | 'event' | 'ended' = 'idle'
    let tween: Tween | null = null
    let ship = { x: node(def.start).x, y: node(def.start).y, dir: 1, burn: 0 }
    let log: string[] = []
    let failures = 0
    let endInfo: { ok: boolean; t: number } | null = null
    const sparks: Spark[] = []

    function addLog(s: string): void {
      log = [s, ...log].slice(0, 2)
      logBox.replaceChildren(...log.map((l) => el('div', '', l)))
    }

    interface Option {
      to: string
      leg: NavLeg
    }
    function neighbours(): Option[] {
      const here = node(cur)
      return def.legs
        .filter((l) => l.a === cur || l.b === cur)
        .map((l) => ({ to: l.a === cur ? l.b : l.a, leg: l }))
        .sort((p, q) => {
          const a = node(p.to)
          const b = node(q.to)
          return Math.atan2(a.x - here.x, here.y - a.y) - Math.atan2(b.x - here.x, here.y - b.y)
        })
    }

    interface Plan {
      d: number
      k: number
      wait: number
      kAfter: number
      wind: boolean
    }
    function planTo(to: string): Plan | null {
      const opt = neighbours().find((o) => o.to === to)
      if (!opt) return null
      const d = legHours(opt.leg, cur)
      const w = waitToLight(time)
      return { d, k: heavyCount(time, d), wait: w, kAfter: heavyCount(time + w, d), wind: windHelps(opt.leg, cur) }
    }

    const dh = (h: number) => ctx.t(S.dh, { d: Math.floor(h / 21), h: Math.round(h % 21) })

    function refresh(): void {
      const day = Math.floor(time / 21) + 1
      timeVal.textContent = ctx.t(S.time, { d: day, h: Math.round(time % 21) })
      const left = Math.max(0, BUDGET - time)
      supVal.textContent = dh(left)
      barFill.style.width = `${(left / BUDGET) * 100}%`
      barFill.style.background = left / BUDGET < 0.25 ? 'linear-gradient(90deg,#8b1e1e,#ff5a6a)' : ''
      crRow.replaceChildren()
      const shown = Math.max(crystals, START_CRYSTALS)
      for (let i = 0; i < shown; i++) crRow.appendChild(el('div', `nvnav-gem${i < crystals ? '' : ' out'}`))
      if (shown === 0) crRow.appendChild(el('span', '', '—'))
      const busy = mode !== 'idle'
      wait1Btn.disabled = busy
      const wl = waitToLight(time)
      waitLBtn.textContent = `${wl > 0 ? ctx.t(S.waitLight, { h: wl }) : ctx.t(S.waitLight0)} (L)`
      waitLBtn.disabled = busy || wl === 0
      renderLeg()
    }

    function renderLeg(): void {
      legBox.replaceChildren()
      if (mode === 'ended') return
      if (!selected) {
        legBox.appendChild(el('div', 'nvnav-note', ctx.t(isHeavy(time) ? S.heavyNow : S.pick)))
        return
      }
      const p = planTo(selected)
      if (!p) return
      legBox.appendChild(el('div', 'nvnav-to', `→ ${ctx.t(node(selected).name)}`))
      legBox.appendChild(el('div', 'nvnav-note', ctx.t(S.legHours, { h: p.d })))
      if (p.wind) legBox.appendChild(el('div', 'nvnav-note nvnav-windc', ctx.t(S.wind)))
      if (p.k === 0) legBox.appendChild(el('div', 'nvnav-note nvnav-okc', ctx.t(S.fits)))
      else legBox.appendChild(el('div', 'nvnav-note nvnav-warn', ctx.t(S.crosses, { k: p.k })))
      const busy = mode !== 'idle'
      if (p.k === 0) {
        const b = button(`${ctx.t(S.fly)} ⏎`, () => fly(false), true)
        b.disabled = busy
        legBox.appendChild(b)
        return
      }
      if (p.wait > 0 && p.kAfter === 0) {
        const b = button(`${ctx.t(S.waitFly, { h: p.wait })} ⏎`, () => fly(true), true)
        b.disabled = busy
        legBox.appendChild(b)
      }
      const burnLabel = `${ctx.t(S.flyBurn, { k: p.k, kw: ctx.t(crystalWord(p.k)) })}${p.k >= 2 ? ` · ${ctx.t(S.fireRisk)}` : ''} (C)`
      const b = button(burnLabel, () => fly(false), p.wait === 0 || p.kAfter > 0)
      b.disabled = busy || p.k > crystals
      if (p.k > crystals) b.title = ctx.t(S.needCrystals)
      legBox.appendChild(b)
      if (p.k > crystals && !(p.wait > 0 && p.kAfter === 0)) legBox.appendChild(el('div', 'nvnav-note nvnav-warn', ctx.t(S.tooLong)))
    }

    function select(id: string | null): void {
      if (mode !== 'idle') return
      if (id && !neighbours().some((o) => o.to === id)) return
      if (id !== selected) ctx.sfx('page')
      selected = id
      refresh()
    }

    // ------------------------------------------------------------------ actions
    function checkBudget(): boolean {
      if (time > BUDGET + 1e-9) {
        lose()
        return false
      }
      return true
    }

    function doWait(h: number, then?: () => void): void {
      if (h <= 0) {
        then?.()
        return
      }
      if (!then && mode !== 'idle') return
      mode = 'anim'
      refresh()
      ctx.sfx('tick')
      const t0 = time
      tween = {
        t: 0,
        dur: reduced ? 0.15 : Math.min(1.4, 0.06 * h + 0.2),
        update: (u) => {
          time = t0 + h * u
        },
        done: () => {
          time = t0 + h
          if (!then) addLog(ctx.t(S.waited, { h }))
          if (!checkBudget()) return
          if (then) then()
          else {
            mode = 'idle'
            refresh()
          }
        },
      }
    }

    function fly(waitFirst: boolean): void {
      if (mode !== 'idle' || !selected) return
      const to = selected
      const p = planTo(to)
      if (!p) return
      const opt = neighbours().find((o) => o.to === to)!
      if (waitFirst) {
        if (!(p.wait > 0 && p.kAfter === 0)) return
      } else if (p.k > crystals) return
      mode = 'anim'
      refresh()
      doWait(waitFirst ? p.wait : 0, () => launch(to, opt.leg))
    }

    function launch(to: string, leg: NavLeg): void {
      const d = legHours(leg, cur)
      const k = heavyCount(time, d)
      if (k > crystals) {
        mode = 'idle'
        refresh()
        return
      }
      const from = cur
      const curve = legCurve(node(from), node(to), leg.bend)
      const reverse = leg.a !== from
      const t0 = time
      const crystalsAtStart = crystals
      let burned = 0
      let wasHeavy = false
      ctx.sfx('whoosh')
      const burnOne = () => {
        if (burned >= k) return
        burned++
        crystals = Math.max(0, crystals - 1)
        ship.burn = 1
        ctx.sfx('fire')
        addLog(ctx.t(S.burned))
        for (let i = 0; i < (reduced ? 6 : 26); i++) {
          const a = Math.random() * Math.PI * 2
          const sp = 20 + Math.random() * 60
          sparks.push({ x: ship.x, y: ship.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8, max: 0.8, color: '#c79bff' })
        }
        refresh()
      }
      tween = {
        t: 0,
        dur: reduced ? 0.45 : clamp(d * 0.13, 0.9, 2.3),
        update: (u) => {
          const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2
          time = t0 + d * e
          const pt = curveAt(curve, reverse ? 1 - e : e)
          ship.x = pt.x
          ship.y = pt.y
          const tx = reverse ? -pt.tx : pt.tx
          if (Math.abs(tx) > 0.5) ship.dir = tx > 0 ? 1 : -1
          const heavy = isHeavy(time + 1e-6) && e < 1
          if (heavy && !wasHeavy) burnOne()
          wasHeavy = heavy
        },
        done: () => {
          time = t0 + d
          while (burned < k) burnOne()
          crystals = crystalsAtStart - k
          cur = to
          route.push(to)
          selected = null
          ship.x = node(to).x
          ship.y = node(to).y
          refresh()
          const after = () => arrive(to)
          if (k >= 2) fireCheck(after)
          else after()
        },
      }
    }

    function fireCheck(then: () => void): void {
      if (Math.random() >= 0.5) {
        then()
        return
      }
      ctx.sfx('fire')
      for (let i = 0; i < (reduced ? 8 : 40); i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6
        const sp = 20 + Math.random() * 50
        sparks.push({ x: ship.x, y: ship.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.2, max: 1.2, color: '#ff8a3a' })
      }
      const lostCrystal = crystals > 0
      showCard(FIRE.title, lostCrystal ? FIRE.crystal : FIRE.repair, [{ id: 'ok', label: S.ok, result: S.ok }], () => {
        if (lostCrystal) {
          crystals--
          choices.push('fire:crystal')
          refresh()
          then()
        } else {
          choices.push('fire:repair')
          mode = 'anim'
          doWait(FIRE_REPAIR, then)
        }
      })
    }

    function arrive(id: string): void {
      const n = node(id)
      addLog(ctx.t(S.landed, { place: ctx.t(n.name) }) + (n.flavor ? ` ${ctx.t(n.flavor)}` : ''))
      if (!checkBudget()) return
      if (id === def.end) {
        win()
        return
      }
      const ev = eventAt.get(id)
      if (ev && !resolved.has(id)) {
        resolved.add(id)
        const evDef = EVENTS[ev]
        ctx.sfx(ev === 'storm' ? 'whoosh' : ev === 'hunter' ? 'heartbeat' : 'chime')
        showCard(evDef.title, evDef.text, evDef.options, (o) => applyOption(ev, o, () => afterEvents(id)))
        return
      }
      afterEvents(id)
    }

    function afterEvents(id: string): void {
      const n = node(id)
      if (n.bones && !resolved.has(`bones:${id}`)) {
        resolved.add(`bones:${id}`)
        showCard(BONES.title, BONES.text, BONES.options, (o) => applyOption('bones', o, settle))
        return
      }
      settle()
    }

    function settle(): void {
      if (!checkBudget()) return
      mode = 'idle'
      refresh()
    }

    function applyOption(kind: string, o: EventOption, then: () => void): void {
      choices.push(`${kind}:${o.id}`)
      addLog(ctx.t(pick(o.result)))
      if (o.gain) {
        crystals += o.gain
        ctx.sfx('glyph')
      }
      const after = () => {
        refresh()
        then()
      }
      if (o.crystals) {
        crystals = Math.max(0, crystals - o.crystals)
        ship.burn = 1
        ctx.sfx('fire')
        refresh()
        if (o.crystals >= 2) {
          mode = 'anim'
          fireCheck(after)
          return
        }
      }
      if (o.hours) {
        mode = 'anim'
        doWait(o.hours, after)
        return
      }
      after()
    }

    let cardKeys: ((e: KeyboardEvent) => boolean) | null = null
    function showCard(title: Txt, text: Txt, options: EventOption[], onPick: (o: EventOption) => void): void {
      mode = 'event'
      refresh()
      evLayer.replaceChildren()
      const c = el('div', 'nv-panel nvnav-evc')
      c.appendChild(el('div', 'nvnav-evt', ctx.t(pick(title))))
      c.appendChild(el('div', 'nvnav-evx', ctx.t(pick(text))))
      const btns: HTMLButtonElement[] = []
      options.forEach((o, i) => {
        const cost: string[] = []
        if (o.hours) cost.push(`+${o.hours} h`)
        if (o.crystals) cost.push(`−${o.crystals} ${ctx.t(crystalWord(o.crystals))}`)
        if (o.gain) cost.push(`+${o.gain} ${ctx.t(crystalWord(o.gain))}`)
        if (o.crystals && o.crystals >= 2) cost.push(ctx.t(S.fireRisk))
        const b = button('', () => choose(o), i === 0)
        b.appendChild(document.createTextNode(`${options.length > 1 ? `${i + 1}. ` : ''}${ctx.t(pick(o.label))} `))
        if (cost.length) b.appendChild(el('span', 'nvnav-cost', `(${cost.join(', ')})`))
        if (o.crystals && o.crystals > crystals) {
          b.disabled = true
          b.title = ctx.t(S.needCrystals)
        }
        btns.push(b)
        c.appendChild(b)
      })
      evLayer.appendChild(c)
      evLayer.style.display = 'flex'
      const first = btns.find((b) => !b.disabled)
      first?.focus()
      let chosen = false
      function choose(o: EventOption): void {
        if (chosen) return
        chosen = true
        cardKeys = null
        evLayer.style.display = 'none'
        evLayer.replaceChildren()
        ctx.sfx('click')
        onPick(o)
      }
      cardKeys = (e) => {
        const n = Number(e.key)
        if (n >= 1 && n <= options.length && !btns[n - 1].disabled) {
          choose(options[n - 1])
          return true
        }
        if (e.key === 'Enter' || e.key === ' ') {
          // a focused card button handles Enter itself
          if (document.activeElement instanceof HTMLButtonElement && evLayer.contains(document.activeElement)) return false
          const i = btns.findIndex((b) => !b.disabled)
          if (i >= 0) {
            choose(options[i])
            return true
          }
        }
        return false
      }
    }

    function scoreNow(): number {
      const span = Math.max(1, BUDGET - OPTIMAL)
      const timeScore = clamp((BUDGET - time) / span, 0, 1)
      const crystalScore = START_CRYSTALS > 0 ? Math.min(1, crystals / START_CRYSTALS) : 1
      return Math.round(Math.max(0.1, 0.25 + 0.6 * timeScore + 0.15 * crystalScore) * 100) / 100
    }

    function win(): void {
      mode = 'ended'
      selected = null
      endInfo = { ok: true, t: 0 }
      ctx.sfx('success')
      const used = Math.round(time)
      card.hint.textContent = ctx.t(S.arrived, { place: ctx.t(node(def.end).name), d: Math.floor(used / 21), h: used % 21, c: crystals })
      card.hint.style.color = 'var(--nv-gold-bright)'
      refresh()
      const score = Math.min(1, scoreNow())
      const cont = button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { hoursUsed: used, crystalsLeft: crystals, choices: [...choices], route: [...route] } }), true)
      card.buttons.replaceChildren(cont)
      cont.focus()
    }

    function lose(): void {
      mode = 'ended'
      selected = null
      failures++
      endInfo = { ok: false, t: 0 }
      tween = null
      ctx.sfx('fail')
      card.hint.textContent = `${ctx.t(S.noSupplies)} ${ctx.t(UI_STRINGS.failed)}`
      card.hint.style.color = 'var(--nv-danger)'
      refresh()
      const retry = button(ctx.t(UI_STRINGS.retry), reset, true)
      card.buttons.replaceChildren(retry)
      if (ctx.assist.skipAllowed && failures >= 1) card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      retry.focus()
    }

    function reset(): void {
      time = 0
      crystals = START_CRYSTALS
      cur = def.start
      route = [def.start]
      choices = []
      resolved = new Set()
      selected = null
      mode = 'idle'
      tween = null
      endInfo = null
      ship = { x: node(def.start).x, y: node(def.start).y, dir: 1, burn: 0 }
      log = []
      logBox.replaceChildren()
      evLayer.style.display = 'none'
      card.hint.textContent = ctx.t(S.hint)
      card.hint.style.color = ''
      card.buttons.replaceChildren()
      refresh()
    }

    // ------------------------------------------------------------------ input
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * MW, y: ((e.clientY - r.top) / r.height) * MH }
    }
    const nodeAt = (x: number, y: number): string | null => {
      let best: string | null = null
      let bd = 22
      for (const n of def.nodes) {
        const d = Math.hypot(n.x - x, n.y - y)
        if (d < bd) {
          bd = d
          best = n.id
        }
      }
      return best
    }
    canvas.addEventListener('pointermove', (e) => {
      const p = local(e)
      const id = nodeAt(p.x, p.y)
      hover = id && mode === 'idle' && neighbours().some((o) => o.to === id) ? id : null
      canvas.style.cursor = hover ? 'pointer' : 'default'
    })
    canvas.addEventListener('pointerleave', () => {
      hover = null
    })
    canvas.addEventListener('pointerdown', (e) => {
      if (mode !== 'idle') return
      const p = local(e)
      const id = nodeAt(p.x, p.y)
      if (!id || !neighbours().some((o) => o.to === id)) return
      e.preventDefault()
      if (id === selected) {
        const pl = planTo(id)
        if (pl && pl.k === 0) fly(false)
        else if (pl && pl.wait > 0 && pl.kAfter === 0) fly(true)
        return
      }
      select(id)
    })

    ctx.onKey((e) => {
      if (finished) return
      if (mode === 'event' && cardKeys) {
        if (cardKeys(e)) e.preventDefault()
        return
      }
      if (mode !== 'idle') return
      const active = document.activeElement
      if ((e.key === 'Enter' || e.key === ' ') && active instanceof HTMLButtonElement && ctx.root.contains(active)) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= 9) {
        const opts = neighbours()
        if (opts[n - 1]) select(opts[n - 1].to)
        e.preventDefault()
        return
      }
      switch (e.code) {
        case 'Enter':
        case 'NumpadEnter':
        case 'Space': {
          if (!selected) return
          const pl = planTo(selected)
          if (!pl) return
          if (pl.k === 0) fly(false)
          else if (pl.wait > 0 && pl.kAfter === 0) fly(true)
          else fly(false)
          break
        }
        case 'KeyC':
          if (selected) fly(false)
          break
        case 'KeyW':
          doWait(1)
          break
        case 'KeyL':
          doWait(waitToLight(time))
          break
        case 'Escape':
          select(null)
          break
        default:
          return
      }
      e.preventDefault()
    })

    // ------------------------------------------------------------------ drawing
    function drawSai(): void {
      const cx = SC / 2
      const cy = SC / 2
      const R = 46
      sg.clearRect(0, 0, SC, SC)
      const ang = (h: number) => -Math.PI / 2 + (h / P) * Math.PI * 2
      // dial
      const dial = sg.createRadialGradient(cx, cy, 6, cx, cy, R + 6)
      dial.addColorStop(0, '#1d1830')
      dial.addColorStop(1, '#0b0912')
      sg.fillStyle = dial
      sg.beginPath()
      sg.arc(cx, cy, R + 6, 0, Math.PI * 2)
      sg.fill()
      // light and heavy arcs
      sg.lineWidth = 8
      sg.strokeStyle = 'rgba(243,217,149,0.85)'
      sg.beginPath()
      sg.arc(cx, cy, R, ang(0), ang(LIGHT))
      sg.stroke()
      sg.strokeStyle = 'rgba(200,40,60,0.9)'
      sg.beginPath()
      sg.arc(cx, cy, R, ang(LIGHT), ang(P))
      sg.stroke()
      // hour ticks
      sg.strokeStyle = 'rgba(10,8,14,0.85)'
      sg.lineWidth = 1
      for (let h = 0; h < P; h++) {
        const a = ang(h)
        sg.beginPath()
        sg.moveTo(cx + Math.cos(a) * (R - 4.5), cy + Math.sin(a) * (R - 4.5))
        sg.lineTo(cx + Math.cos(a) * (R + 4.5), cy + Math.sin(a) * (R + 4.5))
        sg.stroke()
      }
      // preview of the selected leg
      const now = cyc(time)
      if (selected && mode === 'idle') {
        const pl = planTo(selected)
        if (pl) {
          const start = pl.k > 0 && pl.wait > 0 && pl.kAfter === 0 ? now + pl.wait : now
          sg.lineWidth = 5
          for (let h = 0; h < pl.d; h += 0.25) {
            const t = start + h
            sg.strokeStyle = isHeavy(t + 0.01) ? 'rgba(255,90,106,0.95)' : 'rgba(95,242,224,0.9)'
            sg.beginPath()
            sg.arc(cx, cy, R - 11, ang(t), ang(Math.min(t + 0.27, start + pl.d)))
            sg.stroke()
          }
          if (start !== now) {
            sg.setLineDash([2, 3])
            sg.strokeStyle = 'rgba(236,228,212,0.55)'
            sg.lineWidth = 2
            sg.beginPath()
            sg.arc(cx, cy, R - 11, ang(now), ang(start))
            sg.stroke()
            sg.setLineDash([])
          }
        }
      }
      // hand with Sai
      const a = ang(now)
      sg.strokeStyle = 'rgba(243,217,149,0.9)'
      sg.lineWidth = 2
      sg.beginPath()
      sg.moveTo(cx, cy)
      sg.lineTo(cx + Math.cos(a) * (R - 14), cy + Math.sin(a) * (R - 14))
      sg.stroke()
      const mx = cx + Math.cos(a) * R
      const my = cy + Math.sin(a) * R
      const moon = sg.createRadialGradient(mx - 2, my - 2, 1, mx, my, 8)
      moon.addColorStop(0, '#ffe2a0')
      moon.addColorStop(1, '#c47a20')
      sg.fillStyle = moon
      sg.beginPath()
      sg.arc(mx, my, 7, 0, Math.PI * 2)
      sg.fill()
      sg.strokeStyle = 'rgba(255,226,160,0.8)'
      sg.lineWidth = 1
      sg.beginPath()
      sg.ellipse(mx, my, 12, 3.5, -0.4, 0, Math.PI * 2)
      sg.stroke()
      // centre text
      const heavy = isHeavy(time)
      sg.textAlign = 'center'
      sg.textBaseline = 'middle'
      sg.font = '700 11px Cinzel, serif'
      sg.fillStyle = heavy ? '#ff7a88' : '#f3d995'
      sg.fillText(ctx.t(heavy ? S.heavy : S.light), cx, cy - 7)
      sg.font = 'italic 11.5px "EB Garamond", serif'
      sg.fillStyle = 'rgba(236,228,212,0.8)'
      const rem = heavy ? P - now : LIGHT - now
      sg.fillText(ctx.t(heavy ? S.lightIn : S.heavyIn, { h: Math.round(rem * 10) / 10 }), cx, cy + 9)
    }

    function drawShip(x: number, y: number, dir: number, time2: number, burn: number): void {
      const bob = reduced ? 0 : Math.sin(time2 * 2.4) * 1.6
      g.save()
      g.fillStyle = 'rgba(40,24,10,0.18)'
      g.beginPath()
      g.ellipse(x, y + 16, 13, 3.5, 0, 0, Math.PI * 2)
      g.fill()
      g.translate(x, y - 14 + bob)
      g.scale(dir, 1)
      if (burn > 0) {
        const gl = g.createRadialGradient(0, 4, 2, 0, 4, 30)
        gl.addColorStop(0, `rgba(183,125,255,${0.7 * burn})`)
        gl.addColorStop(1, 'rgba(183,125,255,0)')
        g.fillStyle = gl
        g.beginPath()
        g.arc(0, 4, 30, 0, Math.PI * 2)
        g.fill()
      }
      // rigging
      g.strokeStyle = 'rgba(59,38,18,0.8)'
      g.lineWidth = 0.8
      g.beginPath()
      g.moveTo(-6, 5)
      g.lineTo(-4, 10)
      g.moveTo(6, 5)
      g.lineTo(4, 10)
      g.stroke()
      // envelope
      const env = g.createLinearGradient(0, -8, 0, 8)
      env.addColorStop(0, '#f6e7bf')
      env.addColorStop(0.6, '#d2b277')
      env.addColorStop(1, '#8c6a36')
      g.fillStyle = env
      g.strokeStyle = INK
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.strokeStyle = 'rgba(59,38,18,0.45)'
      g.beginPath()
      g.moveTo(-14, 0)
      g.lineTo(15, 0)
      g.moveTo(-6, -6.5)
      g.quadraticCurveTo(-8, 0, -6, 6.5)
      g.moveTo(5, -6.7)
      g.quadraticCurveTo(3, 0, 5, 6.7)
      g.stroke()
      // fins
      g.fillStyle = '#7a5428'
      g.beginPath()
      g.moveTo(-13, -3)
      g.lineTo(-21, -8)
      g.lineTo(-18, 0)
      g.lineTo(-21, 8)
      g.lineTo(-13, 3)
      g.closePath()
      g.fill()
      // gondola
      g.fillStyle = '#5a3b20'
      g.fillRect(-6, 10, 12, 4)
      g.fillStyle = burn > 0 ? '#e0b8ff' : '#f3d995'
      g.fillRect(-2, 11, 2, 2)
      // propeller
      const spin = Math.sin(time2 * 30)
      g.strokeStyle = 'rgba(59,38,18,0.8)'
      g.beginPath()
      g.moveTo(-8, 12 - 3 * spin)
      g.lineTo(-8, 12 + 3 * spin)
      g.stroke()
      g.restore()
    }

    function drawNodeIcon(n: NavNode, t2: number): void {
      const ev = eventAt.get(n.id)
      const x = n.x + 11
      const y = n.y - 12
      if (ev && !resolved.has(n.id)) {
        g.save()
        g.translate(x, y)
        g.strokeStyle = ev === 'hunter' ? '#7a1616' : ev === 'storm' ? '#2e4a66' : '#4a3a12'
        g.fillStyle = g.strokeStyle
        g.lineWidth = 1.3
        if (ev === 'storm') {
          g.beginPath()
          g.arc(-3, 0, 4, Math.PI * 0.8, Math.PI * 2)
          g.arc(3, 0, 4, Math.PI, Math.PI * 2.2)
          g.closePath()
          g.stroke()
          g.beginPath()
          g.moveTo(1, 2)
          g.lineTo(-1, 6)
          g.lineTo(1.5, 6)
          g.lineTo(-0.5, 10)
          g.stroke()
        } else if (ev === 'hunter') {
          g.beginPath()
          g.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2)
          g.fill()
          g.beginPath()
          g.moveTo(-5, 4)
          g.lineTo(5, 4)
          g.moveTo(6, 0)
          g.lineTo(10, -3)
          g.stroke()
        } else {
          for (const dx of [-4, 4]) {
            g.beginPath()
            g.moveTo(dx - 4, -1)
            g.quadraticCurveTo(dx - 2, -4, dx, -1)
            g.quadraticCurveTo(dx + 2, -4, dx + 4, -1)
            g.stroke()
          }
        }
        g.restore()
      }
      if (n.bones && !resolved.has(`bones:${n.id}`)) {
        const pulse = 0.6 + 0.4 * Math.sin(t2 * 3)
        g.save()
        g.translate(n.x - 12, n.y - 12)
        g.shadowColor = `rgba(183,125,255,${pulse})`
        g.shadowBlur = 8
        g.fillStyle = '#9257ff'
        g.beginPath()
        g.moveTo(0, -6)
        g.lineTo(3.5, 0)
        g.lineTo(0, 6)
        g.lineTo(-3.5, 0)
        g.closePath()
        g.fill()
        g.restore()
      }
    }

    ctx.loop((dt, t2) => {
      if (tween) {
        tween.t += dt
        const u = Math.min(1, tween.t / tween.dur)
        tween.update(u)
        if (u >= 1) {
          const done = tween.done
          tween = null
          done()
        }
        if (tween || mode !== 'idle') refreshLite()
      }
      ship.burn = Math.max(0, ship.burn - dt * 1.2)
      if (endInfo) endInfo.t += dt

      g.drawImage(art, 0, 0, MW, MH)
      const opts = mode === 'idle' ? neighbours() : []
      const reach = new Set(opts.map((o) => o.to))
      const focus = hover ?? selected
      const travelled = new Set<string>()
      for (let i = 0; i + 1 < route.length; i++) travelled.add([route[i], route[i + 1]].sort().join('|'))

      // legs
      for (const leg of def.legs) {
        const a = node(leg.a)
        const b = node(leg.b)
        const c = legCurve(a, b, leg.bend)
        const fromCur = leg.a === cur || leg.b === cur
        const other = leg.a === cur ? leg.b : leg.a
        const isFocus = fromCur && focus === other && mode === 'idle'
        const done = travelled.has([leg.a, leg.b].sort().join('|'))
        g.save()
        if (leg.wind) {
          const off = 6
          const dash = (t2 * 26) % 14
          const dirSign = leg.wind === 'ab' ? -1 : 1
          for (const s of [-1, 1]) {
            g.strokeStyle = 'rgba(40,150,170,0.55)'
            g.lineWidth = 1.2
            g.setLineDash([7, 7])
            g.lineDashOffset = reduced ? 0 : dirSign * dash
            g.beginPath()
            for (let k = 0; k <= 24; k++) {
              const u = k / 24
              const p = curveAt(c, u)
              const len = Math.hypot(p.tx, p.ty) || 1
              const nx = -p.ty / len
              const ny = p.tx / len
              const wob = Math.sin(u * 14 + t2 * 2) * 1.5
              const x = p.x + nx * (off + wob) * s
              const y = p.y + ny * (off + wob) * s
              if (k === 0) g.moveTo(x, y)
              else g.lineTo(x, y)
            }
            g.stroke()
          }
          g.setLineDash([])
          // chevrons showing the current's direction
          for (const u of [0.32, 0.68]) {
            const p = curveAt(c, u)
            let ang = Math.atan2(p.ty, p.tx)
            if (leg.wind === 'ba') ang += Math.PI
            g.save()
            g.translate(p.x, p.y)
            g.rotate(ang)
            g.strokeStyle = 'rgba(30,130,150,0.85)'
            g.lineWidth = 1.6
            g.beginPath()
            g.moveTo(-4, -4)
            g.lineTo(1, 0)
            g.lineTo(-4, 4)
            g.stroke()
            g.restore()
          }
        }
        g.beginPath()
        g.moveTo(c.ax, c.ay)
        g.quadraticCurveTo(c.cx, c.cy, c.bx, c.by)
        if (isFocus) {
          const pl = planTo(other)
          const bad = pl ? pl.k > 0 && !(pl.wait > 0 && pl.kAfter === 0) : false
          g.strokeStyle = bad ? 'rgba(170,30,40,0.9)' : 'rgba(176,117,20,0.95)'
          g.lineWidth = 3.4
          g.shadowColor = bad ? 'rgba(255,80,80,0.6)' : 'rgba(255,200,90,0.8)'
          g.shadowBlur = 8
        } else if (done) {
          g.strokeStyle = 'rgba(120,60,20,0.85)'
          g.lineWidth = 2.4
        } else if (fromCur && mode === 'idle') {
          g.strokeStyle = 'rgba(59,38,18,0.9)'
          g.lineWidth = 1.8
        } else {
          g.strokeStyle = 'rgba(59,38,18,0.5)'
          g.lineWidth = 1.1
          g.setLineDash([4, 4])
        }
        g.stroke()
        g.restore()
        // duration tag
        const m = curveAt(c, 0.5)
        const shown = fromCur && mode === 'idle' ? legHours(leg, cur) : Math.max(1, Math.round(leg.h * SCALE))
        const boosted = fromCur && mode === 'idle' && windHelps(leg, cur)
        const text = `${shown} h`
        g.font = `${fromCur && mode === 'idle' ? 700 : 600} 10px Cinzel, serif`
        const w = g.measureText(text).width + 8
        g.fillStyle = boosted ? 'rgba(214,244,240,0.95)' : 'rgba(246,234,204,0.92)'
        g.strokeStyle = boosted ? 'rgba(30,130,150,0.8)' : fromCur && mode === 'idle' ? 'rgba(59,38,18,0.8)' : 'rgba(59,38,18,0.35)'
        g.lineWidth = 1
        g.beginPath()
        g.rect(m.x - w / 2, m.y - 7, w, 14)
        g.fill()
        g.stroke()
        g.fillStyle = boosted ? '#145a66' : fromCur && mode === 'idle' ? INK : 'rgba(59,38,18,0.65)'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(text, m.x, m.y + 0.5)
      }

      // nodes
      const numberOf = new Map(opts.map((o, i) => [o.to, i + 1]))
      for (const n of def.nodes) {
        const isEnd = n.id === def.end
        const isStart = n.id === def.start
        const visited = route.includes(n.id)
        const r = isEnd || isStart ? 9 : 6.5
        if (reach.has(n.id)) {
          const pulse = 0.5 + 0.5 * Math.sin(t2 * 4)
          g.strokeStyle = `rgba(176,117,20,${0.5 + 0.4 * pulse})`
          g.lineWidth = n.id === focus ? 3 : 2
          g.beginPath()
          g.arc(n.x, n.y, r + 5 + (n.id === focus ? 2 : pulse * 1.5), 0, Math.PI * 2)
          g.stroke()
        }
        g.fillStyle = visited ? '#8a5a26' : isEnd ? '#f3d995' : '#f6eacc'
        g.strokeStyle = INK
        g.lineWidth = 1.5
        g.beginPath()
        g.arc(n.x, n.y, r, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        if (isEnd) {
          g.fillStyle = INK
          g.beginPath()
          for (let k = 0; k < 10; k++) {
            const a = -Math.PI / 2 + (k * Math.PI) / 5
            const rr = k % 2 ? 2.4 : 6
            if (k === 0) g.moveTo(n.x + Math.cos(a) * rr, n.y + Math.sin(a) * rr)
            else g.lineTo(n.x + Math.cos(a) * rr, n.y + Math.sin(a) * rr)
          }
          g.closePath()
          g.fill()
        } else if (isStart) {
          g.fillStyle = INK
          g.fillRect(n.x - 3, n.y - 3, 6, 6)
        }
        drawNodeIcon(n, t2)
        // label
        g.font = `${isEnd || isStart ? '700 12px Cinzel' : 'italic 13px "EB Garamond"'}, serif`
        g.textAlign = n.la ?? 'center'
        g.textBaseline = 'middle'
        const lx = n.x + (n.lx ?? 0)
        const ly = n.y + (n.ly ?? 18)
        g.lineWidth = 3.5
        g.strokeStyle = 'rgba(244,232,202,0.9)'
        g.strokeText(ctx.t(n.name), lx, ly)
        g.fillStyle = isEnd ? '#6e3c08' : INK
        g.fillText(ctx.t(n.name), lx, ly)
        const num = numberOf.get(n.id)
        if (num) {
          const bx = n.x - 13
          const by = n.y + 10
          g.fillStyle = n.id === focus ? '#b07514' : 'rgba(59,38,18,0.85)'
          g.beginPath()
          g.arc(bx, by, 7, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#f6eacc'
          g.font = '700 9px Cinzel, serif'
          g.textAlign = 'center'
          g.fillText(String(num), bx, by + 0.5)
        }
      }

      drawShip(ship.x, ship.y, ship.dir, t2, ship.burn)

      // sparks
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life -= dt
        if (s.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vy -= 10 * dt
        g.globalAlpha = Math.min(1, s.life / s.max)
        g.fillStyle = s.color
        g.fillRect(s.x, s.y - 14, 2, 2)
      }
      g.restore()

      // heavy hour tint
      if (isHeavy(time)) {
        g.fillStyle = 'rgba(90,10,20,0.10)'
        g.fillRect(0, 0, MW, MH)
      }

      if (endInfo) {
        const a = Math.min(1, endInfo.t * 2)
        g.save()
        g.globalAlpha = a
        g.fillStyle = endInfo.ok ? 'rgba(244,230,196,0.88)' : 'rgba(40,10,10,0.55)'
        g.fillRect(0, MH / 2 - 44, MW, 88)
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.font = '700 24px Cinzel, serif'
        g.fillStyle = endInfo.ok ? '#6e3c08' : '#ffb0b8'
        g.fillText(endInfo.ok ? ctx.t(S.arrivedShort).toUpperCase() : ctx.t(S.noSupplies), MW / 2, MH / 2 - 12)
        if (endInfo.ok) {
          const used = Math.round(time)
          g.font = 'italic 16px "EB Garamond", serif'
          g.fillStyle = INK
          g.fillText(
            ctx.t(S.stats, { d: Math.floor(used / 21), h: used % 21, s: dh(Math.max(0, BUDGET - used)), c: crystals }),
            MW / 2,
            MH / 2 + 18,
          )
        }
        g.restore()
      }

      drawSai()
    })

    let lastLite = ''
    function refreshLite(): void {
      const key = `${Math.round(time)}|${crystals}|${mode}`
      if (key === lastLite) return
      lastLite = key
      const day = Math.floor(time / 21) + 1
      timeVal.textContent = ctx.t(S.time, { d: day, h: Math.round(time % 21) })
      const left = Math.max(0, BUDGET - time)
      supVal.textContent = dh(left)
      barFill.style.width = `${(left / BUDGET) * 100}%`
    }

    addLog(ctx.t(S.pick))
    refresh()
  })
}

registerMinigame('navigation', () => ({ run: runNavigation }))
