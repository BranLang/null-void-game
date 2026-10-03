# Art Brief: images to generate with Google Flow

This is the shopping list for a **local Claude Code session with Claude in Chrome**. It generates the images in
Google Flow (labs.google/flow) and commits them to this repo on branch `claude/gallant-shannon-qo2otr`.
The game then uses them as painted isometric scenes, character sprites, portraits and story illustrations.

## How to work

1. Open Flow, pick the best available **image** model (Imagen / Gemini image, "nano banana").
2. For every row below, paste **STYLE + the row's prompt**. When Flow accepts reference images ("ingredients"),
   attach the style references named in the row from `public/assets/ref/`.
3. Generate 2–4 variants, keep the best one, and download it at the **highest resolution**.
4. Save it under the exact path given (PNG or high-quality JPG; plates at least 1920 px wide).
5. Commit in batches (`git add public/assets/... && git commit -m "Art: ..." && git push`). Tick the row in
   this file when it's done (change `[ ]` to `[x]`).

## STYLE (prepend to every prompt)

> Isometric RPG art in the quality of Diablo II: Resurrected, painted in a refined dark-fantasy anime style:
> richly detailed, crisp painterly textures, cinematic lighting with soft glows, deep colour, high detail on
> stone, cloth and foliage. Camera: high-angle isometric three-quarter view (about 35° down, 45° rotated),
> orthographic feel, no perspective distortion. No text, no UI, no watermark, no borders.

Extra rules for **scene plates**: *no characters or creatures*. Keep a large, clearly readable walkable floor
area in the middle and lower half, with tall elements (buildings, big trees) mostly along the top and left
edges, and keep the bottom edge open (the camera looks from the bottom-right). Consistent light direction:
moon or sun from the upper left.

Style references (in `public/assets/ref/`): `nyau_temple_empty.png`, `nyau_garden_empty.png` (Nyau),
`ruins_1.jpg` (Kitsune ruins), and the Canva temple-garden image Bran generated (glowing aquamarine tree,
moonlit white marble). Save that one as `public/assets/ref/nyau_temple_garden_canva.jpg` first.

---

## A. Scene plates (`public/assets/plates/<key>.jpg`, 16:9, ≥1920×1080)

