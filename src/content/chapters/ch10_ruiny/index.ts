/**
 * KAPITOLA 10: Vonkajšie ruiny / The Outer Ruins (book: Kapitola 15).
 * Flint follows Tami past the warning signs into the dead outer city: her
 * rules, the watchers at the edge of vision, crystals from the ribs of the
 * dead, the best one cracked, the storm with a direction, the double
 * somersault, the jar of green acid, and the evening the somersault went into
 * the ship's log.
 */
import type { ChapterDef } from '../../types'
import { l } from '../../../i18n/i18n'
import { streetScene, duskScene } from './street'
import { ruinsScene } from './ruins'
import { itakaScene, hearthScene } from './itaka'

const chapter: ChapterDef = {
  id: 'ch10',
  index: 10,
  title: l('Kapitola 10', 'Chapter 10'),
  subtitle: l('Vonkajšie ruiny', 'The Outer Ruins'),
  pov: 'flint',
  epigraph: {
    text: l('„Odvaha je len nepresný preklad slova neopatrnosť.“', '“Courage is just an imprecise translation of the word carelessness.”'),
    source: l('Felix', 'Felix'),
  },
  abilities: [],
  flags: { 'ch01.pressedFlint': false, 'ch08.taughtArkot': true, 'ch09.toldTami': false },
  codex: [
    {
      id: 'world.vonkajsie_ruiny',
      category: 'world',
      title: l('Vonkajšie ruiny', 'The Outer Ruins'),
      body: l(
        'Za líniou bielych kruhov s prázdnou tvárou začína mŕtve mesto. Kitsune bolo postavené pre milión obyvateľov; dnes žije malá komunita v udržiavanom jadre a všetko ostatné patrí lesu.\n\nVzduch je tam taký nasýtený prachom, že s každým nádychom prehĺtaš cudziu pamäť niekoho, kto tam zomrel. Chutí suchou, kovovou starobou, ako keď lížeš nábojnicu.\n\n*„Za značky nechodíme. Nikdy.“*\n\nKto tam predsa ide, dýcha nosom, nestúpa na mach a neotáča sa za pohybom na okraji zorného poľa.',
        'Beyond the line of white circles with empty faces the dead city begins. Kitsune was built for a million people; today a small community lives in its maintained core, and everything else belongs to the forest.\n\nThe air there is so thick with dust that with every breath you swallow the memory of someone who died there. It tastes of dry, metallic age, like licking a cartridge.\n\n*“We don’t go past the signs. Never.”*\n\nWhoever goes anyway breathes through the nose, does not step on moss, and does not turn toward movement at the edge of their vision.',
      ),
    },
    {
      id: 'world.pozorovatelia',
      category: 'world',
      title: l('Pozorovatelia', 'The Watchers'),
      body: l(
        'Tiene na okraji zorného poľa vo vonkajších ruinách. Nikdy nie priamo: pohyb tmavší než tieň stromu, rýchlejší než vietor, a keď tam stočíš oči, len stena a mach.\n\n*„Sú tu vždy. Väčšinou len pozerajú.“*\n\nKým ideš svojou cestou, nemajú dôvod pozerať sa na teba. Kto sa za nimi otočí, kto k nim kráča alebo pri nich postáva, toho si všimnú.\n\nKeď sa blíži niečo horšie, sťahujú sa, pomaly a nehlučne, ako vreckári z trhu, keď zbadajú stráž.',
        'Shadows at the edge of vision in the outer ruins. Never directly: a movement darker than the shadow of a tree, faster than the wind, and when you turn your eyes there, only a wall and moss.\n\n*“They’re always here. Mostly they just watch.”*\n\nAs long as you keep to your own path, they have no reason to look at you. Whoever turns toward them, walks toward them or lingers near them gets noticed.\n\nWhen something worse is coming, they withdraw, slowly and silently, like pickpockets leaving a market when they spot the watch.',
      ),
    },
    {
      id: 'gloss.kristaly_spiry',
      category: 'glossary',
      title: l('Kryštály Spiry', 'Spira crystals'),
      body: l(
        'Vo vonkajších ruinách Kitsune vyrastajú z rebier a stavcov mŕtvych ako minerálne výrastky v jaskyniach: drobné, priehľadné, s fialovým alebo mliečnym bielym odleskom. Matné sú prázdne, vyhorené.\n\nVyberajú sa tenkými kliešťami. *Po vlákne. Nikdy naprieč.* Kto nimi krúti, ako keď v Diss otvára mušle, tomu kryštál praskne a žiara z neho vytečie ako lieh z prevrátenej lampy.\n\nItaka ich potrebuje pre svoj Spira-kotol. V podpalubí sa spúšťajú do hrubých nádob so zelenkastou kyselinou, kde tlejú fialovo ako žeravé drevo pod popolom.',
        'In the outer ruins of Kitsune they grow from the ribs and vertebrae of the dead like mineral growths in caves: tiny, clear, with a violet or milky white sheen. The dull ones are empty, burnt out.\n\nThey are taken with thin pliers. *Along the grain. Never across.* Twist them the way you open mussels in Diss and the crystal cracks, its glow running out like spirit from an overturned lamp.\n\nThe Itaka needs them for her Spira boiler. In the hold they are lowered into thick jars of greenish acid, where they smoulder violet like embers under ash.',
      ),
    },
  ],
  scenes: [streetScene, ruinsScene, duskScene, itakaScene, hearthScene],
  start: 'c10_street',
}

export default chapter
