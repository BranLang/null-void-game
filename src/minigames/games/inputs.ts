/**
 * INPUTS: fighting for single inputs. Trapped inside your own body (Tami
 * possessed by Samael), or pushing a foreign soul out: under a dark, drowned
 * surface a key sign flickers up for a moment. Press it in time (or click it)
 * to win a heartbeat; a wrong or late answer lets the voice speak and drains
 * your will.
 *
 * params: {
 *   need?: number        heartbeats to win (default 5)
 *   misses?: number      misses allowed before failing (default 3)
 *   window?: number      ms a sign stays (default 1100; shrinks a little as you win)
 *   voice?: L[]          lines the voice says on a miss
 *   title?: L, subtitle?: L
 *   color?: string       glow colour of the signs (hex, default warm copper)
 *   allowFail?: boolean  on failure also offer "Continue", resolving { success: false }
 * }
 * result: { success, score: hits / (hits + misses), data: { hits, misses } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import { l, type L } from '../../i18n/i18n'

type RGB = readonly [number, number, number]

const W = 760
const H = 440

const TEXT = {
  title: l('Boj o každý pohyb', 'Fighting for Every Movement'),
  subtitle: l('Telo je ďaleko, ako pod hladinou. Každý pohyb treba vybojovať.', 'The body is far away, as if under water. Every movement has to be fought for.'),
  hint: l(
    'Keď sa rozžiari znak, stlač tú klávesu (W, A, S, D, E alebo medzerník), alebo naň klikni.',
    'When a sign flares up, press that key (W, A, S, D, E or Space), or click it.',
  ),
  space: l('MEDZERNÍK', 'SPACE'),
  will: l('Vôľa', 'Will'),
  done: l('Vybojované. Srdce bije po tvojom.', 'Won back. The heart beats to your rhythm.'),
  fail: l('Hlas ťa stiahol späť pod hladinu.', 'The voice pulls you back beneath the surface.'),
}

const DEFAULT_VOICE: L[] = [
  l('Spi.', 'Sleep.'),
  l('Nebráň sa.', "Don't fight it."),
  l('Už nie si tu.', 'You are not here anymore.'),
  l('Pusť to.', 'Let go.'),
  l('Toto telo je moje.', 'This body is mine.'),
]

const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'Space'] as const
type KeyCode = (typeof KEYS)[number]
const LABEL: Record<KeyCode, string> = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyE: 'E', Space: '' }

const HEART: RGB = [255, 96, 120]
const VOICE: RGB = [190, 90, 255]
const WATER: RGB = [90, 200, 210]

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const rgba = (c: RGB, a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

function isL(v: unknown): v is L {
  return typeof v === 'object' && v !== null && typeof (v as L).sk === 'string' && typeof (v as L).en === 'string'
}

function parseColor(v: unknown, fallback: RGB): RGB {
  if (typeof v !== 'string') return fallback
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim())
  if (!m) return fallback
  let hex = m[1]
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c)
  const n = parseInt(hex, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const glowCache = new Map<string, HTMLCanvasElement>()
function glowSprite(c: RGB): HTMLCanvasElement {
  const key = c.join(',')
  const hit = glowCache.get(key)
  if (hit) return hit
  const s = document.createElement('canvas')
  s.width = s.height = 128
  const g = s.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, rgba(c, 1))
  grd.addColorStop(0.18, rgba(c, 0.6))
  grd.addColorStop(0.45, rgba(c, 0.18))
  grd.addColorStop(1, rgba(c, 0))
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  glowCache.set(key, s)
  return s
}

function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number): void {
  if (a <= 0.003 || r <= 0) return
  const op = g.globalCompositeOperation
  const pa = g.globalAlpha
  g.globalCompositeOperation = 'lighter'
  g.globalAlpha = Math.min(1, a)
  g.drawImage(glowSprite(c), x - r, y - r, r * 2, r * 2)
  g.globalAlpha = pa
  g.globalCompositeOperation = op
}

/** Keeps the canvas inside small windows (CSS scale only; drawing stays in W x H units). */
function makeFitter(canvas: HTMLCanvasElement, card: HTMLElement, w: number, h: number): (force?: boolean) => void {
  let lw = -1
  let lh = -1
  let last = 0
  return (force = false) => {
    const iw = window.innerWidth
    const ih = window.innerHeight
    const now = performance.now()
    if (!force && iw === lw && ih === lh && now - last < 500) return
    lw = iw
    lh = ih
    last = now
    const other = card.scrollHeight - canvas.getBoundingClientRect().height
    const s = Math.max(0.3, Math.min(1, (Math.min(iw * 0.94, 960) - 56) / w, (ih * 0.92 - other - 8) / h))
    const cw = `${Math.round(w * s)}px`
    const ch = `${Math.round(h * s)}px`
    if (canvas.style.width !== cw) canvas.style.width = cw
    if (canvas.style.height !== ch) canvas.style.height = ch
  }
}

