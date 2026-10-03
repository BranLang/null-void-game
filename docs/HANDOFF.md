# Handoff: where to continue

Read this first, then `docs/CONTENT_GUIDE.md`, `docs/STORY_PLAN.md` and `docs/ART_BRIEF.md`.

## Direction (decided with the owner)
The game is a single-player anime **narrative adventure** based on the novel *Null Void: Eltária*. The book is a Slovak manuscript, and its content is mapped in `docs/STORY_PLAN.md`.

**Visual target:** painted isometric scenes at Diablo II: Resurrected quality, dark-fantasy anime. The owner rejected the procedural 3D look ("assets are crap"). Every scene should therefore become a **painted plate** with **2D sprite characters**.

## State
- **Engine, game layer, UI, menus, codex, save system, settings and i18n (SK/EN):** done. `npx tsc --noEmit` reports 0 errors.
- **Painted-plate mode:** working. See `docs/shots/show_garden.png` and open `?scene=show_garden`.
  - `src/engine/plate/plateMath.ts` maps image coordinates (u, v from 0 to 1) to grid cells. `plateMap()` builds the walk grid from polygons and `plateAt()` converts spawn points.
  - `src/engine/plate/PlateLayer.ts` draws the backdrop, plus occluder cut-outs placed at the depth of their base line.
  - `src/engine/characters/SpriteCharacter.ts` draws billboard sprites. Each sheet is `public/assets/sprites/<id>/sheet.png` plus `sheet.json`, built by `scripts/pack_sprites.py`.
  - `src/content/sprites.ts` maps cast ids to sprite sheets. Only `yera`, `tami` and `samael` have sheets so far; everyone else falls back to the 3D model.
  - The only plate so far is `src/content/plates/nyau.ts` (NYAU_GARDEN), in the scene `src/content/chapters/zz_showcase/index.ts`. That chapter is hidden from the story.
- **Prologue (`ch00_prolog`):** complete, but still in the old 3D style.
- **Chapters ch01–ch16:** partially written by agents that were stopped mid-work. Expect missing scenes or chapters (ch02, ch03, ch09, ch17, ch18 and the ending may be absent), unfinished scripts and untested flow. Check them against `docs/STORY_PLAN.md`.
- **Minigames:** in `src/minigames/games/`. Set B (cipher, clock, crystal, haiku, navigation) has been tested; set A was last reported type-clean.

## Map size (owner feedback: one 1024 px painting is too small for a game map)
- Maps are **tiled plates**: `plate.tiles = [[row0...], [row1...]]`. The tiles are stitched at load time into one texture (max 8192 px).
- Generate each map in Flow as a grid of tiles with continuous edges (outpaint each tile from its neighbour). Each map should be 2×2 to 4×4 tiles of 2048 px.
- Scale: `plate.width` is in world units. The camera shows 9 world units vertically (`camera.viewHeight`), and a character is 1.45 units tall on screen. So `width` ≈ 16 per 1024 px of painting at the painted scale of the old Nyau images; a 2×2 map is `width: 32`.
- Stitching test: `?scene=show_tiles` (four unrelated old paintings, just to check scale and scrolling).
- The Yera and Tami sprites and the Nyau paintings are the owner's own art from the old repo (`null-void-rpg`, branch `game`).

## Next steps, in order
1. **Art:** a local session with Claude in Chrome generates the plates, sprites, portraits and CGs in Google Flow, following `docs/ART_BRIEF.md`, and commits them under `public/assets/`.
   - For new sprites, add a pack function to `scripts/pack_sprites.py` that keys out the #00FF00 green background, then add the character to `src/content/sprites.ts`.
2. **Convert scenes to plates, starting with the vertical slice (prologue, then the Nyau chapters):**
   - Set `plate:` and use `map: plateMap(PLATE)`.
   - Express every `at` as `at(u, v)`.
   - Trace the walk, block and occluder polygons over a 5% grid of the image. The scratch script used was a small PIL grid overlay.
   - The old Nyau paintings in `public/assets/ref/` (garden, temple, street, canal, villa, bazaar) and `ruins_1.jpg` can be used right away.
3. **Finish and play-test the chapters:** `node scripts/smoke.mjs` boots every scene. Make sure the flags in STORY_PLAN carry across chapters.
4. **Ship:** run `npm run build`, upload a hosted build, take real gameplay screenshots, and build the desktop app with `npm run desktop:build`.

## Known gaps
- On plate scenes, 3D NPC models clash with the painting until those NPCs get sprites.
- Interactable markers are 3D gems. A subtle 2D glow would suit plates better.
- The Yera sprite has no side-idle frame or diagonal walks; the engine mirrors and falls back. Speaking and expressions are limited to the frames in its sheet.

Playable demo (VITE_DEMO=1 build, New Game starts `demo_garden`): https://claude.ai/artifact/NrY3RYsV4XT2RA8pjpDxbP

Branch: `claude/gallant-shannon-qo2otr`. The mirror target is `BranLang/null-void-rpg`, on the same branch name.
