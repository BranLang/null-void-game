/**
 * Interlúdium: Spánok (Maks). The empty bar. The dust comes back from the ten bodies and slides
 * into the seams of the suit. A voice sits down beside him in the dark. “Go.” “Let me sleep.”
 * “Go.” He stands, walks past the women shaking the dead, and takes the lift up. To her.
 */
import type { ActorDef, SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'
import { sleep } from './ambience'
import { barProps, depthsMap } from './depths'

const BODIES: Vec2[] = [[17, 10], [18, 9], [18, 11], [19, 10], [20, 9], [20, 11], [2, 10], [1, 9], [1, 11], [3, 9]]
const bodies: ActorDef[] = BODIES.map((at, i) => ({
  id: `b${i + 1}`,
  character: i === 0 ? 'c13_scar' : i <= 3 ? `c13_young${i}` : `c13_hunter${i}`,
  at,
  pose: 'lie',
  facing: (i * 53) % 360,
}))
const WIDOWS: { id: string; to: Vec2 }[] = [
  { id: 'wd1', to: [16, 10] },
  { id: 'wd2', to: [19, 9] },
  { id: 'wd3', to: [3, 10] },
  { id: 'wd4', to: [21, 11] },
]

export const spanokScene: SceneDef = {
  id: 'c13_spanok',
  name: l('Interlúdium: Spánok', 'Interlude: Sleep'),
  ambience: sleep,
  camera: { zoom: 1.3 },
  map: depthsMap,
  props: [
    ...barProps.filter((p) => p.type !== 'c13_bottle'),
    { type: 'c13_table_fallen', at: [3, 3] },
    { type: 'c13_bottle', at: [2, 3], params: { count: 2, color: '#c8402a', empty: true } },
    { type: 'lantern', at: [3, 1], params: { style: 'hanging' }, color: '#ffb070', solid: false },
  ],
  player: { character: 'maks', at: [1, 2], facing: 90, abilities: [] },
  actors: [
    ...bodies,
    ...WIDOWS.map((w, i) => ({ id: w.id, character: `c13_widow${i + 1}`, at: [27, 2] as Vec2, hidden: true })),
  ],
  triggers: [
    {
      id: 'bodies',
      area: [10, 9, 14, 11],
      when: (g) => !!g.flag('c13s.stood') && !g.flag('c13s.widows'),
      run: (g) => widows(g),
    },
    {
      id: 'lift',
      area: [26, 1, 28, 3],
      when: (g) => !!g.flag('c13s.widows'),
      run: async (g) => {
        g.cinematic(true)
        g.sfx('door', 0.6)
        await g.narrate(l('Výťah. Páka. Železo zavrčalo smerom hore. K Itake.', 'The lift. The lever. The iron growled upwards. Towards the Itaka.'))
        await g.caption(l('K nej.', 'To her.'), { ms: 3200 })
        await g.endChapter()
      },
    },
  ],
  onEnter: async (g) => {
    if (!g.flag('c13s.stood')) g.pose('player', 'sit')
    await g.once('c13s.dust', async () => {
      g.cinematic(true)
      await g.wait(600)
      await g.narrate(l('Obe fľaše boli prázdne. Rys s revolverom odišiel, druhýkrát, lišiak za ním; kroky v tuneli stíchli a bar zostal prázdny.', 'Both bottles were empty. The lynx with the revolver had gone, the second time, the fox after him; the footsteps in the tunnel faded and the bar was empty.'))
      await g.narrate(l('Maks nehybne sedel a čakal, kým sa Prach vráti.', 'Maks sat motionless and waited for the Dust to come back.'))
      for (const b of BODIES) {
        g.fx('dust', b, { scale: 0.8 })
        await g.wait(160)
      }
      g.particles({ kind: 'blackdust', count: 200, at: [1, 2], radius: 1.4, id: 'home' })
      g.fx('dust', 'player', { scale: 1.2 })
      await g.narrate(l('Čierny roj stekal po chladných stenách a cez desať tiel ležiacich v tme, čo sa už nezdvihnú. Vkĺzal späť do švov obleku, pomaly, neochotne, s pamäťou na to, čím bol kedysi: duše prízrakov, zhmotnené a podmanené, čo si občas ešte mysleli, že sú voľné.', 'The black swarm ran down the cold walls and over ten bodies lying in the dark that would not rise again. It slid back into the seams of the suit, slowly, reluctantly, remembering what it had once been: the souls of phantoms, given substance and subdued, which sometimes still thought they were free.'))
      g.stopParticles('home')
      await g.say('player', l('Iba spia.', 'They’re only sleeping.'), { thought: true })
      await g.narrate(l('Ticho. Dym z olejovej lampy. Posledný zvyšok svetla nad stolom. Niekto si vedľa neho sadol. Maks neotočil hlavu.', 'Silence. Smoke from the oil lamp. The last scrap of light above the table. Someone sat down beside him. Maks did not turn his head.'))
      await g.say('player', l('Zase ty.', 'You again.'))
      await g.say('c13_voice', l('Máš deti?', 'Do you have children?'))
      await g.narrate(l('Prstami si prešiel po poškriabanom kovovom okraji leteckých okuliarov.', 'He ran his fingers over the scratched metal rim of his flying goggles.'))
      await g.say('player', l('Nie.', 'No.'))
      await g.say('c13_voice', l('Mám dve dcéry.', 'I have two daughters.'))
      await g.say('player', l('A čo ja s tým?', 'And what’s that to me?'))
      await g.say('c13_voice', l('Nemusel si ich zabiť.', 'You didn’t have to kill them.'))
      await g.say('c13_voice', l('Chránili si svoje teritórium.', 'They were defending their territory.'))
      await g.say('player', l('Daj mi pokoj.', 'Leave me alone.'))
      await g.say('c13_voice', l('Ja som utekal. Ty mažeš.', 'I ran. You erase.'))
      await g.narrate(l('Maks obrátil prázdnu fľašu hrdlom dole.', 'Maks turned the empty bottle upside down.'))
      await g.say('c13_voice', l('Saburo ťa požiadal o pomoc. Kitsune horí, a ty chlastáš. Si priveľmi starý na to, aby si trucoval ako malé decko.', 'Saburo asked you for help. Kitsune is burning, and you’re drinking. You’re far too old to sulk like a little brat.'))
      await g.say('player', l('Hmm.', 'Hmm.'))
      g.sfx('click', 0.4)
      await g.narrate(l('Škrabnutie stoličky o kameň. Zvuk pohára. Potom kroky. Pomalé, isté. Do tmy, ktorá nebola tunelom ani miestnosťou, len tým, čo zostane, keď dohorí aj posledná lampa.', 'A chair scraping on stone. The sound of a glass. Then footsteps. Slow, certain. Into a darkness that was neither tunnel nor room, only what is left when the last lamp burns out.'))
      await g.narrate(l('Konverzácia z Itaky pretekala Prachom ako studený prúd. Lišiak navigátorovi rozpletal dôvody, prečo ich Saburo poslal. Kitsune. Dom, čo napadli prízraky. Dievča, čo tam zostalo.', 'The talk aboard the Itaka flowed through the Dust like a cold current. The fox was unpicking for the navigator the reasons Saburo had sent them. Kitsune. A house attacked by phantoms. A girl who had stayed there.'))
      await g.narrate(l('Malá líška so zlomeným chvostom, čo sa nechcela učiť padať. Ale učila sa.', 'A little fox with a broken tail who did not want to learn how to fall. But she learned.'))
      let stand = false
      let n = 0
      while (!stand) {
        await g.narrate(l('Choď.', 'Go.'))
        const c = await g.choose([
          { id: 'sleep', text: l('„Nechajte ma spať.“', '“Let me sleep.”'), when: n < 2 },
          { id: 'stand', text: l('(Vstať.)', '(Stand up.)') },
        ])
        if (c === 'stand') stand = true
        else {
          await g.say('player', l('Nechajte ma spať.', 'Let me sleep.'))
          n++
        }
      }
      await g.narrate(l('Teplo v hrudi. Maks vstal. Nechcel. Ale zostať sedieť nedokázal.', 'Warmth in his chest. Maks stood up. He didn’t want to. But he could not stay sitting.'))
      g.pose('player', 'stand')
      g.set('c13s.stood')
      g.cinematic(false)
      g.objective(l('K výťahu.', 'To the lift.'))
    })
  },
}

async function widows(g: GameAPI): Promise<void> {
  g.set('c13s.widows')
  g.cinematic(true)
  await g.narrate(l('Prešiel popri telách. Prach mu uhladil švy na obleku, ako rukavičkár, čo zatvára obchod, pomaly a takmer nežne.', 'He walked past the bodies. The Dust smoothed the seams of his suit, like a glover closing up shop, slowly and almost tenderly.'))
  for (let i = 0; i < WIDOWS.length; i++) {
    g.show(WIDOWS[i].id, true)
    g.teleport(WIDOWS[i].id, [27, 2])
    void g.walk(WIDOWS[i].id, WIDOWS[i].to, { run: true })
    await g.wait(350)
  }
  await g.narrate(l('Kroky na schodoch, cudzie. Rýchle, ťažké, bosé. Hlasy. Ženské. Chrčivé zvuky, ktoré sa zlomili do výkriku ešte skôr, než vbehli dnu.', 'Footsteps on the stairs, strangers’. Fast, heavy, bare. Voices. Women’s. Rasping sounds that broke into a cry before they even ran in.'))
  await g.wait(1500)
  for (const w of WIDOWS) g.pose(w.id, 'kneel')
  await g.narrate(l('Prvá kľakla k najbližšiemu telu. Schmatla ho za ramená. Triasla ním. Volala meno. Nepoznal ho. Nepotreboval. Štyri ženy pri desiatich telách. Tlapy na tvárach, hľadajúce rany, čo tam neboli.', 'The first knelt by the nearest body. Seized it by the shoulders. Shook it. Called a name. He didn’t know it. He didn’t need to. Four women by ten bodies. Paws on faces, searching for wounds that were not there.'))
  g.face('wd1', 'player')
  g.pose('wd1', 'kneel')
  await g.narrate(l('Jedna z nich zdvihla hlavu. Pozerala na Maksa. Na tmavé okuliare. Na oblečenie bez krvi. Na ruky, čo sa ničoho nedotkli.', 'One of them raised her head. She looked at Maks. At the dark goggles. At the clothes without blood. At hands that had touched nothing.'))
  await g.narrate(l('Prešiel okolo nej. Nepovedal nič.', 'He walked past her. He said nothing.'))
  await g.narrate(l('Za chrbtom plač. Nie krik. Krik príde neskôr. Teraz len ten zvuk, keď trasú niekým, kto by sa mal zobudiť a nebudí sa.', 'Behind him, weeping. Not screaming. The screaming would come later. For now only the sound of shaking someone who should wake up and does not.'))
  g.cinematic(false)
}
