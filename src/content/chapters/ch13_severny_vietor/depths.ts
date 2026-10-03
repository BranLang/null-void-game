/**
 * Kapitola 21: the lower terraces. A cold spot in the geothermal heat; four young wolves; the worst
 * dive at the bottom of the worst hole, and in its corner a man in a black suit and dark goggles.
 * “People always die. Let me sleep.” Flint's confession. Then the ambush: Goji's orange shield,
 * Arkot's bronze glyph, “Vindr-Eldr!”, and the darkness in which bullets turn to dust.
 */
import type { ActorDef, MapDef, PlacedProp, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l, type L } from '../../../i18n/i18n'
import { depths as depthsAmb } from './ambience'
import { goji } from './util'

export const depthsMap: MapDef = {
  rows: [
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'WbbbbbbbbbWWWWWWWWWWWWWWWWsssW',
    'WbbbbbbbbbWWWWWWWWWWWWWWWWcccW',
    'WbbbbbbbbbWWWWWWWWWWWWWWWWcccW',
    'WbbbbbbbbbWWWWWWWWWWWWWWWWcccW',
    'WbbbbbbbbbWWWWWWWWWWWWWccccccW',
    'WbbbbbbbbbWWWWWWWWWWWWWcxxcccW',
    'WbbbbbbbbbWWWWWWWWWWWWWccccWWW',
    'WWWWWdWWWWWWWWWWWWWWWWWccccWWW',
    'WwwwwwwwwwwwwwwwwwwwwwwwwwwwwW',
    'WwwwwwwwwwwwwwwwwwwwwwwwwwwwwW',
    'WwwwwwwwwwwwwwwwwwwwwwwwwwwwwW',
    'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
  ],
  legend: {
    W: { floor: 'rock', wall: 'rock', wallH: 3.0 },
    L: { floor: 'rock', wall: 'rock', wallH: 0.7 },
    b: { floor: 'stone', tint: '#4a4650' },
    d: { floor: 'stone', tint: '#3a3640', tag: 'bardoor' },
    s: { floor: 'stone', tint: '#3a3a40', tag: 'stairs' },
    c: { floor: 'rock', tint: '#5a5660' },
    x: { floor: 'ice', tint: '#c8d8f0', tag: 'cold' },
    w: { floor: 'stone', tint: '#56505a' },
  },
}

/** Bar furniture shared with the interlude. */
export const barProps: PlacedProp[] = [
  { type: 'table', at: [5, 3], color: '#5a5450' },
  { type: 'table', at: [7, 5], color: '#5a5450' },
  { type: 'table', at: [4, 6], color: '#5a5450' },
  { type: 'bench', at: [5, 2], color: '#4a4440' },
  { type: 'stool', at: [8, 4] },
  { type: 'stool', at: [6, 6] },
  { type: 'stool', at: [1, 2] },
  { type: 'barrel', at: [8, 1] },
  { type: 'barrel', at: [9, 1], params: { lying: true } },
  { type: 'c13_bottle', at: [5, 3], y: 0.76, params: { count: 3 } },
  { type: 'c13_bottle', at: [7, 5], y: 0.76, params: { count: 2, empty: true } },
  { type: 'lantern', at: [9, 6], params: { style: 'hanging' }, color: '#7aa8ff', solid: false },
]

const AMBUSH_LEFT: Vec2[] = [[2, 10], [1, 9], [1, 11], [3, 9]]
const AMBUSH_RIGHT: Vec2[] = [[17, 10], [18, 9], [18, 11], [19, 10], [20, 9], [20, 11]]
const ambushers: ActorDef[] = [...AMBUSH_RIGHT, ...AMBUSH_LEFT].map((at, i) => ({
  id: `a${i + 1}`,
  character: i === 0 ? 'c13_scar' : i <= 3 ? `c13_young${i}` : `c13_hunter${i}`,
  at,
  facing: i < AMBUSH_RIGHT.length ? 270 : 90,
  hidden: true,
}))
const AMBUSH_IDS = ambushers.map((a) => a.id)

