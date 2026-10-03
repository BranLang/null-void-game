/**
 * HAIKU: learning a Spira haiku.
 *
 * Mother wrote haiku as safeguards: the first time, a haiku must be spoken
 * aloud; then the glyph appears and the body remembers. The player assembles
 * the three romanised lines from six fragments (three are decoys). Two clues
 * on the water-stained notebook page make it fair: syllable beads (the 5-7-5
 * rhythm) and the faded first syllable of every line. When the haiku sings,
 * each line is "spoken" bead by bead, its translation fades in, and the glyph
 * cuts itself into the palm.
 *
 * params: { haiku?: 'veil' | 'water' | 'earth' | 'heal' }   (default 'veil')
 * result: { success, score, data: { haiku, mistakes } }
 *         skipped: { success: true, score: 0, data: { skipped: true } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import type { L } from '../../i18n/i18n'

type HaikuKey = 'veil' | 'water' | 'earth' | 'heal'

interface Fragment {
  text: string
  syl: string[]
}

interface HaikuDef {
  name: L
  lines: [Fragment, Fragment, Fragment]
  tr: [L, L, L]
  /** one decoy per line: each matches only one of the two clues (bead count / first syllable) */
  decoys: [Fragment, Fragment, Fragment]
  color: string
}

const fr = (text: string, syl: string): Fragment => ({ text, syl: syl.split('-') })

const HAIKU: Record<HaikuKey, HaikuDef> = {
  veil: {
    name: { sk: 'Haiku závoja', en: 'Haiku of the Veil' },
    lines: [fr('Hi wo keshite', 'hi-wo-ke-shi-te'), fr('Shizukesa kotae', 'shi-zu-ke-sa-ko-ta-e'), fr('Koe yori mo', 'ko-e-yo-ri-mo')],
    tr: [
      { sk: 'Keď zhasneš oheň,', en: 'When you put out the fire,' },
      { sk: 'ticho ti odpovedá,', en: 'silence answers you,' },
      { sk: 'plnšie ako hlas.', en: 'fuller than a voice.' },
    ],
    decoys: [fr('Hi wo kesu', 'hi-wo-ke-su'), fr('Shizuka na yoru', 'shi-zu-ka-na-yo-ru'), fr('Kaze no oto', 'ka-ze-no-o-to')],
    color: '#b77dff',
  },
  water: {
    name: { sk: 'Haiku vody', en: 'Haiku of Water' },
    lines: [fr('Mizu no te de', 'mi-zu-no-te-de'), fr('Iki no michi hirake', 'i-ki-no-mi-chi-hi-ra-ke'), fr('Shizuka nare', 'shi-zu-ka-na-re')],
    tr: [
      { sk: 'Vodnou rukou', en: 'With a hand of water,' },
      { sk: 'otvor cestu dychu,', en: 'open the path of breath,' },
      { sk: 'buď tichá.', en: 'be still.' },
    ],
    decoys: [fr('Mizu no naka de', 'mi-zu-no-na-ka-de'), fr('Iki wo tomete', 'i-ki-wo-to-me-te'), fr('Ame no koe', 'a-me-no-ko-e')],
    color: '#5ff2e0',
  },
  earth: {
    name: { sk: 'Haiku zeme', en: 'Haiku of Earth' },
    lines: [fr('Chi no ishi yo', 'chi-no-i-shi-yo'), fr('Katachi wo kizame', 'ka-ta-chi-wo-ki-za-me'), fr('Tsuchi shizuka', 'tsu-chi-shi-zu-ka')],
    tr: [
      { sk: 'Kameň zeme,', en: 'Stone of the earth,' },
      { sk: 'vyryj tvar,', en: 'carve the shape,' },
      { sk: 'zem je tichá.', en: 'the soil is still.' },
    ],
    decoys: [fr('Chi wo hau', 'chi-wo-ha-u'), fr('Kaze wo kiru', 'ka-ze-wo-ki-ru'), fr('Iwa no koe', 'i-wa-no-ko-e')],
    color: '#d39a5a',
  },
  heal: {
    name: { sk: 'Haiku hojenia', en: 'Haiku of Healing' },
    lines: [fr('Kizu no ue', 'ki-zu-no-u-e'), fr('Hikari wo nuite', 'hi-ka-ri-wo-nu-i-te'), fr('Itami kiyu', 'i-ta-mi-ki-yu')],
    tr: [
      { sk: 'Na ranu', en: 'Upon the wound' },
      { sk: 'prišívam svetlo,', en: 'I stitch the light,' },
      { sk: 'bolesť odchádza.', en: 'the pain departs.' },
    ],
    decoys: [fr('Kizu wa fukai', 'ki-zu-wa-fu-ka-i'), fr('Hito no te yo', 'hi-to-no-te-yo'), fr('Yami no naka', 'ya-mi-no-na-ka')],
    color: '#6f9dff',
  },
}

