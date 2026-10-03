/**
 * c17_cemetery — the stairs of the old cemetery swallowed by the forest.
 * Tami sits on the pedestal with the Book; the phantoms come in waves.
 * Yera's three layers: the veil (Sora on the skin), the slow field (Mizu in
 * the hands), fire (Hi in the throat). Fire only breaks what the ring has
 * slowed or the ice has stopped. The veil goes first. When the last one comes
 * from below, the nameless violet burst. Then Samael's taunt, the finger
 * regrown from dust, the kiss that steals breath, and the wall of phantoms.
 */
import type { SceneDef, Vec2 } from '../../types'
import type { GameAPI } from '../../../game/GameAPI'
import { l } from '../../../i18n/i18n'

const SPAWNS: Vec2[] = [
  [3, 18],
  [22, 15],
  [6, 14],
  [5, 18],
  [2, 20],
  [23, 19],
  [20, 14],
  [8, 20],
  [17, 20],
  [23, 17],
  [10, 14],
  [15, 14],
]
const WAVES = [3, 4, 5]
const FORMS = ['crawler', 'humanoid', 'crawler', 'listener'] as const

interface Foe {
  id: string
  frozenUntil: number
}

let foes: Foe[] = []
let wave = 0
let serial = 0
let spawnIn = 2
let stepT = 0
let fieldUntil = -1
let fieldAt: Vec2 = [0, 0]
let hits = 0
let fightT = 0
let castOff: (() => void) | null = null

const fieldRadius = (g: GameAPI): number => 3.3 * (1 - Math.min(0.5, g.strain() * 0.45))

function slowed(g: GameAPI, f: Foe): boolean {
  if (f.frozenUntil > g.time) return true
  if (fieldUntil < g.time) return false
  return g.dist(f.id, fieldAt) <= fieldRadius(g)
}

function kill(g: GameAPI, f: Foe): void {
  g.fx('fire', f.id, { scale: 1.6 })
  g.fx('dust', f.id)
  g.despawn(f.id)
  foes = foes.filter((x) => x !== f)
}

function spawnWave(g: GameAPI): void {
  const n = WAVES[wave] ?? 0
  const start = Math.floor(Math.random() * SPAWNS.length)
  for (let i = 0; i < n; i++) {
    const at = SPAWNS[(start + i * 5) % SPAWNS.length]
    const id = `w${serial++}`
    const form = FORMS[(serial + i) % FORMS.length]
    g.spawn({ id, character: 'phantom', at, phantom: { form, fibers: 10, reach: 1.7, speed: 1 } })
    g.fx('dust', id)
    foes.push({ id, frozenUntil: 0 })
  }
  g.sfx('bass', 0.5)
  wave++
}

function onCast(g: GameAPI) {
  return (e: { id: string; at: Vec2 }) => {
    if (!g.flag('c17.fight') || g.flag('c17.bossDone')) return
    if (e.id === 'slow') {
      fieldUntil = g.time + 6.5
      fieldAt = g.pos('player')
      g.fx('glyph', 'player', { color: '#5ff2e0', scale: fieldRadius(g) * 2, ms: 6500 })
      g.particles({ kind: 'bubbles', area: [fieldAt[0] - 2, fieldAt[1] - 2, fieldAt[0] + 2, fieldAt[1] + 2], count: 50, color: '#bff8ff', id: 'field' })
      window.setTimeout(() => g.stopParticles('field'), 6500)
    } else if (e.id === 'ice') {
      for (const f of foes) if (g.dist(f.id, e.at) <= 2) f.frozenUntil = g.time + 4.5
    } else if (e.id === 'fire') {
      let burned = 0
      for (const f of [...foes]) {
        if (g.dist(f.id, e.at) > 2.1) continue
        if (slowed(g, f)) {
          kill(g, f)
          burned++
        }
      }
      if (!burned && foes.some((f) => g.dist(f.id, e.at) <= 2.1)) g.bark('player', l('Oheň ich len ovanul. Najprv ich spomaľ.', 'The fire only brushed them. Slow them first.'))
    }
  }
}

