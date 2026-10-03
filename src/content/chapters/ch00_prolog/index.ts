/**
 * PROLÓG: Ardentia. Soril on her Eltária trial: the demon in the pass, the
 * veil that fails against touch, the raw ice spear, the prayer under the
 * spruce roots, the black forest, and the cleansing of the Mother statue.
 */
import type { AmbienceDef, ChapterDef, SceneDef } from '../../types'
import { l } from '../../../i18n/i18n'

const night: AmbienceDef = {
  sky: { top: '#04050b', bottom: '#151b2e', stars: 0.95, sai: { x: 0.84, y: 0.82, r: 0.07 }, infera: { x: 0.18, y: 0.88 } },
  fog: { color: '#0a0e1a', near: 6, far: 30 },
  hemi: { sky: '#5868a0', ground: '#14121c', intensity: 0.95 },
  sun: { color: '#a8bcff', intensity: 1.25, dir: [-0.45, 1, 0.55] },
  exposure: 1.05,
  bloom: { strength: 0.85, radius: 0.55, threshold: 0.8 },
  grade: { tint: '#dfe6ff', saturation: 0.86, contrast: 1.06, vignette: 0.45 },
  particles: [{ kind: 'motes', count: 70, color: '#bcd0ff' }],
  music: null,
  sounds: ['night', 'wind'],
}