const S = {
  sub: {
    sk: 'Matka písala haiku ako poistky. Prvý raz ho treba vysloviť nahlas. Potom sa zjaví glyf a telo si zapamätá.',
    en: 'Mother wrote haiku as safeguards. The first time, it must be spoken aloud. Then the glyph appears and the body remembers.',
  },
  hint: {
    sk: 'Zlož tri verše. Koráliky slabík a zvyšky atramentu napovedia, kam ktorý patrí. Klikni alebo potiahni úlomok · šípky + Enter',
    en: 'Assemble the three lines. The syllable beads and ink remnants tell you where each belongs. Click or drag a fragment · arrows + Enter',
  },
  page: { sk: 'Matkin zápisník', en: "Mother's notebook" },
  missteps: { sk: 'Omyly', en: 'Missteps' },
  wrong: { sk: 'Slová nespievajú. Rytmus sa láme.', en: 'The words do not sing. The rhythm breaks.' },
  speak: { sk: 'Vyslov ju nahlas…', en: 'Speak it aloud…' },
  cutting: { sk: 'Glyf sa vrezáva do dlane…', en: 'The glyph cuts into your palm…' },
  remember: { sk: 'Telo si pamätá.', en: 'The body remembers.' },
  failed: { sk: 'Haiku sa ti rozsypalo na jazyku.', en: 'The haiku crumbles on your tongue.' },
} satisfies Record<string, L>

const CSS = `
.nvhk{display:flex;flex-direction:column;align-items:center;gap:12px}
.nvhk-top{display:flex;gap:24px;align-items:center;justify-content:center;flex-wrap:wrap}
.nvhk-page{display:flex;flex-direction:column;gap:8px;width:min(480px,86vw)}
.nvhk-label{font-family:var(--nv-font-title);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--nv-text-dim);opacity:.8;padding-left:4px}
.nvhk-slot{position:relative;box-sizing:border-box;min-height:54px;border:1px dashed rgba(214,178,106,.42);border-radius:9px;
  background:linear-gradient(180deg,rgba(44,35,24,.55),rgba(18,14,10,.62));display:flex;align-items:center;gap:12px;
  padding:7px 14px;cursor:pointer;transition:border-color .2s,box-shadow .25s,background .25s;touch-action:none;user-select:none}
.nvhk-slot.target{border-color:rgba(243,217,149,.75)}
.nvhk-slot.focus{box-shadow:inset 0 0 0 2px var(--nv-gold),0 0 16px rgba(214,178,106,.3)}
.nvhk-slot.over{border-color:var(--nv-gold-bright);background:rgba(66,52,32,.7)}
.nvhk-slot.bad{animation:nvhk-shake .45s;border-color:var(--nv-danger);box-shadow:0 0 16px rgba(255,90,106,.45)}
.nvhk-slot.good{border-style:solid;border-color:var(--hk-color);box-shadow:0 0 18px var(--hk-glow)}
.nvhk-slot.speaking{border-style:solid;border-color:var(--hk-color);box-shadow:0 0 26px var(--hk-glow),inset 0 0 20px var(--hk-glow)}
.nvhk-num{font-family:var(--nv-font-title);color:var(--nv-gold);font-size:13px;width:14px;opacity:.75}
.nvhk-rem{font-family:var(--nv-font-body);font-style:italic;color:rgba(222,196,140,.5);font-size:21px;min-width:46px;
  filter:blur(.4px);text-shadow:0 0 8px rgba(120,90,40,.5)}
.nvhk-text{flex:1;font-family:var(--nv-font-body);font-style:italic;font-size:calc(23px * var(--nv-text-scale));color:#f3e6c4;letter-spacing:.02em}
.nvhk-slot.speaking .nvhk-text{color:#fff;text-shadow:0 0 12px var(--hk-color)}
.nvhk-beads{display:flex;gap:4px;align-items:center}
.nvhk-bead{width:8px;height:8px;border-radius:50%;border:1px solid rgba(214,178,106,.55);box-sizing:border-box;transition:background .15s,box-shadow .15s,border-color .15s}
.nvhk-bead.on{background:rgba(243,217,149,.85);border-color:rgba(243,217,149,.9)}
.nvhk-bead.extra{background:rgba(255,90,106,.85);border-color:rgba(255,90,106,.9)}
.nvhk-bead.lit{background:#fff;border-color:var(--hk-color);box-shadow:0 0 10px var(--hk-color),0 0 3px #fff}
.nvhk-tr{font-family:var(--nv-font-body);font-size:calc(18px * var(--nv-text-scale));color:var(--nv-text);padding:0 14px 0 38px;
  max-height:0;opacity:0;transform:translateY(-6px);transition:opacity 1.1s ease,transform 1.1s ease,max-height .6s ease;overflow:hidden}
.nvhk-tr.show{max-height:40px;opacity:.92;transform:none}
.nvhk-pool{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:820px;min-height:62px;transition:opacity .5s}
.nvhk-tile{font-family:var(--nv-font-body);font-style:italic;font-size:calc(20px * var(--nv-text-scale));color:var(--nv-text);
  background:linear-gradient(180deg,rgba(38,30,54,.96),rgba(16,12,24,.96));border:1px solid var(--nv-line);border-radius:22px;
  padding:7px 18px 6px;cursor:grab;user-select:none;display:flex;flex-direction:column;align-items:center;gap:5px;
  transition:transform .15s,border-color .15s,box-shadow .15s,opacity .25s;touch-action:none}
.nvhk-tile:hover,.nvhk-tile.focus{border-color:var(--nv-gold);box-shadow:0 0 14px rgba(214,178,106,.35);transform:translateY(-2px)}
.nvhk-tile .nvhk-bead{width:6px;height:6px;background:rgba(214,178,106,.6);border:none}
.nvhk-tile.ghost{opacity:.18;cursor:default;box-shadow:none;transform:none;border-style:dashed}
.nvhk-drag{position:fixed;z-index:90;pointer-events:none;transform:rotate(-2deg) scale(1.06);box-shadow:0 14px 34px rgba(0,0,0,.65);border-color:var(--nv-gold-bright)}
.nvhk-status{font-family:var(--nv-font-title);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--nv-text-dim);display:flex;gap:7px;align-items:center}
.nvhk-pip{width:9px;height:9px;border-radius:50%;border:1px solid rgba(255,90,106,.55);box-sizing:border-box}
.nvhk-pip.on{background:var(--nv-danger);box-shadow:0 0 8px rgba(255,90,106,.6)}
@media (max-height:680px){.nvhk-slot{min-height:44px;padding:4px 12px}.nvhk-text{font-size:19px}.nvhk-rem{font-size:18px}.nvhk-tile{font-size:17px;padding:5px 14px 4px}.nvhk-pool{gap:8px;min-height:50px}.nvhk-page{gap:6px}}
@keyframes nvhk-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
`

