/**
 * CRYSTAL: harvesting Spira crystals in the outer ruins of Kitsune.
 *
 * Violet Spira crystals grow from the ribs of old skeletons. They must be
 * pulled with pliers ALONG the growth grain, pressing without twisting;
 * across the grain they crack and drain to grey. Each crystal's faint grain
 * lines (not its outer shape, which can lie) show the way. Drag from the
 * crystal outward along the grain (±22°), or press the matching direction
 * key (QWE/AD/ZXC, numpad, or arrows incl. two-arrow diagonals).
 * A watcher shadow grows at the edge of the ruin; cracking makes noise and
 * draws it closer. If it fills before enough crystals are in the jar: "Run!".
 *
 * params: { need?: number (default 3, of 5), time?: number (seconds, default 60) }
 * result: { success, score: good / 5, data: { good } }
 *         skipped: { success: true, score: 0, data: { skipped: true } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import type { L } from '../../i18n/i18n'

const S = {
  title: { sk: 'Žatva kryštálov', en: 'Crystal Harvest' },
  sub: {
    sk: '„Pozdĺž vlákna. Nikdy naprieč.“ Kryštály Spiry rastú z rebier starých kostier v strašidelných ruinách Kitsune.',
    en: '"Along the grain. Never across." Spira crystals grow from the ribs of old skeletons in the haunted ruins of Kitsune.',
  },
  hint: {
    sk: 'Chyť kryštál kliešťami a ťahaj von pozdĺž jemných línií vlákna. Tvar kryštálu môže klamať. Klávesy: 1–5 výber · Q W E / A D / Z X C (alebo šípky, numerická klávesnica) smer ťahu',
    en: 'Grip a crystal with the pliers and pull outward along its faint grain lines. The crystal’s shape can lie. Keys: 1–5 select · Q W E / A D / Z X C (or arrows, numpad) pull direction',
  },
  enough: {
    sk: 'Dosť kryštálov. Môžeš odísť, alebo riskovať ďalšie, kým si ťa tieň nevšimne.',
    en: 'Enough crystals. Leave now, or risk more before the shadow notices you.',
  },
  leave: { sk: 'Odísť s kryštálmi (L)', en: 'Leave with the crystals (L)' },
  clean: { sk: 'čistý', en: 'clean' },
  cracked: { sk: 'praskol', en: 'cracked' },
  run: { sk: 'Utekaj!', en: 'Run!' },
  watcher: { sk: 'strážca', en: 'watcher' },
  failWatch: { sk: 'Strážca ťa zbadal skôr, než bol pohár plný.', en: 'The watcher noticed you before the jar was full.' },
  failCrack: { sk: 'Priveľa kryštálov zošedlo. Spira z nich vyprchala.', en: 'Too many crystals drained to grey. The Spira bled out of them.' },
  win: { sk: '{n} čistých kryštálov v pohári. Pozdĺž vlákna, nikdy naprieč.', en: '{n} clean crystals in the jar. Along the grain, never across.' },
  winRun: { sk: 'Utekaj! S {n} kryštálmi v pohári sa vytratíš z ruín.', en: 'Run! You slip out of the ruins with {n} crystals in the jar.' },
} satisfies Record<string, L>

const W = 800
const H = 480
const TOTAL = 5
const TOL = 22
const DEG = Math.PI / 180
const RIB = [
  { x: 95, y: 455 },
  { x: 150, y: 75 },
  { x: 560, y: 35 },
  { x: 655, y: 445 },
]
const RIB_T = [0.12, 0.3, 0.5, 0.7, 0.88]
const RIB_SIDE: (1 | -1)[] = [1, -1, 1, -1, 1]
const RIB_HALF = 17
const JAR = { x: 745, y: 384 }
const EYE = { x: 738, y: 44 }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const angDiff = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180)
const snap45 = (a: number) => Math.round(a / 45) * 45

type RGB = [number, number, number]
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = (a: RGB, b: RGB, t: number, alpha = 1) =>
  `rgba(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))},${alpha})`
const VIOLET = { base: hex('#3d1474'), mid: hex('#9257ff'), tip: hex('#ecd8ff') }
const GREY = { base: hex('#303036'), mid: hex('#64646c'), tip: hex('#a3a3aa') }

function bez(t: number): { x: number; y: number } {
  const u = 1 - t
  const [a, b, c, d] = RIB
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}
function bezD(t: number): { x: number; y: number } {
  const u = 1 - t
  const [a, b, c, d] = RIB
  return {
    x: 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x),
    y: 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y),
  }
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Crack {
  pts: { x: number; y: number }[]
}

interface Crystal {
  bx: number
  by: number
  /** pull direction along the grain, math degrees (0 = right, 90 = up) */
  grain: number
  /** visual growth axis, math degrees */
  axis: number
  len: number
  wid: number
  state: 'idle' | 'flying' | 'jar' | 'cracked'
  /** 0..1 progress of the fly / crack animation */
  t: number
  drain: number
  cracks: Crack[]
  shake: number
  nubs: { a: number; d: number; l: number }[]
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
}

interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
}

