/**
 * Codex of Null Void: Eltária, built from the appendix of the novel (maps,
 * calendar, Varietas, glossary, slang, chronicle) plus spoiler-safe first
 * impressions of the main cast. Chapters may add more entries (ChapterDef.codex).
 *
 * Ids: `world.*`, `cal.*`, `gloss.*`, `people.*`, `book.*` (lowercase snake_case).
 * Body text: paragraphs separated by a blank line, `*italic*` markers,
 * single line breaks are kept.
 */
import type { CodexEntry } from './types'
import { l, type L } from '../i18n/i18n'

/** A sub-heading inside a codex tab (used by the codex screen to group lists). */
export interface CodexSection {
  key: string
  title: L
  /** sort position of the section inside its category */
  rank: number
  /** sort the section's entries alphabetically by their localised title */
  alpha?: boolean
}

const SECTIONS = {
  places: { key: 'places', title: l('Krajiny a miesta', 'Lands & places'), rank: 0 },
  sky: { key: 'sky', title: l('Nebo', 'The sky'), rank: 1 },
  history: { key: 'history', title: l('Dejiny', 'History'), rank: 2 },
  powers: { key: 'powers', title: l('Sily a bytosti', 'Powers & beings'), rank: 3 },
  time: { key: 'time', title: l('Čas', 'Time'), rank: 0 },
  months: { key: 'months', title: l('Mesiace', 'Months'), rank: 1 },
  terms: { key: 'terms', title: l('Pojmy', 'Terms'), rank: 0, alpha: true },
  castes: { key: 'castes', title: l('Kasty', 'Castes'), rank: 1 },
  species: { key: 'species', title: l('Druhy Varietas', 'Species of the Varietas'), rank: 2 },
  slangNyau: { key: 'slang-nyau', title: l('Slang · Nyau', 'Slang · Nyau'), rank: 3, alpha: true },
  slangKitsune: { key: 'slang-kitsune', title: l('Slang · Kitsune', 'Slang · Kitsune'), rank: 4, alpha: true },
  slangNevriss: { key: 'slang-nevriss', title: l('Slang · Nevriss', 'Slang · Nevriss'), rank: 5, alpha: true },
  slangGeneral: { key: 'slang-general', title: l('Slang · všeobecný a kastový', 'Slang · general & caste'), rank: 6, alpha: true },
  canon: { key: 'canon', title: l('Kanonické verše', 'Canonical verses'), rank: 0 },
} satisfies Record<string, CodexSection>

const sectionOf = new Map<string, CodexSection>()
const list: CodexEntry[] = []
const counters: Record<CodexEntry['category'], number> = { book: 0, world: 0, people: 0, glossary: 0, calendar: 0 }

function add(category: CodexEntry['category'], section: CodexSection | null, id: string, title: L, body: L): void {
  counters[category] += 10
  list.push({ id, category, title, body, order: counters[category] })
  if (section) sectionOf.set(id, section)
}

const NB = ' '

// ============================================================================ world
const W = (section: CodexSection, id: string, title: L, body: L) => add('world', section, `world.${id}`, title, body)

W(
  SECTIONS.places,
  'ahil',
  l('Ahil', 'Ahil'),
  l(
    `Svet, na ktorom žijeme. Zamrznutá planéta s úzkym obyvateľným pásom okolo rovníka; všetko ostatné patrí ľadu.\n\nV starých listinách a v chrámovom písme stále stojí *Achilles*. Tak to dnes vysloví už len Mako.\n\nAhilský rok má 440 dní, deň asi dvadsaťjeden hodín a nad všetkým visí Sai. Svet je väčší, než ho ktokoľvek prešiel. Jeho známa časť sa volá Terra.`,
    `The world we live on. A frozen planet with a narrow habitable belt around the equator; everything else belongs to the ice.\n\nOld charters and temple script still spell it *Achilles*. Only a Mako says it that way now.\n\nA year on Ahil lasts 440 days, a day about twenty-one hours, and above it all hangs Sai. The world is larger than anyone has ever walked. Its known part is called Terra.`,
  ),
)

W(
  SECTIONS.places,
  'terra',
  l('Terra', 'Terra'),
  l(
    `Hlavný kontinent Ahila, domov väčšiny Varietas.\n\nNa juhovýchode leží teokratické Nyau, na južnom pobreží Beladiss, kedysi kolónia Nevrissu. Sever drží militaristický Graw, vyhrievaný teplom zeme, a na východe sa medzi zvyškami starej slávy krčia ruiny Kitsune.\n\nZa okrajmi máp sa svet nekončí. Len ho ešte nikto nezapísal.`,
    `The main continent of Ahil, home to most of the Varietas.\n\nTheocratic Nyau lies in the south-east, Beladiss on the southern coast, once a colony of Nevriss. The north belongs to militarist Graw, warmed by the heat of the earth, and in the east the ruins of Kitsune huddle among the remnants of old glory.\n\nThe world does not end where the maps do. No one has written the rest down yet.`,
  ),
)

W(
  SECTIONS.places,
  'nyau',
  l('Nyau', 'Nyau'),
  l(
    `Teokratická krajina na juhovýchode Terry a sídlo Cirkvi El. Subtropická klíma; horúčava neodchádza ani v noci, ani v tieni.\n\nMesto stojí na náhornej plošine nad zálivom ako na stole: biely a krémový kameň, tisíce plochých striech, kanály, záhrady so svietiacimi stromami a na najvyššom bode biela kupola Chrámu. Čím nižšie, tým lacnejšie strechy, až pri pobreží prejdú do dechtu a vlnitého plechu.\n\nPri extrémnych prílivoch sa Nyau mení na ostrov. More vpustí hore po schodoch do kamenných nádrží a pri odlive ho prinúti točiť kolesá mlynov. Nyau nemelie na oheň. Nyau melie na Sai. Päť miliónov duší na jednej skale.\n\nPobrežie objavil okolo roku 1${NB}124 nevrisský kapitán Eon Labkan, keď v noci uvidel les, ktorý svietil. *Nyau* — zvuk, aký ujde z hrdla skôr než slovo.`,
    `A theocracy in the south-east of Terra and the seat of the Church of El. The climate is subtropical; the heat never leaves, not at night, not in the shade.\n\nThe city sits on a plateau above the bay like a table: white and cream stone, thousands of flat roofs, canals, gardens of glowing trees, and on the highest point the white dome of the Temple. The lower you go, the cheaper the roofs, until by the shore they turn to tar and corrugated tin.\n\nAt the extreme tides Nyau becomes an island. The city lets the sea climb its stairs into stone reservoirs, and at the ebb it makes the water turn its mill wheels. Nyau does not grind on fire. Nyau grinds on Sai. Five million souls on one rock.\n\nThe coast was found around the year 1,124 by the Nevrissian captain Eon Labkan, who saw at night a forest that shone. *Nyau* — the sound that escapes the throat before a word.`,
  ),
)

W(
  SECTIONS.places,
  'beladiss',
  l('Beladiss a Diss', 'Beladiss & Diss'),
  l(
    `Pobrežná krajina na južnom pobreží Terry. Kedysi kolónia Nevrissu, samostatná od Veľkej Potopy.\n\nJej prístav *Diss* je mesto rybárov, nakladačov a terás nad vlnolamom. Muž v Diss nosí, žena váži a hovorí; kto to poplietol, ten to poplietol raz.\n\nMore sa tam menom nevolá. Hovorí sa mu *Ona*: Ona dáva, Ona berie, a múdry jej do izby nestavia nič, o čo nechce prísť.\n\n*„Voda nikdy nekradne. Voda si len berie späť, čo si postavil v jej izbe.“*\nPrístavné príslovie z Diss`,
    `A coastal land on the southern shore of Terra. Once a colony of Nevriss, independent since the Great Flood.\n\nIts port, *Diss*, is a town of fishermen, dockhands and terraces above the breakwater. In Diss the man carries and the woman weighs and speaks; whoever mixes that up does it only once.\n\nNobody there calls the sea by name. They call it *She*: She gives, She takes, and a wise man builds nothing in her room that he is not ready to lose.\n\n*“Water never steals. Water only takes back what you built in its room.”*\nA harbour proverb from Diss`,
  ),
)

W(
  SECTIONS.places,
  'nevriss',
  l('Nevriss', 'Nevriss'),
  l(
    `Kedysi najväčšia ríša na Ahile. Založili ju Varietas v Ére Temnoty, keď pred prízrakmi odišli na pevninu. Okolo roku 800 z nej vyrástlo námorné impérium, ktoré kolonizovalo južné pobrežie Terry, a jeho kapitáni objavili Nyau.\n\nVeľká Potopa ju zničila a s ňou aj moreplavbu. Beladiss, Nyau a ďalšie krajiny sa z jej trosiek osamostatnili.\n\nDnes je Nevriss juhom mačacích Varietas. Ich nadávky sa začínajú prsknutím.`,
    `Once the greatest empire on Ahil. The Varietas founded it in the Era of Darkness, when they fled the phantoms to the mainland. Around the year 800 it grew into a maritime empire that colonised the southern coast of Terra, and its captains discovered Nyau.\n\nThe Great Flood destroyed it, and seafaring with it. Beladiss, Nyau and others rose free from its wreckage.\n\nToday Nevriss is the south of the cat Varietas. Their curses begin with a hiss.`,
  ),
)

