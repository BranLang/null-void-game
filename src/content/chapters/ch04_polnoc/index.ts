/**
 * KAPITOLA 4 · POLNOC / MIDNIGHT (book: Kapitola 3 + Kapitola 4).
 *
 * Arkot watches the Itaka glide into the aerodock out of the fog; then, long
 * before: Yera watches him from the shadow of a warehouse awning, Soril reads
 * the Book of El with her like a map with missing pieces and teaches her Ice,
 * the nights in the garden beyond the old canal, and the night temple with
 * Arkot in a glowing hooded robe, the mosaic of El, the niche, the kiss.
 */
import './nyau/props'
import './nyau/cast'
import type { ChapterDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { itakaScene } from './itaka'

const chapter: ChapterDef = {
  id: 'ch04',
  index: 4,
  title: l('Kapitola 4', 'Chapter 4'),
  subtitle: l('Polnoc', 'Midnight'),
  pov: 'arkot',
  abilities: ['flow'],
  flags: {},
  scenes: [itakaScene],
  start: 'c4_itaka',
}

export default chapter
