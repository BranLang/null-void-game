# Story Plan: from the novel to the game

*Null Void: Eltária* has a prologue, 26 chapters (Kapitola 0–25) and interludes. The game adapts it into
**19 playable chapters** (index 0–18). The manuscript is
`/root/.claude/uploads/866b1f4e-8798-5961-aa16-709718ee3bb6/8860dc74-E1.md`, and the line numbers below
point to where each book chapter starts.

Legend: **POV** = playable character (cast id). **Mechanics** = gameplay used. Scene ids are suggestions,
but keep their prefix.

| # | id | Title (SK / EN) | Book (line) | POV |
|---|---|---|---|---|
| 0 | ch00 | Prológ · Ardentia | Prológ (18) | soril_young |
| 1 | ch01 | Vysoká voda / High Water | Kap. 0 (198) | arkot |
| 2 | ch02 | Prvé svetlo / First Light | Kap. 1 (589) | yera_temple |
| 3 | ch03 | Lampiónový festival / The Lantern Festival | Kap. 2 (830) | yera_temple → yera_festival |
| 4 | ch04 | Polnoc / Midnight | Kap. 3 (1182) + Kap. 4 (1435) | arkot / yera_temple |
| 5 | ch05 | Kniha noci / The Book of Night | Kap. 5 (1675) + Kap. 6 (2022) | yera_temple |
| 6 | ch06 | Rozlúčka / Farewell | Kap. 7 (2561) + Kap. 8 (2880) | yera_temple → yera |
| 7 | ch07 | Nikam / Nowhere | Kap. 9 (3319) + part of Kap. 12 (4448) | arkot → yera |
| 8 | ch08 | Cesta / The Journey | Kap. 10 (3798), Kap. 11 (4117), Kap. 12 (4448) | tami |
| 9 | ch09 | Kitsune | Interlúdium Príchod (5111), Kap. 13 (5148), Kap. 14 (5494) | yera |
| 10 | ch10 | Vonkajšie ruiny / The Outer Ruins | Kap. 15 (5962) | flint |
| 11 | ch11 | Dva ohne / Two Fires | Interlúdium Dva ohne (6266) | el_child → el (a dream) |
| 12 | ch12 | Tma / Darkness | Kap. 16 (6425) | yera / flint |
| 13 | ch13 | Severný vietor / North Wind | Kap. 17 (6685), 18 (7044), 21 (8527) | arkot_glyph |
| 14 | ch14 | Klietka / The Cage (Käfig) | Kap. 19 (7562), 20 (7980), Interlúdium Zúfalstvo (8389) | yera (+ tami vignette) |
| 15 | ch15 | Skúška / The Trial | Kap. 22 (9213) | yera |
| 16 | ch16 | Spoveď / Confession | Kap. 23 (9637) | yera |
| 17 | ch17 | Hlas / Voice | Kap. 24 (10096), Interlúdium Pod hladinou (10524) | yera (+ tami) |
| 18 | ch18 | Gōstar | Kap. 25 (10590) | arkot / yera / tami |

## Chapter beats and mechanics

**ch01, High Water (Arkot).** On the cargo airship from Diss to Nyau: the warm cabin; Flint's dice; the
ballast boy's talk of priestesses and the Eltária; the Diss woman's tale of the black stone. *Eclipse
standoff*: the boy grabs Flint, the revolver under the hydrogen envelope, "how much longer?" →
`breath` minigame with `twist: 'eclipse'` (40, and the Eye opens on 41). At dawn: the drowned city, the
tidal wave "as fast as a horse runs", Nyau's sluices and wheels ("Nyau mills on Sai"). In the aerodock:
taken for a pure-blood; Flint's wet sleeve, with a choice to press him or let it go (rel). End in the
loader queue.

