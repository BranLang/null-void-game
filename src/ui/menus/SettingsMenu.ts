/**
 * Settings: General, Audio, Graphics, Accessibility, Controls.
 * Every change applies immediately through host.applySettings().
 */
import { DEFAULT_BINDINGS, keyLabel, type Action, type Bindings } from '../../engine/Input'
import type { Quality } from '../../engine/Renderer'
import type { Settings } from '../../game/Settings'
import { getLang, l, onLangChange, setLang, t, type L, type Lang } from '../../i18n/i18n'
import type { MenuHost } from './MenuHost'
import { COMMON, Layer, corners, h, hints, setAdjuster, syncRootSettings, toast } from './Reader'

type TabId = 'general' | 'audio' | 'graphics' | 'access' | 'controls'

const TABS: { id: TabId; label: L }[] = [
  { id: 'general', label: l('Všeobecné', 'General') },
  { id: 'audio', label: l('Zvuk', 'Audio') },
  { id: 'graphics', label: l('Grafika', 'Graphics') },
  { id: 'access', label: l('Prístupnosť', 'Accessibility') },
  { id: 'controls', label: l('Ovládanie', 'Controls') },
]

const S = {
  title: l('Nastavenia', 'Settings'),
  lang: l('Jazyk', 'Language'),
  langDesc: l('Jazyk textov, dialógov a menu.', 'Language of all text, dialogue and menus.'),
  speed: l('Rýchlosť textu', 'Text speed'),
  speedDesc: l('Ako rýchlo sa vypisujú repliky.', 'How quickly dialogue lines are typed out.'),
  cps: l('{n} znakov/s', '{n} chars/s'),
  instant: l('Okamžite', 'Instant'),
  size: l('Veľkosť textu', 'Text size'),
  sizeDesc: l('Mierka všetkých textov v hre.', 'Scale of all text in the game.'),
  auto: l('Automatické pokračovanie', 'Auto-advance dialogue'),
  autoDesc: l('Repliky pokračujú samy po krátkej pauze.', 'Lines continue on their own after a short pause.'),
  preview: l('Ukážka', 'Preview'),
  previewWho: l('Dama z Dissu', 'The Diss woman'),
  previewText: l(
    '„Voda nikdy nekradne. Voda si len berie späť, čo si postavil v jej izbe.“',
    '“Water never steals. Water only takes back what you built in its room.”',
  ),
  music: l('Hudba', 'Music'),
  musicDesc: l('Hlasitosť hudby.', 'Music volume.'),
  sfx: l('Zvukové efekty', 'Sound effects'),
  sfxDesc: l('Kroky, Spira, rozhranie.', 'Footsteps, Spira, interface.'),
  amb: l('Prostredie', 'Ambience'),
  ambDesc: l('Vietor, dážď, more, dav.', 'Wind, rain, sea, crowds.'),
  quality: l('Kvalita grafiky', 'Graphics quality'),
  qualityDesc: l('Tiene, odlesky a hustota častíc. Nižšia kvalita pomôže slabším počítačom.', 'Shadows, reflections and particle density. Lower settings help older machines.'),
  low: l('Nízka', 'Low'),
  medium: l('Stredná', 'Medium'),
  high: l('Vysoká', 'High'),
  outlines: l('Tušové obrysy', 'Ink outlines'),
  outlinesDesc: l('Kreslené obrysy postáv a predmetov.', 'Hand-drawn outlines around characters and objects.'),
  shake: l('Otrasy obrazovky', 'Screen shake'),
  shakeDesc: l('Kamera sa zachveje pri úderoch a výbuchoch.', 'The camera shakes on impacts and explosions.'),
  motion: l('Obmedziť pohyb', 'Reduced motion'),
  motionDesc: l('Menej animácií; záblesky a prelety nahradí jednoduché stmievanie.', 'Fewer animations; flashes and sweeping moves become simple fades.'),
  skip: l('Preskočiť minihru po neúspechu', 'Offer to skip failed minigames'),
  skipDesc: l('Po prvom neúspechu ponúkne možnosť minihru preskočiť.', 'After one failure, a minigame offers to let you skip it.'),
  slow: l('Pomalšie časovače', 'Slower timers'),
  slowDesc: l('Minihry a časované sekvencie bežia pomalšie.', 'Minigames and timed sequences run slower.'),
  stealth: l('Zhovievavé zakrádanie', 'Forgiving stealth'),
  stealthDesc: l('Stráže si ťa všimnú neskôr.', 'Guards take longer to notice you.'),
  on: l('Zap.', 'On'),
  off: l('Vyp.', 'Off'),
  action: l('Akcia', 'Action'),
  keyboard: l('Klávesnica', 'Keyboard'),
  gamepad: l('Ovládač', 'Gamepad'),
  pressKey: l('Stlač kláves…', 'Press a key…'),
  listenHint: l('Stlač nový kláves pre „{a}“. Esc zruší.', 'Press a new key for “{a}”. Esc cancels.'),
  addKey: l('Pridať kláves', 'Add a key'),
  removeHint: l('Delete alebo pravé tlačidlo odstráni kláves', 'Delete or right-click removes a key'),
  conflict: l('Tento kláves používa aj: {a}', 'Also used by: {a}'),
  reset: l('Obnoviť predvolené', 'Reset to defaults'),
  resetDone: l('Ovládanie obnovené', 'Controls reset'),
  padNote: l(
    'Ovládač sa pripojí automaticky a jeho rozloženie je pevné. V menu tlačidlo A potvrdí, B vráti späť a LB/RB prepínajú karty.',
    'Gamepads connect automatically and use a fixed layout. In menus, A confirms, B goes back and LB/RB switch tabs.',
  ),
  hintTabs: l('Karty', 'Tabs'),
  hintAdjust: l('Zmeniť', 'Adjust'),
}

