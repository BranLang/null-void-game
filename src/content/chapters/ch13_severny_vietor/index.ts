/**
 * Chapter 13 · Severný vietor / North Wind (Arkot).
 * Book: Kapitola 17 “Krok do prázdna”, Kapitola 18 “Severný vietor”, Kapitola 21 “Diera”
 * and the Interlude “Spánok” (Maks).
 *
 * The heavy hour and the sixth crystal; the flashback to Saburo's yard and Aether's message;
 * the cannon dropped, the lift-off and the flight north; the tundra camp (the soup pot, the
 * glyph, the punch, Aether's lore under the aurora); the Diera and Hel (Alfadir, the Star Wall,
 * the tower, the drone map, the run); Maks in the dive bar, the ambush, Aether stays; and the
 * interlude in which the dust comes home.
 */
import type { ChapterDef } from '../../types'
import { l } from '../../../i18n/i18n'
import './cast'
import './props'
import { holdScene } from './hold'
import { saburoScene } from './saburo'
import { amphitheatreScene } from './amphitheatre'
import { campScene } from './camp'
import { terraceScene } from './terrace'
import { helScene } from './hel'
import { towerScene } from './tower'
import { depthsScene } from './depths'
import { deckScene } from './deck'
import { spanokScene } from './spanok'

