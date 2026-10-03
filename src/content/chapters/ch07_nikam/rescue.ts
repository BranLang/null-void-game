/**
 * c7_rescue — Yera. The fighters burn on the clearing; three hundred
 * invisible steps through the camp (the veil hides her from eyes, not from
 * ears or hands), the ropes, the kiss, the escort north, the revolver on the
 * stump at step 215, and the run for the Itaka.
 */
import type { AmbienceDef, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l, type L } from '../../../i18n/i18n'
import { CAMP_MAP, TWIGS } from './maps'
import { campProps } from './campProps'
import { CAMP_NIGHT } from './camp'
import { exactPos, place } from './util'

const RESCUE: AmbienceDef = {
  ...CAMP_NIGHT,
  hemi: { sky: '#5a5a8a', ground: '#24140e', intensity: 0.9 },
  grade: { tint: '#ffe6d6', saturation: 0.86, contrast: 1.1, vignette: 0.5 },
  particles: [
    { kind: 'embers', area: [25, 8, 32, 21], count: 170, color: '#ff9a4a' },
    { kind: 'ash', area: [24, 8, 33, 22], count: 100, color: '#3a302c' },
    { kind: 'motes', count: 40, color: '#bcd0ff' },
  ],
  music: 'null_void',
  sounds: ['fire', 'night', 'crowd'],
}

type Stage = 'stealth' | 'free' | 'escort' | 'chase'

interface Guard {
  id: string
  home: Vec2
  look: Vec2
  patrol: boolean
}

const GUARDS: Guard[] = [
  { id: 'g1', home: [5, 13], look: [11, 13], patrol: true },
  { id: 'g2', home: [15, 19], look: [9, 18], patrol: false },
  { id: 'g3', home: [4, 21], look: [9, 21], patrol: true },
  { id: 'g4', home: [19, 15], look: [12, 15], patrol: false },
  { id: 'g5', home: [12, 11], look: [17, 11], patrol: true },
]

const PRISONERS = ['arkot', 'dara', 'yori', 'mech', 'load1', 'load2', 'flint']
const FREE_ORDER = ['dara', 'yori', 'mech', 'load1', 'load2']
const CHASERS = ['ch1', 'ch2', 'ch3']
const TWIG_SET = new Set(TWIGS.map(([x, y]) => `${x},${y}`))

const HEAR: L[] = [
  l('Hm? Kto je tam?', 'Hm? Who’s there?'),
  l('Čo to bolo?', 'What was that?'),
  l('Počul som niečo…', 'I heard something…'),
  l('Vylez, nech ťa vidím!', 'Come out where I can see you!'),
]

let tick = 0
let traveled = 0
let lastPos: Vec2 | null = null
let lastCell = ''
let steps = 0
let shownSteps = -1
let speedAcc = 0
let speedDist = 0
let noiseCd = 0
let failing = false
let barkT = 0
const busy = new Map<string, number>()

function stage(g: GameAPI): Stage {
  return (g.flag('c7r.stage') as Stage | undefined) ?? 'stealth'
}

function caught(g: GameAPI, text: L): void {
  if (failing) return
  failing = true
  g.dropVeil()
  g.sfx('alert')
  void g.fail(text)
}

function noise(g: GameAPI, at: Vec2, radius: number): void {
  let best: Guard | null = null
  let bd = Infinity
  for (const gu of GUARDS) {
    if (busy.has(gu.id)) continue
    const d = g.dist(gu.id, at)
    if (d < radius && d < bd) {
      best = gu
      bd = d
    }
  }
  if (!best) return
  busy.set(best.id, 4.5)
  g.emote(best.id, '?')
  g.bark(best.id, HEAR[Math.floor(Math.random() * HEAR.length)], 2200)
  void g.walk(best.id, at, { speed: 2.3 })
}

function stepHint(g: GameAPI): void {
  if (steps === shownSteps) return
  shownSteps = steps
  g.hint(l(`Krok ${steps} · V — závoj · pod závojom ťa nevidia, ale počujú a cítia`, `Step ${steps} · V — veil · veiled, they cannot see you, but they can hear and touch`))
}

