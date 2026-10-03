/**
 * Reader: modal document view for in-game texts (pages of the Book of El,
 * letters, inscriptions, ciphers).
 *
 * This module also hosts the small toolkit shared by every menu screen
 * (layer stack, keyboard / gamepad navigation, confirm dialog, element
 * helpers, formatting). Screens only talk to the game through MenuHost; the
 * toolkit itself is host-independent.
 */
import './menus.css'
import { getLang, l, onLangChange, t, type L, type Lang } from '../../i18n/i18n'

// ============================================================================
// element helpers
// ============================================================================

export type Kid = Node | string | number | null | undefined | false

export interface Props {
  class?: string
  text?: string
  title?: string
  data?: Record<string, string>
  attrs?: Record<string, string>
  style?: string
  onclick?: (e: MouseEvent) => void
}

/** Create an HTML element. `props` may be a class string. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props | string | null, ...kids: Kid[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (typeof props === 'string') e.className = props
  else if (props) {
    if (props.class) e.className = props.class
    if (props.text !== undefined) e.textContent = props.text
    if (props.title) e.title = props.title
    if (props.style) e.setAttribute('style', props.style)
    if (props.data) for (const [k, v] of Object.entries(props.data)) e.dataset[k] = v
    if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) e.setAttribute(k, v)
    const onclick = props.onclick
    if (onclick) e.addEventListener('click', (ev) => onclick(ev as MouseEvent))
  }
  append(e, kids)
  return e
}

function append(parent: Node, kids: Kid[]): void {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue
    parent.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k)
  }
}

const SVGNS = 'http://www.w3.org/2000/svg'

/** Create an SVG element. */
export function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs?: Record<string, string | number> | null, ...kids: Kid[]): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVGNS, tag)
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  append(e, kids)
  return e
}

/** Gold corner ornaments for a framed panel. */
export function corners(el: HTMLElement): HTMLElement {
  for (const c of ['tl', 'tr', 'bl', 'br']) el.appendChild(h('i', `nvm-corner ${c}`))
  return el
}

/** Ornamental divider: line, diamond, line. */
export function divider(cls = ''): HTMLElement {
  return h('div', `nvm-divider ${cls}`, h('b'), h('i'), h('b'))
}

/** Decorative flourish (the codex / reader pages). */
export function flourish(cls = ''): HTMLElement {
  const wrap = h('div', `nvm-flourish ${cls}`)
  const g = s('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': 1, 'stroke-linecap': 'round' })
  g.append(
    s('path', { d: 'M8 12 H118', opacity: 0.55 }),
    s('path', { d: 'M202 12 H312', opacity: 0.55 }),
    s('path', { d: 'M118 12 C128 12 131 4 139 5.5 C145 6.6 144 13.5 139 12.6' }),
    s('path', { d: 'M202 12 C192 12 189 4 181 5.5 C175 6.6 176 13.5 181 12.6' }),
    s('path', { d: 'M160 3.5 L168.5 12 L160 20.5 L151.5 12 Z' }),
    s('path', { d: 'M160 8 L164 12 L160 16 L156 12 Z', fill: 'currentColor', stroke: 'none' }),
  )
  wrap.appendChild(
    s('svg', { viewBox: '0 0 320 24', 'aria-hidden': 'true' }, g, s('circle', { cx: 146, cy: 18, r: 1.4, fill: 'currentColor' }), s('circle', { cx: 174, cy: 18, r: 1.4, fill: 'currentColor' })),
  )
  return wrap
}

/**
 * Render a body text: paragraphs are separated by blank lines, single line
 * breaks are kept, `*italic*` becomes emphasis. Built with DOM nodes (safe).
 */
export function richText(body: string, pClass = ''): DocumentFragment {
  const frag = document.createDocumentFragment()
  for (const para of body.split(/\n\s*\n/)) {
    if (!para.trim()) continue
    const p = h('p', pClass || null)
    const lines = para.split('\n')
    lines.forEach((line, i) => {
      if (i > 0) p.appendChild(h('br'))
      const parts = line.split('*')
      parts.forEach((part, j) => {
        if (!part) return
        p.appendChild(j % 2 === 1 ? h('em', null, part) : document.createTextNode(part))
      })
    })
    frag.appendChild(p)
  }
  return frag
}

