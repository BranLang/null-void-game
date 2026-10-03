/**
 * Kitsune's edge street: in the morning Flint follows Tami from Renn's gate to
 * the warning signs; at dusk they come back the same way, past the lamplighter
 * and the children on the wide steps, up to the amphitheatre docks.
 */
import type { AmbienceDef, MapDef, PlacedProp, SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { placeLeader, updateLeader, type Leader } from './util'
import './cast'
import './props'

// 20 x 30: Renn's wall and gate at the top left, the wide steps to the amphitheatre
// at the top right, the swept street down the middle, the forest and the sign below.
const STREET: MapDef = {
  rows: [
    'gggggggggg;;333333;;',
    'wwwwGwwwww;;333333;;',
    'w.........;;222222;;',
    'w.........;;111111;;',
    'HHH.................',
    'HHH........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    ';;;........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    'HHtt.......b;;;;;;;;',
    'HHH........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    ';;;........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    'HHH........b;;;;;;;;',
    ';;;........;;;;;;;;;',
    'TT;;ddddddd;;;TTTTTT',
    'TTT;dddddd;;;TTTTTTT',
    'TTTT;ddddd;;TTTTTTTT',
    'TTTT;ddzdd;TTTTTTTTT',
    'TTTT;ddddd;TTTTTTTTT',
    'TTTTTdddddTTTTTTTTTT',
    'TTTTTdddddTTTTTTTTTT',
    'TTTTTdddddTTTTTTTTTT',
    'TTTTTdddddTTTTTTTTTT',
    'TTTTTdddddTTTTTTTTTT',
  ],
  legend: {
    g: { floor: 'grass', tint: '#6a8a5a' },
    w: { floor: 'stone', wall: 'stone', wallH: 1.9 },
    G: { floor: 'cobble', tint: '#a8a49a', tag: 'gate' },
    H: { floor: 'stone', wall: 'brick', wallH: 2.9 },
    '.': { floor: 'cobble', tint: '#aca698' },
    t: { floor: 'stone', tint: '#8c8478', tag: 'step' },
    ';': { floor: 'grass', tint: '#7a9a68' },
    b: { floor: 'stone', wall: 'stone', wallH: 0.7 },
    d: { floor: 'dirt', tint: '#86765a' },
    T: { floor: 'grass', tint: '#5d7a4c' },
    z: { floor: 'dirt', tint: '#86765a', tag: 'sign' },
    '1': { floor: 'stone', h: 1, stairs: true, tint: '#c8c0b0' },
    '2': { floor: 'stone', h: 2, stairs: true, tint: '#bcb4a4' },
    '3': { floor: 'stone', h: 3, stairs: true, tint: '#c8c0b0', tag: 'steps' },
  },
}

/** Props shared by both times of day. Lamps are passed in (unlit / lit). */
function streetProps(lamps: PlacedProp[]): PlacedProp[] {
  return [
    { type: 'gate', at: [4, 1], params: { open: true }, solid: false },
    { type: 'tree', at: [1, 0], params: { size: 1.2 } },
    { type: 'tree', at: [8, 0], params: { size: 1.1 } },
    { type: 'bush', at: [5, 0] },
    { type: 'window', at: [3, 5], rot: 90, params: { shutters: true, lit: false } },
    { type: 'window', at: [3, 7], rot: 90, params: { lit: false } },
    { type: 'window', at: [3, 13], rot: 90, params: { shutters: true, lit: false } },
    { type: 'window', at: [3, 17], rot: 90, params: { lit: false, flowers: true } },
    { type: 'door', at: [2, 11], rot: 90 },
    { type: 'barrel', at: [3, 14] },
    { type: 'crate', at: [3, 18] },
    { type: 'bush', at: [13, 6], params: { flowers: true } },
    { type: 'tree', at: [15, 8] },
    { type: 'tree', at: [17, 13] },
    { type: 'bush', at: [13, 16] },
    { type: 'flowers', at: [12, 10] },
    { type: 'flowers', at: [14, 18] },
    { type: 'fence', at: [16, 5] },
    { type: 'paper_lantern', at: [12, 0] },
    { type: 'paper_lantern', at: [17, 0] },
    { type: 'banner', at: [10, 2], params: { emblem: 'none' }, color: '#c8642a' },
    // the forest begins
    { type: 'jungle_tree', at: [1, 23] },
    { type: 'jungle_tree', at: [16, 22] },
    { type: 'jungle_tree', at: [13, 27] },
    { type: 'tree', at: [2, 27], params: { canopy: '#3f7a4a' } },
    { type: 'tree', at: [11, 21] },
    { type: 'bush', at: [3, 21] },
    { type: 'bush', at: [11, 25] },
    { type: 'roots', at: [6, 27], rot: 40 },
    { type: 'grass', at: [4, 24] },
    { type: 'grass', at: [10, 22] },
    { type: 'mushroom', at: [4, 26], color: '#7aff9a' },
    { type: 'pillar', at: [12, 24], params: { broken: true, style: 'white' } },
    { type: 'rock', at: [3, 28], params: { moss: true } },
    // warning signs: a white circle, a face without expression
    { type: 'sign', at: [7, 23] },
    { type: 'sign', at: [3, 25] },
    { type: 'sign', at: [12, 23] },
    ...lamps,
  ]
}

const LAMPS: [number, number][] = [
  [10, 5],
  [10, 9],
  [10, 13],
  [10, 17],
]

const morningAmb: AmbienceDef = {
  sky: { top: '#7d8b96', bottom: '#bcc6c8', stars: 0, clouds: 0.5 },
  fog: { color: '#a2acb0', near: 10, far: 38 },
  hemi: { sky: '#d4dde4', ground: '#5a5a4c', intensity: 1.45 },
  sun: { color: '#eef2f4', intensity: 1.15, dir: [-0.4, 1, 0.5] },
  exposure: 1.12,
  bloom: { strength: 0.55, threshold: 0.85 },
  grade: { tint: '#e8eef0', saturation: 0.92, contrast: 1.04, vignette: 0.38 },
  particles: [
    { kind: 'rain', count: 420, id: 'rain' },
    { kind: 'leaves', count: 24 },
  ],
  music: 'moss',
  sounds: ['rain', 'crowd'],
}

const duskAmb: AmbienceDef = {
  sky: { top: '#1d2336', bottom: '#6a5866', stars: 0.15, clouds: 0.4 },
  fog: { color: '#3a3a4a', near: 6, far: 30 },
  hemi: { sky: '#6a78a0', ground: '#2a2420', intensity: 0.85 },
  sun: { color: '#ffb080', intensity: 0.35, dir: [0.6, 0.45, 0.3] },
  exposure: 1.0,
  bloom: { strength: 0.95, threshold: 0.72 },
  grade: { tint: '#f0e4dc', saturation: 0.92, contrast: 1.06, vignette: 0.45 },
  particles: [{ kind: 'rain', count: 360, id: 'rain' }],
  music: 'main',
  sounds: ['rain', 'crowd'],
}

// ---------------------------------------------------------------------------------- morning
const tamiMorning: Leader = {
  id: 'tami',
  path: [
    [5, 3],
    [6, 6],
    [7, 10],
    [7, 14],
    [7, 18],
    [7, 21],
    [9, 23],
    [8, 26],
    [7, 28],
  ],
  key: 'c10.stWp',
  near: 3.3,
  speed: 2.3,
  busy: false,
}

export const streetScene: SceneDef = {
  id: 'c10_street',
  name: l('Ulica k značkám', 'The Street to the Signs'),
  ambience: morningAmb,
  map: STREET,
  props: streetProps(LAMPS.map((at) => ({ type: 'ch10_lamp', at }))),
  player: { character: 'flint', at: [4, 2], facing: 315 },
  spawns: { gate: [4, 2] },
  actors: [
    {
      id: 'tami',
      character: 'tami',
      at: [5, 3],
      facing: 315,
      solid: false,
      talk: async (g) => {
        g.face('tami', 'player')
        if (g.flag('c10.crossed')) {
          await g.say('tami', l('Nosom. A za mnou.', 'Through your nose. And behind me.'))
          return
        }
        await g.say('tami', l('Čo je?', 'What?'))
        await g.say('player', l('Nič. Len kontrolujem, či ešte dýchaš.', 'Nothing. Just checking you’re still breathing.'), { mood: 'happy' })
        await g.say('tami', l('Dýcham. Ty pozeraj pod nohy.', 'I am. You watch your feet.'))
      },
    },
    {
      id: 'babka',
      character: 'c10_babka',
      at: [3, 11],
      facing: 90,
      label: l('Pozdraviť', 'Greet'),
      talk: async (g) => {
        g.face('babka', 'tami')
        await g.say('player', l('Dobré ráno, babka.', 'Good morning, granny.'), { mood: 'happy' })
        await g.narrate(l('Neodpovedala. Metlu zvierala oboma rukami a hľadela za Tami.', 'She did not answer. She held the broom in both hands and stared after Tami.'))
      },
    },
  ],
  interactables: [
    {
      id: 'signlook',
      at: [7, 23],
      label: l('Značka', 'The sign'),
      verb: 'look',
      radius: 1.8,
      run: async (g) => {
        await g.narrate(l('Biely kruh, tvár bez výrazu. Prázdne oči, otvorené ústa. Nie zvieracia, no ani celkom ľudská.', 'A white circle, a face without expression. Empty eyes, an open mouth. Not an animal’s face, and not quite a human one.'))
        await g.say('player', l('Nechodíme. Nikdy. A predsa tu stojíme.', 'We don’t go there. Never. And yet here we stand.'), { thought: true })
      },
    },
    {
      id: 'lampLook',
      at: [10, 9],
      label: l('Liehová lampa', 'Spirit lamp'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Zhasnutá liehová lampa na železnom stĺpe. V Kitsune sa nesvieti iskrou. Iskra je od Lekcie Krvi zakázaná na celom Ahile.', 'An unlit spirit lamp on an iron post. Kitsune does not light anything with a spark. Since the Lesson of Blood, the spark is forbidden across all of Ahil.'))
        g.codex('world.lesson_of_blood')
      },
    },
  ],
  triggers: [
    {
      id: 'lesson',
      area: [3, 5, 10, 7],
      run: async (g) => {
        await g.say('player', l('Kapitánka.', 'Captain.'))
        await g.say('tami', l('Hm.', 'Hm.'))
        await g.say('player', l('Tá lekcia. Kedy začína?', 'That lesson. When does it start?'))
        await g.say('tami', l('Keď si vyšiel z domu.', 'When you walked out of the house.'))
        await g.say('tami', l('Pozeraj, kam stúpam.', 'Watch where I step.'))
        await g.narrate(l('Pozeral. Na kamene, na ktoré stúpala ona, a na tie, čo obišla, hoci vyzerali rovnako. A aj inam, na uši pod kapucňou, ktoré sa jej striedavo stáčali dopredu k ceste a dozadu k nemu.', 'He watched. The stones she stepped on, and the ones she went around though they looked the same. And elsewhere too: the ears under her hood, turning forward to the road and back toward him by turns.'))
      },
    },
    {
      id: 'babka',
      area: [3, 9, 10, 11],
      run: async (g) => {
        g.face('babka', 'tami')
        g.pose('babka', 'stand')
        await g.narrate(l('Stará žena na prahu z kvádrov, čo k sebe nesedeli, prestala zametať, keď okolo nej prešli. Hľadela za Tami, s metlou zovretou oboma rukami.', 'An old woman on a doorstep of ill-fitting stone blocks stopped sweeping as they passed. She stared after Tami, the broom clenched in both hands.'))
        await g.say('player', l('Aj tebe dobré ráno, babka.', 'Good morning to you too, granny.'), { thought: true })
      },
    },
    {
      id: 'yesterday',
      area: [3, 13, 10, 15],
      run: async (g) => {
        await g.say('player', l('O včerajšku…', 'About yesterday…'))
        await g.narrate(l('Tamin krok na úder stratil rytmus.', 'Tami’s stride lost its rhythm for a beat.'))
        await g.say('tami', l('Čo o ňom?', 'What about it?'))
        await g.narrate(l('Mal pripravené tri vety, všetky vtipné, a niesol ich opatrne ako nabitú zbraň.', 'He had three sentences ready, all of them funny, and he carried them carefully, like a loaded gun.'))
        const c = await g.choose([
          { id: 'blanket', text: l('„Nabudúce si prines vlastnú prikrývku. Moja má diery.“', '“Next time bring your own blanket. Mine has holes.”') },
          { id: 'guard', text: l('„V Diss sa za strážnu službu platí. Aj v noci.“', '“In Diss you pay for guard duty. Nights too.”') },
          { id: 'fire', text: l('„Ten krb by potreboval kominára. A ty spánok.“', '“That fireplace needs a sweep. And you need sleep.”') },
          { id: 'shot', text: l('Povedať to, čo naozaj chce povedať.', 'Say what he actually means.') },
        ])
        if (c !== 'shot') {
          g.set('c10.joked')
          await g.narrate(l('Veta mu prišla až na jazyk. A tam zostala. Nepovedal ani jednu.', 'The sentence came as far as his tongue. And stayed there. He said none of them.'))
        }
        await g.say('player', l('Ten výstrel. Bol zbytočný.', 'That shot. It was pointless.'))
        await g.say('tami', l('Bol.', 'It was.'))
        await g.wait(500)
        await g.say('tami', l('Ale bol prvý.', 'But it was the first.'))
        await g.narrate(l('Viac z toho nedostal. V noci mu dýchala pod bradou; teraz ich delili dva kroky a ona ich neskrátila.', 'That was all he got. In the night she had breathed beneath his chin; now two steps lay between them, and she did not close them.'))
      },
    },
    {
      id: 'paving',
      area: [2, 20, 11, 20],
      run: async (g) => {
        void g.atmosphere({ sounds: ['rain', 'forest'] }, 1500)
        await g.narrate(l('Za poslednou lampou sa dlažba skončila a začínal les. Šum fontány a detské hlasy zo širokých schodov zostali niekde za nimi.', 'Past the last lamp the paving ended and the forest began. The murmur of the fountain and the children’s voices on the wide steps stayed somewhere behind them.'))
      },
    },
    {
      id: 'sign',
      area: [4, 22, 10, 22],
      run: async (g) => {
        g.cinematic(true)
        await g.focus('sign', { ms: 900, zoom: 1.25 })
        await g.narrate(l('Značka. Biely kruh, tvár bez výrazu.', 'The sign. A white circle, a face without expression.'))
        await g.say('player', l('Nechodíme. Nikdy.', 'We don’t go there. Never.'), { thought: true })
        await g.narrate(l('Tami ju obišla bez spomalenia.', 'Tami walked around it without slowing.'))
        await g.focus('player', { ms: 700, zoom: 1 })
        g.follow()
        await g.narrate(l('Flint zaváhal. Nepatrný okamih, možno menej. Dosť dlho na to, aby zneistel, a príliš krátko na to, aby Tami niečo zachytila.', 'Flint hesitated. A fraction of a moment, perhaps less. Long enough to lose his nerve, and too short for Tami to notice.'))
        g.cinematic(false)
        g.objective(l('Prekroč hranicu za značkami.', 'Cross the line beyond the signs.'))
      },
    },
    {
      id: 'cross',
      area: [4, 25, 10, 26],
      run: async (g) => {
        g.set('c10.crossed')
        g.music(null, 1500)
        void g.atmosphere(
          {
            fog: { color: '#6f7a70', near: 4, far: 22 },
            grade: { tint: '#dfe8dc', saturation: 0.72, contrast: 1.1, vignette: 0.55 },
            sounds: ['rain', 'drone'],
          },
          1800,
        )
        g.shake(0.08, 900)
        await g.narrate(l('Potom prekročil hranicu aj on.', 'Then he crossed the line too.'))
        await g.narrate(l('Vzduch sa zmenil okamžite. Tlakom. Akoby niekto cez celú ulicu pretiahol mokrú plachtu a Flint musel dýchať cez ňu.', 'The air changed at once. Pressure. As if someone had drawn a wet sheet across the whole street and Flint had to breathe through it.'))
        await g.narrate(l('Na jazyku mal chuť, akú nepoznal. Suchú, kovovú, starú. Ako keď lížeš nábojnicu, len jemnejšie. Všade.', 'There was a taste on his tongue he did not know. Dry, metallic, old. Like licking a cartridge, only finer. Everywhere.'))
        await g.say('tami', l('Dýchaj nosom. Ústa zavri.', 'Breathe through your nose. Close your mouth.'))
        await g.say('player', l('Ďakujem za radu, kapitánka.', 'Thank you for the advice, Captain.'), { thought: true, mood: 'angry' })
        await g.narrate(l('Ale ústa zavrel.', 'But he closed his mouth.'))
        g.codex('world.vonkajsie_ruiny')
        g.objective(l('Choď za Tami do ruín.', 'Follow Tami into the ruins.'))
      },
    },
  ],
  exits: [
    {
      area: [5, 29, 9, 29],
      to: 'c10_ruins',
      spawn: 'entry',
      when: (g) => !!g.flag('c10.crossed'),
      blocked: l('Najprv prekroč tú čiaru.', 'First, cross that line.'),
    },
  ],
  onEnter: async (g) => {
    placeLeader(g, tamiMorning)
    await g.once('c10.street', async () => {
      g.cinematic(true)
      await g.wait(400)
      await g.narrate(l('V noci sa mu opierala chrbtom o hruď a ráno o tom nepadlo ani slovo.', 'In the night she had leaned her back against his chest, and in the morning not a word was said about it.'))
      g.sfx('door', 0.7)
      g.emote('player', '!')
      await g.narrate(l('Zo záhrady Rennovho domu vyšli bránkou, čo zaškrípala tak, že sa Flint strhol. Tami nie. Kráčala dva kroky pred ním, kapucňu na hlave, ruku na meči, a dážď jej stekal za golier.', 'They left the garden of Renn’s house by a little gate that creaked so loudly Flint flinched. Tami did not. She walked two steps ahead of him, hood up, hand on her sword, rain running down her collar.'))
      await g.narrate(l('Skladal si tú noc po kúskoch, tak ako sa ráno po kartách ráta, čo zostalo vo vrecku. Krb. Revolver, čo mu zdvihla z podlahy a položila za seba. Jej váha, najprv opatrná, potom celá.', 'He pieced the night together the way you count what’s left in your pocket the morning after cards. The fire. The revolver she picked up off the floor and put behind her. Her weight, careful at first, then all of it.'))
      await g.narrate(l('Opierala sa oň až do svitania a ani raz nezaspala. Počúval jej nádychy, tak ako ona sledovala tmu za oknom, a ani jeden z nich sa neprezradil.', 'She leaned on him until dawn and never once fell asleep. He listened to her breathing the way she watched the dark beyond the window, and neither of them gave anything away.'))
      g.cinematic(false)
      g.objective(l('Choď za Tami. Pozeraj, kam stúpa.', 'Follow Tami. Watch where she steps.'))
      g.hint(l('WASD — chôdza · Shift — beh · E — rozhovor', 'WASD — walk · Shift — run · E — talk'))
      g.checkpoint()
    })
    if (g.flag('c10.crossed')) void g.atmosphere({ fog: { color: '#6f7a70', near: 4, far: 22 }, grade: { saturation: 0.72 }, sounds: ['rain', 'drone'] }, 0)
  },
  onUpdate: (g) => {
    updateLeader(g, tamiMorning)
  },
}

// ---------------------------------------------------------------------------------- dusk
interface Kid {
  id: string
  t: number
}
const kids: Kid[] = [
  { id: 'kid1', t: 0 },
  { id: 'kid2', t: 1.2 },
  { id: 'kid3', t: 2.1 },
]

function kidsPlay(g: GameAPI, dt: number): void {
  for (const k of kids) {
    k.t -= dt
    if (k.t > 0) continue
    k.t = 1.6 + Math.random() * 2.2
    if (g.flag('c10.kidsRan') && k.id === 'kid1') continue
    const target: [number, number] = [12 + Math.floor(Math.random() * 6), 2 + Math.floor(Math.random() * 3)]
    void g.walk(k.id, target, { run: true })
  }
}

function lightLamp(g: GameAPI, i: number): void {
  if (g.flag(`c10.lamp${i}`)) return
  g.set(`c10.lamp${i}`)
  g.propVisible(`lamp${i}`, false)
  g.propVisible(`lamp${i}on`, true)
  g.sfx('fire', 0.4)
}

export const duskScene: SceneDef = {
  id: 'c10_dusk',
  name: l('Návrat za súmraku', 'The Return at Dusk'),
  ambience: duskAmb,
  map: STREET,
  props: streetProps(
    LAMPS.flatMap((at, i) => [
      { type: 'ch10_lamp', at, id: `lamp${i}` },
      { type: 'ch10_lamp', at, id: `lamp${i}on`, hidden: true, params: { lit: true } },
    ]),
  ).concat([
    { type: 'lantern', at: [13, 1], params: { style: 'post' } },
    { type: 'lantern', at: [16, 3], params: { style: 'post' } },
    { type: 'stall', at: [18, 4] },
    { type: 'basket', at: [17, 5] },
  ]),
  player: { character: 'flint', at: [7, 26], facing: 135 },
  actors: [
    { id: 'tami', character: 'tami', at: [8, 27], facing: 135, solid: false },
    { id: 'lamplighter', character: 'c10_lamplighter', at: [9, 19], facing: 135, solid: false },
    { id: 'kid1', character: 'c10_kid1', at: [13, 3], facing: 0, solid: false },
    { id: 'kid2', character: 'c10_kid2', at: [15, 2], facing: 90, solid: false },
    { id: 'kid3', character: 'c10_kid3', at: [16, 3], facing: 180, solid: false },
  ],
  triggers: [
    {
      id: 'town',
      area: [3, 19, 10, 21],
      run: async (g) => {
        await g.narrate(l('Mesto sa k nim vracalo postupne. Najprv dlažba, potom lampy; na stĺpoch ich zapaľoval starec s dlhou tyčou a každá chvíľu syčala, kým lieh nechytil.', 'The city came back to them a little at a time. First the paving, then the lamps; an old man with a long pole was lighting them on their posts, and each one hissed a while before the spirit caught.'))
        g.face('lamplighter', [10, 17])
        void g.walk('lamplighter', [9, 17]).then(() => lightLamp(g, 3))
      },
    },
    {
      id: 'lamp2',
      area: [3, 14, 10, 15],
      run: (g) => {
        void g.walk('lamplighter', [9, 13]).then(() => lightLamp(g, 2))
      },
    },
    {
      id: 'smell',
      area: [3, 11, 10, 12],
      run: async (g) => {
        void g.walk('lamplighter', [9, 9]).then(() => lightLamp(g, 1))
        await g.narrate(l('Pachlo mokrým kameňom. Z amfiteátra, kde už balili trh, sa niesla vôňa smažených húb.', 'It smelled of wet stone. From the amphitheatre, where the market was packing up, drifted the smell of fried mushrooms.'))
      },
    },
    {
      id: 'kids',
      area: [3, 4, 11, 7],
      run: async (g) => {
        void g.walk('lamplighter', [9, 5]).then(() => lightLamp(g, 0))
        g.set('c10.kidsRan')
        await g.walk('kid1', [11, 4], { run: true })
        g.face('kid1', 'player')
        g.pose('kid1', 'point')
        g.emote('kid1', '!')
        await g.say('kid1', l('Pozrite! Má krvavé kolená!', 'Look! His knees are all bloody!'))
        g.face('player', 'kid1')
        await g.narrate(l('Flint mu vyplazil jazyk.', 'Flint stuck his tongue out at him.'))
        g.emote('kid1', '♪')
        g.pose('kid1', 'stand')
        void g.walk('kid1', [15, 1], { run: true })
        g.emote('tami', '…')
        await g.wait(400)
      },
    },
  ],
  exits: [{ area: [12, 0, 17, 0], to: 'c10_itaka', label: l('Do amfiteátra', 'To the amphitheatre') }],
  onEnter: async (g) => {
    for (let i = 0; i < LAMPS.length; i++) if (g.flag(`c10.lamp${i}`)) {
      g.propVisible(`lamp${i}`, false)
      g.propVisible(`lamp${i}on`, true)
    }
    g.companion('tami', true)
    await g.once('c10.dusk', async () => {
      g.objective(l('Odnes kryštály na Itaku. Do amfiteátra.', 'Carry the crystals to the Itaka. Up to the amphitheatre.'))
      g.checkpoint()
    })
  },
  onUpdate: (g, dt) => {
    kidsPlay(g, dt)
  },
}
