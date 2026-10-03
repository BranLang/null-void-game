/**
 * BREATH: the rhythm of breaths. Arkot counts everything: breaths, shadows,
 * the steps of the guards. A ring expands (inhale) and contracts (exhale);
 * press Space / click exactly when the contracting ring meets the marker.
 * A big counter shows the breath being counted.
 *
 * params: {
 *   beats?: number    breaths to count (default 10)
 *   start?: number    number of the first counted breath (default 1, e.g. 31)
 *   bpm?: number      breaths per minute (default 28)
 *   twist?: 'eclipse' after the last beat the counter shows the target and asks
 *                     "When will the Eye open?": the player must wait and press on
 *                     the NEXT breath (target + 1); pressing early is a miss.
 * }
 * result: { success: hitRatio >= 0.7 (and the twist answered), score: hitRatio,
 *           data: { hits, perfect, beats, twist?: boolean } }
 */
import { registerMinigame, createCard, button, hiDpiCanvas, UI_STRINGS, type MinigameContext } from '../Minigame'
import type { MinigameParams, MinigameResult } from '../../game/GameAPI'
import { l, type L } from '../../i18n/i18n'

type RGB = readonly [number, number, number]

const W = 760
const H = 480
const CX = 380
const CY = 236
const R_MIN = 74
const R_MAX = 192
const PERFECT = 0.09
const GOOD = 0.19
const LEAD_IN = 2

const TEXT = {
  title: l('Počítanie nádychov', 'Counting Breaths'),
  subtitle: l(
    'Arkot počíta všetko: nádychy, tiene, kroky stráží. Počítaj s ním.',
    "Arkot counts everything: breaths, shadows, the guards' steps. Count with him.",
  ),
  hint: l(
    'Stlač medzerník alebo klikni presne vtedy, keď sa zmršťujúci kruh dotkne značky.',
    'Press Space or click exactly when the shrinking ring touches the marker.',
  ),
  listen: l('Počúvaj rytmus…', 'Feel the rhythm…'),
  inhale: l('nádych', 'inhale'),
  exhale: l('výdych', 'exhale'),
  perfect: l('Presne', 'Perfect'),
  good: l('Dobre', 'Good'),
  miss: l('Vedľa', 'Missed'),
  early: l('Priskoro', 'Too early'),
  eye: l('Kedy sa Oko otvorí?', 'When will the Eye open?'),
  wait: l('…ešte nie…', '…not yet…'),
  done: l('Arkot prikývne. Počítali ste spolu, nádych za nádychom.', 'Arkot nods. You counted together, breath by breath.'),
  doneEye: l('{n}. Oko sa otvára.', '{n}. The Eye opens.'),
  failRatio: l('Stratil si rytmus. Arkot začne odznova, trpezlivo.', 'You lost the rhythm. Arkot starts again, patiently.'),
  failEarly: l('Priskoro. Oko sa ešte neotvorilo — Arkot by počkal ešte jeden nádych.', 'Too early. The Eye was not open yet — Arkot would have waited one more breath.'),
  failLate: l('Oko sa otvorilo bez teba.', 'The Eye opened without you.'),
}