**ch02, First Light (Yera).** Temple garden prayer; a branch of El's tree goes dark; Soril: "Oprav to." →
`flow` (`tree`), then a nosebleed ("Saéli blood"). Walk home with guards Nira and Riss; the statue of Eon
Labkan (read the Old Speech inscription). The villa: her father says the High Council has chosen her as
the new Eltária ("And if I don't want to?" "You are Saéli."); her grandmother the aviator's coat; her
little brother's chalk; the balcony (the lean toward the drop, the blood spot that won't wash out).

**ch03, The Lantern Festival (Yera).** The light hour, lanterns rising. *Escape*: sneak past a villa
guard (vision cone); Nira looks the other way (`blindWhen`). In the crowd: the rabbit mask seller gives a
white cat mask with a blue crack (`costume('player','yera_festival')`); a clan matron recognises her
(choice: a cold denial). Sai light hour lets you leap gaps across rooftops and canals (`leap` tiles). The
dock alley: the drunk leopard boy, wine, a dance (`breath` as rhythm), fire ladders to the warehouse roof,
stars ("from the sky" against "from the sea"), his father's song from Diss, his hand on hers, and she
bolts. Her father stops at her door and leaves.

**ch04, Midnight.** (Arkot) The *Itaka* glides in out of the fog: matte dark hull, no smoke, fox
veterans, Captain Saburo, Tami on the ramp in frost. Dockhands' tales of Renn and the pirates; Flint
smitten. (Yera) Nira brings his name, Arkot; she watches him from the shadows; the apple; "the garden
beyond the old canal, at midnight". Soril's lessons: the Book of El as "a map with missing pieces"; Ice
training → `focus` ("Ice comes from emptiness, not warmth"). Night garden meetings: heal his rope gash
(`flow` `wound`), the verse about the lost, Nira smoking with her back turned. The night temple with
Arkot in a glowing hooded robe: stealth past temple guards, where glowing lichen gives you away; the
mosaic of El descending; her hiding niche ("I was safe here. That's not the same as happy."); a kiss →
caught.

**ch05, The Book of Night.** Soril drags her by the ear; the obsidian wall dissolves under Sora; the
library; the original Book of El (`read` pages: maps, "Laboratory lighting. Experiment No. 7", the drawings
of a fox girl, the portrait signed **Samael**); the Eltária trial at Ardentia; Soril gives her the white
five-pointed El stone; "Never fall asleep near it." Training montage. Learning the veil haiku →
`haiku` (`veil`) → `unlock('veil')`. Veiled night walk past Nira and Riss to Arkot; his brass protractor;
"A star has no name. It has a direction." → `cipher` (the map is a course). Choice: tell Arkot about the
Book or keep it secret.

**ch06, Farewell.** Arkot leaves with Flint on Korteg's ship ("Nowhere… Don't wait."); her father: "Today
it ends." Dawn spar with Nira (forms, a timing minigame). Veiled eavesdropping on Miret reporting to Soril.
Soril: "the first failure in the whole history of the lineage"; Miret replaces her; 30 nights veiled in
the city (caption); news that Korteg's ship vanished, and the *Itaka* captain is dying of water in his
lungs. Night before the rin festival: her father's safe; her mother catches her and silently gives gold,
the chronograph, the coat with ᚲ, boots and one word: "Leť." ("Fly.") She cuts her hair
(`costume('player','yera')`). Veiled dock infiltration past carbine guards; Tami at the ramp; heal Saburo
(`haiku` `water` then `flow` `lungs`); the oath; the *Itaka* lifts in the light hour under fireworks.

**ch07, Nowhere.** (Arkot) 31 nights captive in a pirate camp, counting by the star "Mother's Hair";
Flint's reckless plan; the prayer "Mother. El. Anyone." (Yera) The rescue: Tami's sabotage fire explodes
the hydrogen fighters; *300 invisible steps* through the camp (veil stealth: guards and noise); cut the
ropes, a kiss; escort north; at step 215 Flint grabs a revolver, the veil drops, and it becomes a chase;
the *Itaka*'s cannon "Felix"; Flint takes a bullet for Tami ("Because I love you…"); heal Flint (`flow`
`wound`); Tami's golden rune shield.

