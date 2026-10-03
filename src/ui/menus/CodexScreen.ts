/**
 * Codex & journal, styled after the appendix pages of the novel: a dark
 * parchment spread with the entry list on the left and the page on the right.
 * The calendar tab adds the wheel of the eleven months.
 */
import { CAST } from '../../content/characters'
import { CALENDAR_MONTHS, codexSection, resolveCodexId, type CodexSection } from '../../content/codex'
import type { CodexEntry } from '../../content/types'
import { getLang, l, onLangChange, t, type L } from '../../i18n/i18n'
import type { MenuHost } from './MenuHost'
import { COMMON, Layer, corners, flourish, formatPlaytime, h, hints, richText, roman, s, syncRootSettings } from './Reader'

type Tab = 'journal' | CodexEntry['category']

const TABS: { id: Tab; label: L }[] = [
  { id: 'journal', label: l('Denník', 'Journal') },
  { id: 'book', label: l('Kniha El', 'Book of El') },
  { id: 'world', label: l('Svet', 'World') },
  { id: 'people', label: l('Postavy', 'People') },
  { id: 'glossary', label: l('Slovník', 'Glossary') },
  { id: 'calendar', label: l('Kalendár', 'Calendar') },
]

const S = {
  codex: l('Kódex', 'Codex'),
  journalCodex: l('Denník a kódex', 'Journal & Codex'),
  undiscovered: l('{n} neobjavených', '{n} undiscovered'),
  nothing: l('Zatiaľ nič. Svet sa odhaľuje postupne.', 'Nothing yet. The world reveals itself slowly.'),
  other: l('Ostatné', 'Other'),
  isNew: l('Nové', 'New'),
  objective: l('Aktuálny cieľ', 'Current objective'),
  noObjective: l('Žiadny aktuálny cieľ.', 'No current objective.'),
  chapters: l('Kapitoly', 'Chapters'),
  done: l('Dokončené', 'Completed'),
  current: l('Prebieha', 'In progress'),
  discovered: l('Objavené', 'Discovered'),
  recent: l('Naposledy objavené', 'Recently discovered'),
  noneYet: l('Zatiaľ si nič neobjavil.', 'You have not discovered anything yet.'),
  playtime: l('Čas hrania', 'Playtime'),
  tabs: l('Karty', 'Tabs'),
  scroll: l('Listovať', 'Scroll'),
  wheel440: l('440 dní', '440 days'),
  wheelA: l('jedenásť mesiacov', 'eleven months'),
  wheelB: l('po štyridsať dní', 'of forty days each'),
  saiTop: l('Sai nad hlavou', 'Sai overhead'),
  saiTopNote: l('ľahká hodina — gravitácia klesá', 'light hour — gravity eases'),
  saiBottom: l('Sai na odvrátenej strane', 'Sai on the far side'),
  saiBottomNote: l('ťažká hodina — asi o tretinu ťažšie', 'heavy hour — about a third heavier'),
  hours40: l('40 hodín', '40 hours'),
}

const SEEN_KEY = 'nvs.codexSeen'

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSeen(seen: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
  } catch {
    /* storage unavailable */
  }
}

// ---------------------------------------------------------------- figures

const CX = 210
const CY = 210

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r]
}

function ringSlice(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r1, a0)
  const [x1, y1] = polar(r1, a1)
  const [x2, y2] = polar(r0, a1)
  const [x3, y3] = polar(r0, a0)
  const large = a1 - a0 > 180 ? 1 : 0
  const f = (n: number) => n.toFixed(2)
  return `M${f(x0)},${f(y0)} A${r1},${r1} 0 ${large} 1 ${f(x1)},${f(y1)} L${f(x2)},${f(y2)} A${r0},${r0} 0 ${large} 0 ${f(x3)},${f(y3)} Z`
}

