/**
 * Menu preview: mocks a MenuHost and opens one screen.
 * menus.html?screen=title|pause|settings|save|load|codex|credits|chapters|reader&lang=sk|en
 * Extra: &tab=calendar (codex), &style=book|letter|stone|cipher (reader),
 * &ending=1 (credits), &gallery=1 (codex), &nosave=1 (pause), &locked=1 (chapters), &rm=1 (reduced motion).
 */
import '../ui/theme.css'
import '../ui/menus/menus.css'
import { CODEX } from '../content/codex'
import type { ChapterDef } from '../content/types'
import { Input } from '../engine/Input'
import { SaveStore, type SlotId, type StorageLike } from '../game/Save'
import { loadSettings, type Settings } from '../game/Settings'
import { GameState, type Profile, type SaveData } from '../game/State'
import { l, setLang, type L, type Lang } from '../i18n/i18n'
import { ChapterSelect } from '../ui/menus/ChapterSelect'
import { CodexScreen } from '../ui/menus/CodexScreen'
import { CreditsScreen } from '../ui/menus/CreditsScreen'
import type { MenuHost } from '../ui/menus/MenuHost'
import { PauseMenu } from '../ui/menus/PauseMenu'
import { openReader, syncRootSettings, type ReaderStyle } from '../ui/menus/Reader'
import { SaveLoadMenu } from '../ui/menus/SaveLoadMenu'
import { SettingsMenu } from '../ui/menus/SettingsMenu'
import { TitleScreen } from '../ui/menus/TitleScreen'
import { t } from '../i18n/i18n'

const q = new URLSearchParams(location.search)
const lang = (q.get('lang') === 'en' ? 'en' : 'sk') as Lang
const screen = q.get('screen') ?? 'title'
const logEl = document.getElementById('log')
const log = (...a: unknown[]) => {
  console.log('[menus]', ...a)
  if (logEl) logEl.textContent = a.map(String).join(' ')
}

class MemStorage implements StorageLike {
  private m = new Map<string, string>()
  getItem(k: string): string | null {
    return this.m.get(k) ?? null
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v)
  }
  removeItem(k: string): void {
    this.m.delete(k)
  }
}

const chapters: ChapterDef[] = [
  {
    id: 'ch0',
    index: 0,
    title: l('Vysoká voda', 'High Water'),
    subtitle: l('Dvaja z Diss prilietajú do Nyau', 'Two men from Diss fly into Nyau'),
    pov: 'arkot',
    scenes: [],
    start: '',
  },
  {
    id: 'ch1',
    index: 1,
    title: l('Prvé svetlo', 'First Light'),
    subtitle: l('Strom v chrámovej záhrade prestal svietiť', 'The tree in the temple garden stopped glowing'),
    pov: 'yera',
    epigraph: {
      text: l('„Blahoslavená je dcéra, ktorá svieti pre svoj ľud. Beda dcére, ktorá svieti len pre seba.“', '“Blessed is the daughter who shines for her people. Woe to the daughter who shines only for herself.”'),
      source: l('Kniha El, 2:16', 'The Book of El, 2:16'),
    },
    scenes: [],
    start: '',
  },
  {
    id: 'ch2',
    index: 2,
    title: l('Lampiónový festival', 'The Lantern Festival'),
    subtitle: l('Posledná noc pred zasvätením', 'The last night before the vows'),
    pov: 'yera',
    epigraph: {
      text: l('„Kto stojí medzi dvoma ohňami, nehorí. Len sa pomaly varí.“', '“Whoever stands between two fires does not burn. They only slowly boil.”'),
      source: l('Kniha El, originál, fáza 3', 'The Book of El, original, phase 3'),
    },
    scenes: [],
    start: '',
  },
]
if (q.has('locked')) {
  const extra: [string, string, string, string][] = [
    ['Polnoc', 'Midnight', 'Brány sa zatvárajú', 'The gates are closing'],
    ['Itaka', 'Itaka', 'Loď, ktorá pije svetlo', 'The ship that drinks light'],
    ['Kniha noci', 'The Book of Night', 'Pod chrámom je knižnica', 'Beneath the temple, a library'],
    ['Pokušenie', 'Temptation', '???', '???'],
    ['Korene', 'Roots', '???', '???'],
  ]
  extra.forEach(([sk, en, ssk, sen], i) => chapters.push({ id: `ch${i + 3}`, index: i + 3, title: l(sk, en), subtitle: l(ssk, sen), pov: 'yera', scenes: [], start: '' }))
}

