import * as THREE from 'three'
import { registerProp, param } from './registry'
import { buildCharacter } from '../characters/CharacterFactory'
import type { CharacterLook } from '../characters/look'
import { toon } from '../toon'

/**
 * Statues built from the character rig and turned to stone: the kneeling
 * Mother of Ardentia (optionally eaten by the black), El of Nyau, and the
 * half-length statue Arkot shapes at the end of the book.
 */
const stoneCache = new Map<string, THREE.MeshToonMaterial>()
function stone(color: string): THREE.MeshToonMaterial {
  let m = stoneCache.get(color)
  if (!m) {
    m = toon(color, { flat: true })
    stoneCache.set(color, m)
  }
  return m
}

const motherLook: CharacterLook = {
  species: 'human',
  build: 'slim',
  height: 1.25,
  skin: '#cfcac0',
  hair: { style: 'long', color: '#cfcac0' },
  outfit: { type: 'robe', primary: '#cfcac0', boots: 'none' },
}

function petrify(root: THREE.Object3D, color: string, blackFrom?: number): void {
  const base = stone(color)
  const black = stone('#0d0b10')
  const veins = stone('#3a3540')
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const p = new THREE.Vector3()
    mesh.getWorldPosition(p)
    const isFace = mesh.material instanceof THREE.MeshToonMaterial && (mesh.material as THREE.MeshToonMaterial).transparent && mesh.renderOrder === 2
    if (isFace) {
      mesh.visible = false
      return
    }
    if (mesh.material instanceof THREE.MeshBasicMaterial) {
      mesh.visible = false
      return
    }
    if (blackFrom !== undefined && p.y < blackFrom) mesh.material = Math.sin(p.x * 31 + p.z * 17) > -0.2 ? black : veins
    else mesh.material = base
    mesh.castShadow = true
    mesh.receiveShadow = true
  })
}

function poseKneelOffering(model: ReturnType<typeof buildCharacter>, armsUp: boolean): void {
  const r = model.rig
  r.hips.position.y -= 0.43
  r.kneeL.rotation.x = 1.65
  r.kneeR.rotation.x = 1.65
  r.spine.rotation.x = 0.18
  r.neck.rotation.x = 0.45
  if (armsUp) {
    r.armL.rotation.z = 2.2
    r.armR.rotation.z = -2.2
    r.armL.rotation.x = -0.3
    r.armR.rotation.x = -0.3
  } else {
    // open palms held out, as one offers bread
    r.armL.rotation.x = -0.9
    r.armR.rotation.x = -0.9
    r.armL.rotation.z = 0.35
    r.armR.rotation.z = -0.35
    r.elbowL.rotation.x = -0.35
    r.elbowR.rotation.x = -0.35
    r.handL.rotation.x = -1.2
    r.handR.rotation.x = -1.2
  }
}

registerProp('mother_statue', {
  solid: true,
  build: (ctx) => {
    const g = new THREE.Group()
    const model = buildCharacter(motherLook)
    poseKneelOffering(model, param(ctx, 'armsUp', false))
    g.add(model.rig.root)
    model.rig.root.updateMatrixWorld(true)
    const blackness = param(ctx, 'black', 0)
    petrify(model.rig.root, param(ctx, 'color', '#bdb7ab'), blackness ? 0.2 + Number(blackness) * 0.9 : undefined)
    // rock she rises from, without a single seam
    const rock = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.35, 9), stone('#8f8a80'))
    rock.position.y = 0.17
    rock.receiveShadow = true
    g.add(rock)
    g.scale.setScalar(param(ctx, 'scale', 1.25))
    return g
  },
})

registerProp('el_statue', {
  solid: true,
  footprint: [
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  build: (ctx) => {
    const g = new THREE.Group()
    const model = buildCharacter({ ...motherLook, height: 1 })
    const r = model.rig
    r.armL.rotation.z = 1.0
    r.armR.rotation.z = -1.0
    r.armL.rotation.x = -0.6
    r.armR.rotation.x = -0.6
    r.elbowL.rotation.x = -0.6
    r.elbowR.rotation.x = -0.6
    g.add(r.root)
    r.root.updateMatrixWorld(true)
    petrify(r.root, '#f2efe8')
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), stone('#d8d2c6'))
    ped.position.y = 0.3
    r.root.position.y = 0.6
    g.add(ped)
    g.position.set(0.5, 0, 0.5)
    const outer = new THREE.Group()
    outer.add(g)
    outer.scale.setScalar(param(ctx, 'scale', 2.2))
    return outer
  },
})

const yeraLook: CharacterLook = {
  species: 'cat',
  caste: 'pursang',
  build: 'slim',
  skin: '#a89270',
  hair: { style: 'bob', color: '#a89270' },
  outfit: { type: 'coat', primary: '#a89270', furCollar: '#a89270' },
}

registerProp('yera_statue', {
  solid: true,
  build: (ctx) => {
    const g = new THREE.Group()
    const model = buildCharacter(yeraLook)
    const r = model.rig
    g.add(r.root)
    r.root.updateMatrixWorld(true)
    petrify(r.root, param(ctx, 'color', '#b08a52'))
    // half-length: hide the legs, sink into a rough plinth
    r.legL.visible = false
    r.legR.visible = false
    if (r.skirt) r.skirt.visible = false
    r.root.position.y = -0.55
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.9, 7), stone('#7a6a52'))
    plinth.position.y = 0.45
    g.add(plinth)
    return g
  },
})
