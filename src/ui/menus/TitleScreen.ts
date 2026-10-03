/**
 * Title screen: the kneeling goddess in the ruined cathedral, the Null Void
 * Saga logo, and the main menu. Music is handled by the game.
 */
import { getLang, l, onLangChange, setLang, t, type Lang } from '../../i18n/i18n'
import type { MenuHost } from './MenuHost'
import { ChapterSelect } from './ChapterSelect'
import { CodexScreen } from './CodexScreen'
import { CreditsScreen } from './CreditsScreen'
import { Layer, confirmDialog, h, reducedMotion, syncRootSettings, timeAgo } from './Reader'
import { SettingsMenu } from './SettingsMenu'

const S = {
  cont: l('Pokračovať', 'Continue'),
  newGame: l('Nová hra', 'New Game'),
  chapters: l('Kapitoly', 'Chapters'),
  settings: l('Nastavenia', 'Settings'),
  codex: l('Kódex', 'Codex'),
  credits: l('Tvorcovia', 'Credits'),
  exit: l('Ukončiť', 'Exit'),
  confirmTitle: l('Začať novú hru?', 'Start a new game?'),
  confirmText: l(
    'Uložené pozície zostanú zachované, no automatické uloženie sa pri prvom kontrolnom bode prepíše.',
    'Your saved slots stay untouched, but the autosave will be overwritten at the first checkpoint.',
  ),
  begin: l('Začať', 'Begin'),
  back: l('Späť', 'Back'),
  basedOn: l('podľa románu Brana Langa', 'based on the novel by Bran Lang'),
  language: l('Jazyk', 'Language'),
}

/** Title art is 1376 × 768; the statue's eyes sit at 52.8 % / 35 %. */
const ART_RATIO = 1376 / 768

interface Mote {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  phase: number
  speed: number
  hue: number
  bokeh: boolean
}

