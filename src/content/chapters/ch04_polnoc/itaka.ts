/**
 * ch04 · scene 1 (Arkot): the Itaka glides into the Nyau aerodock out of the
 * morning fog: no smoke, no engines, a matte dark hull that drinks the light.
 * Renn's fox veterans, Captain Saburo, the young fox on the ramp in frost.
 * Dockhands' tales; the parts with cuts too clean for any workshop; Flint
 * smitten; three days; the last night in the dock tavern.
 */
import type { SceneDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { dockFog, dockDusk } from './nyau/ambience'
import { dockMap, dockProps, dockSpawns } from './nyau/maps'
import { lines } from './nyau/util'

const COUNTS = [l('Tridsaťosem.', 'Thirty-eight.'), l('Tridsaťdeväť.', 'Thirty-nine.'), l('Štyridsať.', 'Forty.')]

export const itakaScene: SceneDef = {
  id: 'c4_itaka',
  name: l('Aerodok Nyau', 'The Nyau Aerodock'),
  ambience: dockFog,
  camera: { zoom: 0.9 },
  map: dockMap,
  player: { character: 'arkot', at: [12, 11], facing: 0, abilities: [] },
  spawns: dockSpawns,
  props: [
    ...dockProps,
    { type: 'airship', at: [10, 4], rot: 0 },
    { type: 'airship', at: [18, 4], rot: 0, color: '#a89878', id: 'korteg' },
    { type: 'c4_itaka_glide', at: [27, 4], rot: 0, hidden: true, id: 'itaka_glide', params: { fx: 0, fy: 5, fz: -17, dur: 11 } },
    { type: 'itaka', at: [27, 4], rot: 0, hidden: true, id: 'itaka_docked' },
    { type: 'bridge', at: [25, 4], rot: 90, hidden: true, id: 'ramp', params: { rails: true } },
    { type: 'crate', at: [23, 9], hidden: true, id: 'goods1', params: { stack: 2 }, color: '#7a6a58' },
    { type: 'crate', at: [23, 10], hidden: true, id: 'goods2', color: '#7a6a58' },
    { type: 'chair', at: [3, 25], rot: 90 },
    { type: 'stool', at: [7, 24] },
  ],
  actors: [
    {
      id: 'flint',
      character: 'flint',
      at: [16, 11],
      facing: 270,
      talk: async (g) => {
        if (!g.flag('c4.arrived')) {
          await lines(g, [
            ['flint', l('Nesieš to zle, braček. Ešte dvesto vriec a možno ti kúpim pivo.', 'You carry it well, little brother. Two hundred more sacks and maybe I buy you a beer.'), 'happy'],
            ['player', l('Ty nesieš čo?', 'And what are you carrying?')],
            ['flint', l('Náladu. Bez nej by ste to tu nezdvihli.', 'The mood. Without it none of you would lift a thing.'), 'happy'],
          ])
          await g.narrate(l('Flint nenosil vrecia. Nikdy ich nenosil. Mal ten dar stáť v tesnej blízkosti práce tak, aby o neho ani nezavadila.', 'Flint did not carry sacks. He never had. He had the gift of standing right next to work in such a way that it never so much as brushed him.'))
        } else if (!g.flag('c4.stopped')) {
          await g.narrate(l('Flint z nej nespúšťal oči. Z rampy. Z miesta, kde stála.', 'Flint never took his eyes off her. Off the ramp. Off the place where she stood.'))
          await g.say('flint', l('Hask hovoril, že lieta rýchlejšie ako búrka. A že ju nikto nikdy nedobehol.', 'Hask said she flies faster than a storm. And that nobody has ever caught her.'), { mood: 'tender' })
        } else {
          await g.say('flint', l('Nič nehovor.', "Don't say anything."), { mood: 'closed' })
        }
      },
    },
    {
      id: 'old',
      character: 'c4_dock_old',
      at: [20, 11],
      facing: 180,
      talk: async (g) => {
        if (!g.flag('c4.arrived')) {
          await g.say('old', l('Hmla dnes leží ťažko. Kto chce pristáť, bude lietať naslepo.', 'The fog lies heavy today. Whoever wants to land will fly blind.'))
          return
        }
        if (!g.flag('c4.askedParts')) {
          await g.say('player', l('Čo priniesli?', 'What did they bring?'))
          await g.say('old', l('Súčiastky. Vždy súčiastky.', 'Parts. Always parts.'))
          await g.say('old', l('Nikto nevie odkiaľ, nikdy nepovedia zdroj. Prídu, predajú, odídu. Potom sa raz za čas vrátia s niečím iným. Kedy, to nevie nikto.', 'Nobody knows from where; they never name the source. They come, they sell, they leave. Then once in a while they come back with something else. When, nobody knows.'))
          g.set('c4.askedParts')
          g.objective(l('Prezri si tovar z Itaky pod plachtou.', "Look over the Itaka's wares under the canvas."))
          return
        }
        if (g.flag('c4.sawCuts') && !g.flag('c4.askedMaker')) {
          await g.say('player', l('Kto to vyrába?', 'Who makes them?'))
          g.emote('old', '…')
          await g.narrate(l('Dokár pokrčil plecami a odišiel.', 'The dockhand shrugged and walked away.'))
          g.set('c4.askedMaker')
          void g.walk('old', [17, 14])
          return
        }
        await lines(g, [
          ['old', l('Renn staval vzducholode, čo vraj preletia oceán. Tak hovoria. Ja som len videl tú jednu.', 'Renn built airships that could cross the ocean, they say. So they say. I have only ever seen that one.')],
          ['old', l('Dievča mala sedem zím, keď ju priviedla domov. Sedem.', 'The girl was seven winters old when she brought her home. Seven.')],
        ])
      },
    },
    {
      id: 'oily',
      character: 'c4_dock_oily',
      at: [19, 12],
      facing: 180,
      talk: async (g) => {
        if (!g.flag('c4.arrived')) {
          await g.say('oily', l('Majster dnes vrčí. Kortegova nákladná mešká a on to zase zvalí na nás.', "The master's growling today. Korteg's freighter is late and he'll blame it on us again."))
          return
        }
        await g.say('oily', l('Čary, hovorí starý. Čary nič. Decko neriadi vzducholoď. Niekto jej pomohol.', 'Magic, says the old one. Magic my foot. A child does not fly an airship. Someone helped her.'))
        await g.say('oily', l('A tí piráti? Nikto ich odvtedy nevidel. Ani jedného.', 'And those pirates? Nobody has seen them since. Not one.'))
      },
    },
    {
      id: 'foreman',
      character: 'c4_foreman',
      at: [14, 15],
      facing: 180,
      talk: async (g) => {
        await g.say('foreman', l('Čo stojíš, Mezra? Vrecia sa samé nenaložia. Kto sa díva na oblohu, nech si od nej pýta mzdu.', "What are you standing there for, Mezra? Sacks don't load themselves. Whoever stares at the sky can ask the sky for wages."), { mood: 'angry' })
      },
    },
    {
      id: 'loader1',
      character: 'c4_loader1',
      at: [9, 9],
      facing: 90,
      talk: async (g) => {
        await g.say('loader1', l('Vraj Renn videl miesta, čo nie sú na žiadnej mape. A vraj ich aj kreslil.', 'They say Renn saw places that are on no map. And that he drew them, too.'))
      },
    },
    {
      id: 'loader2',
      character: 'c4_loader2',
      at: [15, 12],
      facing: 90,
      talk: async (g) => {
        await g.say('loader2', l('Rennova posledná loď. Piráti ho zabili a ona im ju vzala späť. Taký príbeh sa v prístave rozpráva len raz za život.', "Renn's last ship. The pirates killed him and she took it back from them. A story like that gets told in a harbour once in a lifetime."))
      },
    },
    {
      id: 'loader4',
      character: 'c4_loader4',
      at: [17, 12],
      facing: 270,
      talk: async (g) => {
        await g.say('loader4', l('Pozri na tie rotory. Ani jeden výfuk. Čím to letí, keď nie etanolom?', "Look at those rotors. Not a single exhaust. What does it fly on, if not ethanol?"))
      },
    },
    {
      id: 'mech',
      character: 'c4_loader3',
      at: [30, 21],
      facing: 90,
      talk: async (g) => {
        await g.say('mech', l('Kašle, kašle a nechytí. Ako môj dedo.', 'It coughs and coughs and never catches. Like my grandfather.'))
      },
    },
    // the Itaka's crew
    {
      id: 'saburo',
      character: 'saburo',
      at: [25, 9],
      facing: 0,
      hidden: true,
      talk: async (g) => {
        await g.narrate(l('Starý lišiak stál na konci rampy so skríženými rukami a prezeral si vzletisko s pokojom niekoho, kto videl svetov viac, než má za sebou zím.', 'The old dog-fox stood at the foot of the ramp with his arms crossed, looking over the airfield with the calm of someone who has seen more worlds than he has winters behind him.'))
        g.face('saburo', 'player')
        await g.wait(500)
        await g.narrate(l('Pozrel sa na Arkota raz, krátko, tak, ako sa pozerá na počasie. Potom sa zase díval na posádku.', 'He looked at Arkot once, briefly, the way one looks at the weather. Then he went back to watching his crew.'))
        g.face('saburo', 0)
      },
    },
    { id: 'tami', character: 'tami', at: [25, 5], facing: 90, hidden: true },
    { id: 'vet1', character: 'c4_vet1', at: [25, 7], facing: 0, hidden: true, behavior: 'idle' },
    { id: 'vet2', character: 'c4_vet2', at: [24, 8], facing: 270, hidden: true },
    { id: 'vet3', character: 'c4_vet3', at: [29, 8], facing: 0, hidden: true },
    // the dock tavern (last night)
    { id: 'pilot1', character: 'c4_pilot1', at: [2, 23], facing: 90, pose: 'sit', hidden: true },
    { id: 'pilot2', character: 'c4_pilot2', at: [9, 23], facing: 270, pose: 'sit', hidden: true },
    { id: 'cards1', character: 'c4_cards1', at: [6, 25], facing: 90, pose: 'sit', hidden: true },
    { id: 'cards2', character: 'c4_cards2', at: [8, 24], facing: 225, pose: 'sit', hidden: true },
    { id: 'barkeep', character: 'c4_barkeep', at: [1, 23], facing: 90, hidden: true },
  ],
  interactables: [
    {
      id: 'pile',
      at: [12, 13],
      label: l('Zdvihnúť vrece s obilím', 'Lift a sack of grain'),
      verb: 'take',
      when: (g) => g.flag('c4.stage') === 'load' && !g.flag('c4.carry'),
      run: async (g) => {
        g.pose('player', 'carry')
        g.sfx('whoosh', 0.3)
        g.set('c4.carry')
        g.objective(l('Odnes vrece do nákladného priestoru vzducholode na prvom móle.', 'Carry the sack to the hold of the airship on the first pier.'))
      },
    },
    {
      id: 'hold',
      at: [10, 7],
      label: l('Zložiť vrece do nákladného priestoru', 'Set the sack down in the hold'),
      verb: 'use',
      when: (g) => !!g.flag('c4.carry'),
      run: async (g) => {
        g.pose('player', 'stand')
        g.set('c4.carry', false)
        g.sfx('click', 0.5)
        const n = g.inc('c4.sacks')
        await g.say('player', COUNTS[Math.min(COUNTS.length - 1, n - 1)], { thought: true })
        if (n === 1) await g.narrate(l('Arkot nakladal vrecia od svitu. Čas počítal podľa narastajúcej bolesti v pleciach, nie podľa strieborných hodín, čo mal kapitán pripnuté na opasku. Robotníci nepotrebovali čísla, stačila im váha.', "Arkot had been loading sacks since dawn. He counted time by the growing ache in his shoulders, not by the silver watch the captain wore clipped to his belt. Workers needed no numbers; weight was enough."))
        if (n < 3) {
          g.objective(l('Nos vrecia z kopy pri vozíku na prvé mólo.', 'Carry sacks from the pile by the cart to the first pier.'))
          return
        }
        g.set('c4.stage', 'call')
        await arrival(g)
      },
    },
    {
      id: 'parts',
      at: [21, 17],
      label: l('Tovar z Itaky pod plachtou', "The Itaka's wares under the canvas"),
      verb: 'look',
      when: (g) => !!g.flag('c4.arrived'),
      run: async (g) => {
        await g.narrate(l('V tieni plachty ležali rozložené čerpadlá, prevodovky a akési turbínky.', 'In the shade of the canvas lay pumps taken apart, gearboxes and some kind of small turbines.'))
        await g.narrate(l('Arkot si všimol rezy na kovových hranách. Čisté, hladké, presné spôsobom, aký nepoznali nyauské ani nevrisské dielne. Príliš kvalitné. Iné.', 'Arkot noticed the cuts on the metal edges. Clean, smooth, precise in a way no workshop in Nyau or Nevriss knew. Too good. Different.'))
        g.set('c4.sawCuts')
        if (!g.flag('c4.askedMaker')) g.objective(l('Opýtaj sa starého dokára, kto to vyrába.', 'Ask the old dockhand who makes them.'))
      },
    },
    {
      id: 'ship',
      at: [24, 10],
      label: l('Itaka', 'The Itaka'),
      verb: 'look',
      when: (g) => !!g.flag('c4.arrived') && !g.flag('c4.evening'),
      run: async (g) => {
        await g.narrate(l('Itaka nehybne a ťažko visela v lanových úväzoch a len občas ju niečo neviditeľné potiahlo o pár palcov do strany, akoby sa zhlboka nadýchla.', 'The Itaka hung heavy and still in her mooring ropes, and only now and then something invisible drew her a few inches aside, as if she were taking a deep breath.'))
        await g.narrate(l('V Arkotovi sa niečo naplo smerom k nej ako lano pred prasknutím. Nebola to túžba po oblohe. Bol to pocit, že svet je väčší než dok a horúčava a plecia, ktoré budú bolieť rovnako dnes aj ďalšie zimy.', 'Something in Arkot drew taut towards her like a rope about to snap. It was not a longing for the sky. It was the feeling that the world was bigger than the dock and the heat and the shoulders that would ache the same today and every winter after.'))
        await g.say('player', l('Niekde za obzorom čaká dôvod vstať zo schodu.', 'Somewhere past the horizon there is a reason to get up off the step.'), { thought: true })
      },
    },
    {
      id: 'tamiLook',
      at: [26, 9],
      label: l('Líška na rampe', 'The fox on the ramp'),
      verb: 'look',
      radius: 2.2,
      when: (g) => !!g.flag('c4.arrived') && !g.flag('c4.evening'),
      run: async (g) => {
        await g.narrate(l('Mladá líška ostala na rampe a pohľad upierala na vzletisko. Miesto nehodnotila, len si ho v tichosti zapamätávala.', 'The young fox stayed on the ramp, her gaze fixed on the airfield. She was not judging the place, only quietly committing it to memory.'))
      },
    },
    {
      id: 'boards',
      at: [5, 23],
      label: l('Dosky s menami strojov', 'Boards with the names of ships'),
      verb: 'read',
      when: (g) => !!g.flag('c4.evening'),
      run: async (g) => {
        await g.read(
          l('Dosky nad stolmi pilotov', "Boards above the pilots' tables"),
          l(
            'Kriedou, rôznymi rukami, mená strojov a ich kapitánov. Niektoré prečiarknuté.\n\n*Ranná čajka* · Beladiss — Nyau\n*Siedma vlna* · Nevriss\n*Korteg* · nákladná · západné aerodoky\n~~Biela soľ~~ · stratená v Tai\n\nNa samom spodku, nikým neprepísané, len jedno slovo: *Itaka*.',
            'In chalk, in many hands, the names of ships and their captains. Some struck through.\n\n*Morning Gull* · Beladiss — Nyau\n*Seventh Wave* · Nevriss\n*Korteg* · freighter · the western aerodocks\n~~White Salt~~ · lost in Tai\n\nAt the very bottom, never written over by anyone, a single word: *Itaka*.',
          ),
          { style: 'letter' },
        )
      },
    },
  ],
  triggers: [
    {
      id: 'chase_catch',
      area: [0, 0, 33, 25],
      once: false,
      when: (g) => g.flag('c4.stage') === 'chase' && g.dist('flint', 'player') < 1.6,
      run: async (g) => {
        g.set('c4.stage', 'caught')
        await stopFlint(g, true)
      },
    },
    {
      id: 'chase_late',
      area: [0, 0, 33, 25],
      once: false,
      when: (g) => g.flag('c4.stage') === 'chase' && g.dist('flint', [24, 9]) < 1.2,
      run: async (g) => {
        g.set('c4.stage', 'caught')
        await stopFlint(g, false)
      },
    },
    {
      id: 'leave',
      area: [15, 24, 21, 25],
      when: (g) => !!g.flag('c4.leftTavern'),
      run: async (g) => {
        g.cinematic(true)
        await g.narrate(l('Vonku dýchal nyauský nočný vzduch, dusný, horúci a nasýtený vôňou nočných kvetov. Ulice boli tiché, vzletisko spalo.', 'Outside, the Nyau night air breathed, close and hot and heavy with the scent of night flowers. The streets were quiet; the airfield slept.'))
        await g.narrate(l('Za kanálom, za starým mostom, čakala záhrada. Išiel tam. Do tmy, kde naňho čakala; do zvyku, ktorý sa nezačal na dokoch, ale oveľa skôr.', 'Beyond the canal, beyond the old bridge, the garden was waiting. He went there. Into the dark, where she was waiting for him; into a habit that had not begun on the docks, but long before.'))
        await g.fade('black', 1400)
        await g.caption(l('Začalo sa to dlho predtým, než Itaka pristála v Nyau.', 'It began long before the Itaka landed in Nyau.'), { ms: 3600 })
        g.cinematic(false)
        await g.goto('c4_shadow')
      },
    },
  ],
  onEnter: async (g) => {
    const arrived = !!g.flag('c4.arrived')
    const evening = !!g.flag('c4.evening')
    if (arrived) {
      g.propVisible('itaka_docked', true)
      g.propVisible('ramp', true)
      g.propVisible('goods1', true)
      g.propVisible('goods2', true)
      if (!evening) for (const id of ['saburo', 'tami', 'vet1', 'vet2', 'vet3']) g.show(id, true)
    }
    if (evening) {
      await g.atmosphere(dockDusk, 0)
      for (const id of ['pilot1', 'pilot2', 'cards1', 'cards2', 'barkeep']) g.show(id, true)
      g.teleport('flint', [3, 25], 90)
      g.pose('flint', 'sit')
      g.show('mech', false)
    }
    if (g.flag('c4.stage') === 'chase') {
      g.set('c4.stage', 'stop')
    }
    await g.once('c4.open', async () => {
      g.cinematic(true)
      g.pose('player', 'carry')
      await g.wait(500)
      await g.narrate(l('Ráno na vzletisku voňalo olejom, etanolom a včerajším vínom. Prvé teplo dvíhalo z dosiek paru a s ňou smrad, čo cez noc spal v kanáloch.', "Morning on the airfield smelled of oil, ethanol and yesterday's wine. The first warmth lifted steam off the planks, and with it the stench that had slept all night in the canals."))
      await g.narrate(l('Vzletisko sa preberalo po hlase: rachot navijakov, prvé nadávky, čajky nad rampami.', 'The airfield woke by its voices: the rattle of winches, the first curses, gulls above the ramps.'))
      g.pose('player', 'stand')
      g.codex('people.arkot')
      g.cinematic(false)
      g.set('c4.stage', 'load')
      g.objective(l('Nos vrecia z kopy pri vozíku na prvé mólo.', 'Carry sacks from the pile by the cart to the first pier.'))
      g.hint(l('E — interakcia · Shift — beh', 'E — interact · Shift — run'))
    })
    if (g.flag('c4.stage') === 'stop') await threeDays(g)
  },
  onUpdate: (g) => {
    if (g.flag('c4.stage') === 'load' && g.time > 6) g.hint(null)
  },
}

/** Flint calls; the Itaka glides in out of the fog and lands. */
async function arrival(g: Parameters<NonNullable<SceneDef['onEnter']>>[0]): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  g.hint(null)
  g.teleport('flint', [22, 9], 180)
  await g.say('flint', l('Arkot.', 'Arkot.'))
  await g.narrate(l('Flintov hlas mal zvláštny tón, úplne iný než ten bežný a vtipkujúci.', "Flint's voice had a strange note in it, nothing like his usual joking one."))
  g.face('player', 'flint')
  g.pose('flint', 'point')
  await g.narrate(l('Flint stál na okraji doku a ukazoval na západ. Rukou, nielen pohľadom. Celým ramenom, ako dieťa.', 'Flint stood at the edge of the dock pointing west. With his hand, not just his eyes. With his whole arm, like a child.'))
  await g.narrate(l('Arkot odložil vrece.', 'Arkot put down the sack.'))
  g.music('main', 2400)
  await g.focus([27, -2], { ms: 1800, zoom: 0.72 })
  g.particles({ kind: 'steam', count: 46, area: [24, -4, 30, 7], color: '#eef2f6', id: 'itaka_steam' })
  g.propVisible('itaka_glide', true)
  void g.atmosphere({ fog: { color: '#cdd0d6', near: 6, far: 40 } }, 9000)
  await g.narrate(l('Vzducholoď prišla od západu, odtiaľ, kde nad diaľkovou vodou ležala hmla, hustá a nehybná, aká sadá na kanály pred úsvitom. Z tej sivej sa čosi odlepilo.', 'The airship came from the west, from where the fog lay over the distant water, thick and motionless, the kind that settles on the canals before dawn. Something peeled itself away from that grey.'))
  await g.narrate(l('Prichádzalo bez praskotu olejových motorov a bez vlečky čierneho dymu, akými sa obchodné vzducholode ohlasovali zďaleka. Nepraskalo. Nedymilo. Kĺzalo, a vzduch ho niesol zadarmo.', 'It came without the crackle of oil engines and without the trail of black smoke by which merchant airships announced themselves from afar. It did not crackle. It did not smoke. It glided, and the air carried it for free.'))
  await g.focus([27, 3], { ms: 3000, zoom: 0.8 })
  await g.narrate(l('Vynorila sa ako duch, celá zahalená do vlastného bledého dychu. Trup z tmavého kovu nevracal svetlo ako oceľ. Pil ho: matný, hlboký, akoby naň úsvit nemal dosah.', 'She surfaced like a ghost, wrapped in her own pale breath. The hull of dark metal did not throw back the light the way steel does. It drank it: matte, deep, as if the dawn could not reach it.'))
  await g.narrate(l('Bola malá. Nízky, dravý tvar, akoby niekto dal myšlienke rýchlosti hmatateľnú kožu. A na prove, absurdne veľký na také útle telo, kanón. Hlaveň mierila dole, v pokoji, no ostrá ako otázka.', 'She was small. A low, predatory shape, as if someone had given the idea of speed a skin you could touch. And at the bow, absurdly large for so slender a body, a cannon. Its barrel pointed down, at rest, but sharp as a question.'))
  void g.atmosphere({ sounds: ['sea', 'wind'] }, 1200)
  g.emote('old', '…')
  g.pose('loader2', 'stand')
  await g.narrate(l('Robotníci na vzletisku stíchli jeden po druhom; vlna ticha sa šírila od doku k skladiskám, ako keď hodíš kameň do kanálu. Starý dokár pri žeriave si zložil čiapku.', 'The workers on the airfield fell silent one after another; a wave of quiet spread from the dock to the warehouses, the way it does when you throw a stone into a canal. The old dockhand by the crane took off his cap.'))
  await g.caption(l('Itaka.', 'The Itaka.'), { ms: 2400 })
  g.stopParticles('itaka_steam')
  g.follow()
  await g.zoom(1, 900)
  void g.walk('flint', [13, 11])
  await g.narrate(l('Flint prišiel k nemu. Stál vedľa neho a mlčal, čo bolo pre Flinta neobvyklé.', 'Flint came over to him. He stood beside him and said nothing, which was unusual for Flint.'))
  g.face('player', 'flint')
  await lines(g, [
    ['player', l('Videl si ju niekedy?', 'Ever seen her before?')],
    ['flint', l('Nie. Ale Hask hovoril. Bol v Beladiss, keď pristála pred troma zimami. Hovoril, že celý aerodok vyšiel von.', 'No. But Hask talked about her. He was in Beladiss when she landed three winters ago. Said the whole aerodock came out to look.')],
  ])
  // the landing
  g.set('c4.arrived')
  await g.focus([25, 7], { ms: 1200, zoom: 1.05 })
  await g.narrate(l('Itaka pristála s presnosťou, ktorá pre toto vzletisko nebola typická. Jemne a dokonale, bez jediného trhnutia.', 'The Itaka landed with a precision this airfield was not used to. Gently and perfectly, without a single jolt.'))
  g.propVisible('ramp', true)
  for (const id of ['saburo', 'vet1', 'vet2', 'vet3']) g.show(id, true)
  g.sfx('door', 0.6)
  await g.narrate(l('Rampa sa spustila a po nej kráčali starí lišiaci so šedivými čeľusťami a zjazvenými rukami. Rennovi veteráni vykladali tovar bez jediného slova či pohľadu na zhluknuté vzletisko; robili to už tisíckrát predtým.', "The ramp came down, and old dog-foxes walked down it, grey in the jaw and scarred in the hands. Renn's veterans unloaded the cargo without a word or a glance at the gathered airfield; they had done it a thousand times before."))
  g.propVisible('goods1', true)
  g.propVisible('goods2', true)
  await g.narrate(l('Ako prvý z rampy zišiel kapitán, vo vyblednutom trojhrannom klobúku, ktorý vyzeral starší než on sám. Stál na konci rampy so skríženými rukami a nechal posádku pracovať.', 'The first down the ramp had been the captain, in a faded tricorn that looked older than he was. He stood at the foot of the ramp with his arms crossed and let his crew work.'))
  g.codex('people.saburo')
  // the cold, and the young fox
  g.show('tami', true)
  g.fx('burst', [25, 5], { color: '#e6f6ff' })
  g.sfx('ice', 0.4)
  void g.atmosphere({ grade: { tint: '#e8f0ff', saturation: 0.8 } }, 1500)
  await g.narrate(l('Skôr než ju Arkot zbadal, udrel chlad. Z otvorenej rampy stiekol na dok prúd studeného vzduchu, ostrý a čistý, s vôňou výšky a diaľky, mrazu, ktorý ráno v prístave nemalo kde vziať.', 'Before Arkot saw her, the cold struck. A stream of cold air ran down the open ramp onto the dock, sharp and clean, smelling of height and distance, of a frost the harbour had no way of making in the morning.'))
  await g.narrate(l('Vydýchol a dych sa mu prvý raz v to ráno zrazil na bledú paru.', 'He breathed out, and for the first time that morning his breath turned to pale vapour.'))
  await g.focus('tami', { ms: 1100, zoom: 1.35 })
  await g.narrate(l('Mladá. Priveľmi mladá na takú vzducholoď. Líška, no nie ako tie z Nyau, jemné a mestské. Divá. Hriva medených vlasov, neučesaná, a nad ňou hrdo trčali špicaté líščie uši.', 'Young. Far too young for an airship like that. A fox, but not like the ones in Nyau, delicate and city-bred. Wild. A mane of copper hair, uncombed, and above it pointed fox ears standing proud.'))
  await g.narrate(l('Na čele odsunuté mosadzné letecké okuliare, na skle ešte kvapky zrazenej hmly. Kabát z hnedej kože s golierom z ovčej vlny, ramená postriebrené námrazou, čo sa ešte neroztopila. Dve pištole a dlhé úzke puzdro na čosi, čo pripomínalo rapír.', 'Brass flying goggles pushed up on her forehead, drops of condensed fog still on the glass. A coat of brown leather with a sheepskin collar, the shoulders silvered with frost that had not yet melted. Two pistols, and a long narrow case for something that looked like a rapier.'))
  await g.narrate(l('Pohybovala sa po palube za kapitánom, nová a čerstvá, očividne sa len zaúčala, no Itaka akoby patrila jej, nie ona Itake.', 'She moved along the deck behind the captain, new and fresh, plainly still learning, and yet the Itaka seemed to belong to her rather than she to the Itaka.'))
  g.face('tami', 'player')
  await g.wait(400)
  await g.narrate(l('Potom sa otočila. Modré oči, priveľmi modré, priezračné ako plameň pod ľadom. Nie líščie oči. Čosi staršie a bystrejšie, čo sa nehodilo k tej mladej tvári. A pekné tak, že Arkot odvrátil pohľad prvý.', 'Then she turned. Blue eyes, far too blue, clear as a flame under ice. Not fox eyes. Something older and sharper, that did not fit that young face. And beautiful enough that Arkot looked away first.'))
  g.face('player', 'flint')
  g.follow()
  await g.zoom(1, 700)
  g.teleport('old', [15, 10], 90)
  g.face('old', 'player')
  await g.say('flint', l('Kto je to?', 'Who is that?'), { mood: 'surprised' })
  await lines(g, [
    ['old', l('Rennova mladá. Dcéra. Po otcovi.', "Renn's girl. His daughter. Her father's all over."),],
    ['old', l('Starý je jej dedo. Saburo.', "The old one's her grandfather. Saburo.")],
    ['old', l('Jej otec ju postavil. Piráti mu ju vzali aj s dcérou a samotného Renna zabili. Hovorí sa, že s ňou ušla a odletela domov. Sama. Pred dvoma zimami.', 'Her father built that ship. Pirates took it from him, the daughter with it, and killed Renn himself. They say she got away in it and flew home. Alone. Two winters ago.')],
  ])
  g.codex('people.tami')
  g.codex('world.itaka')
  await g.narrate(l('Flintov zrak uletel späť k líške na rampe. Neopýtal sa, čo sa stalo s pirátmi. Nemusel; odpoveď visela vo vzduchu sama.', "Flint's eyes flew back to the fox on the ramp. He did not ask what had happened to the pirates. He did not need to; the answer hung in the air by itself."))
  await g.say('old', l('Sú v tom čary.', "There's magic in it."))
  g.emote('oily', '💢')
  await g.say('oily', l('Decko neriadi vzducholoď. Niekto jej pomohol.', "A kid doesn't fly an airship. Someone helped her."))
  await g.narrate(l('Flint nič nepovedal. To bolo zase neobvyklé. A Arkot vedel prečo. Flint sa zamiloval. Nie do dievčaťa na rampe, tú nepoznal, ale do jej obrazu, do toho, čo si k nej za jediný úder srdca domyslel.', 'Flint said nothing. That was unusual again. And Arkot knew why. Flint had fallen in love. Not with the girl on the ramp, he did not know her, but with the picture of her, with everything he had imagined around her in a single heartbeat.'))
  g.codex('people.flint')
  g.walk('old', [20, 11]).then(() => g.face('old', 180)).catch(() => undefined)
  g.cinematic(false)
  g.music(null, 3000)
  void g.atmosphere({ sounds: ['sea', 'crowd', 'machine'], grade: { tint: '#f2eee8', saturation: 0.9 } }, 3000)
  g.set('c4.stage', 'look')
  g.objective(l('Opýtaj sa starého dokára, čo Itaka priniesla.', 'Ask the old dockhand what the Itaka brought.'))
  g.checkpoint()
  // after looking around: three days
  await g.until(() => !!g.flag('c4.askedMaker'))
  await g.wait(1200)
  await threeDays(g)
}

