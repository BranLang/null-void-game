/**
 * c17_beneath — Interlude "Pod hladinou" / "Beneath the Surface" (POV Tami).
 * Trapped in her own body, as in water without a surface. The night the body
 * rose: for half a heartbeat she turns her head towards Yera's blue light.
 * "Spi." Then the stairs, the warmth on her lips, "Move." "MOVE." The water closes.
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'

const BLUE = '#5aa8ff'

async function underwater(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.stealth(false)
  g.show('yera', false)
  await g.wait(800)
  await g.caption(l('Pod hladinou', 'Beneath the Surface'), { sub: l('Interlúdium', 'Interlude'), ms: 3000 })
  await g.narrate(l('Voda. Nie tá, čo tečie. Tá, čo drží. Teplá, hustá, bez hladiny, ktorou by sa dalo vyplávať. Tami v nej visela ako v spánku bez dna a svet k nej prichádzal už len ako vlnenie.', 'Water. Not the kind that flows. The kind that holds. Warm, thick, without a surface to swim up through. Tami hung in it as in a sleep without a bottom, and the world reached her only as ripples.'))
  await g.narrate(l('Hore bolo telo. Jej. Sedelo pri stene, dýchalo, pilo, keď mu dali piť. Vnímala ho tak, ako sa vníma vzducholoď z podpalubia. Náklon. Tlak. Vzdialené kroky po palube, čo nie sú tvoje.', 'Up there was the body. Hers. It sat by the wall, breathed, drank when it was given drink. She sensed it the way you sense an airship from below decks. A list. Pressure. Distant steps on a deck that are not your own.'))
  await g.narrate(l('Zvuky prichádzali cez steny z vody. Hlas, čo hovoril blízko, vždy rovnako, vždy dolu k nej. Slová sa cestou rozpúšťali, ale tón doplával celý. Yera. Niekto tam hore stál medzi ňou a tmou a nechcel odísť.', 'Sounds came through walls of water. A voice speaking close, always the same, always down towards her. The words dissolved on the way, but the tone swam down whole. Yera. Someone up there stood between her and the dark and would not leave.'))
  for (let i = 0; i < 4; i++) {
    g.sfx('tick', 0.2)
    await g.wait(480)
  }
  await g.narrate(l('A niekedy sa jej vlastné prsty pohli. Bubnovali po kolene, tak ako vždy, ale rytmus k nej doplával cudzí. Pomalší. Ťažší. Niekto skúšal jej tik ako požičaný nástroj.', 'And sometimes her own fingers moved. Drumming on her knee, as always, but the rhythm that reached her was foreign. Slower. Heavier. Someone was trying her tic like a borrowed instrument.'))
  g.particles({ kind: 'bubbles', area: [7, 7, 9, 9], count: 30, color: '#ffffff', id: 'scream' })
  await g.narrate(l('Vtedy kričala. Bez úst. Bublina bez zvuku, čo sa rozpadla skôr, než stihla stúpnuť.', 'Then she screamed. Without a mouth. A soundless bubble that burst before it could rise.'))
  g.stopParticles('scream')
  await g.narrate(l('Tá vec s ňou nehovorila. Nemusela. Bývala v nej, ako búrka býva v plášti vzducholode. Stará. Unavená. Trpezlivá.', 'The thing did not speak to her. It did not need to. It lived in her the way a storm lives in an airship’s envelope. Old. Tired. Patient.'))
  // the night the body rose
  g.sai('heavy')
  g.sfx('bass', 0.6)
  g.shake(0.2, 700)
  await g.atmosphere({ hemi: { sky: '#1a2a5a', ground: '#04060c', intensity: 0.5 }, fog: { color: '#020410', near: 4, far: 16 } }, 1200)
  await g.narrate(l('Potom prišla noc, keď telo vstalo. Svet sa prevrátil. Nie pádom. Váhou. Ťažká hodina, tá, čo kladie celé Kitsune na kolená. Telo ňou prešlo ako nôž vodou. Ľahké. Rovné. Nesprávne.', 'Then came the night the body rose. The world turned over. Not by falling. By weight. The heavy hour, the one that brings all of Kitsune to its knees. The body passed through it like a knife through water. Light. Straight. Wrong.'))
  g.propVisible('bluelight', true)
  g.propVisible('bluelight2', true)
  await g.focus([8, 3], { ms: 1600, zoom: 0.9 })
  await g.narrate(l('Ďaleko za chrbtom, modré svetlo. Maličké. Studené. Poznala ho skôr, než sa stihlo rozsvietiť celé.', 'Far behind her back, a blue light. Tiny. Cold. She knew it before it had fully lit.'))
  g.follow()
  g.cinematic(false)
  g.objective(l('Otoč sa k modrému svetlu. Aspoň na pol údera srdca.', 'Turn towards the blue light. For half a heartbeat, at least.'))
  g.hint(l('Telo nie je tvoje. Každý krok je boj.', 'The body is not yours. Every step is a fight.'))
  g.checkpoint()
}

async function halfHeartbeat(g: GameAPI): Promise<void> {
  g.set('c17.turned')
  g.hint(null)
  g.objective(null)
  g.cinematic(true)
  g.face('player', [8, 3])
  const r = await g.minigame('inputs', {
    need: 5,
    misses: 3,
    title: l('Pol údera srdca', 'Half a heartbeat'),
    subtitle: l('Hlava sa pohla. Zlomok, vlas, šírka pazúra, naspäť k tomu svetlu.', 'The head moved. A fraction, a hair, a claw’s breadth, back towards that light.'),
    voice: [l('Spi.', 'Sleep.')],
    color: BLUE,
  })
  if (r.success) {
    g.fx('glyph', 'player', { color: BLUE, scale: 1.4 })
    await g.narrate(l('Pol údera srdca patrilo jej. Hlava sa pohla, naspäť k Yere v tme. Jej hnutie. Jej krk. Jej.', 'Half a heartbeat was hers. The head moved, back towards Yera in the dark. Her movement. Her neck. Hers.'))
  } else {
    await g.narrate(l('Chcela otočiť hlavu. Chcela to tak silno, až sa voda okolo nej zachvela. Krk ju neposlúchol.', 'She wanted to turn her head. She wanted it so hard that the water around her trembled. Her neck did not obey.'))
  }
  g.sfx('bass', 0.4)
  await g.say('c17_tami_samael', l('Spi.', 'Sleep.'), { mood: 'blank' })
  await g.narrate(l('Jedno slovo. Nie zlostné. Ani láskavé. Slovo, akým sa zatvára kniha.', 'One word. Not angry. Not kind. The word with which one closes a book.'))
  g.propVisible('bluelight', false)
  g.propVisible('bluelight2', false)
  await g.fade('black', 900)
  await g.narrate(l('Voda sa nad ňou zavrela a dvere tiež.', 'The water closed over her, and so did the door.'))
  // the stairs
  g.teleport('player', [8, 10], 135)
  g.show('yera', true)
  g.pose('yera', 'kneel')
  await g.atmosphere({ hemi: { sky: '#3a4a6a', ground: '#06080e', intensity: 0.7 }, particles: [{ kind: 'rain', count: 500, id: 'rain' }] }, 0)
  await g.fade('clear', 1200)
  await g.narrate(l('Beh. Kamene cez cudzie podošvy. Dážď, z ktorého k nej dolu padala už len ozvena. Potom ticho. Státie.', 'Running. Stones through someone else’s soles. Rain, of which only an echo fell down to her. Then silence. Standing.'))
  await g.focus('yera', { ms: 1400, zoom: 1.2 })
  await g.narrate(l('Dolu pod schodmi, malá v daždi, kľačala Yera. Oči boli jej. Dážď bol skutočný. Yera bola skutočná, na kolenách, s rukou v blate. A nič z toho sa nedalo zastaviť.', 'Down below the stairs, small in the rain, Yera knelt. The eyes were hers. The rain was real. Yera was real, on her knees, a hand in the mud. And none of it could be stopped.'))
  await g.narrate(l('Teplo na perách. Dorazilo k nej zriedené, oneskorené, ako všetko. Spoznala ho aj tak.', 'Warmth on her lips. It reached her diluted, late, like everything. She knew it all the same.'))
  g.follow()
  await g.narrate(l('Telo sa otočilo. Krok. Druhý. Yera sa v daždi zmenšovala, kúsok po kúsku, tak ako sa zmenšuje zem, keď ťa vietor dvíha do výšky.', 'The body turned. A step. Another. Yera grew smaller in the rain, bit by bit, the way the ground shrinks when the wind lifts you high.'))
  await g.say('player', l('Hýb sa.', 'Move.'), { thought: true, mood: 'pain' })
  const r2 = await g.minigame('inputs', {
    need: 7,
    misses: 2,
    window: 800,
    title: l('Hýb sa', 'Move'),
    subtitle: l('Noha sa zdvihla. Nie jej povelom. Jeho krokom, pokojným, rovným a meraným.', 'A foot lifted. Not at her command. At his step, calm, straight and measured.'),
    voice: [l('Spi.', 'Sleep.'), l('Ticho.', 'Quiet.')],
    color: BLUE,
  })
  await g.say('player', l('HÝB SA.', 'MOVE.'), { thought: true, mood: 'angry' })
  if (r2.success) await g.narrate(l('Na okamih sa telo zakolísalo. Jeden krok bol kratší než ostatné. Potom už nie.', 'For an instant the body faltered. One step was shorter than the rest. Then no longer.'))
  await g.narrate(l('Telo kráčalo. Poslušné. Presné. Niekoho.', 'The body walked. Obedient. Precise. Someone’s.'))
  await g.fade('black', 1800)
  await g.caption(l('Voda sa zavrela.', 'The water closed.'), { ms: 3000 })
  g.set('ch17.done')
  await g.endChapter()
}

export const beneath: SceneDef = {
  id: 'c17_beneath',
  name: l('Pod hladinou', 'Beneath the Surface'),
  ambience: {
    sky: { top: '#01030a', bottom: '#06102a', stars: 0.2 },
    fog: { color: '#030818', near: 5, far: 20 },
    hemi: { sky: '#3a5aa0', ground: '#060a18', intensity: 0.8 },
    exposure: 1.05,
    bloom: { strength: 1.1, threshold: 0.7 },
    grade: { tint: '#c8d8ff', saturation: 0.7, contrast: 1.1, vignette: 0.75 },
    particles: [
      { kind: 'bubbles', count: 90, color: '#bfe0ff' },
      { kind: 'motes', count: 60, color: '#7fb0ff' },
    ],
    music: 'dungeon_water',
    sounds: ['water', 'drone'],
  },
  map: {
    rows: [
      '      wwwww      ',
      '    wwwwwwwww    ',
      '   wwww,,,wwww   ',
      '  www,,,L,,,www  ',
      ' www,,ddddd,,www ',
      ' ww,,ddddddd,,ww ',
      'www,ddddddddd,www',
      'ww,,ddddddddd,,ww',
      'ww,,ddddddddd,,ww',
      'ww,,ddddddddd,,ww',
      'www,ddddddddd,www',
      ' ww,,ddddddd,,ww ',
      ' www,,ddddd,,www ',
      '  www,,,,,,,www  ',
      '   wwww,,,wwww   ',
      '    wwwwwwwww    ',
      '      wwwww      ',
    ],
    legend: {
      d: { floor: 'dream', tint: '#5a6aa8' },
      ',': { floor: 'dream', tint: '#2a3a78' },
      w: { floor: 'deep' },
      L: { floor: 'dream', walk: false, tint: '#2a3a78', tag: 'light' },
    },
  },
  player: { character: 'tami', at: [8, 11], facing: 315, abilities: [] },
  props: [
    { type: 'mushroom', at: [8, 3], color: BLUE, scale: 1.4, id: 'bluelight', hidden: true },
    { type: 'spirit_flame', at: [8, 3], color: BLUE, id: 'bluelight2', hidden: true },
    { type: 'metaru_wall', at: [3, 7], rot: 90, params: { h: 2.5, glow: false }, color: '#2a3a5a' },
    { type: 'lantern', at: [12, 9], params: { style: 'ground' } },
  ],
  actors: [{ id: 'yera', character: 'c16_yera', at: [8, 5], facing: 315, hidden: true }],
  triggers: [{ id: 'turn', area: [5, 3, 11, 6], when: (g) => !g.flag('c17.turned') && !!g.flag('once.c17.beneath'), run: halfHeartbeat }],
  onEnter: async (g) => {
    g.sai('heavy')
    await g.once('c17.beneath', () => underwater(g))
  },
}
