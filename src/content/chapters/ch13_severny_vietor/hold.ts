/**
 * Kapitola 17 (opening): the heavy hour. The Itaka hangs eight inches above the amphitheatre
 * and will not rise. In the hold, Goji has jammed a sixth crystal into the boiler.
 */
import type { SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { hold as holdAmb } from './ambience'

export const holdScene: SceneDef = {
  id: 'c13_hold',
  name: l('Podpalubie Itaky', 'The Itaka’s Hold'),
  ambience: holdAmb,
  camera: { zoom: 1.25 },
  sai: { phase: 'heavy' },
  map: {
    rows: [
      '   ############   ',
      '  #............#  ',
      ' #..............# ',
      '#................r',
      '#................L',
      '#................r',
      ' #..............r ',
      '  r............r  ',
      '   rrrrrrrrrrrr   ',
    ],
    legend: {
      '#': { floor: 'metal', wall: 'iron', wallH: 2.6 },
      r: { floor: 'metal', wall: 'iron', wallH: 0.45 },
      '.': { floor: 'metal', tint: '#8a8494' },
      L: { floor: 'metal', tag: 'ladder' },
    },
  },
  props: [
    { type: 'boiler', at: [8, 1], id: 'boiler' },
    { type: 'crystal', at: [10, 1], scale: 0.8, id: 'sixth' },
    { type: 'pipe', at: [5, 1], params: { vertical: true } },
    { type: 'pipe', at: [12, 1], params: { vertical: true } },
    { type: 'pipe', at: [3, 2], params: { vertical: true }, rot: 90 },
    { type: 'gear', at: [14, 2], params: { standing: true, spin: true } },
    { type: 'rope_coil', at: [2, 5] },
    { type: 'lantern', at: [6, 3], params: { style: 'hanging' }, color: '#ffbf80' },
    { type: 'ladder', at: [16, 4], rot: -90 },
    { type: 'crate', at: [3, 6], rot: 15 },
  ],
  player: { character: 'arkot_glyph', at: [15, 4], facing: 270 },
  spawns: { ladder: [15, 4] },
  actors: [
    {
      id: 'goji',
      character: 'goji',
      at: [8, 3],
      facing: 180,
      talk: async (g) => {
        if (g.flag('c13.argued')) {
          g.face('goji', 'player')
          await g.say('goji', l('Tretí a piaty sa bijú. Šiesty dýcha pomalšie. Keď chvíľu počkáš, uvidíme.', 'The third and fifth are fighting. The sixth breathes slower. Wait a while and we’ll see.'))
          return
        }
        await argue(g)
      },
    },
    { id: 'flint', character: 'flint', at: [15, 3], facing: 270, hidden: true },
  ],
  interactables: [
    {
      id: 'boiler',
      at: [8, 2],
      label: l('Počúvať kotol', 'Listen to the boiler'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Spira-kotol. Masívny pancierový kus ocele vsadený do trupu. Päť hrubých valcov zasunutých do boku ako náboje v zásobníku revolveru. Zvyčajne bežal jeden. Dva pri búrke.', 'The Spira boiler. A massive armoured lump of steel set into the hull. Five thick cylinders slotted into its side like rounds in a revolver’s cylinder. Usually one ran. Two in a storm.'))
        if (g.flag('c13.counted')) {
          await g.say('player', l('Tri údery za dva. Rátal som to už dvakrát. Nezmení sa to.', 'Three beats for two. I’ve counted it twice already. It won’t change.'), { thought: true })
          return
        }
        await g.narrate(l('Arkot priložil dlaň na pancier a začal rátať.', 'Arkot laid his palm on the armour and began to count.'))
        const r = await g.minigame('breath', {
          beats: 6,
          start: 1,
          bpm: 46,
          title: l('Tri údery za dva', 'Three beats for two'),
          subtitle: l('Rytmus Itaky, ktorú poznal naspamäť, hovoril cudzím prízvukom.', 'The rhythm of the Itaka he knew by heart spoke with a foreign accent.'),
        })
        g.set('c13.counted')
        if (r.success) await g.say('player', l('Tri údery za to, čo mali byť dva. A šiesty zaostáva. O úder, možno o úder a pol.', 'Three beats for what should be two. And the sixth lags behind. By a beat, maybe a beat and a half.'), { thought: true })
        else await g.say('player', l('Rytmus sa mi rozpadol pod rukou. Toto nie je kotol, ktorý poznám.', 'The rhythm fell apart under my hand. This isn’t the boiler I know.'), { thought: true })
      },
    },
    {
      id: 'sixth',
      at: [10, 2],
      label: l('Šiesty kryštál', 'The sixth crystal'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Šiesty valec Goji pripojil sám. Improvizované puzdro vyvŕtané priamo do pancierového boku kotla. Švy narýchlo prinitované a cez nedokonalé spoje unikali ostré fialové záblesky a tenké pramienky pary.', 'Goji had fitted the sixth himself. An improvised housing drilled straight into the boiler’s armoured flank. Its seams riveted in a hurry, and through the imperfect joints leaked sharp violet flashes and thin threads of steam.'))
        await g.narrate(l('Šiesty prst na ruke, čo mala mať päť.', 'A sixth finger on a hand that should have had five.'))
        g.codex('world.itaka')
      },
    },
    {
      id: 'empty',
      at: [4, 4],
      label: l('Prázdne podpalubie', 'The empty hold'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('V podpalubí nezostalo nič. Vyhádzali sudy so zásobami, železné debny s náradím, aj ťažké laná. Z Itaky spravili dutú škrupinu, oholený skelet, ktorý nemal vážiť takmer nič.', 'Nothing was left in the hold. They had thrown out the barrels of stores, the iron toolboxes, even the heavy ropes. They had made the Itaka a hollow shell, a stripped skeleton that should have weighed almost nothing.'))
        await g.narrate(l('A predsa nestúpala, akoby jej trup zaliali olovom.', 'And still she would not rise, as if her hull had been filled with lead.'))
      },
    },
  ],
  onEnter: async (g) => {
    await g.once('c13.holdIntro', async () => {
      g.cinematic(true)
      await g.wait(600)
      await g.narrate(l('Šesť.', 'Six.'))
      g.shake(0.08, 1600)
      await g.narrate(l('Arkot to počul skôr, než to uvidel. Vibrácia v podlahe, hlboká, nesprávna. Pulz, čo sa šplhal cez päty, mravčal v kolenách a usádzal sa v krížoch ako cudzie závažie.', 'Arkot heard it before he saw it. A vibration in the floor, deep, wrong. A pulse that climbed through his heels, prickled in his knees and settled in the small of his back like a stranger’s weight.'))
      await g.narrate(l('Ťažká hodina. Gravitácia tlačila k zemi všetko: vzduch, končatiny aj myšlienky. Itaka visela osem palcov nad amfiteátrom a ani sa nepohla.', 'The heavy hour. Gravity pressed everything to the ground: the air, the limbs, the thoughts. The Itaka hung eight inches above the amphitheatre and would not move.'))
      g.codex('gloss.tazka_hodina')
      await g.focus('boiler', { ms: 1100, zoom: 1.45 })
      await g.narrate(l('Fialové svetlo, tmavé a pulzujúce. V kotli bolo zasunutých šesť kryštálov.', 'Violet light, dark and pulsing. Six crystals had been slotted into the boiler.'))
      g.follow()
      await g.zoom(1.25, 600)
      g.show('flint', true)
      g.teleport('flint', [15, 3], 270)
      void g.walk('flint', [12, 3])
      await g.wait(900)
      await g.say('flint', l('Šesť?!', 'Six?!'), { mood: 'angry' })
      await g.narrate(l('Tichšie, než asi chcel. Goji nezdvihol hlavu. Stále si škrabal strnisko, ako keby stál nad šachovnicou a nie nad kotlom.', 'Quieter than he probably meant. Goji did not raise his head. He was still scratching his stubble, as if he were standing over a chessboard and not over a boiler.'))
      g.cinematic(false)
      g.objective(l('Zíď ku kotlu za Gojim.', 'Go down to the boiler and Goji.'))
    })
    if (!g.flag('c13.argued')) {
      g.show('flint', true)
      g.teleport('flint', [12, 3], 270)
    }
  },
}

