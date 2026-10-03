/**
 * c1_cabin: the only warm place on the airship. Flint's dice, the ballast
 * boy's priestesses and the Eltária, the Diss woman's tale of the black
 * stone, and the eclipse: "The Mother has closed the Eye." The boy grabs
 * Flint by the collar, Flint's hand goes to the revolver under the hydrogen
 * envelope, and the old loader asks Arkot: "You. How much longer?" -> breath
 * (eclipse twist: forty, and the Eye opens on forty-one).
 */
import type { AmbienceDef, SceneDef } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'

const SAI = { x: 0.78, y: 0.78, r: 0.085 }

const cabinAmb: AmbienceDef = {
  sky: { top: '#04060e', bottom: '#161a2c', stars: 0.35, sai: SAI, clouds: 0.35 },
  fog: { color: '#0a0c16', near: 10, far: 34 },
  hemi: { sky: '#46567e', ground: '#181418', intensity: 0.72 },
  sun: { color: '#ffb070', intensity: 0.55, dir: [0.2, 0.6, -0.9] },
  exposure: 1.05,
  bloom: { strength: 0.95, radius: 0.6, threshold: 0.76 },
  grade: { tint: '#e8f0ff', saturation: 0.9, contrast: 1.06, vignette: 0.5 },
  particles: [{ kind: 'dust', count: 50, area: [1, 1, 10, 7], color: '#cfe8d4' }],
  music: null,
  sounds: ['wind', 'hum'],
}

const eclipseAmb: Partial<AmbienceDef> = {
  sky: { top: '#020308', bottom: '#0b0d18', stars: 1, sai: { ...SAI, eclipse: 1 }, clouds: 0.2 },
  hemi: { sky: '#2a3250', ground: '#0c0a10', intensity: 0.42 },
  sun: { color: '#ff7a3a', intensity: 0.08, dir: [0.2, 0.6, -0.9] },
  grade: { tint: '#dfe6ff', saturation: 0.78, contrast: 1.1, vignette: 0.62 },
}

const restoredAmb: Partial<AmbienceDef> = {
  sky: { top: '#04060e', bottom: '#161a2c', stars: 0.35, sai: { ...SAI, eclipse: 0 }, clouds: 0.35 },
  hemi: { sky: '#46567e', ground: '#181418', intensity: 0.72 },
  sun: { color: '#ffb070', intensity: 0.55, dir: [0.2, 0.6, -0.9] },
  grade: { tint: '#e8f0ff', saturation: 0.9, contrast: 1.06, vignette: 0.5 },
}

/** Arkot's seat, opposite the porthole */
const SEAT: [number, number] = [5, 7]

function seat(g: GameAPI): void {
  g.teleport('player', SEAT)
  g.face('player', [6, 1])
  g.pose('player', 'sit')
}

