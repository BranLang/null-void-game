/**
 * CLOCK: Renn's wall clock.
 *
 * Renn's study holds a wall clock with twelve divisions and four anchors,
 * fully wound but stopped, "made for a different day". Tami's chronograph
 * shows Ahil time (a 21-hour day). The player sets the 12-hour Earth clock to
 * the same moment of the day: the fraction of the day is what matters,
 * (h + m/60) / 21 of a 24-hour day, shown on a 12-hour dial (±10 min).
 * Hands are dragged (hour or minute) or moved with keys; Enter gives the
 * pendulum a push. A progressive hint explains Tami's "three clicks" and
 * draws a day ribbon cut into 21 and 24 hours.
 *
 * params: { ahilHour?: number (0–20, default 14), ahilMinute?: number (default 0) }
 * result: { success, score, data: { time: 'h:mm' (12-hour dial), hints, mistakes } }
 *         skipped: { success: true, score: 0, data: { skipped: true } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import type { L } from '../../i18n/i18n'

const S = {
  title: { sk: 'Rennove hodiny', en: "Renn's Clock" },
  sub: {
    sk: 'Hodiny v otcovej pracovni majú dvanásť dielikov a štyri kotvy. Sú natiahnuté, a predsa stoja, akoby ich stvorili pre iný deň.',
    en: "The clock in father's study has twelve divisions and four anchors. Fully wound, and yet stopped, as if made for a different day.",
  },
  hint: {
    sk: 'Nastav otcove hodiny na tú istú chvíľu dňa, akú ukazuje Tamin chronograf. Ťahaj ručičky · Q/E hodiny · A/D minúty · Enter rozkýve kyvadlo · H nápoveda',
    en: "Set father's clock to the same moment of the day as Tami's chronograph. Drag the hands · Q/E hours · A/D minutes · Enter swings the pendulum · H hint",
  },
  hintBtn: { sk: 'Nápoveda', en: 'Hint' },
  swing: { sk: 'Rozkývať kyvadlo', en: 'Swing the pendulum' },
  chrono: { sk: 'Tamin chronograf', en: "Tami's chronograph" },
  chronoSub: { sk: 'deň Ahilu · 21 hodín', en: 'an Ahil day · 21 hours' },
  dayRibbon: { sk: 'jeden deň', en: 'one day' },
  h1: {
    sk: 'Tami každý večer posunie chronograf o tri cvaknutia dopredu, aby dobehol otcov deň: 21 hodín a ešte tri. Otcov deň mal 24 hodín, a predsa bol rovnako dlhý. Rozhoduje, aká časť dňa už ubehla.',
    en: "Every evening Tami clicks her chronograph three clicks forward so it catches up with father's day: 21 hours and three more. Father's day had 24 hours, yet it was just as long. What matters is how much of the day has passed.",
  },
  h2: { sk: '{time} na Taminom chronografe je {frac} dňa.', en: "{time} on Tami's chronograph is {frac} of the day." },
  h3: {
    sk: '{frac} z 24 hodín je {t24}. Ciferník má len dvanásť dielikov, takže ručičky ukážu {t12}.',
    en: '{frac} of 24 hours is {t24}. The dial has only twelve divisions, so the hands show {t12}.',
  },
  wrong: {
    sk: 'Kyvadlo sa zakolíše a zastaví. Hodiny ešte nie sú v otcovom dni.',
    en: "The pendulum sways and stops. The clock isn't in father's day yet.",
  },
  close: { sk: 'Takmer… ručičky sú blízko, no kyvadlo sa aj tak zastaví.', en: 'Almost… the hands are close, but the pendulum still stops.' },
  failed: { sk: 'Hodiny mlčia. Skús to znova, pokojne.', en: 'The clock stays silent. Try again, calmly.' },
  alive: {
    sk: 'Hodiny ožili. Otcov deň a Tamin deň sú ten istý deň, len inak rozkrájaný.',
    en: "The clock comes alive. Father's day and Tami's day are the same day, only cut differently.",
  },
} satisfies Record<string, L>

const W = 800
const H = 470
const CHX = 190
const CHY = 192
const CHR = 98
const WCX = 552
const WCY = 186
const WCR = 140
const TAU = Math.PI * 2
const MAX_MISTAKES = 3
const TOL_MIN = 10

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const mod = (v: number, m: number) => ((v % m) + m) % m
/** wrap an angle into (-PI, PI] */
const wrapPi = (a: number) => {
  const r = mod(a + Math.PI, TAU) - Math.PI
  return r === -Math.PI ? Math.PI : r
}
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const pad2 = (n: number) => String(n).padStart(2, '0')

function fmt12(min: number): string {
  const m = Math.round(mod(min, 720))
  const h = Math.floor(m / 60) % 12
  return `${h === 0 ? 12 : h}:${pad2(m % 60)}`
}

function rrPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2)
  g.moveTo(x + rr, y)
  g.arcTo(x + w, y, x + w, y + h, rr)
  g.arcTo(x + w, y + h, x, y + h, rr)
  g.arcTo(x, y + h, x, y, rr)
  g.arcTo(x, y, x + w, y, rr)
  g.closePath()
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