/** The calendar wheel of the eleven months (after the appendix figure). */
function calendarWheel(unlocked: Set<string>, selected: string | null, onPick: (id: string) => void): SVGSVGElement {
  const svg = s('svg', { class: 'nvm-wheel', viewBox: '0 0 420 420', role: 'img', 'aria-label': t(S.wheelA) })
  svg.append(s('circle', { class: 'nvm-wheel-ring', cx: CX, cy: CY, r: 196 }), s('circle', { class: 'nvm-wheel-ring nvm-wheel-ring--strong', cx: CX, cy: CY, r: 187 }))
  const span = 360 / CALENDAR_MONTHS.length
  CALENDAR_MONTHS.forEach((m, i) => {
    const a0 = -90 + i * span
    const a1 = a0 + span
    const mid = (a0 + a1) / 2
    const open = unlocked.has(m.id)
    const g = s('g', { class: `nvm-wm${open ? '' : ' is-locked'}${selected === m.id ? ' is-sel' : ''}`, 'data-id': m.id })
    g.append(
      s('path', { class: 'nvm-wm-outer', d: ringSlice(124, 176, a0, a1) }),
      s('path', { class: 'nvm-wm-light', d: ringSlice(96, 124, a0, mid) }),
      s('path', { class: 'nvm-wm-dark', d: ringSlice(96, 124, mid, a1) }),
    )
    let rot = mid + 90
    if (rot > 90 && rot < 270) rot -= 180
    const [nx, ny] = polar(163, mid)
    const [tx, ty] = polar(144, mid)
    g.append(
      s('text', { class: 'nvm-wm-num', x: nx.toFixed(2), y: ny.toFixed(2), transform: `rotate(${rot.toFixed(2)} ${nx.toFixed(2)} ${ny.toFixed(2)})` }, m.numeral),
      s('text', { class: 'nvm-wm-name', x: tx.toFixed(2), y: ty.toFixed(2), transform: `rotate(${rot.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})` }, m.name),
    )
    for (let k = 1; k <= 3; k++) {
      const a = a0 + (span * k) / 4
      const [x0, y0] = polar(177, a)
      const [x1, y1] = polar(185, a)
      svg.appendChild(s('path', { class: 'nvm-wheel-tick', d: `M${x0.toFixed(2)},${y0.toFixed(2)} L${x1.toFixed(2)},${y1.toFixed(2)}` }))
    }
    if (open) g.addEventListener('click', () => onPick(m.id))
    svg.appendChild(g)
  })
  svg.append(
    s('circle', { class: 'nvm-wheel-core', cx: CX, cy: CY, r: 96 }),
    s('circle', { class: 'nvm-wheel-ring', cx: CX, cy: CY, r: 90 }),
    s('circle', { class: 'nvm-wheel-sai', cx: CX, cy: 186, r: 15 }),
    s('ellipse', { class: 'nvm-wheel-saiRing', cx: CX, cy: 186, rx: 27, ry: 6, transform: `rotate(-12 ${CX} 186)` }),
    s('text', { class: 'nvm-wheel-big', x: CX, y: 228 }, t(S.wheel440)),
    s('text', { class: 'nvm-wheel-small', x: CX, y: 246 }, t(S.wheelA)),
    s('text', { class: 'nvm-wheel-small', x: CX, y: 261 }, t(S.wheelB)),
  )
  return svg
}