const GOLD: RGB = [243, 217, 149]
const AMBER: RGB = [224, 160, 80]
const CREAM: RGB = [236, 228, 212]
const RED: RGB = [255, 90, 106]
const FIRE: RGB = [255, 120, 40]

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const rgba = (c: RGB, a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const easeOutSine = (t: number): number => Math.sin((t * Math.PI) / 2)
const easeInQuad = (t: number): number => t * t
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

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

type Judge = 'perfect' | 'good' | 'miss' | 'early' | null

interface Popup {
  text: string
  c: RGB
  t: number
}

function runBreath(params: MinigameParams, ctx: MinigameContext): Promise<MinigameResult> {
  const beats = typeof params.beats === 'number' && params.beats >= 1 ? Math.round(params.beats) : 10
  const start = typeof params.start === 'number' ? Math.round(params.start) : 1
  const bpm = typeof params.bpm === 'number' && params.bpm > 4 ? params.bpm : 28
  const twist = params.twist === 'eclipse'
  const P = 60 / bpm
  const INHALE = 0.45
  const rm = ctx.assist.reducedMotion
  const timeScale = ctx.assist.slowTimers ? 0.5 : 1
  const target = start + beats - 1
  const totalBeats = beats + (twist ? 1 : 0)
  const beatTime = (i: number) => (LEAD_IN + i) * P

  return new Promise<MinigameResult>((resolve) => {
    const card = createCard(ctx, TEXT.title, TEXT.subtitle)
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
    let t = 0
    let lastReal = performance.now()
    let judged: Judge[] = new Array<Judge>(totalBeats).fill(null)
    let phase: 'play' | 'end' = 'play'
    let endT = 0
    let resultShown = false
    let pulse = 0
    let markFlash = 0
    let markColor: RGB = GOLD
    let shake = 0
    let eyeOpen = 0
    let twistResult: 'hit' | 'early' | 'late' | null = null
    let leadTicks = 0
    const popups: Popup[] = []
    const ripples: { t: number; c: RGB }[] = []
    const motes = Array.from({ length: rm ? 12 : 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 1.5, p: Math.random() * 10 }))

    const finish = (r: MinigameResult) => resolve(r)

    const radiusAt = (time: number): number => {
      if (time < 0) return R_MIN
      const u = (time % P) / P
      if (u < INHALE) return R_MIN + (R_MAX - R_MIN) * easeOutSine(u / INHALE)
      return R_MAX - (R_MAX - R_MIN) * easeInQuad((u - INHALE) / (1 - INHALE))
    }
    const judgedCount = () => judged.filter((j) => j !== null).length
    const regularJudged = () => judged.slice(0, beats).filter((j) => j !== null).length
    const shownCount = () => {
      if (twist && twistResult === 'hit') return target + 1
      return start + Math.min(regularJudged(), beats - 1)
    }

    function popup(text: L, c: RGB): void {
      popups.push({ text: ctx.t(text), c, t: 0 })
      if (popups.length > 3) popups.shift()
    }

    function judge(i: number, j: Exclude<Judge, null>): void {
      judged[i] = j
      pulse = 1
      const isTwist = twist && i === beats
      if (j === 'perfect' || j === 'good') {
        markFlash = 1
        markColor = isTwist ? FIRE : GOLD
        ripples.push({ t: 0, c: isTwist ? FIRE : GOLD })
        popup(j === 'perfect' ? TEXT.perfect : TEXT.good, j === 'perfect' ? GOLD : CREAM)
        ctx.sfx(j === 'perfect' ? 'chime' : 'click')
        if (isTwist) {
          twistResult = 'hit'
          ctx.sfx('glyph')
        }
      } else {
        markFlash = 1
        markColor = RED
        if (!rm) shake = 0.3
        popup(j === 'early' ? TEXT.early : TEXT.miss, RED)
        ctx.sfx('whoosh')
        if (isTwist) twistResult = j === 'early' ? 'early' : 'late'
      }
      if (judgedCount() >= totalBeats) {
        phase = 'end'
        endT = 0
      }
    }

    function press(): void {
      if (phase !== 'play') return
      // precise press time in game seconds
      const pt = t + ((performance.now() - lastReal) / 1000) * timeScale
      const i = judged.findIndex((j) => j === null)
      if (i < 0) return
      const T = beatTime(i)
      const d = pt - T
      if (Math.abs(d) <= PERFECT) judge(i, 'perfect')
      else if (Math.abs(d) <= GOOD) judge(i, 'good')
      else if (d < -GOOD) {
        const isTwist = twist && i === beats
        // inside the early zone the press spends the beat; the twist beat has no grace at all
        if (isTwist ? pt > beatTime(i - 1) + GOOD : d > -P * 0.45) judge(i, 'early')
        else if (pt >= beatTime(0) - P * 0.45) popup(TEXT.early, RED)
      }
    }

    function showResult(): void {
      resultShown = true
      const counted = judged.slice(0, beats)
      const hits = counted.filter((j) => j === 'perfect' || j === 'good').length
      const perfect = counted.filter((j) => j === 'perfect').length
      const ratio = hits / beats
      const score = Math.round(((perfect + (hits - perfect) * 0.75) / beats) * 100) / 100
      const ok = ratio >= 0.7 && (!twist || twistResult === 'hit')
      card.buttons.replaceChildren()
      if (ok) {
        ctx.sfx('success')
        card.hint.textContent = twist ? ctx.t(TEXT.doneEye, { n: target + 1 }) : ctx.t(TEXT.done)
        card.hint.style.color = 'var(--nv-gold-bright)'
        card.buttons.appendChild(
          button(
            ctx.t(UI_STRINGS.continue),
            () => finish({ success: true, score, data: { hits, perfect, beats, ...(twist ? { twist: true } : {}) } }),
            true,
          ),
        )
      } else {
        ctx.sfx('fail')
        const reason = ratio < 0.7 ? TEXT.failRatio : twistResult === 'early' ? TEXT.failEarly : TEXT.failLate
        card.hint.textContent = ctx.t(reason)
        card.hint.style.color = 'var(--nv-danger)'
        card.buttons.appendChild(button(ctx.t(UI_STRINGS.retry), restart, true))
        if (ctx.assist.skipAllowed) card.buttons.appendChild(button(ctx.t(UI_STRINGS.skip), () => finish({ success: true, score: 0, data: { skipped: true } })))
      }
      fit(true)
    }

    function restart(): void {
      t = 0
      judged = new Array<Judge>(totalBeats).fill(null)
      phase = 'play'
      resultShown = false
      twistResult = null
      eyeOpen = 0
      leadTicks = 0
      popups.length = 0
      card.hint.textContent = ctx.t(TEXT.hint)
      card.hint.style.color = ''
      card.buttons.replaceChildren()
      ;(document.activeElement as HTMLElement | null)?.blur?.()
      fit(true)
    }

    // ------------------------------------------------------------------ input
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      press()
    })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    ctx.onKey((e) => {
      if (e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'NumpadEnter') return
      e.preventDefault()
      if (e.repeat) return
      if (phase === 'play') press()
      else if (resultShown && endT > 0.9) card.buttons.querySelector('button')?.click()
    })

    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__nvBreath = {
        /** seconds of game time until the next unjudged beat (negative if it is due) */
        next: () => {
          const i = judged.findIndex((j) => j === null)
          return i < 0 ? null : { i, dt: (beatTime(i) - t) / timeScale }
        },
        state: () => ({ phase, judged: judged.join(','), count: shownCount(), twistResult }),
      }
    }

    // ------------------------------------------------------------------ drawing
    function drawEclipse(time: number, cover: number, open: number): void {
      const x = 640
      const y = 112
      const r = 54
      const flick = 0.85 + 0.15 * Math.sin(time * 7) * Math.sin(time * 3.1)
      const intensity = 0.3 + cover * 0.6 + open * 1.4
      glow(g, x, y, r * 4.2, FIRE, 0.14 * intensity * flick)
      glow(g, x, y, r * 2.2, [255, 170, 80], 0.22 * intensity)
      // flame tongues of the corona
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2 + Math.sin(time * 0.4 + i) * 0.05
        const n = 0.5 + 0.5 * Math.sin(time * (1.6 + (i % 5) * 0.3) + i * 2.7)
        const len = r * (0.18 + 0.32 * n) * (0.5 + intensity * 0.6)
        const w = 0.07
        g.fillStyle = `rgba(255,${120 + Math.round(n * 80)},40,${0.16 + 0.22 * intensity * n})`
        g.beginPath()
        g.moveTo(x + Math.cos(a - w) * r * 0.98, y + Math.sin(a - w) * r * 0.98)
        g.quadraticCurveTo(x + Math.cos(a) * (r + len * 0.6), y + Math.sin(a) * (r + len * 0.6), x + Math.cos(a + 0.03) * (r + len), y + Math.sin(a + 0.03) * (r + len))
        g.quadraticCurveTo(x + Math.cos(a) * (r + len * 0.4), y + Math.sin(a) * (r + len * 0.4), x + Math.cos(a + w) * r * 0.98, y + Math.sin(a + w) * r * 0.98)
        g.fill()
      }
      g.restore()
      // amber moon
      const mg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 4, x, y, r)
      mg.addColorStop(0, '#ffd889')
      mg.addColorStop(0.6, '#e09a3a')
      mg.addColorStop(1, '#a8561a')
      g.fillStyle = mg
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
      // the shadow sliding over it (only visible where it covers the moon)
      const off = (1 - cover) * r * 2.1
      const sx = x - off * 0.8
      const sy = y - off * 0.6
      g.save()
      g.beginPath()
      g.arc(x, y, r + 0.5, 0, Math.PI * 2)
      g.clip()
      g.fillStyle = '#0a0705'
      g.beginPath()
      g.arc(sx, sy, r * 1.01, 0, Math.PI * 2)
      g.fill()
      g.restore()
      // diamond-ring glint and the Eye's slit when it opens
      if (cover > 0.92) {
        const k = clamp01((cover - 0.92) / 0.08)
        glow(g, x + r * 0.72, y + r * 0.7, 26, [255, 230, 180], 0.5 * k * (1 - open))
      }
      if (open > 0) {
        g.save()
        g.globalCompositeOperation = 'lighter'
        const sl = r * 0.8 * easeOutCubic(open)
        const grd = g.createLinearGradient(x, y - sl, x, y + sl)
        grd.addColorStop(0, 'rgba(255,120,40,0)')
        grd.addColorStop(0.5, `rgba(255,200,120,${0.9 * open})`)
        grd.addColorStop(1, 'rgba(255,120,40,0)')
        g.fillStyle = grd
        g.beginPath()
        g.moveTo(x, y - sl)
        g.quadraticCurveTo(x + r * 0.16 * open, y, x, y + sl)
        g.quadraticCurveTo(x - r * 0.16 * open, y, x, y - sl)
        g.fill()
        g.restore()
        glow(g, x, y, r * 1.6, [255, 190, 110], 0.35 * open)
      }
    }

    function draw(time: number): void {
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (shake > 0) g.translate((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 8 * shake)
      // backdrop
      const bg = g.createRadialGradient(CX, CY, 30, CX, CY, W * 0.65)
      bg.addColorStop(0, twist ? '#1e1410' : '#16131c')
      bg.addColorStop(1, '#060508')
      g.fillStyle = bg
      g.fillRect(-20, -20, W + 40, H + 40)
      if (twist) {
        g.fillStyle = `rgba(255,120,40,${0.05 + eyeOpen * 0.12})`
        g.fillRect(-20, -20, W + 40, H + 40)
      }
      for (const m of motes) glow(g, m.x, m.y, 3 + m.s * 3, twist ? AMBER : CREAM, 0.08 + 0.06 * Math.sin(m.p))
      // faint guide circles (Arkot's counting marks)
      g.strokeStyle = 'rgba(214,178,106,0.06)'
      g.lineWidth = 1
      for (let i = 1; i <= 3; i++) {
        g.beginPath()
        g.arc(CX, CY, R_MIN + ((R_MAX - R_MIN) * i) / 3, 0, Math.PI * 2)
        g.stroke()
      }
      if (twist) {
        // the shadow slides over the moon in step with the count and covers it on the twist breath
        const t0 = beatTime(0) - P
        drawEclipse(time, clamp01((t - t0) / (beatTime(beats) - t0)), eyeOpen)
      }
      // breathing ring
      const r = radiusAt(t)
      const u = t < 0 ? 0 : (t % P) / P
      const inhaling = u < INHALE
      const near = inhaling ? 0 : clamp01(1 - (r - R_MIN) / 60)
      const col = inhaling ? CREAM : AMBER
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.strokeStyle = rgba(col, 0.07)
      g.lineWidth = 34
      g.beginPath()
      g.arc(CX, CY, r, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = rgba(col, 0.42)
      g.lineWidth = 12
      g.beginPath()
      g.arc(CX, CY, r, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = rgba([255, 250, 235], 0.85)
      g.lineWidth = 2.5
      g.beginPath()
      g.arc(CX, CY, r, 0, Math.PI * 2)
      g.stroke()
      g.restore()
      // marker
      const mf = markFlash
      g.strokeStyle = mf > 0 ? rgba(markColor, 0.5 + 0.5 * mf) : rgba(GOLD, 0.45 + near * 0.5)
      g.lineWidth = 2 + mf * 2
      g.beginPath()
      g.arc(CX, CY, R_MIN, 0, Math.PI * 2)
      g.stroke()
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + Math.PI / 12
        g.beginPath()
        g.moveTo(CX + Math.cos(a) * (R_MIN - 6), CY + Math.sin(a) * (R_MIN - 6))
        g.lineTo(CX + Math.cos(a) * (R_MIN + (i % 3 === 0 ? 8 : 4)), CY + Math.sin(a) * (R_MIN + (i % 3 === 0 ? 8 : 4)))
        g.stroke()
      }
      glow(g, CX, CY, R_MIN * 1.6, mf > 0 ? markColor : GOLD, 0.06 + near * 0.18 + mf * 0.4)
      for (const rp of ripples) {
        const p = rp.t / 0.7
        g.strokeStyle = rgba(rp.c, 0.6 * (1 - p))
        g.lineWidth = 2
        g.beginPath()
        g.arc(CX, CY, R_MIN + p * 140, 0, Math.PI * 2)
        g.stroke()
      }
      // counter
      const leading = t < beatTime(0) - P * 0.5 && judgedCount() === 0
      const s = 1 + pulse * 0.16
      g.save()
      g.translate(CX, CY - 4)
      g.scale(s, s)
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.font = '600 64px Cinzel, serif'
      const cc = twistResult === 'hit' ? [255, 200, 120] : GOLD
      g.fillStyle = `rgba(${cc[0]},${cc[1]},${cc[2]},${leading ? 0.45 : 0.95})`
      g.fillText(String(shownCount()), 0, 0)
      g.restore()
      glow(g, CX, CY - 4, 60, GOLD, pulse * 0.35)
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.font = 'italic 15px "EB Garamond", Georgia, serif'
      g.fillStyle = 'rgba(236,228,212,0.55)'
      g.fillText(ctx.t(inhaling ? TEXT.inhale : TEXT.exhale), CX, CY + 44)
      // prompts
      g.font = 'italic 22px "EB Garamond", Georgia, serif'
      if (leading && phase === 'play') {
        g.fillStyle = 'rgba(236,228,212,0.75)'
        g.fillText(ctx.t(TEXT.listen), CX, 24)
      }
      if (twist && regularJudged() >= beats && twistResult === null) {
        const a = 0.7 + 0.3 * Math.sin(time * 4)
        glow(g, CX, 24, 120, AMBER, 0.15)
        g.fillStyle = `rgba(255,214,150,${a})`
        g.fillText(ctx.t(TEXT.eye), CX, 24)
      }
      // judgement popups
      for (const p of popups) {
        const k = p.t / 0.9
        g.globalAlpha = clamp01(1 - k)
        g.font = '600 18px Cinzel, serif'
        g.fillStyle = rgba(p.c, 1)
        g.fillText(p.text, CX, CY + R_MIN + 34 - k * 18)
        g.globalAlpha = 1
      }
      // beat pips
      const gap = 18
      const x0 = CX - ((totalBeats - 1) * gap) / 2
      for (let i = 0; i < totalBeats; i++) {
        const j = judged[i]
        const x = x0 + i * gap
        const y = H - 20
        const isTwist = twist && i === beats
        g.beginPath()
        if (isTwist) {
          g.moveTo(x, y - 6)
          g.lineTo(x + 6, y)
          g.lineTo(x, y + 6)
          g.lineTo(x - 6, y)
          g.closePath()
        } else g.arc(x, y, 4.5, 0, Math.PI * 2)
        if (j === 'perfect' || j === 'good') {
          g.fillStyle = isTwist ? 'rgb(255,170,90)' : j === 'perfect' ? 'rgb(243,217,149)' : 'rgb(200,180,140)'
          g.fill()
          glow(g, x, y, 12, isTwist ? FIRE : GOLD, 0.5)
        } else if (j === 'miss' || j === 'early') {
          g.fillStyle = 'rgba(255,90,106,0.75)'
          g.fill()
        } else {
          g.strokeStyle = 'rgba(214,178,106,0.4)'
          g.lineWidth = 1.2
          g.stroke()
        }
      }
    }

    // ------------------------------------------------------------------ loop
    ctx.loop((rawDt, time) => {
      const dt = Math.max(0, rawDt)
      lastReal = performance.now()
      fit()
      t += dt
      if (phase === 'play') {
        // lead-in metronome
        while (leadTicks < LEAD_IN && t >= leadTicks * P + P) {
          leadTicks++
          ctx.sfx('tick')
        }
        for (let i = 0; i < totalBeats; i++) {
          if (judged[i] === null && t > beatTime(i) + GOOD) judge(i, 'miss')
        }
      } else {
        endT += dt
        if (!resultShown && endT > 0.7) showResult()
      }
      if (twistResult === 'hit') eyeOpen = Math.min(1, eyeOpen + dt * 1.2)
      pulse = Math.max(0, pulse - dt * 3)
      markFlash = Math.max(0, markFlash - dt * 2.5)
      shake = Math.max(0, shake - dt)
      for (let i = popups.length - 1; i >= 0; i--) {
        popups[i].t += dt
        if (popups[i].t > 0.9) popups.splice(i, 1)
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += dt
        if (ripples[i].t > 0.7) ripples.splice(i, 1)
      }
      for (const m of motes) {
        m.p += dt
        m.y -= dt * 6 * m.s
        if (m.y < -10) {
          m.y = H + 10
          m.x = Math.random() * W
        }
      }
      draw(time)
    })
  })
}

registerMinigame('breath', () => ({ run: runBreath }))