/** Put everyone where the current stage needs them (also after a retry). */
function setupStage(g: GameAPI, s: Stage): void {
  if (s === 'stealth') {
    g.stealth(true)
    return
  }
  g.stealth(false)
  for (const id of GUARDS.map((x) => x.id)) g.show(id, false)
  g.costume('player', 'yera')
  if (s === 'free') {
    place(g, 'arkot', [12, 21], 'player', 'stand')
    place(g, 'flint', [13, 20], [16, 18], 'stand')
    g.costume('flint', 'c7_flint')
    return
  }
  if (s === 'escort') {
    for (const id of PRISONERS) g.pose(id, 'stand')
    const p = g.pos('player')
    PRISONERS.forEach((id, i) => g.teleport(id, [p[0] - 1 - (i % 3), p[1] + 1 + Math.floor(i / 3)]))
    for (const id of PRISONERS) g.companion(id, true)
    return
  }
  // chase
  g.costume('flint', 'flint')
  g.propVisible('stumpGun', false)
  g.propVisible('stumpEmpty', true)
  for (const id of ['o1', 'o2', 'o3']) g.pose(id, 'lie')
  const p = g.pos('player')
  PRISONERS.forEach((id, i) => {
    g.pose(id, 'stand')
    g.teleport(id, [p[0] - 1 + (i % 3), p[1] - 1 - Math.floor(i / 3)])
  })
  runNorth(g)
  spawnChasers(g)
  g.music('combat_epic_2', 600)
  g.objective(l('Bež na sever, k Itake!', 'Run north, to the Itaka!'))
  g.hint(l('Shift — beh. Nezastavuj.', 'Shift — run. Don’t stop.'))
}

function runNorth(g: GameAPI): void {
  const goals: Vec2[] = [[15, 0], [16, 0], [16, 1], [17, 1], [15, 2], [16, 2], [14, 3]]
  PRISONERS.forEach((id, i) => void g.walk(id, goals[i], { run: true, speed: id === 'mech' ? 3.6 : 4.2 }))
}

function spawnChasers(g: GameAPI): void {
  const at: Vec2[] = [[13, 15], [16, 14], [19, 13]]
  CHASERS.forEach((id, i) => {
    g.despawn(id)
    g.spawn({ id, character: `c7_pirate${i + 6}`, at: at[i], solid: false })
  })
}

