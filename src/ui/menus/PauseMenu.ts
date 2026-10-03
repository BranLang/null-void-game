/**
 * Pause menu: resume, save / load, journal & codex, settings, quit to title.
 * Escape (or gamepad B) resumes.
 */
import { l, onLangChange, t, type L } from '../../i18n/i18n'
import type { MenuHost } from './MenuHost'
import { CodexScreen } from './CodexScreen'
import { Layer, confirmDialog, corners, divider, formatPlaytime, h, hints, syncRootSettings, toast } from './Reader'
import { SaveLoadMenu } from './SaveLoadMenu'
import { SettingsMenu } from './SettingsMenu'

const S = {
  title: l('Pauza', 'Paused'),
  resume: l('Pokračovať', 'Resume'),
  save: l('Uložiť hru', 'Save Game'),
  load: l('Načítať hru', 'Load Game'),
  journal: l('Denník a kódex', 'Journal & Codex'),
  settings: l('Nastavenia', 'Settings'),
  quit: l('Do hlavného menu', 'Quit to Title'),
  cantSave: l('Teraz sa nedá ukladať. Počkaj, kým sa scéna skončí.', 'You can’t save right now. Wait until the scene is over.'),
  chapter: l('Kapitola', 'Chapter'),
  objective: l('Aktuálny cieľ', 'Current objective'),
  noObjective: l('Žiadny aktuálny cieľ.', 'No current objective.'),
  playtime: l('Čas hrania', 'Playtime'),
  codex: l('Kódex', 'Codex'),
  quitTitle: l('Vrátiť sa do hlavného menu?', 'Return to the title screen?'),
  quitText: l('Postup od posledného uloženia sa stratí.', 'Any progress since your last save will be lost.'),
  quitYes: l('Odísť', 'Quit'),
  quitNo: l('Zostať', 'Stay'),
  hintResume: l('Pokračovať', 'Resume'),
  hintSelect: l('Vybrať', 'Select'),
}

type ItemId = 'resume' | 'save' | 'load' | 'journal' | 'settings' | 'quit'

export class PauseMenu {
  private layer: Layer | null = null
  private offLang: (() => void) | null = null
  private saveLoad: SaveLoadMenu | null = null
  private settingsMenu: SettingsMenu | null = null
  private codex: CodexScreen | null = null
  private lastKey: string | undefined

  constructor(private host: MenuHost) {}

  get isOpen(): boolean {
    return !!this.layer?.isOpen
  }

  open(): void {
    if (this.layer?.isOpen) return
    syncRootSettings(this.host.settings)
    const layer = new Layer({
      className: 'nvm-pause',
      ariaLabel: t(S.title),
      wrap: true,
      sfx: (id) => this.host.sfx(id),
      onBack: () => this.resume(),
      onResume: () => {
        this.render()
        this.layer?.refocus(this.lastKey, '[data-key="resume"]')
      },
      onClosed: () => {
        this.offLang?.()
        this.offLang = null
        this.layer = null
      },
    })
    this.layer = layer
    this.render()
    layer.open()
    this.offLang = onLangChange(() => {
      const key = this.layer?.current()?.dataset.key
      this.render()
      if (this.layer?.isTop) this.layer.refocus(key, '[data-key="resume"]')
    })
    layer.focusFirst('[data-key="resume"]')
  }

  close(): void {
    void this.layer?.close()
  }

  private resume(): void {
    if (!this.layer || this.layer.busy) return
    this.close()
    this.host.resume()
  }