// --------------------------------------------------------------------------- static art
function buildBackground(): HTMLCanvasElement {
  const r = Math.min(2, window.devicePixelRatio || 1)
  const c = document.createElement('canvas')
  c.width = Math.round(W * r)
  c.height = Math.round(H * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  const rnd = mulberry(11)
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#120f1b')
  bg.addColorStop(1, '#07060b')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  // back wall stones
  for (let row = 0; row < 12; row++) {
    const y = row * 34
    const off = row % 2 ? 30 : 0
    for (let x = -off; x < W; x += 60 + rnd() * 20) {
      const w = 56 + rnd() * 18
      const l = 30 + rnd() * 18
      g.fillStyle = `rgba(${l + 8},${l + 4},${l + 18},${0.32 + rnd() * 0.12})`
      g.fillRect(x + 2, y + 2, w - 4, 30)
    }
  }
  // arches (dark openings with moonlight)
  for (const ax of [250, 560]) {
    g.save()
    g.beginPath()
    g.moveTo(ax - 70, 330)
    g.lineTo(ax - 70, 150)
    g.arc(ax, 150, 70, Math.PI, 0)
    g.lineTo(ax + 70, 330)
    g.closePath()
    const ag = g.createLinearGradient(0, 80, 0, 330)
    ag.addColorStop(0, '#1b2440')
    ag.addColorStop(1, '#05040a')
    g.fillStyle = ag
    g.fill()
    g.strokeStyle = 'rgba(120,110,150,0.25)'
    g.lineWidth = 6
    g.stroke()
    g.restore()
  }
  // faint ribs of the rest of the skeleton
  g.strokeStyle = 'rgba(150,140,125,0.07)'
  g.lineCap = 'round'
  for (let k = 0; k < 5; k++) {
    g.lineWidth = 16 - k * 2
    g.beginPath()
    g.moveTo(40 + k * 150, 470)
    g.bezierCurveTo(70 + k * 150, 200, 260 + k * 120, 120 + k * 10, 330 + k * 120, 470)
    g.stroke()
  }
  // light shafts
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (const [x0, w0] of [
    [180, 70],
    [420, 50],
    [600, 60],
  ]) {
    const sg = g.createLinearGradient(x0, 0, x0 + 120, H)
    sg.addColorStop(0, 'rgba(140,150,255,0.10)')
    sg.addColorStop(1, 'rgba(140,150,255,0)')
    g.fillStyle = sg
    g.beginPath()
    g.moveTo(x0, 0)
    g.lineTo(x0 + w0, 0)
    g.lineTo(x0 + w0 + 160, H)
    g.lineTo(x0 + 110, H)
    g.closePath()
    g.fill()
  }
  g.restore()
  // floor and rubble
  const fl = g.createLinearGradient(0, 400, 0, H)
  fl.addColorStop(0, 'rgba(10,8,14,0)')
  fl.addColorStop(1, 'rgba(10,8,14,0.95)')
  g.fillStyle = fl
  g.fillRect(0, 380, W, 100)
  for (let k = 0; k < 60; k++) {
    const x = rnd() * W
    const y = 440 + rnd() * 40
    const s = 3 + rnd() * 9
    g.fillStyle = `rgba(${50 + rnd() * 30},${45 + rnd() * 25},${60 + rnd() * 30},0.6)`
    g.beginPath()
    g.moveTo(x - s, y)
    g.lineTo(x - s * 0.3, y - s * 0.8)
    g.lineTo(x + s, y - s * 0.3)
    g.lineTo(x + s * 0.6, y + s * 0.4)
    g.closePath()
    g.fill()
  }
  // moss
  for (let k = 0; k < 140; k++) {
    g.fillStyle = `rgba(80,120,70,${0.05 + rnd() * 0.1})`
    g.beginPath()
    g.arc(rnd() * W, 300 + rnd() * 180, 1 + rnd() * 3, 0, Math.PI * 2)
    g.fill()
  }
  // the rib
  const ribPath = () => {
    g.beginPath()
    g.moveTo(RIB[0].x, RIB[0].y)
    g.bezierCurveTo(RIB[1].x, RIB[1].y, RIB[2].x, RIB[2].y, RIB[3].x, RIB[3].y)
  }
  g.lineCap = 'round'
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.7)'
  g.shadowBlur = 16
  g.shadowOffsetY = 10
  g.strokeStyle = '#a99b7e'
  g.lineWidth = RIB_HALF * 2
  ribPath()
  g.stroke()
  g.restore()
  g.strokeStyle = '#c4b697'
  g.lineWidth = RIB_HALF * 2 - 4
  ribPath()
  g.stroke()
  g.save()
  g.translate(0, -7)
  g.strokeStyle = 'rgba(255,248,226,0.32)'
  g.lineWidth = 9
  ribPath()
  g.stroke()
  g.restore()
  g.save()
  g.translate(0, 8)
  g.strokeStyle = 'rgba(70,56,40,0.35)'
  g.lineWidth = 10
  ribPath()
  g.stroke()
  g.restore()
  // pits and cracks along the bone
  for (let k = 0; k < 40; k++) {
    const t = 0.03 + rnd() * 0.94
    const p = bez(t)
    const d = bezD(t)
    const n = Math.hypot(d.x, d.y)
    const nx = -d.y / n
    const ny = d.x / n
    const off = (rnd() - 0.5) * RIB_HALF * 1.3
    g.fillStyle = `rgba(80,64,46,${0.2 + rnd() * 0.25})`
    g.beginPath()
    g.ellipse(p.x + nx * off, p.y + ny * off, 1 + rnd() * 2.5, 0.8 + rnd() * 1.5, Math.atan2(d.y, d.x), 0, Math.PI * 2)
    g.fill()
  }
  // joint knob at the start, broken end at the finish
  const kg = g.createRadialGradient(RIB[0].x - 6, RIB[0].y - 8, 4, RIB[0].x, RIB[0].y, 26)
  kg.addColorStop(0, '#e6dabd')
  kg.addColorStop(1, '#8c7e62')
  g.fillStyle = kg
  g.beginPath()
  g.ellipse(RIB[0].x, RIB[0].y, 26, 20, -0.3, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = 'rgba(60,46,30,0.6)'
  g.beginPath()
  g.ellipse(RIB[0].x + 4, RIB[0].y + 2, 6, 4, -0.3, 0, Math.PI * 2)
  g.fill()
  const e = RIB[3]
  g.fillStyle = '#2a2420'
  g.beginPath()
  g.moveTo(e.x - 16, e.y - 4)
  g.lineTo(e.x - 6, e.y + 6)
  g.lineTo(e.x + 2, e.y - 2)
  g.lineTo(e.x + 12, e.y + 8)
  g.lineTo(e.x + 18, e.y - 6)
  g.lineTo(e.x + 18, e.y + 20)
  g.lineTo(e.x - 16, e.y + 20)
  g.closePath()
  g.fill()
  // vignette
  const vg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 560)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.55)')
  g.fillStyle = vg
  g.fillRect(0, 0, W, H)
  return c
}