function chapterLabel(id: string): L {
  const c = chapters.find((x) => x.id === id)
  if (!c) return l(id, id)
  return c.index === 0 ? l(`Prológ · ${c.title.sk}`, `Prologue · ${c.title.en}`) : l(`Kapitola ${c.index} · ${c.title.sk}`, `Chapter ${c.index} · ${c.title.en}`)
}

// ---------------------------------------------------------------- saves
const now = Date.now()
const mem = new MemStorage()
const saves = new SaveStore(mem)
const sampleCodex = CODEX.filter((_, i) => i % 3 !== 2).map((e) => e.id)
const base = (over: Partial<SaveData>): SaveData => ({
  version: 1,
  chapterId: 'ch1',
  sceneId: 'garden',
  flags: {},
  rel: {},
  items: [],
  codex: sampleCodex,
  abilities: ['flow'],
  objective: null,
  playtime: 0,
  savedAt: now,
  ...over,
})
saves.write(
  'auto',
  base({
    chapterId: 'ch2',
    sceneId: 'festival',
    playtime: 4520,
    savedAt: now - 2 * 3600 * 1000,
    thumb: 'assets/ui/title_bg.jpg',
    chapterTitle: chapterLabel('ch2'),
    sceneName: l('Námestie pred Chrámom', 'The Temple square'),
    objective: l('Nájdi cestu davom k dokom.', 'Find a way through the crowd to the docks.'),
  }),
)
saves.write(
  '1',
  base({
    chapterId: 'ch1',
    sceneId: 'garden',
    playtime: 1830,
    savedAt: now - 3 * 86400 * 1000,
    chapterTitle: chapterLabel('ch1'),
    sceneName: l('Chrámová záhrada', 'The temple garden'),
  }),
)

// ---------------------------------------------------------------- state
const state = new GameState()
state.chapterId = 'ch2'
state.sceneId = 'festival'
state.playtime = 4711
state.objective = l('Nájdi cestu cez festivalový dav k dokom, kým si ťa nevšimne Nira.', 'Slip through the festival crowd to the docks before Nira notices you.')
for (const id of sampleCodex) state.codex.add(id)
// most recently discovered last
for (const id of ['people.arkot', 'cal.tor', 'world.nyau']) {
  state.codex.delete(id)
  state.codex.add(id)
}

const profile: Profile = {
  chapters: ['ch0', 'ch1', 'ch2'],
  codex: CODEX.filter((_, i) => i % 4 !== 3).map((e) => e.id),
  finished: false,
}

let settings: Settings = { ...loadSettings(), lang, reducedMotion: q.has('rm') }
setLang(lang)
syncRootSettings(settings)
const input = new Input(document.body)
input.bindings = settings.bindings

const host: MenuHost = {
  get settings() {
    return settings
  },
  applySettings(next: Settings) {
    settings = next
    setLang(next.lang)
    input.bindings = next.bindings
    syncRootSettings(next)
    log('applySettings', JSON.stringify({ lang: next.lang, textSpeed: next.textSpeed, textScale: next.textScale, music: next.music, quality: next.quality }))
  },
  saves,
  profile,
  state,
  chapters,
  codexEntries: CODEX,
  input,
  canSave: () => !q.has('nosave'),
  async saveTo(slot: SlotId) {
    const ok = saves.write(slot, state.toSave({ chapterTitle: chapterLabel(state.chapterId), sceneName: l('Námestie pred Chrámom', 'The Temple square') }))
    log('saveTo', slot, ok)
    return ok
  },
  async loadFrom(slot: SlotId) {
    log('loadFrom', slot)
  },
  async newGame() {
    log('newGame')
  },
  async continueGame() {
    log('continueGame')
  },
  async startChapter(id: string) {
    log('startChapter', id)
  },
  async quitToTitle() {
    log('quitToTitle')
  },
  resume() {
    log('resume')
  },
  exitApp() {
    log('exitApp')
  },
  canExit: true,
  sfx: (id: string) => console.log('[sfx]', id),
  chapterLabel,
  version: 'v0.2.0',
}

