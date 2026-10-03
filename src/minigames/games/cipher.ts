/**
 * CIPHER: El's coded passage.
 *
 * The passage is a chain of groups: a number, a geometric mark in brackets,
 * an arrow to the next group. The star symbols on El's cave map match the
 * cipher marks, and "a star has no name, it has a direction": the player
 * turns the arm of Arkot's brass half-circle protractor onto the star that
 * bears the highlighted mark. Its bearing reveals a direction (north,
 * north-west, ...), the group's number gives the distance in fingers.
 * Step by step a course appears. Wrong readings cost a wax seal (3 = fail).
 *
 * params: { steps?: number (3–6, default 5) }
 * result: { success, score, data: { course: string (localised), steps: { dir, fingers }[] } }
 *         skipped: { success: true, score: 0, data: { skipped: true } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import type { L } from '../../i18n/i18n'

type Dir = 'E' | 'NE' | 'N' | 'NW' | 'W'
type Sym = 'tri' | 'triDot' | 'circle' | 'circleCross' | 'diamond' | 'diamondBar' | 'bars' | 'crescent' | 'hourglass' | 'eye' | 'trident'

const SYMS: Sym[] = ['tri', 'triDot', 'circle', 'circleCross', 'diamond', 'diamondBar', 'bars', 'crescent', 'hourglass', 'eye', 'trident']
const SIBLING: Partial<Record<Sym, Sym>> = { tri: 'triDot', triDot: 'tri', circle: 'circleCross', circleCross: 'circle', diamond: 'diamondBar', diamondBar: 'diamond' }

const DIR_NAME: Record<Dir, L> = {
  N: { sk: 'SEVER', en: 'NORTH' },
  NE: { sk: 'SEVEROVÝCHOD', en: 'NORTH-EAST' },
  E: { sk: 'VÝCHOD', en: 'EAST' },
  NW: { sk: 'SEVEROZÁPAD', en: 'NORTH-WEST' },
  W: { sk: 'ZÁPAD', en: 'WEST' },
}
const DIR_SHORT: Record<Dir, L> = {
  N: { sk: 'S', en: 'N' },
  NE: { sk: 'SV', en: 'NE' },
  E: { sk: 'V', en: 'E' },
  NW: { sk: 'SZ', en: 'NW' },
  W: { sk: 'Z', en: 'W' },
}
const DIR_ANGLE: Record<Dir, number> = { E: 0, NE: 45, N: 90, NW: 135, W: 180 }

/** El's course, read in this order (first `steps` entries are used) */
const COURSE: { dir: Dir; fingers: number }[] = [
  { dir: 'N', fingers: 3 },
  { dir: 'W', fingers: 2 },
  { dir: 'NE', fingers: 1 },
  { dir: 'NW', fingers: 4 },
  { dir: 'E', fingers: 2 },
  { dir: 'N', fingers: 1 },
]

const S = {
  title: { sk: 'Elina šifra', en: "El's Cipher" },
  sub: {
    sk: '„Hviezda nemá meno, má smer,“ zamrmle Arkot a posunie rameno mosadzného uhlomeru.',
    en: '"A star has no name, it has a direction," Arkot murmurs, sliding the arm of his brass protractor.',
  },
  hint: {
    sk: 'Nájdi hviezdu s rovnakou značkou, akú má zvýraznený znak šifry, a natoč na ňu rameno. Ťahaj myšou alebo ← → (↑ ↓ skočí na ďalšiu hviezdu) · pusti / Enter = odčítať',
    en: 'Find the star bearing the same mark as the highlighted cipher sign and turn the arm onto it. Drag, or ← → (↑ ↓ jump between stars) · release / Enter takes the reading',
  },
  header: { sk: 'Elina kniha · šifrovaná pasáž', en: "The Book of El · coded passage" },
  step: { sk: 'krok {n} / {m}', en: 'step {n} / {m}' },
  read: { sk: 'Odčítať', en: 'Take reading' },
  wrong: { sk: 'Tá hviezda ukazuje inam. Atrament sa rozpije.', en: 'That star points elsewhere. The ink blots.' },
  empty: { sk: 'Rameno mieri do prázdna.', en: 'The arm points into emptiness.' },
  good: { sk: 'Hviezda odpovedá: {dir}.', en: 'The star answers: {dir}.' },
  failed: { sk: 'Kurz nedáva zmysel. Arkot si povzdychne: „Odznova.“', en: 'The course makes no sense. Arkot sighs: "From the top."' },
  course: { sk: 'Kurz', en: 'Course' },
  done: { sk: 'Kurz: {course}', en: 'Course: {course}' },
  map: { sk: 'jaskynná mapa', en: 'the cave map' },
} satisfies Record<string, L>

function fingers(n: number): L {
  if (n === 1) return { sk: '1 prst', en: '1 finger' }
  if (n >= 2 && n <= 4) return { sk: `${n} prsty`, en: `${n} fingers` }
  return { sk: `${n} prstov`, en: `${n} fingers` }
}