/** Three days pass; on the second afternoon Flint makes for the Itaka. */
async function threeDays(g: Parameters<NonNullable<SceneDef['onEnter']>>[0]): Promise<void> {
  g.lock()
  g.cinematic(true)
  await g.fade('black', 900)
  for (const id of ['vet1', 'vet2', 'vet3', 'tami']) g.show(id, false)
  g.teleport('flint', [14, 12], 90)
  g.teleport('player', [12, 12], 90)
  await g.caption(l('Itaka zostala v aerodoku tri dni.', 'The Itaka stayed in the aerodock for three days.'), { ms: 3000, sub: l('Tri dni horúčavy, múch a olejového smradu.', 'Three days of heat, flies and the stink of oil.') })
  await g.atmosphere({ fog: { color: '#e6d8c0', near: 16, far: 58 }, sun: { color: '#ffe6c2', intensity: 2.1, dir: [-0.55, 1, 0.35] }, grade: { tint: '#fff4e4', saturation: 1.04 } }, 0)
  await g.fade('clear', 900)
  await g.narrate(l('Tri dni Flint nenosil vrecia a pozeral na rampu. Len na rampu.', 'For three days Flint carried no sacks and watched the ramp. Only the ramp.'))
  await g.narrate(l('Poobede druhého dňa Flint odložil fľašu, oprášil si nohavice a vykročil smerom k Itake, rýchlo, s tou jeho nervóznou energiou, akoby sa bál, že ak sa zastaví, rozmyslí si to.', 'On the afternoon of the second day Flint put down his bottle, brushed off his trousers and set off towards the Itaka, fast, with that nervous energy of his, as if afraid that if he stopped he would think better of it.'))
  g.cinematic(false)
  g.set('c4.stage', 'chase')
  g.objective(l('Zastav Flinta, kým nedôjde k rampe.', 'Stop Flint before he reaches the ramp.'))
  g.hint(l('Shift — beh', 'Shift — run'))
  g.free()
  void g.walk('flint', [24, 9], { speed: 2.2 })
}

