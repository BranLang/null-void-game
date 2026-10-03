/**
 * c16_metaru — the hangar of the Metaru during the siege. One hub, many days:
 * waking beside Tami, the five days of denial, Sayuri's healing and the
 * premature birth (mu-hi), the new glyphs, Tami's first word, the last beer
 * barrel and the tales of the Gōstar, the water running out, Kiri at the gate,
 * the cup turned upside down, and Saburo: "If he returns, let him in."
 *
 * Story stage lives in the flag `c16.stage` (see index.ts for the overview).
 */
import type { ActorDef, PlacedProp, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { HALL_DAWN, HALL_EVENING, HALL_HEAVY, HALL_LIGHT, HALL_MAP } from './shared'

const stage = (g: GameAPI): number => Number(g.flag('c16.stage')) || 1

// ------------------------------------------------------------------------- set dressing
const ribs: PlacedProp[] = [
  ...[3, 8, 13, 18, 23, 30].map((x): PlacedProp => ({ type: 'ch16_hull_rib', at: [x, 0], params: { h: 4.4 } })),
  ...[4, 13, 18].map((y): PlacedProp => ({ type: 'ch16_hull_rib', at: [0, y], rot: 90, params: { h: 4.4 } })),
]

const pigeons: PlacedProp[] = [
  { type: 'ch16_pigeons', at: [5, 0], y: 3.4, params: { n: 3 } },
  { type: 'ch16_pigeons', at: [11, 0], y: 3.7, params: { n: 2 } },
  { type: 'ch16_pigeons', at: [16, 0], y: 3.2, params: { n: 4 } },
  { type: 'ch16_pigeons', at: [21, 0], y: 3.6, params: { n: 3 } },
  { type: 'ch16_pigeons', at: [0, 7], rot: 90, y: 3.4, params: { n: 3 } },
  { type: 'ch16_pigeons', at: [0, 15], rot: 90, y: 3.1, params: { n: 2 } },
]

const bedding: PlacedProp[] = [
  [5, 1, '#4a5a6e'],
  [3, 1, '#6a4a3a'],
  [2, 2, '#5a5a4a'],
  [7, 2, '#7a5a4a'],
  [8, 3, '#4a4a5a'],
  [11, 1, '#5a6a5a'],
  [13, 2, '#6a5a6a'],
  [15, 1, '#7a6a52'],
  [19, 3, '#5a4a3a'],
  [21, 4, '#4a5a4a'],
  [2, 5, '#6a5a4a'],
  [2, 6, '#5a4e46'],
  [2, 13, '#4e5a66'],
  [10, 14, '#6a4e40'],
  [13, 12, '#5a5a6a'],
  [17, 16, '#4a4a3e'],
  [10, 12, '#5a6a6e'],
  [12, 13, '#6a6a5a'],
  [24, 18, '#5a4a4a'],
].map(([x, y, c]): PlacedProp => ({ type: 'ch16_bedroll', at: [x as number, y as number], color: c as string }))

const clutter: PlacedProp[] = [
  // the gate into the pressure chamber and Felix's door
  { type: 'door', at: [0, 9], rot: 90, params: { style: 'iron' }, id: 'gate_shut' },
  { type: 'door', at: [0, 9], rot: 90, params: { style: 'iron', open: true }, id: 'gate_open', hidden: true },
  { type: 'door', at: [27, 0], params: { style: 'iron' } },
  // Yera and Tami's corner: the lamp between them, the cup, bread
  { type: 'lantern', at: [4, 2], params: { style: 'ground' } },
  { type: 'ch16_cup', at: [5, 2], offset: [0.28, -0.12], id: 'cup_up' },
  { type: 'ch16_cup', at: [5, 2], offset: [0.28, -0.12], params: { down: true }, id: 'cup_down', hidden: true },
  { type: 'bowl', at: [4, 1], offset: [0, 0.2] },
  // oil lamps lower on the walls
  { type: 'lantern', at: [8, 1] },
  { type: 'lantern', at: [17, 1] },
  { type: 'lantern', at: [25, 1] },
  { type: 'lantern', at: [1, 7] },
  { type: 'lantern', at: [1, 15] },
  { type: 'lantern', at: [1, 20] },
  { type: 'lantern', at: [30, 8], params: { style: 'ground' } },
  // the corridor narrowing towards the workshop
  { type: 'crate', at: [24, 1], params: { stack: true } },
  { type: 'crate', at: [25, 2] },
  { type: 'crate', at: [29, 1], params: { stack: true } },
  { type: 'sack', at: [29, 2], params: { count: 3 } },
  { type: 'pipe', at: [26, 0], params: { vertical: true } },
  // bundles, crates and the fair goods people carried in
  { type: 'crate', at: [9, 5] },
  { type: 'sack', at: [10, 5], params: { count: 2 } },
  { type: 'basket', at: [7, 6] },
  { type: 'crate', at: [16, 4], params: { stack: true } },
  { type: 'sack', at: [14, 4] },
  { type: 'crate', at: [20, 7] },
  { type: 'basket', at: [21, 6] },
  { type: 'cart', at: [18, 12], rot: 90 },
  { type: 'crate', at: [14, 17] },
  { type: 'sack', at: [13, 18], params: { count: 2 } },
  { type: 'barrel', at: [1, 12] },
  { type: 'barrel', at: [1, 13] },
  { type: 'pot', at: [3, 12] },
  // Sayuri's corner: the tarp between two steel ribs
  { type: 'ch16_tarp', at: [4, 17] },
  { type: 'rug', at: [4, 17], color: '#6a4e3a' },
  { type: 'lantern', at: [5, 16], params: { style: 'ground' }, id: 'birthlamp' },
  { type: 'bowl', at: [6, 17] },
  { type: 'pot', at: [2, 18] },
  // the brewer's corner and the last barrel
  { type: 'barrel', at: [26, 15], id: 'lastbarrel' },
  { type: 'crate', at: [28, 14], params: { stack: true } },
  { type: 'crate', at: [28, 15] },
  { type: 'crate', at: [24, 14] },
  { type: 'stall', at: [21, 14] },
  { type: 'table', at: [26, 17], params: { items: true } },
  { type: 'ch16_cup', at: [26, 17], y: 0.74, offset: [-0.2, 0] },
  { type: 'ch16_cup', at: [26, 17], y: 0.74, offset: [0.15, 0.1] },
  { type: 'candles', at: [27, 18] },
  // glowing plants at the hull base
  
  { type: 'flowers', at: [12, 1], params: { glow: true } },
  { type: 'flowers', at: [1, 10], params: { glow: true } },
  { type: 'mushroom', at: [20, 1], color: '#7dffc8' },
  { type: 'mushroom', at: [1, 18], color: '#6dffb8' },
]

// ------------------------------------------------------------------------- people
const refugees: ActorDef[] = (
  [
    [2, 2, 'lie'],
    [7, 2, 'sit'],
    [8, 3, 'sit'],
    [11, 1, 'lie'],
    [13, 2, 'sit'],
    [15, 1, 'sit'],
    [19, 3, 'lie'],
    [21, 4, 'sit'],
    [2, 5, 'sit'],
    [2, 6, 'lie'],
    [2, 13, 'sit'],
    [10, 14, 'lie'],
    [13, 12, 'sit'],
    [17, 16, 'sit'],
  ] as const
).map(([x, y, pose], i): ActorDef => ({ id: `ref${i}`, character: `c16_ref${i}`, at: [x, y], pose, facing: (i * 67) % 360, talk: refugeeTalk(i) }))

const REFUGEE_LINES = [
  l('Spí. Nechaj ho spať. Kým spí, nie je hladný.', 'He is asleep. Let him sleep. While he sleeps, he is not hungry.'),
  l('Moja sestra zostala dole pri mlyne. Možno sa skryla. Možno.', 'My sister stayed down by the mill. Maybe she hid. Maybe.'),
  l('Počuješ to? Tie ruky na plechu. Každú noc bližšie. Alebo sa mi to zdá.', 'Do you hear it? Those hands on the plating. Closer every night. Or it only seems so.'),
  l('Felix nás pustil dnu. Tristo zím s nikým nehovoril, a pustil nás dnu.', 'Felix let us in. Three hundred winters he spoke to no one, and he let us in.'),
  l('Sho. Zase holuby. Aspoň tie sú sýte.', 'Sho. The pigeons again. At least they are fed.'),
  l('Si tá, čo priniesla Tami. Ďakujem. Ona nás učila strieľať z praku, keď sme boli malí.', 'You are the one who brought Tami back. Thank you. She taught us to shoot slings when we were small.'),
  l('Ticho. Malá konečne zaspala.', 'Hush. The little one has finally fallen asleep.'),
  l('V ťažkej hodine sa to tu nedá dýchať. V ľahkej sa to nedá vydržať.', 'In the heavy hour you cannot breathe in here. In the light hour you cannot bear it.'),
  l('Dobytok sme nechali vonku. Kravy. Do rána boli len rohy.', 'We left the cattle outside. Cows. By morning there were only horns.'),
  l('Keď to skončí, pôjdem domov. Ak ešte bude domov.', 'When it ends, I will go home. If there is still a home.'),
  l('Pýtaš sa, kedy to skončí? Všetci sa pýtajú. Nikto neodpovedá.', 'You ask when it will end? Everyone asks. No one answers.'),
  l('Mám horúčku. Nie, nič to nie je. Choď za tými, čo potrebujú viac.', 'I have a fever. No, it is nothing. Go to those who need it more.'),
  l('Moja babka hovorila, že tento trup kedysi lietal. Medzi hviezdami. Ja jej nikdy neverila.', 'My grandmother said this hull used to fly. Between the stars. I never believed her.'),
  l('Saburo vraj rozkáže rátať vodu. Keď začnú rátať, je zle.', 'They say Saburo will order the water counted. When they start counting, it is bad.'),
]

function refugeeTalk(i: number) {
  return async (g: GameAPI) => {
    if (stage(g) >= 8) {
      await g.say(`ref${i}`, l('…', '…'), { mood: 'sad' })
      await g.narrate(l('Nepozrel sa na ňu. Pozeral na dvere.', 'They did not look at her. They looked at the door.'))
      return
    }
    await g.say(`ref${i}`, REFUGEE_LINES[i % REFUGEE_LINES.length])
  }
}

// ------------------------------------------------------------------------- talk scripts
async function talkTami(g: GameAPI): Promise<void> {
  const s = stage(g)
  if (s === 5 && !g.flag('c16.tamiWord')) {
    await tamiFirstWord(g)
    return
  }
  if (s >= 6 && g.flag('c16.tamiBook')) {
    await g.narrate(l('Tami spala s chvostom okolo tela. Dych pokojnejší, než mal byť.', 'Tami slept with her tail around her body. Her breathing calmer than it should have been.'))
    return
  }
  if (s >= 5) {
    await g.narrate(l('Tami držala plecháčik oboma rukami. Pila po malých dúškoch a dívala sa cez Yeru, niekam na stenu.', 'Tami held the cup in both hands. She drank in small sips and looked past Yera, somewhere at the wall.'))
    return
  }
  await g.narrate(l('Tami pri stene, s kolenami pri hrudi a chvostom obtočeným okolo tela. Nehybná spôsobom, akým bývajú nehybné veci, čo sa rozhodli prestať skúšať.', 'Tami against the wall, knees to her chest, tail wound around her body. Still in the way things are still when they have decided to stop trying.'))
  await g.narrate(l('Keď sa jej Yera dotkla, stuhla. Keď ju nechala, otvorila oči a pozerala do prázdna.', 'When Yera touched her, she went rigid. When Yera let go, she opened her eyes and stared into nothing.'))
}

async function talkSaburo(g: GameAPI): Promise<void> {
  const s = stage(g)
  if (s >= 9) {
    await g.say('saburo', l('Sho. Choď spať, dievča. Ja počkám.', 'Sho. Go to sleep, girl. I will wait.'), { mood: 'closed' })
    return
  }
  if (s === 8) {
    await g.narrate(l('Saburo sedel pri dverách s palicou medzi kolenami. Pri každom zvuku za pancierom, čo mohol byť krokom, zdvihol hlavu.', 'Saburo sat by the door with his cane between his knees. At every sound beyond the armour that could have been a step, he raised his head.'))
    return
  }
  const lines = [
    l('Tami je živá. To si mi doniesla ty. Na zvyšok mám čas.', 'Tami is alive. You brought me that. For the rest I have time.'),
    l('Sho. Tisíc ľudí, jedny dvere a jeden Mako, čo nechce, aby mu niekto siahal na kľúče.', 'Sho. A thousand people, one door, and one Mako who does not want anyone touching his spanners.'),
    l('Itaka sa vráti. Dara nevie prehrávať.', 'The Itaka will come back. Dara does not know how to lose.'),
  ]
  await g.say('saburo', lines[(Number(g.inc('c16.saburoTalk')) - 1) % lines.length])
}

async function talkKiri(g: GameAPI): Promise<void> {
  await g.narrate(l('Kiri stál pri bráne tak, ako stál na palube Itaky pri zábradlí: ruky pokojné, karabína opretá o rameno.', 'Kiri stood by the gate the way he had stood at the Itaka’s rail: hands still, carbine resting on his shoulder.'))
  await g.say('kiri', l('Vonku nič nové. Len dážď a ruky.', 'Nothing new outside. Only rain and hands.'))
}

async function talkToru(g: GameAPI): Promise<void> {
  await g.say('toru', l('Ak potrebuješ niečo preložiť, povedz. Kitsunčina má na strach desať slov. Staroreč len jedno.', 'If you need something translated, say so. Kitsune has ten words for fear. The Old Tongue has only one.'))
}

async function talkSayuri(g: GameAPI): Promise<void> {
  const s = stage(g)
  if (s === 3) {
    await g.narrate(l('Sayuri ukázala bradou na ranených. Stará líška nemrhala slovami.', 'Sayuri pointed her chin at the wounded. The old fox did not waste words.'))
    return
  }
  await g.narrate(l('Sayuri liečila ďalej. Tetovania na jej rukách svietili pri každom slove. Na krku a na hrudi. Celý život zapísaný v koži.', 'Sayuri went on healing. The tattoos on her arms lit with every word. On her neck and on her chest. A whole life written into her skin.'))
}

async function talkBrewer(g: GameAPI): Promise<void> {
  if (stage(g) === 6 && !g.flag('c16.beer')) {
    await pourBeer(g)
    return
  }
  await g.say('brewer', l('Posledný sud. Potom už len voda. A potom ani tá.', 'The last barrel. Then only water. And then not even that.'))
}

// ------------------------------------------------------------------------- stage helpers
function applyStage(g: GameAPI): void {
  const s = stage(g)
  const gone = s >= 8
  for (const id of ['kiri', 'toru', 'young0', 'young1', 'young2']) g.show(id, !gone)
  g.propVisible('cup_up', s < 7 || (s === 7 && !g.flag('c16.cupTurned')))
  g.propVisible('cup_down', s >= 8 || (s === 7 && !!g.flag('c16.cupTurned')))
  // the birth is over from stage 5: the young mother sits up with the baby
  if (s >= 5) {
    g.pose('mother', 'sit')
    g.pose('grey', 'sit')
  }
  if (g.flag('c16.healedBurned')) g.pose('burned', 'sit')
  if (g.flag('c16.healedRib')) g.pose('rib', 'sit')
  if (s >= 9) g.teleport('saburo', [2, 10])
  const amb = s === 4 ? HALL_HEAVY : s === 5 ? HALL_LIGHT : s === 6 || s === 7 ? HALL_EVENING : HALL_DAWN
  void g.atmosphere(amb, 0)
  if (s === 4) g.sai('heavy')
  else if (s === 5) g.sai('light')
  else g.sai('neutral')
}

function stageObjective(g: GameAPI): void {
  const s = stage(g)
  if (s === 1) g.objective(l('Felix ťa volá. Jeho dielňa je vzadu, za úzkou chodbou vpravo hore.', 'Felix is calling for you. His workshop is at the back, past the narrow passage at the top right.'))
  else if (s === 2) g.objective(l('Prenes verš o Tenši cez celý hangár až k Felixovi.', 'Carry the verse of Tenši across the whole hangar to Felix.'))
  else if (s === 3) g.objective(l(`Lieč so Sayuri ranených z Kitsune (${Number(g.flag('c16.healed')) || 0}/2).`, `Heal the wounded of Kitsune with Sayuri (${Number(g.flag('c16.healed')) || 0}/2).`))
  else if (s === 4) g.objective(l('Choď za Sayuri pod plachtu medzi oceľovými rebrami.', 'Follow Sayuri under the tarp between the steel ribs.'))
  else if (s === 5 && !g.flag('c16.tamiWord')) g.objective(l('Sadni si k Tami.', 'Sit with Tami.'))
  else if (s === 5) g.objective(l('Felix ťa volá znova.', 'Felix is calling for you again.'))
  else if (s === 6 && !g.flag('c16.beer')) g.objective(l('Postav sa do radu k poslednému sudu.', 'Join the queue at the last barrel.'))
  else if (s === 6) g.objective(l(`Vypočuj si príbehy o Gōstarovi (${tales(g)}/3).`, `Listen to the tales of the Gōstar (${tales(g)}/3).`))
  else if (s === 8) g.objective(l('Pod závojom vyjdi z Metaru a nájdi ich. Brána je vľavo.', 'Leave the Metaru under the veil and find them. The gate is on the left.'))
  else if (s === 9 && !g.flag('c16.saburoHealed')) g.objective(l('Saburo pri dverách.', 'Saburo, by the door.'))
  else if (s === 9) g.objective(l('Za stenou dielne niečo bzučí.', 'Something is humming behind the workshop wall.'))
  else g.objective(null)
}

const tales = (g: GameAPI): number => ['c16.taleElder', 'c16.taleWoman', 'c16.taleSayuri'].filter((k) => g.flag(k)).length

function setStage(g: GameAPI, s: number): void {
  g.set('c16.stage', s)
  stageObjective(g)
  g.checkpoint()
}

// ------------------------------------------------------------------------- 1: waking
async function wake(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.pose('player', 'sit')
  g.face('player', 0)
  await g.wait(600)
  await g.narrate(l('Sivý pruh svitania sa kĺzal po podlahe. Železný chrám nemal okná, a predsa svetlo z ventilačných šácht bolo jediným dôkazom, že vonku prešla noc.', 'A grey stripe of dawn slid across the floor. The Iron Temple had no windows, and still the light through the ventilation shafts was the only proof that outside, a night had passed.'))
  await g.focus([16, 0], { ms: 1600, zoom: 0.85 })
  await g.narrate(l('Ako prvý ju prebudil hukot. Tisíce hlasov v slepých útrobách prastarého stroja, zliate do jedného úzkostného šepotu: stony zo spánku a mená tých, čo zostali vonku.', 'The first thing to wake her was the hum. Thousands of voices in the blind belly of an ancient machine, poured into a single anxious whisper: moans from sleep and the names of those left outside.'))
  await g.narrate(l('Nad nimi krúžili stovky holubov v nekonečnom hrkútaní. A pod tým všetkým hlboké pradenie tisícročného trupu, ktorý už dávno zabudol, na čo bol.', 'Above them hundreds of pigeons circled, cooing without end. And beneath it all, the deep purr of a thousand-year-old hull that had long forgotten what it was for.'))
  await g.focus('player', { ms: 1200, zoom: 1.15 })
  await g.narrate(l('Za stenou dýchanie, kašeľ a plač dieťaťa. Po stene rytmicky stekal kondenzát, ako tep niečoho, čo v skutočnosti nemalo srdce.', 'Behind the wall: breathing, coughing, a child crying. Condensation ran down the wall in a steady rhythm, like the pulse of something that in truth had no heart.'))
  g.face('player', 'tami')
  await g.narrate(l('Chladná stena na chrbte. Tami vedľa nej. Chvost obtočený, oči zatvorené, dýchala. To bolo dosť.', 'Cold wall at her back. Tami beside her. Tail wound around her, eyes closed, breathing. That was enough.'))
  for (let i = 0; i < 3; i++) {
    g.sfx('tick', 0.3)
    g.shake(0.03, 260)
    await g.wait(520)
  }
  await g.narrate(l('Niekde vonku, za pancierom, sa občas ozval zvuk. Žiadne zvieracie škrabanie. Jemné, metodické hmatanie stoviek prízračných dlaní, čo kĺzali po plášti a hľadali škáru, ktorá neexistovala.', 'Somewhere outside, beyond the armour, a sound came now and then. Not the scratching of an animal. The gentle, methodical groping of hundreds of phantom palms sliding over the hull, feeling for a crack that did not exist.'))
  g.codex('gloss.metaru')
  g.follow()
  await g.zoom(1, 600)
  void g.walk('toru', [6, 3])
  await g.wait(1600)
  g.face('toru', 'player')
  await g.say('toru', l('Felix. Volá ťa do dielne.', 'Felix. He is calling you to the workshop.'))
  await g.say('toru', l('Povedal, aby si prišla sama. A aby si nič nehovorila, kým neprídeš. To posledné som nepochopil ani ja.', 'He said you should come alone. And say nothing until you get there. That last part I did not understand either.'))
  void g.walk('toru', [4, 8])
  g.pose('player', 'stand')
  g.cinematic(false)
  setStage(g, 1)
}

// ------------------------------------------------------------------------- 2: five days
async function fiveDays(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.fade('black', 500)
  g.teleport('player', [5, 1], 0)
  g.pose('player', 'sit')
  await g.fade('clear', 700)
  await g.narrate(l('Chlad steny na chrbte a tlak v hrudi mali už jasný tvar.', 'The cold of the wall at her back and the pressure in her chest had a clear shape now.'))
  await g.narrate(l('Hladila tie dosky dlho. V chráme. Na palube. Tu. Fialové žilky pulzovali po každom dotyku. El. Jej dych a moc. Ukradla ju, strážila ju, spala s ňou.', 'She had stroked those covers for so long. In the temple. On deck. Here. The violet veins pulsed at every touch. El. Her breath and her power. She had stolen it, guarded it, slept beside it.'))
  await g.say('player', l('El je El. Kniha je El. Posvätná.', 'El is El. The Book is El. Holy.'), { thought: true, mood: 'closed' })
  await g.caption(l('Opakovala si to päť dní.', 'She repeated it for five days.'), { ms: 2800 })
  await g.narrate(l('Ako modlitbu. Ako vietor, čo drží lampión vo výške, len kým fúka.', 'Like a prayer. Like the wind that holds a lantern aloft only for as long as it blows.'))
  await g.narrate(l('Dvakrát sa vrátila k Felixovi a dvakrát mu povedala, že preklad je zlý. Že to nie je spoveď. Že ten jazyk bol kliatba a on ho číta naopak. Felix ju neopravil ani slovom.', 'Twice she went back to Felix and twice she told him the translation was wrong. That it was no confession. That the language was a curse and he was reading it backwards. Felix did not correct her by a single word.'))
  await g.narrate(l('Druhý raz prišla s veršom.', 'The second time she came with a verse.'))
  g.pose('player', 'stand')
  g.cinematic(false)
  stageObjective(g)
  g.checkpoint()
}

// ------------------------------------------------------------------------- 3: healing
async function healingBegins(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.fade('black', 500)
  g.teleport('player', [5, 1], 0)
  g.pose('player', 'sit')
  await g.fade('clear', 700)
  await g.narrate(l('Dni splývali. Tami pri stene, nehybná. Keď sa jej Yera dotkla, stuhla. Keď ju nechala, otvorila oči a pozerala do prázdna.', 'The days ran together. Tami against the wall, motionless. When Yera touched her, she went rigid. When Yera let go, she opened her eyes and stared into nothing.'))
  await g.narrate(l('Prvé dni v Železnom chráme znamenali jediné. Liečenie. Tami nemala rany, čo sa dali vyliečiť Spirou. Ležala v tichu a Yera okolo nej len bezmocne krúžila.', 'The first days in the Iron Temple meant one thing. Healing. Tami had no wounds that Spira could heal. She lay in silence and Yera circled her, helpless.'))
  await g.narrate(l('Ako prvá potrebovala ošetriť samotná Yera.', 'The first who needed tending was Yera herself.'))
  await g.walk('sayuri', [6, 2])
  g.face('sayuri', 'player')
  g.face('player', 'sayuri')
  g.pose('sayuri', 'kneel')
  g.glyph('sayuri', 3)
  g.fx('heal', 'player')
  await g.narrate(l('Sayuri to urobila mlčky. Jej dlane spočinuli na Yeriných ranách z boja v záhrade. Spira, ktorá starej líške prúdila z dlaní, bola iná. Tichá, prastará a presná.', 'Sayuri did it without a word. Her palms came to rest on the wounds from the fight in the garden. The Spira that flowed from the old fox’s hands was different. Quiet, ancient and precise.'))
  await g.narrate(l('Až teraz, vo svetle Spiry, sa jej línie zjavili v ostrej nahote. Na článkoch prstov, na chrbte dlaní, po predlaktiach, hore krkom až kamsi pod golier. Ako liana, čo rastie celý jeden život, a každý jej kvet je otvorením inej runy.', 'Only now, in the light of the Spira, did her lines show in stark nakedness. On her knuckles, the backs of her hands, along her forearms, up her neck to somewhere beneath her collar. Like a vine that grows for a whole life, every flower the opening of another rune.'))
  g.glyph('sayuri', 0.6)
  g.pose('sayuri', 'stand')
  g.pose('player', 'stand')
  await g.narrate(l('Potom liečili spolu. Spálené ruky od horiacich trámov pri úteku. Zlomené rebro od tlačenice v bráne. Sayuri ukázala ako: ruka na ranu, Spira cez glyfy, sústredený ťah. Yera sledovala a opakovala.', 'Then they healed together. Hands burned by falling beams in the flight. A rib broken in the crush at the gate. Sayuri showed her how: hand on the wound, Spira through the glyphs, one focused draw. Yera watched and repeated.'))
  void g.walk('sayuri', [9, 13])
  g.cinematic(false)
  g.set('c16.healed', 0)
  setStage(g, 3)
}

async function healDone(g: GameAPI): Promise<void> {
  const n = g.inc('c16.healed')
  stageObjective(g)
  if (n < 2) return
  g.cinematic(true)
  await g.caption(l('Glyf za glyfom. Desiatky denne, stovky za týždeň.', 'Glyph after glyph. Dozens a day, hundreds a week.'), { sub: l('Pohyby, čo sa stávali svalovou pamäťou.', 'Movements that became the memory of the muscles.'), ms: 3400 })
  // the birth comes in the heavy hour
  await g.fade('black', 900)
  g.sai('heavy')
  await g.atmosphere(HALL_HEAVY, 0)
  g.teleport('player', [5, 1], 0)
  g.pose('player', 'lie')
  g.teleport('sayuri', [6, 2])
  g.face('sayuri', 'player')
  g.set('c16.stage', 4)
  await g.fade('clear', 1200)
  await g.narrate(l('Pôrod prišiel v ťažkej hodine.', 'The birth came in the heavy hour.'))
  await g.narrate(l('Zobudila ju ruka na pleci, suchá a ľahká ako list. Tami vedľa nej dýchala. Sayuri kývla hlavou do tmy a vykročila.', 'A hand on her shoulder woke her, dry and light as a leaf. Tami breathed beside her. Sayuri nodded into the dark and set off.'))
  g.pose('player', 'stand')
  void g.walk('sayuri', [5, 18], { speed: 1.6 })
  g.codex('gloss.tazka_hodina')
  g.cinematic(false)
  g.hint(l('Ťažká hodina: všetko je ťažšie, aj krok.', 'The heavy hour: everything weighs more, even a step.'))
  stageObjective(g)
  g.checkpoint()
}

async function healBurned(g: GameAPI): Promise<void> {
  if (stage(g) !== 3 || g.flag('c16.healedBurned')) {
    await g.say('burned', l('Už cítim prsty. Všetky. Aj ten, čo som myslel, že nemám.', 'I can feel my fingers now. All of them. Even the one I thought I had lost.'), { mood: 'happy' })
    return
  }
  g.cinematic(true)
  g.face('player', 'burned')
  await g.narrate(l('Ruky mal zabalené do handier, čo sa prilepili k mokvajúcej koži. Trámy horeli, keď bežal k bráne. Niesol cez ne dieťa, nie svoje.', 'His hands were wrapped in rags that had stuck to the weeping skin. The beams were burning as he ran for the gate. He had carried a child through them, not his own.'))
  g.pose('player', 'kneel')
  let ok = false
  while (!ok) {
    const r = await g.minigame('flow', {
      level: 'wound',
      title: l('Popálené ruky', 'Burned hands'),
      subtitle: l('Netlačiť, len počúvať. Ruka na ranu, Spira cez glyfy, sústredený ťah.', 'Do not push, only listen. Hand on the wound, Spira through the glyphs, one focused draw.'),
    })
    ok = r.success
    if (!ok) await g.narrate(l('Voda sa zastavila na okraji spáleniny a nechcela ďalej. Sayuri jej položila prst na zápästie. Znova.', 'The water stopped at the edge of the burn and would go no further. Sayuri laid a finger on her wrist. Again.'))
  }
  g.fx('heal', 'burned')
  g.pose('burned', 'sit')
  await g.say('burned', l('Neboli to moje deti. Ale niekoho boli.', 'They were not my children. But they were someone’s.'), { mood: 'sad' })
  g.pose('player', 'stand')
  g.set('c16.healedBurned')
  g.cinematic(false)
  await healDone(g)
}

async function healRib(g: GameAPI): Promise<void> {
  if (stage(g) !== 3 || g.flag('c16.healedRib')) {
    await g.say('rib', l('Už sa môžem nadýchnuť celý. Až po chvost.', 'I can breathe all the way now. Right down to my tail.'), { mood: 'happy' })
    return
  }
  g.cinematic(true)
  g.face('player', 'rib')
  g.pose('player', 'kneel')
  await g.narrate(l('Chlapec v tlačenici pri bráne. Niekto naňho stúpil, potom ďalší. Dýchal plytko a opatrne, ako keby sa bál, že sa v ňom niečo rozbije.', 'A boy in the crush at the gate. Someone stepped on him, then another. He breathed shallowly and carefully, as if afraid something inside him would shatter.'))
  g.glyph('player', 2)
  g.fx('heal', 'rib')
  g.sfx('water')
  await g.narrate(l('Ruka na ranu. Kosť pod prstami, zlomená na dvoje, s ostrým okrajom. Yera ju prosila späť, kvapku po kvapke, tak ako kedysi v chrámovej záhrade viedla vodu okolo kameňa na koreni.', 'Hand on the wound. Bone beneath her fingers, broken in two, a sharp edge. Yera begged it back, drop by drop, the way she once led water round a stone on a root in the temple garden.'))
  g.glyph('player', 0.6)
  g.pose('rib', 'sit')
  await g.say('rib', l('Ďakujem, teta.', 'Thank you, auntie.'), { mood: 'happy' })
  await g.say('player', l('Teta.', 'Auntie.'), { thought: true })
  g.pose('player', 'stand')
  g.set('c16.healedRib')
  g.cinematic(false)
  await healDone(g)
}

// ------------------------------------------------------------------------- 4: the birth
async function birth(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.hint(null)
  await g.walk('player', [5, 18])
  g.face('player', [4, 17])
  await g.focus([4, 17], { ms: 1200, zoom: 1.3 })
  await g.narrate(l('Za plachtou natiahnutou medzi dvoma oceľovými oblúkmi horela olejová lampa. Na rozprestretých kabátoch ležala mladá žena s ušami sklopenými dozadu a s vlasmi na spánkoch tmavými od potu.', 'Behind a tarp stretched between two steel arches an oil lamp burned. On spread-out coats lay a young woman, her ears flattened back, the hair at her temples dark with sweat.'))
  await g.narrate(l('Ďalšia, šedivá, jej držala hlavu v lone a šepkala jej do ucha, sykavo a bez prestávky, po kitsunsky. Pod plachtou bolo dusno od krvi a od plodovej vody, čo už vsiakla do látky.', 'Another, grey-haired, held her head in her lap and whispered into her ear, hissing and without pause, in Kitsune. Under the tarp the air was close with blood and with the waters that had already soaked into the cloth.'))
  g.pose('sayuri', 'kneel')
  g.pose('player', 'kneel')
  g.glyph('sayuri', 3)
  await g.narrate(l('Sayuri položila dlane na napäté brucho a tetovania na jej rukách sa rozsvietili, od kĺbov prstov po lakte, jedno za druhým, tak ako v Nyau za súmraku ožívajú stromy.', 'Sayuri laid her palms on the taut belly and the tattoos on her arms lit up, from the knuckles to the elbows, one after another, the way the trees of Nyau wake at dusk.'))
  await g.narrate(l('Potom chytila Yeru za ľavú ruku, posunula ju nižšie, vedľa svojej, a krátko pritlačila. Tu.', 'Then she took Yera by the left hand, moved it lower, beside her own, and pressed briefly. Here.'))
  g.glyph('player', 2)
  g.sfx('heartbeat', 0.6)
  await g.wait(500)
  g.sfx('heartbeat', 0.35)
  await g.narrate(l('Yera zavrela oči a pustila dnu Vodu. Netlačiť, len počúvať. Dva tepy. Rodičkin, plytký a rýchly ako krok na úteku. A pod ním druhý, ešte rýchlejší, drobný, zapadnutý tam, kde nemal byť.', 'Yera closed her eyes and let the Water in. Do not push, only listen. Two pulses. The mother’s, shallow and quick as a step in flight. And beneath it a second, quicker still, tiny, lodged where it should not be.'))
  await g.narrate(l('A krv. Bežala pod jej prstami horúco a naponáhlo a Yera ju prosila späť, kvapku po kvapke, trpezlivo, kým nezačala počúvať. Najprv jej chladli končeky, potom kĺby.', 'And blood. It ran hot and hurried under her fingers and Yera begged it back, drop by drop, patiently, until it began to listen. First her fingertips went cold, then her knuckles.'))
  g.shake(0.12, 500)
  await g.say('mother', l('Aaa…!', 'Aaah…!'), { mood: 'pain' })
  await g.narrate(l('Rodička zakričala a jej ruka vystrelila k Yerinmu zápästiu a zovrela ho tak, že pazúry prešli rukávom až na kožu. Šedivá jej vtisla medzi zuby remienok. Yera tú ruku nechala tak.', 'The mother cried out and her hand shot to Yera’s wrist and gripped it so hard her claws went through the sleeve to the skin. The grey woman pushed a strap between her teeth. Yera left the hand where it was.'))
  await g.narrate(l('Potom to išlo naraz, skôr, než ju rodička stihla pustiť.', 'Then it all came at once, before the mother could let go.'))
  await g.wait(600)
  await g.narrate(l('Dieťa vykĺzlo do Sayuriných dlaní sivomodré, mokré a nehybné, nie väčšie než dve päste. Nedýchalo.', 'The baby slid into Sayuri’s hands grey-blue, wet and still, no bigger than two fists. It was not breathing.'))
  await g.narrate(l('Sayuri mu prstom vybrala z úst hlien, prevrátila ho bruškom nadol a palcom mu trela chrbátik, tvrdo, hore a dolu. Nič. Položila ho rodičke na nahé prsia, prikryla ho vlastnou dlaňou a pozrela na Yeru.', 'Sayuri cleared its mouth with a finger, turned it belly-down and rubbed its back with her thumb, hard, up and down. Nothing. She laid it on the mother’s bare breast, covered it with her own palm and looked at Yera.'))
  g.face('sayuri', 'player')
  await g.say('sayuri', l('Ima.', 'Ima.'), { mood: 'determined' })
  await g.narrate(l('Slovo nepoznala. Pohľad áno. Ruky však mala studené až po zápästia, biele ako vosk, a takými sa nezohreje nič.', 'She did not know the word. She knew the look. But her hands were cold to the wrists, white as wax, and nothing is warmed by hands like that.'))
  await g.say('player', l('Hi a mu-hi. Oheň a bez ohňa. Soril to ukazovala s rukou nad miskou a voda stuhla od stredu. Mne vtedy stred ostal tekutý.', 'Hi and mu-hi. Fire and without fire. Soril showed it with her hand above a bowl, and the water set from the centre. For me the centre stayed liquid.'), { thought: true })
  await g.narrate(l('Ruka jej sama zašla za golier a našla kameň. Pustila ho. Vystrela k lampe prázdne prsty.', 'Her hand went to her collar of itself and found the stone. She let it go. She stretched her empty fingers towards the lamp.'))
  let ok = false
  let tries = 0
  while (!ok) {
    const r = await g.minigame('heal', {
      title: l('Mu-hi', 'Mu-hi'),
      subtitle: l('Vezmi plameňu teplo, ktoré celú noc rozdával, a daj ho dieťaťu.', 'Take from the flame the warmth it gave away all night, and give it to the child.'),
    })
    ok = r.success
    tries++
    if (!ok) {
      await g.narrate(
        tries > 1
          ? l('Sayuri neuhla pohľadom. Dlaň mala stále na drobnom chrbte. Čakala.', 'Sayuri did not look away. Her palm was still on the tiny back. She waited.')
          : l('Plameň sa zachvel a vrátil sa do knôtu. Hruď pod Sayurinou dlaňou sa nepohla. Znova.', 'The flame shivered and went back into the wick. The chest under Sayuri’s palm did not move. Again.'),
      )
    }
  }
  g.propVisible('birthlamp', false)
  await g.atmosphere({ hemi: { sky: '#2a3a44', ground: '#0a0806', intensity: 0.28 } }, 900)
  g.glyph('sayuri', 3)
  g.glyph('player', 3)
  await g.narrate(l('Teplo, ktoré plameň celú noc rozdával plachte a zohnutým chrbtom, sa teraz neochotne odvíjalo ako nitka z klbka, prešlo ponad rodičkine prsia a vkĺzlo pod Sayurinu ruku. Oheň za sklom sa scvrkol na modrú bodku a v tme svietili už len línie na ich predlaktiach.', 'The warmth the flame had given all night to the tarp and the bent backs now unwound reluctantly like a thread from a ball, passed over the mother’s breast and slipped under Sayuri’s hand. The fire behind the glass shrank to a blue dot, and in the dark only the lines on their forearms still glowed.'))
  g.sfx('tick', 0.3)
  await g.wait(400)
  g.sfx('tick', 0.25)
  await g.narrate(l('Vonku po trupe zase kĺzali tie dlane a hľadali škáru.', 'Outside, the palms slid over the hull again, feeling for a crack.'))
  await g.wait(900)
  g.sfx('chime', 0.4)
  await g.narrate(l('Dnu zapišťalo dieťa. Tenšie než mačiatko, slabšie než vták, ale zapišťalo, a potom znova, a chrbátik pod starými prstami sa nadvihol a klesol.', 'Inside, the baby squeaked. Thinner than a kitten, weaker than a bird, but it squeaked, and then again, and the little back beneath the old fingers rose and fell.'))
  g.propVisible('birthlamp', true)
  await g.atmosphere(HALL_HEAVY, 700)
  await g.narrate(l('Plameň sa vrátil.', 'The flame came back.'))
  g.mood('mother', 'happy')
  g.mood('grey', 'surprised')
  await g.narrate(l('Rodička sa rozosmiala s remienkom ešte v zuboch. Šedivá si zakryla ústa oboma rukami. Sayuri si ťažko sadla na päty a chvíľu len dýchala.', 'The mother burst out laughing with the strap still in her teeth. The grey woman covered her mouth with both hands. Sayuri sat back heavily on her heels and for a while only breathed.'))
  await g.narrate(l('Potom vzala Yerinu ľavicu do oboch dlaní. Boli rovnako studené. Držali tak jedna druhú a nezohriala sa ani jedna.', 'Then she took Yera’s left hand in both of hers. They were just as cold. They held each other like that, and neither grew warm.'))
  await g.say('sayuri', l('Kīt.', 'Kīt.'), { mood: 'tender' })
  await g.narrate(l('Kývla bradou k dieťaťu. Ani toto slovo Yera nepoznala. Zapamätala si ho.', 'She nodded her chin at the baby. Yera did not know this word either. She remembered it.'))
  g.codex('gloss.c16_ima_kit')
  g.glyph('sayuri', 0.6)
  g.rel('saburo', 1)
  // the new glyphs
  await g.fade('black', 700)
  g.pose('sayuri', 'stand')
  g.pose('mother', 'sit')
  g.pose('grey', 'sit')
  g.teleport('player', [2, 19], 0)
  g.pose('player', 'kneel')
  g.glyph('player', 0.6)
  await g.fade('clear', 700)
  g.sfx('water')
  await g.narrate(l('Umývala si ľavú ruku po tomto poslednom liečení. Cudzia krv a špina z rán konečne odišli s vodou. A pod ňou línie. Nové.', 'She washed her left hand after this last healing. Strangers’ blood and the dirt of wounds went at last with the water. And beneath it, lines. New ones.'))
  const colours = ['#5ff2e0', '#ff8a3a', '#9fffb0', '#e0a050', '#b77dff']
  for (const c of colours) {
    g.fx('glyph', 'player', { color: c, scale: 1.1, ms: 1100 })
    await g.wait(360)
  }
  g.glyph('player', 2.6)
  await g.narrate(l('Obrátila dlaň pod prúdom a po koži sa jej rozbehli, cez kĺby, po chrbte ruky, do prstov. Len ľavá. Pravá čistá. Tie nekreslila ruka; kreslilo ich niečo zvnútra, čo sa dralo von.', 'She turned her palm under the stream and they ran across her skin, over the knuckles, along the back of the hand, into the fingers. Only the left. The right clean. No hand had drawn these; something inside had drawn them, forcing its way out.'))
  await g.narrate(l('Päť farieb na štyroch prstoch. Piaty chýbal.', 'Five colours on four fingers. The fifth was missing.'))
  g.flash('#b77dff', 500)
  await g.narrate(l('A medzi farbami jedna, čo na nej nebola, keď odchádzala z chrámu. Fialová. Sora. Piaty element. Soril o ňom hovorila len v šepote, len v podzemí, len keď boli samy.', 'And among the colours one that had not been on her when she left the temple. Violet. Sora. The fifth element. Soril spoke of it only in whispers, only underground, only when they were alone.'))
  g.codex('gloss.c16_new_glyphs')
  g.codex('gloss.pentagram')
  await g.narrate(l('Nespýtala sa Sayuri. A Sayuri sa nespýtala jej.', 'She did not ask Sayuri. And Sayuri did not ask her.'))
  g.glyph('player', 0.6)
  g.pose('player', 'stand')
  // light hour
  await g.fade('black', 800)
  g.sai('light')
  await g.atmosphere(HALL_LIGHT, 0)
  g.teleport('player', [7, 3], 0)
  g.set('c16.stage', 5)
  await g.fade('clear', 900)
  await g.narrate(l('Ľahká hodina. Deti sa hrali v zelenkavom svetle rastlín, čo obrastali rebrovinu klenby. Holuby preletovali medzi oblúkmi. Váha na ramenách ustúpila a Železný chrám dýchal ľahšie.', 'The light hour. Children played in the greenish light of the plants that overgrew the ribs of the vault. Pigeons flew between the arches. The weight on the shoulders eased and the Iron Temple breathed more lightly.'))
  await g.narrate(l('Ťažká hodina, ľahká hodina. Cyklus, tmavý Tai. Dýchanie lode, čo sa prestala volať loďou.', 'Heavy hour, light hour. The cycle, dark Tai. The breathing of a ship that had stopped being called a ship.'))
  g.cinematic(false)
  stageObjective(g)
  g.checkpoint()
}

// ------------------------------------------------------------------------- 5: Tami speaks
async function tamiFirstWord(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.walk('player', [4, 2])
  g.face('player', 'tami')
  g.pose('player', 'sit')
  await g.narrate(l('Sadla si k nej, tak ako každý deň. A tak ako každý deň hovorila. O čomkoľvek, len aby tam hore nebolo ticho.', 'She sat down beside her, as she did every day. And as every day, she talked. About anything, just so there would be no silence up there.'))
  const c = await g.choose([
    { id: 'itaka', text: l('Rozprávať jej o Itake. Že sa vráti. Že Flint sa vráti.', 'Tell her about the Itaka. That it will come back. That Flint will come back.') },
    { id: 'nyau', text: l('Rozprávať jej o lampiónoch v Nyau, ktoré nikdy nevidela.', 'Tell her about the lanterns of Nyau, which she has never seen.') },
    { id: 'quiet', text: l('Nehovoriť nič. Len jej podržať ruku.', 'Say nothing. Only hold her hand.') },
  ])
  if (c === 'itaka') {
    await g.say('player', l('Dara nevie prehrávať, hovorí Saburo. A Flint… Flint sa nevie neozvať. Uvidíš. Vráti sa a prvé, čo povie, bude niečo hlúpe.', 'Dara does not know how to lose, Saburo says. And Flint… Flint cannot keep quiet. You will see. He will come back and the first thing he says will be something stupid.'), { mood: 'tender' })
    g.set('c16.toldTamiFlint')
  } else if (c === 'nyau') {
    await g.say('player', l('Na Tōr púšťajú lampióny po vode. Tisíce. Vyzerá to, ako keby sa kanály naučili horieť. Raz ťa tam vezmem. Aj keď ma tam zavrú.', 'At Tōr they set lanterns on the water. Thousands. It looks as if the canals have learned to burn. One day I will take you there. Even if they lock me up for it.'), { mood: 'tender' })
  } else {
    await g.narrate(l('Vzala jej ruku do svojej. Prsty studené a tenké, kosti pod kožou. Tentoraz Tami nestuhla.', 'She took her hand in her own. The fingers cold and thin, bones under the skin. This time Tami did not go rigid.'))
  }
  g.rel('tami', 1)
  await g.wait(700)
  g.mood('tami', 'blank')
  await g.narrate(l('Tami otvorila oči, keď Yera hovorila, a pozerala na ňu.', 'Tami opened her eyes while Yera was speaking, and looked at her.'))
  await g.say('tami', l('Yera.', 'Yera.'), { mood: 'blank' })
  await g.narrate(l('Hlas surovejší, ako keby ho niekto zoškrabal až na dno. Oči modré. Len modré.', 'The voice rawer, as if someone had scraped it down to the very bottom. The eyes blue. Only blue.'))
  g.mood('player', 'tender')
  await g.narrate(l('Potom jedla, pila. Dovolila Yere dotknúť sa jej ruky.', 'Then she ate, she drank. She let Yera touch her hand.'))
  await g.fade('black', 600)
  await g.fade('clear', 600)
  await g.narrate(l('A raz, vo svetle lampy, keď si Yera sadla vedľa nej a podávala jej vodu, Tami na chvíľu prestala dýchať.', 'And once, in the lamplight, as Yera sat down beside her and handed her water, Tami stopped breathing for a moment.'))
  await g.focus('tami', { ms: 1400, zoom: 1.6 })
  g.sfx('bass', 0.2)
  await g.wait(1600)
  await g.narrate(l('Nie v kŕči. Len zastala. Dokonale nehybná. Ako socha zo sivého prachu kdesi v dávnej záhrade.', 'Not in a spasm. She just stopped. Perfectly still. Like a statue of grey dust in some ancient garden.'))
  await g.wait(1200)
  g.mood('tami', 'neutral')
  await g.narrate(l('Keď napokon žmurkla a natiahla sa za pohárom, ilúzia zmizla. Vyčerpanie. Nič iné.', 'When at last she blinked and reached for the cup, the illusion was gone. Exhaustion. Nothing else.'))
  g.follow()
  await g.zoom(1, 600)
  g.pose('player', 'stand')
  g.set('c16.tamiWord')
  await g.narrate(l('Felix ju zavolal znova.', 'Felix called for her again.'))
  g.cinematic(false)
  stageObjective(g)
  g.checkpoint()
}

// ------------------------------------------------------------------------- 6: the book, the barrel
async function tamiBook(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.fade('black', 500)
  g.teleport('player', [4, 2], 0)
  g.face('player', 'tami')
  g.pose('player', 'sit')
  await g.fade('clear', 900)
  g.pose('tami', 'sit')
  await g.narrate(l('Tami sa posadila sama, bez pomoci. Pozerala na Yeru.', 'Tami sat up by herself, without help. She looked at Yera.'))
  await g.say('tami', l('Tá kniha. Tá, ktorú si doniesla.', 'That book. The one you brought.'), { mood: 'blank' })
  await g.narrate(l('Chvost sa pohol. Pomaly.', 'Her tail moved. Slowly.'))
  await g.say('player', l('Odkiaľ vieš o knihe?', 'How do you know about the book?'), { mood: 'surprised' })
  await g.say('tami', l('Šepká sa to. Po celom Metaru.', 'People whisper it. All over the Metaru.'))
  await g.narrate(l('Yera sa jej pozrela do očí. Modrá. Len modrá.', 'Yera looked into her eyes. Blue. Only blue.'))
  await g.say('player', l('Myslím, že preto sú tu. Myslím, že prišli pre ňu.', 'I think that is why they are here. I think they came for it.'), { mood: 'sad' })
  await g.narrate(l('Tami prikývla. Zavrela oči.', 'Tami nodded. She closed her eyes.'))
  g.set('c16.tamiBook')
  await g.fade('black', 800)
  await g.atmosphere(HALL_EVENING, 0)
  g.teleport('player', [20, 10], 45)
  g.pose('player', 'stand')
  await g.fade('clear', 900)
  await g.narrate(l('V ten večer, keď Saburo prvý raz rozkázal rátať vodu v cisternách na dni, vykotúľal sládok z jarmoku spomedzi debien svoj posledný sud.', 'That evening, when Saburo first ordered the water in the cisterns counted in days, the brewer from the fair rolled his last barrel out from among the crates.'))
  g.sfx('door', 0.4)
  g.face('player', 'brewer')
  await g.say('toru', l('„Aj tak by skyslo.“ Tak to povedal. Preložil som presne.', '“It would have soured anyway.” That is what he said. I translated it exactly.'))
  await g.narrate(l('Železný chrám sa v ten večer nadýchol inak. Kvasnice prerazili olej aj strach. Do radu sa stavali s plecháčikmi a miskami a sládok čapoval každému na dva prsty a nikomu viac.', 'That evening the Iron Temple drew breath differently. Yeast broke through the oil and the fear. They queued with tin cups and bowls and the brewer poured everyone two fingers and no one more.'))
  g.cinematic(false)
  stageObjective(g)
  g.checkpoint()
}

async function pourBeer(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.face('player', 'brewer')
  g.face('brewer', 'player')
  await g.narrate(l('Sládok jej natočil na dva prsty, ani o kvapku viac, a pozrel sa na ňu tak, ako sa pozerá na každého, kto pije jeho pivo prvýkrát.', 'The brewer poured her two fingers, not a drop more, and looked at her the way he looked at anyone drinking his beer for the first time.'))
  g.sfx('water', 0.4)
  await g.narrate(l('Horké. Teplé. Najlepšie pivo, aké kedy pila.', 'Bitter. Warm. The best beer she had ever drunk.'))
  await g.narrate(l('A k sudu, tak ako k ohňu, prišli príbehy. O ňom. O Gōstarovi. Toru prekladal. Nie všetko, len to, čo uznal za hodné.', 'And to the barrel, as to a fire, came the stories. About him. About the Gōstar. Toru translated. Not everything, only what he judged worthy.'))
  g.codex('gloss.gostar')
  g.set('c16.beer')
  g.teleport('toru', [24, 15])
  g.cinematic(false)
  stageObjective(g)
}

async function taleElder(g: GameAPI): Promise<void> {
  if (stage(g) !== 6 || !g.flag('c16.beer')) {
    await g.say('elder', l('Hm.', 'Hm.'))
    return
  }
  if (g.flag('c16.taleElder')) {
    await g.narrate(l('Starec si odpil a zahľadel sa do misky.', 'The old man sipped and stared into his bowl.'))
    return
  }
  g.cinematic(true)
  g.face('player', 'elder')
  await g.narrate(l('Najstarší z radu hovoril po kitsunsky, starým hlasom, zachrípnutým a presným. Toru prekladal.', 'The eldest in the queue spoke in Kitsune, in an old voice, hoarse and precise. Toru translated.'))
  await g.say('toru', l('„Nemá Spiru. Nemá oči. Ale jeho pohľad bol stále v tvojom chrbte.“', '“He has no Spira. He has no eyes. But his gaze was always in your back.”'))
  g.set('c16.taleElder')
  g.cinematic(false)
  await afterTale(g)
}

async function taleWoman(g: GameAPI): Promise<void> {
  if (stage(g) !== 6 || !g.flag('c16.beer')) {
    await g.narrate(l('Žena držala pod košeľou drobné dieťa a kolísala sa, aj keď stála.', 'The woman held a tiny child under her shirt and rocked, even standing.'))
    return
  }
  if (g.flag('c16.taleWoman')) {
    await g.narrate(l('Dieťa pod košeľou sa pohlo. Žena ho prikryla dlaňou.', 'The child under her shirt stirred. The woman covered it with her palm.'))
    return
  }
  g.cinematic(true)
  g.face('player', 'womanbaby')
  await g.narrate(l('Žena s drobným dieťaťom pod košeľou pivo odmietla, no neodišla. Hlas taký tichý, že ho takmer prehlušilo praskanie sviečky.', 'The woman with a tiny child under her shirt refused the beer, but did not leave. Her voice so quiet the crackle of a candle nearly drowned it.'))
  await g.say('toru', l('„Pred časom, tu v meste. Tie prízraky nevyháňal. Rozprával sa s nimi. A oni ustúpili.“', '“Some time ago, here in the town. He did not drive the phantoms out. He talked with them. And they gave way.”'))
  g.set('c16.taleWoman')
  g.cinematic(false)
  await afterTale(g)
}

async function taleSayuri(g: GameAPI): Promise<void> {
  if (stage(g) !== 6 || !g.flag('c16.beer') || g.flag('c16.taleSayuri')) {
    await talkSayuri(g)
    return
  }
  g.cinematic(true)
  g.face('player', 'sayuri')
  await g.narrate(l('Sayuri pila studený čaj; sud odmietla jediným pohybom prstov. Nepozerala na Yeru, pozerala na stenu, za ktorou kedysi bol svet.', 'Sayuri drank cold tea; she had refused the barrel with a single movement of her fingers. She did not look at Yera; she looked at the wall beyond which the world used to be.'))
  await g.say('sayuri', l('Prišiel ako starý, zlomený muž. Odchádzal ako mladík.', 'He came as an old, broken man. He left as a young one.'))
  await g.narrate(l('Odpila si.', 'She sipped.'))
  await g.say('sayuri', l('Nespýtala som sa.', 'I did not ask.'))
  g.set('c16.taleSayuri')
  g.cinematic(false)
  await afterTale(g)
}

async function afterTale(g: GameAPI): Promise<void> {
  stageObjective(g)
  if (tales(g) < 3) return
  g.cinematic(true)
  await g.wait(500)
  await g.narrate(l('Celkom na konci, keď sud znel pri poklepaní dute a dav sa rozchádzal do tmy hangárov, prišiel Saburo.', 'At the very end, when the barrel rang hollow to a knock and the crowd scattered into the dark of the hangars, Saburo came.'))
  g.teleport('saburo', [23, 13])
  await g.walk('saburo', [24, 16])
  g.face('saburo', 'player')
  g.face('player', 'saburo')
  await g.say('saburo', l('Tami k nemu chodievala. Trénoval ju.', 'Tami used to go to him. He trained her.'), { mood: 'closed' })
  await g.narrate(l('Staroreč bez tlmočníka, lucídna, oči jasné a tvrdé.', 'Old Tongue without an interpreter, lucid, eyes clear and hard.'))
  await g.fade('black', 700)
  g.teleport('saburo', [2, 11])
  g.pose('saburo', 'sit')
  g.teleport('player', [4, 2], 0)
  g.pose('player', 'sit')
  await g.fade('clear', 800)
  await g.narrate(l('Yera nič z toho nepovedala. Sedela pri Tami, kým Tami spala, a skladala kúsky.', 'Yera said none of it aloud. She sat beside Tami while Tami slept, and put the pieces together.'))
  await g.say('player', l('Rennova smrť. Štvrtý príchod. Príchod Gōstara do Kitsune.', 'Renn’s death. The fourth coming. The Gōstar’s coming to Kitsune.'), { thought: true })
  await g.say('player', l('Nie náhoda.', 'Not chance.'), { thought: true, mood: 'determined' })
  g.codex('world.c16_gostar_tales')
  g.pose('player', 'stand')
  setStage(g, 7)
  await waterRunsOut(g)
}

// ------------------------------------------------------------------------- 7: the water
async function waterRunsOut(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.atmosphere(HALL_DAWN, 1200)
  await g.narrate(l('Kiri jej nosil vodu, ráno, každé ráno. Poznala jeho ťažký, presný krok ešte z Itaky. Starý muž s prešedivenými ušami a rukami, čo sa netriasli.', 'Kiri brought her water, in the morning, every morning. She knew his heavy, exact step from the Itaka. An old man with greying ears and hands that did not shake.'))
  g.teleport('kiri', [6, 4])
  await g.walk('kiri', [6, 2])
  g.face('kiri', 'player')
  await g.narrate(l('Položil plecháčik vedľa Yery, pozrel na Tami, nič nepovedal.', 'He set the cup down beside Yera, looked at Tami, said nothing.'))
  g.teleport('toru', [7, 4])
  await g.walk('toru', [6, 3])
  await g.narrate(l('Toru za ním, vždy za ním, tak ako na palube, druhý tieň. Priniesol chlieb a rozlámal ho na tri kusy: jeden Yere, jeden Tami, aj keď nejedla, tretí si nechal.', 'Toru behind him, always behind him, as on deck, a second shadow. He brought bread and broke it into three: one for Yera, one for Tami, though she did not eat, the third he kept.'))
  await g.caption(l('Voda na dva dni. Chlieb na menej.', 'Water for two days. Bread for less.'), { ms: 2600 })
  await g.narrate(l('Vzduch v trupe zatuchol kyslým pachom stoviek nevyčistených odevov a potu. Rebrá pod dlaňou vždy, keď sa oprela o hruď. Deti, čo sa prestali pýtať, kedy to skončí, lebo odpoveď bola v popraskaných perách dospelých.', 'The air in the hull went stale with the sour smell of hundreds of unwashed clothes and sweat. Ribs under her palm whenever she leaned on her chest. Children who had stopped asking when it would end, because the answer was in the cracked lips of the grown-ups.'))
  g.bark('ref3', l('Prečo sme ešte stále tu?', 'Why are we still here?'))
  await g.wait(900)
  g.bark('ref8', l('Koľko ešte?', 'How much longer?'))
  await g.wait(1400)
  g.face('kiri', [5, 2])
  await g.narrate(l('Kiri zdvihol Yerin prázdny plecháčik. Obrátil ho dnom nahor. Nevypadla z neho ani kvapka.', 'Kiri picked up Yera’s empty cup. He turned it upside down. Not a single drop fell out.'))
  g.propVisible('cup_up', false)
  g.propVisible('cup_down', true)
  g.set('c16.cupTurned')
  g.sfx('click', 0.5)
  g.face('kiri', 'saburo')
  await g.narrate(l('Oči mu zakĺzli k vysušeným deťom pri stenách, potom k Saburovi. Postavil sa.', 'His eyes slid to the parched children by the walls, then to Saburo. He stood up.'))
  await g.say('kiri', l('Jedlo a voda sú dole na námestí. Niekto po ne musí ísť.', 'There is food and water down in the square. Someone has to go for it.'), { mood: 'determined' })
  await g.narrate(l('Toru vedľa neho, rovnaká generácia, rovnaké jazvy, už stál.', 'Toru beside him, the same generation, the same scars, was already standing.'))
  await g.focus('saburo', { ms: 1000 })
  await g.narrate(l('Saburo sa na nich pozrel dlho, palica medzi kolenami. Prikývol.', 'Saburo looked at them for a long time, the cane between his knees. He nodded.'))
  const youngAt: Vec2[] = [
    [3, 11],
    [4, 11],
    [3, 12],
  ]
  youngAt.forEach((at, i) => {
    g.show(`young${i}`, true)
    void g.walk(`young${i}`, at)
  })
  await g.narrate(l('Traja mladší sa zdvihli mlčky.', 'Three younger ones rose in silence.'))
  g.follow()
  void g.walk('toru', [2, 10])
  await g.walk('kiri', [1, 9])
  g.face('kiri', 'player')
  await g.narrate(l('Kiri pri dverách, ruka na kolese zámku. Pozrel sa dozadu: na Yeru, na Tami pri stene, na Sabura v rohu.', 'Kiri at the door, hand on the lock wheel. He looked back: at Yera, at Tami by the wall, at Saburo in the corner.'))
  const c = await g.choose([
    { id: 'ask', text: l('„Vráťte sa, Kiri.“', '“Come back, Kiri.”') },
    { id: 'none', text: l('Nepovedať nič. Len sa dívať.', 'Say nothing. Only watch.') },
  ])
  if (c === 'ask') {
    await g.say('player', l('Vráťte sa, Kiri.', 'Come back, Kiri.'), { mood: 'sad' })
    await g.narrate(l('Prikývol. Raz. Tak, ako prikyvoval Saburovi na palube, keď nebolo o čom hovoriť.', 'He nodded. Once. The way he used to nod to Saburo on deck when there was nothing to discuss.'))
    g.set('c16.askedReturn')
  }
  g.sfx('door', 0.8)
  g.propVisible('gate_shut', false)
  g.propVisible('gate_open', true)
  g.flash('#dfe8ff', 500)
  await g.narrate(l('Potom otočil koleso. Dvere sa otvorili. Svetlo, studený vzduch, ostrý zápach po blesku.', 'Then he turned the wheel. The door opened. Light, cold air, the sharp smell of lightning.'))
  for (const id of ['kiri', 'toru', 'young0', 'young1', 'young2']) {
    void g.walk(id, [0, 9], { speed: 2 })
  }
  await g.wait(1800)
  for (const id of ['kiri', 'toru', 'young0', 'young1', 'young2']) g.show(id, false)
  g.sfx('door', 0.8)
  g.propVisible('gate_open', false)
  g.propVisible('gate_shut', true)
  await g.narrate(l('Vyšli a dvere sa zavreli.', 'They went out, and the door closed.'))
  await g.fade('black', 1400)
  await g.caption(l('Nevrátili sa.', 'They did not come back.'), { ms: 3200 })
  setStage(g, 8)
  await notBack(g)
}

// ------------------------------------------------------------------------- 8: not back
async function notBack(g: GameAPI): Promise<void> {
  await g.once('c16.notBack', async () => {
    g.cinematic(true)
    await g.atmosphere(HALL_DAWN, 0)
    g.teleport('player', [5, 1], 0)
    g.pose('player', 'sit')
    await g.fade('clear', 1200)
    await g.narrate(l('Ráno ju zobudilo ticho tam, kde mali byť kroky.', 'In the morning she was woken by silence where there should have been steps.'))
    await g.focus([5, 2], { ms: 1000, zoom: 1.5 })
    await g.narrate(l('Ťažký, presný krok, čo poznala z paluby, neprišiel. Plecháčik stál vedľa nej dnom nahor, tak ako ho Kiri včera obrátil, a nikto ho nenaplnil. Kov jej studil v dlani.', 'The heavy, exact step she knew from the deck did not come. The cup stood beside her upside down, just as Kiri had turned it yesterday, and no one had filled it. The metal was cold in her palm.'))
    await g.narrate(l('Chlieb nikto nerozlámal. Na doske pri stene ležal tretí kus, ten, čo si Toru vždy nechával; včera ho tam odložil a nevzal si ho.', 'No one had broken the bread. On the board by the wall lay the third piece, the one Toru always kept; yesterday he had set it down there and not taken it.'))
    g.follow()
    await g.zoom(1, 500)
    await g.narrate(l('Yera ho rozlomila na dve polovice a jednu položila Tami do lona. Tami sa naň pozrela, potom na dvere. Nejedla. Yera tú svoju zabalila späť.', 'Yera broke it into two halves and laid one in Tami’s lap. Tami looked at it, then at the door. She did not eat. Yera wrapped hers back up.'))
    await g.focus('saburo', { ms: 1000 })
    await g.narrate(l('Saburo sedel pri dverách s palicou medzi kolenami. Pri každom zvuku za pancierom, čo mohol byť krokom, zdvihol hlavu. Po trupe to hmatalo ďalej. Krok to nebol ani raz.', 'Saburo sat by the door with his cane between his knees. At every sound beyond the armour that could have been a step, he raised his head. The groping went on over the hull. Not once was it a step.'))
    g.follow()
    await g.caption(l('Yera čakala. Deň, dva.', 'Yera waited. A day, two.'), { sub: l('Na tretí šla hľadať.', 'On the third she went to search.'), ms: 3400 })
    g.pose('player', 'stand')
    g.cinematic(false)
    stageObjective(g)
    g.checkpoint()
  })
}

async function leaveToSearch(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.walk('player', [1, 9])
  g.face('player', [0, 9])
  g.face('saburo', 'player')
  await g.narrate(l('Saburo sa nepohol. Len palicu odložil z cesty, tak aby mohla prejsť.', 'Saburo did not move. He only moved his cane out of the way so she could pass.'))
  g.sfx('door', 0.8)
  g.propVisible('gate_shut', false)
  g.propVisible('gate_open', true)
  await g.narrate(l('Koleso zámku bolo studené. Otočila ho.', 'The lock wheel was cold. She turned it.'))
  g.cinematic(false)
  await g.goto('c16_town', 'gate')
}

// ------------------------------------------------------------------------- 9: "Let him in"
async function backFromSquare(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.face('player', 'saburo')
  await g.narrate(l('Kiri. Stará tvár. Prešedivené uši. Pery, čo sa mu nezachveli nad živou Tami.', 'Kiri. The old face. Greying ears. The lips that had not trembled over a living Tami.'))
  await g.say('player', l('Niekto musí ísť.', 'Someone has to go.'), { thought: true, mood: 'sad' })
  await g.wait(600)
  await g.narrate(l('Saburo sa na ňu nepozrel. Nie hneď.', 'Saburo did not look at her. Not at once.'))
  await g.focus('saburo', { ms: 1000, zoom: 1.4 })
  await g.narrate(l('Jeho zjazvená ruka na rukoväti palice zbledla, kĺby vystúpili pod pergamenovou kožou ako biele kamene v koryte rieky. Zovrel drevo tak prudko, až sa mu do dlane zaryli staré triesky, no nepovolil.', 'His scarred hand on the handle of the cane went pale, the knuckles standing out under the parchment skin like white stones in a riverbed. He gripped the wood so hard old splinters dug into his palm, and he did not let go.'))
  await g.narrate(l('Nasledoval zlomený, roztrasený nádych. Potom sa triaška zastavila. Až vtedy na ňu uprel oči. Boli jasné, bez sĺz a bez blúznenia.', 'There followed a broken, shaking breath. Then the trembling stopped. Only then did he fix his eyes on her. They were clear, without tears and without raving.'))
  await g.say('saburo', l('Sho… bál som sa ho.', 'Sho… I was afraid of him.'), { mood: 'sad' })
  await g.say('saburo', l('Všetci sme sa báli. Kiri… a Toru.', 'We were all afraid. Kiri… and Toru.'), { mood: 'sad' })
  await g.narrate(l('Druhé meno už takmer nebolo počuť.', 'The second name could barely be heard.'))
  await g.say('saburo', l('Ale nebáli sme sa preto, že by bol zlý.', 'But we were not afraid because he was evil.'))
  await g.say('saburo', l('Preto, že bol spravodlivý.', 'Because he was just.'), { mood: 'closed' })
  g.sfx('click', 0.6)
  await g.say('saburo', l('A spravodlivosť nemá nad starými pirátmi zľutovanie.', 'And justice has no mercy on old pirates.'))
  g.pose('saburo', 'stand')
  await g.narrate(l('Zdvihol sa. Pomaly. Kĺby praskali. Kolená sa triasli. Chrbticu napokon narovnal.', 'He got up. Slowly. His joints cracked. His knees shook. At last he straightened his spine.'))
  await g.say('saburo', l('Ak sa vráti.', 'If he returns.'), { mood: 'determined' })
  await g.say('saburo', l('Nechaj ho vojsť.', 'Let him in.'), { mood: 'determined' })
  g.pose('saburo', 'sit')
  await g.narrate(l('Sadol si. Pomaly. Ruka na palici, oči na dverách. Čakal.', 'He sat down. Slowly. Hand on the cane, eyes on the door. He waited.'))
  g.follow()
  await g.zoom(1, 500)
  g.cinematic(false)
  stageObjective(g)
  g.checkpoint()
}

async function healSaburo(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.face('player', 'saburo')
  g.pose('player', 'kneel')
  g.glyph('player', 2)
  for (let i = 0; i < 3; i++) {
    g.fx('heal', 'saburo')
    await g.wait(500)
  }
  await g.narrate(l('Yera do neho pustila Vodu, glyf za glyfom. Bolesť ustúpila.', 'Yera let the Water into him, glyph after glyph. The pain receded.'))
  g.glyph('player', 0.6)
  g.pose('player', 'stand')
  g.rel('saburo', 1)
  g.set('c16.saburoHealed')
  await g.wait(400)
  g.sfx('chime', 0.3)
  await g.narrate(l('Za stenou dielne bzučanie. Tenký, vysoký tón a pach živice. Sladkastý, dymový, aký Yera poznala z chrámových kadidiel, ale ostrejší. Felix pracoval.', 'Behind the workshop wall, a humming. A thin, high tone and the smell of resin. Sweetish, smoky, like the temple incense Yera knew, but sharper. Felix was working.'))
  g.cinematic(false)
  stageObjective(g)
  g.checkpoint()
}

// ------------------------------------------------------------------------- children in the light hour
let childTimer = 0
let palmTimer = 6

// ------------------------------------------------------------------------- scene
export const metaru: SceneDef = {
  id: 'c16_metaru',
  name: l('Železný chrám', 'The Iron Temple'),
  ambience: HALL_DAWN,
  camera: { zoom: 1 },
  map: HALL_MAP,
  props: [...ribs, ...pigeons, ...bedding, ...clutter],
  player: { character: 'c16_yera', at: [5, 1], facing: 0 },
  spawns: { wake: [5, 1], work_in: [27, 2], gate_in: [2, 9] },
  actors: [
    { id: 'tami', character: 'tami', at: [3, 1], pose: 'sit', facing: 0, talk: talkTami, label: l('Sadnúť si k nej', 'Sit with her') },
    { id: 'sayuri', character: 'sayuri', at: [7, 16], facing: 315, talk: talkSayuri },
    { id: 'saburo', character: 'saburo', at: [2, 11], pose: 'sit', facing: 45, talk: talkSaburo },
    { id: 'kiri', character: 'kiri', at: [3, 8], facing: 0, talk: talkKiri },
    { id: 'toru', character: 'toru', at: [4, 8], facing: 0, talk: talkToru },
    { id: 'young0', character: 'c16_young0', at: [6, 12], pose: 'sit', facing: 90 },
    { id: 'young1', character: 'c16_young1', at: [7, 13], pose: 'sit', facing: 180 },
    { id: 'young2', character: 'c16_young2', at: [5, 13], pose: 'sit', facing: 30 },
    { id: 'brewer', character: 'c16_brewer', at: [27, 16], facing: 225, talk: talkBrewer },
    { id: 'elder', character: 'c16_elder', at: [24, 16], pose: 'sit', facing: 45, talk: taleElder },
    { id: 'womanbaby', character: 'c16_womanbaby', at: [25, 18], facing: 135, talk: taleWoman },
    { id: 'mother', character: 'c16_mother', at: [4, 17], pose: 'lie', facing: 45 },
    { id: 'grey', character: 'c16_greywoman', at: [3, 17], pose: 'kneel', facing: 45 },
    { id: 'burned', character: 'c16_burned', at: [10, 12], pose: 'slump', facing: 0, talk: healBurned, label: l('Liečiť', 'Heal') },
    { id: 'rib', character: 'c16_rib', at: [12, 13], pose: 'lie', facing: 0, talk: healRib, label: l('Liečiť', 'Heal') },
    { id: 'child0', character: 'c16_child0', at: [14, 6], pose: 'sit', facing: 0 },
    { id: 'child1', character: 'c16_child1', at: [16, 7], pose: 'sit', facing: 200 },
    { id: 'child2', character: 'c16_child2', at: [19, 6], pose: 'sit', facing: 100 },
    { id: 'child3', character: 'c16_child3', at: [12, 16], pose: 'sit', facing: 300 },
    ...refugees,
  ],
  interactables: [
    {
      id: 'saburo_heal',
      at: [2, 11],
      label: l('Uľaviť mu Vodou', 'Ease him with Water'),
      verb: 'heal',
      radius: 1.8,
      when: (g) => stage(g) === 9 && !!g.flag('once.c16.letHimIn') && !g.flag('c16.saburoHealed'),
      run: healSaburo,
    },
    {
      id: 'gate',
      at: [1, 9],
      label: l('Koleso zámku', 'The lock wheel'),
      verb: 'open',
      radius: 1.6,
      when: (g) => stage(g) === 8,
      run: leaveToSearch,
    },
    {
      id: 'sayuri_tale',
      at: [23, 17],
      label: l('Sayuri pri sude', 'Sayuri by the barrel'),
      verb: 'talk',
      radius: 1.6,
      when: (g) => stage(g) === 6 && !!g.flag('c16.beer') && !g.flag('c16.taleSayuri'),
      run: taleSayuri,
    },
    {
      id: 'barrel',
      at: [26, 15],
      label: l('Posledný sud', 'The last barrel'),
      verb: 'use',
      radius: 1.8,
      when: (g) => stage(g) === 6 && !g.flag('c16.beer'),
      run: pourBeer,
    },
    {
      id: 'condensate',
      at: [9, 1],
      label: l('Kondenzát na stene', 'Condensation on the wall'),
      verb: 'look',
      when: (g) => stage(g) <= 2,
      once: true,
      run: async (g) => {
        await g.narrate(l('Po plechu stekali kvapky, rovnomerne, jedna za druhou. Deti ich zbierali do dlaní a olizovali. Kovová voda, teplá od tisícov dychov.', 'Drops ran down the plating, evenly, one after another. Children caught them in their palms and licked them. Metallic water, warm from thousands of breaths.'))
      },
    },
    {
      id: 'hull',
      at: [20, 1],
      label: l('Priložiť ucho k trupu', 'Put an ear to the hull'),
      verb: 'look',
      when: (g) => stage(g) <= 3,
      once: true,
      run: async (g) => {
        g.sfx('tick', 0.4)
        g.shake(0.03, 300)
        await g.narrate(l('Plech bol studený. A za ním, na hrúbku dlane, hmatanie. Bez ponáhľania. Bez hnevu. Ako keď niekto potme hľadá dvere vo vlastnom dome.', 'The metal was cold. And beyond it, a palm’s breadth away, the groping. Unhurried. Without anger. Like someone feeling for the door of their own house in the dark.'))
        g.codex('gloss.prizrak')
      },
    },
  ],
  triggers: [
    {
      id: 'tarp',
      area: [3, 16, 6, 19],
      when: (g) => stage(g) === 4,
      run: birth,
    },
  ],
  exits: [
    {
      area: [26, 1, 28, 2],
      to: 'c16_workshop',
      spawn: 'door',
      when: (g) => {
        const s = stage(g)
        return s === 1 || s === 2 || (s === 5 && !!g.flag('c16.tamiWord')) || (s === 9 && !!g.flag('c16.saburoHealed'))
      },
      blocked: l('Felix pracuje. Teraz nie.', 'Felix is working. Not now.'),
    },
  ],
  onEnter: async (g) => {
    applyStage(g)
    childTimer = 0
    palmTimer = 6
    if (!g.flag('c16.stage')) {
      g.set('c16.stage', 1)
      await wake(g)
      return
    }
    const s = stage(g)
    if (s === 2) await g.once('c16.days', () => fiveDays(g))
    else if (s === 3) await g.once('c16.healing', () => healingBegins(g))
    else if (s === 6) await g.once('c16.tamiBook', () => tamiBook(g))
    else if (s === 8) await notBack(g)
    else if (s === 9) await g.once('c16.letHimIn', () => backFromSquare(g))
    stageObjective(g)
  },
  onUpdate: (g, dt) => {
    // the phantom palms on the hull: now and then, a soft groping beyond the plating
    palmTimer -= dt
    if (palmTimer <= 0) {
      palmTimer = 8 + Math.random() * 9
      g.sfx('tick', 0.18)
    }
    // children play in the light hour
    if (stage(g) === 5) {
      childTimer -= dt
      if (childTimer <= 0) {
        childTimer = 2.5
        const k = Math.floor(Math.random() * 4)
        const id = `child${k}`
        const [x, y] = g.pos(id)
        const nx = Math.max(10, Math.min(24, x + Math.round((Math.random() - 0.5) * 6)))
        const ny = Math.max(5, Math.min(8, y + Math.round((Math.random() - 0.5) * 4)))
        g.pose(id, 'stand')
        void g.walk(id, [nx, ny], { speed: 2.2 })
      }
    }
  },
}
