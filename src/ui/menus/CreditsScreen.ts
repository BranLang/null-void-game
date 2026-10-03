/**
 * Credits: a slow scroll over the cathedral. With `ending: true` it ends on
 * "To be continued…" and calls onDone when finished or skipped (any key or
 * click skips after two seconds).
 */
import { l, onLangChange, t, type L } from '../../i18n/i18n'
import type { MenuHost } from './MenuHost'
import { Layer, divider, h, reducedMotion, syncRootSettings } from './Reader'

interface Block {
  kind?: 'logo' | 'thanks'
  role?: L
  names?: string[]
  note?: L
}

const BLOCKS: Block[] = [
  { kind: 'logo' },
  { role: l('Podľa románu', 'Based on the novel by'), names: ['Bran Lang'], note: l('Null Void: Eltária', 'Null Void: Eltária') },
  { role: l('Autor a tvorca hry', 'Created by'), names: ['Bran Lang'] },
  { role: l('Podpora a inšpirácia', 'Support & inspiration'), names: ['Andrea Lang'] },
  { role: l('Inšpirácia', 'Inspiration'), names: ['Barsian & Raketacik'] },
  { role: l('Prví čitatelia', 'First readers'), names: ['Evo & Lynx'] },
  { role: l('Hudba', 'Music'), names: ['Bran Lang'], note: l('vytvorené so Suno', 'made with Suno') },
  { role: l('Zvuky krokov', 'Footstep sounds'), names: ['Fantozzi'], note: l('OpenGameArt', 'OpenGameArt') },
  { role: l('Písma', 'Fonts'), names: ['Cinzel — Natanael Gama', 'EB Garamond — Georg Duffner, Octavio Pardo'] },
  { role: l('Engine', 'Engine'), names: ['three.js'] },
  { role: l('Vytvorené pomocou', 'Built with'), names: ['Claude Code'] },
  { role: l('Osobitné poďakovanie', 'Special thanks'), names: ['Anthropic'] },
]

const S = {
  title: l('Tvorcovia', 'Credits'),
  thanks: l('Ďakujeme za hranie.', 'Thank you for playing.'),
  toBeContinued: l('Pokračovanie nabudúce…', 'To be continued…'),
  skip: l('Stlač ľubovoľný kláves', 'Press any key'),
  close: l('Zavrieť', 'Close'),
  faster: l('Zrýchliť', 'Faster'),
}

const SPEED = 40
const FAST = 7
const SKIP_AFTER = 2000