function resetFight(): void {
  foes = []
  wave = 0
  spawnIn = 2.5
  stepT = 0
  fieldUntil = -1
  hits = 0
  fightT = 0
}

async function intro(g: GameAPI): Promise<void> {
  g.stealth(false)
  g.cinematic(true)
  await g.walk('player', [17, 18])
  await g.narrate(l('Mesto plynule prešlo do starého, dávno zničeného cintorína, ktorý zožral okolitý les a zvalené múry niekdajšej štvrte. Priamo pred ňou sa dvíhalo široké, rozbité kamenné schodisko, ktorým prerastali korene prastarých stromov.', 'The town flowed into an old, long-ruined cemetery that the forest and the fallen walls of a former quarter had swallowed. Before her rose a wide, broken stone staircase, grown through by the roots of ancient trees.'))
  g.pose('player', 'crouch')
  await g.narrate(l('Zastavila sa. Musela. Nohy pod ňou chceli kľaknúť a hruď sa zdvíhala v krátkych, plytkých pohyboch, čo nenosili dosť vzduchu.', 'She stopped. She had to. Her legs wanted to kneel and her chest rose in short, shallow movements that did not carry enough air.'))
  await g.focus('tami', { ms: 1600, zoom: 1.1 })
  await g.narrate(l('Na samom vrchu schodiska, na podstavci, z ktorého už dávno spadla socha, sedela Tami. Kniha v lone. Chvost obtočený okolo kolien. Fialové oči z výšky sledovali Yeru a čakali.', 'At the very top of the stairs, on a pedestal from which a statue had fallen long ago, sat Tami. The Book in her lap. Her tail wound around her knees. Violet eyes watched Yera from above, and waited.'))
  await g.narrate(l('Kniha patrila jej. Soril ju vložila do jej dlaní a povedala „stráž ju“, a Yera strážila a strážila, a teraz ležala v lone posadnutého dievčaťa. Hnev v nej sa rozhodoval medzi slovami a ohňom.', 'The Book was hers. Soril had put it in her hands and said “guard it”, and Yera had guarded and guarded, and now it lay in the lap of a possessed girl. The anger in her chose between words and fire.'))
  g.follow()
  g.pose('player', 'stand')
  await g.say('player', l('Tušil si, že prídem.', 'You knew I would come.'), { mood: 'angry' })
  await g.say('tami', l('Tušil.', 'I knew.'), { mood: 'blank' })
  g.sfx('bass', 0.7)
  g.shake(0.15, 600)
  await g.narrate(l('Ticho. Dážď. Prízraky v diaľke, nehybné. Nato sa pohli. Nie k Tami. K Yere. Spoza náhrobných kameňov, z trhlín v dlažbe, zo zvalených stien, zhora zo stromov.', 'Silence. Rain. Phantoms in the distance, motionless. Then they moved. Not towards Tami. Towards Yera. From behind gravestones, from cracks in the paving, from fallen walls, from the trees above.'))
  g.unlock('slow')
  await g.narrate(l('Spira v troch vrstvách. Sora na koži. Mizu v rukách. Hi v hrdle. Kým ju nevideli, mala čas.', 'Spira in three layers. Sora on the skin. Mizu in the hands. Hi in the throat. As long as they could not see her, she had time.'))
  g.codex('gloss.c17_three_layers')
  g.cinematic(false)
  g.objective(l('Prežiť vlny prízrakov. Spomaľ ich kruhom (Mizu) alebo ľadom, potom páľ.', 'Survive the waves of phantoms. Slow them with the ring (Mizu) or with ice, then burn.'))
  g.hint(l('V — Závoj · 1 Ľad · 2 Oheň · 3 Kruh (Ctrl = okamžite, ale zaplatíš)', 'V — Veil · 1 Ice · 2 Fire · 3 Ring (Ctrl = instant, but you pay)'))
}

function startFight(g: GameAPI): void {
  resetFight()
  castOff?.()
  castOff = g.onCast(onCast(g))
  g.set('c17.fight')
  g.stealth(true)
  g.checkpoint()
}