// --------------------------------------------------------------------------- static art
function buildBackground(): HTMLCanvasElement {
  const r = Math.min(2, window.devicePixelRatio || 1)
  const c = document.createElement('canvas')
  c.width = Math.round(W * r)
  c.height = Math.round(H * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  const rnd = mulberry(7)
  g.fillStyle = '#170f0b'
  g.fillRect(0, 0, W, H)
  // vertical planks with grain
  for (let x = 0; x < W; x += 66) {
    const shade = 18 + Math.floor(rnd() * 10)
    g.fillStyle = `rgb(${shade + 10},${shade},${shade - 6})`
    g.fillRect(x, 0, 64, H)
    g.strokeStyle = 'rgba(0,0,0,0.25)'
    g.lineWidth = 1
    for (let k = 0; k < 6; k++) {
      const gx = x + 6 + rnd() * 52
      g.beginPath()
      g.moveTo(gx, 0)
      for (let y = 0; y <= H; y += 30) g.lineTo(gx + Math.sin(y * 0.02 + k) * 2.5, y)
      g.stroke()
    }
    g.fillStyle = 'rgba(0,0,0,0.5)'
    g.fillRect(x + 64, 0, 2, H)
  }
  // wainscot rail
  g.fillStyle = 'rgba(0,0,0,0.35)'
  g.fillRect(0, 418, W, 3)
  g.fillStyle = 'rgba(255,220,170,0.05)'
  g.fillRect(0, 421, W, 1)
  // lamp glow and vignette
  const lamp = g.createRadialGradient(150, 30, 10, 150, 30, 520)
  lamp.addColorStop(0, 'rgba(255,196,120,0.28)')
  lamp.addColorStop(0.5, 'rgba(255,170,90,0.08)')
  lamp.addColorStop(1, 'rgba(255,170,90,0)')
  g.fillStyle = lamp
  g.fillRect(0, 0, W, H)
  const vig = g.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 560)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.6)')
  g.fillStyle = vig
  g.fillRect(0, 0, W, H)
  return c
}

function drawAnchor(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.save()
  g.translate(x, y)
  g.scale(s, s)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  const paint = (color: string, lw: number, dx: number, dy: number) => {
    g.strokeStyle = color
    g.fillStyle = color
    g.lineWidth = lw
    g.beginPath()
    g.arc(dx, -8 + dy, 2.3, 0, TAU)
    g.stroke()
    g.beginPath()
    g.moveTo(dx, -5.7 + dy)
    g.lineTo(dx, 8.2 + dy)
    g.moveTo(-4.6 + dx, -3.4 + dy)
    g.lineTo(4.6 + dx, -3.4 + dy)
    g.stroke()
    g.beginPath()
    g.arc(dx, 2 + dy, 6.2, 0.12 * Math.PI, 0.88 * Math.PI)
    g.stroke()
    for (const a of [0.12 * Math.PI, 0.88 * Math.PI]) {
      const px = dx + Math.cos(a) * 6.2
      const py = 2 + dy + Math.sin(a) * 6.2
      const side = a < Math.PI / 2 ? 1 : -1
      g.beginPath()
      g.moveTo(px, py)
      g.lineTo(px + side * 2.2, py - 3.2)
      g.lineTo(px - side * 0.6, py - 1.4)
      g.closePath()
      g.fill()
    }
  }
  paint('rgba(60,36,14,0.45)', 1.9, 0.6, 0.8)
  paint('#9c7330', 1.7, 0, 0)
  g.restore()
}

function brassRing(g: CanvasRenderingContext2D, x: number, y: number, r0: number, r1: number): void {
  const grad = g.createLinearGradient(x - r1, y - r1, x + r1, y + r1)
  grad.addColorStop(0, '#f6dc96')
  grad.addColorStop(0.35, '#b8893e')
  grad.addColorStop(0.6, '#e9c77c')
  grad.addColorStop(1, '#6e4c1c')
  g.fillStyle = grad
  g.beginPath()
  g.arc(x, y, r1, 0, TAU)
  g.arc(x, y, r0, 0, TAU, true)
  g.fill()
}