const CW = 280
const CH = 280
const GX = 145
const GY = 190
const GR = 44
const MAX_MISTAKES = 3

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** rounded-rectangle path (no reliance on ctx.roundRect) */
function rrPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2)
  g.moveTo(x + rr, y)
  g.arcTo(x + w, y, x + w, y + h, rr)
  g.arcTo(x + w, y + h, x, y + h, rr)
  g.arcTo(x, y + h, x, y, rr)
  g.arcTo(x, y, x + w, y, rr)
  g.closePath()
}

// --------------------------------------------------------------------------- palm silhouette
type ShapeFn = (g: CanvasRenderingContext2D) => void

function capsule(x: number, y: number, ang: number, len: number, w: number): ShapeFn {
  return (g) => {
    g.save()
    g.translate(x, y)
    g.rotate(ang)
    rrPath(g, -w / 2, -len, w, len + w * 0.7, w / 2)
    g.restore()
  }
}

const PALM_SHAPES: ShapeFn[] = [
  (g) => rrPath(g, 92, 126, 108, 128, 36),
  (g) => rrPath(g, 108, 228, 80, 70, 22),
  capsule(106, 146, -0.3, 62, 21),
  capsule(131, 134, -0.1, 84, 23),
  capsule(156, 130, 0.04, 94, 24),
  capsule(181, 136, 0.18, 84, 23),
  capsule(194, 214, 0.95, 72, 27),
]

function offscreen(): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const r = Math.min(2, window.devicePixelRatio || 1)
  const c = document.createElement('canvas')
  c.width = Math.round(CW * r)
  c.height = Math.round(CH * r)
  const g = c.getContext('2d')!
  g.scale(r, r)
  return { c, g }
}

