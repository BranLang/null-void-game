/**
 * KAPITOLA 16 · SPOVEĎ / CONFESSION (book: Kapitola 23).
 *
 * Stage flag `c16.stage`:
 *  0 opening shot on the hull (c16_town)
 *  1 wake beside Tami → Felix calls            2 confession done → five days of denial
 *  3 the verse of Tenši, "Ich weiß", faith choice → healing with Sayuri
 *  4 the birth in the heavy hour (heal / mu-hi) → the new glyphs
 *  5 light hour: Tami says "Yera", freezes like a statue → Felix calls again
 *  6 the dust recordings → Tami asks about the book → the last barrel, Gōstar tales
 *  7 the water runs out: Kiri, Toru and three others go out
 *  8 they do not return → Yera searches the town under the veil (five piles)
 *  9 Saburo: "If he returns, let him in." → the coil guns → end
 * Sets `ch16.faith` = 'kept' | 'broken'.
 */
import type { ChapterDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { metaru } from './metaru'
import { workshop } from './workshop'
import { town } from './town'

const chapter: ChapterDef = {
  id: 'ch16',
  index: 16,
  title: l('Kapitola 16', 'Chapter 16'),
  subtitle: l('Spoveď', 'Confession'),
  pov: 'yera',
  epigraph: {
    text: l('„Pravda nie je pre každého. Pravda je pre tých, čo unesú váhu pravdy.“', '“The truth is not for everyone. The truth is for those who can bear its weight.”'),
    source: l('Kniha El, originál, fáza 4 (v kanonických kópiách vynechané)', 'The Book of El, original, phase 4 (omitted from the canonical copies)'),
  },
  abilities: ['veil', 'flow', 'ice', 'fire'],
  flags: { 'ch08.taughtArkot': true },
  codex: [
    {
      id: 'book.c16_confession',
      category: 'book',
      title: l('Posledná strana · Spoveď', 'The last page · A confession'),
      body: l(
        'Iný rukopis aj iný jazyk. Štyristo zím ju kňažky volali kliatbou, démonovými slovami. Felix ju prečítal nahlas.\n\n*Ich brauche keine Götter.*\nNepotrebujem bohov.\n\n*Es gibt keinen Gott für das, was ich getan habe.*\nPre to, čo som urobil, neexistuje boh.\n\n*Sie glauben, ich sei ein Dämon. Sollen sie.*\nOni veria, že som démon. Nech.\n\n*Ich suche nur den Ausweg aus dem, was ich getan habe.*\nHľadám len východisko z toho, čo som urobil.',
        'A different hand and a different language. For four hundred winters the priestesses called it a curse, the Demon’s words. Felix read it aloud.\n\n*Ich brauche keine Götter.*\nI need no gods.\n\n*Es gibt keinen Gott für das, was ich getan habe.*\nThere is no god for what I have done.\n\n*Sie glauben, ich sei ein Dämon. Sollen sie.*\nThey believe I am a demon. Let them.\n\n*Ich suche nur den Ausweg aus dem, was ich getan habe.*\nI am only looking for a way out of what I have done.',
      ),
    },
    {
      id: 'book.c16_voice',
      category: 'book',
      title: l('Hlas v doskách', 'The voice in the covers'),
      body: l(
        'Glyfy na doskách nie sú ornament. Prach si pamätá aj hlas.\n\n*„Dnes je to desať rokov, čo matka odišla. … Elysium je stále krásne. Aj bez nej.“*\n\n*„Dnes som zabila človeka. … Sam mi ukázal ako. Povedal, že to necíti. Klamal. Cítia. Všetko cítia.“*\n\n*„Bola som vedkyňa. Matka bola vedkyňa. Ja som bola jej dcéra. Teraz.“*',
        'The glyphs on the covers are not ornament. Dust remembers voices too.\n\n*“Today it is ten years since mother left. … Elysium is still beautiful. Even without her.”*\n\n*“Today I killed a man. … Sam showed me how. He said they do not feel it. He lied. They feel it. They feel everything.”*\n\n*“I was a scientist. Mother was a scientist. I was her daughter. Now.”*',
      ),
    },
    {
      id: 'gloss.c16_ima_kit',
      category: 'glossary',
      title: l('Ima · Kīt', 'Ima · Kīt'),
      body: l(
        'Dve kitsunské slová, ktoré Sayuri povedala pri predčasnom pôrode v Železnom chráme. Prvé, keď dieťa nedýchalo. Druhé, keď zapišťalo.\n\nYera ani jedno nepoznala. Zapamätala si ich.',
        'Two Kitsune words Sayuri spoke at the premature birth in the Iron Temple. The first when the baby was not breathing. The second when it squeaked.\n\nYera knew neither. She remembered them.',
      ),
    },
    {
      id: 'gloss.c16_new_glyphs',
      category: 'glossary',
      title: l('Nové glyfy', 'The new glyphs'),
      body: l(
        'Tie z Nyau sú na predlaktiach, Sorilinou rukou vybrúsené za celé mesiace. Tieto vyrástli na prstoch ľavej ruky po stovkách liečení v Železnom chráme. Nekreslila ich ruka; kreslilo ich niečo zvnútra.\n\nPäť farieb na štyroch prstoch. Jedna fialová. Sora.',
        'The ones from Nyau are on her forearms, honed by Soril’s hand over months. These grew on the fingers of her left hand after hundreds of healings in the Iron Temple. No hand drew them; something inside did.\n\nFive colours on four fingers. One of them violet. Sora.',
      ),
    },
    {
      id: 'world.c16_gostar_tales',
      category: 'world',
      title: l('Príbehy pri poslednom sude', 'Tales at the last barrel'),
      body: l(
        '*„Nemá Spiru. Nemá oči. Ale jeho pohľad bol stále v tvojom chrbte.“*\n\n*„Tie prízraky nevyháňal. Rozprával sa s nimi. A oni ustúpili.“*\n\n*„Prišiel ako starý, zlomený muž. Odchádzal ako mladík.“* (Sayuri)\n\n*„Tami k nemu chodievala. Trénoval ju.“* (Saburo)',
        '*“He has no Spira. He has no eyes. But his gaze was always in your back.”*\n\n*“He did not drive the phantoms out. He talked with them. And they gave way.”*\n\n*“He came as an old, broken man. He left as a young one.”* (Sayuri)\n\n*“Tami used to go to him. He trained her.”* (Saburo)',
      ),
    },
    {
      id: 'world.c16_coilgun',
      category: 'world',
      title: l('Felixove pušky', 'Felix’s rifles'),
      body: l(
        'Tri rúrky dlhé ako predlaktie, ovinuté medeným drôtom, závit tesne pri závite. Žiadna Spira, žiadne glyfy. Len mosadz a drôty.\n\n*„Niečo, čo El popísala. Pulzy. Fungujú na prízraky.“*',
        'Three tubes as long as a forearm, wound with copper wire, coil tight against coil. No Spira, no glyphs. Only brass and wire.\n\n*“Something El described. Pulses. They work on phantoms.”*',
      ),
    },
  ],
  scenes: [town, metaru, workshop],
  start: 'c16_town',
}

export default chapter
