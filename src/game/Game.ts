import * as THREE from 'three'
import type { ActorDef, ChapterDef, CodexEntry, InteractableDef, SceneDef, Vec2 } from '../content/types'
import { CAST } from '../content/characters'
import { CODEX, resolveCodexId } from '../content/codex'
import { Renderer } from '../engine/Renderer'
import { CameraRig } from '../engine/CameraRig'
import { Input } from '../engine/Input'
import { World } from '../engine/World'
import { audio } from '../engine/audio/Audio'
import '../engine/props'
import { GameUI, type Speaker } from '../ui/GameUI'
import { t, l, setLang, type L } from '../i18n/i18n'
import { Actor, facingToYaw } from './Actor'
import { Director } from './Director'
import { SaiClock } from './SaiClock'
import { ABILITIES, SpiraState } from './Spira'
import { Stealth } from './Stealth'
import { Portraits } from './Portraits'
import { GameState, loadProfile, saveProfile, type Profile, type SaveData } from './State'
import { SaveStore, type SlotId } from './Save'
import { loadSettings, saveSettings, type Settings } from './Settings'
import type { AbilityId, ChoiceOption, SayOpts } from './GameAPI'
import type { MenuHost } from '../ui/menus/MenuHost'
import { TitleScreen } from '../ui/menus/TitleScreen'
import { PauseMenu } from '../ui/menus/PauseMenu'
import { SettingsMenu } from '../ui/menus/SettingsMenu'
import { SaveLoadMenu } from '../ui/menus/SaveLoadMenu'
import { CodexScreen } from '../ui/menus/CodexScreen'
import { CreditsScreen } from '../ui/menus/CreditsScreen'
import { ChapterSelect } from '../ui/menus/ChapterSelect'
import { loadPlateTexture } from '../engine/plate/PlateLayer'
import { preloadSprites } from '../engine/characters/SpriteCharacter'
import { SPRITES } from '../content/sprites'
import { openReader, anyLayerOpen, syncRootSettings } from '../ui/menus/Reader'
import { UI } from './strings'

export const VERSION = 'v0.2.0'

interface ChapterModule {
  default?: ChapterDef
  chapter?: ChapterDef
}

function loadChapters(): ChapterDef[] {
  const mods = import.meta.glob<ChapterModule>('../content/chapters/*/index.ts', { eager: true })
  return Object.values(mods)
    .map((m) => m.default ?? m.chapter)
    .filter((c): c is ChapterDef => !!c)
    .filter((c) => !(import.meta.env.VITE_PROCEDURAL && c.hidden))
    .sort((a, b) => a.index - b.index)
}

type Mode = 'title' | 'play' | 'loading' | 'ending'

export class Game implements MenuHost {
  readonly renderer: Renderer
  readonly rig = new CameraRig()
  readonly input: Input
  readonly ui: GameUI
  readonly audio = audio
  readonly portraits: Portraits
  readonly director: Director
  settings: Settings
  readonly saves = new SaveStore()
  profile: Profile
  readonly state = new GameState()
  readonly chapters: ChapterDef[]
  readonly codexEntries: CodexEntry[]
  private sceneIndex = new Map<string, { chapter: ChapterDef; scene: SceneDef }>()
  world: World | null = null
  sceneDef: SceneDef | null = null
  chapter: ChapterDef | null = null
  readonly actors = new Map<string, Actor>()
  /** actors that follow the player (g.companion) */
  readonly companions = new Set<string>()
  private companionTimer = 0
  player: Actor | null = null
  readonly sai = new SaiClock()
  readonly spira = new SpiraState()
  stealth: Stealth | null = null
  mode: Mode = 'title'
  paused = false
  minigameActive = false
  dialogueBusy = false
  private cardOpen = false
  private checkpointData: SaveData | null = null
  private pendingInteract: (() => void) | null = null
  private exitLatch = new Set<number>()
  private triggered = new Set<string>()
  private doneInteractables = new Set<string>()
  private last = performance.now()
  private veilFx = 0
  private castFrom: { x: number; y: number } | null = null
  private frozen: { cells: Vec2[]; until: number; meshes: THREE.Mesh[] }[] = []
  readonly version = VERSION
  readonly canExit = !!(window as Window & { electronAPI?: { quit(): void } }).electronAPI
  private menus: {
    title: TitleScreen
    pause: PauseMenu
    settings: SettingsMenu
    saveLoad: SaveLoadMenu
    codex: CodexScreen
    credits: CreditsScreen
    chapters: ChapterSelect
  }

  constructor(container: HTMLElement) {
    this.settings = loadSettings()
    this.profile = loadProfile()
    setLang(this.settings.lang)
    this.renderer = new Renderer(container)
    this.input = new Input(this.renderer.canvas)
    this.ui = new GameUI(document.body)
    this.portraits = new Portraits(this.renderer.renderer)
    this.director = new Director(this)
    const all = loadChapters()
    this.chapters = all.filter((c) => !c.hidden)
    // review build: every chapter (finished or not) is selectable
    if (import.meta.env.VITE_UNLOCK_ALL) for (const c of this.chapters) if (!this.profile.chapters.includes(c.id)) this.profile.chapters.push(c.id)
    const extra = this.chapters.flatMap((c) => c.codex ?? [])
    this.codexEntries = [...CODEX, ...extra]
    for (const ch of all) for (const sc of ch.scenes) this.sceneIndex.set(sc.id, { chapter: ch, scene: sc })
    this.menus = {
      title: new TitleScreen(this),
      pause: new PauseMenu(this),
      settings: new SettingsMenu(this),
      saveLoad: new SaveLoadMenu(this),
      codex: new CodexScreen(this),
      credits: new CreditsScreen(this),
      chapters: new ChapterSelect(this),
    }
    this.applySettings(this.settings)
    const unlockAudio = () => this.audio.unlock()
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
    window.addEventListener('keydown', (e) => this.onGlobalKey(e))
    requestAnimationFrame((n) => this.frame(n))
  }