W(
  SECTIONS.places,
  'graw',
  l('Graw', 'Graw'),
  l(
    `Severná militaristická krajina, vyhrievaná teplom zeme. Tvrdia, že sú najsilnejší národ na Ahile.\n\nŽijú tam najmä Canis — vlci a psy. V dokoch Nyau sa meno istého grawského pilota, čo vraj nikdy neprehral, vyslovuje len s odpľutím.`,
    `A militarist land in the north, warmed by the heat of the earth. Its people claim to be the strongest nation on Ahil.\n\nMost of them are Canis — wolves and dogs. On the docks of Nyau, the name of a certain Graw pilot, said never to have lost, is spoken only with a spit.`,
  ),
)

W(
  SECTIONS.places,
  'kitsune',
  l('Kitsune', 'Kitsune'),
  l(
    `Ruiny kedysi veľkého mesta na východe Terry.\n\nKitsune vzniklo po vojne, keď Ex Inferis dostali v Atranskej úžine od líšok výprask. Bolo to miešané mesto, kým ho v roku Tretieho Príchodu nezničila Lekcia Krvi. Prežili len líšky.\n\nDnes žije malá komunita Vulpini v udržiavanom jadre medzi zvyškami starej slávy. Nosia ľan, kožené vesty plné vreciek a mosadzné spony: zámočníci, leteckí mechanici, lovci. Do paláca slúžiť nikomu nemusia.`,
    `The ruins of a once-great city in the east of Terra.\n\nKitsune was founded after the war in which the foxes gave the Ex Inferis a thrashing in the Atran Strait. It was a mixed city until the Lesson of Blood destroyed it in the year of the Third Coming. Only the foxes survived.\n\nToday a small community of Vulpini lives in a maintained core among the remnants of old glory. They wear linen, leather vests full of pockets and brass buckles: locksmiths, airship mechanics, hunters. None of them has to serve in anyone's palace.`,
  ),
)

W(
  SECTIONS.places,
  'metaru',
  l('Metaru', 'Metaru'),
  l(
    `Obrovský kovový trup na svahu nad Kitsune. Býva v ňom Felix a mesto sa doň skrýva pred prízrakmi; jeho steny ich neprepustia.\n\nTak ho volá Kitsune. Yera mu hovorí *Železný chrám*.`,
    `A colossal metal hull on the slope above Kitsune. Felix lives inside, and the city hides in it from the phantoms; its walls will not let them through.\n\nThat is what Kitsune calls it. Yera calls it the *Iron Temple*.`,
  ),
)

W(
  SECTIONS.places,
  'ardentia',
  l('Ardentia', 'Ardentia'),
  l(
    `Mŕtve mesto v horách na severe. Kamenné domy s plochými strechami a prázdnymi oknami, rad za radom, huby v dlažbe. Nikto tam už nežije.\n\nTamojší chrám sa od domov nedá rozoznať. Rovnaká plochá strecha, len rám dverí je iný: žena s roztiahnutými rukami, vyrytá plytko a dažďami vyhladená, až z nej zostal obrys, ktorý treba hľadať prstami.\n\nVnútri stojí skala v tvare kľačiacej ženy. Ruky má rozprestreté a dlane otvorené nahor, tak ako sa podáva chlieb. O Ardentii sa v chráme hovorí len pri jednej sviečke.`,
    `A dead city in the northern mountains. Stone houses with flat roofs and empty windows, row after row, mushrooms in the paving. No one lives there now.\n\nIts temple cannot be told from the houses. The same flat roof; only the door frame is different: a woman with outstretched arms, carved shallow and worn by the rains until only an outline remains, one you have to find with your fingers.\n\nInside stands a rock shaped like a kneeling woman. Her arms are spread and her palms open upward, the way one offers bread. In the temple, Ardentia is spoken of only by the light of a single candle.`,
  ),
)

W(
  SECTIONS.places,
  'itaka',
  l('Itaka', 'Itaka'),
  l(
    `Malá vzducholoď s nízkym, dravým tvarom, akoby niekto dal myšlienke rýchlosti hmatateľnú kožu. Trup z tmavého kovu nevracia svetlo ako oceľ; pije ho. Nepraská olejom ani nedymí. Nesie ju tichý parný pohon a vrtule na výložníkoch sa točia takmer lenivo.\n\nNa prove nesie kanón, absurdne veľký na také útle telo.\n\nPostavil ju Renn. Posádku tvoria starí lišiaci so šedivými čeľusťami a zjazvenými rukami, ktorí obchodujú bez úsmevov. Vozia súčiastky s rezmi, aké nepoznajú nyauské ani nevrisské dielne. Odkiaľ, to nepovedia nikdy.`,
    `A small airship with a low, predatory shape, as if someone had given the idea of speed a skin you could touch. Her dark metal hull does not throw light back like steel; it drinks it. She neither crackles with oil nor smokes. A quiet steam drive carries her, and the propellers on her outriggers turn almost lazily.\n\nOn her prow sits a cannon, absurdly large for so slender a body.\n\nRenn built her. Her crew are old dog-foxes with grey jowls and scarred hands who trade without smiling. They carry machine parts with cuts no workshop in Nyau or Nevriss can match. Where from, they never say.`,
  ),
)

W(
  SECTIONS.sky,
  'sai',
  l('Sai', 'Sai'),
  l(
    `Mesiac Ahila. Obrovský, jantárový, s prstencom. Jeho gravitácia ovplyvňuje všetko na povrchu.\n\nSai obieha Ahil každých štyridsať hodín, no z povrchu sa jeho cyklus vníma raz za deň, s miernym posunom. Keď je nad hlavou, nastáva *ľahká hodina*; keď je na odvrátenej strane, *ťažká*.\n\nKeď Sai zakryje hviezdu, prstenec žiari ako ohnivý kruh. To je *Blin*, žmurknutie Sai. Vtedy sa ľud modlí: „Matka zatvára Oko.“`,
    `Ahil's moon. Vast, amber, ringed. Its pull touches everything on the surface.\n\nSai circles Ahil every forty hours, yet from the ground its cycle is felt once a day, shifting a little each time. When it stands overhead comes the *light hour*; when it is on the far side, the *heavy hour*.\n\nWhen Sai covers the star, its ring burns like a circle of fire. That is the *Blin*, the blink of Sai. Then people pray: “The Mother is closing the Eye.”`,
  ),
)

W(
  SECTIONS.sky,
  'infera',
  l('Infera', 'Infera'),
  l(
    `*Diablovo Oko.* Jasná červená „hviezda“ na nočnej oblohe.\n\nV Nevriss a v Nyau sa pred ňou schovávajú. Keď na oblohe zostane len Infera bez Sai, nastáva najtemnejšia hodina noci.`,
    `*The Devil's Eye.* A bright red “star” in the night sky.\n\nIn Nevriss and Nyau people hide from it. When only Infera remains in the sky, without Sai, the darkest hour of the night begins.`,
  ),
)

W(
  SECTIONS.history,
  'chronicle',
  l('Kroniky Ahila', 'The Chronicles of Ahil'),
  l(
    `Kroniky Ahila poznajú dva veky. Medzi nimi stojí Veľká Potopa.\n\n*Prvý vek*\n0 — Prvý Príchod. Z hviezd zostúpia Matkine deti, prví Varietas.\n~300 — Éra Temnoty. Prízraky sa rodia z chorého prachu. Varietas odchádzajú na pevninu a zakladajú Nevriss.\n~700 — Druhý Príchod. Z temnôt vyjdú Ex Inferis. Prinášajú moc, ale aj hnev a vojnu.\n~800 — Vzostup nevrisského námorného impéria. Kolonizácia južného pobrežia.\n~850 — Bitka v Atranskej úžine. Ex Inferis tam dostanú od líšok výprask; po vojne vznikne na východe Kitsune.\n~1${NB}124 — Objavenie Nyau. Zo stretnutia kolonistov s domorodým kultom Knihy El vyrastie Chrám El, prvé Eltárie a Cirkev, ktorá sa rozšíri po celej Terre.\n\n*Veľká Potopa*\n~1${NB}499 — Podmorské erupcie. Tsunami zničia pobrežné mestá, popol zahalí oblohu. Pád Nevrissu.\n\n*Druhý vek*\n~712 — Tretí Príchod. Z neba pristane loď plná Makov. V tom istom roku Lekcia Krvi.\n~712 – 900 — Éra Objavov.\n~900 — Tichá technológia.\n~1${NB}501 — Rennova smrť.\n~1${NB}511 — Dnešok.`,
    `The chronicles of Ahil know two ages. Between them stands the Great Flood.\n\n*The First Age*\n0 — The First Coming. The Mother's children descend from the stars: the first Varietas.\n~300 — The Era of Darkness. Phantoms are born from sick dust. The Varietas move to the mainland and found Nevriss.\n~700 — The Second Coming. The Ex Inferis emerge from the darkness, bringing power — and wrath, and war.\n~800 — The rise of the Nevrissian naval empire. The southern coast is colonised.\n~850 — The Battle of the Atran Strait. The foxes give the Ex Inferis a thrashing; after the war, Kitsune is founded in the east.\n~1,124 — The discovery of Nyau. From the meeting of colonists and the native cult of the Book of El grow the Temple of El, the first Eltárias and a Church that spreads across all of Terra.\n\n*The Great Flood*\n~1,499 — Undersea eruptions. Tsunamis destroy the coastal cities, ash veils the sky. The fall of Nevriss.\n\n*The Second Age*\n~712 — The Third Coming. A ship full of Maki lands from the sky. In the same year, the Lesson of Blood.\n~712–900 — The Era of Discovery.\n~900 — Quiet technology.\n~1,501 — Renn's death.\n~1,511 — The present day.`,
  ),
)

