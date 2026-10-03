import { l } from '../i18n/i18n'

/** In-game UI strings (menus have their own). */
export const UI = {
  objective: l('Cieľ', 'Objective'),
  veil: l('Závoj', 'Veil'),
  strain: l('Napätie Spiry', 'Spira strain'),
  prologue: l('Prológ', 'Prologue'),
  skip: l('Medzerník — preskočiť', 'Space — skip'),
  caught: l('Spozorovali ťa.', 'You were seen.'),
  touched: l('Vlákna ťa našli.', 'The fibers found you.'),
  codexNew: l('Kódex: {title}', 'Codex: {title}'),
  abilityNew: l('Nová schopnosť: {name}', 'New ability: {name}'),
  talk: l('Hovoriť', 'Talk'),
  collapse: l('…krv z nosa. Prsty necítim.', '…a nosebleed. I can’t feel my fingers.'),
  lightHour: l('Ľahká hodina', 'Light hour'),
  heavyHour: l('Ťažká hodina', 'Heavy hour'),
  neutralHour: l('Sai', 'Sai'),
  loading: l('Načítava sa', 'Loading'),
} as const
