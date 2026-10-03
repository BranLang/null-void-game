/**
 * KAPITOLA 17 · HLAS / VOICE (book: Kapitola 24 + Interlúdium Pod hladinou).
 *
 * c17_workshop  Tami speaks of the covers; Samael behind her eyes; the heavy
 *               hour, the blackout, the Book taken. Felix: "Don't go."
 * c17_streets   the veiled run in the heavy hour (strain while veiled)
 * c17_cemetery  BOSS on the cemetery stairs: slow field + fire, the veil
 *               drops, the violet Sora burst (unlocks 'slow' and 'sora');
 *               the Atran Strait, the regrown finger, the kiss
 * c17_beneath   Interlude (POV Tami): inputs "Spi." / "Hýb sa."
 */
import type { ChapterDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { workshop17 } from './workshop'
import { streets } from './streets'
import { cemetery } from './cemetery'
import { beneath } from './beneath'

const chapter: ChapterDef = {
  id: 'ch17',
  index: 17,
  title: l('Kapitola 17', 'Chapter 17'),
  subtitle: l('Hlas', 'Voice'),
  pov: 'yera',
  epigraph: {
    text: l('„Pravda nie je svetlo. Pravda je to, čo zostane, keď svetlo zhasneš.“', '“Truth is not light. Truth is what remains when you put the light out.”'),
    source: l('Kniha El, originál, fáza 4 (v kanonických kópiách vynechané)', 'The Book of El, original, phase 4 (omitted from the canonical copies)'),
  },
  abilities: ['veil', 'flow', 'ice', 'fire'],
  flags: { 'ch08.taughtArkot': true, 'ch16.faith': 'broken', 'ch16.done': true },
  codex: [
    {
      id: 'book.c17_covers',
      category: 'book',
      title: l('Dosky sú spomienky', 'The covers are memories'),
      body: l(
        '*„Tie dosky nie sú obal. Sú to spomienky. El si vymazala pamäť. Na matku. Na domov. Na všetko pred tým, čím sa tu stala. Zamkla to do čierneho prachu.“*\n\nTak to povedala Tami. Alebo to, čo hovorilo jej ústami.',
        '*“The covers are not a cover. They are memories. El erased her memory. Of her mother. Of home. Of everything before what she became here. She locked it into the black dust.”*\n\nThat is what Tami said. Or whatever spoke with her mouth.',
      ),
    },
    {
      id: 'people.c17_samael',
      category: 'people',
      title: l('Samael', 'Samael'),
      body: l(
        'Démon z detských ilustrácií. Unavený muž z portrétu v Knihe. Postava z prachu v Rennovej záhrade. A potom hlas z Taminých úst, s mŕtvymi bodmi medzi slabikami.\n\n*„Bojím sa ho nie preto, že je silný, ale preto, že je spravodlivý.“*\n\n*„Prach si pamätá, Eltária. Vždy si pamätá.“*',
        'The demon of children’s pictures. The tired man of the portrait in the Book. A figure of dust in Renn’s garden. And then a voice from Tami’s mouth, with dead points between the syllables.\n\n*“I fear him not because he is strong, but because he is just.”*\n\n*“Dust remembers, Eltária. It always remembers.”*',
      ),
    },
    {
      id: 'gloss.c17_three_layers',
      category: 'glossary',
      title: l('Tri vrstvy Spiry', 'Three layers of Spira'),
      body: l(
        'Sora na koži, Mizu v rukách, Hi v hrdle. Tri elementy naraz: závoj, kruh ticha, v ktorom sa dážď spomalí na sklenené korálky, a oheň. Oheň láme len to, čo kruh alebo ľad zastavil.\n\nKoža horí, zuby drkocú a Spira sa trasie v žilách ako struna natiahnutá na prasknutie.',
        'Sora on the skin, Mizu in the hands, Hi in the throat. Three elements at once: the veil, a ring of silence in which the rain slows to glass beads, and fire. Fire breaks only what the ring or the ice has stopped.\n\nThe skin burns, the teeth chatter, and the Spira shakes in the veins like a string pulled to snapping.',
      ),
    },
    {
      id: 'gloss.c17_violet',
      category: 'glossary',
      title: l('Fialová bez mena', 'The nameless violet'),
      body: l(
        'Nebol to mráz a nebol to oheň. Niečo, čo v tej chvíli nemalo meno, len farbu a tvar a zúfalstvo. Fialová na prstoch ľavej ruky, a roj, ktorý prestal byť rojom.',
        'It was not frost and it was not fire. Something that in that moment had no name, only colour and shape and despair. Violet on the fingers of the left hand, and a swarm that stopped being a swarm.',
      ),
    },
    {
      id: 'gloss.c17_finger',
      category: 'glossary',
      title: l('Nový prst', 'The new finger'),
      body: l(
        'Spira lieči: zastaví krvácanie, zašije ranu, utíši bolesť. Vrátiť mŕtve mäso na kosti, postaviť kĺb z ničoho a necht z vody, to vie len prach.\n\nPrst sa ohne. Telo ho prijalo. Ale telo si ho nepamätá a prst si nepamätá telo.',
        'Spira heals: it stops bleeding, closes a wound, quiets pain. Putting dead flesh back on the bones, building a joint out of nothing and a nail out of water, only dust can do that.\n\nThe finger bends. The body has accepted it. But the body does not remember it, and the finger does not remember the body.',
      ),
    },
    {
      id: 'world.c17_atran',
      category: 'world',
      title: l('Atranská úžina', 'The Atran Strait'),
      body: l(
        'Bitka okolo roku 850 Prvého veku. Ex Inferis tam dostali od líšok výprask. Po vojne vzniklo na východe Kitsune.\n\n*„Malé, strieborné líšky, čo niesli smrť. Hádzali na nás svetlo a oheň a my sme padali do bahna. A aj tak sme vstali.“*',
        'A battle around the year 850 of the First Age. There the Ex Inferis took a thrashing from the foxes. After the war, Kitsune was founded in the east.\n\n*“Small silver foxes that carried death. They threw light and fire at us and we fell into the mud. And still we rose.”*',
      ),
    },
  ],
  scenes: [workshop17, streets, cemetery, beneath],
  start: 'c17_workshop',
}

export default chapter
