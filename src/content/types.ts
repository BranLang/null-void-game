import type { PlateDef } from '../engine/plate/plateMath'
/**
 * Content authoring types. Chapters, scenes, maps, actors and scripts are
 * plain TypeScript data built from these interfaces. See docs/CONTENT_GUIDE.md.
 */
import type { L } from '../i18n/i18n'
import type { AbilityId, GameAPI } from '../game/GameAPI'

/** Grid coordinate: [column, row]. Row 0 is the top line of the ASCII map. */
export type Vec2 = [number, number]

export type Script = (g: GameAPI) => Promise<void> | void

export type FloorType =
  | 'stone'
  | 'cobble'
  | 'marble'
  | 'white'
  | 'grass'
  | 'moss'
  | 'dirt'
  | 'mud'
  | 'sand'
  | 'blacksand'
  | 'gravel'
  | 'snow'
  | 'ice'
  | 'wood'
  | 'deck'
  | 'metal'
  | 'roof'
  | 'tile'
  | 'carpet'
  | 'rock'
  | 'obsidian'
  | 'ash'
  | 'andesite'
  | 'water'
  | 'deep'
  | 'canal'
  | 'lava'
  | 'void'
  | 'dream'

export type WallType =
  | 'stone'
  | 'white'
  | 'marble'
  | 'brick'
  | 'wood'
  | 'plank'
  | 'metal'
  | 'iron'
  | 'rust'
  | 'obsidian'
  | 'rock'
  | 'andesite'
  | 'hedge'
  | 'ice'
  | 'glass'
  | 'dream'

export interface PropSpec {
  /** Registered prop type, e.g. 'lantern', 'tree', 'crate' (see engine/props) */
  type: string
  /** Rotation in degrees around the vertical axis */
  rot?: number
  scale?: number
  /** Optional colour override (CSS colour) */
  color?: string
  /** Vertical offset in world units */
  y?: number
  /** Sub-cell offset in tiles, e.g. [0.5, 0] puts it on the cell edge */
  offset?: [number, number]
  /** Free parameters understood by the prop builder */
  params?: Record<string, string | number | boolean>
  /** Blocks movement (default: as registered for the type) */
  solid?: boolean
  /** Id for scripts: g.prop('id') */
  id?: string
  /** Start hidden */
  hidden?: boolean
}

export interface PlacedProp extends PropSpec {
  at: Vec2
}

export interface TileSpec {
  floor?: FloorType | null
  /** Floor level; each level is 0.5 world units high */
  h?: number
  wall?: WallType
  /** Wall height in world units (default 2.4) */
  wallH?: number
  prop?: PropSpec | string
  /** Force walkable / blocked */
  walk?: boolean
  /** Lets characters step between neighbouring levels that differ by 1 */
  stairs?: boolean
  /** A gap that can only be leapt during Sai's light hour */
  leap?: boolean
  /** Named cell, scripts can resolve it with g.cell('tag') */
  tag?: string
  /** Optional colour tint for this floor tile */
  tint?: string
  /** Material of the floor block's visible sides (e.g. 'white' for a building under a 'roof') */
  side?: WallType
}

export interface MapDef {
  /** ASCII layout. Every character must be in the legend, except ' ' (nothing). */
  rows: string[]
  legend: Record<string, TileSpec>
}

export type ParticleKind =
  | 'dust'
  | 'motes'
  | 'fireflies'
  | 'lanterns'
  | 'rain'
  | 'snow'
  | 'embers'
  | 'ash'
  | 'blackdust'
  | 'leaves'
  | 'petals'
  | 'spores'
  | 'bubbles'
  | 'steam'
  | 'clouds'
  | 'stars'

export interface ParticleSpec {
  kind: ParticleKind
  /** number of particles (default depends on kind) */
  count?: number
  /** area [x0, y0, x1, y1] in grid coords; default: whole map */
  area?: [number, number, number, number]
  color?: string
  /** around a point instead of an area (blackdust swirls) */
  at?: Vec2
  radius?: number
  id?: string
}

export type MusicId =
  | 'main_menu'
  | 'black_dust'
  | 'dungeon_water'
  | 'epic_boss_fight'
  | 'iron_army'
  | 'main'
  | 'medley'
  | 'moss'
  | 'null_void'
  | 'space_theme'
  | 'temple'
  | 'combat_epic_1'
  | 'combat_epic_2'
  | 'combat_action_1'
  | 'combat_action_2'

export type AmbientSoundId =
  | 'wind'
  | 'storm'
  | 'rain'
  | 'sea'
  | 'water'
  | 'crowd'
  | 'fire'
  | 'forest'
  | 'night'
  | 'drone'
  | 'hum'
  | 'machine'
  | 'cave'
  | 'void'

export interface AmbienceDef {
  sky: { top: string; bottom: string; stars?: number; sai?: { x: number; y: number; r: number; eclipse?: number }; infera?: { x: number; y: number }; aurora?: number; clouds?: number }
  /** Linear fog colour and distances (world units from the camera focus). Omit for none. */
  fog?: { color: string; near: number; far: number }
  hemi: { sky: string; ground: string; intensity: number }
  sun?: { color: string; intensity: number; dir: [number, number, number]; shadows?: boolean }
  exposure?: number
  bloom?: { strength: number; radius?: number; threshold?: number }
  grade?: { tint?: string; saturation?: number; contrast?: number; vignette?: number; grain?: number }
  particles?: ParticleSpec[]
  music?: MusicId | null
  sounds?: AmbientSoundId[]
}

