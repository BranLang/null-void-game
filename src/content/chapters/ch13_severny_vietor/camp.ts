/**
 * Kapitola 18: the northern plateau. The aurora burns in Yera's colours; the soup pot stops in
 * mid-air and Flint learns Arkot has had Spira for seventeen days. By the dying fire Aether
 * remembers: the starfarers, the dust that rotted, the four who drained the weak, Samael,
 * Infera (“my ship”) and Renn.
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { tundra } from './ambience'
import { aether, auroraTo, goji, tundraSky } from './util'

export const campScene: SceneDef = {
  id: 'c13_camp',
  name: l('Planina na severe', 'The Northern Plateau'),
  ambience: tundra,
  camera: { zoom: 1.0 },
  map: {
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRRRRRR',
      'Rkkkkk~~~kkkk~~~~~~~kkkkkk',
      'Rkk~~~~~~~~~~~~~~~~~~~~~kk',
      'Rk~~~~~~~~~~~~~~~~~~~~~~~k',
      'R~~~~gg~~~~~~~~~~~~~~~~~~~',
      'R~~~~ggg~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~ggg~~~~',
      'R~~~~~~~~~~~~~~~~~~~gg~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      'R~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~gg~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    legend: {
      R: { floor: 'rock', h: 2, wall: 'rock', wallH: 1.4 },
      k: { floor: 'rock', h: 1, stairs: true, tint: '#6a6e78' },
      '~': { floor: 'snow' },
      g: { floor: 'gravel', tint: '#7a7e88' },
    },
  },
  props: [
    { type: 'c13_itaka_bare', at: [19, 5], rot: 90, id: 'itaka' },
    { type: 'campfire', at: [11, 10], id: 'fire' },
    { type: 'c13_embers', at: [11, 10], id: 'embers', hidden: true },
    { type: 'c13_pot', at: [11, 10], y: 0.42, id: 'pot' },
    { type: 'c13_pot', at: [12, 11], y: 0.95, params: { tilt: 0.55 }, id: 'potAir', hidden: true },
    { type: 'boulder', at: [7, 10], params: { size: 1.1 }, id: 'flintRock' },
    { type: 'boulder', at: [16, 14] },
    { type: 'boulder', at: [4, 6] },
    { type: 'rock', at: [21, 12] },
    { type: 'rock', at: [5, 15] },
    { type: 'rock', at: [14, 3] },
    { type: 'log', at: [12, 12], rot: 20 },
    { type: 'sack', at: [15, 8], params: { count: 2 } },
    { type: 'rope_coil', at: [17, 8] },
  ],
  player: { character: 'arkot_glyph', at: [15, 9], facing: 270 },
  actors: [
    { id: 'aether', character: 'aether', at: [13, 8], facing: 225, pose: 'lie', talk: (g) => talkAether(g) },
    { id: 'goji', character: 'goji', at: [14, 7], facing: 225, pose: 'sit', talk: (g) => talkGoji(g) },
    { id: 'dara', character: 'dara', at: [11, 12], facing: 0, pose: 'sit', talk: (g) => talkDara(g) },
    { id: 'flint', character: 'flint', at: [8, 11], facing: 45, talk: (g) => talkFlint(g) },
    { id: 'yori', character: 'yori', at: [17, 9], facing: 270 },
  ],
  interactables: [
    {
      id: 'sky',
      at: [9, 7],
      label: l('Pozrieť na oblohu', 'Look at the sky'),
      verb: 'look',
      radius: 2.2,
      when: (g) => !g.flag('c13.fight'),
      run: async (g) => {
        g.face('player', 180)
        await g.focus([9, 3], { ms: 1100, zoom: 0.85 })
        await g.narrate(l('Fialová. Ako kruh na jej koži, keď mu prvýkrát ukázala Spiru. V jej kajute na Itake, v tajnosti.', 'Violet. Like the circle on her skin the first time she showed him Spira. In her cabin on the Itaka, in secret.'))
        await g.narrate(l('Modrá. Ako tiché svetlo, čo pulzovalo v jej dlaniach, keď ho liečila v parku na lavičke.', 'Blue. Like the quiet light that pulsed in her palms when she healed him on the bench in the park.'))
        await g.narrate(l('Obloha horela jej farbami. Arkot zavrel oči.', 'The sky was burning in her colours. Arkot closed his eyes.'))
        g.follow()
        await g.zoom(1, 700)
        g.set('c13.sawSky')
      },
    },
    {
      id: 'itaka',
      at: [17, 7],
      label: l('Itaka bez kanóna', 'The Itaka without her cannon'),
      verb: 'look',
      when: (g) => !g.flag('c13.fight'),
      run: async (g) => {
        await g.narrate(l('Kotol zastonal ešte pred pristátím. Šesť kryštálov pracovalo od úsvitu na hranici a hrana sa skončila. Goji vybehol zdola s olejom na lícach a jedným slovom: dosť.', 'The boiler had groaned even before they landed. Six crystals had worked at the edge since dawn, and the edge had run out. Goji had come up from below with oil on his cheeks and a single word: enough.'))
      },
    },
    {
      id: 'sit',
      at: [10, 9],
      label: l('Sadnúť si k ohňu', 'Sit by the fire'),
      verb: 'use',
      radius: 1.8,
      when: (g) => !g.flag('c13.fight'),
      run: (g) => pot(g),
    },
  ],
  onEnter: async (g) => {
    await g.once('c13.campIntro', async () => {
      g.cinematic(true)
      await g.caption(l('Piaty deň letu', 'The fifth day of the flight'), { ms: 2200 })
      await g.narrate(l('Hviezdy sa menili. Tie isté súhvezdia, ale jasnejšie, ostrejšie. Na severnej oblohe posunuté o pár stupňov, akoby sa niekto oprel o mapu.', 'The stars were changing. The same constellations, but brighter, sharper. Shifted a few degrees in the northern sky, as if someone had leaned on the map.'))
      await g.narrate(l('Celý život sníval o hviezdach. Teraz myslel na Yeru. Na jej hlas. Nájdeme sa.', 'All his life he had dreamed of the stars. Now he thought of Yera. Of her voice. We’ll find each other.'))
      void auroraTo(g, 0.15, 0.9, 5000)
      await g.narrate(l('Obloha sa rozhorela. Fialová, najprv len prúžok na severe, tenký ako škrabnutie pazúrom. Potom modrá, tmavá a studená. Potom zelená, jemná, tancujúca na okrajoch.', 'The sky caught fire. Violet, at first only a thread in the north, thin as a claw scratch. Then blue, dark and cold. Then green, delicate, dancing at the edges.'))
      await g.narrate(l('Svetlo sa vlnilo. Skôr dych než plameň.', 'The light rippled. More breath than flame.'))
      if (g.flag('c13.navOk') === false) await g.narrate(l('Itaka po prúdoch klesala, stúpala a znova klesala. Saburo počítal s dvoma kryštálmi. Navigátor so šiestimi a so šťastím.', 'The Itaka sank on the currents, rose and sank again. Saburo had counted on two crystals. The navigator on six, and luck.'))
      else await g.narrate(l('Saburo hovoril dva týždne, ale Saburo počítal s dvoma kryštálmi, nie so šiestimi. Hranica lesa sa blížila rýchlejšie, než hovorila mapa. Sedem dní. Možno šesť.', 'Saburo had said two weeks, but Saburo had counted on two crystals, not six. The edge of the forest was coming faster than the map said. Seven days. Maybe six.'))
      await g.narrate(l('Ťažká hodina na severe bola niečo iné. Pristáli na plošine, skalnatej, holej, pokrytej tenkou vrstvou snehu.', 'The heavy hour in the north was something else. They landed on a plateau, rocky, bare, covered with a thin skin of snow.'))
      g.cinematic(false)
      g.objective(l('Sadni si k ohňu.', 'Sit down by the fire.'))
    })
    if (!g.flag('c13.lore')) void g.atmosphere({ sky: tundraSky(0.9) }, 0)
    if (g.flag('c13.fight') && !g.flag('c13.lore')) await lore(g)
  },
}

async function talkDara(g: GameAPI): Promise<void> {
  await g.narrate(l('Dara sedela najbližšie k ohňu, chrbtom k plameňom, tvárou k tme. Stráži. Chýbajúce ucho na strane, čo obracala k vetru. Zvyk.', 'Dara sat closest to the fire, her back to the flames, her face to the dark. On watch. The missing ear on the side she turned to the wind. Habit.'))
  await g.say('dara', l('Učí sa. Prvé dni odmietal každé gesto. Teraz už sleduje moje prsty. So zaťatými zubami, ale sleduje.', 'He’s learning. The first days he refused every gesture. Now he watches my fingers. Teeth clenched, but he watches.'))
  await g.say('dara', l('Tvoj kamarát si myslí, že kormidlo počúva krik. Nepočúva. Počúva ruky.', 'Your friend thinks the helm listens to shouting. It doesn’t. It listens to hands.'))
}

async function talkGoji(g: GameAPI): Promise<void> {
  if (g.flag('c13.fight')) return
  await g.say('goji', l('Dva, tri, dva, tri. Striedam ich podľa fázy Sai. Šiesty si potrebuje oddýchnuť, inak nám dnes v noci zaspieva naposledy.', 'Two, three, two, three. I switch them with the phase of Sai. The sixth needs a rest or tonight it sings to us for the last time.'))
  await g.narrate(l('Goji sedel za Aetherom. Uši nahor. Naladené. Ako vždy, keď bol blízko vlka: úcta a hlad po slove, čo sa nedá naučiť z kníh.', 'Goji sat behind Aether. Ears up. Tuned. As always when he was near the wolf: reverence, and hunger for words that can’t be learned from books.'))
}

async function talkFlint(g: GameAPI): Promise<void> {
  if (g.flag('c13.fight')) return
  await g.narrate(l('Flint bol tichší. Postupne a nenápadne. Jeho krátky chvost neudieral rytmicky o lýtko. To bolo horšie než čokoľvek. Flintov chvost bol vždy v pohybe.', 'Flint had gone quieter. Gradually, without fuss. His short tail no longer beat its rhythm against his calf. That was worse than anything. Flint’s tail was always moving.'))
  await g.narrate(l('Nechal Tami v trezore. Nechal ju v tme. A odišiel na sever.', 'He had left Tami in the vault. Left her in the dark. And gone north.'))
}

async function talkAether(g: GameAPI): Promise<void> {
  if (g.flag('c13.fight')) return
  g.face('aether', 'player')
  await g.narrate(l('Vlk zdvihol hlavu. Jantárové oči na ňom spočinuli, staré a pokojné. Potom sa vrátili k severu. Vždy k severu.', 'The wolf raised his head. The amber eyes rested on him, old and calm. Then they went back to the north. Always to the north.'))
}

/** The gust, the pot, the glyph, “since when”, the punch, the push. */
async function pot(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  await g.walk('player', [10, 9])
  g.face('player', [11, 10])
  g.pose('player', 'sit')
  await g.narrate(l('Sneh klesal bez zvuku. V oranžovej žiare vločky tancovali ako chladné, biele iskry. Ticho planiny bolo staršie než akékoľvek slovo.', 'Snow fell without a sound. In the orange glow the flakes danced like cold white sparks. The silence of the plateau was older than any word.'))
  g.sfx('whoosh', 1)
  g.shake(0.35, 700)
  g.pose('player', 'stand')
  g.propVisible('pot', false)
  g.propVisible('potAir', true)
  await g.narrate(l('Poryv severného vetra udrel do tábora ako päsť. Hrniec s polievkou vyletel z mriežky.', 'A gust of the north wind struck the camp like a fist. The soup pot flew off the grate.'))
  g.hint(l('1 — Päsť (glyf). Rýchlo!', '1 — Push (glyph). Quick!'))
  g.free()
  let cast = false
  const off = g.onCast((e) => {
    if (e.id === 'push') cast = true
  })
  const t0 = g.time
  await g.until(() => cast || g.time - t0 > 5)
  off()
  g.lock()
  g.hint(null)
  g.fx('glyph', [12, 11], { color: '#e0a050', scale: 1.4 })
  g.glyph('player', 2.5)
  if (!cast) await g.narrate(l('Ruka sa pohla sama. Skôr než rozum, skôr než strach.', 'His hand moved on its own. Before thought, before fear.'))
  await g.narrate(l('Hrniec sa zastavil. Vo vzduchu. Polievka sa nechvela. Liatina visela v prázdne; na dych, možno dva.', 'The pot stopped. In mid-air. The soup did not tremble. The iron hung in emptiness; for a breath, maybe two.'))
  await g.wait(500)
  g.propVisible('potAir', false)
  g.propVisible('pot', true)
  g.glyph('player', 0.6)
  await g.narrate(l('Potom klesol späť na mriežku. Jemne. Presne.', 'Then it sank back onto the grate. Gently. Precisely.'))
  g.set('c13.fight')
  g.face('player', 'flint')
  await g.focus('flint', { ms: 700 })
  await g.say('flint', l('Od kedy.', 'Since when.'), { mood: 'blank' })
  await g.narrate(l('Arkot spustil ruku. Prsty studené, chlad, čo nepatril vzduchu. Flintove oči na jeho dlani. Na glyfe, čo ešte doznieval.', 'Arkot lowered his hand. His fingers cold, a cold that did not belong to the air. Flint’s eyes on his palm. On the glyph still fading there.'))
  await g.say('flint', l('Od kedy, Arkot.', 'Since when, Arkot.'), { mood: 'angry' })
  await g.say('player', l('Sedemnásť dní.', 'Seventeen days.'), { mood: 'closed' })
  void g.walk('flint', [9, 10])
  await g.say('flint', l('Sedemnásť dní.', 'Seventeen days.'), { mood: 'angry' })
  await g.say('flint', l('Sedemnásť dní v tme. A už máš cudzie tajomstvá.', 'Seventeen days in the dark. And already you’ve got strangers’ secrets.'), { mood: 'angry' })
  g.follow()
  g.face('flint', 'player')
  g.pose('flint', 'fight')
  g.sfx('crack', 0.9)
  g.flash('#ffffff', 300)
  g.shake(0.45, 500)
  g.mood('player', 'pain')
  await g.narrate(l('Udrel ho. Päsť, priamo, tvrdo, holá päsť rysa do čeľuste leoparda. Tupý, mokrý zvuk mäsa o kosť. Chuť krvi v ústach.', 'He hit him. A fist, straight, hard, a lynx’s bare fist into a leopard’s jaw. A dull wet sound of flesh on bone. The taste of blood.'))
  g.pose('flint', 'stand')
  await g.narrate(l('Glyf.', 'The glyph.'))
  g.hint(l('1 — Päsť. Alebo nič.', '1 — Push. Or nothing.'))
  g.free()
  let hit = false
  const off2 = g.onCast((e) => {
    if (e.id === 'push') hit = true
  })
  const t1 = g.time
  await g.until(() => hit || g.time - t1 > 6)
  off2()
  g.lock()
  g.hint(null)
  if (hit) {
    g.set('c13.hitBack')
    g.fx('shockwave', 'flint', { color: '#e0a050', scale: 2.5 })
    g.flash('#e0a050', 300)
    void g.walk('flint', [8, 10], { speed: 6 })
    await g.wait(300)
    g.pose('flint', 'slump')
    g.addStrain(0.45)
    await g.narrate(l('Vedome. Arkotova ruka vystrelila dopredu, dlaň otvorená. Neviditeľná päsť, tvrdá ako oceľ, zasiahla Flinta presne tam, kam predtým dopadla jeho ruka. Do sánky. Zvuk bol rovnaký, len bez dotyku kože o kožu.', 'Deliberately. Arkot’s hand shot forward, palm open. An invisible fist, hard as steel, struck Flint exactly where his own hand had landed. On the jaw. The sound was the same, only without skin touching skin.'))
    await g.narrate(l('Flint odletel dozadu. Chrbát o balvan. Arkotovo zápästie pulzovalo, prsty zľadoveli a v nose krátky, ostrý záblesk tepla. Krv. Len kvapka. Utrel si ju skôr, než padla.', 'Flint flew backwards. His back against the boulder. Arkot’s wrist throbbed, his fingers turned to ice, and in his nose a short sharp flash of heat. Blood. Only a drop. He wiped it away before it fell.'))
  } else {
    await g.narrate(l('Glyf v dlani doznel. Arkot spustil ruku a nechal krv stekať po brade. Flint čakal úder. Neprišiel. To bolo horšie.', 'The glyph in his palm died away. Arkot lowered his hand and let the blood run down his chin. Flint was waiting for the blow. It didn’t come. That was worse.'))
    g.rel('flint', 1)
  }
  g.pose('flint', 'stand')
  // Goji steps between them
  await g.walk('goji', [9, 9])
  g.face('goji', 'player')
  await g.narrate(l('Celá planina stíchla. Goji vstúpil medzi nich. Pokojne, bez náhlenia, bez strachu. Ruka na Flintovom ramene. Ruka na Arkotovom.', 'The whole plateau went still. Goji stepped between them. Calmly, without hurry, without fear. A hand on Flint’s shoulder. A hand on Arkot’s.'))
  await g.say('goji', l('Dosť.', 'Enough.'))
  const c = await g.choose([
    { id: 'sorry', text: l('„Prepáč.“ (Podať ruku.)', '“I’m sorry.” (Offer your hand.)') },
    { id: 'explain', text: l('„Ona ma to naučila. Chcel som ti to povedať.“', '“She taught me. I wanted to tell you.”') },
    { id: 'silent', text: l('(Mlčky si utrieť krv.)', '(Wipe away the blood in silence.)') },
  ])
  g.set('c13.campChoice', c)
  if (c === 'sorry') {
    await g.say('player', l('Prepáč.', 'I’m sorry.'), { mood: 'sad' })
    await g.narrate(l('Podal ruku. Otvorenú dlaň, bez pazúrov, bez glyfov. Len ruku. Flint na ňu pozeral. Dlho.', 'He held out his hand. An open palm, no claws, no glyphs. Just a hand. Flint looked at it. For a long time.'))
    g.rel('flint', 1)
  } else if (c === 'explain') {
    await g.say('player', l('Ona ma to naučila. Na Itake, v tajnosti. Chcel som ti to povedať.', 'She taught me. On the Itaka, in secret. I wanted to tell you.'), { mood: 'sad' })
    await g.say('flint', l('Ona. Samozrejme, že ona.', 'Her. Of course it was her.'), { mood: 'sad' })
  } else {
    await g.narrate(l('Arkot si utrel ústa. Bolelo to. Nie čeľusť. Stará rana.', 'Arkot wiped his mouth. It hurt. Not the jaw. An old wound.'))
    g.rel('flint', -1)
  }
  await g.narrate(l('A Flint odišiel. K lodi. Do tmy.', 'And Flint walked away. To the ship. Into the dark.'))
  await g.walk('flint', [16, 8])
  g.show('flint', false)
  await g.narrate(l('Arkot stál s rukou vo vzduchu. Stisol ju do päste. Otvoril. Prsty sa triasli. Nie od Spiry.', 'Arkot stood with his hand in the air. He closed it into a fist. Opened it. His fingers were shaking. Not from Spira.'))
  void g.walk('goji', [14, 7])
  await g.wait(800)
  g.pose('goji', 'sit')
  g.cinematic(false)
  await lore(g)
}