**ch08, The Journey (Tami).** On deck: "We're flying to Kitsune." "Kitsune is a myth." "It's my home." The
oath. → `navigation` (`east`): Sai windows, the Saéli hunter airship, the canyon dive, the boiler acid fire
(Ice fails in dry air, so sand), pterosaurs. Forest camp: Tami's chronograph, three clicks; Dara's
"piranéza" jokes; Flint's backstory; Yera: "What is it like to have a home?"; Samael talk ("He's not alive
anymore. I know."); Yera teaches Arkot Spira (`haiku` `earth` + `breath`); "I love you." "I know." Dawn:
a river on no map, white pillars.

**ch09, Kitsune (Yera).** The city that died but did not fall; the amphitheatre docks; fox children;
**Aether** speaks Old Speech; the Approacher. The fair (no temple, castes mixed): Sayuri recognises the
coat's ᚲ mark; dance with Arkot; Tami declines a dance and glances at Flint. Renn's manor: paintings of
places on no map, runes, the black sword, the hidden portrait of a *human* man with Tami's eyes, the
12-hour clock (`clock`). Infera with Aether ("An old ship"). Night: a phantom on the ceiling; Flint's
bullet only angers it; Tami's runes, "Statt, draugr… Suudokil." Choice: tell Tami that the Book resonated
with the dust, or stay silent (book: silent).

**ch10, The Outer Ruins (Flint).** Beyond the warning signs. Rules: breathe through your nose, don't step
on moss, never turn toward movement at the edge of your vision (watchers). → `crystal`. Flint cracks the
best crystal. The storm-like presence → chase to the signs (the double somersault). The jar of green acid.

**ch11, Two Fires (dream).** Sleeping beside the Book, Yera dreams through another's eyes: a white-haired
child, chalk suns, a woman in seamless white ("Mother") whose face dissolves; the black staff, rivers of
dust building a city of light "like coral"; the vortex gate she walks into; the fall, people "breaking";
Sai without its ring, a new red star; years later by black shores a man on all fours drains her memories;
a yellow blade cuts him in half. She wakes with a burning grain of black dust.

**ch12, Darkness.** The window shatters; the swarm; Arkot reveals his bronze glyph; (Flint) drive the
Approacher away from the blackness swallowing the manor; (Yera) the stair gauntlet: Tami's time-slow,
"Vindr. Rís."; Yera's freeze, "Mizu… Kaze… Sora… Mu-hi… Mu-tsuchi" → `focus` with `stakes`; the finger
that won't move; the vault door shuts.

**ch13, North Wind (Arkot).** Heavy hour, the *Itaka* won't lift; the sixth crystal; dropping the cannon;
liftoff. → `navigation` (`north`). Tundra camp: Flint learns Arkot has had Spira for 17 days (a fight with
the push glyph); Aether's campfire lore (the starfarers, the four, Infera, "my ship"); the aurora. The
Diera and Hel: wolves kneel to "Alfadir"; the Star Wall; the tower hologram and drone map; the run against
the crowd; the dive bar: **Maks** ("People always die. Let me sleep."); the ambush, where Maks's dust stops
bullets and ten wolves die without a wound; Aether stays; Maks on the railing: "Got anything to drink?"

**ch14, The Cage (Yera).** The steel vault: three days of air; Tami's condensation water; Renn's archive,
the white statue of a human woman, the painting; Tami's teacher (Maks, unnamed); the little finger snaps;
the Nevrissian Apocrypha written by Renn; teaching the veil haiku against Tami's galdr. Veiled run
upstairs among phantoms (crawlers, wall stains, the violet-eyed humanoid); take the Book (it vanishes
under the veil); the rain chase to the Metaru; drop the veil to knock; Kiri and Toru's airlock; **Felix**
("Eisen", not a Tenši; "800 years I've been solving problems"); Sayuri heals. (Tami vignette:
*Despair*, counting exhales in the dark.)

