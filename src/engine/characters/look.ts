/**
 * Appearance description of a character. The CharacterFactory turns this into
 * a rigged low-poly model, so the whole cast of the novel can be expressed as
 * data (see content/characters.ts).
 */
export type Species = 'cat' | 'leopard' | 'lynx' | 'fox' | 'wolf' | 'rabbit' | 'goat' | 'bear' | 'human' | 'mako'

/** Pursang: human face, only ears/tail/eyes are animal. Mezra: fur, muzzle, claws. Ghorki: animal head. */
export type Caste = 'pursang' | 'mezra' | 'ghorki'

export type HairStyle = 'long' | 'short' | 'cropped' | 'wild' | 'bun' | 'braid' | 'ponytail' | 'bald' | 'mane' | 'bob'

export type OutfitType = 'robe' | 'dress' | 'coat' | 'tunic' | 'vest' | 'armor' | 'suit' | 'rags' | 'jacket' | 'apron' | 'silk'

export type Accessory =
  | 'goggles'
  | 'tricorn'
  | 'pipe'
  | 'pistols'
  | 'rapier'
  | 'spear'
  | 'carbine'
  | 'revolver'
  | 'rifle'
  | 'staff'
  | 'satchel'
  | 'book'
  | 'pendant'
  | 'mask_cat'
  | 'mask_leopard'
  | 'mask_rabbit'
  | 'darkglasses'
  | 'helmet'
  | 'lantern'
  | 'scarf'
  | 'cane'
  | 'glove'
  | 'eyepatch'
  | 'chronograph'
  | 'coilgun'
  | 'knife'
  | 'veil_cloth'

export interface Outfit {
  type: OutfitType
  primary: string
  secondary?: string
  trim?: string
  /** fur collar, like the grandmother's aviator coat */
  furCollar?: string
  hood?: boolean
  /** ᚲ emblem on the shoulder (Kitsune mark) */
  emblem?: boolean
  /** trousers colour (outfits with legs) */
  pants?: string
  boots?: 'tall' | 'short' | 'none'
  /** fingerless gloves colour */
  gloves?: string
  /** corset / bodice colour drawn over the torso */
  corset?: string
  /** number of belts across the waist/chest (straps and pouches) */
  belts?: number
  /** bandaged forearm (Tami) */
  bandage?: boolean
  sleeves?: 'long' | 'short' | 'none'
}

export interface CharacterLook {
  species: Species
  caste?: Caste
  /** 1 = adult (about 1.7 m) */
  height?: number
  build?: 'slim' | 'average' | 'broad' | 'small' | 'old' | 'child'
  skin: string
  /** ears/tail/muzzle fur colour (defaults to hair colour) */
  fur?: string
  furPattern?: 'spots' | 'stripes' | 'none'
  /** colour of a lighter tail tip / chest (foxes) */
  furTip?: string
  hair?: { style: HairStyle; color: string }
  eyes?: string
  outfit: Outfit
  accessories?: Accessory[]
  /** colour of the Spira glyph tattoos */
  glyph?: string
  tattoo?: 'forearms' | 'arms' | 'full' | 'none'
  /** Flint's torn ear, Dara's missing ear */
  ear?: 'torn' | 'missing'
  /** override the tail */
  tail?: 'long' | 'bushy' | 'stub' | 'puff' | 'none'
  /** iron body of the Maki */
  metal?: string
  /** anime face style; defaults from build */
  face?: 'female' | 'male' | 'child' | 'old'
  /** facial mark */
  mark?: 'scar' | 'freckles' | 'none'
  /** highlight colour of the hair shine band */
  hairShine?: string
}
