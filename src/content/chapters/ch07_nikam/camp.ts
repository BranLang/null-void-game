/**
 * c7_camp — Arkot, the thirty-first night in the pirate camp. Escorted back
 * from the clearing with Flint counting the steps; the kicked water jug; the
 * card game; Flint's "thirty"; the guard change; the prayer by the star
 * Mother's Hair; and on the twelfth night of praying, the fire.
 */
import type { AmbienceDef, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { CAMP_MAP } from './maps'
import { campProps } from './campProps'
import { besideCell, exactPos, place } from './util'

export const DUSK: AmbienceDef = {
  sky: { top: '#141026', bottom: '#7a4636', stars: 0.25, sai: { x: 0.82, y: 0.84, r: 0.06 } },
  fog: { color: '#2a1e28', near: 8, far: 34 },
  hemi: { sky: '#8a78a0', ground: '#2a2018', intensity: 0.9 },
  sun: { color: '#ff9866', intensity: 1.05, dir: [-0.85, 0.45, 0.25] },
  exposure: 1.02,
  bloom: { strength: 0.85, radius: 0.55, threshold: 0.8 },
  grade: { tint: '#ffe4d4', saturation: 0.88, contrast: 1.06, vignette: 0.46 },
  particles: [
    { kind: 'embers', count: 30, area: [15, 15, 19, 19], color: '#ff9a4a' },
    { kind: 'motes', count: 40, color: '#ffd8b0' },
  ],
  music: null,
  sounds: ['forest', 'fire', 'wind'],
}

export const CAMP_NIGHT: AmbienceDef = {
  sky: { top: '#03040a', bottom: '#131b2e', stars: 1, sai: { x: 0.86, y: 0.84, r: 0.055 }, infera: { x: 0.16, y: 0.9 } },
  fog: { color: '#070b14', near: 7, far: 30 },
  hemi: { sky: '#46568a', ground: '#0e0c12', intensity: 0.85 },
  sun: { color: '#9ab0ff', intensity: 1.05, dir: [-0.45, 1, 0.55] },
  exposure: 1.04,
  bloom: { strength: 0.95, radius: 0.55, threshold: 0.78 },
  grade: { tint: '#d8e0ff', saturation: 0.8, contrast: 1.08, vignette: 0.52 },
  particles: [{ kind: 'motes', count: 50, color: '#bcd0ff' }],
  music: null,
  sounds: ['night', 'fire', 'forest'],
}

const SHELTER: Vec2 = [12, 20]
const PIRATES = ['scar', 'kicker', 'p1', 'p2', 'p3', 'c1', 'c2', 'w1', 'f1', 'f2', 'overseer']

let tick = 0
let counted = 0
let offTimer = 0
let warned = false
let dragging = false

async function korteg(g: GameAPI): Promise<void> {
  await g.narrate(l('Z Kortegovej lode zostali dosky, rebrá a kormidlo s pruhom gildy. Trup rozobrali na diely v prvom týždni.', 'Of Korteg’s ship there were planks left, ribs, and a rudder with the guild stripe. They took the hull apart in the first week.'))
  await g.narrate(l('Búrka ich hodila na sever. Matkin Vlas zmizol za mrakmi a s ním aj kurz. Bez hviezdy bol Arkot slepý.', 'The storm threw them north. Mother’s Hair vanished behind the clouds and the course went with it. Without the star Arkot was blind.'))
  await g.narrate(l('Keď sa mraky roztrhli, boli nízko, príliš nízko nad lesom. Tri pirátske stíhačky sa vynorili z doliny ako hladné vtáky. Vôl proti vlkom.', 'When the clouds tore open they were low, far too low above the forest. Three pirate fighters rose out of the valley like hungry birds. An ox against wolves.'))
  await g.narrate(l('Žiadne guľky s prachovou náložou: to bol zákon neba. Pri vodíkových vakoch sa bojovalo len oceľou, lanami a tupou silou.', 'No bullets with powder charges: that was the law of the sky. Beside hydrogen bags men fought only with steel, ropes and blunt force.'))
  await g.narrate(l('Korteg stál na palube s ťažkou sekerou ako starý, tvrdohlavý kapitán. Prvá šabľa mu rozsekla plece, druhá hruď. Stále stál. Až hák na lane sa mu zahryzol do kabáta a stiahol ho cez zábradlie do tmy pod trupom.', 'Korteg stood on deck with a heavy axe like a stubborn old captain. The first sabre split his shoulder, the second his chest. Still he stood. Only a hook on a rope bit into his coat and dragged him over the rail into the dark beneath the hull.'))
  await g.say('player', l('Stál som za kormidlom. Ruky na kormidle, nohy na palube. A nepohlo sa vo mne nič.', 'I was at the helm. Hands on the wheel, feet on the deck. And nothing in me moved.'), { thought: true, mood: 'closed' })
  await g.narrate(l('Flint strieľal. Samozrejme, že strieľal. Kortegovou zamknutou puškou, s nepríčetným úsmevom, rovno medzi vodíkové gondoly.', 'Flint fired. Of course he fired. With Korteg’s locked rifle, with a crazed smile, straight between the hydrogen gondolas.'))
  await g.narrate(l('Piráti ho zrazili s takou panikou, že ho takmer ubili na smrť. Ale aj s tvárou na doskách a krvou v ústach mu ten úsmev nezmizol.', 'The pirates brought him down in such a panic that they nearly beat him to death. But even with his face on the planks and blood in his mouth, the smile never left him.'))
  g.set('c7.sawKorteg')
}

async function evening(g: GameAPI): Promise<void> {
  g.set('c7.stage', 'evening')
  g.cinematic(true)
  g.objective(null)
  g.hint(null)
  g.face('flint', 'player')
  await g.say('flint', l('…tridsať.', '…thirty.'), { mood: 'determined' })
  await g.fade('black', 900)
  // tied to the shelter for the night
  place(g, 'player', [11, 20], [11, 23], 'lie')
  place(g, 'flint', [12, 20], [12, 23], 'lie')
  g.teleport('overseer', [21, 13])
  g.face('overseer', [19, 14])
  g.teleport('scar', [14, 17])
  g.face('scar', [11, 20])
  void g.atmosphere(CAMP_NIGHT, 0)
  await g.wait(400)
  await g.fade('clear', 1400)
  await g.focus([12, 20], { ms: 900, zoom: 1.25 })
  await g.narrate(l('Pracovali cez deň; vyvádzali ich z tábora po dvoch a pod dohľadom ozbrojencov. Ťahali drevo, nosili bedne, opravovali prístrešky. Jedli raz denne.', 'They worked by day; they were led out of the camp in pairs under armed watch. They hauled wood, carried crates, mended shelters. They ate once a day.'))
  await g.narrate(l('V ten večer nejedli nič.', 'That evening they ate nothing.'))
  // the kicked jug
  await g.walk('kicker', [12, 22])
  g.face('kicker', [11, 21])
  await g.wait(300)
  g.sfx('water')
  g.propVisible('jugFull', false)
  g.propVisible('jugSpilled', true)
  g.shake(0.08, 200)
  g.bark('kicker', l('Ha! Pite z blata, bilgashi.', 'Ha! Drink the mud, bilgash.'))
  await g.wait(1300)
  void g.walk('kicker', [19, 20])
  await g.narrate(l('Pirát v ťažkých topánkach, s dychom páchnucim po lacnom alkohole, z nudy kopol do džbánu, čo stál pred Arkotom. Voda sa s tichým šplechnutím rozliala do blata.', 'A pirate in heavy boots, his breath reeking of cheap spirits, kicked the jug standing in front of Arkot out of boredom. The water spilled into the mud with a soft splash.'))
  await g.say('player', l('Uhol kopnutia. Kaluž. Voda preč. Vypočítané. Evidované. Prijaté.', 'The angle of the kick. The puddle. Water gone. Calculated. Recorded. Accepted.'), { thought: true, mood: 'blank' })
  g.emote('flint', '💢')
  g.mood('flint', 'angry')
  await g.narrate(l('Zato Flint vedľa neho zavrčal ako pes na reťazi. Svaly pod špinavou košeľou sa mu napli a oči padli rovno na pirátov nôž za pásom: vzdialenosť, rýchlosť, uhol.', 'Flint beside him growled like a dog on a chain. The muscles under his filthy shirt went taut and his eyes dropped straight to the knife in the pirate’s belt: distance, speed, angle.'))
  await g.focus([10, 21], { ms: 700 })
  await g.narrate(l('Obďaleč sedela Dara, líška s jedným uchom. Rukou s dvoma krivo zrastenými prstami si tlačila k hrudi chvejúceho sa kuchynského chlapca a tvárila sa, že odseknuté ucho ju nebolí.', 'A little apart sat Dara, the fox with one ear. With a hand whose two broken fingers had set crooked she held the shivering kitchen boy to her chest and pretended the stump of her ear did not hurt.'))
  await g.narrate(l('Starý mechanik si dusil kašeľ do handry, až mu modreli pery. Úlomky rodiny.', 'The old mechanic smothered his cough in a rag until his lips turned blue. Fragments of a family.'))
  // the card game
  await g.focus([17, 18], { ms: 900 })
  g.bark('p2', l('Kosť na stôl, Varg!', 'Bone on the table, Varg!'))
  await g.narrate(l('Pri najbližšom ohnisku piráti rozdávali karty. Umastený balíček, kosti namiesto mincí a smiech hlasnejší, než sa patrilo na mužov, čo dnes niekoho hodili cez palubu.', 'At the nearest fire the pirates were dealing cards. A greasy deck, bones instead of coins, and laughter louder than befitted men who had thrown someone overboard that day.'))
  await g.focus([12, 20], { ms: 900 })
  await g.narrate(l('Flintove oči, čo celý deň merali vzdialenosti k zbraniam, sa na tej hre pristavili. Iný hlad. Arkot ho poznal z Diss.', 'Flint’s eyes, which had spent the day measuring distances to weapons, lingered on the game. A different hunger. Arkot knew it from Diss.'))
  if (g.flag('ch01.pressedFlint')) {
    await g.say('player', l('Raz som sa ho spýtal. V aerodoku v Nyau, na mokrý rukáv. „Pršalo,“ povedal. Nepršalo.', 'I asked him once. At the aerodock in Nyau, about the wet sleeve. “It rained,” he said. It hadn’t.'), { thought: true })
  } else {
    await g.say('player', l('Na mokrý rukáv som sa ho nikdy nespýtal. Odložil som to na neskôr. Neskôr bola klietka.', 'I never asked him about the wet sleeve. I put it off for later. Later was a cage.'), { thought: true })
  }
  await g.narrate(l('Nepovedal nič. V klietke sa dlhy nesplácajú a slová nič nevážia.', 'He said nothing. Debts are not paid in a cage, and words weigh nothing there.'))
  // Flint's plan
  g.face('flint', 'player')
  await g.say('flint', l('Tridsať.', 'Thirty.'), { mood: 'determined' })
  const c1 = await g.choose([
    { id: 'what', text: l('„Čo tridsať?“', '“Thirty what?”') },
    { id: 'quiet', text: l('(Mlčať. Nech to povie sám.)', '(Stay quiet. Let him say it.)') },
  ])
  if (c1 === 'quiet') {
    await g.say('flint', l('Počúvaš ma, braček? Tridsať.', 'Are you listening, little brother? Thirty.'))
    g.rel('flint', -1)
  }
  await g.say('player', l('Čo tridsať?', 'Thirty what?'))
  await g.say('flint', l('Krokov. Od nášho prístrešku k mýtine. Tridsať.', 'Steps. From our shelter to the clearing. Thirty.'))
  await g.say('flint', l('Stráž sa mení o polnoci. Ten veľký s jazvou odchádza, malý prichádza. Malý fajčí. Každú noc. Fajčí a pozerá na západ a nepozerá na nás.', 'The watch changes at midnight. The big one with the scar leaves, the small one comes. The small one smokes. Every night. He smokes and looks west and doesn’t look at us.'))
  await g.say('flint', l('Celá cigareta. Kým dofajčí. Celá cigareta, kým nepozerá.', 'A whole cigarette. Until he finishes it. A whole cigarette while he isn’t looking.'), { mood: 'happy' })
  const c2 = await g.choose([
    { id: 'then', text: l('„Čo potom?“', '“Then what?”') },
    { id: 'noplan', text: l('„Ty nemáš plán, Flint.“', '“You don’t have a plan, Flint.”') },
  ])
  if (c2 === 'then') {
    await g.say('player', l('Čo potom?', 'Then what?'))
    g.face('flint', [28, 15])
    await g.narrate(l('Flint sa pozrel na mýtinu. Na vzducholode. Na vodíkové vaky, čo sa leskli v tme.', 'Flint looked at the clearing. At the airships. At the hydrogen bags glinting in the dark.'))
    await g.say('player', l('Potom?', 'Then?'))
    await g.say('flint', l('Pracujem na tom.', 'I’m working on it.'))
  } else {
    await g.say('player', l('Ty nemáš plán, Flint.', 'You don’t have a plan, Flint.'))
    await g.say('flint', l('Pracujem na tom.', 'I’m working on it.'), { mood: 'angry' })
    g.rel('flint', 1)
  }
  await g.narrate(l('Pracoval na tom. Každú noc a každý deň. Žiaden plán neexistoval: len krátka chvíľa, tridsať krokov a viera, že to bude stačiť. Flint bol muž, čo koná, aj keď nemá kam.', 'He was working on it. Every night and every day. There was no plan: only a short moment, thirty steps and the faith that it would be enough. Flint was a man who acts even when he has nowhere to go.'))
  await g.say('player', l('A ty si muž, čo nasleduje. Aj keď nemáš koho.', 'And you are a man who follows. Even when there is no one to follow.'), { thought: true, mood: 'sad' })
  g.set('c7.stage', 'night')
  await night(g)
}

async function night(g: GameAPI): Promise<void> {
  g.cinematic(true)
  await g.fade('black', 1000)
  for (const id of ['p1', 'p2', 'p3', 'c1']) g.pose(id, 'lie')
  g.teleport('kicker', [21, 20])
  g.pose('kicker', 'lie')
  g.pose('flint', 'lie')
  g.pose('player', 'lie')
  void g.atmosphere({ sounds: ['night'] }, 0)
  await g.fade('clear', 1200)
  await g.narrate(l('Noci boli najhoršie. Pre ticho, nie pre zimu či vlhkosť.', 'The nights were the worst. Because of the silence, not the cold or the damp.'))
  await g.narrate(l('V tichu ožívalo všetko, čo cez deň zanikalo: Flintov dych, mechanikov kašeľ, cvrčky v korunách. A pod tým všetkým prázdnota, čo mala tvar a váhu a meno.', 'In the silence everything the day drowned came alive: Flint’s breath, the mechanic’s cough, the crickets in the treetops. And beneath it all an emptiness that had a shape and a weight and a name.'))
  // the guard change at midnight
  await g.focus([14, 17], { ms: 900, zoom: 1.2 })
  await g.walk('scar', [22, 16])
  g.show('scar', false)
  g.show('smoker', true)
  g.teleport('smoker', [22, 16])
  await g.walk('smoker', [15, 17])
  g.face('smoker', [6, 17])
  g.sfx('fire', 0.3)
  g.emote('smoker', '…')
  await g.narrate(l('O polnoci sa stráž vymenila. Veľký s jazvou odišiel, malý prišiel. Malý si zapálil. A pozeral na západ.', 'At midnight the watch changed. The big one with the scar left, the small one came. The small one lit up. And looked west.'))
  await g.focus([11, 20], { ms: 900 })
  await g.say('player', l('Nikam. To som jej povedal na lavičke. Kam to vedie? Nikam.', 'Nowhere. That’s what I told her on the bench. Where does it lead? Nowhere.'), { thought: true, mood: 'sad' })
  await g.narrate(l('Navigátor, čo si číta mapu a vidí útes. Mezra z Diss a Pursang z chrámu na kopci. Mal pravdu. Nemýlil sa.', 'A navigator reading his chart and seeing a cliff. A Mezra from Diss and a Pursang from the temple on the hill. He had been right. He had not been wrong.'))
  await g.narrate(l('A teraz ležal na mokrej zemi s lanom na zápästiach uprostred ničoho. Tam slovo *nikam* prestalo byť pravdou a stalo sa kliatbou. Povedal ho a svet ho poslúchol.', 'And now he lay on the wet ground with a rope on his wrists in the middle of nothing. There the word *nowhere* stopped being the truth and became a curse. He had said it, and the world had obeyed.'))
  // the star
  await g.focus([16, 4], { ms: 1500, zoom: 0.85 })
  await g.narrate(l('Cez koruny stromov presvitala jedna hviezda. Matkin Vlas. Prvá hviezda jari na severnom nebi: fixná, spoľahlivá a presná.', 'Through the treetops one star shone. Mother’s Hair. The first star of spring in the northern sky: fixed, reliable and precise.'))
  g.codex('world.matkin_vlas')
  await g.narrate(l('Z jej uhla určil polohu: štyri dni cesty severne od Diss. Z jej jasu vlhký vzduch. Nič z toho mu však neprezradilo, ako sa odtiaľto dostať.', 'From its angle he fixed their position: four days’ journey north of Diss. From its brightness, damp air. None of it told him how to get away from here.'))
  await g.narrate(l('Na dvadsiatu noc sa začal modliť.', 'On the twentieth night he began to pray.'))
  await g.narrate(l('V Diss sa nemodlili. Verili v seba a v more a v to, že ráno príde, lebo včera tiež prišlo. Ale v noci na mokrej zemi, s hviezdou nad hlavou a ničím v rukách, sa Arkot modlil.', 'In Diss nobody prayed. They believed in themselves and in the sea and in the morning coming because yesterday it had come too. But at night on the wet ground, with a star overhead and nothing in his hands, Arkot prayed.'))
  await g.narrate(l('Nie ako kňaz. Ako navigátor, ktorý stratil kompas a začne veriť, že hviezdy existujú aj za mrakmi.', 'Not like a priest. Like a navigator who has lost his compass and begins to believe that the stars exist behind the clouds as well.'))
  await g.zoom(1.15, 900)
  g.mood('player', 'closed')
  await g.say('player', l('Matka. El. Hocikto.', 'Mother. El. Anyone.'), { thought: true })
  await g.say('player', l('Pošli niekoho.', 'Send someone.'), { thought: true })
  let ok = false
  while (!ok) {
    const r = await g.minigame('breath', {
      beats: 11,
      start: 1,
      bpm: 18,
      title: l('Matka. El. Hocikto.', 'Mother. El. Anyone.'),
      subtitle: l('Nevedel prosiť za seba; nikdy sa to nenaučil. Ale za Flinta, za Daru a za kuchynského chlapca to dokázal. Jedno slovo na každý nádych, jedna noc za druhou.', 'He could not pray for himself; he had never learned how. But for Flint, for Dara and for the kitchen boy he could. One word for every breath, one night after another.'),
    })
    ok = r.success
    if (!ok) await g.narrate(l('Mechanik sa rozkašľal a slová sa rozsypali. Začal odznova.', 'The mechanic broke into coughing and the words scattered. He began again.'))
  }
  await g.caption(l('Jedenásť nocí. Rovnaké slová, rovnaká hviezda, rovnaká mokrá zem.', 'Eleven nights. The same words, the same star, the same wet ground.'), { ms: 3400 })
  await g.caption(l('Na dvanástu noc niekto prišiel.', 'On the twelfth night someone came.'), { ms: 3000 })
  await fire(g)
}

async function fire(g: GameAPI): Promise<void> {
  g.set('c7.stage', 'fire')
  await g.focus([27, 14], { ms: 1300, zoom: 0.9 })
  await g.narrate(l('Začalo to na východnom okraji tábora. Bliknutie medzi stromami: príliš oranžové na studené svetlo lesa a príliš ostré na mesiac.', 'It began on the eastern edge of the camp. A flicker between the trees: too orange for the cold light of the forest and too sharp for the moon.'))
  g.fx('fire', [28, 12], { scale: 2 })
  await g.wait(700)
  g.flash('#fff0d0', 800)
  g.sfx('boom')
  g.shake(0.8, 1300)
  g.propVisible('fighterA', false)
  g.propVisible('wreckA', true)
  g.fx('fire', [28, 11], { scale: 5 })
  g.fx('shockwave', [28, 11], { color: '#ffb070', scale: 8 })
  await g.wait(900)
  g.flash('#ffe0b0', 600)
  g.sfx('boom', 0.85)
  g.shake(0.6, 1000)
  g.propVisible('fighterB', false)
  g.propVisible('wreckB', true)
  g.fx('fire', [28, 18], { scale: 5 })
  g.fx('shockwave', [28, 18], { color: '#ffb070', scale: 7 })
  g.particles({ kind: 'embers', area: [25, 8, 32, 21], count: 170, color: '#ff9a4a', id: 'c7fire' })
  g.particles({ kind: 'ash', area: [24, 8, 33, 22], count: 110, color: '#3a302c', id: 'c7smoke' })
  void g.atmosphere({ hemi: { sky: '#7a5a6a', ground: '#2a160e', intensity: 1.0 }, grade: { tint: '#ffe0c8', saturation: 0.9, contrast: 1.1, vignette: 0.5 }, sounds: ['fire', 'night'] }, 1600)
  await g.narrate(l('Explózia bola tlmená lesom, ale stále dosť silná, aby zemou prehrmela tlaková vlna. Druhá stíhačka chytila: vodík k vodíku a oheň k ohňu.', 'The explosion was muffled by the forest, but still strong enough to send a shock rolling through the ground. The second fighter caught: hydrogen to hydrogen and fire to fire.'))
  g.music('combat_action_1', 1200)
  await g.narrate(l('Celý tábor sa pohol.', 'The whole camp moved.'))
  const shouts = [
    l('Oheň! Vaky horia!', 'Fire! The bags are burning!'),
    l('Vodu, sakra! Piesok!', 'Water, damn it! Sand!'),
    l('Preč od vodíka!', 'Away from the hydrogen!'),
    l('Kto to bol?!', 'Who did it?!'),
  ]
  const runners = ['p1', 'p2', 'p3', 'c1', 'c2', 'kicker', 'smoker', 'w1', 'overseer']
  runners.forEach((id, i) => {
    g.pose(id, 'stand')
    void g.walk(id, [25 + (i % 3), 12 + i], { run: true, speed: 4.2 })
    if (i < shouts.length) g.bark(id, shouts[i])
  })
  await g.wait(1500)
  await g.focus([12, 20], { ms: 800, zoom: 1.3 })
  g.pose('flint', 'crouch')
  g.face('flint', 'player')
  await g.say('flint', l('Teraz. Teraz, Arkot, teraz…', 'Now. Now, Arkot, now…'), { mood: 'determined' })
  await g.narrate(l('„Ticho.“', '“Quiet.”'))
  g.mood('player', 'surprised')
  await g.narrate(l('Hlas, čo nepatril nikomu z tábora. Hlas odnikiaľ.', 'A voice that belonged to no one in the camp. A voice from nowhere.'))
  await g.fade('black', 1200)
  g.set('c7.campDone')
  await g.goto('c7_rescue')
}

const scene: SceneDef = {
  id: 'c7_camp',
  name: l('Pirátsky tábor, štyri dni severne od Diss', 'The pirate camp, four days north of Diss'),
  ambience: DUSK,
  camera: { zoom: 1.05 },
  map: CAMP_MAP,
  player: { character: 'arkot', at: [25, 15], facing: 225, abilities: [] },
  actors: [
    { id: 'flint', character: 'c7_flint', at: [25, 16], facing: 225, label: l('Pošepkať', 'Whisper'), talk: async (g) => {
      const n = g.inc('c7.flintTalk')
      if (n === 1) {
        await g.say('flint', l('Neobzeraj sa, braček. Kráčaj a rátaj. Ty vieš rátať najlepšie.', 'Don’t look around, little brother. Walk and count. You count best of all.'))
        await g.say('player', l('Čo rátam?', 'What am I counting?'))
        await g.say('flint', l('Všetko. Kroky. Stráže. Komu sa trasú ruky.', 'Everything. Steps. Guards. Whose hands are shaking.'), { mood: 'happy' })
      } else {
        await g.say('flint', l('Kráčaj. Ten za nami má prst na spúšti a mozog na dovolenke.', 'Keep walking. The one behind us has his finger on the trigger and his brain on holiday.'))
      }
    } },
    { id: 'overseer', character: 'c7_overseer', at: [27, 15], facing: 225 },
    { id: 'dara', character: 'dara', at: [10, 21], pose: 'sit', facing: 0 },
    { id: 'yori', character: 'yori', at: [9, 21], pose: 'sit', facing: 45 },
    { id: 'mech', character: 'c7_mechanic', at: [14, 21], pose: 'slump', facing: 315 },
    { id: 'load1', character: 'c7_loader1', at: [13, 21], pose: 'lie', facing: 0 },
    { id: 'load2', character: 'c7_loader2', at: [10, 22], pose: 'lie', facing: 90 },
    { id: 'scar', character: 'c7_scar', at: [14, 17], facing: 315, label: l('Pozrieť sa', 'Look'), talk: async (g) => {
      await g.narrate(l('Veľký pirát s jazvou cez líce. Revolver na opasku, v puzdre, za chrbtom.', 'A big pirate with a scar across his cheek. A revolver on his belt, in its holster, at his back.'))
      await g.narrate(l('Kedykoľvek prešla stráž dosť blízko, Flintove oči skočili na pažbu. Nepotreboval ju a nemal šancu ju zobrať. Ale pamätal si ju.', 'Whenever a guard passed close enough, Flint’s eyes jumped to the grip. He did not need it and had no chance of taking it. But he remembered it.'))
      g.bark('scar', l('Čo civíš, mačka?', 'What are you staring at, cat?'))
    } },
    { id: 'smoker', character: 'c7_smoker', at: [22, 16], hidden: true },
    { id: 'kicker', character: 'c7_kicker', at: [19, 20], facing: 270 },
    { id: 'p1', character: 'c7_pirate1', at: [16, 17], pose: 'sit', facing: 45 },
    { id: 'p2', character: 'c7_pirate2', at: [18, 17], pose: 'sit', facing: 225 },
    { id: 'p3', character: 'c7_pirate3', at: [17, 18], pose: 'sit', facing: 135 },
    { id: 'c1', character: 'c7_pirate4', at: [18, 13], pose: 'sit', facing: 0 },
    { id: 'c2', character: 'c7_pirate5', at: [20, 15], facing: 270 },
    { id: 'o1', character: 'c7_pirate6', at: [20, 9], pose: 'lie', facing: 0 },
    { id: 'o2', character: 'c7_pirate7', at: [20, 10], pose: 'sit', facing: 270 },
    { id: 'w1', character: 'c7_pirate8', at: [9, 15], behavior: 'wander', wanderRadius: 2 },
    { id: 'f1', character: 'c7_pirate9', at: [26, 20], facing: 180 },
    { id: 'f2', character: 'c7_pirate10', at: [30, 15], facing: 270 },
  ],
  props: campProps(false),
  interactables: [
    {
      id: 'pile',
      at: [23, 23],
      label: l('Čo zostalo z Kortegovej lode', 'What is left of Korteg’s ship'),
      verb: 'look',
      radius: 1.9,
      when: (g) => g.flag('c7.stage') === 'walk' && !g.flag('c7.sawKorteg'),
      run: async (g) => {
        g.cinematic(true)
        await korteg(g)
        g.cinematic(false)
      },
    },
    {
      id: 'fighters',
      at: [26, 14],
      label: l('Pirátske stíhačky', 'The pirate fighters'),
      verb: 'look',
      radius: 2.2,
      when: (g) => g.flag('c7.stage') === 'walk' && !g.flag('c7.sawFighters'),
      run: async (g) => {
        g.set('c7.sawFighters')
        await g.narrate(l('Dve malé stíhačky na trámovom podklade, laná uvoľnené, vodíkové vaky nafúknuté a lesklé. Rýchle, ľahké, manévrovateľné.', 'Two small fighters on a timber cradle, their lines slack, their hydrogen bags taut and gleaming. Fast, light, nimble.'))
        await g.narrate(l('Jediná iskra pri nich by zmenila celú mýtinu na popolavý dážď. Piráti pri nich nefajčili ani nerobili oheň.', 'A single spark near them would turn the whole clearing into a rain of ash. The pirates did not smoke near them or light fires.'))
        g.codex('gloss.hydrak')
      },
    },
    {
      id: 'cards',
      at: [16, 18],
      label: l('Kartová hra', 'The card game'),
      verb: 'look',
      radius: 2,
      when: (g) => g.flag('c7.stage') === 'walk' && !g.flag('c7.sawCards'),
      run: async (g) => {
        g.set('c7.sawCards')
        g.bark('p1', l('Čo čumíš? Nemáš čo staviť.', 'What are you gawping at? You’ve got nothing to bet.'))
        await g.narrate(l('Umastený balíček a kosti namiesto mincí. Flint spomalil o pol kroku. Iba o pol.', 'A greasy deck and bones instead of coins. Flint slowed half a step. Only half.'))
        await g.say('player', l('Poznám ten pohľad. Z Diss, z čias, keď k jeho domu chodievali muži, čo sa neusmievali.', 'I know that look. From Diss, from the days when men who never smiled came to his door.'), { thought: true })
      },
    },
    {
      id: 'stream',
      at: [17, 26],
      label: l('Potok', 'The stream'),
      verb: 'look',
      radius: 1.8,
      when: (g) => g.flag('c7.stage') === 'walk' && !g.flag('c7.sawStream'),
      run: async (g) => {
        g.set('c7.sawStream')
        await g.narrate(l('Noc prinášala len vodu z potoka, hnedú a železitú, čo sťahovala hrdlo.', 'The night brought only water from the stream, brown and ferrous, water that tightened the throat.'))
      },
    },
  ],
  triggers: [
    {
      id: 'arrive',
      area: [9, 19, 15, 22],
      when: (g) => g.flag('c7.stage') === 'walk',
      run: evening,
    },
  ],
  onEnter: async (g) => {
    tick = 0
    counted = 0
    offTimer = 0
    warned = false
    dragging = false
    const stage = g.flag('c7.stage')
    if (!stage || stage === 'walk') {
      g.set('c7.stage', 'walk')
      const p = g.pos('player')
      g.teleport('flint', besideCell(p, [p[0], p[1] + 1], 1))
      g.teleport('overseer', besideCell(p, [p[0] + 2, p[1]], 2))
      g.face('flint', SHELTER)
      g.face('overseer', 'player')
    }
    g.face('scar', [11, 20])
    g.face('p1', [17, 17])
    g.face('p2', [17, 17])
    g.face('p3', [17, 17])
    await g.once('c7.intro', async () => {
      g.cinematic(true)
      await g.wait(500)
      await g.focus([25, 15], { ms: 10, zoom: 1.3 })
      await g.narrate(l('Lano z konopných vlákien páchlo po starej rybine a dralo mu zápästia až do surovej krvi. Arkot tú bolesť dávno prestal registrovať.', 'The hemp rope stank of old fish and chafed his wrists raw. Arkot had long since stopped registering the pain.'))
      await g.narrate(l('Tridsaťjeden dní. Počítal ich podľa hviezdy: Matkin Vlas sa od prvej noci posunul o trinásť uhlových stupňov.', 'Thirty-one days. He counted them by a star: since the first night, Mother’s Hair had moved thirteen degrees of arc.'))
      await g.narrate(l('Trinásť stupňov znamenalo tridsaťjeden nocí. Tridsaťjeden nocí znamenalo, že Korteg mešká päť týždňov. A to znamenalo, že v Nyau sa už prestali pýtať.', 'Thirteen degrees meant thirty-one nights. Thirty-one nights meant Korteg was five weeks overdue. And that meant that in Nyau they had stopped asking.'))
      await g.say('player', l('Tak funguje nebo. Vzducholoď zmizne. Rodiny čakajú. Potom čakajú menej. Potom si pamätajú len prázdnotu.', 'That’s how the sky works. An airship vanishes. Families wait. Then they wait less. Then they remember only the emptiness.'), { thought: true, mood: 'blank' })
      await g.focus([27, 15], { ms: 1600, zoom: 0.95 })
      await g.narrate(l('Pirátsky tábor bol zarezaný do hory ako jazva: vyrúbaný kruh, prístrešky pokryté konármi, ohniská so sivým dymom. Na východnom okraji mýtina a na nej dve malé stíhačky.', 'The pirate camp was cut into the mountain like a scar: a felled ring, shelters roofed with branches, fires trailing grey smoke. On the eastern edge a clearing, and on it two small fighters.'))
      await g.focus([25, 15], { ms: 900, zoom: 1.15 })
      g.face('overseer', 'player')
      await g.say('overseer', l('Dosť! Späť k stĺpu, obaja. A pomaly, nech vás nemusím nosiť.', 'Enough! Back to the post, both of you. And slowly, so I don’t have to carry you.'))
      await g.say('flint', l('Neobzeraj sa, braček. Kráčaj a rátaj.', 'Don’t look around, little brother. Walk and count.'), { mood: 'determined' })
      g.follow()
      await g.zoom(1.05, 600)
      g.cinematic(false)
    })
    if (g.flag('c7.stage') === 'walk') {
      g.objective(l('Vráť sa s Flintom k prístrešku väzňov. Dozorca vás sleduje.', 'Walk back to the prisoners’ shelter with Flint. The overseer is watching.'))
      g.hint(l('WASD — chôdza · E — pozrieť sa', 'WASD — walk · E — look'))
      g.checkpoint()
    }
  },
  onUpdate: (g, dt) => {
    if (g.flag('c7.stage') !== 'walk') return
    tick -= dt
    if (tick > 0) return
    tick = 0.35
    const pc = g.pos('player')
    const p = exactPos(g)
    if (g.dist('flint', 'player') > 1.8) void g.walk('flint', besideCell(pc, g.pos('flint'), 1), { speed: 3.3 })
    if (g.dist('overseer', 'player') > 3.4) void g.walk('overseer', besideCell(pc, g.pos('overseer'), 2), { speed: 2.9 })
    const rem = Math.hypot(p[0] - SHELTER[0], p[1] - SHELTER[1])
    if (counted < 1 && rem < 10) {
      counted = 1
      g.bark('flint', l('…desať.', '…ten.'))
    } else if (counted < 2 && rem < 5.5) {
      counted = 2
      g.bark('flint', l('…dvadsať.', '…twenty.'))
      g.hint(null)
    }
    const inside = pc[0] >= 8 && pc[0] <= 31 && pc[1] >= 11 && pc[1] <= 25
    if (inside) {
      offTimer = 0
      warned = false
      return
    }
    offTimer += 0.35
    if (!warned) {
      warned = true
      g.bark('overseer', l('Hej! K stĺpu, leopard! Nie do lesa!', 'Hey! To the post, leopard! Not into the woods!'))
      void g.walk('overseer', besideCell(pc, g.pos('overseer'), 1), { speed: 3.6, run: true })
    }
    if (offTimer > 2.4 && !dragging) {
      dragging = true
      void (async () => {
        g.shake(0.15, 250)
        g.sfx('whoosh', 0.6)
        g.bark('overseer', l('Ešte raz a pôjdeš k potoku po hlave.', 'Once more and you go to the stream head first.'))
        await g.fade('black', 350)
        g.teleport('player', [20, 17], 225)
        g.teleport('flint', [20, 18])
        g.teleport('overseer', [22, 16])
        await g.fade('clear', 450)
        offTimer = 0
        warned = false
        dragging = false
      })()
    }
  },
}

export default scene
export { PIRATES }
