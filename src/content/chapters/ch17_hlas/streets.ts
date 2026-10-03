/**
 * c17_streets — the veiled run through the dead town in the heavy hour.
 * The Spira holds her body up under the weight, and makes her pay for every
 * step: strain grows while she moves veiled. Unveiled, the phantoms feel her.
 */
import type { ActorDef, SceneDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { TOWN_MAP, TOWN_PROPS, TOWN_RAIN, makeSense } from '../ch16_spoved/shared'

const sense = makeSense(2.2, 1.2)
let failing = false

const PHANTOMS: ActorDef[] = [
  { id: 'p0', character: 'phantom', at: [7, 11], phantom: { form: 'crawler', patrol: [[6, 9], [8, 13]], speed: 0.7, fibers: 8, reach: 1.6 } },
  { id: 'p1', character: 'phantom', at: [5, 16], facing: 45, phantom: { form: 'wall', fibers: 8, reach: 1.5 } },
  { id: 'p2', character: 'phantom', at: [13, 20], phantom: { form: 'crawler', patrol: [[9, 20], [19, 20]], speed: 0.8, fibers: 10, reach: 1.7 } },
  { id: 'p3', character: 'phantom', at: [22, 26], phantom: { form: 'listener', fibers: 10, reach: 1.6 } },
  { id: 'p4', character: 'phantom', at: [24, 23], phantom: { form: 'crawler', patrol: [[19, 23], [27, 23], [27, 29]], speed: 0.7, fibers: 8, reach: 1.7 } },
  { id: 'p5', character: 'phantom', at: [16, 15], phantom: { form: 'humanoid', patrol: [[15, 14], [16, 18]], speed: 0.5, fibers: 8, reach: 1.6 } },
]
const IDS = PHANTOMS.map((p) => p.id)

export const streets: SceneDef = {
  id: 'c17_streets',
  name: l('Kitsune · ťažká hodina', 'Kitsune · The Heavy Hour'),
  ambience: {
    ...TOWN_RAIN,
    particles: [
      { kind: 'rain', count: 1000, id: 'rain' },
      { kind: 'blackdust', at: [15, 18], radius: 14, count: 260, color: '#120c1a' },
    ],
  },
  map: TOWN_MAP,
  sai: { phase: 'heavy' },
  player: { character: 'c16_yera', at: [7, 3], facing: 315 },
  spawns: { gate: [7, 3] },
  props: TOWN_PROPS,
  actors: PHANTOMS,
  stealth: { failText: l('Vlákno ju našlo. Tma ju drží za ruku.', 'A fibre found her. The dark holds her by the hand.') },
  triggers: [
    {
      id: 'understanding',
      area: [6, 8, 8, 10],
      run: async (g) => {
        await g.say('player', l('Pochopenie. Pár slov medzi nami. A on vzal Knihu a Tami a odišiel do noci, ako keby to neznamenalo nič.', 'Understanding. A few words between us. And he took the Book and Tami and left into the night as if it meant nothing.'), { thought: true, mood: 'angry' })
      },
    },
    {
      id: 'anger',
      area: [6, 17, 9, 21],
      run: async (g) => {
        await g.say('player', l('Cestu von. Povedal „cestu von“ a ja som mu uverila.', 'A way out. He said “a way out” and I believed him.'), { thought: true, mood: 'angry' })
        await g.narrate(l('Za každým krokom rástol hnev, tichý a studený, a teraz ho mala toľko, že jej z neho bolo teplo. Hnev ju držal lepšie než Spira.', 'With every step the anger grew, quiet and cold, and now she had so much of it that it warmed her. The anger held her up better than the Spira.'))
      },
    },
    {
      id: 'samael',
      area: [17, 22, 22, 24],
      run: async (g) => {
        await g.narrate(l('Prízraky ju míňali na vzdialenosť paže. Ani jeden sa neotočil. Lenže on áno. Jemný, takmer neviditeľný prach vo vzduchu sa jej lepil na ruky a vlasy a dráždil hrdlo pri každom nádychu.', 'The phantoms passed her at arm’s length. Not one turned. But he did. Fine, almost invisible dust in the air stuck to her hands and hair and scratched her throat with every breath.'))
      },
    },
  ],
  exits: [{ area: [29, 27, 29, 29], to: 'c17_cemetery', spawn: 'entry' }],
  onEnter: async (g) => {
    failing = false
    sense.reset()
    await g.once('c17.run', async () => {
      g.cinematic(true)
      await g.narrate(l('Vybuchla z dverí Železného chrámu priamo do studeného dažďa.', 'She burst out of the doors of the Iron Temple straight into the cold rain.'))
      await g.narrate(l('Keď zhasneš oheň… ticho ti…', 'When you put out the fire… silence…'))
      g.cinematic(false)
    })
    g.objective(l('Za Tami cez mŕtve mesto, dole a ďalej za námestie. Pod závojom.', 'After Tami through the dead town, down and on past the square. Under the veil.'))
    g.hint(l('V — Závoj. V ťažkej hodine ťa Spira drží na nohách, ale každý krok stojí.', 'V — Veil. In the heavy hour the Spira keeps you standing, but every step costs.'))
    g.stealth(true)
  },
  onUpdate: (g, dt) => {
    if (failing) return
    // the Spira carries her body through the heavy hour, and takes its price
    if (g.veiled() && g.saiPhase() === 'heavy') g.addStrain(dt * 0.032)
    if (sense.update(g, IDS, dt)) {
      failing = true
      void g.fail(l('Prízrak sa otočil. Zacítil ju.', 'A phantom turned. It felt her.'))
    }
  },
}