// --------------------------------------------------------------------------- crystal generation
function generate(rnd: () => number): Crystal[] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const offsets = [-30, -15, 0, 15, 30].sort(() => rnd() - 0.5)
    const out: Crystal[] = []
    let ok = true
    for (let i = 0; i < TOTAL; i++) {
      const t = RIB_T[i]
      const p = bez(t)
      const d = bezD(t)
      const n = Math.hypot(d.x, d.y)
      // normal pointing away from the arch interior (outer side)
      let nx = d.y / n
      let ny = -d.x / n
      if (nx * (375 - p.x) + ny * (420 - p.y) > 0) {
        nx = -nx
        ny = -ny
      }
      nx *= RIB_SIDE[i]
      ny *= RIB_SIDE[i]
      const nDeg = Math.atan2(-ny, nx) / DEG
      let grain = snap45(nDeg + (rnd() - 0.5) * 100)
      if (angDiff(grain, nDeg) > 67.5) grain = snap45(nDeg)
      grain += (rnd() - 0.5) * 12
      let axis = grain + offsets[i]
      if (angDiff(axis, nDeg) > 72) axis = grain - offsets[i]
      const bx = p.x + nx * (RIB_HALF - 5)
      const by = p.y + ny * (RIB_HALF - 5)
      let len = 80 + rnd() * 16
      const ax = Math.cos(axis * DEG)
      const ay = -Math.sin(axis * DEG)
      // keep the tip on screen and away from the jar and the eye
      for (let k = 0; k < 20; k++) {
        const tx = bx + ax * len
        const ty = by + ay * len
        const bad = tx < 14 || tx > W - 14 || ty < 14 || ty > H - 30 || Math.hypot(tx - JAR.x, ty - JAR.y) < 80 || Math.hypot(tx - EYE.x, ty - EYE.y) < 60
        if (!bad) break
        len -= 4
      }
      if (len < 60) ok = false
      const nubs = Array.from({ length: 3 }, () => ({ a: axis + (rnd() - 0.5) * 120, d: (rnd() - 0.5) * 22, l: 9 + rnd() * 9 }))
      out.push({ bx, by, grain, axis, len, wid: 26 + rnd() * 5, state: 'idle', t: 0, drain: 0, cracks: [], shake: 0, nubs })
    }
    const dirs = new Set(out.map((c) => ((snap45(c.grain) % 360) + 360) % 360))
    if (ok && dirs.size >= 3) return out
  }
  // deterministic fallback (never expected)
  return RIB_T.map((t, i) => {
    const p = bez(t)
    const g = [135, 315, 90, 225, 45][i]
    return { bx: p.x, by: p.y, grain: g, axis: g, len: 80, wid: 28, state: 'idle', t: 0, drain: 0, cracks: [], shake: 0, nubs: [] }
  })
}

function makeCracks(c: Crystal, rnd: () => number): Crack[] {
  const cracks: Crack[] = []
  const main: Crack = { pts: [{ x: c.len * 0.15, y: (rnd() - 0.5) * c.wid * 0.4 }] }
  let a = (rnd() - 0.5) * 0.8
  for (let k = 0; k < 6; k++) {
    const last = main.pts[main.pts.length - 1]
    a += (rnd() - 0.5) * 1.2
    main.pts.push({ x: last.x + Math.cos(a) * c.len * 0.14, y: last.y + Math.sin(a) * c.len * 0.14 })
  }
  cracks.push(main)
  for (let b = 0; b < 3; b++) {
    const from = main.pts[1 + Math.floor(rnd() * 4)]
    const br: Crack = { pts: [from] }
    let ba = (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.8)
    for (let k = 0; k < 3; k++) {
      const last = br.pts[br.pts.length - 1]
      ba += (rnd() - 0.5) * 0.8
      br.pts.push({ x: last.x + Math.cos(ba) * c.len * 0.1, y: last.y + Math.sin(ba) * c.len * 0.1 })
    }
    cracks.push(br)
  }
  return cracks
}

/** crystal outline in local coordinates (axis along +x) */
function crystalPath(g: CanvasRenderingContext2D, L: number, w: number): void {
  g.beginPath()
  g.moveTo(0, -w / 2)
  g.lineTo(L * 0.7, -w * 0.47)
  g.lineTo(L, 0)
  g.lineTo(L * 0.7, w * 0.47)
  g.lineTo(0, w / 2)
  g.closePath()
}