async function cutArkot(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.stealth(false)
  g.objective(null)
  g.hint(null)
  g.set('c7r.stage', 'free')
  GUARDS.forEach((gu, i) => void g.walk(gu.id, [24 + (i % 2), 12 + i * 2], { run: true, speed: 4 }))
  g.bark('g2', l('Všetci k vakom! Hýbte sa!', 'Everyone to the bags! Move!'))
  await g.walk('player', [11, 21])
  g.face('player', 'arkot')
  g.pose('player', 'kneel')
  await g.focus('arkot', { ms: 700, zoom: 1.5 })
  await g.narrate(l('Tristo krokov. Arkot ležal na zemi s rukami zviazanými. Leopardie škvrny na krku neboli mŕtve ani sivé. V mesačnom svetle žiarili bronzovo.', 'Three hundred steps. Arkot lay on the ground with his hands bound. The leopard spots on his neck were neither dead nor grey. In the moonlight they shone bronze.'))
  await g.narrate(l('Pozeral sa na hviezdu nad hlavou a pery sa mu pohybovali bez hlasu. Živý.', 'He was looking at the star overhead and his lips moved without a sound. Alive.'))
  g.mood('arkot', 'surprised')
  await g.say('player', l('Ticho.', 'Quiet.'))
  g.sfx('click', 0.8)
  await g.say('player', l('Nehýb sa.', 'Don’t move.'))
  g.fx('burst', 'arkot', { color: '#d8c8a0' })
  g.sfx('crack', 0.4)
  await g.narrate(l('Krátka chrámová čepeľ prešla cez konopné vlákna jedným ťahom. Lano prasklo. Potom ďalšie, vedľa: Flintove ruky boli voľné.', 'The short temple blade went through the hemp fibres in a single stroke. The rope snapped. Then another, beside him: Flint’s hands were free.'))
  g.pose('arkot', 'kneel')
  g.pose('flint', 'kneel')
  g.face('flint', [16, 18])
  await g.narrate(l('A prvé, čo Flint urobil, ešte skôr než si pretrel zápästia, bol pohľad. Na stráž pri ohnisku. Na revolver v puzdre.', 'And the first thing Flint did, before he even rubbed his wrists, was look. At the guard by the fire. At the revolver in its holster.'))
  if (g.veiled()) g.dropVeil()
  g.fx('glyph', 'player', { color: '#b77dff', scale: 1.4 })
  g.pose('player', 'stand')
  g.pose('arkot', 'stand')
  g.face('arkot', 'player')
  await g.narrate(l('Vzduch sa jemne zvlnil, ako keď vietor pohne hladinou jazera. A pred Arkotom stálo dievča.', 'The air rippled softly, the way wind stirs the surface of a lake. And before Arkot stood a girl.'))
  await g.narrate(l('Vlasy odstrihnuté nad ramenami a starý kožený kabát s ťažkým kožušinovým golierom. Chrámové tetovania na predlaktiach a v tme modré oči. Yera.', 'Hair cut above the shoulders and an old leather coat with a heavy fur collar. Temple tattoos on her forearms and blue eyes in the dark. Yera.'))
  g.costume('player', 'yera')
  g.sfx('click', 0.5)
  await g.narrate(l('Skôr než stihol čokoľvek povedať, zahodila nôž do mokrého lístia.', 'Before he could say anything, she threw the knife into the wet leaves.'))
  g.pose('player', 'hug')
  g.pose('arkot', 'hug')
  g.mood('player', 'tender')
  g.mood('arkot', 'tender')
  await g.focus('player', { ms: 600, zoom: 1.75 })
  g.music('main', 1500)
  await g.narrate(l('Obe ruky mu vrazila do vlasov, hrubo si ho k sebe strhla a pobozkala ho. Zúfalo, mokro a špinavo.', 'She drove both hands into his hair, pulled him roughly to her and kissed him. Desperately, wetly, filthily.'))
  await g.narrate(l('Neplánovala to. Nebolo to v žiadnom pláne, ani Taminom, ani chrámovom. Stačil jeden pohľad a telo urobilo to, čo hlava celý mesiac nedovolila.', 'She had not planned it. It was in no plan, not Tami’s, not the temple’s. One look was enough, and her body did what her head had forbidden all month.'))
  await g.narrate(l('Jeho ruky ju objali a prsty sa zaborili do starej kože jej kabáta. Nebol tam priestor na ospravedlnenia ani na lúčenie spred mesiaca.', 'His arms closed around her and his fingers sank into the old leather of her coat. There was no room for apologies, nor for the farewell of a month ago.'))
  g.pose('player', 'stand')
  g.pose('arkot', 'stand')
  await g.say('player', l('Vstávaj.', 'Get up.'), { mood: 'tender' })
  await g.say('arkot', l('Pošli niekoho.', 'Send someone.'), { thought: true, mood: 'tender' })
  await g.narrate(l('Poslala.', 'She sent.'))
  g.rel('arkot', 1)
  await g.zoom(1.1, 700)
  g.follow()
  g.music('null_void', 1200)
  g.cinematic(false)
  g.objective(l('Prerež laná ostatným. Rýchlo, kým sú všetci pri ohni.', 'Cut the others’ ropes. Quickly, while everyone is at the fire.'))
  g.hint(l('E — prerezať lano', 'E — cut the rope'))
  g.checkpoint()
}

const FREED_LINES: Record<string, L> = {
  dara: l('Dara si uchopila rameno a s nemým prikývnutím odstúpila. Ani slovo.', 'Dara took hold of her shoulder and stepped back with a mute nod. Not a word.'),
  yori: l('Chlapec sa triasol, ale bol tichý. Keď mu Yera položila prst na pery, prikývol.', 'The boy was shaking, but he was quiet. When Yera laid a finger on his lips, he nodded.'),
  mech: l('Starý mechanik si pritlačil handru k ústam, aby kašeľ nepustil von.', 'The old mechanic pressed the rag to his mouth to keep the cough in.'),
  load1: l('Nakladač si pretrel zápästia a zatvoril oči, akoby sa modlil. Možno sa modlil.', 'The loader rubbed his wrists and closed his eyes as if he were praying. Perhaps he was.'),
  load2: l('Druhý nakladač vstal tak rýchlo, že sa takmer zrútil. Arkot ho chytil za lakeť.', 'The second loader got up so fast he nearly fell. Arkot caught his elbow.'),
}

