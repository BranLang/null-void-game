import * as THREE from 'three'
import type { ActorDef, AmbienceDef, MusicId, ParticleSpec, Pose, Script, Vec2 } from '../content/types'
import type { Expression } from '../engine/characters/Face'
import { t, l, type L } from '../i18n/i18n'
import { CAST } from '../content/characters'
import type { AbilityId, ActorRef, CastEvent, CellRef, ChoiceOption, GameAPI, MinigameId, MinigameParams, MinigameResult, SayOpts } from './GameAPI'
import type { Game } from './Game'
import { facingToYaw } from './Actor'
import { runMinigame } from '../minigames'

interface Waiter {
  until: number
  resolve: () => void
}

interface Predicate {
  pred: () => boolean
  resolve: () => void
}

/**
 * Runs content scripts and implements the GameAPI on top of the Game.
 * Every scene load starts a new epoch; API objects of older epochs become
 * inert so that scripts from a previous scene cannot touch the new one.
 */
export class Director {
  epoch = 0
  /** number of running scripts that lock player control */
  private locks = 0
  /** set by g.free(): the player may move although a script is running */
  freed = false
  private waiters: Waiter[] = []
  private predicates: Predicate[] = []
  private castListeners = new Set<(e: CastEvent) => void>()
  time = 0
  private hideTimer = 0
  private running = 0

  constructor(private game: Game) {}

  /** Player control is blocked by a cinematic script. */
  get locked(): boolean {
    return this.locks > 0 && !this.freed
  }

  get busy(): boolean {
    return this.running > 0
  }

  newEpoch(): void {
    this.epoch++
    this.locks = 0
    this.running = 0
    this.freed = false
    // abandon waits of the old scene (they never resolve; their scripts are stale)
    this.waiters = []
    this.predicates = []
    this.castListeners.clear()
    this.time = 0
  }

  /** Run a script. `lock` blocks player control while it runs (default true). */
  async run(script: Script | undefined, lock = true): Promise<void> {
    if (!script) return
    const epoch = this.epoch
    const api = this.api(epoch)
    this.running++
    if (lock) this.locks++
    try {
      await script(api)
    } catch (e) {
      console.error('[script]', e)
    } finally {
      if (epoch === this.epoch) {
        this.running = Math.max(0, this.running - 1)
        if (lock) this.locks = Math.max(0, this.locks - 1)
        if (this.locks === 0) this.freed = false
        this.scheduleHide()
      }
    }
  }

  emitCast(e: CastEvent): void {
    for (const fn of this.castListeners) fn(e)
  }

  /** Advance timers and predicates; called every frame while the game runs. */
  tick(dt: number): void {
    this.time += dt
    if (this.waiters.length) {
      const due = this.waiters.filter((w) => w.until <= this.time)
      this.waiters = this.waiters.filter((w) => w.until > this.time)
      due.forEach((w) => w.resolve())
    }
    if (this.predicates.length) {
      const done: Predicate[] = []
      for (const p of this.predicates) {
        try {
          if (p.pred()) done.push(p)
        } catch {
          done.push(p)
        }
      }
      this.predicates = this.predicates.filter((p) => !done.includes(p))
      done.forEach((p) => p.resolve())
    }
  }

  private scheduleHide(): void {
    clearTimeout(this.hideTimer)
    this.hideTimer = window.setTimeout(() => {
      if (!this.game.dialogueBusy) this.game.ui.dialogue.hide()
    }, 60)
  }