  // ======================================================================== MenuHost
  applySettings(next: Settings): void {
    this.settings = next
    saveSettings(next)
    setLang(next.lang)
    this.input.bindings = next.bindings
    this.audio.setVolumes(next.music, next.sfx, next.ambience)
    this.renderer.setQuality(next.quality)
    this.renderer.setOutlines(next.outlines)
    syncRootSettings(next)
    this.ui.setLabels(t(UI.objective), t(UI.veil), t(UI.strain))
    if (this.state.objective) this.ui.setObjective(t(this.state.objective), false)
    this.refreshAbilities()
  }

  canSave(): boolean {
    return this.mode === 'play' && !!this.world && !this.director.locked && !this.minigameActive && !this.dialogueBusy && (this.stealth?.level ?? 0) < 0.05
  }

  async saveTo(slot: SlotId): Promise<boolean> {
    if (!this.canSave() && slot !== 'auto') return false
    const thumb = await this.renderer.captureNextFrame()
    return this.saves.write(slot, this.snapshot(thumb))
  }

  async loadFrom(slot: SlotId): Promise<void> {
    const data = this.saves.read(slot)
    if (!data) return
    this.closeAllMenus()
    await this.ui.fade('black', 500)
    this.state.fromSave(data)
    this.checkpointData = data
    const entry = this.sceneIndex.get(data.sceneId)
    if (!entry) {
      console.warn('[save] unknown scene', data.sceneId)
      await this.showTitle()
      return
    }
    this.chapter = entry.chapter
    await this.loadScene(data.sceneId, { save: data })
  }

  async newGame(): Promise<void> {
    this.closeAllMenus()
    this.state.reset()
    if (!this.chapters.length) return
    await this.playChapter(this.chapters[0])
  }

  async continueGame(): Promise<void> {
    const latest = this.saves.latest()
    if (latest) await this.loadFrom(latest.slot)
  }

  async startChapter(id: string): Promise<void> {
    const ch = this.chapters.find((c) => c.id === id)
    if (!ch) return
    this.closeAllMenus()
    this.state.reset()
    Object.assign(this.state.flags, ch.flags ?? {})
    await this.playChapter(ch)
  }

  async quitToTitle(): Promise<void> {
    this.closeAllMenus()
    await this.ui.fade('black', 500)
    await this.showTitle()
  }

  resume(): void {
    this.menus.pause.close()
    this.paused = false
  }

  exitApp(): void {
    const api = (window as Window & { electronAPI?: { quit(): void } }).electronAPI
    if (api) api.quit()
    else window.close()
  }

  sfx(id: string): void {
    this.audio.sfx(id)
  }

  chapterLabel(id: string): L {
    const ch = this.chapters.find((c) => c.id === id)
    if (!ch) return l(id, id)
    return { sk: `${ch.title.sk} · ${ch.subtitle.sk}`, en: `${ch.title.en} · ${ch.subtitle.en}` }
  }

  // ======================================================================== flow
  async boot(): Promise<void> {
    const params = new URLSearchParams(location.search)
    const scene = params.get('scene')
    const chapter = params.get('chapter')
    if (scene && this.sceneIndex.has(scene)) {
      const entry = this.sceneIndex.get(scene)!
      this.chapter = entry.chapter
      this.state.reset()
      Object.assign(this.state.flags, entry.chapter.flags ?? {})
      this.state.chapterId = entry.chapter.id
      this.applyChapterAbilities(entry.chapter)
      await this.loadScene(scene, { spawn: params.get('spawn') ?? undefined })
      return
    }
    if (chapter) {
      await this.startChapter(chapter)
      return
    }
    await this.showTitle()
  }

  async showTitle(): Promise<void> {
    this.mode = 'title'
    this.unloadScene()
    this.ui.setObjective(null)
    this.ui.setAbilities([])
    this.ui.setSai(false)
    this.ui.dialogue.hide()
    this.ui.hint(null)
    this.ui.setLetterbox(false)
    this.audio.setAmbience([])
    this.audio.playMusic('main_menu')
    this.menus.title.open()
    await this.ui.fade('clear', 800)
  }

  private closeAllMenus(): void {
    this.menus.title.close()
    this.menus.pause.close()
    this.menus.settings.close()
    this.menus.saveLoad.close()
    this.menus.codex.close()
    this.menus.chapters.close()
    this.paused = false
  }

  private applyChapterAbilities(ch: ChapterDef): void {
    this.state.abilities.clear()
    for (const a of ch.abilities ?? []) this.state.abilities.add(a)
  }

