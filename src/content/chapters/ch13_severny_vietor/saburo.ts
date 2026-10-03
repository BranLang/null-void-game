/**
 * Kapitola 17 (flashback): the Approacher flees the blackness swallowing Tami's house; Saburo's
 * veranda; Aether arrives and speaks the Old Tongue: “This darkness can only be defeated by a
 * greater darkness.” Saburo's map: a man, a gōstar, in the Diera.
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { heavyKitsune } from './ambience'
import { aether, goji } from './util'

export const saburoScene: SceneDef = {
  id: 'c13_saburo',
  name: l('Saburov dvor', 'Saburo’s Yard'),
  ambience: { ...heavyKitsune, sounds: ['wind', 'night'] },
  camera: { zoom: 1.05 },
  map: {
    rows: [
      'HHHHHHHHHHHHHHHHHHHHHH  ',
      'HHHHHHHHHHHHHHHHHHHHHH  ',
      'HHHHHHHHHHDHHHHHHHHHHH  ',
      'w====================w  ',
      'w====================w  ',
      'w,,,,,,,,,ss,,,,,,,,,w  ',
      'w,ff,,,,,,ss,,,,,,ff,w  ',
      'w,ff,,,,,,ss,,,,,,ff,w  ',
      'w,,,,,,,,,ss,,,,,,,,,w  ',
      'w,,,,,,,,,ss,,,,,,,,,w  ',
      'wwwwwwwwww..wwwwwwwwww  ',
      'cccccccccccccccccccccccc',
      'cccccccccccccccccccccccc',
      'cccccccccccccccccccccccc',
      'cccccccccccccccccccccccc',
    ],
    legend: {
      H: { floor: 'wood', wall: 'plank', wallH: 2.8 },
      D: { floor: 'wood', h: 1, tag: 'door' },
      '=': { floor: 'wood', h: 1, stairs: true, tint: '#b08a60' },
      w: { floor: 'stone', wall: 'stone', wallH: 0.8 },
      ',': { floor: 'grass', tint: '#7a8a6a' },
      f: { floor: 'grass', tint: '#7a8a6a', prop: { type: 'flowers' } },
      s: { floor: 'stone', tint: '#9a968c' },
      '.': { floor: 'cobble', tag: 'gate' },
      c: { floor: 'cobble', tint: '#8a8a82' },
    },
  },
  props: [
    { type: 'window', at: [4, 3], params: { shutters: true, lit: false } },
    { type: 'window', at: [16, 3], params: { shutters: true, lit: false } },
    { type: 'door', at: [10, 2], params: { open: true } },
    { type: 'chair', at: [8, 4], rot: 0, id: 'chair' },
    { type: 'pillar', at: [1, 4], params: { h: 2.2, style: 'stone' } },
    { type: 'pillar', at: [20, 4], params: { h: 2.2, style: 'stone' } },
    { type: 'bush', at: [3, 9], params: { flowers: true } },
    { type: 'bush', at: [18, 9] },
    { type: 'tree', at: [19, 6] },
    { type: 'approacher', at: [6, 12], rot: 90, id: 'approacher', hidden: true },
    { type: 'well', at: [21, 13] },
    { type: 'basket', at: [16, 12], params: { fill: true } },
    { type: 'basket', at: [17, 13] },
    { type: 'lamppost', at: [13, 11] },
  ],
  player: { character: 'arkot_glyph', at: [8, 11], facing: 180 },
  actors: [
    { id: 'saburo', character: 'saburo', at: [8, 4], facing: 0, pose: 'sit', talk: (g) => talkSaburo(g) },
    { id: 'flint', character: 'flint', at: [9, 12], facing: 180, talk: (g) => talkFlint(g) },
    { id: 'dara', character: 'dara', at: [5, 11], facing: 180, talk: (g) => talkDara(g) },
    { id: 'yori', character: 'yori', at: [4, 12], facing: 180 },
    { id: 'goji', character: 'goji', at: [23, 12], facing: 270, hidden: true },
    { id: 'aether', character: 'aether', at: [23, 13], facing: 270, hidden: true },
    { id: 'runner1', character: 'c13_runner1', at: [23, 13], facing: 270, hidden: true },
    { id: 'runner2', character: 'c13_runner2', at: [23, 12], facing: 270, hidden: true },
  ],
  interactables: [
    {
      id: 'pipe',
      at: [9, 5],
      label: l('Fajka na doskách', 'The pipe on the boards'),
      verb: 'look',
      when: (g) => !!g.flag('c13.pipeFell') && !g.flag('c13.aether'),
      run: async (g) => {
        await g.narrate(l('Fajka ležala na doskách, kam vypadla. Saburo ju nepozberal. Ruky na kolenách sa mu triasli.', 'The pipe lay on the boards where it had fallen. Saburo did not pick it up. His hands trembled on his knees.'))
      },
    },
    {
      id: 'north',
      at: [11, 10],
      label: l('Pozrieť na sever', 'Look to the north'),
      verb: 'look',
      when: (g) => !!g.flag('c13.pipeFell') && !g.flag('c13.aether'),
      run: async (g) => {
        await g.narrate(l('Za strechami ruín bledla obloha do siva. Niekde tam, na druhom konci mesta, stál dom, ktorý nebolo vidno.', 'Beyond the roofs of the ruins the sky paled into grey. Somewhere there, at the other end of the city, stood a house no one could see.'))
        await g.say('player', l('Yera.', 'Yera.'), { thought: true, mood: 'sad' })
      },
    },
  ],
  onEnter: async (g) => {
    await g.once('c13.flashback', async () => {
      g.cinematic(true)
      await g.caption(l('Predtým', 'Before'), { ms: 1800 })
      await g.narrate(l('Vietor v ušiach, vetvy o plech a srdce v hrdle.', 'Wind in the ears, branches against the iron plate, and a heart in the throat.'))
      g.shake(0.3, 1400)
      g.sfx('whoosh', 0.7)
      await g.narrate(l('Približovadlo, hranatá krabica z plechu a nitov, sa rútilo lesom. Flint za volantom, nohy zapreté do pedálov. Arkot vedľa neho. Na korbe Dara a Yori.', 'The Approacher, a square box of plate and rivets, tore through the forest. Flint at the wheel, feet braced on the pedals. Arkot beside him. Dara and Yori clinging on in the back.'))
      await g.narrate(l('Za nimi zostával Tamin dom, alebo to, čo z neho bolo ešte vidieť. Čiernota ho žrala zospodu, začínajúc záhradou. Žiadny zvuk. Len chlad, čo neťahal von, ale dnu, akoby tma teplo pila.', 'Behind them was Tami’s house, or what could still be seen of it. Blackness was eating it from below, beginning with the garden. No sound. Only a cold that did not breathe out but drew in, as if the dark were drinking the warmth.'))
      g.flash('#0a0810', 700)
      await g.narrate(l('Arkot radšej odvracal zrak. Yera zostala tam. V dome, čo stál, ale už nepatril svetlu.', 'Arkot kept his eyes turned away. Yera had stayed there. In a house that still stood but no longer belonged to the light.'))
      // two Kitsune folk running from something without a shape
      g.show('runner1', true)
      g.show('runner2', true)
      void g.walk('runner2', [12, 12], { run: true })
      await g.focus([17, 13], { ms: 700, zoom: 1.2 })
      void g.walk('runner1', [12, 13], { run: true })
      await g.wait(1400)
      g.fx('dust', 'runner1', { scale: 1.4 })
      g.sfx('bass', 0.7)
      g.despawn('runner1')
      await g.narrate(l('Na ulici pred nimi bežali dvaja Kitsunčania, tak ako sa beží pred niečím, čo nemá tvar. Prvému sa v behu rozsypali plecia, potom hlava, a vo vzduchu zostal sivý prach v tvare behu.', 'In the street ahead two Kitsune foxes were running, the way one runs from something that has no shape. The first one’s shoulders came apart as he ran, then his head, and grey dust hung in the air in the shape of running.'))
      g.pose('runner2', 'kneel')
      await g.narrate(l('Druhý zastal. Flint zatočil volantom a Dara na korbe zakryla Yorimu oči.', 'The second stopped. Flint wrenched the wheel and in the back Dara covered Yori’s eyes.'))
      g.sfx('whoosh', 0.6)
      g.propVisible('approacher', true)
      g.despawn('runner2')
      g.follow()
      await g.zoom(1.05, 500)
      await g.narrate(l('Približovadlo zaparkovalo pri Saburovom dome.', 'The Approacher pulled up at Saburo’s house.'))
      // the veranda
      await g.walk('player', [11, 7])
      void g.walk('flint', [12, 5])
      void g.walk('dara', [5, 7])
      void g.walk('yori', [6, 8])
      await g.wait(500)
      g.face('player', 'saburo')
      await g.narrate(l('Vôňa kvetov a starý tabak. Saburo sedel na verande v tieni stĺpov, fajka v ústach, vyhasnutá. Ruky na kolenách. Chveli sa.', 'The scent of flowers and old tobacco. Saburo sat on the veranda in the shade of the pillars, his pipe in his mouth, gone out. Hands on his knees. They were trembling.'))
      await g.say('saburo', l('Sadnite si.', 'Sit down.'))
      g.face('flint', 'saburo')
      await g.say('flint', l('Tamin dom stojí. Ale nevidno ho. Tma ho pohltila.', 'Tami’s house is standing. But you can’t see it. The dark swallowed it.'), { mood: 'fear' })
      await g.say('flint', l('Tami bola vo vnútri…', 'Tami was inside…'), { mood: 'sad' })
      g.sfx('click', 0.8)
      g.set('c13.pipeFell')
      await g.narrate(l('Fajka vypadla z úst. Dutý zvuk o dosky. Saburove prsty sa zaťali do opierok stoličky, až drevo zapraskalo.', 'The pipe fell from his mouth. A hollow sound on the boards. Saburo’s fingers clenched on the arms of the chair until the wood creaked.'))
      await g.say('saburo', l('Karako…', 'Karako…'), { mood: 'pain' })
      await g.say('flint', l('Boli tam obe. Tami aj Yera. A my sme nemohli urobiť nič.', 'They were both in there. Tami and Yera. And we couldn’t do anything.'), { mood: 'sad' })
      g.pose('flint', 'sit')
      g.pose('dara', 'sit')
      await g.narrate(l('Nikto nepovedal: sú mŕtve. Nebolo treba. Flint sa po verande zosunul na dosky, rysie uši prilepené k lebke. Dara sedela na tráve; ramená sa jej triasli, bez zvuku, bez plaču.', 'No one said: they are dead. There was no need. Flint slid down the veranda to the boards, his lynx ears flat against his skull. Dara sat on the grass; her shoulders shook, without a sound, without tears.'))
      g.cinematic(false)
      g.objective(l('Počkaj pri Saburovi.', 'Wait with Saburo.'))
    })
    if (!g.flag('c13.aether')) {
      g.propVisible('approacher', true)
      g.despawn('runner1')
      g.despawn('runner2')
      g.teleport('flint', [12, 5])
      g.pose('flint', 'sit')
      g.teleport('dara', [5, 7])
      g.pose('dara', 'sit')
      g.teleport('yori', [6, 8])
    }
  },
}

async function talkFlint(g: GameAPI): Promise<void> {
  await g.narrate(l('Flint sedel na doskách s rukami bezvládne na kolenách. Revolver mal za pásom a nesiahol naň.', 'Flint sat on the boards with his hands limp on his knees. His revolver was in his belt and he did not reach for it.'))
  const c = await g.choose([
    { id: 'hand', text: l('(Položiť mu ruku na rameno.)', '(Put a hand on his shoulder.)') },
    { id: 'leave', text: l('(Nechať ho tak.)', '(Leave him be.)') },
  ])
  if (c === 'hand') {
    await g.narrate(l('Flint ju nezhodil. Ani sa nepozrel.', 'Flint didn’t shake it off. Didn’t look up either.'))
    g.rel('flint', 1)
  }
  await advance(g)
}

async function talkDara(g: GameAPI): Promise<void> {
  await g.narrate(l('Dara pozerala do trávy. Yori vedľa nej, ruka na jej chrbte. Pozeral na oblohu.', 'Dara was staring into the grass. Yori sat beside her, a hand on her back. He was looking at the sky.'))
  await g.say('dara', l('Videla som to v jeho tvári. Toho prvého pri studni. Ani nevedel, že už nebeží.', 'I saw it in his face. The first one, by the well. He didn’t even know he’d stopped running.'), { mood: 'sad' })
  await advance(g)
}

async function talkSaburo(g: GameAPI): Promise<void> {
  if (g.flag('c13.aether')) return
  await g.narrate(l('Saburo sedel v rovnakej pozícii. Ruky na kolenách, fajka na zemi. Pod štyridsiatimi zimami stoicizmu čosi prasklo.', 'Saburo sat in the same position. Hands on his knees, the pipe on the ground. Beneath forty winters of stoicism something had cracked.'))
  g.set('c13.waited')
  await arrival(g)
}

/** After a moment of waiting, Goji comes running and then the wolf. */
async function advance(g: GameAPI): Promise<void> {
  g.inc('c13.waitTalks')
  if ((Number(g.flag('c13.waitTalks')) || 0) >= 2 || g.flag('c13.waited')) await arrival(g)
}