export const depthsScene: SceneDef = {
  id: 'c13_depths',
  name: l('Spodné terasy', 'The Lower Terraces'),
  ambience: depthsAmb,
  camera: { zoom: 1.1 },
  sai: { phase: 'heavy' },
  map: depthsMap,
  props: [
    ...barProps,
    { type: 'table', at: [2, 2], color: '#5a5450', id: 'maksTable' },
    { type: 'c13_bottle', at: [2, 2], y: 0.76, params: { count: 2 }, id: 'maksBottles' },
    { type: 'c13_table_fallen', at: [3, 3], id: 'fallen', hidden: true },
    { type: 'c13_bottle', at: [2, 3], params: { count: 1, color: '#c8402a' }, id: 'redBottle', hidden: true },
    { type: 'frost_patch', at: [24, 6], params: { size: 1.6 } },
    { type: 'frost_patch', at: [25, 6], params: { size: 1.2 } },
    { type: 'rock', at: [16, 9], params: { size: 0.6 } },
    { type: 'rock', at: [7, 9], params: { size: 0.6 } },
    { type: 'lantern', at: [12, 9], params: { style: 'hanging' }, color: '#8ab8ff', solid: false },
    { type: 'lantern', at: [20, 9], params: { style: 'hanging' }, color: '#ffb070', solid: false },
    { type: 'lantern', at: [26, 4], params: { style: 'hanging' }, color: '#ffb070', solid: false },
    ...[3, 9, 14, 22].map((x, i) => ({ type: 'window', at: [x, 9] as Vec2, params: { lit: true, light: true }, id: `win${i}` })),
    ...[3, 9, 14, 22].map((x, i) => ({ type: 'window', at: [x, 9] as Vec2, params: { lit: false, shutters: true }, id: `shut${i}`, hidden: true })),
    { type: 'banner', at: [18, 9], params: { wall: true }, color: '#5a4030' },
    { type: 'banner', at: [11, 11], rot: 180, params: { wall: true }, color: '#4a3a2a' },
  ],
  player: { character: 'arkot_glyph', at: [27, 2], facing: 0 },
  spawns: { stairs: [27, 2] },
  actors: [
    { id: 'flint', character: 'flint', at: [24, 10], facing: 270 },
    { id: 'goji', character: 'goji', at: [25, 10], facing: 270 },
    { id: 'y1', character: 'c13_scar', at: [21, 10], facing: 90 },
    { id: 'y2', character: 'c13_young1', at: [21, 9], facing: 90 },
    { id: 'y3', character: 'c13_young2', at: [20, 10], facing: 90 },
    { id: 'y4', character: 'c13_young3', at: [21, 11], facing: 90 },
    { id: 'pup', character: 'c13_pup6', at: [16, 10], facing: 0, pose: 'sit' },
    { id: 'old', character: 'c13_oldwolf', at: [7, 10], facing: 0, pose: 'sit' },
    { id: 'miner1', character: 'c13_drinker3', at: [13, 10], facing: 90 },
    { id: 'miner2', character: 'c13_drinker4', at: [10, 11], facing: 270 },
    { id: 'd1', character: 'c13_drinker1', at: [6, 3], facing: 270, pose: 'sit' },
    { id: 'd2', character: 'c13_drinker2', at: [8, 5], facing: 270, pose: 'sit' },
    { id: 'd3', character: 'c13_crowd3', at: [5, 6], facing: 90, pose: 'sit' },
    { id: 'maks', character: 'maks', at: [1, 2], facing: 90, pose: 'sit' },
    ...ambushers,
  ],
  interactables: [
    {
      id: 'pup',
      at: [16, 10],
      label: l('Vlča na studenom kameni', 'A pup on the cold stone'),
      verb: 'look',
      when: (g) => !!g.flag('c13.met') && !g.flag('c13.bar'),
      run: async (g) => {
        await g.narrate(l('Vlča. Malé. Menšie a tenšie než tie hore, čo sa smiali a kradli jablká. Sedelo na studenom kameni. Pozeralo. Zvyknuté.', 'A pup. Small. Smaller and thinner than the ones above who laughed and stole apples. It sat on the cold stone. Watching. Used to it.'))
      },
    },
  ],
  triggers: [
    {
      id: 'cold',
      area: [23, 5, 27, 6],
      run: async (g) => {
        g.addStrain(0.25)
        g.sfx('ice', 0.5)
        await g.narrate(l('Na ceste narazil na studený bod. Uprostred geotermálneho tepla ležalo miesto, kde vzduch nečakane mrazil. Nemožné, no skutočné.', 'On the way he hit a cold spot. In the middle of the geothermal heat lay a place where the air was suddenly freezing. Impossible, but real.'))
      },
    },
    {
      id: 'meet',
      area: [23, 7, 27, 9],
      when: (g) => !g.flag('c13.met'),
      run: (g) => meet(g),
    },
    {
      id: 'bar',
      area: [4, 8, 6, 9],
      when: (g) => !!g.flag('c13.met') && !g.flag('c13.bar'),
      run: (g) => bar(g),
    },
    {
      id: 'up',
      area: [26, 1, 28, 2],
      when: (g) => !!g.flag('c13.ambush'),
      run: async (g) => {
        await g.goto('c13_hel', 'return')
      },
    },
  ],
  onEnter: async (g) => {
    g.particles({ kind: 'blackdust', count: 110, at: [1, 2], radius: 1.1, id: 'maksdust' })
    for (const id of AMBUSH_IDS) g.show(id, false)
    if (g.flag('c13.ambush')) {
      afterState(g)
      return
    }
    if (g.flag('c13.bar')) {
      // retry from the ambush
      await ambush(g)
      return
    }
    if (g.flag('c13.met')) {
      metState(g)
      return
    }
    await g.once('c13.depthsIntro', async () => {
      g.cinematic(true)
      await g.narrate(l('Schody vedľa šachty. Strmé, úzke, vytesané do steny pre menšie telá. Bral ich po troch. Ťažká hodina na každom stupni.', 'The stairs beside the shaft. Steep, narrow, cut into the wall for smaller bodies. He took them three at a time. The heavy hour on every step.'))
      await g.narrate(l('Vzduch chladol. Teplo slablo s každou terasou. Steny holé. Nedotkla sa ich ruka ani dláto. Miesto bez pamäte.', 'The air grew colder. The heat faded with every terrace. Bare walls. No hand or chisel had touched them. A place without memory.'))
      g.cinematic(false)
      g.objective(l('Nájdi Flinta a Gojiho.', 'Find Flint and Goji.'))
    })
  },
  onUpdate: (g, dt) => {
    if (g.flag('c13.bar')) return
    minerT -= dt
    if (minerT > 0) return
    minerT = 2.2
    for (const id of ['miner1', 'miner2']) void g.walk(id, [8 + Math.floor(Math.random() * 12), 9 + Math.floor(Math.random() * 3)], { speed: 0.9 })
  },
}