/** Sai's orbit and the light / heavy hour (after the appendix figure). */
function dayCycleFigure(): SVGSVGElement {
  const svg = s('svg', { class: 'nvm-figure', viewBox: '0 0 700 290', role: 'img', 'aria-label': t(S.saiTop) })
  svg.append(
    s('ellipse', { class: 'nvm-fig-orbit', cx: 350, cy: 145, rx: 270, ry: 95 }),
    s('circle', { class: 'nvm-fig-planet', cx: 350, cy: 145, r: 40 }),
    s('circle', { class: 'nvm-fig-line', cx: 350, cy: 145, r: 34 }),
    s('text', { class: 'nvm-fig-title', x: 350, y: 151 }, 'Ahil'),
    s('circle', { class: 'nvm-fig-sai is-light', cx: 350, cy: 50, r: 17 }),
    s('ellipse', { class: 'nvm-fig-ring is-light', cx: 350, cy: 50, rx: 29, ry: 6.5, transform: 'rotate(-12 350 50)' }),
    s('text', { class: 'nvm-fig-label', x: 350, y: 20 }, t(S.saiTop)),
    s('text', { class: 'nvm-fig-note', x: 392, y: 55 }, t(S.saiTopNote)),
    s('circle', { class: 'nvm-fig-sai', cx: 350, cy: 240, r: 17 }),
    s('ellipse', { class: 'nvm-fig-ring', cx: 350, cy: 240, rx: 29, ry: 6.5, transform: 'rotate(-12 350 240)' }),
    s('text', { class: 'nvm-fig-label', x: 350, y: 282 }, t(S.saiBottom)),
    s('text', { class: 'nvm-fig-note', x: 392, y: 245 }, t(S.saiBottomNote)),
    s('path', { class: 'nvm-fig-arrow', d: 'M 92 112 C 102 87, 132 67, 167 57' }),
    s('path', { class: 'nvm-fig-arrowhead', d: 'M 162 54 l 9 1 l -6 7 z' }),
    s('text', { class: 'nvm-fig-note nvm-fig-note--end', x: 88, y: 98 }, t(S.hours40)),
  )
  return svg
}

// ---------------------------------------------------------------- screen

export class CodexScreen {
  private layer: Layer | null = null
  private gallery = false
  private tab: Tab = 'journal'
  private selected = new Map<Tab, string>()
  private unlocked = new Set<string>()
  private seen = new Set<string>()
  private onClose: (() => void) | undefined
  private offLang: (() => void) | null = null
  private tabsEl: HTMLElement | null = null
  private listEl: HTMLElement | null = null
  private pageEl: HTMLElement | null = null
  private mouseMode = false
  private readonly onMouse = () => (this.mouseMode = true)
  private readonly onKeyAny = () => (this.mouseMode = false)

  constructor(private host: MenuHost) {}

  open(opts?: { gallery?: boolean; tab?: string }, onClose?: () => void): void {
    if (this.layer?.isOpen) return
    this.gallery = !!opts?.gallery
    this.onClose = onClose
    this.seen = loadSeen()
    this.refreshUnlocked()
    const wanted = TABS.find((x) => x.id === opts?.tab)?.id
    this.tab = wanted && !(this.gallery && wanted === 'journal') ? wanted : this.gallery ? this.firstFilledTab() : 'journal'
    syncRootSettings(this.host.settings)
    const layer = new Layer({
      className: 'nvm-codex',
      ariaLabel: t(this.gallery ? S.codex : S.journalCodex),
      sfx: (id) => this.host.sfx(id),
      onBack: () => this.close(),
      onTab: (d) => this.switchTab(d),
      onKey: (e) => this.onKey(e),
      onNav: (dir) => {
        if (dir === 'left' || dir === 'right') {
          this.switchTab(dir === 'right' ? 1 : -1)
          return true
        }
        return false
      },
      onClosed: () => this.cleanup(),
    })
    this.layer = layer
    this.render()
    layer.open()
    layer.root.addEventListener('mousemove', this.onMouse)
    window.addEventListener('keydown', this.onKeyAny, true)
    this.offLang = onLangChange(() => {
      const key = this.layer?.current()?.dataset.key
      this.render()
      if (this.layer?.isTop) this.layer.refocus(key)
    })
    this.focusSelected()
  }

  close(): void {
    void this.layer?.close()
  }

  // ------------------------------------------------------------------ data

  private tabs(): { id: Tab; label: L }[] {
    return this.gallery ? TABS.filter((x) => x.id !== 'journal') : TABS
  }

  private refreshUnlocked(): void {
    const ids = this.gallery ? this.host.profile.codex : [...this.host.state.codex]
    this.unlocked = new Set(ids.map(resolveCodexId))
  }