function buildPalm(): { fill: HTMLCanvasElement; edge: HTMLCanvasElement } {
  const F = offscreen()
  const grad = F.g.createLinearGradient(0, 30, 0, 290)
  grad.addColorStop(0, 'rgba(236,214,190,1)')
  grad.addColorStop(1, 'rgba(160,128,110,1)')
  F.g.fillStyle = grad
  for (const s of PALM_SHAPES) {
    F.g.beginPath()
    s(F.g)
    F.g.fill()
  }
  // palm creases
  F.g.strokeStyle = 'rgba(90,60,50,0.55)'
  F.g.lineWidth = 1.4
  F.g.lineCap = 'round'
  F.g.beginPath()
  F.g.moveTo(100, 166)
  F.g.quadraticCurveTo(142, 150, 194, 163)
  F.g.moveTo(102, 186)
  F.g.quadraticCurveTo(142, 182, 184, 203)
  F.g.moveTo(186, 176)
  F.g.quadraticCurveTo(156, 214, 168, 262)
  F.g.stroke()
  // union outline: stroke every shape, then cut away everything inside any shape
  const E = offscreen()
  E.g.strokeStyle = 'rgba(243,217,149,1)'
  E.g.lineWidth = 3
  for (const s of PALM_SHAPES) {
    E.g.beginPath()
    s(E.g)
    E.g.stroke()
  }
  E.g.globalCompositeOperation = 'destination-out'
  for (const s of PALM_SHAPES) {
    E.g.beginPath()
    s(E.g)
    E.g.fill()
  }
  // let the wrist dissolve instead of ending at the canvas edge
  for (const o of [F, E]) {
    o.g.globalCompositeOperation = 'destination-out'
    const fade = o.g.createLinearGradient(0, 236, 0, CH)
    fade.addColorStop(0, 'rgba(0,0,0,0)')
    fade.addColorStop(1, 'rgba(0,0,0,1)')
    o.g.fillStyle = fade
    o.g.fillRect(0, 236, CW, CH - 236)
  }
  return { fill: F.c, edge: E.c }
}

// --------------------------------------------------------------------------- glyph geometry
const STAR = [0, 2, 4, 1, 3, 0].map((k) => {
  const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
  return { x: GX + Math.cos(a) * GR, y: GY + Math.sin(a) * GR }
})

/** Draws the glyph up to progress p (0..1); returns the position of the drawing tip. */
function drawGlyph(g: CanvasRenderingContext2D, p: number, color: string, alpha: number, width: number, blur: number): { x: number; y: number } | null {
  let tip: { x: number; y: number } | null = null
  g.save()
  g.globalAlpha = alpha
  g.strokeStyle = color
  g.fillStyle = color
  g.lineWidth = width
  g.lineCap = 'round'
  g.lineJoin = 'round'
  if (blur > 0) {
    g.shadowColor = color
    g.shadowBlur = blur
  }
  const R = GR + 12
  const pc = clamp01(p / 0.28)
  if (pc > 0) {
    const a1 = -Math.PI / 2 + pc * Math.PI * 2
    g.beginPath()
    g.arc(GX, GY, R, -Math.PI / 2, a1)
    g.stroke()
    if (pc < 1) tip = { x: GX + Math.cos(a1) * R, y: GY + Math.sin(a1) * R }
  }
  const ps = clamp01((p - 0.28) / 0.52)
  if (ps > 0) {
    const n = ps * 5
    g.beginPath()
    g.moveTo(STAR[0].x, STAR[0].y)
    for (let i = 0; i < 5; i++) {
      const a = STAR[i]
      const b = STAR[i + 1]
      if (n >= i + 1) g.lineTo(b.x, b.y)
      else if (n > i) {
        const u = n - i
        const x = a.x + (b.x - a.x) * u
        const y = a.y + (b.y - a.y) * u
        g.lineTo(x, y)
        tip = { x, y }
        break
      }
    }
    g.stroke()
  }
  const pd = clamp01((p - 0.8) / 0.2)
  if (pd > 0) {
    g.beginPath()
    g.arc(GX, GY, 9, -Math.PI / 2, -Math.PI / 2 + pd * Math.PI * 2)
    g.stroke()
    for (let k = 0; k < 5; k++) {
      g.beginPath()
      g.arc(STAR[k].x, STAR[k].y, 2.6 * pd, 0, Math.PI * 2)
      g.fill()
      // small rune ticks on the outer circle between the points
      const a = -Math.PI / 2 + ((k + 0.5) * 2 * Math.PI) / 5
      g.beginPath()
      g.moveTo(GX + Math.cos(a) * (R - 5 * pd), GY + Math.sin(a) * (R - 5 * pd))
      g.lineTo(GX + Math.cos(a) * (R + 6 * pd), GY + Math.sin(a) * (R + 6 * pd))
      g.stroke()
    }
  }
  g.restore()
  return tip
}

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
}