// ============================================================================
// formatting
// ============================================================================

/** Substitute `{name}` placeholders in both languages of an L. */
export function fill(s: L, vars: Record<string, string | number>): L {
  const sub = (x: string) => Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), x)
  return { sk: sub(s.sk), en: sub(s.en) }
}

export function formatPlaytime(seconds: number, withSeconds = false): string {
  const total = Math.max(0, Math.floor(seconds))
  const hh = Math.floor(total / 3600)
  const mm = Math.floor((total % 3600) / 60)
  const ss = total % 60
  const m2 = String(mm).padStart(2, '0')
  return withSeconds ? `${hh}:${m2}:${String(ss).padStart(2, '0')}` : `${hh}:${m2}`
}

function locale(lang: Lang): string {
  return lang === 'sk' ? 'sk-SK' : 'en-GB'
}

export function formatDate(ts: number, lang: Lang = getLang()): string {
  try {
    return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ts)
  } catch {
    return new Date(ts).toLocaleString()
  }
}

export function timeAgo(ts: number, lang: Lang = getLang()): string {
  const diff = (ts - Date.now()) / 1000
  const abs = Math.abs(diff)
  try {
    const rtf = new Intl.RelativeTimeFormat(lang === 'sk' ? 'sk' : 'en', { numeric: 'auto' })
    if (abs < 45) return rtf.format(0, 'second')
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
    if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month')
    return rtf.format(Math.round(diff / (86400 * 365)), 'year')
  } catch {
    return formatDate(ts, lang)
  }
}

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

export function roman(n: number): string {
  if (n <= 0) return '0'
  let out = ''
  let v = Math.floor(n)
  for (const [k, r] of ROMAN) {
    while (v >= k) {
      out += r
      v -= k
    }
  }
  return out
}

/**
 * Keep the document-level presentation flags in sync with the settings:
 * `--nv-text-scale` on :root and `data-nv-reduced-motion` (read by the CSS
 * and by host-independent views such as the Reader).
 */
export function syncRootSettings(s: { textScale: number; reducedMotion: boolean }): void {
  const root = document.documentElement
  root.style.setProperty('--nv-text-scale', String(s.textScale))
  if (s.reducedMotion) root.dataset.nvReducedMotion = '1'
  else delete root.dataset.nvReducedMotion
}

export function reducedMotion(): boolean {
  return document.documentElement.dataset.nvReducedMotion === '1'
}

// ============================================================================
// layer stack, keyboard and gamepad navigation
// ============================================================================

export type NavDir = 'up' | 'down' | 'left' | 'right'

export interface LayerOptions {
  className: string
  ariaLabel?: string
  /** Escape / Backspace / gamepad B */
  onBack?: () => void
  /** Q / E, PageUp / PageDown, gamepad LB / RB */
  onTab?: (delta: number) => void
  /** Custom key handling before the defaults; return true when consumed. */
  onKey?: (e: KeyboardEvent) => boolean
  /** Custom directional handling; return true when consumed. */
  onNav?: (dir: NavDir) => boolean
  /** Gamepad confirm or Enter when nothing is focused; return true when consumed. */
  onConfirm?: () => boolean
  /** A layer above this one closed; this one is on top again. */
  onResume?: () => void
  /** The layer was removed (by close() or closeAllLayers()). */
  onClosed?: () => void
  sfx?: (id: string) => void
  /** Wrap vertical navigation at the ends. */
  wrap?: boolean
}

/** Elements with custom left/right behaviour (sliders, switches, selectors). */
const adjusters = new WeakMap<Element, (delta: number) => void>()

export function setAdjuster(el: Element, fn: (delta: number) => void): void {
  adjusters.set(el, fn)
}

const stack: Layer[] = []
let globalsInstalled = false

export function topLayer(): Layer | null {
  return stack[stack.length - 1] ?? null
}

export function anyLayerOpen(): boolean {
  return stack.length > 0
}