// ---------------------------------------------------------------------------------- slope
const slope: SceneDef = {
  id: 'p_slope',
  name: l('Svah pod sedlom', 'The Slope below the Saddle'),
  ambience: night,
  camera: { zoom: 0.95 },
  map: {
    rows: [
      '      ^^^^^^^^^^^^      ',
      '     ^555555555555^     ',
      '    ^55555555555555^    ',
      '   ^4444444444444444^   ',
      '   44444444444444444    ',
      '  3333333333333333333   ',
      '  33333333333333333333  ',
      '  22222222222222222222  ',
      ' 222222222222222222222  ',
      ' 1111111111111111111111 ',
      ' 1111111111111111111111 ',
      ' ...................... ',
      ' ...,,................. ',
      ' ..,,,,....,,.......... ',
      ' ....w,,.....,,,....... ',
      ' ....ww,,.............. ',
      ' .....ww............... ',
      ' ......ww,,............ ',
      ' ......w,,,......TTTTTT ',
      ' .....ww.,......TTTTTTT ',
      ' .....w.,,,....;;TTTTTT ',
      ' ....ww.,,,,..;;;;TTTTT ',
      ' ....w..,,,;;;;;;;;TTTT ',
      ' ...ww..,;;;;;;;;;;;TTT ',
      ' ...w...;;;;;;;;;;;;;TT ',
      ' ..ww..,;;;;;;;;;;;;;;T ',
      ' ..w...;;;;;;;;;;;;;;;T ',
      ' .ww..;;;;;;;;;;;;;;;;T ',
      ' .w..;;;;;;;;;;;;;;;;;T ',
      ' ww..;;;;;;;;;;;;;;;;TT ',
      ' w..;;;;;;;;;;;;;;;;;TT ',
      'ww..;;;;;;;;;;;;;;;;TTT ',
      'w..;;;;;;;;;;;;;;;;TTTT ',
      '..;;;;;;;;;;;;;;;;TTTTT ',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    legend: {
      '^': { floor: 'rock', h: 5, wall: 'rock', wallH: 1.8 },
      '5': { floor: 'gravel', h: 5, stairs: true },
      '4': { floor: 'gravel', h: 4, stairs: true },
      '3': { floor: 'gravel', h: 3, stairs: true, tint: '#c8c4bc' },
      '2': { floor: 'gravel', h: 2, stairs: true, tint: '#c0c4bc' },
      '1': { floor: 'rock', h: 1, stairs: true },
      '.': { floor: 'gravel', stairs: true },
      ',': { floor: 'moss' },
      ';': { floor: 'grass', tint: '#8a9a88' },
      w: { floor: 'water' },
      T: { floor: 'moss', prop: { type: 'spruce', params: { snow: false } } },
    },
  },
  props: [
    { type: 'log', at: [7, 4], rot: 30 },
    { type: 'rock', at: [6, 4] },
    { type: 'boulder', at: [10, 3] },
    { type: 'boulder', at: [15, 5] },
    { type: 'boulder', at: [4, 8] },
    { type: 'boulder', at: [12, 9] },
    { type: 'boulder', at: [18, 9] },
    { type: 'boulder', at: [9, 12] },
    { type: 'boulder', at: [16, 13] },
    { type: 'boulder', at: [13, 16] },
    { type: 'boulder', at: [19, 15] },
    { type: 'boulder', at: [14, 22] },
    { type: 'boulder', at: [10, 26] },
    { type: 'rock', at: [8, 15] },
    { type: 'rock', at: [3, 12] },
    { type: 'rock', at: [17, 11] },
    { type: 'rock', at: [11, 19] },
    { type: 'spruce', at: [3, 10] },
    { type: 'spruce', at: [20, 12] },
    { type: 'spruce', at: [12, 24] },
    { type: 'spruce', at: [16, 28] },
    { type: 'spruce', at: [6, 31] },
    { type: 'grass', at: [9, 23] },
    { type: 'grass', at: [12, 30] },
    { type: 'reeds', at: [6, 18] },
    { type: 'reeds', at: [4, 23] },
    { type: 'roots', at: [8, 33], solid: false },
    { type: 'deadtree', at: [9, 33], rot: 70 },
  ],
  player: { character: 'soril_young', at: [8, 5], facing: 0 },
  actors: [{ id: 'samael', character: 'samael', at: [12, 1], hidden: true, phantom: { form: 'samael', fibers: 40, reach: 4.2 } }],
  stealth: { failText: l('Vlákna ju našli. Tma ju drží za ruku.', 'The fibers found her. The dark holds her by the hand.') },
  interactables: [
    {
      id: 'fire',
      at: [7, 4],
      label: l('Zahrabaný oheň', 'The buried fire'),
      verb: 'look',
      when: (g) => !g.flag('once.p.intro'),
      run: async (g) => {
        await g.narrate(l('Oheň, ktorý pred chvíľou zahrabala do hliny. Ešte voňal živicou a vyhriatym kameňom.', 'The fire she had buried in the earth a moment ago. It still smelled of resin and warm stone.'))
      },
    },
    {
      id: 'hide',
      at: [8, 32],
      label: l('Vtlačiť sa pod korene', 'Squeeze under the roots'),
      verb: 'use',
      radius: 1.8,
      when: (g) => g.flag('p.stage') === 3,
      once: true,
      run: async (g) => {
        g.set('p.chase', false)
        g.stealth(false)
        g.cinematic(true)
        await g.walk('player', [8, 32])
        g.face('player', 180)
        g.pose('player', 'crouch')
        await g.narrate(l('Pod koreňmi vyvráteného smreka bola štrbina, sotva na jej telo. Vtisla sa dnu chrbtom k zemi, kolená k brade, chvost omotaný okolo členkov.', 'Beneath the roots of an uprooted spruce there was a hollow, barely large enough for her body. She pressed in with her back to the earth, knees to her chin, her tail wound around her ankles.'))
        await g.narrate(l('Vytiahla spod goliera kameň a zovrela ho v dlani, až jej hroty vošli do kože.', 'She drew the stone out from under her collar and closed her fist around it until its points cut into her skin.'))
        g.pose('player', 'pray')
        g.mood('player', 'closed')
        void g.walk('samael', [10, 29], { speed: 1.1 })
        await g.narrate(l('Nemodlila sa za seba. Tak ju to neučili. Slová prišli staré a obrúsené, prosba za príchod toho, kto zostúpil pred El.', 'She did not pray for herself. That was not how she had been taught. The words came old and worn smooth: a plea for the coming of the one who descended before El.'))
        let ok = false
        while (!ok) {
          const r = await g.minigame('breath', {
            beats: 8,
            start: 1,
            bpm: 22,
            title: l('Modlitba bez hlasu', 'A prayer without a voice'),
            subtitle: l('Šepkala ich do päste s kameňom, bez hlasu, jedno za druhým, a keď došli, začala odznova.', 'She whispered them into the fist that held the stone, without a voice, one after another, and when they ran out she began again.'),
          })
          ok = r.success
          if (!ok) await g.narrate(l('Vlákna jej prešli po perách. Začala odznova.', 'The fibers brushed her lips. She began again.'))
        }
        g.fx('glyph', 'player', { color: '#ffffff', scale: 1.6 })
        await g.narrate(l('A závoj bohyne padol na ňu. Línie na predlaktiach pritom nesvietili. Bolo to ťažšie a tichšie než závoj z haiku.', 'And the veil of the goddess fell upon her. The lines on her forearms did not glow. It was heavier and quieter than a veil woven from a haiku.'))
        g.shake(0.25, 800)
        await g.narrate(l('Vlákna zišli do štrbiny. Prešli jej po tvári, po viečkach, jemne, ako keď sa v tme niekto hľadá rukami. Prešli po pästi s kameňom. Zastali.', 'The fibers came down into the hollow. They passed over her face, her eyelids, gently, the way someone feels for another in the dark. They passed over the fist with the stone. They stopped.'))
        await g.narrate(l('Pod smrekom neležala Soril. Ležala tam päsť s kameňom a modlitba bez hlasu.', 'It was not Soril who lay under the spruce. There lay a fist with a stone, and a prayer without a voice.'))
        void g.walk('samael', [12, 2], { speed: 1.5 })
        g.sfx('bass', 0.8)
        await g.wait(1200)
        await g.narrate(l('Bas sa ozval ešte raz, už ďaleko. Tak znie ten, kto sa vracia na svoje miesto.', 'The bass sounded once more, far away now. That is the sound of one who returns to their place.'))
        await g.say('player', l('Stráži. Nepôjde za mnou. A nepustí ma späť.', 'It is guarding. It will not follow me. And it will not let me back.'), { thought: true, mood: 'sad' })
        await g.fade('black', 1600)
        await g.caption(l('Kameň nepustila až do svitania. Bol teplý.', 'She did not let go of the stone until dawn. It was warm.'), { ms: 3600 })
        g.cinematic(false)
        await g.goto('p_forest')
      },
    },
  ],
  triggers: [
    {
      id: 'edge',
      area: [12, 18, 22, 23],
      when: (g) => !!g.flag('p.chase') && !g.flag('p.edge'),
      run: async (g) => {
        g.set('p.edge')
        g.set('p.chase', false)
        g.stealth(false)
        g.hint(null)
        g.teleport('samael', [14, 12])
        g.face('player', 'samael')
        await g.narrate(l('Na okraji lesa sa otočila, hoci nemala.', 'At the edge of the forest she turned, though she should not have.'))
        await g.focus('samael', { ms: 900 })
        await g.narrate(l('Nad korunami kríkov sa to týčilo vyššie, než kam by dočiahla zdvihnutou rukou. Plazili sa po ňom čierne vlákna, tisíce, tenké ako vlasy a živé ako dážďovky.', 'It towered above the bushes, higher than she could have reached with a raised hand. Black fibers crawled over it, thousands, thin as hair and alive as earthworms.'))
        await g.narrate(l('Nízko pri zemi, tam, kde mala byť hlava, sa zabelelo čosi hladké, biele ako vosk. Na ňom dve jamky. V jamkách sa pomaly prelieval prach.', 'Low to the ground, where a head should have been, something smooth showed white, white as wax. On it, two hollows. In the hollows, dust slowly flowed.'))
        g.codex('gloss.prizrak')
        await g.focus('player', { ms: 700 })
        g.follow()
        g.unlock('veil')
        g.objective(l('Utkaj závoj: stlač V a nehýb sa, kým haiku nedoznie.', 'Weave the veil: press V and keep still until the haiku is spoken.'))
        g.hint(l('V — Závoj (haiku). Pohyb kúzlo preruší.', 'V — Veil (haiku). Moving breaks the spell.'))
        g.free()
        await g.until(() => g.veiled())
        g.lock()
        g.hint(null)
        g.codex('gloss.haiku')
        await g.narrate(l('Hi wo keshite. Keď zhasneš oheň, ticho ti odpovedá. Plnšie ako hlas.', 'Hi wo keshite. When you put out the fire, silence answers you. Fuller than a voice.'))
        await g.narrate(l('Svetlo ju obtieklo, tak ako ju to učili v podzemí, a ona stála medzi dvoma kmeňmi a nebola.', 'The light flowed around her, as she had been taught in the vaults beneath the temple, and she stood between two trunks and was not.'))
        await g.narrate(l('Zastalo. Vlákna sa zdvihli z chrbta všetky naraz a rozostúpili sa do vzduchu ako pavučina, ktorú niekto rozprestiera potme.', 'It stopped. The fibers rose from its back all at once and spread through the air like a web someone unfolds in the dark.'))
        await g.narrate(l('Nehľadalo ju očami. Hľadalo ju dotykom.', 'It did not search for her with eyes. It searched for her by touch.'))
        void g.walk('samael', [15, 17], { speed: 1.1 })
        await g.wait(1700)
        g.sfx('crack')
        g.shake(0.2, 300)
        g.dropVeil()
        g.emote('player', '!')
        await g.narrate(l('Prvé ju našlo na zápästí. Pálilo. A závoj bol zrazu len šaty na niekom, koho tma drží za ruku.', 'The first found her at the wrist. It burned. And suddenly the veil was only clothes on someone the dark was holding by the hand.'))
        await g.narrate(l('Vytrhla ruku. Vlákno sa pretrhlo ako horúca niť.', 'She tore her hand free. The fiber snapped like a hot thread.'))
        g.objective(l('Utekaj pozdĺž potoka.', 'Run along the stream.'))
        g.hint(l('Závoj ťa skryje pred očami, nie pred dotykom.', 'The veil hides you from eyes, not from touch.'))
        g.set('p.chase', true)
        g.set('p.stage', 2)
        g.stealth(true)
        g.checkpoint()
      },
    },
    {
      id: 'stream',
      area: [2, 24, 9, 28],
      when: (g) => g.flag('p.stage') === 2,
      run: async (g) => {
        g.set('p.chase', false)
        g.stealth(false)
        g.hint(null)
        g.teleport('samael', [10, 19])
        g.face('player', 'samael')
        await g.narrate(l('Mu-hi. Bez ohňa.', 'Mu-hi. Without fire.'))
        await g.narrate(l('Haiku bolo pomalé a bezpečné a Matka ho napísala tak, aby chránilo tú, čo ho hovorí. Na toto nebolo.', 'The haiku was slow and safe, and the Mother wrote it to protect the one who speaks it. It was not meant for this.'))
        g.unlock('ice')
        g.objective(l('Surové kúzlo: drž Ctrl a stlač 1. Bez haiku je okamžité, ale zaplatíš.', 'Raw cast: hold Ctrl and press 1. Without the haiku it is instant, but you will pay.'))
        g.hint(l('Ctrl + 1 — Ľad bez haiku', 'Ctrl + 1 — Ice without the haiku'))
        g.free()
        let cast = false
        const off = g.onCast((e) => {
          if (e.id === 'ice') cast = true
        })
        void g.walk('samael', [8, 23], { speed: 0.8 })
        await g.until(() => cast)
        off()
        g.lock()
        g.hint(null)
        g.face('player', 'samael')
        await g.narrate(l('Ponorila ľavú ruku do prúdu a vzala z vody všetko teplo, čo v nej bolo, naraz, od stredu. Pod jej dlaňou vyrástol ľad, do hrotu dlhého ako kopija.', 'She plunged her left hand into the current and took all the warmth the water held, at once, from the centre. Beneath her palm ice grew into a point as long as a spear.'))
        g.fx('frost', 'samael', { scale: 3 })
        g.sfx('crack')
        g.flash('#e8f4ff', 400)
        g.shake(0.45, 600)
        await g.narrate(l('Zvuk bol suchý a obrovský, ako keď vo veži chrámu praskne zvon. Biele sa rozštiepilo od jamky nadol.', 'The sound was dry and enormous, like a bell cracking in a temple tower. The white split from one hollow downwards.'))
        await g.narrate(l('Nezakričalo. Z trhliny sa vyvalilo čierne, vlákna namiesto krvi, a hneď sa začali splietať späť do rany.', 'It did not scream. Black poured from the crack, fibers instead of blood, and at once they began weaving themselves back into the wound.'))
        g.addStrain(0.55)
        g.sfx('bass', 0.9)
        await g.say('player', l('Ľavú ruku necítim po lakeť. Bez haiku platíš ty.', 'I cannot feel my left arm up to the elbow. Without the haiku, you pay.'), { thought: true, mood: 'pain' })
        g.codex('gloss.spira')
        g.objective(l('Nájdi úkryt pri okraji lesa.', 'Find a hiding place at the edge of the forest.'))
        g.set('p.chase', true)
        g.set('p.stage', 3)
        g.stealth(true)
        g.checkpoint()
      },
    },
  ],
  onEnter: async (g) => {
    await g.once('p.intro', async () => {
      g.cinematic(true)
      g.stealth(false)
      await g.wait(700)
      await g.narrate(l('Vzduch prestal voňať.', 'The air stopped smelling.'))
      await g.narrate(l('Na svahu pod sedlom, v noci na konci Shū, siahol Sorilin nos do tmy a vrátil sa prázdny. Ten istý nos, čo v chrámových záhradách v Nyau rozoznal tri druhy kadidla na tridsať krokov.', 'On the slope below the saddle, on a night at the end of Shū, Soril’s nose reached into the darkness and came back empty. The same nose that could tell three kinds of incense apart at thirty paces in the temple gardens of Nyau.'))
      void g.atmosphere({ sounds: ['wind'] }, 300)
      await g.narrate(l('Potom stíchli cvrčky. Všetky naraz, ako stíchne chrám, keď kňažka pri oltári zdvihne ruku.', 'Then the crickets fell silent. All at once, the way a temple falls silent when the priestess at the altar raises her hand.'))
      g.emote('player', '…')
      await g.say('player', l('Kto sa priblíži, ten ho aj zobudí.', 'Whoever comes near wakes it.'), { thought: true, mood: 'fear' })
      g.sfx('bass')
      g.shake(0.35, 900)
      await g.wait(1100)
      g.sfx('bass')
      g.shake(0.5, 1100)
      g.show('samael', true)
      g.music('black_dust', 600)
      await g.focus('samael', { ms: 1500, zoom: 0.85 })
      await g.narrate(l('Úder. Jeden, hlboký, taký, čo nejde cez uši, ale cez zuby a kolená. A potom zvuk, na ktorý nemala slovo: bas, taký nízky, že ho telo počulo skôr než hlava.', 'A blow. One, deep, the kind that goes not through the ears but through the teeth and knees. And then a sound she had no word for: a bass so low the body heard it before the mind.'))
      await g.focus('player', { ms: 800, zoom: 1 })
      g.follow()
      await g.narrate(l('Bežala.', 'She ran.'))
      g.cinematic(false)
    })
    if (!g.flag('p.stage')) {
      g.set('p.stage', 1)
      g.set('p.chase', true)
      g.objective(l('Zbehni dolu svahom k okraju lesa.', 'Run down the slope to the edge of the forest.'))
      g.hint(l('Drž Shift a bež. Nedovoľ vláknam, aby sa ťa dotkli.', 'Hold Shift to run. Don’t let the fibers touch you.'))
      g.checkpoint()
    }
    g.music('black_dust')
    if (g.flag('p.chase')) g.stealth(true)
    else g.stealth(false)
  },
  onUpdate: (g, dt) => {
    if (!g.flag('p.chase')) return
    chaseTimer -= dt
    if (chaseTimer <= 0) {
      chaseTimer = 0.9
      const stage = Number(g.flag('p.stage')) || 1
      if (g.dist('samael', 'player') > 1.2) void g.walk('samael', 'player', { speed: stage === 1 ? 2.2 : 2.5 })
    }
  },
}

let chaseTimer = 0

// ---------------------------------------------------------------------------------- black forest
const morning: AmbienceDef = {
  sky: { top: '#5a5f6a', bottom: '#8f9298', stars: 0 },
  fog: { color: '#7e8288', near: 4, far: 26 },
  hemi: { sky: '#b8bcc8', ground: '#3a3634', intensity: 1.15 },
  sun: { color: '#e6e2da', intensity: 0.9, dir: [0.3, 1, 0.6], shadows: true },
  exposure: 1.0,
  bloom: { strength: 0.5, threshold: 0.86 },
  grade: { tint: '#e8e8ea', saturation: 0.62, contrast: 1.08, vignette: 0.42 },
  particles: [{ kind: 'ash', count: 120, color: '#4a4644' }],
  music: 'null_void',
  sounds: ['wind', 'drone'],
}

const forest: SceneDef = {
  id: 'p_forest',
  name: l('Čierny les', 'The Black Forest'),
  ambience: morning,
  map: {
    rows: [
      '..........................  ',
      '.,,,,,,,......,,,,,,,,,,,.  ',
      '.,BBBBBBBBBBBBBBBBBBBBB,,.  ',
      '.,BBBBBBBBBBBBBBBBBBBBBB,.  ',
      '.,BBBBBBBBBBBBBBBBBBBBBB,.  ',
      '.,BBBBBBBBBBBBBBBBBBBBBB,,. ',
      '.,BBBBBBBBBBXBBBBBBBBBBBB,. ',
      '.,BBBBBBBBBBBBBBBBBBBBBBB,. ',
      '.,BBBBBBBBBBBBBBBBBBBBBBB,. ',
      '.,BBBBBBBBBBBBBBBBBBBBBB,,. ',
      '.,,BBBBBBBBBBBBBBBBBBBBB,.. ',
      '..,,BBBBBBBBBBBBBBBBBBB,,.. ',
      ' ..,,,BBBBBBBBBBBBBBBB,,... ',
      '  ...,,,,,,,,,,,,,,,,,,.... ',
      '   ......................   ',
      '    ..rrrrrrr......rrr..    ',
      '      rrrrrrr..EE..rrr      ',
    ],
    legend: {
      '.': { floor: 'gravel' },
      ',': { floor: 'moss', tint: '#a8a890' },
      B: { floor: 'ash', prop: { type: 'spruce', params: { black: true } } },
      X: { floor: 'ash', tag: 'curse' },
      r: { floor: 'rock', wall: 'rock', wallH: 1.4 },
      E: { floor: 'gravel', tag: 'exit' },
    },
  },
  props: [
    { type: 'deadtree', at: [12, 6], scale: 3.2, color: '#0a090c', id: 'cursetree' },
    { type: 'veins', at: [11, 7], scale: 3 },
    { type: 'veins', at: [13, 5], scale: 2.4 },
  ],
  player: { character: 'soril_young', at: [1, 0], facing: 0 },
  interactables: [
    {
      id: 'view',
      at: [24, 7],
      label: l('Pozrieť do stredu lesa', 'Look into the heart of the forest'),
      verb: 'look',
      radius: 2.2,
      run: async (g) => {
        await g.focus('curse', { ms: 1200, zoom: 0.8 })
        await g.narrate(l('V strede stál strom, ktorý nebol strom. Vyšší než les, čierny od koreňa po vrchol, a okolité kmene doň vrastali, naklonené, ako prsty do päste.', 'At the centre stood a tree that was not a tree. Taller than the forest, black from root to crown, and the trunks around it grew into it, leaning, like fingers into a fist.'))
        await g.narrate(l('Kliatba. Slovo nevolila. Prišlo samé, zo stránok, ktoré sa smeli čítať len pri jednej sviečke.', 'A curse. She did not choose the word. It came by itself, from pages that could only be read by a single candle.'))
        g.shake(0.08, 1500)
        await g.narrate(l('Tlak šiel z toho miesta až sem: ťažoba v zuboch a v spánkoch, v kosti pod Znakom El, a pod tým šepot bez slov. Nevolal ju. Čakal.', 'The pressure reached all the way here: a weight in her teeth and temples, in the bone beneath the Sign of El, and under it a whisper without words. It was not calling her. It was waiting.'))
        g.follow()
        await g.zoom(1, 700)
        g.set('p.sawCurse')
      },
    },
    {
      id: 'bark',
      at: [2, 11],
      label: l('Hnedá kôra na okraji', 'Brown bark at the edge'),
      radius: 1.8,
      run: async (g) => {
        await g.narrate(l('Na okraji mali kmene ešte hnedú kôru. Čím bližšie k stredu, tým boli čiernejšie, nasiaknuté ako drevo starým olejom, a všetky sa nakláňali jedným smerom. Dnu.', 'At the edge the trunks still had brown bark. The closer to the centre, the blacker they were, soaked like wood in old oil, and all of them leaned one way. Inwards.'))
      },
    },
  ],
  exits: [
    {
      area: [15, 16, 16, 16],
      to: 'p_ardentia',
      when: (g) => !!g.flag('p.sawCurse'),
      blocked: l('Najprv sa musím pozrieť, čo je v strede.', 'First I have to see what lies at the centre.'),
    },
  ],
  onEnter: async (g) => {
    await g.once('p.morning', async () => {
      await g.narrate(l('Ráno bolo sivé a bez vtákov.', 'The morning was grey and without birds.'))
      await g.narrate(l('Z úbočia bolo vidieť, kam ju skúška posiela. Les pod ňou nebol les.', 'From the hillside she could see where the trial was sending her. The forest below her was not a forest.'))
      g.objective(l('Obíď čierny les po okraji. Do lesa nevstupuj.', 'Go around the black forest along its edge. Do not enter it.'))
    })
  },
}

// ---------------------------------------------------------------------------------- Ardentia
const ardentiaAmb: AmbienceDef = {
  sky: { top: '#3a3f4c', bottom: '#6a6e78', stars: 0 },
  fog: { color: '#4a4e58', near: 5, far: 28 },
  hemi: { sky: '#9aa2b8', ground: '#2a2826', intensity: 1.0 },
  sun: { color: '#d8d4cc', intensity: 0.8, dir: [-0.3, 1, 0.5] },
  bloom: { strength: 0.75, threshold: 0.82 },
  grade: { tint: '#e2e4ea', saturation: 0.7, contrast: 1.05, vignette: 0.5 },
  particles: [{ kind: 'dust', count: 90, color: '#a8a49c' }],
  music: 'temple',
  sounds: ['wind', 'cave'],
}

const ardentia: SceneDef = {
  id: 'p_ardentia',
  name: l('Ardentia', 'Ardentia'),
  ambience: ardentiaAmb,
  map: {
    rows: [
      '        ##########          ',
      '        #mmmmmmmm#          ',
      '        #mmmmmmmm#          ',
      '        #mmmmmmmm#          ',
      '        #mmmmmmmm#          ',
      '        #mmmmmmmm#          ',
      '        ####dd####          ',
      ' HHH  HHH  cccc  HHH  HHH   ',
      ' HHH  HHH  cccc  HHH  HHH   ',
      ' ..........cccc..........   ',
      ' HHH  HHH  cccc  HHH  HHH   ',
      ' HHH  HHH  cccc  HHH  HHH   ',
      '      ...  cccc  ...        ',
      ' HHH  HHH  cccc  HHH  HHH   ',
      ' HHH  HHH  cccc  HHH  HHH   ',
      '           cccc             ',
      '           cccc             ',
      '           cEEc             ',
    ],
    legend: {
      '#': { floor: 'stone', wall: 'stone', wallH: 2.6 },
      m: { floor: 'stone', tint: '#9a968e' },
      d: { floor: 'stone', tag: 'door' },
      H: { floor: 'stone', wall: 'stone', wallH: 2.2 },
      c: { floor: 'cobble' },
      '.': { floor: 'cobble', tint: '#8a8a80' },
      E: { floor: 'cobble', tag: 'entry' },
    },
  },
  props: [
    { type: 'mother_statue', at: [12, 2], rot: 0, params: { black: 1 }, id: 'statue_black' },
    { type: 'mother_statue', at: [12, 2], rot: 0, params: { black: 0 }, id: 'statue_clean', hidden: true },
    { type: 'mosaic', at: [15, 1], rot: -90, params: { black: true } },
    { type: 'names_wall', at: [9, 4], rot: 90 },
    { type: 'mushroom', at: [12, 12] },
    { type: 'mushroom', at: [3, 9] },
    { type: 'mushroom', at: [22, 9] },
    { type: 'rock', at: [7, 12] },
    { type: 'dustpile', at: [11, 3] },
  ],
  player: { character: 'soril_young', at: [12, 16], facing: 180 },
  interactables: [
    {
      id: 'frame',
      at: [12, 7],
      label: l('Rám dverí', 'The door frame'),
      run: async (g) => {
        await g.narrate(l('Chrám El v Nyau bolo vidieť z mora, bielu kupolu na najvyššom bode mesta. Tento sa od domov nedal rozoznať. Len rám dverí iný: žena s roztiahnutými rukami, vyrytá plytko a dažďami vyhladená.', 'The Temple of El in Nyau could be seen from the sea, a white dome on the highest point of the city. This one could not be told from the houses. Only the door frame was different: a woman with outstretched arms, carved shallowly and smoothed by rain.'))
      },
    },
    {
      id: 'names',
      at: [10, 4],
      label: l('Mená vyškrabané do kameňa', 'Names scratched into the stone'),
      run: async (g) => {
        await g.narrate(l('Pri vchode boli do kameňa vyškrabané mená, jedno pod druhým, rôznymi rukami, v písme, aké poznala len z okrajov strán v knihe pod chrámom.', 'By the entrance names were scratched into the stone, one below another, by different hands, in a script she knew only from the margins of the book beneath the temple.'))
        await g.narrate(l('Najnižšie boli ešte ostré. Najvyššie už dotyky vyhladili tak, že z nich zostali len ryhy pod prstom. Pri samom ráme jedno hlbšie a staršie ako ostatné.', 'The lowest were still sharp. The highest had been worn by touch until only grooves remained beneath the finger. By the frame itself, one deeper and older than the rest.'))
        g.codex('gloss.eltaria')
        g.set('p.names')
      },
    },
    {
      id: 'mosaic',
      at: [15, 2],
      label: l('Mozaika na bočnom múre', 'The mosaic on the side wall'),
      run: async (g) => {
        await g.narrate(l('V Nyau visel tento výjav nad oltárom: Tenši s kopijou a pod ním padlý. Víťazstvo Svetla nad Démonom.', 'In Nyau this scene hung above the altar: Tenši with a spear and the fallen one beneath. The victory of Light over the Demon.'))
        await g.narrate(l('Tu malo Tenši krídla čierne.', 'Here Tenši had black wings.'))
        g.mood('player', 'surprised')
        await g.narrate(l('Kamienky vybrané a uložené jeden k druhému niekým, kto vedel, akú farbu kladie. Soril sa na ne dívala dlhšie, než sa smelo. Potom sklopila oči.', 'Every tessera chosen and set beside the next by someone who knew what colour they were laying. Soril looked at them longer than was allowed. Then she lowered her eyes.'))
        g.mood('player', 'neutral')
        g.set('p.mosaic')
      },
    },
    {
      id: 'statue',
      at: [12, 3],
      label: l('Matka', 'The Mother'),
      verb: 'cast',
      radius: 1.8,
      when: (g) => !g.flag('p.cleansed'),
      run: async (g) => {
        g.cinematic(true)
        await g.walk('player', [12, 4])
        g.face('player', [12, 2])
        await g.narrate(l('Táto žena kľačala sama. Skala ju vydala zo seba bez jedinej škáry. Ruky mala rozprestreté a dlane otvorené nahor, tak ako sa podáva chlieb.', 'This woman knelt alone. The rock had given her up without a single seam. Her arms were spread and her palms open upwards, the way one offers bread.'))
        await g.narrate(l('A po Matke sa rozliezala čierna. Nie ako špina, čo sadne na kameň. Ako vred, čo sa rozlieza pod kožou.', 'And over the Mother the black was spreading. Not like dirt that settles on stone. Like a sore that spreads beneath the skin.'))
        await g.say('player', l('Tu ležal. Pri jej nohách. A čo po sebe nechal, žerie Matku.', 'He lay here. At her feet. And what he left behind is eating the Mother.'), { thought: true })
        g.pose('player', 'kneel')
        await g.narrate(l('Čierneho sa nedotýkaj, učili ju v Nyau skôr, než vedela čítať. Prsty jej zastali nad kameňom.', 'Do not touch the black, they taught her in Nyau before she could read. Her fingers stopped above the stone.'))
        await g.narrate(l('Piaty element sa v Nyau nahlas nevyslovoval. Stará Eltária jej ho ukázala jediný raz, pri zhasnutej sviečke: farbu, ktorú nevidno, kým nezhasne všetko ostatné.', 'In Nyau the fifth element was never spoken aloud. The old Eltária had shown it to her only once, by a snuffed candle: a colour you cannot see until everything else goes out.'))
        let ok = false
        while (!ok) {
          const r = await g.minigame('focus', {
            difficulty: 2,
            duration: 12,
            title: l('Sora · Ustúp', 'Sora · Withdraw'),
            subtitle: l('Bez haiku a bez verša povedala čiernej, čo má urobiť.', 'Without a haiku and without a verse, she told the black what it must do.'),
            thoughts: [l('strach', 'fear'), l('domov', 'home'), l('jeho tvár', 'his face'), l('Démon', 'Demon'), l('Nyau', 'Nyau')],
          })
          ok = r.success
          if (!ok) await g.narrate(l('Pulz pod dlažbou zaváhal, a potom sa vrátil. Skúsila to znova.', 'The pulse beneath the floor faltered, then returned. She tried again.'))
        }
        g.fx('sora', [12, 2], { scale: 3 })
        g.flash('#b77dff', 600)
        await g.wait(500)
        g.propVisible('statue_black', false)
        g.propVisible('statue_clean', true)
        g.codex('gloss.pentagram')
        await g.narrate(l('Ustúp.', 'Withdraw.'))
        await g.narrate(l('Čierna sa zastavila. Chvíľu stála a počúvala. Potom sa pohla späť, zo zápästí, z dlaní, z rúcha, ako voda, čo sa vsakuje do piesku.', 'The black stopped. For a moment it stood and listened. Then it drew back, from the wrists, from the palms, from the robe, like water sinking into sand.'))
        g.addStrain(0.4)
        await g.narrate(l('Z nosa jej kvapla krv. Jedna kvapka, druhá, na skalu medzi jej dlane. Ľavá dlaň, tá, čo v potoku vzala vode teplo, teraz na kameni hriala.', 'Blood dripped from her nose. One drop, a second, onto the rock between her palms. Her left palm, the one that had taken the warmth from the stream, was warm now on the stone.'))
        await g.narrate(l('Keď zdvihla hlavu, socha bola čistá. Matkina tvár sa skláňala k miestu, kde Soril kľačala.', 'When she raised her head, the statue was clean. The Mother’s face bent towards the place where Soril knelt.'))
        await g.caption(l('Skúška bola skončená.', 'The trial was over.'), { ms: 2600 })
        g.set('p.cleansed')
        g.pose('player', 'stand')
        g.cinematic(false)
        g.objective(l('Nakresli do prachu, čo si videla.', 'Draw in the dust what you saw.'))
      },
    },
    {
      id: 'dust',
      at: [11, 3],
      label: l('Prach pri Matkiných kolenách', 'The dust at the Mother’s knees'),
      verb: 'use',
      when: (g) => !!g.flag('p.cleansed'),
      once: true,
      run: async (g) => {
        g.pose('player', 'kneel')
        await g.narrate(l('Pri Matkiných kolenách ležal prach, obyčajný a sivý. Soril doň prstom nakreslila, čo videla, aby ruka nezabudla, kým dôjde domov: kríky a nad nimi vlákna, dve jamky.', 'At the Mother’s knees lay dust, ordinary and grey. With a finger Soril drew in it what she had seen, so that her hand would not forget before she reached home: bushes and fibers above them, two hollows.'))
        const c = await g.choose([
          { id: 'face', text: l('Dokresliť tvár.', 'Draw in a face.') },
          { id: 'no', text: l('Nedovoliť ruke dokresliť tvár.', 'Do not let the hand draw a face.') },
        ])
        if (c === 'face') {
          await g.narrate(l('Ruka tam chcela dokresliť tvár. Prst sa zastavil nad prachom a triasol sa. Nedovolila mu to.', 'Her hand wanted to draw a face there. The finger stopped above the dust and trembled. She did not allow it.'))
        } else {
          await g.narrate(l('Okolo jamiek to biele, hladké, bez jedinej čiary. Chvíľu nad ním držala prst. Nedovolila mu to.', 'Around the hollows, the white, smooth, without a single line. For a moment she held her finger above it. She did not allow it.'))
        }
        g.sfx('bass')
        g.shake(0.3, 1400)
        g.fx('dust', [11, 3])
        await g.narrate(l('Z priesmyku sa ozval bas. Raz, dlho, bez nádychu. Prach na dlažbe sa zachvel a kresba sa rozsypala.', 'From the pass came the bass. Once, long, without drawing breath. The dust on the floor trembled and the drawing crumbled away.'))
        await g.fade('black', 1800)
        await g.caption(l('Démon žil. A strážil cestu domov.', 'The demon lived. And it guarded the way home.'), { ms: 3800 })
        g.codex('world.ardentia')
        await g.endChapter()
      },
    },
  ],
  onEnter: async (g) => {
    await g.once('p.ardentia', async () => {
      await g.narrate(l('Ardentia ležala za lesom v úžľabine: kamenné domy s plochými strechami a prázdnymi oknami, rad za radom, huby v dlažbe.', 'Ardentia lay beyond the forest in a gorge: stone houses with flat roofs and empty windows, row after row, mushrooms in the paving.'))
      await g.narrate(l('Nikto ju tu nečakal, a predsa kráčala ulicou tak, ako sa kráča chrámom pri modlitbe, a pri každom kroku čakala pohyb.', 'No one was waiting for her here, and yet she walked the street the way one walks a temple at prayer, and at every step she expected movement.'))
      g.objective(l('Nájdi chrám Matky.', 'Find the Mother’s temple.'))
    })
  },
}

const chapter: ChapterDef = {
  id: 'ch00',
  index: 0,
  title: l('Prológ', 'Prologue'),
  subtitle: l('Ardentia', 'Ardentia'),
  pov: 'soril_young',
  scenes: [slope, forest, ardentia],
  start: 'p_slope',
  abilities: [],
}

export default chapter
