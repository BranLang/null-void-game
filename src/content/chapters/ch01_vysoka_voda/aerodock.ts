/**
 * c1_aerodock: the Nyau aerodock in the morning, bigger than all of Diss.
 * Lantern skeletons for Tōr; the dock woman at the scales who lowers HER eyes;
 * three streets to understand that the city takes Arkot for a pureblood; Flint
 * cleaning a clean revolver and the wet sleeve (press him, or let it go); the
 * foreman's line and the temple bells. "Go and find that luck of yours."
 */
import type { AmbienceDef, SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { resetWanderers, updateWanderers, wanderers } from './util'

const morning: AmbienceDef = {
  sky: { top: '#7fb2e2', bottom: '#fbe6c8', stars: 0, sai: { x: 0.2, y: 0.84, r: 0.05 }, clouds: 0.35 },
  fog: { color: '#cfe0ee', near: 18, far: 60 },
  hemi: { sky: '#bcd4ff', ground: '#6a5a48', intensity: 1.2 },
  sun: { color: '#ffe8c8', intensity: 2.2, dir: [-0.42, 0.8, 0.45] },
  exposure: 1.0,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.86 },
  grade: { tint: '#fff6ea', saturation: 1.05, contrast: 1.04, vignette: 0.22 },
  particles: [
    { kind: 'dust', count: 120, color: '#f4ead8' },
    { kind: 'motes', count: 30, area: [12, 20, 31, 27], color: '#fff2cc' },
  ],
  music: 'main',
  sounds: ['crowd', 'machine', 'water', 'wind'],
}

const SCALES: [number, number] = [7, 10]

const crowd = wanderers([
  { id: 'crew1', points: [[19, 4], [24, 5], [20, 2], [25, 3]] },
  { id: 'walker1', points: [[16, 18], [22, 16], [26, 20], [19, 21], [12, 18]] },
  { id: 'walker2', points: [[25, 11], [20, 12], [27, 13], [23, 20], [17, 19]] },
  { id: 'carrier', points: [[29, 12], [22, 22], [14, 19], [26, 22]], speed: 1.6 },
])

/** play the beats the player walked around, so the realisation always lands */
async function missedBeats(g: GameAPI): Promise<void> {
  if (!g.flag('c1.t1')) {
    g.set('c1.t1')
    await g.narrate(l('Pri váhach mu dokárka s kriedou a zoznamom uhla z cesty. Nie on jej. Ona jemu.', 'At the scales a dock woman with chalk and a list stepped out of his way. Not he out of hers. She out of his.'))
  }
  if (!g.flag('c1.t2') || !g.flag('c1.t3')) {
    g.set('c1.t2')
    g.set('c1.t3')
    await g.narrate(l('Zopakovalo sa to pri nosičke s košom aj pri dvoch mladých v modrých šatkách, ktoré si medzi sebou čosi povedali a obe naraz pozreli inam.', 'It happened again with a porter carrying a basket, and with two young women in blue scarves who said something to each other and both looked away at once.'))
  }
}

