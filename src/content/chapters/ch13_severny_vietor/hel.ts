/**
 * Kapitola 21: Hel. The lift down past the reliefs (the four smooth-faced humans who opened the
 * rock), the wolf-head arch, the great hall with its pulse of riveters. The riveters fall silent:
 * “Alfadir!” The Star Wall with another sky and the red circle of Infera. Later: the run against
 * the ritual crowd with the drone map in Arkot's head; and at the end, Aether stays.
 */
import type { ActorDef, SceneDef, TriggerDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { hel as helAmb } from './ambience'
import { aether, goji } from './util'

const CROWD_AT: Vec2[] = [
  [8, 8], [11, 6], [16, 7], [19, 8], [23, 7], [27, 9],
  [8, 14], [12, 14], [17, 13], [22, 13], [26, 14], [10, 10],
  [7, 20], [12, 21], [18, 18], [23, 20], [27, 18], [15, 16],
]
const crowd: ActorDef[] = CROWD_AT.map((at, i) => ({ id: `w${i + 1}`, character: `c13_crowd${i + 1}`, at, facing: (i * 67) % 360 }))
const CROWD_IDS = crowd.map((c) => c.id)

/** Stair mouths at the bottom: counted from the tower gate, the third turn is the right one. */
const STAIRS: { at: Vec2; n: number }[] = [
  { at: [26, 25], n: 1 },
  { at: [21, 25], n: 2 },
  { at: [16, 25], n: 3 },
  { at: [11, 25], n: 4 },
]

const stairTriggers: TriggerDef[] = STAIRS.map(({ at, n }) => ({
  id: `stair${n}`,
  area: [at[0], at[1], at[0], at[1]],
  once: false,
  when: (g) => !!g.flag('c13.tower') && !g.flag('c13.ambush') && g.flag('c13.onStair') !== n,
  run: async (g) => {
    g.set('c13.onStair', n)
    if (n === 3) {
      g.hint(null)
      await g.goto('c13_depths', 'stairs')
      return
    }
    g.bark(
      'player',
      n === 1
        ? l('Prvá odbočka. Nie. Tretia.', 'The first turn. No. The third.')
        : n === 2
          ? l('Druhá. Mapa v hlave hovorí ďalej.', 'The second. The map in my head says further.')
          : l('Toto už je štvrtá. Späť.', 'That’s the fourth already. Back.'),
    )
  },
}))

export const helScene: SceneDef = {
  id: 'c13_hel',
  name: l('Hel', 'Hel'),
  ambience: helAmb,
  camera: { zoom: 0.9 },
  map: {
    rows: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWgWW',
      'WaaaaWhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhffhhhhhhhhhhhhhhhhh',
      'WaaaaWhhhhhhhfffhhhhhhhhhhhhhh',
      'WaaaaAhhhhhhhhhhffhhhhhhhhhhhh',
      'WaaaaAhhhhhhhhhhhhhhhhhhhhhhhh',
      'WaaaaAhhhhhhhhhhhhhhhhhhhhhhhh',
      'WWWWWWhhhhhhhhhhhhhhhhhhhhhhhh',
      '     Whhhhhhhhhhhhhhhhhhhhhhhh',
      '     Whhhhhhhhhhhhhffhhhhhhhhh',
      '     Whhhhhhhhhhhhhhhfffhhhhhh',
      '     Whhhhhhhhhhhhhhhhhhfhhhhh',
      '     Whhhhhhhhhhhhhhhhhhhhhhhh',
      '     Whhhhhhhhhhhhhhhhhhhhhhhh',
      '     Whhhhhhhhhhhhhhhhhhhhhhhh',
      '     Whhfhhhhhhhhhhhhhhhhhhhhh',
      '     Whhhffhhhhhhhhhhhhhhhhhhh',
      '     Whhhhhhhhhhhhhhhhhhhhhhhh',
      '     Whhhhhhhhhhhhhhhhhhhhhhhh',
      '     Whhhhhshhhhshhhhshhhhshhh',
    ],
    legend: {
      W: { floor: 'andesite', wall: 'andesite', wallH: 3.4 },
      a: { floor: 'andesite', tint: '#5a5058' },
      A: { floor: 'andesite', tint: '#4a4048', tag: 'arch' },
      h: { floor: 'andesite', tint: '#6a5a58' },
      f: { floor: 'lava', walk: true, prop: { type: 'c13_grate' } },
      g: { floor: 'obsidian', tint: '#141016', tag: 'towergate' },
      s: { floor: 'obsidian', tint: '#120e10' },
    },
  },
  props: [
    // relief corridor
    { type: 'c13_relief', at: [1, 2], rot: 90, params: { kind: 'wolves', w: 1.8 } },
    { type: 'c13_relief', at: [1, 5], rot: 90, params: { kind: 'wolves', w: 1.8 } },
    { type: 'c13_relief', at: [1, 9], rot: 90, params: { kind: 'four', w: 1.8 } },
    { type: 'torch', at: [4, 3] },
    { type: 'torch', at: [4, 8] },
    { type: 'arch', at: [5, 11], rot: 90, params: { style: 'andesite', w: 3, d: 0.8 }, scale: 1.25 },
    { type: 'pipe', at: [1, 12], params: { vertical: true } },
    { type: 'gear', at: [1, 11], params: { standing: true, spin: true } },
    // the star wall
    { type: 'star_wall', at: [17, 1], id: 'starwall' },
    { type: 'candles', at: [15, 2] },
    { type: 'candles', at: [19, 2] },
    // workshop mouths along the top wall
    { type: 'arch', at: [8, 1], params: { style: 'andesite' } },
    { type: 'brazier', at: [8, 1] },
    { type: 'arch', at: [12, 1], params: { style: 'andesite' } },
    { type: 'cauldron', at: [12, 1], params: { fire: true, color: '#ff7a2a' } },
    { type: 'arch', at: [22, 1], params: { style: 'andesite' } },
    { type: 'brazier', at: [22, 1] },
    { type: 'arch', at: [27, 1], params: { style: 'andesite' } },
    { type: 'pipe', at: [24, 1], params: { vertical: true } },
    { type: 'workbench', at: [10, 2] },
    { type: 'workbench', at: [24, 2] },
    // pillars
    ...[9, 14, 20, 25].flatMap((x) =>
      [5, 12, 19].map((y) => ({ type: 'pillar', at: [x, y] as Vec2, params: { h: 4.6, style: 'andesite' } })),
    ),
    // market
    { type: 'stall', at: [7, 15], params: { goods: 'cloth' }, color: '#7a4a2a' },
    { type: 'stall', at: [22, 8], params: { goods: 'fish' }, color: '#5a5a6a' },
    { type: 'stall', at: [11, 17], color: '#8a6a3a' },
    { type: 'stall', at: [17, 22], params: { goods: 'cloth' }, color: '#6a3a3a' },
    { type: 'table', at: [12, 9], params: { items: true } },
    { type: 'crate', at: [26, 15], params: { stack: true } },
    { type: 'sack', at: [27, 16], params: { count: 3 } },
    { type: 'barrel', at: [7, 23] },
    { type: 'brazier', at: [16, 15] },
    { type: 'brazier', at: [22, 18] },
    // lift shaft and stair mouths
    { type: 'cage', at: [28, 21], params: { open: true } },
    { type: 'pipe', at: [29, 19], params: { vertical: true } },
    { type: 'gear', at: [28, 19], params: { standing: true, spin: true } },
    ...STAIRS.map(({ at }) => ({ type: 'arch', at, params: { style: 'andesite' } })),
    // ritual torches (shown after the tower)
    ...[[10, 4], [13, 8], [18, 4], [23, 5], [8, 11], [16, 11], [27, 11], [11, 15], [19, 16], [24, 15], [9, 22], [14, 23], [22, 23]].map(([x, y], i) => ({
      type: 'torch',
      at: [x, y] as Vec2,
      params: { standing: true },
      id: `rt${i}`,
      hidden: true,
    })),
  ],
  player: { character: 'arkot_glyph', at: [2, 2], facing: 0 },
  spawns: { lift: [2, 2], gate: [27, 1], return: [3, 11] },
  actors: [
    { id: 'flint', character: 'flint', at: [3, 2], facing: 0 },
    { id: 'goji', character: 'goji', at: [2, 3], facing: 0 },
    { id: 'aether', character: 'aether', at: [3, 4], facing: 0 },
    { id: 'elder', character: 'wolf_elder', at: [2, 6], facing: 0 },
    { id: 'esc1', character: 'c13_hunter2', at: [1, 4], facing: 0 },
    { id: 'esc2', character: 'c13_hunter3', at: [4, 6], facing: 0 },
    { id: 'pumpguard', character: 'c13_hunter4', at: [27, 22], facing: 270 },
    { id: 'blue', character: 'c13_blue', at: [18, 9], hidden: true },
    { id: 'pup1', character: 'c13_pup1', at: [16, 9], hidden: true },
    { id: 'pup2', character: 'c13_pup2', at: [19, 10], hidden: true },
    { id: 'pup3', character: 'c13_pup5', at: [17, 10], hidden: true },
    ...crowd,
  ],
  interactables: [
    {
      id: 'reliefs',
      at: [2, 5],
      label: l('Reliéfy vlkov', 'The wolf reliefs'),
      verb: 'look',
      when: (g) => !g.flag('c13.hallIntro'),
      run: async (g) => {
        await g.narrate(l('Steny šachty pokryté reliéfmi. Vlci. Stovky, tisíce. Lovci, matky, šteňatá, kotlári. Príbehy celých generácií vrstvené na seba, staršie pod novšími, kde farba vybledla a kameň sa zahladil.', 'The walls of the shaft covered with reliefs. Wolves. Hundreds, thousands. Hunters, mothers, pups, boilermakers. The stories of whole generations layered on each other, the older under the newer, where the paint had faded and the stone worn smooth.'))
      },
    },
    {
      id: 'four',
      at: [2, 9],
      label: l('Štyri postavy', 'Four figures'),
      verb: 'look',
      when: (g) => !g.flag('c13.four'),
      run: async (g) => {
        g.set('c13.four')
        await g.narrate(l('Panel so štyrmi postavami. Vysoké, hladké tváre bez srsti a tlám. Ľudia. Okolo nich zárezy, čo nepoznali dláto: dokonalé oblúky a presné hrany. Najstaršie reliéfy. Pod vlkmi. Pod všetkým.', 'A panel with four figures. Tall, smooth faces without fur or muzzles. Humans. Around them, cuts no chisel had made: perfect arcs and exact edges. The oldest reliefs. Beneath the wolves. Beneath everything.'))
        g.face('goji', 'elder')
        await g.narrate(l('Goji sa naklonil ku kameňu, prst na vytesanej línii. Obrátil sa k starešinovi a spýtal sa. Pomaly, v Staroreči, hľadajúc správne slová. Starešina hovoril dlho.', 'Goji leaned towards the stone, a finger on a carved line. He turned to the elder and asked. Slowly, in the Old Tongue, searching for the right words. The elder spoke for a long time.'))
        await goji(g, l('Oddávna. Štyria. Prišli zhora. Ľudia. Hovorili starou rečou. Dotkli sa skaly a skala sa otvorila.', 'Long ago. Four. They came from above. Humans. They spoke the old speech. They touched the rock and the rock opened.'))
        await goji(g, l('Nato odišli. Všetci štyria. Vlci zostali. Kopali ďalej. Kovali ďalej.', 'Then they left. All four. The wolves stayed. Kept digging. Kept forging.'), 'sad')
        await g.say('player', l('Štyria. Ako tí, o ktorých hovoril Aether pri ohni.', 'Four. Like the ones Aether spoke of by the fire.'), { thought: true })
      },
    },
    {
      id: 'starwall',
      at: [17, 2],
      label: l('Hviezdna stena', 'The Star Wall'),
      verb: 'read',
      radius: 2,
      when: (g) => !!g.flag('c13.alfadir') && !g.flag('c13.wall'),
      run: (g) => starWall(g),
    },
    {
      id: 'shaft',
      at: [27, 21],
      label: l('Výťah', 'The lift'),
      verb: 'use',
      when: (g) => !!g.flag('c13.tower') && !g.flag('c13.ambush'),
      run: async (g) => {
        g.face('pumpguard', 'player')
        await g.narrate(l('Hydraulická plošina, reťaze, škrípanie. Príliš pomaly. Vojak pri pumpe ho zmeral pohľadom.', 'A hydraulic platform, chains, creaking. Too slow. The soldier at the pump measured him with a look.'))
        await g.say('player', l('Šachta napravo. Schody naľavo. Tretia odbočka. Dole.', 'The shaft on the right. The stairs on the left. The third turn. Down.'), { thought: true })
      },
    },
    {
      id: 'farewell',
      at: [17, 8],
      label: l('Rozlúčiť sa s Aetherom', 'Say goodbye to Aether'),
      verb: 'talk',
      radius: 2,
      when: (g) => !!g.flag('c13.ambush') && !g.flag('c13.farewell'),
      run: (g) => farewell(g),
    },
  ],
  triggers: [
    {
      id: 'arch',
      area: [5, 9, 6, 13],
      when: (g) => !g.flag('c13.hallIntro'),
      run: (g) => hallIntro(g),
    },
    ...stairTriggers,
    {
      id: 'up',
      area: [1, 1, 4, 1],
      when: (g) => !!g.flag('c13.farewell'),
      run: async (g) => {
        await g.goto('c13_deck')
      },
    },
  ],
  exits: [
    {
      area: [27, 0, 27, 0],
      to: 'c13_tower',
      when: (g) => !!g.flag('c13.wall') && !g.flag('c13.tower'),
      blocked: l('Brána je nízka a tmavá. Nikto z vlkov za ňu nevkročí.', 'The gate is low and dark. None of the wolves will step past it.'),
    },
  ],
  onEnter: async (g) => {
    crowdT = 0
    if (g.flag('c13.ambush')) return departureState(g)
    if (g.flag('c13.tower')) return runState(g)
    await g.once('c13.lift', async () => {
      g.cinematic(true)
      await g.narrate(l('Vojaci im ukázali cestu. Nie ako sprievod. Ako eskorta. Traja zostali na palube Itaky, pušky cez kolená, oči na posádke.', 'The soldiers showed them the way. Not as an escort of honour. As guards. Three stayed aboard the Itaka, rifles across their knees, eyes on the crew.'))
      await g.narrate(l('Hydraulický výťah s potrubím, ventilmi a hrubými piestami zarezanými do steny. Plošina sa zachvela, zavŕzgala, klesla. Počítanie na prvej jazde skončilo po štvrtej terase. Prestup. Dve terasy. Ďalší prestup.', 'A hydraulic lift of pipes, valves and thick pistons cut into the wall. The platform shuddered, creaked, sank. The counting on the first ride ended after the fourth terrace. A change. Two terraces. Another change.'))
      await g.narrate(l('Hlbšie a ťažšie s každou terasou. Váha ťažkej hodiny a síra v každom nádychu.', 'Deeper and heavier with every terrace. The weight of the heavy hour, and sulphur in every breath.'))
      g.cinematic(false)
      g.objective(l('Nasleduj starešinu.', 'Follow the elder.'))
    })
    if (g.flag('c13.hallIntro') && !g.flag('c13.wall')) {
      for (const id of ['flint', 'goji']) g.teleport(id, id === 'flint' ? [15, 4] : [19, 4])
      g.teleport('aether', [17, 6])
      g.teleport('elder', [13, 5])
      for (const id of CROWD_IDS) g.pose(id, 'kneel')
    } else if (g.flag('c13.wall')) {
      for (const id of ['flint', 'goji']) g.show(id, false)
      g.teleport('aether', [26, 2])
      for (const id of CROWD_IDS) g.pose(id, 'kneel')
    }
  },
  onUpdate: (g, dt) => {
    if (!g.flag('c13.tower') || g.flag('c13.ambush')) return
    const [px, py] = g.pos('player')
    if (g.flag('c13.onStair') && !STAIRS.some(({ at }) => at[0] === px && at[1] === py)) g.set('c13.onStair', 0)
    crowdT -= dt
    if (crowdT > 0) return
    crowdT = 0.5
    // the river of bodies: each tick a few wolves drift to new places around the hall
    for (let k = 0; k < 4; k++) {
      const id = CROWD_IDS[crowdI++ % CROWD_IDS.length]
      const base = CROWD_AT[CROWD_IDS.indexOf(id)]
      const tx = Math.max(7, Math.min(28, base[0] + Math.round((Math.random() - 0.5) * 6)))
      const ty = Math.max(3, Math.min(24, base[1] + Math.round((Math.random() - 0.5) * 6)))
      void g.walk(id, [tx, ty], { speed: 1.1 + Math.random() * 0.6 })
    }
    chantT -= 0.5
    if (chantT <= 0) {
      chantT = 3.5
      const id = CROWD_IDS[Math.floor(Math.random() * CROWD_IDS.length)]
      g.bark(id, CHANT[Math.floor(Math.random() * CHANT.length)], 2200)
    }
  },
}