function cutter(id: string, at: Vec2, label: L) {
  return {
    id: `cut_${id}`,
    at,
    label,
    verb: 'use' as const,
    radius: 1.7,
    when: (g: GameAPI) => stage(g) === 'free' && !g.flag(`c7r.freed.${id}`),
    run: async (g: GameAPI) => {
      g.set(`c7r.freed.${id}`)
      g.face('player', id)
      g.pose('player', 'kneel')
      g.sfx('crack', 0.35)
      g.fx('burst', id, { color: '#d8c8a0' })
      await g.wait(350)
      g.pose('player', 'stand')
      g.pose(id, 'stand')
      g.face(id, 'player')
      await g.narrate(FREED_LINES[id])
      if (FREE_ORDER.every((k) => g.flag(`c7r.freed.${k}`))) await allFree(g)
    },
  }
}

async function allFree(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.hint(null)
  g.objective(null)
  await g.say('player', l('Na sever. Tristo krokov. Itaka čaká nad poľanou.', 'North. Three hundred steps. The Itaka is waiting above the glade.'))
  await g.narrate(l('Tristo krokov. Arkot to prepočítal automaticky: navigátor nepočíta vzdialenosť, ale čas. Tristo krokov nočným lesom pre ôsmich, s krívajúcim mechanikom a chvejúcim sa chlapcom.', 'Three hundred steps. Arkot worked it out automatically: a navigator counts not distance but time. Three hundred steps through a night forest for eight, with a limping mechanic and a shivering boy.'))
  g.face('flint', 'player')
  await g.say('flint', l('Potrebujem zbraň.', 'I need a gun.'), { mood: 'determined' })
  await g.narrate(l('Prvé slová k záchrancom. Nie *kam ideme*. Nie *kto je s tebou*. Zbraň.', 'His first words to his rescuers. Not *where are we going*. Not *who’s with you*. A gun.'))
  const c = await g.choose([
    { id: 'no', text: l('„Nie. Ideme ticho. Žiadne zbrane.“', '“No. We go quietly. No guns.”') },
    { id: 'promise', text: l('„Flint. Sľúb mi to. Tristo krokov a nič viac.“', '“Flint. Promise me. Three hundred steps and nothing more.”') },
  ])
  if (c === 'no') {
    await g.say('player', l('Nie. Ideme ticho. Tristo krokov, potom sme na palube. Žiadne zbrane.', 'No. We go quietly. Three hundred steps, then we’re aboard. No guns.'))
  } else {
    await g.say('player', l('Flint. Sľúb mi to. Tristo krokov, potom sme na palube. Nič viac.', 'Flint. Promise me. Three hundred steps, then we’re aboard. Nothing more.'))
    g.rel('flint', 1)
  }
  g.face('flint', 'arkot')
  await g.wait(400)
  g.face('flint', 'player')
  await g.say('flint', l('Dobre.', 'All right.'))
  await g.narrate(l('Neklamal; Arkot mu to čítal z tváre. Problém nebol v tom, čo si Flint myslel. Problém bol v tom, čo Flint robil, keď prestal myslieť.', 'He was not lying; Arkot could read it in his face. The trouble was never what Flint thought. The trouble was what Flint did when he stopped thinking.'))
  g.set('c7r.stage', 'escort')
  for (const id of PRISONERS) g.companion(id, true)
  traveled = 0
  steps = 0
  shownSteps = -1
  lastPos = null
  g.cinematic(false)
  g.objective(l('Veď ich na sever, k poľane. Ticho.', 'Lead them north to the glade. Quietly.'))
  g.checkpoint()
}

