/**
 * Playable demo on the painted plates: "Prvé svetlo" (book chapter 1).
 * The temple garden (the dark branch, the flow minigame, Saéli blood), the walk
 * home through Nyau with Nira, and the villa where her father waits.
 * Boots with ?scene=demo_garden, or from New Game in a VITE_DEMO=1 build.
 */
import type { AmbienceDef, ChapterDef, ExitDef, SceneDef, Vec2 } from '../../types'
import { l } from '../../../i18n/i18n'
import { NYAU_GARDEN, NYAU_STREET, NYAU_VILLA } from '../../plates/nyau'
import { plateAt, plateMap } from '../../../engine/plate/plateMath'

const night: AmbienceDef = {
  sky: { top: '#05060f', bottom: '#151b2e' },
  hemi: { sky: '#8a96c8', ground: '#2a2638', intensity: 1.25 },
  sun: { color: '#c8d0ff', intensity: 1.2, dir: [-0.4, 1, 0.5], shadows: false },
  bloom: { strength: 0.45, radius: 0.6, threshold: 0.9 },
  grade: { tint: '#ffffff', saturation: 1.02, contrast: 1.04, vignette: 0.42, grain: 0.03 },
  particles: [
    { kind: 'fireflies', count: 36, color: '#9fe3ff' },
    { kind: 'motes', count: 30, color: '#c9b8ff' },
  ],
  music: null,
  sounds: ['night'],
}

function exitAt(c: Vec2, to: string, label: ReturnType<typeof l>, r = 1): ExitDef {
  return { area: [c[0] - r, c[1] - r, c[0] + r, c[1] + r], to, label }
}