let crowdT = 0
let crowdI = 0
let chantT = 0
const CHANT = [
  l('Alfádir…', 'Alfádir…'),
  l('…wórrch-overr oss…', '…wórrch-overr oss…'),
  l('…grráid oss bákk-tu-stárrs…', '…grráid oss bákk-tu-stárrs…'),
]

async function hallIntro(g: GameAPI): Promise<void> {
  g.set('c13.hallIntro')
  g.cinematic(true)
  g.objective(null)
  await g.walk('elder', [6, 11], { speed: 1.4 })
  g.face('elder', 'player')
  await g.narrate(l('Starešina sa zastavil pred oblúkom. Kamenné bloky, obrovské a tesné, bez malty. Kameň nad vrcholom tmavší: andezit, čierny, hladký, a na ňom vytesaná hlava vlka s otvorenými čeľusťami, obrúsená tisícami dotykov.', 'The elder stopped before the arch. Stone blocks, huge and tight-fitting, without mortar. The stone above the keystone darker: andesite, black, smooth, and carved on it a wolf’s head with open jaws, worn by thousands of touches.'))
  await g.say('elder', l('Hel.', 'Hel.'))
  g.codex('world.c13_hel')
  await g.walk('player', [9, 10])
  void g.walk('flint', [10, 9])
  void g.walk('goji', [10, 11])
  void g.walk('aether', [12, 10], { speed: 1.4 })
  await g.focus([17, 12], { ms: 1600, zoom: 0.75 })
  await g.narrate(l('Zvuk prvý. Stovky hydraulických nitovačiek v dielňach vytesaných do skaly, za stenami, nad hlavou aj pod nohami. Kameň niesol ten zvuk lepšie než vzduch a skladal ho do jedného hlbokého pulzu. Nie melódia. Tep.', 'Sound first. Hundreds of hydraulic riveters in workshops cut into the rock, behind the walls, overhead and underfoot. The stone carried the sound better than air and folded it into one deep pulse. Not a melody. A heartbeat.'))
  await g.narrate(l('Potom teplo. Sálavé, suché, z trhlín v podlahe prekrytých železnými mrežami, pod ktorými žiarila skala. Hrubé stĺpy s kronikami celých generácií. Svetlo zhora z otvorov v strope; zdola oranžová žiara. Farba, čo nebola ani dňom, ani nocou.', 'Then heat. Radiant, dry, from cracks in the floor covered with iron grates, under which the rock glowed. Thick pillars bearing the chronicles of generations. Light from above through holes in the ceiling; from below, the orange glow. A colour that was neither day nor night.'))
  g.follow()
  await g.zoom(0.9, 600)
  g.face('goji', 'elder')
  await g.walk('elder', [11, 12])
  await g.say('goji', l('Hľadáme muža menom Maks. Prišiel pred časom. Nie vlk. Človek.', 'We are looking for a man named Maks. He came some time ago. Not a wolf. A human.'))
  await g.narrate(l('Starešina pozrel na Aethera. Aether mlčal. Odpoveď bola dlhá.', 'The elder looked at Aether. Aether said nothing. The answer was long.'))
  await goji(g, l('Pozná ho. Prišiel. Pomohol s prízrakom, čo sa prebudil, keď zapojili stroj.', 'He knows him. He came. He helped with a phantom that woke when they started a machine.'))
  await g.say('flint', l('Kde?', 'Where?'))
  await goji(g, l('V dierach. Predáva informácie. Za fľaše.', 'In the holes. He sells information. For bottles.'))
  g.codex('people.maks')
  await g.say('player', l('Za fľaše. Yera za stenami v Kitsune. A na konci cesty muž, čo pije.', 'For bottles. Yera behind walls in Kitsune. And at the end of the road, a man who drinks.'), { thought: true, mood: 'closed' })
  // the riveters fall silent
  g.music(null, 1500)
  await g.atmosphere({ sounds: ['cave'] }, 1500)
  await g.narrate(l('Nitovačky stíchli. Najprv tá najbližšia: vlk s okuliarmi na čele s rukou na páke ventilu ďalší ťah už nespravil. Potom vedľajšia. Potom ďalšia. Mlčanie sa šírilo do hĺbky skaly, dielňa za dielňou.', 'The riveters went silent. The nearest first: a wolf with goggles pushed up on his brow, hand on a valve lever, did not make the next stroke. Then the one beside it. Then the next. The silence spread deep into the rock, workshop by workshop.'))
  await g.narrate(l('Až po jeho stíchnutí doľahlo na všetkých poznanie, že Hel práve prišiel o svoj pulz.', 'Only when it stopped did they all realise that Hel had just lost its pulse.'))
  for (let i = 0; i < CROWD_IDS.length; i++) {
    g.face(CROWD_IDS[i], 'aether')
  }
  g.shake(0.2, 2500)
  g.bark('w3', l('ALFADIR!', 'ALFADIR!'), 2200)
  await g.wait(500)
  g.bark('w9', l('Alfadir!', 'Alfadir!'), 2200)
  g.bark('w14', l('Alfadir!', 'Alfadir!'), 2200)
  for (let i = 0; i < CROWD_IDS.length; i++) {
    g.pose(CROWD_IDS[i], 'kneel')
    if (i % 3 === 0) await g.wait(120)
  }
  g.music('iron_army', 1200)
  await g.narrate(l('Krik. Nie strach. Úžas. Jedno slovo. Z jedného hrdla. Z ďalšieho. Stovky hrdiel, odrážajúce sa od stien priepasti ako ozvena ozveny.', 'A cry. Not fear. Awe. One word. From one throat. From the next. Hundreds of throats, echoing off the walls of the pit like the echo of an echo.'))
  await g.narrate(l('Alfadir. Desaťtisíce. Priepasť vibrovala.', 'Alfadir. Tens of thousands. The pit trembled.'))
  await g.say('goji', l('Yip…', 'Yip…'), { mood: 'surprised' })
  await g.narrate(l('Aether stál uprostred. Nehybný. Pokojný. Stred, okolo ktorého sa celé mesto zosypávalo na kolená.', 'Aether stood at the centre. Motionless. Calm. The centre around which the whole city was collapsing to its knees.'))
  g.set('c13.alfadir')
  void g.walk('aether', [17, 6], { speed: 1.4 })
  void g.walk('flint', [15, 4])
  void g.walk('goji', [19, 4])
  void g.walk('elder', [13, 5])
  g.cinematic(false)
  g.objective(l('Dav ťa nesie k čiernej stene.', 'The crowd carries you to the black wall.'))
}

