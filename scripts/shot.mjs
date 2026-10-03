#!/usr/bin/env node
/**
 * Screenshot helper: node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs] [keys...]
 * Extra args after waitMs are key presses (e.g. Space Space KeyD:800 for holding D 800ms).
 */
import { chromium } from 'playwright'

const [, , url, out, w = '1600', h = '900', wait = '5000', ...keys] = process.argv
if (!url || !out) {
  console.log('usage: node scripts/shot.mjs <url> <out.png> [w] [h] [waitMs] [keys...]')
  process.exit(1)
}
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const logs = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`)
})
page.on('pageerror', (e) => logs.push(`PAGEERROR: ${e.message}`))
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(+wait)
for (const k of keys) {
  const [code, hold] = k.split(':')
  if (code === 'wait') {
    await page.waitForTimeout(+hold)
    continue
  }
  if (hold) {
    await page.keyboard.down(code)
    await page.waitForTimeout(+hold)
    await page.keyboard.up(code)
  } else await page.keyboard.press(code)
  await page.waitForTimeout(350)
}
await page.screenshot({ path: out })
console.log(logs.filter((l) => !/GPU stall|GL Driver|PCFSoftShadowMap/.test(l)).slice(0, 20).join('\n'))
await browser.close()