// ---------------------------------------------------------------- open
function fakeGame(): void {
  const d = document.createElement('div')
  d.id = 'fake-game'
  document.body.prepend(d)
}

const READER: Record<ReaderStyle, { title: L; body: L }> = {
  book: {
    title: l('Kniha El · Kapitola druhá', 'The Book of El · Chapter Two'),
    body: l(
      '*„Raj nezomrie v ohni. Zomrie v tichu, keď stĺpy zostanú stáť, lebo nikto im nepovedal, že je koniec.“*\n\n2:3\n\n*„Nebojte sa noci. Bojte sa toho, kto v nej nepotrebuje oheň.“*\n\n2:9\n\n*„Blahoslavená je dcéra, ktorá svieti pre svoj ľud. Beda dcére, ktorá svieti len pre seba.“*\n\n2:16',
      '*“Paradise will not die in fire. It will die in silence, when the pillars stay standing because no one told them it was over.”*\n\n2:3\n\n*“Do not fear the night. Fear the one who needs no fire in it.”*\n\n2:9\n\n*“Blessed is the daughter who shines for her people. Woe to the daughter who shines only for herself.”*\n\n2:16',
    ),
  },
  letter: {
    title: l('List bez podpisu', 'An unsigned letter'),
    body: l(
      'Ak toto čítaš, Itaka už odletela.\n\nNehľadaj ma v dokoch ani v krčme pod terasami. Vrátim sa, keď Oko znova otvorí. Do tej doby rátaj hviezdy za mňa.\n\n*Choď a nájdi si to svoje šťastie.*',
      'If you are reading this, Itaka has already flown.\n\nDon’t look for me on the docks or in the tavern under the terraces. I will come back when the Eye opens again. Until then, count the stars for me.\n\n*Go and find that luck of yours.*',
    ),
  },
  stone: {
    title: l('Nápis pri vchode', 'Inscription by the door'),
    body: l('Kto sa priblíži,\nten ho aj zobudí.\n\nEON LABKAN · 1 124', 'Whoever draws near\nalso wakes it.\n\nEON LABKAN · 1,124'),
  },
  cipher: {
    title: l('Strana bez mena', 'A page without a name'),
    body: l(
      'Znaky sú ostré a hranaté, zoradené v kruhoch po piatich. Jeden sa opakuje častejšie než ostatné: kruh preťatý zvislou čiarou.\n\nNa okraji niekto drobným šikmým písmom pripísal: *Sora nie je farba. Je to to, čo zostane, keď zhasne všetko ostatné.*',
      'The marks are sharp and angular, set in rings of five. One recurs more than the rest: a circle cut by a vertical line.\n\nIn the margin someone added, in small slanted script: *Sora is not a colour. It is what remains when everything else goes out.*',
    ),
  },
}

function open(name: string): void {
  switch (name) {
    case 'title':
      new TitleScreen(host).open()
      break
    case 'pause':
      fakeGame()
      new PauseMenu(host).open()
      break
    case 'settings':
      fakeGame()
      new SettingsMenu(host).open(() => log('settings closed'))
      break
    case 'save':
    case 'load':
      fakeGame()
      new SaveLoadMenu(host).open(name, () => log(`${name} closed`))
      break
    case 'codex':
      fakeGame()
      new CodexScreen(host).open({ gallery: q.has('gallery'), tab: q.get('tab') ?? undefined }, () => log('codex closed'))
      break
    case 'credits':
      new CreditsScreen(host).open({ ending: q.has('ending') }, () => log('credits done'))
      break
    case 'chapters':
      fakeGame()
      new ChapterSelect(host).open(() => log('chapters closed'))
      break
    case 'reader': {
      fakeGame()
      const style = (q.get('style') ?? 'book') as ReaderStyle
      const doc = READER[style] ?? READER.book
      void openReader({ title: doc.title, body: doc.body, style, t }).then(() => log('reader closed'))
      break
    }
    default:
      log('unknown screen', name)
  }
}

open(screen)
;(window as unknown as { __menus: { open: (n: string) => void; host: MenuHost } }).__menus = { open, host }
