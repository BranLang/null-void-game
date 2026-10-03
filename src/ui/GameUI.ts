import { t, type L } from '../i18n/i18n'

/**
 * In-game DOM UI: dialogue box, HUD, barks & emotes, toasts, captions,
 * chapter cards, fades and letterbox. Pure presentation; the Director drives it.
 */
export interface Speaker {
  name: string
  color?: string
  /** image URL, or a canvas (rendered 3D portrait) */
  portrait?: string | HTMLCanvasElement | null
}

export interface DialogueOptions {
  textSpeed: number
  autoAdvance: boolean
  narration?: boolean
  thought?: boolean
  auto?: number
  onType?: () => void
  onTalk?: (talking: boolean) => void
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  parent?.appendChild(e)
  return e
}

/** *word* → <em>word</em>, escaping everything else. */
function richText(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/\*(.+?)\*/g, '<em>$1</em>')
}

export class DialogueBox {
  readonly root: HTMLDivElement
  private portrait: HTMLDivElement
  private speaker: HTMLDivElement
  private text: HTMLDivElement
  private choices: HTMLDivElement
  private advanceFn: (() => void) | null = null
  private keyHandler: ((e: KeyboardEvent) => void) | null = null
  /** set by the game to know whether dialogue is capturing input */
  active = false

  constructor(parent: HTMLElement) {
    this.root = el('div', 'nv-dialogue nv-panel', parent)
    this.portrait = el('div', 'nv-portrait hidden', this.root)
    const main = el('div', 'nv-dlg-main', this.root)
    this.speaker = el('div', 'nv-speaker', main)
    this.text = el('div', 'nv-text', main)
    this.choices = el('div', 'nv-choices', main)
    el('div', 'nv-next', this.root)
    this.root.addEventListener('click', () => this.advanceFn?.())
  }

  private setSpeaker(sp: Speaker | null): void {
    this.speaker.textContent = sp?.name ?? ''
    this.root.style.setProperty('--sc', sp?.color ?? 'var(--nv-gold)')
    this.portrait.innerHTML = ''
    if (sp?.portrait) {
      this.portrait.classList.remove('hidden')
      this.portrait.style.setProperty('--pc', sp.color ? `color-mix(in srgb, ${sp.color} 45%, #120e1c)` : '#4a3a6a')
      if (typeof sp.portrait === 'string') {
        const img = el('img', '', this.portrait)
        img.src = sp.portrait
        img.alt = sp.name
      } else {
        const c = sp.portrait
        const copy = el('canvas', '', this.portrait)
        copy.width = c.width
        copy.height = c.height
        copy.getContext('2d')?.drawImage(c, 0, 0)
      }
    } else this.portrait.classList.add('hidden')
  }

  /** Show a line with a typewriter effect; resolves when the player advances. */
  say(sp: Speaker | null, line: string, o: DialogueOptions): Promise<void> {
    this.active = true
    this.setSpeaker(sp)
    this.choices.innerHTML = ''
    this.text.className = 'nv-text' + (o.narration ? ' narration' : '') + (o.thought ? ' thought' : '')
    this.root.classList.add('show')
    this.root.classList.remove('done')
    const full = richText(line)
    const plain = line.replace(/\*/g, '')
    return new Promise((resolve) => {
      let shown = o.textSpeed <= 0 ? plain.length : 0
      let done = false
      let timer = 0
      let autoTimer = 0
      const finishTyping = () => {
        if (done) return
        done = true
        clearInterval(timer)
        this.text.innerHTML = full
        this.root.classList.add('done')
        o.onTalk?.(false)
        const autoMs = o.auto ?? (o.autoAdvance ? 1400 + plain.length * 35 : 0)
        if (autoMs > 0) autoTimer = window.setTimeout(close, autoMs)
      }
      const close = () => {
        clearTimeout(autoTimer)
        this.advanceFn = null
        this.unbindKeys()
        resolve()
      }
      this.advanceFn = () => {
        if (!done) finishTyping()
        else close()
      }
      this.bindKeys(['Space', 'Enter', 'KeyE', 'NumpadEnter'], () => this.advanceFn?.())
      if (shown >= plain.length) {
        finishTyping()
        return
      }
      o.onTalk?.(!o.narration && !o.thought)
      this.text.textContent = ''
      const interval = 1000 / Math.max(10, o.textSpeed)
      timer = window.setInterval(() => {
        shown = Math.min(plain.length, shown + 1)
        this.text.textContent = plain.slice(0, shown)
        if (shown % 3 === 0) o.onType?.()
        if (shown >= plain.length) finishTyping()
      }, interval)
    })
  }