async function starWall(g: GameAPI): Promise<void> {
  g.set('c13.wall')
  g.cinematic(true)
  g.objective(null)
  await g.walk('player', [17, 3])
  g.face('player', 180)
  await g.narrate(l('Čierny kameň, hladký, odlišný od okrovej skaly. Pri päte kadidlo. Dav okolo nich stíchol. Na kameni hviezdy.', 'Black stone, smooth, unlike the ochre rock. Incense at its foot. The crowd around them fell silent. On the stone, stars.'))
  await g.read(
    l('Hviezdna stena', 'The Star Wall'),
    l(
      'Konštelácie. Stovky bodov vytesaných do čierneho kameňa. Biele zárezy spojené líniami tak tenkými, že sa ukážu len v správnom uhle.\n\nSedem bodov vpravo hore. Pás, ramená, nohy. Rovnaké usporiadanie, ako ho Arkot pozná z nocí nad Diss. Ale niektoré body chýbajú. Iné sú posunuté. O dosť. Ako mapa prekresľovaná z pamäti niekým, kto sa díval na tie isté hviezdy z iného miesta.\n\nA uprostred: červený kruh. Pigment vtlačený do kameňa, tmavočervený, sýty aj po vekoch.\n\n*Infera.*',
      'Constellations. Hundreds of points cut into black stone. White notches joined by lines so fine they show only at the right angle.\n\nSeven points, upper right. A belt, shoulders, legs. The same arrangement Arkot knows from the nights over Diss. But some points are missing. Others are shifted. By a lot. Like a map redrawn from memory by someone who looked at the same stars from another place.\n\nAnd in the middle: a red circle. Pigment pressed into the stone, dark red, deep even after ages.\n\n*Infera.*',
    ),
    { style: 'stone' },
  )
  g.codex('world.c13_star_wall')
  await g.narrate(l('Ten, kto toto tesal, hľadel na iné nebo.', 'Whoever carved this was looking at a different sky.'))
  await g.say('player', l('Navigátor dokáže zniesť neznámu oblohu. Nezniesie oblohu, čo vyzerá ako domov a nie je.', 'A navigator can bear an unknown sky. He cannot bear a sky that looks like home and isn’t.'), { thought: true, mood: 'fear' })
  await g.narrate(l('Prsty mu samé vyleteli k stene, k tej červenej rane v kameni. Nebola to mapa cesty. Bola to mapa pôvodu.', 'His fingers flew to the wall on their own, to that red wound in the stone. It was not a map of a journey. It was a map of an origin.'))
  // the ritual
  for (let i = 0; i < 13; i++) g.propVisible(`rt${i}`, true)
  g.music('iron_army', 800)
  g.bark('w2', CHANT[0], 2600)
  await g.wait(700)
  g.bark('w4', CHANT[1], 2600)
  await g.wait(700)
  g.bark('w8', CHANT[2], 2600)
  await g.narrate(l('Kým počítal hviezdy, svet za jeho chrbtom sa zmenil. Okolo neho sa Hel modlil. Vonná živica a dym zo starých čias. Fakle, stovky. A hlboký, temný spev, čo mu rezonoval v kostiach.', 'While he counted the stars, the world behind his back changed. Around him Hel was praying. Fragrant resin and the smoke of old times. Torches, hundreds of them. And a deep, dark chant that resonated in his bones.'))
  await g.narrate(l('Alfádir… wórrch-overr oss… grráid oss bákk-tu-stárrs…', 'Alfádir… wórrch-overr oss… grráid oss bákk-tu-stárrs…'))
  await g.narrate(l('A Yera bola niekde za iným obzorom. Nie medzi hviezdami. Medzi stenami, čo sa zužovali.', 'And Yera was somewhere beyond another horizon. Not among the stars. Between walls that were closing in.'))
  g.face('flint', 'player')
  void g.walk('flint', [16, 3])
  await g.say('flint', l('Idem dole. Hľadať toho človeka.', 'I’m going down. To find that man.'), { mood: 'determined' })
  await g.narrate(l('Flint ho krátko a tvrdo chytil za rameno. Goji za ním. Zmizli v dave skôr, než Arkot stihol odpovedať.', 'Flint gripped his shoulder, briefly, hard. Goji went after him. They vanished into the crowd before Arkot could answer.'))
  void g.walk('flint', [11, 24], { run: true })
  void g.walk('goji', [11, 24], { run: true })
  await g.wait(1600)
  g.show('flint', false)
  g.show('goji', false)
  await g.narrate(l('Zostal sám. Aether vedľa neho. Alebo on vedľa Aethera.', 'He was left alone. Aether beside him. Or he beside Aether.'))
  await g.walk('aether', [26, 2], { speed: 1.4 })
  g.face('aether', 'player')
  await g.narrate(l('Aether kráčal s istotou v každom kroku a zastavil sa pred bránou, nízkou a úzkou, s tmavším kameňom nad ňou. Dav sa zastavil v náhlom, úplnom tichu. Nikto neprešiel za bránu. Za bránou biele svetlo.', 'Aether walked with certainty in every step and stopped before a gate, low and narrow, with darker stone above it. The crowd stopped in sudden, total silence. No one went past the gate. Beyond the gate, white light.'))
  g.cinematic(false)
  g.objective(l('Choď za Aetherom cez nízku bránu.', 'Follow Aether through the low gate.'))
}