async function blackStone(g: GameAPI): Promise<void> {
  g.cinematic(true)
  seat(g)
  await g.focus([7, 4], { ms: 900, zoom: 1.35 })
  g.face('dama', 'flint')
  await g.narrate(l('Dama od váhy doteraz mlčala. V lone mala kus lana a rozpletala na ňom uzol, ktorý nepovoľoval. Ruky jej pracovali ďalej, nech sa hovorilo čokoľvek, a tak to v Diss robili všetky.', 'The scale-woman had kept silent until now. In her lap lay a length of rope and she was working at a knot that would not give. Her hands kept on, whatever was being said, the way all the women of Diss did it.'))
  await g.say('dama', l('Čo sa zamyká do zeme, nebýva biele.', 'What gets locked in the ground is seldom white.'), { mood: 'closed' })
  g.face('boy', 'dama')
  await g.say('dama', l('U nás sa hovorí: kto sa čierneho dotkne sám od seba, je buď kňažka, alebo prekliaty. A rozdiel býva len v tom, kto sa pýta.', 'Where I come from they say: whoever touches the black of their own accord is either a priestess or cursed. And the only difference is who’s asking.'))
  await g.say('boy', l('Naše kňažky sa čierneho nedotýkajú.', 'Our priestesses don’t touch the black.'), { mood: 'angry' })
  g.face('dama', 'boy')
  await g.say('dama', l('Nie. Vaše kňažky nie.', 'No. Yours don’t.'))
  await g.say('flint', l('Čoho čierneho, dama?', 'The black what, dama?'))
  g.emote('dama', '…')
  await g.narrate(l('Najprv si palcom nad hruďou obtiahla päť hrotov, rýchlo a bez pozerania, zo zvyku staršieho, než bola ona.', 'First she traced five points over her breast with her thumb, quickly, without looking, from a habit older than she was.'))
  await g.say('dama', l('Piesku. Na dne, za vlnolamom, je miestami čierny. Tam sa nekope.', 'Sand. On the seabed, past the breakwater, it is black in places. Nobody digs there.'))
  await g.say('flint', l('Prečo?', 'Why?'))
  await g.say('dama', l('Lebo je čierny.', 'Because it’s black.'))
  await g.say('dama', l('Bol jeden na dne. Tam, kde sú mušle najväčšie. Kopal, kde nemal. Našiel kameň. Čierny, hladký, veľký ako päsť. Pieklo, až sa piesok paril, a v dlani mu studil.', 'There was one on the bottom. Where the shells are biggest. He dug where he shouldn’t. He found a stone. Black, smooth, the size of a fist. The sun burned hard enough to steam the sand, and in his palm the stone was cold.'))
  await g.say('dama', l('Doniesol ho domov. Bolo leto. Dieťa spávalo zle, od horúčavy. Tak mu ho dal do postele.', 'He brought it home. It was summer. The child slept badly in the heat. So he put it in the child’s bed.'))
  await g.narrate(l('Nikto sa nehýbal. Aj kocky ležali tam, kam padli.', 'Nobody moved. Even the dice lay where they had fallen.'))
  await g.say('dama', l('Ráno bol kameň teplý.', 'In the morning the stone was warm.'))
  await g.narrate(l('Viac nič. Flint čakal s mincou zastavenou medzi prstami, a keď to nevydržal, spýtal sa sám.', 'Nothing more. Flint waited with a coin stopped between his fingers, and when he could not bear it, he asked.'))
  await g.say('flint', l('A dieťa?', 'And the child?'))
  await g.say('dama', l('Studené.', 'Cold.'))
  g.emote('boy', '💧')
  await g.narrate(l('Chalan si pritlačil päsť na hruď.', 'The boy pressed his fist to his chest.'))
  await g.say('flint', l('Zomrelo?', 'Did it die?'), { mood: 'surprised' })
  await g.narrate(l('Povedal to ľahko, ale príliš rýchlo.', 'He said it lightly, but too fast.'))
  await g.say('dama', l('Také nezomierajú. Menia podobu.', 'Those don’t die. They change shape.'))
  g.set('c1.story')
  await eclipse(g)
}

