/**
 * HOLD: the Sora gate finale. Hold V / Space / the mouse button while the
 * world slowly turns to silver light. Memory fragments rise one by one and
 * dissolve as you keep holding; letting go makes the light recede (slowly)
 * and someone pleads with you. Hold long enough and you pass.
 *
 * Never fails: releasing only rewinds. The minigame resolves on its own after
 * the final white-out.
 *
 * params: {
 *   memories?: L[]     fragments that dissolve (defaults below)
 *   plea?: L           line shown when the player lets go
 *   duration?: number  seconds of holding needed (default 12)
 *   title?: L, subtitle?: L
 * }
 * result: { success: true, score: 1 without releases, lower with each release }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import { l, type L } from '../../i18n/i18n'

type RGB = readonly [number, number, number]

const W = 760
const H = 470
const GX = W / 2
const GY = 178
const GR = 104

const TEXT = {
  title: l('Brána Sora', 'The Sora Gate'),
  subtitle: l('Kto ňou prejde, nechá všetko za sebou. Aj kúsok seba.', 'Whoever passes through leaves everything behind. Even a part of themselves.'),
  hint: l('Drž V, medzerník alebo tlačidlo myši. Nepúšťaj.', 'Hold V, Space or the mouse button. Do not let go.'),
  again: l('Drž znova…', 'Hold again…'),
  plea: l('Nepúšťaj… prosím, ešte chvíľu.', "Don't let go… please, just a little longer."),
}

const DEFAULT_MEMORIES: L[] = [
  l('jej meno', 'her name'),
  l('farba Arkotových očí', "the colour of Arkot's eyes"),
  l('vôňa dažďa nad chrámom', 'the smell of rain over the temple'),
  l('prvý ľad v dlaniach', 'the first ice in her palms'),
  l('smiech pri ohni', 'laughter by the fire'),
  l('cesta domov', 'the way home'),
]

const VIOLET: RGB = [183, 125, 255]
const SILVER: RGB = [232, 230, 246]
const PALE: RGB = [246, 244, 255]

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const rgba = (c: RGB, a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const mix = (a: RGB, b: RGB, t: number): RGB => [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
const smooth = (t: number): number => t * t * (3 - 2 * t)

function isL(v: unknown): v is L {
  return typeof v === 'object' && v !== null && typeof (v as L).sk === 'string' && typeof (v as L).en === 'string'
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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

interface Fragment {
  text: string
  chars: string[]
  offs: number[]
  width: number
  side: number
  delays: number[]
  wasGone: boolean
}

interface Dust {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  s: number
}

function runHold(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const customMem = Array.isArray(params.memories) ? params.memories.filter(isL) : []
  const memories = customMem.length ? customMem : DEFAULT_MEMORIES
  const plea = isL(params.plea) ? params.plea : TEXT.plea
  const duration = typeof params.duration === 'number' && params.duration > 1 ? params.duration : 12
  const title = isL(params.title) ? params.title : TEXT.title
  const subtitle = isL(params.subtitle) ? params.subtitle : TEXT.subtitle
  const rm = ctx.assist.reducedMotion
  const n = memories.length

  return new Promise<MinigameResult>((resolve) => {
    // the silver light lives behind the (transparent) card and floods the whole screen
    const light = document.createElement('div')
    light.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0'
    ctx.root.appendChild(light)
    const card = createCard(ctx, title, subtitle)
    card.card.style.cssText += ';background:transparent;border-color:transparent;box-shadow:none;z-index:1'
    const titleEl = card.card.querySelector<HTMLElement>('.nv-mg-title')
    const subEl = card.card.querySelector<HTMLElement>('.nv-mg-sub')
    if (titleEl) titleEl.style.letterSpacing = '0.3em'
    card.hint.textContent = ctx.t(TEXT.hint)
    card.hint.style.opacity = '0.8'
    card.buttons.style.minHeight = '44px'
    const { canvas, ctx: g } = hiDpiCanvas(W, H)
    const dpr = canvas.width / W
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    card.body.appendChild(canvas)
    ctx.root.style.cursor = 'pointer'
    const fit = makeFitter(canvas, card.card, W, H)

    // fragments, laid out per character so they can come apart letter by letter
    g.font = 'italic 40px "EB Garamond", Georgia, serif'
    const rnd = mulberry32(31)
    const layout = (text: string, i: number): Fragment => {
      const chars = Array.from(text)
      const offs: number[] = []
      let x = 0
      for (const ch of chars) {
        offs.push(x)
        x += g.measureText(ch).width
      }
      return { text, chars, offs, width: x, side: i % 2 ? 1 : -1, delays: chars.map(() => rnd()), wasGone: false }
    }
    let frags = memories.map((m, i) => layout(ctx.t(m), i))
    let relaid = false
    const fontSpec = 'italic 40px "EB Garamond"'
    const allText = memories.map((m) => ctx.t(m)).join('')
    const relayout = () => {
      if (resolved) return
      g.font = 'italic 40px "EB Garamond", Georgia, serif'
      frags = memories.map((m, i) => layout(ctx.t(m), i))
      relaid = true
    }
    // make sure every glyph subset (Slovak diacritics live in latin-ext) is loaded before measuring
    document.fonts?.load(fontSpec, allText).then(relayout, () => undefined)
    let gateX = window.innerWidth / 2
    let gateY = window.innerHeight * 0.4
    let gateT = 0

    // state
    let progress = 0
    let shown = 0
    let holdKeys = 0
    let spaceDown = false
    let vDown = false
    const pointers = new Set<number>()
    let phase: 'play' | 'done' = 'play'
    let doneT = 0
    let pleaA = 0
    let releases = 0
    let wasHolding = false
    let resolved = false
    let skipShown = false
    const dust: Dust[] = []
    const motes = Array.from({ length: rm ? 16 : 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.4 + Math.random() * 1.4, p: Math.random() * 10 }))

    const holding = () => phase === 'play' && (spaceDown || vDown || pointers.size > 0)

    const extra: [string, EventListener][] = []
    const listen = (type: string, fn: EventListener) => {
      window.addEventListener(type, fn)
      extra.push([type, fn])
    }
    const finish = (r: MinigameResult) => {
      if (resolved) return
      resolved = true
      for (const [t, fn] of extra) window.removeEventListener(t, fn)
      ctx.root.style.cursor = ''
      resolve(r)
    }

    // ------------------------------------------------------------------ input
    ctx.root.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return
      e.preventDefault()
      pointers.add(e.pointerId)
    })
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
    }
    ctx.root.addEventListener('pointerup', up)
    ctx.root.addEventListener('pointercancel', up)
    ctx.root.addEventListener('contextmenu', (e) => e.preventDefault())
    ctx.onKey((e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        spaceDown = true
      } else if (e.code === 'KeyV') {
        e.preventDefault()
        vDown = true
      }
    })
    listen('keyup', ((e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown = false
      if (e.code === 'KeyV') vDown = false
    }) as EventListener)
    listen('blur', () => {
      spaceDown = false
      vDown = false
      pointers.clear()
    })

    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__nvHold = {
        state: () => ({ phase, progress: Math.round(progress * 100) / 100, releases }),
      }
    }

    // ------------------------------------------------------------------ drawing
    const darkText: RGB = [70, 44, 110]

    function drawGate(time: number, p: number): void {
      const open = smooth(p)
      // rays
      if (open > 0.02) {
        g.save()
        g.translate(GX, GY)
        g.globalCompositeOperation = 'lighter'
        const sprite = glowSprite(PALE)
        for (let i = 0; i < 12; i++) {
          g.save()
          g.rotate((i / 12) * Math.PI * 2 + time * 0.05)
          g.globalAlpha = open * 0.22 * (0.6 + 0.4 * Math.sin(time * 0.7 + i * 1.9))
          g.drawImage(sprite, -14, -GR * 0.2, 28, GR * (1.5 + open * 2.4))
          g.restore()
        }
        g.restore()
      }
      glow(g, GX, GY, GR * (1.7 + open * 1.4), VIOLET, 0.32 - open * 0.12)
      glow(g, GX, GY, GR * (0.9 + open * 1.6), PALE, 0.15 + open * 0.75)
      // inner disc: deep violet night opening into silver
      const dg = g.createRadialGradient(GX, GY, 2, GX, GY, GR)
      dg.addColorStop(0, rgba(mix([40, 20, 70], PALE, open), 0.9))
      dg.addColorStop(0.7, rgba(mix([24, 12, 44], [214, 206, 240], open), 0.75))
      dg.addColorStop(1, rgba(mix([14, 8, 26], [190, 176, 230], open), 0.3))
      g.fillStyle = dg
      g.beginPath()
      g.arc(GX, GY, GR, 0, Math.PI * 2)
      g.fill()
      // rings & runes
      g.save()
      g.translate(GX, GY)
      g.strokeStyle = rgba(mix(VIOLET, [120, 90, 190], open), 0.9)
      g.lineWidth = 2
      g.beginPath()
      g.arc(0, 0, GR, 0, Math.PI * 2)
      g.stroke()
      g.lineWidth = 1
      g.strokeStyle = rgba(mix(SILVER, [120, 96, 170], open), 0.5)
      g.beginPath()
      g.arc(0, 0, GR + 12, 0, Math.PI * 2)
      g.stroke()
      g.rotate(time * 0.08)
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2
        g.save()
        g.rotate(a)
        g.strokeStyle = rgba(mix(SILVER, [130, 100, 180], open), 0.65)
        g.lineWidth = 1.2
        g.beginPath()
        if (i % 3 === 0) {
          g.moveTo(GR + 3, -3)
          g.lineTo(GR + 9, 0)
          g.lineTo(GR + 3, 3)
        } else {
          g.moveTo(GR + 4, 0)
          g.lineTo(GR + 8, 0)
        }
        g.stroke()
        g.restore()
      }
      g.rotate(-time * 0.2)
      g.strokeStyle = rgba(mix(VIOLET, [150, 120, 210], open), 0.55)
      g.lineWidth = 1.5
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        g.beginPath()
        g.arc(0, 0, GR * 0.78, a, a + 0.6)
        g.stroke()
      }
      g.restore()
      // a thin silver arc tells how far the gate has opened
      if (p > 0.003) {
        g.strokeStyle = rgba(mix(PALE, [255, 255, 255], open), 0.95)
        g.lineWidth = 3
        g.lineCap = 'round'
        g.beginPath()
        g.arc(GX, GY, GR, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
        g.stroke()
        g.lineCap = 'butt'
      }
    }

    function drawFragments(p: number, time: number): void {
      g.font = 'italic 40px "EB Garamond", Georgia, serif'
      g.textAlign = 'left'
      g.textBaseline = 'middle'
      const tone = clamp01((p - 0.35) / 0.4)
      const col = mix(SILVER, darkText, tone)
      for (let i = 0; i < n; i++) {
        const f = frags[i]
        const k = (p - i / n) * n
        if (k <= 0 || k >= 1.0001) {
          f.wasGone = k >= 1
          continue
        }
        const rise = smooth(clamp01(k / 0.7))
        const baseY = lerp(H - 46, GY + GR + 52, rise)
        const x0 = GX - f.width / 2 + f.side * 40 * (1 - rise)
        const fadeIn = clamp01(k / 0.16)
        glow(g, GX, baseY, f.width * 0.7 + 30, tone > 0.5 ? PALE : VIOLET, 0.18 * fadeIn * (1 - clamp01((k - 0.7) / 0.3)))
        for (let c = 0; c < f.chars.length; c++) {
          const ck = clamp01((k - 0.62 - f.delays[c] * 0.18) / 0.2)
          const a = fadeIn * (1 - ck)
          if (a <= 0.01) continue
          const dx = (f.delays[c] - 0.5) * 30 * ck
          const dy = -ck * (34 + f.delays[c] * 30) + (rm ? 0 : Math.sin(time * 1.4 + c * 0.6) * 1.5 * (1 - ck))
          g.fillStyle = rgba(col, a)
          g.fillText(f.chars[c], x0 + f.offs[c] + dx, baseY + dy)
          // letters breaking apart shed silver dust
          if (ck > 0 && ck < 1 && holding() && Math.random() < 0.18 && !rm) {
            dust.push({ x: x0 + f.offs[c] + dx + 8, y: baseY + dy, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 40, life: 0, max: 0.9 + Math.random() * 0.8, s: 1 + Math.random() * 1.6 })
          }
        }
      }
    }

    // ------------------------------------------------------------------ loop
    ctx.loop((rawDt, time) => {
      const dt = Math.max(0, rawDt)
      fit()
      if (!relaid && document.fonts?.check?.(fontSpec, allText)) relayout()
      gateT -= dt
      if (gateT <= 0) {
        const r = canvas.getBoundingClientRect()
        gateX = r.left + (GX / W) * r.width
        gateY = r.top + (GY / H) * r.height
        gateT = 0.5
      }
      const hold = holding()
      if (phase === 'play') {
        const before = progress
        if (hold) progress = Math.min(1, progress + dt / duration)
        else progress = Math.max(0, progress - dt * 0.09)
        // a memory finished dissolving
        const bi = Math.floor(before * n)
        const ai = Math.floor(progress * n)
        if (ai > bi && ai <= n) ctx.sfx('chime')
        if (wasHolding && !hold && progress > 0.03) {
          releases++
          ctx.sfx('whoosh')
          card.hint.textContent = ctx.t(TEXT.again)
          if (ctx.assist.skipAllowed && !skipShown && progress > 0.12) {
            skipShown = true
            card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
            fit(true)
          }
        }
        if (!wasHolding && hold) card.hint.textContent = ctx.t(TEXT.hint)
        wasHolding = hold
        if (progress >= 1) {
          phase = 'done'
          doneT = 0
          card.buttons.replaceChildren()
          ctx.sfx('glyph')
          ctx.sfx('success')
        }
      } else {
        doneT += dt
        // everything, the words included, goes into the light
        card.card.style.opacity = String(1 - clamp01((doneT - 0.8) / 1.4))
        if (doneT > 2.6) finish({ success: true, score: Math.max(0.3, Math.round((1 - releases * 0.15) * 100) / 100) })
      }
      holdKeys = hold ? Math.min(1, holdKeys + dt * 3) : Math.max(0, holdKeys - dt * 2)
      shown += (progress - shown) * Math.min(1, dt * 4)
      pleaA = !hold && phase === 'play' && progress > 0.02 ? Math.min(1, pleaA + dt * 1.5) : Math.max(0, pleaA - dt * 2)

      // screen-wide silver light: a bright core around the gate that keeps widening until it is everything
      const p = phase === 'done' ? 1 : shown
      const flood = phase === 'done' ? clamp01(doneT / 1.6) : 0
      const core = Math.min(1, 0.06 + p * 0.95)
      const r1 = 3 + 52 * Math.pow(p, 1.25) + flood * 150
      const r2 = r1 + 18 + 30 * p
      const r3 = r2 + 26 + 40 * p
      light.style.background = `radial-gradient(circle at ${Math.round(gateX)}px ${Math.round(gateY)}px, rgba(255,255,255,${core}) 0vmax, rgba(240,236,253,${core * 0.92}) ${r1}vmax, rgba(204,190,240,${0.42 * Math.pow(p, 1.6) + flood * 0.55}) ${r2}vmax, rgba(150,128,214,${0.12 * Math.pow(p, 2) + flood * 0.8}) ${r3}vmax)`
      const tone = clamp01((p - 0.42) / 0.28)
      const chrome = 1 - clamp01((p - 0.3) / 0.35)
      if (titleEl) titleEl.style.opacity = String(chrome)
      if (subEl) subEl.style.opacity = String(chrome)
      card.hint.style.color = `rgb(${mix([236, 228, 212], [70, 50, 110], tone).join(',')})`

      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i]
        d.life += dt
        d.x += d.vx * dt
        d.y += d.vy * dt
        d.vy -= dt * 10
        if (d.life > d.max) dust.splice(i, 1)
      }
      for (const m of motes) {
        m.p += dt
        m.y -= dt * (5 + m.s * 6) * (1 + shown * 3)
        m.x += Math.sin(m.p * 0.8) * dt * 5
        if (m.y < -8) {
          m.y = H + 8
          m.x = Math.random() * W
        }
      }

      // draw
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, W, H)
      // a soft night behind the gate that fades as the light takes over
      // (elliptical, so it fades out well before the canvas edges)
      g.save()
      g.translate(GX, GY + 50)
      g.scale(1.45, 1)
      const night = g.createRadialGradient(0, 0, 10, 0, 0, 200)
      night.addColorStop(0, `rgba(30,18,52,${0.8 * (1 - clamp01(p / 0.35))})`)
      night.addColorStop(1, 'rgba(30,18,52,0)')
      g.fillStyle = night
      g.fillRect(-200, -200, 400, 400)
      g.restore()
      for (const m of motes) glow(g, m.x, m.y, 3 + m.s * 3, tone > 0.5 ? PALE : SILVER, 0.12 + 0.1 * Math.sin(m.p * 2) + holdKeys * 0.08)
      drawGate(time, phase === 'done' ? 1 : shown)
      drawFragments(phase === 'done' ? 1 : shown, time)
      for (const d of dust) glow(g, d.x, d.y, d.s * 4, PALE, 0.8 * (1 - d.life / d.max))
      // the plea
      if (pleaA > 0.01) {
        g.font = 'italic 30px "EB Garamond", Georgia, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        const pc = mix([241, 217, 255], [110, 60, 150], tone)
        glow(g, GX, H - 34, 160, VIOLET, 0.12 * pleaA)
        g.fillStyle = rgba(pc, pleaA * (0.85 + 0.15 * Math.sin(time * 2.2)))
        g.fillText(ctx.t(plea), GX, H - 34)
      }
      if (phase === 'done') glow(g, GX, GY, GR * (2 + doneT * 4), [255, 255, 255], clamp01(doneT / 1.2))
    })
  })
}

registerMinigame('hold', () => ({ run: runHold }))