function buildWallClock(): HTMLCanvasElement {
  const r = Math.min(2, window.devicePixelRatio || 1)
  const c = document.createElement('canvas')
  c.width = Math.round(W * r)
  c.height = Math.round(H * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  const rnd = mulberry(21)
  // case silhouette: round head + pendulum trunk
  const caseShape = () => {
    g.beginPath()
    g.arc(WCX, WCY, WCR + 30, 0, TAU)
    rrPath(g, WCX - 84, WCY + 40, 168, H - WCY - 34, 14)
  }
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.7)'
  g.shadowBlur = 30
  g.shadowOffsetY = 12
  g.fillStyle = '#2a140c'
  caseShape()
  g.fill()
  g.restore()
  g.save()
  caseShape()
  g.clip()
  const wood = g.createLinearGradient(WCX - 180, 0, WCX + 180, 0)
  wood.addColorStop(0, '#2b130b')
  wood.addColorStop(0.3, '#5a2a17')
  wood.addColorStop(0.55, '#6b331c')
  wood.addColorStop(1, '#25110a')
  g.fillStyle = wood
  g.fillRect(WCX - 200, 0, 400, H)
  g.strokeStyle = 'rgba(20,6,2,0.35)'
  g.lineWidth = 1
  for (let k = 0; k < 26; k++) {
    const x0 = WCX - 180 + rnd() * 360
    g.beginPath()
    g.moveTo(x0, 0)
    for (let y = 0; y <= H; y += 24) g.lineTo(x0 + Math.sin(y * 0.03 + k) * 4, y)
    g.stroke()
  }
  // carved bevel on the head
  g.strokeStyle = 'rgba(255,200,150,0.12)'
  g.lineWidth = 2
  g.beginPath()
  g.arc(WCX, WCY, WCR + 24, Math.PI * 1.05, Math.PI * 1.95)
  g.stroke()
  g.restore()
  // brass bezel + dial
  brassRing(g, WCX, WCY, WCR - 1, WCR + 10)
  const dial = g.createRadialGradient(WCX - 30, WCY - 40, 20, WCX, WCY, WCR)
  dial.addColorStop(0, '#fbf3df')
  dial.addColorStop(0.75, '#ece0c2')
  dial.addColorStop(1, '#cdb88c')
  g.fillStyle = dial
  g.beginPath()
  g.arc(WCX, WCY, WCR, 0, TAU)
  g.fill()
  // ageing spots
  for (let k = 0; k < 14; k++) {
    const a = rnd() * TAU
    const d = rnd() * WCR * 0.9
    const sr = 6 + rnd() * 18
    const sp = g.createRadialGradient(WCX + Math.cos(a) * d, WCY + Math.sin(a) * d, 0, WCX + Math.cos(a) * d, WCY + Math.sin(a) * d, sr)
    sp.addColorStop(0, 'rgba(150,110,50,0.08)')
    sp.addColorStop(1, 'rgba(150,110,50,0)')
    g.fillStyle = sp
    g.fillRect(WCX - WCR, WCY - WCR, WCR * 2, WCR * 2)
  }
  // rings and ticks
  g.strokeStyle = 'rgba(42,29,18,0.8)'
  g.lineWidth = 1
  for (const rr of [WCR - 8, WCR - 20, WCR * 0.6]) {
    g.beginPath()
    g.arc(WCX, WCY, rr, 0, TAU)
    g.stroke()
  }
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * TAU - Math.PI / 2
    const major = k % 5 === 0
    const r0 = major ? WCR - 22 : WCR - 18
    g.lineWidth = major ? 3 : 1
    g.beginPath()
    g.moveTo(WCX + Math.cos(a) * r0, WCY + Math.sin(a) * r0)
    g.lineTo(WCX + Math.cos(a) * (WCR - 8), WCY + Math.sin(a) * (WCR - 8))
    g.stroke()
  }
  const ROMAN = ['', 'I', 'II', '', 'IV', 'V', '', 'VII', 'VIII', '', 'X', 'XI', '']
  g.fillStyle = '#2a1d12'
  g.font = '600 19px Cinzel, serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (let k = 1; k <= 12; k++) {
    const a = (k / 12) * TAU - Math.PI / 2
    const x = WCX + Math.cos(a) * (WCR - 42)
    const y = WCY + Math.sin(a) * (WCR - 42)
    if (k % 3 === 0) drawAnchor(g, x, y, 1.35)
    else g.fillText(ROMAN[k], x, y + 1)
  }
  // winding holes
  for (const dx of [-36, 36]) {
    brassRing(g, WCX + dx, WCY + 46, 4.5, 8)
    g.fillStyle = '#120a06'
    g.beginPath()
    g.arc(WCX + dx, WCY + 46, 4.5, 0, TAU)
    g.fill()
    g.fillStyle = '#6d5424'
    g.fillRect(WCX + dx - 1.2, WCY + 43, 2.4, 6)
  }
  // plaque between dial and pendulum window
  const pg = g.createLinearGradient(0, WCY + WCR + 10, 0, WCY + WCR + 32)
  pg.addColorStop(0, '#e6c47a')
  pg.addColorStop(1, '#8a6528')
  g.fillStyle = pg
  g.beginPath()
  rrPath(g, WCX - 40, WCY + WCR + 12, 80, 22, 4)
  g.fill()
  g.strokeStyle = 'rgba(60,36,10,0.7)'
  g.lineWidth = 1
  g.stroke()
  // pendulum window
  g.fillStyle = '#0d0705'
  g.beginPath()
  rrPath(g, WCX - 54, WCY + WCR + 42, 108, H - (WCY + WCR + 42) - 8, 8)
  g.fill()
  g.strokeStyle = '#b8893e'
  g.lineWidth = 2
  g.stroke()
  return c
}

