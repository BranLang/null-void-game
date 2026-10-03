/**
 * c1_bay: dawn before landing (a cinematic seen from the airship). The relay
 * of horns, the drowned city on the bed of the bay with its gatherers, the
 * water that rises all at once, the brown front "exactly as fast as a horse
 * runs", and Nyau rising like the back of an animal: tide-locks, chain towers
 * and three tiers of reservoirs. "Nyau did not grind on fire. Nyau ground on Sai."
 */
import type { AmbienceDef, SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'

const dawn: AmbienceDef = {
  sky: { top: '#3d5d8f', bottom: '#ffcf9a', stars: 0.08, sai: { x: 0.16, y: 0.8, r: 0.055 }, clouds: 0.65 },
  fog: { color: '#e8cdb4', near: 16, far: 56 },
  hemi: { sky: '#c4d6f2', ground: '#7a6a58', intensity: 1.15 },
  sun: { color: '#ffd4a4', intensity: 1.85, dir: [0.65, 0.42, -0.55] },
  exposure: 1.05,
  bloom: { strength: 0.6, radius: 0.5, threshold: 0.84 },
  grade: { tint: '#fff2e4', saturation: 1.0, contrast: 1.05, vignette: 0.3 },
  particles: [
    { kind: 'steam', count: 40, area: [2, 8, 24, 27], color: '#f2e6dc' },
    { kind: 'clouds', count: 26, color: '#f6e2d0' },
  ],
  music: null,
  sounds: ['sea', 'wind'],
}

interface Gatherer {
  id: string
  at: [number, number]
  to: [number, number]
}

const GATHERERS: Gatherer[] = [
  { id: 'g0', at: [6, 14], to: [30, 14] },
  { id: 'g1', at: [10, 16], to: [30, 16] },
  { id: 'g2', at: [13, 22], to: [30, 22] },
  { id: 'g3', at: [19, 19], to: [31, 19] },
  { id: 'g4', at: [21, 12], to: [31, 12] },
  { id: 'g5', at: [11, 25], to: [30, 25] },
  { id: 'g6', at: [6, 27], to: [31, 26] },
  { id: 'g7', at: [15, 18], to: [31, 17] },
]

async function horns(g: GameAPI): Promise<void> {
  g.sfx('bass', 0.35)
  await g.wait(700)
  g.sfx('bass', 0.55)
  await g.wait(700)
  g.sfx('bass', 0.8)
}

async function cinematic(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.show('player', false)
  await g.focus([12, 18], { ms: 10, zoom: 0.78 })
  await g.wait(900)
  await g.narrate(l('Ráno pred pristátím ho zobudil zvuk, ktorý k palube nepatril. Rohy.', 'On the morning before landing he was woken by a sound that did not belong on the deck. Horns.'))
  await horns(g)
  await g.narrate(l('Reťaz rohov. Prvý zaznel ďaleko na juhu, tenko, a kým doznel, prebral ho druhý, bližšie, a tretí, až sa z toho stala jedna dlhá čiara zvuku, ktorá bežala pozdĺž pobrežia rýchlejšie, než by ju dobehol ktokoľvek na nohách.', 'A chain of horns. The first sounded far to the south, thin, and before it died away the second took it up, nearer, and a third, until it became one long line of sound running down the coast faster than anyone on foot could have kept up.'))
  await g.narrate(l('Za chrbtom mu šuchlo vrece. Flintova ruka našla pažbu prv, než Flint otvoril oči; zaradil rohy medzi veci, ktoré nestrieľajú, a spal ďalej.', 'A sack rustled behind him. Flint’s hand found the grip before Flint opened his eyes; he filed the horns among the things that don’t shoot, and went back to sleep.'))
  await g.say('loader', l('Štafeta. Voda ide.', 'The relay. The water’s coming.'))
  await g.narrate(l('Pod nimi nebolo more. Bola tam krajina, mokrá a sivá, a v nej mesto: rovné ulice, obdĺžniky základov, námestie s okrúhlou jamou.', 'Below them there was no sea. There was land, wet and grey, and in it a city: straight streets, rectangles of foundations, a square with a round pit.'))
  await g.focus([15, 15], { ms: 1600, zoom: 0.95 })
  await g.narrate(l('Veža zlomená v polovici. Čistý lom, ako keď sa odhryzne kus chleba.', 'A tower broken in half. A clean break, as when a piece is bitten off a loaf.'))
  await g.focus([11, 19], { ms: 1600, zoom: 0.85 })
  await g.narrate(l('Po dne chodili postavy s košmi na chrbtoch, drobné a zohnuté, roztrúsené po plytčinách ako zrno z roztrhnutého vreca. Na jeden úder srdca to boli tie z daminho príbehu.', 'Figures with baskets on their backs walked the seabed, small and bent, scattered over the shallows like grain from a torn sack. For one heartbeat they were the ones from the scale-woman’s story.'))
  g.pose('g1', 'stand')
  await g.wait(500)
  g.pose('g1', 'crouch')
  await g.narrate(l('Potom sa najbližšia zohla a zase narovnala. Zbierali.', 'Then the nearest one bent down and straightened again. They were gathering.'))
  await horns(g)
  // they all turn to the shore at once and climb
  for (const ga of GATHERERS) {
    g.pose(ga.id, 'stand')
    g.face(ga.id, [30, ga.at[1]])
  }
  await g.wait(400)
  const climbs = GATHERERS.map((ga, i) => g.wait(i * 120).then(() => g.walk(ga.id, ga.to, { speed: 2.6 })))
  await g.focus([20, 18], { ms: 2600, zoom: 0.8 })
  await g.narrate(l('Po prvom zatrúbení sa všetky naraz otočili k brehu a začali stúpať. Nie bežať. Stúpať, rovnomerne, ako stádo, čo pozná cestu domov.', 'At the first blast they all turned to the shore at once and began to climb. Not run. Climb, steadily, like a herd that knows the way home.'))
  await Promise.race([Promise.all(climbs), g.wait(9000)])
  for (const ga of GATHERERS) g.teleport(ga.id, ga.to, 225)
  // the flood
  g.propVisible('shadow', false)
  g.music('dungeon_water', 2500)
  await g.focus([12, 18], { ms: 1400, zoom: 0.72 })
  g.propVisible('flood', true)
  g.sfx('water', 0.7)
  await g.narrate(l('Potom sa hladina pohla. Vlna neprišla. Voda sa zdvihla celá naraz, po celej šírke zálivu, plocho a bez zvuku.', 'Then the surface moved. No wave came. The water rose all at once, across the whole width of the bay, flat and without a sound.'))
  await g.wait(1200)
  await g.narrate(l('Mesto na dne zmizlo tak, že po ňom neostalo nič, čo by ukazovalo, kde bolo.', 'The city on the seabed vanished so completely that nothing remained to show where it had been.'))
  await g.say('loader', l('Toto je klam. Kto teraz stojí dole a myslí si, že to stihne, ten už stojí mŕtvy.', 'This is the trick. Whoever’s standing down there now thinking he’ll make it is already standing dead.'))
  // the front
  await g.focus([7, 17], { ms: 1200, zoom: 0.78 })
  g.propVisible('tide', true)
  g.sfx('boom', 0.35)
  g.shake(0.08, 2500)
  await g.narrate(l('Čelo prišlo neskôr. Hnedá stena s bielym hrebeňom, vysoká ako dom a dlhá od jedného konca zálivu po druhý.', 'The front came later. A brown wall with a white crest, as high as a house and as long as the bay from end to end.'))
  void g.focus([20, 17], { ms: 7000, zoom: 0.78 })
  await g.narrate(l('Nešla rýchlo. To bolo na tom najhoršie. Šla presne tak rýchlo, ako beží kôň, nezastavila sa a v tom tempe bolo čosi úradné.', 'It did not come fast. That was the worst of it. It came exactly as fast as a horse runs, it never stopped, and there was something official about that pace.'))
  await g.say('flint', l('Braček. Na toto sa dá zvyknúť?', 'Brother. Can a man get used to this?'))
  await g.say('loader', l('Nie.', 'No.'))
  // Nyau
  g.music('main', 3000)
  await g.focus([24, 4], { ms: 2600, zoom: 0.72 })
  g.propVisible('tide', false)
  await g.narrate(l('Nyau vyšlo z tej vody ako chrbát zvieraťa.', 'Nyau rose out of that water like the back of an animal.'))
  await g.narrate(l('Náhorná plošina stála nad zálivom ako stôl a na tom stole ležalo mesto od okraja po okraj: biely kameň, krémový kameň, tisíce plochých striech a medzi nimi záhrady. Na najvyššom bode biela kupola.', 'The plateau stood above the bay like a table, and on that table lay the city from edge to edge: white stone, cream stone, thousands of flat roofs and gardens between them. On the highest point, a white dome.'))
  g.codex('world.nyau')
  await g.say('flint', l('To si postavili dobre.', 'They built that well.'))
  await g.say('loader', l('To si nepostavili. To tam bolo. Postavili si zvyšok.', 'They didn’t build that. That was there. They built the rest.'))
  await g.focus([25, 8], { ms: 1600, zoom: 0.85 })
  await g.narrate(l('Zvyšok sedel na južnej hrane. Brány v rade, hlboko zapustené do svahu, nad každou veža s bubnom a z bubna reťaze hrubé ako mužské stehno dolu do vody.', 'The rest sat on the southern edge. Gates in a row, sunk deep into the slope, above each a tower with a drum, and from the drum chains as thick as a man’s thigh running down into the water.'))
  await g.narrate(l('Nad bránami v troch stupňoch kamenné nádrže, každá veľká ako námestie v Diss. Keď more stálo najvyššie, pustili ho hore po schodoch a zavreli za ním.', 'Above the gates, in three tiers, stone reservoirs, each as big as a square in Diss. When the sea stood at its highest, they let it up the stairs and shut the door behind it.'))
  g.sfx('door', 0.8)
  g.shake(0.06, 500)
  for (const id of ['gate1o', 'gate2o', 'gate3o']) g.propVisible(id, false)
  for (const id of ['gate1c', 'gate2c', 'gate3c']) g.propVisible(id, true)
  await g.say('loader', l('Vzdúvadlá.', 'Tide-locks.'))
  await g.narrate(l('Odpľul si cez zábradlie, čo sa na palube nesmelo.', 'He spat over the rail, which was not allowed on deck.'))
  await g.say('loader', l('Ty si z Diss. Vy si myslíte, že voda je vec, čo ti berie chlapov z dna. Tu je voda vec, čo ti melie múku.', 'You’re from Diss. You lot think water is a thing that takes your men off the seabed. Here water is a thing that grinds your flour.'))
  g.codex('world.nyau_sluices')
  await g.narrate(l('V Diss sa na vode slovo more nevyslovovalo. Hovorilo sa Ona. Ona dáva, Ona berie, a múdry jej do izby nestavia nič, o čo nechce prísť.', 'In Diss nobody said the word sea out on the water. They said She. She gives, She takes, and a wise man builds nothing in her room that he is not willing to lose.'))
  await g.narrate(l('Nyau jej postavilo schody. Počkalo, kým vyjde hore, zavrelo za ňou dvere a von ju pustí len cez kolesá.', 'Nyau had built her stairs. It waited until she climbed them, shut the door behind her, and lets her out only through its wheels.'))
  await g.focus([22, 5], { ms: 1800, zoom: 0.8 })
  await g.narrate(l('Pri klesaní mu to zapadlo do seba ako dobre urobený čap. Odliv sa začal a mesto púšťalo vodu z nádrží späť, hrdlo po hrdle, a v každom hrdle sa roztočilo koleso a z kolesa bežal hriadeľ po múre kanála cez celú štvrť.', 'On the descent it all fitted together for him like a well-cut joint. The ebb had begun and the city was letting the water out of its reservoirs, throat by throat, and in every throat a wheel began to turn, and from every wheel a shaft ran along a canal wall through a whole quarter.'))
  await g.narrate(l('Mlyny pod sýpkami a múčny prach v slnku. Vahadlá na západnom svahu, hore a dolu, ako pole obilia vo vetre. Nikde oheň. Ani kotol, ani kyslastý dych etanolu, ktorý mal Arkot spojený s každým strojom v živote.', 'Mills beneath the granaries and flour dust in the sunlight. Sweeps on the western slope, up and down, like a field of grain in the wind. No fire anywhere. No boiler, no sour breath of ethanol, which Arkot had tied to every machine in his life.'))
  await g.caption(l('Nyau nemlelo na oheň. Nyau mlelo na Sai.', 'Nyau did not grind on fire. Nyau ground on Sai.'), { ms: 3400 })
  await g.say('flint', l('A keď sú brány zavreté?', 'And when the gates are shut?'))
  await g.say('loader', l('Tak stojíš. Mlyny stoja, vetráky stoja. Aj stoky. Máme jeden systém, nie dva. Keď sa to nepustí načas, smrdí to aj hore. A to je jediný deň, keď hore niekoho zaujíma, čo sa deje dole.', 'Then you stand still. The mills stand, the fans stand. The sewers too. We’ve got one system, not two. When it isn’t let out on time it stinks even up top. And that’s the only day anyone up top cares what goes on down below.'))
  await g.say('player', l('Chodia tam dolu? Do tých hrdiel?', 'Do they go down there? Into those throats?'))
  await g.say('loader', l('Chodia.', 'They do.'))
  await g.narrate(l('A viac k tomu nedodal, a to bola odpoveď.', 'And he added nothing more, and that was the answer.'))
  g.set('c1.bayDone')
  await g.fade('black', 1500)
  g.cinematic(false)
  await g.goto('c1_aerodock')
}

export const bay: SceneDef = {
  id: 'c1_bay',
  name: l('Záliv pod Nyau', 'The Bay below Nyau'),
  ambience: dawn,
  camera: { zoom: 0.78 },
  map: {
    rows: [
      '                   PPHHPgPHPDgPP',
      '                   PgPPPPgPHHPPg',
      '                   PPPPHHPgPPPHP',
      '                   PPPPPPPPPPPPP',
      '                 ,,ppppppppppppp',
      '                 ,,rrrrrrrrrrrrr',
      '                 ,,qqqqqqqqqqqqq',
      '                 ,,sssssssssssss',
      '~~~,....=........,,uuuuuuuuuuuuu',
      '~~,,###.=.######o,,vvvvvvvvvvvvv',
      '~~~,#.#o=......#..dddddddddddddd',
      '~~~,#.#.=w#....#.=.......1234566',
      '~~,,#.#.=.##.###.=..o....1234566',
      '~~~,====================.1234566',
      '~~~,.o..=..w.....=....o..1234566',
      '~~,,###.=o...w.T.=.####..1234566',
      '~~~,#...=.....o..=....#..1234566',
      '~~~,#.#.=.=====..=w#..#..1234566',
      '~~,,###.=.==w==..=.####..1234566',
      '~~~,.w..=.=www=.o=...w...1234566',
      '~~~,==w=====w===========.1234566',
      '~~,,...o=.=====..=.......1234566',
      '~~~,#.#.=.......w=.##.#..1234566',
      '~~~,#.#.=w###.##.=o#..#w.1234566',
      '~~,,#.#.=.#o...#.=.#.....1234566',
      '~~~,###.=.#......=.####..1234566',
      '~~~,....=.######.=.....w.1234566',
      '~~,,....=....o...=..w....1234566',
    ],
    legend: {
      '~': { floor: 'deep' },
      ',': { floor: 'sand', tint: '#b8aa8c' },
      '.': { floor: 'mud', tint: '#a49c8a' },
      '=': { floor: 'cobble', tint: '#9a968a' },
      '#': { floor: 'cobble', tint: '#9a968a', wall: 'stone', wallH: 0.6 },
      w: { floor: 'water' },
      o: { floor: 'mud', tint: '#a49c8a', prop: 'c1_rubble' },
      T: { floor: 'cobble', tint: '#9a968a', prop: 'c1_ruin_tower' },
      '1': { floor: 'gravel', h: 1, stairs: true, tint: '#b8b0a0' },
      '2': { floor: 'gravel', h: 2, stairs: true, tint: '#bab2a2' },
      '3': { floor: 'grass', h: 3, stairs: true, tint: '#a8b090' },
      '4': { floor: 'grass', h: 4, stairs: true, tint: '#a0ac88' },
      '5': { floor: 'grass', h: 5, stairs: true, tint: '#98a880' },
      '6': { floor: 'grass', h: 6, stairs: true, tint: '#90a478' },
      P: { floor: 'white', h: 12, side: 'white' },
      H: { floor: 'white', h: 12, side: 'white', wall: 'white', wallH: 1.1 },
      g: { floor: 'grass', h: 12, side: 'white', prop: { type: 'tree', params: { bio: true, size: 0.9 } } },
      D: { floor: 'white', h: 12, side: 'white', prop: 'c1_dome' },
      p: { floor: 'stone', h: 9, side: 'white', prop: 'c1_pool' },
      r: { floor: 'white', h: 10, side: 'white' },
      q: { floor: 'stone', h: 6, side: 'white', prop: 'c1_pool' },
      s: { floor: 'white', h: 7, side: 'white' },
      u: { floor: 'stone', h: 3, side: 'white', prop: 'c1_pool' },
      v: { floor: 'white', h: 4, side: 'white' },
      d: { floor: 'deep' },
    },
  },
  props: [
    { type: 'c1_shadow', at: [12, 18], id: 'shadow', params: { range: 16, speed: 0.6 } },
    { type: 'c1_flood', at: [15, 18], offset: [0.5, -0.5], id: 'flood', hidden: true, params: { w: 32, d: 20, from: -1.2, to: 2.35, dur: 6 } },
    { type: 'c1_tide', at: [0, 18], rot: 90, y: 2.15, id: 'tide', hidden: true, params: { w: 21, h: 1.3, speed: 2.8, dist: 25 } },
    { type: 'c1_chain_tower', at: [20, 9], params: { h: 3.2 } },
    { type: 'c1_chain_tower', at: [24, 9], params: { h: 3.2 } },
    { type: 'c1_chain_tower', at: [28, 9], params: { h: 3.2 } },
    { type: 'c1_lockgate', at: [22, 10], id: 'gate1o', params: { open: true } },
    { type: 'c1_lockgate', at: [26, 10], id: 'gate2o', params: { open: true } },
    { type: 'c1_lockgate', at: [30, 10], id: 'gate3o', params: { open: true } },
    { type: 'c1_lockgate', at: [22, 10], id: 'gate1c', hidden: true },
    { type: 'c1_lockgate', at: [26, 10], id: 'gate2c', hidden: true },
    { type: 'c1_lockgate', at: [30, 10], id: 'gate3c', hidden: true },
    { type: 'c1_sweep', at: [21, 5] },
    { type: 'c1_sweep', at: [25, 5] },
    { type: 'c1_sweep', at: [29, 5] },
    { type: 'c1_sweep', at: [23, 7] },
    { type: 'c1_sweep', at: [27, 7] },
    { type: 'banner', at: [19, 3], color: '#e8e0f4', params: { emblem: 'star' } },
    { type: 'banner', at: [31, 3], color: '#e8e0f4', params: { emblem: 'star' } },
    { type: 'boulder', at: [27, 13] },
    { type: 'boulder', at: [29, 21] },
    { type: 'rock', at: [26, 17] },
    { type: 'rock', at: [28, 25] },
    { type: 'grass', at: [29, 15] },
    { type: 'grass', at: [30, 23] },
    { type: 'grass', at: [28, 19] },
    { type: 'reeds', at: [3, 16] },
    { type: 'reeds', at: [3, 22] },
    { type: 'basket', at: [7, 14], params: { fill: 'fish' } },
    { type: 'basket', at: [14, 22], params: { fill: 'empty' } },
  ],
  player: { character: 'arkot', at: [31, 27], facing: 135 },
  actors: GATHERERS.map((ga, i) => ({ id: ga.id, character: `c1_gatherer${i}`, at: ga.at, facing: (i * 70) % 360, pose: 'crouch' as const })),
  onEnter: async (g) => {
    await cinematic(g)
  },
}
