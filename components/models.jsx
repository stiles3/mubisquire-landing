'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useGLTF, useAnimations, Float } from '@react-three/drei'
import { clone as skinnedClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

/* ------------------------------------------------------------------
   Real 3D models (Kenney, CC0 — kenney.nl) served from ./models/*.glb
   Every material is converted to a lit standard material and softened
   toward the Mubisquire pastel palette so all packs read as one world.
------------------------------------------------------------------- */

export const MODEL_FILES = [
  'building-column', 'building-floor', 'building-stairs-open', 'building-wall-window-square', 'building-wall',
  'char-character-female-b', 'char-character-female-c', 'char-character-female-d', 'char-character-female-e', 'char-character-male-a', 'char-character-male-d', 'char-character-male-e', 'char-character-male-f',
  'food-cup-coffee', 'food-donut-sprinkles', 'food-fries', 'food-hot-dog', 'food-popsicle', 'food-soda',
  'furniture-bookcaseOpenLow', 'furniture-books', 'furniture-cardboardBoxOpen', 'furniture-chairDesk', 'furniture-computerKeyboard', 'furniture-computerScreen',
  'furniture-desk', 'furniture-lampRoundTable', 'furniture-laptop', 'furniture-loungeSofa', 'furniture-plantSmall1', 'furniture-pottedPlant', 'furniture-radio',
  'furniture-rugRound', 'furniture-speaker', 'furniture-table', 'furniture-televisionModern',
  'holiday-lantern', 'holiday-present-a-cube', 'holiday-present-a-rectangle', 'holiday-present-b-round',
  'nature-bridge_wood', 'nature-flower_purpleA', 'nature-flower_yellowA', 'nature-log_stack', 'nature-mushroom_redGroup', 'nature-plant_bush',
  'nature-rock_largeA', 'nature-rock_smallA', 'nature-statue_ring', 'nature-tree_default', 'nature-tree_oak', 'nature-tree_small',
  'platformer-block-grass-overhang-large', 'platformer-chest', 'platformer-coin-gold', 'platformer-coin-silver', 'platformer-crate',
  'platformer-flag', 'platformer-heart', 'platformer-jewel', 'platformer-ladder-long', 'platformer-sign', 'platformer-star',
  'space-astronautA', 'space-meteor_detailed', 'space-platform_large', 'space-rocket_baseA', 'space-rocket_fuelA', 'space-rocket_sidesA',
  'space-rocket_topA', 'space-satelliteDish_large',
]
const url = (name) => `/models/${name}.glb`
export const preloadModels = () => MODEL_FILES.forEach((n) => useGLTF.preload(url(n)))

// Kenney's packs use different scales: bring them to one world scale (a person ≈ 1.25 units)
const KIT_SCALE = { char: 1.6, furniture: 2.4, nature: 2.2, food: 2.2, holiday: 1.6, platformer: 1.6, space: 1.2, building: 0.9 }

const matCache = new Map()
const hsl = { h: 0, s: 0, l: 0 }
function soften(src) {
  if (matCache.has(src)) return matCache.get(src)
  const color = (src.color || new THREE.Color('#ffffff')).clone()
  if (!src.map) {
    // pastel shift: a little less saturated, a little lighter
    color.getHSL(hsl)
    color.setHSL(hsl.h, Math.min(1, hsl.s * 0.78), Math.min(0.9, 0.32 + hsl.l * 0.62))
  }
  const m = new THREE.MeshStandardMaterial({ color, map: src.map || null, roughness: 0.55, metalness: 0.02, side: src.side })
  if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
  matCache.set(src, m)
  return m
}

export function Model({ name, scale = 1, tint, ...props }) {
  const { scene } = useGLTF(url(name))
  const obj = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const next = mats.map((m) => {
        const s = soften(m)
        if (!tint) return s
        const t = s.clone(); t.color.lerp(new THREE.Color(tint), 0.55); return t
      })
      o.material = Array.isArray(o.material) ? next : next[0]
    })
    return c
  }, [scene, tint])
  const kit = name.split('-')[0]
  return <primitive object={obj} scale={(KIT_SCALE[kit] || 1) * scale} {...props} />
}

/* A Kenney mini character (rigged). Plays one of its clips: idle, walk, sit, emote-yes,
   interact-right, holding-both, pick-up … Uses a skeleton-aware clone so every copy animates. */
export function Character({ v = 'female-d', anim = 'idle', scale = 1, offset = 0, ...props }) {
  const name = `char-character-${v}`
  const { scene, animations } = useGLTF(url(name))
  const group = useRef()
  const obj = useMemo(() => {
    const c = skinnedClone(scene)
    c.traverse((o) => {
      if (!o.isMesh) return
      o.material = soften(o.material)
      o.frustumCulled = false
    })
    return c
  }, [scene])
  const { actions } = useAnimations(animations, group)
  useEffect(() => {
    const a = actions[anim] || actions.idle
    if (!a) return
    a.reset().play()
    a.time = offset
    return () => { a.stop() }
  }, [actions, anim, offset])
  return (
    <group ref={group} {...props}>
      <primitive object={obj} scale={KIT_SCALE.char * scale} />
    </group>
  )
}

/* A floating grass island. Children are placed on its top surface (local y = 0). */
export function Island({ size = 1.6, bob = true, children, ...props }) {
  const body = (
    <group {...props}>
      <Model name="platformer-block-grass-overhang-large" scale={size / 1.6} position={[0, -size, 0]} />
      {children}
    </group>
  )
  return bob ? <Float speed={1.1} floatIntensity={0.35} rotationIntensity={0.05}>{body}</Float> : body
}
