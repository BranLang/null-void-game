# Null Void Saga · I · Eltária

A single-player, anime-styled **isometric narrative adventure** based on the novel *Null Void: Eltária* by
Bran Lang. It is built with three.js and TypeScript and runs in any modern browser.

> On the frozen world of Ahil, where the ringed moon Sai makes gravity rise and fall every hour, Yera of the
> Saéli, a Pursang priestess chosen to become the next Eltária, finds the original Book of El. Its pages are
> written by a scientist, signed by a "demon", and they lead her out of the white tidal city of Nyau, onto a
> silent airship, into the ruins of Kitsune and to the black dust that remembers.

## Features

* **The whole novel**: a prologue and 18 chapters (about 3 hours), told from the book's points of view (Yera, Arkot,
  Tami, Flint, Soril, El).
* **Anime cel-shaded look**: toon shading, ink outlines, painted anime faces with expressions, blinking and
  lip movement, rim light, bloom, a sky with Sai's ring, eclipses, Infera and auroras.
* **Spira magic**: speak the haiku (slow and safe) or cast raw (instant, but strain frosts your vision). The
  Sora veil hides you from eyes but not from the fibers of the prízraky.
* **Sai's gravity clock**: the light hour lets you leap gaps and lifts airships; the heavy hour slows
  everything.
* **Stealth, puzzles and set pieces**: guards with vision cones, blind phantoms that search by touch, and
  minigames from the book (leading water through roots, freezing from emptiness, counting breaths through an
  eclipse, El's star cipher, Renn's 12-hour clock, harvesting Spira crystals, navigating the *Itaka* through
  Sai windows, a birth, the Sora gate).
* **Slovak and English**, full save system (autosave + 3 slots with thumbnails), chapter select, a codex in
  the style of the book's appendix, and accessibility options: text size and speed, reduced motion,
  minigame skip, slower timers, forgiving stealth, rebindable keys and gamepad support.

## Running

```bash
npm install
npm run dev          # http://localhost:5175
npm run build        # static build in dist/ (upload to itch.io / any web host)
npm run preview
npm run desktop      # build and run the desktop app (Electron)
npm run desktop:build  # Windows portable .exe + Linux AppImage in release/
```

Development helpers:

* `?scene=<scene_id>` boots a scene directly, and `?chapter=ch05` starts a chapter from its title card.
* `/gallery.html` shows every prop, `/characters.html` the whole cast, and `/minigames.html?id=flow` lets you
  play a minigame on its own.
* `npm test` runs the unit tests (vitest), `npm run typecheck` the TypeScript checks, and `npm run lint` ESLint.
* `node scripts/smoke.mjs [url]` boots every scene headlessly and reports errors (`--shots dir` saves
  screenshots).

## Controls

| Action | Keyboard / mouse | Gamepad |
|---|---|---|
| Move | WASD / arrows, or click to walk | Left stick / d-pad |
| Run | Shift | LB / LT |
| Interact / continue | E / Space / click | A |
| Veil (Sora) | V | B |
| Abilities | 1 · 2 · 3 | X · Y · RB |
| Raw cast (no haiku) | hold Ctrl (or R) while casting | RT |
| Journal / codex | J / Tab | Back |
| Pause | Esc | Start |

## Project layout

```
src/engine      renderer, toon materials, outlines, camera, input, grid, map builder,
                characters (factory, faces, animator), props, particles, sky, audio
src/game        Game loop, Director (script API), state & saves, settings, stealth,
                Spira, Sai clock, portraits
src/ui          in-game UI (dialogue, HUD) and menu screens
src/minigames   self-contained minigame overlays
src/content     cast, codex, and chapters/<id>/index.ts (one module per chapter)
docs/           CONTENT_GUIDE.md (how to write chapters), STORY_PLAN.md (book → game)
public/assets   title art, logo, portraits, music, footstep sounds
```

Chapters are data plus small async scripts (`await g.say(...)`, `await g.minigame(...)`). See
[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

## Credits

Story, world, characters and music: **Bran Lang** (music made with Suno). Footstep sounds: Fantozzi
(OpenGameArt). Fonts: Cinzel and EB Garamond (SIL OFL). Engine: three.js.

© 2026 Bran Lang. All rights reserved. See [LICENSE](LICENSE).
