/**
 * KAPITOLA 1 · Vysoká voda / High Water (book: Kapitola 0).
 * Arkot and Flint on a cargo airship from Diss to Nyau: the warm cabin,
 * Flint's dice, the ballast boy's priestesses, the scale-woman's black stone,
 * the eclipse standoff (count forty, the Eye opens on forty-one), the drowned
 * city and the tide at dawn, Nyau's tide-locks, and the aerodock where the
 * city takes Arkot for a pureblood. Ends in the foreman's line.
 */
import type { ChapterDef } from '../../types'
import { l } from '../../../i18n/i18n'
import './props'
import './cast'
import { deck } from './deck'
import { cabin } from './cabin'
import { bay } from './bay'
import { aerodock } from './aerodock'

const chapter: ChapterDef = {
  id: 'ch01',
  index: 1,
  title: l('Kapitola 1', 'Chapter 1'),
  subtitle: l('Vysoká voda', 'High Water'),
  pov: 'arkot',
  epigraph: {
    text: l('„Voda nikdy nekradne. Voda si len berie späť, čo si postavil v jej izbe.“', '“Water never steals. Water only takes back what you built in its room.”'),
    source: l('Prístavné príslovie z Diss', 'A harbour proverb from Diss'),
  },
  abilities: [],
  flags: {},
  codex: [
    {
      id: 'gloss.dama',
      category: 'glossary',
      order: 900,
      title: l('Dama', 'Dama'),
      body: l(
        '*Beladiss*\n\nTak sa v Diss hovorí žene pri váhe: tej, čo váži, zapisuje a hovorí. V Diss muž nosí, žena váži, a pred váhou sa stojí s bradou dole.\n\nKto to poplietol, ten to poplietol raz.',
        '*Beladiss*\n\nWhat they call the woman at the scales in Diss: the one who weighs, writes down and speaks. In Diss the man carries and the woman weighs, and one stands before the scales with one’s chin lowered.\n\nWhoever mixes that up does it only once.',
      ),
    },
    {
      id: 'world.nyau_sluices',
      category: 'world',
      order: 905,
      title: l('Vzdúvadlá Nyau', 'The Tide-Locks of Nyau'),
      body: l(
        'Na južnej hrane plošiny stoja brány v rade, hlboko zapustené do svahu. Nad každou veža s bubnom a z bubna reťaze hrubé ako mužské stehno dolu do vody. Nad bránami v troch stupňoch kamenné nádrže, každá veľká ako námestie v Diss.\n\nKeď more stojí najvyššie, pustia ho hore po schodoch a zavrú za ním. Pri odlive ho púšťajú späť hrdlo po hrdle a v každom hrdle sa roztočí koleso: mlyny pod sýpkami, ploché drevené vetráky v šachtách, čo tlačia vzduch dolu do ulíc, a rady vahadiel na západnom svahu, ktoré dvíhajú riečnu vodu k vilám a k chrámu.\n\nJeden systém, nie dva. Keď sa brány nepustia načas, stoja mlyny aj stoky a smrdí to aj hore.\n\n*Nyau nemelie na oheň. Nyau melie na Sai.*',
        'On the southern edge of the plateau stand gates in a row, sunk deep into the slope. Above each a tower with a drum, and from the drum chains as thick as a man’s thigh running down into the water. Above the gates, in three tiers, stone reservoirs, each as big as a square in Diss.\n\nWhen the sea stands highest, the city lets it up the stairs and shuts the door behind it. At the ebb it lets the water out again throat by throat, and in every throat a wheel turns: mills beneath the granaries, flat wooden fans in shafts pushing air down into the streets, and rows of sweeps on the western slope lifting river water to the villas and the temple.\n\nOne system, not two. When the gates are not opened on time, the mills stand, the sewers stand, and it stinks even up top.\n\n*Nyau does not grind on fire. Nyau grinds on Sai.*',
      ),
    },
    {
      id: 'world.aerodock',
      category: 'world',
      order: 906,
      title: l('Aerodok', 'The Aerodock'),
      body: l(
        'Leží celkom dole na juhovýchode Nyau, na dohodenie od pobrežia, a je väčší než celé Diss. Rady dokovacích veží, plošiny, váhy, sklady obilia a výkriky predavačov roztrhané vetrom, trúby z vyhliadok, vresk navijakov a nadávky s desiatimi prízvukmi naraz.\n\nCez sviatok Tōr sa nelieta. Každá vzducholoď, ktorú festival zastihne v Nyau, stojí v tú noc priviazaná pri niektorej z veží.',
        'It lies all the way down in the south-east of Nyau, a stone’s throw from the shore, and it is bigger than all of Diss. Rows of mooring towers, platforms, scales, grain warehouses, hawkers’ cries torn by the wind, trumpets from the lookouts, the shriek of winches and curses in ten accents at once.\n\nNothing flies during the festival of Tōr. Every airship the festival catches in Nyau stands moored that night at one of the towers.',
      ),
    },
  ],
  scenes: [deck, cabin, bay, aerodock],
  start: 'c1_deck',
}

export default chapter