async function stopFlint(g: Parameters<NonNullable<SceneDef['onEnter']>>[0], caught: boolean): Promise<void> {
  g.hint(null)
  g.objective(null)
  g.cinematic(true)
  void g.walk('flint', g.pos('flint'))
  if (caught) {
    g.face('player', 'flint')
    await g.say('player', l('Flint.', 'Flint.'))
    g.face('flint', 'player')
    await g.say('flint', l('Len sa chcem…', 'I just want to…'))
    await g.say('player', l('Nie.', 'No.'))
  } else {
    g.teleport('player', [22, 10], 90)
    g.face('player', 'flint')
    await g.narrate(l('Dobehol ho až pri rampe a chytil ho za rameno.', 'He caught up with him only at the ramp and took him by the shoulder.'))
    await g.say('player', l('Flint.', 'Flint.'))
    await g.say('flint', l('Len sa chcem…', 'I just want to…'))
    await g.say('player', l('Nie.', 'No.'))
  }
  g.show('vet1', true)
  g.teleport('vet1', [25, 8], 270)
  g.face('vet1', 'flint')
  await g.narrate(l('Arkot nemusel vysvetľovať, pretože jeden z veteránov na rampe sa práve otočil ich smerom. Pohľad to bol studený a krátky, no úplne stačil.', 'Arkot did not need to explain, because one of the veterans on the ramp had just turned their way. The look was cold and brief, and it was entirely enough.'))
  g.mood('flint', 'angry')
  await g.narrate(l('Flint strhol rameno. Stál tam, rysie uši dozadu, a díval sa na Arkotovu ruku, ako keby premýšľal, či ho udrieť. Potom vydýchol. Vrátil sa k vreciam.', "Flint wrenched his shoulder free. He stood there, lynx ears laid back, looking at Arkot's hand as if wondering whether to hit him. Then he breathed out. He went back to the sacks."))
  void g.walk('flint', [14, 12])
  g.mood('flint', 'neutral')
  await g.narrate(l('Arkot nič nepovedal. Nikdy mu na to nič nepovedal.', 'Arkot said nothing. He never said anything to him about it.'))
  g.set('c4.stopped')
  await tavern(g)
}