/** After the tower: the ritual crowd, the heavy hour and the map in his head. */
function runState(g: GameAPI): void {
  for (let i = 0; i < 13; i++) g.propVisible(`rt${i}`, true)
  for (const id of ['flint', 'goji', 'aether', 'elder', 'esc1', 'esc2']) g.show(id, false)
  g.sai('heavy')
  g.objective(l('Šachta napravo. Schody naľavo. Tretia odbočka. Dole.', 'The shaft on the right. The stairs on the left. The third turn. Down.'))
  void g.once('c13.runIntro', async () => {
    g.cinematic(true)
    await g.narrate(l('Ťažká hodina. Plná. V kostiach, na ramenách, v každom svale. Svet o tretinu ťažší a on sa práve rozhodol bežať.', 'The heavy hour. Full. In the bones, on the shoulders, in every muscle. The world a third heavier, and he had just decided to run.'))
    await g.narrate(l('Desaťtisíce tiel medzi ním a výťahom. Spev sa odrážal od stien priepasti, odovšadiaľ a zovšadiaľ. Ale mapa v hlave svietila. Body, línie, šachty.', 'Tens of thousands of bodies between him and the lift. The chant bounced off the walls of the pit, from everywhere and nowhere. But the map in his head was shining. Points, lines, shafts.'))
    g.cinematic(false)
    g.hint(l('Drž Shift a predieraj sa davom.', 'Hold Shift and push through the crowd.'))
  })
}

