import '../ui/theme.css'
import { runMinigame } from '../minigames'
import { setLang, type Lang } from '../i18n/i18n'
import type { MinigameId } from '../game/GameAPI'

const p = new URLSearchParams(location.search)
setLang((p.get('lang') as Lang) ?? 'sk')
const id = (p.get('id') ?? 'flow') as MinigameId
const params = JSON.parse(p.get('params') ?? '{}') as Record<string, unknown>
const out = document.getElementById('result')!
runMinigame(id, params, {
  sfx: (s) => console.log('[sfx]', s),
  assist: { skipAllowed: p.has('assist'), slowTimers: p.has('slow'), reducedMotion: p.has('rm') },
}).then((r) => {
  out.textContent = 'RESULT ' + JSON.stringify(r)
  console.log('RESULT', JSON.stringify(r))
})