  async playChapter(ch: ChapterDef): Promise<void> {
    this.mode = 'loading'
    this.chapter = ch
    this.state.chapterId = ch.id
    this.applyChapterAbilities(ch)
    if (!this.profile.chapters.includes(ch.id)) {
      this.profile.chapters.push(ch.id)
      saveProfile(this.profile)
    }
    this.ui.setFadeInstant(1)
    this.unloadScene()
    this.audio.playMusic(null, 1200)
    this.cardOpen = true
    const num = ch.index === 0 ? t(UI.prologue) : t(ch.title)
    await this.ui.chapterCard(num, t(ch.index === 0 ? ch.subtitle : ch.subtitle), ch.epigraph ? t(ch.epigraph.text) : null, ch.epigraph ? t(ch.epigraph.source) : null, t(UI.skip))
    this.cardOpen = false
    await this.loadScene(ch.start)
  }

  async completeChapter(): Promise<void> {
    const ch = this.chapter
    if (!ch) return
    await this.ui.fade('black', 1200)
    const next = this.chapters.find((c) => c.index > ch.index)
    if (next) {
      // carry the story state into the next chapter
      await this.playChapter(next)
    } else {
      this.mode = 'ending'
      this.profile.finished = true
      saveProfile(this.profile)
      this.unloadScene()
      this.audio.playMusic('space_theme', 2000)
      await new Promise<void>((resolve) => this.menus.credits.open({ ending: true }, resolve))
      this.saves.remove('auto')
      await this.showTitle()
    }
  }

  async gotoScene(id: string, spawn?: string): Promise<void> {
    await this.ui.fade('black', 450)
    await this.loadScene(id, { spawn })
  }

  // ======================================================================== scenes
  private unloadScene(): void {
    this.director.newEpoch()
    for (const a of this.actors.values()) a.release()
    this.actors.clear()
    this.companions.clear()
    this.player?.release()
    this.player = null
    this.stealth?.dispose()
    this.stealth = null
    this.frozen = []
    this.world?.dispose()
    this.world = null
    this.sceneDef = null
    this.renderer.gradeSettings.veil = 0
    this.renderer.gradeSettings.frost = 0
    this.renderer.gradeSettings.aberration = 0
  }

  async loadScene(id: string, opts: { spawn?: string; save?: SaveData } = {}): Promise<void> {
    const entry = this.sceneIndex.get(id)
    if (!entry) {
      console.error(`[game] unknown scene '${id}'`)
      return
    }
    this.mode = 'loading'
    this.ui.setFadeInstant(1)
    this.unloadScene()
    const def = entry.scene
    this.chapter = entry.chapter
    this.sceneDef = def
    this.state.sceneId = id
    this.state.chapterId = entry.chapter.id
    this.triggered.clear()
    this.doneInteractables.clear()
    this.exitLatch.clear()
    this.spira.strain = 0
    this.spira.veilActive = false
    this.spira.concentration = 1
    this.spira.casting = null
    if (def.player.abilities) {
      this.state.abilities.clear()
      def.player.abilities.forEach((a) => this.state.abilities.add(a))
    }
    let plateTex: THREE.Texture | undefined
    if (def.plate) {
      const sprites = new Set<string>()
      for (const c of [def.player.character, ...(def.actors ?? []).map((a) => a.character)]) if (SPRITES[c]) sprites.add(SPRITES[c])
      const [tex] = await Promise.all([loadPlateTexture(def.plate).catch(() => undefined), preloadSprites([...sprites])])
      plateTex = tex
    }
    const world = new World(def, this.renderer, this.rig, plateTex)
    this.world = world
    this.rig.setViewHeight(def.camera?.viewHeight ?? (world.plate ? 9 : 12.5))
    if (world.plate) {
      const f = world.plate.frame
      this.rig.setPlate(new THREE.Vector3(f.cx, 0, f.cz), f.W, f.H)
      this.rig.setBounds(-1e4, -1e4, 1e4, 1e4)
    } else {
      this.rig.setPlate(null)
      this.rig.setBounds(-2, -2, world.grid.width + 1, world.grid.height + 1)
    }
    this.rig.setZoom(def.camera?.zoom ?? 1, true)
    // player
    let start: Vec2 = def.player.at
    let facing = def.player.facing ?? 0
    if (opts.spawn && def.spawns?.[opts.spawn]) start = def.spawns[opts.spawn]
    if (opts.save?.player) start = [opts.save.player.x, opts.save.player.y]
    const pdef: ActorDef = { id: 'player', character: def.player.character, at: start, facing }
    this.player = new Actor('player', pdef, world, true)
    if (opts.save?.player) {
      facing = 0
      this.player.faceYaw(opts.save.player.facing, true)
    }
    this.player.onStep = () => this.audio.step()
    // actors
    this.stealth = new Stealth({
      world,
      player: this.player,
      veiled: () => this.spira.veilActive,
      running: () => this.input.isDown('run') && !!this.player?.moving,
      forgiving: () => this.settings.assistStealth,
      blindCheck: (a) => !!a.def.guard?.blindWhen?.(this.director.api(this.director.epoch)),
    })
    this.stealth.onCaught = () => void this.onCaught()
    for (const adef of def.actors ?? []) this.spawnActor(adef)
    this.stealth.armed = this.stealth.hasThreats
    // interactable markers
    for (const it of def.interactables ?? []) {
      if (it.prop) world.placeProp({ ...it.prop, at: it.at })
      if (it.marker !== false) world.addMarker(it.id, it.at, it.prop ? 1.9 : 1.3)
    }
    // camera, sound, systems
    this.rig.followTarget(() => (this.player ? this.player.worldPos().add(new THREE.Vector3(0, 0.6, 0)) : null))
    this.rig.snapTo(this.player.worldPos().add(new THREE.Vector3(0, 0.6, 0)))
    this.audio.playMusic(def.ambience.music ?? null)
    this.audio.setAmbience(def.ambience.sounds ?? [])
    this.sai.configure(def.sai)
    this.refreshAbilities()
    this.ui.setObjective(this.state.objective ? t(this.state.objective) : null, false)
    this.ui.setLetterbox(false)
    this.ui.setHudVisible(true)
    this.ui.hint(null)
    this.mode = 'play'
    // first frame then checkpoint (with thumbnail) and fade in
    await new Promise((r) => requestAnimationFrame(r))
    if (!opts.save) this.checkpoint()
    void this.ui.fade('clear', 700)
    this.ui.showLocation(t(def.name))
    void this.director.run(def.onEnter, true)
  }