function departureState(g: GameAPI): void {
  g.sai('neutral')
  for (const id of CROWD_IDS) g.show(id, false)
  for (const id of ['w1', 'w5', 'w9', 'w13']) {
    g.show(id, true)
    g.pose(id, 'kneel')
  }
  g.show('flint', true)
  g.show('goji', true)
  g.teleport('flint', [4, 11])
  g.teleport('goji', [3, 12])
  g.show('aether', true)
  g.teleport('aether', [17, 8], 0)
  g.teleport('elder', [15, 8], 90)
  g.teleport('esc1', [14, 10], 90)
  g.teleport('esc2', [20, 10], 270)
  for (const id of ['blue', 'pup1', 'pup2', 'pup3']) g.show(id, true)
  g.objective(l('Nájdi Aethera v hale.', 'Find Aether in the hall.'))
  void g.atmosphere({ sounds: ['cave'], music: 'null_void' }, 800)
  void g.once('c13.departIntro', async () => {
    g.cinematic(true)
    await g.narrate(l('Stúpali späť hore. K svetlu, k teplu, k výhňam, čo stíchli. Goji sa držal steny celú cestu. Arkot viedol.', 'They climbed back up. To the light, the heat, the forges that had fallen silent. Goji kept a hand on the wall the whole way. Arkot led.'))
    await g.narrate(l('Aether nestál na palube. Našli ho v hale, medzi výhňami, čo stíchli. Vlčatá pri labách. Starešina vedľa. Vojaci po bokoch. Ako sprievod.', 'Aether was not on deck. They found him in the hall, among the silent forges. Pups at his paws. The elder beside him. Soldiers at his flanks. Like an honour guard.'))
    g.cinematic(false)
  })
}