async function eclipse(g: GameAPI): Promise<void> {
  g.music('null_void', 2500)
  await g.focus([6, 1], { ms: 1400, zoom: 1.1 })
  await g.narrate(l('Svetlo v okienku sa zmenilo.', 'The light in the porthole changed.'))
  void g.eclipse(1, 9000)
  void g.atmosphere({ hemi: eclipseAmb.hemi, sun: eclipseAmb.sun, grade: eclipseAmb.grade }, 9000)
  await g.narrate(l('Celý večer v ňom visela Sai, jantárová, s tenkým prstencom, a teraz z jednej strany tmavla. Mrak to nebol. Tmavla zvnútra, jantár prechádzal do hrdzavej a potom do farby, akú má mäso tesne pod kožou.', 'All evening Sai had hung in it, amber, with a thin ring, and now one side of it was darkening. It was no cloud. It darkened from within, the amber turning to rust and then to the colour of flesh just under the skin.'))
  await g.narrate(l('Prstenec zhasínal po kúskoch, ako lampy na nábreží, keď ich niekto obchádza so zhášadlom.', 'The ring went out piece by piece, like the lamps along a quay when someone makes the rounds with a snuffer.'))
  await g.narrate(l('Kajuta stíchla.', 'The cabin fell silent.'))
  await g.focus([7, 4], { ms: 900, zoom: 1.35 })
  await g.say('dama', l('Matka zavrela Oko.', 'The Mother has closed the Eye.'), { mood: 'fear' })
  g.codex('cal.kur')
  g.codex('gloss.blin')
  g.pose('dama', 'pray')
  await g.narrate(l('A potom sa začala modliť. Celý večer strihala vety nakrátko, a teraz z nej plynuli celé súvetia, staré a pomalé, v ktorých sa nič neskracovalo. Takou rečou sa v Diss hovorí k Matke, nie k váhe. Počúvať to bolo horšie než jej príbeh.', 'And then she began to pray. All evening she had cut her sentences short, and now whole periods flowed out of her, old and slow, with nothing shortened. That is how one speaks to the Mother in Diss, not to the scales. Listening to it was worse than her story.'))
  g.bark('boy', l('Matka zatvára Oko. Matka zatvára Oko…', 'The Mother closes the Eye. The Mother closes the Eye…'), 4200)
  await g.narrate(l('Chalan šepkal po nyausky. Potom už len meno El, dookola.', 'The boy whispered in the Nyau tongue. Then only the name of El, over and over.'))
  await g.say('player', l('Od chvíle, keď sa tieň dotkol okraja Sai. Nádych za nádychom, ako na streche v Diss. Tieň má svoju rýchlosť, ako okraj mraku. Kým prejde cez celú Sai, zmeriam ju. A zvyšok sa dá zrátať.', 'Since the moment the shadow touched the rim of Sai. Breath after breath, like on the roof in Diss. The shadow has its speed, like the edge of a cloud. By the time it crosses the whole of Sai I’ll have measured it. And the rest can be counted.'), { thought: true })
  await g.atmosphere({ sky: eclipseAmb.sky }, 0)
  await g.narrate(l('Za okienkom vyšli hviezdy. Husté ako soľ vysypaná na čierne súkno, také, aké pri otvorenom Oku nevyjdú nikdy.', 'Beyond the porthole the stars came out. Thick as salt spilled on black cloth, stars that never show while the Eye is open.'))
  await g.narrate(l('Trvalo to dlho. Dama sa modlila, chalan šepkal, Flint pretáčal mincu medzi prstami a rátanie prešlo do stoviek.', 'It went on for a long time. The woman prayed, the boy whispered, Flint turned a coin between his fingers, and the count passed into the hundreds.'))
  await standoff(g)
}

