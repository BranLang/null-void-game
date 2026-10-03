/**
 * Kapitola 21 (end): the Itaka leaves Hel without Aether. Ten torches below. And on the railing,
 * a man in a black suit, his legs over the side: “Got anything to drink?”
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { deck as deckAmb } from './ambience'

export const deckScene: SceneDef = {
  id: 'c13_deck',
  name: l('Paluba Itaky', 'The Itaka’s Deck'),
  ambience: deckAmb,
  camera: { zoom: 1.15 },
  map: {
    rows: [
      '    pppp    ',
      '   pddddp   ',
      '  pddddddp  ',
      '  pddddddp  ',
      ' pddddddddp ',
      ' pddddddddp ',
      ' pddddddddp ',
      ' pddddddddp ',
      ' pddddddddp ',
      ' pddddddddp ',
      ' pddddddddp ',
      ' pddddddddp ',
      '  pddddddp  ',
      '  pddddddp  ',
      '   pddddp   ',
      '    pddp    ',
      '     pp     ',
    ],
    legend: {
      p: { floor: 'deck', wall: 'plank', wallH: 0.55 },
      d: { floor: 'deck', tint: '#a07a54' },
    },
  },
  props: [
    { type: 'c13_helm', at: [5, 3], id: 'helm' },
    { type: 'ladder', at: [6, 7] },
    { type: 'crate', at: [3, 8] },
    { type: 'crate', at: [8, 10], params: { stack: true } },
    { type: 'rope_coil', at: [8, 5] },
    { type: 'rope_coil', at: [3, 12] },
    { type: 'barrel', at: [2, 6] },
    { type: 'lantern', at: [4, 2], params: { style: 'hanging' }, solid: false },
    { type: 'propeller', at: [0, 5], y: 1.2, params: { speed: 6 } },
    { type: 'propeller', at: [11, 5], y: 1.2, params: { speed: -6 } },
    { type: 'propeller', at: [0, 11], y: 1.2, params: { speed: 6 } },
    { type: 'propeller', at: [11, 11], y: 1.2, params: { speed: -6 } },
  ],
  player: { character: 'arkot_glyph', at: [6, 4], facing: 0 },
  actors: [
    { id: 'dara', character: 'dara', at: [5, 4], facing: 0, talk: (g) => talkDara(g) },
    { id: 'yori', character: 'yori', at: [7, 8], facing: 270 },
    { id: 'goji', character: 'goji', at: [5, 13], facing: 0, talk: (g) => talkGoji(g) },
    { id: 'flint', character: 'flint', at: [5, 1], facing: 180, talk: (g) => talkFlint(g) },
    { id: 'maks', character: 'maks', at: [10, 9], facing: 90, pose: 'sit', hidden: true },
  ],
  onEnter: async (g) => {
    await g.once('c13.deckIntro', async () => {
      g.cinematic(true)
      g.shake(0.3, 1500)
      await g.narrate(l('Itaka sa odlepila od dokov. Termálne prúdy ju vytlačili hore. Prudko, tvrdo, akoby ich Hel vypľul. Dara za kormidlom. Yori pri lanách.', 'The Itaka came away from the docks. The thermals shoved her upwards. Hard, violently, as if Hel had spat them out. Dara at the helm. Yori at the lines.'))
      await g.narrate(l('Arkot volal uhly. Medzi dvoma výkrikmi mu ruka skĺzla k vrecku. Šatka. Hodváb medzi prstami. Stisol ju. Zavolal ďalší uhol.', 'Arkot called the angles. Between two calls his hand slipped to his pocket. The scarf. Silk between his fingers. He squeezed it. Called the next angle.'))
      await g.narrate(l('Prázdna paluba. Prázdnejšia, než bola, keď prišli.', 'An empty deck. Emptier than when they arrived.'))
      await g.focus('goji', { ms: 900 })
      await g.narrate(l('Goji stál pri prove. Tam, kde zvyčajne líhaval Aether. Precitol, až keď drevo pod nohami zavoňalo po vlkovi. Urobil krok. Inam.', 'Goji stood at the prow. Where Aether used to lie. He only came to himself when the wood under his feet smelled of wolf. He took a step. Somewhere else.'))
      await g.walk('goji', [6, 12])
      await g.narrate(l('Nitovačky ešte mlčali. Hlboko dolu, na spodnej terase, sa pohol rad svetiel. Pomalý. Rovný. Fakle, jedna za druhou, smerom k posvätnej terase. Arkot ich medzi volaním uhlov napočítal desať. Nikto na palube nepovedal nič.', 'The riveters were still silent. Deep below, on the lowest terrace, a line of lights began to move. Slow. Straight. Torches, one after another, towards the sacred terrace. Between calls Arkot counted ten. No one on deck said anything.'))
      g.follow()
      await g.narrate(l('Nitovačky sa znova ozvali. Zo skaly, tlmené, ale stále. Hel žil. Bez nich.', 'The riveters started up again. From the rock, muffled, but steady. Hel lived. Without them.'))
      g.cinematic(false)
      g.objective(l('Flint stojí na korme.', 'Flint is standing at the stern.'))
    })
  },
}

async function talkDara(g: GameAPI): Promise<void> {
  if (g.flag('c13.maks')) return
  await g.say('dara', l('Vietor sa obracia. Severný, studený, čistý. Konečne niečo, čo poznám.', 'The wind is turning. Northern, cold, clean. Something I know, at last.'))
}

async function talkGoji(g: GameAPI): Promise<void> {
  if (g.flag('c13.maks')) return
  await g.say('goji', l('Celú cestu som lámal jeho reč na kúsky. A tam dole jej rozumeli deti.', 'All the way here I broke his speech into pieces. And down there the children understood it.'), { mood: 'sad' })
  g.rel('goji', 1)
}

async function talkFlint(g: GameAPI): Promise<void> {
  if (g.flag('c13.maks')) return
  g.set('c13.maks')
  g.cinematic(true)
  g.objective(null)
  await g.narrate(l('Flint stál na korme a díval sa, ako sa Hel zmenšuje pod nimi. Oranžová žiara z hlbín. Čoraz menšia, čoraz tmavšia. Až keď priepasť zmizla za okrajom a termálne prúdy nahradil studený severný vietor, Flint sa otočil.', 'Flint stood at the stern and watched Hel shrink beneath them. The orange glow from the depths. Smaller and smaller, darker and darker. Only when the pit had vanished past the rim and the thermals gave way to the cold north wind did Flint turn round.'))
  if (g.flag('ch12.forgaveArkot')) await g.say('flint', l('Ten tvoj glyf. Nabudúce mi povieš skôr. Dohodnuté?', 'That glyph of yours. Next time you tell me sooner. Deal?'), { mood: 'tender' })
  else await g.say('flint', l('Choď volať tie svoje uhly, navigátor.', 'Go call your angles, navigator.'), { mood: 'closed' })
  await g.walk('dara', [6, 5])
  g.face('dara', [10, 9])
  await g.narrate(l('Dara stála pri kormidle. Ruka na noži. Nekývla. Neprehovorila. Len pohľad. Smerom k zábradliu.', 'Dara stood by the helm. Hand on her knife. She did not nod. Did not speak. Only a look. Towards the railing.'))
  g.show('maks', true)
  g.lift('maks', 0.3)
  g.pose('maks', 'sit')
  g.sfx('bass', 0.6)
  await g.focus('maks', { ms: 1100, zoom: 1.4 })
  await g.narrate(l('Na palube sedel Maks. Okuliare na tvári, fľaša v ruke, nohy prehodené cez zábradlie.', 'Maks was sitting on the deck. Goggles on his face, a bottle in his hand, his legs over the railing.'))
  g.sfx('whoosh', 0.5)
  await g.narrate(l('Odhodil prázdnu fľašu cez palubu.', 'He tossed the empty bottle over the side.'))
  g.face('maks', 'player')
  await g.say('maks', l('Nemáte niečo na pitie?', 'Got anything to drink?'))
  g.codex('people.maks')
  await g.walk('yori', [6, 7])
  g.show('yori', false)
  await g.wait(900)
  g.show('yori', true)
  await g.walk('yori', [9, 9])
  await g.narrate(l('Yori zmizol v podpalubí. Vrátil sa s fľašou.', 'Yori vanished below deck. He came back with a bottle.'))
  g.follow()
  await g.fade('black', 1400)
  g.cinematic(false)
  await g.goto('c13_spanok')
}