async function realisation(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await missedBeats(g)
  await g.focus('player', { ms: 700, zoom: 1.25 })
  await g.narrate(l('Trvalo mu tri ulice, kým pochopil, čo vidia.', 'It took him three streets to understand what they saw.'))
  await g.narrate(l('Nie jeho. Postavu, ktorú z neho urobili roky pod vrecami: plecia, čo v disských dverách chodili bokom, výšku, pre ktorú sa v podpalubiach zohýnal pri každom tráme.', 'Not him. The figure that years under sacks had made of him: shoulders that went sideways through Diss doorways, a height that made him stoop at every beam below decks.'))
  await g.narrate(l('Slnko z dokov mu udržiavalo kožu natoľko tmavú, že leopardie škvrny na krku a na predlaktiach splývali so vzorom tieňa. Kto nepoznal kresbu, čítal ju ako ozdobu, nie ako kastu.', 'The sun on the docks kept his skin dark enough that the leopard spots on his neck and forearms melted into the pattern of shadow. Whoever did not know the markings read them as ornament, not as caste.'))
  await g.narrate(l('A tvár. Hladká, s jemnými črtami, za ktoré si v Diss vyslúžil meno, čo sa nehovorí pred matkou. V meste, kde sa krv rátala do desiatej generácie a merala okom, ho tá istá tvár preložila do niečoho, čím nebol.', 'And the face. Smooth, fine-featured, the face that had earned him a name in Diss you do not say in front of your mother. In a city where blood was counted to the tenth generation and measured by eye, that same face translated him into something he was not.'))
  await g.caption(l('Mali ho za čistokrvného.', 'They took him for a pureblood.'), { ms: 3000 })
  g.codex('gloss.pursang')
  await g.narrate(l('Bola to lož, ktorú nepovedal. Stačilo, že prišiel, a mesto si ju domyslelo samo.', 'It was a lie he had never told. It was enough that he had come; the city made it up by itself.'))
  await g.narrate(l('Prezrádzali ho len šaty: rybárske plátno vyprané do sivej, príliš krátke rukávy, opasok zauzlený tam, kde sa pretrhol, a topánky, na ktorých bolo poznať soľ z troch prekládok. V Nyau sa šaty dajú vymeniť. Tvár nie.', 'Only his clothes gave him away: fisherman’s canvas washed to grey, sleeves too short, a belt knotted where it had snapped, and shoes that still showed the salt of three changes. In Nyau clothes can be changed. A face cannot.'))
  await g.narrate(l('A ešte jedna vec, na ktorú prišiel až na rohu. Nikto tu nikoho netriedil na mužov a ženy. Pri váhach stáli jedni aj druhí, hádali sa o cenu, smiali sa, a nikto od neho nečakal, že spustí bradu. Nikto od neho nečakal, že pôjde krok za ženou.', 'And one more thing he only realised at the corner. Nobody here sorted anybody into men and women. Both stood at the scales, haggled over the price, laughed, and nobody expected him to lower his chin. Nobody expected him to walk a step behind a woman.'))
  g.pose('player', 'stand')
  g.glyph('player', 0.6)
  await g.narrate(l('Narovnal chrbát. Medzi lopatkami sa mu pustil uzol starý ako on sám. Prvýkrát za štyri zimy to nič nestálo.', 'He straightened his back. Between his shoulder blades a knot as old as he was came loose. For the first time in four winters it cost nothing.'))
  g.codex('cal.seasons')
  await g.narrate(l('Niekde vysoko nad ním klopala reťaz stavidla a v kanáli pod múrom sa točilo koleso. Päť miliónov duší na jednej skale, ktorá bola každý druhý deň ostrovom.', 'Somewhere high above him a sluice chain clanked, and in the canal under the wall a wheel was turning. Five million souls on one rock that was an island every other day.'))
  await g.say('player', l('Choď a nájdi si to svoje šťastie.', 'Go and find that luck of yours.'), { thought: true })
  await g.narrate(l('Prvýkrát od Diss mu to znelo ako úloha, ktorá sa dá splniť.', 'For the first time since Diss it sounded like a task that could be done.'))
  g.set('c1.realised')
  g.follow()
  await g.zoom(1, 600)
  g.cinematic(false)
  g.objective(l('Sadni si k Flintovi.', 'Sit down next to Flint.'))
}