async function standoff(g: GameAPI): Promise<void> {
  await g.say('flint', l('Tak čo. Šepká už tá tvoja stena?', 'So. Is that wall of yours whispering yet?'), { mood: 'happy' })
  g.face('boy', 'flint')
  await g.say('boy', l('Ty.', 'You.'), { mood: 'angry' })
  await g.say('boy', l('Povedal si to. Že ti jedna povie meno. Povedal si to a ona zavrela Oko. V Saimō, v jej vlastnom mesiaci. A kocky ti padajú, ako keby si mal s niekým dohodu.', 'You said it. That one of them would tell you her name. You said it and she closed the Eye. In Saimō, in her own month. And your dice fall as if you had a deal with someone.'), { mood: 'angry' })
  g.codex('cal.saimo')
  await g.say('flint', l('S kockami.', 'With the dice.'))
  await g.say('boy', l('Doma by ťa za to vyhnali zo schodov chrámu.', 'At home they’d throw you off the temple steps for that.'), { mood: 'angry' })
  g.face('boy', [1, 6])
  await g.say('boy', l('Tu schody nie sú.', 'There are no steps here.'))
  await g.say('flint', l('Tak to máš smolu.', 'Then you’re out of luck.'))
  g.face('boy', 'flint')
  await g.say('boy', l('Je tu zábradlie.', 'There’s a railing.'), { mood: 'angry' })
  // the grab
  g.pose('boy', 'stand')
  g.teleport('boy', [5, 5], 135)
  g.face('boy', 'flint')
  g.pose('flint', 'stand')
  g.face('flint', 'boy')
  g.pose('boy', 'hug')
  g.sfx('click')
  g.sfx('tick')
  g.shake(0.18, 300)
  await g.narrate(l('Chytil Flinta za golier a pritiahol si ho cez stôl. Kocky sa rozsypali po doske.', 'He grabbed Flint by the collar and dragged him across the table. The dice scattered over the board.'))
  g.pose('flint', 'fight')
  g.mood('flint', 'determined')
  await g.narrate(l('Flintova ruka siahla k pásu.', 'Flint’s hand went to his belt.'))
  g.sfx('heartbeat')
  await g.narrate(l('Arkot ten pohyb poznal z uličiek v Diss aj z krčiem a poznal aj jeho koniec. Tentoraz však nad nimi visel obal plný vodíka.', 'Arkot knew that movement from the alleys of Diss and from the taverns, and he knew how it ended. But this time an envelope full of hydrogen hung above them.'))
  await g.narrate(l('Nakladač sa nepohol. Kvety v sklenici svietili na Flintovu ruku na pažbe, na chalanovu päsť v golieri a na rozsypané kocky, v tme jasnejšie než celý večer.', 'The loader did not move. The flowers in the jar shone on Flint’s hand on the grip, on the boy’s fist in his collar and on the scattered dice, brighter in the dark than all evening.'))
  await g.narrate(l('Mal vstať. Mal otvoriť ústa. Sedel a rátal.', 'He should have stood up. He should have opened his mouth. He sat and counted.'))
  await g.say('dama', l('Flint.', 'Flint.'))
  g.pose('flint', 'stand')
  await g.narrate(l('Povedala to potichu. Flintova ruka zastala. Revolver ostal za pásom, vytiahnutý na šírku prsta, a Flint sám vyzeral prekvapený, že poslúchol.', 'She said it quietly. Flint’s hand stopped. The revolver stayed in his belt, drawn a finger’s width, and Flint himself looked surprised that he had obeyed.'))
  g.face('loader', 'player')
  await g.focus('loader', { ms: 700, zoom: 1.4 })
  await g.narrate(l('Nakladač sa pozrel cez tých dvoch na Arkota. Pery mal od rátania suché.', 'The loader looked past the two of them at Arkot. His lips were dry from counting.'))
  await g.say('loader', l('Ty. Koľko ešte?', 'You. How much longer?'))
  await g.focus('player', { ms: 600, zoom: 1.4 })
  await g.narrate(l('Arkot dorátal nádych.', 'Arkot finished counting the breath.'))
  await g.say('player', l('Štyridsať.', 'Forty.'), { mood: 'determined' })
  await g.focus([5, 4], { ms: 700, zoom: 1.35 })
  await g.say('loader', l('Štyridsať nádychov vydržíš. Potom sa uvidí.', 'You can hold on for forty breaths. Then we’ll see.'))
  await g.narrate(l('Chalan zaváhal. Golier nepustil. A Flint, s revolverom na šírku prsta od pása a s cudzou päsťou pod bradou, sa usmial.', 'The boy hesitated. He did not let go of the collar. And Flint, with the revolver a finger’s width from his belt and a stranger’s fist under his chin, smiled.'))
  g.mood('flint', 'happy')
  await g.say('flint', l('Stavím sa.', 'I’ll bet you.'), { mood: 'happy' })
  await g.say('boy', l('O čo?', 'On what?'))
  await g.say('flint', l('Všetko, čo som ti vyhral, proti tvojej pästi. Otvorí sa na jeho štyridsať, pustíš ma. Neotvorí, mince sú tvoje a cez zábradlie idem sám.', 'Everything I’ve won off you, against your fist. If it opens on his forty, you let me go. If it doesn’t, the coins are yours and I go over the rail myself.'), { mood: 'happy' })
  await g.narrate(l('Nikto nepovedal, že stávku prijíma. Nikto nepovedal ani opak. Arkot rátal, teraz už nahlas, lebo sa naňho dívali všetci a nemal kam uhnúť pohľadom.', 'Nobody said they took the bet. Nobody said otherwise. Arkot counted, aloud now, because everyone was looking at him and he had nowhere to turn his eyes.'))
  await g.say('player', l('Jeden.', 'One.'), { auto: 900 })
  await g.say('player', l('Dvanásť.', 'Twelve.'), { auto: 900 })
  await g.say('player', l('Dvadsaťštyri.', 'Twenty-four.'), { auto: 900 })
  await g.narrate(l('Pri tridsiatom sa chalanovi roztriasla päsť.', 'At thirty the boy’s fist began to shake.'))
  g.checkpoint()
  let ok = false
  while (!ok) {
    const r = await g.minigame('breath', {
      beats: 10,
      start: 31,
      bpm: 30,
      twist: 'eclipse',
      title: l('Štyridsať nádychov', 'Forty breaths'),
      subtitle: l('Rátal nahlas, lebo sa naňho dívali všetci a nemal kam uhnúť pohľadom.', 'He counted aloud, because everyone was looking at him and he had nowhere to turn his eyes.'),
    })
    ok = r.success
    if (!ok) await g.narrate(l('Rátanie sa mu rozsypalo ako kocky po doske. Začal znova od tridsiatky a nikto ho nezastavil.', 'The count scattered like the dice on the board. He began again from thirty, and nobody stopped him.'))
  }
  await afterward(g)
}

