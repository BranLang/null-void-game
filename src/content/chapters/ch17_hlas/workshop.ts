/**
 * c17_workshop — "The covers are memories." Violet behind the blue: Samael
 * speaks through Tami. The heavy hour, the blackout, the dust walls, and
 * Tami's body walking out of the Metaru with the Book. Felix: "Don't go."
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l, type L } from '../../../i18n/i18n'
import { WORKSHOP_AMB, WORKSHOP_MAP } from '../ch16_spoved/shared'
import { WORKSHOP_PROPS } from '../ch16_spoved/workshop'
import './props'

const BOOK = 'ch16_book@6,5'
const LAMPS = ['lantern@6,5', 'c17lamp', 'candles@8,2']

/** Samael's voice from Tami's mouth: syllables that catch on a wall, dead points between sentences. */
async function hollow(g: GameAPI, text: L, flicker = true): Promise<void> {
  if (flicker) {
    for (let i = 0; i < 3; i++) {
      g.costume('tami', i % 2 ? 'c17_tami_samael_empty' : 'c17_tami_violet')
      await g.wait(90 + i * 40)
    }
    g.costume('tami', 'c17_tami_samael_empty')
  }
  g.mood('tami', 'blank')
  await g.wait(450)
  await g.say('tami', text, { mood: 'blank' })
  await g.wait(350)
}

async function drum(g: GameAPI, slow = false): Promise<void> {
  for (let i = 0; i < 4; i++) {
    g.sfx('tick', 0.22)
    await g.wait(slow ? 420 : 170)
  }
}