  private all(): CodexEntry[] {
    const seen = new Set<string>()
    const out: CodexEntry[] = []
    for (const e of this.host.codexEntries) {
      if (seen.has(e.id)) continue
      seen.add(e.id)
      out.push(e)
    }
    return out
  }

  private ofCategory(cat: CodexEntry['category']): CodexEntry[] {
    return this.all().filter((e) => e.category === cat)
  }

  private firstFilledTab(): Tab {
    for (const tb of TABS) {
      if (tb.id === 'journal') continue
      if (this.ofCategory(tb.id).some((e) => this.unlocked.has(e.id))) return tb.id
    }
    return 'world'
  }

  /** Unlocked entries of a category grouped by section, in display order. */
  private grouped(cat: CodexEntry['category']): { section: CodexSection | null; entries: CodexEntry[] }[] {
    const lang = getLang()
    const open = this.ofCategory(cat).filter((e) => this.unlocked.has(e.id))
    const groups = new Map<string, { section: CodexSection | null; entries: CodexEntry[] }>()
    for (const e of open) {
      const sec = codexSection(e.id) ?? null
      const k = sec?.key ?? '~'
      if (!groups.has(k)) groups.set(k, { section: sec, entries: [] })
      groups.get(k)!.entries.push(e)
    }
    const list = [...groups.values()]
    const hasSections = list.some((g) => g.section)
    for (const g of list) {
      if (!g.section && hasSections) g.section = { key: '~', title: S.other, rank: 999 }
      g.entries.sort((a, b) => {
        if (!g.section?.alpha) {
          const d = (a.order ?? 1e6) - (b.order ?? 1e6)
          if (d) return d
        }
        return t(a.title).localeCompare(t(b.title), lang)
      })
    }
    list.sort((a, b) => (a.section?.rank ?? 999) - (b.section?.rank ?? 999))
    return list
  }

  // ------------------------------------------------------------------ render

  private render(): void {
    const layer = this.layer
    if (!layer) return
    layer.root.textContent = ''
    this.tabsEl = h('nav', { class: 'nvm-tabs nvm-tabs--codex', attrs: { role: 'tablist' } })
    this.listEl = h('aside', 'nvm-book-list')
    this.pageEl = h('article', 'nvm-book-page')
    const back = h('button', { class: 'nvm-btn nvm-btn--paper', data: { nav: 'tab-only', key: 'back' }, text: t(COMMON.back), onclick: () => this.close() })
    const book = corners(
      h(
        'section',
        'nvm-book nvm-rise',
        h('header', 'nvm-book-head', h('h1', 'nvm-h1 nvm-book-title', t(this.gallery ? S.codex : S.journalCodex)), h('div', 'nvm-tabbar', h('kbd', 'nvm-tabkey', 'Q'), this.tabsEl, h('kbd', 'nvm-tabkey', 'E'))),
        h('div', 'nvm-book-spread', this.listEl, h('div', 'nvm-book-gutter'), this.pageEl),
        h(
          'footer',
          'nvm-book-foot',
          hints([
            ['↑↓', COMMON.select],
            ['←→', S.tabs],
            ['PgUp/PgDn', S.scroll],
            ['Esc', COMMON.back],
          ]),
          back,
        ),
      ),
    )
    layer.root.append(h('div', 'nvm-backdrop'), book)
    this.renderTabs()
    this.renderSpread()
  }

  private renderTabs(): void {
    const el = this.tabsEl
    if (!el) return
    el.textContent = ''
    for (const tb of this.tabs()) {
      const b = h('button', {
        class: `nvm-tab${tb.id === this.tab ? ' is-active' : ''}`,
        data: { nav: 'tab-only', key: `tab-${tb.id}` },
        attrs: { role: 'tab', 'aria-selected': String(tb.id === this.tab) },
      })
      b.appendChild(document.createTextNode(t(tb.label)))
      if (tb.id !== 'journal') {
        const entries = this.ofCategory(tb.id)
        const open = entries.filter((e) => this.unlocked.has(e.id))
        const fresh = open.some((e) => !this.seen.has(e.id))
        b.appendChild(h('span', 'nvm-tab-count', `${open.length}/${entries.length}`))
        if (fresh) b.appendChild(h('i', 'nvm-tab-dot'))
      }
      b.addEventListener('click', () => this.setTab(tb.id))
      el.appendChild(b)
    }
  }