async function wetSleeve(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.walk('player', [10, 19])
  g.teleport('player', [10, 20])
  g.face('player', 'flint')
  g.pose('player', 'sit')
  await g.focus([9, 20], { ms: 800, zoom: 1.4 })
  await g.narrate(l('Kým čakali na predáka, Flint si čistil revolver. Robil to bez dôvodu. Zbraň bola čistá. Robil to preto, že mal prsty a prsty potrebovali prácu.', 'While they waited for the foreman, Flint cleaned his revolver. He did it for no reason. The gun was clean. He did it because he had fingers and fingers needed work.'))
  g.sfx('tick')
  await g.say('player', l('Bubienok. Roztočiť. Zastaviť dlaňou. Nábojnicu vyhodiť a chytiť bez pozerania.', 'The cylinder. Spin it. Stop it with the palm. Flick out a cartridge and catch it without looking.'), { thought: true })
  await g.narrate(l('Arkot si oprel predlaktia o kolená. Dlaňou pritom prešiel po doske. Dubové drevo, kladené naprieč, a v jednom mieste pod ním nesedelo; čosi tam bolo mäkké na dĺžku dlane.', 'Arkot rested his forearms on his knees. His palm brushed the board. Oak, laid crossways, and in one place it did not sit right underneath; something there was soft, a palm’s length of it.'))
  await g.narrate(l('Ruku odtiahol a nepovedal nič. Nehovorilo sa o tom. Nehovorilo sa o tom ani doma.', 'He pulled his hand away and said nothing. One didn’t talk about it. One didn’t talk about it at home, either.'))
  await g.say('player', l('V Diss. Poslednú noc.', 'In Diss. The last night.'))
  g.sfx('tick')
  await g.say('flint', l('Hm.', 'Hm.'))
  await g.say('player', l('Prišiel si o hodinu neskôr, než sme sa dohodli.', 'You came an hour later than we agreed.'))
  await g.say('flint', l('Prišiel som.', 'I came.'))
  await g.say('player', l('Mal si mokrý rukáv.', 'Your sleeve was wet.'))
  g.face('flint', 'player')
  await g.narrate(l('Bubienok sa zastavil pod dlaňou. Flint zdvihol hlavu a usmial sa tým svojím úsmevom, ktorý mal pripravený na veriteľov, na ženy a na strážnikov a ktorý na každého z nich fungoval z inej strany.', 'The cylinder stopped under his palm. Flint looked up and smiled that smile of his, the one he kept ready for creditors, women and watchmen, and which worked on each of them from a different side.'))
  await g.say('flint', l('Braček. Pršalo.', 'Brother. It was raining.'), { mood: 'happy' })
  await g.narrate(l('Nepršalo. Arkot tú noc rátal hviezdy nad prístavom a nebolo tam nič, čo by ich zakrylo. Flint to mal v tvári napísané tiež. Ani jeden to nečítal nahlas.', 'It had not rained. Arkot had counted the stars over the harbour that night and there had been nothing to cover them. Flint had it written on his face as well. Neither of them read it aloud.'))
  g.sfx('click', 0.4)
  await g.narrate(l('Dole na južnej hrane klapali západky.', 'Down on the southern edge the latches clacked.'))
  const c = await g.choose([
    { id: 'press', text: l('„Nepršalo, Flint.“', '“It didn’t rain, Flint.”') },
    { id: 'let', text: l('„Dobre.“', '“All right.”') },
  ])
  if (c === 'press') {
    g.set('ch01.pressedFlint', true)
    g.rel('flint', -1)
    await g.narrate(l('Úsmev na Flintovej tvári ostal. Oči z neho odišli.', 'The smile stayed on Flint’s face. His eyes left it.'))
    await g.say('flint', l('Niektoré noci nechávam v Diss, braček. Aj ty by si mal.', 'Some nights I leave in Diss, brother. So should you.'), { mood: 'closed' })
    g.sfx('tick')
    await g.narrate(l('Bubienok zapadol na miesto s cvaknutím, ktoré znelo ako zatvorené dvere. Odpoveď to nebola. Bolo to horšie: vec, ktorú bude musieť niekam odložiť a nosiť ju so sebou.', 'The cylinder clicked into place with a sound like a door closing. It was not an answer. It was worse: a thing he would have to put away somewhere and carry with him.'))
  } else {
    g.set('ch01.pressedFlint', false)
    g.rel('flint', 1)
    await g.narrate(l('Bol to najlepší priateľ, akého mal, a jediná tvár, ktorú v tomto meste poznal. Keby teraz naliehal, dostal by odpoveď, ktorú by potom musel niekam odložiť a nosiť ju so sebou.', 'He was the best friend he had ever had, and the only face he knew in this city. If he pushed now, he would get an answer he would then have to put away somewhere and carry with him.'))
    await g.narrate(l('Povedal si, že sa spýta neskôr, keď budú mať prácu a strechu a keď to nebude znieť ako obvinenie. Bola to presne tá istá veta, ktorou si od Diss zdôvodňoval, prečo sa nevrátil hore po schodoch a nezavrel matke tie dvere sám.', 'He told himself he would ask later, when they had work and a roof and it would not sound like an accusation. It was exactly the same sentence with which, ever since Diss, he had explained to himself why he had not gone back up the stairs and closed that door on his mother himself.'))
  }
  g.pose('flint', 'stand')
  g.teleport('flint', [9, 19], 45)
  await g.narrate(l('Flint si zastrčil revolver za pás a naťahol sa, až mu chrbtica zapraskala.', 'Flint tucked the revolver into his belt and stretched until his spine cracked.'))
  g.face('flint', [9, 22])
  await g.say('flint', l('Vidíš? Obilie. Vrecia. To je práca, čo nepotrebuje odporúčanie, len chrbát.', 'See? Grain. Sacks. Work that needs no reference, just a back.'), { mood: 'happy' })
  await g.say('flint', l('Hovoril som ti, že tu bude šťastie.', 'I told you there’d be luck here.'), { mood: 'happy' })
  g.pose('player', 'stand')
  g.teleport('player', [10, 19], 135)
  void g.walk('flint', [15, 22])
  g.set('c1.sleeve')
  g.follow()
  await g.zoom(1, 600)
  g.cinematic(false)
  g.objective(l('Zaraď sa do radu k predákovi a zdvihni ruku.', 'Get in the foreman’s line and raise your hand.'))
  g.checkpoint()
}

async function finale(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.walk('player', [14, 22])
  g.face('player', 'foreman')
  g.bark('foreman', l('Obilie! Chrbty, čo unesú vrece!', 'Grain! Backs that can carry a sack!'), 3000)
  await g.focus([20, 25], { ms: 1500, zoom: 0.9 })
  await g.narrate(l('Pod nimi sa otvorilo ďalšie hrdlo. Kolesá v kanáloch, hriadele po múroch, remene, vahadlá na západnom svahu, hore a dolu.', 'Below them another throat opened. Wheels in the canals, shafts along the walls, belts, the sweeps on the western slope, up and down.'))
  await g.narrate(l('Celé Nyau naraz, mesto, ktoré si vodu najprv pustí dnu a potom ju prinúti pracovať, kým mu ju more zase nevezme.', 'All of Nyau at once, a city that first lets the water in and then makes it work, until the sea takes it back again.'))
  await g.focus('player', { ms: 1200, zoom: 1.2 })
  g.sfx('bell', 0.8)
  await g.wait(1300)
  g.sfx('bell', 0.8)
  await g.narrate(l('Z chrámu na vrchu sa ozvali zvony. Rátal údery, lebo rátal všetko.', 'Bells rang from the temple on the hill. He counted the strokes, because he counted everything.'))
  g.sfx('bell', 0.8)
  await g.wait(1300)
  g.sfx('bell', 0.8)
  await g.narrate(l('Mesto rátalo s ním.', 'The city counted with him.'))
  g.pose('player', 'point')
  g.mood('player', 'determined')
  await g.narrate(l('Šiel do radu k predákovi a zdvihol ruku.', 'He stepped into the foreman’s line and raised his hand.'))
  g.codex('world.aerodock')
  await g.wait(1200)
  await g.fade('black', 2200)
  g.cinematic(false)
  await g.endChapter()
}