W(
  SECTIONS.history,
  'great_flood',
  l('Veľká Potopa', 'The Great Flood'),
  l(
    `Katastrofa spred vyše tristo zím, teda vyše 1${NB}500 rokov. Kroniky ňou delia čas na dva veky.\n\nPodmorské erupcie vyvolali vlny. Tsunami zničili pobrežné mestá a vulkanický popol zahalil oblohu. Padol Nevriss a s ním aj moreplavba; Beladiss, Nyau a ďalšie krajiny sa osamostatnili.\n\nKlíma Ahila sa zmenila navždy. Odvtedy sú zimy tvrdšie. Z čias pred Potopou zostala Staroreč, ktorú dnes ovláda len niekoľko bytostí.`,
    `A catastrophe more than three hundred winters ago — more than 1,500 years. The chronicles divide time into two ages by it.\n\nUndersea eruptions raised the waves. Tsunamis destroyed the coastal cities and volcanic ash veiled the sky. Nevriss fell, and seafaring with it; Beladiss, Nyau and other lands became independent.\n\nAhil's climate changed for ever. The winters have been harder ever since. From the age before the Flood only the Old Tongue remains, and today only a few beings still speak it.`,
  ),
)

W(
  SECTIONS.history,
  'third_coming',
  l('Tretí Príchod', 'The Third Coming'),
  l(
    `Okolo roku 712 druhého veku pristane z neba loď plná Makov, železných ľudí, poslov Matky. Pristanú v Kitsune a začne sa *Vek Poslov*.\n\nV tom istom roku sa Kitsune utopí v hrôze. Lekcia Krvi zničí mesto a iskra je odvtedy zakázaná.\n\nPotom príde *Éra Objavov*. Maki prinesú stroje, kovoobrábanie a inžinierstvo. Varietas sa naučia stavať vzducholode, parné motory a mechanické zbrane a nad mrakmi vzniknú obchodné trasy.\n\nPred ním boli dva. Pri Prvom Príchode zostúpili z hviezd Matkine deti. Pri Druhom vyšli z temnôt Ex Inferis.`,
    `Around the year 712 of the Second Age, a ship full of Maki — iron people, messengers of the Mother — lands from the sky. They come down in Kitsune, and the *Age of Messengers* begins.\n\nIn the same year Kitsune drowns in horror. The Lesson of Blood destroys the city, and the spark has been forbidden ever since.\n\nThen comes the *Era of Discovery*. The Maki bring machines, metalworking and engineering. The Varietas learn to build airships, steam engines and mechanical weapons, and trade routes open above the clouds.\n\nTwo Comings came before it. At the First, the Mother's children descended from the stars. At the Second, the Ex Inferis emerged from the darkness.`,
  ),
)

W(
  SECTIONS.history,
  'lesson_of_blood',
  l('Lekcia Krvi', 'The Lesson of Blood'),
  l(
    `Noc v roku Tretieho Príchodu, keď sa cez Kitsune prevalila blesková vlna prízrakov a zničila všetko, čo stálo. Tisíce mŕtvych. Z miešaného mesta prežili len líšky; Maki prežili v trupe lode. Kitsune sa zmenilo na ruiny.\n\nOdvtedy je iskra zakázaná na celom Ahile.\n\nNasledoval vek *tichej technológie*. Svet rastie, ale bez iskry: všetko beží na pare, etanole, mechanike a Spire. Čo nehorí a nebzučí, to prežije. Progres pokračuje opatrne — vo tme, s jedným okom na oblohe a druhým na zemi.`,
    `The night in the year of the Third Coming when a lightning wave of phantoms rolled through Kitsune and destroyed everything that stood. Thousands dead. Of the mixed city only the foxes survived; the Maki lived through it inside the hull of their ship. Kitsune became ruins.\n\nSince then the spark has been forbidden across all of Ahil.\n\nWhat followed was the age of *quiet technology*. The world grows, but without the spark: everything runs on steam, ethanol, clockwork and Spira. What does not burn and does not hum survives. Progress goes on carefully — in the dark, with one eye on the sky and the other on the ground.`,
  ),
)

W(
  SECTIONS.powers,
  'varietas',
  l('Varietas', 'The Varietas'),
  l(
    `*Varietas sú deti Matky.* Každý nesie v sebe črty zvieraťa, z ktorého bol stvorený: mačky, psa, králika, kozy, líšky či medveďa.\n\nSpoločnosť ich delí na tri kasty podľa toho, koľko zvieraťa nesú na tele: Pursang, Mezra a Ghorki. V Nyau sa krv ráta do desiatej generácie a meria okom.\n\nPodtyp zvieraťa neurčuje kastu. Pursang leopard existuje rovnako ako Ghorki domáca mačka. O kaste rozhoduje krv, nie druh.`,
    `*The Varietas are the Mother's children.* Each carries the traits of the animal they were made from: cat, dog, rabbit, goat, fox or bear.\n\nSociety divides them into three castes by how much of the animal they wear on their bodies: Pursang, Mezra and Ghorki. In Nyau, blood is counted back ten generations and measured by eye.\n\nThe animal subtype does not decide the caste. A Pursang leopard exists just as surely as a Ghorki house cat. Caste is a matter of blood, not species.`,
  ),
)

W(
  SECTIONS.powers,
  'spira',
  l('Spira', 'Spira'),
  l(
    `*Spira* je dar Matky: sila zapísaná v koži a aktivovaná slovom. Umožňuje manipuláciu s hmotou, energiou a priestorom.\n\nJej vzory sa volajú *glyfy*; pri práci svietia na predlaktiach líniami tenkými ako vlas. Prebúdzajú ich *haiku*, krátke slovné formuly, a každý element má vlastnú kadenciu. Haiku je pomalé a bezpečné; Matka ho napísala tak, aby chránilo toho, kto ho hovorí. Bez haiku platíš ty.\n\n*Pentagram* spája päť elementov: Zem, Oheň, Vodu, Vzduch a Soru. Piaty element je zakázaný a v Nyau sa nahlas nevyslovuje.`,
    `*Spira* is the Mother's gift: a power written into the skin and woken by a word. It lets its bearer move matter, energy and space.\n\nIts patterns are called *glyphs*; at work they glow along the forearms in lines as fine as hair. They are woken by *haiku*, short spoken formulas, and every element has its own cadence. A haiku is slow and safe; the Mother wrote it to protect whoever speaks it. Without a haiku, you pay.\n\nThe *Pentagram* binds the five elements: Earth, Fire, Water, Air and Sora. The fifth element is forbidden, and in Nyau no one says it aloud.`,
  ),
)

W(
  SECTIONS.powers,
  'prach',
  l('Prach', 'Dust'),
  l(
    `Starodávna, mocná sila. Staršia než Spira. Pamätá. Lieči. Tvorí. *A čo stvorí, to vlastní.*\n\nNa Ahile znamená prach smrť: zvyšky prízrakov, púšť, rozpad. Kto je vyhoretý a bezcenný, tomu sa nadáva *praška*.\n\nV Diss sa za vlnolamom nekope tam, kde je piesok na dne čierny. Prečo? Lebo je čierny.`,
    `An ancient, mighty force. Older than Spira. It remembers. It heals. It creates. *And what it creates, it owns.*\n\nOn Ahil, dust means death: the remains of phantoms, desert, decay. Whoever is burnt out and worthless gets called a *praška*.\n\nIn Diss, nobody digs beyond the breakwater where the sand on the seabed is black. Why? Because it is black.`,
  ),
)

W(
  SECTIONS.powers,
  'prizraky',
  l('Prízraky', 'Phantoms'),
  l(
    `Bytosti utkané z prachu. Niektoré majú tvar, niektoré sú len chlad a prítomnosť. Všetky sú nebezpečné.\n\nPrvé sa zrodili z chorého prachu v Ére Temnoty. V roku Tretieho Príchodu zničila ich blesková vlna Kitsune; odvtedy sa mesto pred nimi skrýva za stenami Metaru, ktoré ich neprepustia.\n\nBytosť schopná prízraky ovládať a vyháňať nesie titul *exorcista*. Ľud jej hovorí *gōstar* — nie z urážky, zo strachu.`,
    `Beings woven of dust. Some have a shape; some are only cold and presence. All of them are dangerous.\n\nThe first were born from sick dust in the Era of Darkness. In the year of the Third Coming a lightning wave of them destroyed Kitsune; since then the city has hidden from them behind the walls of Metaru, which will not let them through.\n\nOne who can command and banish phantoms bears the title of *exorcist*. Common folk call such a one a *gōstar* — not as an insult, but out of fear.`,
  ),
)

W(
  SECTIONS.powers,
  'maki',
  l('Maki', 'The Maki'),
  l(
    `*Mako* — železný človek. Stroj v tvare bytosti. Na celom Ahile ich žije len niekoľko.\n\nPrišli pri Treťom Príchode v lodi, ktorá pristála v Kitsune, a kroniky ich volajú poslami Matky. Naučili Varietas stavať stroje. Najdrahšie chronografy robia Maki a dedia sa celé generácie.\n\nV starých listinách stojí namiesto Ahil *Achilles*. Tak to dnes vysloví už len Mako.`,
    `*Mako* — an iron man. A machine in the shape of a living being. Only a handful of them live on all of Ahil.\n\nThey came with the Third Coming, in a ship that landed in Kitsune, and the chronicles call them the Mother's messengers. They taught the Varietas to build machines. The finest chronographs are made by the Maki and handed down for generations.\n\nOld charters write *Achilles* where we say Ahil. Only a Mako still says it that way.`,
  ),
)