// --------------------------------------------------------------------------- the minigame
function runHaiku(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const key: HaikuKey = typeof params.haiku === 'string' && params.haiku in HAIKU ? (params.haiku as HaikuKey) : 'veil'
  const def = HAIKU[key]
  const frags: Fragment[] = [...def.lines, ...def.decoys]
  const reduced = ctx.assist.reducedMotion
  const color = def.color

  return new Promise<MinigameResult>((resolve) => {
    let finished = false
    const cleanups: (() => void)[] = []
    const finish = (r: MinigameResult) => {
      if (finished) return
      finished = true
      for (const c of cleanups) c()
      resolve(r)
    }

    const style = el('style')
    style.textContent = CSS
    ctx.root.appendChild(style)
    const card = createCard(ctx, def.name, S.sub)
    card.card.style.width = 'min(880px, 94vw)'
    card.card.style.boxSizing = 'border-box'
    card.card.style.overflowY = 'auto'
    card.card.style.setProperty('--hk-color', color)
    card.card.style.setProperty('--hk-glow', rgba(color, 0.42))
    card.hint.textContent = ctx.t(S.hint)
    card.buttons.style.minHeight = '42px'

    const wrap = el('div', 'nvhk')
    card.body.appendChild(wrap)
    const top = el('div', 'nvhk-top')
    wrap.appendChild(top)
    const page = el('div', 'nvhk-page')
    top.appendChild(page)
    page.appendChild(el('div', 'nvhk-label', ctx.t(S.page)))

    const { canvas, ctx: g } = hiDpiCanvas(CW, CH)
    const fitCanvas = () => {
      const s = Math.max(0.6, Math.min(1, (window.innerHeight - 450) / CH, (window.innerWidth - 80) / CW))
      canvas.style.width = `${Math.round(CW * s)}px`
      canvas.style.height = `${Math.round(CH * s)}px`
    }
    fitCanvas()
    top.appendChild(canvas)

    // slots
    const slotEls: HTMLDivElement[] = []
    const slotText: HTMLDivElement[] = []
    const slotRem: HTMLDivElement[] = []
    const slotBeads: HTMLDivElement[] = []
    const trEls: HTMLDivElement[] = []
    for (let i = 0; i < 3; i++) {
      const s = el('div', 'nvhk-slot')
      s.appendChild(el('div', 'nvhk-num', String(i + 1)))
      const rem = el('div', 'nvhk-rem', `${def.lines[i].syl[0]}…`)
      const tx = el('div', 'nvhk-text')
      const bd = el('div', 'nvhk-beads')
      s.append(rem, tx, bd)
      page.appendChild(s)
      const tr = el('div', 'nvhk-tr', ctx.t(def.tr[i]))
      page.appendChild(tr)
      slotEls.push(s)
      slotText.push(tx)
      slotRem.push(rem)
      slotBeads.push(bd)
      trEls.push(tr)
    }

    const poolEl = el('div', 'nvhk-pool')
    wrap.appendChild(poolEl)
    const status = el('div', 'nvhk-status')
    wrap.appendChild(status)
    status.appendChild(el('span', '', ctx.t(S.missteps)))
    const pips: HTMLSpanElement[] = []
    for (let i = 0; i < MAX_MISTAKES; i++) {
      const p = el('span', 'nvhk-pip')
      pips.push(p)
      status.appendChild(p)
    }

    // ------------------------------------------------------------------ state
    let order: number[] = shuffle([0, 1, 2, 3, 4, 5])
    let slots: (number | null)[] = [null, null, null]
    let placedIn: (number | null)[] = frags.map(() => null)
    let mistakes = 0
    let locked = false
    let explicitTarget: number | null = null
    let kb: { row: 0 | 1; col: number } | null = null
    let goodMarked = [false, false, false]
    let phase: 'play' | 'speaking' | 'glyph' | 'done' = 'play'
    let glyphT = 0
    let flash = 0
    const tileEls: HTMLDivElement[] = []

    const targetSlot = (): number | null => {
      if (explicitTarget !== null && slots[explicitTarget] === null) return explicitTarget
      const i = slots.indexOf(null)
      return i < 0 ? null : i
    }

    function beadsInto(container: HTMLElement, need: number, have: number): void {
      container.replaceChildren()
      const n = Math.max(need, have)
      for (let j = 0; j < n; j++) {
        const b = el('span', 'nvhk-bead')
        if (j < have) b.classList.add(j < need ? 'on' : 'extra')
        container.appendChild(b)
      }
    }

    function makeTile(fi: number): HTMLDivElement {
      const t = el('div', 'nvhk-tile')
      t.appendChild(el('span', '', frags[fi].text))
      const bd = el('span', 'nvhk-beads')
      for (let j = 0; j < frags[fi].syl.length; j++) bd.appendChild(el('span', 'nvhk-bead'))
      t.appendChild(bd)
      return t
    }

    function render(): void {
      const tgt = targetSlot()
      for (let i = 0; i < 3; i++) {
        const fi = slots[i]
        const s = slotEls[i]
        s.classList.toggle('target', fi === null && tgt === i && phase === 'play')
        s.classList.toggle('focus', kb !== null && kb.row === 0 && kb.col === i)
        if (phase === 'play') s.classList.toggle('good', goodMarked[i] && fi === i)
        slotText[i].textContent = fi === null ? '' : frags[fi].text
        slotRem[i].style.opacity = fi === null ? '1' : '0.35'
        beadsInto(slotBeads[i], def.lines[i].syl.length, fi === null ? 0 : frags[fi].syl.length)
      }
      poolEl.replaceChildren()
      tileEls.length = 0
      order.forEach((fi, p) => {
        const t = makeTile(fi)
        if (placedIn[fi] !== null) t.classList.add('ghost')
        if (kb !== null && kb.row === 1 && kb.col === p) t.classList.add('focus')
        t.addEventListener('pointerdown', (e) => {
          if (placedIn[fi] === null) press(e, fi, t)
        })
        poolEl.appendChild(t)
        tileEls.push(t)
      })
      pips.forEach((p, i) => p.classList.toggle('on', i < mistakes))
    }

    slotEls.forEach((s, i) => {
      s.addEventListener('pointerdown', (e) => {
        if (locked || phase !== 'play') return
        const fi = slots[i]
        if (fi !== null) press(e, fi, s)
        else {
          explicitTarget = i
          ctx.sfx('click')
          render()
        }
      })
    })

    function place(fi: number, si: number): void {
      const from = placedIn[fi]
      if (from === si) return
      const displaced = slots[si]
      if (from !== null) slots[from] = null
      if (displaced !== null) {
        if (from !== null) {
          slots[from] = displaced
          placedIn[displaced] = from
        } else placedIn[displaced] = null
      }
      slots[si] = fi
      placedIn[fi] = si
      if (explicitTarget === si) explicitTarget = null
      ctx.sfx('click')
      render()
      if (slots.every((s) => s !== null)) {
        locked = true
        setTimeout(evaluate, 380)
      }
    }

    function unplace(fi: number): void {
      const si = placedIn[fi]
      if (si === null) return
      slots[si] = null
      placedIn[fi] = null
      ctx.sfx('page')
      render()
    }

    function clickFragment(fi: number): void {
      if (placedIn[fi] !== null) {
        unplace(fi)
        return
      }
      const si = targetSlot()
      if (si !== null) place(fi, si)
    }

    function slotAt(x: number, y: number): number | null {
      for (let i = 0; i < 3; i++) {
        const r = slotEls[i].getBoundingClientRect()
        if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) return i
      }
      return null
    }

    function press(e: PointerEvent, fi: number, src: HTMLElement): void {
      if (locked || phase !== 'play') return
      e.preventDefault()
      kb = null
      const sx = e.clientX
      const sy = e.clientY
      let drag: HTMLDivElement | null = null
      try {
        src.setPointerCapture(e.pointerId)
      } catch {
        /* capture is optional */
      }
      const move = (ev: PointerEvent) => {
        if (!drag && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
          drag = makeTile(fi)
          drag.classList.add('nvhk-drag')
          ctx.root.appendChild(drag)
        }
        if (drag) {
          drag.style.left = `${ev.clientX - drag.offsetWidth / 2}px`
          drag.style.top = `${ev.clientY - drag.offsetHeight / 2}px`
          const over = slotAt(ev.clientX, ev.clientY)
          slotEls.forEach((s, i) => s.classList.toggle('over', i === over))
        }
      }
      const up = (ev: PointerEvent) => {
        src.removeEventListener('pointermove', move)
        src.removeEventListener('pointerup', up)
        src.removeEventListener('pointercancel', up)
        slotEls.forEach((s) => s.classList.remove('over'))
        if (!drag) {
          if (ev.type === 'pointerup') clickFragment(fi)
          return
        }
        drag.remove()
        if (ev.type !== 'pointerup') return
        const si = slotAt(ev.clientX, ev.clientY)
        if (si !== null) place(fi, si)
        else if (placedIn[fi] !== null) unplace(fi)
      }
      src.addEventListener('pointermove', move)
      src.addEventListener('pointerup', up)
      src.addEventListener('pointercancel', up)
    }

    function evaluate(): void {
      const wrong = [0, 1, 2].filter((i) => slots[i] !== i)
      if (wrong.length === 0) {
        void finale()
        return
      }
      mistakes++
      ctx.sfx('fail')
      card.hint.textContent = ctx.t(S.wrong)
      card.hint.style.color = 'var(--nv-danger)'
      goodMarked = [0, 1, 2].map((i) => !wrong.includes(i))
      for (let i = 0; i < 3; i++) {
        slotEls[i].classList.remove('bad')
        void slotEls[i].offsetWidth
        if (wrong.includes(i)) slotEls[i].classList.add('bad')
      }
      render()
      setTimeout(() => {
        for (const s of slotEls) s.classList.remove('bad')
        if (mistakes >= MAX_MISTAKES) {
          showFailure()
          return
        }
        for (const i of wrong) {
          const fi = slots[i]
          if (fi !== null) {
            slots[i] = null
            placedIn[fi] = null
          }
        }
        locked = false
        card.hint.textContent = ctx.t(S.hint)
        card.hint.style.color = ''
        render()
      }, 950)
    }

    function showFailure(): void {
      locked = true
      ctx.sfx('fail')
      card.hint.textContent = `${ctx.t(S.failed)} ${ctx.t(UI_STRINGS.failed)}`
      card.hint.style.color = 'var(--nv-danger)'
      const retry = button(ctx.t(UI_STRINGS.retry), reset, true)
      card.buttons.replaceChildren(retry)
      if (ctx.assist.skipAllowed) {
        card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      }
      retry.focus()
    }

    function reset(): void {
      order = shuffle([0, 1, 2, 3, 4, 5])
      slots = [null, null, null]
      placedIn = frags.map(() => null)
      mistakes = 0
      locked = false
      explicitTarget = null
      kb = null
      goodMarked = [false, false, false]
      for (const s of slotEls) s.classList.remove('bad', 'good')
      card.hint.textContent = ctx.t(S.hint)
      card.hint.style.color = ''
      card.buttons.replaceChildren()
      render()
    }

    async function finale(): Promise<void> {
      wrap.style.minHeight = `${wrap.offsetHeight}px`
      phase = 'speaking'
      locked = true
      kb = null
      render()
      card.hint.textContent = ctx.t(S.speak)
      card.hint.style.color = color
      poolEl.style.opacity = '0'
      status.style.opacity = '0'
      await sleep(reduced ? 250 : 650)
      poolEl.style.display = 'none'
      const sylMs = reduced ? 70 : 190
      for (let i = 0; i < 3; i++) {
        slotEls[i].classList.remove('good')
        slotEls[i].classList.add('speaking')
        const beads = slotBeads[i].querySelectorAll('.nvhk-bead')
        for (let j = 0; j < beads.length; j++) {
          beads[j].classList.add('lit')
          ctx.sfx('tick')
          await sleep(sylMs)
        }
        trEls[i].classList.add('show')
        await sleep(reduced ? 200 : 520)
        slotEls[i].classList.remove('speaking')
        slotEls[i].classList.add('good')
      }
      phase = 'glyph'
      glyphT = 0
      card.hint.textContent = ctx.t(S.cutting)
      ctx.sfx('glyph')
      await sleep(reduced ? 900 : 2700)
      phase = 'done'
      flash = reduced ? 0.35 : 1
      ctx.sfx('chime')
      card.hint.textContent = ctx.t(S.remember)
      await sleep(reduced ? 200 : 700)
      ctx.sfx('success')
      const score = [1, 0.75, 0.5][Math.min(2, mistakes)]
      const cont = button(ctx.t(UI_STRINGS.continue), () => finish({ success: true, score, data: { haiku: key, mistakes } }), true)
      card.buttons.replaceChildren(cont)
      cont.focus()
    }

    // ------------------------------------------------------------------ keyboard
    const poolCol = (from: number, dir: number): number => {
      for (let k = 1; k <= order.length; k++) {
        const c = (((from + dir * k) % order.length) + order.length) % order.length
        if (placedIn[order[c]] === null) return c
      }
      return from
    }

    ctx.onKey((e) => {
      if (finished || locked || phase !== 'play') return
      const active = document.activeElement
      if ((e.key === 'Enter' || e.key === ' ') && active instanceof HTMLButtonElement && ctx.root.contains(active)) return
      const k = e.key
      if (/^[1-6]$/.test(k)) {
        const fi = order[Number(k) - 1]
        if (placedIn[fi] === null) clickFragment(fi)
        e.preventDefault()
        return
      }
      if (k === 'Backspace' || k === 'Delete') {
        for (let i = 2; i >= 0; i--) {
          const fi = slots[i]
          if (fi !== null) {
            unplace(fi)
            break
          }
        }
        e.preventDefault()
        return
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(k)) return
      e.preventDefault()
      if (kb === null) {
        kb = { row: 1, col: poolCol(-1, 1) }
        render()
        return
      }
      if (k === 'ArrowUp') kb = { row: 0, col: Math.min(2, kb.row === 1 ? Math.round((kb.col / 5) * 2) : kb.col) }
      else if (k === 'ArrowDown') kb = { row: 1, col: poolCol(kb.row === 0 ? Math.round(kb.col * 2.5) - 1 : kb.col - 1, 1) }
      else if (k === 'ArrowLeft') kb = kb.row === 0 ? { row: 0, col: Math.max(0, kb.col - 1) } : { row: 1, col: poolCol(kb.col, -1) }
      else if (k === 'ArrowRight') kb = kb.row === 0 ? { row: 0, col: Math.min(2, kb.col + 1) } : { row: 1, col: poolCol(kb.col, 1) }
      else if (kb.row === 1) {
        const fi = order[kb.col]
        if (placedIn[fi] === null) {
          const si = targetSlot()
          if (si !== null) {
            const col = kb.col
            kb = { row: 1, col: poolCol(col, 1) }
            place(fi, si)
            return
          }
        }
      } else {
        const fi = slots[kb.col]
        if (fi !== null) unplace(fi)
        else {
          explicitTarget = kb.col
          kb = { row: 1, col: poolCol(-1, 1) }
          ctx.sfx('click')
        }
      }
      render()
    })

    // ------------------------------------------------------------------ canvas
    const palm = buildPalm()
    const motes: Mote[] = []
    let moteAcc = 0
    const spawn = (x: number, y: number, burst: boolean) => {
      const a = Math.random() * Math.PI * 2
      const sp = burst ? 20 + Math.random() * 60 : 4 + Math.random() * 10
      const max = burst ? 0.5 + Math.random() * 0.6 : 2.5 + Math.random() * 2.5
      motes.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (burst ? 10 : 8), life: max, max, size: burst ? 1.2 + Math.random() * 1.6 : 0.8 + Math.random() * 1.4 })
    }

    ctx.loop((dt, time) => {
      g.clearRect(0, 0, CW, CH)
      const lit = phase === 'glyph' ? clamp01(glyphT / 2.2) : phase === 'done' ? 1 : 0
      // soft aura
      const aura = g.createRadialGradient(GX, GY, 10, GX, GY, 150)
      aura.addColorStop(0, rgba(color, 0.1 + lit * 0.22))
      aura.addColorStop(1, rgba(color, 0))
      g.fillStyle = aura
      g.fillRect(0, 0, CW, CH)
      // palm
      g.save()
      g.globalAlpha = 0.16 + lit * 0.1
      g.drawImage(palm.fill, 0, 0, CW, CH)
      g.globalAlpha = 0.42 + lit * 0.3
      if (lit > 0) {
        g.shadowColor = color
        g.shadowBlur = 12 * lit
      }
      g.drawImage(palm.edge, 0, 0, CW, CH)
      g.restore()

      // idle motes
      moteAcc += dt * (phase === 'play' ? 3 : 7)
      while (moteAcc > 1) {
        moteAcc -= 1
        spawn(40 + Math.random() * 200, 250 + Math.random() * 20, false)
      }

      if (phase === 'play' || phase === 'speaking') {
        const breathe = 0.06 + 0.03 * Math.sin(time * 1.6)
        drawGlyph(g, 1, color, breathe + (phase === 'speaking' ? 0.08 : 0), 1.5, 0)
      } else if (phase === 'glyph') {
        glyphT += dt
        const p = clamp01(glyphT / (reduced ? 0.8 : 2.4))
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        drawGlyph(g, 1, color, 0.07, 1.5, 0)
        const tip = drawGlyph(g, eased, color, 1, 2.8, 18)
        drawGlyph(g, eased, '#ffffff', 0.75, 1, 0)
        if (tip) {
          const sg = g.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 14)
          sg.addColorStop(0, 'rgba(255,255,255,0.95)')
          sg.addColorStop(0.3, rgba(color, 0.8))
          sg.addColorStop(1, rgba(color, 0))
          g.fillStyle = sg
          g.beginPath()
          g.arc(tip.x, tip.y, 14, 0, Math.PI * 2)
          g.fill()
          if (!reduced) for (let i = 0; i < 3; i++) spawn(tip.x, tip.y, true)
        }
      } else {
        const pulse = 0.82 + 0.18 * Math.sin(time * 2.2)
        drawGlyph(g, 1, color, pulse, 3.2, 22)
        drawGlyph(g, 1, '#ffffff', 0.85, 1.1, 0)
      }

      // motes
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i]
        m.life -= dt
        if (m.life <= 0) {
          motes.splice(i, 1)
          continue
        }
        m.x += m.vx * dt
        m.y += m.vy * dt
        m.vx *= 0.97
        const a = clamp01(m.life / m.max) * (phase === 'play' ? 0.5 : 0.9)
        g.fillStyle = rgba(color, a)
        g.beginPath()
        g.arc(m.x, m.y, m.size, 0, Math.PI * 2)
        g.fill()
      }
      g.restore()

      if (flash > 0) {
        const fg = g.createRadialGradient(GX, GY, 0, GX, GY, 170)
        fg.addColorStop(0, `rgba(255,255,255,${0.85 * flash})`)
        fg.addColorStop(0.4, rgba(color, 0.6 * flash))
        fg.addColorStop(1, rgba(color, 0))
        g.fillStyle = fg
        g.fillRect(0, 0, CW, CH)
        flash = Math.max(0, flash - dt * 1.4)
      }
    })

    window.addEventListener('resize', fitCanvas)
    cleanups.push(() => window.removeEventListener('resize', fitCanvas))

    render()
  })
}

registerMinigame('haiku', () => ({ run: runHaiku }))
