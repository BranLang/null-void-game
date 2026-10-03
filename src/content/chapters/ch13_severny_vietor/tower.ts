/**
 * Kapitola 21: beyond the low gate. Snow falling on black andesite; a seamless tower that opens
 * for Aether. Inside, light made solid: a blue world of water, worlds after worlds, Ahil from
 * above. Then a swarm of metal insects, and a map of all Hel drawn on the console.
 */
import type { SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { shaft } from './ambience'

const LIGHTS: Vec2[] = [
  [5, 13], [7, 13], [9, 13], [11, 13], [13, 13],
  [3, 15], [3, 17],
]
const DRONES: Vec2[] = [
  [12, 15], [13, 14], [14, 16], [11, 14], [12, 17], [14, 14], [10, 15], [13, 17],
]

export const towerScene: SceneDef = {
  id: 'c13_tower',
  name: l('Veža', 'The Tower'),
  ambience: shaft,
  camera: { zoom: 1.0 },
  map: {
    rows: [
      'RRRRRRRRRRRRRRRRRRRR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RaaaaaaaaaaaaaaaaaaR',
      'RRRRRRRRRgRRRRRRRRRR',
      '                    ',
      '    MMMMMMMMMMM     ',
      '   MmmmmmmmmmmmM    ',
      '  MmmmmmmmmmmmmmM   ',
      '  Mmmmmmmmmmmmmmm   ',
      '  Mmmmmmmmmmmmmmm   ',
      '  Mmmmmmmmmmmmmmm   ',
      '  Mmmmmmmmmmmmmmm   ',
      '   mmmmmmmmmmmmm    ',
      '    mmmmmmmmmmm     ',
    ],
    legend: {
      R: { floor: 'rock', wall: 'andesite', wallH: 4.5 },
      a: { floor: 'andesite', tint: '#4a444c' },
      g: { floor: 'andesite', tint: '#2a2428', tag: 'gate' },
      M: { floor: 'metal', wall: 'metal', wallH: 2.6 },
      m: { floor: 'metal', tint: '#5a6474' },
    },
  },
  props: [
    { type: 'tower', at: [9, 4], params: { h: 9 }, id: 'tower' },
    { type: 'rock', at: [3, 3] },
    { type: 'rock', at: [16, 7] },
    { type: 'boulder', at: [15, 2] },
    { type: 'hologram', at: [9, 16], id: 'holo', hidden: true },
    { type: 'c13_console', at: [13, 15], id: 'console' },
    ...LIGHTS.map((at, i) => ({ type: 'c13_bluelight', at, rot: at[0] === 3 ? 90 : 0, id: `bl${i}`, hidden: true })),
    ...DRONES.map((at, i) => ({ type: 'drone', at, id: `dr${i}`, hidden: true })),
  ],
  player: { character: 'arkot_glyph', at: [9, 9], facing: 180 },
  actors: [{ id: 'aether', character: 'aether', at: [9, 7], facing: 180 }],
  interactables: [
    {
      id: 'tower',
      at: [9, 5],
      label: l('Dotknúť sa veže', 'Touch the tower'),
      verb: 'use',
      radius: 1.8,
      when: (g) => !g.flag('c13.inside'),
      run: (g) => enter(g),
    },
    {
      id: 'holo',
      at: [9, 17],
      label: l('Obraz zo svetla', 'The image of light'),
      verb: 'look',
      radius: 2,
      when: (g) => !!g.flag('c13.inside') && !g.flag('c13.holo'),
      run: (g) => hologram(g),
    },
    {
      id: 'console',
      at: [12, 16],
      label: l('Konzola', 'The console'),
      verb: 'look',
      radius: 1.8,
      when: (g) => !!g.flag('c13.holo') && !g.flag('c13.map'),
      run: (g) => droneMap(g),
    },
  ],
  triggers: [
    {
      id: 'out',
      area: [4, 20, 14, 20],
      when: (g) => !!g.flag('c13.map'),
      run: async (g) => {
        g.set('c13.tower')
        await g.goto('c13_hel', 'gate')
      },
    },
  ],
  onEnter: async (g) => {
    await g.once('c13.shaft', async () => {
      g.cinematic(true)
      await g.narrate(l('Aether prešiel. Arkot za ním.', 'Aether went through. Arkot followed.'))
      await g.focus('tower', { ms: 1400, zoom: 0.8 })
      await g.narrate(l('Šachta so skalami po stranách, vertikálne steny stúpajúce vysoko, kde sa zužovali do otvoru. A nad otvorom obloha. Skutočná obloha, šedá, nízka, severná.', 'A shaft walled with rock, vertical walls rising high to where they narrowed into an opening. And above the opening, sky. A real sky, grey, low, northern.'))
      await g.narrate(l('Sneh dopadal na čierny andezit. Biele na čiernom, pomalé, krútiace sa v termálnych prúdoch zdola.', 'Snow falling on black andesite. White on black, slow, turning in the thermals rising from below.'))
      await g.narrate(l('A uprostred veža. Kov, aký nikdy predtým nevidel. Ani oceľ, ani titán. Matný a tmavý, bez stopy po čase, hladký ako kosť. Z jedného kusa, bez nitu a bez zvaru.', 'And in the middle, a tower. A metal he had never seen before. Not steel, not titanium. Matte and dark, without a trace of time, smooth as bone. A single piece, without a rivet or a weld.'))
      g.codex('world.c13_tower')
      g.follow()
      await g.zoom(1, 700)
      void g.walk('aether', [9, 6], { speed: 1.3 })
      g.cinematic(false)
      g.objective(l('Dotkni sa veže.', 'Touch the tower.'))
    })
    if (g.flag('c13.inside')) insideState(g)
  },
}

async function enter(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  g.face('player', 'tower')
  await g.narrate(l('Dlaň na povrchu. Teplo z hĺbky, zvnútra.', 'His palm on the surface. Warmth from deep within.'))
  g.sfx('chime', 0.8)
  await g.narrate(l('Otvor sa objavil tam, kde pred chvíľou nebolo nič. Škára v plášti, čo sa rozšírila, keď Aether pristúpil.', 'An opening appeared where a moment ago there had been nothing. A seam in the skin that widened as Aether stepped closer.'))
  await g.fade('white', 700)
  g.set('c13.inside')
  insideState(g)
  for (const id of LIGHTS.map((_, i) => `bl${i}`)) g.propVisible(id, false)
  g.propVisible('holo', false)
  await g.fade('clear', 700)
  await g.narrate(l('Vnútro. Zakrivené plochy, bez rohov ani hrán. Vzduch suchší, čistejší, zbavený prachu aj síry.', 'Inside. Curved surfaces, without corners or edges. The air drier, cleaner, free of dust and sulphur.'))
  for (let i = 0; i < LIGHTS.length; i++) {
    g.propVisible(`bl${i}`, true)
    g.sfx('tick', 0.5)
    await g.wait(220)
  }
  await g.narrate(l('Svetlá. Slabé, modré, pozdĺž stien. Rozsvietili sa jedno po druhom, vlna svetla šíriaca sa od Aethera. Spúšťala ich prítomnosť, bez jediného dotyku.', 'Lights. Faint, blue, along the walls. They came on one by one, a wave of light spreading out from Aether. His presence woke them, without a single touch.'))
  g.pose('aether', 'lie')
  g.propVisible('holo', true)
  g.flash('#7fd8ff', 600)
  g.sfx('glyph', 0.7)
  await g.narrate(l('Aether si ľahol uprostred. A nad ním obraz. Nemaľovaný, netesaný: svetlo zhmotnené do tvaru.', 'Aether lay down in the middle. And above him, an image. Not painted, not carved: light made into shape.'))
  g.cinematic(false)
  g.objective(l('Pozri sa na obraz zo svetla.', 'Look at the image of light.'))
}

function insideState(g: GameAPI): void {
  g.teleport('player', [9, 19], 180)
  g.teleport('aether', [9, 17])
  g.pose('aether', 'lie')
  for (let i = 0; i < LIGHTS.length; i++) g.propVisible(`bl${i}`, true)
  g.propVisible('holo', true)
  void g.atmosphere({ hemi: { sky: '#6a9ad8', ground: '#101820', intensity: 0.75 }, sun: { color: '#bcd8ff', intensity: 0.2, dir: [0, 1, 0.2] }, fog: { color: '#0a1424', near: 6, far: 24 }, particles: [{ kind: 'motes', count: 60, color: '#7fd8ff', area: [3, 12, 16, 20] }], sounds: ['hum'] }, 0)
  if (g.flag('c13.map')) for (let i = 0; i < DRONES.length; i++) g.propVisible(`dr${i}`, false)
  if (g.flag('c13.map')) g.objective(l('Šachta napravo. Schody naľavo. Tretia odbočka. Dole.', 'The shaft on the right. The stairs on the left. The third turn. Down.'))
}

async function hologram(g: GameAPI): Promise<void> {
  g.set('c13.holo')
  g.cinematic(true)
  g.objective(null)
  await g.focus('holo', { ms: 1000, zoom: 1.35 })
  g.music('space_theme', 1500)
  await g.read(
    l('Obraz zo svetla', 'The image of light'),
    l(
      'Svet. Modrý. Oblaky biele, pretiahnuté, nad nekonečnými plochami zeleného a hnedého. Toľko vody, že mu vyschlo v hrdle. Moria pokrývajú väčšinu povrchu. Žiadne kontinenty, aké pozná.\n\nZa ňou ďalšie. Jeden svet za druhým, mŕtve a živé a zmrznuté a rozžeravené. Hviezdy tak zblízka, že v nich rozoznáva jednotlivé ohne. Svetlá roztrúsené po povrchoch, kde niekto žil, alebo ešte žije. Obraz cez obraz cez obraz, rýchlejšie, než ich stíha počítať.\n\nPosledný obraz: Ahil. Jeho svet. Zhora. Terra. Diss. A okolo všetkého čierno. Tie isté hviezdy, čo celý život čítal ako mapu, sú tu pod ním.\n\nV priestore nad planétou sa niečo hýbe. Malé, lesklé, kovové. Krúži. Pomaly, stabilne, trpezlivo.',
      'A world. Blue. White clouds, drawn out, over endless stretches of green and brown. So much water his throat went dry. Seas covering most of the surface. No continents he knows.\n\nBehind it, more. One world after another, dead and living and frozen and white-hot. Stars so close he can make out the separate fires in them. Lights scattered over surfaces where someone lived, or still lives. Image through image through image, faster than he can count.\n\nThe last image: Ahil. His world. From above. Terra. Diss. And around everything, black. The same stars he has read like a map all his life are here, beneath him.\n\nIn the space above the planet something moves. Small, shining, metal. It circles. Slowly, steadily, patiently.',
    ),
    { style: 'stone' },
  )
  await g.narrate(l('Po lícach mu stekalo horúce vlhko. Navigátor neplakal; to len oči nestíhali mapovať toľko vody.', 'Hot wetness ran down his cheeks. A navigator does not cry; his eyes simply could not map so much water.'))
  await g.narrate(l('Hviezdy mu celý život hovorili kde. Tu mu povedali, čo ešte.', 'All his life the stars had told him where. Here they told him what else.'))
  g.follow()
  await g.zoom(1, 600)
  g.pose('aether', 'stand')
  await g.walk('aether', [12, 17], { speed: 1.2 })
  g.face('aether', 'console')
  g.cinematic(false)
  g.objective(l('Aether stojí pri konzole.', 'Aether is standing at the console.'))
}

async function droneMap(g: GameAPI): Promise<void> {
  g.set('c13.map')
  g.cinematic(true)
  g.objective(null)
  g.sfx('whoosh', 0.8)
  for (let i = 0; i < DRONES.length; i++) {
    g.propVisible(`dr${i}`, true)
    await g.wait(90)
  }
  g.fx('burst', 'console', { color: '#58b8ff' })
  await g.narrate(l('Otvor sa roztiahol a zvnútra vyrazil mrak kovového hmyzu. Krídla tenké ako list, telá veľké ako palec. Desiatky. Stovky. Rozleteli sa otvorom v strope šachty do priepasti. Do tunelov. Do Helu.', 'An opening widened and a cloud of metal insects burst out. Wings thin as leaves, bodies the size of a thumb. Dozens. Hundreds. They flew out through the opening in the shaft’s roof into the pit. Into the tunnels. Into Hel.'))
  for (let i = 0; i < DRONES.length; i++) g.propVisible(`dr${i}`, false)
  await g.read(
    l('Mapa na konzole', 'The map on the console'),
    l(
      'Tunely. Terasy. Výťahy. Hel zhora, celé mesto na jednej ploche. Modré body sa šíria chodbami ako krv žilami.\n\nV jednom koridore na spodných terasách, kde je vzduch najťažší, body zhasínajú. Jeden po druhom. Vstúpia a nevrátia sa.\n\nTam.\n\n*Šachta napravo. Schody naľavo. Tretia odbočka. Dole.*',
      'Tunnels. Terraces. Lifts. Hel from above, the whole city on one surface. Blue points spread through the corridors like blood through veins.\n\nIn one corridor on the lower terraces, where the air is heaviest, the points go out. One after another. They go in and do not come back.\n\nThere.\n\n*The shaft on the right. The stairs on the left. The third turn. Down.*',
    ),
    { style: 'cipher' },
  )
  await g.narrate(l('Mentálna mapa, čo sa mu v dave zrútila, sa tu znovu skladala. Bod za bodom. Odbočka za odbočkou. Mapa bola jazyk a on bol rodený hovorca.', 'The mental map that had collapsed in the crowd was putting itself back together here. Point by point. Turn by turn. A map was a language, and he was a native speaker.'))
  await g.narrate(l('Aether uprel zrak na konzolu. Zvuk namiesto slova, zavrčanie, čo prešlo v nádych. Cieľ bol jasný. A rovnako aj fakt, že hľadaný nestojí o spoločnosť.', 'Aether fixed his eyes on the console. A sound instead of a word, a growl that became a breath. The target was clear. So was the fact that the one they sought did not want company.'))
  await g.narrate(l('Flint a Goji sú tam niekde dole a nevedia, kam presne. On vie.', 'Flint and Goji are somewhere down there and don’t know exactly where. He does.'))
  const c = await g.choose([
    { id: 'go', text: l('(Siahnuť do vrecka po hodvábnej šatke. A bežať.)', '(Reach into the pocket for the silk scarf. And run.)') },
    { id: 'stay', text: l('(Ešte chvíľu sa pozerať na Ahil.)', '(Look at Ahil a moment longer.)') },
  ])
  if (c === 'stay') {
    await g.narrate(l('Ahil sa stále otáčal na konzole. Modrý. Tichý. Mohol zostať. Sedieť a pozerať sa na hviezdy, kým sa Sai vráti.', 'Ahil kept turning on the console. Blue. Quiet. He could stay. Sit and look at the stars until Sai came back.'))
  }
  await g.narrate(l('Ale hodváb vo vrecku bol bližšie než celá tá planéta na obraze. Šatka z roby, v ktorej ho previedla cez chrám. Vôňa slabla s každým dňom. Ale ešte tam bola.', 'But the silk in his pocket was closer than that whole planet in the image. A scarf from the robe she had led him through the temple in. The scent was fading every day. But it was still there.'))
  g.cinematic(false)
  g.objective(l('Šachta napravo. Schody naľavo. Tretia odbočka. Dole.', 'The shaft on the right. The stairs on the left. The third turn. Down.'))
  g.hint(l('Von z veže, späť do Helu.', 'Out of the tower, back into Hel.'))
}
