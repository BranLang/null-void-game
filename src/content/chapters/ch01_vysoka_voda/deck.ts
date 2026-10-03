/**
 * c1_deck: the cargo deck of a freight airship over the bay, at sunset.
 * Arkot sits at the loading gap with his legs over the drop and counts.
 * Exploring the deck brings back his mother's last sentence; at dusk the old
 * loader lets the two from Diss into the cabin. After the eclipse the scene
 * returns at night: lying on the sacks, "Forty-one."
 */
import type { AmbienceDef, SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'

export const deckDusk: AmbienceDef = {
  sky: { top: '#283461', bottom: '#f0a070', stars: 0.15, sai: { x: 0.84, y: 0.74, r: 0.075 }, clouds: 0.9 },
  fog: { color: '#d89a7c', near: 14, far: 48 },
  hemi: { sky: '#b0a8d8', ground: '#7a5a50', intensity: 1.25 },
  sun: { color: '#ffb27a', intensity: 2.0, dir: [-0.6, 0.48, 0.65] },
  exposure: 1.05,
  bloom: { strength: 0.75, radius: 0.55, threshold: 0.8 },
  grade: { tint: '#ffe8d8', saturation: 1.02, contrast: 1.05, vignette: 0.32 },
  particles: [
    { kind: 'clouds', count: 34, color: '#f0c8b0' },
    { kind: 'motes', count: 40, color: '#ffd8a8' },
  ],
  music: 'medley',
  sounds: ['wind'],
}

const deckLate: Partial<AmbienceDef> = {
  sky: { top: '#141a36', bottom: '#6a4a68', stars: 0.5, sai: { x: 0.84, y: 0.74, r: 0.075 }, clouds: 0.7 },
  fog: { color: '#3a3050', near: 12, far: 44 },
  hemi: { sky: '#6a70a8', ground: '#2a2230', intensity: 0.9 },
  sun: { color: '#ffc896', intensity: 0.85, dir: [0.5, 0.6, -0.4] },
  grade: { tint: '#e8e4ff', saturation: 0.92, contrast: 1.06, vignette: 0.4 },
}

const deckNight: Partial<AmbienceDef> = {
  sky: { top: '#04060e', bottom: '#151a2e', stars: 0.85, sai: { x: 0.8, y: 0.8, r: 0.075 }, clouds: 0.5 },
  fog: { color: '#0c1020', near: 10, far: 40 },
  hemi: { sky: '#5868a0', ground: '#14121c', intensity: 0.85 },
  sun: { color: '#ffd09a', intensity: 0.9, dir: [0.5, 0.75, -0.3] },
  bloom: { strength: 0.9, radius: 0.55, threshold: 0.78 },
  grade: { tint: '#dfe6ff', saturation: 0.86, contrast: 1.06, vignette: 0.45 },
  music: null,
  sounds: ['wind', 'night'],
}

/** distinct things looked at on the deck */
function note(g: GameAPI, key: string): void {
  if (g.flag(`c1.saw.${key}`)) return
  g.set(`c1.saw.${key}`)
  g.inc('c1.looked')
}

async function duskIfReady(g: GameAPI): Promise<void> {
  if (g.flag('c1.dusk') || !g.flag('c1.mother') || Number(g.flag('c1.looked') ?? 0) < 3) return
  g.set('c1.dusk')
  g.cinematic(true)
  void g.atmosphere(deckLate, 3500)
  await g.wait(900)
  await g.narrate(l('Slnko zapadlo za mraky pod nimi a zlato sa z obalu stiahlo ako voda z piesku.', 'The sun sank into the clouds below them, and the gold drained off the envelope like water into sand.'))
  await g.narrate(l('Po západe ťahalo na nákladnej palube tak, že starý nakladač prestal predstierať, že tých dvoch z Diss nevidí.', 'After sundown the wind dragged across the cargo deck so hard that the old loader stopped pretending not to see the two from Diss.'))
  await g.walk('loader', [9, 7])
  g.face('loader', 'player')
  await g.focus('loader', { ms: 700 })
  g.emote('loader', '…')
  await g.narrate(l('Kývol bradou k dvierkam kajuty a vošiel prvý.', 'He jerked his chin at the cabin hatch and went in first.'))
  await g.walk('loader', [8, 6])
  g.show('loader', false)
  g.sfx('door', 0.6)
  g.pose('flint', 'stand')
  g.teleport('flint', [12, 9], 45)
  g.bark('flint', l('Teplo? Konečne.', 'Warmth? At last.'))
  void g.walk('boy', [8, 6]).then(() => g.show('boy', false))
  await g.walk('flint', [8, 6])
  g.show('flint', false)
  g.follow()
  g.cinematic(false)
  g.objective(l('Vojdi do kajuty.', 'Go into the cabin.'))
  g.checkpoint()
}

/** re-derive the deck after dusk when the scene is loaded again */
function applyAfterDusk(g: GameAPI): void {
  for (const a of ['loader', 'boy', 'flint']) g.show(a, false)
}

async function nightScene(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.atmosphere(deckNight, 0)
  for (const a of ['loader', 'boy']) g.show(a, false)
  g.show('flint', true)
  g.teleport('flint', [12, 8], 90)
  g.pose('flint', 'lie')
  g.teleport('player', [14, 8], 90)
  g.pose('player', 'lie')
  await g.focus([13, 8], { ms: 10, zoom: 1.15 })
  await g.wait(900)
  await g.narrate(l('Ležali vonku na vreciach pod obalom, ktorý nad nimi potichu vŕzgal v lanách. Oko bolo zase otvorené, jantárové.', 'They lay outside on the sacks beneath the envelope, which creaked softly above them in its ropes. The Eye was open again, amber.'))
  await g.say('flint', l('Hej.', 'Hey.'))
  await g.say('player', l('Hm.', 'Hm.'))
  await g.say('flint', l('Štyridsaťjeden.', 'Forty-one.'), { mood: 'happy' })
  await g.narrate(l('Krátko sa zasmial nosom.', 'He laughed briefly through his nose.'))
  await g.say('flint', l('Vedel si to, alebo si hádal?', 'Did you know, or did you guess?'))
  const c = await g.choose([
    { id: 'quiet', text: l('(Mlčať.)', '(Say nothing.)') },
    { id: 'counted', text: l('„Rátal som.“', '“I counted.”') },
    { id: 'guessed', text: l('„Hádal som.“', '“I guessed.”') },
  ])
  if (c === 'quiet') {
    await g.narrate(l('Arkot neodpovedal.', 'Arkot did not answer.'))
  } else if (c === 'counted') {
    await g.say('flint', l('Jasné. Ty vždy rátaš. Raz mi zrátaš aj to, koľko mi ostáva.', 'Sure. You always count. One day you’ll count how much I’ve got left, too.'), { mood: 'happy' })
  } else {
    await g.say('flint', l('Klamár. Ty si v živote nič nehádal.', 'Liar. You’ve never guessed anything in your life.'), { mood: 'happy' })
  }
  await g.wait(600)
  await g.say('flint', l('Tá Eltária. Tú by som chcel vidieť. Tú, čo vie všetko.', 'That Eltária. I’d like to see her. The one who knows everything.'), { mood: 'tender' })
  await g.narrate(l('Neodpovedal ani na to. Ležal na chrbte a rátal hviezdy, kým ich Oko nezmylo.', 'He didn’t answer that either. He lay on his back and counted the stars until the Eye washed them away.'))
  g.set('c1.nightDone')
  await g.fade('black', 1600)
  await g.caption(l('Ráno pred pristátím', 'The morning before landing'), { ms: 2600 })
  g.cinematic(false)
  await g.goto('c1_bay')
}

export const deck: SceneDef = {
  id: 'c1_deck',
  name: l('Nákladná paluba', 'The Cargo Deck'),
  ambience: deckDusk,
  camera: { zoom: 1.05 },
  map: {
    rows: [
      '                              ',
      '   BBBBBBBBBBBBBBBBBBBBBB     ',
      '   B..KKKKK...cccc..x...B     ',
      '   B..KKKKK...ccc....x..B     ',
      '   B..KKKKK.............B     ',
      '   B..KKKKK.........,...B     ',
      '   B........,,..........B     ',
      '   B....................B     ',
      '   B.,,...........,,....B     ',
      '   B.......,............B     ',
      '   BBBBBBBBBBBB__BBBBBBBB     ',
      '                              ',
    ],
    legend: {
      B: { floor: 'deck', h: 1, tint: '#f2e2cc', wall: 'plank', wallH: 0.55 },
      '.': { floor: 'deck', h: 1, tint: '#f2e2cc' },
      ',': { floor: 'deck', h: 1, tint: '#dccab0' },
      K: { floor: 'deck', h: 1, wall: 'wood', wallH: 1.9 },
      c: { floor: 'deck', h: 1, tint: '#f2e2cc', prop: { type: 'c1_cargo' } },
      x: { floor: 'deck', h: 1, tint: '#f2e2cc', prop: { type: 'crate', params: { stack: 2 } } },
      _: { floor: 'deck', h: 1, tint: '#f2e2cc', tag: 'gap' },
    },
  },
  props: [
    { type: 'c1_envelope', at: [14, 4], y: 11.5, params: { len: 26, w: 6, drop: 11.5, zf: 3, zn: 6 } },
    { type: 'c1_prow', at: [25, 5], offset: [-0.5, 0.5], params: { len: 5.2, half: 5, top: 0.8 } },
    { type: 'c1_keel', at: [13, 5], offset: [0.5, 0.5], y: -0.5, params: { len: 22, half: 5, depth: 1.4 } },
    { type: 'door', at: [8, 6], solid: false, params: { style: 'wood' } },
    { type: 'window', at: [6, 6], color: '#c8ffd6', params: { light: true } },
    { type: 'window', at: [10, 6], color: '#c8ffd6' },
    { type: 'window', at: [11, 3], rot: 90, color: '#c8ffd6' },
    { type: 'propeller', at: [2, 3], rot: -90, params: { speed: 7 } },
    { type: 'propeller', at: [2, 8], rot: -90, params: { speed: -7 } },
    { type: 'c1_winch', at: [22, 5], rot: 90 },
    { type: 'sack', at: [15, 9], params: { count: 2 } },
    { type: 'sack', at: [16, 9], color: '#6a5444', params: { count: 1 } },
    { type: 'sack', at: [4, 8], color: '#9a8a6a', params: { count: 3 } },
    { type: 'sack', at: [5, 9], color: '#9a8a6a', params: { count: 2 } },
    { type: 'sack', at: [13, 9], params: { count: 1 } },
    { type: 'c1_cargo', at: [12, 7] },
    { type: 'rope_coil', at: [12, 2] },
    { type: 'rope_coil', at: [20, 9] },
    { type: 'rope_coil', at: [5, 6] },
    { type: 'barrel', at: [18, 2] },
    { type: 'barrel', at: [19, 2] },
    { type: 'barrel', at: [18, 9], params: { lying: true } },
    { type: 'c1_flower_jar', at: [18, 2], y: 0.95 },
    { type: 'c1_flower_jar', at: [7, 6] },
    { type: 'c1_ledger', at: [18, 4] },
    { type: 'crate', at: [22, 8] },
    { type: 'crate', at: [23, 8], params: { stack: 2 } },
    { type: 'anchor', at: [23, 6], rot: 90 },
  ],
  player: { character: 'arkot', at: [15, 10], facing: 315 },
  spawns: { door: [8, 7], sacks: [14, 8] },
  actors: [
    {
      id: 'flint',
      character: 'flint',
      at: [12, 9],
      facing: 90,
      pose: 'lie',
      label: l('Pozrieť sa na', 'Look at'),
      talk: async (g) => {
        await g.narrate(l('Spal s rukou na opasku. Keby ho niekto zobudil zle, ruka by sa zobudila skôr než on.', 'He slept with his hand on his belt. If anyone woke him the wrong way, the hand would wake before he did.'))
        const c = await g.choose([
          { id: 'let', text: l('Nechať ho spať.', 'Let him sleep.') },
          { id: 'nudge', text: l('Drgnúť ho do topánky.', 'Nudge his boot.') },
        ])
        if (c === 'let') {
          await g.narrate(l('Arkot ho nebudil.', 'Arkot did not wake him.'))
        } else {
          g.emote('flint', '💢')
          await g.say('flint', l('Ak to nie je Nyau, braček, tak to počká.', 'If that isn’t Nyau, brother, it can wait.'), { mood: 'closed' })
          await g.narrate(l('Klobúk sa ani nepohol. Ruka na opasku áno.', 'The hat didn’t even move. The hand on his belt did.'))
        }
        note(g, 'flint')
        await duskIfReady(g)
      },
    },
    {
      id: 'loader',
      character: 'loader',
      at: [21, 6],
      facing: 225,
      talk: async (g) => {
        await g.narrate(l('Starý nakladač pri navijaku. Uši mal na okrajoch dodraté, obhryzené rokmi vetra.', 'The old loader at the winch. The rims of his ears were frayed, gnawed by years of wind.'))
        await g.say('loader', l('Sadni si niekam, kde nezavadziaš.', 'Sit somewhere you’re not in the way.'))
        await g.narrate(l('Na dvoch z Diss sa celý deň pozeral tak, akoby boli vrecia, ktoré tam nemali byť.', 'All day he had looked at the two from Diss as if they were sacks that shouldn’t be there.'))
        note(g, 'loader')
        await duskIfReady(g)
      },
    },
    {
      id: 'boy',
      character: 'ballast_boy',
      at: [6, 8],
      facing: 0,
      talk: async (g) => {
        await g.narrate(l('Chalan od balastu, najmladší z posádky. Nyauan, ešte s detskou okrúhlosťou v lícach. Presúval vrecia s pieskom, aby loď neťahala na jednu stranu.', 'The ballast boy, the youngest of the crew. A Nyauan, still round-cheeked as a child. He was shifting sandbags so the ship would not list.'))
        await g.say('boy', l('Večer mi tvoj kamarát dá odvetu, Dissan. Kocky sa obrátia.', 'Tonight your friend gives me my revenge, Dissan. The dice will turn.'), { mood: 'determined' })
        await g.say('player', l('Kocky sa u Flinta neobracajú.', 'Dice don’t turn for Flint.'), { thought: true })
        note(g, 'boy')
        await duskIfReady(g)
      },
    },
  ],
  interactables: [
    {
      id: 'edge',
      at: [16, 10],
      label: l('Okraj paluby', 'The edge of the deck'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Pod podrážkami sa mu prevaľoval záliv. Tieň gondoly kĺzal po vode, tmavý ovál na zlatom plechu.', 'Beneath his soles the bay rolled. The gondola’s shadow slid over the water, a dark oval on beaten gold.'))
        await g.say('player', l('Rýchlosť tieňa po vode. Uhol, o ktorý sa za hodinu posunul okraj mraku. Dych medzi dvoma nárazmi vetra do plachtoviny.', 'The speed of the shadow on the water. The angle the cloud’s edge has moved in an hour. The breath between two gusts against the canvas.'), { thought: true })
        await g.narrate(l('Rátal. Nechcel, ale rátal. Otec ho to naučil skôr, než ho naučil čítať, a potom odišiel a nechal mu to v rukách namiesto seba.', 'He counted. He did not want to, but he counted. His father had taught him that before he taught him to read, and then he left, and left it in his hands instead of himself.'))
        await g.narrate(l('Že odišiel, a nie utonul, sa dozvedel až v Tai. Dovtedy ho vzalo more; tak to hovorila matka, po nej susedky a napokon aj on.', 'That his father had left rather than drowned, he learned only in Tai. Until then the sea had taken him; so his mother said, and the neighbours after her, and in the end he did too.'))
        await g.narrate(l('Potom si k nemu v krčme pod terasami prisadol starý aeronaut a dlho mu hľadel do tváre. Také oči už raz videl, povedal. Na vzletisku, v noci, nad jedným batohom.', 'Then an old aeronaut sat down beside him in the tavern under the terraces and looked into his face for a long time. He had seen eyes like those once before, he said. At the airfield, at night, over a single pack.'))
        await g.say('player', l('Nazajtra vraj bola preč vzducholoď. A s ňou aj ten, čo mal tie oči.', 'The next day, he said, an airship was gone. And with it the man who had those eyes.'), { thought: true, mood: 'closed' })
        note(g, 'edge')
        await duskIfReady(g)
      },
    },
    {
      id: 'pack',
      at: [16, 9],
      label: l('Batoh', 'The pack'),
      verb: 'look',
      run: async (g) => {
        g.cinematic(true)
        await g.narrate(l('Batoh bol ľahký. Do Diss sa nevracal nič, čo by doň stálo za to dať.', 'The pack was light. Nothing worth putting in it had ever come back to Diss.'))
        await g.fade('black', 700)
        await g.narrate(l('Matka stála vo dverách z tmavého dreva s vyhrnutými rukávmi. Leopardie škvrny na predlaktiach mala vyblednuté do farby starého vosku a v ruke držala nôž, ktorým čistila rybu.', 'His mother stood in the dark wooden doorway with her sleeves rolled up. The leopard spots on her forearms had faded to the colour of old wax, and in her hand she held the knife she was gutting a fish with.'))
        await g.narrate(l('Aj keď kričala, ruky pokračovali. To bola celá ona. Kričala a čistila rybu.', 'Even while she shouted, her hands kept working. That was all of her. She shouted and gutted the fish.'))
        await g.narrate(l('Ona hovorila o zime, o tom, kto jej bude nosiť vodu. On o tom, že v Diss nikdy nič nebude vlastniť. Bola to pravda, a práve preto to znelo ako výhovorka.', 'She spoke of winter, of who would carry her water. He spoke of never owning anything in Diss. It was true, and that was exactly why it sounded like an excuse.'))
        await g.narrate(l('Ani raz nepovedala slovo otec. A potom prestala kričať, čo bolo horšie.', 'Not once did she say the word father. And then she stopped shouting, which was worse.'))
        await g.say('c1_mother', l('Tak choď. Choď a nájdi si to svoje šťastie.', 'Then go. Go and find that luck of yours.'), { mood: 'closed' })
        await g.narrate(l('Bolo to posledné, čo mu povedala. Nezavrela dvere. Keď sa naposledy obzrel zo schodov, dvere boli otvorené a v nich nikto.', 'It was the last thing she ever said to him. She did not close the door. When he looked back from the stairs for the last time, the door stood open and no one was in it.'))
        await g.fade('clear', 900)
        await g.narrate(l('Muž si vyberá, čo si z takej vety vezme na cestu. Arkot mal pred sebou more a nič iné do batoha, tak si vzal to lepšie.', 'A man chooses what he takes from a sentence like that for the road. Arkot had the sea before him and nothing else for the pack, so he took the better part.'))
        g.cinematic(false)
        g.set('c1.mother')
        g.codex('people.arkot')
        note(g, 'pack')
        await duskIfReady(g)
      },
    },
    {
      id: 'sack',
      at: [15, 9],
      label: l('Vrece, ktoré tam nemalo byť', 'A sack that shouldn’t be here'),
      run: async (g) => {
        await g.narrate(l('Vrece, o ktoré sa celý deň opieral chrbtom, tam nemalo byť. Nikto ho nešiel prekladať, lebo vrecia sa prekladajú, keď je čas, a čas bol až v Nyau.', 'The sack he had leaned his back against all day should not have been there. Nobody went to move it, because sacks get moved when it is time, and the time was not until Nyau.'))
        await g.narrate(l('Tri prekládky a jeden týždeň v skladisku medzi vrecami s kukuricou. Kukuricu už poznal po vôni aj potme.', 'Three changes and a week in a hold among sacks of corn. By now he knew corn by its smell, even in the dark.'))
        note(g, 'sack')
        await duskIfReady(g)
      },
    },
    {
      id: 'ledger',
      at: [18, 4],
      label: l('Kniha nákladu', 'The cargo ledger'),
      verb: 'read',
      run: async (g) => {
        await g.read(
          l('Kniha nákladu', 'The cargo ledger'),
          l(
            'Kukurica, 40 vriec. Etanol, 6 sudov. Rezané kvety z Nyau, 3 sklenice.\n\nCestujúci:\nArkot, Diss — 1\nFlint, Diss — 1\n\n*Meno a číslo, jedno pod druhé, úhľadným písmom ženy, ktorá v živote nič neprečiarkla.*',
            'Corn, 40 sacks. Ethanol, 6 casks. Cut flowers from Nyau, 3 jars.\n\nPassengers:\nArkot, Diss — 1\nFlint, Diss — 1\n\n*Name and number, one under the other, in the neat hand of a woman who has never crossed anything out.*',
          ),
          { style: 'letter' },
        )
        await g.narrate(l('Pri nastupovaní zapisovala dama od váhy, tak ju Arkot volal v duchu, po beladissky. Kým písala, stáli obaja s bradou dole, ako sa v Diss stojí pred váhou.', 'At boarding the scale-woman had written them in — *dama*, Arkot called her in his head, the Beladiss way. While she wrote, they had both stood with their chins down, the way one stands before the scales in Diss.'))
        g.codex('gloss.dama')
        g.codex('world.beladiss')
        note(g, 'ledger')
        await duskIfReady(g)
      },
    },
    {
      id: 'envelope',
      at: [12, 6],
      label: l('Obal nad hlavou', 'The envelope overhead'),
      verb: 'look',
      run: async (g) => {
        await g.focus([10, 1], { ms: 900, zoom: 0.8 })
        await g.narrate(l('Nad nimi sa napínal obal plný vodíka a potichu vŕzgal v lanách, dlhý ako ulica v Diss.', 'Above them the envelope full of hydrogen strained and creaked softly in its ropes, as long as a street in Diss.'))
        await g.narrate(l('Pod obalom plným plynu sa oheň nezakladal, ani v lampe. Svietili len rezané kvety z Nyau.', 'Under an envelope full of gas no one lit a fire, not even in a lamp. Only cut flowers from Nyau gave light.'))
        g.codex('gloss.hydrak')
        g.follow()
        await g.zoom(1.05, 700)
        note(g, 'envelope')
        await duskIfReady(g)
      },
    },
    {
      id: 'engine',
      at: [4, 3],
      label: l('Motor', 'The engine'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Vrtule za kormou mleli vzduch a z motorov šiel kyslastý dych etanolu. Tak voňal každý stroj, ktorý Arkot v živote poznal.', 'Behind the stern the propellers churned the air, and the engines gave off the sour breath of ethanol. That was how every machine Arkot had ever known smelled.'))
        note(g, 'engine')
        await duskIfReady(g)
      },
    },
  ],
  exits: [
    {
      area: [8, 6, 8, 6],
      to: 'c1_cabin',
      spawn: 'door',
      when: (g) => !!g.flag('c1.dusk'),
      blocked: l('Kajuta patrí posádke. Zatiaľ.', 'The cabin belongs to the crew. For now.'),
    },
  ],
  onEnter: async (g) => {
    if (g.flag('c1.eclipseDone')) {
      await nightScene(g)
      return
    }
    if (g.flag('c1.dusk')) {
      void g.atmosphere(deckLate, 0)
      applyAfterDusk(g)
      g.objective(l('Vojdi do kajuty.', 'Go into the cabin.'))
      return
    }
    await g.once('c1.deckIntro', async () => {
      g.cinematic(true)
      g.teleport('player', [15, 10.62], 315)
      g.pose('player', 'sit')
      await g.focus([15, 10], { ms: 10, zoom: 1.3 })
      await g.wait(800)
      await g.narrate(l('Vietor v tej výške nepáchol ničím.', 'At that height the wind smelled of nothing.'))
      await g.narrate(l('To bola prvá vec, ktorú mu cesty dali, a jediná, ktorú si nechal. Dole vždy páchlo: ryby, decht, moč v uličke za trhom. Tu hore bol vzduch prázdny ako sieť vytiahnutá z vody a nič v ňom neuviazlo.', 'It was the first thing the journey gave him, and the only thing he kept. Down below there was always a stench: fish, tar, piss in the alley behind the market. Up here the air was as empty as a net pulled out of the water, and nothing caught in it.'))
      await g.zoom(1.0, 1800)
      await g.narrate(l('Z Diss odišli v Haru. Priamu linku do Nyau si dovoliť nemohli, tak leteli, ako sa dalo, a keby sa niekto pýtal prečo, odpoveď mala meno.', 'They had left Diss in Haru. They could not afford the direct line to Nyau, so they flew however they could, and if anyone asked why, the answer had a name.'))
      await g.focus('flint', { ms: 1200, zoom: 1.2 })
      await g.narrate(l('Meno spalo o tri kroky ďalej s klobúkom na tvári a s rukou na opasku, tak ako spia tí, ktorých ulica odnaučila spať inak.', 'The name was asleep three paces away, hat over his face and a hand on his belt, the way people sleep when the street has taught them no other way.'))
      await g.narrate(l('Arkot ho nebudil.', 'Arkot did not wake him.'))
      g.codex('people.flint')
      await g.focus('player', { ms: 900, zoom: 1.05 })
      g.pose('player', 'stand')
      g.teleport('player', [15, 10], 135)
      g.follow()
      g.cinematic(false)
      g.objective(l('Prezri si palubu, kým nezapadne slnko.', 'Look around the deck before the sun goes down.'))
    })
  },
}
