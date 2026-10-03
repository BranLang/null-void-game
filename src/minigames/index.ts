/** Registers every minigame in ./games (each file calls registerMinigame at import). */
import.meta.glob('./games/*.ts', { eager: true })

export { runMinigame, hasMinigame } from './Minigame'