/** Floating dust motes drawn on a small canvas. */
class DustField {
  private ctx: CanvasRenderingContext2D | null
  private motes: Mote[] = []
  private raf = 0
  private w = 0
  private hgt = 0
  private dpr = 1
  private last = 0
  private readonly onResize = () => this.resize()

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')
  }

  start(): void {
    if (!this.ctx) return
    this.resize()
    window.addEventListener('resize', this.onResize)
    const count = Math.round(Math.min(90, (this.w * this.hgt) / 16000))
    this.motes = Array.from({ length: count }, () => this.spawn(true))
    this.last = performance.now()
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.step(dt, now / 1000)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop(): void {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
  }

  private resize(): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.w = this.canvas.clientWidth || window.innerWidth
    this.hgt = this.canvas.clientHeight || window.innerHeight
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.hgt * this.dpr)
  }

  private spawn(anywhere: boolean): Mote {
    const bokeh = Math.random() < 0.12
    return {
      x: Math.random() * this.w,
      y: anywhere ? Math.random() * this.hgt : this.hgt + 10,
      r: bokeh ? 2.5 + Math.random() * 3.5 : 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 6,
      vy: -(4 + Math.random() * 12),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.9,
      hue: Math.random(),
      bokeh,
    }
  }

  private step(dt: number, time: number): void {
    const ctx = this.ctx
    if (!ctx) return
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, this.w, this.hgt)
    // the setting can change while the title is open
    if (reducedMotion()) return
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i]
      m.x += (m.vx + Math.sin(time * m.speed + m.phase) * 5) * dt
      m.y += m.vy * dt
      if (m.y < -12 || m.x < -20 || m.x > this.w + 20) {
        this.motes[i] = this.spawn(false)
        continue
      }
      const tw = 0.45 + 0.55 * Math.sin(time * (1.2 + m.speed) + m.phase) ** 2
      // brighter in the shaft of light around the statue
      const cx = Math.abs(m.x / this.w - 0.528)
      const shaft = Math.max(0.35, 1 - cx * 2.2)
      const a = (m.bokeh ? 0.1 : 0.55) * tw * shaft
      const col = m.hue < 0.55 ? '255,236,200' : m.hue < 0.82 ? '210,180,255' : '170,240,235'
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * (m.bokeh ? 2 : 3))
      g.addColorStop(0, `rgba(${col},${a})`)
      g.addColorStop(1, `rgba(${col},0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.r * (m.bokeh ? 2 : 3), 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

type ItemId = 'continue' | 'new' | 'chapters' | 'settings' | 'codex' | 'credits' | 'exit'

export class TitleScreen {
  private layer: Layer | null = null
  private offLang: (() => void) | null = null
  private dust: DustField | null = null
  private menu: HTMLElement | null = null
  private foot: HTMLElement | null = null
  private lastKey: string | undefined
  private chapterSelect: ChapterSelect | null = null
  private settingsMenu: SettingsMenu | null = null
  private codex: CodexScreen | null = null
  private credits: CreditsScreen | null = null
  private readonly onMove = (e: MouseEvent) => this.parallax(e)

  constructor(private host: MenuHost) {}

  open(): void {
    if (this.layer?.isOpen) return
    syncRootSettings(this.host.settings)
    const layer = new Layer({
      className: 'nvm-title',
      ariaLabel: 'Null Void Saga I · Eltária',
      wrap: true,
      sfx: (id) => this.host.sfx(id),
      onResume: () => {
        this.renderMenu()
        this.layer?.refocus(this.lastKey)
      },
      onClosed: () => this.cleanup(),
    })
    this.layer = layer
    this.build(layer)
    layer.open()
    this.offLang = onLangChange(() => {
      const key = this.layer?.current()?.dataset.key
      this.renderMenu()
      this.renderFoot()
      if (this.layer?.isTop) this.layer.refocus(key)
    })
    layer.focusFirst()
  }

  close(): void {
    void this.layer?.close()
  }

  // ------------------------------------------------------------------ build

  private build(layer: Layer): void {
    const root = layer.root
    const procedural = !!import.meta.env.VITE_PROCEDURAL
    const img = procedural ? h('div') : h('img', { attrs: { src: 'assets/ui/title_bg.jpg', alt: '', draggable: 'false', decoding: 'async' } })
    const art = h(
      'div',
      { class: 'nvm-title-art', style: `--ratio:${ART_RATIO}` },
      h('div', 'nvm-title-kb', img, h('div', 'nvm-title-rays'), h('div', 'nvm-title-eyes'), h('div', 'nvm-title-eyes nvm-title-eyes--aura')),
    )
    const parallax = h('div', 'nvm-title-parallax', art)
    const canvas = h('canvas', 'nvm-title-dust')
    const stage = h('div', 'nvm-title-stage', parallax, canvas, h('div', 'nvm-title-shade'))
    const head = h(
      'header',
      'nvm-title-head',
      procedural
        ? h('div', { class: 'nvm-title-logo-float', style: "font-family:'EB Garamond',Georgia,serif;font-weight:600;font-size:clamp(40px,6vw,84px);color:#efe6d2;text-align:center;text-shadow:0 2px 18px rgba(0,0,0,.8)" }, 'Null Void Saga')
        : h('div', 'nvm-title-logo-float', h('img', { class: 'nvm-title-logo', attrs: { src: 'assets/ui/logo.png', alt: 'Null Void Saga', draggable: 'false' } })),
      h('div', 'nvm-title-sub', h('span', 'nvm-title-sub-text', 'I · ELTÁRIA')),
    )
    this.menu = h('nav', { class: 'nvm-title-menu', attrs: { 'aria-label': 'Menu' } })
    this.foot = h('footer', 'nvm-title-foot')
    root.append(stage, head, this.menu, this.foot)
    this.renderMenu()
    this.renderFoot()
    this.dust = new DustField(canvas)
    // start after layout so the canvas has a size
    requestAnimationFrame(() => this.dust?.start())
    root.addEventListener('mousemove', this.onMove)
  }

  private items(): { id: ItemId; label: string; sub?: string }[] {
    const host = this.host
    const out: { id: ItemId; label: string; sub?: string }[] = []
    const latest = host.saves.latest()
    if (latest) {
      const d = latest.data
      const chapter = t(d.chapterTitle ?? host.chapterLabel(d.chapterId))
      out.push({ id: 'continue', label: t(S.cont), sub: `${chapter} · ${timeAgo(d.savedAt, getLang())}` })
    }
    out.push({ id: 'new', label: t(S.newGame) })
    if (host.profile.chapters.length > 0) out.push({ id: 'chapters', label: t(S.chapters) })
    out.push({ id: 'settings', label: t(S.settings) })
    if (host.profile.codex.length > 0) out.push({ id: 'codex', label: t(S.codex) })
    out.push({ id: 'credits', label: t(S.credits) })
    if (host.canExit) out.push({ id: 'exit', label: t(S.exit) })
    return out
  }

  private renderMenu(): void {
    const menu = this.menu
    if (!menu) return
    menu.textContent = ''
    this.items().forEach((it, i) => {
      const btn = h(
        'button',
        { class: `nvm-tbtn${it.sub ? ' has-sub' : ''}`, data: { nav: '', key: it.id }, style: `--i:${i}` },
        h('span', 'nvm-tbtn-glow'),
        h('span', 'nvm-tbtn-label', it.label),
        it.sub ? h('span', 'nvm-tbtn-sub', it.sub) : null,
        h('span', 'nvm-tbtn-line'),
      )
      btn.addEventListener('click', () => this.activate(it.id))
      menu.appendChild(btn)
    })
  }

  private renderFoot(): void {
    const foot = this.foot
    if (!foot) return
    foot.textContent = ''
    const lang = getLang()
    const mk = (code: Lang, label: string) => {
      const b = h('button', { class: `nvm-lang-btn${lang === code ? ' is-active' : ''}`, data: { nav: 'tab-only', key: `lang-${code}` }, text: label, attrs: { 'aria-pressed': String(lang === code), lang: code } })
      b.addEventListener('click', () => this.setLanguage(code))
      return b
    }
    foot.append(
      h('div', { class: 'nvm-lang', attrs: { role: 'group', 'aria-label': t(S.language) } }, mk('sk', 'SK'), h('span', 'nvm-lang-sep'), mk('en', 'EN')),
      h('div', 'nvm-title-credit', t(S.basedOn)),
      import.meta.env.VITE_PROCEDURAL
        ? h(
            'div',
            { class: 'nvm-title-credit', style: 'display:flex;gap:18px' },
            h('a', { attrs: { href: 'gallery.html', style: 'color:#d6b26a' }, text: getLang() === 'sk' ? 'Galéria rekvizít' : 'Prop gallery' }),
            h('a', { attrs: { href: 'characters.html', style: 'color:#d6b26a' }, text: getLang() === 'sk' ? 'Postavy' : 'Characters' }),
          )
        : '',
      h('div', 'nvm-title-version', this.host.version),
    )
  }

  private setLanguage(lang: Lang): void {
    if (getLang() === lang && this.host.settings.lang === lang) return
    this.host.applySettings({ ...this.host.settings, lang })
    setLang(lang)
  }

  // ------------------------------------------------------------------ actions

  private activate(id: ItemId): void {
    const layer = this.layer
    if (!layer || layer.busy) return
    this.lastKey = id
    const host = this.host
    switch (id) {
      case 'continue':
        void this.run(() => host.continueGame())
        return
      case 'new':
        void this.startNew()
        return
      case 'chapters':
        ;(this.chapterSelect ??= new ChapterSelect(host)).open()
        return
      case 'settings':
        ;(this.settingsMenu ??= new SettingsMenu(host)).open()
        return
      case 'codex':
        ;(this.codex ??= new CodexScreen(host)).open({ gallery: true })
        return
      case 'credits':
        ;(this.credits ??= new CreditsScreen(host)).open()
        return
      case 'exit':
        host.exitApp()
        return
    }
  }

  private async startNew(): Promise<void> {
    if (this.host.saves.latest()) {
      const ok = await confirmDialog({ title: S.confirmTitle, text: S.confirmText, confirm: S.begin, cancel: S.back, sfx: (id) => this.host.sfx(id) })
      if (!ok) return
    }
    await this.run(() => this.host.newGame())
  }

  /** Fade the menu out, run the game action, then close the title. */
  private async run(fn: () => Promise<void>): Promise<void> {
    const layer = this.layer
    if (!layer) return
    layer.busy = true
    layer.root.classList.add('is-leaving')
    try {
      await fn()
      this.close()
    } catch (err) {
      console.error('[title]', err)
      layer.busy = false
      layer.root.classList.remove('is-leaving')
    }
  }

  private parallax(e: MouseEvent): void {
    const root = this.layer?.root
    if (!root || reducedMotion()) return
    const x = e.clientX / window.innerWidth - 0.5
    const y = e.clientY / window.innerHeight - 0.5
    root.style.setProperty('--px', `${(-x * 14).toFixed(1)}px`)
    root.style.setProperty('--py', `${(-y * 9).toFixed(1)}px`)
    root.style.setProperty('--lx', `${(x * 5).toFixed(1)}px`)
    root.style.setProperty('--ly', `${(y * 3).toFixed(1)}px`)
  }

  private cleanup(): void {
    this.dust?.stop()
    this.dust = null
    this.offLang?.()
    this.offLang = null
    this.layer?.root.removeEventListener('mousemove', this.onMove)
    this.layer = null
    this.menu = null
    this.foot = null
  }
}