/** The last night before the Itaka leaves, in the dock tavern. */
async function tavern(g: Parameters<NonNullable<SceneDef['onEnter']>>[0]): Promise<void> {
  await g.fade('black', 1000)
  g.set('c4.evening')
  g.show('vet1', false)
  g.show('mech', false)
  for (const id of ['pilot1', 'pilot2', 'cards1', 'cards2', 'barkeep']) g.show(id, true)
  g.teleport('player', [5, 25], 270)
  g.pose('player', 'sit')
  g.teleport('flint', [3, 25], 90)
  g.pose('flint', 'sit')
  await g.atmosphere(dockDusk, 0)
  g.music(null)
  await g.caption(l('Poslednú noc pred odletom Itaky', 'The last night before the Itaka flew'), { ms: 2600 })
  await g.fade('clear', 900)
  await g.focus([5, 24], { ms: 800, zoom: 1.4 })
  await g.narrate(l('V dokovej krčme Flint pil a hovoril. Arkot sedel vedľa neho, s pohľadom utopeným v pohári.', 'In the dock tavern Flint drank and talked. Arkot sat beside him, his gaze drowned in his glass.'))
  await g.narrate(l('Pri stene, pod doskami s menami strojov, sedeli piloti. Starí, s klanovými znakmi na golieroch, každý pri svojom stole, a k tým stolom si nikto nesadal, ani opitý.', 'By the wall, under the boards with the names of the ships, sat the pilots. Old men, clan marks on their collars, each at his own table, and no one sat down at those tables, not even drunk.'))
  await lines(g, [
    ['flint', l('Čo si o nej myslíš?', 'What do you make of her?')],
    ['player', l('Neviem, kto je. Ale vie, čo chce.', "I don't know who she is. But she knows what she wants.")],
    ['flint', l('To áno.', 'That she does.'), 'tender'],
  ])
  await g.narrate(l('Bol to iný úsmev než ráno, o niečo mäkší a so vzdialeným leskom v očiach, ktorý Arkot dobre poznal a ktorého sa bál. Nič dobré z neho nikdy nevzišlo.', 'It was a different smile from the morning one, a little softer, with a distant shine in his eyes that Arkot knew well and feared. Nothing good had ever come of it.'))
  await lines(g, [
    ['player', l('A tá tvoja?', 'And yours?')],
    ['flint', l('Čo s ňou?', 'What about her?')],
  ])
  await g.narrate(l('Flint otočil pohár v ruke, raz. V druhej mu ležal zelený črep morského skla, ktorý už týždeň obrusoval o kameň do hladka, keď si myslel, že sa nik nepozerá.', 'Flint turned his glass in his hand, once. In the other lay a green shard of sea glass that for a week now he had been rubbing smooth against a stone whenever he thought no one was looking.'))
  await g.say('flint', l('Je z Nyau. Ja nie som.', "She's from Nyau. I'm not."), { mood: 'closed' })
  await g.narrate(l('Flintove dievčatá sa striedali s prílivmi a mená si nepamätal. Ale túto Flint spomenul za posledný mesiac tretí raz. A ten zelený črep vídal v jeho rukách priveľa večerov na to, aby mu veril.', 'Flint’s girls came and went with the tides and he never remembered their names. But this one he had mentioned three times in the past month. And Arkot had seen that green shard in his hands too many evenings to believe him.'))
  // the cards
  void g.walk('flint', [7, 24]).then(() => g.pose('flint', 'sit'))
  await g.narrate(l('Pri vedľajšom stole rozdávali karty a Flint to zacítil skôr, než sa otočil, ako pes dym. Za dve rozdania bol v hre. Za tri sa smial nahlas a mince pred ním rástli a rednúli v tom istom starom rytme.', 'At the next table they were dealing cards, and Flint smelled it before he turned round, like a dog smells smoke. Within two hands he was in the game. Within three he was laughing out loud, and the coins in front of him grew and thinned in the same old rhythm.'))
  g.sfx('tick', 0.5)
  await g.wait(600)
  const c = await g.choose([
    { id: 'look', text: l('Zdvihnúť oči na tie mince. Raz.', 'Raise your eyes to those coins. Once.') },
    { id: 'away', text: l('Nepozerať sa. Piť.', "Don't look. Drink.") },
  ])
  if (c === 'look') {
    await g.narrate(l('Arkot sa nepohol od svojho pohára. Zdvihol oči, raz, na tie mince a na ten úsmev, a zase ich spustil. Nepovedal ani slovo. Stačilo to. Flint položil karty lícom nadol.', 'Arkot did not move from his glass. He raised his eyes, once, to those coins and that smile, and lowered them again. He did not say a word. It was enough. Flint laid his cards face down.'))
    g.face('flint', 'player')
    await g.say('flint', l('Nepozeraj sa tak na mňa, braček. Nie si môj otec, aby si ma súdil. A keby aj, ten svoje právo dávno prepil.', "Don't look at me like that, little brother. You're not my father, to judge me. And even if you were, he drank away that right long ago."), { mood: 'angry' })
    g.rel('flint', -1)
  } else {
    await g.narrate(l('Arkot sa nepozeral. Počúval len mince, ako rastú a rednú, a pil víno, čo chutilo inak než doma.', 'Arkot did not look. He only listened to the coins growing and thinning, and drank wine that tasted different from wine at home.'))
    await g.say('flint', l('Vidíš, braček? Dnes mi to padá.', "See, little brother? Tonight it's falling my way."), { mood: 'happy' })
    g.rel('flint', 1)
  }
  await g.narrate(l('Arkot nechcel byť Flintovým otcom. Vedel len to, čo vedel o chlapcoch, ktorí sedávali priveľmi dlho pri stoloch s mincami, čo neboli ich, lebo to videl v Diss, keď boli obaja ešte deti a Flintov dom splácal cudzie prehry rybami, ktoré sám nechytil.', "Arkot did not want to be Flint's father. He knew only what he knew about boys who sat too long at tables of coins that were not theirs, because he had seen it in Diss, when they were both still children and Flint's house paid off other people's losses with fish it had not caught."))
  await g.narrate(l('V Diss pili rybári priamo z fliaš, sediac na mokrých skalách s nohami vo vode. Otec pil najviac. More si ho vzalo v búrke a nevrátilo ani telo. Ani kôš.', 'In Diss the fishermen drank straight from the bottle, sitting on wet rocks with their feet in the water. His father drank the most. The sea took him in a storm and gave back neither body nor basket.'))
  await g.narrate(l('Každému, kto sa pýtal, hovoril, že z Beladiss odišiel, lebo tam nemal prečo zostať. Znelo to ako gravitácia; keď zmizne všetko, čo ťa drží, nohy ťa odnesú tam, kde je teplejšie, vrecia ťažšie a nikto sa nepýta, odkiaľ si.', "To anyone who asked he said he had left Beladiss because there was nothing to stay for. It sounded like gravity: when everything that holds you is gone, your feet carry you where it is warmer, the sacks are heavier and nobody asks where you are from."))
  g.pose('player', 'stand')
  g.teleport('player', [5, 24], 90)
  await lines(g, [
    ['flint', l('Kam ideš?', 'Where are you going?')],
    ['player', l('Mám veci.', 'I have things to do.')],
  ])
  g.follow()
  await g.zoom(1, 600)
  g.set('c4.leftTavern')
  g.objective(l('Choď do záhrady za starým kanálom.', 'Go to the garden beyond the old canal.'))
  g.cinematic(false)
  g.checkpoint()
}