async function afterward(g: GameAPI): Promise<void> {
  await g.narrate(l('Pri tridsiatom ôsmom dama zmĺkla a zdvihla oči k okienku.', 'At thirty-eight the woman fell silent and raised her eyes to the porthole.'))
  await g.say('player', l('Štyridsať.', 'Forty.'))
  await g.narrate(l('Oko ostalo zavreté. Hviezdy za sklom žiarili ďalej, husté a cudzie, a päsť v golieri sa zovrela pevnejšie. Flint sa neprestal usmievať. Palec mu na pažbe prešiel na kohútik.', 'The Eye stayed closed. Beyond the glass the stars went on blazing, thick and strange, and the fist in the collar clenched tighter. Flint did not stop smiling. His thumb moved from the grip to the hammer.'))
  await g.narrate(l('Arkot sa nadýchol ešte raz.', 'Arkot drew one more breath.'))
  await g.focus([6, 1], { ms: 900, zoom: 1.1 })
  void g.eclipse(0, 5000)
  void g.atmosphere({ hemi: restoredAmb.hemi, sun: restoredAmb.sun, grade: restoredAmb.grade }, 5000)
  g.sfx('chime', 0.6)
  await g.narrate(l('Prstenec sa rozsvietil na okraji. Tenko, ako vlas svetla na hrane tmavého skla, a potom sa jas šíril dookola kúsok po kúsku, tak, ako sa na nábreží zapaľujú lampy, jedna za druhou, až sa kruh zavrel.', 'The ring lit at its edge. Thin, like a hair of light on the rim of dark glass, and then the brightness spread around it piece by piece, the way the lamps along a quay are lit one after another, until the circle closed.'))
  await g.atmosphere({ sky: restoredAmb.sky }, 0)
  await g.narrate(l('Do Sai sa zdola nahor vracal jantár. Hviezdy za okienkom bledli.', 'Amber returned to Sai from the bottom up. The stars beyond the porthole paled.'))
  g.music(null, 3000)
  await g.focus([5, 4], { ms: 800, zoom: 1.35 })
  g.pose('boy', 'stand')
  g.teleport('boy', [6, 4], 225)
  await g.narrate(l('Chalan pustil golier.', 'The boy let go of the collar.'))
  await g.narrate(l('Flint si ho upravil dvoma prstami. Nakladač natiahol dlaň a Flint mu do nej bez pozerania vyklopil náboje, jeden po druhom.', 'Flint straightened it with two fingers. The loader held out his palm, and without looking Flint tipped the cartridges into it, one by one.'))
  g.sfx('tick')
  await g.wait(250)
  g.sfx('tick')
  await g.wait(250)
  g.sfx('tick')
  await g.narrate(l('Potom zhrnul zo stola mince, všetky, aj tie z prvého večera, a vtisol ich chalanovi do dlane.', 'Then he swept the coins off the table, all of them, even those from the first evening, and pressed them into the boy’s palm.'))
  g.face('flint', 'boy')
  await g.say('flint', l('Na kňažky.', 'For the priestesses.'), { mood: 'happy' })
  g.emote('boy', '?')
  await g.narrate(l('Chalan zostal stáť s plnou dlaňou. Dama dorozpletala uzol. Lano v jej lone bolo zrazu rovné, zvinula ho, odložila a už sa nemodlila.', 'The boy stood there with his palm full. The woman finished untying the knot. The rope in her lap was suddenly straight; she coiled it, put it away, and prayed no more.'))
  g.pose('dama', 'sit')
  await g.say('loader', l('Spať.', 'Sleep.'))
  g.set('c1.eclipseDone')
  g.rel('flint', 1)
  await g.fade('black', 1400)
  g.cinematic(false)
  await g.goto('c1_deck', 'sacks')
}