  private setTab(id: Tab): void {
    if (id === this.tab) return
    this.tab = id
    this.renderTabs()
    this.renderSpread()
    this.focusSelected()
  }

  private switchTab(delta: number): void {
    const tabs = this.tabs()
    const i = tabs.findIndex((x) => x.id === this.tab)
    this.host.sfx('tick')
    this.setTab(tabs[(i + delta + tabs.length) % tabs.length].id)
  }

  private focusSelected(): void {
    const layer = this.layer
    if (!layer) return
    const sel = this.selected.get(this.tab)
    layer.focusFirst(sel ? `[data-key="e:${CSS.escape(sel)}"]` : '.nvm-book-list [data-nav], .nvm-book-page [data-nav]')
  }

  private renderSpread(): void {
    const list = this.listEl
    const page = this.pageEl
    if (!list || !page) return
    list.textContent = ''
    page.textContent = ''
    page.className = `nvm-book-page nvm-book-page--${this.tab}`
    list.scrollTop = 0
    page.scrollTop = 0
    if (this.tab === 'journal') {
      this.renderJournal(list, page)
      return
    }
    const cat = this.tab
    const groups = this.grouped(cat)
    const total = this.ofCategory(cat).length
    const openCount = groups.reduce((n, g) => n + g.entries.length, 0)
    for (const g of groups) {
      if (g.section) list.appendChild(h('div', 'nvm-sect', t(g.section.title)))
      for (const e of g.entries) list.appendChild(this.entryButton(e))
    }
    const locked = total - openCount
    if (locked > 0) list.appendChild(h('div', 'nvm-locked', h('span', 'nvm-locked-q', '???'), t(S.undiscovered, { n: locked })))
    let sel = this.selected.get(cat)
    if (!sel || !this.unlocked.has(sel)) sel = groups[0]?.entries[0]?.id
    if (sel) this.show(sel, false)
    else this.renderEmptyPage()
  }

  private entryButton(e: CodexEntry): HTMLElement {
    const fresh = !this.seen.has(e.id)
    const b = h(
      'button',
      { class: 'nvm-entry', data: { nav: '', key: `e:${e.id}`, id: e.id } },
      h('span', 'nvm-entry-mark'),
      h('span', 'nvm-entry-title', t(e.title)),
      fresh ? h('span', 'nvm-new', t(S.isNew)) : null,
    )
    b.addEventListener('click', () => this.show(e.id, true))
    b.addEventListener('focus', () => {
      if (!this.mouseMode) this.show(e.id, false)
    })
    return b
  }