async function veilGone(g: GameAPI): Promise<void> {
  g.dropVeil()
  g.sfx('crack', 0.5)
  await g.narrate(l('Závoj odišiel prvý. Vzduch okolo nej sa s tichým prasknutím ustálil. Svetlo sa vrátilo na jej kožu. Prízraky, čo doteraz blúdili naslepo, sa zastavili. Všetky naraz. Otočili sa k nej.', 'The veil went first. The air around her settled with a soft crack. Light came back onto her skin. The phantoms that had been wandering blind stopped. All at once. They turned to her.'))
  g.hint(l('Kruh sa zmenšuje s každým kúzlom. Drž ich ďalej.', 'The ring shrinks with every spell. Keep them away.'))
}

async function finale(g: GameAPI): Promise<void> {
  g.set('c17.bossDone')
  g.stealth(false)
  castOff?.()
  castOff = null
  g.hint(null)
  g.objective(null)
  g.cinematic(true)
  const at = g.pos('player')
  g.spawn({ id: 'below', character: 'phantom', at: [at[0] + 1, at[1]], phantom: { form: 'crawler', fibers: 16, reach: 1.2 } })
  g.fx('dust', 'player', { scale: 1.4 })
  g.sfx('crack', 0.8)
  await g.narrate(l('Posledný neprišiel spredu. Prišiel zdola. Z trhliny v dlažbe, rovno pod jej nohami. Vlákna vyrazili zo zeme a obtočili sa okolo členka. Jedno z nich prerezalo kožu hlboko, až na kosť.', 'The last did not come from the front. It came from below. From a crack in the paving, right under her feet. Fibres burst from the ground and wound around her ankle. One of them cut through the skin, deep, to the bone.'))
  g.pose('player', 'kneel')
  g.shake(0.3, 500)
  g.flash('#a01020', 300)
  await g.narrate(l('Koleno na dlažbe. Dych von. Krv z členka. Panika.', 'Knee on the paving. Breath gone. Blood from the ankle. Panic.'))
  await g.say('player', l('Nie.', 'No.'), { mood: 'pain' })
  await g.narrate(l('Schmatla zovretý členok ľavou rukou a vrazila do neho všetko, čo jej ostalo. Niečo iné, čo nemalo meno, len farbu a tvar a zúfalstvo.', 'She seized the bound ankle with her left hand and drove into it everything she had left. Something else, something without a name, only colour and shape and despair.'))
  g.unlock('sora')
  g.glyph('player', 3)
  g.flash('#d8b0ff', 900)
  g.fx('sora', 'player', { scale: 7, ms: 2400 })
  g.sfx('veil', 1)
  g.shake(0.5, 900)
  for (const f of foes) {
    g.fx('dust', f.id)
    g.despawn(f.id)
  }
  foes = []
  g.fx('dust', 'below')
  g.despawn('below')
  await g.narrate(l('Fialová na prstoch ľavej ruky vzplanula tak jasno, že na okamih rozsvietila celé ruiny, každý náhrobok a každý strom v jednom záblesku. Roj sa zastavil. Vlákna, čo jej zvierali členok, ochabli a spadli na dlažbu. Mŕtve. Ako vlasy odstrihnuté nožnicami.', 'The violet on the fingers of her left hand flared so bright that for an instant it lit the whole ruin, every gravestone and every tree in a single flash. The swarm stopped. The fibres that held her ankle went slack and fell to the paving. Dead. Like hair cut with scissors.'))
  g.codex('gloss.c17_violet')
  g.glyph('player', 0.2)
  await g.narrate(l('Prsty zhasli. Spira na nule. Nebol to mráz a nebol to oheň. Ona bola prázdna. Roj bol mŕtvy.', 'Her fingers went dark. Spira at zero. It had not been frost and it had not been fire. She was empty. The swarm was dead.'))
  g.addStrain(0.9)
  // ---------------------------------------------------------------- Samael
  await g.focus('tami', { ms: 1200, zoom: 1.2 })
  await g.narrate(l('Tamine oči na nehybnom vláknitom tele na dlažbe. Dlho. Potom sa hlava naklonila na stranu. Ten istý cudzí pohyb, ale tentoraz pomalší. Opatrnejší.', 'Tami’s eyes on the motionless fibrous body on the paving. For a long time. Then the head tilted to one side. The same foreign movement, but slower this time. More careful.'))
  await g.say('tami', l('Čo si urobila.', 'What did you do.'), { mood: 'blank' })
  await g.narrate(l('Yera neodpovedala. Nemala čím. Výraz vo fialových očiach sa zmenil, z čistej agresie do vypočítavej zvedavosti. Predátor, ktorý práve odhalil novú pascu.', 'Yera did not answer. She had nothing to answer with. The look in the violet eyes changed, from pure aggression to calculating curiosity. A predator that has just found a new trap.'))
  await g.say('tami', l('Ale tí pred tebou boli lepší.', 'But those before you were better.'), { mood: 'blank' })
  await g.say('tami', l('V Atranskej úžine sme od nich dostali výprask. Malé, strieborné líšky, čo niesli smrť. Hádzali na nás svetlo a oheň a my sme padali do bahna.', 'In the Atran Strait they gave us a thrashing. Small silver foxes that carried death. They threw light and fire at us and we fell into the mud.'), { mood: 'blank' })
  await g.wait(800)
  await g.say('tami', l('A aj tak sme vstali.', 'And still we rose.'), { mood: 'blank' })
  g.codex('world.c17_atran')
  g.follow()
  g.lift('tami', 0)
  await g.walk('tami', [13, 15], { speed: 1.6 })
  await g.walk('tami', [g.pos('player')[0], g.pos('player')[1] - 1], { speed: 1.2 })
  g.face('tami', 'player')
  g.pose('tami', 'crouch')
  await g.narrate(l('Tami vstala. Prešla k nej. Pomaly. Krok za krokom. A Yera nemala silu zdvihnúť ruku. Čupla si k nej a vzala jej ľavú ruku. Stiahla rukavicu. Prst po prste.', 'Tami rose. Came to her. Slowly. Step by step. And Yera had no strength to lift a hand. She crouched beside her and took her left hand. Peeled off the glove. Finger by finger.'))
  await g.narrate(l('Pahýľ malíčka, obnažený a ružový. Tamine prsty sa zavreli okolo dlane. Jemne. Prach z Taminých prstov prešiel do Yerinej dlane. Do kože. Pod kožu. Do kosti.', 'The stump of the little finger, bare and pink. Tami’s fingers closed around the palm. Gently. Dust passed from Tami’s fingers into Yera’s palm. Into the skin. Beneath the skin. Into the bone.'))
  g.fx('dust', 'player', { scale: 0.6 })
  g.shake(0.1, 1600)
  await g.narrate(l('Agresívne, mravčivé pálenie miliónov zrniek prachu, ktoré prepisovali prázdnotu novým mäsom. Kosti cvakali, keď si spomínali, čím kedysi boli. Necht sa vytlačil z rastúceho mäsa, fialovo-čierny.', 'An aggressive, crawling burn of millions of grains of dust rewriting emptiness into new flesh. The bones clicked as they remembered what they once had been. A nail pushed out of the growing flesh, violet-black.'))
  await g.narrate(l('Bolesť ustúpila. Náhle. Malíček sa pohol.', 'The pain receded. Suddenly. The little finger moved.'))
  g.codex('gloss.c17_finger')
  await g.narrate(l('Prst bol na mieste. Celý. Nový. Koža ružová a hladká ako u novorodenca, bez jedinej línie, bez pamäte, čo na nej žila celý život. Telo si ho nepamätalo a prst si nepamätal telo, a medzi tým bola medzera, tenká a tichá.', 'The finger was in its place. Whole. New. The skin pink and smooth as a newborn’s, without a single line, without the memory that had lived on her all her life. The body did not remember it and the finger did not remember the body, and between them was a gap, thin and silent.'))
  await g.focus('player', { ms: 900, zoom: 1.7 })
  await g.narrate(l('Tami sa naklonila. Prsty na Yerinom líci. Jemné. Presné. Pery na jej perách.', 'Tami leaned in. Fingers on Yera’s cheek. Gentle. Precise. Lips on her lips.'))
  g.sfx('heartbeat', 0.9)
  g.mood('player', 'fear')
  await g.narrate(l('Srdce jej vrazilo do rebier. Uši dozadu, sploštené k hlave. Z Taminých pier nesálalo teplo. Vyťahovali z nej vzduch. Pod jazykom suchá horkosť a starý popol.', 'Her heart slammed into her ribs. Ears back, flattened to her head. No warmth came from Tami’s lips. They were drawing the air out of her. Under the tongue, a dry bitterness and old ash.'))
  g.flash('#ffffff', 700)
  await g.atmosphere({ grade: { saturation: 0.1, contrast: 1.3, vignette: 0.9 } }, 300)
  await g.narrate(l('Záblesk. Trhlina, čo nepatrila jej hlave: tma a more. Oheň dymiaci v nočnom vetre. Žena kľačiaca v bahne, odvrátená, a vedľa nej iná, mladšia, s tvárou v dlaniach, z ktorej vlákna vyťahovali spomienku po spomienke.', 'A flash. A rift that did not belong to her mind: darkness and the sea. A fire smoking in the night wind. A woman kneeling in the mud, turned away, and beside her another, younger, face in her hands, from whom fibres drew memory after memory.'))
  await g.atmosphere({ grade: { tint: '#d8e2f2', saturation: 0.6, contrast: 1.1, vignette: 0.6 } }, 600)
  g.pose('tami', 'stand')
  await g.say('tami', l('Chutíš ako ona. Predtým, než začala prosiť.', 'You taste like her. Before she began to beg.'), { mood: 'blank' })
  await g.wait(700)
  await g.say('tami', l('Prach si pamätá, Eltária. Vždy si pamätá.', 'Dust remembers, Eltária. It always remembers.'), { mood: 'blank' })
  await g.say('tami', l('Aj to, čo by si chcela zabudnúť.', 'Even what you would rather forget.'), { mood: 'blank' })
  g.codex('people.c17_samael')
  // ---------------------------------------------------------------- the wall
  const p = g.pos('player')
  const ring: Vec2[] = [
    [p[0] - 2, p[1] - 1],
    [p[0] - 1, p[1] - 2],
    [p[0] + 1, p[1] - 2],
    [p[0] + 2, p[1] - 1],
    [p[0] + 2, p[1] + 1],
    [p[0] - 2, p[1] + 1],
  ]
  ring.forEach((c, i) => {
    g.spawn({ id: `wall${i}`, character: 'phantom', at: c, phantom: { form: 'humanoid', fibers: 0, reach: 1 } })
    g.fx('dust', `wall${i}`)
  })
  g.sfx('bass', 0.6)
  await g.narrate(l('Prízraky. Tu. Okolo Yery. Vyrastali z dlažby, zo stien, z medzier v kameňoch. Tiché. Husté. Studené. Kruh, čo sa zatvára. Nedotkli sa. Len stáli. Stena z prachu a chladu medzi ňou a Tami.', 'Phantoms. Here. Around Yera. They grew from the paving, from the walls, from gaps in the stones. Silent. Dense. Cold. A closing ring. They did not touch her. They only stood. A wall of dust and cold between her and Tami.'))
  void g.walk('tami', [12, 7], { speed: 1.2 })
  await g.narrate(l('Za nimi Tami odchádzala. Pomaly. Krok za krokom. Kniha pri hrudi. Prízraky sa jej neklaňali. Ustupovali. Ako vlny pred prílivom.', 'Behind them Tami was leaving. Slowly. Step by step. The Book against her chest. The phantoms did not bow to her. They gave way. Like waves before the tide.'))
  g.pose('player', 'stand')
  await g.walk('player', [p[0], p[1] - 1], { speed: 0.6 })
  g.shake(0.1, 400)
  await g.narrate(l('Yera sa pokúsila pohnúť. Krok. Prízraky sa priblížili. Chlad na koži, na líci, na ušiach. Bez dotyku, len čistá prítomnosť. Stena, čo hovorila „nie“ celým telom. Zostala stáť.', 'Yera tried to move. A step. The phantoms came closer. Cold on her skin, her cheek, her ears. No touch, only pure presence. A wall that said “no” with its whole body. She stayed where she was.'))
  await g.wait(1600)
  g.show('tami', false)
  for (let i = 0; i < ring.length; i++) {
    g.fx('dust', `wall${i}`)
    g.despawn(`wall${i}`)
    await g.wait(450)
  }
  await g.narrate(l('Tami zmizla za náhrobkami. Prízraky stáli dlho. Potom sa začali rozpadávať, jeden po druhom, a posledný sa otočil. Nie k Yere. Od nej. Tam, kam odišla Tami.', 'Tami vanished behind the gravestones. The phantoms stood a long time. Then they began to fall apart, one by one, and the last one turned. Not towards Yera. Away from her. Towards where Tami had gone.'))
  await g.narrate(l('Dážď padal ďalej.', 'The rain kept falling.'))
  g.pose('player', 'kneel')
  await g.narrate(l('Sama. Dážď na novom prste, ktorý na vodu reagoval inak než ostatné, akoby sa s ňou stretával prvýkrát. Na perách ešte chuť, čo tam nemala byť.', 'Alone. Rain on the new finger, which met the water differently than the others, as if for the first time. On her lips, still, a taste that should not have been there.'))
  await g.narrate(l('Neplakala. Po tvári jej stekal len dážď.', 'She did not cry. Only the rain ran down her face.'))
  await g.say('player', l('Ako ona.', 'Like her.'), { thought: true, mood: 'pain' })
  await g.narrate(l('Ten istý ťah v hrudi. Silnejší. Bližší. Ako keby sa svet zúžil na jeden smer.', 'The same pull in her chest. Stronger. Closer. As if the world had narrowed to a single direction.'))
  await g.say('player', l('Arkot.', 'Arkot.'), { thought: true, mood: 'tender' })
  await g.narrate(l('Meno bez hlasu. Len škvrnitá ruka, čo tu nebola, na ramene, čo bolelo. Postavila sa. Členok uniesol. Krok. Ďalší.', 'A name without a voice. Only a spotted hand that was not here, on a shoulder that hurt. She stood up. The ankle held. A step. Another.'))
  g.pose('player', 'stand')
  await g.fade('black', 1800)
  g.cinematic(false)
  await g.goto('c17_beneath')
}

