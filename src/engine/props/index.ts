/**
 * Prop kit entry point. Importing this module registers every prop type
 * (side-effect imports); the game and the dev gallery only import this file.
 */
import './nature'
import './architecture'
import './furniture'
import './tech'
import './magic'
import './statues'

export { propTypes, getProp } from './registry'