  spawnActor(def: ActorDef): Actor | null {
    if (!this.world) return null
    if (this.actors.has(def.id)) this.despawnActor(def.id)
    const a = new Actor(def.id, def, this.world)
    this.actors.set(def.id, a)
    if (def.guard || def.phantom || a.phantom) {
      this.stealth?.register(a)
      if (this.stealth) this.stealth.armed = true
    }
    return a
  }

  despawnActor(id: string): void {
    const a = this.actors.get(id)
    if (!a) return
    this.stealth?.unregister(a)
    a.release()
    this.actors.delete(id)
  }

  setStealth(on: boolean): void {
    if (this.stealth) {
      this.stealth.armed = on
      if (!on) this.stealth.reset()
    }
  }

  checkpoint(): void {
    if (!this.world || !this.player) return
    this.checkpointData = this.snapshot()
    void this.renderer.captureNextFrame().then((thumb) => {
      if (this.checkpointData) this.saves.write('auto', { ...this.checkpointData, thumb })
    })
  }

  private snapshot(thumb?: string): SaveData {
    const p = this.player
    return this.state.toSave({
      player: p ? { x: Math.round(p.x), y: Math.round(p.y), facing: p.yaw } : undefined,
      thumb,
      chapterTitle: this.chapter ? this.chapterLabel(this.chapter.id) : undefined,
      sceneName: this.sceneDef?.name,
    })
  }

  private async onCaught(): Promise<void> {
    const def = this.sceneDef
    if (def?.stealth?.onCaught) {
      await this.director.run(def.stealth.onCaught, true)
      return
    }
    await this.failAndRetry(def?.stealth?.failText)
  }

  async failAndRetry(text?: L): Promise<void> {
    if (this.mode !== 'play') return
    this.mode = 'loading'
    this.audio.sfx('fail')
    this.ui.dialogue.hide()
    await this.ui.caption(t(text ?? UI.caught), null, 1600)
    await this.ui.fade('black', 500)
    const cp = this.checkpointData
    if (cp) {
      this.state.fromSave(cp)
      await this.loadScene(cp.sceneId, { save: cp })
    } else if (this.sceneDef) await this.loadScene(this.sceneDef.id)
  }

  // ======================================================================== dialogue
  private speaker(who: string | null, mood?: SayOpts['mood'], portrait = true): Speaker | null {
    if (!who) return null
    const actor = who === 'player' ? this.player : this.actors.get(who)
    const castId = actor?.castId ?? who
    const cast = CAST[castId]
    const name = actor ? t(actor.name) : cast ? t(cast.name) : who
    return { name, color: cast?.color, portrait: portrait ? this.portraits.get(castId, mood ?? 'neutral') : null }
  }

  async say(who: string | null, text: L, opts: SayOpts): Promise<void> {
    this.dialogueBusy = true
    const actor = who ? (who === 'player' ? this.player : this.actors.get(who)) : null
    if (actor && opts.mood) actor.setMood(opts.mood)
    const sp = this.speaker(who, opts.mood, opts.portrait !== false)
    try {
      await this.ui.dialogue.say(sp, t(text), {
        textSpeed: this.settings.textSpeed,
        autoAdvance: this.settings.autoAdvance,
        narration: !who,
        thought: opts.thought,
        auto: opts.auto,
        onType: () => this.audio.sfx('text', 0.6),
        onTalk: (on) => actor?.setTalking(on && !opts.thought),
      })
    } finally {
      actor?.setTalking(false)
      this.dialogueBusy = false
    }
  }

  async choose(options: ChoiceOption[], prompt?: L): Promise<string> {
    this.dialogueBusy = true
    const sp = this.player ? this.speaker('player') : null
    try {
      return await this.ui.dialogue.choose(
        sp,
        prompt ? t(prompt) : null,
        options.map((o) => ({ id: o.id, text: t(o.text) })),
        () => this.audio.sfx('tick', 0.5),
      )
    } finally {
      this.dialogueBusy = false
    }
  }

  async read(title: L, body: L, style?: 'book' | 'letter' | 'stone' | 'cipher'): Promise<void> {
    this.audio.sfx('page')
    this.dialogueBusy = true
    try {
      await openReader({ title, body, style, t })
    } finally {
      this.dialogueBusy = false
    }
  }

  unlockCodex(rawId: string): void {
    const id = resolveCodexId(rawId)
    if (this.state.codex.has(id)) return
    this.state.codex.add(id)
    if (!this.profile.codex.includes(id)) {
      this.profile.codex.push(id)
      saveProfile(this.profile)
    }
    const entry = this.codexEntries.find((e) => e.id === id)
    if (entry) this.ui.toast(t(UI.codexNew, { title: t(entry.title) }))
  }