// ------------------------------------------------------------------------ garden
const g1 = plateAt(NYAU_GARDEN)
const garden: SceneDef = {
  id: 'demo_garden',
  name: l('Chrámová záhrada, Nyau', 'The Temple Garden, Nyau'),
  plate: NYAU_GARDEN,
  map: plateMap(NYAU_GARDEN),
  ambience: { ...night, music: 'temple' },
  player: { character: 'yera_temple', at: g1(0.3, 0.6), facing: 200 },
  actors: [{ id: 'soril', character: 'soril', at: g1(0.25, 0.7), facing: 30 }],
  exits: [
    {
      ...exitAt(g1(0.05, 0.92), 'demo_street', l('Domov', 'Home'), 2),
      when: (g) => !!g.flag('demo.healed'),
      blocked: l('Soril sa na ňu stále pozerá. Strom čaká.', 'Soril is still watching her. The tree is waiting.'),
    },
  ],
  interactables: [
    {
      id: 'tree',
      at: g1(0.38, 0.52),
      label: l('Kľaknúť medzi korene', 'Kneel among the roots'),
      verb: 'heal',
      radius: 2.2,
      when: (g) => !!g.flag('demo.toldFix') && !g.flag('demo.healed'),
      run: async (g) => {
        g.lock()
        g.face('player', 'tree')
        g.pose('player', 'kneel')
        await g.narrate(l('Priložila dlane priamo na suchú kôru. Tetovania na predlaktiach sa rozsvietili akvamarínovými líniami, no hneď začali pulzovať v rytme oveľa pomalšom než jej vlastný tep. Rytmus stromu.', 'She laid her palms flat on the dry bark. The tattoos on her forearms lit up in aquamarine lines, then began to pulse in a rhythm far slower than her own heartbeat. The rhythm of the tree.'))
        await g.say('player', l('Kameň. Tlačí koreň. Prasknutá cieva.', 'A stone. It is pressing on a root. A burst vessel.'), { thought: true })
        await g.minigame('flow', { level: 'tree' })
        g.plateRegion('glow', 0.55, 900)
        g.plateRegion('branch', 0, 2600)
        g.sfx('chime', 0.6)
        await g.wait(1200)
        g.plateRegion('glow', 0, 2400)
        await g.narrate(l('Strom sa pomaly rozsvietil, keď sa fialová žiara vliala od koreňov nahor, vetvu po vetve, list po liste. Chrámová záhrada sa rozjasnila o odtieň či dva.', 'Slowly the tree lit up as the violet glow poured from the roots upward, branch by branch, leaf by leaf. The temple garden brightened by a shade or two.'))
        g.pose('player', 'stand')
        await g.narrate(l('Na hornej pere teplo. Krv. Kvapla na rukáv skôr, než ju stihla utrieť. Tmavá na bielom.', 'Warmth on her upper lip. Blood. It dripped onto her sleeve before she could wipe it away. Dark on white.'))
        await g.walk('soril', g1(0.33, 0.6))
        g.face('soril', 'player')
        await g.say('soril', l('Saéli krv.', 'Saéli blood.'))
        await g.say('soril', l('Vieš, prečo ťa posielam k stromom?', 'Do you know why I send you to the trees?'))
        const a = await g.choose([
          { id: 'el', text: l('Lebo sú od El.', 'Because they are from El.') },
          { id: 'quiet', text: l('(Mlčať.)', '(Say nothing.)') },
        ])
        if (a === 'el') await g.say('player', l('Lebo sú od El.', 'Because they are from El.'))
        await g.say('soril', l('Lebo sú ťažšie než ľudia. Každý strom ťa prinúti hľadať cestu, ktorú ti nikto neukázal.', 'Because they are harder than people. Every tree makes you look for a path nobody has shown you.'))
        await g.say('soril', l('Niečo v tebe tú cestu pozná. Tvoja hlava ešte nie.', 'Something in you knows that path. Your head does not, yet.'))
        await g.say('soril', l('Tvoj otec a ja sme sa rozprávali. Po festivale sa porozprávame aj my.', 'Your father and I have talked. After the festival, we will talk too.'))
        await g.say('player', l('My. Yera, otec, Soril. To nikdy neznamenalo nič dobré.', 'We. Yera, her father, Soril. That never meant anything good.'), { thought: true })
        g.set('demo.healed', true)
        g.objective(l('Vrátiť sa domov do vily Saéli', 'Go home to the Saéli villa'))
        g.free()
      },
    },
    {
      id: 'pond',
      at: g1(0.5, 0.84),
      label: l('Jazierko', 'The pond'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('V hladine sa kolíše fialová koruna stromu. Svetlušky ako modré a tyrkysové bodky krúžia nízko nad vodou.', 'The violet crown of the tree sways on the surface. Fireflies like blue and turquoise dots circle low over the water.'))
      },
    },
    {
      id: 'pavilion',
      at: g1(0.8, 0.38),
      label: l('Altánok', 'The pavilion'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Pod ňou ležalo mesto s kanálmi, mostami, bazárom, klanovými vilami a vzdialeným aerodokom. Všetko na svojom mieste.', 'Below lay the city with its canals, bridges, bazaar, clan villas and the distant aerodock. Everything in its place.'))
        await g.narrate(l('Vrátane nej.', 'Including her.'))
      },
    },
  ],
  onEnter: async (g) => {
    await g.once('demo.intro', async () => {
      g.plateRegion('branch', 0.78)
      g.lock()
      g.pose('player', 'pray')
      await g.caption(l('Kapitola 1 · Prvé svetlo', 'Chapter 1 · First Light'), { ms: 2600, sub: l('Nyau, mesto prílivu', 'Nyau, the tidal city') })
      await g.narrate(l('Strom v chrámovej záhrade prestal svietiť.', 'The tree in the temple garden stopped glowing.'))
      await g.focus(g1(0.38, 0.4), { ms: 1600 })
      await g.narrate(l('Štvrtá vetva zdola. Listy, ktoré ešte ráno žiarili fialovo, ostali v tme. Akoby v nich niekto prosto zhasol lampu.', 'The fourth branch from the bottom. Leaves that had glowed violet that morning stayed dark. As if someone had simply put out a lamp inside them.'))
      await g.say('player', l('Koreň? Parazit? Sucho?', 'A root? A parasite? Drought?'), { thought: true })
      g.follow()
      g.pose('player', 'stand')
      g.face('soril', 'player')
      await g.say('soril', l('Videla si to.', 'You saw it.'))
      await g.narrate(l('So Soril bolo všetko rozkaz. Prikývla.', 'With Soril, everything was an order. She nodded.'))
      await g.say('soril', l('Oprav ho.', 'Fix it.'))
      g.set('demo.toldFix', true)
      g.objective(l('Uzdraviť strom El', "Heal El's tree"))
      g.free()
    })
    if (g.flag('demo.healed')) g.plateRegion('branch', 0)
    else g.plateRegion('branch', 0.78)
  },
}