let minerT = 0

async function meet(g: GameAPI): Promise<void> {
  g.set('c13.met')
  g.cinematic(true)
  g.objective(null)
  await g.walk('player', [25, 8], { run: true })
  await g.narrate(l('Chodba plná modrastého oparu lacného liehu a olejových lámp. Nízky strop, tma. Flint stál v chodbe s Gojim za sebou. Rysie uši dozadu, ruka na pažbe. Proti nim štyria mladí vlci so sklenenými reťazami na krkoch.', 'A corridor full of the bluish haze of cheap spirit and oil lamps. Low ceiling, darkness. Flint stood in the corridor with Goji behind him. Lynx ears back, hand on the grip. Facing them, four young wolves with glass chains round their necks.'))
  g.face('flint', 'player')
  await g.say('flint', l('Odkiaľ…', 'How did you…'), { mood: 'surprised' })
  await g.say('player', l('Viem, kde je.', 'I know where he is.'), { mood: 'determined' })
  await g.say('flint', l('Kde?', 'Where?'))
  g.pose('player', 'point')
  await g.say('player', l('Štyri terasy. Šachta vpravo. Koridor na konci.', 'Four terraces. The shaft on the right. The corridor at the end.'))
  g.pose('player', 'stand')
  g.bark('y1', l('Ptuj.', 'Ptuh.'))
  await g.narrate(l('Vlk s jazvou si odpľul. Ustúpili. Nie pred revolverom. Pred tým, že cudzincov bolo teraz troch a mierili k jasnému cieľu. Jeden z nich sa obzrel smerom k baru.', 'The scarred wolf spat. They stepped back. Not from the revolver. From the fact that there were now three strangers, heading for a clear goal. One of them glanced back towards the bar.'))
  for (const id of ['y1', 'y2', 'y3', 'y4']) void g.walk(id, [5 + Math.floor(Math.random() * 3), 10], { speed: 2.2 })
  await g.wait(1600)
  for (const id of ['y1', 'y2', 'y3', 'y4']) g.show(id, false)
  metState(g)
  g.cinematic(false)
}

function metState(g: GameAPI): void {
  for (const id of ['y1', 'y2', 'y3', 'y4']) g.show(id, false)
  g.companion('flint', true)
  g.companion('goji', true)
  g.objective(l('Veď ich ku koridoru na konci.', 'Lead them to the corridor at the end.'))
}