/** Aether's confession by the fire, translated by Goji. */
async function lore(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.show('flint', true)
  g.teleport('flint', [8, 11], 45)
  g.teleport('player', [10, 9])
  g.face('player', 'aether')
  g.pose('player', 'sit')
  g.teleport('goji', [14, 7])
  g.pose('goji', 'sit')
  await g.narrate(l('Flint sa po chvíli vrátil. Neprisadol si. Oprel sa o balvan tri kroky od ohňa. Rysie uši dozadu. Oči na plameňoch, ale myseľ niekde inde.', 'After a while Flint came back. He did not sit down. He leaned against the boulder three steps from the fire. Lynx ears back. Eyes on the flames, mind somewhere else.'))
  g.music('space_theme', 2500)
  await g.focus('aether', { ms: 1000, zoom: 1.2 })
  g.pose('aether', 'stand')
  await g.narrate(l('Aether zdvihol hlavu k oblohe. Papuľa otvorená, srsť na šiji striebristá v svetle ohňa. Dlhé, hrubé slabiky.', 'Aether lifted his head to the sky. His jaws open, the fur at his neck silver in the firelight. Long, rough syllables.'))
  await aether(g, 'Áj rimembrr…')
  await goji(g, l('Hovorí… že si pamätá.', 'He says… that he remembers.'))
  await aether(g, 'Forrests. Grríjn. Tól. Wí rann…')
  await goji(g, l('Lesy. Zelené. Vysoké. Bežali cez ne… on a jeho rodina. Keď boli mladí.', 'Forests. Green. Tall. They ran through them… he and his family. When they were young.'), 'tender')
  await aether(g, 'Aur mástrr tuk as… tu ze stárrs.')
  await goji(g, l('Ich pán… ich zobral so sebou. Na cestu. Ku hviezdam.', 'Their master… took them with him. On a journey. To the stars.'))
  const c1 = await g.choose([
    { id: 'ask', text: l('„Ku hviezdam?“', '“To the stars?”') },
    { id: 'listen', text: l('(Počúvať.)', '(Listen.)') },
  ])
  if (c1 === 'ask') await g.say('player', l('Ku hviezdam?', 'To the stars?'), { mood: 'surprised' })
  await aether(g, 'Wí slept inn ze kóld. Ze wórld… wóz grrej.')
  await goji(g, l('Počas cesty spali. V chlade. Keď sa zobudili… svet vonku bol pustý. Sivý. Nič tam nerástlo.', 'During the journey they slept. In the cold. When they woke… the world outside was barren. Grey. Nothing grew there.'))
  await aether(g, 'Wí livd inn a kejdž.')
  await goji(g, l('Žili v… klietke. Na tom svete. Zavretí. Dlho.', 'They lived in a… cage. On that world. Shut in. For a long time.'), 'sad')
  await aether(g, 'Hí fejld. Hí kud nott tejm itt.')
  await goji(g, l('Nepodarilo sa mu to. Ich pánovi. Nepodarilo sa mu… skrotiť ten svet.', 'He failed. Their master. He could not… tame that world.'))
  await goji(g, l('Vrátili sa na loď. A prišli sem.', 'They went back to the ship. And came here.'))
  g.codex('world.c13_starfarers')
  await g.narrate(l('Cesta ku hviezdam. Spánok v chlade. Sivý svet. Arkot nemal celý tvar, no okraje sa už rysovali.', 'A journey to the stars. Sleep in the cold. A grey world. Arkot did not have the whole shape, but its edges were showing.'))
  // the dust that rotted
  await aether(g, 'Onn ze wej…')
  await g.say('goji', l('Tss. Nechcem to preložiť.', 'Tss. I don’t want to translate that.'), { mood: 'fear' })
  await g.say('flint', l('Goji.', 'Goji.'))
  await goji(g, l('Cestou im dochádzalo jedlo. A vzduch.', 'On the way they ran out of food. And air.'), 'sad')
  await aether(g, 'Ze prráblem wóz inn as.')
  await goji(g, l('Ale to nebol najväčší problém. Problém bol… v ich vnútri. Čosi, čo dýchalo s nimi. Niečo, čo ich držalo nažive.', 'But that was not the greatest problem. The problem was… inside them. Something that breathed with them. Something that kept them alive.'))
  await goji(g, l('Je to ako… prach. Ale s hladom. S vôľou.', 'It is like… dust. But with hunger. With a will.'), 'fear')
  const c2 = await g.choose([
    { id: 'curse', text: l('„Prach. Yera hovorila, že prach nie je Spira. Že je to kliatba.“', '“Dust. Yera said dust isn’t Spira. That it’s a curse.”') },
    { id: 'quiet', text: l('(Mlčať.)', '(Stay silent.)') },
  ])
  if (c2 === 'curse') {
    await g.say('player', l('Prach. Yera hovorila, že prach nie je Spira. Že je to kliatba.', 'Dust. Yera said dust isn’t Spira. That it’s a curse.'))
    await g.narrate(l('Goji naňho rýchlo pozrel, prekvapenie, čo nemal čas skryť. Flint sa nepohol, ale uši sa mu narovnali.', 'Goji glanced at him quickly, a surprise he had no time to hide. Flint did not move, but his ears straightened.'))
  }
  g.codex('world.prach')
  await aether(g, 'Itt bigann tu rott.')
  await goji(g, l('Začal hniť. To, čo ich držalo nažive… začalo sa obracať proti nim.', 'It began to rot. The thing that kept them alive… began to turn against them.'), 'fear')
  await goji(g, l('Jeho pán a ďalší traja… prežili.', 'His master and three others… survived.'))
  await g.say('flint', l('Ako?', 'How?'))
  await goji(g, l('Vysali slabších. Do sucha.', 'They drained the weaker ones. Dry.'), 'blank')
  await g.walk('dara', [11, 11])
  g.pose('dara', 'kneel')
  g.fx('fire', [11, 10], { scale: 1.2 })
  await g.narrate(l('Nikto sa neozval. Dara nemo vstala, zdvihla poleno a priložila. Iskry vyleteli nahor a zomreli v snehu.', 'No one spoke. Dara rose without a word, picked up a log and laid it on the fire. Sparks flew up and died in the snow.'))
  g.pose('dara', 'sit')
  // Samael
  g.propVisible('fire', false)
  g.propVisible('embers', true)
  g.pose('aether', 'lie')
  await g.narrate(l('Oheň prestal praskať. Aetherova hlava klesla k labám. Ďalšie slová šli nízko, len Gojimu. Alebo sebe.', 'The fire stopped crackling. Aether’s head sank onto his paws. The next words went low, only to Goji. Or to himself.'))
  await goji(g, l('Jeden z tých štyroch je mŕtvy.', 'One of those four is dead.'))
  await goji(g, l('Jeho duch… To v Taminom dome… je jeho hniloba.', 'His ghost… The thing in Tami’s house… is his rot.'), 'fear')
  await goji(g, l('Poznal ho. Volal sa…', 'He knew him. His name was…'))
  g.sfx('bass', 0.8)
  g.shake(0.15, 800)
  await goji(g, l('Samael.', 'Samael.'), 'blank')
  await g.narrate(l('Meno viselo vo vzduchu. Tri slabiky, čo nepatrili na túto planinu. Netušil, že tá vec v tme mala meno.', 'The name hung in the air. Three syllables that did not belong on this plateau. He had not known the thing in the dark had a name.'))
  await goji(g, l('A rešpektoval Aetherovu rodinu. Asi… asi sa bál jeho pána.', 'And he respected Aether’s family. Maybe… maybe he feared his master.'))
  await g.say('flint', l('Bál? On sa bál?', 'Feared? He was afraid?'), { mood: 'surprised' })
  g.face('aether', 'flint')
  await g.narrate(l('Aether otvoril oči. Pozrel na Flinta. Dlho. Znova ich zavrel. Neodpovedal.', 'Aether opened his eyes. He looked at Flint. For a long time. He closed them again. He did not answer.'))
  // Infera
  await g.narrate(l('Niečo preletelo po oblohe. Svetelný bod, pomalý, stabilný, v dokonalej línii, akú nerobil žiaden vták. Príliš pomalý na meteor. Príliš rýchly na hviezdu.', 'Something crossed the sky. A point of light, slow, steady, in a perfect line no bird ever made. Too slow for a meteor. Too fast for a star.'))
  g.follow()
  void inferaPass(g)
  await g.zoom(0.85, 900)
  await aether(g, 'Infera.')
  await g.say('goji', l('Infera.', 'Infera.'), { mood: 'surprised' })
  g.codex('world.infera')
  await goji(g, l('To je moja loď. Na tej lodi sme prišli. Ja a moja rodina.', 'That is my ship. We came on that ship. I and my family.'), 'tender')
  await g.narrate(l('Svetlo preletelo nad nimi. Pomaly. Bez zvuku. Bez stopy. Aether ho sledoval celou cestou, bod svetla, čo bol kedysi klietkou. Domovom. Hrobom.', 'The light passed over them. Slowly. Without a sound. Without a trace. Aether followed it all the way, a point of light that had once been a cage. A home. A grave.'))
  await goji(g, l('Cesta bola dlhá. A ťažká. Ale nevie zabudnúť. Na veci, čo tam zažil.', 'The journey was long. And hard. But he cannot forget. The things he lived through there.'), 'sad')
  // Renn
  await g.zoom(1.15, 900)
  await aether(g, 'Lóng egou… hwen ze wintrrz wérr májld…')
  await goji(g, l('Pred mnohými zimami… keď zimy nebývali také drsné… stretol muža. Človeka.', 'Many winters ago… when the winters were not so harsh… he met a man. A human.'))
  await goji(g, l('Bol iný než jeho pán. Láskavý. A múdry.', 'He was different from his master. Kind. And wise.'), 'tender')
  await goji(g, l('Nasledoval ho.', 'He followed him.'))
  await goji(g, l('Jeho rodina je na severe. Niekde. Chcel by ich ešte niekedy vidieť.', 'His family is in the north. Somewhere. He would like to see them again one day.'))
  await goji(g, l('Teraz, keď Renn nežije… nemá to smer. Bez neho… nič nemá smer.', 'Now that Renn is dead… it has no direction. Without him… nothing has direction.'), 'sad')
  await g.say('player', l('Mapa bez severu.', 'A map without a north.'), { thought: true })
  await goji(g, l('Dúfa, že ho opäť nájde.', 'He hopes he will find him again.'), 'tender')
  // the man in the Diera
  await goji(g, l('Človek, ktorého hľadáme… nie je jedným z tých štyroch. On tu bol skôr. Ale spal.', 'The man we are looking for… is not one of the four. He was here before. But he was asleep.'))
  await goji(g, l('Povedal mi, že niekoho hľadá. Nič iné ho nezaujíma.', 'He told me he is looking for someone. Nothing else interests him.'))
  g.face('aether', 'player')
  await g.focus('aether', { ms: 700, zoom: 1.3 })
  await g.narrate(l('Aether otvoril oči. Pozrel na Arkota. Priamo, bez uhýbania. Jantár do žltozeleného. Starý do mladého.', 'Aether opened his eyes. He looked at Arkot. Directly, without looking away. Amber into yellow-green. Old into young.'))
  await aether(g, 'Áj dónt nóu if hí wil kamm.')
  await goji(g, l('Neviem, či sa s nami vráti.', 'I don’t know if he will come back with us.'), 'fear')
  await goji(g, l('Prvýkrát po takej dlhej dobe… má pochybnosti.', 'For the first time in such a long time… he has doubts.'))
  g.follow()
  await g.zoom(1, 800)
  await g.narrate(l('Sneh sadal na uhlíky bez zvuku. A niekde vysoko, mimo dosahu očí a sluchu, krúžila Infera. Prázdna. Stará.', 'Snow settled on the embers without a sound. And somewhere high above, beyond the reach of eyes and ears, Infera circled. Empty. Old.'))
  g.set('c13.lore')
  // morning
  g.music(null, 2000)
  await g.atmosphere({ sky: { top: '#3a4a68', bottom: '#d8a888', stars: 0.2, aurora: 0, clouds: 0.4 }, hemi: { sky: '#c8b8b0', ground: '#3a3438', intensity: 1.1 }, sun: { color: '#ffd0a0', intensity: 1.1, dir: [0.6, 0.6, 0.4] }, fog: { color: '#8a8a98', near: 6, far: 30 } }, 2500)
  await g.narrate(l('Kotol vychladol pred úsvitom. Goji poklepal po pancierovom boku a prikývol. Itaka sa zdvihla v prvom svetle Sai, pomaly, ľahko a odhodlane.', 'The boiler cooled before dawn. Goji tapped the armoured flank and nodded. The Itaka rose in the first light of Sai, slowly, lightly, with resolve.'))
  await g.narrate(l('Nikto nevyslovil jediné slovo o Aetherovej spovedi. Ale nikto nezabudol.', 'No one said a single word about Aether’s confession. But no one forgot.'))
  await g.narrate(l('Potom sa obloha zmenila. Nízke oblaky, parné a vlhké, nepríjemne teplé. Teplé oblaky na severe. Vietor už nefúkal zo severu. Fúkal zdola.', 'Then the sky changed. Low clouds, steamy and damp, unpleasantly warm. Warm clouds in the north. The wind no longer blew from the north. It blew from below.'))
  await g.narrate(l('Pred provou sa zem otvorila.', 'Ahead of the prow, the earth opened.'))
  await g.fade('black', 1200)
  g.cinematic(false)
  await g.goto('c13_terrace')
}

async function inferaPass(g: GameAPI): Promise<void> {
  const steps = 60
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    void g.atmosphere({ sky: tundraSky(0.75, 0.08 + k * 0.84, 0.72 + Math.sin(k * Math.PI) * 0.16) }, 0)
    await g.wait(110)
  }
}