  choose(sp: Speaker | null, prompt: string | null, options: { id: string; text: string }[], onMove?: () => void): Promise<string> {
    this.active = true
    this.setSpeaker(sp)
    this.root.classList.add('show', 'done')
    this.text.className = 'nv-text'
    this.text.innerHTML = prompt ? richText(prompt) : ''
    this.choices.innerHTML = ''
    return new Promise((resolve) => {
      let focus = 0
      const buttons = options.map((o, i) => {
        const b = el('button', 'nv-choice interactive', this.choices)
        b.dataset.n = String(i + 1)
        b.textContent = o.text
        b.addEventListener('click', (e) => {
          e.stopPropagation()
          pick(i)
        })
        b.addEventListener('mouseenter', () => setFocus(i))
        return b
      })
      const setFocus = (i: number) => {
        focus = (i + buttons.length) % buttons.length
        buttons.forEach((b, j) => b.classList.toggle('focus', j === focus))
        onMove?.()
      }
      const pick = (i: number) => {
        this.unbindKeys()
        this.advanceFn = null
        this.choices.innerHTML = ''
        resolve(options[i].id)
      }
      setFocus(0)
      this.advanceFn = null
      this.keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') setFocus(focus + 1)
        else if (e.code === 'ArrowUp' || e.code === 'KeyW') setFocus(focus - 1)
        else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') pick(focus)
        else if (/^Digit[1-9]$/.test(e.code)) {
          const n = Number(e.code.slice(5)) - 1
          if (n < buttons.length) pick(n)
        }
      }
      window.addEventListener('keydown', this.keyHandler)
    })
  }

  private bindKeys(codes: string[], fn: () => void): void {
    this.unbindKeys()
    this.keyHandler = (e: KeyboardEvent) => {
      if (codes.includes(e.code) && !e.repeat) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', this.keyHandler)
  }

  private unbindKeys(): void {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler)
    this.keyHandler = null
  }

  hide(): void {
    this.active = false
    this.root.classList.remove('show')
    this.unbindKeys()
    this.advanceFn = null
  }
}

interface Floating {
  el: HTMLDivElement
  anchor: () => { x: number; y: number; visible: boolean } | null
  until: number
}

export interface AbilitySlot {
  id: string
  icon: string
  key: string
  color: string
}

export class GameUI {
  readonly root: HTMLDivElement
  readonly dialogue: DialogueBox
  private objectiveEl: HTMLDivElement
  private objectiveText: HTMLSpanElement
  private locationEl: HTMLDivElement
  private toastsEl: HTMLDivElement
  private captionEl: HTMLDivElement
  private fadeEl: HTMLDivElement
  private flashEl: HTMLDivElement
  private promptEl: HTMLDivElement
  private hintEl: HTMLDivElement
  private abilitiesEl: HTMLDivElement
  private meters: { strain: HTMLElement; veil: HTMLElement; veilWrap: HTMLElement; strainWrap: HTMLElement }
  private castEl: HTMLDivElement
  private saiEl: HTMLDivElement
  private saiCanvas: HTMLCanvasElement
  private detectEl: HTMLDivElement
  private detectCanvas: HTMLCanvasElement
  private letterbox: HTMLDivElement[]
  private floating: Floating[] = []
  private locTimer = 0
  private hudVisible = true

