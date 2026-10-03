/**
 * The Itaka's hold: the crystals smoulder violet in green acid, Flint lowers
 * the last one, Tami cleans his hands. Then the evening by the fire in Renn's
 * hall: the double somersault goes into the ship's log.
 */
import type { AmbienceDef, MapDef, SceneDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { HALL_MAP, hallProps } from '../ch12_tma/manor'
import './props'

// ---------------------------------------------------------------------------------- hold
const HOLD: MapDef = {
  rows: [
    '##############',
    '#mmmmmmmmmmmmm',
    '#mmmmmmmmmmmmm',
    '#.............',
    '#.............',
    '#.............',
    '#.............',
    '#.............',
    '#.............',
    '#...........rr',
    '#...........rr',
  ],
  legend: {
    '#': { floor: 'metal', wall: 'iron', wallH: 2.6 },
    m: { floor: 'metal', tint: '#8a8e94' },
    '.': { floor: 'deck', tint: '#9a8a74' },
    r: { floor: 'deck', tint: '#7a6a58', tag: 'ramp' },
  },
}

const holdAmb: AmbienceDef = {
  sky: { top: '#0c0d12', bottom: '#1a1c24', stars: 0 },
  fog: { color: '#101218', near: 8, far: 26 },
  hemi: { sky: '#6a6e80', ground: '#1a1614', intensity: 0.62 },
  exposure: 1.0,
  bloom: { strength: 0.95, threshold: 0.7 },
  grade: { tint: '#eee4d8', saturation: 0.92, contrast: 1.08, vignette: 0.55 },
  particles: [{ kind: 'dust', count: 60, color: '#c8b8a0' }],
  music: null,
  sounds: ['rain', 'machine'],
}

export const itakaScene: SceneDef = {
  id: 'c10_itaka',
  name: l('Podpalubie Itaky', 'The Itaka’s Hold'),
  ambience: holdAmb,
  camera: { zoom: 1.25 },
  map: HOLD,
  props: [
    { type: 'boiler', at: [3, 1] },
    { type: 'pipe', at: [5, 1], params: { vertical: true } },
    { type: 'pipe', at: [8, 1], params: { vertical: true } },
    { type: 'pipe', at: [1, 4], rot: 90 },
    { type: 'ch10_jar', at: [10, 1] },
    { type: 'ch10_jar', at: [11, 1] },
    { type: 'ch10_jar', at: [12, 1], params: { crystals: 3 } },
    { type: 'ch10_jar', at: [7, 4], id: 'jar0', hidden: true },
    { type: 'ch10_jar', at: [7, 4], id: 'jar4', hidden: true, params: { crystals: 4 } },
    { type: 'ch10_jar', at: [7, 4], id: 'jar8', hidden: true, params: { crystals: 8 } },
    { type: 'ch10_jar', at: [7, 4], id: 'jar9', hidden: true, params: { crystals: 9 } },
    { type: 'workbench', at: [9, 3] },
    { type: 'lantern', at: [6, 3], params: { style: 'hanging' } },
    { type: 'crate', at: [2, 6], params: { stack: 2 } },
    { type: 'crate', at: [2, 7] },
    { type: 'barrel', at: [1, 8] },
    { type: 'barrel', at: [2, 9], params: { lying: true } },
    { type: 'rope_coil', at: [11, 6] },
    { type: 'gear', at: [4, 8] },
    { type: 'sack', at: [10, 8] },
  ],
  player: { character: 'flint', at: [12, 9], facing: 135 },
  actors: [{ id: 'tami', character: 'tami', at: [6, 5], facing: 45, solid: false }],
  interactables: [
    {
      id: 'jar',
      at: [7, 4],
      label: l('Spustiť posledný kryštál', 'Lower the last crystal'),
      verb: 'use',
      radius: 1.8,
      when: (g) => !!g.flag('c10.jarReady') && !g.flag('c10.lastCrystal'),
      run: async (g) => {
        g.set('c10.lastCrystal')
        g.cinematic(true)
        g.objective(null)
        await g.walk('player', [8, 5])
        g.face('player', [7, 4])
        await g.focus([7, 4], { ms: 700, zoom: 1.7 })
        await g.narrate(l('Rukoväte boli ešte teplé. Zovrel ich tak, ako ho to v ruinách naučila, a nad hladinou zaváhal. Ruky sa mu triasli.', 'The handles were still warm. He gripped them the way she had taught him in the ruins, and hesitated over the surface. His hands were shaking.'))
        g.sfx('water', 0.6)
        g.propVisible('jar8', false)
        g.propVisible('jar9', true)
        g.fx('glyph', [7, 4], { color: '#9a4aff', scale: 0.7 })
        await g.narrate(l('Spustil ho pomaly. Svetlo sa ponorilo a stlmilo k ostatným.', 'He lowered it slowly. The light sank and dimmed to join the others.'))
        await g.say('player', l('Obyčajný chlapec z Diss.', 'An ordinary boy from Diss.'), { thought: true })
        await g.narrate(l('Tami mu vzala kliešte a zavesila ich späť na hák, tam, kde viseli predtým. Potom si stiahla rukavice.', 'Tami took the pliers from him and hung them back on their hook, where they had hung before. Then she pulled off her gloves.'))
        await g.focus('player', { ms: 600, zoom: 1.45 })
        g.face('tami', 'player')
        g.face('player', 'tami')
        await g.say('tami', l('Ukáž ruky.', 'Show me your hands.'))
        await g.narrate(l('Natiahol ich dlaňami nahor. V odreninách piesok a lišajník. Tami odzátkovala čutoru a liala mu vodu do rán, pomaly, a špinu z nich vyberala nechtami, zrnko po zrnku; keď zasyčal, neospravedlnila sa.', 'He held them out, palms up. Sand and lichen in the scrapes. Tami uncorked her canteen and poured water into the wounds, slowly, picking the dirt out with her nails, grain by grain; when he hissed, she did not apologise.'))
        g.sfx('water', 0.4)
        await g.narrate(l('Na jej dlani, tesne pri jeho, sa belela stará jazva, tá, po ktorej v noci pri krbe prechádzala prstami.', 'On her palm, close beside his, an old scar showed white, the one she had stroked with her fingers by the fire in the night.'))
        const c = await g.choose([
          { id: 'ask', text: l('Spýtať sa na jazvu.', 'Ask about the scar.') },
          { id: 'no', text: l('Nechať to tak.', 'Leave it be.') },
        ])
        if (c === 'ask') {
          await g.narrate(l('Otázka mu prišla až na jazyk. Pozrel sa jej do tváre, na uši stočené dopredu, na sústredené čelo, a nechal ju tam.', 'The question came as far as his tongue. He looked at her face, at the ears turned forward, the frown of concentration, and left it there.'))
        } else {
          await g.narrate(l('Nespýtal sa na ňu.', 'He didn’t ask about it.'))
        }
        g.mood('tami', 'tender')
        await g.narrate(l('Keď skončila, jeho ruky ešte chvíľu držala vo svojich. Potom ich pustila. Uši mala dopredu.', 'When she was done, she held his hands in hers a little longer. Then she let go. Her ears were turned forward.'))
        await g.fade('black', 1500)
        await g.caption(l('K Rennovmu sídlu šli už za tmy.', 'They walked back to Renn’s house after dark.'), { ms: 2600 })
        await g.narrate(l('Okná svietili a spoza dverí sa niesol smiech. Bránka zaškrípala. Tentoraz sa nestrhol.', 'The windows were lit and laughter carried from behind the door. The little gate creaked. This time he didn’t flinch.'))
        g.cinematic(false)
        await g.goto('c10_hearth')
      },
    },
  ],
  onEnter: async (g) => {
    if (g.flag('c10.jarReady')) g.propVisible(g.flag('c10.lastCrystal') ? 'jar9' : 'jar8', true)
    await g.once('c10.itaka', async () => {
      g.cinematic(true)
      await g.wait(400)
      await g.narrate(l('Itaka stála vo svojom doku uprostred oválu, tmavá a tichá. V podpalubí pachlo olejom a štípalo v nose a kotol, ktorý inokedy bzučal, mlčal.', 'The Itaka stood in her dock in the middle of the oval, dark and quiet. Down in the hold it smelled of oil and stung the nose, and the boiler that usually hummed was silent.'))
      await g.walk('player', [8, 6])
      g.face('player', 'tami')
      await g.narrate(l('Na začiatku cesty tu za ňou zastal s ramenom v obväze a pýtal sa. Okuliare mala vtedy posunuté na čele a odbila ho.', 'At the start of the journey he had stopped behind her here, his arm in a sling, asking questions. She had her goggles pushed up on her forehead then, and she brushed him off.'))
      await g.walk('tami', [6, 4])
      g.face('tami', [7, 4])
      await g.narrate(l('Teraz si natiahla rukavice. Z tmy vytiahla jednu z hrubých sklenených nádob, zelenkastá kyselina sa v nej zavlnila, a kliešte vzala z háku.', 'Now she pulled on her gloves. Out of the dark she drew one of the thick glass jars, greenish acid rippling inside, and took the pliers from their hook.'))
      g.propVisible('jar0', true)
      g.sfx('click', 0.6)
      await g.focus([7, 4], { ms: 700, zoom: 1.6 })
      await g.narrate(l('Vak si od neho zobrala bez slova a kryštály spúšťala dnu po jednom; každý v nej stmavol do pomalého tlenia, fialový na dne ako žeravé drevo pod popolom.', 'She took the bag from him without a word and lowered the crystals in one by one; each darkened inside into a slow smoulder, violet at the bottom like embers under ash.'))
      g.take('crystal_bag')
      g.sfx('water', 0.5)
      g.propVisible('jar0', false)
      g.propVisible('jar4', true)
      await g.wait(900)
      g.sfx('water', 0.5)
      g.propVisible('jar4', false)
      g.propVisible('jar8', true)
      await g.wait(700)
      g.face('tami', 'player')
      await g.narrate(l('Posledný mu podala aj s kliešťami.', 'The last one she handed to him, pliers and all.'))
      g.set('c10.jarReady')
      await g.focus('player', { ms: 600, zoom: 1.25 })
      g.follow()
      g.cinematic(false)
      g.objective(l('Spusti posledný kryštál do kyseliny.', 'Lower the last crystal into the acid.'))
      g.checkpoint()
    })
  },
}

// ---------------------------------------------------------------------------------- hearth
const eveningAmb: AmbienceDef = {
  sky: { top: '#07070c', bottom: '#14121c', stars: 0 },
  fog: { color: '#120e10', near: 10, far: 32 },
  hemi: { sky: '#7a6a70', ground: '#2a1c16', intensity: 0.62 },
  exposure: 1.05,
  bloom: { strength: 0.9, threshold: 0.72 },
  grade: { tint: '#ffe8d4', saturation: 1.0, contrast: 1.06, vignette: 0.5 },
  particles: [{ kind: 'embers', count: 26, area: [5, 1, 9, 3] }],
  music: 'main',
  sounds: ['rain', 'fire'],
}

export const hearthScene: SceneDef = {
  id: 'c10_hearth',
  name: l('Pri krbe', 'By the Fire'),
  ambience: eveningAmb,
  camera: { zoom: 1.3 },
  map: HALL_MAP,
  props: hallProps('evening'),
  player: { character: 'flint', at: [5, 3], facing: 45 },
  actors: [
    { id: 'tami', character: 'tami', at: [5, 2], facing: 45, pose: 'sit' },
    { id: 'dara', character: 'dara', at: [10, 2], facing: 225, pose: 'sit' },
    { id: 'arkot', character: 'arkot', at: [10, 3], facing: 225, pose: 'sit' },
    { id: 'yera', character: 'yera', at: [10, 4], facing: 225, pose: 'sit' },
    { id: 'yori', character: 'yori', at: [8, 5], facing: 135 },
  ],
  onEnter: async (g) => {
    g.pose('player', 'sit')
    await g.once('c10.hearth', async () => {
      g.cinematic(true)
      await g.focus([7, 3], { ms: 10, zoom: 1.35 })
      await g.wait(600)
      await g.narrate(l('Večer, dom, krb.', 'Evening, the house, the fire.'))
      await g.narrate(l('Tami sedela na lavici pri krbe s hrnčekom piva a rozprávala. Flint vedľa nej, tak blízko ako v noci, len teraz boli všetci hore. Nikto to nekomentoval.', 'Tami sat on the bench by the fire with a mug of beer, talking. Flint beside her, as close as in the night, only now everyone was awake. Nobody remarked on it.'))
      g.face('tami', 'dara')
      await g.say('tami', l('…a ten koreň bol taký veľký,', '…and the root was this big,'), { mood: 'happy' })
      await g.say('tami', l('a Flint, paf, dole. A ja si hovorím, to je koniec, to je koniec, a on, dva premety, vstane, a beží ďalej, akoby sa nič nestalo…', 'and Flint, bam, down. And I’m thinking, that’s it, that’s the end, and he goes, two somersaults, gets up, and keeps running like nothing happened…'), { mood: 'happy' })
      g.mood('dara', 'happy')
      g.emote('dara', '♪')
      await g.narrate(l('Dara sa smiala, plným, otvoreným smiechom, čo jej naplnil celú tvár. Yori sa usmieval a Flintovi dolial čaj. Arkot potichu krútil hlavou, ale oči sa mu smiali.', 'Dara laughed, a full, open laugh that filled her whole face. Yori smiled and topped up Flint’s tea. Arkot shook his head quietly, but his eyes were laughing.'))
      void g.walk('yori', [6, 3])
      g.mood('arkot', 'happy')
      g.mood('yera', 'happy')
      await g.narrate(l('Pery si držal stisnuté, no uši sa mu sklopiť nedali.', 'He kept his lips pressed together, but his ears refused to flatten.'))
      await g.say('player', l('Nebol to premet. Bolo to taktické vyhýbanie sa prekážke.', 'It wasn’t a somersault. It was a tactical evasion of an obstacle.'))
      g.face('tami', 'player')
      await g.say('tami', l('Bol to premet. Dvojitý. Palubný denník to potvrdí.', 'It was a somersault. A double. The ship’s log will confirm it.'), { mood: 'happy' })
      await g.say('player', l('Premety sa do denníka nepíšu.', 'Somersaults don’t go in the log.'))
      await g.say('tami', l('Od dnes sa píšu.', 'As of today they do.'), { mood: 'happy' })
      g.emote('arkot', '♪')
      g.mood('player', 'happy')
      await g.narrate(l('Smiech. Praskanie dreva v krbe. Dážď na streche.', 'Laughter. The crackle of wood in the fire. Rain on the roof.'))
      await g.read(
        l('Palubný denník Itaky', 'The Itaka’s Log'),
        l(
          'Vonkajšie ruiny, západná štvrť. Za značky: dvaja.\n\nKryštály: osem čistých, jeden prasknutý (nepočíta sa).\nPozorovatelia: pozerali. Potom odišli.\nPotom búrka. So smerom.\n\nStraty: žiadne. Kolená a dlane posádky: odreté.\n\nFlint: dvojitý premet.\nPotvrdzujem.\n— T.',
          'Outer ruins, western quarter. Past the signs: two.\n\nCrystals: eight clean, one cracked (does not count).\nWatchers: watched. Then left.\nThen a storm. With a direction.\n\nLosses: none. Crew’s knees and palms: skinned.\n\nFlint: double somersault.\nConfirmed.\n— T.',
        ),
        { style: 'letter' },
      )
      await g.narrate(l('A Flint, s odreninami na dlaniach a krvou na kolenách, v dome mŕtveho muža, v meste plnom duchov, medzi priateľmi, čo mu neboli vždy priateľmi, si pomyslel, že v Beladisse nikdy nič nevoňalo tak dobre ako tento čaj.', 'And Flint, with scraped palms and blood on his knees, in a dead man’s house, in a city full of ghosts, among friends who had not always been his friends, thought that nothing in Beladiss had ever smelled as good as this tea.'))
      g.set('c10.done')
      await g.fade('black', 1800)
      await g.endChapter()
    })
  },
}