const ACTIONS: { id: Action; label: L; pad: string[] }[] = [
  { id: 'up', label: l('Pohyb hore', 'Move up'), pad: ['LS', '↑'] },
  { id: 'down', label: l('Pohyb dole', 'Move down'), pad: ['LS', '↓'] },
  { id: 'left', label: l('Pohyb vľavo', 'Move left'), pad: ['LS', '←'] },
  { id: 'right', label: l('Pohyb vpravo', 'Move right'), pad: ['LS', '→'] },
  { id: 'run', label: l('Beh', 'Run'), pad: ['LB', 'LT'] },
  { id: 'interact', label: l('Interakcia', 'Interact'), pad: ['A'] },
  { id: 'advance', label: l('Ďalšia replika', 'Advance dialogue'), pad: ['A'] },
  { id: 'journal', label: l('Denník', 'Journal'), pad: ['Back'] },
  { id: 'pause', label: l('Pauza', 'Pause'), pad: ['Start'] },
  { id: 'ability1', label: l('Schopnosť 1', 'Ability 1'), pad: ['X'] },
  { id: 'ability2', label: l('Schopnosť 2', 'Ability 2'), pad: ['Y'] },
  { id: 'ability3', label: l('Schopnosť 3', 'Ability 3'), pad: ['RB'] },
  { id: 'veil', label: l('Závoj', 'Veil'), pad: ['B'] },
  { id: 'raw', label: l('Surová Spira', 'Raw Spira'), pad: ['RT'] },
]

/** Pairs of actions that share keys on purpose. */
const SHARED_OK: [Action, Action][] = [['interact', 'advance']]

const SPEED_STEPS = [12, 20, 30, 40, 55, 70, 90, 120, 0]
const MAX_KEYS = 3

function speedIndex(v: number): number {
  if (v <= 0) return SPEED_STEPS.length - 1
  let best = 0
  for (let i = 0; i < SPEED_STEPS.length - 1; i++) if (Math.abs(SPEED_STEPS[i] - v) < Math.abs(SPEED_STEPS[best] - v)) best = i
  return best
}