async function bar(g: GameAPI): Promise<void> {
  g.set('c13.bar')
  g.companion('flint', false)
  g.companion('goji', false)
  g.cinematic(true)
  g.objective(null)
  void g.walk('flint', [5, 7])
  void g.walk('goji', [6, 7])
  await g.walk('player', [4, 7])
  await g.narrate(l('Najhorší pajzl na dne najhoršej diery. Nie dvere, len zaoblený výklenok v skale. Pach udrel prvý: lacný lieh, mokrá srsť, staré kyslé zvratky vpité do kameňa.', 'The worst dive at the bottom of the worst hole. Not a door, just a rounded niche in the rock. The smell hit first: cheap spirit, wet fur, old sour vomit soaked into the stone.'))
  await g.focus('maks', { ms: 1200, zoom: 1.35 })
  await g.narrate(l('A v rohu postava, čo sem nepatrila. Menšia než vlci. Užšia. Zhrbená nad stolom. Čierny oblek, čo pohlcoval svetlo inak než látka. Na tvári staré letecké okuliare, okrúhle, mosadzné, s tmavými, hlboko poškriabanými sklami.', 'And in the corner, a figure that did not belong here. Smaller than the wolves. Narrower. Hunched over the table. A black suit that swallowed light differently from cloth. On his face old flying goggles, round, brass, with dark, deeply scratched lenses.'))
  await g.narrate(l('Dve fľaše modrého liehu. Jedna prázdna. Druhá takmer dopitá.', 'Two bottles of blue spirit. One empty. The other nearly finished.'))
  await g.narrate(l('Vzduch okolo muža žil. V tesnom prstenci sa krútil neviditeľný vír: prach, čo sa hýbal príliš presne.', 'The air around the man was alive. In a tight ring an invisible eddy turned: dust that moved too precisely.'))
  g.stopParticles('maksdust')
  g.sfx('bass', 0.5)
  await g.narrate(l('Nato sa prach zastavil. Zamrzol. Otočil sa k dverám. Srsť na predlaktiach mu vstala dupkom, od zápästia po lakeť. Nie oči. Horšie než oči.', 'Then the dust stopped. Froze. Turned towards the door. The fur on his forearms stood on end, wrist to elbow. Not eyes. Worse than eyes.'))
  g.particles({ kind: 'blackdust', count: 110, at: [1, 2], radius: 1.1, id: 'maksdust' })
  g.follow()
  await g.zoom(1.15, 500)
  await g.say('maks', l('„Áj nóu hú jú árr. Áj wóčt jór lendinn.“', '“Áj nóu hú jú árr. Áj wóčt jór lendinn.”'))
  void g.walk('goji', [3, 4])
  await g.say('goji', l('Maks?', 'Maks?'))
  await goji(g, l('Hovorí, že o nás vie. Že nás spozoroval pri pristávaní.', 'He says he knows about us. That he watched us land.'))
  await g.say('flint', l('Saburo nás poslal. Povedz mu, že Kitsune potrebuje pomoc.', 'Saburo sent us. Tell him Kitsune needs help.'), { mood: 'determined' })
  await g.narrate(l('Goji preložil. Muž zdvihol fľašu, napil sa, pomaly ju položil.', 'Goji translated. The man lifted the bottle, drank, set it down slowly.'))
  await g.say('maks', l('Nie.', 'No.'))
  void g.walk('flint', [3, 3])
  await g.say('flint', l('Tami zomiera.', 'Tami is dying.'), { mood: 'angry' })
  await g.say('maks', l('Ľudia vždy umierajú. Nechajte ma spať.', 'People always die. Let me sleep.'))
  await g.narrate(l('Flint stuhol. Sedem dní v ťažkej hodine, s kryštálmi na prasknutie. Sedem dní, kým Tami sedela v tme a dýchala vzduch, ktorého ubúdalo. Pre toto. Pre chlapa za stolom, čo povie: nechajte ma spať.', 'Flint froze. Seven days in the heavy hour, crystals ready to crack. Seven days while Tami sat in the dark breathing air that was running out. For this. For a man at a table who says: let me sleep.'))
  g.pose('flint', 'fight')
  g.sfx('crack', 1)
  g.shake(0.4, 600)
  g.propVisible('maksTable', false)
  g.propVisible('maksBottles', false)
  g.propVisible('fallen', true)
  await g.narrate(l('Prevrhol stôl. Fľaše sa rozbili o kamennú podlahu. Pálenka sa rozliala v ostrom zápachu. Stôl dopadol na bok s tupým, ťažkým zvukom, aký robia veci v gravitácii o tretinu ťažšej.', 'He overturned the table. The bottles shattered on the stone floor. The spirit spread in a sharp stink. The table landed on its side with the dull heavy sound of things falling in a gravity a third heavier.'))
  g.pose('flint', 'stand')
  await g.narrate(l('Muž za stolom sa nepohol.', 'The man at the table did not move.'))
  await g.say('flint', l('Kark. Sedem dní. Starý povedal: choď, ty jediný to zastavíš.', 'Kark. Seven days. The old man said: go, you’re the only one who can stop it.'), { mood: 'sad' })
  await g.say('flint', l('Nechal som ju tam. Povedala „bež“ a ja som zdrhol.', 'I left her there. She said “run” and I ran.'), { mood: 'sad' })
  await g.narrate(l('Goji neprekladal. Niektoré veci nepotrebujú preklad. Pálenka máčala mužovi topánky. Nezdvihol hlavu.', 'Goji did not translate. Some things need no translation. The spirit soaked the man’s shoes. He did not raise his head.'))
  const c = await g.choose([
    { id: 'yera', text: l('„Je tam aj Yera.“', '“Yera is there too.”') },
    { id: 'look', text: l('(Pozrieť sa naňho. Dlho.)', '(Look at him. For a long time.)') },
  ])
  if (c === 'yera') {
    await g.say('player', l('Je tam aj Yera. Nie je ani zo Kitsune. Prišla s nami.', 'Yera is there too. She isn’t even from Kitsune. She came with us.'))
    await g.narrate(l('Prach okolo okuliarov sa na okamih zachvel. Potom sa znova rozkrútil.', 'The dust around the goggles trembled for a moment. Then it began to turn again.'))
    g.set('c13.toldMaks')
  }
  void g.walk('flint', [9, 10])
  g.sfx('click', 0.8)
  await g.narrate(l('Flint sa prudko otočil a vyšiel von. Kopol do rámu dverí cestou von. Goji za ním. Arkot posledný, s dlhým pohľadom späť na muža v rohu.', 'Flint spun round and walked out. Kicked the door frame on his way. Goji after him. Arkot last, with a long look back at the man in the corner.'))
  void g.walk('goji', [11, 10])
  await g.walk('player', [10, 10])
  await ambush(g)
}

function setShutters(g: GameAPI, closed: boolean): void {
  for (let i = 0; i < 4; i++) {
    g.propVisible(`win${i}`, !closed)
    g.propVisible(`shut${i}`, closed)
  }
}

