/**
 * The scripting API available to chapter content (scene onEnter, triggers,
 * interactables, actor talk scripts). Every method that takes time returns a
 * Promise; scripts are plain async functions:
 *
 *   run: async (g) => {
 *     await g.say('soril', l('Oprav to.', 'Fix it.'))
 *     const ok = await g.minigame('flow', { level: 'tree' })
 *     if (ok) g.set('ch2.treeHealed')
 *   }
 *
 * Actor references are scene actor ids, or 'player'. Cell references are
 * [x, y] grid coordinates or a tag name from the map legend.
 */
import type { Expression } from '../engine/characters/Face'
import type { L } from '../i18n/i18n'
import type { ActorDef, AmbienceDef, MusicId, ParticleSpec, Pose, Vec2 } from '../content/types'

export type CellRef = Vec2 | string
export type ActorRef = string

export interface SayOpts {
  /** facial expression of the speaker for this line */
  mood?: Expression
  /** show the painted/rendered portrait (default true for named characters) */
  portrait?: boolean
  /** auto-advance after this many ms (cinematics), otherwise wait for the player */
  auto?: number
  /** thought (italic, no mouth movement) */
  thought?: boolean
}

export interface ChoiceOption {
  id: string
  text: L
  /** hide the option unless true */
  when?: boolean
}

export type MinigameId = 'flow' | 'focus' | 'breath' | 'cipher' | 'clock' | 'crystal' | 'haiku' | 'navigation' | 'heal' | 'inputs' | 'hold'

export type MinigameParams = Record<string, unknown>

export interface MinigameResult {
  success: boolean
  /** 0..1 quality where relevant */
  score?: number
  /** extra data (e.g. the chosen route) */
  data?: unknown
}

export type AbilityId = 'flow' | 'ice' | 'veil' | 'fire' | 'air' | 'shield' | 'push' | 'slow' | 'sora'

/** Emitted whenever the player casts an ability. */
export interface CastEvent {
  id: AbilityId
  /** cast without the haiku (instant, costs strain) */
  raw: boolean
  /** target cell (in front of the caster) */
  at: Vec2
  time: number
}

export interface GameAPI {
  // ---------------------------------------------------------------- dialogue & text
  /** Dialogue line. `who` = actor id, cast id, or null for the narrator. */
  say(who: ActorRef | null, text: L, opts?: SayOpts): Promise<void>
  /** Narration (no speaker). */
  narrate(text: L): Promise<void>
  /** Player choice; returns the chosen option id. */
  choose(options: ChoiceOption[], prompt?: L): Promise<string>
  /** Speech bubble above an actor, does not block. */
  bark(who: ActorRef, text: L, ms?: number): void
  /** Big centred cinematic text (time skips, book quotes). */
  caption(text: L, opts?: { ms?: number; sub?: L }): Promise<void>
  /** Small notification in the corner. */
  toast(text: L): void
  /** Set (or clear) the current objective shown in the HUD and journal. */
  objective(text: L | null): void
  /** Unlock a codex entry (with a toast the first time). */
  codex(id: string): void
  /** Show a readable document (a page of the Book of El, a letter, an inscription). */
  read(title: L, body: L, opts?: { style?: 'book' | 'letter' | 'stone' | 'cipher' }): Promise<void>

  // ---------------------------------------------------------------- state
  flag(key: string): boolean | number | string | undefined
  set(key: string, value?: boolean | number | string): void
  inc(key: string, by?: number): number
  /** Run fn only once per save (keyed by `key`), e.g. intro cinematics. */
  once(key: string, fn: () => Promise<void> | void): Promise<void>
  /** Relationship change with a character (shapes epilogue lines). */
  rel(character: string, delta: number): void
  relation(character: string): number
  give(item: string): void
  take(item: string): void
  has(item: string): boolean

