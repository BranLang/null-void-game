#!/usr/bin/env node
/**
 * Smoke test: boots every scene of every chapter in a headless browser,
 * advances a few dialogue lines and reports runtime errors.
 *
 *   npm run dev            (in another terminal, or set SMOKE_URL)
 *   node scripts/smoke.mjs [baseUrl] [--shots dir] [--only sceneIdPrefix]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith('http')) ?? process.env.SMOKE_URL ?? 'http://localhost:5175/'
const shotsIdx = args.indexOf('--shots')
const shots = shotsIdx >= 0 ? args[shotsIdx + 1] : null
const onlyIdx = args.indexOf('--only')
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null
if (shots) mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const noise = /GPU stall|GL Driver|PCFSoftShadowMap|Automatic fallback to software WebGL|ERR_CERT_AUTHORITY_INVALID|favicon/
let errors = []
page.on('console', (m) => {
  if ((m.type() === 'error' || m.type() === 'warning') && !noise.test(m.text())) errors.push(`${m.type()}: ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))

// discover scenes from the running game
await page.goto(base, { waitUntil: 'load' })
await page.waitForTimeout(2500)
const scenes = await page.evaluate(() => {
  const g = window.__game
  if (!g) return []
  return g.chapters.flatMap((c) => c.scenes.map((s) => ({ chapter: c.id, scene: s.id })))
})
if (!scenes.length) {
  console.error('No scenes found (is the dev server running and the game booting?)')
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`Found ${scenes.length} scenes`)
let failed = 0
for (const { chapter, scene } of scenes) {
  if (only && !scene.startsWith(only)) continue
  errors = []
  await page.goto(`${base}?scene=${scene}`, { waitUntil: 'load' })
  await page.waitForTimeout(3500)
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Space')
    await page.waitForTimeout(450)
  }
  if (shots) await page.screenshot({ path: `${shots}/${scene}.png` })
  const ok = errors.length === 0
  if (!ok) failed++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${chapter}/${scene}${ok ? '' : '\n      ' + errors.slice(0, 6).join('\n      ')}`)
}
await browser.close()
console.log(failed ? `${failed} scene(s) reported errors` : 'All scenes booted cleanly')
process.exit(failed ? 1 : 0)