async function arrival(g: GameAPI): Promise<void> {
  if (g.flag('c13.aether')) return
  g.set('c13.aether')
  g.cinematic(true)
  g.objective(null)
  g.show('goji', true)
  g.teleport('goji', [23, 12], 270)
  await g.walk('goji', [12, 8], { run: true })
  g.face('goji', 'saburo')
  await g.narrate(l('Goji pribehol krátko po nich, v prepotenom tričku. Zbehol z dielne, keď v oknách Taminho domu zbadal svetlá, čo tam nemali byť.', 'Goji came running soon after, in a sweat-soaked shirt. He had come down from the workshop when he saw lights in the windows of Tami’s house, lights that should not have been there.'))
  await g.say('goji', l('Čo sa deje?', 'What’s happening?'), { mood: 'fear' })
  await g.narrate(l('Nikto neodpovedal. Tiene sa pretiahli cez podlahu. Svetlo zošedlo.', 'No one answered. Shadows stretched across the floor. The light turned grey.'))
  await g.wait(600)
  // the wolf
  g.sfx('bass', 0.4)
  await g.narrate(l('Arkot ho začul skôr, než uvidel. Ťažké, pomalé kroky na dlažbe. Štyri, päť, šesť. Isté, väčšie než čokoľvek, čo chodilo po uličkách Kitsune.', 'Arkot heard it before he saw it. Heavy, slow steps on the paving. Four, five, six. Certain, bigger than anything that walked the alleys of Kitsune.'))
  g.show('aether', true)
  g.teleport('aether', [23, 13], 270)
  void g.walk('aether', [11, 11], { speed: 1.6 })
  await g.focus('aether', { ms: 1400, zoom: 1.2 })
  await g.wait(1600)
  g.follow('aether')
  await g.narrate(l('Vlk. Obrovský, rameno vo výške Arkotovho hrudníka. Sivá srsť striebristá v poslednom svetle. Jantárové oči, staré. Jasné.', 'A wolf. Enormous, its shoulder at the height of Arkot’s chest. Grey fur, silver in the last of the light. Amber eyes, old. Clear.'))
  g.codex('people.aether')
  await g.walk('aether', [9, 6], { speed: 1.6 })
  g.face('aether', 'saburo')
  g.follow()
  await g.narrate(l('Prešiel okolo nich, okolo Flinta na zemi, okolo Dary v tráve, akoby neexistovali. Zastavil sa pred Saburom. Otvoril tlamu a prehovoril.', 'He passed them, past Flint on the ground, past Dara in the grass, as if they did not exist. He stopped before Saburo. He opened his jaws and spoke.'))
  await aether(g, 'Áj wóz inn ze háus… dáun… hólls… stérrs…')
  await g.say('goji', l('Staroreč. On hovorí Starorečou.', 'The Old Tongue. He’s speaking the Old Tongue.'), { mood: 'surprised' })
  g.codex('gloss.starorec')
  await g.say('saburo', l('Prekladaj im.', 'Translate for them.'))
  await goji(g, l('Bol som v dome. Prešiel som prízemie. Chodby. Schody.', 'I was in the house. I went through the ground floor. The halls. The stairs.'))
  await aether(g, 'Fulll ov šédous… gósts…')
  await goji(g, l('Je plný… tieňov. Prízrakov.', 'It is full of… shadows. Phantoms.'))
  await aether(g, 'Ápp ze stérrs… hí trrou mí agénst ze wóll.')
  await goji(g, l('Na schodoch hore… hodil ma o stenu.', 'On the stairs above… he threw me against the wall.'), 'fear')
  await g.narrate(l('Flintove oči zišli na vlkovu srsť. Bez škrabnutia. Bez prachu.', 'Flint’s eyes went to the wolf’s fur. Not a scratch. Not a speck of dust.'))
  await goji(g, l('Nechcel som pokúšať jeho trpezlivosť. Necítil som sa vítaný.', 'I did not wish to try his patience. I did not feel welcome.'))
  await aether(g, 'Wí nóu íč ader.')
  await goji(g, l('Hovorí… že sa poznajú.', 'He says… that they know each other.'), 'fear')
  await aether(g, 'Dáun, bihájnd ze stíl dórz… ze gérrls árr zér.')
  await goji(g, l('Dole, za oceľovými dverami… dievčatá sú tam.', 'Down, behind the steel doors… the girls are there.'))
  g.pose('flint', 'stand')
  await g.say('flint', l('Sú živé?', 'Are they alive?'), { mood: 'surprised' })
  await g.narrate(l('Aether prikývol. Raz.', 'Aether nodded. Once.'))
  await g.say('player', l('Živá.', 'Alive.'), { thought: true, mood: 'tender' })
  await g.narrate(l('Ale slovo živé malo háčik. Nikto nevedel, ako dlho.', 'But the word alive had a hook in it. No one knew for how long.'))
  await g.say('flint', l('Ako ich dostaneme von?', 'How do we get them out?'), { mood: 'determined' })
  g.music(null, 1500)
  await aether(g, 'Diss dárknes… ónli a grrejter dárknes kenn defíjt.')
  await goji(g, l('Túto temnotu…', 'This darkness…'))
  await goji(g, l('…porazí len väčšia temnota.', '…can only be defeated by a greater darkness.'), 'blank')
  g.shake(0.1, 900)
  await aether(g, 'Zérr iz a menn inn ze nórrs. Hí kejm ze déj Renn dájd.')
  await goji(g, l('Na severe je muž. Objavil sa v deň Rennovej smrti.', 'There is a man in the north. He appeared on the day Renn died.'))
  await g.narrate(l('Goji pozrel na Sabura. Saburo pozrel na neho. Medzi starým líšiakom a mladým prebehlo niečo, čo nepotrebovalo preklad. Vedeli, o kom hovorí. Obaja.', 'Goji looked at Saburo. Saburo looked at him. Between the old fox and the young one passed something that needed no translation. They knew who he meant. Both of them.'))
  // the map
  g.pose('saburo', 'stand')
  await g.walk('saburo', [10, 3])
  g.show('saburo', false)
  g.sfx('door', 0.5)
  await g.narrate(l('Saburo vstal. Odišiel dovnútra. Bez slova. Zvuk otvárania skrine. Šúchanie kože, papiera, tubusov. Hľadal. Vedel, čo hľadá.', 'Saburo stood. He went inside. Without a word. The sound of a cupboard opening. The rustle of leather, paper, map tubes. He was searching. He knew what he was searching for.'))
  await g.wait(900)
  g.show('saburo', true)
  await g.walk('saburo', [9, 5])
  g.face('saburo', 'player')
  await g.narrate(l('Vrátil sa s jedným tubusom. Koža popraskaná, mosadzné viečko zoxidované nazeleno. Keď sa postavil, stál nezvyčajne rovno, akoby zo šije zhodil desiatky zím.', 'He came back with a single tube. The leather cracked, the brass cap gone green. When he stood up he stood unusually straight, as if he had shaken dozens of winters from his neck.'))
  await g.read(
    l('Saburova mapa', 'Saburo’s map'),
    l(
      'Ručne kreslená. Zašlé čiary, fŕkance atramentu. Lesy na východe, rieky bez mien, značky, čo dávali zmysel, keď bol Saburo mladší.\n\nNa severozápade, kde končia lesy a začína pustatina, je atrament hustejší, akoby niekto pero pritlačil viackrát:\n\n*Diera.*\n\nPri značke drobné písmo: *Hovoria Starorečou.*',
      'Hand-drawn. Faded lines, spatters of ink. Forests in the east, rivers without names, marks that made sense when Saburo was younger.\n\nIn the north-west, where the forests end and the wasteland begins, the ink is thicker, as if someone had pressed the pen down again and again:\n\n*The Diera.*\n\nBeside the mark, in small letters: *They speak the Old Tongue.*',
    ),
    { style: 'letter' },
  )
  await g.say('saburo', l('Človek. Gōstar. V Diere. Štrnásť dní letu. Predpokladám, že je stále tam.', 'A human. A gōstar. In the Diera. Fourteen days’ flight. I assume he is still there.'))
  g.codex('gloss.gostar')
  await g.say('flint', l('Štrnásť dní? Kark.', 'Fourteen days? Kark.'))
  await g.say('dara', l('Tam a späť dvadsaťosem dní.', 'There and back, twenty-eight days.'), { mood: 'sad' })
  await g.narrate(l('Dvadsaťosem dní. Navigátor v Arkotovi automaticky prepočítal priestor za oceľovými dverami, dve dievčatá, uzavretý vzduch. Nevedel presné rozmery. Nemusel.', 'Twenty-eight days. The navigator in Arkot automatically worked it out: the space behind the steel doors, two girls, sealed air. He did not know the exact dimensions. He didn’t need to.'))
  await g.say('flint', l('Nie. Nemôžeme odísť na dvadsaťosem dní. Nie.', 'No. We can’t leave for twenty-eight days. No.'), { mood: 'angry' })
  await g.say('saburo', l('Nemôžete ani zostať.', 'Nor can you stay.'))
  await g.say('flint', l('Tak tam pôjdem sám.', 'Then I’ll go alone.'), { mood: 'angry' })
  g.face('saburo', 'player')
  await g.say('saburo', l('A ty?', 'And you?'))
  const c = await g.choose([
    { id: 'currents', text: l('„Navigátor uvidí prúdy. Štrnásť dní nemusí byť štrnásť dní.“', '“A navigator sees the currents. Fourteen days needn’t be fourteen days.”') },
    { id: 'count', text: l('„Rátal som to. Inak to nevychádza.“', '“I’ve counted it. There’s no other way it adds up.”') },
    { id: 'north', text: l('(Mlčky sa pozrieť na sever.)', '(Look silently to the north.)') },
  ])
  if (c === 'currents') {
    await g.say('player', l('Navigátor uvidí prúdy. Niekedy fúka vietor silnejšie. Štrnásť dní nemusí byť štrnásť dní.', 'A navigator sees the currents. Sometimes the wind blows harder. Fourteen days needn’t be fourteen days.'), { mood: 'determined' })
    g.rel('saburo', 1)
  } else if (c === 'count') {
    await g.say('player', l('Rátal som to. Inak to nevychádza.', 'I’ve counted it. There’s no other way it adds up.'), { mood: 'closed' })
    g.rel('saburo', 1)
  } else {
    g.face('player', 180)
    await g.narrate(l('Arkot sa pozrel na sever. Tam, kde obloha bledla do siva.', 'Arkot looked to the north. To where the sky paled into grey.'))
  }
  await g.narrate(l('Saburo naňho pozrel. Pomaly kývol.', 'Saburo looked at him. Slowly, he nodded.'))
  g.face('flint', 'player')
  await g.say('flint', l('Tak čo? Odísť? Nechať ich tam?', 'So what? Leave? Leave them there?'), { mood: 'angry' })
  await g.say('saburo', l('Nemám druhú posádku. Felix a ja niečo vymyslíme. Dostaneme ich von.', 'I have no second crew. Felix and I will think of something. We’ll get them out.'))
  await g.say('saburo', l('Felix niečo vymyslí. Vždy vymyslí. Ale vy musíte ísť. Teraz.', 'Felix will think of something. He always does. But you must go. Now.'))
  g.face('saburo', 'player')
  await g.say('saburo', l('Vybrala si teba. Veď ich na sever.', 'She chose you. Lead them north.'))
  g.face('saburo', 'dara')
  await g.say('saburo', l('Ty vedieš Itaku.', 'You fly the Itaka.'))
  g.face('saburo', 'flint')
  await g.say('saburo', l('Ona ťa naučí.', 'She will teach you.'))
  await g.say('goji', l('Na palube vám poviem viac. Teraz nie je čas. To povedal on.', 'I’ll tell you more on board. There’s no time now. That’s what he said.'))
  await g.say('goji', l('Nie ja.', 'Not me.'), { mood: 'blank' })
  await g.fade('black', 1000)
  g.cinematic(false)
  await g.goto('c13_amphitheatre')
}