async function step215(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.hint(null)
  g.objective(null)
  for (const id of PRISONERS) g.companion(id, false)
  g.teleport('player', [15, 10])
  g.face('player', [15, 8])
  const formation: Record<string, Vec2> = { arkot: [14, 11], dara: [13, 12], yori: [14, 12], mech: [13, 13], load1: [14, 13], load2: [15, 13], flint: [15, 12] }
  for (const id of PRISONERS) {
    g.teleport(id, formation[id])
    g.face(id, [15, 8])
  }
  await g.focus([17, 10], { ms: 900, zoom: 1.3 })
  await g.narrate(l('Sto krokov. Ticho. Dvesto. Ticho. Plán fungoval.', 'A hundred steps. Silence. Two hundred. Silence. The plan was working.'))
  await g.narrate(l('Na dvestopätnástom kroku narazili na malé ohnisko na okraji tábora. Dvaja piráti pri ňom: jeden spal na boku a druhý sedel a bubnoval prstami po kolene.', 'On the two hundred and fifteenth step they came upon a small fire at the edge of the camp. Two pirates beside it: one asleep on his side, the other sitting and drumming his fingers on his knee.'))
  await g.narrate(l('Yera ich obchádzala. Vľavo, v tieni stromov, obozretne. Dvadsať krokov a budú za nimi.', 'Yera led them around. To the left, in the shadow of the trees, carefully. Twenty steps and they would be past.'))
  await g.focus([18, 10], { ms: 700, zoom: 1.6 })
  await g.narrate(l('Na peňku pri ohnisku ležal revolver. Vedľa fľaše a rybích kostí. Len tak. Nikto ho nedržal. Nikto naň nepozeral.', 'On a stump beside the fire lay a revolver. Next to a bottle and fish bones. Just like that. No one was holding it. No one was looking at it.'))
  g.face('flint', [18, 10])
  await g.say('arkot', l('Nie. Nie, Flint, nie.', 'No. No, Flint, no.'), { thought: true, mood: 'fear' })
  await g.walk('flint', [17, 11], { speed: 1.8 })
  g.face('flint', [18, 10])
  g.pose('flint', 'crouch')
  await g.wait(400)
  g.propVisible('stumpGun', false)
  g.propVisible('stumpEmpty', true)
  g.costume('flint', 'flint')
  g.pose('flint', 'stand')
  await g.narrate(l('Tri pokojné, plynulé kroky. Nie útok. Sklonil sa a zdvihol revolver tak prirodzene, akoby dvíhal vlastnú vec zo stola.', 'Three calm, fluid steps. Not an attack. He bent and picked up the revolver as naturally as if he were lifting his own belongings from a table.'))
  await g.narrate(l('Zdvihol. Namieril. Strelil.', 'Raised. Aimed. Fired.'))
  g.face('flint', 'o2')
  g.pose('flint', 'point')
  g.sfx('shot')
  g.flash('#fff2c0', 200)
  g.pose('o2', 'lie')
  await g.wait(450)
  g.face('flint', 'o1')
  g.sfx('shot')
  g.flash('#fff2c0', 200)
  g.pose('o1', 'lie')
  await g.wait(450)
  g.face('flint', 'o3')
  g.sfx('shot')
  g.flash('#fff2c0', 200)
  g.pose('o3', 'lie')
  g.bark('o3', l('Áá—!', 'Aah—!'), 1200)
  await g.wait(600)
  g.sfx('click')
  await g.wait(350)
  g.sfx('click')
  g.pose('flint', 'stand')
  await g.narrate(l('Tri výstrely, traja muži na zemi. Klik. Prázdna komora. Klik. Prázdna. Tri z piatich. Nekontroloval.', 'Three shots, three men down. Click. An empty chamber. Click. Empty. Three of five. He hadn’t checked.'))
  if (g.veiled()) g.dropVeil()
  g.mood('player', 'blank')
  await g.focus('player', { ms: 600, zoom: 1.4 })
  await g.narrate(l('Yera stála za stromom, viditeľná a bledá. Nebol to hnev, ale niečo hlbšie: pochopenie, že ich plán je mŕtvy a niet cesty späť.', 'Yera stood behind a tree, visible and pale. It was not anger but something deeper: the understanding that their plan was dead and there was no way back.'))
  await g.narrate(l('Les sa prebudil.', 'The forest woke.'))
  g.sfx('alert')
  g.shake(0.15, 600)
  g.bark('player', l('…', '…'), 600)
  await g.narrate(l('Z druhej strany tábora iný zvuk: dva rytmy automatických pištolí, krátke presné dávky, a medzi nimi ťažšie rany starých karabín. *Ta-ta-ta-ta-ta.*', 'From the far side of the camp a different sound: two rhythms of automatic pistols, short precise bursts, and between them the heavier cracks of old carbines. *Ta-ta-ta-ta-ta.*'))
  for (let i = 0; i < 5; i++) {
    g.sfx('shot', 0.25)
    await g.wait(110)
  }
  g.mood('player', 'determined')
  await g.say('player', l('Bežte! Na sever! Bežte!', 'Run! North! Run!'), { mood: 'determined' })
  g.set('c7r.stage', 'chase')
  setupStage(g, 'chase')
  g.follow()
  await g.zoom(1, 400)
  g.cinematic(false)
  g.checkpoint()
}