const W = 800
const H = 480
const PX = 400
const PY = 468
const R_CHART = 290
const R_PRO_OUT = 132
const R_PRO_IN = 64
const R_ARM = 292
const DEG = Math.PI / 180
const INK = '#3b2612'
const MAX_MISTAKES = 3

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const clamp01 = (v: number) => clamp(v, 0, 1)

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

/** screen position of a polar point around the pivot (math angle in degrees) */
const polar = (deg: number, r: number) => ({ x: PX + Math.cos(deg * DEG) * r, y: PY - Math.sin(deg * DEG) * r })

function drawSym(g: CanvasRenderingContext2D, sym: Sym, x: number, y: number, s: number, color: string, lw: number): void {
  g.save()
  g.translate(x, y)
  g.strokeStyle = color
  g.fillStyle = color
  g.lineWidth = lw
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.beginPath()
  switch (sym) {
    case 'tri':
    case 'triDot':
      g.moveTo(0, -s)
      g.lineTo(s * 0.9, s * 0.62)
      g.lineTo(-s * 0.9, s * 0.62)
      g.closePath()
      g.stroke()
      if (sym === 'triDot') {
        g.beginPath()
        g.arc(0, s * 0.12, Math.max(1.6, s * 0.2), 0, Math.PI * 2)
        g.fill()
      }
      break
    case 'circle':
    case 'circleCross':
      g.arc(0, 0, s * 0.82, 0, Math.PI * 2)
      g.stroke()
      if (sym === 'circleCross') {
        g.beginPath()
        g.moveTo(-s * 0.82, 0)
        g.lineTo(s * 0.82, 0)
        g.moveTo(0, -s * 0.82)
        g.lineTo(0, s * 0.82)
        g.stroke()
      }
      break
    case 'diamond':
    case 'diamondBar':
      g.moveTo(0, -s)
      g.lineTo(s * 0.7, 0)
      g.lineTo(0, s)
      g.lineTo(-s * 0.7, 0)
      g.closePath()
      g.stroke()
      if (sym === 'diamondBar') {
        g.beginPath()
        g.moveTo(-s * 1.05, 0)
        g.lineTo(s * 1.05, 0)
        g.stroke()
      }
      break
    case 'bars':
      for (const dx of [-0.55, 0, 0.55]) {
        g.moveTo(dx * s, -s * 0.85)
        g.lineTo(dx * s, s * 0.85)
      }
      g.stroke()
      break
    case 'crescent':
      g.lineWidth = lw * 1.9
      g.arc(s * 0.15, 0, s * 0.72, 0.62 * Math.PI, 1.38 * Math.PI)
      g.stroke()
      break
    case 'hourglass':
      g.moveTo(-s * 0.7, -s)
      g.lineTo(s * 0.7, -s)
      g.lineTo(-s * 0.7, s)
      g.lineTo(s * 0.7, s)
      g.closePath()
      g.stroke()
      break
    case 'eye':
      g.moveTo(-s, 0)
      g.quadraticCurveTo(0, -s * 0.95, s, 0)
      g.quadraticCurveTo(0, s * 0.95, -s, 0)
      g.closePath()
      g.stroke()
      g.beginPath()
      g.arc(0, 0, s * 0.24, 0, Math.PI * 2)
      g.fill()
      break
    case 'trident':
      g.moveTo(0, s)
      g.lineTo(0, -s)
      g.moveTo(-s * 0.62, -s * 0.85)
      g.lineTo(-s * 0.62, -s * 0.15)
      g.lineTo(s * 0.62, -s * 0.15)
      g.lineTo(s * 0.62, -s * 0.85)
      g.stroke()
      break
  }
  g.restore()
}