  private show(id: string, fromClick: boolean): void {
    const page = this.pageEl
    const entry = this.all().find((e) => e.id === id)
    if (!page || !entry || this.tab === 'journal') return
    if (this.selected.get(this.tab) === id && page.dataset.id === id && !fromClick) return
    this.selected.set(this.tab, id)
    this.listEl?.querySelectorAll('.nvm-entry').forEach((b) => b.classList.toggle('is-active', (b as HTMLElement).dataset.id === id))
    page.dataset.id = id
    page.textContent = ''
    page.scrollTop = 0
    const sec = codexSection(id)
    page.classList.toggle('nvm-page--month', sec?.key === 'months')
    const tabLabel = TABS.find((x) => x.id === this.tab)?.label
    const kicker = [tabLabel ? t(tabLabel) : '', sec ? t(sec.title) : ''].filter(Boolean).join(' · ')
    const body = h('div', 'nvm-page-body')
    body.appendChild(richText(t(entry.body)))
    const paras = Array.from(body.querySelectorAll('p'))
    // a first paragraph that is only an *italic* line is a tagline (caste · species · place)
    const first = paras[0]
    if (first && first.childNodes.length === 1 && first.firstChild instanceof HTMLElement && first.firstChild.tagName === 'EM') first.classList.add('nvm-tagline')
    // drop cap on the first plain paragraph that is long enough to wrap around it
    const firstPlain = paras.find((p) => p.firstChild?.nodeType === Node.TEXT_NODE)
    if (firstPlain && this.tab !== 'glossary' && (firstPlain.textContent ?? '').length > 150) firstPlain.classList.add('nvm-dropcap')
    const parts: (Node | null)[] = []
    if (entry.category === 'people') parts.push(this.medallion(entry))
    parts.push(h('div', 'nvm-page-kicker', kicker), h('h2', 'nvm-page-title', t(entry.title)), flourish('nvm-page-flourish'))
    if (this.tab === 'calendar') parts.push(h('div', 'nvm-wheel-wrap', calendarWheel(this.unlocked, id, (mid) => this.pickMonth(mid))))
    parts.push(body)
    if (id === 'cal.day') parts.push(h('div', 'nvm-figure-wrap', dayCycleFigure()))
    for (const p of parts) if (p) page.appendChild(p)
    page.classList.remove('nvm-turn')
    void page.offsetWidth
    page.classList.add('nvm-turn')
    // mark as read
    if (!this.seen.has(id)) {
      this.seen.add(id)
      saveSeen(this.seen)
      this.listEl?.querySelector(`[data-id="${CSS.escape(id)}"] .nvm-new`)?.remove()
      this.renderTabs()
    }
  }

  /** Portrait (painted art when the cast has it) or a monogram medallion. */
  private medallion(entry: CodexEntry): HTMLElement {
    const castId = entry.id.replace(/^people\./, '')
    const cast = CAST[castId]
    const el = h('div', { class: 'nvm-medallion', style: `--pc:${cast?.color ?? '#6a5aa0'}` })
    if (cast?.portrait) el.appendChild(h('img', { attrs: { src: `assets/portraits/${cast.portrait}.webp`, alt: t(entry.title), draggable: 'false' } }))
    else el.appendChild(h('span', 'nvm-medallion-mono', t(entry.title).slice(0, 1)))
    return el
  }

  private pickMonth(id: string): void {
    this.host.sfx('click')
    this.show(id, true)
    this.layer?.refocus(`e:${id}`)
  }

  private renderEmptyPage(): void {
    const page = this.pageEl
    if (!page) return
    page.dataset.id = ''
    const parts: Node[] = []
    if (this.tab === 'calendar') parts.push(h('div', 'nvm-wheel-wrap', calendarWheel(this.unlocked, null, (mid) => this.pickMonth(mid))))
    parts.push(h('div', 'nvm-page-empty', flourish(), h('p', null, t(S.nothing))))
    page.append(...parts)
  }