interface Listening {
  action: Action
  index: number
  unsub: () => void
  t0: number
  viaKeyboard: boolean
}

export class SettingsMenu {
  private layer: Layer | null = null
  private tab: TabId = 'general'
  private onClose: (() => void) | undefined
  private offLang: (() => void) | null = null
  private body: HTMLElement | null = null
  private tabsEl: HTMLElement | null = null
  private bar: HTMLElement | null = null
  private previewTimer = 0
  private listening: Listening | null = null
  private readonly onPointerDown = (e: PointerEvent) => {
    if (this.listening && !(e.target as HTMLElement).closest('.nvm-key.is-listening')) this.cancelListen()
  }

  constructor(private host: MenuHost) {}

  open(onClose?: () => void): void {
    if (this.layer?.isOpen) return
    this.onClose = onClose
    syncRootSettings(this.host.settings)
    const layer = new Layer({
      className: 'nvm-settings',
      ariaLabel: t(S.title),
      sfx: (id) => this.host.sfx(id),
      onBack: () => this.close(),
      onTab: (d) => this.switchTab(d),
      onKey: (e) => this.onKey(e),
      onClosed: () => this.cleanup(),
    })
    this.layer = layer
    this.renderAll()
    layer.open()
    layer.root.addEventListener('pointerdown', this.onPointerDown, true)
    this.offLang = onLangChange(() => {
      const key = this.layer?.current()?.dataset.key
      this.renderAll()
      if (this.layer?.isTop) this.layer.refocus(key)
    })
    layer.focusFirst()
  }

  close(): void {
    if (!this.layer) return
    this.cancelListen()
    void this.layer.close()
  }

  // ------------------------------------------------------------------ state

  private get s(): Settings {
    return this.host.settings
  }

  private apply(change: Partial<Settings>): void {
    const next: Settings = { ...this.host.settings, ...change }
    this.host.applySettings(next)
    syncRootSettings(next)
    if (change.lang) setLang(change.lang)
  }

  // ------------------------------------------------------------------ render

  private renderAll(): void {
    const layer = this.layer
    if (!layer) return
    layer.root.textContent = ''
    this.tabsEl = h('nav', { class: 'nvm-tabs', attrs: { role: 'tablist' } })
    this.body = h('div', { class: 'nvm-sheet-body', attrs: { role: 'tabpanel' } })
    this.bar = h('div', 'nvm-listen-bar')
    const back = h('button', { class: 'nvm-btn', data: { nav: 'tab-only', key: 'back' }, text: t(COMMON.back), onclick: () => this.close() })
    const sheet = corners(
      h(
        'section',
        'nvm-sheet nvm-glass nvm-rise',
        h('header', 'nvm-sheet-head', h('h1', 'nvm-h1', t(S.title)), h('div', 'nvm-tabbar', h('kbd', 'nvm-tabkey', 'Q'), this.tabsEl, h('kbd', 'nvm-tabkey', 'E'))),
        this.body,
        this.bar,
        h(
          'footer',
          'nvm-sheet-foot',
          hints([
            ['↑↓', COMMON.select],
            ['←→', S.hintAdjust],
            ['Q/E', S.hintTabs],
            ['Esc', COMMON.back],
          ]),
          back,
        ),
      ),
    )
    layer.root.append(h('div', 'nvm-backdrop'), sheet)
    this.renderTabs()
    this.renderBody()
  }

  private renderTabs(): void {
    const el = this.tabsEl
    if (!el) return
    el.textContent = ''
    for (const tb of TABS) {
      const b = h('button', {
        class: `nvm-tab${tb.id === this.tab ? ' is-active' : ''}`,
        data: { nav: 'tab-only', key: `tab-${tb.id}` },
        text: t(tb.label),
        attrs: { role: 'tab', 'aria-selected': String(tb.id === this.tab) },
      })
      b.addEventListener('click', () => this.setTab(tb.id))
      el.appendChild(b)
    }
  }