  private render(): void {
    const layer = this.layer
    if (!layer) return
    const host = this.host
    layer.root.textContent = ''

    const canSave = host.canSave()
    const items: { id: ItemId; label: L; disabled?: boolean; tip?: L }[] = [
      { id: 'resume', label: S.resume },
      { id: 'save', label: S.save, disabled: !canSave, tip: canSave ? undefined : S.cantSave },
      { id: 'load', label: S.load },
      { id: 'journal', label: S.journal },
      { id: 'settings', label: S.settings },
      { id: 'quit', label: S.quit },
    ]
    const list = h('div', 'nvm-pause-list')
    for (const it of items) {
      const btn = h(
        'button',
        { class: 'nvm-mbtn', data: { nav: '', key: it.id }, attrs: it.disabled ? { 'aria-disabled': 'true' } : {} },
        h('span', 'nvm-mbtn-label', t(it.label)),
        it.tip ? h('span', { class: 'nvm-tip', attrs: { role: 'tooltip' } }, t(it.tip)) : null,
      )
      btn.addEventListener('click', () => this.activate(it.id))
      list.appendChild(btn)
    }
    const menu = corners(h('section', 'nvm-pause-menu nvm-glass nvm-rise', h('h1', 'nvm-h1 nvm-pause-title', t(S.title)), divider(), list))

    // ------------------------------------------------ info card
    const st = host.state
    const chapterDef = host.chapters.find((c) => c.id === st.chapterId)
    const known = new Set(host.codexEntries.map((e) => e.id))
    const unlocked = [...st.codex].filter((id) => known.has(id)).length
    const info = corners(
      h(
        'aside',
        'nvm-pause-info nvm-glass nvm-rise',
        h('div', 'nvm-kicker', t(S.chapter)),
        h('div', 'nvm-pause-chapter', st.chapterId ? t(host.chapterLabel(st.chapterId)) : '—'),
        chapterDef ? h('div', 'nvm-pause-subtitle', t(chapterDef.subtitle)) : null,
        divider('nvm-divider--left'),
        h('div', 'nvm-kicker', t(S.objective)),
        h('p', `nvm-pause-objective${st.objective ? '' : ' is-empty'}`, st.objective ? t(st.objective) : t(S.noObjective)),
        h(
          'div',
          'nvm-stats',
          h('div', 'nvm-stat', h('span', 'nvm-kicker', t(S.playtime)), h('span', 'nvm-stat-v', formatPlaytime(st.playtime, true))),
          h('div', 'nvm-stat', h('span', 'nvm-kicker', t(S.codex)), h('span', 'nvm-stat-v', `${unlocked} / ${known.size}`)),
        ),
        chapterDef?.epigraph
          ? h('blockquote', 'nvm-epigraph', h('p', null, t(chapterDef.epigraph.text)), h('cite', null, t(chapterDef.epigraph.source)))
          : null,
      ),
    )

    layer.root.append(
      h('div', 'nvm-pause-veil'),
      h('div', 'nvm-pause-wrap', menu, info),
      hints([
        ['Esc', S.hintResume],
        ['Enter', S.hintSelect],
      ]),
    )
  }

  private activate(id: ItemId): void {
    const host = this.host
    const layer = this.layer
    if (!layer || layer.busy) return
    this.lastKey = id
    switch (id) {
      case 'resume':
        this.resume()
        return
      case 'save':
        if (!host.canSave()) {
          toast(layer, t(S.cantSave), 'warn')
          return
        }
        ;(this.saveLoad ??= new SaveLoadMenu(host)).open('save')
        return
      case 'load':
        ;(this.saveLoad ??= new SaveLoadMenu(host)).open('load')
        return
      case 'journal':
        ;(this.codex ??= new CodexScreen(host)).open({ tab: 'journal' })
        return
      case 'settings':
        ;(this.settingsMenu ??= new SettingsMenu(host)).open()
        return
      case 'quit':
        void this.quit()
        return
    }
  }

  private async quit(): Promise<void> {
    const ok = await confirmDialog({ title: S.quitTitle, text: S.quitText, confirm: S.quitYes, cancel: S.quitNo, danger: true, sfx: (id) => this.host.sfx(id) })
    if (!ok || !this.layer) return
    this.layer.busy = true
    try {
      await this.host.quitToTitle()
    } finally {
      this.close()
    }
  }
}
