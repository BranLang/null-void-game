/**
 * The outer ruins of Kitsune (Kapitola 15). Tami leads, Flint follows. The
 * watchers at the edge of vision only look, unless you walk toward them.
 * Crystals from the ribs of the dead; the best one cracks. In the temple under
 * the broken dome the watchers withdraw, and something with a direction comes.
 */
import type { AmbienceDef, ActorDef, MapDef, PlacedProp, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { cellSet, newWatchers, placeLeader, resetWatchers, updateLeader, updateSlip, updateWatchers, type Leader, type SlipState, type WatchState } from './util'
import './props'

const ROWS = [
  'wwwwwwwwwwwww###################;;',
  'w;;;,,;;;;;;;#oooooooooooooooooo;T',
  'w;,,,,;;;;;;;#ooooooooOooooooooo;;',
  'w;,,,;;;;;;;;#ooooooOOOOOoooooooT;',
  'w;;;;;;;;;;;;#ooooooOOOOOooooooo;;',
  'w;;;;;::;;;;;#oooooOOOOOOOoooooo;T',
  'w;;;;::::;;;;hooooooOOOOOooooooo;;',
  'w;;;;;::;;;;;hooooooOOOOOoooooooT;',
  'w;;;;;;;;;;;;#ooooooooOooooooooo;;',
  'w;;,,;;;;;;;;#oooooooooooooooooo;T',
  'w;;,,;;;;;;;;#oooooooooooooooooo;;',
  'w;;;;;;;;;;;;#BBooooBoooBBBoooBB;;',
  'w;;;;;;;;;;::............;;;;;;;;;',
  'wwbbbwwwwwwww............;;;;;;;;;',
  'w,,,ffffffffb.:..........;;;T;;;;;',
  'w,,fffffffffb.,,.........BBBBBBBBB',
  'wfffffffffffb.,,.........Bx123456x',
  'wfffffffffffb............Bxxxxxxxx',
  'wffffffffffff............Bxxxxxxxx',
  'wffffffffffff............xxxxxxxxx',
  'wffffffffffff.........;..xxxxxxxxx',
  'wffffffffffff.........,,.Bxxxxxxxx',
  'wfffffffffffb...:....:,..Bxxxxxxxx',
  'wfffffffffffb............Bxxxxxxxx',
  'wfffffffffffb.,..........Bxxxxxxxx',
  'wbbfbbbbbfbbb.,..........BBxBBBxBB',
  'TTTTTTTTTTTTT......,,....T;;;;;;;T',
  'TTTTTTTTTTTTT......,,....;;;;;;;;;',
  'TTTTTTTTTTTTT...........;;;;;;;T;;',
  'TTTTTTTTTTTTT;..........;;;;;;;;;;',
  'TTTTTTTTTTTTT;;.........;T;;;;;;;T',
  'ssssssssssssssssssssssssssssssssss',
  'TTTTTTTTTTTTTTTTeeeeeTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTeeeeeTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTeeeeeTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTeeeeeTTTTTTTTTTTTT',
]

const MAP: MapDef = {
  rows: ROWS,
  legend: {
    w: { floor: 'stone', wall: 'stone', wallH: 2.6 },
    '#': { floor: 'stone', wall: 'white', wallH: 3.2 },
    b: { floor: 'stone', wall: 'stone', wallH: 0.9 },
    B: { floor: 'marble', wall: 'white', wallH: 1.1 },
    '.': { floor: 'cobble', tint: '#98a292' },
    ':': { floor: 'dirt', tint: '#7e7e62' },
    ',': { floor: 'moss', tint: '#8cb874' },
    ';': { floor: 'grass', tint: '#6c9658' },
    o: { floor: 'marble', tint: '#bfc4b8' },
    O: { floor: 'stone', tint: '#e6ebe2', tag: 'ring' },
    f: { floor: 'stone', tint: '#8a9084' },
    h: { floor: 'dirt', tint: '#6a6050', tag: 'hole' },
    x: { floor: 'gravel', tint: '#8a8a7a' },
    '1': { floor: 'stone', h: 1, stairs: true, tint: '#bdbdae' },
    '2': { floor: 'stone', h: 2, stairs: true, tint: '#b2b2a4' },
    '3': { floor: 'stone', h: 3, stairs: true, tint: '#bdbdae' },
    '4': { floor: 'stone', h: 4, stairs: true, tint: '#b2b2a4' },
    '5': { floor: 'stone', h: 5, stairs: true, tint: '#bdbdae' },
    '6': { floor: 'stone', h: 6, stairs: true, tint: '#b2b2a4' },
    T: { floor: 'grass', tint: '#587a48' },
    s: { floor: 'dirt', tint: '#7a6a50', tag: 'signs' },
    e: { floor: 'dirt', tint: '#86765a' },
  },
}

const MOSS = cellSet(ROWS, ',')

const amb: AmbienceDef = {
  sky: { top: '#56645a', bottom: '#93a196', stars: 0, clouds: 0.4 },
  fog: { color: '#6c7b6c', near: 4, far: 24 },
  hemi: { sky: '#b4c6ae', ground: '#2e3a2a', intensity: 1.05 },
  sun: { color: '#dfe8d8', intensity: 0.62, dir: [-0.3, 1, 0.45] },
  exposure: 1.0,
  bloom: { strength: 0.85, radius: 0.6, threshold: 0.76 },
  grade: { tint: '#dfe8da', saturation: 0.78, contrast: 1.1, vignette: 0.52, grain: 0.05 },
  particles: [
    { kind: 'rain', count: 240, id: 'rain' },
    { kind: 'rain', count: 220, area: [19, 2, 25, 8], id: 'ringrain' },
    { kind: 'spores', count: 50, color: '#a8f0a0', id: 'spores' },
    { kind: 'leaves', count: 22 },
  ],
  music: 'null_void',
  sounds: ['rain', 'drone', 'forest'],
}

// ---------------------------------------------------------------------------------- actors
const WATCH: [string, Vec2][] = [
  ['w1', [30, 28]],
  ['w2', [33, 12]],
  ['w3', [1, 23]],
  ['w4', [11, 24]],
  ['w5', [33, 23]],
  ['w6', [15, 1]],
  ['w7', [30, 2]],
  ['w8', [2, 4]],
]
const watchers = newWatchers(WATCH)
const wst: WatchState = { prev: null, barkT: 0, failing: false }
const slip: SlipState = { last: '', t: 0, count: 0, standAt: 0 }

const walk1: Leader = {
  id: 'tami',
  path: [
    [18, 32],
    [18, 30],
    [17, 27],
    [15, 24],
    [14, 21],
    [12, 20],
    [9, 18],
    [6, 16],
  ],
  key: 'c10.wp1',
  near: 3.4,
  speed: 2.3,
  busy: false,
}
const walk2: Leader = {
  id: 'tami',
  path: [
    [3, 16],
    [7, 18],
    [10, 19],
    [13, 19],
    [18, 18],
    [22, 19],
    [24, 19],
    [27, 19],
    [29, 18],
  ],
  key: 'c10.wp2',
  near: 3.4,
  speed: 2.4,
  busy: false,
}
const walk3: Leader = {
  id: 'tami',
  path: [
    [29, 18],
    [26, 19],
    [23, 16],
    [21, 13],
    [21, 11],
    [21, 8],
    [21, 6],
  ],
  key: 'c10.wp3',
  near: 3.4,
  speed: 2.4,
  busy: false,
}

const TAMI_RUN: Vec2[] = [
  [14, 6],
  [12, 7],
  [11, 10],
  [13, 12],
  [16, 14],
  [17, 18],
  [17, 21],
  [18, 24],
  [19, 29],
  [19, 33],
]
const STORM_START: Vec2 = [27, 2]
const FAIL_WATCH = l('Otočil si sa za pohybom. A pohyb sa otočil za tebou.', 'You turned toward the movement. And the movement turned toward you.')

const actors: ActorDef[] = [
  {
    id: 'tami',
    character: 'tami',
    at: [18, 32],
    facing: 135,
    solid: false,
    talk: async (g) => {
      g.face('tami', 'player')
      const stage = g.flag('c10.stage')
      if (stage === 'walk1') {
        await g.say('tami', l('Za mnou. Nosom. Mach nie. A neotáčaj sa.', 'Behind me. Through your nose. No moss. And don’t turn.'))
        const c = await g.choose([
          { id: 'why', text: l('Prečo sa nesmiem otáčať?', 'Why can’t I turn?') },
          { id: 'ok', text: l('Rozkaz, kapitánka.', 'Aye, Captain.') },
        ])
        if (c === 'why') {
          await g.say('tami', l('Lebo kým sa na nich nepozeráš, nemajú dôvod pozerať sa na teba.', 'Because as long as you don’t look at them, they have no reason to look at you.'))
          await g.say('tami', l('Nechoď k nim. Nestoj pri nich. Ide sa svojou cestou.', 'Don’t walk toward them. Don’t stand by them. You keep to your own path.'))
        } else await g.say('tami', l('Hm.', 'Hm.'))
      } else if (stage === 'walk2' || stage === 'walk3') {
        await g.say('tami', l('Ešte kúsok. Drž sa.', 'A little further. Stay close.'))
      } else {
        await g.say('tami', l('Tichšie.', 'Quieter.'))
      }
    },
  },
  ...WATCH.map(
    ([id, at]): ActorDef => ({ id, character: 'phantom', at, hidden: true, facing: 315, phantom: { form: 'watcher' } }),
  ),
]

// ---------------------------------------------------------------------------------- props
const props: PlacedProp[] = [
  // temple: white pillars around the ring of grey light under the broken dome
  { type: 'pillar', at: [18, 2], params: { h: 3.4, style: 'white' } },
  { type: 'pillar', at: [26, 2], params: { h: 3.4, style: 'white' } },
  { type: 'pillar', at: [17, 5], params: { h: 3.4, style: 'white' } },
  { type: 'pillar', at: [27, 5], params: { h: 3.4, style: 'white' } },
  { type: 'pillar', at: [18, 8], params: { h: 3.4, style: 'white', broken: true } },
  { type: 'pillar', at: [26, 8], params: { h: 3.4, style: 'white' } },
  { type: 'pillar', at: [15, 9], params: { broken: true, style: 'white' } },
  { type: 'pillar', at: [29, 9], params: { broken: true, style: 'white' } },
  { type: 'vine_pillar', at: [30, 6], params: { h: 3 } },
  { type: 'rock', at: [24, 9], params: { size: 1.3 } },
  { type: 'rock', at: [19, 10] },
  { type: 'boulder', at: [16, 1] },
  { type: 'mushroom', at: [14, 1], color: '#8aff9a' },
  { type: 'mushroom', at: [31, 10], color: '#8aff9a' },
  { type: 'roots', at: [13, 6], rot: 90 },
  { type: 'roots', at: [13, 7], rot: 80 },
  // courtyard, overgrown
  { type: 'fountain', at: [6, 6] },
  { type: 'tree', at: [9, 3], params: { canopy: '#3f6e42', size: 1.2 } },
  { type: 'deadtree', at: [3, 8] },
  { type: 'bush', at: [10, 9] },
  { type: 'bush', at: [4, 1] },
  { type: 'statue_pedestal', at: [8, 10] },
  { type: 'mushroom', at: [2, 10], color: '#8aff9a' },
  { type: 'mushroom', at: [11, 2], color: '#8aff9a' },
  { type: 'flowers', at: [5, 2], params: { glow: true } },
  { type: 'grass', at: [7, 8] },
  { type: 'grass', at: [11, 5] },
  // warehouse: pillars, beams, the dead along the back wall
  { type: 'pillar', at: [4, 18], params: { h: 2.6, style: 'stone' } },
  { type: 'pillar', at: [8, 18], params: { h: 2.6, style: 'stone', broken: true } },
  { type: 'pillar', at: [4, 22], params: { h: 2.6, style: 'stone', broken: true } },
  { type: 'pillar', at: [8, 22], params: { h: 2.6, style: 'stone' } },
  { type: 'log', at: [6, 20], rot: 30 },
  { type: 'crate', at: [10, 15] },
  { type: 'crate', at: [11, 16], params: { stack: 2 } },
  { type: 'barrel', at: [9, 23], params: { lying: true } },
  { type: 'barrel', at: [2, 20], params: { lying: true } },
  { type: 'rock', at: [10, 21] },
  { type: 'mushroom', at: [1, 17], color: '#8aff9a' },
  { type: 'mushroom', at: [11, 22], color: '#8aff9a' },
  { type: 'roots', at: [3, 24], rot: 10 },
  { type: 'ch10_bones', at: [4, 14], params: { pose: 'sit' } },
  { type: 'ch10_bones', at: [5, 14], params: { pose: 'heap' } },
  { type: 'ch10_bones', at: [6, 14], params: { pose: 'sit', cloth: '#3a4652' } },
  { type: 'ch10_bones', at: [7, 14], params: { pose: 'lean' } },
  { type: 'ch10_bones', at: [1, 14], params: { pose: 'sit', cloth: '#5a3a30' } },
  // the street: pillars like the bleached bones of giants, roots through the paving
  { type: 'vine_pillar', at: [24, 13], params: { h: 3.2 } },
  { type: 'pillar', at: [13, 27], params: { h: 3.6, style: 'white' } },
  { type: 'pillar', at: [24, 24], params: { broken: true, style: 'white' } },
  { type: 'pillar', at: [23, 28], params: { h: 3.2, style: 'white' } },
  { type: 'jungle_tree', at: [28, 13] },
  { type: 'jungle_tree', at: [5, 28] },
  { type: 'jungle_tree', at: [31, 29] },
  { type: 'tree', at: [10, 28], params: { canopy: '#3f6e42' } },
  { type: 'roots', at: [16, 22], rot: 20, id: 'root' },
  { type: 'roots', at: [18, 22], rot: -30 },
  { type: 'roots', at: [20, 22], rot: 70 },
  { type: 'grass', at: [22, 20] },
  { type: 'grass', at: [13, 30] },
  { type: 'bush', at: [24, 27] },
  // the stair ruin
  { type: 'rock', at: [27, 22] },
  { type: 'rock', at: [32, 20], params: { moss: true } },
  { type: 'crystal', at: [32, 24], scale: 0.6 },
  { type: 'mushroom', at: [26, 24], color: '#8aff9a' },
  { type: 'ch10_bones', at: [30, 17], params: { pose: 'lean' } },
  { type: 'ch10_bones', at: [31, 17], params: { pose: 'sit', best: true }, id: 'best' },
  { type: 'ch10_bones', at: [31, 17], params: { pose: 'sit', dead: true, crystals: true }, id: 'dead', hidden: true },
  { type: 'ch10_bones', at: [32, 17], params: { pose: 'heap', cloth: '#3a4652' } },
  // the line of signs and the forest beyond
  { type: 'sign', at: [5, 31] },
  { type: 'sign', at: [11, 31] },
  { type: 'sign', at: [15, 31] },
  { type: 'sign', at: [22, 31] },
  { type: 'sign', at: [28, 31] },
  { type: 'sign', at: [33, 31] },
  { type: 'tree', at: [12, 33] },
  { type: 'tree', at: [24, 33] },
  { type: 'tree', at: [6, 34] },
  { type: 'tree', at: [29, 34] },
  { type: 'bush', at: [14, 34] },
  { type: 'bush', at: [22, 35] },
]

// ---------------------------------------------------------------------------------- helpers
let chaseT = 0
let dustT = 0
let tamiRunning = false

function stage(g: GameAPI): string {
  return String(g.flag('c10.stage') ?? '')
}

function showWatchers(g: GameAPI, on: boolean): void {
  for (const w of watchers) g.show(w.id, on)
}

async function runTami(g: GameAPI, from: number): Promise<void> {
  tamiRunning = true
  for (let i = from; i < TAMI_RUN.length; i++) await g.walk('tami', TAMI_RUN[i], { run: true, speed: 4.3 })
  tamiRunning = false
}

function stormOn(g: GameAPI, at: Vec2): void {
  g.spawn({ id: 'storm', character: 'phantom', at, phantom: { form: 'humanoid', fibers: 34, reach: 3.4, speed: 0.1 } })
  g.music('combat_epic_2', 600)
  void g.atmosphere(
    {
      fog: { color: '#262c28', near: 3, far: 17 },
      hemi: { sky: '#7a8a80', ground: '#141814', intensity: 0.8 },
      grade: { tint: '#d0dad0', saturation: 0.55, contrast: 1.16, vignette: 0.66 },
      sounds: ['storm', 'drone'],
    },
    900,
  )
  g.stealth(true)
  chaseT = 0
  dustT = 0
}

/** The chase to the signs (also re-derived after a retry). */
function setupChase(g: GameAPI): void {
  for (const w of watchers) g.despawn(w.id)
  const tripped = !!g.flag('c10.tripped')
  stormOn(g, tripped ? [17, 15] : STORM_START)
  g.objective(l('Utekaj za Tami! K značkám!', 'Run after Tami! To the signs!'))
  g.hint(l('Drž Shift a bež. Neotáčaj sa.', 'Hold Shift and run. Don’t turn.'))
  if (!tamiRunning) {
    if (tripped) {
      const p = g.pos('player')
      g.teleport('tami', [Math.min(24, p[0] + 1), p[1]])
      void g.walk('tami', [19, 33], { run: true, speed: 4.4 })
    } else {
      g.teleport('tami', [21, 6])
      void runTami(g, 0)
    }
  }
}

// ---------------------------------------------------------------------------------- scene
export const ruinsScene: SceneDef = {
  id: 'c10_ruins',
  name: l('Vonkajšie ruiny', 'The Outer Ruins'),
  ambience: amb,
  camera: { zoom: 1 },
  map: MAP,
  props,
  player: { character: 'flint', at: [18, 34], facing: 135 },
  spawns: { entry: [18, 34] },
  actors,
  stealth: { failText: l('Búrka mala smer. Dobehla ho.', 'The storm had a direction. It caught him.') },
  interactables: [
    {
      id: 'corner',
      at: [1, 14],
      label: l('Posledná kostra', 'The last skeleton'),
      verb: 'use',
      radius: 1.9,
      when: (g) => stage(g) === 'b1',
      run: async (g) => {
        g.cinematic(true)
        g.objective(null)
        await g.walk('player', [2, 15])
        g.face('player', [1, 14])
        await g.walk('tami', [1, 15])
        g.pose('tami', 'kneel')
        g.pose('player', 'kneel')
        await g.narrate(l('Stalo sa to jednoducho.', 'It happened simply.'))
        await g.narrate(l('Dopracovali sa k poslednej kostre, piatej, v zadnom rohu, odkiaľ bolo vidno cez rozbitú stenu do zarasteného dvorka. Tami uložila posledný kryštál do vaku. Pozrela na neho.', 'They worked their way to the last skeleton, the fifth, in the back corner, where you could see through the broken wall into an overgrown courtyard. Tami put the last crystal in the bag. She looked at him.'))
        g.face('tami', 'player')
        g.face('player', 'tami')
        await g.focus('tami', { ms: 900, zoom: 1.5 })
        g.mood('tami', 'tender')
        await g.narrate(l('Prach na jeho líci, čierny, z kostí. Zotrela ho palcom. Jej ruka zostala. A chvela sa.', 'Dust on his cheek, black, from the bones. She wiped it away with her thumb. Her hand stayed. And it trembled.'))
        await g.narrate(l('Drsnáčka, čo včera stála pred prízrakom bez mrknutia, mala oči, aké na nej nepoznal.', 'The hard one who had stood before a phantom yesterday without a blink had eyes he had never seen on her.'))
        await g.narrate(l('Flint nedýchal. Pohol sa on.', 'Flint wasn’t breathing. He was the one who moved.'))
        await g.fade('black', 1600)
        g.music('moss', 2000)
        await g.caption(l('Mach pod chrbtom, lístie vo vlasoch, tiene na periférii, čo pozerali. A bolo im to jedno.', 'Moss under his back, leaves in their hair, the shadows at the edges watching. And they did not care.'), { ms: 4200 })
        await g.narrate(l('Zblízka bola iná. Nie kapitánka, nie gōstar. Dievča s prachom mŕtvych vo vlasoch, čo sa ho držalo pevne, pridlho, akoby to teplo bolo jediné, čo si za celý deň dovolila.', 'Up close she was different. Not the captain, not the gōstar. A girl with the dust of the dead in her hair, holding on to him tight, too long, as if that warmth were the only thing she had allowed herself all day.'))
        await g.narrate(l('Nechcela jeho. Chcela, aby tu niekto bol. Aby aspoň na chvíľu nebola sama medzi kosťami, ktoré si prišla obrať.', 'It wasn’t him she wanted. She wanted someone to be there. Not to be alone, for a little while, among the bones she had come to pick clean.'))
        g.teleport('player', [2, 15], 315)
        g.teleport('tami', [3, 14], 315)
        g.pose('player', 'lie')
        g.pose('tami', 'lie')
        g.mood('tami', 'neutral')
        await g.focus([2, 14], { ms: 10, zoom: 1.45 })
        await g.fade('clear', 1600)
        await g.narrate(l('Ležali na machu v tichu. Lístie vo vlasoch, na kolenách, v ušiach. Flint sa díval na oblohu skrz stromy.', 'They lay on the moss in silence. Leaves in their hair, on their knees, in their ears. Flint looked up at the sky through the trees.'))
        await g.say('player', l('Pozerajú.', 'They’re watching.'))
        await g.say('tami', l('Vždy pozerajú.', 'They always watch.'))
        await g.say('player', l('Neruší ťa to?', 'Doesn’t it bother you?'))
        g.mood('tami', 'tender')
        await g.say('tami', l('Zvykneš si.', 'You get used to it.'), { mood: 'tender' })
        await g.say('player', l('Na mach sa vraj nestúpa. Ležať sa naň zrejme smie.', 'One doesn’t step on moss, apparently. Lying on it seems to be allowed.'), { thought: true, mood: 'happy' })
        g.pose('tami', 'stand')
        g.teleport('tami', [3, 15])
        await g.narrate(l('Vstala. Oprášila si kolená. Podala mu ruku. Jej dlaň bola tvrdá, mozolnatá, silnejšia, než by čakal. Vytiahla ho na nohy.', 'She got up. Brushed off her knees. Held out her hand. Her palm was hard, callused, stronger than he expected. She pulled him to his feet.'))
        g.pose('player', 'stand')
        g.face('tami', 'player')
        await g.say('tami', l('Ešte dve miesta. Potom ideme.', 'Two more places. Then we go.'))
        g.follow()
        await g.zoom(1, 600)
        g.music('null_void', 1500)
        g.set('c10.stage', 'walk2')
        g.set('c10.wp2', 0)
        walk2.busy = false
        g.cinematic(false)
        g.objective(l('Za Tami k druhej budove.', 'Follow Tami to the second building.'))
        g.checkpoint()
      },
    },
    {
      id: 'three',
      at: [31, 17],
      label: l('Traja pod schodmi', 'The three beneath the stairs'),
      verb: 'use',
      radius: 1.8,
      when: (g) => stage(g) === 'b2',
      run: async (g) => {
        g.cinematic(true)
        g.objective(null)
        await g.walk('player', [31, 18])
        g.face('player', [31, 17])
        g.pose('player', 'kneel')
        await g.focus([31, 17], { ms: 800, zoom: 1.55 })
        await g.narrate(l('Najlepší kryštál dňa bol v chrbtici toho prostredného, zarastený hlboko medzi dvoma stavcami, fialový až do čierna, s jadrom, čo pulzovalo pomaly ako tep pod kožou.', 'The best crystal of the day was in the spine of the one in the middle, grown deep between two vertebrae, violet shading to black, with a core that pulsed slowly, like a heartbeat under skin.'))
        await g.narrate(l('Flint nasadil kliešte a otočil zápästím, tak ako v Diss otváral mušle.', 'Flint set the pliers and turned his wrist, the way he used to open mussels in Diss.'))
        g.sfx('crack')
        g.flash('#b77dff', 260)
        g.shake(0.08, 200)
        g.propVisible('best', false)
        g.propVisible('dead', true)
        g.set('c10.cracked')
        await g.narrate(l('Kryštál praskol. Suché cvaknutie, ako keď kohútik udrie naprázdno, a žiara vytiekla ako lieh z prevrátenej lampy. Za jeden nádych bol matný a sivý. Prázdny.', 'The crystal cracked. A dry click, like a hammer falling on an empty chamber, and the glow ran out of it like spirit from an overturned lamp. In one breath it was dull and grey. Empty.'))
        await g.say('player', l('Kark.', 'Kark.'), { mood: 'angry' })
        await g.walk('tami', [30, 18])
        g.pose('tami', 'kneel')
        g.face('tami', [31, 17])
        await g.narrate(l('Tami si kľakla vedľa neho. Vzala mu kliešte z prstov a nasadila ich na susedný kryštál, menší, ktorý by prehliadol. Čeľuste priložila v smere, ktorým rástol, a potom už len tlačila, bez krútenia.', 'Tami knelt beside him. She took the pliers from his fingers and set them on the next crystal, a smaller one he would have missed. She laid the jaws along the way it had grown, and then she only pressed, without twisting.'))
        await g.narrate(l('Vyšiel celý, tak ako sa filé stiahne z ryby jedným ťahom po hrebeni.', 'It came out whole, the way a fillet comes off a fish in one pull along the spine.'))
        await g.say('tami', l('Po vlákne. Nikdy naprieč.', 'Along the grain. Never across.'))
        await g.narrate(l('Vrátila mu ich. Mŕtvy nechali tam, kde bol.', 'She gave them back to him. They left the dead one where it was.'))
        const r = await g.minigame('crystal', { need: 4, time: 55 })
        if (r.success) {
          await g.narrate(l('Ďalší urobil tak, ako povedala. Aj ďalší. Pri piatom už zápästie poslúchalo samo.', 'He did the next one the way she said. And the next. By the fifth his wrist obeyed on its own.'))
        } else {
          await g.narrate(l('Ešte dva mu zošedli, kým zápästie pochopilo. Potom ďalší vyšiel celý. Aj ďalší.', 'Two more went grey on him before his wrist understood. Then the next came out whole. And the next.'))
        }
        g.pose('player', 'stand')
        g.pose('tami', 'stand')
        g.follow()
        await g.zoom(1, 500)
        await g.narrate(l('A keď zdvihol hlavu, tiene na okraji miestnosti stáli tam, kde predtým, a pozerali.', 'And when he raised his head, the shadows at the edge of the room stood where they had stood before, and watched.'))
        g.set('c10.stage', 'walk3')
        g.set('c10.wp3', 0)
        walk3.busy = false
        g.cinematic(false)
        g.objective(l('Za Tami. Posledné miesto.', 'Follow Tami. The last place.'))
        g.checkpoint()
      },
    },
  ],
  triggers: [
    {
      id: 'first',
      area: [13, 25, 25, 29],
      when: (g) => stage(g) === 'walk1' && !g.flag('c10.watchersOn'),
      run: async (g) => {
        g.set('c10.watchersOn')
        g.cinematic(true)
        await g.narrate(l('Prvý z nich sa objavil po krátkej chvíli.', 'The first of them appeared after a short while.'))
        g.show('w1', true)
        await g.focus('w1', { ms: 900, zoom: 1.15 })
        await g.narrate(l('Nie priamo. Nikdy priamo. V kútiku oka, na samom okraji zorného poľa, tam, kde mozog ešte nevie, či to bolo skutočné alebo vymyslené.', 'Not directly. Never directly. In the corner of his eye, at the very edge of his vision, where the mind can’t yet tell whether it was real or imagined.'))
        await g.narrate(l('Pohyb. Tmavší než tieň stromu, rýchlejší než vietor.', 'Movement. Darker than the shadow of a tree, faster than the wind.'))
        g.show('w1', false)
        await g.wait(700)
        await g.narrate(l('A keď tam stočil oči, nič. Len stena. Len mach. Len prázdno.', 'And when he turned his eyes there, nothing. Only a wall. Only moss. Only emptiness.'))
        g.show('w1', true)
        await g.focus('player', { ms: 700, zoom: 1 })
        g.follow()
        await g.narrate(l('Srdce mu udieralo rýchlejšie. Revolver na boku by mu tu nepomohol, včerajšok mu to pripomenul až príliš dôrazne, no samotná váha kovu pri stehne ho upokojovala. Klamstvo, ale užitočné.', 'His heart beat faster. The revolver at his hip would be no use here, yesterday had made that all too clear, but the weight of the metal against his thigh calmed him. A lie, but a useful one.'))
        await g.say('tami', l('Sú tu vždy. Väčšinou len pozerajú.', 'They’re always here. Mostly they just watch.'))
        await g.say('player', l('Väčšinou.', 'Mostly.'))
        await g.say('tami', l('Väčšinou.', 'Mostly.'))
        showWatchers(g, true)
        g.codex('world.pozorovatelia')
        g.cinematic(false)
        g.hint(l('Pozorovatelia len pozerajú, kým k nim nekráčaš. Nechoď k nim a nezdržuj sa pri nich.', 'The watchers only watch, as long as you don’t walk toward them. Don’t approach them, don’t linger near them.'))
        g.checkpoint()
      },
    },
    {
      id: 'b1',
      area: [1, 14, 11, 24],
      when: (g) => stage(g) === 'walk1',
      run: async (g) => {
        g.cinematic(true)
        g.hint(null)
        g.objective(null)
        await g.narrate(l('Kostry našli v budove, čo mohla byť kedysi skladiskom alebo dielňou. Vysoký strop, to, čo z neho zostalo, a široký priestor bez priečok, len stĺpy a trámy a lišajníky.', 'They found the skeletons in a building that might once have been a warehouse or a workshop. A high ceiling, what was left of it, and a wide space without partitions, only pillars and beams and lichen.'))
        void g.walk('tami', [5, 15])
        await g.walk('player', [6, 15])
        g.face('player', [6, 14])
        g.face('tami', [5, 14])
        await g.focus([5, 14], { ms: 900, zoom: 1.4 })
        await g.narrate(l('Ležali v rohu. Štyri, nie, päť. Pôvodne sedeli opretí o stenu. Teraz boli len kôpky kostí v zvyškoch oblečenia, čo sa rozpadalo na dotyk.', 'They lay in the corner. Four, no, five. Once they had sat leaning against the wall. Now they were only heaps of bone in the remains of clothes that fell apart at a touch.'))
        await g.narrate(l('A v kostiach kryštály. Vyrástli z rebier a stavcov ako minerálne výrastky v jaskyniach, drobné, priehľadné, s jemným fialovým odleskom v niektorých a mliečnym bielym v iných.', 'And in the bones, crystals. They had grown from the ribs and vertebrae like mineral growths in caves, tiny, clear, a faint violet sheen in some and milky white in others.'))
        g.codex('gloss.kristaly_spiry')
        g.pose('tami', 'kneel')
        await g.narrate(l('Tami si kľakla k prvej kostre. Vytiahla malý kožený vak a tenké kliešte. Prstami ohmatala rebro, našla kryštál, uvoľnila ho kliešťami, uložila do vaku. Ďalší. Ďalší.', 'Tami knelt by the first skeleton. She took out a small leather bag and thin pliers. Her fingers felt along a rib, found a crystal, loosened it with the pliers, put it in the bag. Another. Another.'))
        g.pose('player', 'kneel')
        await g.say('player', l('Ukáž.', 'Show me.'))
        await g.say('tami', l('Tie matné sú prázdne. Vyhorené. Hľadaj priehľadné, fialové alebo biele. Čím čistejšie, tým lepšie.', 'The dull ones are empty. Burnt out. Look for clear ones, violet or white. The cleaner, the better.'))
        const r = await g.minigame('crystal', { need: 3, time: 60 })
        if (r.success) {
          await g.narrate(l('Flint bral. Opatrne, nie z úcty k mŕtvym, ale z praktickosti. Poškodený kryštál nemá cenu. Našiel rytmus rýchlo: oči, prsty, kliešte.', 'Flint took them. Carefully, not out of respect for the dead but out of practicality. A damaged crystal is worth nothing. He found the rhythm quickly: eyes, fingers, pliers.'))
          await g.say('tami', l('Si v tom dobrý.', 'You’re good at this.'))
        } else {
          await g.narrate(l('Dva mu zošedli medzi prstami. Tami mlčky dokončila kostru sama a ďalšie už vyberal pomalšie: oči, prsty, kliešte.', 'Two went grey between his fingers. Tami finished the skeleton herself without a word, and he took the next ones slower: eyes, fingers, pliers.'))
          await g.say('tami', l('Učíš sa rýchlo.', 'You learn fast.'))
        }
        await g.say('player', l('Čistil som ryby, odkedy som dočiahol na pult. Princíp je rovnaký.', 'I’ve been gutting fish since I could reach the counter. Same principle.'))
        await g.narrate(l('Tami sa takmer usmiala.', 'Tami almost smiled.'))
        await g.focus('w4', { ms: 900, zoom: 1.2 })
        await g.narrate(l('Tiene sa pohybovali na okrajoch miestnosti. Tmavšie miesta, kde tma nemala byť. Občas obrys, čo pripomínal rameno alebo hlavu. Pozerali.', 'Shadows moved at the edges of the room. Darker places where there should be no dark. Now and then an outline like a shoulder or a head. They watched.'))
        await g.focus([5, 15], { ms: 800, zoom: 1.45 })
        await g.narrate(l('Tami sa natiahla cez neho po kliešte. Jej predlaktie sa dotklo jeho ramena. Na zlomok úderu srdca. Dosť dlho.', 'Tami reached across him for the pliers. Her forearm brushed his shoulder. For a fraction of a heartbeat. Long enough.'))
        await g.narrate(l('Voňala prachom, studenou hrdzou, a pod tým ňou samou. Ako keď v Diss ráno otvoria pekáreň a ten prvý závan čerstvého chleba prerazí cez smrad rýb.', 'She smelled of dust, of cold rust, and beneath that of herself. Like the bakery in Diss opening in the morning, when the first breath of fresh bread cuts through the stink of fish.'))
        await g.narrate(l('Flint na chvíľu zabudol na kliešte.', 'For a moment Flint forgot the pliers.'))
        g.pose('tami', 'stand')
        g.pose('player', 'stand')
        await g.walk('tami', [2, 15])
        g.face('tami', [1, 14])
        await g.say('tami', l('Posledná je v rohu.', 'The last one’s in the corner.'))
        g.follow()
        await g.zoom(1, 500)
        g.set('c10.stage', 'b1')
        g.cinematic(false)
        g.objective(l('Posledná kostra v zadnom rohu.', 'The last skeleton, in the back corner.'))
        g.checkpoint()
      },
    },
    {
      id: 'thoughts',
      area: [13, 16, 24, 21],
      when: (g) => stage(g) === 'walk2',
      run: async (g) => {
        await g.narrate(l('Druhú budovu prešli rýchlejšie. Flint už išiel najisto. Ruky by kryštály uvoľňovali bez rozmýšľania. Myseľ blúdila. K nej.', 'They crossed to the second building faster. Flint walked surely now. His hands would free the crystals without thinking. His mind wandered. To her.'))
        await g.narrate(l('Tami sa pohybovala po ruinách ako doma. Každý kameň, každú ulicu, každý tieň poznala z tela, nie z máp. Kým on v Diss čistil ryby a kradol vrecká, ona tu kráčala medzi mŕtvymi a učila sa im veliť.', 'Tami moved through the ruins as if at home. Every stone, every street, every shadow she knew with her body, not from maps. While he gutted fish and picked pockets in Diss, she was walking here among the dead and learning to command them.'))
        await g.narrate(l('V Beladisse si nikto nikoho nevyberal. V Beladisse si bral, čo si stihol, a utiekol, kým ťa nechytili.', 'In Beladiss nobody chose anybody. In Beladiss you took what you could grab and ran before they caught you.'))
      },
    },
    {
      id: 'b2',
      area: [26, 17, 33, 24],
      when: (g) => stage(g) === 'walk2',
      run: async (g) => {
        g.cinematic(true)
        g.objective(null)
        void g.walk('tami', [29, 18])
        await g.focus([31, 17], { ms: 900, zoom: 1.35 })
        await g.narrate(l('Pod schodmi, čo už nikam neviedli, ležali traja, zosypaní jeden do druhého, ako sa kedysi o seba opreli; lebka jedného spočívala druhému na pleci.', 'Beneath stairs that no longer led anywhere lay three, slumped into one another, the way they had once leaned together; the skull of one rested on another’s shoulder.'))
        await g.narrate(l('Flint sa na nich chvíľu díval.', 'Flint looked at them for a while.'))
        g.follow()
        await g.zoom(1, 500)
        g.set('c10.stage', 'b2')
        g.cinematic(false)
        g.objective(l('Kľakni si k trom pod schodmi.', 'Kneel by the three beneath the stairs.'))
      },
    },
    {
      id: 'temple',
      area: [19, 3, 25, 8],
      when: (g) => stage(g) === 'walk3',
      run: async (g) => {
        g.cinematic(true)
        g.hint(null)
        g.objective(null)
        g.set('c10.stage', 'temple')
        await g.focus([22, 5], { ms: 1000, zoom: 0.95 })
        await g.narrate(l('Tretia budova. Väčšia, niečo ako chrám alebo zhromažďovacia sieň. Vysoké stĺpy, rozbitá kupola a pod ňou kruh sivého svetla, cez ktorý padal dážď.', 'The third building. Bigger, something like a temple or an assembly hall. Tall pillars, a broken dome, and beneath it a ring of grey light through which the rain fell.'))
        await g.walk('tami', [21, 6])
        g.face('tami', [27, 3])
        g.pose('tami', 'fight')
        g.emote('tami', '!')
        await g.narrate(l('Tami stuhla.', 'Tami went rigid.'))
        await g.narrate(l('Flint tú zmenu zachytil okamžite. Postoj tela, sklon uší, smer pohľadu. Pred okamihom uvoľnená, takmer lenivá. Teraz ostrá. Uši dopredu, ramená napnuté, ruka na meči.', 'Flint caught the change at once. The set of her body, the angle of her ears, the direction of her gaze. A moment ago relaxed, almost lazy. Now sharp. Ears forward, shoulders tense, hand on her sword.'))
        await g.say('player', l('Čo…', 'What—'))
        await g.say('tami', l('Tichšie.', 'Quieter.'))
        await g.narrate(l('Medzi stĺpmi rástla len tráva a ležali kamene. Žiadne nové tiene. Tie zvedavé sa držali na periférii, tak ako predtým.', 'Between the pillars only grass grew and stones lay. No new shadows. The curious ones kept to the edges, as before.'))
        await g.focus('w7', { ms: 800, zoom: 1.1 })
        await g.narrate(l('Teraz sa sťahovali. Pomaly, nehlučne, ako vreckári z trhu, keď zbadajú stráž.', 'Now they were withdrawing. Slowly, silently, like pickpockets leaving a market when they spot the watch.'))
        for (const w of watchers) {
          const out: Vec2 = [w.home[0] < 17 ? Math.max(0, w.home[0] - 2) : Math.min(33, w.home[0] + 2), w.home[1]]
          void g.walk(w.id, out, { speed: 0.9 })
        }
        await g.wait(1600)
        for (const w of watchers) {
          g.fx('dust', w.id)
          g.despawn(w.id)
          await g.wait(160)
        }
        g.music(null, 800)
        void g.atmosphere({ sounds: ['rain'] }, 800)
        await g.focus('player', { ms: 700, zoom: 1.05 })
        await g.narrate(l('Jeden za druhým sa strácali z okrajov miestnosti, kým nezostalo… nič. Len prázdno a ticho také husté, až mu vlastný pulz dunel v ušiach.', 'One after another they vanished from the edges of the room, until there was… nothing. Only emptiness, and a silence so thick his own pulse thundered in his ears.'))
        g.sfx('heartbeat', 0.9)
        await g.wait(600)
        g.face('tami', 'player')
        await g.say('tami', l('Bež.', 'Run.'), { mood: 'fear' })
        await g.say('player', l('Čo…', 'What—'))
        g.shake(0.35, 700)
        g.sfx('bass', 0.9)
        await g.say('tami', l('Bež!', 'Run!'), { mood: 'angry' })
        await g.narrate(l('Keď niekto, kto vie, čo robí, povie bež, bežíš.', 'When someone who knows what they are doing says run, you run.'))
        g.set('c10.stage', 'chase')
        g.follow()
        g.pose('tami', 'stand')
        setupChase(g)
        g.cinematic(false)
        g.checkpoint()
      },
    },
    {
      id: 'root',
      area: [0, 22, 33, 22],
      when: (g) => stage(g) === 'chase' && !g.flag('c10.tripped'),
      run: async (g) => {
        g.set('c10.tripped')
        g.stealth(false)
        g.teleport('storm', [17, 13])
        g.cinematic(true)
        g.sfx('whoosh')
        g.shake(0.45, 700)
        g.pose('player', 'lie')
        await g.narrate(l('Koreň. Flintova pravá noha sa zachytila o koreň, čo vyrastal cez dlažbu ako had. Svet sa prevrátil. Zem, obloha, zem.', 'A root. Flint’s right foot caught on a root that grew through the paving like a snake. The world turned over. Earth, sky, earth.'))
        g.pose('player', 'crouch')
        g.shake(0.3, 500)
        await g.narrate(l('Ruky reflexne pred seba, premet cez rameno, ďalší premet, nie plánovaný, len váha a rozbeh, kým sa znova neocitol na nohách.', 'Hands out by reflex, a roll over the shoulder, another roll, not planned, only weight and momentum, until he was on his feet again.'))
        g.pose('player', 'stand')
        const p = g.pos('player')
        g.teleport('tami', [Math.min(24, p[0] + 1), p[1]])
        g.face('tami', 135)
        await g.narrate(l('Bežal ďalej. Bez zastavenia, bez spomalenia, bez pohľadu dozadu. Odreniny na dlaniach ani necítil.', 'He ran on. Without stopping, without slowing, without looking back. He didn’t even feel the scrapes on his palms.'))
        g.bark('tami', l('Ha! Ha-ha-ha!', 'Ha! Ha-ha-ha!'))
        await g.narrate(l('Tami bežala vedľa neho. A potom zvuk, ktorý nečakal. Smiech. Smiala sa uprostred behu, s mečom v ruke, s tieňom za chrbtom. Radostne, ako dieťa, čo skáče zo strechy na strechu, lebo pozná každú medzeru.', 'Tami ran beside him. And then a sound he didn’t expect. Laughter. She was laughing mid-run, sword in hand, a shadow at her back. Joyfully, like a child leaping from roof to roof because it knows every gap.'))
        await g.narrate(l('A Flint, ktorý pred chvíľou urobil dvojitý premet cez koreň a mal kolená od krvi, sa začal smiať tiež.', 'And Flint, who had just done a double somersault over a root and had blood on his knees, began to laugh too.'))
        g.bark('player', l('Ha!', 'Ha!'))
        void g.walk('tami', [19, 33], { run: true, speed: 4.4 })
        g.cinematic(false)
        g.stealth(true)
        g.checkpoint()
      },
    },
    {
      id: 'signs',
      area: [0, 31, 33, 33],
      when: (g) => stage(g) === 'chase',
      run: async (g) => {
        g.set('c10.stage', 'done')
        g.stealth(false)
        g.hint(null)
        g.objective(null)
        g.cinematic(true)
        void g.walk('storm', [18, 26], { speed: 1.2 })
        g.music('moss', 2500)
        void g.atmosphere(
          {
            fog: { color: '#6c7b6c', near: 5, far: 26 },
            hemi: { sky: '#b4c6ae', ground: '#2e3a2a', intensity: 1.05 },
            grade: { tint: '#dfe8da', saturation: 0.82, contrast: 1.08, vignette: 0.48 },
            sounds: ['rain', 'forest'],
          },
          2200,
        )
        await g.narrate(l('Značky.', 'The signs.'))
        await g.walk('player', [17, 33])
        void g.walk('tami', [19, 33])
        await g.narrate(l('Zastavili sa za líniou bielych kruhov, dych a smiech. Flintove dlane krvácali, odreniny z kameňov a koreňa. Kolená rovnako.', 'They stopped beyond the line of white circles, all breath and laughter. Flint’s palms were bleeding, scraped by stones and the root. His knees too.'))
        g.face('tami', 135)
        await g.narrate(l('Tami sa oprela o strom, meč v ruke, oči ešte na tme za značkami.', 'Tami leaned against a tree, sword in hand, eyes still on the dark beyond the signs.'))
        await g.wait(800)
        g.fx('dust', 'storm')
        g.despawn('storm')
        await g.narrate(l('Tieň neprišiel ďalej. Nikdy nešli za značky. Flint nevedel prečo a nepýtal sa.', 'The shadow came no further. They never went past the signs. Flint didn’t know why, and he didn’t ask.'))
        g.face('tami', 'player')
        g.face('player', 'tami')
        await g.say('tami', l('Ty…', 'You…'), { mood: 'happy' })
        await g.say('tami', l('Ten dvojitý premet.', 'That double somersault.'), { mood: 'happy' })
        await g.say('player', l('Kark.', 'Kark.'))
        await g.narrate(l('Pozrel na dlane. Červené. Potom na kolená. Tiež.', 'He looked at his palms. Red. Then at his knees. Those too.'))
        await g.narrate(l('Tami sa rozosmiala a Flint, s pľúcami v ohni, sa smial s ňou. Len dvaja v daždi, ktorým práve došlo, že to stihli.', 'Tami burst out laughing, and Flint, his lungs on fire, laughed with her. Just two people in the rain who had only now realised they had made it.'))
        await g.narrate(l('Vak mu podala, až keď sa obom upokojil dych. Vzal ho do rozodretých rúk. Bol ťažší, než vyzeral, a hrany kryštálov ho tlačili do rán.', 'She handed him the bag only once they had both caught their breath. He took it in his scraped hands. It was heavier than it looked, and the edges of the crystals pressed into his wounds.'))
        await g.say('tami', l('Pre Itaku. Nesieš ty.', 'For the Itaka. You carry it.'))
        await g.narrate(l('Prehodil si vak cez plece.', 'He slung the bag over his shoulder.'))
        g.give('crystal_bag')
        await g.fade('black', 1200)
        g.cinematic(false)
        await g.goto('c10_dusk')
      },
    },
  ],
  onEnter: async (g) => {
    resetWatchers(watchers, wst)
    slip.last = ''
    slip.t = 0
    slip.standAt = 0
    tamiRunning = false
    walk1.busy = walk2.busy = walk3.busy = false
    await g.once('c10.ruins', async () => {
      g.stealth(false)
      g.cinematic(true)
      g.set('c10.stage', 'walk1')
      await g.wait(500)
      await g.narrate(l('Kitsune bolo obrovské.', 'Kitsune was enormous.'))
      await g.narrate(l('Flint vyrastal v Beladisse. Poznal úzke uličky, zapáchajúce rybami a smolou, kde sa päť domov tiesni na priestore pre dva. Toto bolo mesto postavené pre milión obyvateľov, v ktorom teraz takmer nikto nežil.', 'Flint grew up in Beladiss. He knew narrow alleys that stank of fish and pitch, where five houses crowd into the space for two. This was a city built for a million people, and now almost no one lived in it.'))
      await g.focus([21, 14], { ms: 2200, zoom: 0.8 })
      await g.narrate(l('Ulice široké ako rieky. Budovy vysoké, rozpadnuté, zarastené koreňmi a machom. Stĺpy, čo kedysi držali strechy, teraz stáli nahé proti sivej oblohe ako vyblednuté kosti obrov.', 'Streets as wide as rivers. Tall buildings, crumbling, overgrown with roots and moss. Pillars that once held up roofs now stood naked against the grey sky like the bleached bones of giants.'))
      await g.narrate(l('Les si mesto vzal za svoje. Pod klenbami, kam nedosiahol deň, slabo svietili zelenavé listy. A nad tým všetkým ticho, ktoré počúvalo.', 'The forest had taken the city for its own. Under the vaults, where the day did not reach, greenish leaves glowed faintly. And above it all, a silence that listened.'))
      await g.focus('player', { ms: 1200, zoom: 1 })
      g.follow()
      await g.narrate(l('Tami sa pohybovala inak. Na palube bola rýchla, hlasná, zaberala priestor. Tu bola tichá. Kroky presné, telo nízko, meč v ruke, nie vytiahnutý, len pripravený.', 'Tami moved differently here. On deck she was quick, loud, she took up space. Here she was quiet. Precise steps, body low, sword in hand, not drawn, only ready.'))
      g.face('tami', 'player')
      await g.say('tami', l('Drž sa za mnou. Nestúpaj na mach, je klzký.', 'Stay behind me. Don’t step on the moss, it’s slippery.'))
      await g.say('tami', l('A keď uvidíš pohyb na periférii, neotáčaj sa.', 'And when you see movement at the edge of your vision, don’t turn.'))
      await g.say('player', l('Čo keď…', 'What if—'))
      await g.say('tami', l('Neotáčaj sa.', 'Don’t turn.'), { mood: 'angry' })
      await g.narrate(l('Flint sa neotočil.', 'Flint didn’t turn.'))
      g.face('tami', 135)
      g.cinematic(false)
      g.objective(l('Drž sa za Tami. Nestúpaj na mach.', 'Stay behind Tami. Don’t step on the moss.'))
      g.hint(l('Dýchaj nosom · nestúpaj na mach · neotáčaj sa za pohybom', 'Breathe through your nose · don’t step on moss · don’t turn toward movement'))
      g.checkpoint()
    })
    // re-derive the scene from the story state (also after a retry)
    const st = stage(g)
    if (g.flag('c10.cracked')) {
      g.propVisible('best', false)
      g.propVisible('dead', true)
    }
    if (st === 'walk1' || st === 'b1') placeLeader(g, walk1)
    if (st === 'b1') g.teleport('tami', [2, 15])
    if (st === 'walk2' || st === 'b2') placeLeader(g, walk2)
    if (st === 'b2') g.teleport('tami', [29, 18])
    if (st === 'walk3' || st === 'temple') placeLeader(g, walk3)
    if (st === 'chase') {
      setupChase(g)
    } else if (st === 'done') {
      for (const w of watchers) g.despawn(w.id)
      g.stealth(false)
    } else {
      g.stealth(false)
      if (g.flag('c10.watchersOn')) showWatchers(g, true)
    }
  },
  onUpdate: (g, dt) => {
    const st = stage(g)
    if (st === 'walk1' || st === 'walk2' || st === 'walk3' || st === 'b1' || st === 'b2') {
      if (st === 'walk1') updateLeader(g, walk1)
      if (st === 'walk2') updateLeader(g, walk2)
      if (st === 'walk3') updateLeader(g, walk3)
      updateSlip(g, MOSS, slip, dt, 'tami')
      if (g.flag('c10.watchersOn') && updateWatchers(g, watchers, wst, dt, 'tami')) void g.fail(FAIL_WATCH)
      return
    }
    if (st === 'chase') {
      chaseT -= dt
      dustT -= dt
      if (chaseT <= 0) {
        chaseT = 0.45
        if (g.dist('storm', 'player') > 1.0) void g.walk('storm', 'player', { speed: 3.45 })
      }
      if (dustT <= 0) {
        dustT = 0.28
        g.fx('dust', 'storm')
        if (Math.random() < 0.25) g.shake(0.08, 300)
      }
    }
  },
}