const chapter: ChapterDef = {
  id: 'ch13',
  index: 13,
  title: l('Kapitola 13', 'Chapter 13'),
  subtitle: l('Severný vietor', 'North Wind'),
  pov: 'arkot_glyph',
  epigraph: {
    text: l('„Odísť nie je odvaha. Odvaha je neotočiť sa.“', '“Leaving is not courage. Courage is not turning around.”'),
    source: l('Kronika Renna Ólafssona', 'The Chronicle of Renn Ólafsson'),
  },
  abilities: ['push'],
  flags: { 'ch08.taughtArkot': true },
  codex: [
    {
      id: 'world.c13_diera',
      category: 'world',
      title: l('Diera', 'The Diera'),
      body: l(
        'Priepasť v severnej pustatine, kde končia lesy. Čierna jazva v poli bieleho snehu, z ktorej vyteká hnis dymu. Zem tu zdola hreje vzduch a posiela ho nahor v stĺpoch, čo ohýbajú vietor a robia z navigácie peklo.\n\nSteny sú prešpikované oceľovými terasami, ktoré drží pokope hrdza a tvrdohlavosť. Žeriavy sa krútia nad prázdnotou ako ručičky kompasu, čo nenašli sever. Tisíce pneumatických nitovačiek búšia bez taktu a bez prestávky. Ruky Ghorkov sú ťažké od nitovačiek a medzi mozoľnatými dlaňami putujú fľaše modrého liehu.\n\nHovoria tu Starorečou.',
        'A chasm in the northern wasteland where the forests end. A black scar in a field of white snow, oozing smoke like pus. The earth here warms the air from below and sends it up in columns that bend the wind and make navigation hell.\n\nThe walls are riddled with steel terraces held together by rust and stubbornness. Cranes turn over the void like compass needles that could not find north. Thousands of pneumatic riveters hammer without rhythm and without rest. The Ghorki’s hands are heavy with riveting guns, and bottles of blue spirit pass between calloused palms.\n\nThey speak the Old Tongue here.',
      ),
    },
    {
      id: 'world.c13_hel',
      category: 'world',
      title: l('Hel', 'Hel'),
      body: l(
        'Mesto vlkov na piatej úrovni pod povrchom Diery. Brána pod oblúkom z andezitu, nad ňou vytesaná hlava vlka s otvorenými čeľusťami, obrúsená tisícami dotykov.\n\nHel má vlastný tep: stovky hydraulických nitovačiek v dielňach vytesaných do skaly. Kameň nesie ten zvuk lepšie než vzduch. Pod železnými mrežami v podlahe žiari skala. Pracuje sa tu bez glyfov, len para, oceľ a ruky, a predsa čepele na pultoch prevyšujú všetko, čo kedy držali v rukách v Diss.\n\nNajstaršie reliéfy v šachte zobrazujú štyroch ľudí s hladkými tvárami. Prišli zhora, hovorili starou rečou, dotkli sa skaly a skala sa otvorila. Potom odišli. Vlci zostali. Kopali ďalej. Kovali ďalej.',
        'The city of the wolves on the fifth level beneath the floor of the Diera. A gate under an andesite arch, above it a carved wolf’s head with open jaws, worn by thousands of touches.\n\nHel has its own heartbeat: hundreds of hydraulic riveters in workshops cut into the rock. The stone carries the sound better than air. Under iron grates in the floor the rock glows. They work without glyphs here, only steam, steel and hands, and yet the blades on the counters outclass anything ever held in Diss.\n\nThe oldest reliefs in the shaft show four humans with smooth faces. They came from above, spoke the old speech, touched the rock and the rock opened. Then they left. The wolves stayed. Kept digging. Kept forging.',
      ),
    },
    {
      id: 'world.c13_star_wall',
      category: 'world',
      title: l('Hviezdna stena', 'The Star Wall'),
      body: l(
        'Čierny, hladký kameň v hale Helu, pri päte kadidlo. Stovky bodov vytesaných do kameňa, biele zárezy spojené líniami, čo sa ukážu len v správnom uhle.\n\nSúhvezdia sú tie isté, a predsa nie. Niektoré body chýbajú, iné sú posunuté, ako mapa prekresľovaná z pamäti niekým, kto hľadel na tie isté hviezdy z iného miesta. Uprostred je červený kruh: Infera.\n\nNie mapa cesty. Mapa pôvodu.',
        'A black, smooth stone in the hall of Hel, incense at its foot. Hundreds of points cut into the stone, white notches joined by lines that show only at the right angle.\n\nThe constellations are the same, and yet not. Some points are missing, others shifted, like a map redrawn from memory by someone who looked at the same stars from another place. At its centre is a red circle: Infera.\n\nNot a map of a journey. A map of an origin.',
      ),
    },
    {
      id: 'world.c13_tower',
      category: 'world',
      title: l('Veža v šachte', 'The Tower in the Shaft'),
      body: l(
        'Za nízkou bránou z čierneho andezitu, kam nevkročí žiaden vlk, stojí v šachte pod holým nebom veža. Kov, ktorý nie je oceľ ani titán: matný, tmavý, bez stopy po čase, z jedného kusa, bez nitu a bez zvaru. Otvára sa tomu, kto pristúpi.\n\nVnútri sa svetlo zhmotňuje do obrazov: svet plný vody, svety za svetmi, Ahil zhora. A z konzoly vyletí roj kovového hmyzu a nakreslí mapu celého Helu.',
        'Beyond a low gate of black andesite, where no wolf will set foot, a tower stands in a shaft under the open sky. A metal that is neither steel nor titanium: matte, dark, without a trace of time, a single piece, without rivet or weld. It opens for whoever approaches.\n\nInside, light becomes images: a world full of water, worlds beyond worlds, Ahil from above. And from the console a swarm of metal insects flies out and draws a map of all Hel.',
      ),
    },
    {
      id: 'world.c13_starfarers',
      category: 'world',
      title: l('Aetherova spoveď', 'Aether’s Confession'),
      body: l(
        '*Ako ju pri ohni na severnej planine preložil Goji.*\n\nZelené, vysoké lesy, kde bežal so svojou rodinou, keď boli mladí. Pán, ktorý ich vzal na cestu ku hviezdam. Spánok v chlade. Pustý, sivý svet, kde nič nerástlo, a život v klietke. Pán ten svet neskrotil. Vrátili sa na loď a prišli sem.\n\nCestou im dochádzalo jedlo a vzduch. Ale najhoršie bolo to, čo v nich dýchalo a držalo ich nažive: niečo ako prach, s hladom a s vôľou. Začalo hniť a obrátilo sa proti nim. Pán a ďalší traja prežili. Vysali slabších. Do sucha.\n\nJeden zo štyroch je mŕtvy. Volal sa Samael. To, čo je v Taminom dome, je jeho hniloba.\n\nLoď, na ktorej prišli, dodnes krúži po oblohe. Volá sa Infera.',
        '*As Goji translated it by the fire on the northern plateau.*\n\nGreen, tall forests where he ran with his family when they were young. A master who took them on a journey to the stars. Sleep in the cold. A barren grey world where nothing grew, and life in a cage. The master did not tame that world. They went back to the ship and came here.\n\nOn the way they ran out of food and air. But worst of all was the thing that breathed inside them and kept them alive: something like dust, with hunger and with a will. It began to rot and turned against them. The master and three others survived. They drained the weaker ones. Dry.\n\nOne of the four is dead. His name was Samael. The thing in Tami’s house is his rot.\n\nThe ship they came on still circles the sky. Its name is Infera.',
      ),
    },
    {
      id: 'gloss.c13_galdr',
      category: 'glossary',
      title: l('Galdr', 'Galdr'),
      body: l(
        'Runy namiesto glyfov. Žiadne kruhy ani oblúky, len rovné ťahy a ostré hrany, rysované do vzduchu ako do kameňa, a krátke tvrdé slová namiesto haiku: *Vindr. Rís. Eldr, slokna. Skjöldr.*\n\nTak ju naučil otec Tami, Renn. Goji ich pozná tiež. Kde glyf prosí, galdr prikazuje.',
        'Runes instead of glyphs. No circles or arcs, only straight strokes and sharp edges, cut into the air as into stone, and short hard words instead of a haiku: *Vindr. Rís. Eldr, slokna. Skjöldr.*\n\nThat is how Tami’s father, Renn, taught her. Goji knows them too. Where a glyph asks, galdr commands.',
      ),
    },
  ],
  scenes: [holdScene, saburoScene, amphitheatreScene, campScene, terraceScene, helScene, towerScene, depthsScene, deckScene, spanokScene],
  start: 'c13_hold',
}

export default chapter
