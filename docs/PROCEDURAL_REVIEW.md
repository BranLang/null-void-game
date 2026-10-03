# Procedural 3D work: what was built

This branch is a snapshot so you can review the procedural 3D direction (everything generated in code, no painted art).
Screenshots are in `docs/shots/procedural/`:
- `p_gallery.jpg`: the prop gallery (`/gallery.html`, 103 code-generated props)
- `p_chars.jpg`: the code-generated cast (`/characters.html`)
- `p_slope.jpg`, `p_ardentia.jpg`: prologue scenes in-game

Where the code is:
- `src/engine/props/*`: procedural props (trees, buildings, furniture, tech, magic, statues)
- `src/engine/characters/*`: rigged anime characters, painted canvas faces, the animator
- `src/engine/MapBuilder.ts`, `materials.ts`, `textures.ts`, `toon.ts`, `fx/*`: ASCII maps turned into geometry, procedural textures, toon shading, sky, water, particles, outlines
- `src/content/chapters/*`: chapter scenes built on ASCII maps (prologue complete; ch01 to ch17 partial)

The part worth keeping for the painted direction is the game layer (dialogue, scripts, saves, menus, codex, minigames) plus the `src/engine/plate/*` painted-plate mode and `SpriteCharacter.ts`.
