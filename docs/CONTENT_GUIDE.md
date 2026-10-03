# Content Guide

This is how chapters of *Null Void Saga I: Eltária* are written. A chapter is a TypeScript module in
`src/content/chapters/<id>_<slug>/index.ts` that `export default`s a `ChapterDef`. The game finds chapters
automatically with `import.meta.glob`, so you never edit a registry. **The reference chapter is
`src/content/chapters/ch00_prolog/index.ts`. Read it first and copy its patterns.**

## 1. Golden rules

1. **Every player-facing string is bilingual**: `l('Slovenský text', 'English text')`. Slovak is the novel's
   language. Write natural Slovak with correct diacritics, and literary English. Quote or closely paraphrase
   the novel where it shines. Keep lines short (one to three sentences) because they appear in a dialogue box.
2. **Follow the book.** Read your chapters in the manuscript
   (`/root/.claude/uploads/866b1f4e-8798-5961-aa16-709718ee3bb6/8860dc74-E1.md`, chapter headings start with
   `# Kapitola`). Keep the events, characters, places and tone. Compress, but do not invent major plot.
   Small connective gameplay (a guard to sneak past, a lantern to light) is fine.
3. **Narrative adventure.** Pacing: explore → talk → one or two mechanics per scene → cinematic beat. No
   grinding, no inventory puzzles. Every scene must be completable, and it must fail softly: stealth failure
   retries from the last `g.checkpoint()`.
4. **Idempotent `onEnter`.** `onEnter` runs on every load, including loading a save. Wrap one-time
   cinematics in `await g.once('key', async () => { ... })`. Re-derive scene state from flags:
   `if (g.flag('x')) g.propVisible('door', false)`.
5. **Flag names** are prefixed with your chapter: `c3.metArkot`, `c5.bookOpened`.
6. Use `g.checkpoint()` right before each gameplay challenge so a failure retries from there.
7. End every chapter with `await g.endChapter()` (after a closing cinematic). Change scenes inside a
   chapter with `await g.goto('scene_id', 'spawnName')`, or with an `exits` entry.
8. `npx tsc --noEmit` and `npx eslint src/content` must pass. No `any`.

## 2. Chapter & scene structure

```ts
import type { AmbienceDef, ChapterDef, SceneDef } from '../../types'
import { l } from '../../../i18n/i18n'

const scene: SceneDef = {
  id: 'c3_garden',                       // unique across the game, prefix with your chapter
  name: l('Záhrada za starým kanálom', 'The Garden beyond the Old Canal'),
  ambience: { ... },                     // sky, light, fog, bloom, grading, particles, music, sounds
  map: { rows: [...], legend: {...} },
  player: { character: 'yera_temple', at: [5, 8], facing: 0 },
  spawns: { gate: [2, 9] },              // named spawn points for goto/exits
  actors: [ { id: 'arkot', character: 'arkot', at: [9, 4], talk: async (g) => { ... } } ],
  props: [ { type: 'lantern', at: [6, 6] } ],
  interactables: [ { id: 'tree', at: [4, 4], label: l('Strom', 'Tree'), run: async (g) => { ... } } ],
  triggers: [ { id: 'meet', area: [8, 2, 10, 5], run: async (g) => { ... } } ],
  exits: [ { area: [0, 9, 0, 10], to: 'c3_streets', spawn: 'garden' } ],
  sai: { cycle: 90 },                    // optional Sai light/heavy cycle (seconds), or { phase: 'light' }
  onEnter: async (g) => { ... },
  onUpdate: (g, dt) => { ... },          // optional per-frame logic (chases, timers)
}

const chapter: ChapterDef = {
  id: 'ch03', index: 3,
  title: l('Kapitola 3', 'Chapter 3'), subtitle: l('Polnoc', 'Midnight'),
  pov: 'yera_temple',
  epigraph: { text: l('…', '…'), source: l('Kniha El 2:16', 'The Book of El 2:16') },
  abilities: ['flow'],                   // abilities of the POV at chapter start (chapter select uses this)
  flags: { 'c2.done': true },            // story flags assumed when starting here from chapter select
  codex: [ /* extra CodexEntry objects introduced by this chapter */ ],
  scenes: [scene],
  start: 'c3_garden',
}
export default chapter
```

### Maps (ASCII)

* `rows`: every row has the same length. `' '` = nothing (void: diorama edge). Every other character must
  be in `legend`.
* Grid `[x, y]` = `[column, row]`. **Isometric orientation:** row 0 is the far/top corner of the screen,
  the last row and last column are closest to the camera. Put tall walls on the top and left edges.
  Walls standing between camera and player are cut away automatically, but open fronts read best.
