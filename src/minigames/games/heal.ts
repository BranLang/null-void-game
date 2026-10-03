/**
 * HEAL: "mu-hi", drawing heat out of a lamp flame into a newborn who is not
 * breathing (or into frozen hands). Hold the mouse on the flame to draw heat
 * (the flame shrinks), then lead the warm stream slowly along the arc to the
 * baby; moving too fast tears the stream and the heat is lost. Fill the warmth
 * to 100 % before the flame dies.
 *
 * Keyboard: hold Space to draw heat, then press Right at a steady pace (wait for
 * the ring to fill) to push it along the arc; releasing Space drops it.
 *
 * params: {
 *   title?: L, subtitle?: L
 *   target?: 'baby' | 'hands'   (default 'baby'; 'hands' = warming frozen hands)
 * }
 * result: { success, score: 0..1 (fuel left, torn streams), data: { breaks, fuelLeft } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import { l, type L } from '../../i18n/i18n'

type RGB = readonly [number, number, number]

const W = 760
const H = 440
const FX = 150 // flame base
const FY = 300
const BX = 600 // baby (chest)
const BY = 292
const PATH = { x0: FX + 4, y0: FY - 50, cx: 372, cy: 52, x1: BX - 18, y1: BY - 30 }
const STEPS = 8
const MAX_CHARGE = 0.22
const CHARGE_RATE = 0.2
const HEAT_PER_FUEL = 2.2
const PASSIVE = 0.004
const SPEED_LIMIT = 430
const PACE = 0.42

const TEXT = {
  title: l('Mu-hi', 'Mu-hi'),
  subtitle: l(
    'Teplo sa nedá vytrhnúť. Treba ho preniesť pomaly, ako vodu v dlaniach.',
    'Heat cannot be torn away. It has to be carried slowly, like water in cupped hands.',
  ),
  hint: l(
    'Drž myš na plameni a pomaly veď teplo po oblúku. Prudký pohyb prúd pretrhne. Klávesnica: drž medzerník a v rytme stláčaj šípku vpravo.',
    'Hold the mouse on the flame, then slowly lead the heat along the arc. A sudden move tears the stream. Keyboard: hold Space and press Right in a steady rhythm.',
  ),
  warmth: l('Teplo', 'Warmth'),
  torn: l('Prúd sa pretrhol', 'The stream tore'),
  dropped: l('Teplo sa rozplynulo', 'The heat faded'),
  tooFast: l('Príliš rýchlo', 'Too fast'),
  doneBaby: l('Malý hrudník sa nadvihne. Prvý nádych.', 'The tiny chest rises. A first breath.'),
  doneHands: l('Prsty sa znova pohnú. Teplo zostalo.', 'The fingers stir again. The warmth stays.'),
  fail: l('Plameň zhasol skôr, než teplo stačilo.', 'The flame went out before there was warmth enough.'),
}

const WARM: RGB = [255, 170, 80]
const HOT: RGB = [255, 226, 160]
const EMBER: RGB = [255, 110, 40]
const COLD: RGB = [150, 180, 220]

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const rgba = (c: RGB, a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const mix = (a: RGB, b: RGB, t: number): RGB => [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

function isL(v: unknown): v is L {
  return typeof v === 'object' && v !== null && typeof (v as L).sk === 'string' && typeof (v as L).en === 'string'
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

const pathPt = (t: number): [number, number] => {
  const u = 1 - t
  return [u * u * PATH.x0 + 2 * u * t * PATH.cx + t * t * PATH.x1, u * u * PATH.y0 + 2 * u * t * PATH.cy + t * t * PATH.y1]
}

type State = 'idle' | 'charging' | 'carrying' | 'delivering'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  s: number
  c: RGB
}

function runHeal(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const title = isL(params.title) ? params.title : TEXT.title
  const subtitle = isL(params.subtitle) ? params.subtitle : TEXT.subtitle
  const hands = params.target === 'hands'
  const rm = ctx.assist.reducedMotion

  return new Promise<MinigameResult>((resolve) => {
    const card = createCard(ctx, title, subtitle)
    card.hint.textContent = ctx.t(TEXT.hint)
    card.hint.style.maxWidth = '700px'
    card.buttons.style.minHeight = '44px'
    const { canvas, ctx: g } = hiDpiCanvas(W, H)
    const dpr = canvas.width / W
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'grab'
    card.body.appendChild(canvas)
    const fit = makeFitter(canvas, card.card, W, H)

    // state
    let fuel = 1
    let warmth = 0
    let shownWarmth = 0
    let charge = 0
    let state: State = 'idle'
    let mode: 'mouse' | 'key' = 'mouse'
    let phase: 'play' | 'won' | 'lost' = 'play'
    let endT = 0
    let breaks = 0
    let deliverT = 0
    let deliverAmt = 0
    let deliverFrom: [number, number] = [0, 0]
    let orbX = FX
    let orbY = FY - 40
    let tension = 0
    let overT = 0
    let spaceDown = false
    let keyStep = 0
    let keyPos = 0
    let paceT = PACE
    let pointerId: number | null = null
    let px = 0
    let py = 0
    let lastPX = 0
    let lastPY = 0
    let speed = 0
    let note: { text: string; t: number; c: RGB } | null = null
    let breath = 0
    const trail: [number, number][] = []
    const sparks: Spark[] = []
    const embers = Array.from({ length: rm ? 8 : 22 }, () => ({ x: FX + (Math.random() - 0.5) * 30, y: FY - Math.random() * 120, s: 0.5 + Math.random(), p: Math.random() * 10 }))

    const extra: [string, EventListener][] = []
    const listen = (type: string, fn: EventListener) => {
      window.addEventListener(type, fn)
      extra.push([type, fn])
    }
    const finish = (r: MinigameResult) => {
      for (const [t, fn] of extra) window.removeEventListener(t, fn)
      resolve(r)
    }

    const flameH = () => (fuel <= 0 ? 0 : 20 + 52 * Math.sqrt(fuel))
    const flameTip = (): [number, number] => [FX + 2, FY - flameH() * 0.85]

    function say(text: L, c: RGB): void {
      note = { text: ctx.t(text), t: 0, c }
    }

    function burst(x: number, y: number, c: RGB, n: number, sp: number): void {
      for (let i = 0; i < (rm ? Math.ceil(n / 3) : n); i++) {
        const a = Math.random() * Math.PI * 2
        const v = sp * (0.3 + Math.random())
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0, max: 0.4 + Math.random() * 0.6, s: 1 + Math.random() * 2, c })
      }
    }

    function drop(torn: boolean): void {
      if (state === 'idle' || state === 'delivering') return
      if (charge > 0.01) {
        burst(orbX, orbY, torn ? HOT : WARM, torn ? 30 : 14, torn ? 220 : 90)
        if (torn) {
          breaks++
          say(TEXT.torn, [255, 140, 120])
          ctx.sfx('crack')
        } else {
          say(TEXT.dropped, [220, 190, 160])
          ctx.sfx('whoosh')
        }
      }
      charge = 0
      state = 'idle'
      trail.length = 0
      keyStep = 0
      keyPos = 0
    }

    function startDeliver(): void {
      state = 'delivering'
      deliverT = 0
      deliverAmt = charge * HEAT_PER_FUEL
      deliverFrom = [orbX, orbY]
      charge = 0
      ctx.sfx('fire')
    }

    function win(): void {
      phase = 'won'
      endT = 0
      ctx.sfx('heartbeat')
      ctx.sfx('success')
      card.hint.textContent = ctx.t(hands ? TEXT.doneHands : TEXT.doneBaby)
      card.hint.style.color = 'var(--nv-gold-bright)'
      card.buttons.replaceChildren()
      const score = Math.round(clamp01(1 - breaks * 0.15) * (0.6 + 0.4 * Math.min(1, fuel / 0.3)) * 100) / 100
      card.buttons.appendChild(button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { breaks, fuelLeft: Math.round(fuel * 100) / 100 } }), true))
      fit(true)
    }

    function lose(): void {
      phase = 'lost'
      endT = 0
      drop(false)
      ctx.sfx('fail')
      card.hint.textContent = ctx.t(TEXT.fail)
      card.hint.style.color = 'var(--nv-danger)'
      card.buttons.replaceChildren()
      card.buttons.appendChild(button(ctx.t(UI_STRINGS.retry), restart, true))
      if (ctx.assist.skipAllowed) card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      fit(true)
    }

    function restart(): void {
      fuel = 1
      warmth = 0
      shownWarmth = 0
      charge = 0
      breaks = 0
      state = 'idle'
      phase = 'play'
      trail.length = 0
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
    const nearFlame = (x: number, y: number, pad = 0) => Math.hypot(x - FX, y - (FY - 34)) < 52 + pad
    const nearBaby = (x: number, y: number) => Math.hypot(x - BX, y - (BY - 8)) < (hands ? 80 : 72)
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      if (phase !== 'play' || pointerId !== null || state !== 'idle') return
      const [x, y] = toLocal(e)
      if (!nearFlame(x, y, e.pointerType === 'touch' ? 20 : 6) || fuel <= 0) return
      pointerId = e.pointerId
      canvas.setPointerCapture?.(e.pointerId)
      mode = 'mouse'
      state = 'charging'
      px = lastPX = x
      py = lastPY = y
      speed = 0
      trail.length = 0
      canvas.style.cursor = 'grabbing'
      ctx.sfx('fire')
    })
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId) {
        const [x, y] = toLocal(e)
        canvas.style.cursor = state === 'idle' && nearFlame(x, y, 6) ? 'grab' : 'default'
        return
      }
      const [x, y] = toLocal(e)
      px = x
      py = y
    })
    const release = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      pointerId = null
      canvas.style.cursor = 'grab'
      if (mode === 'mouse' && (state === 'charging' || state === 'carrying')) {
        if (state === 'carrying' && nearBaby(px, py) && charge > 0) startDeliver()
        else if (state === 'charging' && charge > 0.02) {
          // let go on the flame: the heat simply returns
          charge = 0
          state = 'idle'
        } else drop(false)
      }
    }
    canvas.addEventListener('pointerup', release)
    canvas.addEventListener('pointercancel', release)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    ctx.onKey((e) => {
      if ((phase === 'won' || phase === 'lost') && endT > 0.6 && !e.repeat && (e.code === 'Enter' || (e.code === 'Space' && phase === 'won'))) {
        e.preventDefault()
        card.buttons.querySelector('button')?.click()
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (phase !== 'play' || e.repeat) return
        spaceDown = true
        if (state === 'idle' && fuel > 0 && pointerId === null) {
          mode = 'key'
          state = 'charging'
          keyStep = 0
          keyPos = 0
          paceT = PACE
          ctx.sfx('fire')
        }
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault()
        if (phase !== 'play' || e.repeat || mode !== 'key') return
        if (state !== 'charging' && state !== 'carrying') return
        if (charge < 0.02) return
        if (state === 'carrying' && paceT < PACE * 0.8) {
          say(TEXT.tooFast, [255, 140, 120])
          drop(true)
          return
        }
        state = 'carrying'
        keyStep++
        paceT = 0
        ctx.sfx('tick')
        if (keyStep >= STEPS) {
          keyPos = 1
          const [x, y] = pathPt(1)
          orbX = x
          orbY = y
          startDeliver()
        }
      }
    })
    listen('keyup', ((e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      spaceDown = false
      if (mode === 'key' && (state === 'charging' || state === 'carrying')) {
        if (state === 'charging') {
          charge = 0
          state = 'idle'
        } else drop(false)
      }
    }) as EventListener)
    listen('blur', () => {
      spaceDown = false
      if (state === 'charging' || state === 'carrying') drop(false)
      pointerId = null
    })

    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__nvHeal = {
        state: () => ({ phase, state, fuel: Math.round(fuel * 100) / 100, warmth: Math.round(warmth * 100) / 100, charge: Math.round(charge * 100) / 100, breaks }),
        path: (t: number) => pathPt(t),
        flame: () => [FX, FY - 34],
      }
    }

    // ------------------------------------------------------------------ drawing
    function drawRoom(time: number): void {
      const fl = 0.9 + 0.1 * Math.sin(time * 9) * Math.sin(time * 5.3)
      const bg = g.createRadialGradient(FX, FY - 40, 20, FX + 120, FY - 40, W * 0.9)
      bg.addColorStop(0, `rgba(70,40,22,${0.95})`)
      bg.addColorStop(0.45, '#1e130d')
      bg.addColorStop(1, '#080506')
      g.fillStyle = bg
      g.fillRect(-20, -20, W + 40, H + 40)
      // table planks
      g.fillStyle = '#1a110b'
      g.fillRect(-20, FY + 34, W + 40, H)
      g.strokeStyle = 'rgba(0,0,0,0.4)'
      g.lineWidth = 1
      for (let i = 0; i < 4; i++) {
        g.beginPath()
        g.moveTo(-20, FY + 34 + i * 30)
        g.lineTo(W + 20, FY + 34 + i * 30)
        g.stroke()
      }
      const tg = g.createLinearGradient(0, FY + 34, 0, H)
      tg.addColorStop(0, `rgba(255,150,70,${0.1 * fl * Math.sqrt(fuel)})`)
      tg.addColorStop(1, 'rgba(0,0,0,0.3)')
      g.fillStyle = tg
      g.fillRect(-20, FY + 34, W + 40, H)
      // the guide arc
      g.save()
      g.setLineDash([3, 9])
      g.lineCap = 'round'
      g.strokeStyle = `rgba(243,217,149,${state === 'carrying' ? 0.4 : 0.22})`
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(PATH.x0, PATH.y0)
      g.quadraticCurveTo(PATH.cx, PATH.cy, PATH.x1, PATH.y1)
      g.stroke()
      g.setLineDash([])
      // keyboard step marks
      for (let i = 1; i < STEPS; i++) {
        const [x, y] = pathPt(i / STEPS)
        g.fillStyle = mode === 'key' && i <= keyStep && state === 'carrying' ? 'rgba(255,200,120,0.85)' : 'rgba(243,217,149,0.25)'
        g.beginPath()
        g.arc(x, y, 2.5, 0, Math.PI * 2)
        g.fill()
      }
      g.restore()
    }

    function drawLamp(time: number): void {
      // clay lamp
      g.save()
      g.translate(FX, FY)
      const body = g.createLinearGradient(-60, -10, 40, 40)
      body.addColorStop(0, '#8a4f2c')
      body.addColorStop(1, '#3a1d10')
      g.fillStyle = body
      g.beginPath()
      g.moveTo(-58, 8)
      g.bezierCurveTo(-60, 36, 30, 40, 40, 14)
      g.lineTo(8, 2)
      g.bezierCurveTo(-10, -6, -50, -6, -58, 8)
      g.fill()
      g.fillStyle = '#5a2f18'
      g.beginPath()
      g.ellipse(-22, 4, 22, 6, 0, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = 'rgba(255,190,130,0.25)'
      g.lineWidth = 1.2
      g.beginPath()
      g.moveTo(-50, 14)
      g.bezierCurveTo(-40, 26, 10, 28, 30, 16)
      g.stroke()
      // handle
      g.strokeStyle = '#4a2614'
      g.lineWidth = 5
      g.beginPath()
      g.arc(-62, 12, 9, Math.PI * 0.6, Math.PI * 1.5)
      g.stroke()
      // oil level shown in the open reservoir
      g.fillStyle = `rgba(200,140,40,${0.25 + 0.5 * fuel})`
      g.beginPath()
      g.ellipse(-22, 5, 18 * Math.max(0.15, fuel), 4 * Math.max(0.3, fuel), 0, 0, Math.PI * 2)
      g.fill()
      // wick
      g.fillStyle = '#1a0f08'
      g.fillRect(-1, -4, 4, 8)
      g.restore()
      // flame
      const fh = flameH()
      if (fh <= 0) {
        // smoke
        g.strokeStyle = 'rgba(160,150,140,0.25)'
        g.lineWidth = 2
        g.beginPath()
        for (let i = 0; i < 12; i++) {
          const y = FY - 6 - i * 8
          const x = FX + Math.sin(time * 2 + i * 0.6) * (3 + i)
          if (i === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
        g.stroke()
        return
      }
      const lean = state === 'charging' && mode === 'mouse' ? clamp01((px - FX) / 120) * 0.35 - clamp01((FX - px) / 120) * 0.35 : 0
      const pull = state === 'charging' ? 0.85 + 0.1 * Math.sin(time * 20) : 1
      const flick = rm ? 1 : 0.92 + 0.08 * Math.sin(time * 13) * Math.sin(time * 7.7)
      glow(g, FX, FY - fh * 0.45, 70 + fh * 1.6, WARM, 0.5 * Math.sqrt(fuel) * flick)
      glow(g, FX, FY - fh * 0.4, 30 + fh * 0.6, HOT, 0.55 * flick)
      g.save()
      g.translate(FX + 1, FY - 2)
      g.rotate(lean + (rm ? 0 : Math.sin(time * 3.1) * 0.04))
      g.scale(1, pull * flick)
      const tongue = (h: number, w: number, c: string) => {
        g.fillStyle = c
        g.beginPath()
        g.moveTo(0, 0)
        g.bezierCurveTo(w, -h * 0.2, w * 0.6, -h * 0.7, 0, -h)
        g.bezierCurveTo(-w * 0.6, -h * 0.7, -w, -h * 0.2, 0, 0)
        g.fill()
      }
      g.globalCompositeOperation = 'lighter'
      tongue(fh, fh * 0.34, 'rgba(255,110,40,0.75)')
      tongue(fh * 0.78, fh * 0.25, 'rgba(255,190,90,0.85)')
      tongue(fh * 0.5, fh * 0.15, 'rgba(255,248,220,0.95)')
      g.fillStyle = 'rgba(120,160,255,0.5)'
      g.beginPath()
      g.ellipse(0, -3, fh * 0.08, fh * 0.06, 0, 0, Math.PI * 2)
      g.fill()
      g.restore()
      // fuel ring around the flame zone
      g.strokeStyle = 'rgba(255,200,130,0.12)'
      g.lineWidth = 3
      g.beginPath()
      g.arc(FX, FY - 34, 58, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = fuel < 0.25 ? 'rgba(255,120,90,0.8)' : 'rgba(255,200,130,0.6)'
      g.beginPath()
      g.arc(FX, FY - 34, 58, -Math.PI / 2, -Math.PI / 2 + fuel * Math.PI * 2)
      g.stroke()
    }

    function drawBaby(time: number): void {
      const w = clamp01(shownWarmth)
      const skin = mix([150, 162, 182], [240, 196, 172], w)
      const rise = phase === 'won' ? Math.sin(breath * 2.2) * 0.5 + 0.5 : 0
      glow(g, BX, BY - 4, 120, COLD, 0.22 * (1 - w))
      glow(g, BX, BY - 4, 110, WARM, 0.35 * w)
      // cloth
      g.fillStyle = '#2a1f19'
      g.beginPath()
      g.ellipse(BX + 4, BY + 36, 128, 22, 0, 0, Math.PI * 2)
      g.fill()
      if (hands) {
        // two hands held out to the warmth, palms up, thumbs together
        const capsule = (x: number, y: number, ang: number, len: number, wd: number) => {
          g.save()
          g.translate(x, y)
          g.rotate(ang)
          g.beginPath()
          g.moveTo(0, -wd / 2)
          g.lineTo(len - wd / 2, -wd / 2)
          g.arc(len - wd / 2, 0, wd / 2, -Math.PI / 2, Math.PI / 2)
          g.lineTo(0, wd / 2)
          g.closePath()
          g.fill()
          g.stroke()
          g.restore()
        }
        g.fillStyle = rgba(skin, 1)
        g.strokeStyle = 'rgba(70,40,40,0.35)'
        g.lineWidth = 1.2
        for (const s of [-1, 1]) {
          g.save()
          g.translate(BX + s * 34, BY + 12)
          g.scale(s, 1)
          const lens = [24, 30, 29, 23]
          for (let f = 0; f < 4; f++) capsule(-2 + f * 8.5, -12, -Math.PI / 2 + (f - 1.5) * 0.16 + 0.14, lens[f], 9.5)
          capsule(-20, -4, -Math.PI * 0.82, 21, 10.5)
          g.beginPath()
          g.ellipse(9, 2, 24, 19, 0.08, 0, Math.PI * 2)
          g.fill()
          g.stroke()
          // palm crease
          g.beginPath()
          g.moveTo(-4, 4)
          g.quadraticCurveTo(10, -2, 24, 6)
          g.stroke()
          g.restore()
        }
        // frost on the fingertips melting away
        if (w < 1) {
          g.fillStyle = `rgba(225,240,255,${0.65 * (1 - w)})`
          for (const s of [-1, 1]) {
            for (let f = 0; f < 4; f++) {
              const a = -Math.PI / 2 + (f - 1.5) * 0.16 + 0.14
              const len = [24, 30, 29, 23][f]
              const fx = BX + s * (34 + (-2 + f * 8.5) + Math.cos(a) * (len - 4))
              const fy = BY + 12 - 12 + Math.sin(a) * (len - 4)
              g.beginPath()
              g.arc(fx, fy, 3, 0, Math.PI * 2)
              g.fill()
            }
          }
        }
        return
      }
      // swaddled body
      g.save()
      g.translate(BX, BY)
      g.scale(1, 1 + rise * 0.025)
      const sw = g.createLinearGradient(-90, -30, 70, 40)
      sw.addColorStop(0, '#e2d6c2')
      sw.addColorStop(1, '#9c8a72')
      g.fillStyle = sw
      g.beginPath()
      g.ellipse(-6, 8, 78, 30, -0.04, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = 'rgba(90,70,50,0.45)'
      g.lineWidth = 1.5
      for (let i = 0; i < 4; i++) {
        g.beginPath()
        g.moveTo(-60 + i * 26, -18)
        g.quadraticCurveTo(-48 + i * 26, 8, -64 + i * 26, 34)
        g.stroke()
      }
      // head
      const hx = 66
      const hy = -2
      g.fillStyle = rgba(skin, 1)
      g.beginPath()
      g.arc(hx, hy, 25, 0, Math.PI * 2)
      g.fill()
      // little cap of the swaddle
      g.fillStyle = '#cdbfa8'
      g.beginPath()
      g.arc(hx + 4, hy, 27, -Math.PI * 0.55, Math.PI * 0.55, false)
      g.arc(hx + 3, hy, 19, Math.PI * 0.5, -Math.PI * 0.5, true)
      g.fill()
      // face (closed eyes; a soft mouth once breathing)
      g.strokeStyle = 'rgba(60,40,40,0.75)'
      g.lineWidth = 1.4
      g.beginPath()
      g.arc(hx - 9, hy - 5, 3.5, 0.15 * Math.PI, 0.85 * Math.PI)
      g.stroke()
      g.beginPath()
      g.arc(hx - 9, hy + 6, 3.5, 0.15 * Math.PI, 0.85 * Math.PI)
      g.stroke()
      g.fillStyle = `rgba(200,110,110,${0.25 + w * 0.5})`
      g.beginPath()
      g.ellipse(hx - 17, hy + 1, 1.8, 2.6 + rise, 0, 0, Math.PI * 2)
      g.fill()
      if (w > 0.3) {
        g.fillStyle = `rgba(255,140,140,${(w - 0.3) * 0.35})`
        g.beginPath()
        g.arc(hx - 6, hy + 12, 5, 0, Math.PI * 2)
        g.arc(hx - 6, hy - 12, 5, 0, Math.PI * 2)
        g.fill()
      }
      g.restore()
      if (phase === 'won') glow(g, BX + 60, BY - 6, 60 + rise * 20, HOT, 0.25 + rise * 0.2)
      // frost breath of the cold
      if (w < 0.6 && !rm) {
        for (let i = 0; i < 3; i++) {
          const p = (time * 0.4 + i / 3) % 1
          glow(g, BX + 40 - p * 30, BY - 30 - p * 30, 8 + p * 10, COLD, 0.12 * (1 - p) * (1 - w))
        }
      }
    }

    function drawWarmthMeter(): void {
      const w = clamp01(shownWarmth)
      const x = BX - 70
      const y = BY + 70
      g.font = '600 11px Cinzel, serif'
      g.textAlign = 'left'
      g.textBaseline = 'middle'
      g.fillStyle = 'rgba(236,228,212,0.6)'
      g.fillText(ctx.t(TEXT.warmth).toUpperCase(), x, y)
      const bx = x + 64
      g.fillStyle = 'rgba(255,255,255,0.08)'
      g.fillRect(bx, y - 3, 110, 6)
      const grd = g.createLinearGradient(bx, 0, bx + 110, 0)
      grd.addColorStop(0, '#7aa2d8')
      grd.addColorStop(1, '#ffb070')
      g.fillStyle = grd
      g.fillRect(bx, y - 3, 110 * w, 6)
      glow(g, bx + 110 * w, y, 10, WARM, w > 0 ? 0.6 : 0)
      g.textAlign = 'right'
      g.fillStyle = 'rgba(236,228,212,0.7)'
      g.fillText(`${Math.round(w * 100)} %`, bx + 150, y)
    }

    function drawStream(): void {
      const tip = flameTip()
      if (state === 'charging' || state === 'carrying') {
        const c = charge / MAX_CHARGE
        // ribbon from the flame to the orb through the recent trail
        const pts: [number, number][] = [tip, ...trail, [orbX, orbY]]
        const thin = 1 - clamp01(tension - 0.4) * 0.8
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.lineCap = 'round'
        g.lineJoin = 'round'
        for (const [wd, col, a] of [
          [14, WARM, 0.12],
          [5, WARM, 0.55],
          [1.8, HOT, 0.9],
        ] as const) {
          g.strokeStyle = rgba(tension > 0.85 ? mix(col, [255, 255, 255], 0.6) : col, a * (0.4 + 0.6 * c))
          g.lineWidth = wd * thin * (0.6 + 0.4 * c)
          g.beginPath()
          g.moveTo(pts[0][0], pts[0][1])
          for (let i = 1; i < pts.length - 1; i++) {
            const mx = (pts[i][0] + pts[i + 1][0]) / 2
            const my = (pts[i][1] + pts[i + 1][1]) / 2
            g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
          }
          g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
          g.stroke()
        }
        g.restore()
        // the orb of heat
        const r = 8 + c * 14
        const jit = tension > 0.7 && !rm ? (Math.random() - 0.5) * 4 * tension : 0
        glow(g, orbX + jit, orbY, r * 4, WARM, 0.5 + 0.3 * c)
        glow(g, orbX + jit, orbY, r * 1.6, HOT, 0.9)
        if (state === 'carrying' && mode === 'mouse') {
          // tension ring
          g.strokeStyle = tension > 0.75 ? `rgba(255,120,100,${0.5 + 0.5 * tension})` : `rgba(255,220,170,${0.2 + 0.4 * tension})`
          g.lineWidth = 2
          g.beginPath()
          g.arc(orbX, orbY, r * 2 + 6, -Math.PI / 2, -Math.PI / 2 + Math.min(1, tension) * Math.PI * 2)
          g.stroke()
        }
        if (mode === 'key') {
          // pace ring: press Right when it is full
          const pr = clamp01(paceT / PACE)
          g.strokeStyle = pr >= 0.999 ? 'rgba(255,230,170,0.95)' : 'rgba(255,220,170,0.4)'
          g.lineWidth = 2.5
          g.beginPath()
          g.arc(orbX, orbY, r * 2 + 8, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2)
          g.stroke()
          if (pr >= 0.999 && charge > 0.02) {
            // little key cap: "press Right now"
            const kx = orbX
            const ky = orbY - r * 2 - 26
            g.fillStyle = 'rgba(30,18,10,0.8)'
            g.strokeStyle = 'rgba(255,214,160,0.9)'
            g.lineWidth = 1.2
            g.beginPath()
            g.moveTo(kx - 9, ky - 11)
            g.arcTo(kx + 13, ky - 11, kx + 13, ky + 11, 4)
            g.arcTo(kx + 13, ky + 11, kx - 13, ky + 11, 4)
            g.arcTo(kx - 13, ky + 11, kx - 13, ky - 11, 4)
            g.arcTo(kx - 13, ky - 11, kx + 13, ky - 11, 4)
            g.closePath()
            g.fill()
            g.stroke()
            g.strokeStyle = 'rgba(255,236,200,1)'
            g.lineWidth = 2
            g.lineCap = 'round'
            g.beginPath()
            g.moveTo(kx - 6, ky)
            g.lineTo(kx + 6, ky)
            g.moveTo(kx + 1, ky - 5)
            g.lineTo(kx + 6, ky)
            g.lineTo(kx + 1, ky + 5)
            g.stroke()
            g.lineCap = 'butt'
          }
        }
      }
      if (state === 'delivering') {
        const k = easeOutCubic(clamp01(deliverT / 0.6))
        const x = lerp(deliverFrom[0], BX + 20, k)
        const y = lerp(deliverFrom[1], BY - 6, k)
        glow(g, x, y, 50 * (1 - k) + 20, WARM, 0.8 * (1 - k * 0.5))
        glow(g, BX + 10, BY, 90 * k, HOT, 0.5 * Math.sin(k * Math.PI))
      }
      for (const e of embers) glow(g, e.x, e.y, 3 + e.s * 2, EMBER, 0.25 * Math.sqrt(fuel) * (0.5 + 0.5 * Math.sin(e.p * 3)))
      for (const s of sparks) glow(g, s.x, s.y, s.s * 3.5, s.c, 1 - s.life / s.max)
      if (note) {
        const k = note.t / 1.4
        g.globalAlpha = clamp01(1 - k)
        g.font = 'italic 22px "EB Garamond", Georgia, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillStyle = rgba(note.c, 1)
        g.fillText(note.text, W / 2, 132 - k * 14)
        g.globalAlpha = 1
      }
    }

    // ------------------------------------------------------------------ loop
    ctx.loop((rawDt, time) => {
      const dt = Math.max(0, rawDt)
      fit()
      if (phase === 'play') {
        fuel = Math.max(0, fuel - PASSIVE * dt)
        if (state === 'charging') {
          const holdingOk = mode === 'mouse' ? pointerId !== null : spaceDown
          if (holdingOk && fuel > 0 && charge < MAX_CHARGE) {
            const d = Math.min(CHARGE_RATE * dt, MAX_CHARGE - charge, fuel)
            charge += d
            fuel -= d
          }
          const [tx, ty] = flameTip()
          if (mode === 'mouse') {
            // the orb gathers at the flame, a little drawn toward the hand
            orbX = lerp(orbX, tx + clamp01((px - tx) / 80) * 10, Math.min(1, dt * 10))
            orbY = lerp(orbY, ty - 10, Math.min(1, dt * 10))
            if (!nearFlame(px, py, 14)) {
              if (charge > 0.02) {
                state = 'carrying'
                trail.length = 0
                lastPX = px
                lastPY = py
                speed = 0
              } else {
                state = 'idle'
                charge = 0
              }
            }
          } else {
            orbX = lerp(orbX, PATH.x0, Math.min(1, dt * 10))
            orbY = lerp(orbY, PATH.y0, Math.min(1, dt * 10))
            paceT = Math.min(PACE * 2, paceT + dt)
          }
        } else if (state === 'carrying') {
          charge = Math.max(0, charge - charge * 0.04 * dt)
          if (mode === 'mouse') {
            const inst = Math.hypot(px - lastPX, py - lastPY) / Math.max(dt, 1 / 240)
            lastPX = px
            lastPY = py
            speed = lerp(speed, inst, Math.min(1, dt * 8))
            tension = speed / SPEED_LIMIT
            if (tension > 1) overT += dt
            else overT = Math.max(0, overT - dt * 2)
            orbX = lerp(orbX, px, Math.min(1, dt * 14))
            orbY = lerp(orbY, py, Math.min(1, dt * 14))
            const last = trail[trail.length - 1]
            if (!last || Math.hypot(last[0] - orbX, last[1] - orbY) > 14) {
              trail.push([orbX, orbY])
              if (trail.length > 40) trail.shift()
            }
            if (overT > 0.09) {
              say(TEXT.tooFast, [255, 140, 120])
              drop(true)
            } else if (nearBaby(orbX, orbY)) startDeliver()
          } else {
            paceT = Math.min(PACE * 2, paceT + dt)
            keyPos = lerp(keyPos, keyStep / STEPS, Math.min(1, dt * 9))
            const [x, y] = pathPt(keyPos)
            orbX = x
            orbY = y
            tension = 0
            const last = trail[trail.length - 1]
            if (!last || Math.hypot(last[0] - orbX, last[1] - orbY) > 10) trail.push([orbX, orbY])
          }
        } else if (state === 'delivering') {
          deliverT += dt
          const k = clamp01(deliverT / 0.6)
          const target = Math.min(1.05, warmth + deliverAmt)
          if (k >= 1) {
            warmth = Math.min(1, target)
            state = 'idle'
            trail.length = 0
            keyStep = 0
            keyPos = 0
            if (pointerId !== null) pointerId = null
            if (warmth >= 0.999) win()
          }
        } else {
          tension = Math.max(0, tension - dt * 3)
          // keyboard: keep holding Space and the next draw begins by itself
          if (mode === 'key' && spaceDown && fuel > 0 && pointerId === null) {
            state = 'charging'
            keyStep = 0
            keyPos = 0
            paceT = PACE
          }
        }
        if (fuel <= 0 && phase === 'play' && state !== 'delivering' && charge <= 0) lose()
      } else {
        endT += dt
      }
      if (phase === 'won') breath += dt
      shownWarmth += (warmth - shownWarmth) * Math.min(1, dt * 3)
      if (note) {
        note.t += dt
        if (note.t > 1.4) note = null
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life += dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vx *= 1 - dt * 2
        s.vy = s.vy * (1 - dt * 2) - dt * 30
        if (s.life > s.max) sparks.splice(i, 1)
      }
      for (const e of embers) {
        e.p += dt
        e.y -= dt * (14 + e.s * 10)
        e.x += Math.sin(e.p * 2) * dt * 8
        if (e.y < FY - 150 - e.s * 30) {
          e.y = FY - 20
          e.x = FX + (Math.random() - 0.5) * 20
        }
      }

      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawRoom(time)
      drawBaby(time)
      drawLamp(time)
      drawStream()
      drawWarmthMeter()
      // vignette
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.66)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.55)')
      g.fillStyle = vg
      g.fillRect(-20, -20, W + 40, H + 40)
    })
  })
}

registerMinigame('heal', () => ({ run: runHeal }))
