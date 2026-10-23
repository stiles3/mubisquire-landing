// Copies chosen Kenney (CC0) models into public/models as self-contained GLBs (textures embedded).
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune } from '@gltf-transform/functions'
import { globSync } from 'node:fs'
import path from 'node:path'

const SRC = process.argv[2]
const OUT = process.argv[3]
const PICK = {
  'furniture-kit': ['desk', 'chairDesk', 'laptop', 'computerScreen', 'computerKeyboard', 'lampRoundTable', 'books', 'plantSmall1', 'pottedPlant', 'televisionModern', 'loungeSofa', 'speaker', 'cardboardBoxOpen', 'bookcaseOpenLow', 'radio', 'table', 'rugRound'],
  'mini-characters': ['character-female-b', 'character-female-c', 'character-female-d', 'character-female-e', 'character-male-a', 'character-male-d', 'character-male-e', 'character-male-f'],
  'platformer-kit': ['block-grass-large', 'block-grass-overhang-large', 'block-grass-overhang-low-large', 'flag', 'coin-gold', 'coin-silver', 'chest', 'sign', 'star', 'heart', 'crate', 'ladder-long', 'jewel'],
  'nature-kit': ['bridge_wood', 'tree_default', 'tree_oak', 'tree_small', 'rock_largeA', 'rock_smallA', 'plant_bush', 'flower_yellowA', 'flower_purpleA', 'statue_ring', 'log_stack', 'mushroom_redGroup'],
  'space-kit': ['rocket_baseA', 'rocket_fuelA', 'rocket_sidesA', 'rocket_finsA', 'rocket_topA', 'satelliteDish_large', 'meteor_detailed', 'astronautA', 'platform_large', 'gate_complex', 'craft_speederA'],
  'holiday-kit': ['present-a-cube', 'present-b-round', 'present-a-rectangle', 'lantern'],
  'food-kit': ['soda', 'fries', 'hot-dog', 'cup-coffee', 'popsicle', 'donut-sprinkles'],
  'building-kit': ['column', 'wall-window-square', 'stairs-open', 'floor', 'wall'],
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
let n = 0, missing = []
for (const [kit, names] of Object.entries(PICK)) {
  for (const name of names) {
    const hit = globSync(`${SRC}/${kit}/**/GLB format/${name}.glb`)[0] || globSync(`${SRC}/${kit}/**/${name}.glb`)[0]
    if (!hit) { missing.push(`${kit}/${name}`); continue }
    const doc = await io.read(hit)
    await doc.transform(dedup(), prune())
    await io.write(path.join(OUT, `${kit.replace('-kit', '').replace('mini-characters', 'char')}-${name}.glb`), doc)
    n++
  }
}
console.log('packed', n, 'missing', missing)