  constructor(parent: HTMLElement) {
    this.root = el('div', '', parent)
    this.root.id = 'ui'
    this.letterbox = [el('div', 'nv-letterbox top', document.body), el('div', 'nv-letterbox bottom', document.body)]
    const top = el('div', 'nv-hud-top', this.root)
    this.saiEl = el('div', 'nv-sai', top)
    this.saiCanvas = el('canvas', '', this.saiEl)
    this.saiCanvas.width = this.saiCanvas.height = 148
    this.saiCanvas.style.width = this.saiCanvas.style.height = '74px'
    el('div', 'lbl', this.saiEl)
    this.saiEl.style.display = 'none'
    this.objectiveEl = el('div', 'nv-objective hidden', top)
    const lbl = el('span', 'lbl', this.objectiveEl)
    lbl.dataset.k = 'objective'
    this.objectiveText = el('span', '', this.objectiveEl)
    this.locationEl = el('div', 'nv-location', this.root)
    el('div', 'name', this.locationEl)
    el('div', 'rule', this.locationEl)
    this.toastsEl = el('div', 'nv-toasts', this.root)
    this.captionEl = el('div', 'nv-caption', this.root)
    this.promptEl = el('div', 'nv-prompt', this.root)
    this.hintEl = el('div', 'nv-hint', this.root)
    this.abilitiesEl = el('div', 'nv-abilities', this.root)
    const meters = el('div', 'nv-meters', this.abilitiesEl)
    const mk = (label: string, color: string) => {
      const wrap = el('div', '', meters)
      const l2 = el('div', 'nv-meter-label', wrap)
      l2.textContent = label
      const m = el('div', 'nv-meter', wrap)
      m.style.setProperty('--mc', color)
      const fill = el('i', '', m)
      fill.style.transform = 'scaleX(0)'
      return { wrap, fill }
    }
    const veil = mk('', '#b77dff')
    const strain = mk('', '#cfe8ff')
    this.meters = { veil: veil.fill, veilWrap: veil.wrap, strain: strain.fill, strainWrap: strain.wrap }
    this.castEl = el('div', 'nv-cast', this.root)
    this.detectEl = el('div', 'nv-detect', this.root)
    this.detectCanvas = el('canvas', '', this.detectEl)
    this.detectCanvas.width = 120
    this.detectCanvas.height = 68
    this.detectCanvas.style.width = '60px'
    this.detectCanvas.style.height = '34px'
    this.dialogue = new DialogueBox(this.root)
    this.fadeEl = el('div', 'nv-fade', document.body)
    this.flashEl = el('div', 'nv-flash', document.body)
    this.setAbilities([])
  }

  setLabels(objective: string, veil: string, strain: string): void {
    const lbl = this.objectiveEl.querySelector('.lbl')
    if (lbl) lbl.textContent = objective
    const v = this.meters.veilWrap.querySelector('.nv-meter-label')
    if (v) v.textContent = veil
    const s = this.meters.strainWrap.querySelector('.nv-meter-label')
    if (s) s.textContent = strain
  }

  setHudVisible(v: boolean): void {
    this.hudVisible = v
    for (const e of [this.objectiveEl.parentElement!, this.abilitiesEl, this.toastsEl]) e.style.opacity = v ? '1' : '0'
    for (const e of [this.objectiveEl.parentElement!, this.abilitiesEl, this.toastsEl]) e.style.transition = 'opacity 0.4s'
  }

  get isHudVisible(): boolean {
    return this.hudVisible
  }

  // ------------------------------------------------------------ objective & location
  setObjective(text: string | null, pulse = true): void {
    if (!text) {
      this.objectiveEl.classList.add('hidden')
      return
    }
    this.objectiveText.textContent = text
    this.objectiveEl.classList.remove('hidden')
    if (pulse) {
      this.objectiveEl.classList.remove('pulse')
      void this.objectiveEl.offsetWidth
      this.objectiveEl.classList.add('pulse')
    }
  }

  showLocation(name: string): void {
    const n = this.locationEl.querySelector('.name')
    if (n) n.textContent = name
    this.locationEl.classList.add('show')
    clearTimeout(this.locTimer)
    this.locTimer = window.setTimeout(() => this.locationEl.classList.remove('show'), 3200)
  }

  // ------------------------------------------------------------ abilities & meters
  setAbilities(slots: AbilitySlot[]): void {
    this.abilitiesEl.querySelectorAll('.nv-ability').forEach((e) => e.remove())
    const meters = this.abilitiesEl.querySelector('.nv-meters')!
    for (const s of slots) {
      const a = el('div', 'nv-ability')
      a.dataset.id = s.id
      a.style.setProperty('--ac', s.color)
      a.innerHTML = s.icon
      const k = el('span', 'key', a)
      k.textContent = s.key
      this.abilitiesEl.insertBefore(a, meters)
    }
    ;(meters as HTMLElement).style.display = slots.length ? 'flex' : 'none'
  }

  setAbilityActive(id: string, on: boolean): void {
    this.abilitiesEl.querySelector(`[data-id="${id}"]`)?.classList.toggle('active', on)
  }

  setMeters(strain: number, veil: number | null): void {
    this.meters.strain.style.transform = `scaleX(${Math.max(0, Math.min(1, strain))})`
    this.meters.strainWrap.style.display = strain > 0.01 ? 'block' : 'none'
    if (veil === null) this.meters.veilWrap.style.display = 'none'
    else {
      this.meters.veilWrap.style.display = 'block'
      this.meters.veil.style.transform = `scaleX(${Math.max(0, Math.min(1, veil))})`
    }
  }

