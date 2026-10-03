/** Small shared helpers for chapter 13 scripts. */
import type { GameAPI } from '../../../game/GameAPI'
import type { AmbienceDef } from '../../types'
import { l, type L } from '../../../i18n/i18n'

/** Goji translating the Old Tongue (a quieter voice, careful, with gaps). */
export async function goji(g: GameAPI, text: L, mood: 'neutral' | 'sad' | 'surprised' | 'fear' | 'tender' | 'blank' | 'closed' | 'determined' = 'neutral'): Promise<void> {
  await g.say('goji', text, { mood })
}

/**
 * Aether speaks the Old Tongue. The book renders the Old Tongue the way the wolves of Hel
 * chant it (“Alfádir… wórrch-overr oss…”): an old, broken echo of a language from the stars.
 * The line is shown as heard; Goji translates it afterwards.
 */
export async function aether(g: GameAPI, heard: string): Promise<void> {
  g.sfx('bass', 0.25)
  await g.say('aether', l(`„${heard}“`, `“${heard}”`))
}

/** Sky object for the tundra with a given aurora and Infera position (sky.set needs every field). */
export function tundraSky(aurora: number, inferaX = 0.12, inferaY = 0.78): AmbienceDef['sky'] {
  return { top: '#02040b', bottom: '#0e1a2c', stars: 1, aurora, infera: { x: inferaX, y: inferaY } }
}

/** Animate the aurora rising over ms (the sky itself has no tween, so step it). */
export async function auroraTo(g: GameAPI, from: number, to: number, ms: number): Promise<void> {
  const steps = Math.max(1, Math.round(ms / 120))
  for (let i = 1; i <= steps; i++) {
    void g.atmosphere({ sky: tundraSky(from + ((to - from) * i) / steps) }, 0)
    await g.wait(ms / steps)
  }
}