W(
  SECTIONS.powers,
  'ex_inferis',
  l('Ex Inferis', 'Ex Inferis'),
  l(
    `*Tí, čo sa vrátili z Pekla.* Starodávne bytosti, staršie než Varietas.\n\nChrámové texty o nich hovoria ako o bytostiach, čo prišli z hĺbky a niesli so sebou hnev, ktorý nemal koniec. Z temnôt vyšli pri Druhom Príchode a priniesli moc, ale aj vojnu. V Atranskej úžine im líšky uštedrili výprask.`,
    `*Those who returned from Hell.* Ancient beings, older than the Varietas.\n\nThe temple texts call them beings who came up from the deep, bearing a wrath without end. They emerged from the darkness at the Second Coming and brought power — and war. In the Atran Strait the foxes gave them a thrashing.`,
  ),
)

// ============================================================================ calendar
const C = (section: CodexSection, id: string, title: L, body: L) => add('calendar', section, `cal.${id}`, title, body)

C(
  SECTIONS.time,
  'year',
  l('Ahilský rok', 'The Ahilian year'),
  l(
    `*Na Ahile sa čas nemeria. Prežíva sa.*\n\nAhilský rok má 440 dní rozdelených do jedenástich mesiacov po štyridsať dní. Jeden ahilský deň trvá približne dvadsaťjeden hodín.\n\nKaždý mesiac sa delí na dve polovice po dvadsať dní: *svetlú* — čas práce, siatby a obchodu — a *tmavú* — čas odpočinku, rituálov a introspekcie. Na kruhu je svetlá polovica každého mesiaca vnútri vľavo, tmavá vpravo.`,
    `*On Ahil, time is not measured. It is survived.*\n\nThe Ahilian year has 440 days divided into eleven months of forty days each. One Ahilian day lasts about twenty-one hours.\n\nEvery month is split into two halves of twenty days: the *light* half — a time for work, sowing and trade — and the *dark* half — a time for rest, ritual and reflection. On the wheel, the light half of each month lies on the inner left, the dark half on the right.`,
  ),
)

C(
  SECTIONS.time,
  'day',
  l('Denný cyklus', 'The day cycle'),
  l(
    `Mesiac Sai obieha Ahil každých štyridsať hodín, no z povrchu sa gravitačný cyklus vníma raz za deň — s miernym posunom každým dňom.\n\nKeď je Sai nad hlavou, gravitácia klesá na normálnu úroveň: *ľahká hodina*. Telo pláva a každý krok je takmer tanečný. Keď je Sai na odvrátenej strane, gravitácia stúpa približne o tretinu: *ťažká hodina*. Vzduch je ťažší, pohyb pomalší.\n\nCelý život na Ahile sa riadi týmto rytmom. Chronograf má na ciferníku dvadsaťjeden dielikov.`,
    `Sai circles Ahil every forty hours, yet from the surface its gravitational cycle is felt once a day — shifting slightly with each day.\n\nWhen Sai stands overhead, gravity drops to its normal level: the *light hour*. The body floats and every step is almost a dance. When Sai is on the far side, gravity rises by about a third: the *heavy hour*. The air is thicker, movement slower.\n\nAll life on Ahil follows this rhythm. A chronograph has twenty-one marks on its dial.`,
  ),
)

C(
  SECTIONS.time,
  'seasons',
  l('Sezóny a zimy', 'Seasons & winters'),
  l(
    `Veľké ročné obdobia trvajú po päť ahilských rokov: jedno leto a jedna zima. Prechod medzi nimi sa volá *Lámanie*.\n\nVarietas merajú vek v prežitých zimách. „Má štyri zimy“ znamená približne dvadsať rokov. Od Veľkej Potopy sú zimy tvrdšie.`,
    `The great seasons last five Ahilian years each: one summer and one winter. The passage between them is called the *Breaking*.\n\nThe Varietas count their age in winters survived. “She has four winters” means about twenty years. Since the Great Flood the winters have been harder.`,
  ),
)

interface MonthDef {
  id: string
  name: string
  sk: string
  en: string
  moreSk?: string
  moreEn?: string
}

const MONTHS: MonthDef[] = [
  { id: 'rin', name: 'Rin', sk: 'Nový rok. Obnova.', en: 'The new year. Renewal.' },
  { id: 'tai', name: 'Tai', sk: 'Extrémne prílivy. Nebezpečné pobrežie.', en: 'Extreme tides. A dangerous coast.' },
  { id: 'haru', name: 'Haru', sk: 'Rast. Siatba.', en: 'Growth. Sowing.' },
  { id: 'sol', name: 'Sol', sk: 'Najdlhšie dni v roku. Zenit.', en: 'The longest days of the year. The zenith.' },
  { id: 'min', name: 'Mīn', sk: 'Zber. Plné sklady. Obchod.', en: 'Harvest. Full granaries. Trade.' },
  {
    id: 'saimo',
    name: 'Saimō',
    sk: 'Sai festival. Náboženský sviatok. Svadby.',
    en: 'The Sai festival. A holy feast. Weddings.',
    moreSk: 'Sain vlastný mesiac. Keď v Saimō Matka zavrie Oko, ľud v tom hľadá znamenie.',
    moreEn: "Sai's own month. When the Mother closes the Eye in Saimō, people look for an omen in it.",
  },
  {
    id: 'tor',
    name: 'Tōr',
    sk: 'Festival svetiel. Lampióny na vode. Spomienka na mŕtvych.',
    en: 'The festival of lights. Lanterns on the water. Remembrance of the dead.',
    moreSk:
      'V Nyau stúpajú v noci festivalu nad Chrámom tisíce lampiónov. Cez festival sa nelieta: tisíc horiacich papierov nad mestom a nad hlavou plyn, to je krátky rozhovor. Pod maskami sú si v tú noc všetky kasty rovné. Aspoň naoko.',
    moreEn:
      'In Nyau, on the night of the festival, thousands of lanterns rise above the Temple. Nothing flies during the festival: a thousand burning papers over the city and a bag of gas over your head make for a short conversation. Under the masks, all castes are equal that night. Or pretend to be.',
  },
  {
    id: 'kur',
    name: 'Kūr',
    sk: 'Zatmievacia sezóna. „Matka zatvára Oko.“',
    en: 'Eclipse season. “The Mother is closing the Eye.”',
    moreSk: 'Keď tieň prechádza cez Sai, prstenec zhasína po kúskoch ako lampy na nábreží a vyjdú hviezdy, husté ako soľ vysypaná na čierne súkno — také, aké pri otvorenom Oku nevyjdú nikdy.',
    moreEn: 'As the shadow crosses Sai, its ring goes out piece by piece like the lamps along a quay, and the stars come out, thick as salt spilled on black cloth — stars that never show while the Eye is open.',
  },
  { id: 'shu', name: 'Shū', sk: 'Padanie. Dažde.', en: 'The falling. Rains.' },
  { id: 'yam', name: 'Yam', sk: 'Najkratšie dni. Tma.', en: 'The shortest days. Darkness.' },
  { id: 'ake', name: 'Ake', sk: 'Posledný mesiac. Príprava na nový Rin.', en: 'The last month. Preparing for a new Rin.' },
]

const ROMAN_MONTH = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

/** Month names in calendar order (for the calendar wheel). */
export const CALENDAR_MONTHS: { id: string; name: string; numeral: string }[] = MONTHS.map((m, i) => ({ id: `cal.${m.id}`, name: m.name, numeral: ROMAN_MONTH[i] }))

MONTHS.forEach((m, i) => {
  const a = i * 40 + 1
  const mid = a + 19
  const b = a + 39
  const n = ROMAN_MONTH[i]
  const daysSk = `*${n}. mesiac · dni ${a} – ${b}*\nSvetlá polovica ${a} – ${mid}, tmavá ${mid + 1} – ${b}.`
  const daysEn = `*Month ${n} · days ${a}–${b}*\nLight half ${a}–${mid}, dark half ${mid + 1}–${b}.`
  C(
    SECTIONS.months,
    m.id,
    l(`${n} · ${m.name}`, `${n} · ${m.name}`),
    l([m.sk, m.moreSk, daysSk].filter(Boolean).join('\n\n'), [m.en, m.moreEn, daysEn].filter(Boolean).join('\n\n')),
  )
})

// ============================================================================ glossary
const G = (section: CodexSection, id: string, title: L, body: L) => add('glossary', section, `gloss.${id}`, title, body)
const T = SECTIONS.terms