async function volley(g: GameAPI, who: string, window: number, text: L): Promise<boolean> {
  g.face(who, 'player')
  g.emote(who, '!')
  g.bark(who, text, 1400)
  g.hint(l('1 — Päsť: ohni hlaveň!', '1 — Push: bend the barrel!'))
  g.free()
  let cast = false
  const off = g.onCast((e) => {
    if (e.id === 'push') cast = true
  })
  const t0 = g.time
  await g.until(() => cast || g.time - t0 > window)
  off()
  g.lock()
  g.hint(null)
  if (cast) {
    g.fx('shockwave', who, { color: '#e0a050', scale: 1.6 })
    g.sfx('crack', 0.9)
    g.glyph('player', 3)
    return true
  }
  g.sfx('shot', 0.9)
  g.flash('#ff9a40', 200)
  g.fx('glyph', 'goji', { color: '#ff9a40', scale: 1.3 })
  return false
}

async function ambush(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.teleport('player', [10, 10], 270)
  g.show('flint', true)
  g.show('goji', true)
  g.teleport('flint', [9, 10], 270)
  g.teleport('goji', [11, 10], 270)
  g.show('pup', false)
  g.show('miner1', false)
  g.show('miner2', false)
  g.checkpoint()
  await g.narrate(l('Ulica pred barom bola úzka, vytesaná do skaly, zakrivená ako črevo. Liehová lampa na stene syčala. Stará vlčica, čo sedela na kameni vedľa vchodu, sa na nich dlho pozerala. Vstala, pomaly, a zmizla za zástenou.', 'The street outside the bar was narrow, cut into the rock, curved like a gut. A spirit lamp hissed on the wall. The old she-wolf sitting on a stone by the entrance looked at them for a long time. She stood, slowly, and vanished behind a curtain.'))
  void g.walk('old', [3, 10])
  g.sfx('door', 0.5)
  await g.wait(400)
  g.show('old', false)
  setShutters(g, true)
  g.sfx('click', 0.6)
  await g.narrate(l('Okenica napravo sa zavrela. Rýchlo, ticho, zvnútra. Potom ďalšia. Za koženou zástenou vlčie ruky stiahli vlča z chodby. Celá ulica sa stiahla dovnútra a nechala ich stáť na prázdnom kameni pod syčiacou lampou.', 'A shutter on the right closed. Quickly, quietly, from inside. Then another. Behind a leather curtain wolf hands pulled a pup in from the passage. The whole street drew itself inside and left them standing on bare stone under the hissing lamp.'))
  await g.narrate(l('Pach sa zmenil. Mokrá srsť, adrenalín, zbraňový olej. Vôňa svorky pred lovom.', 'The smell changed. Wet fur, adrenaline, gun oil. The scent of a pack before the hunt.'))
  for (const id of AMBUSH_IDS) g.show(id, true)
  for (let i = 0; i < AMBUSH_IDS.length; i++) {
    const at = i < AMBUSH_RIGHT.length ? AMBUSH_RIGHT[i] : AMBUSH_LEFT[i - AMBUSH_RIGHT.length]
    g.teleport(AMBUSH_IDS[i], at, i < AMBUSH_RIGHT.length ? 270 : 90)
    g.pose(AMBUSH_IDS[i], 'stand')
  }
  g.music('combat_action_1', 800)
  await g.narrate(l('Vonku čakali. Vlk s jazvou cez ľavé oko na jednom konci ulice, za ním ďalší. Na druhom konci ďalšia dvojica. Zablokované oba smery. Hel sa nad nimi modlil a pod ním sa jeho deti chystali zabiť.', 'Outside they were waiting. The wolf with the scar across his left eye at one end of the street, others behind him. At the other end, two more. Both ways blocked. Above, Hel was praying; below it, its children were getting ready to kill.'))
  g.pose('a1', 'point')
  await g.narrate(l('Vlk s jazvou zdvihol ruku. Otvorenú dlaň. Lampa mu osvetlila tvár, mladú, tvrdú, s jazvou, čo si nezaslúžil. Čakal.', 'The scarred wolf raised his hand. An open palm. The lamp lit his face, young, hard, with a scar he had not deserved. He waited.'))
  await g.say('a1', l('„Gou bekk. Gou nau, end nóu wan dájz.“', '“Gou bekk. Gou nau, end nóu wan dájz.”'))
  g.pose('flint', 'point')
  g.sfx('shot', 1)
  g.flash('#fff0c0', 200)
  await g.narrate(l('Goji otvoril ústa, ale Flint bol rýchlejší. Rysí reflex, žltý záblesk v tme. Vlk ten pohyb zachytil; otvorená dlaň klesla, čeľuste sa mu zaťali. Flint vystrelil.', 'Goji opened his mouth, but Flint was faster. A lynx reflex, a yellow flash in the dark. The wolf caught the movement; the open palm dropped, his jaws clenched. Flint fired.'))
  g.pose('a1', 'fight')
  g.glyph('goji', 3)
  g.fx('glyph', 'goji', { color: '#ff9a40', scale: 2.2 })
  await g.narrate(l('Goji reagoval. Vzduch pred nimi zhustol. Oranžové svetlo, teplé, pulzujúce, sa rozvinulo z jeho dlaní. Glyf. Spira štít. Prvá guľka z karabíny sa v ňom zastavila. Druhá. Tretia. Glyf držal.', 'Goji reacted. The air in front of them thickened. Orange light, warm, pulsing, unfolded from his palms. A glyph. A Spira shield. The first carbine bullet stopped in it. The second. The third. The glyph held.'))
  await g.narrate(l('Teraz alebo nikdy. To, čo pred Flintom skrýval, bolo jediné, čo ho mohlo udržať nažive.', 'Now or never. What he had hidden from Flint was the only thing that could keep him alive.'))
  g.cinematic(false)
  // first volleys: bend the carbines
  let bent = 0
  const order = ['a1', 'a7', 'a2', 'a8']
  const texts = [l('Páľ!', 'Fire!'), l('Hrrah!', 'Hrrah!'), l('Zabi lišiaka!', 'Kill the fox!'), l('Teraz!', 'Now!')]
  for (let i = 0; i < order.length; i++) {
    if (await volley(g, order[i], 3.0 - i * 0.25, texts[i])) bent++
    await g.wait(350)
  }
  g.set('c13.bent', bent)
  g.cinematic(true)
  if (bent >= 3) await g.narrate(l('Bronzové svetlo z Arkotovej dlane. Ťažké, nehybné, bez pulzu. Karabína v rukách prvého vlka zaškrípala, hlaveň sa ohla do strany, záver praskol. Ďalšia. Ďalšia.', 'Bronze light from Arkot’s palm. Heavy, still, without a pulse. The carbine in the first wolf’s hands groaned; the barrel bent sideways, the bolt cracked. Another. Another.'))
  else await g.narrate(l('Bronzové svetlo z Arkotovej dlane prišlo neskoro a nerovno. Guľky dopadali na Gojiho glyf a Goji zaťal zuby. Krv mu tiekla z nosa.', 'The bronze light from Arkot’s palm came late and ragged. Bullets hammered Goji’s glyph and Goji clenched his teeth. Blood ran from his nose.'))
  g.sfx('shot', 0.8)
  g.flash('#c83030', 200)
  await g.narrate(l('Guľka z pištole prešla medzi oboma glyfmi. Krv na Flintovej líci. Prasklina v oranžovom svetle. Tenká, čierna, rastúca.', 'A pistol bullet slipped between the two glyphs. Blood on Flint’s cheek. A crack in the orange light. Thin, black, growing.'))
  // Vindr-Eldr
  g.glyph('goji', 0)
  g.pose('goji', 'cast')
  await g.narrate(l('Goji pustil štít. Ruky sa mu pohli inak. Žiadne kruhy, žiadne glyfové oblúky. Rovné ťahy. Ostré hrany. Prsty rysili do vzduchu tvary ako ryté do kameňa.', 'Goji let the shield go. His hands moved differently. No circles, no glyph arcs. Straight strokes. Sharp edges. His fingers cut shapes into the air as if carving stone.'))
  g.shake(0.5, 700)
  g.flash('#cfe8ff', 500)
  g.fx('shockwave', 'goji', { color: '#9ad8ff', scale: 6 })
  g.sfx('boom', 0.9)
  await g.say('goji', l('Vindr-Eldr!', 'Vindr-Eldr!'), { mood: 'determined' })
  for (const [id, to] of [
    ['a1', [20, 10]],
    ['a2', [21, 9]],
    ['a3', [21, 11]],
  ] as [string, Vec2][]) {
    void g.walk(id, to, { speed: 9 })
  }
  await g.wait(300)
  for (const id of ['a1', 'a2', 'a3']) g.pose(id, 'kneel')
  await g.narrate(l('Modré, strieborné svetlo, ostré ako čepeľ. Runy vyryté vo vzduchu sa rozleteli. Vlna horúceho vetra. Traja vlci najbližšie odleteli dozadu, karabíny vypadli z rúk, telá o stenu. Plameň, čo nehorel. Vietor, čo nevanul.', 'Blue light, silver, sharp as a blade. Runes carved in the air flew apart. A wave of hot wind. The three nearest wolves were thrown back, carbines falling from their hands, bodies against the wall. A flame that did not burn. A wind that did not blow.'))
  g.pose('goji', 'kneel')
  await g.say('goji', l('Sho…', 'Sho…'), { mood: 'pain' })
  g.codex('gloss.c13_galdr')
  await g.narrate(l('To nebol glyf, aký poznal od Yery. Jej glyfy mali kruhy a oblúky. Toto boli rovné línie. Ostré uhly. Také videl len u Tami. Čo to bolo? Ale teraz nebolo kedy premýšľať.', 'That was no glyph he knew from Yera. Her glyphs had circles and arcs. These were straight lines. Sharp angles. He had seen such only with Tami. What was it? But there was no time to think now.'))
  for (const id of ['a1', 'a2', 'a3']) g.pose(id, 'stand')
  g.cinematic(false)
  // Arkot holds alone
  const order2 = ['a9', 'a4', 'a10']
  let held = 0
  for (let i = 0; i < order2.length; i++) {
    if (await volley(g, order2[i], 2.4 - i * 0.2, i === 2 ? l('Skončite to!', 'Finish it!') : l('Páľ!', 'Fire!'))) held++
    await g.wait(300)
  }
  g.cinematic(true)
  g.addStrain(0.6)
  g.set('c13.held', held)
  await g.narrate(l('Vlci prichádzali. Viac. Z oboch strán tunela. Guľky z karabín dopadali na Arkotov bronzový štít. Raz. Dva. Tri. Štít praskal.', 'The wolves kept coming. More. From both ends of the tunnel. Carbine bullets struck Arkot’s bronze shield. Once. Twice. Three times. The shield was cracking.'))
  if (held >= 2) await g.narrate(l('Držal dlhšie, než mal. Rátal, na koľko výstrelov ešte vystačí. Rátanie ho držalo na nohách.', 'It held longer than it should have. He counted how many shots it would still take. The counting kept him on his feet.'))
  g.glyph('player', 0)
  g.sfx('crack', 1)
  await g.narrate(l('Bronzové svetlo bliklo. Zoslablo. Ďalšia guľka, a glyf na Arkotovej dlani zhasol. Štít zmizol.', 'The bronze light flickered. Weakened. One more bullet, and the glyph in Arkot’s palm went out. The shield was gone.'))
  g.pose('flint', 'point')
  g.sfx('shot', 1)
  await g.wait(250)
  g.sfx('shot', 1)
  g.pose('a7', 'lie')
  await g.narrate(l('Flint zdvihol revolver. Strelil dvakrát. Posledné náboje. Vlk padol. Druhý nie. Zvyšní zdvihli karabíny. Desať hlavní na troch mužov bez štítu.', 'Flint raised his revolver. Fired twice. The last rounds. A wolf fell. The other didn’t. The rest raised their carbines. Ten barrels on three men without a shield.'))
  for (const id of AMBUSH_IDS) {
    g.face(id, 'player')
    g.pose(id, 'fight')
  }
  g.sfx('shot', 1)
  g.music(null, 300)
  // Maks's darkness
  g.sfx('bass', 1)
  g.fx('dust', [10, 10], { scale: 2 })
  await g.narrate(l('Guľky sa zastavili. Všetky naraz. V strede letu, uprostred chodby, a nepadali. Rozpadli sa. Ticho, rýchlo, bez výbuchu. Kov sa rozložil na prach, jemný a čierny, s tichým syčaním, aké oceľ nevydáva.', 'The bullets stopped. All of them at once. In mid-flight, halfway down the passage, and did not fall. They came apart. Quietly, quickly, without an explosion. The metal broke down into dust, fine and black, with a soft hiss steel does not make.'))
  g.particles({ kind: 'blackdust', count: 700, area: [0, 8, 29, 12], id: 'dark' })
  await g.atmosphere({ exposure: 0.18, hemi: { sky: '#101018', ground: '#000000', intensity: 0.15 }, fog: { color: '#000000', near: 1, far: 9 }, grade: { saturation: 0.1, vignette: 0.9 }, sounds: ['void'], music: 'black_dust' }, 900)
  await g.narrate(l('Chodbu náhle pohltila tma. Spev zmĺkol. Nie neprítomnosť svetla. Prítomnosť niečoho. Hmla, čo nemala farbu, len váhu. Sadla na plecia. Na hrudník. Nádych. Vzduch prišiel, ale pľúcam nestačil.', 'Darkness swallowed the passage. The chant fell silent. Not the absence of light. The presence of something. A fog without colour, only weight. It settled on the shoulders. On the chest. A breath. Air came, but it was not enough for the lungs.'))
  g.shake(0.3, 2500)
  g.sfx('bass', 0.7)
  await g.narrate(l('A zhora zavytie. Jedno. Dlhé, hlboké, staré. Aether. Za ním ďalšie. Desiatky, stovky, tisíce. Celý Hel. Desaťtisíce hrdiel, čo pred chvíľou spievali Alfadir, teraz vyli do tmy.', 'And from above, a howl. One. Long, deep, old. Aether. Then another. Dozens, hundreds, thousands. All of Hel. Tens of thousands of throats that had just been singing Alfadir now howled into the dark.'))
  for (const id of AMBUSH_IDS) g.pose(id, 'lie')
  g.stopParticles('dark')
  await g.atmosphere({ ...depthsAmb, particles: undefined }, 1400)
  g.set('c13.ambush')
  await g.narrate(l('Tma sa stiahla. Ako keď niečo pustí. Gojiho glyf sa rozsvietil, slabý, trasúci sa. Vedľa neho Arkotov. Bronzový. Stabilnejší.', 'The darkness withdrew. As when something lets go. Goji’s glyph lit, faint, trembling. Beside it, Arkot’s. Bronze. Steadier.'))
  await g.narrate(l('Na podlahe telá. Vlci, všetci, ležali tam, kde stáli. Zbrane vedľa nich, čeľuste uvoľnené, oči zatvorené. Žiadna krv, žiadna rana. Medzi nimi ten s jazvou. Dlaň mal ešte napoly otvorenú, presne tak, ako ju zdvihol, keď ponúkal mier.', 'Bodies on the floor. The wolves, all of them, lay where they had stood. Weapons beside them, jaws slack, eyes closed. No blood, no wound. Among them the scarred one. His palm still half open, exactly as he had raised it when he offered peace.'))
  await reconcile(g)
}

