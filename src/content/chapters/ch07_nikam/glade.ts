/**
 * c7_glade — Yera. The Itaka over the treetops and the cannon "Felix"; the
 * pirates scatter; Tami and the old veterans; the ramp; the last pirate's
 * shot and Flint's body in its way; Tami's golden rune shield; "Because I
 * love you"; the bullet drawn out with Water Spira.
 */
import type { AmbienceDef, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { GLADE_MAP } from './maps'
import { place } from './util'

const GLADE: AmbienceDef = {
  sky: { top: '#03050c', bottom: '#141c30', stars: 1, sai: { x: 0.8, y: 0.86, r: 0.055 } },
  fog: { color: '#070b16', near: 8, far: 30 },
  hemi: { sky: '#4a5a90', ground: '#0e0c14', intensity: 0.9 },
  sun: { color: '#9ab0ff', intensity: 1.1, dir: [-0.45, 1, 0.55] },
  exposure: 1.05,
  bloom: { strength: 1.0, radius: 0.6, threshold: 0.76 },
  grade: { tint: '#dce2ff', saturation: 0.84, contrast: 1.08, vignette: 0.5 },
  particles: [
    { kind: 'motes', count: 50, color: '#c0d0ff' },
    { kind: 'fireflies', count: 18, area: [3, 3, 20, 17], color: '#c8ff9a' },
  ],
  music: 'combat_epic_2',
  sounds: ['night', 'wind', 'forest'],
}

const BOARDERS = ['dara', 'load1', 'load2', 'mech', 'yori']
const RAMP_TOP: Vec2 = [14, 9]
const RAMP_FOOT: Vec2 = [16, 9]

async function felix(g: GameAPI, at: Vec2, crater: string, strength: number): Promise<void> {
  g.sfx('whoosh', 0.8)
  await g.wait(250)
  g.flash('#c58cff', 500)
  g.sfx('boom', strength)
  g.fx('shockwave', at, { color: '#b77dff', scale: 7 })
  g.fx('dust', at)
  g.fx('lightning', at, { color: '#e0c8ff' })
  g.shake(0.75 * strength, 1100)
  g.propVisible(crater, true)
}

async function landing(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.wait(300)
  await g.focus([12, 20], { ms: 10, zoom: 1.2 })
  await g.narrate(l('Osem tieňov uháňalo cez nočný les plný koreňov, kameňov a konárov. Mechanik kašľal, chlapec plakal a Dara bežala s jedným uchom a zaťatými zubami.', 'Eight shadows tore through the night forest, through roots, stones and branches. The mechanic coughed, the boy wept, and Dara ran with her one ear and her teeth clenched.'))
  g.face('flint', 'player')
  g.mood('flint', 'happy')
  await g.narrate(l('Flint bežal posledný s prázdnym revolverom v ruke, ktorý by v tej chvíli neodstrelil ani papierový lampión. A usmieval sa.', 'Flint ran last, an empty revolver in his hand that could not have shot down a paper lantern. And he was smiling.'))
  await g.say('arkot', l('Jedného dňa ťa to zabije.', 'One day it will kill you.'), { thought: true, mood: 'sad' })
  await g.focus([12, 9], { ms: 1600, zoom: 0.9 })
  await g.narrate(l('Itaka sa vynorila nad korunami stromov. Krúžila pomaly a presne, tmavá silueta proti hviezdam, a parný pohon ju niesol bez zvuku.', 'The Itaka rose above the treetops. She circled slowly and precisely, a dark silhouette against the stars, her steam drive carrying her without a sound.'))
  await g.narrate(l('A na palube bol Saburo, starý lišiak pri kanóne, ktorý nemal na tomto svete čo hľadať.', 'And on deck was Saburo, the old dog-fox at the cannon, who had no business being anywhere in this world.'))
  g.codex('world.itaka')
  await g.focus([12, 22], { ms: 900, zoom: 1.05 })
  for (const id of ['ch1', 'ch2', 'ch3']) g.face(id, 'player')
  g.bark('ch2', l('Tam sú! Za nimi!', 'There they are! After them!'))
  await g.wait(600)
  await felix(g, [10, 22], 'crater1', 1)
  await g.narrate(l('Prvý výstrel z Felixa pretrhol noc. Zvuk, čo nepatril do tohto lesa ani do tohto storočia, akoby niekto udrel do zvona veľkého ako hora.', 'The first shot from Felix tore the night apart. A sound that belonged neither to this forest nor to this century, as if someone had struck a bell the size of a mountain.'))
  await g.narrate(l('Nad korunami sa rozžiaril fialový záblesk. Nebol to oheň. Zem sa zdvihla v stĺpe blata, koreňov a kameňa. Celý les na úder srdca stíchol.', 'A violet flash blazed above the treetops. It was not fire. The ground rose in a pillar of mud, roots and stone. For one heartbeat the whole forest went silent.'))
  await felix(g, [13, 21], 'crater2', 0.8)
  for (const id of ['ch1', 'ch2', 'ch3']) {
    g.emote(id, '!')
    void g.walk(id, [11 + Math.floor(Math.random() * 3), 23], { run: true, speed: 4.4 })
  }
  g.bark('ch1', l('Démon! To je démon z neba!', 'A demon! A demon from the sky!'))
  await g.narrate(l('Piráti sa s krikom rozutekali. Primitívny, zvierací strach o prežitie vymazal pomstu aj rozkazy.', 'The pirates scattered, screaming. A primitive, animal fear for their lives wiped out revenge and orders alike.'))
  await g.wait(500)
  for (const id of ['ch1', 'ch2', 'ch3']) g.despawn(id)
  g.music(null, 1500)
  await g.narrate(l('Bolo po všetkom.', 'It was over.'))
  // Tami and the veterans come out of the forest
  for (const id of ['tami', 'kiri', 'toru']) g.show(id, true)
  void g.walk('kiri', [19, 14])
  void g.walk('toru', [19, 10])
  await g.walk('tami', [17, 12], { speed: 3 })
  g.face('tami', 'player')
  await g.focus('tami', { ms: 700, zoom: 1.3 })
  await g.narrate(l('Z lesa vyšlo dievča s medenými vlasmi a dvoma starými mužmi po bokoch, s karabínami na ramenách. V každej ruke pištoľ, automatickú, krátku a opotrebovanú.', 'Out of the forest came a girl with copper hair and two old men at her sides, carbines on their shoulders. A pistol in each hand, automatic, short and worn.'))
  await g.say('tami', l('HORE! Na palubu! Všetci!', 'UP! Aboard! Everyone!'), { mood: 'determined' })
  // the Itaka comes down to the glade
  g.sfx('whoosh')
  g.fx('dust', [12, 10])
  g.fx('shockwave', [12, 9], { color: '#c8d8ff', scale: 4 })
  g.propVisible('itakaAir', false)
  g.propVisible('itakaGround', true)
  g.propVisible('ramp', true)
  g.shake(0.2, 600)
  await g.focus([14, 10], { ms: 800, zoom: 1.05 })
  await g.narrate(l('Rampa bola spustená a laná kotvené o stromy. Dara bežala prvá; líška s jedným uchom vybehla hore rampou do trupu. Veteráni kryli ostatných, jeden druhého.', 'The ramp came down and the lines were tied off to the trees. Dara ran first; the fox with one ear sprinted up the ramp into the hull. The veterans covered the others, each covering the other.'))
  BOARDERS.forEach((id, i) => {
    void (async () => {
      await g.wait(i * 450)
      await g.walk(id, RAMP_FOOT, { run: true, speed: 3.8 })
      await g.walk(id, RAMP_TOP, { speed: 2.4 })
      g.show(id, false)
    })()
  })
  await g.wait(900)
  g.set('c7g.stage', 'board')
  g.companion('arkot', true)
  g.companion('flint', true)
  g.follow()
  g.music('combat_epic_1', 1200)
  g.cinematic(false)
  g.objective(l('Na palubu.', 'Aboard.'))
  g.checkpoint()
}

async function theShot(g: GameAPI): Promise<void> {
  g.set('c7g.stage', 'shot')
  g.cinematic(true)
  g.objective(null)
  g.companion('arkot', false)
  g.companion('flint', false)
  g.face('player', RAMP_TOP)
  await g.narrate(l('Yera sa zastavila pri rampe. Dýchala zhlboka a kontrolovane a oči jej ešte žiarili, no kolená sa jej triasli.', 'Yera stopped at the ramp. She breathed deep and controlled and her eyes still shone, but her knees were shaking.'))
  place(g, 'arkot', [15, 10], 'player', 'stand')
  g.pose('arkot', 'point')
  await g.narrate(l('Arkot zastal vedľa nej a inštinktívne natiahol ruku, keby náhodou potrebovala pomoc.', 'Arkot stopped beside her and instinctively held out his hand, in case she needed it.'))
  g.face('player', 'arkot')
  await g.say('player', l('Hore.', 'Up.'), { mood: 'closed' })
  g.pose('arkot', 'stand')
  await g.narrate(l('Arkot stiahol ruku.', 'Arkot withdrew his hand.'))
  await g.walk('arkot', [15, 9])
  g.face('arkot', [18, 12])
  // Tami runs to Yera, the last pirate fires
  void g.walk('tami', [17, 11], { run: true })
  place(g, 'flint', [16, 13], 'tami', 'stand')
  g.show('shooter', true)
  g.face('shooter', 'tami')
  g.pose('shooter', 'point')
  await g.focus([19, 13], { ms: 600, zoom: 1.25 })
  await g.narrate(l('Spoza stromu, pätnásť krokov od rampy: pirát. Posledný, čo neutiekol, alebo posledný, čo sa vrátil. Karabína pri líci. Mieril na Tami.', 'From behind a tree, fifteen steps from the ramp: a pirate. The last one who hadn’t fled, or the last one who had come back. A carbine at his cheek. He was aiming at Tami.'))
  g.music(null, 300)
  await g.walk('flint', [18, 12], { run: true, speed: 5.5 })
  g.face('flint', 'shooter')
  g.sfx('shot')
  g.flash('#fff2d0', 250)
  g.shake(0.25, 300)
  g.pose('flint', 'lie')
  g.mood('flint', 'pain')
  await g.narrate(l('Flint nezaváhal. S prázdnym revolverom a s nulovým plánom sa hodil medzi Tami a karabínu. Guľka ho zasiahla do ľavého ramena.', 'Flint did not hesitate. With an empty revolver and no plan at all he threw himself between Tami and the carbine. The bullet took him in the left shoulder.'))
  g.face('tami', 'shooter')
  g.pose('tami', 'cast')
  g.propVisible('shield', true)
  g.sfx('glyph')
  g.flash('#ffd27a', 500)
  await g.focus([18, 12], { ms: 500, zoom: 1.45 })
  await g.narrate(l('Ale Tami nestála za ním bezbranná. Ľavá ruka jej vyletela vpred a pred dlaňou sa s oslepujúcim bleskom rozžiaril glyf: päť tenkých zlatých línií, ostré angulárne zárezy, cudzie runy. Žiadne kruhy. Žiadne oblúky.', 'But Tami did not stand behind him defenceless. Her left hand flew forward and before her palm a glyph blazed up in a blinding flash: five thin golden lines, sharp angular cuts, foreign runes. No circles. No arcs.'))
  await g.narrate(l('Guľka by narazila do steny z čistého svetla. Ale nebola tu žiadna guľka pre štít.', 'A bullet would have struck a wall of pure light. But there was no bullet left for the shield.'))
  g.face('flint', 'tami')
  await g.say('flint', l('…zjavne.', '…apparently.'), { mood: 'pain' })
  // the veterans answer, the shooter runs
  g.face('kiri', 'shooter')
  g.sfx('shot', 0.8)
  await g.wait(220)
  g.sfx('shot', 0.8)
  g.pose('shooter', 'stand')
  void g.walk('shooter', [25, 19], { run: true, speed: 4.6 }).then(() => g.despawn('shooter'))
  await g.wait(500)
  g.propVisible('shield', false)
  g.pose('tami', 'stand')
  await g.narrate(l('Štít doznel. Glyf sa rozpadol na zlaté iskry. Ľavú ruku zovrela do päste až na druhý pokus.', 'The shield died away. The glyph broke into golden sparks. She managed to close her left hand into a fist only at the second try.'))
  g.music('main', 2000)
  await g.walk('tami', [17, 12])
  g.face('tami', 'flint')
  g.pose('tami', 'kneel')
  g.mood('tami', 'angry')
  await g.say('tami', l('Ty absolútny blázon! Prečo si tam skočil, sho?! Mohlo ťa to zabiť, ty pochaboš, mala som štít!', 'You absolute madman! Why did you jump in, sho?! It could have killed you, you fool, I had a shield!'), { mood: 'angry' })
  g.codex('gloss.sho')
  await g.say('flint', l('Lebo ťa milujem.', 'Because I love you.'), { mood: 'pain' })
  await g.narrate(l('Vykašľal to. Krv mu červenala zuby.', 'He coughed it out. Blood reddened his teeth.'))
  await g.say('flint', l('Vo Východnom Doku. V Nyau. Stál som v dave s bedňou munície.', 'At the East Dock. In Nyau. I was standing in the crowd with a crate of ammunition.'), { mood: 'pain' })
  await g.say('flint', l('Nezabudol som.', 'I didn’t forget.'), { mood: 'happy' })
  g.mood('tami', 'surprised')
  await g.say('tami', l('Ja ťa ani nepoznám.', 'I don’t even know you.'), { mood: 'surprised' })
  await g.narrate(l('V tom hlase nebol rozkaz. Ruky jej pritom nezastali; tlak na ranu držala pevný a presný. Ale maska kapitánky sa lámala.', 'There was no command in that voice. Her hands never stopped; she kept the pressure on the wound firm and precise. But the captain’s mask was cracking.'))
  g.set('c7g.stage', 'heal')
  g.follow()
  g.cinematic(false)
  g.objective(l('Flint krváca. Ošetri ho.', 'Flint is bleeding. Tend to him.'))
  g.hint(l('E — liečiť', 'E — heal'))
  g.checkpoint()
}

async function heal(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.hint(null)
  g.objective(null)
  await g.walk('player', [19, 11])
  g.face('player', 'flint')
  g.pose('player', 'kneel')
  await g.focus('flint', { ms: 600, zoom: 1.5 })
  await g.narrate(l('Posledné zlaté iskry Taminho štítu ešte viseli vo vzduchu. Yera nad nimi zaváhala ako kňažka nad textom v cudzom písme. Žiadne kruhy. Žiadne písmo Matky.', 'The last golden sparks of Tami’s shield still hung in the air. Yera hesitated over them like a priestess over a text in a foreign script. No circles. None of the Mother’s writing.'))
  await g.narrate(l('Ale Flint krvácal. Spracovať to mohla neskôr.', 'But Flint was bleeding. She could think about it later.'))
  g.glyph('player', 2.5)
  await g.say('player', l('Guľka v mäkkom tkanive. Žiadna kosť ani tepna. Drž ho.', 'Bullet in soft tissue. No bone, no artery. Hold him.'), { mood: 'determined' })
  let ok = false
  while (!ok) {
    const r = await g.minigame('flow', { level: 'wound' })
    ok = r.success
    if (!ok) await g.narrate(l('Prúd sa zasekol o úlomok kosti. Yera zavrela oči a viedla vodu znova, pomalšie.', 'The flow caught on a sliver of bone. Yera closed her eyes and led the water again, more slowly.'))
  }
  g.fx('heal', 'flint')
  await g.narrate(l('Modrá žiara stekala ako voda cez riečisko. Guľka sa posúvala von cez tkanivo. Flint zaťal zuby; nezakričal.', 'The blue glow ran like water down a riverbed. The bullet worked its way out through the flesh. Flint clenched his teeth; he did not cry out.'))
  g.sfx('click', 0.7)
  await g.narrate(l('Chvíľa. Dlhá chvíľa. Guľka spadla do trávy: malá, deformovaná, krvavá.', 'A moment. A long moment. The bullet dropped into the grass: small, misshapen, bloody.'))
  g.glyph('player', 0.6)
  await g.say('player', l('Prežije.', 'He’ll live.'))
  g.mood('flint', 'happy')
  g.rel('flint', 1)
  g.codex('gloss.glyf')
  g.pose('player', 'stand')
  await g.narrate(l('Arkot stál pri nej a s úžasom sledoval jej kontrolu. Neviditeľnosť, útek, teraz hlboké liečenie rany. Ale Yera stála. Len prsty mala studené a biele.', 'Arkot stood beside her, watching her control in wonder. Invisibility, the flight, and now the deep healing of a wound. But Yera stood. Only her fingers were cold and white.'))
  g.face('tami', 'arkot')
  await g.say('tami', l('Rampa. Zdvihni rampu.', 'The ramp. Raise the ramp.'), { mood: 'closed' })
  await g.fade('black', 1400)
  g.set('ch07.rescued')
  await g.caption(l('Itaka stúpala. Ticho. Presne. Preč od stromov, preč od ohňa, preč po tridsiatich nociach.', 'The Itaka rose. Silently. Precisely. Away from the trees, away from the fire, away after thirty nights.'), { ms: 4200 })
  await g.goto('c7_deck')
}

const scene: SceneDef = {
  id: 'c7_glade',
  name: l('Poľana na severe', 'The Glade to the North'),
  ambience: GLADE,
  camera: { zoom: 1.05 },
  map: GLADE_MAP,
  player: { character: 'yera', at: [11, 20], facing: 180, abilities: ['veil', 'flow'] },
  actors: [
    { id: 'arkot', character: 'arkot', at: [12, 19], facing: 180, solid: false },
    { id: 'flint', character: 'flint', at: [13, 20], facing: 180, solid: false },
    { id: 'dara', character: 'dara', at: [11, 18], facing: 180, solid: false },
    { id: 'yori', character: 'yori', at: [12, 18], facing: 180, solid: false },
    { id: 'mech', character: 'c7_mechanic', at: [13, 19], facing: 180, solid: false },
    { id: 'load1', character: 'c7_loader1', at: [10, 19], facing: 180, solid: false },
    { id: 'load2', character: 'c7_loader2', at: [14, 19], facing: 180, solid: false },
    { id: 'ch1', character: 'c7_pirate6', at: [10, 23], solid: false },
    { id: 'ch2', character: 'c7_pirate7', at: [12, 23], solid: false },
    { id: 'ch3', character: 'c7_pirate8', at: [14, 22], solid: false },
    { id: 'tami', character: 'tami', at: [25, 12], hidden: true, solid: false },
    { id: 'kiri', character: 'kiri', at: [25, 13], hidden: true },
    { id: 'toru', character: 'toru', at: [24, 12], hidden: true },
    { id: 'shooter', character: 'c7_pirate10', at: [22, 16], hidden: true, solid: false },
  ],
  props: [
    { type: 'itaka', at: [12, 9], y: 3.6, id: 'itakaAir', solid: false },
    { type: 'itaka', at: [12, 9], id: 'itakaGround', hidden: true },
    { type: 'ch07_ramp', at: [15, 9], rot: 90, id: 'ramp', hidden: true },
    { type: 'ch07_crater', at: [10, 22], id: 'crater1', hidden: true },
    { type: 'ch07_crater', at: [13, 21], id: 'crater2', hidden: true },
    { type: 'ch07_rune_shield', at: [18, 12], rot: 51, id: 'shield', hidden: true },
    { type: 'boulder', at: [5, 8] },
    { type: 'boulder', at: [19, 5], params: { size: 0.8 } },
    { type: 'rock', at: [7, 15] },
    { type: 'rock', at: [17, 17] },
    { type: 'stump', at: [8, 6] },
    { type: 'log', at: [5, 13], rot: 60 },
    { type: 'grass', at: [9, 14] },
    { type: 'grass', at: [16, 6] },
    { type: 'grass', at: [20, 10] },
    { type: 'grass', at: [6, 11] },
    { type: 'flowers', at: [8, 10], params: { glow: true } },
    { type: 'flowers', at: [18, 15], params: { glow: true } },
    { type: 'flowers', at: [4, 10], params: { glow: true } },
    { type: 'mushroom', at: [3, 13] },
    { type: 'mushroom', at: [20, 7] },
    { type: 'roots', at: [21, 15] },
  ],
  interactables: [
    {
      id: 'heal',
      at: [18, 12],
      label: l('Ošetriť Flinta', 'Tend to Flint'),
      verb: 'heal',
      radius: 1.8,
      when: (g) => g.flag('c7g.stage') === 'heal',
      run: heal,
    },
  ],
  triggers: [
    {
      id: 'ramp',
      area: [15, 8, 17, 10],
      when: (g) => g.flag('c7g.stage') === 'board',
      run: theShot,
    },
  ],
  onEnter: async (g) => {
    await g.once('c7g.intro', async () => {
      await landing(g)
    })
    const s = g.flag('c7g.stage')
    if (s === 'board' || s === 'heal') {
      // after a reload: the ship is down and the others are aboard
      g.propVisible('itakaAir', false)
      g.propVisible('itakaGround', true)
      g.propVisible('ramp', true)
      g.propVisible('crater1', true)
      g.propVisible('crater2', true)
      for (const id of ['ch1', 'ch2', 'ch3']) g.despawn(id)
      for (const id of BOARDERS) g.show(id, false)
      for (const id of ['tami', 'kiri', 'toru']) g.show(id, true)
      g.music(s === 'heal' ? 'main' : 'combat_epic_1')
    }
    if (s === 'board') {
      g.teleport('tami', [17, 12])
      g.teleport('kiri', [19, 14])
      g.teleport('toru', [19, 10])
      g.companion('arkot', true)
      g.companion('flint', true)
      g.objective(l('Na palubu.', 'Aboard.'))
    }
    if (s === 'heal') {
      g.despawn('shooter')
      place(g, 'flint', [18, 12], 'tami', 'lie')
      place(g, 'tami', [17, 12], 'flint', 'kneel')
      place(g, 'arkot', [15, 9], [18, 12], 'stand')
      g.objective(l('Flint krváca. Ošetri ho.', 'Flint is bleeding. Tend to him.'))
    }
  },
}

export default scene