export const cemetery: SceneDef = {
  id: 'c17_cemetery',
  name: l('Schody starého cintorína', 'The Stairs of the Old Cemetery'),
  ambience: {
    sky: { top: '#030408', bottom: '#0e1220', stars: 0, clouds: 0.9 },
    fog: { color: '#0a0e16', near: 9, far: 30 },
    hemi: { sky: '#58668a', ground: '#141a14', intensity: 1.0 },
    sun: { color: '#9aa8d0', intensity: 0.6, dir: [-0.4, 1, 0.45] },
    exposure: 1.05,
    bloom: { strength: 0.95, threshold: 0.78 },
    grade: { tint: '#d8e0f0', saturation: 0.62, contrast: 1.12, vignette: 0.6 },
    particles: [
      { kind: 'rain', count: 900, id: 'rain' },
      { kind: 'spores', count: 40, color: '#9ad8a0' },
    ],
    music: 'epic_boss_fight',
    sounds: ['rain', 'wind'],
  },
  map: {
    rows: [
      'UUUUUUUUUUUUUUUUUUUUUUUUUU',
      'UUUUUUUUUUUUUUUUUUUUUUUUUU',
      'UUUUUUUUUUUUUUUUUUUUUUUUUU',
      'UUUUUUUUUUUUUUUUUUUUUUUUUU',
      'UUUUUUUUppppppppppUUUUUUUU',
      'UUUUUUUUppppppppppUUUUUUUU',
      'UUUUUUUUppppPpppppUUUUUUUU',
      'UUUUUUUUppppppppppUUUUUUUU',
      'UUUUUUUUppppppppppUUUUUUUU',
      'UUUUUUUUppppppppppUUUUUUUU',
      'KKKKKKKKK44444444eeeeeeeee',
      'KKKKKKKKK33333333ddddddddd',
      'KKKKKKKKK22222222bbbbbbbbb',
      'KKKKKKKKK11111111aaaaaaaaa',
      'gMMMMcccccccccccccccccccgg',
      'gMMMMc,cccccccccccccc,ccgg',
      'gMMMmcccccccccccccc,ccccgg',
      'gMMMMccccccccXccccccccccgg',
      'ggccccc,ccccccccccccccccgg',
      'ggc,ccccccccccc,ccccccccgg',
      'ggccccccccc,ccccccccccccgg',
      'ggggggggggggggggggccccgggg',
    ],
    legend: {
      U: { floor: 'moss', h: 5, tint: '#4a6a46' },
      p: { floor: 'cobble', h: 5, stairs: true, tint: '#7a7c74' },
      P: { floor: 'cobble', h: 5, walk: false, tint: '#7a7c74', prop: { type: 'statue_pedestal', params: { stubs: true } } },
      '4': { floor: 'stone', h: 4, stairs: true, tint: '#8a8a82' },
      '3': { floor: 'stone', h: 3, stairs: true, tint: '#86867e' },
      '2': { floor: 'stone', h: 2, stairs: true, tint: '#82827a' },
      '1': { floor: 'stone', h: 1, stairs: true, tint: '#7e7e76' },
      K: { floor: 'rock', h: 5, tint: '#5a5a54' },
      e: { floor: 'moss', h: 4, tint: '#4e6e48' },
      d: { floor: 'moss', h: 3, tint: '#4e6e48' },
      b: { floor: 'moss', h: 2, tint: '#4e6e48' },
      a: { floor: 'moss', h: 1, tint: '#4e6e48' },
      c: { floor: 'cobble', tint: '#74766e' },
      ',': { floor: 'moss', tint: '#56764e' },
      g: { floor: 'grass', tint: '#4a6444' },
      M: { floor: 'stone', wall: 'stone', wallH: 2.8 },
      m: { floor: 'stone', walk: false, prop: { type: 'door', rot: 90, params: { style: 'iron' } } },
      X: { floor: 'cobble', tint: '#3a3a36', tag: 'crack' },
    },
  },
  player: { character: 'c16_yera', at: [19, 21], facing: 135 },
  spawns: { entry: [19, 21] },
  props: [
    { type: 'tree', at: [3, 2], params: { size: 1.4 } },
    { type: 'tree', at: [21, 1], params: { size: 1.5 } },
    { type: 'deadtree', at: [6, 6] },
    { type: 'tree', at: [24, 6] },
    { type: 'jungle_tree', at: [1, 8] },
    { type: 'tree', at: [19, 8] },
    { type: 'spruce', at: [14, 1] },
    { type: 'gravestone', at: [3, 5] },
    { type: 'gravestone', at: [5, 3], params: { shape: 'cross' } },
    { type: 'gravestone', at: [20, 4], params: { broken: true } },
    { type: 'gravestone', at: [22, 8] },
    { type: 'ch17_fox_statue', at: [8, 4] },
    { type: 'ch17_fox_statue', at: [17, 4], params: { broken: true } },
    { type: 'ch17_fox_statue', at: [8, 9], params: { broken: true } },
    { type: 'ch17_fox_statue', at: [17, 9] },
    { type: 'roots', at: [10, 11] },
    { type: 'roots', at: [15, 12] },
    { type: 'roots', at: [12, 10] },
    { type: 'gravestone', at: [3, 18], params: { broken: true } },
    { type: 'gravestone', at: [7, 19] },
    { type: 'gravestone', at: [9, 15], params: { shape: 'cross' } },
    { type: 'gravestone', at: [16, 19] },
    { type: 'gravestone', at: [21, 18], params: { broken: true } },
    { type: 'gravestone', at: [22, 16] },
    { type: 'gravestone', at: [19, 15], params: { shape: 'cross' } },
    { type: 'gravestone', at: [11, 19] },
    { type: 'pillar', at: [6, 17], params: { broken: true } },
    { type: 'pillar', at: [20, 20], params: { broken: true } },
    { type: 'vine_pillar', at: [23, 14], params: { broken: true } },
    { type: 'boulder', at: [2, 15], params: { moss: true } },
    { type: 'mushroom', at: [7, 15], color: '#8fd8a0' },
    { type: 'mushroom', at: [21, 20], color: '#8fd8a0' },
    { type: 'bush', at: [24, 20] },
    { type: 'grass', at: [14, 20] },
  ],
  actors: [{ id: 'tami', character: 'c17_tami_samael', at: [12, 6], pose: 'sit', facing: 0 }],
  stealth: {
    onCaught: async (g) => {
      g.stealth(false)
      hits++
      g.sfx('crack', 0.7)
      g.flash('#a01020', 300)
      g.shake(0.25, 400)
      g.addStrain(0.18)
      g.dropVeil()
      let near: Foe | null = null
      for (const f of foes) if (!near || g.dist(f.id, 'player') < g.dist(near.id, 'player')) near = f
      if (near) {
        g.fx('dust', near.id)
        g.despawn(near.id)
        foes = foes.filter((f) => f !== near)
      }
      if (hits >= 4) {
        await g.fail(l('Vlákna rezali všetko, čoho sa dotkli. Aj ju.', 'The fibres cut everything they touched. Her too.'))
        return
      }
      g.bark('player', hits === 3 ? l('Ešte raz a koniec.', 'Once more and it is over.') : l('Vlákno ju šľahlo cez rameno.', 'A fibre lashed across her shoulder.'))
      g.stealth(true)
    },
  },
  triggers: [
    { id: 'veil', area: [0, 0, 25, 21], when: (g) => !!g.flag('c17.veilDrop') && !g.flag('c17.bossDone'), run: veilGone },
    { id: 'finale', area: [0, 0, 25, 21], when: (g) => !!g.flag('c17.finaleNow') && !g.flag('c17.bossDone'), run: finale },
  ],
  onEnter: async (g) => {
    g.lift('tami', 1)
    g.sai('heavy')
    g.set('c17.veilDrop', false)
    g.set('c17.finaleNow', false)
    g.set('c17.fight', false)
    await g.once('c17.cemetery', () => intro(g))
    if (!g.flag('c17.bossDone')) startFight(g)
  },
  onUpdate: (g, dt) => {
    if (!g.flag('c17.fight') || g.flag('c17.bossDone')) return
    fightT += dt
    // waves
    if (!foes.length) {
      if (wave === 2 && !g.flag('c17.veilDrop')) g.set('c17.veilDrop', true)
      if (wave >= WAVES.length) {
        g.set('c17.finaleNow', true)
        return
      }
      spawnIn -= dt
      if (spawnIn <= 0) {
        spawnWave(g)
        spawnIn = 2
      }
    }
    if (wave >= 3 && (g.strain() > 0.92 || fightT > 140)) g.set('c17.finaleNow', true)
    // the phantoms close in: blind while she is veiled, straight at her when she is not
    stepT -= dt
    if (stepT <= 0) {
      stepT = 0.6
      const [px, py] = g.pos('player')
      for (const f of foes) {
        if (f.frozenUntil > g.time) continue
        const speed = slowed(g, f) ? 0.3 : g.veiled() ? 0.9 : 1.35
        const target: Vec2 = g.veiled() ? [px + Math.round((Math.random() - 0.5) * 5), py + Math.round((Math.random() - 0.5) * 5)] : [px, py]
        if (g.dist(f.id, 'player') > 0.9) void g.walk(f.id, target, { speed })
      }
    }
  },
}
