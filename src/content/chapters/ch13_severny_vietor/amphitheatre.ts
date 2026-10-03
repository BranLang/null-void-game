/**
 * Kapitola 17 (end): the heavy hour. The cannon “Felix” has to go. A dozen foxes, three bolts,
 * a snapped rope. Then six crystals find one rhythm, Sai turns, and the Itaka rises. North.
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { heavyKitsune } from './ambience'

const LIFT = ['ita1', 'ita2', 'ita3', 'ita4', 'ita5', 'ita6']
const LIFT_Y = [0.25, 0.55, 1.1, 2.0, 3.4, 5.4]

export const amphitheatreScene: SceneDef = {
  id: 'c13_amphitheatre',
  name: l('Amfiteáter', 'The Amphitheatre'),
  ambience: { ...heavyKitsune, music: 'moss' },
  camera: { zoom: 0.92 },
  sai: { phase: 'heavy' },
  map: {
    rows: [
      '33333333333333333333333333',
      '33333333333333333333333333',
      '33222222222222222222222222',
      '33222222222222222222222222',
      '33221111111111111111111111',
      '33221111111111111111111111',
      '332211....,,.....,,.......',
      '332211..,,,..............,',
      '332211....................',
      '332211....................',
      '33221,....................',
      '33221,....................',
      '332211....................',
      '332211..............,,....',
      '332211.....,..............',
      '33221.....................',
      '3322......................',
      '332.......................',
      '33........................',
      '3.........................',
    ],
    legend: {
      '3': { floor: 'stone', h: 3, stairs: true, tint: '#8e8a82' },
      '2': { floor: 'stone', h: 2, stairs: true, tint: '#96928a' },
      '1': { floor: 'stone', h: 1, stairs: true, tint: '#9e9a92' },
      '.': { floor: 'stone', tint: '#a8a49a' },
      ',': { floor: 'moss', tint: '#8a9a78' },
    },
  },
  props: [
    { type: 'itaka', at: [15, 10], y: 0.25, id: 'itaka' },
    ...LIFT.map((id, i) => ({ type: 'c13_itaka_bare', at: [15, 10] as [number, number], y: LIFT_Y[i], id, hidden: true })),
    { type: 'cannon', at: [15, 14], y: 1.15, rot: 0, id: 'can1', hidden: true },
    { type: 'cannon', at: [15, 15], y: 0.55, rot: 0, id: 'can2', hidden: true },
    { type: 'cannon', at: [15, 16], rot: 8, id: 'can3', hidden: true },
    { type: 'dock_post', at: [12, 8] },
    { type: 'dock_post', at: [18, 8] },
    { type: 'dock_post', at: [12, 12] },
    { type: 'dock_post', at: [18, 12] },
    { type: 'rope_coil', at: [11, 13] },
    { type: 'rope_coil', at: [19, 9] },
    { type: 'crate', at: [21, 14], params: { stack: true } },
    { type: 'barrel', at: [22, 15] },
    { type: 'barrel', at: [22, 16], params: { lying: true } },
    { type: 'sack', at: [21, 16], params: { count: 3 } },
    { type: 'pillar', at: [7, 7], params: { h: 2.6, broken: true, style: 'white' } },
    { type: 'pillar', at: [24, 7], params: { h: 3, broken: true, style: 'white' } },
    { type: 'pillar', at: [7, 18], params: { h: 2, broken: true, style: 'white' } },
    { type: 'vine_pillar', at: [3, 9], params: { broken: true } },
    { type: 'bush', at: [24, 18] },
    { type: 'grass', at: [10, 7] },
    { type: 'grass', at: [21, 13] },
  ],
  player: { character: 'arkot_glyph', at: [10, 16], facing: 90 },
  actors: [
    { id: 'saburo', character: 'saburo', at: [20, 16], facing: 270, talk: (g) => talkSaburo(g) },
    { id: 'dara', character: 'dara', at: [12, 15], facing: 90, talk: (g) => talkDara(g) },
    { id: 'yori', character: 'yori', at: [18, 15], facing: 270 },
    { id: 'flint', character: 'flint', at: [17, 14], facing: 180 },
    {
      id: 'goji',
      character: 'goji',
      at: [13, 14],
      facing: 90,
      hidden: true,
      talk: async (g) => {
        if (g.flag('c13.cannonDown')) await liftoff(g)
      },
    },
    { id: 'fox1', character: 'c13_fox1', at: [13, 16], facing: 180 },
    { id: 'fox2', character: 'c13_fox2', at: [17, 16], facing: 180 },
    { id: 'fox3', character: 'c13_fox3', at: [14, 17], facing: 180 },
    { id: 'fox4', character: 'c13_fox4', at: [16, 17], facing: 180 },
    { id: 'fox5', character: 'c13_fox5', at: [9, 3], facing: 0, behavior: 'look' },
    { id: 'fox6', character: 'c13_fox6', at: [17, 2], facing: 0, behavior: 'look' },
    { id: 'fox7', character: 'c13_fox7', at: [3, 12], facing: 90, behavior: 'look' },
    { id: 'fox8', character: 'c13_fox8', at: [2, 6], facing: 90, behavior: 'look' },
  ],
  interactables: [
    {
      id: 'bolt1',
      at: [14, 14],
      label: l('Prvá skrutka', 'The first bolt'),
      verb: 'use',
      when: (g) => !g.flag('c13.bolt1'),
      run: async (g) => {
        g.pose('player', 'crouch')
        g.sfx('crack', 0.7)
        g.shake(0.12, 500)
        await g.narrate(l('Kľúč na hrdzavej matici sa zahryzol, otočil, a zvuk, čo vydal, bol ako zlomená kosť. Oceľ v dreve. Nespočet zím, čo tavili železo s dubom, kým z toho bolo jedno.', 'The wrench bit on the rusted nut, turned, and the sound it made was like a breaking bone. Steel in wood. Countless winters fusing iron and oak until they were one.'))
        g.pose('player', 'stand')
        g.set('c13.bolt1')
        bolts(g)
      },
    },
    {
      id: 'bolt2',
      at: [16, 14],
      label: l('Druhá skrutka', 'The second bolt'),
      verb: 'use',
      when: (g) => !!g.flag('c13.bolt1') && !g.flag('c13.bolt2'),
      run: async (g) => {
        g.pose('player', 'crouch')
        g.sfx('crack', 0.7)
        await g.narrate(l('Druhá skrutka. Každá ťažšia. Nie hmota, nie hrdza. Gravitácia. Ruky sa triasli a prsty kĺzali po kľúči mokrom od potu.', 'The second bolt. Each one heavier. Not mass, not rust. Gravity. Hands shaking, fingers slipping on a wrench wet with sweat.'))
        g.pose('player', 'stand')
        g.set('c13.bolt2')
        bolts(g)
      },
    },
    {
      id: 'bolt3',
      at: [15, 14],
      label: l('Tretia skrutka', 'The third bolt'),
      verb: 'use',
      when: (g) => !!g.flag('c13.bolt2') && !g.flag('c13.bolt3'),
      run: async (g) => {
        g.pose('player', 'crouch')
        g.sfx('crack', 0.9)
        g.shake(0.2, 600)
        await g.narrate(l('Tretia. Matica povolila s výkrikom, ktorý nepatril kovu.', 'The third. The nut gave with a cry that did not belong to metal.'))
        g.pose('player', 'stand')
        g.set('c13.bolt3')
        g.cinematic(true)
        g.sfx('crack', 1)
        g.shake(0.35, 700)
        g.bark('fox1', l('Au! Prst!', 'Ah! My finger!'))
        await g.narrate(l('Lano prasklo. Prvé, na pravej strane, kde lafeta nesedela rovno. Tupé buchnutie a hlaveň sa nahla. Niekto zaskučal, prasknutý prst pod oceľou. Nikto sa nezastavil.', 'A rope snapped. The first one, on the right, where the carriage didn’t sit straight. A dull thud and the barrel tilted. Someone yelped, a finger cracked under the steel. Nobody stopped.'))
        g.cinematic(false)
        g.objective(l('Ťahaj lano s lišiakmi.', 'Haul on the rope with the foxes.'))
        g.hint(l('E — zabrať za lano (niekoľkokrát)', 'E — heave on the rope (several times)'))
      },
    },
    {
      id: 'rope',
      at: [13, 15],
      label: l('Zabrať za lano', 'Heave on the rope'),
      verb: 'use',
      radius: 1.8,
      when: (g) => !!g.flag('c13.bolt3') && !g.flag('c13.cannonDown'),
      run: (g) => heave(g),
    },
  ],
  onEnter: async (g) => {
    g.sai('heavy')
    await g.once('c13.amphIntro', async () => {
      g.cinematic(true)
      await g.narrate(l('Ťažká hodina.', 'The heavy hour.'))
      await g.focus('itaka', { ms: 1200, zoom: 1.05 })
      await g.narrate(l('Oceľová hlaveň. Felixov kanón, súčasť Itaky od čias, čo si Arkot nepamätal. Ťažší než celá posádka dokopy.', 'A steel barrel. Felix’s cannon, part of the Itaka since before Arkot could remember. Heavier than the whole crew put together.'))
      await g.narrate(l('Kanón musel ísť dolu.', 'The cannon had to go.'))
      g.follow()
      await g.zoom(0.92, 600)
      await g.narrate(l('Kitsunčania prišli bez vyzvania. Tucet lišiakov, laná cez ramená, páky v rukách. Nikto nič nepovedal.', 'The Kitsune foxes came without being asked. A dozen of them, ropes over their shoulders, levers in their hands. Nobody said a word.'))
      g.cinematic(false)
      g.objective(l('Povoľ skrutky lafety na prove.', 'Loosen the carriage bolts at the prow.'))
    })
    if (g.flag('c13.bolt3') && !g.flag('c13.cannonDown')) g.hint(l('E — zabrať za lano (niekoľkokrát)', 'E — heave on the rope (several times)'))
    if (g.flag('c13.cannonDown')) cannonDownState(g)
  },
}

function bolts(g: GameAPI): void {
  const n = ['c13.bolt1', 'c13.bolt2', 'c13.bolt3'].filter((k) => g.flag(k)).length
  if (n < 3) g.objective(l(`Povoľ skrutky lafety na prove (${n}/3).`, `Loosen the carriage bolts at the prow (${n}/3).`))
}

async function heave(g: GameAPI): Promise<void> {
  const n = g.inc('c13.heave')
  g.pose('player', 'fight')
  g.sfx('whoosh', 0.5)
  for (const f of ['fox1', 'fox2', 'fox3', 'fox4']) g.pose(f, 'fight')
  g.bark(n % 2 ? 'fox2' : 'fox3', n % 2 ? l('Hej… rup!', 'Heave… ho!') : l('Ešte!', 'Again!'))
  await g.wait(450)
  for (const f of ['fox1', 'fox2', 'fox3', 'fox4']) g.pose(f, 'stand')
  g.pose('player', 'stand')
  if (n === 1) {
    g.shake(0.12, 400)
    await g.narrate(l('Tucet chrbátov. Tucet zaťatých čeľustí. Kanón sa pohol. Palec, dva, šúchal sa po dreve provy a zanechával za sebou ryhy, čo už nikdy nikto nevyplní.', 'A dozen backs. A dozen clenched jaws. The cannon moved. An inch, two, scraping across the wood of the prow and leaving grooves behind that no one would ever fill.'))
  } else if (n === 2) {
    g.propVisible('itaka', false)
    g.propVisible('ita1', true)
    g.propVisible('can1', true)
    g.sfx('crack', 0.8)
    await g.narrate(l('Rampa z dosiek. Kanón sa pohýbal po nej, pomaly…', 'A ramp of planks. The cannon crept down it, slowly…'))
  } else if (n === 3) {
    g.propVisible('can1', false)
    g.propVisible('can2', true)
    await g.narrate(l('…potom rýchlejšie…', '…then faster…'))
  } else {
    g.hint(null)
    g.cinematic(true)
    g.propVisible('can2', false)
    g.propVisible('can3', true)
    g.sfx('boom', 1)
    g.shake(0.6, 1100)
    g.fx('dust', [15, 16], { scale: 1.5 })
    g.set('c13.cannonDown')
    await g.narrate(l('…potom už len pád. Oceľ na kameň. Ťažký, tupý zvuk. Definitívny. Amfiteáter ho pohltil a vrátil späť. Ozvena, čo trvala pridlho.', '…then nothing but a fall. Steel on stone. A heavy, dull sound. Final. The amphitheatre swallowed it and gave it back. An echo that went on too long.'))
    await g.focus('ita1', { ms: 900 })
    await g.narrate(l('Dubový rám na prove, prázdny. Diery po skrutkách. Itaka bez kanóna vyzerala ako tvár, z ktorej niekto vyrazil zub.', 'The oak frame at the prow, empty. Bolt holes. Without her cannon the Itaka looked like a face with a tooth knocked out.'))
    await g.focus('saburo', { ms: 900 })
    await g.narrate(l('Saburo stál v amfiteátri. Fajku už zdvihol, zapálenú, v ústach. Pozeral, ako Itaka, kedysi jeho, stráca jedinú zbraň. A nič nepovedal.', 'Saburo stood in the amphitheatre. He had picked up his pipe, lit, in his mouth. He watched the Itaka, once his, lose her only weapon. And he said nothing.'))
    g.follow()
    g.cinematic(false)
    cannonDownState(g)
  }
}

function cannonDownState(g: GameAPI): void {
  g.propVisible('itaka', false)
  g.propVisible('ita1', true)
  g.propVisible('can1', false)
  g.propVisible('can2', false)
  g.propVisible('can3', true)
  g.show('goji', true)
  g.teleport('goji', [13, 14], 90)
  g.objective(l('Prehovor s Gojim. Je čas.', 'Talk to Goji. It is time.'))
  g.hint(null)
}

async function talkSaburo(g: GameAPI): Promise<void> {
  if (!g.flag('c13.cannonDown')) {
    await g.narrate(l('Saburo stál s rukami za chrbtom a pozeral na hlaveň. Nepovedal nič, a predsa bolo jasné, čo si myslí.', 'Saburo stood with his hands behind his back, looking at the barrel. He said nothing, and yet it was clear what he thought.'))
    await g.say('saburo', l('Felix ho kedysi kul tri zimy. Vráť mu ho, keď sa vrátite.', 'Felix spent three winters forging it once. Give it back to him when you return.'))
    return
  }
  await g.say('saburo', l('Choď. Nepozeraj sa späť, navigátor. Kto sa otáča, ten nevidí prúdy.', 'Go. Don’t look back, navigator. Whoever turns around can’t see the currents.'))
}

async function talkDara(g: GameAPI): Promise<void> {
  await g.say('dara', l('Bez kanóna je ľahšia o štvrtinu. V ťažkej hodine to stačiť nebude. S tým šialeným šiestym kryštálom možno áno.', 'Without the cannon she’s a quarter lighter. In the heavy hour that won’t be enough. With that mad sixth crystal, maybe.'))
}

/** The lift-off: Goji's “Now.”, Sai turning, six crystals in one rhythm. */
export async function liftoff(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  g.face('goji', 'player')
  await g.narrate(l('Goji vybehol z podpalubia. Olej na lícach. Oči jasné, sústredené, živé.', 'Goji came running up from the hold. Oil on his cheeks. Eyes bright, focused, alive.'))
  await g.say('goji', l('Teraz.', 'Now.'), { mood: 'determined' })
  // everybody aboard
  for (const id of ['goji', 'flint', 'dara', 'yori']) g.show(id, false)
  g.show('player', false)
  await g.focus('ita1', { ms: 900, zoom: 0.9 })
  await g.narrate(l('Celá Itaka sa triasla. Hrubá triaška, čo šla z podpalubia cez rebrá trupu a končila v Arkotových prstoch na kormidle.', 'The whole Itaka shook. A coarse trembling that ran from the hold through the ribs of the hull and ended in Arkot’s fingers on the helm.'))
  g.sai('light')
  g.sfx('bass', 0.6)
  await g.narrate(l('A potom sa Sai pohla spoza planéty. Vibrácia v podlahe sa zmenila, z vrčania na hlboký rev. Šesť kryštálov našlo spoločný rytmus.', 'And then Sai began to move out from behind the world. The vibration in the floor changed, from a growl to a deep roar. Six crystals found one rhythm.'))
  g.music('main', 1800)
  const lines = [
    l('Dvanásť palcov.', 'Twelve inches.'),
    l('Osemnásť.', 'Eighteen.'),
    l('Stopa.', 'A foot.'),
  ]
  for (let i = 0; i < lines.length; i++) {
    g.propVisible(LIFT[i], false)
    g.propVisible(LIFT[i + 1], true)
    g.shake(0.15, 400)
    await g.narrate(lines[i])
  }
  void g.walk('fox1', [12, 9], { run: true })
  void g.walk('fox2', [18, 9], { run: true })
  void g.walk('fox3', [12, 13], { run: true })
  void g.walk('fox4', [18, 13], { run: true })
  await g.narrate(l('Kotviacie laná sa napli, praskali, držali Itaku pri zemi ako remene na zvierati, čo sa chce vytrhnúť.', 'The mooring lines went taut, creaking, holding the Itaka to the ground like straps on an animal that wants to tear itself loose.'))
  await g.say('flint', l('Uvoľniť laná!', 'Cast off!'), { mood: 'determined' })
  await g.narrate(l('Žiadny krik. Rozkaz. Prvý rozkaz na tejto palube, čo neprišiel zo Saburových úst.', 'Not a shout. An order. The first order on this deck that did not come from Saburo’s mouth.'))
  g.sfx('whoosh', 0.8)
  g.propVisible(LIFT[3], false)
  g.propVisible(LIFT[4], true)
  await g.zoom(0.75, 900)
  await g.narrate(l('Laná spadli. Itaka sa dvihla. Pomaly, namáhavo, palec za palcom. Trup zastonal.', 'The lines fell away. The Itaka rose. Slowly, laboriously, inch by inch. The hull groaned.'))
  g.propVisible(LIFT[4], false)
  g.propVisible(LIFT[5], true)
  await g.zoom(0.62, 1000)
  await g.narrate(l('Dve stopy, tri, päť… hrana amfiteátra zmizla pod Arkotovými nohami. Desať stôp. Dvadsať. Prevýšenie, čo by pri páde zabilo.', 'Two feet, three, five… the rim of the amphitheatre vanished beneath Arkot’s feet. Ten feet. Twenty. A height that would kill if you fell.'))
  await g.narrate(l('Tamin dom niekde v tej čiernote. Čierny fľak uprostred zelene. Neprirodzene ostrá hrana medzi svetlom a tmou. Len svetlo. A potom nič.', 'Tami’s house somewhere in that blackness. A black stain in the green. An unnaturally sharp edge between light and dark. Only light. And then nothing.'))
  await g.say('player', l('Yera.', 'Yera.'), { thought: true, mood: 'sad' })
  await g.narrate(l('Goji mu položil ruku na rameno. Krátko, a vzápätí ju stiahol. Arkot nedvihol hlavu. Itaka sa otočila na sever, ťažkopádne, ako starý muž vstávajúci zo stoličky.', 'Goji laid a hand on his shoulder. Briefly, then took it back. Arkot did not raise his head. The Itaka turned north, ponderously, like an old man getting up from a chair.'))
  await g.narrate(l('Ale leteli.', 'But they flew.'))
  await g.fade('black', 1200)
  g.cinematic(false)
  // the long flight north
  const r = await g.minigame('navigation', {
    map: 'north',
    crystals: 6,
    days: 14,
    title: l('Severný vietor', 'North Wind'),
    subtitle: l('Navigoval podľa prúdov. Nie podľa mapy. Prúdy neklamali.', 'He navigated by the currents. Not by the map. The currents did not lie.'),
  })
  g.set('c13.navScore', Math.round((r.score ?? (r.success ? 1 : 0.4)) * 100))
  g.set('c13.navOk', r.success)
  await g.goto('c13_camp')
}