export const cabin: SceneDef = {
  id: 'c1_cabin',
  name: l('Kajuta', 'The Cabin'),
  ambience: cabinAmb,
  camera: { zoom: 1.3 },
  map: {
    rows: ['WWWWWWWWWWWW', 'W..........s', 'W..........s', 'W..........s', 'W..........s', 'W..........s', 'W..........s', 'W..........s', 'Wsssssssssss'],
    legend: {
      W: { floor: 'wood', wall: 'plank', wallH: 1.65 },
      s: { floor: 'wood', wall: 'plank', wallH: 0.35 },
      '.': { floor: 'wood', tint: '#d8c4a8' },
    },
  },
  props: [
    { type: 'c1_porthole', at: [6, 1] },
    { type: 'c1_toolbox', at: [5, 4] },
    { type: 'c1_flower_jar', at: [5, 4], y: 0.55, offset: [0.2, -0.12] },
    { type: 'stool', at: [4, 4] },
    { type: 'stool', at: [6, 4] },
    { type: 'bench', at: [1, 5], rot: 90 },
    { type: 'bench', at: [1, 4], rot: 90 },
    { type: 'door', at: [1, 6], rot: 90, params: { style: 'wood' } },
    { type: 'bench', at: [10, 4], rot: 90 },
    { type: 'bench', at: [10, 3], rot: 90 },
    { type: 'bench', at: [4, 7] },
    { type: 'bench', at: [5, 7] },
    { type: 'bench', at: [2, 1] },
    { type: 'bench', at: [3, 1] },
    { type: 'bench', at: [9, 1] },
    { type: 'shelf', at: [1, 2], rot: 90 },
    { type: 'rope_coil', at: [9, 2] },
    { type: 'barrel', at: [10, 6] },
    { type: 'crate', at: [10, 1] },
    { type: 'sack', at: [8, 7], params: { count: 1 } },
  ],
  player: { character: 'arkot', at: [5, 6], facing: 135 },
  spawns: { door: [2, 6] },
  actors: [
    {
      id: 'loader',
      character: 'loader',
      at: [1, 5],
      facing: 45,
      pose: 'sit',
      talk: async (g) => {
        await g.narrate(l('Nakladač sedel tak, aby mal dvierka vždy za plecom. Na Arkota sa nepozrel.', 'The loader sat so that he always had the hatch at his shoulder. He did not look at Arkot.'))
        await g.say('loader', l('Hm.', 'Hm.'))
      },
    },
    {
      id: 'dama',
      character: 'dama',
      at: [10, 4],
      facing: 225,
      pose: 'sit',
      label: l('Vypočuť', 'Listen to'),
      talk: async (g) => {
        if (g.flag('c1.story')) return
        await blackStone(g)
      },
    },
    {
      id: 'flint',
      character: 'flint',
      at: [4, 4],
      facing: 45,
      pose: 'sit',
      talk: async (g) => {
        await g.say('flint', l('Neboj sa, braček. Do Nyau mu nechám aspoň na lístok domov.', 'Don’t worry, brother. By Nyau I’ll leave him enough for a ticket home.'), { mood: 'happy' })
        await g.narrate(l('Pred každým hodom si dýchol do dlane, hoci by prisahal, že na také veci neverí.', 'Before every throw he breathed into his palm, though he would have sworn he didn’t believe in such things.'))
      },
    },
    {
      id: 'boy',
      character: 'ballast_boy',
      at: [6, 4],
      facing: 225,
      pose: 'sit',
      talk: async (g) => {
        await g.say('boy', l('Uvidíš ich, Dissan. Na schodoch, keď spievajú. Celé mesto vtedy zadrží dych.', 'You’ll see them, Dissan. On the steps, when they sing. The whole city holds its breath.'), { mood: 'tender' })
      },
    },
  ],
  interactables: [
    {
      id: 'jar',
      at: [5, 4],
      label: l('Sklenica kvetov', 'The jar of flowers'),
      verb: 'look',
      radius: 1.6,
      run: async (g) => {
        await g.narrate(l('Rezané kvety z Nyau. V Diss také nerástli. Svietili tretí deň a bolo to na nich poznať: bledozelené svetlo sa z okrajov lupeňov sťahovalo k stonkám.', 'Cut flowers from Nyau. Such things did not grow in Diss. They had been glowing for three days and it showed: the pale green light was drawing back from the edges of the petals towards the stems.'))
        await g.say('player', l('Ako teplo z kameňa po západe.', 'Like warmth leaving a stone after sundown.'), { thought: true })
      },
    },
    {
      id: 'porthole',
      at: [6, 1],
      label: l('Okienko', 'The porthole'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Celý večer v okienku visela Sai, jantárová, s tenkým prstencom. Nad Diss vyzerala rovnako. Len more pod ňou bolo iné.', 'All evening Sai had hung in the porthole, amber, with a thin ring. Over Diss it looked the same. Only the sea beneath it was different.'))
        g.codex('world.sai')
      },
    },
    {
      id: 'dice',
      at: [5, 4],
      label: l('Kocky', 'The dice'),
      verb: 'look',
      radius: 1.6,
      when: (g) => !g.flag('c1.story'),
      run: async (g) => {
        await g.narrate(l('Kôpka mincí pred chalanovými kolenami sa zmenšovala. Flint vyhrával častejšie, než kocky dovoľujú, a Arkot si to zrátal skôr, než chcel.', 'The little pile of coins in front of the boy’s knees kept shrinking. Flint won more often than dice allow, and Arkot had worked it out sooner than he wanted to.'))
        await g.say('player', l('Štyri hody z piatich. Kocky to nedovoľujú. Flint áno.', 'Four throws out of five. Dice don’t allow that. Flint does.'), { thought: true })
      },
    },
    {
      id: 'hatch',
      at: [2, 6],
      label: l('Dvierka', 'The hatch'),
      verb: 'look',
      run: async (g) => {
        await g.narrate(l('Za dvierkami bola paluba a za ňou noc. A medzi nocou a palubou len zábradlie.', 'Beyond the hatch lay the deck, and beyond that the night. And between the night and the deck, only a railing.'))
      },
    },
  ],
  onEnter: async (g) => {
    if (g.flag('c1.story')) {
      // reloaded mid-scene: replay the standoff from the checkpoint
      g.cinematic(true)
      seat(g)
      await g.atmosphere(eclipseAmb, 0)
      await g.eclipse(1, 10)
      g.music('null_void', 1000)
      await g.focus([5, 4], { ms: 10, zoom: 1.35 })
      await g.narrate(l('Oko bolo stále zavreté. Rátanie prešlo do stoviek.', 'The Eye was still closed. The count had passed into the hundreds.'))
      await standoff(g)
      return
    }
    await g.once('c1.cabinIntro', async () => {
      g.cinematic(true)
      seat(g)
      await g.focus([5, 4], { ms: 10, zoom: 1.35 })
      await g.wait(500)
      await g.narrate(l('Bolo to jediné teplé miesto na celej vzducholodi, také nízke, že sa v ňom nedalo narovnať. Lavice pozdĺž stien a stôl, ktorý bol zároveň debnou na náradie.', 'It was the only warm place on the whole airship, so low you could not stand up straight. Benches along the walls, and a table that was also a toolbox.'))
      await g.narrate(l('Na ňom stála sklenica rezaných kvetov z Nyau. Pod obalom plným plynu sa oheň nezakladal, ani v lampe.', 'On it stood a jar of cut flowers from Nyau. Under an envelope full of gas no one lit a fire, not even in a lamp.'))
      await g.narrate(l('Chalan od balastu prehrával s Flintom v kockách tretí večer po sebe. Flint hádzal z dlane a pred každým hodom si do nej dýchol.', 'The ballast boy was losing to Flint at dice for the third evening running. Flint threw from his palm and breathed into it before every throw.'))
      g.sfx('click')
      await g.say('boy', l('V Diss také nemáte.', 'You don’t have them in Diss.'))
      await g.say('flint', l('Aké?', 'Have what?'))
      await g.narrate(l('Flint zhrnul mince do dlane a nechal ich prekĺznuť pomedzi prsty, jednu po druhej.', 'Flint swept the coins into his palm and let them slip between his fingers, one by one.'))
      await g.say('boy', l('Kňažky. Keď Chrám spieva na schodoch, stoja tam v rúchach, čo v tme svietia. Najkrajšie ženy na Ahile. A nikto sa ich nedotkne. Ani klanový syn.', 'Priestesses. When the Temple sings on the steps, they stand there in robes that glow in the dark. The most beautiful women on Ahil. And nobody touches them. Not even a clan son.'), { mood: 'tender' })
      await g.say('flint', l('Nikto.', 'Nobody.'))
      await g.say('boy', l('Nikto. A z nich si vždy vyberú tú najlepšiu. Za Eltáriu.', 'Nobody. And from them they always choose the best one. To be the Eltária.'), { mood: 'determined' })
      g.codex('gloss.eltaria')
      await g.narrate(l('To slovo bolo nové. V Diss stáli na terasách Belisárie s kopijami a ani na tie sa nesiahalo. Skoro.', 'The word was new. In Diss the Belisárie stood on the terraces with spears, and nobody laid a hand on them either. Almost.'))
      await g.say('boy', l('Tá vie všetky tajomstvá sveta. A všetky si berie do hrobu.', 'She knows all the secrets of the world. And takes every one of them to her grave.'))
      g.emote('flint', '!')
      await g.narrate(l('Flintovi sa rysie uši postavili, ako vždy, keď v miestnosti zavoňala stávka.', 'Flint’s lynx ears pricked up, the way they always did when a room began to smell of a bet.'))
      await g.say('flint', l('Stavím sa. Všetko, čo som ti za tri večery vzal. Než odtiaľ odídeme, jedna z nich mi povie svoje meno.', 'I’ll bet you. Everything I’ve taken off you in three evenings. Before we leave, one of them tells me her name.'), { mood: 'happy' })
      await g.say('boy', l('Pod chrámom je knižnica. Samé zakázané knihy. Vie sa o nej, ale dnu smie len Eltária. Ani kňažky nie.', 'Under the temple there’s a library. Nothing but forbidden books. Everyone knows about it, but only the Eltária may go in. Not even the priestesses.'))
      await g.say('boy', l('A dvere do nej nikto nevie nájsť. V chráme je jedna stena z čierneho skla. Hovorí sa, že pri zatmení šepká.', 'And nobody knows where the door is. In the temple there’s a wall of black glass. They say it whispers during an eclipse.'), { mood: 'fear' })
      await g.narrate(l('Flint sa zasmial. Nikto sa nepridal.', 'Flint laughed. Nobody joined in.'))
      g.pose('player', 'stand')
      g.cinematic(false)
      g.follow()
      await g.zoom(1.3, 500)
      g.objective(l('Počúvaj. Dama od váhy celý večer mlčí.', 'Listen. The scale-woman has said nothing all evening.'))
      g.checkpoint()
    })
  },
}