function buildParchment(): HTMLCanvasElement {
  const r = Math.min(2, window.devicePixelRatio || 1)
  const c = document.createElement('canvas')
  c.width = Math.round(W * r)
  c.height = Math.round(H * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  const rnd = mulberry(5)
  const base = g.createRadialGradient(W * 0.5, H * 0.42, 60, W * 0.5, H * 0.5, 560)
  base.addColorStop(0, '#f0e1bb')
  base.addColorStop(0.6, '#e2ca97')
  base.addColorStop(1, '#bd9a62')
  g.fillStyle = base
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = `rgba(90,60,20,${rnd() * 0.07})`
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2.5, 1)
  }
  for (let i = 0; i < 10; i++) {
    const x = rnd() * W
    const y = rnd() * H
    const rad = 30 + rnd() * 90
    const sg = g.createRadialGradient(x, y, rad * 0.2, x, y, rad)
    sg.addColorStop(0, 'rgba(140,95,40,0.10)')
    sg.addColorStop(0.75, 'rgba(140,95,40,0.05)')
    sg.addColorStop(1, 'rgba(140,95,40,0)')
    g.fillStyle = sg
    g.beginPath()
    g.arc(x, y, rad, 0, Math.PI * 2)
    g.fill()
  }
  // fold line
  g.strokeStyle = 'rgba(110,80,40,0.12)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(W / 2 + 3, 0)
  g.lineTo(W / 2 - 4, H)
  g.stroke()
  const eg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 560)
  eg.addColorStop(0, 'rgba(60,35,10,0)')
  eg.addColorStop(1, 'rgba(60,35,10,0.42)')
  g.fillStyle = eg
  g.fillRect(0, 0, W, H)

  // ---- star chart frame (El's cave map copy)
  g.save()
  g.beginPath()
  g.arc(PX, PY, R_CHART, Math.PI, 0)
  g.closePath()
  g.fillStyle = 'rgba(110,70,25,0.13)'
  g.fill()
  g.strokeStyle = 'rgba(59,38,18,0.75)'
  g.lineWidth = 1.6
  g.stroke()
  g.beginPath()
  g.arc(PX, PY, R_CHART - 6, Math.PI, 0)
  g.lineWidth = 0.8
  g.stroke()
  g.setLineDash([2, 5])
  g.strokeStyle = 'rgba(59,38,18,0.3)'
  for (const rr of [160, 230]) {
    g.beginPath()
    g.arc(PX, PY, rr, Math.PI, 0)
    g.stroke()
  }
  for (let a = 30; a < 180; a += 30) {
    const p0 = polar(a, R_PRO_OUT + 6)
    const p1 = polar(a, R_CHART - 6)
    g.beginPath()
    g.moveTo(p0.x, p0.y)
    g.lineTo(p1.x, p1.y)
    g.stroke()
  }
  g.setLineDash([])
  g.restore()

  // Sai sketch (left) and compass rose (right)
  g.save()
  g.strokeStyle = 'rgba(59,38,18,0.55)'
  g.lineWidth = 1.2
  g.beginPath()
  g.arc(84, 250, 30, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = 'rgba(190,120,40,0.18)'
  g.fill()
  g.beginPath()
  g.ellipse(84, 250, 52, 12, -0.3, 0, Math.PI * 2)
  g.stroke()
  for (let k = 0; k < 8; k++) {
    g.beginPath()
    g.moveTo(70 + k * 4, 236 + (k % 3) * 9)
    g.lineTo(76 + k * 4, 240 + (k % 3) * 9)
    g.stroke()
  }
  g.font = 'italic 13px "EB Garamond", serif'
  g.fillStyle = 'rgba(59,38,18,0.6)'
  g.textAlign = 'center'
  g.fillText('Sai', 84, 300)
  const cx = 716
  const cy = 250
  g.beginPath()
  g.arc(cx, cy, 26, 0, Math.PI * 2)
  g.stroke()
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4
    const len = k % 2 ? 16 : 32
    g.beginPath()
    g.moveTo(cx, cy)
    g.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len)
    g.stroke()
  }
  g.fillStyle = 'rgba(59,38,18,0.7)'
  g.beginPath()
  g.moveTo(cx, cy - 34)
  g.lineTo(cx - 5, cy - 18)
  g.lineTo(cx + 5, cy - 18)
  g.closePath()
  g.fill()
  g.restore()
  return c
}

interface Star {
  ang: number
  r: number
  sym: Sym
  size: number
  /** index of the course step this star answers, -1 for decoys */
  step: number
  flash: number
  solved: boolean
}

interface Beam {
  from: { x: number; y: number }
  to: { x: number; y: number }
  t: number
  step: number
}

