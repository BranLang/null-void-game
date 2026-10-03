/**
 * ch04 · scene 2 (Yera, months earlier): five days after the festival Yera
 * goes down to the aerodock with Nira's paper (Dock. Shift. *Arkot.*) and
 * watches him from the shadow of a warehouse awning. The smile and the nod;
 * the day he never looks; the apple; "the garden beyond the old canal".
 * "At midnight."
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { dockDay } from './nyau/ambience'
import { dockMap, dockProps, dockSpawns } from './nyau/maps'
import { lines } from './nyau/util'

let loopTimer = 0

export const shadowScene: SceneDef = {
  id: 'c4_shadow',
  name: l('Aerodok, skoré poobedie', 'The Aerodock, early afternoon'),
  ambience: dockDay,
  camera: { zoom: 0.95 },
  map: dockMap,
  player: { character: 'yera_temple', at: [18, 25], facing: 180, abilities: ['flow'] },
  spawns: { ...dockSpawns, back: [4, 12] },
  props: [
    ...dockProps,
    { type: 'airship', at: [10, 4], rot: 0 },
    { type: 'airship', at: [18, 4], rot: 0, color: '#a89878' },
    { type: 'airship', at: [27, 4], rot: 0, color: '#c8b8a0' },
  ],
  actors: [
    { id: 'arkot', character: 'arkot', at: [12, 12], facing: 0 },
    {
      id: 'flint',
      character: 'flint',
      at: [15, 11],
      facing: 270,
      talk: async (g) => {
        await g.narrate(l('Rys s roztrhnutým uchom rozprával tak nahlas, že ho bolo počuť cez celý dok. Rukami kreslil vo vzduchu neviditeľné obrazy. Na kňažku v tieni sa ani nepozrel.', 'A lynx with a torn ear was talking so loudly he could be heard across the whole dock. His hands drew invisible pictures in the air. He did not so much as glance at the priestess in the shade.'))
      },
    },
    { id: 'nira', character: 'nira', at: [17, 24], facing: 180, solid: false },
    { id: 'riss', character: 'riss', at: [19, 24], facing: 180, solid: false },
    {
      id: 'foreman',
      character: 'c4_foreman',
      at: [14, 15],
      facing: 135,
      talk: async (g) => {
        g.emote('foreman', '!')
        await g.narrate(l('Dokový majster sa na ňu pozrel, uvidel rúcho a pohľad mu skĺzol k zemi. Potom zreval na najbližšieho nakladača, aby mal kam dať oči.', 'The dock master looked at her, saw the robe, and his gaze slid to the ground. Then he bellowed at the nearest loader, to have somewhere to put his eyes.'))
      },
    },
    { id: 'loader1', character: 'c4_loader1', at: [9, 10], facing: 90, behavior: 'wander', wanderRadius: 2 },
    { id: 'loader2', character: 'c4_loader2', at: [16, 12], facing: 270 },
    { id: 'loader3', character: 'c4_loader3', at: [30, 21], facing: 90 },
    { id: 'loader4', character: 'c4_loader4', at: [20, 18], facing: 0, behavior: 'wander', wanderRadius: 3 },
    { id: 'old', character: 'c4_dock_old', at: [20, 11], facing: 180 },
  ],
  interactables: [
    {
      id: 'paper',
      at: [18, 24],
      label: l('Nirin papier', "Nira's paper"),
      verb: 'read',
      marker: false,
      radius: 30,
      when: (g) => g.flag('c4s.stage') === 'paper',
      run: async (g) => {
        await readPaper(g)
      },
    },
    {
      id: 'engine',
      at: [30, 22],
      label: l('Stroj na konci vzletiska', 'The engine at the end of the airfield'),
      verb: 'look',
      radius: 2.2,
      run: async (g) => {
        g.sfx('boom', 0.35)
        g.shake(0.08, 500)
        await g.narrate(l('Na konci vzletiska, za tankami, ktosi točil rukou vrtuľu stroja, kým motor nezakašľal a nezdunel basom, čo zdvihol muchy z debien.', 'At the end of the airfield, behind the tanks, someone was cranking a propeller by hand until the engine coughed and boomed a bass note that lifted the flies off the crates.'))
      },
    },
    {
      id: 'smell',
      at: [16, 19],
      label: l('Vôňa vzletiska', 'The smell of the airfield'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Vôňa nebola krásna. Rozohriate dosky, olej, etanol z tankov a pot a sladko-hnilý odér, čo stúpal z kanálu, keď slnko dopadalo na stojatú vodu.', 'The smell was not beautiful. Hot planks, oil, ethanol from the tanks, sweat, and the sweet-rotten odour that rose from the canal when the sun fell on still water.'))
        await g.narrate(l('Muchy boli všade, veľké, zelené. Vzduch sa chvel od horúčavy a od pachu skutočného, poteného Nyau, kde všetko smrdelo a všetko žilo.', 'Flies were everywhere, big and green. The air shimmered with heat and with the stink of the real, sweating Nyau, where everything stank and everything lived.'))
      },
    },
    {
      id: 'tanks',
      at: [28, 16],
      label: l('Tanky s etanolom', 'The ethanol tanks'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Tanky bzučali teplom. Na ich plechu sa dalo vidieť, ako sa vzduch krúti, akoby sa sám nemohol rozhodnúť, kam patrí.', 'The tanks hummed with heat. Above their metal you could see the air twisting, as if it could not decide where it belonged.'))
      },
    },
  ],
  triggers: [
    {
      id: 'shade',
      area: [0, 11, 5, 12],
      when: (g) => g.flag('c4s.stage') === 'find',
      run: async (g) => {
        await watching(g)
      },
    },
    {
      id: 'wall',
      area: [6, 13, 9, 19],
      when: (g) => g.flag('c4s.stage') === 'day5',
      run: async (g) => {
        await theWall(g)
      },
    },
    {
      id: 'home',
      area: [15, 24, 21, 25],
      when: (g) => g.flag('c4s.stage') === 'home',
      run: async (g) => {
        g.cinematic(true)
        await g.fade('black', 1200)
        await g.caption(l('Noci boli záhrada. Dni boli Soril.', 'The nights were the garden. The days were Soril.'), { ms: 3400 })
        g.cinematic(false)
        await g.goto('c4_study')
      },
    },
  ],
  onEnter: async (g) => {
    g.companion('nira', true)
    g.companion('riss', true)
    const stage = g.flag('c4s.stage')
    if (stage === 'day5' || stage === 'home') {
      g.companion('nira', false)
      g.companion('riss', false)
      g.teleport('nira', [9, 20], 270)
      g.teleport('riss', [10, 21], 270)
    }
    await g.once('c4s.intro', async () => {
      g.cinematic(true)
      await g.caption(l('Festival prišiel a odišiel.', 'The festival came and went.'), { ms: 2600, sub: l('Cudzia koža na jej koži.', 'A stranger’s skin on her skin.') })
      await g.narrate(l('Päť dní sledovala z balkóna, ako ustatí mestskí čističi vyťahujú zoschnuté konfety z kanálov. Päť dní nedokázala prečítať ani jednu celú stranu knihy o bylinách.', 'For five days she watched from her balcony as tired city sweepers fished dried confetti out of the canals. For five days she could not read a single whole page of her book of herbs.'))
      await g.narrate(l('Zakaždým, keď zavrela oči, pálil ju pod viečkami teplý kameň a cudzia koža. Na šiesty deň zišla dolu.', 'Every time she closed her eyes, warm stone and a stranger’s skin burned beneath her lids. On the sixth day she went down.'))
      await g.narrate(l('Mezra. Leopard. Z Diss. Nakladá vrecia na vzletisku. Povedala to Nire bez vysvetlenia. Nira sa neopýtala prečo.', 'Mezra. Leopard. From Diss. Loads sacks at the airfield. She told Nira without explaining. Nira did not ask why.'))
      g.cinematic(false)
      g.set('c4s.stage', 'paper')
      await readPaper(g)
    })
  },
  onUpdate: (g, dt) => {
    // Arkot hauls sacks from the pile to the first pier, over and over
    if (g.flag('c4s.stage') === 'day5' || g.flag('c4s.hidden')) return
    loopTimer -= dt
    if (loopTimer > 0) return
    loopTimer = 5.5
    const at = g.pos('arkot')
    if (Math.hypot(at[0] - 12, at[1] - 12) < 1.5) {
      g.pose('arkot', 'carry')
      void g.walk('arkot', [10, 8], { speed: 2.2 })
    } else {
      g.pose('arkot', 'stand')
      void g.walk('arkot', [12, 12], { speed: 2.6 })
    }
  },
}

async function readPaper(g: GameAPI): Promise<void> {
  if (g.flag('c4s.stage') !== 'paper') return
  g.face('player', 'nira')
  await g.narrate(l('Keď sa Nira vrátila, nebola sama; o krok za ňou išla Riss, mladšia strážkyňa. Papier podala Nira.', 'When Nira came back she was not alone; a step behind her walked Riss, the younger guard. It was Nira who handed over the paper.'))
  await g.read(
    l('Nirin papier', "Nira's paper"),
    l('Dok. Smena.\n\nA pod tým, hranatým písmom, čo nebolo Nirino, meno:\n\n*Arkot.*', 'Dock. Shift.\n\nAnd below, in a square hand that was not Nira’s, a name:\n\n*Arkot.*'),
    { style: 'letter' },
  )
  await g.narrate(l('Pri odovzdávaní jej Nira voľnou dlaňou narovnala plece, krátko, zo zvyku; Yerino telo sa zrovnalo samo. Potom uhla okom, ako vtedy na schodoch.', 'As she handed it over, Nira straightened Yera’s shoulder with her free palm, briefly, out of habit; Yera’s body straightened by itself. Then she looked away with her one eye, the way she had that time on the stairs.'))
  g.codex('people.nira')
  g.set('c4s.stage', 'find')
  g.objective(l('Nájdi tieň, odkiaľ ho uvidíš. Uličky medzi skladmi majú plátenné rolety.', 'Find a shadow from which you can watch him. The alleys between the warehouses have canvas awnings.'))
  g.checkpoint()
}

async function watching(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  g.companion('nira', false)
  g.companion('riss', false)
  g.set('c4s.hidden')
  void g.walk('player', [3, 12])
  void g.walk('nira', [8, 20])
  void g.walk('riss', [9, 21])
  g.teleport('arkot', [10, 12], 225)
  g.pose('arkot', 'carry')
  await g.narrate(l('Yera stála v tieni plátennej rolety skladu, vtlačená do úzkej uličky tak, aby ju v tej rieke hrubého oblečenia a nadávok nebolo vidno. Oči jej behali po každom nakladacom doku.', 'Yera stood in the shade of a warehouse’s canvas awning, pressed into a narrow alley so that she could not be seen in that river of coarse clothes and curses. Her eyes ran over every loading dock.'))
  g.face('player', 'arkot')
  await g.focus('arkot', { ms: 1200, zoom: 1.35 })
  await g.narrate(l('Arkot tam stál. Ruky, šiju a časť chrbta mal pokryté leopardími škvrnami, ktoré pri každom zdvihnutí ťažkého vreca s obilím tancovali po svaloch.', 'Arkot was there. His arms, his nape and part of his back were covered in leopard spots that danced over his muscles every time he lifted a heavy sack of grain.'))
  await g.narrate(l('Na slnku vyzerali inak než v mesačnom svetle, skôr ako čosi oveľa tvrdšie a reálnejšie. Vôbec nevyzeral ako ten hviezdny snílok s vínom na streche. Drel ako kôň a prehadzoval slová s ostatnými drsne, bez príkras.', 'In the sun they looked different than in the moonlight, like something far harder and more real. He looked nothing like that starry dreamer with the wine on the roof. He worked like a horse and threw words at the others roughly, without ornament.'))
  await g.say('player', l('Pot mu stekal po chrbte a ja som nevedela odtrhnúť zrak.', 'Sweat ran down his back and I could not tear my eyes away.'), { thought: true, mood: 'tender' })
  g.pose('arkot', 'stand')
  g.face('arkot', 'player')
  g.emote('arkot', '!')
  await g.wait(500)
  g.mood('arkot', 'happy')
  await g.narrate(l('Otočil hlavu skôr, než by očakávala. Uprostred pohybu. Pustil vrece. Všetci tí tvrdí nakladači stíchli, keď sa usmial tým pomalým, asymetrickým úsmevom, ignorujúc kňažkine rúcho, pre ktoré by iní odvrátili zrak k zemi.', 'He turned his head sooner than she expected. Mid-movement. He let go of the sack. All those hard loaders fell silent as he smiled that slow, lopsided smile, ignoring the priestess’s robe for which others would have dropped their eyes to the ground.'))
  await g.narrate(l('Kývol jej hlavou smerom k mestu a vrhol sa naspäť k lanám.', 'He nodded towards the city and threw himself back at the ropes.'))
  g.bark('foreman', l('Arkot! Laná!', 'Arkot! The ropes!'))
  await g.wait(700)
  void g.walk('arkot', [12, 12])
  await g.narrate(l('Ostrý tón dokového majstra ho zahnal do práce, ale tiché sprisahanie jej pulzovalo priamo pod kožou.', 'The dock master’s sharp voice drove him back to work, but a quiet conspiracy pulsed right under her skin.'))
  g.mood('arkot', 'neutral')
  // the second day
  await g.fade('black', 700)
  await g.caption(l('Vrátila sa aj nasledujúci deň.', 'She came back the next day as well.'), { ms: 2400 })
  await g.fade('clear', 700)
  await g.narrate(l('Stála v tom istom tieni, za tou istou roletou. Jeho pohľad o ňu ani raz nezavadil. Nakladal vrecia, smial sa s robotníkmi, existoval bez nej. Odišla skôr, než by musela.', 'She stood in the same shade, behind the same awning. Not once did his eyes brush her. He loaded sacks, laughed with the workers, existed without her. She left sooner than she had to.'))
  // the third day: the apple
  await g.fade('black', 700)
  await g.caption(l('Tretí deň jej hodil jablko.', 'On the third day he threw her an apple.'), { ms: 2400 })
  g.teleport('arkot', [9, 12], 225)
  await g.fade('clear', 700)
  g.face('arkot', 'player')
  g.pose('arkot', 'point')
  g.sfx('whoosh', 0.6)
  await g.wait(450)
  g.pose('arkot', 'stand')
  g.emote('player', '!')
  await g.narrate(l('Nepovedal nič, len ho vytiahol z vreca, otočil sa jej smerom a hodil, jedným pohybom, cez pätnásť stôp horúceho prašného vzduchu. Yera ho chytila.', 'He said nothing, only pulled it out of a sack, turned her way and threw, in one motion, across fifteen feet of hot, dusty air. Yera caught it.'))
  g.give('c4_apple')
  await g.narrate(l('Chytila ho oboma rukami, kňažskými rukami, čistými rukami, a jablko bolo teplé, prašné, voňalo potom a jeho dlaňou.', 'She caught it with both hands, priestess’s hands, clean hands, and the apple was warm and dusty and smelled of sweat and his palm.'))
  await g.narrate(l('Na jablku bol odtlačok jeho palca: prach, pot, olej, a Yera si ho prezerala, akoby to bol text, ktorému nerozumie a nechce prestať čítať.', 'On the apple was the print of his thumb: dust, sweat, oil, and Yera studied it as if it were a text she did not understand and did not want to stop reading.'))
  await g.say('player', l('Zahryznem sa doň až cestou domov. A ohryzok odhodím. Bojím sa toho, čo by som urobila, keby som si ho nechala.', 'I will bite into it only on the way home. And throw the core away. I am afraid of what I would do if I kept it.'), { thought: true })
  g.take('c4_apple')
  // the fifth day
  await g.fade('black', 700)
  await g.caption(l('Na piaty deň', 'On the fifth day'), { ms: 2200 })
  g.teleport('arkot', [11, 16], 135)
  g.teleport('nira', [5, 21], 0)
  g.teleport('riss', [6, 21], 0)
  g.follow()
  await g.zoom(1, 10)
  await g.fade('clear', 700)
  g.set('c4s.stage', 'day5')
  g.set('c4s.hidden', false)
  g.cinematic(false)
  g.objective(l('Vráť sa domov popri skladoch.', 'Head home along the warehouses.'))
  g.checkpoint()
}

async function theWall(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  const [px, py] = g.pos('player')
  g.teleport('player', [6, py], 135)
  g.teleport('arkot', [7, Math.min(19, py + 1)], 315)
  void px
  g.face('arkot', 'player')
  g.face('player', 'arkot')
  g.pose('arkot', 'point')
  g.sfx('click', 0.4)
  await g.focus('player', { ms: 700, zoom: 1.45 })
  await g.narrate(l('Cestou späť jej Arkot položil ruku na stenu tesne vedľa hlavy. Nebol to nátlak, skôr zastavenie.', 'On her way back Arkot put his hand on the wall right beside her head. It was not pressure; more a stopping.'))
  await g.say('arkot', l('Vieš o záhrade za starým kanálom, čo?', 'You know the garden beyond the old canal, right?'))
  await g.narrate(l('Pýtal sa s pohľadom upretým na nákladnú vzducholoď hojdajúcu sa v lanových úväzoch.', 'He asked with his eyes on a cargo airship swaying in its mooring ropes.'))
  g.face('player', 'nira')
  await g.narrate(l('Yera pohľadom odohnala strážkyne do protiľahlej uličky.', 'With a look, Yera sent her guards off into the alley across the way.'))
  void g.walk('nira', [3, 20])
  void g.walk('riss', [4, 20])
  await g.wait(600)
  g.face('player', 'arkot')
  await g.narrate(l('Poznala ju. Rozpadajúce sa lavičky, mach na kameni, tma a cvrčky. V noci tam nechodil nikto.', 'She knew it. Crumbling benches, moss on stone, darkness and crickets. No one went there at night.'))
  await lines(g, [
    ['player', l('Viem.', 'I know.')],
    ['arkot', l('O polnoci.', 'At midnight.')],
  ])
  g.pose('arkot', 'stand')
  void g.walk('arkot', [16, 14], { speed: 3 }).then(() => g.show('arkot', false))
  await g.narrate(l('Nečakal na odpoveď a stratil sa v rieke dokových robotníkov.', 'He did not wait for an answer and vanished into the river of dock workers.'))
  await g.narrate(l('Ani neprehltla. Len nepatrne prikývla prázdnej stene pred sebou.', 'She did not even swallow. She only nodded, barely, to the empty wall in front of her.'))
  g.codex('people.arkot')
  g.follow()
  await g.zoom(1, 600)
  g.set('c4s.stage', 'home')
  g.companion('nira', true)
  g.companion('riss', true)
  g.objective(l('Vráť sa na ulicu do mesta.', 'Go back out to the city street.'))
  g.cinematic(false)
}