  // ---------------------------------------------------------------- actors
  walk(who: ActorRef, to: CellRef, opts?: { run?: boolean; speed?: number }): Promise<void>
  teleport(who: ActorRef, to: CellRef, facing?: number): void
  face(who: ActorRef, target: CellRef | ActorRef | number): void
  pose(who: ActorRef, pose: Pose): void
  mood(who: ActorRef, mood: Expression): void
  /** Emote icon above the head: '!', '?', '…', '♪', '💢', '💧' */
  emote(who: ActorRef, icon: string): void
  spawn(def: ActorDef): void
  despawn(who: ActorRef): void
  show(who: ActorRef, visible: boolean): void
  /** Swap an actor's look to another cast id (e.g. Yera cuts her hair). */
  costume(who: ActorRef, castId: string): void
  /** Glyph glow on an actor (0 dim .. 3 blazing). */
  glyph(who: ActorRef, level: number): void
  /** Raise an actor off the ground (floating, possessed, carried), smoothly. 0 = back on the ground. */
  lift(who: ActorRef, height: number): void
  /** Make an actor follow the player around the scene (true) or stop (false). */
  companion(who: ActorRef, on: boolean): void
  /** Current grid position of an actor. */
  pos(who: ActorRef): Vec2
  /** Distance in tiles between two actors (or actor and cell). */
  dist(a: ActorRef, b: ActorRef | CellRef): number
  /** Resolve a tag or coordinate to a cell. */
  cell(ref: CellRef): Vec2

  // ---------------------------------------------------------------- props
  propVisible(id: string, visible: boolean): void
  /** Toggle walkability of a cell (doors, bridges, collapsed rubble). */
  setWalkable(at: CellRef, walkable: boolean): void

  // ---------------------------------------------------------------- camera, timing, screen
  focus(target: CellRef | ActorRef, opts?: { ms?: number; zoom?: number }): Promise<void>
  follow(who?: ActorRef): void
  shake(intensity?: number, ms?: number): void
  zoom(z: number, ms?: number): Promise<void>
  wait(ms: number): Promise<void>
  fade(to: 'black' | 'white' | 'clear', ms?: number): Promise<void>
  /** Flash the screen (glyph casts, explosions). */
  flash(color?: string, ms?: number): void
  /** Wait until a condition becomes true (checked every frame while the player plays). */
  until(pred: () => boolean): Promise<void>
  /** Give control back to the player inside a script (for gameplay segments). */
  free(): void
  /** Take control away again (cinematic). */
  lock(): void

  // ---------------------------------------------------------------- world & flow
  goto(sceneId: string, spawn?: string): Promise<void>
  endChapter(): Promise<void>
  /** Autosave now (between beats). */
  checkpoint(): void
  /** Retry the current scene from its last checkpoint (used after failing). */
  fail(text?: L): Promise<void>

  // ---------------------------------------------------------------- audio & atmosphere
  music(id: MusicId | null, fadeMs?: number): void
  sfx(id: string, volume?: number): void
  /** Blend lighting/sky/fog towards new settings over ms. */
  atmosphere(a: Partial<AmbienceDef>, ms?: number): Promise<void>
  particles(spec: ParticleSpec): void
  stopParticles(id: string): void
  /** Eclipse amount on the sky 0..1 */
  eclipse(amount: number, ms?: number): Promise<void>

  // ---------------------------------------------------------------- Spira & gameplay systems
  unlock(ability: AbilityId): void
  hasAbility(ability: AbilityId): boolean
  /** Visual Spira effect at a place: glyph circle, burst, frost, dust... */
  fx(kind: 'glyph' | 'burst' | 'frost' | 'fire' | 'dust' | 'heal' | 'sora' | 'shockwave' | 'lightning', at: CellRef | ActorRef, opts?: { color?: string; scale?: number; ms?: number }): void
  /** Sai clock: force a phase or release it. */
  sai(phase: 'light' | 'heavy' | 'neutral' | 'cycle'): void
  saiPhase(): 'light' | 'heavy' | 'neutral'
  /** Strain (0..1) of the player's Spira; raw casts raise it. */
  strain(): number
  addStrain(amount: number): void
  /** Start a minigame overlay and wait for the result. */
  minigame(id: MinigameId, params?: MinigameParams): Promise<MinigameResult>
  /** Arm or disarm stealth detection for this scene. */
  stealth(on: boolean): void
  /** Whether the veil (invisibility) is currently active on the player. */
  veiled(): boolean
  /** Break the player's veil (a fiber touched her, she was hurt, she knocked on a gate). */
  dropVeil(): void
  /** Listen to the player's casts (boss fights, puzzles). Returns an unsubscribe function. */
  onCast(fn: (e: CastEvent) => void): () => void
  /** Show a short control hint at the bottom of the screen (null hides it). */
  hint(text: L | null): void
  /** Letterbox bars for cinematics. */
  cinematic(on: boolean): void

  /** Game time in seconds since the scene started (for onUpdate logic). */
  readonly time: number
}