async function voiceNight(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.stealth(false)
  g.pose('player', 'sit')
  g.pose('tami', 'sit')
  await g.wait(500)
  await g.narrate(l('V tú noc horela medzi nimi lampa, kým Tami sedela vedľa Yery pri stene presne tak, ako po celé tie dni čakania a ticha.', 'That night a lamp burned between them, while Tami sat beside Yera against the wall just as she had through all those days of waiting and silence.'))
  await g.narrate(l('Tami prehovorila. Žiadne oslovenie menom, ani slabá prosba o vodu.', 'Tami spoke. No name, no faint plea for water.'))
  await g.say('tami', l('Tie čierne dosky.', 'Those black covers.'), { mood: 'blank' })
  await g.narrate(l('Otočila k nej tvár. Oči sa neotočili s ňou. Zízali pred seba. Na stenu. Na surový plech a prázdnotu medzi tým.', 'She turned her face to her. The eyes did not turn with it. They stared ahead. At the wall. At the raw plating and the emptiness in between.'))
  await g.say('tami', l('Nie sú obal.', 'They are not a cover.'), { mood: 'blank' })
  g.sfx('crack', 0.15)
  await g.say('player', l('Čo?', 'What?'))
  await g.say('tami', l('Dosky. Na knihe.', 'The covers. On the book.'))
  await drum(g)
  await g.narrate(l('Tamine prsty na kolene. Bubnovali. Ten istý tik, ktorý Yera poznala. Ten istý rytmus. Tamine prsty. Tamino telo. Ale slová.', 'Tami’s fingers on her knee. Drumming. The same tic Yera knew. The same rhythm. Tami’s fingers. Tami’s body. But the words.'))
  await g.say('tami', l('Nie sú z kameňa ani z dreva, ale z prachu, ktorý je všade vonku.', 'They are not stone and not wood, but the dust that is everywhere outside.'))
  await g.narrate(l('Chlad jej zbehol po chrbtici až do chvosta.', 'Cold ran down her spine to the tip of her tail.'))
  await g.say('player', l('Odkiaľ to vieš?', 'How do you know that?'), { mood: 'fear' })
  await drum(g)
  await g.say('tami', l('Donieslo sa to ku mne. Hovoria o tom.', 'It reached me. People talk about it.'))
  await g.narrate(l('Yera chcela tomu veriť. Skoro verila.', 'Yera wanted to believe it. Almost did.'))
  await g.say('tami', l('Tie dosky nie sú obal, Yera. Sú to spomienky.', 'The covers are not a cover, Yera. They are memories.'))
  g.codex('book.c17_covers')
  await g.say('tami', l('El si vymazala pamäť. Na matku. Na domov. Na všetko pred tým, čím sa tu stala. Zamkla to do čierneho prachu. Do tých dosiek.', 'El erased her memory. Of her mother. Of home. Of everything before what she became here. She locked it into the black dust. Into those covers.'))
  for (let i = 0; i < 3; i++) {
    g.sfx('heartbeat', 0.4)
    await g.wait(520)
  }
  await g.narrate(l('Yera dýchala. Počítala údery srdca. Jeden. Dva. Tri.', 'Yera breathed. She counted her heartbeats. One. Two. Three.'))
  await g.say('tami', l('Ten prach vie veci, ktoré pergameny nie. O matke. O Elysiu. O tom, čo sa stalo pred tým, než sa El stala El.', 'That dust knows things the parchment does not. About the mother. About Elysium. About what happened before El became El.'))
  g.mood('player', 'fear')
  await g.say('player', l('Tami nepozná slovo Elysium.', 'Tami does not know the word Elysium.'), { thought: true, mood: 'fear' })
  await g.narrate(l('Yerine uši dozadu. Pazúry vonku. Pomaly. Jeden po druhom, ako keby ich vytŕhala zo seba.', 'Yera’s ears went back. Claws out. Slowly. One by one, as if she were tearing them out of herself.'))
  await g.say('tami', l('Ak ten gōstar dostane túto knihu… zistí, čo sa stalo s El. Nato príde po mňa.', 'If that gōstar gets this book… he will learn what happened to El. Then he will come for me.'))
  await g.narrate(l('Po mňa. Slovo spadlo medzi ne a zostalo tam ležať.', 'For me. The word fell between them and stayed there.'))
  await g.focus('tami', { ms: 1200, zoom: 1.8 })
  g.costume('tami', 'c17_tami_violet')
  g.sfx('bass', 0.25)
  await g.narrate(l('Späť na Taminu tvár. Na modré dúhovky. Hlbšie. A tam, tesne pod hladinou tej modrej, bola fialová. Nie záblesk ani odraz lampy. Stála a tichá prítomnosť, ktorá tam musela byť už od začiatku.', 'Back to Tami’s face. To the blue irises. Deeper. And there, just beneath the surface of that blue, was violet. Not a flash, not the lamp’s reflection. A still and silent presence that must have been there from the start.'))
  await g.say('player', l('Kto si?', 'Who are you?'), { mood: 'fear' })
  await hollow(g, l('Poznáš moje meno, Eltária.', 'You know my name, Eltária.'))
  g.codex('people.c17_samael')
  await g.narrate(l('Záhrada. Dážď. Postava z prachu medzi sochami. „Vidím ťa, Eltária.“ Rovnaký hlas. Tamine ústa.', 'The garden. Rain. A figure of dust among the statues. “I see you, Eltária.” The same voice. Tami’s mouth.'))
  await g.say('player', l('Vyhrala. … Nie. Nikdy nevyhrala.', 'She had won. … No. She had never won.'), { thought: true, mood: 'pain' })
  await hollow(g, l('Bojím sa ho, Eltária.', 'I am afraid of him, Eltária.'))
  await g.narrate(l('Prvá slabika prišla čistá. Druhá sa zachytila niekde v polovici Taminho hrdla, akoby cestou von narazila na stenu. Medzi vetami cudzie mŕtve body, keď sa Tamina brada zastavila v polpohybe a uši sa stočili dozadu, stiahnuté neviditeľnou šnúrkou.', 'The first syllable came clean. The second caught somewhere halfway up Tami’s throat, as if it had hit a wall on the way out. Between the sentences, strange dead points, where Tami’s chin stopped mid-movement and her ears jerked back, pulled by an invisible string.'))
  await hollow(g, l('Bojím sa ho nie preto, že je silný. Ale preto, že je spravodlivý.', 'I fear him not because he is strong. But because he is just.'))
  await hollow(g, l('Vieš, čo je Ex Inferis?', 'Do you know what Ex Inferis is?'), false)
  g.codex('gloss.ex_inferis')
  await g.narrate(l('Poznala to. Z textov. Z litánií. Bytosti, čo prišli z hĺbky a niesli so sebou hnev, čo nemal koniec.', 'She knew it. From the texts. From the litanies. Beings who came up from the deep, carrying a wrath without end.'))
  await hollow(g, l('On je jeden z nás. A ak sa dozvie, čo som urobil jeho dcére…', 'He is one of us. And if he learns what I did to his daughter…'))
  await drum(g, true)
  await g.narrate(l('Tamine prsty prestali bubnovať. Naraz. Prestrihnutá šľacha. A keď sa znova pohli, rytmus bol iný. Pomalší. Ťažší. Prsty skúšali nový nástroj a ešte nevedeli, ako silno naň treba tlačiť.', 'Tami’s fingers stopped drumming. All at once. A cut tendon. And when they moved again, the rhythm was different. Slower. Heavier. The fingers were trying out a new instrument and did not yet know how hard to press.'))
  await hollow(g, l('…nezastaví sa pri mne.', '…he will not stop at me.'), false)
  await g.say('player', l('Jeho dcére. Gōstar mal dcéru. Slepý muž, ktorý sa rozprával s prízrakmi, mal niekde na svete dcéru. A Samael jej ublížil.', 'His daughter. The Gōstar had a daughter. The blind man who talked with phantoms had a daughter somewhere in the world. And Samael hurt her.'), { thought: true })
  await g.say('player', l('Čo si jej urobil?', 'What did you do to her?'), { mood: 'angry' })
  await g.wait(1400)
  g.shake(0.08, 600)
  g.costume('tami', 'c17_tami_violet')
  await g.narrate(l('Tamino telo sa zachvelo. Chvost sa stisol k telu tak prudko, až sa srsť naježila proti smeru. Prsty sa zaťali do kolena, hlboko, pazúrmi, čo neboli Samaelove. Fialová za modrými očami zhasla. Nie na okamih. Na dlhšie.', 'Tami’s body shuddered. Her tail clamped to her body so hard the fur bristled against the grain. Her fingers dug into her knee, deep, with claws that were not Samael’s. The violet behind the blue eyes went out. Not for a moment. For longer.'))
  await g.wait(1200)
  g.costume('tami', 'c17_tami_samael_empty')
  await g.narrate(l('A keď sa vrátila, bola slabšia, ako plameň, čo niekto sfúkol a zapálil späť, ale o čosi menší. Neodpovedal.', 'And when it returned it was weaker, like a flame someone had blown out and lit again, only a little smaller. He did not answer.'))
  await g.narrate(l('Pazúry sa jej vysunuli samy a zaťali sa jej do kolien. Otázka bez odpovede: počúvať ďalej, alebo zabiť vec v tele priateľky.', 'Her claws slid out of themselves and dug into her knees. A question without an answer: listen on, or kill the thing in her friend’s body.'))
  const c = await g.choose([
    { id: 'listen', text: l('Počúvať ďalej. Tami je tam. Niekde pod tým.', 'Listen on. Tami is in there. Somewhere beneath it.') },
    { id: 'hand', text: l('Zdvihnúť ľavú ruku. Mizu.', 'Raise the left hand. Mizu.') },
  ])
  if (c === 'hand') {
    g.glyph('player', 2.4)
    await g.narrate(l('Ruka sa jej zdvihla. Glyfy sa rozsvietili. A zastala. Tamina hruď stúpala a klesala. Tamino teplo. Tamina tvár.', 'Her hand came up. The glyphs lit. And it stopped. Tami’s chest rose and fell. Tami’s warmth. Tami’s face.'))
    g.glyph('player', 0.6)
    g.set('c17.raisedHand')
  } else {
    await g.narrate(l('Tami dýchala. A vnútri niečo, čo nemalo pľúca, ale dýchalo s ňou. Zdieľalo jej vzduch. Jej teplo. Jej tvár.', 'Tami breathed. And inside, something without lungs breathed with her. Sharing her air. Her warmth. Her face.'))
    g.rel('tami', 1)
  }
  await g.say('player', l('Počuješ ma, Tami?', 'Can you hear me, Tami?'), { mood: 'sad' })
  await g.wait(900)
  await hollow(g, l('Počuje.', 'She hears.'), false)
  await g.say('player', l('Čo od nej chceš?', 'What do you want from her?'), { mood: 'angry' })
  await hollow(g, l('Cestu von.', 'A way out.'), false)
  g.sfx('crack', 0.15)
  await g.narrate(l('Lampa znova praskla v tichu. Zovretie v hrudi. Žiadny strach či odpor. Pazúry sa jej zasunuli samy.', 'The lamp crackled again in the silence. A tightness in her chest. No fear, no revulsion. Her claws slid back of themselves.'))
  g.follow()
  await g.zoom(1.1, 600)
  // ---------------------------------------------------------------- the heavy hour
  g.sai('heavy')
  await g.atmosphere({ hemi: { sky: '#7a6a5a', ground: '#201812', intensity: 0.6 }, grade: { tint: '#e8dccc', saturation: 0.7, contrast: 1.1, vignette: 0.7 } }, 1500)
  await g.narrate(l('Ťažká hodina. V kostiach. Na viečkach. Na prstoch. Na myšlienkach. Železný chrám sa utiahol o čosi bližšie k zemi.', 'The heavy hour. In the bones. On the eyelids. On the fingers. On the thoughts. The Iron Temple pulled a little closer to the earth.'))
  g.pose('tami', 'stand')
  g.lift('tami', 0.35)
  g.costume('tami', 'c17_tami_samael_empty')
  g.shake(0.15, 500)
  await g.narrate(l('Tami vstala. Naraz. Celým telom. Ako keby váha neplatila pre ňu. Chrbtica rovná. Ramená dozadu. Hlava hore. Modrá z jej očí zmizla a nahradila ju plná, jasná fialová.', 'Tami stood. All at once. With her whole body. As if weight did not apply to her. Spine straight. Shoulders back. Head high. The blue was gone from her eyes, replaced by a full, clear violet.'))
  g.pose('player', 'stand')
  await g.say('player', l('Tami.', 'Tami.'), { mood: 'fear' })
  await g.say('tami', l('Tami spí.', 'Tami is asleep.'), { mood: 'blank' })
  // ---------------------------------------------------------------- the blackout
  for (const at of [
    [1, 2],
    [6, 1],
    [12, 2],
    [1, 9],
    [9, 9],
  ] as [number, number][]) {
    g.particles({ kind: 'blackdust', at, radius: 1.6, count: 160, id: `dust${at[0]}${at[1]}` })
  }
  await g.narrate(l('Prach. Nie z Tami. Zo stien. Zo stropu. Zo škár v trupe. Jemný, čierny, takmer neviditeľný. Celý ten čas sedel v starom plášti Železného chrámu a čakal.', 'Dust. Not from Tami. From the walls. From the ceiling. From the seams of the hull. Fine, black, almost invisible. All this time it had sat in the old shell of the Iron Temple, waiting.'))
  for (const id of LAMPS) g.propVisible(id, false)
  g.propVisible('boiler@1,1', false)
  g.sfx('bass', 0.7)
  await g.atmosphere({ hemi: { sky: '#1a1830', ground: '#050408', intensity: 0.18 }, exposure: 0.7, sounds: ['crowd', 'drone'] }, 500)
  g.sfx('whoosh', 0.6)
  await g.wait(200)
  g.sfx('whoosh', 0.5)
  await g.narrate(l('Svetlá zhasli a oheň vo Felixovej peci odumrel. Zelenkavé rastliny na stenách okamžite sčerneli. V tme plieskot stoviek krídiel holubov, čo celé generácie nepoznali takúto čierňavu.', 'The lights went out and the fire in Felix’s furnace died. The greenish plants on the walls blackened at once. In the dark, the clatter of hundreds of pigeons’ wings, generations that had never known such blackness.'))
  await g.narrate(l('Z tmy krik detí aj dospelých. Prach sa nikoho nedotkol. Len im zobral svetlo. Železný chrám nebol úkryt. Bol klietkou, kde ich nechal žiť.', 'From the dark, children and grown-ups screaming. The dust touched no one. It only took their light. The Iron Temple was no shelter. It was a cage where he had let them live.'))
  g.lift('tami', 0.15)
  void g.walk('tami', [6, 6], { speed: 4 })
  void g.walk('felix', [7, 4], { speed: 2.2 })
  g.particles({ kind: 'blackdust', at: [7, 5], radius: 0.9, count: 300, id: 'wall' })
  await g.wait(800)
  g.shake(0.2, 300)
  await g.narrate(l('Felix. Ruky siahli po stole, po mieste, kde ležala Kniha. Ale stena z prachu medzi ním a stolom. Hustá. Nepriehľadná. Narazil a prach ho zastavil. Telom.', 'Felix. His hands reached for the table, for the place where the Book lay. But a wall of dust stood between him and the table. Dense. Opaque. He struck it and the dust stopped him. With its body.'))
  // ---------------------------------------------------------------- her ice
  g.cinematic(false)
  g.objective(l('Mizu. Ľad k pohybu v tme.', 'Mizu. Ice towards the movement in the dark.'))
  g.hint(l('1 — Ľad (Ctrl + 1 okamžite)', '1 — Ice (Ctrl + 1 instantly)'))
  g.free()
  let cast = false
  const off = g.onCast((e) => {
    if (e.id === 'ice') cast = true
  })
  const t0 = g.time
  await g.until(() => cast || g.time - t0 > 14)
  off()
  g.lock()
  g.hint(null)
  g.objective(null)
  g.cinematic(true)
  g.fx('frost', [6, 6], { scale: 2 })
  g.sfx('crack', 0.8)
  await g.narrate(l('Modré svetlo v tme. Mizu. Chlad vyrazil z jej rúk smerom k pohybu.', 'Blue light in the dark. Mizu. The cold burst from her hands towards the movement.'))
  g.fx('dust', [6, 6])
  await g.narrate(l('Nezasiahla. Ľad narazil do neviditeľnej steny z prachu a s tichým puknutím sa rozptýlil. Tma ho pohltila. Bez odporu.', 'It did not hit. The ice struck an invisible wall of dust and scattered with a soft crack. The dark swallowed it. Without resistance.'))
  g.propVisible(BOOK, false)
  g.costume('tami', 'c17_tami_samael')
  await g.walk('tami', [3, 11], { speed: 5 })
  g.show('tami', false)
  await g.narrate(l('Tami bola preč. Tamino telo bolo rýchlejšie než Yerin ľad.', 'Tami was gone. Tami’s body was faster than Yera’s ice.'))
  g.sfx('door', 0.9)
  await g.wait(600)
  await g.narrate(l('Mohutné dvere Železného chrámu. Zvuk kolesa zámku, otáčanie, otvorenie. Studený vzduch. Ostrý, ako po blesku. Vonku. Dvere dokorán.', 'The great doors of the Iron Temple. The sound of the lock wheel, turning, opening. Cold air. Sharp, as after lightning. Outside. The doors wide open.'))
  // ---------------------------------------------------------------- the empty table
  for (const id of ['dust12', 'dust61', 'dust122', 'dust19', 'dust99', 'wall']) g.stopParticles(id)
  for (const id of LAMPS) g.propVisible(id, true)
  g.propVisible('boiler@1,1', true)
  await g.atmosphere({ ...WORKSHOP_AMB, hemi: { sky: '#8a7a64', ground: '#2a1e14', intensity: 0.75 } }, 1500)
  await g.narrate(l('Svetlá sa pomaly vrátili a preťažené lampy zapraskali. Prach zmizol zo stien i stropu, jednoducho sa stiahol a odišiel spolu s ňou.', 'The lights slowly returned and the overloaded lamps crackled. The dust vanished from the walls and the ceiling; it simply withdrew and left with her.'))
  await g.focus([6, 5], { ms: 1000, zoom: 1.5 })
  await g.narrate(l('Prázdny stôl. Felix nehybný pri ňom. Dlaň na prázdnom dreve, na mieste, kde ležala Kniha. Prsty sa zavreli. Okolo ničoho.', 'An empty table. Felix motionless beside it. His palm on the empty wood, on the place where the Book had lain. The fingers closed. Around nothing.'))
  await g.narrate(l('Na vedľajšom stole tri rúrky. Hotové. Medené cievky lesklé. Čisté.', 'On the next table, three tubes. Finished. The copper coils gleaming. Clean.'))
  g.follow()
  await g.zoom(1.25, 500)
  g.glyph('player', 2.6)
  await g.narrate(l('Nohy sa triasli a svet sa naklápal pri každom pohybe hlavy, ale Spira v nej bzučala. Glyfy na predlaktiach horeli. Tam, kde pred chvíľou bola slabosť, bol teraz oheň.', 'Her legs shook and the world tilted with every movement of her head, but the Spira hummed in her. The glyphs on her forearms burned. Where there had been weakness a moment ago, there was fire now.'))
  await g.say('player', l('Prázdne ruky. Zase. Ale nie tentoraz.', 'Empty hands. Again. But not this time.'), { thought: true, mood: 'determined' })
  g.face('felix', 'player')
  g.sfx('click', 0.5)
  await g.say('felix', l('Nechoď.', 'Don’t go.'), { mood: 'sad' })
  await g.narrate(l('Šla.', 'She went.'))
  g.glyph('player', 0.8)
  g.set('c17.gone')
  g.cinematic(false)
  g.objective(l('Za ňou. Von, do ťažkej hodiny.', 'After her. Out, into the heavy hour.'))
  g.checkpoint()
}