const scene: SceneDef = {
  id: 'c7_rescue',
  name: l('Tristo krokov', 'Three Hundred Steps'),
  ambience: RESCUE,
  camera: { zoom: 1.05 },
  map: CAMP_MAP,
  player: { character: 'c7_yera_knife', at: [5, 6], facing: 0, abilities: ['veil', 'flow'] },
  stealth: { failText: l('Zbadali ju. Tristo krokov sa začína odznova.', 'They saw her. The three hundred steps begin again.') },
  actors: [
    // the prisoners under the shelter
    { id: 'arkot', character: 'arkot', at: [11, 20], pose: 'lie', solid: false },
    { id: 'flint', character: 'c7_flint', at: [12, 20], pose: 'lie', solid: false },
    { id: 'dara', character: 'dara', at: [10, 21], pose: 'sit', solid: false },
    { id: 'yori', character: 'yori', at: [9, 21], pose: 'sit', solid: false },
    { id: 'mech', character: 'c7_mechanic', at: [14, 21], pose: 'slump', solid: false },
    { id: 'load1', character: 'c7_loader1', at: [13, 21], pose: 'lie', solid: false },
    { id: 'load2', character: 'c7_loader2', at: [10, 22], pose: 'lie', solid: false },
    // the pirates who stayed behind
    { id: 'g1', character: 'c7_pirate1', at: [5, 13], guard: { patrol: [[5, 13], [11, 13], [11, 17], [5, 17]], pause: 1500, range: 5, fov: 75 } },
    { id: 'g2', character: 'c7_kicker', at: [15, 19], facing: 215, guard: { range: 6, fov: 70, sweep: 55 } },
    { id: 'g3', character: 'c7_pirate3', at: [4, 21], guard: { patrol: [[4, 21], [9, 19], [9, 24], [5, 24]], pause: 1800, range: 5, fov: 70 } },
    { id: 'g4', character: 'c7_pirate4', at: [19, 15], facing: 225, guard: { range: 6, fov: 65, sweep: 40 } },
    { id: 'g5', character: 'c7_pirate5', at: [12, 11], guard: { patrol: [[12, 11], [18, 11], [17, 13], [13, 13]], pause: 1300, range: 5, fov: 70 } },
    // the crowd fighting the fire on the clearing
    { id: 'f1', character: 'c7_scar', at: [25, 13], facing: 90 },
    { id: 'f2', character: 'c7_smoker', at: [26, 16], facing: 90 },
    { id: 'f3', character: 'c7_overseer', at: [25, 18], facing: 90 },
    { id: 'f4', character: 'c7_pirate2', at: [26, 21], facing: 45 },
    { id: 'f5', character: 'c7_pirate8', at: [31, 14], facing: 225 },
    // the small fire on the north edge
    { id: 'o1', character: 'c7_pirate6', at: [20, 9], pose: 'lie', facing: 0 },
    { id: 'o2', character: 'c7_pirate7', at: [20, 10], pose: 'sit', facing: 270 },
    { id: 'o3', character: 'c7_pirate9', at: [22, 10], facing: 270 },
  ],
  props: campProps(true),
  interactables: [
    {
      id: 'cut_arkot',
      at: [11, 20],
      label: l('Prerezať lano', 'Cut the rope'),
      verb: 'use',
      radius: 1.8,
      when: (g) => stage(g) === 'stealth',
      run: cutArkot,
    },
    cutter('dara', [10, 21], l('Prerezať Darino lano', 'Cut Dara’s rope')),
    cutter('yori', [9, 21], l('Prerezať chlapcovo lano', 'Cut the boy’s rope')),
    cutter('mech', [14, 21], l('Prerezať mechanikovo lano', 'Cut the mechanic’s rope')),
    cutter('load1', [13, 21], l('Prerezať nakladačovo lano', 'Cut the loader’s rope')),
    cutter('load2', [10, 22], l('Prerezať nakladačovo lano', 'Cut the loader’s rope')),
  ],
  triggers: [
    { id: 'step215', area: [13, 8, 17, 12], when: (g) => stage(g) === 'escort', run: step215 },
    {
      id: 'exit',
      area: [13, 0, 18, 2],
      when: (g) => stage(g) === 'chase',
      run: async (g) => {
        g.hint(null)
        await g.goto('c7_glade')
      },
    },
  ],
  onEnter: async (g) => {
    tick = 0
    traveled = 0
    lastPos = null
    lastCell = ''
    steps = 200
    shownSteps = -1
    speedAcc = 0
    speedDist = 0
    noiseCd = 0
    failing = false
    barkT = 3
    busy.clear()
    await g.once('c7r.intro', async () => {
      g.stealth(false)
      g.cinematic(true)
      await g.wait(400)
      await g.focus([27, 15], { ms: 10, zoom: 0.9 })
      await g.narrate(l('Plán bol jednoduchý. Tami ho nakreslila uhlíkom na navigačný stôl, nie atramentom: ak sa plán nedá vymazať, nie je to plán.', 'The plan was simple. Tami drew it in charcoal on the navigation table, not in ink: if a plan cannot be wiped away, it is not a plan.'))
      await g.narrate(l('Krok jeden: oheň. Tami, Kiri a Toru zapália stíhačky na mýtine. Vodíkové vaky, suchý les a jedna iskra.', 'Step one: fire. Tami, Kiri and Toru set the fighters on the clearing alight. Hydrogen bags, dry forest and a single spark.'))
      await g.narrate(l('Krok dva: Yera, neviditeľná, tristo krokov cez les k zajatcom a nožom cez laná. Krok tri: Itaka nad poľanou na severe, so Saburom pri kanóne.', 'Step two: Yera, invisible, three hundred steps through the forest to the prisoners, and a knife through the ropes. Step three: the Itaka above the glade to the north, with Saburo at the cannon.'))
      await g.say('tami', l('Pol hodiny po ohni. Nie skôr. Ak budeš pri lanách skôr, budú tam ešte oni.', 'Half an hour after the fire. Not sooner. If you reach the ropes sooner, they’ll still be there.'))
      await g.say('player', l('A ak to zlyhá?', 'And if it fails?'))
      await g.say('tami', l('Potom strieľam.', 'Then I shoot.'))
      await g.focus('player', { ms: 1400, zoom: 1.2 })
      await g.narrate(l('Noc, les a tristo krokov. Yera ich počítala v hlave: chrámová disciplína, kroky, nádychy, vzdialenosť. Čísla ukotvovali myseľ, keď sa telo chcelo rozpadnúť od strachu.', 'Night, forest and three hundred steps. Yera counted them in her head: temple discipline, steps, breaths, distance. Numbers anchored the mind when the body wanted to fall apart with fear.'))
      await g.narrate(l('Na dvestom kroku sa pred ňou vynoril tábor: ohniská, dym, zbrane a pach potu, lacného alkoholu a mokrého dreva.', 'On the two hundredth step the camp appeared before her: fires, smoke, weapons, and the smell of sweat, cheap spirits and wet wood.'))
      g.follow()
      await g.zoom(1.05, 500)
      g.cinematic(false)
    })
    const s = stage(g)
    if (s === 'stealth') {
      g.objective(l('Utkaj závoj a prejdi táborom k zajatcom pod prístreškom.', 'Weave the veil and cross the camp to the prisoners under the shelter.'))
      g.codex('gloss.haiku')
    }
    setupStage(g, s)
    if (s === 'free') {
      g.objective(l('Prerež laná ostatným. Rýchlo, kým sú všetci pri ohni.', 'Cut the others’ ropes. Quickly, while everyone is at the fire.'))
      for (const id of FREE_ORDER) if (g.flag(`c7r.freed.${id}`)) g.pose(id, 'stand')
    }
    if (s === 'escort') g.objective(l('Veď ich na sever, k poľane. Ticho.', 'Lead them north to the glade. Quietly.'))
    if (s === 'stealth') g.checkpoint()
  },
  onUpdate: (g, dt) => {
    const s = stage(g)
    if (s === 'stealth') {
      // the step counter, noise and touch
      const p = exactPos(g)
      if (lastPos) {
        const d = Math.hypot(p[0] - lastPos[0], p[1] - lastPos[1])
        if (d > 0.002 && d < 1) {
          traveled += d
          speedDist += d
        }
      }
      lastPos = p
      speedAcc += dt
      steps = 200 + Math.floor(traveled * 4.4)
      stepHint(g)
      const cell = g.pos('player')
      const key = `${cell[0]},${cell[1]}`
      if (key !== lastCell) {
        lastCell = key
        if (TWIG_SET.has(key)) {
          g.sfx('crack', 0.25)
          noise(g, cell, 5.5)
        }
      }
      noiseCd -= dt
      if (speedAcc >= 0.3) {
        const speed = speedDist / speedAcc
        speedAcc = 0
        speedDist = 0
        if (speed > 3.9 && noiseCd <= 0 && g.veiled()) {
          noiseCd = 0.8
          noise(g, cell, 3.6)
        }
      }
      for (const [id, tleft] of busy) {
        const left = tleft - dt
        if (left > 0) {
          busy.set(id, left)
          continue
        }
        busy.delete(id)
        const gu = GUARDS.find((x) => x.id === id)
        if (gu && !gu.patrol) {
          // come back to the post from behind, so the last step faces the old direction
          const dx = gu.look[0] - gu.home[0]
          const dy = gu.look[1] - gu.home[1]
          const n = Math.hypot(dx, dy) || 1
          const behind: Vec2 = [Math.round(gu.home[0] - dx / n), Math.round(gu.home[1] - dy / n)]
          void g.walk(id, behind, { speed: 1.8 }).then(() => g.walk(id, gu.home, { speed: 1.4 }))
        }
      }
      for (const gu of GUARDS) {
        if (g.dist(gu.id, 'player') < 0.8) {
          caught(g, l('Dotyk. Závoj je len šaty na niekom, koho drží cudzia ruka.', 'A touch. The veil is only clothing on someone a stranger’s hand is holding.'))
          return
        }
      }
      barkT -= dt
      if (barkT <= 0) {
        barkT = 4 + Math.random() * 3
        const lines: L[] = [
          l('Piesok! Nesieme piesok!', 'Sand! Bring sand!'),
          l('Kto strážil vaky?!', 'Who was guarding the bags?!'),
          l('Ustúpte, ide druhý!', 'Get back, the other one’s going!'),
          l('Vodu z potoka, rýchlo!', 'Water from the stream, quick!'),
        ]
        g.bark(['f1', 'f2', 'f3', 'f4', 'f5'][Math.floor(Math.random() * 5)], lines[Math.floor(Math.random() * lines.length)])
      }
      return
    }
    if (s === 'escort') {
      const p = exactPos(g)
      if (lastPos) {
        const d = Math.hypot(p[0] - lastPos[0], p[1] - lastPos[1])
        if (d > 0.002 && d < 1) traveled += d
      }
      lastPos = p
      steps = Math.min(214, Math.floor(traveled * 16))
      if (steps !== shownSteps && steps % 10 === 0) {
        shownSteps = steps
        g.hint(l(`Krok ${steps}`, `Step ${steps}`))
      }
      return
    }
    if (s === 'chase') {
      tick -= dt
      if (tick > 0) return
      tick = 0.3
      for (const id of CHASERS) {
        const d = g.dist(id, 'player')
        if (d < 0.95) {
          caught(g, l('Dobehli ich. Les sa zavrel ako päsť.', 'They caught up. The forest closed like a fist.'))
          return
        }
        if (d < 30) void g.walk(id, 'player', { run: true, speed: 3.7 })
      }
    }
  },
}

export default scene
