/**
 * Save / load screen: the autosave (read-only when saving) and three manual
 * slots, each with a thumbnail, chapter, scene, playtime and date.
 */
import type { SlotId } from '../../game/Save'
import type { SaveData } from '../../game/State'
import { getLang, l, onLangChange, t, type L } from '../../i18n/i18n'
import type { MenuHost } from './MenuHost'
import { COMMON, Layer, closeAllLayers, confirmDialog, corners, fill, formatDate, formatPlaytime, h, hints, roman, s, syncRootSettings, toast } from './Reader'

const S = {
  saveTitle: l('Uložiť hru', 'Save Game'),
  loadTitle: l('Načítať hru', 'Load Game'),
  saveSub: l('Vyber pozíciu, do ktorej sa hra uloží.', 'Choose a slot to save your journey to.'),
  loadSub: l('Vyber uloženú hru, v ktorej chceš pokračovať.', 'Choose a save to continue from.'),
  auto: l('Automatické uloženie', 'Autosave'),
  slot: l('Pozícia {n}', 'Slot {n}'),
  empty: l('Prázdna pozícia', 'Empty slot'),
  emptySave: l('Uložiť sem', 'Save here'),
  emptyLoad: l('Zatiaľ tu nič nie je.', 'Nothing here yet.'),
  readOnly: l('Len na čítanie', 'Read-only'),
  autoNote: l('Hra sa ukladá sama na kontrolných bodoch.', 'The game saves itself at checkpoints.'),
  playtime: l('Čas hrania', 'Playtime'),
  delete: l('Vymazať', 'Delete'),
  delTitle: l('Vymazať pozíciu {n}?', 'Delete slot {n}?'),
  delText: l('Túto akciu nemožno vrátiť.', 'This cannot be undone.'),
  overTitle: l('Prepísať pozíciu {n}?', 'Overwrite slot {n}?'),
  overText: l('Pôvodné uloženie nahradí tvoj aktuálny postup.', 'The existing save will be replaced with your current progress.'),
  overYes: l('Prepísať', 'Overwrite'),
  loadQ: l('Načítať túto hru?', 'Load this save?'),
  loadText: l('Neuložený postup sa stratí.', 'Unsaved progress will be lost.'),
  loadYes: l('Načítať', 'Load'),
  savedToast: l('Hra uložená', 'Game saved'),
  saveFail: l('Uloženie zlyhalo', 'Saving failed'),
  loadFail: l('Načítanie zlyhalo', 'Loading failed'),
  cantSave: l('Teraz sa nedá ukladať.', 'You can’t save right now.'),
  justSaved: l('Práve uložené', 'Just saved'),
}

type Mode = 'save' | 'load'