  private renderJournal(list: HTMLElement, page: HTMLElement): void {
    const host = this.host
    const st = host.state
    // left page: objective + chapters
    list.append(
      h('div', 'nvm-sect', t(S.objective)),
      h('div', `nvm-objective${st.objective ? '' : ' is-empty'}`, h('i', 'nvm-objective-mark'), h('p', null, st.objective ? t(st.objective) : t(S.noObjective))),
      h('div', 'nvm-sect', t(S.chapters)),
    )
    const chapters = [...host.chapters].sort((a, b) => a.index - b.index)
    const cur = chapters.find((c) => c.id === st.chapterId)
    const reached = new Set(host.profile.chapters)
    for (const c of chapters) {
      const isCur = c.id === st.chapterId
      const isDone = !isCur && reached.has(c.id) && (!cur || c.index < cur.index)
      const known = isCur || reached.has(c.id)
      const label = t(host.chapterLabel(c.id))
      const num = label.includes(' · ') ? label.split(' · ')[0] : c.index === 0 ? '—' : roman(c.index)
      const row = h(
        'div',
        { class: `nvm-jchapter${isCur ? ' is-current' : ''}${isDone ? ' is-done' : ''}${known ? '' : ' is-locked'}`, data: { nav: '', key: `ch:${c.id}` }, attrs: { tabindex: '0' } },
        h('span', 'nvm-jchapter-mark'),
        h(
          'span',
          'nvm-jchapter-text',
          h('span', 'nvm-jchapter-num', known ? num : '???'),
          h('span', 'nvm-jchapter-title', known ? t(c.title) : '???'),
          known ? h('span', 'nvm-jchapter-sub', t(c.subtitle)) : null,
        ),
        isCur ? h('span', 'nvm-jchapter-state is-current', t(S.current)) : isDone ? h('span', 'nvm-jchapter-state', t(S.done)) : null,
      )
      list.appendChild(row)
    }

    // right page: discovery progress + recent entries
    page.dataset.id = ''
    page.append(h('div', 'nvm-page-kicker', t(S.journalCodex)), h('h2', 'nvm-page-title', t(S.discovered)), flourish('nvm-page-flourish'))
    const bars = h('div', 'nvm-progress')
    for (const tb of TABS) {
      if (tb.id === 'journal') continue
      const entries = this.ofCategory(tb.id)
      if (!entries.length) continue
      const open = entries.filter((e) => this.unlocked.has(e.id)).length
      const pct = Math.round((open / entries.length) * 100)
      const row = h(
        'button',
        { class: 'nvm-progress-row', data: { nav: '', key: `p:${tb.id}` } },
        h('span', 'nvm-progress-label', t(tb.label)),
        h('span', { class: 'nvm-progress-bar', style: `--p:${pct}%` }, h('i')),
        h('span', 'nvm-progress-num', `${open} / ${entries.length}`),
      )
      row.addEventListener('click', () => this.setTab(tb.id))
      bars.appendChild(row)
    }
    page.appendChild(bars)
    page.appendChild(h('div', 'nvm-sect nvm-sect--page', t(S.recent)))
    const byId = new Map(this.all().map((e) => [e.id, e]))
    const recent = [...st.codex]
      .map(resolveCodexId)
      .filter((id) => byId.has(id))
      .reverse()
      .slice(0, 6)
    if (!recent.length) page.appendChild(h('p', 'nvm-muted', t(S.noneYet)))
    const rl = h('div', 'nvm-recent')
    for (const id of recent) {
      const e = byId.get(id)!
      const tabLabel = TABS.find((x) => x.id === e.category)?.label
      const b = h(
        'button',
        { class: 'nvm-recent-item', data: { nav: '', key: `r:${id}` } },
        h('span', 'nvm-recent-cat', tabLabel ? t(tabLabel) : ''),
        h('span', 'nvm-recent-title', t(e.title)),
        !this.seen.has(id) ? h('span', 'nvm-new', t(S.isNew)) : null,
      )
      b.addEventListener('click', () => {
        this.selected.set(e.category, id)
        this.setTab(e.category)
      })
      rl.appendChild(b)
    }
    page.appendChild(rl)
    page.appendChild(h('div', 'nvm-journal-time', h('span', 'nvm-kicker', t(S.playtime)), h('span', 'nvm-journal-time-v', formatPlaytime(st.playtime, true))))
  }

  private onKey(e: KeyboardEvent): boolean {
    const page = this.pageEl
    if (!page) return false
    if (e.code === 'PageDown' || e.code === 'PageUp') {
      page.scrollBy({ top: (e.code === 'PageDown' ? 1 : -1) * page.clientHeight * 0.8, behavior: 'smooth' })
      return true
    }
    return false
  }

  private cleanup(): void {
    this.offLang?.()
    this.offLang = null
    window.removeEventListener('keydown', this.onKeyAny, true)
    this.layer = null
    this.tabsEl = null
    this.listEl = null
    this.pageEl = null
    const cb = this.onClose
    this.onClose = undefined
    cb?.()
  }
}