| ✓ | key | Prompt (after STYLE) | refs |
|---|---|---|---|
| [ ] | p_slope | A night mountain slope below a rocky saddle: terraces of grey scree descending toward a dark spruce forest edge at the bottom right, scattered boulders with moss, a thin silver stream running down the left side, frost on stones, the huge amber ringed moon Sai low in a starry sky and one small steady red star. Cold blue moonlight. | ruins_1 |
| [ ] | p_forest | A grey birdless morning beside a cursed forest: in the centre a dense forest of black trees all leaning inward toward one enormous black dead tree; a gravel and moss path around the forest edge where trunks still have brown bark; low rock ridges at the bottom; ash drifting, fog. | ruins_1 |
| [ ] | p_ardentia_street | A dead mountain city in a gorge: rows of flat-roofed grey stone houses with empty dark windows along a cobbled street, mushrooms between paving stones, at the far end a plain temple whose door frame bears a worn relief of a woman with outstretched arms; overcast. | ruins_1 |
| [ ] | p_ardentia_temple | Interior of a small dark stone temple: in the centre a stone statue of a kneeling woman with open palms held out, black rot creeping up from her knees like veins, a mosaic on the side wall of a winged figure with BLACK wings spearing a fallen one, names scratched into the wall by the door, grey dust, one shaft of cold light. | nyau_temple |
| [ ] | c1_deck | The open cargo deck of a hydrogen airship flying at night above clouds: wooden deck, crates and sacks, ropes, brass fittings, the envelope's underside above, railings; the deck floats in the sky with clouds below; the ringed amber moon and dense stars. | — |
| [ ] | c1_cabin | The single warm cabin of a cargo airship: low wooden room, hanging oil lantern, benches, sacks of grain, a dice game on a crate, round window showing night clouds. | — |
| [ ] | nyau_aerodock | Nyau aerodock at dawn: white stone docks on a plateau above the sea, mooring pylons with airships, grain loaders' queue, cranes, sluice channels with rushing water, a tidal bay far below with a drowned city visible under the water. | nyau_street |
| [ ] | nyau_temple_garden | The temple garden of El at night: a huge ancient tree with glowing aquamarine leaves (one branch dark and dead), white marble terraces and steps, canals with glowing cyan algae, stone lanterns, violet silk banners. | nyau_temple_garden_canva, nyau_garden |
| [ ] | nyau_street | A street of the white tidal city of Nyau by night: white houses, canals with bioluminescent glints, water wheels, glowing night flowers, a moss-covered statue of a sea captain. | nyau_street, nyau_canal |
| [ ] | nyau_villa | Courtyard and balcony of the noble Saéli villa: white marble, a glowing courtyard tree, purple silk awnings, a balcony with a long drop to the city below. | nyau_saeli_villa |
| [ ] | nyau_villa_room | Yera's room in the Saéli villa: elegant bed, desk with books, a fur-collared aviator coat on a stand, chalk drawings of airships, tall window with a balcony. | nyau_saeli_villa |
| [ ] | nyau_festival | The Tōr lantern festival at night: crowded streets and canal bridges, hundreds of paper lanterns rising into the sky, painted lantern of a goddess, market stalls with masks, warm orange light against violet night. | nyau_bazaar_empty_base |
| [ ] | nyau_rooftop | Flat warehouse rooftops by the aerodock under stars, fire ladders, crates, lanterns drifting up over the city in the distance. | nyau_street |
| [ ] | nyau_canal_garden | An abandoned overgrown garden beyond an old canal at midnight: broken benches, glowing night flowers, fireflies, a crumbling wall. | nyau_garden |
| [ ] | nyau_temple_night | Inside the night temple of El: purple silk, glowing lichen on columns, a mosaic of a white-haired goddess descending from the stars, a small hidden niche behind a column. | nyau_temple |
| [ ] | nyau_library | A secret underground library behind an obsidian wall: stone shelves, candles, a stone cabinet holding a black book whose covers glow with faint violet veins, maps on tables. | nyau_temple |
| [ ] | nyau_soril_room | Soril's austere training room behind the temple library: a shallow bowl of water on a stand, candles, glyph diagrams on the walls. | nyau_temple |
| [ ] | nyau_docks_night | The aerodock at night during fireworks: carbine guards in blue, cargo carts, the small dark riveted airship Itaka at mooring pylon three. | nyau_street |
| [ ] | itaka_deck | The deck of the Itaka: a small matte dark riveted steel airship, armoured gondola, four rotors on booms, a heavy bow cannon, a violet-glowing Spira boiler; flying over jungle canopy at day, clouds. | — |
| [ ] | pirate_camp | A pirate camp in a dark forest at night: tents, campfires, crates, three light hydrogen fighter craft parked on a clearing, captives tied to posts. | — |
| [ ] | forest_camp | A campsite under giant ancient inland trees at night: campfire, bedrolls, blue phosphorescent ants, the Itaka moored above. | — |
| [ ] | kitsune_docks | The great amphitheatre of Kitsune used as airship docks: colossal white pillars and arches swallowed by jungle, a wooden airship skeleton in a dock, a beacon tower, fox children. Keep the arena floor clear. | ruins_1 |
| [ ] | kitsune_fair | An autumn fair inside jungle-covered white ruins: stalls with smoked meat and furs, hurdy-gurdy players, lanterns, no temple, mixed crowd space in the middle (no people). | ruins_1 |
| [ ] | renn_manor | A gothic ivy-covered manor in jungle ruins: walled garden with stone fox statues, iron gate, tall gothic windows. | ruins_1 |
| [ ] | renn_manor_hall | Interior hall of Renn's manor: hundreds of paintings of unknown landscapes, a staircase, display cases with a compass, a map and a black sword, a covered portrait, candlelight. | — |
| [ ] | renn_vault | A steel vault under the manor: room-sized, lit only by violet Spira crystals, shelves of handwritten books, a white stone statue of a human woman facing the wall, a round wheel door. | — |
| [ ] | outer_ruins | The haunted outer ruins of Kitsune beyond white warning signs: streets wide as rivers, bone-white pillars, giant skeleton ribs with violet crystals growing from them, faintly glowing leaves, mist. | ruins_1 |
| [ ] | dream_white | A surreal dream: a white underground hall with chalk drawings of suns, then a black beach where rivers of black dust build a city of light like coral; desaturated white with violet accents. | — |
| [ ] | tundra_camp | A snowy tundra plateau at night under a violet-green aurora, the Itaka moored, a campfire, moss and rocks. | — |
| [ ] | diera | The Diera: a giant straight smoking chasm in the earth, terraces carved by wolves, a grave terrace with carved stones and offerings, hydraulic chain lifts. | — |
| [ ] | hel_city | Hel, the wolf forge city: a vast hall of black andesite five levels down, glowing lava fissures under grates, relief pillars of wolves, a market, riveters' workshops; orange light. | — |
| [ ] | hel_starwall | The Star Wall in Hel: black stone carved with constellations of a different sky and a red circle at the centre; torchlit ritual space. | — |
| [ ] | hel_tower | A seamless tower of matte unknown metal in a snowy shaft, blue lights waking, a holographic blue planet projected in the air. | — |
| [ ] | hel_bar | The worst dive bar at the bottom of Hel: low black-stone room, bottles of blue spirit, a lone table in the corner. | — |
| [ ] | metaru_hangar | Inside the Metaru, a colossal ancient metal ship hull used as a refuge: ribs of the hull overhead, bioluminescent plants along the ribs, pigeons, refugee tents and livestock, warm lamps, an airlock gate. | — |
| [ ] | felix_workshop | Felix's workshop deep in the Metaru: vise-jawed benches, brass "lungs", chain drives, dozens of chalkboards of formulas in German, coil guns on a rack. | — |
| [ ] | kitsune_rain | Kitsune ruins in heavy rain at night: wet stone streets, moss, the giant metal hull of the Metaru half-buried in the hill beyond. | ruins_1 |
| [ ] | renn_garden | Renn's walled garden at dusk with stone fox statues around a well, overgrown, black fibers creeping on the walls. | ruins_1 |
| [ ] | ghost_town | Empty Kitsune streets: piles of clothes on doorsteps, open doors, rain-dark stone, cold mist. | ruins_1 |
| [ ] | cemetery_stairs | An overgrown ruined cemetery on a hill with a broken stone staircase rising to an empty statue pedestal, gravestones, moss, heavy rain, violet discharges in the dark. | ruins_1 |
| [ ] | ruin_maze | A labyrinth of broken white ruin walls in heavy rain at night. | ruins_1 |
| [ ] | epilogue_hill | A quiet hill above Kitsune at dawn: fresh graves without bodies, wildflowers, a view of the ruins and the Itaka moored below, soft grey-gold light. | ruins_1 |