/** Stylised placeholder thumbnail: Sai with its ring over a dark horizon. */
function placeholder(hue: number, empty: boolean): HTMLElement {
  const svg = s('svg', { viewBox: '0 0 160 90', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' })
  const g = s('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': 0.8 })
  g.append(
    s('circle', { cx: 80, cy: 40, r: 15, fill: 'currentColor', 'fill-opacity': empty ? 0.04 : 0.12 }),
    s('ellipse', { cx: 80, cy: 40, rx: 27, ry: 6, transform: 'rotate(-12 80 40)' }),
    s('path', { d: 'M0 70 C 30 64, 52 68, 80 66 S 130 62, 160 68', opacity: 0.6 }),
  )
  if (!empty) {
    for (const [x, y] of [
      [22, 18],
      [40, 30],
      [128, 16],
      [142, 34],
      [112, 26],
      [16, 42],
    ]) {
      g.append(s('circle', { cx: x, cy: y, r: 0.9, fill: 'currentColor', stroke: 'none' }))
    }
  }
  svg.appendChild(g)
  return h('div', { class: `nvm-thumb-ph${empty ? ' is-empty' : ''}`, style: `--hue:${hue}` }, svg)
}

export class SaveLoadMenu {
  private layer: Layer | null = null
  private mode: Mode = 'load'
  private onClose: (() => void) | undefined
  private offLang: (() => void) | null = null
  private justSaved: SlotId | null = null

  constructor(private host: MenuHost) {}

  open(mode: 'save' | 'load', onClose?: () => void): void {
    if (this.layer?.isOpen) return
    this.mode = mode
    this.onClose = onClose
    this.justSaved = null
    syncRootSettings(this.host.settings)
    const layer = new Layer({
      className: 'nvm-saves',
      ariaLabel: t(mode === 'save' ? S.saveTitle : S.loadTitle),
      sfx: (id) => this.host.sfx(id),
      onBack: () => this.close(),
      onKey: (e) => this.onKey(e),
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
    this.focusDefault()
  }

  close(): void {
    void this.layer?.close()
  }

  private focusDefault(): void {
    const layer = this.layer
    if (!layer) return
    if (this.mode === 'load') {
      const latest = this.host.saves.latest()
      layer.focusFirst(latest ? `[data-key="slot-${latest.slot}"]` : undefined)
    } else layer.focusFirst('[data-key="slot-1"]')
  }

  private slotName(slot: SlotId): string {
    return slot === 'auto' ? t(S.auto) : t(S.slot, { n: slot })
  }

  private render(): void {
    const layer = this.layer
    if (!layer) return
    layer.root.textContent = ''
    const mode = this.mode
    const list = h('div', 'nvm-slots')
    for (const { slot, data } of this.host.saves.list()) list.appendChild(this.card(slot, data))
    const back = h('button', { class: 'nvm-btn', data: { nav: 'tab-only', key: 'back' }, text: t(COMMON.back), onclick: () => this.close() })
    const sheet = corners(
      h(
        'section',
        'nvm-sheet nvm-sheet--slots nvm-glass nvm-rise',
        h('header', 'nvm-sheet-head', h('h1', 'nvm-h1', t(mode === 'save' ? S.saveTitle : S.loadTitle)), h('p', 'nvm-sheet-sub', t(mode === 'save' ? S.saveSub : S.loadSub))),
        h('div', 'nvm-sheet-body', list),
        h(
          'footer',
          'nvm-sheet-foot',
          hints([
            ['↑↓', COMMON.select],
            ['Enter', mode === 'save' ? S.overYes : S.loadYes],
            ['Del', S.delete],
            ['Esc', COMMON.back],
          ]),
          back,
        ),
      ),
    )
    layer.root.append(h('div', 'nvm-backdrop'), sheet)
  }

  private card(slot: SlotId, data: SaveData | null): HTMLElement {
    const host = this.host
    const mode = this.mode
    const readOnly = mode === 'save' && slot === 'auto'
    const disabled = readOnly || (mode === 'load' && !data)
    const chapterIndex = data ? (host.chapters.find((c) => c.id === data.chapterId)?.index ?? 0) : 0
    const hue = (262 + chapterIndex * 29) % 360

    const thumb = h('div', 'nvm-slot-thumb')
    if (data?.thumb) thumb.appendChild(h('img', { attrs: { src: data.thumb, alt: '', draggable: 'false' } }))
    else thumb.appendChild(placeholder(hue, !data))
    if (data) thumb.appendChild(h('span', 'nvm-slot-num', slot === 'auto' ? 'A' : roman(Number(slot))))

    const info = h('div', 'nvm-slot-info')
    const kicker = h('div', 'nvm-slot-kicker', this.slotName(slot))
    if (readOnly) kicker.appendChild(h('span', 'nvm-badge', t(S.readOnly)))
    if (this.justSaved === slot) kicker.appendChild(h('span', 'nvm-badge nvm-badge--ok', t(S.justSaved)))
    info.appendChild(kicker)
    if (data) {
      const title: L = data.chapterTitle ?? host.chapterLabel(data.chapterId)
      info.append(
        h('div', 'nvm-slot-title', t(title)),
        h('div', 'nvm-slot-scene', data.sceneName ? t(data.sceneName) : data.objective ? t(data.objective) : ''),
        h(
          'div',
          'nvm-slot-meta',
          h('span', 'nvm-meta', h('i', 'nvm-meta-ico nvm-meta-ico--time'), `${t(S.playtime)} ${formatPlaytime(data.playtime)}`),
          h('span', 'nvm-meta', h('i', 'nvm-meta-ico nvm-meta-ico--date'), formatDate(data.savedAt, getLang())),
        ),
      )
      if (readOnly) info.appendChild(h('div', 'nvm-slot-note', t(S.autoNote)))
    } else {
      info.append(h('div', 'nvm-slot-title is-empty', t(S.empty)), h('div', 'nvm-slot-scene', readOnly ? t(S.autoNote) : t(mode === 'save' ? S.emptySave : S.emptyLoad)))
    }

    const main = h(
      'button',
      { class: 'nvm-slot-main', data: { nav: '', key: `slot-${slot}` }, attrs: disabled ? { 'aria-disabled': 'true' } : {} },
      thumb,
      info,
    )
    main.addEventListener('click', () => void this.pick(slot))
    const card = h('div', `nvm-slot${data ? '' : ' is-empty'}${disabled ? ' is-disabled' : ''}${this.justSaved === slot ? ' is-fresh' : ''}`, main)
    if (data && slot !== 'auto') {
      const del = h('button', { class: 'nvm-slot-del', data: { nav: '', key: `del-${slot}` }, title: t(S.delete), attrs: { 'aria-label': `${t(S.delete)} · ${this.slotName(slot)}` } }, h('span', 'nvm-del-ico'))
      del.addEventListener('click', () => void this.remove(slot))
      card.appendChild(del)
    }
    return card
  }

  private async pick(slot: SlotId): Promise<void> {
    const layer = this.layer
    const host = this.host
    if (!layer || layer.busy) return
    const data = host.saves.read(slot)
    if (this.mode === 'save') {
      if (slot === 'auto') return
      if (!host.canSave()) {
        toast(layer, t(S.cantSave), 'warn')
        return
      }
      if (data) {
        const ok = await confirmDialog({ title: fill(S.overTitle, { n: slot }), text: S.overText, confirm: S.overYes, danger: true, sfx: (id) => host.sfx(id) })
        if (!ok) return
      }
      layer.busy = true
      let ok = false
      try {
        ok = await host.saveTo(slot)
      } catch (err) {
        console.error('[save]', err)
      }
      layer.busy = false
      if (!this.layer) return
      this.justSaved = ok ? slot : null
      this.render()
      this.layer.refocus(`slot-${slot}`)
      toast(this.layer, t(ok ? S.savedToast : S.saveFail), ok ? 'ok' : 'warn')
      return
    }
    // load
    if (!data) return
    if (host.state.chapterId) {
      const ok = await confirmDialog({ title: S.loadQ, text: S.loadText, confirm: S.loadYes, sfx: (id) => host.sfx(id) })
      if (!ok) return
    }
    layer.busy = true
    layer.root.classList.add('is-leaving')
    try {
      await host.loadFrom(slot)
      await closeAllLayers()
    } catch (err) {
      console.error('[load]', err)
      if (this.layer) {
        this.layer.busy = false
        this.layer.root.classList.remove('is-leaving')
        toast(this.layer, t(S.loadFail), 'warn')
      }
    }
  }

  private async remove(slot: SlotId): Promise<void> {
    const layer = this.layer
    if (!layer || layer.busy || slot === 'auto' || !this.host.saves.read(slot)) return
    const ok = await confirmDialog({ title: fill(S.delTitle, { n: slot }), text: S.delText, confirm: S.delete, danger: true, sfx: (id) => this.host.sfx(id) })
    if (!ok || !this.layer) return
    this.host.saves.remove(slot)
    if (this.justSaved === slot) this.justSaved = null
    this.render()
    this.layer.refocus(`slot-${slot}`)
  }

  private onKey(e: KeyboardEvent): boolean {
    if (e.code !== 'Delete') return false
    const key = this.layer?.current()?.dataset.key
    const m = key?.match(/^(?:slot|del)-([123])$/)
    if (m) void this.remove(m[1] as SlotId)
    return true
  }
}