  private setTab(id: TabId, focusBody = false): void {
    if (id === this.tab) return
    this.cancelListen()
    this.tab = id
    this.renderTabs()
    this.renderBody()
    if (focusBody) this.layer?.focusFirst('.nvm-sheet-body [data-nav]')
  }

  private switchTab(delta: number): void {
    const i = TABS.findIndex((x) => x.id === this.tab)
    const next = TABS[(i + delta + TABS.length) % TABS.length]
    this.host.sfx('tick')
    this.setTab(next.id, true)
  }

  private renderBody(): void {
    const body = this.body
    if (!body) return
    window.clearInterval(this.previewTimer)
    body.textContent = ''
    body.scrollTop = 0
    const s = this.s
    switch (this.tab) {
      case 'general': {
        body.append(
          this.row('lang', S.lang, S.langDesc, this.segmented<Lang>('lang', getLang(), [['sk', l('Slovenčina', 'Slovenčina')], ['en', l('English', 'English')]], (v) => this.apply({ lang: v }))),
          this.row(
            'speed',
            S.speed,
            S.speedDesc,
            this.slider('speed', 0, SPEED_STEPS.length - 1, 1, speedIndex(s.textSpeed), (i) => (SPEED_STEPS[i] === 0 ? t(S.instant) : t(S.cps, { n: SPEED_STEPS[i] })), (i) => {
              this.apply({ textSpeed: SPEED_STEPS[i] })
              this.startPreview()
            }),
          ),
          this.row(
            'size',
            S.size,
            S.sizeDesc,
            this.slider('size', 0.85, 1.4, 0.05, s.textScale, (v) => `${Math.round(v * 100)} %`, (v) => this.apply({ textScale: Math.round(v * 100) / 100 })),
          ),
          this.row('auto', S.auto, S.autoDesc, this.toggle('auto', s.autoAdvance, (v) => this.apply({ autoAdvance: v }))),
          this.preview(),
        )
        this.startPreview()
        break
      }
      case 'audio': {
        const pct = (v: number) => `${Math.round(v * 100)} %`
        body.append(
          this.row('music', S.music, S.musicDesc, this.slider('music', 0, 1, 0.05, s.music, pct, (v) => this.apply({ music: v }))),
          this.row(
            'sfx',
            S.sfx,
            S.sfxDesc,
            this.slider('sfx', 0, 1, 0.05, s.sfx, pct, (v) => this.apply({ sfx: v }), () => this.host.sfx('click')),
          ),
          this.row('amb', S.amb, S.ambDesc, this.slider('amb', 0, 1, 0.05, s.ambience, pct, (v) => this.apply({ ambience: v }))),
        )
        break
      }
      case 'graphics': {
        body.append(
          this.row(
            'quality',
            S.quality,
            S.qualityDesc,
            this.segmented<Quality>(
              'quality',
              s.quality,
              [
                ['low', S.low],
                ['medium', S.medium],
                ['high', S.high],
              ],
              (v) => this.apply({ quality: v }),
            ),
          ),
          this.row('outlines', S.outlines, S.outlinesDesc, this.toggle('outlines', s.outlines, (v) => this.apply({ outlines: v }))),
          this.row('shake', S.shake, S.shakeDesc, this.toggle('shake', s.screenShake, (v) => this.apply({ screenShake: v }))),
          this.row('motion', S.motion, S.motionDesc, this.toggle('motion', s.reducedMotion, (v) => this.apply({ reducedMotion: v }))),
        )
        break
      }
      case 'access': {
        body.append(
          this.row('skip', S.skip, S.skipDesc, this.toggle('skip', s.assistSkip, (v) => this.apply({ assistSkip: v }))),
          this.row('slow', S.slow, S.slowDesc, this.toggle('slow', s.assistSlow, (v) => this.apply({ assistSlow: v }))),
          this.row('stealth', S.stealth, S.stealthDesc, this.toggle('stealth', s.assistStealth, (v) => this.apply({ assistStealth: v }))),
          this.row('motion', S.motion, S.motionDesc, this.toggle('motion-a', s.reducedMotion, (v) => this.apply({ reducedMotion: v }))),
        )
        break
      }
      case 'controls':
        body.append(this.controls())
        break
    }
  }