function heartPath(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.beginPath()
  g.moveTo(x, y + s * 0.85)
  g.bezierCurveTo(x - s * 1.25, y + s * 0.05, x - s * 0.75, y - s * 0.95, x, y - s * 0.38)
  g.bezierCurveTo(x + s * 0.75, y - s * 0.95, x + s * 1.25, y + s * 0.05, x, y + s * 0.85)
  g.closePath()
}

interface Prompt {
  key: KeyCode
  x: number
  y: number
  t: number
  window: number
  done: 'hit' | 'miss' | null
  doneT: number
}

interface Mote {
  x: number
  y: number
  s: number
  p: number
}

function runInputs(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const need = typeof params.need === 'number' && params.need >= 1 ? Math.round(params.need) : 5
  const maxMiss = typeof params.misses === 'number' && params.misses >= 1 ? Math.round(params.misses) : 3
  const baseWindow = (typeof params.window === 'number' && params.window >= 200 ? params.window : 1100) / 1000
  const customVoice = Array.isArray(params.voice) ? params.voice.filter(isL) : []
  const voices = customVoice.length ? customVoice : DEFAULT_VOICE
  const title = isL(params.title) ? params.title : TEXT.title
  const subtitle = isL(params.subtitle) ? params.subtitle : TEXT.subtitle
  const color = parseColor(params.color, [255, 178, 122])
  const rm = ctx.assist.reducedMotion
  const allowFail = params.allowFail === true

  return new Promise<MinigameResult>((resolve) => {
    const card = createCard(ctx, title, subtitle)
    card.hint.textContent = ctx.t(TEXT.hint)
    card.buttons.style.minHeight = '44px'
    const { canvas, ctx: g } = hiDpiCanvas(W, H)
    const dpr = canvas.width / W
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'pointer'
    card.body.appendChild(canvas)
    const fit = makeFitter(canvas, card.card, W, H)

    // state
    let hits = 0
    let missCount = 0
    let phase: 'intro' | 'wait' | 'prompt' | 'won' | 'lost' = 'intro'
    let timer = 1.4
    let prompt: Prompt | null = null
    let lastKey: KeyCode | null = null
    let voice: { text: string; t: number } | null = null
    let whisper: { text: string; t: number; x: number; y: number } | null = null
    let heartPulse = 0
    let dark = 0.3
    let light = 0
    let shake = 0
    let endT = 0
    let voiceIdx = Math.floor(Math.random() * voices.length)
    let lid = 0.6
    let blink = 0
    const ripples: { x: number; y: number; t: number; c: RGB; big: boolean }[] = []
    const sparks: { x: number; y: number; vx: number; vy: number; life: number; max: number; c: RGB }[] = []
    const motes: Mote[] = Array.from({ length: rm ? 14 : 44 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.4 + Math.random() * 1.4, p: Math.random() * 10 }))
    const lostOrbs: number[] = []

    const finish = (r: MinigameResult) => resolve(r)

    const nextVoice = (): string => {
      voiceIdx = (voiceIdx + 1 + Math.floor(Math.random() * Math.max(1, voices.length - 1))) % voices.length
      return ctx.t(voices[voiceIdx])
    }

    function spawnPrompt(): void {
      let key: KeyCode
      do key = KEYS[Math.floor(Math.random() * KEYS.length)]
      while (key === lastKey)
      lastKey = key
      // somewhere in a ring around the centre, never right under the voice line
      const a = Math.random() * Math.PI * 2
      const rx = 150 + Math.random() * 170
      const ry = 70 + Math.random() * 70
      const x = Math.max(110, Math.min(W - 110, W / 2 + Math.cos(a) * rx))
      const y = Math.max(80, Math.min(H - 90, H / 2 - 10 + Math.sin(a) * ry))
      prompt = { key, x, y, t: 0, window: baseWindow * Math.max(0.75, 1 - hits * 0.04), done: null, doneT: 0 }
      ripples.push({ x, y, t: 0, c: color, big: false })
      phase = 'prompt'
      ctx.sfx('tick')
    }

    function burst(x: number, y: number, c: RGB, n: number, sp: number): void {
      for (let i = 0; i < (rm ? Math.ceil(n / 3) : n); i++) {
        const a = Math.random() * Math.PI * 2
        const v = sp * (0.3 + Math.random())
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + Math.random() * 0.6, c })
      }
    }

    function resolvePrompt(ok: boolean): void {
      if (!prompt || prompt.done) return
      prompt.done = ok ? 'hit' : 'miss'
      prompt.doneT = 0
      if (ok) {
        hits++
        heartPulse = 1
        light = 1
        ripples.push({ x: prompt.x, y: prompt.y, t: 0, c: color, big: true })
        burst(prompt.x, prompt.y, color, 28, 220)
        ctx.sfx('heartbeat')
      } else {
        missCount++
        lostOrbs.push(0)
        voice = { text: nextVoice(), t: 0 }
        dark = 1
        if (!rm) shake = 0.4
        burst(prompt.x, prompt.y, VOICE, 18, 120)
        blink = 1
        ctx.sfx('fail')
      }
      if (hits >= need) win()
      else if (missCount >= maxMiss) lose()
      else {
        phase = 'wait'
        timer = 0.75 + Math.random() * 0.75 + (ok ? 0 : 0.5)
      }
    }

    function win(): void {
      phase = 'won'
      endT = 0
      ctx.sfx('success')
      card.hint.textContent = ctx.t(TEXT.done)
      card.hint.style.color = 'var(--nv-gold-bright)'
      card.buttons.replaceChildren()
      const score = Math.round((hits / (hits + missCount)) * 100) / 100
      card.buttons.appendChild(button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { hits, misses: missCount } }), true))
      fit(true)
    }

    function lose(): void {
      phase = 'lost'
      endT = 0
      card.hint.textContent = ctx.t(TEXT.fail)
      card.hint.style.color = 'var(--nv-danger)'
      card.buttons.replaceChildren()
      card.buttons.appendChild(button(ctx.t(UI_STRINGS.retry), restart, true))
      if (ctx.assist.skipAllowed) card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      if (allowFail) card.buttons.appendChild(button(ctx.t(UI_STRINGS.continue), () => finish({ success: false, score: Math.round((hits / (hits + missCount)) * 100) / 100, data: { hits, misses: missCount } })))
      fit(true)
    }

    function restart(): void {
      hits = 0
      missCount = 0
      lostOrbs.length = 0
      prompt = null
      voice = null
      phase = 'intro'
      timer = 1.2
      card.hint.textContent = ctx.t(TEXT.hint)
      card.hint.style.color = ''
      card.buttons.replaceChildren()
      ;(document.activeElement as HTMLElement | null)?.blur?.()
      fit(true)
    }

    // ------------------------------------------------------------------ input
    const toLocal = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]
    }
    const hitTest = (p: Prompt, x: number, y: number, pad: number): boolean =>
      p.key === 'Space' ? Math.abs(x - p.x) < 82 + pad && Math.abs(y - p.y) < 30 + pad : Math.hypot(x - p.x, y - p.y) < 46 + pad
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      if (phase !== 'prompt' || !prompt || prompt.done) return
      const [x, y] = toLocal(e)
      if (hitTest(prompt, x, y, e.pointerType === 'touch' ? 22 : 10)) resolvePrompt(true)
      else ripples.push({ x, y, t: 0, c: WATER, big: false })
    })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    ctx.onKey((e) => {
      const code = e.code as KeyCode
      const isGameKey = (KEYS as readonly string[]).includes(e.code)
      if (isGameKey || e.code === 'Enter') e.preventDefault()
      if ((phase === 'won' || phase === 'lost') && endT > 0.6 && !e.repeat && (e.code === 'Enter' || e.code === 'Space')) {
        card.buttons.querySelector('button')?.click()
        return
      }
      if (!isGameKey || e.repeat) return
      if (phase !== 'prompt' || !prompt || prompt.done) return
      resolvePrompt(code === prompt.key)
    })

    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__nvInputs = {
        prompt: () => (prompt && !prompt.done ? { key: prompt.key, x: prompt.x, y: prompt.y } : null),
        state: () => ({ phase, hits, missCount }),
      }
    }

    // ------------------------------------------------------------------ drawing
    function drawBackdrop(time: number): void {
      const rise = hits / need
      const bg = g.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, `rgb(${10 + rise * 18},${34 + rise * 30},${44 + rise * 30})`)
      bg.addColorStop(0.6, '#04121a')
      bg.addColorStop(1, '#020609')
      g.fillStyle = bg
      g.fillRect(-20, -20, W + 40, H + 40)
      g.save()
      g.globalCompositeOperation = 'lighter'
      // soft god rays from the surface far above (stretched glow sprites, slightly slanted)
      const sprite = glowSprite(WATER)
      for (let i = 0; i < 6; i++) {
        const sway = Math.sin(time * 0.3 + i * 1.7) * 30
        const x = 70 + i * 125 + sway
        const w = 46 + (i % 3) * 26
        g.save()
        g.translate(x, -10)
        g.rotate(-0.12 + Math.sin(time * 0.2 + i) * 0.04)
        g.globalAlpha = (0.2 + rise * 0.12) * (0.7 + 0.3 * Math.sin(time * 0.5 + i * 2.3))
        // the sprite's bright centre sits at the surface, fading with depth
        g.drawImage(sprite, -w, -H * 0.9, w * 2, H * 1.8)
        g.restore()
      }
      g.globalAlpha = 1
      // caustic ribbons
      g.lineWidth = 1.4
      for (let k = 0; k < 7; k++) {
        g.strokeStyle = rgba(WATER, 0.05 + 0.03 * Math.sin(time + k))
        g.beginPath()
        for (let x = -10; x <= W + 10; x += 16) {
          const y = 30 + k * 26 + Math.sin(x * 0.018 + time * (0.8 + k * 0.1) + k) * 8 + Math.sin(x * 0.041 - time * 1.3) * 4
          if (x === -10) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
        g.stroke()
      }
      g.restore()
      for (const m of motes) glow(g, m.x, m.y, 2 + m.s * 3, WATER, 0.1 + 0.08 * Math.sin(m.p * 2))
    }

    function drawPrompt(p: Prompt, time: number): void {
      const life = p.t / p.window
      const appear = clamp01(p.t / 0.12)
      let a = appear * (0.78 + 0.22 * Math.sin(time * 37 + p.x) * Math.sin(time * 23))
      let s = 1.25 - 0.25 * easeOutCubic(appear)
      if (p.done) {
        const k = clamp01(p.doneT / 0.35)
        a = 1 - k
        s = p.done === 'hit' ? 1 + k * 0.6 : 1 - k * 0.3
      }
      if (a <= 0) return
      const c = p.done === 'miss' ? VOICE : color
      glow(g, p.x, p.y, 110 * s, c, 0.35 * a)
      g.save()
      g.translate(p.x, p.y)
      g.scale(s, s)
      g.globalAlpha = a
      g.fillStyle = 'rgba(3,10,14,0.72)'
      g.strokeStyle = rgba(c, 0.95)
      g.lineWidth = 3
      if (p.key === 'Space') {
        const w = 150
        const h = 50
        g.beginPath()
        g.moveTo(-w / 2 + h / 2, -h / 2)
        g.arcTo(w / 2, -h / 2, w / 2, h / 2, h / 2)
        g.arcTo(w / 2, h / 2, -w / 2, h / 2, h / 2)
        g.arcTo(-w / 2, h / 2, -w / 2, -h / 2, h / 2)
        g.arcTo(-w / 2, -h / 2, w / 2, -h / 2, h / 2)
        g.closePath()
        g.fill()
        g.stroke()
        g.fillStyle = rgba([255, 244, 230], 1)
        g.font = '600 17px Cinzel, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(ctx.t(TEXT.space), 0, 1)
      } else {
        g.beginPath()
        g.arc(0, 0, 40, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.strokeStyle = rgba(c, 0.35)
        g.lineWidth = 1
        g.beginPath()
        g.arc(0, 0, 33, 0, Math.PI * 2)
        g.stroke()
        g.fillStyle = rgba([255, 244, 230], 1)
        g.font = '700 36px Cinzel, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(LABEL[p.key], 0, 2)
      }
      // shrinking timer ring
      if (!p.done) {
        const rem = 1 - clamp01(life)
        const rr = p.key === 'Space' ? 62 : 52
        g.lineCap = 'round'
        g.strokeStyle = rem < 0.3 ? rgba([255, 120, 120], 0.9) : rgba(c, 0.8)
        g.lineWidth = 3
        g.beginPath()
        if (p.key === 'Space') g.ellipse(0, 0, rr + 30, rr - 18, 0, -Math.PI / 2, -Math.PI / 2 + rem * Math.PI * 2)
        else g.arc(0, 0, rr, -Math.PI / 2, -Math.PI / 2 + rem * Math.PI * 2)
        g.stroke()
      }
      g.restore()
    }

    function drawHud(time: number): void {
      // heartbeats
      const gap = 30
      const x0 = W / 2 - ((need - 1) * gap) / 2
      for (let i = 0; i < need; i++) {
        const x = x0 + i * gap
        const y = H - 26
        const filled = i < hits
        const isNew = filled && i === hits - 1
        const s = 9 * (isNew ? 1 + heartPulse * 0.5 : filled ? 1 + 0.06 * Math.sin(time * 6 + i) : 1)
        heartPath(g, x, y, s)
        if (filled) {
          g.fillStyle = rgba(HEART, 0.95)
          g.fill()
          glow(g, x, y, 22, HEART, 0.45 + (isNew ? heartPulse * 0.5 : 0))
        } else {
          g.strokeStyle = 'rgba(255,150,170,0.35)'
          g.lineWidth = 1.2
          g.stroke()
        }
      }
      // will: little flames that go out
      g.textAlign = 'left'
      g.textBaseline = 'middle'
      g.font = '600 11px Cinzel, serif'
      g.fillStyle = 'rgba(236,228,212,0.5)'
      g.fillText(ctx.t(TEXT.will).toUpperCase(), 22, 24)
      for (let i = 0; i < maxMiss; i++) {
        const x = 30 + i * 22
        const y = 48
        const out = i >= maxMiss - missCount
        if (out) {
          g.fillStyle = 'rgba(120,120,140,0.35)'
          g.beginPath()
          g.arc(x, y + 3, 3, 0, Math.PI * 2)
          g.fill()
        } else {
          const fl = 1 + 0.12 * Math.sin(time * 9 + i * 2)
          glow(g, x, y, 16, color, 0.5)
          g.fillStyle = rgba([255, 236, 210], 0.95)
          g.beginPath()
          g.moveTo(x, y - 9 * fl)
          g.quadraticCurveTo(x + 6, y, x, y + 5)
          g.quadraticCurveTo(x - 6, y, x, y - 9 * fl)
          g.fill()
        }
      }
    }

    function drawVoice(): void {
      if (whisper && phase !== 'won') {
        const k = whisper.t / 3
        const a = Math.sin(clamp01(k) * Math.PI) * 0.16
        g.font = 'italic 24px "EB Garamond", Georgia, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillStyle = rgba(VOICE, a)
        g.fillText(whisper.text, whisper.x, whisper.y - k * 10)
      }
      if (!voice) return
      const k = voice.t / 1.8
      if (k >= 1) return
      const a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85
      const s = 1 + 0.1 * Math.sin(k * Math.PI)
      g.save()
      g.translate(W / 2, H / 2 - 10)
      g.scale(s, s)
      g.font = 'italic 500 50px "EB Garamond", Georgia, serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      const jitter = rm ? 0 : 3
      g.globalCompositeOperation = 'lighter'
      g.fillStyle = `rgba(255,40,80,${a * 0.45})`
      g.fillText(voice.text, -jitter, 0)
      g.fillStyle = `rgba(80,60,255,${a * 0.45})`
      g.fillText(voice.text, jitter, 0)
      g.globalCompositeOperation = 'source-over'
      g.fillStyle = `rgba(230,200,255,${a})`
      g.fillText(voice.text, 0, 0)
      g.restore()
    }

    function drawLids(open: number): void {
      const reach = (1 - open) * H * 0.5
      if (reach <= 1) return
      g.save()
      for (const top of [true, false]) {
        const yEdge = top ? reach : H - reach
        const yCorner = top ? reach * 0.2 - 10 : H - reach * 0.2 + 10
        const yOut = top ? -30 : H + 30
        g.beginPath()
        g.moveTo(-30, yOut)
        g.lineTo(W + 30, yOut)
        g.lineTo(W + 30, yCorner)
        g.quadraticCurveTo(W / 2, yEdge + (yEdge - yCorner) * 0.9, -30, yCorner)
        g.closePath()
        g.fillStyle = 'rgba(1,3,5,0.94)'
        g.fill()
        // feathered rim
        g.beginPath()
        g.moveTo(W + 30, yCorner)
        g.quadraticCurveTo(W / 2, yEdge + (yEdge - yCorner) * 0.9, -30, yCorner)
        for (const [lw, a] of [
          [34, 0.25],
          [16, 0.45],
        ] as const) {
          g.lineWidth = lw
          g.strokeStyle = `rgba(1,3,5,${a})`
          g.stroke()
        }
      }
      g.restore()
    }

    // ------------------------------------------------------------------ loop
    ctx.loop((rawDt, time) => {
      const dt = Math.max(0, rawDt)
      fit()
      if (phase === 'intro' || phase === 'wait') {
        timer -= dt
        if (phase === 'intro' && !voice && timer < 1.0) voice = { text: nextVoice(), t: 0 }
        if (timer <= 0) spawnPrompt()
      } else if (phase === 'prompt' && prompt && !prompt.done) {
        prompt.t += dt
        if (prompt.t >= prompt.window) resolvePrompt(false)
      } else if (phase === 'won' || phase === 'lost') endT += dt
      if (prompt) {
        if (prompt.done) prompt.doneT += dt
        if (prompt.done && prompt.doneT > 0.4) prompt = null
      }
      if (voice) {
        voice.t += dt
        if (voice.t > 1.8) voice = null
      }
      if (whisper) {
        whisper.t += dt
        if (whisper.t > 3) whisper = null
      } else if (phase !== 'won' && Math.random() < dt * 0.25) {
        whisper = { text: nextVoice(), t: 0, x: 120 + Math.random() * (W - 240), y: 70 + Math.random() * (H - 160) }
      }
      heartPulse = Math.max(0, heartPulse - dt * 2.5)
      // eyelids: won heartbeats open them, misses make them blink shut, losing closes them
      blink = Math.max(0, blink - dt * 2.2)
      const lidTarget = phase === 'won' ? 1.2 : phase === 'lost' ? 0.22 : 0.84 + 0.16 * (hits / need) - 0.06 * missCount - blink * 0.45
      lid += (lidTarget - lid) * Math.min(1, dt * (phase === 'lost' ? 1.2 : 5))
      light = Math.max(0, light - dt * 1.8)
      dark += ((phase === 'won' ? 0 : 0.3 + (missCount / maxMiss) * 0.25) - dark) * Math.min(1, dt * 1.5)
      shake = Math.max(0, shake - dt)
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += dt
        if (ripples[i].t > (ripples[i].big ? 1.3 : 0.9)) ripples.splice(i, 1)
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life += dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vx *= 1 - dt * 2.4
        s.vy = s.vy * (1 - dt * 2.4) - dt * 20
        if (s.life > s.max) sparks.splice(i, 1)
      }
      for (const m of motes) {
        m.p += dt
        m.y -= dt * (6 + m.s * 8) * (phase === 'won' ? 4 : 1)
        m.x += Math.sin(m.p) * dt * 6
        if (m.y < -8) {
          m.y = H + 8
          m.x = Math.random() * W
        }
      }

      // draw
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (shake > 0) g.translate((Math.random() - 0.5) * 12 * shake, (Math.random() - 0.5) * 9 * shake)
      drawBackdrop(time)
      for (const r of ripples) {
        const p = r.t / (r.big ? 1.3 : 0.9)
        g.strokeStyle = rgba(r.c, (r.big ? 0.55 : 0.35) * (1 - p))
        g.lineWidth = r.big ? 2.5 : 1.5
        for (let k = 0; k < (r.big ? 3 : 2); k++) {
          const rr = (r.big ? 30 + p * 300 : 20 + p * 120) - k * 18
          if (rr <= 0) continue
          g.beginPath()
          g.ellipse(r.x, r.y, rr, rr * 0.55, 0, 0, Math.PI * 2)
          g.stroke()
        }
      }
      drawVoice()
      if (prompt) drawPrompt(prompt, time)
      for (const s of sparks) glow(g, s.x, s.y, 7, s.c, 1 - s.life / s.max)
      // the heartbeat of the darkness
      const beat = Math.pow(Math.max(0, Math.sin(time * 2.4)), 8)
      const vr = H * (0.55 - dark * 0.18 - beat * 0.03)
      const vg = g.createRadialGradient(W / 2, H / 2, vr * 0.5, W / 2, H / 2, W * 0.62)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, `rgba(0,0,0,${0.55 + dark * 0.4})`)
      g.fillStyle = vg
      g.fillRect(-20, -20, W + 40, H + 40)
      if (light > 0) {
        g.fillStyle = rgba(color, light * 0.08)
        g.fillRect(-20, -20, W + 40, H + 40)
      }
      if (phase === 'won') {
        const k = easeOutCubic(clamp01(endT / 1.2))
        const sg = g.createLinearGradient(0, 0, 0, H)
        sg.addColorStop(0, `rgba(220,250,255,${0.55 * k})`)
        sg.addColorStop(1, `rgba(120,220,230,${0.08 * k})`)
        g.fillStyle = sg
        g.fillRect(-20, -20, W + 40, H + 40)
      }
      drawLids(lid)
      drawHud(time)
    })
  })
}

registerMinigame('inputs', () => ({ run: runInputs }))
