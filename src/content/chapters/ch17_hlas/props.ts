/**
 * Chapter 17 props and cast: weathered stone foxes of the old cemetery, and
 * Tami while something else sits behind her eyes.
 */
import * as THREE from 'three'
import { registerProp } from '../../../engine/props/registry'
import { M, bool, variant, ball, bx, cy, leaf, rot, cachedBuild, wrap } from '../../../engine/props/kit'
import { CAST } from '../../characters'
import type { CharacterLook } from '../../../engine/characters/look'
import { l } from '../../../i18n/i18n'

/** A stone fox, smoothed blind by rain and time; `broken` leaves it headless and cracked. */
registerProp('ch17_fox_statue', {
  solid: true,
  build: (ctx) => {
    const broken = bool(ctx, 'broken')
    const v = variant(ctx, 2)
    const inner = cachedBuild(`c17fox|${broken}|${v}`, () => {
      const g = new THREE.Group()
      const stone = M('#8a8a80')
      const dark = M('#6a6a62')
      const moss = M('#5a7a3a')
      g.add(bx(0.62, 0.28, 0.62, dark, 0, 0, 0))
      g.add(bx(0.54, 0.06, 0.54, stone, 0, 0.28, 0))
      // sitting fox
      g.add(ball(0.2, 0.26, 0.24, stone, 0, 0.56, -0.02, 10))
      g.add(ball(0.14, 0.18, 0.14, stone, 0, 0.76, 0.08, 10))
      for (const s of [-1, 1]) g.add(rot(cy(0.035, 0.045, 0.3, stone, s * 0.1, 0.32, 0.12, 6), 0.15, 0, 0))
      g.add(leaf([0.12, 0.4, -0.18], [0.3, 0.36, 0.18], 0.16, 0.12, stone))
      if (!broken) {
        g.add(ball(0.11, 0.1, 0.12, stone, 0, 0.98, 0.1, 10))
        g.add(rot(cy(0.0, 0.05, 0.12, stone, 0, 0.98, 0.24, 6), Math.PI / 2, 0, 0))
        for (const s of [-1, 1]) g.add(rot(cy(0, 0.04, 0.12, stone, s * 0.06, 1.05, 0.08, 4), 0, 0, -s * 0.3))
        if (v) g.add(rot(cy(0.03, 0.035, 0.22, stone, 0.12, 0.62, 0.2, 6), -0.9, 0, 0))
      } else {
        g.add(ball(0.1, 0.08, 0.1, dark, 0.3, 0.06, 0.25, 8))
        g.add(bx(0.02, 0.3, 0.2, M('#3a3a36'), 0.04, 0.5, 0))
      }
      g.add(ball(0.18, 0.05, 0.16, moss, -0.18, 0.3, 0.16, 8))
      return g
    })
    return wrap(inner, 0)
  },
})

const tamiLook = CAST.tami.look as CharacterLook

/** Tami with violet just beneath the blue. */
CAST['c17_tami_violet'] = {
  name: l('Tami', 'Tami'),
  color: '#ffb070',
  look: { ...tamiLook, eyes: '#8a6ad8' },
}

/** Tami's body, Samael's voice: full violet, the Book in her hand. */
CAST['c17_tami_samael'] = {
  name: l('Samael', 'Samael'),
  color: '#c38bff',
  look: { ...tamiLook, eyes: '#c070ff', glyph: '#b77dff', accessories: ['goggles', 'scarf', 'book'] },
}

/** The same, without the Book (the moment before she takes it). */
CAST['c17_tami_samael_empty'] = {
  name: l('Samael', 'Samael'),
  color: '#c38bff',
  look: { ...tamiLook, eyes: '#c070ff', glyph: '#b77dff', accessories: ['goggles', 'scarf'] },
}