  /** Haiku lines shown while casting (romaji + translation). */
  showCast(lines: string[], jp: string, color: string): void {
    this.castEl.style.setProperty('--cc', color)
    this.castEl.innerHTML = lines.map((x) => richText(x)).join('<br>') + `<span class="jp">${richText(jp)}</span>`
    this.castEl.classList.add('show')
  }

  hideCast(): void {
    this.castEl.classList.remove('show')
  }

  // ------------------------------------------------------------ Sai clock widget
  /** phase01: 0..1 position of Sai (0 = overhead = light hour). */
  setSai(visible: boolean, phase01 = 0, label = '', kind: 'light' | 'heavy' | 'neutral' = 'neutral'): void {
    this.saiEl.style.display = visible ? 'block' : 'none'
    if (!visible) return
    this.saiEl.className = `nv-sai ${kind}`
    const lbl = this.saiEl.querySelector('.lbl')
    if (lbl) lbl.textContent = label
    const c = this.saiCanvas.getContext('2d')!
    const w = this.saiCanvas.width
    c.clearRect(0, 0, w, w)
    const cx = w / 2
    c.strokeStyle = 'rgba(214,178,106,0.5)'
    c.lineWidth = 2
    c.beginPath()
    c.ellipse(cx, cx, w * 0.42, w * 0.3, 0, 0, Math.PI * 2)
    c.stroke()
    // light / heavy arcs
    c.lineWidth = 6
    c.strokeStyle = 'rgba(255,215,138,0.35)'
    c.beginPath()
    c.ellipse(cx, cx, w * 0.42, w * 0.3, 0, -Math.PI * 0.75, -Math.PI * 0.25)
    c.stroke()
    c.strokeStyle = 'rgba(154,166,255,0.35)'
    c.beginPath()
    c.ellipse(cx, cx, w * 0.42, w * 0.3, 0, Math.PI * 0.25, Math.PI * 0.75)
    c.stroke()
    // planet
    const g = c.createRadialGradient(cx - 6, cx - 6, 2, cx, cx, 20)
    g.addColorStop(0, '#d8e4ff')
    g.addColorStop(1, '#4a5a8a')
    c.fillStyle = g
    c.beginPath()
    c.arc(cx, cx, 17, 0, Math.PI * 2)
    c.fill()
    // Sai
    const a = -Math.PI / 2 + phase01 * Math.PI * 2
    const sx = cx + Math.cos(a) * w * 0.42
    const sy = cx + Math.sin(a) * w * 0.3
    c.fillStyle = '#f0a050'
    c.shadowColor = '#ffb060'
    c.shadowBlur = 12
    c.beginPath()
    c.arc(sx, sy, 11, 0, Math.PI * 2)
    c.fill()
    c.shadowBlur = 0
    c.strokeStyle = 'rgba(255,230,200,0.7)'
    c.lineWidth = 2
    c.beginPath()
    c.ellipse(sx, sy, 18, 5, -0.2, 0, Math.PI * 2)
    c.stroke()
  }

