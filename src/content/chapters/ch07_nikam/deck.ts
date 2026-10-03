/**
 * c7_deck — Arkot on the Itaka's deck after the rescue. The same star, the
 * same angle, and for the first time a direction. Tami hands him the helm;
 * Yera lays the old captain's protractor beside his fingers.
 */
import type { AmbienceDef, SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { DECK_MAP, deckProps } from '../ch08_cesta/deckmap'
import { place } from './util'
import './props'

export const SKY_NIGHT: AmbienceDef = {
  sky: { top: '#02030a', bottom: '#18203a', stars: 1, sai: { x: 0.78, y: 0.8, r: 0.06 }, infera: { x: 0.2, y: 0.88 }, clouds: 0.55 },
  hemi: { sky: '#5a6aa0', ground: '#141826', intensity: 0.95 },
  sun: { color: '#a8bcff', intensity: 1.15, dir: [-0.4, 1, 0.5] },
  exposure: 1.05,
  bloom: { strength: 0.95, radius: 0.6, threshold: 0.78 },
  grade: { tint: '#dfe6ff', saturation: 0.85, contrast: 1.06, vignette: 0.42 },
  particles: [
    { kind: 'clouds', count: 34, color: '#8a94b8' },
    { kind: 'stars', count: 60 },
  ],
  music: 'main',
  sounds: ['wind'],
}

async function takeHelm(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  g.set('c7d.helm')
  await g.walk('player', [8, 5])
  g.face('player', 'tami')
  await g.say('tami', l('Yera hovorila, že si navigátor.', 'Yera said you were a navigator.'))
  await g.narrate(l('Neobzrela sa. Oči mala upreté do hmly a noci pred nimi.', 'She did not look round. Her eyes stayed fixed on the mist and the night ahead.'))
  await g.narrate(l('Pod nohami mu prebehol záchvev paluby: jemná vibrácia trupu, ktorý mal dušu.', 'A shiver of the deck ran under his feet: the faint vibration of a hull with a soul.'))
  await g.say('player', l('To som bol. Kedysi. Pre stratenú vzducholoď.', 'I was. Once. For a ship that got lost.'))
  await g.say('tami', l('Tak teraz si zas. Preberáš kormidlo.', 'Then you are again. You’re taking the helm.'), { mood: 'determined' })
  await g.walk('tami', [6, 4])
  g.face('tami', 'player')
  await g.walk('player', [6, 6])
  g.face('player', [8, 6])
  await g.narrate(l('Prešiel prstami po starom laku kormidla. Drevo bolo chladné a presné. Pred očami si bleskovo rozprestrel mriežku oblohy nad Nevrissom.', 'He ran his fingers over the old varnish of the wheel. The wood was cool and precise. Before his eyes he spread the grid of the sky above Nevriss in a flash.'))
  await g.say('player', l('Kam ideme?', 'Where are we going?'))
  await g.say('tami', l('Severovýchod. Kde sa hrdza mení na zlato.', 'Northeast. Where rust turns to gold.'))
  await g.narrate(l('Otočila sa a nechala ho tam.', 'She turned and left him there.'))
  void g.walk('tami', [12, 8]).then(() => g.show('tami', false))
  await g.wait(2200)
  // Yera comes up from the hold
  g.show('yera', true)
  g.teleport('yera', [12, 8])
  await g.walk('yera', [7, 7])
  g.face('yera', 'player')
  await g.narrate(l('Yera vyšla na palubu o chvíľu neskôr. Krv mala z rúk umytú, na bledej tvári únavu. Postavila sa vedľa neho k barometrom a ťažko si odfúkla.', 'Yera came up on deck a little later. She had washed the blood from her hands; tiredness sat on her pale face. She stood beside him at the barometers and let out a heavy breath.'))
  g.pose('yera', 'point')
  await g.wait(500)
  g.propVisible('protractor', true)
  g.sfx('click', 0.6)
  g.pose('yera', 'stand')
  await g.narrate(l('Z vrecka kabáta vytiahla uzlík zo šatiek a položila ho na pult, tesne k jeho prstom. Šatky sa rozhrnuli. Mosadzný polkruh s ryskou.', 'From her coat pocket she drew a bundle of scarves and laid it on the console, right by his fingers. The scarves fell open. A brass half-circle with a hairline.'))
  await g.narrate(l('Uhlomer starého kapitána z aerodoku, čo klamal, že ho už nepotrebuje.', 'The old captain’s protractor from the aerodock, the one who had lied that he no longer needed it.'))
  await g.focus('player', { ms: 700, zoom: 1.55 })
  await g.narrate(l('Palec mu skĺzol z dreva na ošúchanú hranu. Tam ho nechal.', 'His thumb slid from the wood to the worn edge. He left it there.'))
  g.face('player', 'yera')
  g.mood('player', 'tender')
  g.mood('yera', 'tender')
  await g.narrate(l('Pozreli na seba. Arkot slabo potriasol hlavou s tichým úškrnom. Yera mu to oplatila, rameno zľahka opreté o to jeho.', 'They looked at each other. Arkot shook his head faintly, with a quiet grin. Yera returned it, her shoulder resting lightly against his.'))
  place(g, 'yera', [6, 7], [8, 6], 'stand')
  g.face('player', [9, 6])
  g.rel('arkot', 1)
  await g.zoom(0.85, 1800)
  await g.caption(l('Kurz na východ.', 'Course: east.'), { ms: 3200 })
  g.set('ch07.done')
  await g.endChapter()
}

const scene: SceneDef = {
  id: 'c7_deck',
  name: l('Itaka, nad lesmi Nevrissu', 'The Itaka, above the forests of Nevriss'),
  ambience: SKY_NIGHT,
  camera: { zoom: 1.1 },
  map: DECK_MAP,
  player: { character: 'arkot', at: [12, 7], facing: 270, abilities: [] },
  actors: [
    { id: 'tami', character: 'tami', at: [6, 6], facing: 45 },
    { id: 'yera', character: 'yera', at: [12, 8], hidden: true },
    { id: 'kiri', character: 'kiri', at: [19, 7], pose: 'sit', facing: 270 },
  ],
  props: [
    ...deckProps(),
    { type: 'ch07_protractor', at: [5, 8], y: 1.1, id: 'protractor', hidden: true },
    { type: 'ch07_star', at: [15, 0], params: { h: 6 }, id: 'star' },
    { type: 'lantern', at: [9, 3], params: { style: 'hanging' }, solid: false },
  ],
  interactables: [
    {
      id: 'sky',
      at: [15, 3],
      label: l('Matkin Vlas', 'Mother’s Hair'),
      verb: 'look',
      radius: 2.4,
      when: (g) => !g.flag('c7d.star'),
      run: async (g) => {
        g.set('c7d.star')
        g.cinematic(true)
        await g.focus([15, 1], { ms: 1200, zoom: 0.9 })
        await g.narrate(l('Nočný vzduch bol studený, čistý a nekonečný. Pod ním mizol les v tme a nad ním: Matkin Vlas.', 'The night air was cold, clean and endless. Below him the forest vanished into the dark, and above him: Mother’s Hair.'))
        await g.narrate(l('Rovnaká hviezda. Rovnaký uhol. Rovnaká fixná hviezda, čo mu tridsaťjeden nocí hovorila, kde je, ale nie kam ísť.', 'The same star. The same angle. The same fixed star that for thirty-one nights had told him where he was, but not where to go.'))
        await g.narrate(l('Teraz mal smer. Nepočítal trhliny. Nepočítal hliadky, výstrely ani kroky ani dni. Počítal stupne. Uhly. Vzdialenosti. Kurz.', 'Now he had a direction. He did not count cracks. He did not count patrols, shots, steps or days. He counted degrees. Angles. Distances. A course.'))
        await g.say('player', l('Matka.', 'Mother.'), { thought: true, mood: 'tender' })
        await g.narrate(l('Dievča z chrámu, čo opustilo chrám. Líška, čo nikdy neverila v nič okrem seba. A rys, čo sa hodil pred guľku s prázdnym revolverom v ruke.', 'A girl from the temple who had left the temple. A fox who had never believed in anything but herself. And a lynx who threw himself in front of a bullet with an empty revolver in his hand.'))
        await g.narrate(l('Bohovia nepočúvajú. Možno. Pravdepodobne. Ale v hrudi mal tlak, čo nemal vysvetlenie. Čo bolo väčšie než on.', 'The gods do not listen. Perhaps. Probably. But in his chest there was a pressure that had no explanation. Something larger than himself.'))
        await g.say('player', l('Ďakujem.', 'Thank you.'), { thought: true, mood: 'tender' })
        g.follow()
        await g.zoom(1.1, 700)
        g.cinematic(false)
        g.objective(l('Choď za Tami ku kormidlu.', 'Go to Tami at the helm.'))
      },
    },
  ],
  triggers: [
    {
      id: 'helm',
      area: [8, 3, 10, 9],
      when: (g) => !!g.flag('c7d.star') && !g.flag('c7d.helm'),
      run: takeHelm,
    },
  ],
  onEnter: async (g) => {
    await g.once('c7d.intro', async () => {
      g.cinematic(true)
      await g.wait(400)
      await g.focus([9, 7], { ms: 10, zoom: 1.2 })
      await g.narrate(l('V kajute spal Flint s obväzom na ramene. Dara sedela v rohu s ostatnými. Mechanik kašľal tichšie. Chlapec sa prestal triasť.', 'In the cabin Flint slept with a bandage on his shoulder. Dara sat in the corner with the others. The mechanic coughed more quietly. The boy had stopped shaking.'))
      await g.focus('tami', { ms: 1100 })
      await g.narrate(l('Tami stála pri kormidle sama a uprene hľadela dopredu, hoci nevedela kam. Ale kormidlovala.', 'Tami stood alone at the helm, staring ahead though she did not know where to. But she steered.'))
      await g.focus('player', { ms: 900 })
      await g.narrate(l('Arkot vyšiel na palubu.', 'Arkot came up on deck.'))
      g.follow()
      g.cinematic(false)
    })
    if (!g.flag('c7d.star')) g.objective(l('Pozri sa na nebo nad provou.', 'Look up at the sky above the bow.'))
    else if (!g.flag('c7d.helm')) g.objective(l('Choď za Tami ku kormidlu.', 'Go to Tami at the helm.'))
  },
}

export default scene