export const workshop17: SceneDef = {
  id: 'c17_workshop',
  name: l('Felixova dielňa · noc', 'Felix’s Workshop · Night'),
  ambience: { ...WORKSHOP_AMB, music: 'black_dust' },
  map: WORKSHOP_MAP,
  camera: { zoom: 1.25 },
  sai: { phase: 'neutral' },
  player: { character: 'c16_yera', at: [1, 8], facing: 45 },
  props: [...WORKSHOP_PROPS, { type: 'lantern', at: [2, 8], params: { style: 'ground' }, id: 'c17lamp' }],
  actors: [
    { id: 'tami', character: 'tami', at: [1, 7], pose: 'sit', facing: 45 },
    { id: 'felix', character: 'felix', at: [8, 2], facing: 135 },
  ],
  exits: [{ area: [1, 11, 6, 11], to: 'c17_streets', spawn: 'gate', when: (g) => !!g.flag('c17.gone') }],
  onEnter: async (g) => {
    if (g.flag('c17.gone')) {
      g.show('tami', false)
      g.propVisible(BOOK, false)
      g.sai('heavy')
      g.objective(l('Za ňou. Von, do ťažkej hodiny.', 'After her. Out, into the heavy hour.'))
      return
    }
    await g.once('c17.voice', () => voiceNight(g))
  },
}