/** Close every open menu layer (after a load / chapter start). */
export async function closeAllLayers(): Promise<void> {
  await Promise.all([...stack].reverse().map((ly) => ly.close()))
}

const NAV_SELECTOR = '[data-nav]'

function visible(el: HTMLElement): boolean {
  if (el.closest('[hidden]')) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

function isDisabled(el: Element): boolean {
  return el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled === true
}

/** Pick the next element in a direction: nearest row (or column) first. */
function spatialNext(items: HTMLElement[], cur: HTMLElement, dir: NavDir): HTMLElement | null {
  const r = cur.getBoundingClientRect()
  const cx = (r.left + r.right) / 2
  const cy = (r.top + r.bottom) / 2
  const vertical = dir === 'up' || dir === 'down'
  const sign = dir === 'down' || dir === 'right' ? 1 : -1
  interface Cand {
    el: HTMLElement
    gap: number
    cross: number
    overlap: boolean
  }
  const cands: Cand[] = []
  for (const el of items) {
    if (el === cur) continue
    const q = el.getBoundingClientRect()
    const qx = (q.left + q.right) / 2
    const qy = (q.top + q.bottom) / 2
    const d = vertical ? (qy - cy) * sign : (qx - cx) * sign
    if (d <= 4) continue
    const gap = vertical ? (sign > 0 ? q.top - r.bottom : r.top - q.bottom) : sign > 0 ? q.left - r.right : r.left - q.right
    const cross = vertical ? Math.abs(qx - cx) : Math.abs(qy - cy)
    const overlap = vertical ? q.left < r.right - 1 && q.right > r.left + 1 : q.top < r.bottom - 1 && q.bottom > r.top + 1
    cands.push({ el, gap, cross, overlap })
  }
  if (!cands.length) return null
  if (!vertical) {
    const same = cands.filter((c) => c.overlap)
    if (!same.length) return null
    same.sort((a, b) => a.gap - b.gap || a.cross - b.cross)
    return same[0].el
  }
  const minGap = Math.min(...cands.map((c) => c.gap))
  const row = cands.filter((c) => c.gap <= minGap + 14)
  row.sort((a, b) => a.cross - b.cross)
  return row[0].el
}

export class Layer {
  readonly root: HTMLDivElement
  /** While true, keys are not handled here and reach the game (key rebinding). */
  passthrough = false
  /** Ignore input (e.g. while an action is running). */
  busy = false
  private lastFocus: HTMLElement | null = null
  private opened = false
  private closed = false
  private closing: Promise<void> | null = null

  constructor(private opts: LayerOptions) {
    this.root = h('div', { class: `nvm-layer ${opts.className}`, attrs: { role: 'dialog', 'aria-modal': 'true' } })
    if (opts.ariaLabel) this.root.setAttribute('aria-label', opts.ariaLabel)
    this.root.addEventListener('focusin', (e) => {
      const tEl = e.target as HTMLElement
      if (tEl.matches?.(NAV_SELECTOR)) this.lastFocus = tEl
    })
    this.root.addEventListener('mouseover', (e) => this.onHover(e))
    this.root.addEventListener(
      'click',
      (e) => {
        const tEl = (e.target as HTMLElement).closest<HTMLElement>(NAV_SELECTOR)
        if (!tEl || !this.root.contains(tEl)) return
        if (this.busy) {
          e.stopPropagation()
          e.preventDefault()
          return
        }
        if (!isDisabled(tEl) && tEl.dataset.silent === undefined) this.opts.sfx?.('click')
      },
      true,
    )
  }

  get isOpen(): boolean {
    return this.opened && !this.closed
  }

  get isTop(): boolean {
    return topLayer() === this
  }

  open(parent: HTMLElement = document.body): this {
    if (this.opened) return this
    this.opened = true
    installGlobals()
    stack.push(this)
    this.root.style.zIndex = String(70 + stack.length * 2)
    parent.appendChild(this.root)
    // next frame: trigger the CSS entrance transition
    requestAnimationFrame(() => requestAnimationFrame(() => this.root.classList.add('nvm-in')))
    startPadLoop()
    return this
  }

  close(): Promise<void> {
    if (!this.opened || this.closed) return this.closing ?? Promise.resolve()
    this.closed = true
    const wasTop = this.isTop
    const i = stack.indexOf(this)
    if (i >= 0) stack.splice(i, 1)
    this.root.classList.remove('nvm-in')
    this.root.classList.add('nvm-out')
    this.root.style.pointerEvents = 'none'
    if (wasTop) {
      const next = topLayer()
      if (next) next.resume()
      else if (document.activeElement instanceof HTMLElement && this.root.contains(document.activeElement)) document.activeElement.blur()
    }
    this.opts.onClosed?.()
    const ms = reducedMotion() ? 0 : 240
    this.closing = new Promise<void>((resolve) => {
      window.setTimeout(() => {
        this.root.remove()
        resolve()
      }, ms)
    })
    return this.closing
  }

  /** Became the top layer again. */
  private resume(): void {
    this.opts.onResume?.()
    const f = this.lastFocus && this.root.contains(this.lastFocus) && visible(this.lastFocus) ? this.lastFocus : null
    if (f) this.focus(f, { silent: true })
    else this.focusFirst()
  }

  navItems(arrowsOnly = false): HTMLElement[] {
    const all = Array.from(this.root.querySelectorAll<HTMLElement>(NAV_SELECTOR)).filter((e) => visible(e))
    return arrowsOnly ? all.filter((e) => e.dataset.nav !== 'tab-only') : all
  }

  focus(el: HTMLElement | null, o: { silent?: boolean; mouse?: boolean } = {}): void {
    if (!el) return
    const prev = document.activeElement
    if (prev === el) return
    el.focus({ preventScroll: !!o.mouse })
    if (!o.mouse) el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    if (!o.silent && document.activeElement === el) this.opts.sfx?.('tick')
  }

  focusFirst(selector?: string): void {
    const el = selector ? this.root.querySelector<HTMLElement>(selector) : null
    const target = el && visible(el) ? el : (this.navItems(true).find((e) => !isDisabled(e)) ?? this.navItems(true)[0] ?? null)
    this.focus(target, { silent: true })
  }

  /** Restore focus to an element with a given data-key after a re-render. */
  refocus(key: string | undefined, fallback?: string): void {
    const el = key ? this.root.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`) : null
    if (el && visible(el)) this.focus(el, { silent: true })
    else this.focusFirst(fallback)
  }

  current(): HTMLElement | null {
    const a = document.activeElement
    return a instanceof HTMLElement && this.root.contains(a) && a.matches(NAV_SELECTOR) ? a : null
  }

  nav(dir: NavDir): void {
    if (this.opts.onNav?.(dir)) return
    const cur = this.current()
    if (cur && (dir === 'left' || dir === 'right')) {
      const adj = adjusters.get(cur)
      if (adj) {
        adj(dir === 'right' ? 1 : -1)
        return
      }
    }
    const items = this.navItems(true)
    if (!items.length) return
    if (!cur) {
      this.focus(items[0])
      return
    }
    let next = spatialNext(items, cur, dir)
    if (!next && this.opts.wrap && (dir === 'up' || dir === 'down')) {
      next = dir === 'down' ? items[0] : items[items.length - 1]
    }
    if (next) this.focus(next)
  }

  /** Sequential focus (Tab). */
  step(delta: number): void {
    const items = this.navItems(false)
    if (!items.length) return
    const cur = this.current()
    const i = cur ? items.indexOf(cur) : -1
    const n = items[(i + delta + items.length) % items.length]
    this.focus(n)
  }

  activate(): void {
    const cur = this.current()
    if (cur) {
      if (cur instanceof HTMLInputElement && cur.type === 'range') return
      cur.click()
      return
    }
    if (this.opts.onConfirm?.()) return
    this.focusFirst()
  }

  back(): void {
    if (this.opts.onBack) this.opts.onBack()
  }

  tab(delta: number): void {
    this.opts.onTab?.(delta)
  }

  private onHover(e: MouseEvent): void {
    if (!this.isTop || this.busy) return
    const target = e.target as HTMLElement
    let el = target.closest<HTMLElement>(NAV_SELECTOR)
    if (!el) {
      const row = target.closest<HTMLElement>('[data-nav-row]')
      el = row?.querySelector<HTMLElement>(NAV_SELECTOR) ?? null
    }
    if (!el || !this.root.contains(el) || el === document.activeElement) return
    if (el.dataset.nohover !== undefined) return
    this.focus(el, { mouse: true })
  }

  /** Keyboard entry point (called by the global capture listener). */
  handleKey(e: KeyboardEvent): void {
    if (this.busy) return
    if (this.opts.onKey?.(e)) {
      e.preventDefault()
      return
    }
    const k = e.code
    const consume = () => e.preventDefault()
    switch (k) {
      case 'ArrowUp':
      case 'KeyW':
        consume()
        this.nav('up')
        return
      case 'ArrowDown':
      case 'KeyS':
        consume()
        this.nav('down')
        return
      case 'ArrowLeft':
      case 'KeyA':
        consume()
        this.nav('left')
        return
      case 'ArrowRight':
      case 'KeyD':
        consume()
        this.nav('right')
        return
      case 'Tab':
        consume()
        this.step(e.shiftKey ? -1 : 1)
        return
      case 'Enter':
      case 'NumpadEnter':
      case 'Space':
        consume()
        if (!e.repeat) this.activate()
        return
      case 'Escape':
      case 'Backspace':
        consume()
        if (!e.repeat) this.back()
        return
      case 'KeyQ':
      case 'PageUp':
        if (this.opts.onTab) {
          consume()
          this.tab(-1)
        }
        return
      case 'KeyE':
      case 'PageDown':
        if (this.opts.onTab) {
          consume()
          this.tab(1)
        }
        return
      case 'Home': {
        consume()
        const items = this.navItems(true)
        this.focus(items[0] ?? null)
        return
      }
      case 'End': {
        consume()
        const items = this.navItems(true)
        this.focus(items[items.length - 1] ?? null)
        return
      }
    }
  }
}

function installGlobals(): void {
  if (globalsInstalled) return
  globalsInstalled = true
  window.addEventListener(
    'keydown',
    (e) => {
      const top = topLayer()
      if (!top || top.passthrough) return
      // menus own the keyboard while open: keep the game's Input from seeing keys
      e.stopPropagation()
      top.handleKey(e)
    },
    true,
  )
}

// ---------------------------------------------------------------- gamepad

let padRaf = 0
const padPrev: boolean[] = []
let axisDir: NavDir | null = null
let axisNext = 0

function startPadLoop(): void {
  if (padRaf || typeof navigator === 'undefined' || !navigator.getGamepads) return
  // seed the previous state so buttons held while a menu opens do not fire
  const pad = Array.from(navigator.getGamepads()).find((p) => p && p.connected)
  padPrev.length = 0
  pad?.buttons.forEach((b, i) => (padPrev[i] = b.pressed))
  const loop = () => {
    if (!stack.length) {
      padRaf = 0
      padPrev.length = 0
      return
    }
    padRaf = requestAnimationFrame(loop)
    pollPad()
  }
  padRaf = requestAnimationFrame(loop)
}

function pollPad(): void {
  const pad = Array.from(navigator.getGamepads()).find((p) => p && p.connected)
  if (!pad) return
  const top = topLayer()
  const pressed = (i: number) => !!pad.buttons[i]?.pressed
  const edge = (i: number) => {
    const now = pressed(i)
    const was = padPrev[i] ?? false
    padPrev[i] = now
    return now && !was
  }
  const ok = !!top && !top.passthrough && !top.busy
  if (edge(0) && ok) top.activate()
  if (edge(1) && ok) top.back()
  if (edge(4) && ok) top.tab(-1)
  if (edge(5) && ok) top.tab(1)
  const dpad: [number, NavDir][] = [
    [12, 'up'],
    [13, 'down'],
    [14, 'left'],
    [15, 'right'],
  ]
  for (const [i, d] of dpad) if (edge(i) && ok) top.nav(d)
  // left stick with key-repeat
  const ax = pad.axes[0] ?? 0
  const ay = pad.axes[1] ?? 0
  let dir: NavDir | null = null
  if (Math.abs(ax) > 0.55 || Math.abs(ay) > 0.55) dir = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'right' : 'left') : ay > 0 ? 'down' : 'up'
  const now = performance.now()
  if (dir !== axisDir) {
    axisDir = dir
    if (dir && ok) top.nav(dir)
    axisNext = now + 380
  } else if (dir && now >= axisNext) {
    if (ok) top.nav(dir)
    axisNext = now + 120
  }
}

// ============================================================================
// shared widgets
// ============================================================================

export interface ConfirmOptions {
  title: L
  text?: L
  confirm: L
  cancel?: L
  /** red-tinted confirm button and default focus on cancel */
  danger?: boolean
  sfx?: (id: string) => void
}

const UI = {
  cancel: l('Zrušiť', 'Cancel'),
  close: l('Zavrieť', 'Close'),
  select: l('Vybrať', 'Select'),
  back: l('Späť', 'Back'),
}

/** Small modal yes/no dialog. Resolves true when confirmed. */
export function confirmDialog(o: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false
    const finish = (v: boolean) => {
      if (done) return
      done = true
      void layer.close()
      resolve(v)
    }
    const layer: Layer = new Layer({
      className: 'nvm-confirm',
      sfx: o.sfx,
      onBack: () => {
        o.sfx?.('click')
        finish(false)
      },
    })
    const render = () => {
      layer.root.textContent = ''
      const yes = h('button', { class: `nvm-btn nvm-btn--solid ${o.danger ? 'nvm-btn--danger' : ''}`, data: { nav: '', key: 'yes' }, text: t(o.confirm), onclick: () => finish(true) })
      const no = h('button', { class: 'nvm-btn', data: { nav: '', key: 'no' }, text: t(o.cancel ?? UI.cancel), onclick: () => finish(false) })
      const card = corners(
        h(
          'div',
          'nvm-confirm-card nvm-glass',
          h('div', 'nvm-confirm-title', t(o.title)),
          divider('nvm-divider--small'),
          o.text ? h('p', 'nvm-confirm-text', t(o.text)) : null,
          h('div', 'nvm-confirm-actions', no, yes),
        ),
      )
      layer.root.append(h('div', 'nvm-backdrop'), card)
    }
    render()
    layer.open()
    layer.focusFirst(o.danger ? '[data-key="no"]' : '[data-key="yes"]')
  })
}

/** Transient message inside a layer (e.g. "Game saved"). */
export function toast(layer: Layer, text: string, kind: 'ok' | 'warn' = 'ok'): void {
  const el = h('div', `nvm-toast nvm-toast--${kind}`, h('i'), text)
  layer.root.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  window.setTimeout(() => {
    el.classList.remove('show')
    window.setTimeout(() => el.remove(), 400)
  }, 1900)
}

/** Footer key hints: [[key, label], ...]. */
export function hints(items: [string, L][]): HTMLElement {
  return h('div', 'nvm-hints', ...items.map(([k, label]) => h('span', 'nvm-hint', h('kbd', null, k), t(label))))
}

export const COMMON = UI

// ============================================================================
// Reader
// ============================================================================

export type ReaderStyle = 'book' | 'letter' | 'stone' | 'cipher'

export interface ReaderOptions {
  title: L
  body: L
  style?: ReaderStyle
  t: (s: L) => string
}

/** Geometric cipher marks scattered over the parchment (kept undistorted). */
function cipherMarks(): HTMLElement {
  const wrap = h('div', { class: 'nvm-doc-marks', attrs: { 'aria-hidden': 'true' } })
  const marks: [number, number, number, number][] = [
    [7, 9, 0, 0],
    [92, 13, 1, 15],
    [9, 88, 2, 0],
    [88, 82, 3, -12],
    [50, 5, 4, 0],
    [5, 50, 1, 0],
    [95, 52, 2, 20],
    [47, 94, 0, 0],
  ]
  for (const [x, y, kind, rot] of marks) {
    const g = s('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1, transform: `rotate(${rot} 17 17)` })
    const c = 17
    const r = 13
    if (kind === 0) g.append(s('circle', { cx: c, cy: c, r }), s('path', { d: `M${c - r} ${c} H${c + r} M${c} ${c - r} V${c + r}` }))
    else if (kind === 1) g.append(s('path', { d: `M${c} ${c - r} L${c + r * 0.87} ${c + r / 2} L${c - r * 0.87} ${c + r / 2} Z` }), s('circle', { cx: c, cy: c, r: r / 3 }))
    else if (kind === 2) g.append(s('rect', { x: c - r * 0.7, y: c - r * 0.7, width: r * 1.4, height: r * 1.4, transform: `rotate(45 ${c} ${c})` }), s('path', { d: `M${c - r} ${c} H${c + r}` }))
    else if (kind === 3) {
      const pts: string[] = []
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
        pts.push(`${(c + Math.cos(a) * r * 0.85).toFixed(1)} ${(c + Math.sin(a) * r * 0.85).toFixed(1)}`)
      }
      g.append(s('path', { d: `M${pts.join(' L')} Z` }), s('circle', { cx: c, cy: c, r }))
    } else g.append(s('path', { d: `M${c - r} ${c + r * 0.8} L${c} ${c - r * 0.8} L${c + r} ${c + r * 0.8} M${c - r / 2} ${c} H${c + r / 2}` }))
    const svg = s('svg', { viewBox: '0 0 34 34' }, g)
    svg.style.left = `${x}%`
    svg.style.top = `${y}%`
    wrap.appendChild(svg)
  }
  return wrap
}

const READER_LABELS: Record<ReaderStyle, L> = {
  book: l('Kniha El', 'The Book of El'),
  letter: l('List', 'Letter'),
  stone: l('Nápis', 'Inscription'),
  cipher: l('Šifra', 'Cipher'),
}

/**
 * Modal document view. Closes with Enter, Escape or a click and resolves.
 * Plays no sound (the caller does). Long texts scroll (arrows, wheel).
 */
export function openReader(opts: ReaderOptions): Promise<void> {
  const style: ReaderStyle = opts.style ?? 'letter'
  const tr = opts.t
  return new Promise<void>((resolve) => {
    let done = false
    let openedAt = performance.now()
    const finish = () => {
      if (done || performance.now() - openedAt < 250) return
      done = true
      offLang()
      void layer.close().then(() => resolve())
    }
    let body: HTMLElement | null = null
    const layer: Layer = new Layer({
      className: `nvm-reader nvm-reader--${style}`,
      onBack: finish,
      onConfirm: () => {
        finish()
        return true
      },
      onNav: (dir) => {
        if (!body) return true
        if (dir === 'up' || dir === 'down') body.scrollBy({ top: dir === 'down' ? 90 : -90, behavior: reducedMotion() ? 'auto' : 'smooth' })
        return true
      },
    })
    const render = () => {
      layer.root.textContent = ''
      body = h('div', 'nvm-doc-body')
      body.appendChild(richText(tr(opts.body)))
      const doc = h(
        'article',
        `nvm-doc nvm-doc--${style}`,
        style === 'cipher' ? cipherMarks() : null,
        style === 'book' ? h('div', 'nvm-doc-veins') : null,
        h('div', 'nvm-doc-kicker', tr(READER_LABELS[style])),
        h('h2', 'nvm-doc-title', tr(opts.title)),
        style === 'stone' ? h('div', 'nvm-doc-rule nvm-doc-rule--stone') : flourish('nvm-doc-rule'),
        body,
      )
      const hint = h('div', 'nvm-hints nvm-reader-hint', h('span', 'nvm-hint', h('kbd', null, 'Enter'), h('kbd', null, 'Esc'), tr(UI.close)))
      layer.root.append(h('div', 'nvm-backdrop'), doc, hint)
    }
    render()
    const offLang = onLangChange(() => render())
    layer.root.addEventListener('click', (e) => {
      // clicks inside a scrollable text should not close while selecting/scrolling
      if ((e.target as HTMLElement).closest('.nvm-doc-body') && body && body.scrollHeight > body.clientHeight + 4) return
      finish()
    })
    layer.open()
    openedAt = performance.now()
  })
}
