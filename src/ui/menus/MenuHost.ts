import type { ChapterDef, CodexEntry } from '../../content/types'
import type { Input } from '../../engine/Input'
import type { SaveStore, SlotId } from '../../game/Save'
import type { Settings } from '../../game/Settings'
import type { GameState, Profile } from '../../game/State'
import type { L } from '../../i18n/i18n'

/**
 * What the menu screens can see and do. Implemented by the Game class; menu
 * code must only talk to the game through this interface.
 */
export interface MenuHost {
  readonly settings: Settings
  /** Apply and persist settings (language, volumes, quality...). */
  applySettings(next: Settings): void
  readonly saves: SaveStore
  readonly profile: Profile
  readonly state: GameState
  /** All chapters in play order. */
  readonly chapters: ChapterDef[]
  /** All codex entries known to the game (locked or not). */
  readonly codexEntries: CodexEntry[]
  readonly input: Input
  /** Whether saving is currently allowed (not during cutscenes/minigames). */
  canSave(): boolean
  saveTo(slot: SlotId): Promise<boolean>
  loadFrom(slot: SlotId): Promise<void>
  newGame(): Promise<void>
  continueGame(): Promise<void>
  startChapter(id: string): Promise<void>
  quitToTitle(): Promise<void>
  /** Close the pause menu and resume play. */
  resume(): void
  /** Only meaningful in the desktop build. */
  exitApp(): void
  readonly canExit: boolean
  sfx(id: string): void
  /** Title of a chapter for display, e.g. "Kapitola 3 · Polnoc". */
  chapterLabel(id: string): L
  /** Version string shown on the title screen. */
  readonly version: string
}