  unlockAbility(id: AbilityId): void {
    if (this.state.abilities.has(id)) return
    this.state.abilities.add(id)
    this.refreshAbilities()
    const def = ABILITIES[id]
    const key = id === 'veil' ? this.input.label('veil') : ''
    this.ui.toast(t(UI.abilityNew, { name: t(def.name) }) + (key ? ` (${key})` : ''))
    this.audio.sfx('glyph')
  }

  /** Active abilities mapped to hotkeys 1..3 (veil has its own key). */
  private slotAbilities(): AbilityId[] {
    const order: AbilityId[] = ['ice', 'fire', 'slow', 'push', 'shield', 'air']
    return order.filter((a) => this.state.abilities.has(a)).slice(0, 3)
  }

  private refreshAbilities(): void {
    const slots = []
    if (this.state.abilities.has('veil')) slots.push({ id: 'veil', icon: ABILITIES.veil.icon, key: this.input.label('veil'), color: ABILITIES.veil.color })
    const keys: ('ability1' | 'ability2' | 'ability3')[] = ['ability1', 'ability2', 'ability3']
    this.slotAbilities().forEach((a, i) => slots.push({ id: a, icon: ABILITIES[a].icon, key: this.input.label(keys[i]), color: ABILITIES[a].color }))
    this.ui.setAbilities(slots)
  }

  // ======================================================================== effects
  effect(kind: string, pos: THREE.Vector3, opts: { color?: string; scale?: number; ms?: number } = {}): void {
    const w = this.world
    if (!w) return
    const at = pos.clone()
    switch (kind) {
      case 'glyph':
        w.glyph(at, opts.color ?? '#5ff2e0', { scale: opts.scale ?? 2.2, ms: opts.ms })
        w.particles.burst('motes', at.clone().add(new THREE.Vector3(0, 0.4, 0)), { color: opts.color ?? '#5ff2e0', count: 40, speed: 1.2, up: 1.2 })
        this.audio.sfx('glyph')
        break
      case 'burst':
        w.particles.burst('motes', at.clone().add(new THREE.Vector3(0, 0.8, 0)), { color: opts.color ?? '#ffe6b0', count: 80, speed: 3, up: 2 })
        break
      case 'frost':
        w.glyph(at, '#cfe8ff', { scale: opts.scale ?? 2.6, ms: opts.ms ?? 1800 })
        w.particles.burst('snow', at.clone().add(new THREE.Vector3(0, 0.6, 0)), { count: 90, speed: 2.4, up: 1.4 })
        this.audio.sfx('ice')
        break
      case 'fire':
        w.particles.burst('embers', at.clone().add(new THREE.Vector3(0, 0.5, 0)), { count: 90, speed: 2.8, up: 2.4, color: opts.color ?? '#ff8a3a' })
        w.ring(at, '#ff8a3a', opts.scale ?? 3, 700)
        this.audio.sfx('fire')
        break
      case 'dust':
        w.particles.burst('blackdust', at.clone().add(new THREE.Vector3(0, 0.6, 0)), { count: 120, speed: 2, up: 1 })
        break
      case 'heal':
        w.glyph(at, '#5ff2e0', { scale: 1.6, ms: 1400 })
        w.particles.burst('spores', at.clone().add(new THREE.Vector3(0, 0.3, 0)), { count: 50, speed: 0.8, up: 1.6 })
        this.audio.sfx('water')
        break
      case 'sora':
        w.glyph(at, '#b77dff', { scale: opts.scale ?? 3.5, ms: opts.ms ?? 1800 })
        w.ring(at, '#d8b0ff', (opts.scale ?? 3.5) * 2, 1100)
        w.particles.burst('motes', at.clone().add(new THREE.Vector3(0, 0.8, 0)), { color: '#b77dff', count: 140, speed: 4, up: 2 })
        this.audio.sfx('veil')
        break
      case 'shockwave':
        w.ring(at, opts.color ?? '#ffffff', opts.scale ?? 5, opts.ms ?? 800)
        if (this.settings.screenShake) this.rig.shake(0.3, 400)
        this.audio.sfx('boom', 0.6)
        break
      case 'lightning':
        this.ui.flash(opts.color ?? '#c8d8ff', 300)
        this.audio.sfx('crack')
        break
    }
  }

  /** Anchor for barks and emotes above an actor's head. */
  anchor(a: Actor): { x: number; y: number; visible: boolean } | null {
    if (!a.visible && a !== this.player) return null
    return this.rig.toScreen(a.headWorld())
  }

  // ======================================================================== input & player
  private onGlobalKey(e: KeyboardEvent): void {
    if (e.code !== 'Escape') return
    if (this.mode !== 'play' || this.minigameActive || this.cardOpen) return
    if (this.menus.pause.isOpen) {
      this.resume()
      return
    }
    if (this.dialogueBusy) return
    this.paused = true
    this.menus.pause.open()
  }

  private interactables(): { def: InteractableDef; pos: THREE.Vector3 }[] {
    const def = this.sceneDef
    const w = this.world
    if (!def || !w) return []
    const api = this.director.api(this.director.epoch)
    return (def.interactables ?? [])
      .filter((it) => !this.doneInteractables.has(it.id) && (!it.when || it.when(api)))
      .map((it) => ({ def: it, pos: w.worldPos(it.at[0], it.at[1]) }))
  }