**ch15, The Trial (Yera).** Felix's tip: frost then fire makes microfractures; boots and the ancient
glove. Veiled ghost-town stealth (clothes on doorsteps, listeners, cold zones). Renn's garden: Samael
("I see you, Eltária… It wasn't me… Her blood. I know it.") → **boss**: freeze (ice) then fire, three
times; black snow; a smile. Tami feral in the vault: carry her back (pose `carry`, visible, no Spira).
Felix: "The lantern festival in Nyau is said to be beautiful." *Vyhrala.*

**ch16, Confession (Yera).** The siege: phantom palms on the hull. The last pages in German, a
confession ("Ich suche nur den Ausweg"); her faith cracks. Sayuri's healing montage: the birth, the
baby not breathing → `heal` (mu-hi). New glyphs in her left hand, one of them violet. Felix's electric box
plays the dust recordings of El's voice. Tami speaks again, then freezes like a statue. Gōstar tales at
the last beer barrel. Water runs out; Kiri, Toru and three others go out; five piles of clothes with ash
in the sleeves. "If he returns, let him in." Coil guns.

**ch17, Voice (Yera).** "The covers are memories"; violet behind the blue: Samael speaks through Tami;
the heavy hour, Tami floats, blackout, the gate opens, the Book is taken. Veiled run in the heavy hour.
The cemetery stairs: waves of phantoms → slow field plus fire → the veil drops → Sora burst. Samael's
taunt (the Atran Strait, the silver foxes); he regrows her finger from dust; the kiss that steals breath;
"You taste like her." (Tami: *Beneath the Surface* → `inputs`, "Spi.")

**ch18, Gōstar.** (Arkot) The *Itaka* returns; Maks drinking; Goji knows Maks lied ("only sleeping");
Felix hands out three coil rifles; Arkot finds Yera crying in the mud. The Gōstar walks unbent through
the heavy hour and absorbs phantoms; the maze hunt with hand signals. Tami: "Small world, isn't it,
Maks?"; Maks breaks and chokes her; (Yera) freeze him (`focus`); the goggles fall: empty sockets. (Tami)
The exorcism from inside → `inputs` ("Poď ku mne." / "Choď."); "Tato?"; black eyes full of smoke.
(Yera) Maks: "Show it to me."; fibers find her; he sees into the covers and screams; she opens the Sora
gate fully → `hold` (memories dissolve: her name, her face, the colour of Arkot's eyes); the void of
geometric beasts. (Arkot) Only her clothes, the white stone, the chronograph still ticking; graves
without bodies; he shapes her statue with closed eyes (`yera_statue`); Tami: "Let her go."; "Wherever it
blows." → `endChapter()` → credits → the stinger (the chronograph ticking, a burning wrist).

## Shared choice flags and relationships

Chapters are written independently, so these names are fixed. Later chapters (especially the
epilogue in ch18) read them, so always use exactly these keys:

| Flag | Set in | Meaning |
|---|---|---|
| `ch01.pressedFlint` | ch01 | Arkot pressed Flint about the wet sleeve |
| `ch03.deniedMatron` | ch03 | Yera coldly denied being Yerana to the matron |
| `ch05.toldArkot` | ch05 | Yera told Arkot about the Book of Night |
| `ch06.defiedFather` | ch06 | Yera answered her father defiantly |
| `ch08.taughtArkot` | ch08 | Yera taught Arkot his first glyph (always true in canon) |
| `ch09.toldTami` | ch09 | Yera told Tami the Book resonated with the dust |
| `ch12.forgaveArkot` | ch12/13 | Flint forgave Arkot for hiding his glyph |
| `ch16.faith` | ch16 | `'kept'` or `'broken'`: how Yera answered the confession |

Relationships (`g.rel(name, ±1)`): `arkot`, `tami`, `flint`, `soril`, `nira`, `saburo`, `felix`, `goji`.
The epilogue varies a few lines (Arkot's words at the statue, Tami's farewell, Felix's note) by these values.