async function reconcile(g: GameAPI): Promise<void> {
  g.pose('goji', 'stand')
  g.pose('flint', 'stand')
  await g.narrate(l('Goji si ohmatával hrudník, brucho, boky. Hľadal dieru. Nenašiel žiadnu. Flint si prešiel prstami po líci. Škrabnutie od guľky. O vlások. Arkot stál vedľa. Bronzový glyf mu ešte tlel v dlani. Tá istá Spira, čo práve zachránila Flintov život.', 'Goji patted his chest, belly, sides. Looking for a hole. Found none. Flint ran his fingers over his cheek. A bullet graze. A hair’s breadth. Arkot stood beside them. The bronze glyph still smouldered in his palm. The same Spira that had just saved Flint’s life.'))
  g.face('flint', 'player')
  g.face('player', 'flint')
  await g.narrate(l('Flint na neho pozrel. Dlho. Žiadne slovo. Žiadne „prepáč“. Flint kývol. Raz.', 'Flint looked at him. For a long time. No words. No “sorry”. Flint nodded. Once.'))
  const c = await g.choose([
    { id: 'nod', text: l('(Kývnuť späť.)', '(Nod back.)') },
    { id: 'word', text: l('„Sedemnásť dní. Mal som ti to povedať v prvý.“', '“Seventeen days. I should have told you on the first.”') },
    { id: 'away', text: l('(Odvrátiť zrak.)', '(Look away.)') },
  ])
  const hard = g.flag('c13.campChoice') === 'silent'
  if (c === 'nod') {
    await g.narrate(l('Arkot kývol späť.', 'Arkot nodded back.'))
    g.set('ch12.forgaveArkot', true)
    g.rel('flint', 1)
    g.rel('arkot', 1)
  } else if (c === 'word') {
    await g.say('player', l('Sedemnásť dní. Mal som ti to povedať v prvý.', 'Seventeen days. I should have told you on the first.'))
    await g.say('flint', l('Hej. Mal.', 'Yeah. You should.'), { mood: 'tender' })
    await g.narrate(l('A potom, skoro nepočuteľne, rysí úškrn. Prvý od Kitsune.', 'And then, almost inaudibly, a lynx grin. The first since Kitsune.'))
    g.set('ch12.forgaveArkot', true)
    g.rel('flint', 2)
  } else {
    await g.narrate(l('Arkot sa pozrel inam. Flint ešte chvíľu čakal. Potom si utrel krv z líca a otočil sa k baru.', 'Arkot looked away. Flint waited a moment longer. Then he wiped the blood from his cheek and turned towards the bar.'))
    g.set('ch12.forgaveArkot', !hard)
    g.rel('flint', -1)
  }
  // Maks
  void g.walk('flint', [5, 8])
  await g.walk('player', [6, 9])
  g.propVisible('redBottle', true)
  await g.narrate(l('Prach ustupoval. A v rohu baru rovnaká postava v rovnakej polohe, okuliare na tvári, iná fľaša v ruke. Červená, nie modrá. Otvoril novú, kým oni umierali.', 'The dust was withdrawing. And in the corner of the bar the same figure in the same position, goggles on his face, a different bottle in his hand. Red, not blue. He had opened a new one while they were dying.'))
  await g.say('flint', l('Ty si ich zabil?', 'Did you kill them?'), { mood: 'angry' })
  await g.narrate(l('Maks zdvihol fľašu. Napil sa.', 'Maks raised the bottle. Drank.'))
  await g.say('maks', l('Choďte. Hore. K vašej vzducholodi. Rýchlo.', 'Go. Up. To your airship. Quickly.'))
  await g.narrate(l('Goji nabral dych. Maks zdvihol fľašu.', 'Goji drew breath. Maks raised the bottle.'))
  await g.say('maks', l('Iba spia.', 'They’re only sleeping.'))
  await g.narrate(l('Hrudníky sa nezdvíhali. Klamal.', 'The chests did not rise. He was lying.'))
  g.music('null_void', 1500)
  afterState(g)
  g.cinematic(false)
}

function afterState(g: GameAPI): void {
  for (const id of ['y1', 'y2', 'y3', 'y4', 'pup', 'old', 'miner1', 'miner2']) g.show(id, false)
  for (let i = 0; i < AMBUSH_IDS.length; i++) {
    g.show(AMBUSH_IDS[i], true)
    g.pose(AMBUSH_IDS[i], 'lie')
  }
  setShutters(g, true)
  g.propVisible('maksTable', false)
  g.propVisible('maksBottles', false)
  g.propVisible('fallen', true)
  g.propVisible('redBottle', true)
  g.companion('flint', true)
  g.companion('goji', true)
  g.objective(l('Hore. K Itake. Rýchlo.', 'Up. To the Itaka. Quickly.'))
}