  private updatePlayer(dt: number): void {
    const p = this.player
    const w = this.world
    if (!p || !w) return
    const controllable = !this.director.locked && !this.dialogueBusy && !this.minigameActive && !this.paused && !anyLayerOpen() && this.spira.collapse <= 0
    let speedNow = 0
    if (controllable) {
      const mv = this.input.moveVector()
      const casting = !!this.spira.casting
      if ((mv.x || mv.y) && !casting) {
        this.pendingInteract = null
        if (p.moving) p.stop()
        const up = this.rig.screenUp
        const right = this.rig.screenRight
        const vx = right.x * mv.x + up.x * mv.y
        const vz = right.z * mv.x + up.z * mv.y
        const len = Math.hypot(vx, vz) || 1
        const run = this.input.isDown('run')
        const speed = (run ? 4.7 : 2.9) * this.sai.speedFactor * Math.min(1, Math.hypot(mv.x, mv.y))
        p.running = run
        const d = p.move((vx / len) * speed, (vz / len) * speed, dt, (fx, fy, tx, ty) => (fx === tx && fy === ty) || w.grid.canStep(fx, fy, tx, ty))
        speedNow = Math.hypot(d.dx, d.dy) / Math.max(dt, 1e-4)
      }
      // click to move / interact
      if (this.input.clicked && !casting) this.onWorldClick()
      // interaction prompt
      this.updateInteraction()
      // abilities
      this.updateAbilities(dt)
    } else {
      this.ui.hidePrompt()
      for (const m of w.markers.values()) m.active = false
    }
    if (this.spira.casting) speedNow = 0
    p.update(dt, speedNow)
  }

  private onWorldClick(): void {
    const p = this.player!
    const w = this.world!
    const api = this.director.api(this.director.epoch)
    // actors with talk scripts
    const roots = [...this.actors.values()].filter((a) => a.visible && a.def.talk).map((a) => a.root)
    const hitObj = w.pickObject(this.input.ndcX, this.input.ndcY, roots)
    let target: { cell: Vec2; run: () => void } | null = null
    if (hitObj) {
      let o: THREE.Object3D | null = hitObj
      while (o && !o.userData.actorId) o = o.parent
      const a = o ? this.actors.get(o.userData.actorId as string) : null
      if (a?.def.talk) target = { cell: a.cell(), run: () => this.startTalk(a) }
    }
    const cell = w.pickCell(this.input.ndcX, this.input.ndcY)
    if (!target && cell) {
      const it = this.interactables().find((i) => Math.abs(i.def.at[0] - cell[0]) <= 0 && Math.abs(i.def.at[1] - cell[1]) <= 0)
      if (it) target = { cell: it.def.at, run: () => void this.runInteractable(it.def) }
    }
    const goal = target ? target.cell : cell
    if (!goal) return
    const path = w.grid.findPath(p.cell(), goal)
    if (!path) return
    this.audio.sfx('click', 0.3)
    w.glyph(w.worldPos(goal[0], goal[1]), '#d6b26a', { scale: 0.7, ms: 500 })
    if (target) {
      // stop next to the target
      const trimmed = path.length > 1 ? path.slice(0, -1) : []
      const run = target.run
      const dist = Math.hypot(p.x - goal[0], p.y - goal[1])
      if (dist <= 1.6) {
        run()
        return
      }
      this.pendingInteract = run
      void p.follow(trimmed, 2.9 * this.sai.speedFactor).then(() => {
        if (this.pendingInteract === run) {
          this.pendingInteract = null
          p.facePoint(goal[0], goal[1])
          run()
        }
      })
    } else {
      this.pendingInteract = null
      void p.follow(path, (this.input.isDown('run') ? 4.7 : 2.9) * this.sai.speedFactor, this.input.isDown('run'))
    }
    void api
  }

  private startTalk(a: Actor): void {
    const p = this.player
    if (!p || !a.def.talk) return
    p.facePoint(a.x, a.y)
    a.facePoint(p.x, p.y)
    a.lookAt(p.headWorld())
    p.lookAt(a.headWorld())
    void this.director.run(a.def.talk, true).then(() => {
      a.lookAt(null)
      p.lookAt(null)
    })
  }

  private async runInteractable(it: InteractableDef): Promise<void> {
    const p = this.player
    if (p) p.facePoint(it.at[0], it.at[1])
    this.audio.sfx('click', 0.4)
    if (it.once) {
      this.doneInteractables.add(it.id)
      this.world?.removeMarker(it.id)
    }
    await this.director.run(it.run, true)
  }