// ------------------------------------------------------------------------ street
const s1 = plateAt(NYAU_STREET)
const street: SceneDef = {
  id: 'demo_street',
  name: l('Ulice Nyau', 'The Streets of Nyau'),
  plate: NYAU_STREET,
  map: plateMap(NYAU_STREET),
  ambience: { ...night, music: 'moss' },
  player: { character: 'yera_temple', at: s1(0.07, 0.85), facing: 300 },
  actors: [
    { id: 'nira', character: 'nira', at: s1(0.04, 0.9), facing: 300 },
    { id: 'boy', character: 'ballast_boy', at: s1(0.6, 0.6), facing: 0, name: l('Chlapec', 'A boy') },
  ],
  exits: [exitAt(s1(0.95, 0.36), 'demo_villa', l('Vila Saéli', 'The Saéli villa'), 2)],
  interactables: [
    {
      id: 'boy_talk',
      at: s1(0.6, 0.6),
      label: l('Chlapec s nočným ovocím', 'The boy with night fruit'),
      verb: 'look',
      marker: false,
      run: async (g) => {
        g.face('boy', 'player')
        await g.narrate(l('Mačkovitý chlapec z dlaní vylupoval dužinu nočného ovocia. Fialová šťava mu stekala po brade. Zdvihol oči a narazil na jej tvár: hladkú, bielu, s rovným nosom, presne ako na chrámových maľbách El.', 'A cat-boy was scooping the flesh of a night fruit from his palms. Violet juice ran down his chin. He looked up and met her face: smooth, white, straight-nosed, exactly like El on the temple paintings.'))
        g.emote('boy', '!')
        await g.narrate(l('Chlapec trhol ramenom a rýchlo si utrel zalepené prsty do nohavíc. Stvorení na obraz El.', 'The boy flinched and quickly wiped his sticky fingers on his trousers. Made in the image of El.'))
      },
    },
    {
      id: 'tablet',
      at: s1(0.62, 0.37),
      label: l('Stará tabuľa v Staroreči', 'An old tablet in the Old Speech'),
      verb: 'read',
      run: async (g) => {
        await g.read(
          l('Eon Labkan, 1124', 'Eon Labkan, 1124'),
          l('Priviedol som loď k neznámemu pobrežiu. V tme sa predo mnou vynoril svietiaci les.\n\nNyau.', 'I brought the ship to an unknown shore. In the dark a glowing forest rose before me.\n\nNyau.'),
          { style: 'stone' },
        )
        await g.narrate(l('Kapitán hľadel na svietiaci les prvýkrát v živote. Ona mala mesto pred očami každý boží deň. Skúsila sa pozrieť jeho očami. Kanály, veže, stromy. Zoznam.', 'The captain saw the glowing forest for the first time in his life. She had the city before her eyes every single day. She tried to look with his eyes. Canals, towers, trees. A list.'))
        await g.say('nira', l('Hm.', 'Ahem.'))
        g.codex('world.chronicle')
      },
    },
  ],
  onEnter: async (g) => {
    g.companion('nira', true)
    await g.once('demo.street', async () => {
      await g.narrate(l('Strážkyne kráčali tri kroky za ňou. Nira, vysoká Mezra v sivej róbe, jedno oko pod širokým pruhom plátna. Tichá ako tieň, ktorý sa nedá zložiť spolu s rúchom.', 'Her guards walked three steps behind her. Nira, a tall Mezra in a grey robe, one eye under a wide band of linen. Silent as a shadow that cannot be folded away with the robe.'))
    })
  },
}

