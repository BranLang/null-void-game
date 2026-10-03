/**
 * KAPITOLA 7: Nikam / Nowhere. Arkot's thirty-first night in the pirate camp
 * and the prayer by the star Mother's Hair; then Yera's three hundred
 * invisible steps, the escort north, Flint's three shots, the cannon "Felix",
 * the bullet Flint takes for Tami, and the course east.
 * Book: Kapitola 9 (Nikam) and the rescue part of Kapitola 12 (Eltária).
 */
import type { ChapterDef } from '../../types'
import { l } from '../../../i18n/i18n'
import './cast'
import './props'
import camp from './camp'
import rescue from './rescue'
import glade from './glade'
import deck from './deck'

const chapter: ChapterDef = {
  id: 'ch07',
  index: 7,
  title: l('Kapitola 7', 'Chapter 7'),
  subtitle: l('Nikam', 'Nowhere'),
  pov: 'arkot',
  epigraph: {
    text: l('„Sú tri veci, čo navigátora zabijú: búrka, kompas a nádej.“', '“There are three things that kill a navigator: a storm, a compass, and hope.”'),
    source: l('Renn Ólafsson, kapitán Itaky', 'Renn Ólafsson, captain of the Itaka'),
  },
  abilities: [],
  flags: { 'ch06.done': true },
  codex: [
    {
      id: 'world.matkin_vlas',
      category: 'world',
      title: l('Matkin Vlas', 'Mother’s Hair'),
      body: l(
        'Prvá hviezda jari na severnom nebi. Fixná, spoľahlivá a presná: navigátori podľa jej uhla určujú polohu, podľa jasu vlhkosť vzduchu a podľa chvenia jej svetla vietor na zajtra.\n\nZa noc sa posunie o necelý pol stupňa. Kto ju sleduje dosť dlho, môže podľa nej rátať aj noci. Arkot ich narátal tridsaťjeden.\n\n*Bohovia nepočúvajú. Možno. Pravdepodobne.*',
        'The first star of spring in the northern sky. Fixed, reliable and precise: navigators read their position from its angle, the damp in the air from its brightness, and tomorrow’s wind from the trembling of its light.\n\nIt moves a little under half a degree each night. Whoever watches it long enough can count the nights by it. Arkot counted thirty-one.\n\n*The gods do not listen. Perhaps. Probably.*',
      ),
    },
  ],
  scenes: [camp, rescue, glade, deck],
  start: 'c7_camp',
}

export default chapter