export type Pose =
  | 'stand'
  | 'sit'
  | 'kneel'
  | 'lie'
  | 'pray'
  | 'cast'
  | 'crouch'
  | 'carry'
  | 'dance'
  | 'point'
  | 'armsUp'
  | 'hug'
  | 'fight'
  | 'slump'

export interface GuardSpec {
  /** waypoints for a patrol loop; omit to stand still */
  patrol?: Vec2[]
  /** wait at each waypoint (ms) */
  pause?: number
  /** vision range in tiles */
  range?: number
  /** full field of view in degrees */
  fov?: number
  /** degrees to sweep left/right while standing */
  sweep?: number
  /** guard does not see the player while this returns true (e.g. Nira looks away) */
  blindWhen?: (g: GameAPI) => boolean
}

export interface PhantomSpec {
  /** feeler fibers: count and reach in tiles */
  fibers?: number
  reach?: number
  /** wander area [x0,y0,x1,y1]; omit to stay */
  roam?: [number, number, number, number]
  /** patrol path instead of roaming */
  patrol?: Vec2[]
  speed?: number
  /** 'listener' crouches and slows rain; 'crawler' moves on all fours; 'wall' clings to walls; 'humanoid'; 'samael' */
  form?: 'crawler' | 'humanoid' | 'wall' | 'listener' | 'watcher' | 'samael'
}

export interface ActorDef {
  id: string
  /** Cast member id from content/characters.ts */
  character: string
  at: Vec2
  /** Facing in degrees: 0 = towards the camera (down-right on screen), 90 = right, 180 = away, 270 = left */
  facing?: number
  name?: L
  pose?: Pose
  /** Interacting with the actor runs this script */
  talk?: Script
  label?: L
  /** Idle behaviour */
  behavior?: 'idle' | 'wander' | 'look'
  wanderRadius?: number
  guard?: GuardSpec
  phantom?: PhantomSpec
  hidden?: boolean
  /** Blocks movement (default true for characters) */
  solid?: boolean
  scale?: number
}

export interface InteractableDef {
  id: string
  at: Vec2
  label: L
  verb?: 'look' | 'talk' | 'use' | 'take' | 'open' | 'heal' | 'read' | 'pray' | 'cast'
  /** Interaction distance in tiles (default 1.5) */
  radius?: number
  when?: (g: GameAPI) => boolean
  /** Remove after the first successful run (default false) */
  once?: boolean
  run: Script
  /** Optional visual placed at the cell */
  prop?: PropSpec
  /** Glow marker to draw attention (default true) */
  marker?: boolean
}

export interface TriggerDef {
  id: string
  /** Inclusive grid rectangle [x0, y0, x1, y1] */
  area: [number, number, number, number]
  when?: (g: GameAPI) => boolean
  /** Default true */
  once?: boolean
  run: Script
}

export interface ExitDef {
  /** Inclusive grid rectangle */
  area: [number, number, number, number]
  to: string
  spawn?: string
  label?: L
  when?: (g: GameAPI) => boolean
  /** Text shown when `when` is false and the player steps on it */
  blocked?: L
}

export interface SceneDef {
  id: string
  /** Location name shown when entering */
  name: L
  map: MapDef
  ambience: AmbienceDef
  player: {
    character: string
    at: Vec2
    facing?: number
    /** override the chapter's abilities for this scene (e.g. a different point of view) */
    abilities?: AbilityId[]
  }
  /** Named spawn points used by exits and g.goto(scene, spawn) */
  spawns?: Record<string, Vec2>
  actors?: ActorDef[]
  props?: PlacedProp[]
  interactables?: InteractableDef[]
  triggers?: TriggerDef[]
  exits?: ExitDef[]
  /** Sai clock: period in seconds for a full light->heavy->light cycle, or a fixed phase */
  sai?: { cycle?: number; phase?: 'light' | 'heavy' | 'neutral' }
  /** Stealth: what happens when the player is caught (default: retry from checkpoint) */
  stealth?: { failText?: L; onCaught?: Script }
  camera?: { zoom?: number; viewHeight?: number }
  /** Painted scene plate: the image is the scene, the map is an invisible walk grid (see engine/plate/plateMath.ts) */
  plate?: PlateDef
  /** Runs on every scene load (also after loading a save). Guard one-time content with g.once(). */
  onEnter?: Script
  /** Called every frame while the scene is active and no script blocks the game */
  onUpdate?: (g: GameAPI, dt: number) => void
}

export interface ChapterDef {
  id: string
  /** Order in the game, 0 = prologue */
  index: number
  title: L
  subtitle: L
  /** Point-of-view character id */
  pov: string
  epigraph?: { text: L; source: L }
  scenes: SceneDef[]
  /** First scene id */
  start: string
  /** Abilities the point-of-view character has when the chapter starts */
  abilities?: AbilityId[]
  /** Flags set when the chapter is started from chapter select (story state so far) */
  flags?: Record<string, boolean | number | string>
  /** Codex entries introduced by this chapter (merged into the game's codex) */
  codex?: CodexEntry[]
  /** Not part of the story (dev showcase scenes); its scenes still load with ?scene= */
  hidden?: boolean
}

export interface CodexEntry {
  id: string
  category: 'book' | 'world' | 'people' | 'glossary' | 'calendar'
  title: L
  body: L
  /** Optional ordering inside the category */
  order?: number
}