export class CreditsScreen {
  private layer: Layer | null = null
  private ending = false
  private onDone: (() => void) | undefined
  private offLang: (() => void) | null = null
  private roll: HTMLElement | null = null
  private viewport: HTMLElement | null = null
  private endEl: HTMLElement | null = null
  private raf = 0
  private y = 0
  private fast = false
  private openedAt = 0
  private stopped = false
  private finished = false
  private endTimer = 0
  private hintTimer = 0
  private readonly onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown' || e.code === 'KeyS') this.fast = false
  }

  constructor(private host: MenuHost) {}

  open(opts?: { ending?: boolean }, onDone?: () => void): void {
    if (this.layer?.isOpen) return
    this.ending = !!opts?.ending
    this.onDone = onDone
    this.finished = false
    this.stopped = false
    this.fast = false
    this.y = 0
    syncRootSettings(this.host.settings)
    const layer = new Layer({
      className: `nvm-credits${this.ending ? ' is-ending' : ''}`,
      ariaLabel: t(S.title),
      onBack: () => this.skip(true),
      onConfirm: () => {
        this.skip(false)
        return true
      },
      onNav: () => true,
      onKey: (e) => this.onKey(e),
      onClosed: () => this.cleanup(),
    })
    this.layer = layer
    this.render()
    layer.open()
    layer.root.addEventListener('click', () => this.skip(!this.ending))
    window.addEventListener('keyup', this.onKeyUp)
    this.offLang = onLangChange(() => this.render())
    this.openedAt = performance.now()
    this.hintTimer = window.setTimeout(() => this.layer?.root.classList.add('show-hint'), this.ending ? SKIP_AFTER : 600)
    if (reducedMotion()) {
      layer.root.classList.add('is-static')
      if (this.ending) this.endEl?.classList.add('show')
    } else {
      let last = performance.now()
      const loop = (now: number) => {
        this.raf = requestAnimationFrame(loop)
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        this.step(dt)
      }
      this.raf = requestAnimationFrame(loop)
    }
  }

  close(): void {
    void this.layer?.close()
  }

  private render(): void {
    const layer = this.layer
    if (!layer) return
    layer.root.textContent = ''
    const roll = h('div', 'nvm-cr-roll')
    for (const b of BLOCKS) {
      if (b.kind === 'logo') {
        roll.appendChild(
          h(
            'div',
            'nvm-cr-block nvm-cr-logo',
            import.meta.env.VITE_PROCEDURAL
              ? h('div', { style: "font-family:'EB Garamond',Georgia,serif;font-weight:600;font-size:46px;color:#efe6d2" }, 'Null Void Saga')
              : h('img', { attrs: { src: 'assets/ui/logo.png', alt: 'Null Void Saga', draggable: 'false' } }),
            h('div', 'nvm-cr-sub', 'I · ELTÁRIA'),
            divider('nvm-cr-divider'),
          ),
        )
        continue
      }
      roll.appendChild(
        h(
          'div',
          'nvm-cr-block',
          b.role ? h('div', 'nvm-cr-role', t(b.role)) : null,
          ...(b.names ?? []).map((n) => h('div', 'nvm-cr-name', n)),
          b.note ? h('div', 'nvm-cr-note', t(b.note)) : null,
        ),
      )
    }
    if (this.ending) roll.appendChild(h('div', 'nvm-cr-block nvm-cr-thanks', divider('nvm-cr-divider'), h('div', 'nvm-cr-name nvm-cr-name--thanks', t(S.thanks))))
    roll.appendChild(h('div', 'nvm-cr-tail'))
    const viewport = h('div', 'nvm-cr-viewport', roll)
    const end = h('div', 'nvm-cr-end', h('div', 'nvm-cr-end-text', t(S.toBeContinued)), divider('nvm-cr-divider'))
    const hint = this.ending
      ? h('div', 'nvm-hints nvm-cr-hint', h('span', 'nvm-hint', t(S.skip)))
      : h('div', 'nvm-hints nvm-cr-hint', h('span', 'nvm-hint', h('kbd', null, 'Esc'), t(S.close)), h('span', 'nvm-hint', h('kbd', null, 'Space'), t(S.faster)))
    const art = h('div', { class: 'nvm-cr-art', style: import.meta.env.VITE_PROCEDURAL ? '' : "background-image:url('assets/ui/title_bg.jpg')" })
    layer.root.append(h('div', 'nvm-cr-bg', art, h('div', 'nvm-cr-stars')), viewport, end, hint)
    if (this.ending && (this.stopped || reducedMotion())) end.classList.add('show')
    this.roll = roll
    this.viewport = viewport
    this.endEl = end
    this.place()
  }

  private place(): void {
    if (!this.roll || !this.viewport || reducedMotion()) return
    const vh = this.viewport.clientHeight || window.innerHeight
    this.roll.style.transform = `translate3d(0, ${(vh - this.y).toFixed(1)}px, 0)`
  }

  private step(dt: number): void {
    const roll = this.roll
    const viewport = this.viewport
    if (!roll || !viewport || this.stopped) return
    this.y += SPEED * dt * (this.fast ? FAST : 1)
    this.place()
    const vh = viewport.clientHeight || window.innerHeight
    const rollH = roll.scrollHeight
    if (this.ending) {
      // stop once the last block has scrolled out of the frame, then show the final line
      if (vh - this.y + rollH < vh * 0.2) {
        this.stopped = true
        this.endEl?.classList.add('show')
        this.endTimer = window.setTimeout(() => this.finish(), 5200)
      }
    } else if (vh - this.y + rollH < 0) {
      this.finish()
    }
  }

  private onKey(e: KeyboardEvent): boolean {
    // leave browser / system keys alone
    if (e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.key) || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return false
    if (this.ending) {
      if (!e.repeat) this.skip(false)
      return true
    }
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.fast = true
      return true
    }
    return false
  }

  /** Skip: ending mode only after SKIP_AFTER ms; otherwise when `force` (Esc / click). */
  private skip(force: boolean): void {
    if (this.ending) {
      if (performance.now() - this.openedAt < SKIP_AFTER) return
      this.finish()
      return
    }
    if (force) this.finish()
  }

  private finish(): void {
    if (this.finished) return
    this.finished = true
    void this.layer?.close()
  }

  private cleanup(): void {
    cancelAnimationFrame(this.raf)
    window.clearTimeout(this.endTimer)
    window.clearTimeout(this.hintTimer)
    window.removeEventListener('keyup', this.onKeyUp)
    this.offLang?.()
    this.offLang = null
    this.layer = null
    this.roll = null
    this.viewport = null
    this.endEl = null
    const cb = this.onDone
    this.onDone = undefined
    cb?.()
  }
}
