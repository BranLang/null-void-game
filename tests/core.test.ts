import { describe, expect, it } from 'vitest'
import { Grid, parseMap } from '../src/engine/Grid'
import { SaveStore, type StorageLike } from '../src/game/Save'
import { GameState } from '../src/game/State'
import { SaiClock } from '../src/game/SaiClock'
import { SpiraState, ABILITIES } from '../src/game/Spira'
import { l, setLang, t } from '../src/i18n/i18n'

const room = {
  rows: ['#######', '#.....#', '#.##..#', '#..#..#', '#.....#', '#######'],
  legend: { '#': { floor: 'stone' as const, wall: 'stone' as const }, '.': { floor: 'stone' as const } },
}

describe('Grid', () => {
  it('parses walls and floors', () => {
    const cells = parseMap(room)
    expect(cells.length).toBe(6)
    expect(cells[0][0].wall).toBe(true)
    expect(cells[1][1].baseWalk).toBe(true)
  })

  it('finds a path around walls without cutting corners', () => {
    const g = new Grid(room)
    const path = g.findPath([1, 3], [4, 3])
    expect(path).not.toBeNull()
    expect(path![path!.length - 1]).toEqual([4, 3])
    for (const [x, y] of path!) expect(g.walkable(x, y)).toBe(true)
  })

  it('respects dynamic blockers', () => {
    const g = new Grid(room)
    g.block(2, 1)
    g.block(1, 2)
    expect(g.walkable(2, 1)).toBe(false)
    g.block(2, 1, false)
    expect(g.walkable(2, 1)).toBe(true)
  })

  it('only steps one level on stairs', () => {
    const g = new Grid({
      rows: ['abc'],
      legend: { a: { floor: 'stone', h: 0 }, b: { floor: 'stone', h: 1 }, c: { floor: 'stone', h: 3, stairs: true } },
    })
    expect(g.canStep(0, 0, 1, 0)).toBe(false)
    expect(g.canStep(1, 0, 2, 0)).toBe(false)
  })

  it('opens leap gaps only in the light hour', () => {
    const g = new Grid({ rows: ['.~.'], legend: { '.': { floor: 'roof' }, '~': { floor: 'void', leap: true, walk: true } } })
    expect(g.walkable(1, 0)).toBe(false)
    g.leapOpen = true
    expect(g.walkable(1, 0)).toBe(true)
  })

  it('computes line of sight through open floor and not through walls', () => {
    const g = new Grid(room)
    expect(g.lineOfSight(1, 1, 5, 1)).toBe(true)
    expect(g.lineOfSight(1, 2, 4, 2)).toBe(false)
  })
})

class MemStore implements StorageLike {
  m = new Map<string, string>()
  getItem(k: string) {
    return this.m.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.m.set(k, v)
  }
  removeItem(k: string) {
    this.m.delete(k)
  }
}

describe('Save', () => {
  it('round-trips game state through a slot', () => {
    const store = new SaveStore(new MemStore())
    const s = new GameState()
    s.chapterId = 'ch03'
    s.sceneId = 'c3_garden'
    s.flags['c3.met'] = true
    s.items.add('stone')
    s.codex.add('gloss.spira')
    s.abilities.add('veil')
    s.rel.arkot = 2
    store.write('1', s.toSave({ player: { x: 3, y: 4, facing: 1 } }))
    const back = store.read('1')!
    const s2 = new GameState()
    s2.fromSave(back)
    expect(s2.sceneId).toBe('c3_garden')
    expect(s2.flags['c3.met']).toBe(true)
    expect(s2.items.has('stone')).toBe(true)
    expect(s2.abilities.has('veil')).toBe(true)
    expect(s2.rel.arkot).toBe(2)
    expect(back.player).toEqual({ x: 3, y: 4, facing: 1 })
  })

  it('reports the latest save and ignores corrupt data', () => {
    const mem = new MemStore()
    const store = new SaveStore(mem)
    const s = new GameState()
    s.chapterId = 'ch01'
    s.sceneId = 'a'
    store.write('auto', { ...s.toSave(), savedAt: 10 })
    store.write('2', { ...s.toSave(), savedAt: 20, sceneId: 'b' })
    mem.setItem('nvs.save.3', '{broken')
    expect(store.latest()?.slot).toBe('2')
    expect(store.read('3')).toBeNull()
  })
})

describe('SaiClock', () => {
  it('cycles through light, neutral and heavy hours', () => {
    const c = new SaiClock()
    c.configure({ cycle: 100 })
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      c.update(1)
      seen.add(c.phase)
    }
    expect(seen).toEqual(new Set(['light', 'neutral', 'heavy']))
  })

  it('pins a forced phase and changes movement speed', () => {
    const c = new SaiClock()
    c.configure({ phase: 'heavy' })
    for (let i = 0; i < 20; i++) c.update(0.1)
    expect(c.phase).toBe('heavy')
    expect(c.speedFactor).toBeLessThan(1)
    c.force('light')
    for (let i = 0; i < 60; i++) c.update(0.1)
    expect(c.phase).toBe('light')
    expect(c.speedFactor).toBeGreaterThan(1)
  })
})

describe('Spira', () => {
  it('drains the veil and drops it when concentration runs out', () => {
    const s = new SpiraState()
    s.veilActive = true
    let dropped = false
    for (let i = 0; i < 400 && !dropped; i++) dropped = s.update(0.1, { running: true, moving: true }).veilDropped
    expect(dropped).toBe(true)
    expect(s.veilActive).toBe(false)
  })

  it('collapses when strain overflows', () => {
    const s = new SpiraState()
    s.strain = 1.05
    const r = s.update(0.016, { running: false, moving: false })
    expect(r.collapsed).toBe(true)
    expect(s.strain).toBeLessThan(1)
  })

  it('raw casts cost more strain than haiku casts', () => {
    for (const a of Object.values(ABILITIES)) expect(a.rawStrain).toBeGreaterThanOrEqual(a.safeStrain)
  })
})

describe('i18n', () => {
  it('switches language and substitutes variables', () => {
    setLang('sk')
    expect(t(l('Ahoj {n}', 'Hello {n}'), { n: 'Yera' })).toBe('Ahoj Yera')
    setLang('en')
    expect(t(l('Ahoj {n}', 'Hello {n}'), { n: 'Yera' })).toBe('Hello Yera')
  })
})
