/**
 * Dev showcase for painted-plate scenes (not part of the story).
 * Open with ?scene=show_garden
 */
import type { ChapterDef, SceneDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { NYAU_GARDEN } from '../../plates/nyau'
import { plateAt, plateMap } from '../../../engine/plate/plateMath'

const at = plateAt(NYAU_GARDEN)

const garden: SceneDef = {
  id: 'show_garden',
  name: l('Chrámová záhrada, Nyau', 'The Temple Garden, Nyau'),
  plate: NYAU_GARDEN,
  map: plateMap(NYAU_GARDEN),
  ambience: {
    sky: { top: '#05060f', bottom: '#151b2e' },
    hemi: { sky: '#8090c0', ground: '#202030', intensity: 1.2 },
    bloom: { strength: 0.45, radius: 0.6, threshold: 0.9 },
    grade: { tint: '#ffffff', saturation: 1.02, contrast: 1.04, vignette: 0.42, grain: 0.03 },
    particles: [
      { kind: 'fireflies', count: 40, color: '#c9a6ff' },
      { kind: 'motes', count: 40, color: '#bcd0ff' },
    ],
    music: null,
    sounds: ['night'],
  },
  player: { character: 'yera', at: at(0.16, 0.86), facing: 180 },
  actors: [{ id: 'tami', character: 'tami', at: at(0.62, 0.55), facing: 0, name: l('Tami', 'Tami') }],
  interactables: [
    {
      id: 'tami_talk',
      at: at(0.62, 0.55),
      label: l('Prehovoriť', 'Talk'),
      verb: 'talk',
      run: async (g) => {
        await g.say('tami', l('Tvoja záhrada svieti aj bez mesiaca.', 'Your garden glows even without the moon.'))
        await g.say('player', l('Nie je moja. Patrí Matke. Ja ju len polievam.', 'It is not mine. It belongs to the Mother. I only water it.'))
      },
      marker: false,
    },
    {
      id: 'pond',
      at: at(0.5, 0.82),
      label: l('Jazierko', 'The pond'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('V hladine sa kolíše fialová koruna stromu. Pod ňou pomaly krúžia zlaté ryby.', 'The violet crown of the tree sways on the surface. Golden fish circle slowly beneath it.'))
      },
    },
  ],
}

const chapter: ChapterDef = {
  id: 'showcase',
  index: 999,
  hidden: true,
  title: l('Ukážka', 'Showcase'),
  subtitle: l('Maľované scény', 'Painted scenes'),
  pov: 'yera',
  scenes: [garden],
  start: 'show_garden',
}

export default chapter