  // --------------------------------------------------------------------------
  api(epoch: number): GameAPI {
    const game = this.game
    const director = this
    const live = () => epoch === director.epoch
    const never = new Promise<never>(() => {})
    const resolveCell = (ref: CellRef): Vec2 => {
      if (Array.isArray(ref)) return ref
      if (ref === 'player' && game.player) return game.player.cell()
      const actor = game.actors.get(ref)
      if (actor) return actor.cell()
      const tagged = game.world?.grid.findTag(ref)
      if (tagged) return tagged
      const spawn = game.sceneDef?.spawns?.[ref]
      if (spawn) return spawn
      console.warn(`[script] unknown cell ref '${ref}'`)
      return game.player?.cell() ?? [0, 0]
    }
    const actor = (who: ActorRef) => {
      const a = who === 'player' ? game.player : game.actors.get(who)
      if (!a) console.warn(`[script] unknown actor '${who}'`)
      return a ?? null
    }
    const worldOf = (ref: CellRef | ActorRef): THREE.Vector3 => {
      if (typeof ref === 'string') {
        const a = ref === 'player' ? game.player : game.actors.get(ref)
        if (a) return a.worldPos().add(new THREE.Vector3(0, 0.9, 0))
      }
      const c = resolveCell(ref as CellRef)
      return game.world!.worldPos(c[0], c[1]).add(new THREE.Vector3(0, 0.9, 0))
    }

    const api: GameAPI = {
      get time() {
        return director.time
      },
      // ---------------------------------------------------------- dialogue
      async say(who: ActorRef | null, text: L, opts: SayOpts = {}) {
        if (!live()) return never
        await game.say(who, text, opts)
      },
      async narrate(text: L) {
        if (!live()) return never
        await game.say(null, text, {})
      },
      async choose(options: ChoiceOption[], prompt?: L) {
        if (!live()) return never
        return game.choose(options.filter((o) => o.when !== false), prompt)
      },
      bark(who, text, ms) {
        if (!live()) return
        const a = actor(who)
        if (!a) return
        game.ui.bark(t(text), () => game.anchor(a), ms ?? 2400 + t(text).length * 40)
      },
      async caption(text, opts = {}) {
        if (!live()) return never
        await game.ui.caption(t(text), opts.sub ? t(opts.sub) : null, opts.ms ?? 3200)
      },
      toast(text) {
        if (!live()) return
        game.ui.toast(t(text))
      },
      objective(text) {
        if (!live()) return
        game.state.objective = text
        game.ui.setObjective(text ? t(text) : null)
        if (text) game.audio.sfx('chime', 0.5)
      },
      codex(id) {
        if (!live()) return
        game.unlockCodex(id)
      },
      async read(title, body, opts = {}) {
        if (!live()) return never
        await game.read(title, body, opts.style)
      },
      // ---------------------------------------------------------- state
      flag(key) {
        return game.state.flags[key]
      },
      set(key, value = true) {
        if (!live()) return
        game.state.flags[key] = value
      },
      inc(key, by = 1) {
        const v = (Number(game.state.flags[key]) || 0) + by
        if (live()) game.state.flags[key] = v
        return v
      },
      async once(key, fn) {
        if (!live() || game.state.flags[`once.${key}`]) return
        game.state.flags[`once.${key}`] = true
        await fn()
      },
      rel(character, delta) {
        if (!live()) return
        game.state.rel[character] = (game.state.rel[character] ?? 0) + delta
      },
      relation(character) {
        return game.state.rel[character] ?? 0
      },
      give(item) {
        if (live()) game.state.items.add(item)
      },
      take(item) {
        if (live()) game.state.items.delete(item)
      },
      has(item) {
        return game.state.items.has(item)
      },
      // ---------------------------------------------------------- actors
      async walk(who, to, opts = {}) {
        if (!live()) return never
        const a = actor(who)
        if (!a) return
        const goal = resolveCell(to)
        const path = game.world!.grid.findPath(a.cell(), goal, { ignoreDynamic: true }) ?? [goal]
        await a.follow(path, opts.speed ?? (opts.run ? 4.6 : 2.4), !!opts.run)
      },
      teleport(who, to, facing) {
        if (!live()) return
        const a = actor(who)
        if (!a) return
        const c = resolveCell(to)
        a.teleport(c[0], c[1])
        if (facing !== undefined) a.faceYaw(facingToYaw(facing), true)
        if (who === 'player') game.rig.snapTo(a.worldPos())
      },
      face(who, target) {
        if (!live()) return
        const a = actor(who)
        if (!a) return
        if (typeof target === 'number') {
          a.faceYaw(facingToYaw(target))
          return
        }
        if (typeof target === 'string' && (target === 'player' || game.actors.has(target))) {
          const b = target === 'player' ? game.player : game.actors.get(target)
          if (b) {
            a.facePoint(b.x, b.y)
            a.lookAt(b.headWorld())
          }
          return
        }
        const c = resolveCell(target as CellRef)
        a.facePoint(c[0], c[1])
      },
      pose(who, pose: Pose) {
        if (live()) actor(who)?.setPose(pose)
      },
      mood(who, mood: Expression) {
        if (live()) actor(who)?.setMood(mood)
      },
      emote(who, icon) {
        if (!live()) return
        const a = actor(who)
        if (a) game.ui.emote(icon, () => game.anchor(a))
      },
      spawn(def: ActorDef) {
        if (live()) game.spawnActor(def)
      },
      despawn(who) {
        if (live()) game.despawnActor(who)
      },
      show(who, visible) {
        if (live()) actor(who)?.setVisible(visible)
      },
      costume(who, castId) {
        if (live()) actor(who)?.costume(castId)
      },
      glyph(who, level) {
        if (live()) actor(who)?.animator?.setGlyph(level)
      },
      lift(who, height) {
        const a = live() ? actor(who) : null
        if (a) a.lift = height
      },
      companion(who, on) {
        if (!live()) return
        if (on) game.companions.add(who)
        else game.companions.delete(who)
      },
      pos(who) {
        return actor(who)?.cell() ?? [0, 0]
      },
      dist(a, b) {
        const pa = actor(a)
        if (!pa) return Infinity
        if (typeof b === 'string' && (b === 'player' || game.actors.has(b))) {
          const pb = actor(b)
          return pb ? Math.hypot(pa.x - pb.x, pa.y - pb.y) : Infinity
        }
        const c = resolveCell(b as CellRef)
        return Math.hypot(pa.x - c[0], pa.y - c[1])
      },
      cell(ref) {
        return resolveCell(ref)
      },
      // ---------------------------------------------------------- props
      propVisible(id, visible) {
        if (live()) game.world?.setPropVisible(id, visible)
      },
      setWalkable(at, walkable) {
        if (!live() || !game.world) return
        const [x, y] = resolveCell(at)
        const c = game.world.grid.cell(x, y)
        if (c) c.baseWalk = walkable
      },
      // ---------------------------------------------------------- camera & timing
      async focus(target, opts = {}) {
        if (!live()) return never
        const p = worldOf(target)
        p.y -= 0.6
        await game.rig.focus(p, opts.ms ?? 900, opts.zoom)
      },
      follow(who = 'player') {
        if (!live()) return
        const a = actor(who)
        if (a) game.rig.followTarget(() => a.worldPos().add(new THREE.Vector3(0, 0.6, 0)))
      },
      shake(intensity = 0.25, ms = 400) {
        if (live() && game.settings.screenShake) game.rig.shake(intensity, ms)
      },
      async zoom(z, ms = 800) {
        if (!live()) return never
        const target = game.rig.target.clone()
        await game.rig.focus(target, ms, z)
      },
      wait(ms) {
        if (!live()) return never
        return new Promise<void>((resolve) => director.waiters.push({ until: director.time + ms / 1000, resolve }))
      },
      async fade(to, ms = 600) {
        if (!live()) return never
        await game.ui.fade(to, ms)
      },
      flash(color = '#ffffff', ms = 500) {
        if (live() && !game.settings.reducedMotion) game.ui.flash(color, ms)
      },
      until(pred) {
        if (!live()) return never
        return new Promise<void>((resolve) => director.predicates.push({ pred, resolve }))
      },
      free() {
        if (live()) director.freed = true
      },
      lock() {
        if (live()) director.freed = false
      },
      // ---------------------------------------------------------- flow
      async goto(sceneId, spawn) {
        if (!live()) return never
        await game.gotoScene(sceneId, spawn)
        return never
      },
      async endChapter() {
        if (!live()) return never
        await game.completeChapter()
        return never
      },
      checkpoint() {
        if (live()) game.checkpoint()
      },
      async fail(text) {
        if (!live()) return never
        await game.failAndRetry(text)
        return never
      },
      // ---------------------------------------------------------- audio & atmosphere
      music(id: MusicId | null, fadeMs) {
        if (live()) game.audio.playMusic(id, fadeMs)
      },
      sfx(id, volume) {
        if (live()) game.audio.sfx(id, volume)
      },
      async atmosphere(a: Partial<AmbienceDef>, ms = 1500) {
        if (!live() || !game.world) return
        if (a.music !== undefined) game.audio.playMusic(a.music ?? null)
        if (a.sounds) game.audio.setAmbience(a.sounds)
        await game.world.blendAmbience(a, ms)
      },
      particles(spec: ParticleSpec) {
        if (live()) game.world?.particles.add(spec)
      },
      stopParticles(id) {
        if (live()) game.world?.particles.remove(id)
      },
      async eclipse(amount, ms = 2000) {
        if (!live() || !game.world) return
        const sky = game.world.sky
        const from = sky.eclipse
        const start = director.time
        await new Promise<void>((resolve) =>
          director.predicates.push({
            pred: () => {
              const k = Math.min(1, (director.time - start) / (ms / 1000))
              sky.setEclipse(from + (amount - from) * k)
              return k >= 1
            },
            resolve,
          }),
        )
      },
      // ---------------------------------------------------------- systems
      unlock(ability: AbilityId) {
        if (live()) game.unlockAbility(ability)
      },
      hasAbility(ability) {
        return game.state.abilities.has(ability)
      },
      fx(kind, at, opts = {}) {
        if (!live()) return
        game.effect(kind, worldOf(at).sub(new THREE.Vector3(0, 0.9, 0)), opts)
      },
      sai(phase) {
        if (live()) game.sai.force(phase)
      },
      saiPhase() {
        return game.sai.phase
      },
      strain() {
        return game.spira.strain
      },
      addStrain(amount) {
        if (live()) game.spira.strain = Math.min(1.2, game.spira.strain + amount)
      },
      async minigame(id: MinigameId, params: MinigameParams = {}): Promise<MinigameResult> {
        if (!live()) return never
        game.minigameActive = true
        game.ui.dialogue.hide()
        try {
          return await runMinigame(id, params, {
            sfx: (s) => game.audio.sfx(s),
            assist: { skipAllowed: game.settings.assistSkip, slowTimers: game.settings.assistSlow, reducedMotion: game.settings.reducedMotion },
          })
        } finally {
          game.minigameActive = false
        }
      },
      stealth(on) {
        if (live()) game.setStealth(on)
      },
      veiled() {
        return game.spira.veilActive
      },
      dropVeil() {
        if (live() && game.spira.veilActive) {
          game.spira.veilActive = false
          game.audio.sfx('close', 0.6)
        }
      },
      onCast(fn) {
        if (!live()) return () => {}
        director.castListeners.add(fn)
        return () => director.castListeners.delete(fn)
      },
      hint(text) {
        if (live()) game.ui.hint(text ? t(text) : null)
      },
      cinematic(on) {
        if (live()) {
          game.ui.setLetterbox(on)
          game.ui.setHudVisible(!on)
        }
      },
    }
    return api
  }
}

/** Display name of a speaker reference without a scene (cast ids). */
export function castName(id: string): L {
  return CAST[id]?.name ?? l(id, id)
}