G(T, 'ahil', l('Ahil', 'Ahil'), l('Svet, na ktorom žijeme. Zamrznutá planéta s úzkym obyvateľným pásom okolo rovníka. V starých listinách a v chrámovom písme stále stálo *Achilles*; tak to dnes vysloví už len Mako.', 'The world we live on. A frozen planet with a narrow habitable belt around the equator. Old charters and temple script still read *Achilles*; only a Mako would say it that way today.'))
G(T, 'beladiss', l('Beladiss', 'Beladiss'), l('Pobrežná krajina na južnom pobreží Terry. Kedysi kolónia Nevrissu.', 'A coastal land on the southern shore of Terra. Once a colony of Nevriss.'))
G(T, 'blin', l('Blin', 'Blin'), l('Zatmenie. Sai zakryje hviezdu; prstenec žiari ako ohnivý kruh. Z *Saiblin* — „žmurknutie Sai“.', 'An eclipse. Sai covers the star; its ring glows like a circle of fire. From *Saiblin* — “the blink of Sai”.'))
G(T, 'cirkev_el', l('Cirkev El', 'Church of El'), l('Náboženská inštitúcia uctievajúca El ako bohyňu. Sídlo v Nyau. Strážkyne Knihy El nesú titul Eltária.', 'The religious institution that worships El as a goddess. Its seat is in Nyau. The guardians of the Book of El bear the title Eltária.'))
G(T, 'eltaria', l('Eltária', 'Eltária'), l('Strážkyňa Knihy El. Vybraná z najlepšej rodiny, mladá a silná. Chráni Knihu celú generáciu. Keď jej čas uplynie, môže postúpiť do Najvyššej rady. Nie je najvyššia kňažka — je štít.', 'Guardian of the Book of El. Chosen from the finest family, young and strong. She protects the Book for a whole generation. When her time is over, she may rise to the High Council. She is not the high priestess — she is the shield.'))
G(T, 'ex_inferis', l('Ex Inferis', 'Ex Inferis'), l('Tí, čo sa vrátili z Pekla. Starodávne bytosti, staršie než Varietas. V chrámových textoch: bytosti, čo prišli z hĺbky a niesli so sebou hnev, čo nemal koniec.', 'Those who returned from Hell. Ancient beings, older than the Varietas. In the temple texts: beings who came up from the deep, bearing a wrath without end.'))
G(T, 'exorcista', l('Exorcista', 'Exorcist'), l('Titul pre bytosť schopnú ovládať a vyháňať prízraky.', 'The title of one who can command and banish phantoms.'))
G(T, 'glyf', l('Glyf', 'Glyph'), l('Vzor Spiry zapísaný v koži. Aktivuje sa slovom. Základ všetkej mágie.', 'A pattern of Spira written into the skin. It wakes at a word. The foundation of all magic.'))
G(T, 'graw', l('Graw', 'Graw'), l('Severná militaristická krajina. Vyhrievaná teplom zeme. Tvrdia, že sú najsilnejší národ na Ahile.', 'A militarist land in the north, warmed by the heat of the earth. Its people claim to be the strongest nation on Ahil.'))
G(T, 'haiku', l('Haiku', 'Haiku'), l('Krátka slovná formula na aktiváciu glyfov. Každý element má vlastnú kadenciu.', 'A short spoken formula that activates glyphs. Every element has its own cadence.'))
G(
  T,
  'chronograf',
  l('Chronograf', 'Chronograph'),
  l(
    'Prenosné hodiny, mechanické a naťahovacie, s dvadsaťjeden dielikmi na ciferníku, lebo toľko hodín má ahilský deň. Hodinu a minútu zdedili Varietas zo starého sveta, no nikto už nevie, odkiaľ tá miera pochádza; na Ahile nesedí na nič.\n\nNajdrahšie kusy robia Maki a dedia sa celé generácie. O tých najvzácnejších sa hovorí, že sa naťahujú samy, z pohybu toho, kto ich nosí.',
    'A portable timepiece, mechanical and hand-wound, with twenty-one marks on its dial, because that is how many hours an Ahilian day has. The Varietas inherited the hour and the minute from the old world, but no one remembers where the measure came from; on Ahil it fits nothing.\n\nThe finest pieces are made by the Maki and handed down for generations. The rarest of all are said to wind themselves from the movement of whoever wears them.',
  ),
)
G(T, 'infera', l('Infera', 'Infera'), l('Diablovo Oko. Jasná červená „hviezda“ na nočnej oblohe. V Nevriss a Nyau sa pred ňou schovávajú. Keď na oblohe zostane len Infera bez Sai, nastáva najtemnejšia hodina noci.', 'The Devil’s Eye. A bright red “star” in the night sky. In Nevriss and Nyau people hide from it. When only Infera remains in the sky, without Sai, the darkest hour of the night begins.'))
G(T, 'kitsune', l('Kitsune', 'Kitsune'), l('Ruiny kedysi veľkého mesta na východe Terry. Malá komunita žije v udržiavanom jadre medzi zvyškami starej slávy.', 'The ruins of a once-great city in the east of Terra. A small community lives in its maintained core among the remnants of old glory.'))
G(T, 'kniha_el', l('Kniha El', 'Book of El'), l('Posvätný text Cirkvi El. Originál má dosky z neznámeho materiálu, tmavé a matné ako obsidián. Posledné strany sú v cudzom jazyku, ktorý nikto nedokáže prečítať.', 'The sacred text of the Church of El. The original has covers of an unknown material, dark and dull as obsidian. Its last pages are written in a foreign tongue that no one can read.'))
G(T, 'kult_matky', l('Kult Matky', 'Cult of the Mother'), l('Najrozšírenejšie náboženstvo Varietas. Uctieva Matku — bytosť, ktorá stvorila Varietas a dala im Spiru.', 'The most widespread faith among the Varietas. It worships the Mother — the being who created the Varietas and gave them Spira.'))
G(T, 'lekcia_krvi', l('Lekcia Krvi', 'Lesson of Blood'), l('Noc v roku Tretieho Príchodu, keď sa cez Kitsune prevalila vlna prízrakov. Z miešaného mesta prežili len líšky. Odvtedy je iskra zakázaná na celom Ahile.', 'The night in the year of the Third Coming when a wave of phantoms rolled through Kitsune. Of the mixed city only the foxes survived. Since then the spark has been forbidden across all of Ahil.'))
G(T, 'lahka_hodina', l('Ľahká hodina', 'Light hour'), l('Časť dňa, keď je Sai nad hlavou a gravitácia klesá.', 'The part of the day when Sai stands overhead and gravity eases.'))
G(T, 'mako', l('Mako', 'Mako'), l('Železný človek. Stroj v tvare bytosti. Na celom Ahile ich žije len niekoľko.', 'An iron man. A machine in the shape of a living being. Only a handful of them live on all of Ahil.'))
G(T, 'metaru', l('Metaru', 'Metaru'), l('Obrovský kovový trup na svahu nad Kitsune. Býva v ňom Felix a mesto sa doň skrýva pred prízrakmi; jeho steny ich neprepustia. Tak ho volá Kitsune; Yera mu hovorí Železný chrám.', 'A colossal metal hull on the slope above Kitsune. Felix lives in it, and the city hides inside from the phantoms; its walls will not let them through. That is what Kitsune calls it; Yera calls it the Iron Temple.'))
G(T, 'nevriss', l('Nevriss', 'Nevriss'), l('Kedysi najväčšia ríša na Ahile. Námorné impérium zničené Veľkou Potopou — a s ním aj moreplavba.', 'Once the greatest empire on Ahil. A maritime power destroyed by the Great Flood — and seafaring with it.'))
G(T, 'nyau', l('Nyau', 'Nyau'), l('Teokratická krajina na juhovýchode Terry. Sídlo Cirkvi El. Subtropická klíma.', 'A theocracy in the south-east of Terra. The seat of the Church of El. A subtropical climate.'))
G(T, 'pentagram', l('Pentagram', 'Pentagram'), l('Systém piatich elementov Spiry: Zem, Oheň, Voda, Vzduch a Sora. Piaty element je zakázaný.', 'The system of the five elements of Spira: Earth, Fire, Water, Air and Sora. The fifth element is forbidden.'))
G(T, 'prach', l('Prach', 'Dust'), l('Starodávna, mocná sila. Staršia než Spira. Pamätá. Lieči. Tvorí. A čo stvorí, to vlastní.', 'An ancient, mighty force. Older than Spira. It remembers. It heals. It creates. And what it creates, it owns.'))
G(T, 'prizrak', l('Prízrak', 'Phantom'), l('Bytosť utkaná z prachu. Niektoré majú tvar, niektoré sú len chlad a prítomnosť. Nebezpečné.', 'A being woven of dust. Some have a shape; some are only cold and presence. Dangerous.'))
G(T, 'sai', l('Sai', 'Sai'), l('Mesiac Ahila. Obrovský, jantárový, s prstencom. Jeho gravitácia ovplyvňuje všetko na povrchu.', 'The moon of Ahil. Vast, amber, ringed. Its gravity touches everything on the surface.'))
G(T, 'spira', l('Spira', 'Spira'), l('Dar Matky. Sila zapísaná v koži, aktivovaná slovom. Umožňuje manipuláciu s hmotou, energiou a priestorom.', 'The Mother’s gift. A power written into the skin, woken by a word. It allows the manipulation of matter, energy and space.'))
G(T, 'starorec', l('Staroreč', 'Old Tongue'), l('Jazyk z čias pred Veľkou Potopou. Dnes ju ovláda len niekoľko bytostí.', 'The language of the age before the Great Flood. Only a few beings still speak it today.'))
G(T, 'terra', l('Terra', 'Terra'), l('Hlavný kontinent Ahila. Domov väčšiny Varietas.', 'The main continent of Ahil. Home to most of the Varietas.'))
G(T, 'tazka_hodina', l('Ťažká hodina', 'Heavy hour'), l('Časť dňa, keď je Sai na odvrátenej strane a gravitácia stúpa. Vzduch je ťažší, pohyb pomalší.', 'The part of the day when Sai is on the far side and gravity rises. The air is heavier, movement slower.'))
G(T, 'varietas', l('Varietas', 'Varietas'), l('Deti Matky. Bytosti so zvieracími črtami. Tri kasty: Pursang, Mezra, Ghorki.', 'The Mother’s children. Beings with animal features. Three castes: Pursang, Mezra, Ghorki.'))
G(T, 'velka_potopa', l('Veľká Potopa', 'Great Flood'), l(`Katastrofa spred vyše tristo zím (vyše 1${NB}500 rokov). Podmorské erupcie vyvolali vlny, zničili Nevriss a navždy zmenili klímu Ahila.`, 'A catastrophe more than three hundred winters ago (over 1,500 years). Undersea eruptions raised the waves, destroyed Nevriss and changed the climate of Ahil for ever.'))
G(
  T,
  'vulpini',
  l('Vulpini', 'Vulpini'),
  l(
    '*líšky*\n\nLíščí druh Varietas. Považovaní za takmer vyhynutých. Hovorí sa, že majú skrytú domovinu mimo máp.\n\nPodtyp: líška.\nRozšírenie: Kitsune (ruiny); roztrúsené rodiny, ultra vzácne.\nTakmer vyhynutí.',
    '*foxes*\n\nThe fox kind of the Varietas. Believed to be nearly extinct. They are said to have a hidden homeland beyond the maps.\n\nSubtype: fox.\nRange: Kitsune (the ruins); scattered families, extremely rare.\nNearly extinct.',
  ),
)
G(T, 'zima', l('Zima', 'Winter'), l('Päťročné obdobie chladu. Varietas merajú vek v prežitých zimách.', 'A five-year season of cold. The Varietas measure their age in winters survived.'))