async function farewell(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  void g.walk('goji', [16, 10])
  void g.walk('flint', [18, 11])
  await g.walk('player', [17, 10])
  g.face('player', 'aether')
  await g.narrate(l('Vlčica v modrom stála najbližšie. Hovorili v Staroreči. Aetherove jantárové oči pokojné. Pokojnejšie, než od Kitsune.', 'The she-wolf in blue stood closest. They were speaking the Old Tongue. Aether’s amber eyes were calm. Calmer than at any time since Kitsune.'))
  g.face('aether', 'goji')
  await g.narrate(l('Goji pristúpil. Aether sa naňho pozrel. Goji zastal. Uši dozadu. Zmysel mu došiel skôr, než padlo slovo.', 'Goji stepped closer. Aether looked at him. Goji stopped. Ears back. He understood before a word was spoken.'))
  await g.say('goji', l('Zostáva.', 'He’s staying.'), { mood: 'sad' })
  await g.narrate(l('Povedal to bez toho, aby sa otočil. Hlas tichý, plochý, definitívny.', 'He said it without turning round. His voice quiet, flat, final.'))
  await g.narrate(l('Flint sa díval na Aethera. Na vlčatá, čo mali jeho jantárové oči. Na vojakov. Na celé mesto, čo stíchlo pre jedného. Prikývol. Nie Aetherovi. Sebe.', 'Flint looked at Aether. At the pups that had his amber eyes. At the soldiers. At a whole city that had fallen silent for one. He nodded. Not to Aether. To himself.'))
  g.face('aether', 'player')
  const c = await g.choose([
    { id: 'thanks', text: l('„Ďakujem. Za cestu.“', '“Thank you. For the way here.”') },
    { id: 'family', text: l('„Našiel si ich. Svoju rodinu.“', '“You found them. Your family.”') },
    { id: 'bow', text: l('(Mlčky sa ukloniť.)', '(Bow in silence.)') },
  ])
  if (c === 'thanks') await g.say('player', l('Ďakujem. Za cestu.', 'Thank you. For the way here.'), { mood: 'tender' })
  else if (c === 'family') await g.say('player', l('Našiel si ich. Svoju rodinu.', 'You found them. Your family.'), { mood: 'tender' })
  else {
    g.pose('player', 'kneel')
    await g.wait(700)
    g.pose('player', 'stand')
  }
  await aether(g, 'Fajnd jórr nórs, nevigejtorr.')
  await g.say('goji', l('Nájdi si svoj sever, navigátor.', 'Find your north, navigator.'), { mood: 'tender' })
  g.set('c13.farewell')
  g.cinematic(false)
  g.objective(l('Vráť sa výťahom hore k Itake.', 'Take the lift back up to the Itaka.'))
}
