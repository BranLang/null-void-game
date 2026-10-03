import './ui/theme.css'
import './ui/game.css'
import './ui/menus/menus.css'
import { Game } from './game/Game'

const game = new Game(document.getElementById('app') ?? document.body)
;(window as Window & { __game?: Game }).__game = game
void game.boot().then(() => {
  document.getElementById('loading')?.remove()
})
