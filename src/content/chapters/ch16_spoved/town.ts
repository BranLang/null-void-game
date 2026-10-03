/**
 * c16_town — the slope of Kitsune below the Metaru. Opening shot: phantom palms
 * on the hull in the rain. Later: Yera, veiled, searches the streets for Kiri,
 * Toru and the three others, and finds five piles of clothes by the well.
 */
import type { ActorDef, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { TOWN_GREY, TOWN_MAP, TOWN_PROPS, makeSense } from './shared'

const stage = (g: GameAPI): number => Number(g.flag('c16.stage')) || 0
const sense = makeSense(2.4, 1.3)
let failing = false

const PHANTOMS: ActorDef[] = [
  { id: 'ph0', character: 'phantom', at: [7, 10], phantom: { form: 'crawler', patrol: [[7, 9], [7, 13]], speed: 0.8, fibers: 10, reach: 1.9 } },
  { id: 'ph1', character: 'phantom', at: [14, 16], facing: 45, phantom: { form: 'wall', fibers: 8, reach: 1.6 } },
  { id: 'ph2', character: 'phantom', at: [22, 21], facing: 135, phantom: { form: 'listener', fibers: 10, reach: 1.8 } },
  { id: 'ph3', character: 'phantom', at: [18, 24], phantom: { form: 'crawler', patrol: [[18, 24], [27, 24]], speed: 0.7, fibers: 10, reach: 2 } },
  { id: 'ph4', character: 'phantom', at: [22, 25], phantom: { form: 'humanoid', fibers: 8, reach: 1.3 } },
  { id: 'ph5', character: 'phantom', at: [10, 20], phantom: { form: 'crawler', patrol: [[9, 19], [20, 19], [20, 21], [9, 21]], speed: 0.9, fibers: 10, reach: 1.8 } },
  { id: 'ph6', character: 'phantom', at: [12, 12], phantom: { form: 'humanoid', patrol: [[10, 11], [16, 12]], speed: 0.6, fibers: 10, reach: 1.8 } },
  { id: 'ph7', character: 'phantom', at: [5, 8], facing: 45, phantom: { form: 'wall', fibers: 6, reach: 1.4 } },
  { id: 'ph8', character: 'phantom', at: [16, 9], phantom: { form: 'listener', fibers: 8, reach: 1.7 } },
  { id: 'ph9', character: 'phantom', at: [26, 29], phantom: { form: 'crawler', patrol: [[26, 29], [18, 30]], speed: 0.7, fibers: 8, reach: 1.7 } },
  // the hull: palms in the dark
  { id: 'hull0', character: 'phantom', at: [3, 3], facing: 315, phantom: { form: 'wall', fibers: 14, reach: 2 } },
  { id: 'hull1', character: 'phantom', at: [11, 3], facing: 315, phantom: { form: 'wall', fibers: 14, reach: 2 } },
  { id: 'hull2', character: 'phantom', at: [14, 3], facing: 315, phantom: { form: 'wall', fibers: 12, reach: 2 } },
  { id: 'hull3', character: 'phantom', at: [5, 4], phantom: { form: 'crawler', patrol: [[2, 4], [13, 4]], speed: 0.5, fibers: 10, reach: 1.8 } },
]
const STREET = PHANTOMS.filter((p) => p.id.startsWith('ph')).map((p) => p.id)
const HULL = PHANTOMS.filter((p) => p.id.startsWith('hull')).map((p) => p.id)

/** cold places that cannot be seen, only felt: the body refuses to pass */
const COLD: Vec2[] = [
  [8, 16],
  [8, 17],
  [17, 21],
  [18, 20],
  [11, 11],
]

const PILES: [number, number, string][] = [
  [20, 27, '#56483a'],
  [24, 27, '#3e4648'],
  [19, 29, '#5a5a4a'],
  [22, 28, '#56483a'],
  [23, 28, '#3e4648'],
]

async function opening(g: GameAPI): Promise<void> {
  g.stealth(false)
  g.cinematic(true)
  g.show('player', false)
  for (const id of STREET) g.show(id, false)
  await g.atmosphere({ sky: { top: '#020306', bottom: '#0a0e16', stars: 0, clouds: 0.9 }, hemi: { sky: '#3a4866', ground: '#0c0e12', intensity: 0.7 } }, 0)
  await g.focus([8, 2], { ms: 10, zoom: 0.8 })
  await g.wait(1200)
  await g.narrate(l('Na svahu nad Kitsune ležal v daždi obrovský hladký valec, plytko zarytý do zeme. Matný plášť, po ktorom voda stekala bez stopy.', 'On the slope above Kitsune, in the rain, lay a huge smooth cylinder, shallowly sunk into the earth. A dull hull down which the water ran without a trace.'))
  g.sfx('tick', 0.4)
  await g.focus([11, 3], { ms: 2400, zoom: 1.1 })
  await g.narrate(l('A po plášti, celú noc, dlane. Stovky prízračných dlaní kĺzali po plechu, jemne a metodicky, a hľadali škáru, ktorá neexistovala.', 'And over the hull, all night, palms. Hundreds of phantom palms slid across the plating, gently, methodically, feeling for a crack that did not exist.'))
  g.sfx('tick', 0.3)
  await g.wait(800)
  await g.narrate(l('Vnútri dýchalo celé Kitsune. Tisíc tiel v jednom trupe. A svitalo.', 'Inside, the whole of Kitsune was breathing. A thousand bodies in one hull. And dawn was coming.'))
  await g.fade('black', 1400)
  g.cinematic(false)
  g.set('c16.stage', 0)
  await g.goto('c16_metaru', 'wake')
}

async function piles(g: GameAPI): Promise<void> {
  g.set('c16.piles')
  g.stealth(false)
  g.cinematic(true)
  g.hint(null)
  g.dropVeil()
  g.face('player', [22, 28])
  await g.focus([22, 28], { ms: 1400, zoom: 1.4 })
  await g.narrate(l('Na námestí. Pri studni. Päť tvarov na dlažbe.', 'In the square. By the well. Five shapes on the paving.'))
  await g.narrate(l('Šaty. Päť kôp šiat, každá vo vlastnom čiernom obryse, ktorý dážď nezmýval. Kabáty zapnuté, opasky zapnuté, v rukávoch popol.', 'Clothes. Five heaps of clothes, each in its own black outline that the rain would not wash away. Coats buttoned, belts buckled, ash in the sleeves.'))
  await g.narrate(l('Dve z nich ležali tesne vedľa seba, oveľa bližšie než tie ostatné.', 'Two of them lay close together, much closer than the others.'))
  await g.narrate(l('Pach. Mokrá látka a studený popol, sladkastý a mastný, čo sa lepil na jazyk a nedal sa vydýchnuť.', 'The smell. Wet cloth and cold ash, sweetish and greasy, clinging to the tongue, impossible to breathe out.'))
  g.pose('player', 'kneel')
  await g.narrate(l('Yera kľakla. Nemohla sa pozrieť preč. Nemohla sa pozrieť bližšie.', 'Yera knelt. She could not look away. She could not look closer.'))
  if (g.flag('c16.askedReturn')) await g.say('player', l('Vráťte sa, povedala som mu. A on prikývol.', 'Come back, I told him. And he nodded.'), { thought: true, mood: 'pain' })
  else await g.say('player', l('Niekto musí ísť. Tak to povedal. Ako keby hovoril o vode.', 'Someone has to go. That is how he said it. As if he were talking about water.'), { thought: true, mood: 'pain' })
  await g.wait(1400)
  g.pose('player', 'stand')
  g.follow()
  await g.zoom(1, 600)
  await g.narrate(l('Vracala sa cez prázdne ulice. Pod závojom. Ruky sa triasli.', 'She went back through the empty streets. Under the veil. Her hands were shaking.'))
  g.cinematic(false)
  g.objective(l('Vráť sa pod závojom do Metaru.', 'Return to the Metaru under the veil.'))
  g.hint(l('V — Závoj', 'V — Veil'))
  g.stealth(true)
  sense.reset()
  g.checkpoint()
}

export const town: SceneDef = {
  id: 'c16_town',
  name: l('Kitsune · svah pod Metaru', 'Kitsune · the slope below the Metaru'),
  ambience: TOWN_GREY,
  map: TOWN_MAP,
  player: { character: 'c16_yera', at: [7, 3], facing: 315 },
  spawns: { gate: [7, 3] },
  props: [
    ...TOWN_PROPS,
    ...PILES.map(([x, y, c]) => ({ type: 'clothes_pile', at: [x, y] as Vec2, color: c, params: { dust: true } })),
    ...COLD.map((at) => ({ type: 'frost_patch', at, params: { size: 1.2 } })),
  ],
  actors: PHANTOMS,
  stealth: { failText: l('Vlákna sa obtočili okolo jej zápästia. Tma ju drží za ruku.', 'The fibres wound around her wrist. The dark holds her by the hand.') },
  triggers: [
    { id: 'piles', area: [19, 26, 25, 29], when: (g) => stage(g) === 8 && !g.flag('c16.piles'), run: piles },
    {
      id: 'pull',
      area: [6, 13, 8, 15],
      when: (g) => !!g.flag('c16.piles'),
      run: async (g) => {
        await g.narrate(l('V hrudi tichý a stály ťah. Smeroval k niekomu, kto tu s ňou práve nebol.', 'In her chest, a quiet and steady pull. It pointed towards someone who was not here with her.'))
      },
    },
    {
      id: 'home',
      area: [6, 3, 8, 4],
      when: (g) => !!g.flag('c16.piles'),
      run: async (g) => {
        g.stealth(false)
        g.set('c16.stage', 9)
        await g.goto('c16_metaru', 'gate_in')
      },
    },
  ],
  onEnter: async (g) => {
    failing = false
    sense.reset()
    for (const c of COLD) g.setWalkable(c, false)
    if (stage(g) === 0 && !g.flag('c16.stage')) {
      await g.once('c16.open', () => opening(g))
      return
    }
    for (const id of HULL) g.show(id, false)
    await g.once('c16.searchIntro', async () => {
      g.cinematic(true)
      await g.narrate(l('Svetlo, studený vzduch, ostrý zápach po blesku. Dvere sa za ňou zavreli.', 'Light, cold air, the sharp smell of lightning. The door closed behind her.'))
      await g.narrate(l('Keď zhasneš oheň, ticho ti odpovedá. Plnšie ako hlas.', 'When you put out the fire, silence answers you. Fuller than a voice.'))
      g.cinematic(false)
    })
    if (!g.flag('c16.piles')) {
      g.objective(l('Pod závojom zíď na námestie k studni. Nedovoľ, aby ťa prízraky ucítili.', 'Under the veil, go down to the square by the well. Do not let the phantoms feel you.'))
      g.hint(l('V — Závoj. Bez závoja ťa prízraky zacítia zblízka. Vlákna ťa nájdu vždy.', 'V — Veil. Without it the phantoms feel you up close. The fibres find you always.'))
    }
    g.stealth(true)
  },
  onUpdate: (g, dt) => {
    if (failing || stage(g) !== 8) return
    if (sense.update(g, STREET, dt)) {
      failing = true
      void g.fail(l('Prízrak sa otočil. Zacítil teplo, ktoré nebolo skryté.', 'A phantom turned. It felt a warmth that was not hidden.'))
    }
  },
}