  // ------------------------------------------------------------------ widgets

  private row(key: string, label: L, desc: L | null, ctl: HTMLElement): HTMLElement {
    return h(
      'div',
      { class: 'nvm-row', data: { navRow: key } },
      h('div', 'nvm-row-text', h('div', 'nvm-row-label', t(label)), desc ? h('div', 'nvm-row-desc', t(desc)) : null),
      h('div', 'nvm-row-ctl', ctl),
    )
  }

  private segmented<T extends string>(key: string, value: T, opts: [T, L][], onChange: (v: T) => void): HTMLElement {
    let cur = value
    const group = h('div', { class: 'nvm-seg', data: { nav: '', key }, attrs: { role: 'radiogroup', tabindex: '0' } })
    const buttons: HTMLElement[] = []
    const sync = () => {
      opts.forEach(([v], i) => {
        buttons[i].classList.toggle('is-on', v === cur)
        buttons[i].setAttribute('aria-checked', String(v === cur))
      })
    }
    const set = (v: T) => {
      if (v === cur) return
      cur = v
      sync()
      onChange(v)
    }
    opts.forEach(([v, label]) => {
      const b = h('span', { class: 'nvm-seg-opt', text: t(label), attrs: { role: 'radio' } })
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        group.focus()
        set(v)
      })
      buttons.push(b)
      group.appendChild(b)
    })
    sync()
    setAdjuster(group, (d) => {
      const i = opts.findIndex(([v]) => v === cur)
      const n = Math.max(0, Math.min(opts.length - 1, i + d))
      if (n !== i) {
        this.host.sfx('tick')
        set(opts[n][0])
      }
    })
    // Enter cycles through the options
    group.addEventListener('click', () => {
      const i = opts.findIndex(([v]) => v === cur)
      set(opts[(i + 1) % opts.length][0])
    })
    return group
  }

  private toggle(key: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
    let cur = value
    const label = h('span', 'nvm-switch-label', t(cur ? S.on : S.off))
    const sw = h('button', { class: 'nvm-switch', data: { nav: '', key }, attrs: { role: 'switch', 'aria-checked': String(cur) } })
    const set = (v: boolean) => {
      if (v === cur) return
      cur = v
      sw.setAttribute('aria-checked', String(v))
      label.textContent = t(v ? S.on : S.off)
      onChange(v)
    }
    sw.addEventListener('click', () => set(!cur))
    setAdjuster(sw, (d) => {
      const v = d > 0
      if (v !== cur) {
        this.host.sfx('tick')
        set(v)
      }
    })
    return h('div', 'nvm-switch-wrap', label, sw)
  }

  private slider(key: string, min: number, max: number, step: number, value: number, fmt: (v: number) => string, onChange: (v: number) => void, onCommit?: () => void): HTMLElement {
    const input = h('input', { class: 'nvm-range', data: { nav: '', key }, attrs: { type: 'range', min: String(min), max: String(max), step: String(step), 'aria-label': key } })
    input.value = String(value)
    const out = h('span', 'nvm-val', fmt(value))
    const paint = () => {
      const v = Number(input.value)
      input.style.setProperty('--p', `${((v - min) / (max - min)) * 100}%`)
      out.textContent = fmt(v)
    }
    paint()
    input.addEventListener('input', () => {
      paint()
      onChange(Number(input.value))
    })
    if (onCommit) input.addEventListener('change', onCommit)
    setAdjuster(input, (d) => {
      const v = Math.max(min, Math.min(max, Math.round((Number(input.value) + d * step) / step) * step))
      const fixed = Number(v.toFixed(4))
      if (fixed === Number(input.value)) return
      input.value = String(fixed)
      paint()
      onChange(fixed)
      onCommit?.()
      this.host.sfx('tick')
    })
    return h('div', 'nvm-slider', input, out)
  }

  private preview(): HTMLElement {
    return h(
      'div',
      'nvm-preview',
      h('div', 'nvm-preview-kicker', t(S.preview)),
      h('div', 'nvm-preview-who', t(S.previewWho)),
      h('div', 'nvm-preview-text', h('span', 'nvm-preview-typed'), h('span', 'nvm-preview-rest')),
    )
  }

  private startPreview(): void {
    window.clearInterval(this.previewTimer)
    const typed = this.body?.querySelector<HTMLElement>('.nvm-preview-typed')
    const rest = this.body?.querySelector<HTMLElement>('.nvm-preview-rest')
    if (!typed || !rest) return
    const full = t(S.previewText)
    const cps = this.s.textSpeed
    if (cps <= 0) {
      typed.textContent = full
      rest.textContent = ''
      return
    }
    let i = 0
    let hold = 0
    const tick = 1000 / 30
    this.previewTimer = window.setInterval(() => {
      if (i >= full.length) {
        hold += tick
        if (hold > 1800) {
          i = 0
          hold = 0
        }
      } else i = Math.min(full.length, i + (cps * tick) / 1000)
      const n = Math.floor(i)
      typed.textContent = full.slice(0, n)
      rest.textContent = full.slice(n)
    }, tick)
  }

  // ------------------------------------------------------------------ controls tab

  private controls(): HTMLElement {
    const b = this.s.bindings
    const usage = new Map<string, Action[]>()
    for (const a of ACTIONS) for (const code of b[a.id] ?? []) usage.set(code, [...(usage.get(code) ?? []), a.id])
    const wrap = h('div', 'nvm-binds')
    wrap.appendChild(h('div', 'nvm-binds-head', h('span', null, t(S.action)), h('span', null, t(S.keyboard)), h('span', null, t(S.gamepad))))
    for (const a of ACTIONS) {
      const keys = h('div', 'nvm-keys')
      const codes = b[a.id] ?? []
      codes.forEach((code, i) => {
        const others = (usage.get(code) ?? []).filter((x) => x !== a.id && !SHARED_OK.some(([p, q]) => (p === a.id && q === x) || (q === a.id && p === x)))
        const listening = this.listening?.action === a.id && this.listening.index === i
        const chip = h('button', {
          class: `nvm-key${others.length ? ' is-conflict' : ''}${listening ? ' is-listening' : ''}`,
          data: { nav: '', key: `${a.id}:${i}` },
          text: listening ? '…' : keyLabel(code),
          title: others.length ? t(S.conflict, { a: others.map((o) => t(ACTIONS.find((x) => x.id === o)?.label ?? l(o, o))).join(', ') }) : t(S.removeHint),
        })
        chip.addEventListener('click', (e) => this.startListen(a.id, i, e.detail === 0))
        chip.addEventListener('contextmenu', (e) => {
          e.preventDefault()
          this.removeKey(a.id, i)
        })
        keys.appendChild(chip)
      })
      if (codes.length < MAX_KEYS) {
        const i = codes.length
        const listening = this.listening?.action === a.id && this.listening.index === i
        const add = h('button', { class: `nvm-key nvm-key--add${listening ? ' is-listening' : ''}`, data: { nav: '', key: `${a.id}:${i}` }, text: listening ? '…' : '+', title: t(S.addKey), attrs: { 'aria-label': t(S.addKey) } })
        add.addEventListener('click', (e) => this.startListen(a.id, i, e.detail === 0))
        keys.appendChild(add)
      }
      const pad = h('div', 'nvm-pad', ...a.pad.map((p) => h('span', `nvm-padkey nvm-padkey--${p.toLowerCase().replace(/[^a-z]/g, '') || 'dir'}`, p)))
      wrap.appendChild(h('div', { class: 'nvm-bind' }, h('span', 'nvm-bind-name', t(a.label)), keys, pad))
    }
    const reset = h('button', { class: 'nvm-btn', data: { nav: '', key: 'reset' }, text: t(S.reset), onclick: () => this.resetBindings() })
    wrap.append(h('div', 'nvm-binds-foot', h('p', 'nvm-note', t(S.padNote)), reset))
    return wrap
  }

  private startListen(action: Action, index: number, viaKeyboard: boolean): void {
    const layer = this.layer
    if (!layer) return
    this.cancelListen(false)
    const unsub = this.host.input.onKey((code) => {
      const ls = this.listening
      if (!ls) return
      // ignore the auto-repeat of the key that started listening
      if (ls.viaKeyboard && performance.now() - ls.t0 < 600 && (code === 'Enter' || code === 'Space' || code === 'NumpadEnter')) return
      if (code === 'Escape') {
        this.cancelListen()
        return
      }
      this.assign(action, index, code)
    })
    this.listening = { action, index, unsub, t0: performance.now(), viaKeyboard }
    layer.passthrough = true
    this.renderBody()
    this.layer?.refocus(`${action}:${index}`)
    const label = t(ACTIONS.find((x) => x.id === action)?.label ?? l(action, action))
    if (this.bar) {
      this.bar.textContent = t(S.listenHint, { a: label })
      this.bar.classList.add('show')
    }
  }

  private cancelListen(rerender = true): void {
    const ls = this.listening
    if (!ls) return
    ls.unsub()
    this.listening = null
    if (this.layer) this.layer.passthrough = false
    this.bar?.classList.remove('show')
    if (rerender && this.tab === 'controls') {
      this.renderBody()
      this.layer?.refocus(`${ls.action}:${ls.index}`)
    }
  }

  private assign(action: Action, index: number, code: string): void {
    const b: Bindings = structuredClone(this.s.bindings)
    const list = [...(b[action] ?? [])]
    if (index >= list.length) list.push(code)
    else list[index] = code
    b[action] = list.filter((c, i) => list.indexOf(c) === i)
    this.apply({ bindings: b })
    this.host.sfx('click')
    const keyIndex = Math.min(b[action].indexOf(code), b[action].length - 1)
    this.cancelListen(false)
    this.renderBody()
    this.layer?.refocus(`${action}:${keyIndex}`)
  }

  private removeKey(action: Action, index: number): void {
    const b: Bindings = structuredClone(this.s.bindings)
    const list = [...(b[action] ?? [])]
    if (list.length <= 1 || index >= list.length) return
    list.splice(index, 1)
    b[action] = list
    this.apply({ bindings: b })
    this.host.sfx('click')
    this.renderBody()
    this.layer?.refocus(`${action}:${Math.min(index, list.length - 1)}`)
  }

  private resetBindings(): void {
    this.cancelListen(false)
    this.apply({ bindings: structuredClone(DEFAULT_BINDINGS) })
    this.renderBody()
    this.layer?.refocus('reset')
    if (this.layer) toast(this.layer, t(S.resetDone))
  }

  private onKey(e: KeyboardEvent): boolean {
    if (this.tab !== 'controls') return false
    if (e.code === 'Delete') {
      const key = this.layer?.current()?.dataset.key
      const m = key?.match(/^(\w+):(\d+)$/)
      if (m) {
        this.removeKey(m[1] as Action, Number(m[2]))
        return true
      }
    }
    return false
  }

  private cleanup(): void {
    window.clearInterval(this.previewTimer)
    this.listening?.unsub()
    this.listening = null
    this.offLang?.()
    this.offLang = null
    this.layer?.root.removeEventListener('pointerdown', this.onPointerDown, true)
    this.layer = null
    this.body = null
    this.tabsEl = null
    this.bar = null
    const cb = this.onClose
    this.onClose = undefined
    cb?.()
  }
}