// --------------------------------------------------------------------------- the minigame
function runCrystal(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  const need = Math.round(Math.min(TOTAL, Math.max(1, num(params.need, 3))))
  const timeLimit = Math.max(10, num(params.time, 60))
  const reduced = ctx.assist.reducedMotion

  return new Promise<MinigameResult>((resolve) => {
    let finished = false
    const cleanups: (() => void)[] = []
    const finish = (r: MinigameResult) => {
      if (finished) return
      finished = true
      for (const c of cleanups) c()
      resolve(r)
    }

    const card = createCard(ctx, S.title, S.sub)
    card.card.style.width = 'min(880px, 94vw)'
    card.hint.textContent = ctx.t(S.hint)
    card.buttons.style.minHeight = '42px'
    const { canvas, ctx: g } = hiDpiCanvas(W, H)
    canvas.style.touchAction = 'none'
    canvas.style.display = 'block'
    canvas.style.margin = '0 auto'
    const fit = () => {
      const s = Math.max(0.4, Math.min(1, (window.innerWidth * 0.94 - 60) / W, (window.innerHeight * 0.92 - 250) / H))
      canvas.style.width = `${Math.round(W * s)}px`
      canvas.style.height = `${Math.round(H * s)}px`
    }
    fit()
    window.addEventListener('resize', fit)
    cleanups.push(() => window.removeEventListener('resize', fit))
    card.body.appendChild(canvas)

    const bgArt = buildBackground()
    let rnd = mulberry((Math.random() * 1e9) | 0)

    // ------------------------------------------------------------------ state
    let crystals = generate(rnd)
    // dev builds expose the grain angles for automated play-tests
    const debugGrain = () => {
      if (import.meta.env.DEV) {
        canvas.dataset.debug = JSON.stringify(
          crystals.map((c) => ({ grain: Math.round(c.grain), x: Math.round(c.bx + Math.cos(c.axis * DEG) * c.len * 0.5), y: Math.round(c.by - Math.sin(c.axis * DEG) * c.len * 0.5) })),
        )
      }
    }
    debugGrain()
    let good = 0
    let elapsed = 0
    let noise = 0
    let surge = 0
    let selected = 0
    let hover = -1
    let mode: 'play' | 'ending' | 'ended' = 'play'
    let announced = false
    let endText: { text: string; color: string; t: number } | null = null
    let grip: { i: number; x0: number; y0: number; x: number; y: number } | null = null
    let jarFlash = 0
    let shakeScreen = 0
    let heartAcc = 0
    let failures = 0
    const particles: Particle[] = []
    const floats: FloatText[] = []

    const progress = () => clamp01((elapsed + noise) / timeLimit)
    const remaining = () => crystals.filter((c) => c.state === 'idle').length

    function nextSelectable(from: number, dir: number): number {
      for (let k = 1; k <= TOTAL; k++) {
        const i = (((from + dir * k) % TOTAL) + TOTAL) % TOTAL
        if (crystals[i].state === 'idle') return i
      }
      return from
    }

    function tipOf(c: Crystal): { x: number; y: number } {
      return { x: c.bx + Math.cos(c.axis * DEG) * c.len, y: c.by - Math.sin(c.axis * DEG) * c.len }
    }

    function hitCrystal(x: number, y: number): number {
      let best = -1
      let bestD = 1e9
      crystals.forEach((c, i) => {
        if (c.state !== 'idle') return
        const t = tipOf(c)
        const vx = t.x - c.bx
        const vy = t.y - c.by
        const u = clamp01(((x - c.bx) * vx + (y - c.by) * vy) / (vx * vx + vy * vy))
        const d = Math.hypot(x - (c.bx + vx * u), y - (c.by + vy * u))
        if (d < c.wid / 2 + 12 && d < bestD) {
          bestD = d
          best = i
        }
      })
      return best
    }

    function burst(x: number, y: number, n: number, color: string, speed: number): void {
      if (reduced) n = Math.ceil(n / 3)
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2
        const sp = speed * (0.3 + Math.random())
        const max = 0.4 + Math.random() * 0.7
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: max, max, color, size: 1 + Math.random() * 2 })
      }
    }

    function pull(i: number, angle: number): void {
      if (mode !== 'play') return
      const c = crystals[i]
      if (!c || c.state !== 'idle') return
      const center = { x: c.bx + Math.cos(c.axis * DEG) * c.len * 0.5, y: c.by - Math.sin(c.axis * DEG) * c.len * 0.5 }
      if (angDiff(angle, c.grain) <= TOL) {
        c.state = 'flying'
        c.t = 0
        good++
        ctx.sfx('whoosh')
        floats.push({ x: center.x, y: center.y - 10, text: `+1 ${ctx.t(S.clean)}`, color: '#d8b8ff', life: 1.2 })
        burst(c.bx, c.by, 18, 'rgba(200,160,255,1)', 90)
      } else {
        c.state = 'cracked'
        c.t = 0
        c.cracks = makeCracks(c, rnd)
        noise += 6
        surge = 1
        shakeScreen = reduced ? 0 : 0.35
        ctx.sfx('crack')
        setTimeout(() => {
          if (!finished) ctx.sfx('heartbeat')
        }, 260)
        floats.push({ x: center.x, y: center.y - 10, text: ctx.t(S.cracked), color: '#c9c9d2', life: 1.2 })
        burst(center.x, center.y, 22, 'rgba(170,170,180,1)', 70)
      }
      if (crystals[selected].state !== 'idle') selected = nextSelectable(selected, 1)
      checkEnd()
    }

    function checkEnd(): void {
      if (mode !== 'play') return
      if (good >= need && !announced) {
        announced = true
        card.hint.textContent = ctx.t(S.enough)
        card.hint.style.color = 'var(--nv-violet)'
        const leave = button(ctx.t(S.leave), () => win(false), true)
        card.buttons.replaceChildren(leave)
      }
      const rem = remaining()
      if (good + rem < need) {
        lose(ctx.t(S.failCrack), false)
        return
      }
      if (rem === 0) {
        if (good >= need) setTimeout(() => win(false), 1150)
        else lose(ctx.t(S.failCrack), false)
      }
    }

    function win(running: boolean): void {
      if (mode !== 'play') return
      mode = 'ended'
      grip = null
      endText = running ? { text: ctx.t(S.run), color: '#ff5a6a', t: 0 } : null
      ctx.sfx('success')
      card.hint.textContent = ctx.t(running ? S.winRun : S.win, { n: good })
      card.hint.style.color = running ? 'var(--nv-danger)' : 'var(--nv-violet)'
      const score = Math.round((good / TOTAL) * 100) / 100
      const cont = button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { good } }), true)
      card.buttons.replaceChildren(cont)
      cont.focus()
    }

    function lose(msg: string, running: boolean): void {
      if (mode !== 'play') return
      mode = 'ended'
      grip = null
      failures++
      endText = running ? { text: ctx.t(S.run), color: '#ff5a6a', t: 0 } : null
      ctx.sfx('fail')
      card.hint.textContent = `${msg} ${ctx.t(UI_STRINGS.failed)}`
      card.hint.style.color = 'var(--nv-danger)'
      const retry = button(ctx.t(UI_STRINGS.retry), reset, true)
      card.buttons.replaceChildren(retry)
      if (ctx.assist.skipAllowed && failures >= 1) {
        card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      }
      retry.focus()
    }

    function reset(): void {
      rnd = mulberry((Math.random() * 1e9) | 0)
      crystals = generate(rnd)
      debugGrain()
      good = 0
      elapsed = 0
      noise = 0
      surge = 0
      selected = 0
      announced = false
      endText = null
      grip = null
      mode = 'play'
      particles.length = 0
      floats.length = 0
      card.hint.textContent = ctx.t(S.hint)
      card.hint.style.color = ''
      card.buttons.replaceChildren()
    }

    // ------------------------------------------------------------------ input
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (mode !== 'play') return
      const p = local(e)
      const i = hitCrystal(p.x, p.y)
      if (i < 0) return
      e.preventDefault()
      selected = i
      grip = { i, x0: p.x, y0: p.y, x: p.x, y: p.y }
      canvas.setPointerCapture(e.pointerId)
      ctx.sfx('click')
    })
    canvas.addEventListener('pointermove', (e) => {
      const p = local(e)
      if (!grip) {
        hover = mode === 'play' ? hitCrystal(p.x, p.y) : -1
        canvas.style.cursor = hover >= 0 ? 'grab' : 'default'
        return
      }
      grip.x = p.x
      grip.y = p.y
      const dx = p.x - grip.x0
      const dy = p.y - grip.y0
      if (Math.hypot(dx, dy) >= 64) {
        const i = grip.i
        grip = null
        pull(i, Math.atan2(-dy, dx) / DEG)
      }
    })
    const release = () => {
      if (!grip) return
      const dx = grip.x - grip.x0
      const dy = grip.y - grip.y0
      const i = grip.i
      grip = null
      if (Math.hypot(dx, dy) >= 26) pull(i, Math.atan2(-dy, dx) / DEG)
    }
    canvas.addEventListener('pointerup', release)
    canvas.addEventListener('pointercancel', () => {
      grip = null
    })

    const KEY_DIR: Record<string, number> = {
      KeyQ: 135,
      KeyW: 90,
      KeyE: 45,
      KeyA: 180,
      KeyD: 0,
      KeyZ: 225,
      KeyX: 270,
      KeyC: 315,
      Numpad7: 135,
      Numpad8: 90,
      Numpad9: 45,
      Numpad4: 180,
      Numpad6: 0,
      Numpad1: 225,
      Numpad2: 270,
      Numpad3: 315,
    }
    const ARROW: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
    let arrowBuf: [number, number] | null = null
    let arrowTimer = 0
    ctx.onKey((e) => {
      if (finished) return
      if (e.code === 'KeyL' && announced && mode === 'play') {
        win(false)
        e.preventDefault()
        return
      }
      if (mode !== 'play') return
      if (/^Digit[1-5]$/.test(e.code)) {
        const i = Number(e.code.slice(5)) - 1
        if (crystals[i].state === 'idle') selected = i
        e.preventDefault()
        return
      }
      if (e.code === 'Tab') {
        selected = nextSelectable(selected, e.shiftKey ? -1 : 1)
        e.preventDefault()
        return
      }
      if (e.repeat) return
      if (e.code in KEY_DIR) {
        pull(selected, KEY_DIR[e.code])
        e.preventDefault()
        return
      }
      const v = ARROW[e.key]
      if (v) {
        e.preventDefault()
        if (arrowBuf) {
          arrowBuf = [arrowBuf[0] + v[0], arrowBuf[1] + v[1]]
          return
        }
        arrowBuf = [v[0], v[1]]
        arrowTimer = window.setTimeout(() => {
          const b = arrowBuf
          arrowBuf = null
          if (!b || (b[0] === 0 && b[1] === 0)) return
          pull(selected, Math.atan2(Math.sign(b[1]), Math.sign(b[0])) / DEG)
        }, 110)
      }
    })
    cleanups.push(() => window.clearTimeout(arrowTimer))

    // ------------------------------------------------------------------ drawing helpers
    function drawCrystal(c: Crystal, i: number, time: number, x: number, y: number, rot: number, scale: number): void {
      const L = c.len
      const w = c.wid
      const drain = c.drain
      const hot = (i === hover || i === selected || grip?.i === i) && c.state === 'idle' && mode === 'play'
      g.save()
      g.translate(x, y)
      g.rotate(rot)
      g.scale(scale, scale)
      // outer glow
      if (drain < 1) {
        g.save()
        g.shadowColor = `rgba(183,125,255,${(1 - drain) * (hot ? 0.95 : 0.65)})`
        g.shadowBlur = hot ? 26 : 16
        crystalPath(g, L, w)
        g.fillStyle = mix(VIOLET.mid, GREY.mid, drain)
        g.fill()
        g.restore()
      }
      // body gradient
      const body = g.createLinearGradient(0, 0, L, 0)
      body.addColorStop(0, mix(VIOLET.base, GREY.base, drain))
      body.addColorStop(0.55, mix(VIOLET.mid, GREY.mid, drain))
      body.addColorStop(1, mix(VIOLET.tip, GREY.tip, drain))
      crystalPath(g, L, w)
      g.fillStyle = body
      g.fill()
      g.save()
      crystalPath(g, L, w)
      g.clip()
      // facet: lighter upper half
      g.fillStyle = `rgba(255,255,255,${0.12 * (1 - drain * 0.5)})`
      g.beginPath()
      g.moveTo(0, -w / 2)
      g.lineTo(L * 0.7, -w * 0.47)
      g.lineTo(L, 0)
      g.lineTo(0, 0)
      g.closePath()
      g.fill()
      // inner core glow
      if (drain < 1) {
        const core = g.createRadialGradient(L * 0.45, 0, 2, L * 0.45, 0, L * 0.6)
        core.addColorStop(0, `rgba(255,235,255,${0.35 * (1 - drain)})`)
        core.addColorStop(1, 'rgba(255,235,255,0)')
        g.fillStyle = core
        g.fillRect(0, -w, L, w * 2)
      }
      // grain lines, at the grain angle relative to the axis
      if (c.state === 'idle' || c.state === 'cracked') {
        const rel = -(c.grain - c.axis) * DEG
        g.save()
        g.rotate(rel)
        const alpha = (hot ? 0.5 : 0.2) * (1 - drain * 0.7)
        for (let k = -7; k <= 7; k++) {
          const yy = k * 5
          g.strokeStyle = `rgba(238,222,255,${alpha})`
          g.lineWidth = 1
          g.beginPath()
          g.moveTo(-L, yy)
          g.lineTo(L * 1.4, yy)
          g.stroke()
          if (c.state === 'idle' && !reduced) {
            const s = ((time * 34 + (k + 8) * 17) % (L * 1.6)) - L * 0.3
            const sg = g.createLinearGradient(s - 10, 0, s + 10, 0)
            sg.addColorStop(0, 'rgba(255,255,255,0)')
            sg.addColorStop(0.5, `rgba(255,255,255,${alpha * 1.4})`)
            sg.addColorStop(1, 'rgba(255,255,255,0)')
            g.strokeStyle = sg
            g.lineWidth = 1.6
            g.beginPath()
            g.moveTo(s - 10, yy)
            g.lineTo(s + 10, yy)
            g.stroke()
          }
        }
        g.restore()
      }
      // cracks
      if (c.cracks.length) {
        const prog = clamp01(c.t / 0.3)
        g.strokeStyle = 'rgba(20,16,26,0.9)'
        g.lineWidth = 1.6
        for (const cr of c.cracks) {
          const nSeg = cr.pts.length - 1
          const upto = prog * nSeg
          g.beginPath()
          g.moveTo(cr.pts[0].x, cr.pts[0].y)
          for (let k = 1; k <= nSeg; k++) {
            if (k <= upto) g.lineTo(cr.pts[k].x, cr.pts[k].y)
            else {
              const u = upto - (k - 1)
              if (u > 0) g.lineTo(lerp(cr.pts[k - 1].x, cr.pts[k].x, u), lerp(cr.pts[k - 1].y, cr.pts[k].y, u))
              break
            }
          }
          g.stroke()
        }
      }
      g.restore()
      // edge
      crystalPath(g, L, w)
      g.strokeStyle = mix(hex('#f0e0ff'), hex('#9a9aa2'), drain, 0.55)
      g.lineWidth = 1
      g.stroke()
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(L, 0)
      g.strokeStyle = mix(hex('#ffffff'), hex('#b0b0b8'), drain, 0.25)
      g.stroke()
      g.restore()
    }

    function drawNubs(c: Crystal): void {
      for (const n of c.nubs) {
        g.save()
        const px = c.bx + Math.cos((c.axis + 90) * DEG) * n.d
        const py = c.by - Math.sin((c.axis + 90) * DEG) * n.d
        g.translate(px, py)
        g.rotate(-n.a * DEG)
        crystalPath(g, n.l, n.l * 0.45)
        g.fillStyle = mix(VIOLET.mid, GREY.mid, c.state === 'cracked' ? c.drain : 0, 0.85)
        g.fill()
        g.restore()
      }
    }

    function drawJar(time: number): void {
      const { x, y } = JAR
      g.save()
      // contents
      const shown = crystals.filter((c) => c.state === 'jar').length
      for (let k = 0; k < shown; k++) {
        g.save()
        g.translate(x - 18 + (k % 3) * 18, y + 40 - Math.floor(k / 3) * 22)
        g.rotate(-1.3 + k * 0.7)
        g.shadowColor = 'rgba(183,125,255,0.9)'
        g.shadowBlur = 12
        crystalPath(g, 28, 12)
        const cg = g.createLinearGradient(0, 0, 28, 0)
        cg.addColorStop(0, '#5a24a8')
        cg.addColorStop(1, '#efdcff')
        g.fillStyle = cg
        g.fill()
        g.restore()
      }
      // glow inside
      const glow = shown / Math.max(need, 1)
      if (glow > 0 || jarFlash > 0) {
        const jg = g.createRadialGradient(x, y + 20, 4, x, y + 20, 70)
        jg.addColorStop(0, `rgba(183,125,255,${Math.min(0.6, 0.18 * glow + 0.5 * jarFlash + 0.05 * Math.sin(time * 3))})`)
        jg.addColorStop(1, 'rgba(183,125,255,0)')
        g.fillStyle = jg
        g.fillRect(x - 70, y - 50, 140, 140)
      }
      // glass
      g.beginPath()
      g.moveTo(x - 24, y - 52)
      g.lineTo(x + 24, y - 52)
      g.quadraticCurveTo(x + 26, y - 40, x + 38, y - 30)
      g.quadraticCurveTo(x + 44, y - 24, x + 44, y - 10)
      g.lineTo(x + 44, y + 56)
      g.quadraticCurveTo(x + 44, y + 66, x + 32, y + 66)
      g.lineTo(x - 32, y + 66)
      g.quadraticCurveTo(x - 44, y + 66, x - 44, y + 56)
      g.lineTo(x - 44, y - 10)
      g.quadraticCurveTo(x - 44, y - 24, x - 38, y - 30)
      g.quadraticCurveTo(x - 26, y - 40, x - 24, y - 52)
      g.closePath()
      g.fillStyle = 'rgba(180,200,230,0.07)'
      g.fill()
      g.strokeStyle = 'rgba(200,220,255,0.45)'
      g.lineWidth = 1.5
      g.stroke()
      g.fillStyle = 'rgba(255,255,255,0.12)'
      g.fillRect(x - 36, y - 18, 5, 66)
      // cork
      g.fillStyle = '#8a6440'
      g.fillRect(x - 22, y - 64, 44, 14)
      g.fillStyle = 'rgba(0,0,0,0.25)'
      g.fillRect(x - 22, y - 54, 44, 4)
      // label
      g.font = '600 15px Cinzel, serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = good >= need ? '#e6ccff' : '#d6b26a'
      g.fillText(`${shown} / ${need}`, x, y + 82)
      g.restore()
    }

    function drawWatcher(p: number, time: number): void {
      const reach = 30 + p * 330 + surge * 50
      g.save()
      for (let k = 0; k < 8; k++) {
        const y = ((k + 0.5) * H) / 8 + Math.sin(time * 0.6 + k * 1.7) * 18
        const r = reach * (0.75 + 0.25 * Math.sin(time * 1.1 + k * 2.3))
        const gr = g.createRadialGradient(0, y, 0, 0, y, r)
        gr.addColorStop(0, 'rgba(3,1,6,0.97)')
        gr.addColorStop(0.55, 'rgba(6,3,12,0.75)')
        gr.addColorStop(1, 'rgba(6,3,12,0)')
        g.fillStyle = gr
        g.fillRect(0, y - r, r, r * 2)
      }
      // tendrils: tapered, wavy strands creeping out of the mass
      g.lineCap = 'round'
      for (let k = 0; k < 9; k++) {
        const y0 = 30 + k * 52 + Math.sin(time * 0.7 + k * 1.3) * 12
        const len = reach * (0.75 + 0.4 * (0.5 + 0.5 * Math.sin(time * 0.6 + k * 1.9)))
        const amp = 10 + 14 * Math.sin(k * 2.7) ** 2
        let px = 0
        let py = y0
        const N = 14
        for (let sgm = 1; sgm <= N; sgm++) {
          const u = sgm / N
          const x = len * u
          const y = y0 + Math.sin(u * 4.2 + time * 1.6 + k * 2.2) * amp * u + Math.sin(time * 0.9 + k) * 6 * u
          g.strokeStyle = `rgba(3,1,7,${0.85 * (1 - u * 0.75)})`
          g.lineWidth = 11 * (1 - u) + 1
          g.beginPath()
          g.moveTo(px, py)
          g.lineTo(x, y)
          g.stroke()
          px = x
          py = y
        }
      }
      // eyes
      const ea = clamp01((p - 0.3) / 0.25)
      if (ea > 0) {
        const blink = Math.sin(time * 0.9) > 0.985 ? 0.1 : 1
        const ex = reach * 0.5
        const ey = H * 0.4 + Math.sin(time * 0.5) * 8
        for (const dx of [-15, 15]) {
          g.save()
          g.shadowColor = `rgba(200,230,255,${ea})`
          g.shadowBlur = 14
          g.fillStyle = `rgba(215,235,255,${0.85 * ea})`
          g.beginPath()
          g.ellipse(ex + dx, ey, 6, 2.6 * blink, dx > 0 ? -0.15 : 0.15, 0, Math.PI * 2)
          g.fill()
          g.restore()
        }
      }
      // creeping darkness over everything
      const dg = g.createLinearGradient(0, 0, W, 0)
      dg.addColorStop(0, `rgba(0,0,0,${0.35 * p})`)
      dg.addColorStop(1, `rgba(0,0,0,${0.15 * p})`)
      g.fillStyle = dg
      g.fillRect(0, 0, W, H)
      g.restore()
    }

    function drawEyeMeter(p: number): void {
      const { x, y } = EYE
      g.save()
      const open = Math.max(0.06, p)
      g.beginPath()
      g.moveTo(x - 36, y)
      g.quadraticCurveTo(x, y - 30 * open, x + 36, y)
      g.quadraticCurveTo(x, y + 30 * open, x - 36, y)
      g.closePath()
      g.save()
      g.clip()
      const iris = g.createRadialGradient(x, y, 1, x, y, 13)
      const danger = clamp01((p - 0.6) / 0.4)
      iris.addColorStop(0, '#000')
      iris.addColorStop(0.35, mix(hex('#b77dff'), hex('#ff4a5a'), danger))
      iris.addColorStop(1, mix(hex('#3a1a60'), hex('#5a0a14'), danger))
      g.fillStyle = 'rgba(230,225,240,0.85)'
      g.fillRect(x - 38, y - 30, 76, 60)
      g.fillStyle = iris
      g.beginPath()
      g.arc(x, y, 14, 0, Math.PI * 2)
      g.fill()
      g.restore()
      g.strokeStyle = danger > 0 ? `rgba(255,120,130,${0.6 + 0.4 * danger})` : 'rgba(230,220,240,0.7)'
      g.lineWidth = 2
      g.stroke()
      g.font = '600 9px Cinzel, serif'
      g.textAlign = 'center'
      g.fillStyle = 'rgba(230,220,240,0.6)'
      g.fillText(ctx.t(S.watcher).toUpperCase(), x, y + 34)
      g.restore()
    }

    function drawPliers(c: Crystal, gx: number, gy: number): void {
      const ax = Math.cos(c.axis * DEG)
      const ay = -Math.sin(c.axis * DEG)
      const jx = c.bx + ax * 16
      const jy = c.by + ay * 16
      const ang = Math.atan2(gy - jy, gx - jx)
      const dist = Math.max(30, Math.hypot(gx - jx, gy - jy))
      g.save()
      g.translate(jx, jy)
      g.rotate(ang)
      g.lineCap = 'round'
      // handles
      for (const s of [-1, 1]) {
        g.strokeStyle = '#2b2018'
        g.lineWidth = 6
        g.beginPath()
        g.moveTo(10, s * 3)
        g.quadraticCurveTo(dist * 0.6, s * 10, dist, s * 15)
        g.stroke()
        g.strokeStyle = '#b8893e'
        g.lineWidth = 3
        g.beginPath()
        g.moveTo(10, s * 3)
        g.quadraticCurveTo(dist * 0.6, s * 10, dist, s * 15)
        g.stroke()
      }
      // jaws
      g.fillStyle = '#c9a050'
      g.beginPath()
      g.arc(10, 0, 4, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = '#d8b46a'
      g.lineWidth = 3
      for (const s of [-1, 1]) {
        g.beginPath()
        g.moveTo(10, 0)
        g.quadraticCurveTo(0, s * 9, -8, s * 6)
        g.stroke()
      }
      g.restore()
    }

    // ------------------------------------------------------------------ main loop
    ctx.loop((dt, time) => {
      if (mode === 'play') {
        elapsed += dt
        const p = progress()
        if (p >= 1) {
          if (good >= need) win(true)
          else lose(ctx.t(S.failWatch), true)
        } else if (p > 0.7) {
          heartAcc += dt
          const period = lerp(1.4, 0.6, (p - 0.7) / 0.3)
          if (heartAcc > period) {
            heartAcc = 0
            ctx.sfx('heartbeat')
          }
        }
      }
      surge = Math.max(0, surge - dt * 1.5)
      jarFlash = Math.max(0, jarFlash - dt * 1.6)
      shakeScreen = Math.max(0, shakeScreen - dt)

      g.save()
      if (shakeScreen > 0) g.translate((Math.random() - 0.5) * 8 * shakeScreen, (Math.random() - 0.5) * 8 * shakeScreen)
      g.drawImage(bgArt, 0, 0, W, H)

      // crystals
      crystals.forEach((c, i) => {
        if (c.state === 'jar') return
        if (c.state === 'cracked') {
          c.t += dt
          c.drain = clamp01((c.t - 0.15) / 1.2)
        }
        drawNubs(c)
        if (c.state === 'flying') {
          c.t += dt / (reduced ? 0.5 : 0.95)
          const slide = clamp01(c.t / 0.18)
          const u = clamp01((c.t - 0.18) / 0.82)
          const ax = Math.cos(c.grain * DEG)
          const ay = -Math.sin(c.grain * DEG)
          const sx = c.bx + ax * 14 * slide
          const sy = c.by + ay * 14 * slide
          const ex = JAR.x - 14
          const ey = JAR.y - 40
          const cx = (sx + ex) / 2
          const cy = Math.min(sy, ey) - 150
          const e = u * u * (3 - 2 * u)
          const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * ex
          const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * ey
          const rot = -c.axis * DEG + e * Math.PI * 3
          drawCrystal(c, i, time, x, y, rot, 1 - 0.6 * e)
          if (u > 0 && !reduced) particles.push({ x, y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, life: 0.5, max: 0.5, color: 'rgba(200,160,255,1)', size: 2 })
          if (c.t >= 1) {
            c.state = 'jar'
            jarFlash = 1
            ctx.sfx('chime')
            burst(JAR.x, JAR.y - 30, 16, 'rgba(220,190,255,1)', 60)
          }
          return
        }
        let ox = 0
        let oy = 0
        if (grip && grip.i === i) {
          const dx = grip.x - grip.x0
          const dy = grip.y - grip.y0
          const d = Math.hypot(dx, dy)
          if (d > 0) {
            const k = Math.min(d, 60) * 0.07
            ox = (dx / d) * k
            oy = (dy / d) * k
          }
        }
        drawCrystal(c, i, time, c.bx + ox, c.by + oy, -c.axis * DEG, 1)
        // number label
        if (c.state === 'idle' && mode === 'play') {
          const lx = c.bx - Math.cos(c.axis * DEG) * 16
          const ly = c.by + Math.sin(c.axis * DEG) * 16
          const sel = i === selected
          g.fillStyle = sel ? 'rgba(243,217,149,0.95)' : 'rgba(20,16,26,0.75)'
          g.strokeStyle = sel ? '#fff3cc' : 'rgba(214,178,106,0.7)'
          g.lineWidth = 1
          g.beginPath()
          g.arc(lx, ly, 9, 0, Math.PI * 2)
          g.fill()
          g.stroke()
          g.fillStyle = sel ? '#1a1206' : '#f3d995'
          g.font = '600 11px Cinzel, serif'
          g.textAlign = 'center'
          g.textBaseline = 'middle'
          g.fillText(String(i + 1), lx, ly + 0.5)
          if (sel) {
            g.strokeStyle = `rgba(243,217,149,${0.35 + 0.25 * Math.sin(time * 4)})`
            g.setLineDash([4, 5])
            g.beginPath()
            const t = tipOf(c)
            g.ellipse((c.bx + t.x) / 2, (c.by + t.y) / 2, c.len / 2 + 14, c.wid / 2 + 14, -c.axis * DEG, 0, Math.PI * 2)
            g.stroke()
            g.setLineDash([])
          }
        }
      })

      // pliers + tension line while dragging
      if (grip) {
        const c = crystals[grip.i]
        const dx = grip.x - grip.x0
        const dy = grip.y - grip.y0
        const d = Math.hypot(dx, dy)
        drawPliers(c, c.bx + Math.cos(c.axis * DEG) * 16 + dx * 1.2 + (d < 1 ? Math.cos(c.axis * DEG) * 40 : 0), c.by - Math.sin(c.axis * DEG) * 16 + dy * 1.2 - (d < 1 ? Math.sin(c.axis * DEG) * 40 : 0))
        if (d > 4) {
          g.strokeStyle = 'rgba(243,217,149,0.7)'
          g.setLineDash([5, 5])
          g.lineWidth = 1.5
          g.beginPath()
          g.moveTo(grip.x0, grip.y0)
          g.lineTo(grip.x, grip.y)
          g.stroke()
          g.setLineDash([])
          const a = Math.atan2(dy, dx)
          g.fillStyle = 'rgba(243,217,149,0.9)'
          g.beginPath()
          g.moveTo(grip.x + Math.cos(a) * 8, grip.y + Math.sin(a) * 8)
          g.lineTo(grip.x + Math.cos(a + 2.5) * 8, grip.y + Math.sin(a + 2.5) * 8)
          g.lineTo(grip.x + Math.cos(a - 2.5) * 8, grip.y + Math.sin(a - 2.5) * 8)
          g.closePath()
          g.fill()
          // pull meter ring
          g.strokeStyle = 'rgba(243,217,149,0.35)'
          g.beginPath()
          g.arc(grip.x0, grip.y0, 64, a - 0.4, a + 0.4)
          g.stroke()
        }
      }

      drawJar(time)

      // particles
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let k = particles.length - 1; k >= 0; k--) {
        const q = particles[k]
        q.life -= dt
        if (q.life <= 0) {
          particles.splice(k, 1)
          continue
        }
        q.x += q.vx * dt
        q.y += q.vy * dt
        q.vx *= 0.96
        q.vy = q.vy * 0.96 + 20 * dt
        g.globalAlpha = clamp01(q.life / q.max)
        g.fillStyle = q.color
        g.fillRect(q.x, q.y, q.size, q.size)
      }
      g.restore()

      // floating labels
      for (let k = floats.length - 1; k >= 0; k--) {
        const f = floats[k]
        f.life -= dt
        if (f.life <= 0) {
          floats.splice(k, 1)
          continue
        }
        f.y -= 22 * dt
        g.globalAlpha = clamp01(f.life)
        g.font = 'italic 600 17px "EB Garamond", serif'
        g.textAlign = 'center'
        g.fillStyle = f.color
        g.fillText(f.text, f.x, f.y)
        g.globalAlpha = 1
      }

      drawWatcher(progress(), time)
      drawEyeMeter(progress())

      if (endText) {
        endText.t += dt
        const a = clamp01(endText.t * 3)
        g.save()
        g.globalAlpha = a
        g.fillStyle = 'rgba(0,0,0,0.35)'
        g.fillRect(0, H / 2 - 50, W, 100)
        g.font = '700 54px Cinzel, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.shadowColor = endText.color
        g.shadowBlur = 24
        g.fillStyle = endText.color
        const sc = 1 + 0.04 * Math.sin(endText.t * 10)
        g.translate(W / 2, H / 2)
        g.scale(sc, sc)
        g.fillText(endText.text, 0, 0)
        g.restore()
      }
      g.restore()
    })
  })
}

registerMinigame('crystal', () => ({ run: runCrystal }))
