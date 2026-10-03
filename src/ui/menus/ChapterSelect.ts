/**
 * Chapter select: every chapter in play order; the ones reached in any
 * playthrough (profile.chapters) can be started directly.
 */
import type { ChapterDef } from '../../content/types'
import { l, onLangChange, t } from '../../i18n/i18n'
import type { MenuHost } from './MenuHost'
import { COMMON, Layer, closeAllLayers, confirmDialog, corners, fill, h, hints, roman, s, syncRootSettings, toast } from './Reader'

const S = {
  title: l('Kapitoly', 'Chapters'),
  sub: l('Vráť sa na ktorékoľvek miesto príbehu, ktoré si už navštívil.', 'Return to any part of the story you have already reached.'),
  locked: l('Zatiaľ neodomknuté', 'Not yet unlocked'),
  prologue: l('Prológ', 'Prologue'),
  chapter: l('Kapitola {n}', 'Chapter {n}'),
  confirmTitle: l('Začať kapitolu?', 'Start this chapter?'),
  confirmText: l('„{title}“ — neuložený postup sa stratí.', '“{title}” — any unsaved progress will be lost.'),
  begin: l('Začať', 'Begin'),
  fail: l('Kapitolu sa nepodarilo spustiť', 'The chapter could not be started'),
  start: l('Spustiť', 'Start'),
}

function lockIcon(): SVGSVGElement {
  return s(
    'svg',
    { class: 'nvm-lock', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    s('rect', { x: 5, y: 10.5, width: 14, height: 10, rx: 1.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 }),
    s('path', { d: 'M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 }),
    s('circle', { cx: 12, cy: 15.5, r: 1.3, fill: 'currentColor' }),
  )
}

export class ChapterSelect {
  private layer: Layer | null = null
  private onClose: (() => void) | undefined
  private offLang: (() => void) | null = null

  constructor(private host: MenuHost) {}

  open(onClose?: () => void): void {
    if (this.layer?.isOpen) return
    this.onClose = onClose
    syncRootSettings(this.host.settings)
    const layer = new Layer({
      className: 'nvm-chapters',
      ariaLabel: t(S.title),
      sfx: (id) => this.host.sfx(id),
      onBack: () => this.close(),
      onClosed: () => {
        this.offLang?.()
        this.offLang = null
        this.layer = null
        const cb = this.onClose
        this.onClose = undefined
        cb?.()
      },
    })
    this.layer = layer
    this.render()
    layer.open()
    this.offLang = onLangChange(() => {
      const key = this.layer?.current()?.dataset.key
      this.render()
      if (this.layer?.isTop) this.layer.refocus(key)
    })
    const unlocked = this.sorted().filter((c) => this.host.profile.chapters.includes(c.id))
    const last = unlocked[unlocked.length - 1]
    layer.focusFirst(last ? `[data-key="ch-${CSS.escape(last.id)}"]` : undefined)
  }

  close(): void {
    void this.layer?.close()
  }

  private sorted(): ChapterDef[] {
    return [...this.host.chapters].sort((a, b) => a.index - b.index)
  }

  /** "Kapitola 3" part of the host's "Kapitola 3 · Polnoc" label. */
  private numberLabel(c: ChapterDef): string {
    const label = t(this.host.chapterLabel(c.id))
    if (label.includes(' · ')) return label.split(' · ')[0]
    return c.index === 0 ? t(S.prologue) : t(S.chapter, { n: c.index })
  }

  private render(): void {
    const layer = this.layer
    if (!layer) return
    layer.root.textContent = ''
    const reached = new Set(this.host.profile.chapters)
    const grid = h('div', 'nvm-chapter-grid')
    this.sorted().forEach((c, i) => {
      const open = reached.has(c.id)
      const card = h(
        'button',
        {
          class: `nvm-chapter${open ? '' : ' is-locked'}`,
          data: { nav: '', key: `ch-${c.id}` },
          style: `--i:${i}`,
          attrs: open ? {} : { 'aria-disabled': 'true', 'aria-label': t(S.locked) },
        },
        h('span', 'nvm-chapter-frame'),
        h('span', 'nvm-chapter-num', open ? this.numberLabel(c) : '???'),
        h('span', 'nvm-chapter-emblem', open ? h('span', 'nvm-chapter-roman', c.index === 0 ? '✦' : roman(c.index)) : lockIcon()),
        h('span', 'nvm-chapter-title', open ? t(c.title) : '???'),
        h('span', 'nvm-chapter-sub', open ? t(c.subtitle) : t(S.locked)),
      )
      card.addEventListener('click', () => void this.pick(c, open))
      grid.appendChild(card)
    })
    const back = h('button', { class: 'nvm-btn', data: { nav: 'tab-only', key: 'back' }, text: t(COMMON.back), onclick: () => this.close() })
    const sheet = corners(
      h(
        'section',
        'nvm-sheet nvm-sheet--chapters nvm-glass nvm-rise',
        h('header', 'nvm-sheet-head', h('h1', 'nvm-h1', t(S.title)), h('p', 'nvm-sheet-sub', t(S.sub))),
        h('div', 'nvm-sheet-body', grid),
        h(
          'footer',
          'nvm-sheet-foot',
          hints([
            ['←↑↓→', COMMON.select],
            ['Enter', S.start],
            ['Esc', COMMON.back],
          ]),
          back,
        ),
      ),
    )
    layer.root.append(h('div', 'nvm-backdrop'), sheet)
  }

  private async pick(c: ChapterDef, open: boolean): Promise<void> {
    const layer = this.layer
    if (!layer || layer.busy || !open) return
    const text = { sk: fill(S.confirmText, { title: c.title.sk }).sk, en: fill(S.confirmText, { title: c.title.en }).en }
    const ok = await confirmDialog({ title: S.confirmTitle, text, confirm: S.begin, sfx: (id) => this.host.sfx(id) })
    if (!ok || !this.layer) return
    this.layer.busy = true
    this.layer.root.classList.add('is-leaving')
    try {
      await this.host.startChapter(c.id)
      await closeAllLayers()
    } catch (err) {
      console.error('[chapters]', err)
      if (this.layer) {
        this.layer.busy = false
        this.layer.root.classList.remove('is-leaving')
        toast(this.layer, t(S.fail), 'warn')
      }
    }
  }
}