export const aerodock: SceneDef = {
  id: 'c1_aerodock',
  name: l('Aerodok', 'The Aerodock'),
  ambience: morning,
  map: {
    rows: [
      '                                ',
      '##DDDDDDDDDD.....DDDDDDDDDDDDDDD',
      '##DDDDDDDDDD.....DDDDDDDDDDDDDDD',
      '##DDDDDDDDDD.....DDDDDDDDDDDDDDD',
      '##DDDDDDDDDD.....DDDDDDDDDDDDDDD',
      '##DDDDDDDDDD.....DDDDDDDDDDD.SS.',
      '##DDDDDDDDDD.....DDDDDDDDDDD....',
      '##......SSS.........SSS.........',
      '##...........,,,,,,,,,,,........',
      '##...........,,,,,,,,,,,........',
      '##...........,,,,,,,,,,,........',
      '##..............................',
      '##...:........:.................',
      '##....:.........................',
      '##..............:........OOOO...',
      '##.....:.................OOOO...',
      '##......:.........:.............',
      '##..............................',
      '##.......:..........:...........',
      '##........:.....................',
      '##.........:..........:.........',
      '##WWWWWW........................',
      '##WWWWWW........................',
      '##WWWWWW........................',
      'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
      'ccccccccccccc=cccccccccccccccccc',
      'ccccccccccccc=cccccccccccccccccc',
      'ccccccccccccc=cccccccccccccccccc',
    ],
    legend: {
      '#': { floor: 'stone', wall: 'brick', wallH: 3.4 },
      D: { floor: 'deck', h: 2, side: 'plank' },
      S: { floor: 'wood', h: 1, stairs: true, side: 'plank' },
      '.': { floor: 'cobble', tint: '#e2d6c0' },
      ':': { floor: 'cobble', tint: '#c8baa0' },
      ',': { floor: 'wood', tint: '#d8b890' },
      W: { floor: 'stone', wall: 'white', wallH: 3.2 },
      O: { floor: 'stone', wall: 'white', wallH: 2.2 },
      q: { floor: 'stone', tint: '#c8c0b0' },
      c: { floor: 'canal' },
      '=': { floor: 'canal', walk: true, prop: 'bridge' },
    },
  },
  props: [
    // the platforms, airships and towers
    { type: 'airship', at: [6, 3] },
    { type: 'airship', at: [22, 3], color: '#c8d0d8' },
    { type: 'c1_mooring_tower', at: [10, 2], params: { h: 6.5 } },
    { type: 'c1_mooring_tower', at: [26, 1], params: { h: 6.5 } },
    { type: 'c1_mooring_tower', at: [30, 2], params: { h: 5 } },
    { type: 'c1_winch', at: [3, 6] },
    { type: 'c1_winch', at: [18, 6] },
    { type: 'barrel', at: [10, 5] },
    { type: 'barrel', at: [11, 5] },
    { type: 'barrel', at: [3, 2] },
    { type: 'rope_coil', at: [9, 1] },
    { type: 'rope_coil', at: [25, 5] },
    { type: 'crate', at: [19, 1], params: { stack: 2 } },
    { type: 'crate', at: [27, 6] },
    { type: 'sack', at: [28, 2], params: { count: 3 } },
    { type: 'banner', at: [7, 7], color: '#2f6fa0', params: { emblem: 'moon' } },
    { type: 'banner', at: [11, 7], color: '#2f6fa0', params: { emblem: 'moon' } },
    { type: 'banner', at: [19, 7], color: '#2f6fa0', params: { emblem: 'moon' } },
    { type: 'banner', at: [23, 7], color: '#2f6fa0', params: { emblem: 'moon' } },
    // the scales
    { type: 'c1_scale', at: SCALES },
    { type: 'sack', at: [6, 9], params: { count: 3 } },
    { type: 'sack', at: [5, 10], params: { count: 2 } },
    { type: 'crate', at: [4, 9], params: { stack: 3 } },
    { type: 'crate', at: [3, 11], params: { stack: 2 } },
    { type: 'basket', at: [8, 9], params: { fill: 'fruit' } },
    // lantern workshop for Tōr
    { type: 'workbench', at: [15, 8] },
    { type: 'workbench', at: [19, 8] },
    { type: 'c1_lantern_frames', at: [14, 9], params: { kind: 0 } },
    { type: 'c1_lantern_frames', at: [17, 9], params: { kind: 1 } },
    { type: 'c1_lantern_frames', at: [21, 9], params: { kind: 1 } },
    { type: 'c1_lantern_frames', at: [22, 10], params: { kind: 0 } },
    { type: 'c1_lantern_frames', at: [16, 10], rot: 30, params: { kind: 2 } },
    { type: 'c1_lantern_frames', at: [20, 10], rot: -20, params: { kind: 2 } },
    { type: 'cart', at: [24, 9], rot: 90, params: { load: false } },
    { type: 'c1_lantern_frames', at: [24, 9], y: 0.5, rot: 90, params: { kind: 2 } },
    { type: 'paper_lantern', at: [18, 10], color: '#f0a050' },
    // stalls and stacks in the yard
    { type: 'stall', at: [17, 13], params: { goods: 'fruit' } },
    { type: 'stall', at: [21, 13], color: '#2fa69a', params: { goods: 'cloth' } },
    { type: 'awning', at: [26, 16], rot: 180, color: '#2f6fa0', params: { w: 2 } },
    { type: 'door', at: [27, 16], rot: 180, params: { style: 'white' } },
    { type: 'window', at: [25, 16], rot: 180, params: { style: 'white', lit: false, shutters: true } },
    { type: 'banner', at: [29, 15], color: '#2f6fa0', params: { emblem: 'star' } },
    { type: 'crate', at: [29, 9], params: { stack: 3 } },
    { type: 'crate', at: [30, 9], params: { stack: 2 } },
    { type: 'crate', at: [29, 10], params: { stack: 1 } },
    { type: 'sack', at: [30, 12], params: { count: 3 } },
    { type: 'sack', at: [28, 19], params: { count: 2 } },
    { type: 'barrel', at: [23, 18] },
    { type: 'barrel', at: [24, 18], params: { lying: true } },
    { type: 'cart', at: [14, 16], params: { load: true } },
    { type: 'crate', at: [3, 16], params: { stack: 2 } },
    { type: 'crate', at: [3, 17], params: { stack: 1 } },
    { type: 'sack', at: [4, 18], params: { count: 2 } },
    // grain warehouse, foreman, the line
    { type: 'door', at: [8, 22], rot: 90, params: { style: 'white' } },
    { type: 'window', at: [8, 21], rot: 90, params: { style: 'white', lit: false } },
    { type: 'awning', at: [8, 23], rot: 90, color: '#c8a050', params: { w: 1 } },
    { type: 'sack', at: [9, 23], params: { count: 3 } },
    { type: 'sack', at: [3, 20], params: { count: 3 } },
    { type: 'sack', at: [6, 20], params: { count: 2 } },
    { type: 'crate', at: [9, 20] },
    { type: 'sack', at: [10, 20], color: '#bfa070', params: { count: 1 } },
    // quay, canal, wheel and sluice
    { type: 'waterwheel', at: [20, 26] },
    { type: 'sluice', at: [27, 26], params: { open: true } },
    { type: 'dock_post', at: [6, 24] },
    { type: 'dock_post', at: [17, 24] },
    { type: 'dock_post', at: [24, 24] },
    { type: 'dock_post', at: [30, 24] },
    { type: 'lily', at: [4, 26] },
    { type: 'lily', at: [9, 27] },
    { type: 'lily', at: [24, 26] },
    { type: 'rope_coil', at: [15, 24] },
    { type: 'pipe', at: [21, 24], params: { vertical: true } },
    { type: 'flowers', at: [2, 24], color: '#ff9ac8' },
    { type: 'flowers', at: [31, 23], color: '#ffd24a' },
  ],
  player: { character: 'arkot', at: [9, 5], facing: 45 },
  actors: [
    { id: 'flint', character: 'flint', at: [8, 5], facing: 45 },
    { id: 'loader', character: 'loader', at: [10, 6], facing: 225 },
    {
      id: 'dama',
      character: 'dama',
      at: [8, 2],
      facing: 315,
      talk: async (g) => {
        await g.narrate(l('Dama od váhy nezdvihla hlavu. Zapisovala už ďalší náklad, meno a číslo, jedno pod druhé.', 'The scale-woman did not look up. She was already entering the next cargo, name and number, one under the other.'))
        await g.say('dama', l('Ďalší.', 'Next.'))
      },
    },
    { id: 'dockwoman', character: 'c1_dockwoman', at: [8, 11], facing: 315, pose: 'point' },
    { id: 'porter', character: 'c1_porter', at: [12, 14], facing: 270 },
    { id: 'girl1', character: 'c1_bluescarf1', at: [9, 17], facing: 45 },
    { id: 'girl2', character: 'c1_bluescarf2', at: [10, 17], facing: 225 },
    {
      id: 'foreman',
      character: 'c1_foreman',
      at: [9, 21],
      facing: 45,
      pose: 'point',
      talk: async (g) => {
        await g.say('foreman', l('Chceš robotu, postav sa do radu. Mená vyvolávam ja, nie ty.', 'You want work, get in line. I call the names, not you.'))
      },
    },
    { id: 'q1', character: 'c1_docker0', at: [10, 22], facing: 225 },
    { id: 'q2', character: 'c1_docker1', at: [11, 22], facing: 225 },
    { id: 'q3', character: 'c1_docker2', at: [12, 22], facing: 225 },
    { id: 'q4', character: 'c1_docker3', at: [13, 22], facing: 225 },
    { id: 'w1', character: 'c1_docker4', at: [15, 9], facing: 0, pose: 'crouch' },
    { id: 'w2', character: 'c1_docker5', at: [18, 9], facing: 90, pose: 'crouch' },
    {
      id: 'w3',
      character: 'c1_townsfolk0',
      at: [21, 10],
      facing: 180,
      pose: 'crouch',
      talk: async (g) => {
        await g.say('w3', l('Hodváb príde zajtra. Dnes len kostry. Tisíc kostier, a každá musí vydržať nad mestom až k hviezdam.', 'The silk comes tomorrow. Today just the frames. A thousand frames, and every one has to last over the city all the way to the stars.'))
        g.codex('cal.tor')
      },
    },
    {
      id: 'seller',
      character: 'c1_townsfolk1',
      at: [18, 14],
      facing: 315,
      talk: async (g) => {
        await g.say('seller', l('Nočné ovocie, pane? Zrelé, až sa samo pýta do úst.', 'Night fruit, sir? So ripe it begs to be eaten.'))
        await g.narrate(l('Pane. Arkot sa obzrel, komu to hovorí. Nikto iný tam nebol.', 'Sir. Arkot looked round to see who she meant. There was nobody else there.'))
      },
    },
    { id: 'clerk', character: 'c1_townsfolk2', at: [26, 17], facing: 0 },
    { id: 'crew1', character: 'c1_docker1', at: [24, 5], facing: 225 },
    { id: 'walker1', character: 'c1_townsfolk3', at: [16, 18], facing: 45 },
    {
      id: 'walker2',
      character: 'c1_docker2',
      at: [25, 11],
      facing: 135,
      talk: async (g) => {
        await g.say('walker2', l('Kark, z cesty! A ty si nový? Predák berie chrbty pri obilí, dolu pri kanáli.', 'Kark, out of the way! You new? The foreman takes on backs by the grain, down by the canal.'))
        g.codex('gloss.kark')
      },
    },
    { id: 'carrier', character: 'c1_docker3', at: [29, 12], facing: 225 },
  ],
  interactables: [
    {
      id: 'frames',
      at: [17, 10],
      label: l('Kostry lampiónov', 'Lantern frames'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Na plošinách skladali z vozov drevené prúty a zväzovali ich do krížov. Zatiaľ to boli len tenké, do kríža previazané prúty, ktoré čakali na hodváb a na noc.', 'On the platforms they were unloading wooden rods from carts and lashing them into crosses. For now they were only thin rods tied crosswise, waiting for silk and for the night.'))
        await g.say('player', l('V tú noc bude pri niektorej z veží stáť každá vzducholoď, ktorú sviatok zastihne v Nyau.', 'That night every airship the festival catches in Nyau will be standing at one of these towers.'), { thought: true })
        g.codex('cal.tor')
      },
    },
    {
      id: 'stall',
      at: [18, 13],
      label: l('Stánok s ovocím', 'The fruit stall'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Horúci kameň, prezreté ovocie, kvety, ktoré v Diss nerástli, a pod tým etanol, olej a surové drevo. Vzduch tu zhustol a osladol a lepil sa na kožu.', 'Hot stone, overripe fruit, flowers that never grew in Diss, and beneath it all ethanol, oil and raw timber. The air thickened and sweetened here and clung to the skin.'))
      },
    },
    {
      id: 'wheel',
      at: [20, 24],
      label: l('Koleso v kanáli', 'The wheel in the canal'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('V kanáli pod múrom sa točilo koleso a mesto z toho mlelo múku, drvilo korenie a dýchalo. Z kolesa bežal hriadeľ po múre kanála až kamsi pod sýpky.', 'In the canal under the wall a wheel turned, and from it the city ground flour, crushed spices and breathed. From the wheel a shaft ran along the canal wall to somewhere under the granaries.'))
        await g.say('player', l('Bez ohňa. Bez kotla. Len voda, ktorú more vrátilo a Sai poslala dolu.', 'No fire. No boiler. Only water the sea gave back and Sai sent down.'), { thought: true })
        g.codex('world.nyau_sluices')
      },
    },
    {
      id: 'board',
      at: [28, 16],
      label: l('Tabuľa aerodoku', 'The aerodock notice board'),
      verb: 'read',
      run: async (g) => {
        await g.read(
          l('Vyhláška aerodoku Nyau', 'Notice of the Nyau Aerodock'),
          l(
            'Počas sviatku Tōr sa nelieta.\n\nVšetky stroje zostanú priviazané pri vežiach od západu slnka do svitania. Obaly vypustiť do polovice. Oheň v dokoch zakázaný.\n\nKto vzlietne nad mesto plné horiacich papierov, nech si najprv spíše závet.\n\n*Správa aerodoku, z poverenia Chrámu El*',
            'There is no flying during the festival of Tōr.\n\nAll craft shall remain moored at the towers from sundown to dawn. Envelopes to be vented to half. Fire on the docks is forbidden.\n\nWhoever takes off over a city full of burning paper had better write his will first.\n\n*The Aerodock Authority, by mandate of the Temple of El*',
          ),
          { style: 'letter' },
        )
        g.codex('world.aerodock')
      },
    },
    {
      id: 'sit',
      at: [10, 20],
      label: l('Sadnúť si vedľa Flinta', 'Sit down next to Flint'),
      verb: 'use',
      when: (g) => !!g.flag('c1.realised') && !g.flag('c1.sleeve'),
      run: async (g) => {
        await wetSleeve(g)
      },
    },
    {
      id: 'line',
      at: [14, 22],
      label: l('Zaradiť sa do radu', 'Get in line'),
      verb: 'use',
      when: (g) => !!g.flag('c1.sleeve'),
      run: async (g) => {
        await finale(g)
      },
    },
  ],
  triggers: [
    {
      id: 'scales',
      area: [2, 9, 13, 11],
      when: (g) => !g.flag('c1.t1'),
      run: async (g) => {
        g.set('c1.t1')
        g.cinematic(true)
        g.face('player', 'dockwoman')
        await g.focus([8, 11], { ms: 700, zoom: 1.3 })
        await g.narrate(l('Prvú z nich stretol pri váhach. Bola to dokárka, staršia, s predlaktiami hrubšími, než mal on, a v ruke držala kriedu a zoznam.', 'He met the first of them at the scales. A dock woman, older, with forearms thicker than his, holding chalk and a list.'))
        g.pose('player', 'slump')
        await g.narrate(l('Arkot urobil to, čo robil v Diss celý život: uhol sa jej z cesty, spustil bradu a počkal, kým prejde. Telo to spravilo samo, skôr než ho stihol zastaviť.', 'Arkot did what he had done all his life in Diss: he stepped out of her way, lowered his chin and waited for her to pass. His body did it by itself, before he could stop it.'))
        await g.narrate(l('V Diss muž pri váhach nestojí. V Diss muž nosí, žena váži a hovorí, a kto to poplietol, ten to poplietol raz.', 'In Diss a man does not stand at the scales. In Diss the man carries, the woman weighs and speaks, and whoever mixes that up does it only once.'))
        g.pose('dockwoman', 'stand')
        g.face('dockwoman', 'player')
        await g.wait(500)
        await g.narrate(l('Dokárka zdvihla hlavu.', 'The dock woman raised her head.'))
        g.mood('dockwoman', 'closed')
        g.pose('dockwoman', 'slump')
        await g.narrate(l('A sklopila oči.', 'And lowered her eyes.'))
        g.mood('player', 'surprised')
        g.emote('player', '?')
        await g.walk('dockwoman', [9, 12])
        g.face('dockwoman', 'player')
        await g.narrate(l('Ustúpila o pol kroka nabok, urobila rukou pohyb, ktorý bol takmer poklona a nebol dokončený, a čakala, kým prejde on.', 'She stepped half a pace aside, made a movement of the hand that was almost a bow and was never finished, and waited for him to pass.'))
        g.pose('player', 'stand')
        await g.walk('player', [7, 12])
        await g.narrate(l('Prešiel. Nič iné mu nenapadlo.', 'He passed. Nothing else occurred to him.'))
        g.mood('player', 'neutral')
        g.pose('dockwoman', 'point')
        g.follow()
        await g.zoom(1, 500)
        g.cinematic(false)
      },
    },
    {
      id: 'porter',
      area: [2, 13, 13, 15],
      when: (g) => !!g.flag('c1.t1') && !g.flag('c1.t2'),
      run: async (g) => {
        g.set('c1.t2')
        g.face('porter', 'player')
        g.pose('porter', 'slump')
        g.emote('porter', '…')
        await g.narrate(l('O tridsať krokov ďalej sa to zopakovalo. Nosička s košom zastala, uhla pohľadom a nechala ho prejsť prvého.', 'Thirty paces on it happened again. A porter with a basket stopped, looked aside and let him pass first.'))
        await g.wait(600)
        g.pose('porter', 'stand')
        void g.walk('porter', [3, 14])
      },
    },
    {
      id: 'girls',
      area: [2, 16, 14, 18],
      when: (g) => !!g.flag('c1.t1') && !g.flag('c1.t3'),
      run: async (g) => {
        g.set('c1.t3')
        g.face('girl1', 'player')
        g.face('girl2', 'player')
        await g.wait(300)
        g.bark('girl1', l('Klanový syn? V takých topánkach?', 'A clan son? In those shoes?'), 2600)
        await g.wait(900)
        g.face('girl1', 90)
        g.face('girl2', 270)
        g.mood('girl2', 'happy')
        await g.narrate(l('Dve mladé v modrých šatkách si medzi sebou čosi povedali a obe naraz pozreli inam. Nebolo v tom ani kúska strachu. Bolo to plynulé a nacvičené, samozrejmé tak, ako keď sa v Diss uhýbal on.', 'Two young women in blue scarves said something to each other and both looked away at once. There was not a scrap of fear in it. It was smooth and practised, as natural as his own stepping aside in Diss.'))
      },
    },
    {
      id: 'corner',
      area: [2, 19, 14, 20],
      when: (g) => !g.flag('c1.realised'),
      run: async (g) => {
        await realisation(g)
      },
    },
  ],
  onUpdate: (g, dt) => {
    updateWanderers(g, crowd, dt)
  },
  onEnter: async (g) => {
    resetWanderers(crowd)
    if (g.flag('c1.sleeve')) {
      g.teleport('flint', [15, 22], 225)
      g.objective(l('Zaraď sa do radu k predákovi a zdvihni ruku.', 'Get in the foreman’s line and raise your hand.'))
      return
    }
    if (g.flag('once.c1.dockIntro')) {
      g.teleport('flint', [9, 20], 45)
      g.pose('flint', 'sit')
      g.show('loader', false)
      return
    }
    await g.once('c1.dockIntro', async () => {
      g.cinematic(true)
      await g.focus([14, 9], { ms: 10, zoom: 0.85 })
      await g.wait(600)
      await g.narrate(l('Klesanie vrátilo svetu pach. Najprv soľ, ako doma, a potom všetko, čo doma nebolo: horúci kameň, prezreté ovocie, kvety, ktoré v Diss nerástli, a pod tým etanol, olej a surové drevo.', 'The descent gave the world back its smell. Salt first, as at home, and then everything home did not have: hot stone, overripe fruit, flowers that never grew in Diss, and beneath it all ethanol, oil and raw timber.'))
      await g.narrate(l('A zvuk: výkriky predavačov roztrhané vetrom, trúby z vyhliadok aerodoku, vresk navijakov, nadávky s desiatimi prízvukmi naraz, a ani jeden z nich nebol ten ich.', 'And sound: hawkers’ cries torn apart by the wind, trumpets from the aerodock lookouts, the shriek of winches, curses in ten accents at once, and not one of them theirs.'))
      await g.narrate(l('Aerodok ležal celkom dole na juhovýchode, na dohodenie od pobrežia, a bol väčší než celé Diss. Na plošinách pod nimi skladali z vozov drevené prúty a zväzovali ich do krížov.', 'The aerodock lay all the way down in the south-east, a stone’s throw from the shore, and it was bigger than all of Diss. On the platforms below them they were unloading wooden rods from carts and lashing them into crosses.'))
      await g.focus([9, 5], { ms: 1200, zoom: 1.2 })
      g.face('loader', 'player')
      await g.say('loader', l('Kostry. Lampióny. O pár dní je Tōr. Máte šťastie, že ste to stihli.', 'Frames. Lanterns. Tōr is in a few days. You’re lucky you made it.'))
      await g.say('loader', l('Cez festival sa nelieta. Tisíc horiacich papierov nad mestom a pod tebou plyn, to je krátky rozhovor.', 'Nothing flies during the festival. A thousand burning papers over the city and gas under you, that’s a short conversation.'))
      g.codex('cal.tor')
      await g.narrate(l('Arkot sa obzrel po radoch veží. V tú noc teda bude pri niektorej z nich stáť každá vzducholoď, ktorú sviatok zastihne v Nyau.', 'Arkot looked along the rows of towers. That night, then, every airship the festival caught in Nyau would be standing at one of them.'))
      await g.say('flint', l('Šťastie máme vždy, dedko.', 'We’re always lucky, grandpa.'), { mood: 'happy' })
      g.face('flint', 'loader')
      await g.narrate(l('Nakladač mu na to bez slova vrátil do dlane náboje.', 'Without a word the loader tipped the cartridges back into his palm.'))
      g.sfx('tick')
      await g.wait(200)
      g.sfx('tick')
      g.face('flint', [9, 8])
      await g.narrate(l('Flint zoskočil na plošinu prv, než poriadne dosadli, tak, ako skákal prvý, odkedy mali obaja po dve zimy. Arkot šiel za ním, ako chodil vždy.', 'Flint jumped down onto the platform before they had properly settled, the way he had always jumped first since they were both two winters old. Arkot followed him, as he always had.'))
      void g.walk('flint', [9, 20], { speed: 3.2 }).then(() => {
        g.face('flint', 45)
        g.pose('flint', 'sit')
      })
      await g.focus('dama', { ms: 900, zoom: 1.3 })
      await g.narrate(l('Dama od váhy za nimi nepozrela. Zapisovala už ďalší náklad.', 'The scale-woman did not look after them. She was already entering the next cargo.'))
      void g.walk('loader', [4, 4]).then(() => g.show('loader', false))
      await g.focus('player', { ms: 800, zoom: 1 })
      g.follow()
      g.cinematic(false)
      g.objective(l('Nájdi Flinta pri skladoch obilia.', 'Find Flint by the grain warehouses.'))
    })
  },
}