/** Tami's chronograph case and dial (static parts). */
function buildChrono(): HTMLCanvasElement {
  const r = Math.min(2, window.devicePixelRatio || 1)
  const c = document.createElement('canvas')
  c.width = Math.round(W * r)
  c.height = Math.round(H * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  // chain: links along a sagging curve from the bow to the corner
  {
    const p0 = { x: CHX, y: CHY - CHR - 37 }
    const c0 = { x: CHX - 70, y: CHY - CHR + 10 }
    const p1 = { x: -8, y: 18 }
    const at = (t: number) => ({
      x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c0.x + t * t * p1.x,
      y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c0.y + t * t * p1.y,
    })
    const N = 30
    for (let k = 0; k < N; k++) {
      const a = at(k / N)
      const b = at((k + 1) / N)
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      g.strokeStyle = k % 2 ? '#8a6428' : '#c9a052'
      g.lineWidth = k % 2 ? 1.6 : 2
      g.beginPath()
      if (k % 2) {
        g.moveTo(mx - Math.cos(ang) * 4, my - Math.sin(ang) * 4)
        g.lineTo(mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4)
      } else g.ellipse(mx, my, 5, 2.8, ang, 0, TAU)
      g.stroke()
    }
  }
  // bow + crown
  g.strokeStyle = '#d8b46a'
  g.lineWidth = 3
  g.beginPath()
  g.arc(CHX, CHY - CHR - 28, 9, 0, TAU)
  g.stroke()
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.65)'
  g.shadowBlur = 24
  g.shadowOffsetY = 8
  brassRing(g, CHX, CHY, CHR - 2, CHR + 12)
  g.restore()
  // knurled edge
  g.strokeStyle = 'rgba(70,46,14,0.6)'
  g.lineWidth = 1
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * TAU
    g.beginPath()
    g.moveTo(CHX + Math.cos(a) * (CHR + 8), CHY + Math.sin(a) * (CHR + 8))
    g.lineTo(CHX + Math.cos(a) * (CHR + 12), CHY + Math.sin(a) * (CHR + 12))
    g.stroke()
  }
  const dial = g.createRadialGradient(CHX - 20, CHY - 30, 10, CHX, CHY, CHR)
  dial.addColorStop(0, '#1d3242')
  dial.addColorStop(0.7, '#0f1c27')
  dial.addColorStop(1, '#070d13')
  g.fillStyle = dial
  g.beginPath()
  g.arc(CHX, CHY, CHR - 1, 0, TAU)
  g.fill()
  // glyph engraving ring
  g.strokeStyle = 'rgba(95,242,224,0.14)'
  g.lineWidth = 1
  g.beginPath()
  g.arc(CHX, CHY, CHR - 34, 0, TAU)
  g.stroke()
  for (let k = 0; k < 21; k++) {
    const a = (k / 21) * TAU - Math.PI / 2
    const major = k % 3 === 0
    g.strokeStyle = major ? 'rgba(243,217,149,0.95)' : 'rgba(243,217,149,0.55)'
    g.lineWidth = major ? 2.2 : 1
    g.beginPath()
    g.moveTo(CHX + Math.cos(a) * (CHR - (major ? 12 : 8)), CHY + Math.sin(a) * (CHR - (major ? 12 : 8)))
    g.lineTo(CHX + Math.cos(a) * (CHR - 3), CHY + Math.sin(a) * (CHR - 3))
    g.stroke()
    g.fillStyle = major ? '#f3d995' : 'rgba(243,217,149,0.7)'
    g.font = `${major ? 600 : 400} ${major ? 12 : 10}px Cinzel, serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(String(k), CHX + Math.cos(a) * (CHR - 24), CHY + Math.sin(a) * (CHR - 24))
  }
  // seconds subdial
  g.strokeStyle = 'rgba(243,217,149,0.4)'
  g.beginPath()
  g.arc(CHX, CHY + 42, 15, 0, TAU)
  g.stroke()
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU
    g.beginPath()
    g.moveTo(CHX + Math.cos(a) * 12, CHY + 42 + Math.sin(a) * 12)
    g.lineTo(CHX + Math.cos(a) * 15, CHY + 42 + Math.sin(a) * 15)
    g.stroke()
  }
  return c
}

function drawHand(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  kind: 'hour' | 'minute' | 'second' | 'chH' | 'chM',
  glow: number,
  R: number,
): void {
  g.save()
  g.translate(x, y)
  g.rotate(ang)
  g.shadowColor = 'rgba(0,0,0,0.4)'
  g.shadowBlur = 3
  g.shadowOffsetX = 2
  g.shadowOffsetY = 3
  if (glow > 0) {
    g.shadowColor = `rgba(243,217,149,${0.9 * glow})`
    g.shadowBlur = 14 * glow
    g.shadowOffsetX = 0
    g.shadowOffsetY = 0
  }
  g.beginPath()
  if (kind === 'hour') {
    const L = R * 0.55
    g.moveTo(-3.2, R * 0.1)
    g.lineTo(-2.4, -L * 0.62)
    g.bezierCurveTo(-13, -L * 0.7, -10, -L * 0.92, 0, -L)
    g.bezierCurveTo(10, -L * 0.92, 13, -L * 0.7, 2.4, -L * 0.62)
    g.lineTo(3.2, R * 0.1)
    g.closePath()
    g.fillStyle = '#18213b'
    g.fill()
    g.fillStyle = '#ece0c2'
    g.beginPath()
    g.ellipse(0, -L * 0.77, 2.6, 5, 0, 0, TAU)
    g.fill()
  } else if (kind === 'minute') {
    const L = R * 0.86
    g.moveTo(-2.4, R * 0.14)
    g.lineTo(-1.4, -L * 0.8)
    g.lineTo(-5.5, -L * 0.86)
    g.lineTo(0, -L)
    g.lineTo(5.5, -L * 0.86)
    g.lineTo(1.4, -L * 0.8)
    g.lineTo(2.4, R * 0.14)
    g.closePath()
    g.fillStyle = '#18213b'
    g.fill()
  } else if (kind === 'second') {
    g.strokeStyle = '#a5302a'
    g.lineWidth = 1.4
    g.moveTo(0, R * 0.22)
    g.lineTo(0, -R * 0.9)
    g.stroke()
    g.fillStyle = '#a5302a'
    g.beginPath()
    g.arc(0, R * 0.16, 3.4, 0, TAU)
    g.fill()
  } else {
    const L = kind === 'chH' ? R * 0.52 : R * 0.8
    const w = kind === 'chH' ? 4 : 2.6
    g.moveTo(-w / 2, R * 0.1)
    g.lineTo(-w / 2, -L + 8)
    g.lineTo(0, -L)
    g.lineTo(w / 2, -L + 8)
    g.lineTo(w / 2, R * 0.1)
    g.closePath()
    g.fillStyle = '#f0cf86'
    g.fill()
  }
  g.restore()
}

// --------------------------------------------------------------------------- the minigame
function runClock(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  const ahH = Math.round(clamp(num(params.ahilHour, 14), 0, 20))
  const ahM = Math.round(clamp(num(params.ahilMinute, 0), 0, 59))
  const ahilMin = ahH * 60 + ahM
  const dayMin = Math.round((ahilMin / 1260) * 1440)
  const target = mod(dayMin, 720)
  const reduced = ctx.assist.reducedMotion
  const g0 = gcd(ahilMin, 1260)
  const fracNum = ahilMin / g0
  const fracDen = 1260 / g0
  const fracStr =
    ahilMin === 0 ? '0' : fracDen <= 21 ? `${fracNum}/${fracDen}` : ctx.lang === 'sk' ? `${Math.round((ahilMin / 1260) * 100)} %` : `${Math.round((ahilMin / 1260) * 100)}%`
  const ahilStr = `${ahH}:${pad2(ahM)}`
  const t24 = `${Math.floor(dayMin / 60) % 24}:${pad2(dayMin % 60)}`

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
      const reserve = 262 + (note.style.display === 'block' ? note.offsetHeight + 12 : 0)
      const s = Math.min(1, (window.innerWidth * 0.94 - 60) / W, (window.innerHeight * 0.92 - reserve) / H)
      canvas.style.width = `${Math.round(W * Math.max(0.4, s))}px`
      canvas.style.height = `${Math.round(H * Math.max(0.4, s))}px`
    }
    window.addEventListener('resize', fit)
    cleanups.push(() => window.removeEventListener('resize', fit))
    card.body.appendChild(canvas)
    const note = document.createElement('div')
    note.style.cssText =
      'max-width:760px;margin:2px auto 0;font-family:var(--nv-font-body);font-style:italic;font-size:calc(16px * var(--nv-text-scale));' +
      'color:var(--nv-text);border-left:2px solid var(--nv-gold);padding:6px 12px;background:rgba(40,30,18,.45);border-radius:4px;display:none;line-height:1.35'
    card.body.appendChild(note)
    fit()

    const bg = buildBackground()
    const wallArt = buildWallClock()
    const chronoArt = buildChrono()

    // ------------------------------------------------------------------ state
    const initial = Math.abs(wrapMin(mod(9 * 60 + 47, 720) - target)) < 90 ? 2 * 60 + 13 : 9 * 60 + 47
    let setMin = initial
    let dispMin = initial
    let hints = 0
    let mistakes = 0
    let mode: 'play' | 'swing' | 'running' | 'ended' = 'play'
    let drag: { hand: 'h' | 'm'; last: number } | null = null
    let hover: 'h' | 'm' | null = null
    let pend = { amp: 0, phase: 0, decay: 0 }
    let runT = 0
    let secStep = 37
    let crownPress = 0
    let clicksLit = 0
    let ribbon = 0
    let glow = 0
    let lastTickMin = Math.round(initial / 5)
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = []

    function wrapMin(d: number): number {
      const r = mod(d + 360, 720) - 360
      return r
    }

    // blur after a mouse click so Enter keeps meaning "swing the pendulum"
    const hintBtn = button(`${ctx.t(S.hintBtn)} (H)`, () => {
      useHint()
      hintBtn.blur()
    })
    const swingBtn = button(`${ctx.t(S.swing)} ⏎`, () => swing(), true)
    card.buttons.append(hintBtn, swingBtn)

    function updateHintBtn(): void {
      hintBtn.textContent = hints >= 3 ? `${ctx.t(S.hintBtn)} 3/3` : `${ctx.t(S.hintBtn)} ${hints}/3 (H)`
      hintBtn.disabled = hints >= 3 || mode !== 'play'
    }
    updateHintBtn()

    function useHint(): void {
      if (hints >= 3 || mode !== 'play') return
      hints++
      ctx.sfx('page')
      const parts = [ctx.t(S.h1)]
      if (hints >= 2) parts.push(ctx.t(S.h2, { time: ahilStr, frac: fracStr }))
      if (hints >= 3) parts.push(ctx.t(S.h3, { frac: fracStr, t24, t12: fmt12(target) }))
      note.textContent = parts.join(' ')
      note.style.display = 'block'
      fit()
      if (hints === 1) {
        clicksLit = 0
        for (let k = 0; k < 3; k++) {
          setTimeout(() => {
            crownPress = 1
            clicksLit = k + 1
            ctx.sfx('click')
          }, 350 + k * (reduced ? 200 : 420))
        }
      }
      updateHintBtn()
    }

    function nudge(delta: number): void {
      if (mode !== 'play') return
      setMin = mod(Math.round(setMin + delta), 720)
      ctx.sfx('tick')
    }

    function swing(): void {
      if (mode !== 'play') return
      drag = null
      setMin = mod(Math.round(setMin), 720)
      dispMin = setMin
      const diff = Math.abs(wrapMin(setMin - target))
      ctx.sfx('whoosh')
      if (diff <= TOL_MIN) {
        mode = 'running'
        runT = 0
        if (!reduced) {
          for (let k = 0; k < 70; k++) {
            const a = Math.random() * TAU
            const sp = 40 + Math.random() * 120
            sparks.push({ x: WCX + Math.cos(a) * WCR, y: WCY + Math.sin(a) * WCR, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0.8 + Math.random() * 1.2 })
          }
        }
        pend = { amp: 0.34, phase: 0, decay: 0 }
        hintBtn.disabled = true
        swingBtn.disabled = true
        card.hint.textContent = ctx.t(S.alive)
        card.hint.style.color = 'var(--nv-gold-bright)'
        const hour12 = Math.floor(setMin / 60) % 12 || 12
        const strikes = reduced ? 1 : hour12
        for (let k = 0; k < strikes; k++) setTimeout(() => ctx.sfx('chime'), 1300 + k * 600)
        setTimeout(
          () => {
            ctx.sfx('success')
            const score = Math.round(Math.max(0.3, 1 - 0.15 * hints - 0.2 * mistakes) * 100) / 100
            const cont = button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { time: fmt12(setMin), hints, mistakes } }), true)
            card.buttons.replaceChildren(cont)
            cont.focus()
          },
          1500 + strikes * 600,
        )
        return
      }
      mode = 'swing'
      mistakes++
      pend = { amp: 0.3, phase: 0, decay: 1.1 }
      card.hint.textContent = ctx.t(diff <= 45 ? S.close : S.wrong)
      card.hint.style.color = 'var(--nv-danger)'
      updateHintBtn()
      swingBtn.disabled = true
      setTimeout(() => ctx.sfx('tick'), 500)
      setTimeout(() => ctx.sfx('tick'), 1100)
      setTimeout(
        () => {
          if (mistakes >= MAX_MISTAKES) {
            showFailure()
            return
          }
          mode = 'play'
          swingBtn.disabled = false
          updateHintBtn()
          card.hint.textContent = ctx.t(S.hint)
          card.hint.style.color = ''
        },
        reduced ? 900 : 2300,
      )
    }

    function showFailure(): void {
      mode = 'ended'
      ctx.sfx('fail')
      card.hint.textContent = `${ctx.t(S.failed)}`
      card.hint.style.color = 'var(--nv-danger)'
      const retry = button(
        ctx.t(UI_STRINGS.retry),
        () => {
          mistakes = 0
          setMin = initial
          dispMin = initial
          mode = 'play'
          card.hint.textContent = ctx.t(S.hint)
          card.hint.style.color = ''
          card.buttons.replaceChildren(hintBtn, swingBtn)
          swingBtn.disabled = false
          updateHintBtn()
        },
        true,
      )
      card.buttons.replaceChildren(retry)
      if (ctx.assist.skipAllowed) card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      retry.focus()
    }

    // ------------------------------------------------------------------ input
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    const angleAt = (x: number, y: number) => Math.atan2(x - WCX, -(y - WCY))
    function pickHand(x: number, y: number): 'h' | 'm' | null {
      const d = Math.hypot(x - WCX, y - WCY)
      if (d > WCR + 14) return null
      const a = angleAt(x, y)
      const ha = (dispMin / 720) * TAU
      const ma = ((dispMin % 60) / 60) * TAU
      const sh = Math.abs(wrapPi(a - ha)) + (d > WCR * 0.66 ? 0.5 : 0)
      const sm = Math.abs(wrapPi(a - ma)) + (d < WCR * 0.4 ? 0.5 : 0)
      return sh < sm ? 'h' : 'm'
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (mode !== 'play') return
      const p = local(e)
      const hand = pickHand(p.x, p.y)
      if (!hand) return
      e.preventDefault()
      drag = { hand, last: angleAt(p.x, p.y) }
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    })
    canvas.addEventListener('pointermove', (e) => {
      const p = local(e)
      if (!drag) {
        hover = mode === 'play' ? pickHand(p.x, p.y) : null
        canvas.style.cursor = hover ? 'grab' : 'default'
        return
      }
      const a = angleAt(p.x, p.y)
      const delta = wrapPi(a - drag.last)
      drag.last = a
      setMin = mod(setMin + (delta / TAU) * (drag.hand === 'm' ? 60 : 720), 720)
      dispMin = setMin
      const tk = Math.round(setMin / 5)
      if (tk !== lastTickMin) {
        lastTickMin = tk
        ctx.sfx('tick')
      }
    })
    const endDrag = () => {
      if (!drag) return
      drag = null
      setMin = mod(Math.round(setMin), 720)
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)

    ctx.onKey((e) => {
      if (finished || mode !== 'play') return
      const active = document.activeElement
      if ((e.key === 'Enter' || e.key === ' ') && active instanceof HTMLButtonElement && ctx.root.contains(active)) return
      const fine = e.shiftKey ? 1 : 5
      switch (e.code) {
        case 'KeyQ':
        case 'ArrowDown':
          nudge(-60)
          break
        case 'KeyE':
        case 'ArrowUp':
          nudge(60)
          break
        case 'KeyA':
        case 'ArrowLeft':
          nudge(-fine)
          break
        case 'KeyD':
        case 'ArrowRight':
          nudge(fine)
          break
        case 'Enter':
        case 'NumpadEnter':
        case 'Space':
          swing()
          break
        case 'KeyH':
          useHint()
          break
        default:
          return
      }
      e.preventDefault()
    })

    // ------------------------------------------------------------------ drawing
    interface Mote {
      x: number
      y: number
      v: number
      a: number
    }
    const motes: Mote[] = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 3 + Math.random() * 6, a: Math.random() }))

    function drawRibbon(a: number): void {
      if (a <= 0) return
      const x0 = 46
      const x1 = 300
      const y = 420
      g.save()
      g.globalAlpha = a
      g.fillStyle = 'rgba(10,8,6,0.55)'
      g.beginPath()
      rrPath(g, x0 - 16, y - 32, x1 - x0 + 66, 66, 8)
      g.fill()
      g.strokeStyle = 'rgba(214,178,106,0.4)'
      g.lineWidth = 1
      g.stroke()
      const grad = g.createLinearGradient(x0, 0, x1, 0)
      grad.addColorStop(0, '#2b3d5e')
      grad.addColorStop(0.25, '#d9a45a')
      grad.addColorStop(0.5, '#f3d995')
      grad.addColorStop(0.75, '#d9a45a')
      grad.addColorStop(1, '#2b3d5e')
      g.fillStyle = grad
      g.fillRect(x0, y - 3, x1 - x0, 6)
      g.font = '10px Cinzel, serif'
      g.textAlign = 'center'
      g.fillStyle = '#f3d995'
      g.strokeStyle = 'rgba(243,217,149,0.8)'
      for (let k = 0; k <= 21; k++) {
        const x = x0 + ((x1 - x0) * k) / 21
        g.beginPath()
        g.moveTo(x, y - 4)
        g.lineTo(x, y - (k % 3 === 0 ? 12 : 8))
        g.stroke()
        if (k % 3 === 0) g.fillText(String(k), x, y - 18)
      }
      g.fillStyle = '#9cc4ff'
      g.strokeStyle = 'rgba(156,196,255,0.8)'
      for (let k = 0; k <= 24; k++) {
        const x = x0 + ((x1 - x0) * k) / 24
        g.beginPath()
        g.moveTo(x, y + 4)
        g.lineTo(x, y + (k % 6 === 0 ? 12 : 8))
        g.stroke()
        if (k % 6 === 0) g.fillText(String(k), x, y + 24)
      }
      g.textAlign = 'left'
      g.font = 'italic 11px "EB Garamond", serif'
      g.fillStyle = 'rgba(236,228,212,0.7)'
      g.fillText('21 h', x1 + 14, y - 8)
      g.fillText('24 h', x1 + 14, y + 14)
      g.font = '600 8px Cinzel, serif'
      g.fillStyle = 'rgba(236,228,212,0.5)'
      g.fillText(ctx.t(S.dayRibbon).toUpperCase(), x1 + 14, y + 3)
      if (hints >= 2) {
        const fx = x0 + (x1 - x0) * (ahilMin / 1260)
        g.fillStyle = '#5ff2e0'
        g.shadowColor = '#5ff2e0'
        g.shadowBlur = 8
        g.beginPath()
        g.moveTo(fx, y - 2)
        g.lineTo(fx - 5, y - 10)
        g.lineTo(fx + 5, y - 10)
        g.closePath()
        g.fill()
        if (hints >= 3) {
          g.beginPath()
          g.moveTo(fx, y + 2)
          g.lineTo(fx - 5, y + 10)
          g.lineTo(fx + 5, y + 10)
          g.closePath()
          g.fill()
          g.setLineDash([3, 3])
          g.strokeStyle = 'rgba(95,242,224,0.7)'
          g.beginPath()
          g.moveTo(fx, y - 10)
          g.lineTo(fx, y + 10)
          g.stroke()
          g.setLineDash([])
        }
      }
      g.restore()
    }

    ctx.loop((dt, time) => {
      // state easing
      if (!drag) {
        const d = wrapMin(setMin - dispMin)
        dispMin = mod(dispMin + d * Math.min(1, dt * 16), 720)
      }
      crownPress = Math.max(0, crownPress - dt * 6)
      if (hints > 0) ribbon = Math.min(1, ribbon + dt * 1.5)
      if (mode === 'running') {
        runT += dt
        glow = Math.min(1, glow + dt * 0.8)
        const s = Math.floor(runT)
        if (s + 37 !== secStep) {
          secStep = s + 37
          ctx.sfx('tick')
        }
      }
      pend.phase += dt * (TAU / 1.25)
      if (pend.decay > 0) pend.amp = Math.max(0, pend.amp - pend.amp * dt * pend.decay - dt * 0.02)

      g.drawImage(bg, 0, 0, W, H)
      // dust motes in the lamp light
      for (const m of motes) {
        m.y -= m.v * dt
        m.x += Math.sin(time * 0.5 + m.a * 10) * 4 * dt
        if (m.y < -4) {
          m.y = H + 4
          m.x = Math.random() * W
        }
        const tw = 0.15 + 0.15 * Math.sin(time * 2 + m.a * 20)
        g.fillStyle = `rgba(255,220,170,${tw})`
        g.fillRect(m.x, m.y, 1.6, 1.6)
      }

      // ---------------- wall clock
      g.drawImage(wallArt, 0, 0, W, H)
      if (glow > 0) {
        const beat = 1 - Math.min(1, (runT % 1) * 3)
        g.save()
        g.globalCompositeOperation = 'lighter'
        const halo = g.createRadialGradient(WCX, WCY, WCR - 6, WCX, WCY, WCR + 70)
        halo.addColorStop(0, `rgba(255,206,120,${(0.32 + 0.18 * beat) * glow})`)
        halo.addColorStop(1, 'rgba(255,206,120,0)')
        g.fillStyle = halo
        g.beginPath()
        g.arc(WCX, WCY, WCR + 70, 0, TAU)
        g.arc(WCX, WCY, WCR - 6, 0, TAU, true)
        g.fill()
        g.fillStyle = `rgba(255,220,150,${0.07 * glow})`
        g.beginPath()
        g.arc(WCX, WCY, WCR, 0, TAU)
        g.fill()
        g.restore()
      }
      // golden sparks when the clock comes alive
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i]
        p.life -= dt
        if (p.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 30 * dt
        g.fillStyle = `rgba(255,224,150,${Math.min(1, p.life * 1.5)})`
        g.fillRect(p.x, p.y, 2, 2)
      }
      // pendulum
      const pivotY = WCY + WCR + 44
      const ang = pend.amp * Math.sin(pend.phase)
      const len = 74
      const bx = WCX + Math.sin(ang) * len
      const by = pivotY + Math.cos(ang) * len
      g.strokeStyle = '#b8893e'
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(WCX, pivotY - 4)
      g.lineTo(bx, by)
      g.stroke()
      const bob = g.createRadialGradient(bx - 5, by - 5, 2, bx, by, 16)
      bob.addColorStop(0, '#fff1c2')
      bob.addColorStop(0.4, '#d8ae5c')
      bob.addColorStop(1, '#6e4c1c')
      g.fillStyle = bob
      g.beginPath()
      g.arc(bx, by, 15, 0, TAU)
      g.fill()
      // window glass sheen
      g.fillStyle = 'rgba(255,255,255,0.05)'
      g.beginPath()
      g.moveTo(WCX - 50, pivotY - 2)
      g.lineTo(WCX - 22, pivotY - 2)
      g.lineTo(WCX - 46, H - 12)
      g.lineTo(WCX - 50, H - 12)
      g.closePath()
      g.fill()
      // plaque readout
      g.fillStyle = '#2a1a0a'
      g.font = '600 14px Cinzel, serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(fmt12(dispMin), WCX, WCY + WCR + 24)
      // hands
      const hAng = (dispMin / 720) * TAU
      const mAng = ((dispMin % 60) / 60) * TAU
      const sAng = mode === 'running' && runT >= 1 ? ((secStep - 1 + Math.min(1, (runT % 1) * 8)) / 60) * TAU : (secStep / 60) * TAU
      drawHand(g, WCX, WCY, hAng, 'hour', (drag?.hand === 'h' ? 1 : hover === 'h' ? 0.5 : 0) + glow * 0.3, WCR)
      drawHand(g, WCX, WCY, mAng, 'minute', (drag?.hand === 'm' ? 1 : hover === 'm' ? 0.5 : 0) + glow * 0.3, WCR)
      drawHand(g, WCX, WCY, sAng, 'second', 0, WCR)
      brassRing(g, WCX, WCY, 0, 7)
      g.fillStyle = '#3a2a12'
      g.beginPath()
      g.arc(WCX, WCY, 2, 0, TAU)
      g.fill()
      // glass reflection
      const refl = g.createLinearGradient(WCX - WCR, WCY - WCR, WCX, WCY)
      refl.addColorStop(0, 'rgba(255,255,255,0.13)')
      refl.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = refl
      g.beginPath()
      g.arc(WCX, WCY, WCR - 2, Math.PI * 1.02, Math.PI * 1.62)
      g.arc(WCX - 22, WCY - 18, WCR * 0.82, Math.PI * 1.6, Math.PI * 1.04, true)
      g.closePath()
      g.fill()

      // ---------------- Tami's chronograph
      g.drawImage(chronoArt, 0, 0, W, H)
      // crown (presses on hint)
      const cy = CHY - CHR - 16 + crownPress * 4
      const cg = g.createLinearGradient(CHX - 9, 0, CHX + 9, 0)
      cg.addColorStop(0, '#7a5520')
      cg.addColorStop(0.5, '#f3d995')
      cg.addColorStop(1, '#7a5520')
      g.fillStyle = cg
      g.beginPath()
      rrPath(g, CHX - 9, cy - 8, 18, 12, 3)
      g.fill()
      g.strokeStyle = 'rgba(60,36,10,0.6)'
      g.lineWidth = 1
      for (let k = -6; k <= 6; k += 3) {
        g.beginPath()
        g.moveTo(CHX + k, cy - 7)
        g.lineTo(CHX + k, cy + 3)
        g.stroke()
      }
      for (let k = 0; k < 3; k++) {
        const lit = k < clicksLit
        g.fillStyle = lit ? '#5ff2e0' : 'rgba(243,217,149,0.25)'
        if (lit) {
          g.shadowColor = '#5ff2e0'
          g.shadowBlur = 8
        }
        g.beginPath()
        g.arc(CHX + 22 + k * 10, CHY - CHR - 12, 3, 0, TAU)
        g.fill()
        g.shadowBlur = 0
      }
      drawHand(g, CHX, CHY, (ahilMin / 1260) * TAU, 'chH', 0, CHR)
      drawHand(g, CHX, CHY, (ahM / 60) * TAU, 'chM', 0, CHR)
      const chSec = (Math.floor(time) % 60) / 60
      g.strokeStyle = '#5ff2e0'
      g.lineWidth = 1.2
      g.beginPath()
      g.moveTo(CHX, CHY + 42)
      g.lineTo(CHX + Math.sin(chSec * TAU) * 12, CHY + 42 - Math.cos(chSec * TAU) * 12)
      g.stroke()
      brassRing(g, CHX, CHY, 0, 5.5)
      const cr = g.createLinearGradient(CHX - CHR, CHY - CHR, CHX, CHY)
      cr.addColorStop(0, 'rgba(255,255,255,0.12)')
      cr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = cr
      g.beginPath()
      g.arc(CHX, CHY, CHR - 3, Math.PI, Math.PI * 1.5)
      g.closePath()
      g.fill()
      // digital readout
      g.textAlign = 'center'
      g.fillStyle = '#f3d995'
      g.font = '600 30px Cinzel, serif'
      g.shadowColor = 'rgba(243,217,149,0.45)'
      g.shadowBlur = 10
      g.fillText(ahilStr, CHX, CHY + CHR + 40)
      g.shadowBlur = 0
      g.font = '600 12px Cinzel, serif'
      g.fillStyle = 'rgba(236,228,212,0.85)'
      g.fillText(ctx.t(S.chrono).toUpperCase(), CHX, CHY + CHR + 63)
      g.font = 'italic 13px "EB Garamond", serif'
      g.fillStyle = 'rgba(236,228,212,0.6)'
      g.fillText(ctx.t(S.chronoSub), CHX, CHY + CHR + 78)
      drawRibbon(ribbon)
    })
  })
}

registerMinigame('clock', () => ({ run: runClock }))
