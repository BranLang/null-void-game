/**
 * c16_workshop — Felix's workshop. Four visits: the German confession on the
 * last page; the verse of Tenši and "Ich weiß" (the faith choice); the dust
 * recordings of El's voice from the forbidden electric box; the coil guns.
 */
import type { PlacedProp, SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { WORKSHOP_AMB, WORKSHOP_MAP } from './shared'

const stage = (g: GameAPI): number => Number(g.flag('c16.stage')) || 1

/** The woman's voice from the covers, spoken through Felix's unmoving jaw. */
async function voice(g: GameAPI, sk: string, en: string): Promise<void> {
  await g.say('c16_voice', l(sk, en), { portrait: false })
}

// ------------------------------------------------------------------------- 1: the confession
async function confession(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.walk('player', [5, 7])
  g.face('player', [6, 5])
  await g.narrate(l('Dielňa, zatvorené dvere, olejová lampa medzi nimi, kniha na stole. Otvorená.', 'The workshop, the door closed, an oil lamp between them, the book on the table. Open.'))
  await g.narrate(l('Odkedy jej Soril v ten prvý večer vložila dosky do dlaní, Yera po nich prechádzala prstami, pomaly, opatrne, ako po niečom, čo mohlo odpustiť alebo potrestať. Originál čítavala tajne. V podzemí, pri jedinej sviečke a zásadne sama.', 'Ever since Soril laid the covers in her palms that first evening, Yera had run her fingers over them, slowly, carefully, as over something that might forgive or punish. The original she read in secret. Underground, by a single candle, and always alone.'))
  await g.focus('felix', { ms: 1000, zoom: 1.3 })
  await g.narrate(l('Felix stál nad poslednou stranou s prstami na pergamene a jeho sklenené oči sa zúžili do úzkych bodov.', 'Felix stood over the last page with his fingers on the parchment, and his glass eyes narrowed to points.'))
  await g.say('felix', l('Posledná strana. Iný rukopis aj iný jazyk.', 'The last page. A different hand and a different language.'))
  await g.read(
    l('Kniha El · posledná strana', 'The Book of El · the last page'),
    l(
      '*Ich brauche keine Götter.*\n*Es gibt keinen Gott für das, was ich getan habe.*\n\n*Sie glauben, ich sei ein Dämon. Sollen sie.*\n\n*Ich suche nur den Ausweg aus dem, was ich getan habe.*\n\n(Ostré, hranaté znaky. Nedokázala ich prečítať. Ani ona. Ani Soril. Ani Eltárie pred nimi.)',
      '*Ich brauche keine Götter.*\n*Es gibt keinen Gott für das, was ich getan habe.*\n\n*Sie glauben, ich sei ein Dämon. Sollen sie.*\n\n*Ich suche nur den Ausweg aus dem, was ich getan habe.*\n\n(Sharp, angular letters. She could not read them. Neither could Soril. Nor the Eltárias before them.)',
    ),
    { style: 'cipher' },
  )
  await g.say('felix', l('Deutsche Handschrift.', 'Deutsche Handschrift.'), { mood: 'tender' })
  await g.narrate(l('Felixov hlas sa zmenil. Hlbší. Mäkší. Ako keby prepnutie jazyka v ňom otvorilo komoru, ktorú Staroreč držala zamknutú.', 'Felix’s voice changed. Deeper. Softer. As if switching languages had opened a chamber in him that the Old Tongue kept locked.'))
  await g.say('player', l('Ty tomu rozumieš?', 'You understand it?'), { mood: 'surprised' })
  await g.narrate(l('Felix neodpovedal hneď. Pozeral na tie slová dlho. Železný prst spočíval na okraji strany. Nehybnosť stroja, čo nie je v poruche. Nehybnosť starca nad listom z domova.', 'Felix did not answer at once. He looked at the words for a long time. An iron finger rested on the edge of the page. The stillness of a machine that is not broken. The stillness of an old man over a letter from home.'))
  await g.say('felix', l('Toto nie je tvoja posvätná kniha. Toto je spoveď.', 'This is not your holy book. This is a confession.'))
  await g.say('felix', l('Ich brauche keine Götter.', 'Ich brauche keine Götter.'))
  await g.narrate(l('„Nepotrebujem bohov,“ preložil. Prst prešiel na ďalší riadok.', '“I need no gods,” he translated. His finger moved to the next line.'))
  await g.say('felix', l('Es gibt keinen Gott für das, was ich getan habe.', 'Es gibt keinen Gott für das, was ich getan habe.'))
  await g.narrate(l('„Pre to, čo som urobil, neexistuje boh.“', '“There is no god for what I have done.”'))
  g.mood('player', 'fear')
  await g.narrate(l('Yere vyschlo v krku. Ruka jej vyletela k hrdlu.', 'Yera’s throat went dry. Her hand flew to her neck.'))
  await g.say('player', l('Prestaň.', 'Stop.'), { mood: 'fear' })
  await g.narrate(l('Felix zdvihol zrak. Sklenené oči nehybné. Trpezlivé.', 'Felix looked up. Glass eyes unmoving. Patient.'))
  await g.say('player', l('Prestaň. Posvätné písmo nie je spoveď. Kto ti dal právo?', 'Stop. Holy scripture is not a confession. Who gave you the right?'), { mood: 'angry' })
  await g.say('player', l('Kňažky strážili túto Knihu štyristo zím, Felix. Každá generácia. Každá Eltária predo mnou vyrastala s vedomím, čo tie strany sú. Kliatba. Démonove slová. Tak nás to učili.', 'Priestesses guarded this Book for four hundred winters, Felix. Every generation. Every Eltária before me grew up knowing what those pages are. A curse. The Demon’s words. That is what they taught us.'), { mood: 'angry' })
  await g.say('player', l('Alebo nevedeli jazyk.', 'Or they did not know the language.'), { thought: true })
  await g.narrate(l('Myšlienka prišla sama. Tichá. Ostrá. Yera ju zatlačila naspäť.', 'The thought came by itself. Quiet. Sharp. Yera pushed it back.'))
  await g.say('felix', l('Sie glauben, ich sei ein Dämon. Sollen sie.', 'Sie glauben, ich sei ein Dämon. Sollen sie.'), { mood: 'closed' })
  await g.narrate(l('Zavrel oči. „Oni veria, že som démon. Nech.“', 'He closed his eyes. “They believe I am a demon. Let them.”'))
  await g.say('player', l('Kto by to napísal? Kto by napísal do posvätnej knihy „nech ma majú za démona“? Aký démon prosí, Felix?', 'Who would write that? Who would write into a holy book “let them take me for a demon”? What demon begs, Felix?'), { mood: 'sad' })
  await g.say('felix', l('Ich suche nur den Ausweg aus dem, was ich getan habe.', 'Ich suche nur den Ausweg aus dem, was ich getan habe.'))
  await g.narrate(l('„Hľadám len východisko z toho, čo som urobil.“', '“I am only looking for a way out of what I have done.”'))
  await g.narrate(l('Nič sa nezmenilo. Pach oleja a horúcej smoly, žlté svetlo lampy. A Yera tam stála s oboma rukami na stole a nosník vnútri, čo držal pohromade všetko, čomu celý život verila, sa potichu ohýbal pod váhou, ktorá tam pred chvíľou nebola.', 'Nothing had changed. The smell of oil and hot pitch, the yellow lamplight. And Yera stood there with both hands on the table, and the beam inside her that held together everything she had believed all her life bent quietly under a weight that had not been there a moment ago.'))
  await g.say('player', l('Záhrada. Dážď. „Nemám dôvod.“ Nie. Nebol to rovnaký hlas. Nemohol byť. Démon klame. Démoni klamú vždy. Soril povedala.', 'The garden. Rain. “I have no reason.” No. It was not the same voice. It could not be. The demon lies. Demons always lie. Soril said so.'), { thought: true, mood: 'pain' })
  await g.read(
    l('Kniha El · portrét', 'The Book of El · the portrait'),
    l('*Uhľom na pergamene. Unavený muž. Oči bez zreníc.*\n\nPod kresbou jedno slovo:\n\n*On.*', '*Charcoal on parchment. A tired man. Eyes without pupils.*\n\nBeneath the drawing, one word:\n\n*Him.*'),
    { style: 'book' },
  )
  await g.say('player', l('To je démon. El ho zachytila tak, ako stál pred ňou. A čo, ak nakreslila unavené monštrum? To je všetko. To musí byť všetko.', 'That is the demon. El drew him as he stood before her. So what if she drew a tired monster? That is all. That has to be all.'), { thought: true })
  await g.narrate(l('Felix položil dlaň na dosky obalu. Yera mala v prstoch pohyb, ktorým by mu tú ruku strhla, a zastavila ho skôr, než z neho niečo bolo. Mako. Nevyrastal s tým, čo ona.', 'Felix laid his palm on the covers. Yera’s fingers held the movement to tear his hand away, and she stopped it before it became anything. A Mako. He had not grown up with what she had.'))
  await g.say('felix', l('Prach. Každá čiastočka nesie kúsok toho, kto ju stvoril. Spomienky. Fragmenty. Stopy, čo sa nikdy neroztopili.', 'Dust. Every particle carries a piece of whoever made it. Memories. Fragments. Traces that never melted away.'))
  await g.narrate(l('Prach. Celý ten čas sa tých dosiek bezmyšlienkovito dotýkala. Fialové žilky jej rezonovali pod prstami. A netušila, čo drží v rukách.', 'Dust. All that time she had touched those covers without a thought. The violet veins resonated under her fingers. And she had no idea what she was holding.'))
  g.face('felix', [0, 5])
  await g.say('felix', l('Vonku. Toto je vonku.', 'Outside. This is what is outside.'))
  g.codex('book.c16_confession')
  g.sfx('door', 1)
  g.shake(0.2, 400)
  await g.fade('black', 500)
  await g.narrate(l('Odišla z dielne a zabuchla za sebou dvere, až sa hnevom zatriasli celé panely.', 'She left the workshop and slammed the door behind her so hard that every panel shook with anger.'))
  g.set('c16.stage', 2)
  g.cinematic(false)
  await g.goto('c16_metaru', 'work_in')
}

// ------------------------------------------------------------------------- 2: the verse of Tenši
async function hymn(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.teleport('felix', [10, 4])
  g.face('felix', [10, 5])
  await g.walk('player', [5, 7])
  await g.narrate(l('Dielňa bola taká, ako ju nechala: lampa, pach oleja, Kniha na stole otvorená na posledných stranách El. Fialové žilky v obale sa pri jej kroku rozbehli rýchlejšie. Tentoraz sa ich nedotkla.', 'The workshop was as she had left it: the lamp, the smell of oil, the Book on the table open at El’s last pages. The violet veins in the cover quickened at her step. This time she did not touch them.'))
  await g.narrate(l('Felix pri Knihe nesedel. Stál pri vedľajšom stole a na rúrku navíjal medený drôt, závit tesne pri závite. Neobzrel sa.', 'Felix was not sitting by the Book. He stood at the next table winding copper wire onto a tube, coil tight against coil. He did not look round.'))
  g.sfx('tick', 0.5)
  await g.say('player', l('Mýliš sa.', 'You are wrong.'), { mood: 'determined' })
  g.sfx('tick', 0.5)
  await g.say('player', l('Démon klame. Vždy. Aj keď prosí, najmä vtedy.', 'The demon lies. Always. Even when he begs, then most of all.'), { mood: 'determined' })
  await g.narrate(l('Sorilina veta, Sorilin hlas. Železné ruky viedli meď ďalej.', 'Soril’s sentence, Soril’s voice. The iron hands guided the copper on.'))
  g.face('player', [6, 5])
  g.pose('player', 'pray')
  await g.narrate(l('Postavila sa k stolu s Knihou. Dlane zložila pred sebou, jednu na druhú, ako na schodoch chrámu, a začala.', 'She went to the table with the Book. She folded her hands before her, one upon the other, as on the temple steps, and began.'))
  let ok = false
  while (!ok) {
    const r = await g.minigame('breath', {
      beats: 8,
      start: 1,
      bpm: 24,
      title: l('Verš o Tenši', 'The verse of Tenši'),
      subtitle: l('Od svetla po biele krídla, od posla po El vynesenú z tmy. Tým hlasom, ktorým ho v Nyau spievajú za súmraku.', 'From the light to the white wings, from the messenger to El carried out of the dark. In the voice they sing it with in Nyau at dusk.'),
    })
    ok = r.success
    if (!ok) await g.narrate(l('Slabika sa jej zachvela. Na to ju nevychovali. Začala odznova.', 'A syllable wavered. That was not how she was raised. She began again.'))
  }
  await g.narrate(l('Verš o Tenši, celý. Nepomýlila sa. Hlas jej nezakolísal ani na jedinej slabike; na to ho vychovali.', 'The verse of Tenši, whole. She made no mistake. Her voice did not falter on a single syllable; it had been raised for that.'))
  g.sfx('tick', 0.5)
  g.pose('player', 'stand')
  await g.say('player', l('Keby si bol Tenši, vedel by si, čo tie strany sú.', 'If you were Tenši, you would know what those pages are.'))
  await g.narrate(l('Drôt stíchol. Felix odložil rúrku na stôl, pomaly, aby sa neodkotúľala, a až teraz sa na ňu pozrel. Prstence sa v sklách zúžili a zase roztvorili.', 'The wire fell silent. Felix set the tube on the table, slowly, so it would not roll, and only now looked at her. The rings in the glass narrowed and opened again.'))
  g.face('felix', 'player')
  await g.say('felix', l('Ich weiß.', 'Ich weiß.'))
  await g.narrate(l('Nerozumela. Nebolo to „nie“, nič viac z toho nevyčítala, a on už zase dvíhal rúrku.', 'She did not understand. It was not “no”; she could read nothing more from it, and he was already lifting the tube again.'))
  await g.say('player', l('Zrazilo ho Tenši. Stojí to v Knihe. Nie v kópii, v jej vlastnej ruke. „Poslala ju matka. Jej podobu nevidela, len…“', 'Tenši struck him down. It stands in the Book. Not in the copy, in her own hand. “Her mother sent her. She did not see her form, only…”'), { mood: 'determined' })
  await g.narrate(l('Ďalšie slovo jej zostalo v ústach.', 'The next word stayed in her mouth.'))
  await g.narrate(l('Krídla. Len krídla. V Nyau si ten zápis preložila sama, znak za znakom: žiadne svetlo, žiadna biela, žiadne meno. Verš, ktorý pred chvíľou spievala, jej na perách vychladol.', 'Wings. Only wings. In Nyau she had translated that entry herself, sign by sign: no light, no white, no name. The verse she had just sung went cold on her lips.'))
  g.sfx('tick', 0.5)
  const c = await g.choose([
    { id: 'kept', text: l('Neodvolať ho. Povedať nočnú modlitbu, rovno a čisto.', 'Take nothing back. Say the night prayer, straight and clean.') },
    { id: 'broken', text: l('Mlčať. Nechať verš vychladnúť.', 'Stay silent. Let the verse go cold.') },
  ])
  g.set('ch16.faith', c)
  if (c === 'kept') {
    g.pose('player', 'pray')
    await g.say('player', l('El je svetlo. El je cesta. El sa vráti.', 'El is the light. El is the way. El will return.'), { mood: 'closed' })
    await g.narrate(l('Tri vety a ani jedna sa nezlomila.', 'Three sentences, and not one of them broke.'))
    g.pose('player', 'stand')
  } else {
    await g.narrate(l('Dlane sa jej rozpojili. Nočná modlitba, tá, čo kňažky spievajú, keď sa v chráme zhasína, neprišla. Prvýkrát v živote neprišla.', 'Her hands came apart. The night prayer, the one the priestesses sing when the temple lamps go out, did not come. For the first time in her life, it did not come.'))
    g.rel('felix', 1)
  }
  await g.fade('black', 600)
  await g.narrate(l('Vyšla. Na chodbe, kde ju z dielne nebolo vidieť, jej ruka sama zašla za golier a našla šnúrku. Kameň, päť hrotov pod bruškami prstov. Zovrela ho, až sa zohrial, a zvierala ho ďalej, kým ju nezačali bolieť články.', 'She went out. In the passage, where the workshop could not see her, her hand went to her collar of itself and found the cord. The stone, five points under her fingertips. She gripped it until it grew warm, and went on gripping until her knuckles ached.'))
  await g.say('player', l('Keby tu bol.', 'If only he were here.'), { thought: true, mood: 'sad' })
  await g.say('player', l('Nie. Nie teraz.', 'No. Not now.'), { thought: true })
  g.set('c16.stage', 3)
  g.cinematic(false)
  await g.goto('c16_metaru', 'work_in')
}

// ------------------------------------------------------------------------- 5: the voice in the covers
async function recordings(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.propVisible('laptop', true)
  g.teleport('felix', [7, 4])
  g.face('felix', [6, 5])
  await g.walk('player', [4, 8])
  await g.narrate(l('Rovnaká dielňa, rovnaké dvere, rovnaká lampa. Ale na stole ležala plochá tmavá škatuľa, rozovretá ako lastúra. Z jej vrchnej polovice vychádzalo svetlo.', 'The same workshop, the same door, the same lamp. But on the table lay a flat dark box, opened like a shell. Light came from its upper half.'))
  await g.focus([6, 5], { ms: 1200, zoom: 1.5 })
  await g.narrate(l('Nebol to plameň. Nebola to ani Spira. Ostré. Modrasté. Mŕtve svetlo, nehybné ako mesiac zatavený v tenkom plechu. Nemalo knôt a napriek tomu vrhalo na Felixovu tvár chladné tiene.', 'It was not a flame. It was not Spira either. Sharp. Bluish. A dead light, still as a moon sealed into thin metal. It had no wick, and yet it cast cold shadows on Felix’s face.'))
  await g.say('player', l('Iskra. Od Lekcie Krvi zakázaná na celom Ahile. A on ju má na stole.', 'The spark. Forbidden across all of Ahil since the Lesson of Blood. And he has it on his table.'), { thought: true, mood: 'fear' })
  g.codex('gloss.lekcia_krvi')
  await g.narrate(l('Na vedľajšom stole medené cievky a drôty. Tri rúrky, dlhé ako predlaktie, ovinuté po celej dĺžke. Niektoré otvorené na koncoch.', 'On the next table, copper coils and wires. Three tubes as long as a forearm, wound along their whole length. Some open at the ends.'))
  await g.say('felix', l('Tie glyfy na doskách nie sú ornament.', 'Those glyphs on the covers are not ornament.'))
  await g.narrate(l('Položil prst na vzory, ktoré Yera doteraz považovala za posvätné písmo. Potom dosku obrátil a jeho sklenené oči sa s drobným bzučaním zaostrili hlboko pod povrch.', 'He laid a finger on the patterns Yera had always taken for holy script. Then he turned the cover over, and his glass eyes focused deep beneath the surface with a faint buzz.'))
  await g.say('felix', l('Je to tu zapísané. Prach si pamätá aj hlas. Starý formát, pozemský.', 'It is written here. Dust remembers voices too. An old format. From Earth.'))
  g.mood('felix', 'blank')
  g.sfx('click', 0.6)
  await g.narrate(l('Odložil knihu na svietiaci stroj a zavrel oči. Železná čeľusť s tichým puknutím klesla. Umelé svaly na jeho tvári sa napli pod neprirodzenými uhlami. Ústa sa otvorili.', 'He laid the book on the glowing machine and closed his eyes. The iron jaw dropped with a soft crack. The artificial muscles of his face strained at unnatural angles. The mouth opened.'))
  await g.narrate(l('Z tmy jeho hrdla zaznel hlas. Nebol jeho, nepatril mužovi, ba neznel ani umelo. Bol to ženský hlas. Živý a vlhký.', 'From the dark of his throat came a voice. It was not his, it did not belong to a man, it did not even sound artificial. It was a woman’s voice. Alive and moist.'))
  await voice(g, 'Dnes je to desať rokov, čo matka odišla. Incidenty sú v norme, v meste vládne poriadok.', 'Today it is ten years since mother left. Incidents are within the norm; there is order in the city.')
  await voice(g, 'Povedala, že to bude rýchle. Povedala, že to nebude dlho. Povedala.', 'She said it would be quick. She said it would not be long. She said.')
  await g.narrate(l('Nádych. Zachytený v mŕtvej hmote prachu, zreprodukovaný z umelej hrude tak verne, že mohol patriť včerajšku.', 'A breath. Caught in the dead matter of the dust, reproduced from an artificial chest so faithfully it might have belonged to yesterday.'))
  await voice(g, 'Povedala, že keď sa vráti, všetko bude iné. Lepšie. Že pracuje na niečom, čo zmení všetko.', 'She said that when she came back, everything would be different. Better. That she was working on something that would change everything.')
  await voice(g, 'Elysium je stále krásne. Aj bez nej. Svetlo terás na námestí svieti do noci. Deti sa hrajú pri fontáne. Núra a Sev sa opäť hádajú. Nudné, dôležité veci.', 'Elysium is still beautiful. Even without her. The lights of the terraces on the square shine into the night. Children play by the fountain. Núra and Sev are arguing again. Boring, important things.')
  await voice(g, '…Matka by povedala, že politika je dôležitejšia než hviezdy.', '…Mother would say politics matters more than the stars.')
  await g.narrate(l('Krátky, suchý smiech z Felixových pier. Potom sa ústa zavreli. Oči sa otvorili. Ticho v dielni pretínal iba šum z Felixovej hrude.', 'A short, dry laugh from Felix’s lips. Then the mouth closed. The eyes opened. Only the hiss from Felix’s chest cut the silence of the workshop.'))
  await g.narrate(l('Odložil prednú dosku, vzal zadnú. Zavrel oči. Otvoril ústa.', 'He set the front cover aside and took the back one. He closed his eyes. He opened his mouth.'))
  await g.narrate(l('Ten istý hlas, ale všetko ostatné sa zmenilo. Kadencia pomalšia, dych ťažší, pauzy prázdnejšie, akoby ten istý nástroj hral v inej tónine.', 'The same voice, but everything else had changed. The cadence slower, the breath heavier, the pauses emptier, as if the same instrument played in another key.'))
  await voice(g, 'Dnes som zabila človeka.', 'Today I killed a man.')
  await g.wait(1200)
  await voice(g, 'Nie preto, že som chcela. Preto, že som musela. Alebo si to nahováram. Hovorím si to zakaždým a zakaždým to znie pravdivejšie.', 'Not because I wanted to. Because I had to. Or that is what I tell myself. I say it every time, and every time it sounds truer.')
  await voice(g, 'Sam mi ukázal ako.', 'Sam showed me how.')
  await g.wait(1600)
  await voice(g, 'Povedal, že to necíti. Že keď vlákna vojdú dnu a nájdu prach a začnú ťahať, že to necíti.', 'He said they do not feel it. That when the fibres go in and find the dust and start to pull, they do not feel it.')
  await g.narrate(l('Felixova hlava sa naklonila. Nie jeho gesto. Jej.', 'Felix’s head tilted. Not his gesture. Hers.'))
  await voice(g, 'Klamal.', 'He lied.')
  await voice(g, 'Cítia. Všetko cítia.', 'They feel it. They feel everything.')
  await voice(g, 'Ten dnešný mal na hrdle jamku, kde mu tep bil priveľmi rýchlo. Pozerala som na ňu, kým neprestal. Odvtedy ju vidím, len čo zavriem oči.', 'Today’s one had a hollow at his throat where the pulse beat too fast. I watched it until it stopped. Since then I see it as soon as I close my eyes.')
  await voice(g, 'Bola som vedkyňa. Matka bola vedkyňa. Ja som bola jej dcéra.', 'I was a scientist. Mother was a scientist. I was her daughter.')
  await g.wait(1000)
  await voice(g, 'Teraz.', 'Now.')
  g.mood('felix', 'neutral')
  await g.narrate(l('Felixove ústa sa zavreli. Oči sa otvorili. Položil dosku na stôl, dlaň na čiernom povrchu. Mlčal. Tie dve cudzie slová, čo jej vtedy povedal nad drôtom, už prekladať nepotrebovala.', 'Felix’s mouth closed. The eyes opened. He laid the cover on the table, palm on the black surface. He said nothing. The two foreign words he had said to her over the wire no longer needed translating.'))
  g.codex('book.c16_voice')
  await g.narrate(l('Yera stála nad stolom a nemohla sa pohnúť a nemohla odísť a nemohla zavrieť oči, lebo za zatvorenými očami bol ten hlas. Nikdy neumrela. Len odišla z miestnosti na chvíľu a zabudla sa vrátiť.', 'Yera stood over the table and could not move and could not leave and could not close her eyes, because behind closed eyes was that voice. She never died. She only left the room for a moment and forgot to come back.'))
  await g.say('player', l('Sam mi ukázal ako. Klamal.', 'Sam showed me how. He lied.'), { thought: true, mood: 'pain' })
  await g.narrate(l('Hlas ženy vyslovil jeho meno s rovnakou únavou, s akou on vtedy v daždi povedal „nemám dôvod“.', 'The woman’s voice said his name with the same weariness with which he, in the rain, had said “I have no reason.”'))
  if (g.flag('ch16.faith') === 'kept') {
    await g.narrate(l('Ruka jej zašla za golier a nahmatala kameň. Zovrela ho. Modlitba neprišla.', 'Her hand went to her collar and found the stone. She gripped it. The prayer did not come.'))
  } else {
    await g.narrate(l('Ruka jej zašla za golier, nahmatala kameň a vrátila sa prázdna.', 'Her hand went to her collar, found the stone, and came back empty.'))
  }
  g.pose('player', 'kneel')
  g.shake(0.1, 300)
  await g.narrate(l('Podlomili sa jej kolená.', 'Her knees gave way.'))
  g.pose('player', 'sit')
  await g.narrate(l('Sedela na podlahe dielne medzi olejom a prachom, kým na stole ležala kniha otvorená na mieste, kde sa začínali ostré znaky mŕtveho jazyka.', 'She sat on the workshop floor among oil and dust, while on the table the book lay open where the sharp letters of a dead language began.'))
  await g.narrate(l('Za stenou dielne plech. Za stenou tisíce tiel. Za telami prízraky. Uprostred toho všetkého ten istý hlas, čo povedal „Sam“ s bolesťou, akú Yera poznala len z modlitieb za mŕtvych.', 'Beyond the workshop wall, plating. Beyond the wall, thousands of bodies. Beyond the bodies, phantoms. And in the middle of it all the same voice that had said “Sam” with a pain Yera knew only from the prayers for the dead.'))
  await g.fade('black', 1200)
  g.set('c16.stage', 6)
  g.cinematic(false)
  await g.goto('c16_metaru', 'wake')
}

// ------------------------------------------------------------------------- 9: the coil guns
async function coils(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.propVisible('laptop', false)
  g.teleport('felix', [10, 4])
  g.face('felix', [10, 5])
  await g.walk('player', [7, 7])
  g.sfx('tick', 0.4)
  await g.narrate(l('Nahliadla. Felix nad jednou z tých rúrok. Navíjal drôt. Presne. Bez dychu, bez prestávok.', 'She looked in. Felix bent over one of the tubes. Winding wire. Exactly. Without breath, without pause.'))
  await g.say('player', l('Čo to robíš?', 'What are you making?'))
  await g.say('felix', l('Niečo, čo El popísala.', 'Something El described.'))
  await g.narrate(l('Neodtrhol pohľad. Medený drôt sa stáčal okolo hlavne.', 'He did not look up. The copper wire coiled around the barrel.'))
  await g.say('felix', l('Pulzy. Fungujú na prízraky.', 'Pulses. They work on phantoms.'))
  await g.narrate(l('Yera nechápala. Žiadna Spira ani glyfy. Len mosadz a drôty.', 'Yera did not understand. No Spira, no glyphs. Only brass and wire.'))
  await g.focus([10, 5], { ms: 1000, zoom: 1.5 })
  g.sfx('coil', 0.5)
  await g.say('felix', l('Tri.', 'Three.'))
  await g.narrate(l('Poklepal na hlaveň.', 'He tapped the barrel.'))
  await g.say('felix', l('Pre tých, čo vedia strieľať.', 'For those who can shoot.'))
  g.codex('world.c16_coilgun')
  await g.wait(800)
  await g.fade('black', 1600)
  g.set('c16.stage', 10)
  g.set('ch16.done')
  await g.endChapter()
}

/** Felix's workshop furniture (reused by chapters 17 and 18). */
export const WORKSHOP_PROPS: PlacedProp[] = [
    { type: 'boiler', at: [1, 1] },
    { type: 'chalkboard', at: [4, 1], params: { wall: true } },
    { type: 'workbench', at: [8, 1] },
    { type: 'shelf', at: [11, 1], params: { glow: true } },
    { type: 'bookshelf', at: [13, 1] },
    { type: 'cabinet', at: [1, 4], rot: 90 },
    { type: 'pipe', at: [1, 6], params: { vertical: true } },
    { type: 'gear', at: [1, 8], params: { standing: true } },
    { type: 'crate', at: [1, 10], params: { stack: true } },
    // the reading table with the Book and the lamp
    { type: 'table', at: [6, 5] },
    { type: 'ch16_book', at: [6, 5], y: 0.74 },
    { type: 'lantern', at: [6, 5], y: 0.74, offset: [0.35, -0.15] },
    { type: 'ch16_laptop', at: [6, 5], y: 0.74, offset: [-0.1, 0.1], id: 'laptop', hidden: true },
    { type: 'stool', at: [5, 6] },
    // the side table with copper and three tubes
    { type: 'table', at: [10, 5] },
    { type: 'coil_gun', at: [10, 5], y: 0.74, rot: 20, offset: [0, -0.2] },
    { type: 'coil_gun', at: [10, 5], y: 0.74, rot: 10 },
    { type: 'coil_gun', at: [10, 5], y: 0.74, rot: -5, offset: [0, 0.2] },
    { type: 'rope_coil', at: [11, 6], color: '#c9733f' },
    { type: 'desk', at: [12, 4] },
    { type: 'barrel', at: [13, 6] },
    { type: 'sack', at: [13, 8] },
    { type: 'rug', at: [6, 8], color: '#5a3a2a' },
    { type: 'candles', at: [8, 2] },
]

// ------------------------------------------------------------------------- scene
export const workshop: SceneDef = {
  id: 'c16_workshop',
  name: l('Felixova dielňa', 'Felix’s Workshop'),
  ambience: WORKSHOP_AMB,
  map: WORKSHOP_MAP,
  camera: { zoom: 1.25 },
  player: { character: 'c16_yera', at: [2, 10], facing: 135 },
  spawns: { door: [2, 10] },
  props: WORKSHOP_PROPS,
  actors: [{ id: 'felix', character: 'felix', at: [7, 4], facing: 225 }],
  exits: [{ area: [1, 11, 4, 11], to: 'c16_metaru', spawn: 'work_in' }],
  onEnter: async (g) => {
    const s = stage(g)
    if (s === 1) await g.once('c16.confession', () => confession(g))
    else if (s === 2) await g.once('c16.hymn', () => hymn(g))
    else if (s === 5) await g.once('c16.recordings', () => recordings(g))
    else if (s === 9) await g.once('c16.coils', () => coils(g))
  },
}
