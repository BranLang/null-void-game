/**
 * Kapitola 21 (opening): the Diera. A clean stone terrace among wolf graves; pups who steal
 * apples; hunters with Graw rifles who kneel, one after another, before Aether. “Children of fire.”
 */
import type { ActorDef, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { diera } from './ambience'
import { aether, goji } from './util'

const GRAVES: Vec2[] = []
for (let y = 4; y <= 8; y += 2) for (let x = 3; x <= 13; x += 2) GRAVES.push([x + (y % 4 === 0 ? 0 : 1), y])

const HUNTER_SPOTS: Vec2[] = [
  [9, 6],
  [11, 4],
  [13, 3],
  [15, 3],
  [8, 9],
  [9, 11],
  [12, 11],
  [21, 11],
  [23, 10],
  [16, 2],
]
const HUNTER_FROM: Vec2[] = [
  [3, 1],
  [11, 1],
  [11, 1],
  [18, 1],
  [3, 1],
  [3, 1],
  [11, 1],
  [18, 1],
  [18, 1],
  [18, 1],
]

const hunters: ActorDef[] = HUNTER_SPOTS.map((_, i) => ({
  id: `h${i + 1}`,
  character: i === 0 ? 'c13_scar' : `c13_hunter${i}`,
  at: HUNTER_FROM[i],
  facing: 0,
  hidden: true,
}))

export const terraceScene: SceneDef = {
  id: 'c13_terrace',
  name: l('Diera', 'The Diera'),
  ambience: diera,
  camera: { zoom: 0.95 },
  sai: { phase: 'light' },
  map: {
    rows: [
      'CCCCCCCCCCCCCCCCCCCCCCCCCC',
      'CCCTCCCCCCCTCCCCCCTCCCCCCC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPC',
      'CPPPPPPPPPPPPPPPPPPPPPPPPP',
      'CPPPPPPPPPPPPPPPPPPPPPPPPP',
      'CPPPPPPPPPPPPPPPPPPPPPPPPP',
      'uuuuuuuuuuuuuuuuuuuuuuuuuu',
      'uuuuuuuuuuuuuuuuuuuuuuuuuu',
      'rrrrrrrrrrrrrrrrrrrrrrrrrr',
      'LLLLddddLLLLLLddddLLLLLLLL',
      'LLLLddddLLLLLLddddLLLLLLLL',
      'LLLLLLLLLLLLLLLLLLLLLLLLLL',
    ],
    legend: {
      C: { floor: 'rock', h: 4, wall: 'rock', wallH: 3.2 },
      T: { floor: 'obsidian', h: 4, tint: '#1a1416' },
      P: { floor: 'stone', h: 4, tint: '#8e8884' },
      u: { floor: 'metal', h: 1, tint: '#7a5a44' },
      r: { floor: 'metal', h: 1, wall: 'rust', wallH: 0.55 },
      d: { floor: 'metal', tint: '#6a4a38' },
      L: { floor: 'lava' },
    },
  },
  props: [
    { type: 'c13_itaka_bare', at: [20, 6], y: 0.15, id: 'itaka' },
    { type: 'anchor', at: [16, 10] },
    ...GRAVES.map((at) => ({ type: 'c13_wolfstone', at })),
    { type: 'candles', at: [6, 5] },
    { type: 'candles', at: [10, 7] },
    { type: 'candles', at: [4, 9] },
    { type: 'arch', at: [3, 1], params: { style: 'andesite' } },
    { type: 'arch', at: [11, 1], params: { style: 'andesite' } },
    { type: 'arch', at: [18, 1], params: { style: 'andesite' } },
    { type: 'torch', at: [2, 2], params: { standing: true } },
    { type: 'torch', at: [12, 2], params: { standing: true } },
    { type: 'torch', at: [19, 2], params: { standing: true } },
    { type: 'pipe', at: [3, 12], params: { vertical: true } },
    { type: 'pipe', at: [9, 13], rot: 90 },
    { type: 'gear', at: [14, 12], params: { standing: true, spin: true } },
    { type: 'brazier', at: [6, 13] },
    { type: 'brazier', at: [18, 13] },
    { type: 'crate', at: [22, 12], params: { stack: true } },
    { type: 'barrel', at: [11, 13] },
    { type: 'pipe', at: [24, 13], params: { vertical: true } },
    { type: 'brazier', at: [5, 15] },
    { type: 'brazier', at: [16, 16] },
  ],
  player: { character: 'arkot_glyph', at: [17, 9], facing: 270 },
  actors: [
    { id: 'flint', character: 'flint', at: [16, 8], facing: 270 },
    { id: 'goji', character: 'goji', at: [17, 10], facing: 270 },
    { id: 'dara', character: 'dara', at: [18, 10], facing: 270 },
    { id: 'yori', character: 'yori', at: [21, 10], facing: 270 },
    { id: 'aether', character: 'aether', at: [20, 4], facing: 270, hidden: true },
    { id: 'pup1', character: 'c13_pup6', at: [11, 1], hidden: true },
    { id: 'pup2', character: 'c13_pup1', at: [11, 1], hidden: true },
    { id: 'pup3', character: 'c13_pup2', at: [3, 1], hidden: true },
    { id: 'pup4', character: 'c13_pup3', at: [3, 1], hidden: true },
    { id: 'pup5', character: 'c13_pup4', at: [18, 1], hidden: true },
    ...hunters,
    { id: 'elder', character: 'wolf_elder', at: [11, 1], hidden: true },
    { id: 'woman1', character: 'c13_woman1', at: [11, 1], hidden: true },
    { id: 'woman2', character: 'c13_woman2', at: [11, 1], hidden: true },
  ],
  interactables: [
    {
      id: 'graves',
      at: [8, 6],
      label: l('Hrobové kamene', 'The grave stones'),
      verb: 'look',
      when: (g) => !g.flag('c13.kneel'),
      run: async (g) => {
        await g.narrate(l('Nízke, hladké kamene, zapustené do skaly v pravidelných radoch. Na každom vytesaný symbol: vlčí profil, tlapa, meno v jazyku, čo Arkot nepoznal.', 'Low, smooth stones sunk into the rock in regular rows. On each a carved sign: a wolf’s profile, a paw, a name in a language Arkot did not know.'))
        await g.narrate(l('Medzi nimi zvyšky kadidla, suchá tráva v malých nádobách, kúsky mosadze obrúsené prstami, položené na kameňoch ako dary. Posvätná pôda. Zo skaly neprestávali duniť nitovačky.', 'Between them, the remains of incense, dry grass in little pots, scraps of brass worn smooth by fingers, laid on the stones like gifts. Holy ground. From the rock the riveters never stopped pounding.'))
      },
    },
    {
      id: 'edge',
      at: [12, 11],
      label: l('Pozrieť do priepasti', 'Look down into the pit'),
      verb: 'look',
      when: (g) => !g.flag('c13.kneel'),
      run: async (g) => {
        await g.focus([12, 15], { ms: 900, zoom: 0.85 })
        await g.narrate(l('Dole nebol život, aký poznali z Nyau. Oranžová žiara pulzovala v stenách vyžratých ako od kazu a každá dutina bola dielňa. Žeriavy sa krútili nad prázdnotou ako ručičky kompasu, čo nenašli sever.', 'Below was no life they knew from Nyau. An orange glow pulsed in walls eaten away as if by rot, and every hollow was a workshop. Cranes turned over the void like compass needles that could not find north.'))
        await g.narrate(l('Tisíce pneumatických nitovačiek búšili do plechu, bez taktu a bez prestávky. Nie ako práca. Ako trest.', 'Thousands of pneumatic riveters hammered at plate, without rhythm and without rest. Not like work. Like punishment.'))
        g.follow()
        await g.zoom(0.95, 600)
      },
    },
  ],
  onEnter: async (g) => {
    await g.once('c13.terraceIntro', async () => {
      g.cinematic(true)
      g.shake(0.25, 1500)
      await g.narrate(l('Termálne prúdy udierali do trupu zdola ako päste opilca. Arkot visel celou váhou na kolese výškovky. Dara volala uhly z prídi. Desať stôp. Päť. Tri.', 'Thermals struck the hull from below like a drunkard’s fists. Arkot hung his whole weight on the elevator wheel. Dara called the angles from the bow. Ten feet. Five. Three.'))
      g.sfx('boom', 0.6)
      await g.narrate(l('Kotva s rachotom dopadla na plochý kameň. Jediná plošina, čo bola dosť široká. Neprirodzene čistá, bez hrdze a sadze, čo sčernili zvyšok priepasti.', 'The anchor crashed down onto flat stone. The only ledge wide enough. Unnaturally clean, free of the rust and soot that blackened the rest of the pit.'))
      g.codex('world.c13_diera')
      // the pups
      for (const [id, to] of [
        ['pup1', [10, 5]],
        ['pup2', [12, 6]],
        ['pup3', [5, 6]],
        ['pup4', [7, 7]],
        ['pup5', [15, 5]],
      ] as [string, Vec2][]) {
        g.show(id, true)
        void g.walk(id, to, { speed: 2.6 })
        await g.wait(250)
      }
      await g.narrate(l('Objavili sa hneď, ešte kým doťahovali kotevné laná, a boli to deti. Malé, po pás dospelému, s krátkymi ušami a veľkými žltými očami. Ťahali sa za chvosty, strkali do seba, hádali sa šeptom.', 'They appeared at once, while the mooring lines were still being made fast, and they were children. Small, waist-high to a grown-up, with short ears and big yellow eyes. Pulling each other’s tails, shoving, quarrelling in whispers.'))
      g.cinematic(false)
      g.objective(l('Ponúkni vlčatám jablko z Kitsune. (Alebo nechaj Flinta.)', 'Offer the pups an apple from Kitsune. (Or let Flint.)'))
    })
    if (g.flag('c13.kneel')) g.objective(null)
  },
}

// apples: talking to any pup or to Flint starts the beat
for (const a of terraceScene.actors ?? []) {
  if (a.id.startsWith('pup') || a.id === 'flint') a.talk = (g) => apples(g)
}

async function apples(g: GameAPI): Promise<void> {
  if (g.flag('c13.apples')) return
  g.set('c13.apples')
  g.cinematic(true)
  g.objective(null)
  await g.walk('flint', [11, 8])
  g.pose('flint', 'kneel')
  await g.walk('player', [13, 8])
  g.pose('player', 'kneel')
  await g.narrate(l('Kľakli si do hustého šedého prachu, jemnejšieho než piesok, v ktorom neostala žiadna pamäť na vodu. Flint mlčky otvoril tašku a vytiahol ovocie. Posledné z Kitsune. Pár jabĺk, pomliaždených, menších, než boli.', 'They knelt in thick grey dust, finer than sand, holding no memory of water. Flint opened his bag without a word and took out the fruit. The last from Kitsune. A few apples, bruised, smaller than they had been.'))
  await g.walk('pup1', [12, 8])
  await g.narrate(l('Najmenšie vlča prišlo prvé. Vždy najmenšie: ešte nemá dosť rozumu na strach. Pričuchlo k jablku. Zahryzlo. Nato pribehli ostatné.', 'The smallest pup came first. Always the smallest: not yet enough sense to be afraid. It sniffed the apple. Bit. Then the rest came running.'))
  void g.walk('pup2', [10, 9])
  void g.walk('pup3', [12, 9])
  void g.walk('pup4', [11, 7])
  void g.walk('pup5', [13, 7])
  await g.wait(800)
  g.emote('pup1', '♪')
  await g.narrate(l('Flint im hladil srsť medzi ušami. V Kitsune to boli líščatá. Tu vlčatá: väčšie, divšie, ťažšie. Ale rovnako hladné a rovnako zvedavé.', 'Flint stroked the fur between their ears. In Kitsune they had been fox cubs. Here, wolf pups: bigger, wilder, heavier. But just as hungry and just as curious.'))
  const c = await g.choose([
    { id: 'give', text: l('(Podať vlčaťu aj svoje jablko.)', '(Give a pup your own apple too.)') },
    { id: 'watch', text: l('(Pozerať sa na Flinta.)', '(Watch Flint.)') },
  ])
  if (c === 'give') {
    g.emote('pup5', '!')
    await g.narrate(l('Vlča mu ho vytrhlo z dlane tak rýchlo, že ho pazúrik škrabol. Arkot sa takmer usmial. Prvýkrát od Kitsune.', 'The pup snatched it from his palm so fast its little claw scratched him. Arkot almost smiled. For the first time since Kitsune.'))
  } else {
    await g.narrate(l('Flint sa smial. Potichu, len kútikom úst. Aspoň niečo.', 'Flint was laughing. Quietly, just at the corner of his mouth. Something, at least.'))
    g.rel('flint', 1)
  }
  // Aether comes down
  g.show('aether', true)
  g.teleport('aether', [20, 4], 270)
  void g.walk('aether', [17, 6], { speed: 1.4 })
  await g.wait(900)
  for (const p of ['pup1', 'pup2', 'pup3', 'pup4', 'pup5']) void g.walk(p, ['pup3', 'pup4'].includes(p) ? [3, 1] : p === 'pup5' ? [18, 1] : [11, 1], { run: true })
  await g.narrate(l('Potom Aether zostúpil z Itaky. Pomaly, labami na čistom kameni. A deti zmizli. Okamžite, akoby niekto potiahol za neviditeľnú šnúru. Jablká zostali na zemi. Flint stál s prázdnou dlaňou.', 'Then Aether came down from the Itaka. Slowly, paws on the clean stone. And the children vanished. At once, as if someone had pulled an invisible string. The apples stayed on the ground. Flint stood with an empty palm.'))
  for (const p of ['pup1', 'pup2', 'pup3', 'pup4', 'pup5']) g.show(p, false)
  g.pose('player', 'stand')
  g.pose('flint', 'stand')
  await walkBack(g)
  await soldiers(g)
}

async function walkBack(g: GameAPI): Promise<void> {
  void g.walk('flint', [14, 8])
  await g.walk('player', [15, 9])
  g.face('player', [11, 3])
}

async function soldiers(g: GameAPI): Promise<void> {
  g.music('iron_army', 600)
  for (let i = 0; i < hunters.length; i++) {
    const id = hunters[i].id
    g.show(id, true)
    void g.walk(id, HUNTER_SPOTS[i], { speed: 3.4 })
    if (i % 3 === 0) await g.wait(300)
  }
  await g.wait(1200)
  for (const h of hunters) g.face(h.id, 'player')
  await g.narrate(l('Z tieňa tunelov sa vynorili vojaci. Rýchli, nízki, pušky pri líci. Nekráčali; kĺzali sa pozdĺž stien, bez jediného slova. Pohyby synchronizované ako svorka pri love.', 'Out of the shadow of the tunnels came soldiers. Fast, low, rifles at the cheek. They did not walk; they slid along the walls, without a word. Movements in sync, like a pack on the hunt.'))
  await g.narrate(l('Arkot ich spočítal. Desať. Pušky dlhé, s dreveným pažbením a oceľovým záverom. Grawská práca. Toto neboli vojaci. Toto boli lovci.', 'Arkot counted them. Ten. Long rifles with wooden stocks and steel bolts. Graw work. These were not soldiers. These were hunters.'))
  void g.walk('h1', [15, 7])
  await g.wait(600)
  g.face('h1', 'dara')
  await g.say('h1', l('Hrrákk! Grav wérr deddh!', 'Hrrákk! Grav wérr deddh!'), { mood: 'angry' })
  await g.narrate(l('Veliteľ hliadky, mladší vlk s jazvou cez ľavé oko, neprehovoril k Dare. Prehovoril cez ňu. K háku zahryznutému do skaly vedľa hrobového kameňa.', 'The patrol leader, a younger wolf with a scar across his left eye, did not speak to Dara. He spoke through her. To the hook biting into the rock beside a grave stone.'))
  g.pose('flint', 'point')
  g.sfx('click', 0.8)
  await g.narrate(l('Flint tasil revolver.', 'Flint drew his revolver.'))
  void g.walk('dara', [15, 9])
  g.pose('flint', 'stand')
  await g.say('dara', l('Prichádzame z Kitsune. Nevedeli sme. Obchod.', 'We come from Kitsune. We didn’t know. Trade.'))
  await g.narrate(l('Dara mu strhla ruku dole skôr, než stihol zdvihnúť hlaveň. Druhou rukou zdvihla obe dlane. Pomalé pohyby, otvorené dlane.', 'Dara pulled his arm down before he could raise the barrel. With her other hand she lifted both palms. Slow movements, open palms.'))
  await g.narrate(l('Veliteľ ukázal na hrobové kamene. Potom na Itaku. Nakoniec sa mu pohľad stočil k tvaru za nimi. Bol tam celý čas, veľké zviera, nie priorita. Teraz si ho zmeral pohľadom znovu.', 'The leader pointed at the grave stones. Then at the Itaka. At last his eyes turned to the shape behind them. It had been there all along, a big animal, not a priority. Now he measured it again.'))
  await g.focus('aether', { ms: 900, zoom: 1.1 })
  g.sfx('bass', 0.5)
  g.pose('h1', 'kneel')
  await g.narrate(l('Veliteľ hliadky klesol na koleno. Rovno, bez váhania vojaka, čo odkladá zbraň. Puška Graw, vrchol severnej metalurgie, tupo zazvonila o kameň a zostala ležať.', 'The patrol leader went down on one knee. Straight down, without the hesitation of a soldier setting down his weapon. The Graw rifle, the height of northern metalwork, rang dully on the stone and stayed there.'))
  for (const h of hunters) {
    g.pose(h.id, 'kneel')
    await g.wait(120)
  }
  g.follow()
  await g.narrate(l('A za ním jeden po druhom ostatní. Sklonené hlavy, obnažené krky. Desiatka vlkov, čo pred chvíľou mierila na Itaku, kľačala v prachu ako svorka pred Alfou.', 'And after him, one by one, the rest. Bowed heads, bared throats. Ten wolves who a moment ago had been aiming at the Itaka knelt in the dust like a pack before its Alpha.'))
  g.set('c13.kneel')
  // the elder
  for (const id of ['elder', 'woman1', 'woman2']) g.show(id, true)
  void g.walk('woman1', [10, 4])
  void g.walk('woman2', [12, 4])
  await g.walk('elder', [14, 5], { speed: 1.2 })
  g.face('elder', 'aether')
  await g.narrate(l('Z tunela vyšiel starý muž. Pomaly, sivá srsť, jedno oko tmavé, zuby žlté od veku. Oprel sa o palicu vyhladenú generáciami dlaní. Za ním dve ženy v tunikách farbených lišajníkovou oranžovou, s korálkami z vulkanického skla v srsti.', 'An old man came out of the tunnel. Slowly, grey fur, one eye dark, teeth yellow with age. He leaned on a staff worn smooth by generations of palms. Behind him two women in tunics dyed lichen-orange, with beads of volcanic glass in their fur.'))
  g.pose('elder', 'kneel')
  g.pose('woman1', 'kneel')
  g.pose('woman2', 'kneel')
  await g.narrate(l('Starešina sa zastavil. To jedno žlté oko sa na vlka uprelo; čeľuste mu drkotali a zavrieť ho nedokázal. Klesol na koleno so škrípaním starých kĺbov.', 'The elder stopped. His one yellow eye fixed on the wolf; his jaws trembled and he could not close it. He sank to his knee with a creak of old joints.'))
  await aether(g, 'Čildrenn ov fájerr.')
  await g.say('goji', l('Povedal…', 'He said…'), { mood: 'surprised' })
  await goji(g, l('Povedal „Deti ohňa“. Ale nie ako oslovenie. Akoby on bol ten, kto ten oheň zapálil.', 'He said “Children of fire.” But not as a form of address. As if he were the one who had lit that fire.'), 'surprised')
  await g.narrate(l('A vlci mu rozumeli priamo. Bez tlmočníka, bez filtra tisícročí. Jazyk, čo Goji celú cestu lámal na kúsky, tu tiekol z vlčích hrdiel voľne. Prekladateľ nemal čo prekladať.', 'And the wolves understood him directly. Without an interpreter, without the filter of millennia. The language Goji had broken into pieces the whole way here flowed freely from wolf throats. The translator had nothing to translate.'))
  await g.narrate(l('Arkot meral. Uhly, tieň, váhu. Nepýtal sa.', 'Arkot measured. Angles, shadow, weight. He did not ask.'))
  g.pose('h1', 'stand')
  g.face('h1', 'player')
  await g.say('h1', l('Dókks. Dáun.', 'Dókks. Dáun.'))
  await goji(g, l('Doky. Dole. Máme… presunúť vzducholoď.', 'Docks. Down. We’re to… move the airship.'))
  await g.say('goji', l('Sho.', 'Sho.'), { mood: 'closed' })
  await g.fade('black', 900)
  await g.goto('c13_hel', 'lift')
}