  // ------------------------------------------------------------ stealth detection eye
  setDetection(level: number): void {
    this.detectEl.classList.toggle('show', level > 0.01)
    if (level <= 0.01) return
    const c = this.detectCanvas.getContext('2d')!
    const w = this.detectCanvas.width
    const h = this.detectCanvas.height
    c.clearRect(0, 0, w, h)
    c.lineWidth = 4
    c.strokeStyle = level >= 1 ? '#ff5a6a' : '#f3d995'
    c.fillStyle = level >= 1 ? 'rgba(255,90,106,0.35)' : 'rgba(243,217,149,0.25)'
    c.beginPath()
    c.moveTo(6, h / 2)
    c.quadraticCurveTo(w / 2, -h * 0.25, w - 6, h / 2)
    c.quadraticCurveTo(w / 2, h * 1.25, 6, h / 2)
    c.fill()
    c.stroke()
    c.save()
    c.beginPath()
    c.rect(0, h * (1 - level), w, h * level)
    c.clip()
    c.fillStyle = level >= 1 ? '#ff5a6a' : '#f3d995'
    c.beginPath()
    c.arc(w / 2, h / 2, h * 0.28, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  // ------------------------------------------------------------ prompt
  showPrompt(x: number, y: number, key: string, label: string): void {
    this.promptEl.innerHTML = `<span class="nv-key">${key}</span><span>${label}</span>`
    this.promptEl.style.left = `${x}px`
    this.promptEl.style.top = `${y}px`
    this.promptEl.classList.add('show')
  }

  hidePrompt(): void {
    this.promptEl.classList.remove('show')
  }

  hint(text: string | null): void {
    if (!text) {
      this.hintEl.classList.remove('show')
      return
    }
    this.hintEl.textContent = text
    this.hintEl.classList.add('show')
  }

  // ------------------------------------------------------------ barks, emotes, toasts
  bark(text: string, anchor: Floating['anchor'], ms = 2600): void {
    const b = el('div', 'nv-bark', this.root)
    b.textContent = text
    this.floating.push({ el: b, anchor, until: performance.now() + ms })
  }

  emote(icon: string, anchor: Floating['anchor'], ms = 1600): void {
    const b = el('div', 'nv-emote', this.root)
    b.textContent = icon
    this.floating.push({ el: b, anchor, until: performance.now() + ms })
  }

  toast(text: string, ms = 3600): void {
    const tEl = el('div', 'nv-toast', this.toastsEl)
    tEl.textContent = text
    setTimeout(() => {
      tEl.style.opacity = '0'
      setTimeout(() => tEl.remove(), 600)
    }, ms)
  }

  updateFloating(): void {
    const now = performance.now()
    this.floating = this.floating.filter((f) => {
      const p = f.anchor()
      if (now > f.until || !p) {
        f.el.style.transition = 'opacity 0.3s'
        f.el.style.opacity = '0'
        setTimeout(() => f.el.remove(), 320)
        return false
      }
      f.el.style.left = `${p.x}px`
      f.el.style.top = `${p.y}px`
      f.el.style.display = p.visible ? '' : 'none'
      return true
    })
  }

  // ------------------------------------------------------------ captions, cards, fades
  async caption(main: string, sub: string | null, ms: number): Promise<void> {
    this.captionEl.innerHTML = `<div class="main">${richText(main)}</div>${sub ? `<div class="sub">${richText(sub)}</div>` : ''}`
    this.captionEl.classList.add('show')
    await new Promise((r) => setTimeout(r, ms))
    this.captionEl.classList.remove('show')
    await new Promise((r) => setTimeout(r, 800))
  }

  chapterCard(num: string, title: string, epigraph: string | null, source: string | null, skipLabel: string, ms = 6500): Promise<void> {
    const card = el('div', 'nv-card', document.body)
    card.innerHTML = `<div class="num">${richText(num)}</div><div class="title">${richText(title)}</div><div class="rule"></div>${
      epigraph ? `<div class="epi">${richText(epigraph)}</div>` : ''
    }${source ? `<div class="src">— ${richText(source)}</div>` : ''}<div class="skip">${skipLabel}</div>`
    requestAnimationFrame(() => card.classList.add('show'))
    return new Promise((resolve) => {
      let closed = false
      const close = () => {
        if (closed) return
        closed = true
        window.removeEventListener('keydown', onKey)
        card.classList.remove('show')
        setTimeout(() => {
          card.remove()
          resolve()
        }, 1000)
      }
      const onKey = (e: KeyboardEvent) => {
        if (['Space', 'Enter', 'Escape', 'KeyE'].includes(e.code)) close()
      }
      setTimeout(() => {
        window.addEventListener('keydown', onKey)
        card.addEventListener('click', close)
      }, 900)
      setTimeout(close, ms)
    })
  }

  fade(to: 'black' | 'white' | 'clear', ms: number): Promise<void> {
    this.fadeEl.style.transitionDuration = `${ms}ms`
    if (to !== 'clear') this.fadeEl.style.background = to === 'white' ? '#f4f2ff' : '#000'
    requestAnimationFrame(() => (this.fadeEl.style.opacity = to === 'clear' ? '0' : '1'))
    return new Promise((r) => setTimeout(r, ms + 30))
  }

  setFadeInstant(opacity: number): void {
    this.fadeEl.style.transitionDuration = '0ms'
    this.fadeEl.style.opacity = String(opacity)
  }

  flash(color: string, ms: number): void {
    this.flashEl.style.transition = 'none'
    this.flashEl.style.background = `radial-gradient(circle, ${color}, transparent 75%)`
    this.flashEl.style.opacity = '0.85'
    requestAnimationFrame(() => {
      this.flashEl.style.transition = `opacity ${ms}ms ease-out`
      this.flashEl.style.opacity = '0'
    })
  }

  setLetterbox(on: boolean): void {
    for (const l of this.letterbox) l.classList.toggle('on', on)
  }
}

export function tl(s: L): string {
  return t(s)
}