  private updateInteraction(): void {
    const p = this.player!
    const w = this.world!
    let best: { dist: number; label: string; pos: THREE.Vector3; run: () => void; marker?: string } | null = null
    for (const it of this.interactables()) {
      const d = Math.hypot(p.x - it.def.at[0], p.y - it.def.at[1])
      const r = it.def.radius ?? 1.5
      if (d <= r && (!best || d < best.dist)) best = { dist: d, label: t(it.def.label), pos: it.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), run: () => void this.runInteractable(it.def), marker: it.def.id }
    }
    for (const a of this.actors.values()) {
      if (!a.visible || !a.def.talk) continue
      const d = Math.hypot(p.x - a.x, p.y - a.y)
      if (d <= 1.7 && (!best || d < best.dist)) best = { dist: d, label: t(a.def.label ?? UI.talk) + ' · ' + t(a.name), pos: a.headWorld(), run: () => this.startTalk(a) }
    }
    for (const m of w.markers.values()) m.active = best?.marker === m.id
    if (best) {
      const s = this.rig.toScreen(best.pos)
      this.ui.showPrompt(s.x, s.y - 8, this.input.label('interact'), best.label)
      if (this.input.wasPressed('interact')) {
        this.input.consume('interact')
        this.ui.hidePrompt()
        best.run()
      }
    } else this.ui.hidePrompt()
  }

  // ------------------------------------------------------------------------ Spira casting
  private updateAbilities(dt: number): void {
    const p = this.player!
    const casting = this.spira.casting
    const raw = this.input.isDown('raw')
    if (casting) {
      const def = ABILITIES[casting.id]
      casting.t += dt
      const moved = this.castFrom && Math.hypot(p.x - this.castFrom.x, p.y - this.castFrom.y) > 0.2
      const lines = def.haiku.slice(0, Math.max(1, Math.ceil((casting.t / def.castTime) * def.haiku.length)))
      this.ui.showCast(lines, def.meaning.map((m) => t(m)).slice(0, lines.length).join(' '), def.color)
      if (moved) {
        this.spira.casting = null
        this.ui.hideCast()
        p.animator?.setGlyph(0.6)
        p.setPose('stand')
      } else if (casting.t >= def.castTime) {
        this.spira.casting = null
        this.ui.hideCast()
        this.finishCast(casting.id, false)
      }
      return
    }
    const start = (id: AbilityId) => {
      if (!this.state.abilities.has(id)) return
      if (id === 'veil' && this.spira.veilActive) {
        this.spira.veilActive = false
        this.audio.sfx('close', 0.5)
        return
      }
      if (raw) {
        this.finishCast(id, true)
        return
      }
      this.spira.casting = { id, t: 0 }
      this.castFrom = { x: p.x, y: p.y }
      p.setPose('cast')
      p.animator?.setGlyph(2.2)
      this.audio.sfx('open', 0.4)
    }
    if (this.input.wasPressed('veil')) start('veil')
    const slots = this.slotAbilities()
    if (this.input.wasPressed('ability1') && slots[0]) start(slots[0])
    if (this.input.wasPressed('ability2') && slots[1]) start(slots[1])
    if (this.input.wasPressed('ability3') && slots[2]) start(slots[2])
  }

  private finishCast(id: AbilityId, raw: boolean): void {
    const p = this.player!
    const w = this.world!
    const def = ABILITIES[id]
    this.spira.strain += raw ? def.rawStrain : def.safeStrain
    p.setPose('stand')
    p.animator?.setGlyph(raw ? 3 : 1.8)
    setTimeout(() => p.animator?.setGlyph(0.6), 900)
    const fx = Math.sin(p.yaw)
    const fz = Math.cos(p.yaw)
    const at: Vec2 = [Math.round(p.x + fx * 1.6), Math.round(p.y + fz * 1.6)]
    const atWorld = w.worldPos(at[0], at[1])
    if (raw) this.ui.flash(def.color, 260)
    switch (id) {
      case 'veil':
        this.spira.veilActive = true
        this.spira.concentration = Math.max(this.spira.concentration, raw ? 0.85 : 1)
        w.glyph(p.worldPos(), def.color, { scale: 1.8, ms: 900 })
        this.audio.sfx('veil')
        break
      case 'ice':
        this.effect('frost', atWorld, {})
        this.freezeAround(at, raw ? 2 : 1)
        break
      case 'fire':
        this.effect('fire', atWorld, {})
        break
      case 'slow':
        w.ring(p.worldPos(), def.color, 6, 1400)
        this.audio.sfx('water')
        break
      case 'push':
        w.ring(atWorld, def.color, 3, 600)
        this.audio.sfx('whoosh')
        break
      case 'shield':
        w.glyph(p.worldPos(), def.color, { scale: 1.6, ms: 1500, style: 'rune' })
        this.audio.sfx('glyph')
        break
      case 'air':
        w.ring(atWorld, def.color, 4, 600)
        this.audio.sfx('whoosh')
        break
      default:
        this.effect('glyph', atWorld, { color: def.color })
    }
    this.director.emitCast({ id, raw, at, time: this.director.time })
  }

  /** Ice over liquid cells makes them walkable for a while. */
  private freezeAround(at: Vec2, r: number): void {
    const w = this.world!
    const cells: Vec2[] = []
    const meshes: THREE.Mesh[] = []
    const mat = new THREE.MeshToonMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.85 })
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const c = w.grid.cell(at[0] + dx, at[1] + dy)
        if (!c || !c.floor || !['water', 'canal'].includes(c.floor) || c.baseWalk) continue
        c.baseWalk = true
        cells.push([c.x, c.y])
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.12, 1.02), mat)
        m.position.set(c.x, -0.08, c.y)
        m.receiveShadow = true
        w.scene.add(m)
        meshes.push(m)
      }
    if (cells.length) this.frozen.push({ cells, until: this.director.time + 30, meshes })
  }

  private updateFrozen(): void {
    const w = this.world
    if (!w) return
    this.frozen = this.frozen.filter((f) => {
      const left = f.until - this.director.time
      if (left < 4) for (const m of f.meshes) (m.material as THREE.MeshToonMaterial).opacity = Math.max(0, left / 4) * 0.85
      if (left > 0) return true
      for (const [x, y] of f.cells) {
        const c = w.grid.cell(x, y)
        if (c) c.baseWalk = false
      }
      for (const m of f.meshes) {
        w.scene.remove(m)
        m.geometry.dispose()
      }
      return false
    })
  }

  /** Companions walk after the player when she gets more than a couple of tiles away. */
  private updateCompanions(dt: number): void {
    const p = this.player
    const w = this.world
    if (!p || !w || !this.companions.size || this.director.locked) return
    this.companionTimer -= dt
    if (this.companionTimer > 0) return
    this.companionTimer = 0.4
    let i = 0
    for (const id of this.companions) {
      const a = this.actors.get(id)
      if (!a || !a.visible) continue
      i++
      const d = Math.hypot(a.x - p.x, a.y - p.y)
      if (d < 1.8 + i * 0.6) continue
      const path = w.grid.findPath(a.cell(), p.cell(), { ignoreDynamic: true })
      if (!path || path.length < 2) continue
      const stopAt = path.slice(0, Math.max(1, path.length - 1 - i))
      void a.follow(stopAt, d > 5 ? 4.4 : 2.9, d > 5)
    }
  }

  // ======================================================================== triggers & exits
  private updateTriggers(): void {
    const def = this.sceneDef
    const p = this.player
    if (!def || !p || this.director.locked || this.dialogueBusy) return
    const [px, py] = p.cell()
    const api = this.director.api(this.director.epoch)
    const inside = (a: [number, number, number, number]) => px >= a[0] && px <= a[2] && py >= a[1] && py <= a[3]
    for (const tr of def.triggers ?? []) {
      if ((tr.once ?? true) && this.triggered.has(tr.id)) continue
      if (!inside(tr.area)) continue
      if (tr.when && !tr.when(api)) continue
      this.triggered.add(tr.id)
      void this.director.run(tr.run, true)
      return
    }
    ;(def.exits ?? []).forEach((ex, i) => {
      if (!inside(ex.area)) {
        this.exitLatch.delete(i)
        return
      }
      if (this.exitLatch.has(i)) return
      this.exitLatch.add(i)
      if (ex.when && !ex.when(api)) {
        if (ex.blocked) this.ui.bark(t(ex.blocked), () => this.anchor(p), 2600)
        return
      }
      void this.gotoScene(ex.to, ex.spawn)
    })
  }

  // ======================================================================== frame
  private frame(now: number): void {
    requestAnimationFrame((n) => this.frame(n))
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.input.pollGamepad()
    const w = this.world
    if (w && this.mode !== 'title') {
      const running = this.mode === 'play' && !this.paused && !this.minigameActive
      if (running) {
        this.updatePlayer(dt)
        const res = this.spira.update(dt, { running: this.input.isDown('run'), moving: !!this.player?.moving || this.input.moveVector().x !== 0 || this.input.moveVector().y !== 0 })
        if (res.veilDropped) this.audio.sfx('close', 0.5)
        if (res.collapsed && this.player) {
          this.audio.sfx('heartbeat')
          this.ui.bark(t(UI.collapse), () => this.anchor(this.player!), 2200)
          this.player.setPose('kneel')
          setTimeout(() => this.player?.setPose('stand'), 1700)
          if (this.settings.screenShake) this.rig.shake(0.2, 500)
        }
        this.sai.update(dt)
        w.grid.leapOpen = this.sai.phase === 'light'
        this.updateCompanions(dt)
        for (const a of this.actors.values()) a.update(dt)
        this.stealth?.update(dt)
        this.updateTriggers()
        this.updateFrozen()
        this.director.tick(dt)
        if (this.sceneDef?.onUpdate && !this.director.locked) {
          try {
            this.sceneDef.onUpdate(this.director.api(this.director.epoch), dt)
          } catch (e) {
            console.error('[onUpdate]', e)
          }
        }
        this.state.playtime += dt
      } else if (this.mode === 'play' && this.minigameActive) {
        this.director.tick(0)
      }
      // visuals for the veil and strain
      const veilTarget = this.spira.veilActive ? 1 : 0
      this.veilFx += (veilTarget - this.veilFx) * Math.min(1, dt * 5)
      this.renderer.gradeSettings.veil = this.veilFx * 0.8
      this.renderer.gradeSettings.frost = Math.max(0, (this.spira.strain - 0.35) / 0.65) * 0.9
      if (this.player?.model) {
        const op = 1 - this.veilFx * 0.72
        for (const m of this.player.model.materials) {
          const mm = m as THREE.Material & { opacity: number }
          if (op < 0.999) {
            mm.transparent = true
            mm.opacity = op
            mm.depthWrite = op > 0.6
          } else if (mm.transparent && !m.userData.keepTransparent && mm.opacity < 1) {
            mm.opacity = 1
            mm.depthWrite = true
          }
        }
      }
      const focus = this.player ? this.player.worldPos() : this.rig.target
      w.update(running ? dt : 0, focus)
      this.rig.update(dt, this.settings.reducedMotion || !this.settings.screenShake)
      this.renderer.render(w.scene, this.rig.camera, now / 1000)
      // HUD
      this.ui.setMeters(this.spira.strain, this.state.abilities.has('veil') && (this.spira.veilActive || this.spira.concentration < 0.999) ? this.spira.concentration : null)
      this.ui.setAbilityActive('veil', this.spira.veilActive)
      const phase = this.sai.phase
      this.ui.setSai(this.sai.enabled && this.mode === 'play', this.sai.phase01, t(phase === 'light' ? UI.lightHour : phase === 'heavy' ? UI.heavyHour : UI.neutralHour), phase)
      this.ui.setDetection(this.stealth?.armed ? this.stealth.level : 0)
    } else {
      this.renderer.renderer.setClearColor(0x050408, 1)
      this.renderer.renderer.clear()
    }
    this.ui.updateFloating()
    this.input.endFrame()
  }
}

export { facingToYaw }
