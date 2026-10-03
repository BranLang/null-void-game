// Automated playability check: every scene, intro script, reachability of interactables/exits, run each interactable.
import { chromium } from 'playwright'
const base = process.argv[2] ?? 'http://localhost:5175/'
const only = process.argv[3]
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 640, height: 360 } })
await page.addInitScript(() => { window.__autoMinigame = true })
const noise = /Audio pool|GPU stall|GL Driver|PCFSoftShadowMap|software WebGL|favicon|HMR|vite/
let errors = []
page.on('console', (m) => { if (m.type() === 'error' && !noise.test(m.text())) errors.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 200)))
await page.goto(base, { waitUntil: 'load' })
await page.waitForTimeout(2500)
const scenes = await page.evaluate(() => window.__game.chapters.flatMap((c) => c.scenes.map((s) => s.id)))
const allIds = new Set(scenes)

async function drain(maxMs) {
  const t0 = Date.now()
  let idle = 0
  while (Date.now() - t0 < maxMs) {
    const st = await page.evaluate(() => {
      const g = window.__game
      const choices = document.querySelectorAll('.nv-choice').length
      return { busy: !!g.dialogueBusy, locked: !!g.director?.locked, choices, mode: g.mode, mg: !!g.minigameActive, card: !!g.cardOpen }
    })
    if (st.choices) { await page.keyboard.press('Digit1'); idle = 0 }
    else if (st.busy || st.card) { await page.keyboard.press('Space'); idle = 0 }
    else if (!st.locked) { idle++; if (idle > 3) return st }
    await page.waitForTimeout(250)
  }
  return page.evaluate(() => ({ busy: !!window.__game.dialogueBusy, locked: !!window.__game.director?.locked, mode: window.__game.mode, timeout: true }))
}

const report = []
for (const id of scenes) {
  if (only && !id.startsWith(only)) continue
  errors = []
  try { await page.goto(`${base}?scene=${id}`, { waitUntil: 'load' }) } catch { await page.waitForTimeout(1500); await page.goto(`${base}?scene=${id}`, { waitUntil: 'load' }) }
  await page.waitForTimeout(2500)
  await page.evaluate(() => { const g = window.__game; g.applySettings({ ...g.settings, quality: 'low', outlines: false }) })
  const intro = await drain(90000)
  const info = await page.evaluate((all) => {
    const g = window.__game
    const w = g.world, p = g.player, def = g.sceneDef
    if (!w || !p || !def) return { err: 'no world' }
    const start = p.cell()
    const reach = (cell, r = 1.5) => {
      const R = Math.ceil(r)
      for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) {
        const c = [cell[0] + dx, cell[1] + dy]
        if (Math.hypot(dx, dy) > r + 0.01) continue
        if (c[0] === start[0] && c[1] === start[1]) return true
        if (w.grid.walkable(c[0], c[1], true) && w.grid.findPath(start, c, { ignoreDynamic: true, maxNodes: 20000 })) return true
      }
      return false
    }
    const its = g.interactables().map((x) => ({ id: x.def.id, ok: reach(x.def.at, x.def.radius ?? 1.5) }))
    const exits = (def.exits ?? []).map((e) => {
      let ok = false
      for (let x = e.area[0]; x <= e.area[2] && !ok; x++) for (let y = e.area[1]; y <= e.area[3] && !ok; y++) ok = reach([x, y], 0.01)
      return { to: e.to, ok, exists: all.includes(e.to) }
    })
    return { its, exits, start, triggers: (def.triggers ?? []).length }
  }, [...allIds])
  // run every available interactable
  const ran = []
  for (const it of info.its ?? []) {
    await page.evaluate((iid) => {
      const g = window.__game
      const x = g.interactables().find((k) => k.def.id === iid)
      if (!x) return
      // stand next to it, as a player would
      const [ax, ay] = x.def.at
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 0]]) {
        if (g.world.grid.walkable(ax + dx, ay + dy, true)) { g.player.teleport(ax + dx, ay + dy); break }
      }
      void g.runInteractable(x.def)
    }, it.id)
    await page.waitForTimeout(300)
    const st = await drain(90000)
    ran.push(`${it.id}${st.timeout ? '(STUCK)' : ''}`)
    const sceneNow = await page.evaluate(() => window.__game.sceneDef?.id)
    if (sceneNow !== id) { ran.push(`→${sceneNow}`); break }
  }
  const bad = [
    ...(intro.timeout ? ['intro stuck (locked/dialogue)'] : []),
    ...(info.err ? [info.err] : []),
    ...(info.its ?? []).filter((x) => !x.ok).map((x) => `unreachable:${x.id}`),
    ...(info.exits ?? []).filter((x) => !x.ok).map((x) => `exit-unreachable:${x.to}`),
    ...(info.exits ?? []).filter((x) => !x.exists).map((x) => `exit-missing-scene:${x.to}`),
    ...ran.filter((r) => r.includes('STUCK')),
    ...errors.slice(0, 3),
  ]
  const line = `${bad.length ? 'FAIL' : 'OK  '} ${id}  its=${(info.its ?? []).length} exits=${(info.exits ?? []).length} ran=[${ran.join(',')}]${bad.length ? '\n      ' + bad.join('\n      ') : ''}`
  console.log(line)
  report.push(line)
}
await browser.close()