// castes
G(SECTIONS.castes, 'pursang', l('Pursang', 'Pursang'), l('*I. kasta*\n\nNajjemnejšie zvieracie črty: uši, chvost, oči. Šľachta, kňazi, učenci. Najvyššie postavenie.', '*First caste*\n\nThe subtlest animal features: ears, tail, eyes. Nobility, priests, scholars. The highest standing.'))
G(SECTIONS.castes, 'mezra', l('Mezra', 'Mezra'), l('*II. kasta*\n\nZmiešaný vzhľad. Výraznejšie zvieracie črty: srsť, pazúry, tesáky. Remeselníci, vojaci, obchodníci. Stredná vrstva.', '*Second caste*\n\nA mixed appearance. Stronger animal features: fur, claws, fangs. Craftsmen, soldiers, merchants. The middle stratum.'))
G(SECTIONS.castes, 'ghorki', l('Ghorki', 'Ghorki'), l('*III. kasta*\n\nVýrazne zvierací vzhľad. Silní, odolní, spoločensky utláčaní. Robotníci, sluhovia. Najnižšie postavenie.', '*Third caste*\n\nA strongly animal appearance. Strong, hardy, socially oppressed. Labourers, servants. The lowest standing.'))

// species
const SP = SECTIONS.species
G(SP, 'felis', l('Felis', 'Felis'), l('*mačky*\n\nPodtypy: domáca mačka, leopard, rys, puma, lev.\nRozšírenie: celá Terra.\nDominantný druh (~70 %).', '*cats*\n\nSubtypes: house cat, leopard, lynx, puma, lion.\nRange: all of Terra.\nDominant (~70%).'))
G(SP, 'canis', l('Canis', 'Canis'), l('*psy*\n\nPodtypy: vlk, pes, šakal.\nRozšírenie: celá Terra, silní v Graw.\nBežný druh (~15 %).', '*dogs*\n\nSubtypes: wolf, dog, jackal.\nRange: all of Terra, strongest in Graw.\nCommon (~15%).'))
G(SP, 'lepus', l('Lepus', 'Lepus'), l('*králiky*\n\nPodtypy: králik, zajac.\nRozšírenie: sever Terry, Raiju.\nStredne rozšírený (~6 %).', '*rabbits*\n\nSubtypes: rabbit, hare.\nRange: the north of Terra, Raiju.\nModerate (~6%).'))
G(SP, 'capra', l('Capra', 'Capra'), l('*kozy*\n\nPodtypy: koza, kozorožec.\nRozšírenie: Nevriss, Beladiss.\nVzácny (~3 %), elitný.', '*goats*\n\nSubtypes: goat, ibex.\nRange: Nevriss, Beladiss.\nRare (~3%), elite.'))
G(SP, 'ursus', l('Ursus', 'Ursus'), l('*medvede*\n\nPodtyp: medveď.\nRozšírenie: severné lesy.\nIzolované kmene.', '*bears*\n\nSubtype: bear.\nRange: the northern forests.\nIsolated tribes.'))

// slang
const SN = SECTIONS.slangNyau
const nyau = (sk: string, en: string) => l(`*Nyau — prístav, zmes kultúr*\n\n${sk}`, `*Nyau — a port, a mix of cultures*\n\n${en}`)
G(SN, 'kark', l('Kark', 'Kark'), nyau('Najbežnejšia prístavná nadávka. Ekvivalent „Kurva!“ Zvuk vykašliavania. Rýchle a sečné.', 'The most common curse in the harbour, the equivalent of “Fuck!” The sound of hawking something up. Quick and cutting.'))
G(SN, 'rossa', l('Rossa', 'Rossa'), nyau('Mierny expletív. „K čertu.“ V prístave je hrdza všade — synonymum pre niečo hnusné, ale bežné.', 'A mild expletive: “Damn it.” In the harbour, rust is everywhere — a word for something foul but ordinary.'))
G(SN, 'hydrak', l('Hydrák', 'Hydrák'), nyau('Šialenec, nestabilný maniak. Najväčší strach na vzducholodiach je výbuch vodíka. Kto je nepredvídateľný, ten môže vybuchnúť aj s tebou.', 'A lunatic, an unstable maniac. The greatest fear aboard an airship is a hydrogen explosion. Whoever is unpredictable might blow up and take you with him.'))
G(SN, 'ankra', l('Ankra', 'Ankra'), nyau('Zbytočný člen posádky, mŕtva váha. Čo ťa ťahá ku dnu.', 'A useless crewman, dead weight. Whatever drags you to the bottom.'))
G(SN, 'bilgash', l('Bilgash', 'Bilgash'), nyau('Úbožiak, potkan. Kal z podpalubia, najhoršia špina na palube.', 'A wretch, a rat. Bilge sludge, the worst filth aboard.'))
G(SN, 'draholl', l('Draholl', 'Draholl'), nyau('Vzducholoď, čo už nevzlietne. Koniec kariéry, dôchodok, aj impotencia.', 'An airship that will never fly again. The end of a career, retirement — and impotence.'))

const SKt = SECTIONS.slangKitsune
const kit = (sk: string, en: string) => l(`*Kitsune — líščí slang*\n\n${sk}`, `*Kitsune — fox slang*\n\n${en}`)
G(SKt, 'sho', l('Sho', 'Sho'), kit('Líščia nadávka. Ekvivalent „Hovno“ alebo „Kurva“. Krátke, úsečné slovo pri náhlej frustrácii. Používajú ho Vulpini a všetci, čo žijú v ich blízkosti.', 'A fox curse, the equivalent of “Shit” or “Fuck”. A short, clipped word for sudden frustration. Used by the Vulpini and everyone who lives near them.'))
G(SKt, 'yip', l('Yip', 'Yip'), kit('Ostré zvolanie. „Aha!“ alebo „Dočerta!“ Onomatopoja líščieho štekania. Rýchle varovanie alebo frustrácia.', 'A sharp exclamation: “Aha!” or “Dammit!” An echo of a fox’s bark. A quick warning, or frustration.'))
G(SKt, 'tss', l('Tss', 'Tss'), kit('Univerzálny líščí expletív. Syčanie — krátke, ostré. Ostatné druhy to ani nespoznajú ako nadávku.', 'The all-purpose fox expletive. A hiss — short and sharp. Other species do not even recognise it as a curse.'))
G(SKt, 'barles', l('Barles', 'Barles'), kit('Vyhnanec, stratený, bez domova. Pre líšky je nora prežitie. Stratiť ju znamená stratiť posledné útočisko.', 'An outcast, lost, homeless. For foxes the den is survival. To lose it is to lose the last refuge.'))
G(SKt, 'naintei', l('Naintei', 'Naintei'), kit('Klamár, manipulátor. Z mytológie deväťchvostej líšky. Chvost je tvár — kto má deväť, nikdy neukáže tú pravú.', 'A liar, a manipulator. From the myth of the nine-tailed fox. A tail is a face — whoever has nine never shows the true one.'))
G(SKt, 'dimka', l('Dimka', 'Dimka'), kit('Zbabelec, kto zmizne, keď sa veci pokazia. Skutočná líška nezmizne zo strachu — zmizne strategicky. Kto zmizne zo strachu, je dimka.', 'A coward who vanishes when things go wrong. A real fox never disappears out of fear — she disappears strategically. Whoever vanishes out of fear is a dimka.'))