* `TileSpec`: `floor` (stone, cobble, marble, white, grass, moss, dirt, mud, sand, blacksand, gravel, snow,
  ice, wood, deck, metal, roof, tile, carpet, rock, obsidian, ash, andesite, water, deep, canal, lava, void,
  dream), `h` level (each = 0.5 units; characters step ±1 level only on `stairs: true` cells), `wall` +
  `wallH` (stone, white, marble, brick, wood, plank, metal, iron, rust, obsidian, rock, andesite, hedge, ice,
  glass, dream), `prop` (a prop on every such cell), `tag` (named cell: `g.cell('altar')`), `tint`, `side`,
  `walk` (force), `leap` (gap crossable only in Sai's light hour).
* Liquids (`water`, `canal` with bioluminescent glints, `deep`, `lava`) are not walkable. The player's
  **Ice** turns nearby water walkable for 30 s.
* Keep maps small and dense: about 16–34 × 14–36. Big empty spaces look poor in isometric view.
* Buildings: a block of `wall` cells (or raised `h` floors with `floor: 'roof', side: 'white'`).
* Interiors: floor cells surrounded by walls on the top/left, open toward the camera.

### Props

Place props with `props: [{ type, at, rot?, scale?, color?, y?, offset?, params?, id?, hidden?, solid? }]`.
`rot` is in degrees. Use `id` to toggle them with `g.propVisible(id, bool)`. See the prop catalogue in §6.

### Actors

`{ id, character, at, facing?, pose?, talk?, label?, behavior?, guard?, phantom?, hidden?, scale? }`

* `character` is a cast id (§5). `facing` in degrees: 0 = toward the camera, 90 = screen right,
  180 = away, 270 = screen left. Usually you call `g.face('arkot', 'player')` instead.
* `talk`: a script run when the player talks to the actor.
* `guard`: `{ patrol: [[x,y]...], pause, range, fov, sweep, blindWhen: (g) => bool }`. A vision cone is
  drawn on the ground. The veil hides the player from guards.
* `phantom`: `{ form: 'crawler'|'humanoid'|'wall'|'listener'|'watcher'|'samael', fibers, reach, roam: [x0,y0,x1,y1], patrol, speed }`.
  Phantoms are blind and search with fibers. A fiber touch finds the player even when veiled.
  `character: 'phantom'` (or `'samael'`).
* If a scene has guards or phantoms, stealth arms automatically. Use `g.stealth(false)` during cinematics
  and `g.stealth(true)` after.

### Ambience presets

Copy and adapt. Every field is used:

```ts
const night: AmbienceDef = {
  sky: { top: '#04050b', bottom: '#151b2e', stars: 0.95, sai: { x: 0.84, y: 0.82, r: 0.07 }, infera: { x: 0.18, y: 0.88 } },
  fog: { color: '#0a0e1a', near: 6, far: 30 },
  hemi: { sky: '#5868a0', ground: '#14121c', intensity: 0.95 },
  sun: { color: '#a8bcff', intensity: 1.25, dir: [-0.45, 1, 0.55] },   // moonlight
  bloom: { strength: 0.85, threshold: 0.8 },
  grade: { tint: '#dfe6ff', saturation: 0.86, contrast: 1.06, vignette: 0.45 },
  particles: [{ kind: 'motes', count: 70, color: '#bcd0ff' }],
  music: 'null_void', sounds: ['night', 'wind'],
}
```

* Day in Nyau: warm sun `#ffe8c8` (intensity 2.2), hemi sky `#bcd4ff` / ground `#6a5a48` (1.2), fog
  `#cfe0ee` 18/60, saturation 1.05, low vignette.
* Festival night: dark violet sky, `particles: [{ kind: 'lanterns', count: 50 }]`, warm point lights from
  lantern props, bloom 1.0.
* Interiors: no sun (`sun` omitted), hemi 0.6–0.9, warm props with lights.
* `particles` kinds: dust, motes, fireflies, lanterns, rain, snow, embers, ash, blackdust (`at` +
  `radius`), leaves, petals, spores, bubbles, steam, clouds, stars.
* `music`: main_menu, black_dust (phantoms/Samael), dungeon_water (vaults, Metaru), epic_boss_fight,
  iron_army (Hel), main (main theme / journeys), medley (flight), moss (Kitsune, nature), null_void (dark
  ruins), space_theme (Infera, ending), temple (Nyau temple, Ardentia), combat_epic_1/2 (Nyau / chases),
  combat_action_1/2 (action).
* `sounds`: wind, storm, rain, sea, water, crowd, fire, forest, night, drone, hum, machine, cave, void.

## 3. The script API (`g`)

All methods are documented in `src/game/GameAPI.ts`. The ones you will use most:

| Purpose | Call |
|---|---|
| Dialogue line | `await g.say('arkot', l('…','…'), { mood: 'happy' })`, where `who` is an actor id, `'player'`, or a cast id not in the scene |
| Inner thought | `await g.say('player', l(…), { thought: true })` |
| Narration (book prose) | `await g.narrate(l(…))` |
| Choice | `const c = await g.choose([{ id: 'a', text: l(…) }, { id: 'b', text: l(…), when: g.flag('x') === true }])` |
| Bubble (non-blocking) | `g.bark('guard', l('Stoj!', 'Halt!'))` |
| Big centred text | `await g.caption(l('O tri dni neskôr…','Three days later…'))` |
| Objective | `g.objective(l(…))`, `g.objective(null)` |
| Codex | `g.codex('gloss.spira')` (ids in `src/content/codex.ts` or your chapter's `codex`) |
| Document | `await g.read(l('Kniha El','The Book of El'), l(…), { style: 'book' })` |
| Flags | `g.flag('c3.x')`, `g.set('c3.x')`, `g.inc('c3.n')`, `await g.once('c3.intro', async () => {…})` |
| Relationship | `g.rel('arkot', 1)`, which shapes epilogue lines. Characters: arkot, flint, soril, nira, tami, saburo, felix |
| Move | `await g.walk('arkot', [5, 4])`, `g.teleport(...)`, `g.face('arkot', 'player')`, `g.pose('yera', 'kneel')` |
| Expression | `g.mood('player', 'sad')`, where moods are neutral, happy, sad, angry, surprised, fear, pain, determined, tender, closed, blank |
| Emote | `g.emote('arkot', '!')`, one of `!`, `?`, `…`, `♪`, `💢`, `💧` |
| Spawn/despawn | `g.spawn({ id, character, at })`, `g.despawn(id)`, `g.show(id, false)`, `g.costume('player', 'yera')` |
| Camera | `await g.focus('arkot', { zoom: 1.2 })`, `g.follow()`, `g.shake()`, `await g.zoom(0.8)`, `g.cinematic(true)` |
| Time | `await g.wait(800)`, `await g.until(() => cond)` |
| Gameplay inside a script | `g.free()` gives control back while the script waits (e.g. `await g.until(() => g.veiled())`), then `g.lock()` |
| Screen | `await g.fade('black')`, `await g.fade('clear')`, `g.flash('#b77dff')` |
| Flow | `await g.goto('scene', 'spawn')`, `await g.endChapter()`, `g.checkpoint()`, `await g.fail(l(…))` |
| Atmosphere | `await g.atmosphere({ hemi: {...}, fog: {...}, sky: {...}, music, sounds }, 2000)`, `await g.eclipse(1, 3000)` |
| Audio | `g.music('temple')`, `g.sfx('bell')`. SFX: click, success, fail, glyph, chime, water, ice, crack, fire, whoosh, tick, heartbeat, page, bell, boom, bass (Samael), veil, door, shot, coil, alert |
| Spira | `g.unlock('veil')`, `g.hasAbility('ice')`, `g.fx('glyph'|'burst'|'frost'|'fire'|'dust'|'heal'|'sora'|'shockwave'|'lightning', at, { color, scale })`, `g.glyph('player', 3)`, `g.addStrain(0.3)`, `g.strain()`, `g.dropVeil()`, `g.veiled()`, `g.onCast((e) => …)` |
| Sai | `g.sai('light'|'heavy'|'neutral'|'cycle')`, `g.saiPhase()` |
| Stealth | `g.stealth(true|false)` |
| Minigames | `const r = await g.minigame('flow', { level: 'tree' })`, then check `r.success` |
| Hints | `g.hint(l('V — Závoj', 'V — Veil'))`, `g.hint(null)` |

### Abilities (player)

`veil` (V, the Sora veil: invisible to eyes, drains concentration, broken by touch), `ice` (Ctrl+key = raw),
`fire`, `slow` (water/time ring), `flow` (contextual water healing, used through interactables and the
`flow` / `heal` minigames), `push` (Arkot's bronze glyph), `shield` and `air` (Tami's runes), `sora`
(late-game). Hotkeys 1–3 map to the unlocked active abilities in this order: ice, fire, slow, push, shield,
air. Casting with the haiku is slow and safe. With Ctrl held it is instant but adds strain, and strain at
100% makes the character collapse for a moment and drops the veil. Use `g.onCast` to react to casts in
encounters (bosses, puzzles).

### Minigames

| id | Use | Params |
|---|---|---|
| `flow` | leading water through roots, lungs, wounds | `level: 'tree'|'lungs'|'wound'|'canal'` |
| `focus` | Ice/Sora from emptiness: hold to concentrate, flick away thoughts | `difficulty 1-3, duration, title, subtitle, thoughts: L[], stakes: bool` |
| `breath` | counting breaths / rhythm / prayer | `beats, start, bpm, twist: 'eclipse'` |
| `inputs` | fighting for single inputs (possession, pushing a soul out) | `need, misses, window, voice: L[], title, subtitle, color` |
| `hold` | holding on while memories dissolve (Sora gate) | `memories: L[], plea: L, duration` |
| `heal` | mu-hi: drawing heat from a flame into a newborn | `title, subtitle` |
| `cipher` | El's star cipher with Arkot's protractor | `steps` |
| `clock` | Renn's 12-hour clock vs the 21-hour Ahil day | `ahilHour, ahilMinute` |
| `crystal` | harvesting Spira crystals along the grain | `need, time` |
| `haiku` | assembling a haiku (learning a spell) | `haiku: 'veil'|'water'|'earth'|'heal'` |
| `navigation` | flying the Itaka through Sai windows | `map: 'east'|'north', cycle, crystals, days` |

Wrap minigames that are required for story progress in a retry loop (see the prologue), or accept the
result either way (`score` can colour the dialogue).

## 4. Writing style

* Narration lines use the book's voice: concrete senses, short sentences, the world's words (Spira,
  Sai, prízrak, Eltária, haiku, glyph, Kniha El, Matka, Staroreč, ľahká/ťažká hodina, zima = 5 years).
* Dialogue keeps each character's voice: Yera precise and guarded; Arkot quiet and counts things; Flint
  quick, sarcastic, reckless; Tami blunt and warm underneath; Soril hard and tired; Saburo terse
  ("sho"); Felix gruff German phrases ("Sehr interessant", "Eisen"); Maks few words.
* Choices should colour relationships and lines, not the canon outcome.

## 5. Cast ids (`src/content/characters.ts`)

yera_temple (long hair, temple robe), yera_festival (purple silk, cat mask), yera (bob hair,
grandmother's coat), arkot, arkot_glyph (later outfit), flint, soril (old), soril_young, nira, riss,
miret, liri, father, mother, brother, tami, saburo, dara, yori, kiri, toru, sayuri, aether (giant wolf),
felix (Mako), maks, el, el_child, dream_mother, samael (dust demon), phantom, ballast_boy, dama, loader,
wolf_hunter, wolf_elder.

Crowds: `crowdLook(kind, seed)` exists for generic NPCs, but actors need cast ids. Add generic
townsfolk to your chapter by extending `CAST` from your chapter module:

```ts
import { CAST, crowdLook } from '../../characters'
CAST['c3_guard1'] = { name: l('Strážnik', 'Guard'), look: crowdLook('guard', 31) }
```

Do this at module top level (before `export default`).

## 6. Props

The catalogue is in `src/engine/props/*.ts` (103 types). Run `npx vite` and open `/gallery.html` to see them all
(`?filter=a,b`, `?night=1`). Statues: `mother_statue` (params `black`, `armsUp`), `el_statue`, `yera_statue`.

* **Wall-mounted props** (window, torch, mosaic, painting, wall clock, shelf, awning, wall banner/chalkboard,
  ladder; bookshelf and cabinet back onto walls too) have their back at z = −0.5: place them on the floor
  cell *in front of* the wall and rotate so the back faces the wall (`rot: 0` = back toward row−1,
  `rot: 90`, `180`, `270` for the other sides).
* Open doors and gates: set `solid: false` on the placement (solidity cannot change at runtime; toggle a
  closed/open pair with `id` + `g.propVisible`).
* Water props (`lily`, `bridge`, `dock_post`, `sluice`, `waterwheel`) sit on or reach into water cells.
* Props with footprints (airship 3×5, itaka 3×7, stall, bed, approacher, waterwheel, skeleton, star_wall,
  temple_tree/jungle_tree) block several cells. Leave room around them.

## 7. Testing your chapter

* `npx vite` → `http://localhost:5175/?scene=<scene_id>` starts a scene directly (chapter flags and
  abilities applied). `?chapter=ch03` starts with the chapter card.
* Screenshots: `node scripts/shot.mjs "http://localhost:5175/?scene=c3_garden" out.png`. Look at them. Make
  maps readable and lighting beautiful.
* Play every script path at least once (debug: `window.__game` in the console).