async function argue(g: GameAPI): Promise<void> {
  g.cinematic(true)
  g.objective(null)
  await g.walk('player', [10, 4])
  g.face('player', 'goji')
  void g.walk('flint', [9, 4])
  await g.say('flint', l('Goji.', 'Goji.'), { mood: 'angry' })
  await g.narrate(l('Stále nič. Líšiak bol v rovnici: v rytme fialového ticha, vo švíkoch puzdra.', 'Still nothing. The fox was inside an equation: in the rhythm of the violet silence, in the seams of the housing.'))
  await g.say('flint', l('Kto ti, kark, dovolil napchať tam šesť?', 'Who the kark told you to cram six in there?'), { mood: 'angry' })
  g.face('goji', 'flint')
  await g.say('goji', l('Nikto.', 'Nobody.'), { mood: 'blank' })
  await g.say('goji', l('Dva by nestačili. Tri ani štyri. V ťažkej hodine potrebujeme… viac, než máme.', 'Two wouldn’t do. Nor three, nor four. In the heavy hour we need… more than we have.'))
  await g.say('goji', l('So siedmym by bola rezerva. Siedmy zomrel pri požiari.', 'With a seventh we’d have a reserve. The seventh died in the fire.'), { mood: 'sad' })
  await g.say('flint', l('Nehraj sa na kapitána.', 'Don’t play captain.'), { mood: 'angry' })
  await g.narrate(l('Goji sa naňho pozeral, hlava mierne naklonená, akoby nerozumel, prečo ide o velenie, keď problém je fyzika.', 'Goji looked at him, head slightly tilted, as if he couldn’t understand why this was about command when the problem was physics.'))
  await g.say('goji', l('Tretí a piaty sa bijú. Šiesty dýcha pomalšie. O úder, možno úder a pol.', 'The third and fifth are fighting. The sixth breathes slower. By a beat, maybe a beat and a half.'))
  await g.say('goji', l('Zaujímavé.', 'Interesting.'), { mood: 'blank' })
  if (g.flag('c13.counted')) await g.say('player', l('Rátal som to. Tri údery za dva.', 'I counted it. Three beats for two.'), { thought: true })
  await g.say('flint', l('Zaujímavé? Sedíme na odistenej bombe a ty povieš zaujímavé?', 'Interesting? We’re sitting on a bomb with the pin pulled and you say interesting?'), { mood: 'angry' })
  await g.say('goji', l('To nie je bomba. Je to… reaktor.', 'It isn’t a bomb. It’s a… reactor.'))
  g.sfx('click', 0.6)
  await g.say('goji', l('Kotol je na varenie polievky. Toto varí niečo iné.', 'A boiler is for cooking soup. This cooks something else.'))
  await g.say('goji', l('Ale v podstate máš pravdu.', 'But basically you’re right.'))
  g.shake(0.15, 900)
  g.sfx('bass', 0.4)
  await g.narrate(l('Fialový pulz. Dva. Tri. Kotol zavrčal nízkym, dutým zvukom, čo rezonoval v zuboch.', 'A violet pulse. Two. Three. The boiler growled, a low hollow sound that rang in the teeth.'))
  await g.say('flint', l('A nebuchne to?', 'And it won’t blow?'))
  await g.say('goji', l('Keď chvíľu počkáš, uvidíme.', 'Wait a while and we’ll see.'), { mood: 'happy' })
  g.set('c13.argued')
  const c = await g.choose([
    { id: 'math', text: l('(Nechať čísla dobehnúť.)', '(Let the numbers run.)') },
    { id: 'side', text: l('„Šesť je jediná matematika, čo nás dostane na sever a späť.“', '“Six is the only maths that gets us north and back.”') },
  ])
  if (c === 'side') {
    await g.say('player', l('Šesť je jediná matematika, čo nás dostane na sever a späť.', 'Six is the only maths that gets us north and back.'))
    g.face('flint', 'player')
    await g.say('flint', l('Na sever. Hej. Kým ony sedia v tme.', 'North. Sure. While they sit in the dark.'), { mood: 'sad' })
    g.rel('goji', 1)
  } else {
    await g.narrate(l('Arkot sa oprel o rám dverí a nechal čísla dobehnúť. Riziko mu vychádzalo zle na oboch stranách rovnice. Nepovedal nič.', 'Arkot leaned against the door frame and let the numbers run. The risk came out badly on both sides of the equation. He said nothing.'))
  }
  await g.narrate(l('Bez šialenej sily šiestich kryštálov Itaka v ťažkej hodine nevzlietne. A dolu v Kitsune, za oceľovými dverami, dýchali dve dievčatá vzduch, ktorý sa míňal.', 'Without the mad strength of six crystals the Itaka would not fly in the heavy hour. And down in Kitsune, behind steel doors, two girls were breathing air that was running out.'))
  await g.fade('black', 900)
  g.cinematic(false)
  await g.goto('c13_saburo')
}