const SNv = SECTIONS.slangNevriss
const nev = (sk: string, en: string) => l(`*Nevriss — juh, mačacie Varietas*\n\n${sk}`, `*Nevriss — the south, cat Varietas*\n\n${en}`)
G(SNv, 'szar', l('Szar', 'Szar'), nev('Univerzálna nadávka. Ekvivalent „Kurva“ alebo „Do riti“. S-zvuk na začiatku je mačacie prsknutie.', 'The all-purpose curse, the equivalent of “Fuck” or “Shit”. The s at its start is a cat’s hiss.'))
G(SNv, 'driap', l('Driap', 'Driap'), nev('Ostré zvolanie pri bolesti alebo šoku. „Au, kurva!“ Onomatopoja — zvuk pazúrov po dreve.', 'A sharp cry of pain or shock: “Ow, fuck!” An onomatopoeia — the sound of claws on wood.'))
G(SNv, 'kloles', l('Klōles', 'Klōles'), nev('Slaboch, bezmocný, vykastrovaný. Mačke odstrániť pazúry znamená zbaviť ju identity.', 'A weakling, powerless, gelded. To pull a cat’s claws is to strip it of who it is.'))
G(SNv, 'detteil', l('Detteil', 'Detteil'), nev('Kto sa vzdal, nemá v sebe boj. Mačka s bezvládnym chvostom je chorá alebo umierajúca.', 'One who has given up, with no fight left in them. A cat with a limp tail is sick or dying.'))
G(SNv, 'priadka', l('Priadka', 'Priadka'), nev('Podlizovač, zbabelec. Kto pradie pri mocných, ten sa poddáva.', 'A bootlicker, a coward. Whoever purrs before the powerful has already surrendered.'))

const SG = SECTIONS.slangGeneral
const gen = (sk: string, en: string) => l(`*Všeobecné a kastové*\n\n${sk}`, `*General & caste*\n\n${en}`)
G(SG, 'bist', l('Bīst', 'Bīst'), gen('Najrozšírenejší kastový slur, ktorým Pursangi volajú Ghorki. Kto je bīst, nie je osoba.', 'The most widespread caste slur, used by the Pursang for the Ghorki. Whoever is a bīst is not a person.'))
G(SG, 'skinna', l('Skinna', 'Skinna'), gen('Ghorki urážka pre Pursangov. Pursang bez srsti je neprirodzenosť.', 'A Ghorki insult for the Pursang. A Pursang without fur is something unnatural.'))
G(SG, 'gostar', l('Gōstar', 'Gōstar'), gen('Slangový názov pre exorcistu. Nie urážka — strach. Kto loví duchov, je gōstar.', 'Slang for an exorcist. Not an insult — fear. Whoever hunts ghosts is a gōstar.'))
G(SG, 'praska', l('Praška', 'Praška'), gen('Vyhoretý, bezcenný. Prach na Ahile znamená smrť — zvyšky prízrakov, púšť, rozpad.', 'Burnt out, worthless. On Ahil, dust means death — the remains of phantoms, desert, decay.'))

// ============================================================================ people (spoiler-safe first impressions)
const P = (id: string, title: L, body: L) => add('people', null, `people.${id}`, title, body)

P(
  'yera',
  l('Yera', 'Yera'),
  l(
    `*Pursang · Felis · klan Saéli, Nyau*\n\nYerana Saéli, dcéra Prvého Svetla — najstaršej línie Nyau s najsilnejšou Spirou, najjasnejším stromom v nádvorí a najviac povinnosťami. Čierne vlasy, modré oči a tvár, akú Nyau maľuje na chrámové steny.\n\nJe liečiteľka. Stačí jej priložiť dlane na kôru a nájde kameň, ktorý celé zimy tlačí koreň najstaršieho stromu v meste. Číta Staroreč a pozná azda každý verš Knihy El — a predsa jej medzi riadkami čosi chýba.\n\nChrám ju chce za novú Eltáriu. Ešte dva dni je dcérou.`,
    `*Pursang · Felis · clan Saéli, Nyau*\n\nYerana Saéli, daughter of the First Light — Nyau's oldest line, with the strongest Spira, the brightest tree in its courtyard and the most duties. Black hair, blue eyes, and the face Nyau paints on its temple walls.\n\nShe is a healer. She only has to lay her palms on the bark to find the stone that has been pressing on the root of the city's oldest tree for winters on end. She reads the Old Tongue and knows nearly every verse of the Book of El — and still something is missing between the lines.\n\nThe Temple wants her as its next Eltária. For two more days she is a daughter.`,
  ),
)

P(
  'arkot',
  l('Arkot', 'Arkot'),
  l(
    `*Mezra · leopard · Diss*\n\nNakladač z Diss s plecami, ktoré v disských dverách chodili bokom. Ráta všetko: nádychy, hviezdy, údery zvonov, rýchlosť tieňa gondoly po vode. Otec ho to naučil skôr než čítať — a potom odišiel a nechal mu to v rukách namiesto seba.\n\nV Nyau ho pre hladkú tvár a postavu majú za čistokrvného. Je to lož, ktorú nikdy nepovedal; mesto si ju domyslelo samo.\n\nZ domu si vzal jedinú vetu: *Choď a nájdi si to svoje šťastie.*`,
    `*Mezra · leopard · Diss*\n\nA dockhand from Diss, with shoulders that had to turn sideways through Diss doorways. He counts everything: breaths, stars, the strokes of bells, the speed of a gondola's shadow on the water. His father taught him that before he taught him to read — then left, and left him that instead of himself.\n\nIn Nyau his smooth face and build make people take him for a pureblood. It is a lie he never told; the city made it up on its own.\n\nHe took a single sentence from home: *Go and find that luck of yours.*`,
  ),
)

P(
  'flint',
  l('Flint', 'Flint'),
  l(
    `*Mezra · rys · Diss*\n\nArkotov najlepší priateľ z uličiek Diss. Rys s roztrhnutým uchom, klobúkom na tvári a revolverom za pásom, ktorý čistí, aj keď je čistý — prsty potrebujú prácu.\n\nStaví sa o všetko a kocky mu padajú častejšie, než dovoľujú. Má úsmev pripravený na veriteľov, ženy aj strážnikov a na každého funguje z inej strany. Vrecia nenosí. Nikdy.`,
    `*Mezra · lynx · Diss*\n\nArkot's best friend from the alleys of Diss. A lynx with a torn ear, a hat over his face and a revolver at his belt that he cleans even when it is clean — his fingers need the work.\n\nHe bets on anything, and his dice come up more often than dice should. He keeps one smile ready for creditors, women and watchmen alike, and it works on each of them from a different side. He doesn't carry sacks. Ever.`,
  ),
)

P(
  'soril',
  l('Soril', 'Soril'),
  l(
    `*Pursang · Felis · Chrám El, Nyau*\n\nEltária Chrámu El, strážkyňa Knihy. Malá, vychudnutá, s tvárou, ktorá sa za celú modlitbu nepohne, a s očami, ktoré sa hýbu, aj keď tvár nie.\n\nNikdy nezvýši hlas. Stačí, že prestane hovoriť, a kňažky okolo nej stíchnu skôr, než dopovie. Posiela Yeru k stromom, lebo stromy sú ťažšie než ľudia.\n\nS Najvyššou radou už hovorila o Yere.`,
    `*Pursang · Felis · Temple of El, Nyau*\n\nThe Eltária of the Temple of El, guardian of the Book. Small and gaunt, with a face that does not move through an entire prayer and eyes that move even when it doesn't.\n\nShe never raises her voice. She simply stops speaking, and the priestesses around her fall silent before she has finished. She sends Yera to the trees, because trees are harder than people.\n\nShe has already spoken to the High Council about Yera.`,
  ),
)

P(
  'nira',
  l('Nira', 'Nira'),
  l(
    `*Mezra · Felis · stráž klanu Saéli*\n\nYerina strážkyňa od jej prvej zimy. Vysoká Mezra v sivej róbe bez jedinej ozdoby; jedno oko, druhé pod širokým pruhom sivého plátna, uviazaným tak samozrejme, ako sa nosí opasok. Pod róbou sa jej aj pri obyčajnej chôdzi hýbu ramená tela stavaného na boj.\n\nVraví sa, že slúžila už Yerinmu dedovi. Chladný pohľad Saéli na ňu neplatí. Pozná Yeru lepšie, než Yera pozná samu seba.`,
    `*Mezra · Felis · guard of clan Saéli*\n\nYera's guard since her first winter. A tall Mezra in a grey robe without a single ornament; one eye, the other under a broad strip of grey linen, tied as naturally as a belt. Even at an ordinary walk, the shoulders of a body built for fighting move beneath the robe.\n\nThey say she already served Yera's grandfather. The cold Saéli stare does not work on her. She knows Yera better than Yera knows herself.`,
  ),
)

P(
  'tami',
  l('Tami', 'Tami'),
  l(
    `*Pursang · Vulpini · Itaka*\n\nTami Rennsdóttir. Priveľmi mladá na takú vzducholoď — a predsa sa zdá, že Itaka patrí jej, a nie ona Itake. Hriva medených vlasov, mosadzné letecké okuliare na čele, dve automatické pištole a úzke puzdro s rapírom. A oči priveľmi modré na líšku.\n\nJe dcérou Renna, ktorý Itaku postavil. V dokoch sa hovorí, že keď mu piráti vzali loď aj s dcérou a jeho samého zabili, ušla s Itakou domov. Sama.`,
    `*Pursang · Vulpini · Itaka*\n\nTami Rennsdóttir. Far too young for an airship like that — and yet Itaka seems to belong to her rather than the other way round. A mane of copper hair, brass flying goggles on her forehead, two automatic pistols and a narrow case holding a rapier. And eyes too blue for a fox.\n\nShe is the daughter of Renn, who built Itaka. On the docks they say that when pirates took the ship, and his daughter with it, and killed Renn himself, she escaped with Itaka and flew home. Alone.`,
  ),
)

