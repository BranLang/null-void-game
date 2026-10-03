import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript(() => { window.__autoMinigame = true })
p.on('pageerror', (e) => console.log('ERR', e.message))
p.on('console', (m) => { if (m.type() === 'error') console.log('CERR', m.text().slice(0, 160)) })
await p.goto('http://localhost:5175/?scene=' + process.argv[2], { waitUntil: 'load' })
await p.waitForTimeout(3000)
let fired = false
for (let i = 0; i < +(process.argv[3] ?? 30); i++) {
  if (process.argv[4] && i === 8 && !fired) {
    fired = true
    console.log('RUN', await p.evaluate((id) => { const g = window.__game; const all = g.sceneDef.interactables.map((x) => x.id); const x = g.interactables().find((k) => k.def.id === id); if (x) void g.runInteractable(x.def); return { all, avail: g.interactables().map((k) => k.def.id), found: !!x } }, process.argv[4]))
  }
  const st = await p.evaluate(() => {
    const g = window.__game
    const d = g.director
    return { px: +g.player.x.toFixed(2), py: +g.player.y.toFixed(2), path: g.player.path.length, next: g.player.path[0], busy: g.dialogueBusy, locks: d.locks, freed: d.freed, running: d.running, mode: g.mode, text: document.querySelector('.nv-dialogue.show .nv-text')?.textContent?.slice(0, 50), mg: g.minigameActive, card: g.cardOpen }
  })
  console.log(i, JSON.stringify(st))
  if (st.busy || st.card) await p.keyboard.press('Space')
  await p.waitForTimeout(700)
}
await p.screenshot({ path: '/tmp/claude-0/-home-user-null-void-game/866b1f4e-8798-5961-aa16-709718ee3bb6/scratchpad/dbg.png' })
await b.close()