// --------------------------------------------------------------------------- the minigame
function runCipher(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const nSteps = Math.round(clamp(typeof params.steps === 'number' && Number.isFinite(params.steps) ? params.steps : 5, 3, 6))
  const course = COURSE.slice(0, nSteps)
  const reduced = ctx.assist.reducedMotion
  const courseText = () => course.map((c) => `${ctx.t(DIR_NAME[c.dir])} · ${ctx.t(fingers(c.fingers)).toUpperCase()}`).join(' · ')

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
    card.card.style.boxSizing = 'border-box'
    card.card.style.overflowY = 'auto'
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
    const parchment = buildParchment()

    // ------------------------------------------------------------------ state
    let arm = 90
    let armTarget = 90
    let lastTick = 90
    let groupSyms: Sym[] = []
    let stars: Star[] = []
    let dimStars: { x: number; y: number; a: number }[] = []
    let links: [number, number][] = []
    let step = 0
    let mistakes = 0
    let blots: { x: number; y: number; r: number; seed: number }[] = []
    let lit: number[] = []
    let dragging = false
    let beam: Beam | null = null
    let mode: 'play' | 'beam' | 'done' | 'failed' = 'play'
    let shake = 0
    let doneT = 0
    let msg: { text: string; color: string; t: number } | null = null
    let failures = 0
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = []

    function layout(): void {
      const rnd = mulberry((Math.random() * 1e9) | 0)
      const pool = [...SYMS].sort(() => rnd() - 0.5)
      groupSyms = pool.slice(0, nSteps)
      const rest = pool.slice(nSteps)
      // decoys: prefer siblings of the cipher marks so the eye must be careful
      const decoySyms: Sym[] = []
      for (const s of groupSyms) {
        const sib = SIBLING[s]
        if (sib && rest.includes(sib) && !decoySyms.includes(sib)) decoySyms.push(sib)
      }
      for (const s of rest) if (!decoySyms.includes(s)) decoySyms.push(s)
      const nDecoys = Math.min(decoySyms.length, Math.max(4, 10 - nSteps))
      stars = []
      const free = (a: number, sep: number) => stars.every((s) => Math.abs(s.ang - a) >= sep)
      course.forEach((c, i) => {
        const base = DIR_ANGLE[c.dir]
        const span = c.dir === 'E' || c.dir === 'W' ? 4 : 9
        let a = 0
        for (let k = 0; k < 200; k++) {
          a = clamp(base + (rnd() * 2 - 1) * span, 11, 169)
          if (free(a, 12)) break
        }
        stars.push({ ang: a, r: 172 + rnd() * 108, sym: groupSyms[i], size: 4.5 + rnd() * 2, step: i, flash: 0, solved: false })
      })
      for (let d = 0; d < nDecoys; d++) {
        for (let k = 0; k < 400; k++) {
          const a = 12 + rnd() * 156
          if (free(a, 11.5)) {
            stars.push({ ang: a, r: 172 + rnd() * 108, sym: decoySyms[d], size: 3.8 + rnd() * 2, step: -1, flash: 0, solved: false })
            break
          }
        }
      }
      dimStars = []
      for (let k = 0; k < 80; k++) {
        const a = 4 + rnd() * 172
        const rr = 140 + rnd() * 142
        const p = polar(a, rr)
        dimStars.push({ x: p.x, y: p.y, a: 0.25 + rnd() * 0.45 })
      }
      links = []
      const order = stars.map((_, i) => i).sort((a, b) => stars[a].ang - stars[b].ang)
      for (let k = 0; k + 1 < order.length; k++) if (rnd() < 0.55) links.push([order[k], order[k + 1]])
      step = 0
      lit = course.map(() => 0)
      blots = []
      mistakes = 0
      // start the arm in an empty gap, well away from the first answer
      const first = stars.find((st) => st.step === 0)
      const gapOk = (a: number) => stars.every((st) => Math.abs(st.ang - a) > 6) && (!first || Math.abs(first.ang - a) > 25)
      arm = armTarget = [24, 156, 60, 120, 40, 140, 90].find(gapOk) ?? 90
      lastTick = arm
      // dev builds expose the star layout for automated play-tests
      if (import.meta.env.DEV) canvas.dataset.debug = JSON.stringify(stars.map((st) => ({ ang: Math.round(st.ang * 10) / 10, r: Math.round(st.r), step: st.step })))
    }
    layout()

    const groupX = (i: number) => {
      const gw = Math.min(138, 720 / nSteps)
      return W / 2 + (i - (nSteps - 1) / 2) * gw
    }
    const GROUP_Y = 78

    function pointed(): number {
      let best = -1
      let bestD = 1e9
      stars.forEach((s, i) => {
        const tol = Math.max(2.6, Math.atan2(13, s.r) / DEG)
        const d = Math.abs(s.ang - arm)
        if (d <= tol && d < bestD) {
          bestD = d
          best = i
        }
      })
      return best
    }

    function say(text: string, color: string): void {
      msg = { text, color, t: 0 }
    }

    function takeReading(): void {
      if (mode !== 'play') return
      const i = pointed()
      if (i < 0) {
        say(ctx.t(S.empty), 'rgba(59,38,18,0.85)')
        return
      }
      const s = stars[i]
      if (s.step === step) {
        mode = 'beam'
        s.solved = true
        arm = armTarget = s.ang
        ctx.sfx('chime')
        const p = polar(s.ang, s.r)
        beam = { from: p, to: { x: groupX(step), y: GROUP_Y }, t: 0, step }
        say(ctx.t(S.good, { dir: ctx.t(DIR_NAME[course[step].dir]) }), '#7a4f0e')
        return
      }
      if (s.solved) return
      mistakes++
      s.flash = 1
      shake = reduced ? 0 : 0.3
      ctx.sfx('fail')
      say(ctx.t(S.wrong), '#8b1e1e')
      blots.push({ x: 70 + Math.random() * 660, y: 142 + Math.random() * 8, r: 5 + Math.random() * 5, seed: Math.random() * 1000 })
      if (mistakes >= MAX_MISTAKES) {
        mode = 'failed'
        failures++
        setTimeout(showFailure, 700)
      }
    }

    function showFailure(): void {
      ctx.sfx('fail')
      card.hint.textContent = `${ctx.t(S.failed)} ${ctx.t(UI_STRINGS.failed)}`
      card.hint.style.color = 'var(--nv-danger)'
      const retry = button(
        ctx.t(UI_STRINGS.retry),
        () => {
          layout()
          mode = 'play'
          msg = null
          card.hint.textContent = ctx.t(S.hint)
          card.hint.style.color = ''
          card.buttons.replaceChildren(readBtn)
        },
        true,
      )
      card.buttons.replaceChildren(retry)
      if (ctx.assist.skipAllowed && failures >= 1) card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      retry.focus()
    }

    function complete(): void {
      mode = 'done'
      doneT = 0
      ctx.sfx('success')
      const text = courseText()
      card.hint.textContent = ctx.t(S.done, { course: text })
      card.hint.style.color = 'var(--nv-gold-bright)'
      const score = Math.round(Math.max(0.4, 1 - 0.2 * mistakes) * 100) / 100
      const cont = button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { course: text, steps: course.map((c) => ({ dir: c.dir, fingers: c.fingers })) } }), true)
      card.buttons.replaceChildren(cont)
      cont.focus()
    }

    const readBtn = button(`${ctx.t(S.read)} ⏎`, () => takeReading(), true)
    card.buttons.appendChild(readBtn)

    // ------------------------------------------------------------------ input
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    const aimAt = (x: number, y: number) => {
      const a = Math.atan2(PY - y, x - PX) / DEG
      armTarget = clamp(a < -90 ? 180 : a, 2, 178)
      arm = armTarget
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (mode !== 'play') return
      const p = local(e)
      if (p.y < 150) return
      e.preventDefault()
      dragging = true
      canvas.setPointerCapture(e.pointerId)
      aimAt(p.x, p.y)
    })
    canvas.addEventListener('pointermove', (e) => {
      const p = local(e)
      canvas.style.cursor = p.y >= 150 && mode === 'play' ? (dragging ? 'grabbing' : 'crosshair') : 'default'
      if (!dragging || mode !== 'play') return
      aimAt(p.x, p.y)
    })
    canvas.addEventListener('pointerup', () => {
      if (!dragging) return
      dragging = false
      if (pointed() >= 0) takeReading()
    })
    canvas.addEventListener('pointercancel', () => {
      dragging = false
    })

    ctx.onKey((e) => {
      if (finished || mode !== 'play') return
      const active = document.activeElement
      if ((e.key === 'Enter' || e.key === ' ') && active instanceof HTMLButtonElement && ctx.root.contains(active)) return
      const fine = e.shiftKey ? 0.25 : 1.2
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          armTarget = clamp(armTarget + fine, 2, 178)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          armTarget = clamp(armTarget - fine, 2, 178)
          break
        case 'ArrowUp':
        case 'ArrowDown': {
          const up = e.key === 'ArrowUp'
          const cands = stars.filter((s) => (up ? s.ang > armTarget + 0.5 : s.ang < armTarget - 0.5)).sort((a, b) => (up ? a.ang - b.ang : b.ang - a.ang))
          if (cands.length) armTarget = cands[0].ang
          break
        }
        case 'Enter':
        case ' ':
          takeReading()
          break
        default:
          return
      }
      e.preventDefault()
    })

    // ------------------------------------------------------------------ drawing
    function drawGroups(time: number): void {
      g.save()
      g.font = '600 11px Cinzel, serif'
      g.textAlign = 'left'
      g.fillStyle = 'rgba(59,38,18,0.7)'
      g.fillText(ctx.t(S.header).toUpperCase(), 34, 26)
      g.textAlign = 'right'
      if (mode !== 'done') g.fillText(ctx.t(S.step, { n: Math.min(step + 1, nSteps), m: nSteps }).toUpperCase(), W - 120, 26)
      // wax seals = mistakes
      for (let k = 0; k < MAX_MISTAKES; k++) {
        const x = W - 92 + k * 26
        const used = k < mistakes
        g.beginPath()
        g.arc(x, 22, 8, 0, Math.PI * 2)
        if (used) {
          g.fillStyle = '#8b1e1e'
          g.fill()
          g.strokeStyle = 'rgba(60,10,10,0.8)'
          g.stroke()
        } else {
          g.strokeStyle = 'rgba(139,30,30,0.45)'
          g.setLineDash([2, 2])
          g.stroke()
          g.setLineDash([])
        }
      }
      course.forEach((c, i) => {
        const cx = groupX(i)
        const cy = GROUP_Y
        const current = i === step && mode !== 'done'
        const l = lit[i]
        if (current) {
          const pulse = 0.5 + 0.5 * Math.sin(time * 3)
          const hg = g.createRadialGradient(cx, cy, 4, cx, cy, 52)
          hg.addColorStop(0, `rgba(214,160,60,${0.28 + 0.14 * pulse})`)
          hg.addColorStop(1, 'rgba(214,160,60,0)')
          g.fillStyle = hg
          g.fillRect(cx - 60, cy - 50, 120, 100)
        }
        if (l > 0) {
          const hg = g.createRadialGradient(cx, cy, 2, cx, cy, 40)
          hg.addColorStop(0, `rgba(255,210,110,${0.55 * l})`)
          hg.addColorStop(1, 'rgba(255,210,110,0)')
          g.fillStyle = hg
          g.fillRect(cx - 50, cy - 40, 100, 80)
        }
        const ink = l > 0.5 ? '#7a4f0e' : INK
        // number
        g.fillStyle = ink
        g.font = 'italic 600 21px "EB Garamond", serif'
        g.textAlign = 'right'
        g.textBaseline = 'middle'
        g.fillText(String(c.fingers), cx - 27, cy - 14)
        // brackets
        g.strokeStyle = ink
        g.lineWidth = 1.8
        g.beginPath()
        g.moveTo(cx - 17, cy - 20)
        g.lineTo(cx - 22, cy - 20)
        g.lineTo(cx - 22, cy + 20)
        g.lineTo(cx - 17, cy + 20)
        g.moveTo(cx + 17, cy - 20)
        g.lineTo(cx + 22, cy - 20)
        g.lineTo(cx + 22, cy + 20)
        g.lineTo(cx + 17, cy + 20)
        g.stroke()
        if (l > 0) {
          g.save()
          g.shadowColor = `rgba(255,200,90,${l})`
          g.shadowBlur = 14 * l
          drawSym(g, groupSyms[i], cx, cy, 12, '#b07514', 2.2)
          g.restore()
        } else drawSym(g, groupSyms[i], cx, cy, 12, INK, 2)
        // arrow to the next group
        if (i < nSteps - 1) {
          const ax = (cx + groupX(i + 1)) / 2 + 4
          g.strokeStyle = 'rgba(59,38,18,0.75)'
          g.lineWidth = 1.4
          g.beginPath()
          g.moveTo(ax - 9, cy)
          g.lineTo(ax + 7, cy)
          g.moveTo(ax + 2, cy - 4)
          g.lineTo(ax + 7, cy)
          g.lineTo(ax + 2, cy + 4)
          g.stroke()
        }
        // decoded text
        if (l > 0) {
          g.globalAlpha = clamp01(l)
          g.textAlign = 'center'
          g.fillStyle = '#6e440a'
          g.font = '700 12px Cinzel, serif'
          g.fillText(ctx.t(DIR_NAME[c.dir]), cx, cy + 38 - 4 * (1 - l))
          g.font = 'italic 14px "EB Garamond", serif'
          g.fillStyle = 'rgba(59,38,18,0.85)'
          g.fillText(ctx.t(fingers(c.fingers)), cx, cy + 55 - 4 * (1 - l))
          g.globalAlpha = 1
        }
      })
      // divider
      g.strokeStyle = 'rgba(59,38,18,0.45)'
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(60, 145)
      g.lineTo(W - 60, 145)
      g.stroke()
      g.fillStyle = 'rgba(59,38,18,0.6)'
      g.beginPath()
      g.moveTo(W / 2, 140)
      g.lineTo(W / 2 + 5, 145)
      g.lineTo(W / 2, 150)
      g.lineTo(W / 2 - 5, 145)
      g.closePath()
      g.fill()
      for (const b of blots) {
        const br = mulberry(Math.floor(b.seed))
        g.fillStyle = 'rgba(40,22,10,0.75)'
        g.beginPath()
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        g.fill()
        for (let k = 0; k < 5; k++) {
          const a = br() * Math.PI * 2
          const d = b.r + br() * 6
          g.beginPath()
          g.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 1 + br() * 2, 0, Math.PI * 2)
          g.fill()
        }
      }
      g.restore()
    }

    function drawStarShape(x: number, y: number, s: number, color: string): void {
      g.fillStyle = color
      g.beginPath()
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 - Math.PI / 2
        const rr = k % 2 ? s * 0.32 : s
        if (k === 0) g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
        else g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
      }
      g.closePath()
      g.fill()
    }

    function drawChart(time: number, pi: number): void {
      g.save()
      for (const d of dimStars) {
        g.fillStyle = `rgba(59,38,18,${d.a})`
        g.fillRect(d.x, d.y, 1.4, 1.4)
      }
      g.strokeStyle = 'rgba(59,38,18,0.25)'
      g.setLineDash([1, 4])
      g.lineWidth = 1
      for (const [a, b] of links) {
        const p = polar(stars[a].ang, stars[a].r)
        const q = polar(stars[b].ang, stars[b].r)
        g.beginPath()
        g.moveTo(p.x, p.y)
        g.lineTo(q.x, q.y)
        g.stroke()
      }
      g.setLineDash([])
      stars.forEach((s, i) => {
        const p = polar(s.ang, s.r)
        const hot = i === pi && mode === 'play'
        if (s.flash > 0) {
          g.fillStyle = `rgba(160,20,20,${0.35 * s.flash})`
          g.beginPath()
          g.arc(p.x, p.y, 18, 0, Math.PI * 2)
          g.fill()
        }
        if (hot || s.solved) {
          const pulse = 0.6 + 0.4 * Math.sin(time * 5)
          const gg = g.createRadialGradient(p.x, p.y, 1, p.x, p.y, 22)
          gg.addColorStop(0, `rgba(255,205,100,${s.solved ? 0.55 : 0.5 * pulse})`)
          gg.addColorStop(1, 'rgba(255,205,100,0)')
          g.fillStyle = gg
          g.beginPath()
          g.arc(p.x, p.y, 22, 0, Math.PI * 2)
          g.fill()
        }
        drawStarShape(p.x, p.y, s.size + (hot ? 1.5 : 0), s.solved ? '#9a6510' : INK)
        g.strokeStyle = s.solved ? 'rgba(154,101,16,0.7)' : 'rgba(59,38,18,0.4)'
        g.lineWidth = 0.8
        g.beginPath()
        g.arc(p.x, p.y, s.size + 3.5, 0, Math.PI * 2)
        g.stroke()
        drawSym(g, s.sym, p.x + 16, p.y - 14, hot ? 10 : 8.5, s.solved ? '#9a6510' : hot ? '#6b3f05' : INK, hot ? 1.8 : 1.4)
      })
      g.restore()
    }

    function drawProtractor(pi: number): void {
      g.save()
      // light ray along the arm
      const ray0 = polar(arm, R_PRO_OUT + 4)
      const ray1 = polar(arm, R_CHART - 4)
      const rg = g.createLinearGradient(ray0.x, ray0.y, ray1.x, ray1.y)
      rg.addColorStop(0, 'rgba(176,117,20,0.0)')
      rg.addColorStop(0.3, `rgba(176,117,20,${pi >= 0 ? 0.55 : 0.3})`)
      rg.addColorStop(1, 'rgba(176,117,20,0.05)')
      g.strokeStyle = rg
      g.lineWidth = 2
      g.setLineDash([6, 4])
      g.beginPath()
      g.moveTo(ray0.x, ray0.y)
      g.lineTo(ray1.x, ray1.y)
      g.stroke()
      g.setLineDash([])
      // base bar
      const bb = g.createLinearGradient(0, PY - 8, 0, PY + 10)
      bb.addColorStop(0, '#f1d48e')
      bb.addColorStop(0.5, '#b88a3e')
      bb.addColorStop(1, '#6e4c1c')
      g.fillStyle = bb
      g.fillRect(PX - R_PRO_OUT - 10, PY - 6, (R_PRO_OUT + 10) * 2, 14)
      // half ring
      g.shadowColor = 'rgba(40,20,0,0.45)'
      g.shadowBlur = 8
      g.shadowOffsetY = 3
      g.beginPath()
      g.arc(PX, PY, R_PRO_OUT, Math.PI, 0)
      g.arc(PX, PY, R_PRO_IN, 0, Math.PI, true)
      g.closePath()
      const br = g.createLinearGradient(PX - R_PRO_OUT, PY - R_PRO_OUT, PX + R_PRO_OUT, PY)
      br.addColorStop(0, 'rgba(246,220,150,0.93)')
      br.addColorStop(0.4, 'rgba(190,140,62,0.93)')
      br.addColorStop(0.7, 'rgba(236,200,124,0.93)')
      br.addColorStop(1, 'rgba(120,82,30,0.93)')
      g.fillStyle = br
      g.fill()
      g.shadowColor = 'transparent'
      g.strokeStyle = 'rgba(70,44,12,0.85)'
      g.lineWidth = 1.2
      g.stroke()
      // ticks and labels
      g.strokeStyle = 'rgba(55,32,8,0.9)'
      g.fillStyle = 'rgba(55,32,8,0.95)'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      for (let a = 0; a <= 180; a += 5) {
        const major = a % 15 === 0
        const p0 = polar(a, R_PRO_OUT - 1)
        const p1 = polar(a, R_PRO_OUT - (major ? 13 : 7))
        g.lineWidth = major ? 1.4 : 0.8
        g.beginPath()
        g.moveTo(p0.x, p0.y)
        g.lineTo(p1.x, p1.y)
        g.stroke()
        if (a % 30 === 0) {
          const pl = polar(a, R_PRO_OUT - 23)
          g.font = '600 9px Cinzel, serif'
          g.fillText(String(a), pl.x, pl.y)
        }
      }
      for (const d of ['E', 'NE', 'N', 'NW', 'W'] as Dir[]) {
        const p = polar(DIR_ANGLE[d], R_PRO_IN + 16)
        g.font = '700 10px Cinzel, serif'
        g.fillStyle = 'rgba(80,40,6,0.95)'
        g.fillText(ctx.t(DIR_SHORT[d]), clamp(p.x, PX - R_PRO_IN - 16, PX + R_PRO_IN + 16), Math.min(p.y, PY - 10))
      }
      // the arm
      g.save()
      g.translate(PX, PY)
      g.rotate(-arm * DEG)
      g.shadowColor = 'rgba(30,15,0,0.5)'
      g.shadowBlur = 6
      g.shadowOffsetY = 3
      g.beginPath()
      g.moveTo(0, -8)
      g.lineTo(R_ARM - 16, -4.5)
      g.lineTo(R_ARM, 0)
      g.lineTo(R_ARM - 16, 4.5)
      g.lineTo(0, 8)
      g.closePath()
      const ag = g.createLinearGradient(0, -8, 0, 8)
      ag.addColorStop(0, '#f8e0a0')
      ag.addColorStop(0.5, '#c4954a')
      ag.addColorStop(1, '#7a5420')
      g.fillStyle = ag
      g.fill()
      g.shadowColor = 'transparent'
      g.strokeStyle = 'rgba(70,44,12,0.9)'
      g.lineWidth = 1
      g.stroke()
      g.strokeStyle = 'rgba(70,44,12,0.7)'
      g.beginPath()
      g.moveTo(20, 0)
      g.lineTo(R_ARM - 22, 0)
      for (let x = 30; x < R_ARM - 20; x += 12) {
        g.moveTo(x, -3)
        g.lineTo(x, x % 36 === 30 ? 3.5 : 1.5)
      }
      g.stroke()
      g.restore()
      // readout window
      const sym = pi >= 0 ? stars[pi].sym : null
      g.fillStyle = 'rgba(244,233,205,0.96)'
      g.strokeStyle = 'rgba(70,44,12,0.9)'
      g.lineWidth = 1.5
      g.beginPath()
      g.arc(PX, PY - 30, 23, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      if (sym) drawSym(g, sym, PX, PY - 30, 11, sym === groupSyms[step] ? '#9a6510' : INK, 2)
      else {
        g.fillStyle = 'rgba(59,38,18,0.5)'
        g.font = '600 14px Cinzel, serif'
        g.fillText('·', PX, PY - 30)
      }
      g.font = '600 10px Cinzel, serif'
      g.fillStyle = 'rgba(55,32,8,0.95)'
      g.fillText(`${Math.round(arm)}°`, PX + 44, PY - 14)
      // rivet
      const rv = g.createRadialGradient(PX - 2, PY - 2, 1, PX, PY, 7)
      rv.addColorStop(0, '#fff1c2')
      rv.addColorStop(1, '#6e4c1c')
      g.fillStyle = rv
      g.beginPath()
      g.arc(PX, PY, 6, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }

    ctx.loop((dt, time) => {
      // arm easing for keyboard control
      if (!dragging) arm += (armTarget - arm) * Math.min(1, dt * 14)
      if (Math.abs(arm - lastTick) >= 4) {
        lastTick = arm
        ctx.sfx('tick')
      }
      shake = Math.max(0, shake - dt)
      for (const s of stars) s.flash = Math.max(0, s.flash - dt * 1.6)
      for (let i = 0; i < lit.length; i++) if (i < step || (mode === 'done' && lit[i] < 1)) lit[i] = Math.min(1, lit[i] + dt * 2)
      if (msg) msg.t += dt

      if (beam) {
        beam.t += dt / (reduced ? 0.35 : 0.85)
        const u = Math.min(1, beam.t)
        if (!reduced) {
          const e = u * u * (3 - 2 * u)
          const x = beam.from.x + (beam.to.x - beam.from.x) * e
          const y = beam.from.y + (beam.to.y - beam.from.y) * e - Math.sin(e * Math.PI) * 40
          for (let k = 0; k < 2; k++) sparks.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, life: 0.6 })
        }
        if (beam.t >= 1) {
          const solvedStep = beam.step
          beam = null
          step = solvedStep + 1
          ctx.sfx('glyph')
          if (step >= nSteps) complete()
          else mode = 'play'
        }
      }
      if (mode === 'done') doneT += dt

      g.save()
      if (shake > 0) g.translate((Math.random() - 0.5) * 6 * shake, (Math.random() - 0.5) * 6 * shake)
      g.drawImage(parchment, 0, 0, W, H)
      const pi = mode === 'play' || mode === 'beam' ? pointed() : -1
      drawGroups(time)
      drawChart(time, pi)
      drawProtractor(pi)

      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let k = sparks.length - 1; k >= 0; k--) {
        const p = sparks[k]
        p.life -= dt
        if (p.life <= 0) {
          sparks.splice(k, 1)
          continue
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        g.fillStyle = `rgba(255,200,90,${p.life * 1.4})`
        g.beginPath()
        g.arc(p.x, p.y, 2, 0, Math.PI * 2)
        g.fill()
      }
      g.restore()

      if (msg && mode !== 'done') {
        const a = clamp01(Math.min(msg.t * 4, 3 - msg.t))
        if (a > 0) {
          g.globalAlpha = a
          g.font = 'italic 16px "EB Garamond", serif'
          g.textAlign = 'center'
          g.textBaseline = 'middle'
          g.fillStyle = msg.color
          g.fillText(msg.text, W / 2, 161)
          g.globalAlpha = 1
        }
      }

      if (mode === 'done') {
        const a = clamp01(doneT * 1.5)
        g.save()
        g.globalAlpha = a
        const y = 200
        g.fillStyle = 'rgba(244,230,196,0.94)'
        g.strokeStyle = 'rgba(122,79,14,0.8)'
        g.lineWidth = 1.5
        g.beginPath()
        g.moveTo(70, y - 28)
        g.lineTo(W - 70, y - 28)
        g.lineTo(W - 52, y)
        g.lineTo(W - 70, y + 28)
        g.lineTo(70, y + 28)
        g.lineTo(52, y)
        g.closePath()
        g.fill()
        g.stroke()
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillStyle = '#7a4f0e'
        g.font = '700 11px Cinzel, serif'
        g.fillText(ctx.t(S.course).toUpperCase(), W / 2, y - 14)
        let size = 15
        const text = courseText()
        g.font = `700 ${size}px Cinzel, serif`
        while (g.measureText(text).width > W - 160 && size > 9) {
          size--
          g.font = `700 ${size}px Cinzel, serif`
        }
        g.fillStyle = INK
        g.fillText(text, W / 2, y + 7)
        g.restore()
      }
      g.restore()
    })
  })
}

registerMinigame('cipher', () => ({ run: runCipher }))