P(
  'saburo',
  l('Saburo', 'Saburo'),
  l(
    `*Pursang · Vulpini · Itaka*\n\nStarý lišiak vo vyblednutom trojhrannom klobúku, ktorý vyzerá starší než on sám. Tamin dedo. Na konci rampy stojí so skríženými rukami a prezerá si svet s pokojom niekoho, kto videl viac svetov, než má za sebou zím.\n\nSlová si šetrí pre chod Itaky. Jantárové oči má také staré, že sa v nich čas splietol do uzla. Videl tisícky chlapcov a zapamätal si troch.`,
    `*Pursang · Vulpini · Itaka*\n\nAn old dog-fox in a faded tricorn that looks older than he is. Tami's grandfather. He stands at the foot of the ramp with his arms crossed, taking in the world with the calm of someone who has seen more worlds than he has winters behind him.\n\nHe saves his words for running Itaka. His amber eyes are so old that time has tied itself in a knot in them. He has seen thousands of boys and remembered three.`,
  ),
)

P(
  'felix',
  l('Felix', 'Felix'),
  l(
    `*Mako · Metaru*\n\n„Starý mrzút z kopca.“ Šľachovitý, mierne zhrbený, s tmavými, husto prešedivenými vlasmi, ktoré mu divoko odstávajú od hlavy. Namiesto zreníc má chladné sklo so zložitou kresbou.\n\nNadáva v jazyku, ktorému nikto nerozumie, a stavia stroje z čohokoľvek, čo Kitsune nájde v ruinách. Býva v Metaru. Smeje sa krátko a chrčivo, zvnútra hrudníka — tak teplo, ako by stroj nemal.`,
    `*Mako · Metaru*\n\n“The old grouch up the hill.” Wiry, slightly stooped, with dark hair thick with grey that sticks out wildly from his head. Where his pupils should be there is cold glass with an intricate pattern.\n\nHe swears in a language nobody understands and builds machines out of whatever Kitsune finds in the ruins. He lives in Metaru. His laugh is short and rasping, from deep in his chest — warmer than any machine's has a right to be.`,
  ),
)

P(
  'aether',
  l('Aether', 'Aether'),
  l(
    `*nie celkom vlk · Kitsune*\n\nObrovský sivý vlk, vysoký ako ťažný kôň. Masívne ramená pod hustou srsťou sa prelievajú nehlučne, bez jediného šuchnutia pazúra po kameni; pohybuje sa ako tieň hory. Oči má jantárové a v nich prastarý pokoj.\n\nChrámové texty v Nyau spomínajú *Strieborných zo severu*, čo kráčali po boku Prvých, kým nadobro nezmizli v snehoch. Aether hovorí. Starorečou.`,
    `*not quite a wolf · Kitsune*\n\nA huge grey wolf, as tall as a draught horse. Massive shoulders shift under thick fur without a sound, without a single scrape of claw on stone; he moves like the shadow of a mountain. His eyes are amber, and in them an ancient calm.\n\nThe temple texts of Nyau speak of the *Silver Ones from the north*, who walked beside the First until they vanished into the snows for good. Aether speaks. In the Old Tongue.`,
  ),
)

P(
  'maks',
  l('Maks', 'Maks'),
  l(
    `*človek · sever*\n\nMuž, ktorého treba hľadať v dierach na severe. Nie vlk. Človek. Tmavý oblek, tmavé okuliare, za ktorými sa nič nepohne, a na stole fľaše modrého liehu.\n\nVraj predáva informácie. Za fľaše. Hovorí Starorečou, chrapľavo, starý a unavený. Vzduch okolo neho sa hýbe akosi príliš presne.`,
    `*human · the north*\n\nA man you have to look for in the holes of the north. Not a wolf. A human. A dark suit, dark glasses behind which nothing moves, and bottles of blue spirit on the table.\n\nThey say he sells information. For bottles. He speaks the Old Tongue, hoarse, old and tired. The air around him moves a little too precisely.`,
  ),
)

// ============================================================================ book (canonical verses everyone in Nyau knows)
const B = (id: string, title: L, body: L) => add('book', SECTIONS.canon, `book.${id}`, title, body)

B(
  'temple_copy',
  l('Chrámová kópia', 'The Temple copy'),
  l(
    'Stará, ručne šitá, s doskami z bieleho dreva a stránkami, ktoré v tme jemne žiaria vďaka svietiacemu atramentu, starému písmu a dávnym slovám. Leží na podstavci v strede oltára Chrámu El. Najsvätejší predmet v Nyau.\n\nKňažky z nej čítajú pri každej modlitbe a Saéli dievčatá ju poznajú takmer celú naspamäť. Originál, ktorý strážia Eltárie, nikto z nich nikdy nevidel.\n\n*El je svetlo. El je cesta. El sa vráti.*',
    'Old and hand-sewn, with covers of white wood and pages that glow softly in the dark thanks to luminous ink, old script and ancient words. It rests on a pedestal at the heart of the altar in the Temple of El. The holiest object in Nyau.\n\nThe priestesses read from it at every prayer, and Saéli girls know almost all of it by heart. None of them has ever seen the original the Eltárias guard.\n\n*El is the light. El is the way. El will return.*',
  ),
)
B('canon_2_3', l('Kniha El 2:3', 'Book of El 2:3'), l('*„Raj nezomrie v ohni. Zomrie v tichu, keď stĺpy zostanú stáť, lebo nikto im nepovedal, že je koniec.“*', '*“Paradise will not die in fire. It will die in silence, when the pillars stay standing because no one told them it was over.”*'))
B('canon_2_9', l('Kniha El 2:9', 'Book of El 2:9'), l('*„Nebojte sa noci. Bojte sa toho, kto v nej nepotrebuje oheň.“*', '*“Do not fear the night. Fear the one who needs no fire in it.”*'))
B('canon_2_16', l('Kniha El 2:16', 'Book of El 2:16'), l('*„Blahoslavená je dcéra, ktorá svieti pre svoj ľud. Beda dcére, ktorá svieti len pre seba.“*', '*“Blessed is the daughter who shines for her people. Woe to the daughter who shines only for herself.”*'))
B('canon_3_7', l('Kniha El 3:7', 'Book of El 3:7'), l('*„A tí, čo prišli, zabudli odkiaľ. A tí, čo zostali, nikdy nevedeli kam.“*', '*“And those who came forgot whence. And those who stayed never knew whither.”*'))
B('canon_4_2', l('Kniha El 4:2', 'Book of El 4:2'), l('*„Kto hľadá na mori, nájde najskôr búrku.“*', '*“Whoever searches at sea finds the storm first.”*'))

// ============================================================================ exports

export const CODEX: CodexEntry[] = list

export const CODEX_IDS = new Set(CODEX.map((e) => e.id))

/** Section (sub-heading) of a codex entry, if it has one. */
export function codexSection(id: string): CodexSection | undefined {
  return sectionOf.get(id)
}

/**
 * Alternative spellings content authors might reasonably use. Pass ids
 * through `resolveCodexId` before unlocking to be tolerant of them.
 */
export const CODEX_ALIASES: Record<string, string> = {
  'world.dust': 'world.prach',
  'world.phantoms': 'world.prizraky',
  'world.phantom': 'world.prizraky',
  'world.prizrak': 'world.prizraky',
  'world.mako': 'world.maki',
  'world.diss': 'world.beladiss',
  'world.flood': 'world.great_flood',
  'world.velka_potopa': 'world.great_flood',
  'world.history': 'world.chronicle',
  'world.timeline': 'world.chronicle',
  'world.lekcia_krvi': 'world.lesson_of_blood',
  'world.treti_prichod': 'world.third_coming',
  'world.castes': 'world.varietas',
  'world.iron_temple': 'world.metaru',
  'cal.calendar': 'cal.year',
  'cal.months': 'cal.year',
  'cal.day_cycle': 'cal.day',
  'cal.hours': 'cal.day',
  'cal.winters': 'cal.seasons',
  'cal.zima': 'cal.seasons',
  'cal.sezony': 'cal.seasons',
  'gloss.light_hour': 'gloss.lahka_hodina',
  'gloss.heavy_hour': 'gloss.tazka_hodina',
  'gloss.book_of_el': 'gloss.kniha_el',
  'gloss.church_of_el': 'gloss.cirkev_el',
  'gloss.cult_of_the_mother': 'gloss.kult_matky',
  'gloss.mother': 'gloss.kult_matky',
  'gloss.lesson_of_blood': 'gloss.lekcia_krvi',
  'gloss.great_flood': 'gloss.velka_potopa',
  'gloss.old_tongue': 'gloss.starorec',
  'gloss.glyph': 'gloss.glyf',
  'gloss.exorcist': 'gloss.exorcista',
  'gloss.chronograph': 'gloss.chronograf',
  'gloss.dust': 'gloss.prach',
  'gloss.phantom': 'gloss.prizrak',
  'gloss.winter': 'gloss.zima',
  'gloss.maki': 'gloss.mako',
}

export function resolveCodexId(id: string): string {
  return CODEX_ALIASES[id] ?? id
}