// ------------------------------------------------------------------------ villa
const v1 = plateAt(NYAU_VILLA)
const villa: SceneDef = {
  id: 'demo_villa',
  name: l('Vila klanu Saéli', 'The Saéli Clan Villa'),
  plate: NYAU_VILLA,
  map: plateMap(NYAU_VILLA),
  ambience: night,
  player: { character: 'yera_temple', at: v1(0.1, 0.94), facing: 300 },
  actors: [
    { id: 'father', character: 'father', at: v1(0.42, 0.72), facing: 60, pose: 'sit' },
    { id: 'brother', character: 'brother', at: v1(0.33, 0.78), facing: 20, pose: 'kneel' },
  ],
  interactables: [
    {
      id: 'brother_talk',
      at: v1(0.33, 0.78),
      label: l('Braček s kriedou', 'Her little brother and his chalk'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Malý braček s modrými mačacími očami strihal uškami nad bielymi čiarami na dlažbe. Zdvihol hlavu na zvuk jej krokov. Úsmev mu oplatila mlčky.', 'Her little brother, with blue cat eyes, twitched his ears over white chalk lines on the paving. He looked up at the sound of her steps. She returned his smile without a word.'))
        g.mood('player', 'happy')
        await g.wait(1200)
        g.mood('player', 'neutral')
      },
    },
    {
      id: 'father_talk',
      at: v1(0.42, 0.72),
      label: l('Otec', 'Father'),
      verb: 'talk',
      once: true,
      run: async (g) => {
        g.lock()
        await g.say('father', l('Yerana.', 'Yerana.'))
        await g.narrate(l('Celé meno. To znamenalo rozhovor, a určite nie ten dobrovoľný typ.', 'Her full name. That meant a conversation, and certainly not the voluntary kind.'))
        await g.say('father', l('Bola si v chráme.', 'You were at the temple.'))
        await g.say('player', l('Áno.', 'Yes.'))
        await g.say('father', l('Lampiónový festival je o dva dni. Soril hovorila s Najvyššou Radou. Chcú ťa pre Chrám ako novú Eltáriu.', 'The Lantern Festival is in two days. Soril has spoken with the High Council. They want you for the Temple, as the new Eltária.'))
        const c = await g.choose([
          { id: 'no', text: l('A čo ak nechcem?', "And if I don't want to?") },
          { id: 'yes', text: l('Rozumiem.', 'I understand.') },
        ])
        if (c === 'no') {
          await g.say('player', l('A čo ak nechcem?', "And if I don't want to?"))
          await g.say('father', l('Si Saéli.', 'You are Saéli.'))
          g.set('ch02.askedWhy', true)
        } else {
          await g.say('player', l('Rozumiem.', 'I understand.'))
          await g.say('father', l('Vedel som, že budeš rozumieť. Si Saéli.', 'I knew you would understand. You are Saéli.'))
        }
        await g.narrate(l('Svetlo stromu padalo na otcovu tvár, fialové, zelené a znova fialové. Keby bol strom, kľakla by si a hľadala kameň pod koreňom.', 'The light of the tree fell across her father’s face, violet, green and violet again. If he were a tree, she would have knelt and searched for the stone under the root.'))
        await g.fade('black', 1500)
        await g.caption(l('Koniec ukážky', 'End of the demo'), { ms: 3000, sub: l('Null Void Saga · I · Eltária', 'Null Void Saga · I · Eltária') })
        await g.endChapter()
      },
    },
  ],
  onEnter: async (g) => {
    g.objective(l('Prehovoriť s otcom', 'Speak with your father'))
    await g.once('demo.villa', async () => {
      await g.narrate(l('Vila klanu Saéli stála na svahu nad mestom: biely kameň, stĺpy, vnútorné nádvorie so stromom, ktorý bol pýchou rodiny. Nebol najstarší v Nyau. Ale najjasnejší.', 'The Saéli villa stood on the slope above the city: white stone, columns, an inner courtyard with the tree that was the family’s pride. Not the oldest in Nyau. But the brightest.'))
    })
  },
}

const chapter: ChapterDef = {
  id: 'demo',
  index: 999,
  hidden: true,
  title: l('Ukážka · Kapitola 1', 'Demo · Chapter 1'),
  subtitle: l('Prvé svetlo', 'First Light'),
  pov: 'yera',
  scenes: [garden, street, villa],
  start: 'demo_garden',
}

export default chapter