## B. Character sprites (`public/assets/sprites/<id>/<pose>.png`)

Prompt for each character (after STYLE, replacing the camera sentence): *"Full-body anime game character
sprite sheet on a flat pure green (#00FF00) background: the same character in four poses side by side, viewed
from a high isometric angle: facing down-right, facing down-left, facing up-right, facing up-left; standing,
relaxed; consistent design and proportions; crisp clean outlines."* Then add the description below. Save the
whole sheet as `sheet.png`. If you can, also generate a 4-frame walk cycle per facing as `walk_<facing>.png`.

| ✓ | id | Description |
|---|---|---|
| [ ] | yera_temple | Yera, slim young Pursang cat girl: human face, black cat ears, long straight black hair with violet sheen, blue eyes, black cat tail; white-and-lavender priestess robe with violet trim; aquamarine glyph tattoo lines on her forearms. |
| [ ] | yera | Yera after her escape: black bob haircut, cat ears and tail, blue eyes, her grandmother's long brown leather aviator coat with a cream fur collar and a ᚲ emblem on the shoulder, dark corset and belts, dark trousers, tall boots, fingerless gloves, a white five-pointed stone pendant. |
| [ ] | yera_festival | Yera in a deep purple silk festival dress with gold trim, white cat mask with a blue crack pushed up on her head, barefoot. |
| [ ] | arkot | Arkot, tall broad young man of the leopard Mezra caste: dark tan skin with faint leopard rosettes, leopard ears and long spotted tail, short dark hair, amber-green eyes, dockworker's vest over a cream shirt, rolled sleeves, belt; later a bronze glyph glows on his forearms. |
| [ ] | flint | Flint, lean young lynx man: tufted lynx ears (one torn), short lynx tail, wild auburn hair, freckles, yellow eyes, blue-grey jacket, red scarf, revolver at his hip, cocky grin. |
| [ ] | tami | Tami, slim fox girl with human blue eyes: wild copper hair in a long braid, fox ears and a big orange fox tail with a white tip, brass aviator goggles on her head, dark olive leather coat with belts and pouches, green scarf, bandaged forearm, fingerless gloves, two pistols and a rapier. |
| [ ] | soril | Soril, small gaunt elderly Pursang cat woman, high priestess: grey hair in a bun, deep violet hooded robe with silver trim, stern tired face, violet glyphs on her arms. |
| [ ] | soril_young | Young Soril on her trial: dark braided hair, cat ears, travel coat with fur collar, determined. |
| [ ] | nira | Nira, tall Mezra cat woman guard: grey cloth eyepatch, short dark grey hair, blue steel armour and tabard, spear, gold glyph formulas tattooed over her arms and neck. |
| [ ] | saburo | Saburo, old fox captain: grey fox ears that were once orange, faded tricorn hat, pipe, worn brown coat, cane. |
| [ ] | felix | Felix, a Mako (an iron man): metal body under worn synthetic skin, glass ring-shaped irises that glow faint cyan, wild grey hair, leather workshop apron, goggles. |
| [ ] | maks | Maks, the Gōstar: a human man (no animal features), black light-absorbing suit, round scratched dark goggles, black hair; a ring of black dust circling him. |
| [ ] | goji | Goji, young fox engineer: wild orange hair, goggles, leather apron with tools and belts, calm obsessive look. |
| [ ] | dara | Dara, fox woman pilot missing one ear, ponytail, flight jacket, goggles. |
| [ ] | yori | Yori, small cat boy cook with a big apron. |
| [ ] | kiri_toru | Kiri and Toru, two old fox aeronaut veterans with carbines (two figures, separate sheets `kiri/` and `toru/`). |
| [ ] | sayuri | Sayuri, an ancient bent white-furred fox healer covered in blue glyph tattoos, grey robe. |
| [ ] | father / mother / brother | The Saéli family: tall noble Pursang cat father in a navy coat; mother with blue eyes and a black bun in a violet dress; small cat-boy brother. |
| [ ] | aether | Aether, a giant silver-grey wolf the size of a draft horse with amber eyes (four poses). |
| [ ] | samael | Samael, a demon of black dust: a towering shape of thousands of writhing hair-thin black fibers with a smooth wax-white mask low down bearing two hollows where dust flows; also a humanoid form of black fibers with two violet eyes (`samael/humanoid.png`). |
| [ ] | phantom | Prízraky, phantoms of black dust: a crawler on all fours with dead-hair fibers, a faceless humanoid, a wall stain (one sheet). |
| [ ] | extras | Generic sheets: Nyau guards (blue uniforms, carbines), temple novices, festival townsfolk with masks, pirates, Kitsune foxes, wolf hunters of Hel (wolf Ghorki with rifles), refugees. |

## C. Dialogue portraits (`public/assets/portraits/<id>.webp`, square, bust)

Same character descriptions as B, anime bust portrait, looking slightly toward the viewer, on a transparent or
flat dark background. Match the existing `yera.webp` and `tami.webp`. Needed: yera_temple, arkot, flint,
soril, soril_young, nira, saburo, felix, maks, goji, dara, yori, kiri, toru, sayuri, father, mother, miret,
el (white-haired woman with violet eyes), samael (violet-eyed dust face).

## D. Story illustrations (`public/assets/cg/<key>.jpg`, 16:9)

| ✓ | key | Scene |
|---|---|---|
| [ ] | eclipse | The airship deck during the eclipse: the ringed moon goes dark, a fiery ring, Arkot counting, Flint held at the rail. |
| [ ] | lanterns | Yera and Arkot on a rooftop under thousands of rising lanterns. |
| [ ] | book | Yera opening the original Book of El in the underground library, violet light on her face. |
| [ ] | fly | Yera's mother giving her the coat and the chronograph by an open safe at night: "Fly." |
| [ ] | rescue | The pirate camp burning, Yera invisible cutting Arkot's ropes. |
| [ ] | pillars | The Itaka arriving at dawn above the white pillars of Kitsune in the jungle. |
| [ ] | freeze | Yera freezing the black dust swarm on a manor staircase, frost flowers spreading. |
| [ ] | hel | Wolves kneeling to the giant wolf Aether in the forge city of Hel. |
| [ ] | garden_duel | Yera facing Samael's violet-eyed dust form among stone fox statues. |
| [ ] | gate | Yera opening the Sora gate: rain hanging like silver glass, her body turning to light. |
| [ ] | statue | Arkot's half-length statue of Yera on the hill, eyes closed, the white stone hanging on it. |

When a batch is committed, tell the cloud session (or Bran). This session imports the plates, aligns
the walkable areas to them and replaces the placeholder 3D art.
