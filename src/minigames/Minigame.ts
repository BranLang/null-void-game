/**
 * Minigame framework. Every minigame is a full-screen DOM/canvas overlay that
 * resolves with a MinigameResult. Minigames register themselves with
 * registerMinigame() and are started from scripts with g.minigame(id, params).
 */
import type { MinigameId, MinigameParams, MinigameResult } from '../game/GameAPI'
import { t as translate, getLang, type L, type Lang } from '../i18n/i18n'

export type SfxId = 'click' | 'success' | 'fail' | 'glyph' | 'water' | 'ice' | 'tick' | 'whoosh' | 'heartbeat' | 'crack' | 'chime' | 'fire' | 'page'

export interface MinigameContext {
  /** Full-screen overlay element (class .nv-mg) already attached to the DOM. Put your UI inside. */
  root: HTMLElement
  t: (s: L | string, vars?: Record<string, string | number>) => string
  lang: Lang
  sfx: (id: SfxId) => void
  /** Assist options from the settings menu */
  assist: {
    /** show a "skip" button after the first failure (accessibility) */
    skipAllowed: boolean
    /** timers run 50% slower */
    slowTimers: boolean
    reducedMotion: boolean
  }
  /** Registers a keyboard listener that is removed automatically when the minigame ends. */
  onKey(fn: (e: KeyboardEvent) => void): void
  /** requestAnimationFrame loop helper, stopped automatically at the end. dt in seconds. */
  loop(fn: (dt: number, time: number) => void): void
}

export interface Minigame {
  run(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult>
}

const registry = new Map<MinigameId, () => Minigame>()

export function registerMinigame(id: MinigameId, factory: () => Minigame): void {
  registry.set(id, factory)
}

export function hasMinigame(id: MinigameId): boolean {
  return registry.has(id)
}

export interface RunOptions {
  sfx: (id: SfxId) => void
  assist: MinigameContext['assist']
}

/** Start a minigame overlay; cleans up DOM, listeners and loops when it resolves. */
export async function runMinigame(id: MinigameId, params: MinigameParams, opts: RunOptions): Promise<MinigameResult> {
  // automated playtests (window.__autoMinigame) skip straight to a success
  if ((window as unknown as { __autoMinigame?: boolean }).__autoMinigame) return { success: true, score: 1, data: { auto: true } }
  const factory = registry.get(id)
  if (!factory) {
    console.warn(`[minigame] '${id}' is not registered; auto-succeeding`)
    return { success: true, score: 1 }
  }
  const root = document.createElement('div')
  root.className = 'nv-mg'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  document.body.appendChild(root)
  const keyFns: ((e: KeyboardEvent) => void)[] = []
  let running = true
  const onKey = (e: KeyboardEvent) => {
    for (const fn of keyFns) fn(e)
  }
  window.addEventListener('keydown', onKey)
  const ctx: MinigameContext = {
    root,
    t: translate,
    lang: getLang(),
    sfx: opts.sfx,
    assist: opts.assist,
    onKey: (fn) => keyFns.push(fn),
    loop: (fn) => {
      let last = performance.now()
      const step = (now: number) => {
        if (!running) return
        const dt = Math.min(0.05, (now - last) / 1000) * (opts.assist.slowTimers ? 0.5 : 1)
        last = now
        fn(dt, now / 1000)
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    },
  }
  try {
    return await factory().run(params, ctx)
  } finally {
    running = false
    window.removeEventListener('keydown', onKey)
    root.style.transition = 'opacity 0.3s'
    root.style.opacity = '0'
    setTimeout(() => root.remove(), 320)
  }
}

// ---------------------------------------------------------------------------
// Shared UI helpers so every minigame looks the same
// ---------------------------------------------------------------------------

export interface Card {
  card: HTMLDivElement
  body: HTMLDivElement
  hint: HTMLDivElement
  buttons: HTMLDivElement
}

/** Standard card: title, italic subtitle (usually a line from the novel), body, hint line, button row. */
export function createCard(ctx: MinigameContext, title: L, subtitle?: L): Card {
  const card = document.createElement('div')
  card.className = 'nv-panel nv-mg-card'
  const h = document.createElement('div')
  h.className = 'nv-mg-title'
  h.textContent = ctx.t(title)
  card.appendChild(h)
  if (subtitle) {
    const s = document.createElement('div')
    s.className = 'nv-mg-sub'
    s.textContent = ctx.t(subtitle)
    card.appendChild(s)
  }
  const body = document.createElement('div')
  body.style.position = 'relative'
  card.appendChild(body)
  const hint = document.createElement('div')
  hint.className = 'nv-mg-hint'
  card.appendChild(hint)
  const buttons = document.createElement('div')
  buttons.className = 'nv-mg-row'
  card.appendChild(buttons)
  ctx.root.appendChild(card)
  return { card, body, hint, buttons }
}

export function button(label: string, onClick: () => void, primary = false): HTMLButtonElement {
  const b = document.createElement('button')
  b.className = 'nv-btn' + (primary ? ' primary' : '')
  b.textContent = label
  b.addEventListener('click', onClick)
  return b
}

/** HiDPI canvas of CSS size w x h. */
export function hiDpiCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  const r = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.round(w * r)
  canvas.height = Math.round(h * r)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')!
  ctx.scale(r, r)
  return { canvas, ctx }
}

export const UI_STRINGS = {
  skip: { sk: 'Preskočiť', en: 'Skip' },
  retry: { sk: 'Skúsiť znova', en: 'Try again' },
  done: { sk: 'Hotovo', en: 'Done' },
  continue: { sk: 'Pokračovať', en: 'Continue' },
  failed: { sk: 'Nepodarilo sa.', en: 'It did not work.' },
} satisfies Record<string, L>
