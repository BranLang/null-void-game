/**
 * FOCUS: ice from emptiness. "Ice comes from emptiness, not warmth."
 * Hold Space / the mouse button over a bowl of water and frost crystallises
 * from the centre outward. Thoughts drift in from the edges; flick them away
 * (click, or the arrow key of the side they come from) before their warmth
 * reaches the centre and melts the ice back.
 *
 * params: {
 *   difficulty?: 1 | 2 | 3          (default 1)
 *   thoughts?: L[]                   words that drift in (defaults below)
 *   duration?: number                seconds of concentration to freeze the bowl (default 14)
 *   title?: L, subtitle?: L
 *   stakes?: boolean                 a strain meter fills while holding; frost creeps over the
 *                                    screen edges; strain 100% = failure
 * }
 * result: { success, score: 0..1, data: { melts, misfires } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import { l, type L } from '../../i18n/i18n'

type RGB = readonly [number, number, number]

const W = 760
const H = 480
const CX = W / 2
const CY = H / 2 - 4
const R = 158

const TEXT = {
  title: l('Ľad z prázdnoty', 'Ice from Emptiness'),
  subtitle: l('Ľad neprichádza z tepla, ale z prázdnoty. Nemysli na nič.', 'Ice comes from emptiness, not warmth. Think of nothing.'),
  hint: l(
    'Drž medzerník alebo tlačidlo myši a sústreď sa. Myšlienky odožeň kliknutím alebo šípkou zo strany, z ktorej prichádzajú.',
    'Hold Space or the mouse button to concentrate. Flick thoughts away by clicking them, or with the arrow key for the side they come from.',
  ),
  stakesHint: l('Sleduj prepätie: keď stúpa priveľmi, na chvíľu povoľ.', 'Watch the strain: when it climbs too high, ease off for a moment.'),
  strain: l('Prepätie', 'Strain'),
  focus: l('Sústredenie', 'Focus'),
  done: l('Hladina stuhla. Ľad prišiel z prázdnoty.', 'The surface stills and sets. The ice came out of emptiness.'),
  failStrain: l('Chlad sa ti zarezal do rúk. Spira sa vzoprela.', 'The cold bites into your hands. The Spira rebels.'),
  failTime: l('Myseľ je príliš plná. Voda zostala vodou.', 'The mind is too full. The water stays water.'),
}

const DEFAULT_THOUGHTS: L[] = [
  l('Arkot', 'Arkot'),
  l('strach', 'fear'),
  l('otec', 'father'),
  l('Nikam', 'Nowhere'),
  l('srdce', 'heart'),
  l('domov', 'home'),
  l('prečo?', 'why?'),
]

const FROST: RGB = [207, 232, 255]
const WARM: RGB = [255, 170, 90]
const ICE_CORE: RGB = [240, 250, 255]

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const rgba = (c: RGB, a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

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

/** Frost texture: hexagonal dendrites over a pale crystalline wash (drawn once). */
function makeFrostTexture(dpr: number): HTMLCanvasElement {
  const size = R * 2 + 8
  const c = document.createElement('canvas')
  c.width = c.height = Math.ceil(size * dpr)
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  g.translate(size / 2, size / 2)
  g.beginPath()
  g.arc(0, 0, R, 0, Math.PI * 2)
  g.clip()
  const base = g.createRadialGradient(0, 0, 0, 0, 0, R)
  base.addColorStop(0, 'rgba(236,248,255,0.9)')
  base.addColorStop(0.45, 'rgba(196,226,250,0.62)')
  base.addColorStop(1, 'rgba(160,205,240,0.55)')
  g.fillStyle = base
  g.fillRect(-R, -R, R * 2, R * 2)
  const r = mulberry32(1234)
  for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * R
    g.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.35})`
    g.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1 + r() * 1.5, 1 + r() * 1.5)
  }
  g.lineCap = 'round'
  const dendrite = (x: number, y: number, ang: number, len: number, w: number, depth: number): void => {
    const x1 = x + Math.cos(ang) * len
    const y1 = y + Math.sin(ang) * len
    g.strokeStyle = `rgba(255,255,255,${0.45 + depth * 0.12})`
    g.lineWidth = w
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x1, y1)
    g.stroke()
    if (depth <= 0) return
    const n = 3 + Math.floor(r() * 3)
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1)
      const bx = x + (x1 - x) * t
      const by = y + (y1 - y) * t
      const bl = len * (0.38 - t * 0.22) * (0.8 + r() * 0.4)
      dendrite(bx, by, ang - Math.PI / 3, bl, w * 0.6, depth - 1)
      dendrite(bx, by, ang + Math.PI / 3, bl, w * 0.6, depth - 1)
    }
  }
  for (let k = 0; k < 6; k++) dendrite(0, 0, (k * Math.PI) / 3 + 0.2, R * 1.02, 2.6, 2)
  for (let k = 0; k < 6; k++) dendrite(0, 0, (k * Math.PI) / 3 + 0.2 + Math.PI / 6, R * 0.55, 1.6, 1)
  // scattered little star crystals
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2
    const d = R * (0.3 + r() * 0.68)
    const x = Math.cos(a) * d
    const y = Math.sin(a) * d
    const s = 5 + r() * 9
    for (let k = 0; k < 6; k++) dendrite(x, y, (k * Math.PI) / 3 + a, s, 1, 0)
  }
  // centre medallion
  const cg = g.createRadialGradient(0, 0, 0, 0, 0, 40)
  cg.addColorStop(0, 'rgba(255,255,255,0.95)')
  cg.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = cg
  g.fillRect(-40, -40, 80, 80)
  return c
}

// ---------------------------------------------------------------------------
// game
// ---------------------------------------------------------------------------

type Side = 0 | 1 | 2 | 3 // left, right, top, bottom

interface Thought {
  text: string
  side: Side
  x: number
  y: number
  vx: number
  vy: number
  w: number
  state: 'in' | 'flick' | 'melt'
  t: number
  wob: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  c: RGB
}

const SIDE_KEYS: Record<string, Side> = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 }

function runFocus(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const difficulty = params.difficulty === 2 || params.difficulty === 3 ? params.difficulty : 1
  const custom = Array.isArray(params.thoughts) ? params.thoughts.filter(isL) : []
  const thoughts = custom.length ? custom : DEFAULT_THOUGHTS
  const duration = typeof params.duration === 'number' && params.duration > 1 ? params.duration : 14
  const stakes = params.stakes === true
  const title = isL(params.title) ? params.title : TEXT.title
  const subtitle = isL(params.subtitle) ? params.subtitle : TEXT.subtitle
  const rm = ctx.assist.reducedMotion
  const spawnEvery = [3.4, 2.5, 1.8][difficulty - 1]
  const travel = [7.5, 6.0, 4.8][difficulty - 1]
  const maxActive = [2, 3, 4][difficulty - 1]
  const timeLimit = duration * 4 + 20
  const hintText = () => ctx.t(TEXT.hint) + (stakes ? ' ' + ctx.t(TEXT.stakesHint) : '')

  return new Promise<MinigameResult>((resolve) => {
    const card = createCard(ctx, title, subtitle)
    card.hint.textContent = hintText()
    card.buttons.style.minHeight = '44px'
    const { canvas, ctx: g } = hiDpiCanvas(W, H)
    const dpr = canvas.width / W
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'crosshair'
    card.body.appendChild(canvas)
    const fit = makeFitter(canvas, card.card, W, H)

    // full-screen layers: warm pulse + (stakes) frost creeping over the edges
    const warmEl = document.createElement('div')
    warmEl.style.cssText =
      'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:3;background:radial-gradient(ellipse at center, rgba(255,150,70,0) 35%, rgba(255,120,40,0.42) 100%);mix-blend-mode:screen'
    ctx.root.appendChild(warmEl)
    let edge: HTMLCanvasElement | null = null
    let eg: CanvasRenderingContext2D | null = null
    let edgeSegs: number[] = []
    let edgeW = 0
    let edgeH = 0
    if (stakes) {
      edge = document.createElement('canvas')
      edge.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2'
      ctx.root.appendChild(edge)
      eg = edge.getContext('2d')!
    }
    const buildEdge = () => {
      if (!edge) return
      edgeW = window.innerWidth
      edgeH = window.innerHeight
      edge.width = edgeW
      edge.height = edgeH
      edgeSegs = []
      const r = mulberry32(77)
      const md = Math.min(edgeW, edgeH)
      // frost ferns: a slightly wandering stem with side branches at 60 degrees
      const fern = (x: number, y: number, ang: number, len: number, w: number, dist: number, depth: number): void => {
        const steps = Math.max(2, Math.round(len / 9))
        const st = len / steps
        let px = x
        let py = y
        let a = ang
        for (let i = 0; i < steps; i++) {
          a += (r() - 0.5) * 0.14
          const nx = px + Math.cos(a) * st
          const ny = py + Math.sin(a) * st
          const d = dist + (i + 1) * st
          edgeSegs.push(px, py, nx, ny, d / md, w)
          if (depth > 0 && i % 2 === 1) {
            const bl = len * 0.45 * (1 - i / steps) * (0.7 + r() * 0.5)
            if (bl > 5) {
              fern(nx, ny, a - Math.PI / 3, bl, w * 0.7, d, depth - 1)
              fern(nx, ny, a + Math.PI / 3, bl, w * 0.7, d, depth - 1)
            }
          }
          px = nx
          py = ny
        }
      }
      const count = Math.round((edgeW + edgeH) / 22)
      for (let i = 0; i < count; i++) {
        const t = r()
        const side = Math.floor(r() * 4)
        const len = md * (0.07 + r() * 0.2)
        const jit = (r() - 0.5) * 0.9
        if (side === 0) fern(t * edgeW, -2, Math.PI / 2 + jit, len, 1.4, 0, 2)
        else if (side === 1) fern(t * edgeW, edgeH + 2, -Math.PI / 2 + jit, len, 1.4, 0, 2)
        else if (side === 2) fern(-2, t * edgeH, jit, len, 1.4, 0, 2)
        else fern(edgeW + 2, t * edgeH, Math.PI + jit, len, 1.4, 0, 2)
      }
    }
    buildEdge()

    // focus / strain meters (DOM, under the canvas) in stakes mode
    const meters = document.createElement('div')
    meters.style.cssText =
      'display:flex;gap:18px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:10px;font-family:var(--nv-font-title);font-size:12px;letter-spacing:.14em;color:var(--nv-text-dim);text-transform:uppercase'
    const mkMeter = (label: L, color: string) => {
      const wrap = document.createElement('div')
      wrap.style.cssText = 'display:flex;gap:8px;align-items:center'
      const lab = document.createElement('span')
      lab.textContent = ctx.t(label)
      const bar = document.createElement('div')
      bar.style.cssText = 'width:150px;height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06)'
      const fill = document.createElement('div')
      fill.style.cssText = `height:100%;width:0%;background:${color};box-shadow:0 0 8px ${color};transition:background .3s`
      bar.appendChild(fill)
      wrap.append(lab, bar)
      meters.appendChild(wrap)
      return fill
    }
    const focusFill = stakes ? mkMeter(TEXT.focus, 'var(--nv-frost)') : null
    const strainFill = stakes ? mkMeter(TEXT.strain, '#9fd0ff') : null
    if (stakes) card.body.appendChild(meters)

    const frostTex = makeFrostTexture(dpr)

    // ------------------------------------------------------------------ state
    let progress = 0
    let shown = 0
    let strain = 0
    let calm = 0
    let elapsed = 0
    let spawnT = 1.6
    let melts = 0
    let misfires = 0
    let failures = 0
    let warm = 0
    let shake = 0
    let phase: 'play' | 'won' | 'lost' = 'play'
    let wonT = 0
    let lastText = ''
    let spaceDown = false
    const pointers = new Set<number>()
    const list: Thought[] = []
    const sparks: Spark[] = []
    const ripples: { x: number; y: number; t: number }[] = []
    const motes = Array.from({ length: rm ? 12 : 34 }, () => ({ a: Math.random() * Math.PI * 2, d: R + 40 + Math.random() * 220, s: 0.5 + Math.random() * 1.5 }))

    const holding = () => phase === 'play' && (spaceDown || pointers.size > 0)

    const extraListeners: [string, EventListener][] = []
    const listen = (type: string, fn: EventListener) => {
      window.addEventListener(type, fn)
      extraListeners.push([type, fn])
    }
    const finish = (r: MinigameResult) => {
      for (const [t, fn] of extraListeners) window.removeEventListener(t, fn)
      resolve(r)
    }

    const measure = (text: string): number => {
      g.font = 'italic 500 26px "EB Garamond", Georgia, serif'
      return g.measureText(text).width
    }

    function spawn(): void {
      const active = list.filter((t) => t.state === 'in').length
      if (active >= maxActive) return
      let idx = Math.floor(Math.random() * thoughts.length)
      if (thoughts.length > 1 && ctx.t(thoughts[idx]) === lastText) idx = (idx + 1) % thoughts.length
      const text = ctx.t(thoughts[idx])
      lastText = text
      // prefer a side that is free
      const busy = new Set(list.filter((t) => t.state === 'in').map((t) => t.side))
      const free = ([0, 1, 2, 3] as Side[]).filter((s) => !busy.has(s))
      const pool = free.length ? free : ([0, 1, 2, 3] as Side[])
      const side = pool[Math.floor(Math.random() * pool.length)]
      const w = measure(text)
      let x: number
      let y: number
      if (side === 0) {
        x = -w / 2 - 40
        y = CY + (Math.random() - 0.5) * 220
      } else if (side === 1) {
        x = W + w / 2 + 40
        y = CY + (Math.random() - 0.5) * 220
      } else if (side === 2) {
        x = CX + (Math.random() - 0.5) * 300
        y = -24
      } else {
        x = CX + (Math.random() - 0.5) * 300
        y = H + 24
      }
      const dist = Math.hypot(CX - x, CY - y)
      const sp = dist / (travel * (0.9 + Math.random() * 0.2))
      list.push({ text, side, x, y, vx: ((CX - x) / dist) * sp, vy: ((CY - y) / dist) * sp, w, state: 'in', t: 0, wob: Math.random() * 10 })
    }

    function burst(x: number, y: number, c: RGB, n: number, speed: number): void {
      for (let i = 0; i < (rm ? Math.ceil(n / 3) : n); i++) {
        const a = Math.random() * Math.PI * 2
        const sp = speed * (0.3 + Math.random())
        sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.5 + Math.random() * 0.7, size: 1 + Math.random() * 2.2, c })
      }
    }

    function flick(t: Thought): void {
      t.state = 'flick'
      t.t = 0
      const dx = t.x - CX
      const dy = t.y - CY
      const d = Math.hypot(dx, dy) || 1
      t.vx = (dx / d) * 900
      t.vy = (dy / d) * 900
      burst(t.x, t.y, FROST, 14, 160)
      ctx.sfx('whoosh')
    }

    function melt(t: Thought): void {
      t.state = 'melt'
      t.t = 0
      melts++
      progress = Math.max(0, progress - 0.25)
      warm = 1
      if (!rm) shake = 0.35
      burst(CX, CY, WARM, 30, 200)
      ctx.sfx('fire')
    }

    function lose(reason: L): void {
      phase = 'lost'
      failures++
      for (const t of list) if (t.state === 'in') flick(t)
      ctx.sfx('crack')
      ctx.sfx('fail')
      card.hint.textContent = ctx.t(reason)
      card.hint.style.color = 'var(--nv-danger)'
      card.buttons.replaceChildren()
      card.buttons.appendChild(button(ctx.t(UI_STRINGS.retry), restart, true))
      if (ctx.assist.skipAllowed) card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      fit(true)
    }

    function win(): void {
      phase = 'won'
      wonT = 0
      for (const t of list) if (t.state === 'in') flick(t)
      ctx.sfx('ice')
      ctx.sfx('success')
      burst(CX, CY, ICE_CORE, 60, 320)
      ripples.push({ x: CX, y: CY, t: 0 })
      const score = Math.max(0.1, Math.min(1, 1 - melts * 0.15 - misfires * 0.03 - failures * 0.1))
      card.hint.textContent = ctx.t(TEXT.done)
      card.hint.style.color = 'var(--nv-frost)'
      card.buttons.replaceChildren()
      card.buttons.appendChild(button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score: Math.round(score * 100) / 100, data: { melts, misfires } }), true))
      fit(true)
    }

    function restart(): void {
      progress = 0
      shown = 0
      strain = 0
      elapsed = 0
      spawnT = 1.6
      list.length = 0
      phase = 'play'
      card.hint.textContent = hintText()
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
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      if (phase !== 'play') return
      pointers.add(e.pointerId)
      const [x, y] = toLocal(e)
      // flick the closest thought under the pointer (generous hit box, larger for touch)
      const pad = e.pointerType === 'touch' ? 26 : 14
      let best: Thought | null = null
      let bd = Infinity
      for (const t of list) {
        if (t.state !== 'in') continue
        if (Math.abs(x - t.x) < t.w / 2 + pad + 18 && Math.abs(y - t.y) < 18 + pad) {
          const d = Math.hypot(x - t.x, y - t.y)
          if (d < bd) {
            bd = d
            best = t
          }
        }
      }
      if (best) flick(best)
    })
    const release = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
    }
    ctx.root.addEventListener('pointerup', release)
    ctx.root.addEventListener('pointercancel', release)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    const pressFirstButton = () => card.buttons.querySelector('button')?.click()
    ctx.onKey((e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (phase === 'won' && !e.repeat && wonT > 0.6) {
          pressFirstButton()
          return
        }
        spaceDown = true
        return
      }
      if (e.code === 'Enter' && !e.repeat && ((phase === 'won' && wonT > 0.6) || phase === 'lost')) {
        e.preventDefault()
        pressFirstButton()
        return
      }
      const side = SIDE_KEYS[e.code]
      if (side === undefined) return
      e.preventDefault()
      if (phase !== 'play' || e.repeat) return
      let best: Thought | null = null
      let bd = Infinity
      for (const t of list) {
        if (t.state !== 'in' || t.side !== side) continue
        const d = Math.hypot(t.x - CX, t.y - CY)
        if (d < bd) {
          bd = d
          best = t
        }
      }
      if (best) flick(best)
      else {
        // a stray flick costs a little stillness
        misfires++
        progress = Math.max(0, progress - 0.03)
        warm = Math.max(warm, 0.25)
      }
    })
    listen('keyup', ((e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown = false
    }) as EventListener)
    listen('blur', () => {
      spaceDown = false
      pointers.clear()
    })

    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__nvFocus = {
        danger: (r = 190) => list.filter((t) => t.state === 'in' && Math.hypot(t.x - CX, t.y - CY) < r).map((t) => t.side),
        first: () => {
          const t = list.find((q) => q.state === 'in' && q.t > 0.4 && q.x > 20 && q.x < W - 20 && q.y > 20 && q.y < H - 20)
          return t ? [t.x + t.vx * 0.08, t.y + t.vy * 0.08] : null
        },
        state: () => ({ phase, progress: Math.round(progress * 100) / 100, strain: Math.round(strain * 100) / 100, melts, misfires }),
      }
    }

    // ------------------------------------------------------------------ drawing
    const jag = Array.from({ length: 72 }, (_, i) => 1 + 0.045 * Math.sin(i * 1.7) + 0.03 * Math.sin(i * 4.3 + 1) + (mulberry32(i + 9)() - 0.5) * 0.05)
    const frostPath = (rad: number) => {
      g.beginPath()
      for (let i = 0; i < jag.length; i++) {
        const a = (i / jag.length) * Math.PI * 2
        const rr = Math.min(R, rad * jag[i])
        if (i === 0) g.moveTo(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr)
        else g.lineTo(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr)
      }
      g.closePath()
    }

    function drawBowl(time: number): void {
      // table / backdrop
      const bg = g.createRadialGradient(CX, CY, 40, CX, CY, W * 0.62)
      bg.addColorStop(0, '#141a26')
      bg.addColorStop(1, '#05060a')
      g.fillStyle = bg
      g.fillRect(0, 0, W, H)
      // motes drifting toward the bowl when calm
      for (const m of motes) {
        const x = CX + Math.cos(m.a) * m.d
        const y = CY + Math.sin(m.a) * m.d * 0.8
        glow(g, x, y, 4 + m.s * 3, FROST, 0.1 + calm * 0.18)
      }
      // shadow under the bowl
      const sh = g.createRadialGradient(CX, CY + 18, R * 0.7, CX, CY + 18, R * 1.35)
      sh.addColorStop(0, 'rgba(0,0,0,0.6)')
      sh.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = sh
      g.fillRect(0, 0, W, H)
      // rim (old bronze)
      const rim = g.createLinearGradient(CX - R, CY - R, CX + R, CY + R)
      rim.addColorStop(0, '#8a6a3c')
      rim.addColorStop(0.5, '#3c2c1a')
      rim.addColorStop(1, '#1c140c')
      g.fillStyle = rim
      g.beginPath()
      g.arc(CX, CY, R + 16, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = 'rgba(243,217,149,0.35)'
      g.lineWidth = 1.2
      g.beginPath()
      g.arc(CX, CY, R + 15, 0, Math.PI * 2)
      g.stroke()
      // engraved runes on the rim
      g.save()
      g.translate(CX, CY)
      g.strokeStyle = 'rgba(20,12,6,0.7)'
      g.lineWidth = 1.2
      for (let i = 0; i < 36; i++) {
        g.rotate(Math.PI / 18)
        g.beginPath()
        g.moveTo(R + 5, -2)
        g.lineTo(R + 11, i % 3 === 0 ? 3 : 1)
        g.stroke()
      }
      g.restore()
      // water
      g.save()
      g.beginPath()
      g.arc(CX, CY, R, 0, Math.PI * 2)
      g.clip()
      const wg = g.createRadialGradient(CX - R * 0.3, CY - R * 0.35, 10, CX, CY, R)
      wg.addColorStop(0, '#1d3d55')
      wg.addColorStop(0.6, '#0d2234')
      wg.addColorStop(1, '#050d16')
      g.fillStyle = wg
      g.fillRect(CX - R, CY - R, R * 2, R * 2)
      // ripples: agitated when the mind is busy, still when calm
      const agit = 1 - calm * 0.85
      g.lineWidth = 1.2
      for (let i = 0; i < 5; i++) {
        const p = (time * (0.12 + agit * 0.2) + i / 5) % 1
        const ox = Math.sin(i * 2.1) * R * 0.35
        const oy = Math.cos(i * 1.3) * R * 0.3
        g.strokeStyle = `rgba(150,210,255,${(1 - p) * 0.12 * agit})`
        g.beginPath()
        g.ellipse(CX + ox, CY + oy, p * R * 0.9, p * R * 0.8, 0, 0, Math.PI * 2)
        g.stroke()
      }
      for (const rp of ripples) {
        const p = rp.t / 1.2
        g.strokeStyle = `rgba(220,240,255,${0.5 * (1 - p)})`
        g.lineWidth = 2
        g.beginPath()
        g.arc(rp.x, rp.y, 10 + p * R * 1.3, 0, Math.PI * 2)
        g.stroke()
      }
      // moonlight highlight
      g.fillStyle = 'rgba(200,230,255,0.06)'
      g.beginPath()
      g.ellipse(CX - R * 0.35, CY - R * 0.42, R * 0.42, R * 0.16, -0.5, 0, Math.PI * 2)
      g.fill()
      // frost
      const rad = shown * R * 1.12
      if (rad > 1) {
        g.save()
        frostPath(rad)
        g.clip()
        g.drawImage(frostTex, CX - R - 4, CY - R - 4, R * 2 + 8, R * 2 + 8)
        g.restore()
        g.save()
        g.globalCompositeOperation = 'lighter'
        frostPath(rad)
        g.strokeStyle = `rgba(220,240,255,${0.35 + 0.25 * Math.sin(time * 6)})`
        g.lineWidth = 2.5
        g.stroke()
        g.restore()
      }
      // the centre of stillness
      glow(g, CX, CY, 40 + calm * 50, ICE_CORE, 0.1 + calm * 0.35)
      g.restore()
      // inner rim shadow
      const inner = g.createRadialGradient(CX, CY, R * 0.82, CX, CY, R)
      inner.addColorStop(0, 'rgba(0,0,0,0)')
      inner.addColorStop(1, 'rgba(0,0,0,0.45)')
      g.fillStyle = inner
      g.beginPath()
      g.arc(CX, CY, R, 0, Math.PI * 2)
      g.fill()
      // progress ring
      const pr = R + 30
      g.lineCap = 'round'
      g.strokeStyle = 'rgba(207,232,255,0.1)'
      g.lineWidth = 5
      g.beginPath()
      g.arc(CX, CY, pr, 0, Math.PI * 2)
      g.stroke()
      if (shown > 0.002) {
        g.strokeStyle = 'rgba(207,232,255,0.95)'
        g.lineWidth = 4
        g.beginPath()
        g.arc(CX, CY, pr, -Math.PI / 2, -Math.PI / 2 + shown * Math.PI * 2)
        g.stroke()
        const ea = -Math.PI / 2 + shown * Math.PI * 2
        glow(g, CX + Math.cos(ea) * pr, CY + Math.sin(ea) * pr, 16, FROST, 0.8)
      }
      g.lineCap = 'butt'
      // percentage
      g.fillStyle = 'rgba(207,232,255,0.6)'
      g.font = '600 13px Cinzel, serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(`${phase === 'won' ? 100 : Math.min(99, Math.floor(shown * 100))} %`, CX, CY + pr + 20)
    }

    function drawArrowKey(x: number, y: number, side: Side, a: number): void {
      const s = 22
      g.save()
      g.globalAlpha = a
      g.fillStyle = 'rgba(30,18,10,0.75)'
      g.strokeStyle = 'rgba(255,214,160,0.75)'
      g.lineWidth = 1.2
      g.beginPath()
      g.moveTo(x - s / 2 + 4, y - s / 2)
      g.arcTo(x + s / 2, y - s / 2, x + s / 2, y + s / 2, 4)
      g.arcTo(x + s / 2, y + s / 2, x - s / 2, y + s / 2, 4)
      g.arcTo(x - s / 2, y + s / 2, x - s / 2, y - s / 2, 4)
      g.arcTo(x - s / 2, y - s / 2, x + s / 2, y - s / 2, 4)
      g.closePath()
      g.fill()
      g.stroke()
      g.translate(x, y)
      g.rotate([Math.PI, 0, -Math.PI / 2, Math.PI / 2][side])
      g.strokeStyle = 'rgba(255,230,190,0.95)'
      g.lineWidth = 1.8
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(-5, 0)
      g.lineTo(5, 0)
      g.moveTo(1, -4)
      g.lineTo(5, 0)
      g.lineTo(1, 4)
      g.stroke()
      g.restore()
    }

    function drawThoughts(time: number): void {
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      for (const t of list) {
        const a = t.state === 'in' ? clamp01(t.t * 2) : clamp01(1 - t.t / 0.45)
        if (a <= 0) continue
        const d = Math.hypot(t.x - CX, t.y - CY)
        const near = clamp01(1 - (d - 40) / (R * 1.1))
        const jx = rm ? 0 : Math.sin(time * 9 + t.wob) * near * 1.5
        glow(g, t.x, t.y, t.w * 0.75 + 20, WARM, a * (0.18 + near * 0.3))
        g.save()
        g.globalAlpha = a
        g.font = 'italic 500 26px "EB Garamond", Georgia, serif'
        g.fillStyle = t.state === 'flick' ? 'rgba(220,240,255,0.9)' : `rgb(255,${Math.round(214 - near * 50)},${Math.round(160 - near * 70)})`
        g.fillText(t.text, t.x + jx, t.y)
        g.restore()
        if (t.state === 'in') {
          const off = t.w / 2 + 22
          const kx = t.side === 0 ? t.x - off : t.side === 1 ? t.x + off : t.x
          const ky = t.side === 2 ? t.y - 26 : t.side === 3 ? t.y + 26 : t.y
          drawArrowKey(kx, ky, t.side, a)
        }
      }
    }

    function drawEdgeFrost(): void {
      if (!edge || !eg) return
      if (window.innerWidth !== edgeW || window.innerHeight !== edgeH) buildEdge()
      eg.clearRect(0, 0, edgeW, edgeH)
      const s = clamp01(strain)
      if (s <= 0.01) return
      const md = Math.min(edgeW, edgeH)
      const reach = s * 0.3
      const vg = eg.createRadialGradient(edgeW / 2, edgeH / 2, md * (0.6 - s * 0.22), edgeW / 2, edgeH / 2, Math.hypot(edgeW, edgeH) / 2)
      vg.addColorStop(0, 'rgba(200,230,255,0)')
      vg.addColorStop(1, `rgba(214,238,255,${0.1 + s * 0.42})`)
      eg.fillStyle = vg
      eg.fillRect(0, 0, edgeW, edgeH)
      eg.lineCap = 'round'
      // three width buckets, one path each
      for (const [lo, hi, a] of [
        [1.2, 9, 0.75],
        [0.85, 1.2, 0.6],
        [0, 0.85, 0.45],
      ] as const) {
        eg.strokeStyle = `rgba(232,246,255,${a * (0.3 + s * 0.7)})`
        eg.lineWidth = lo > 1 ? 1.4 : lo > 0.5 ? 1 : 0.7
        eg.beginPath()
        for (let i = 0; i < edgeSegs.length; i += 6) {
          const w = edgeSegs[i + 5]
          if (w < lo || w >= hi || edgeSegs[i + 4] > reach) continue
          eg.moveTo(edgeSegs[i], edgeSegs[i + 1])
          eg.lineTo(edgeSegs[i + 2], edgeSegs[i + 3])
        }
        eg.stroke()
      }
    }

    // ------------------------------------------------------------------ loop
    ctx.loop((rawDt, time) => {
      const dt = Math.max(0, rawDt)
      fit()
      const hold = holding()
      calm += ((hold ? 1 : 0) - calm) * Math.min(1, dt * 3)
      if (phase === 'play') {
        elapsed += dt
        if (hold) progress = Math.min(1, progress + dt / duration)
        else progress = Math.max(0, progress - dt * 0.015)
        if (stakes) {
          if (hold) strain += dt / (duration * 1.55)
          else strain = Math.max(0, strain - dt * 0.12)
          if (strain >= 1) {
            strain = 1
            lose(TEXT.failStrain)
          }
        }
        spawnT -= dt
        if (spawnT <= 0) {
          spawn()
          spawnT = spawnEvery * (0.75 + Math.random() * 0.5)
        }
        if (progress >= 1 && phase === 'play') win()
        else if (elapsed > timeLimit && phase === 'play') lose(TEXT.failTime)
        if (hold && Math.random() < dt * 14 && !rm) {
          const a = Math.random() * Math.PI * 2
          const d = R * (0.2 + Math.random() * 0.9) * Math.max(0.15, shown)
          sparks.push({ x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, vx: 0, vy: -6, life: 0, max: 0.6, size: 1 + Math.random(), c: ICE_CORE })
        }
      } else if (phase === 'won') {
        wonT += dt
        progress = 1
        shown = Math.min(1, shown + dt * 2)
      } else if (stakes) {
        strain = Math.max(0, strain - dt * 0.4)
      }
      shown += (progress - shown) * Math.min(1, dt * 6)
      // thoughts
      for (let i = list.length - 1; i >= 0; i--) {
        const t = list[i]
        t.t += dt
        if (t.state === 'in') {
          const wob = Math.sin(t.t * 2 + t.wob) * (difficulty === 3 ? 18 : 8)
          t.x += t.vx * dt + (t.side < 2 ? 0 : wob * dt)
          t.y += t.vy * dt + (t.side < 2 ? wob * dt : 0)
          if (Math.hypot(t.x - CX, t.y - CY) < 26 && phase === 'play') melt(t)
        } else {
          t.x += t.vx * dt
          t.y += t.vy * dt
          if (t.state === 'melt') {
            t.vx *= 0.9
            t.vy *= 0.9
          }
          if (t.t > 0.5) list.splice(i, 1)
        }
      }
      // fx
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life += dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vx *= 1 - dt * 2.5
        s.vy *= 1 - dt * 2.5
        if (s.life > s.max) sparks.splice(i, 1)
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += dt
        if (ripples[i].t > 1.2) ripples.splice(i, 1)
      }
      for (const m of motes) {
        m.d -= dt * (8 + calm * 40) * m.s
        m.a += dt * 0.05
        if (m.d < R + 10) m.d = R + 120 + Math.random() * 200
      }
      warm = Math.max(0, warm - dt * 1.6)
      shake = Math.max(0, shake - dt)
      warmEl.style.opacity = String(warm)
      card.card.style.transform = shake > 0 ? `translate(${(Math.random() - 0.5) * 14 * shake}px, ${(Math.random() - 0.5) * 10 * shake}px)` : ''
      if (focusFill) focusFill.style.width = `${Math.round(shown * 100)}%`
      if (strainFill) {
        strainFill.style.width = `${Math.round(clamp01(strain) * 100)}%`
        strainFill.style.background = strain > 0.8 ? '#ff7a8a' : strain > 0.6 ? '#ffd08a' : '#9fd0ff'
      }
      // draw
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawBowl(time)
      drawThoughts(time)
      for (const s of sparks) glow(g, s.x, s.y, s.size * 4, s.c, 1 - s.life / s.max)
      if (phase === 'won') {
        const k = easeOutCubic(clamp01(wonT / 0.8))
        glow(g, CX, CY, R * (0.6 + k * 1.2), ICE_CORE, 0.6 * (1 - k) + 0.12)
      }
      if (hold) {
        g.fillStyle = `rgba(0,0,0,${0.12 * calm})`
        g.fillRect(0, 0, W, H)
      }
      drawEdgeFrost()
    })
  })
}

registerMinigame('focus', () => ({ run: runFocus }))
