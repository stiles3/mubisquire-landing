'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, RoundedBox, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Wordmark } from '../logo.jsx'
import { Model, Island, Character, preloadModels } from '../models.jsx'

preloadModels()

/* ------------------------------------------------------------------
   The Mubisquire Way — one continuous, scroll-scrubbed camera flight
   through seven connected scenes. Scroll position maps straight onto
   the camera's position along a single spline: no cuts, no pages.
------------------------------------------------------------------- */

const ACTS = ['Who we are', 'How ideas take shape', 'What we’ve built', 'What’s next']
const ROMAN = ['I', 'II', 'III', 'IV']

const CHAPTERS = [
  // Act I — who we are
  { act: 0, scene: 'Gateway', name: 'Welcome to Mubisquire', kicker: 'The journey starts here', body: 'We build products of our own and software for other companies. Come along: this is who we are, how our ideas take shape, and what we’ve made.', sky: '#F4F1FF', tile: '#C9BCFF', accent: '#5B4BDB' },
  { act: 0, scene: 'Globe', name: 'Who we are', kicker: 'Remote-first, rooted in Africa', body: 'A remote-first team of engineers and designers. We start in Africa and build for the world. Because we run our own products, we feel the same problems our clients do.', sky: '#FFEDE4', tile: '#FFB8A1', accent: '#B23A1E' },
  // Act II — how ideas take shape
  { act: 1, scene: 'Spark', name: 'The spark', kicker: 'It starts with a problem', body: 'Every idea begins with a real problem, not a feature list. We write down who has it, why it hurts and what “fixed” would look like.', sky: '#FFF7D6', tile: '#FFE58A', accent: '#8A5A00' },
  { act: 1, scene: 'Sketchbook', name: 'On paper first', kicker: 'Sketch, test, throw away', body: 'Rough sketches and quick prototypes come before any code. Most ideas change shape here, and that’s the point.', sky: '#FFE6DC', tile: '#FFB8A1', accent: '#B23A1E' },
  { act: 1, scene: 'CodeForest', name: 'Built to last', kicker: 'Then we build it properly', body: 'Once an idea holds up, we design the system behind it and build it for web, mobile, payments and AI.', sky: '#E6E0FF', tile: '#C9BCFF', accent: '#4A3BC4' },
  // Act III — what we've built
  { act: 2, scene: 'Mail', name: 'Mailsquire', kicker: 'Email, with AI templates', body: 'Email marketing and a transactional email API in one place, with AI that writes custom templates for you.', sky: '#ECE7FF', tile: '#C9BCFF', accent: '#4A3BC4' },
  { act: 2, scene: 'Pay', name: 'Squirepay', kicker: 'Payments and subscriptions', body: 'A payment gateway for businesses that also helps people keep track of and manage their subscriptions.', sky: '#FFE3D8', tile: '#FF9C80', accent: '#9C2F14' },
  { act: 2, scene: 'Cquence', name: 'CQuence', kicker: 'Productions, sites and events', body: 'Run film and TV productions, construction projects and events from one account, with an AI assistant that answers from your project’s own records.', sky: '#DDF5EC', tile: '#9FE9D4', accent: '#1F7A63', href: 'https://cquence.mubisquire.com' },
  { act: 2, scene: 'Binj', name: 'BinjHub', kicker: 'Stream and create', body: 'Streaming and a community hub where creators share their work and find their audience.', sky: '#FFF1BF', tile: '#FFE58A', accent: '#8A5A00' },
  { act: 2, scene: 'Clients', name: 'Built for others', kicker: 'For startups and larger companies', body: 'Custom web and mobile apps, AI features and automation, and payments integration. Teams we’ve built with include SEVNINE and Bani.', sky: '#FFC8B6', tile: '#FF7A59', accent: '#7A1F0B' },
  // Act IV — what's next
  { act: 3, scene: 'OpenSky', name: 'What’s next', kicker: 'The road keeps going', body: 'Content Squire, Squabble (our game engine) and Company Brain are in the works.', sky: '#2B2560', tile: '#6E5CE6', accent: '#FFD9CC' },
]

const N = CHAPTERS.length
// progress (0..1) at which the camera arrives at each chapter
const CENTER = CHAPTERS.map((_, i) => 0.06 + (i / (N - 1)) * 0.89)
const camU = (p) => 0.01 + p * 0.94 // progress → position along the spline
const sceneU = (i) => Math.min(0.99, camU(CENTER[i]) + 0.004) // each scene is built around the camera's stop

const PAL = { lilac: '#C9BCFF', violet: '#6E5CE6', peach: '#FFB8A1', coral: '#FF7A59', mint: '#9FE9D4', butter: '#FFE58A', ink: '#1E1B3A', white: '#FFFFFF' }

/* shared scroll state (read by both the 3D scene and the HTML overlay) */
const store = { target: 0, current: 0 }

function useCurve() {
  return useMemo(() => {
    const xs = [0, 4, -3, 3, -4, 3, -3, 4, -2, 2, 0, 0]
    const pts = [new THREE.Vector3(0, 0, 12)]
    for (let i = 0; i <= N; i++) {
      const rise = i >= N - 1 ? (i - (N - 2)) * 3.5 : 0
      pts.push(new THREE.Vector3(xs[i % xs.length], Math.sin(i * 1.3) * 0.6 + rise, -i * 15))
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4)
  }, [])
}

/* place a group at curve point u, facing along the path */
function Anchor({ curve, u, children, lift = 0 }) {
  const { pos, quat } = useMemo(() => {
    const p = curve.getPointAt(u)
    const t = curve.getTangentAt(u)
    // local -z points down the road, +x to the traveller's right
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), t, new THREE.Vector3(0, 1, 0))
    return { pos: p.add(new THREE.Vector3(0, lift, 0)), quat: new THREE.Quaternion().setFromRotationMatrix(m) }
  }, [curve, u, lift])
  return <group position={pos} quaternion={quat}>{children}</group>
}

const Mat = ({ color, rough = 0.35, metal = 0.05, ...r }) => <meshStandardMaterial color={color} roughness={rough} metalness={metal} {...r} />

/* ---------- 01 The Blank Canvas ---------- */
function BlankCanvas() {
  const cursor = useRef()
  useFrame((s) => { if (cursor.current) cursor.current.visible = Math.floor(s.clock.elapsedTime * 2) % 2 === 0 })
  const sheets = [[-3.6, 1.2, -5, 0.2, 0.5, 0.1], [3.8, 1.6, -6.5, -0.1, -0.6, -0.15], [-3.2, -1.2, -8.5, 0.4, 0.3, 0.3], [3.4, -0.6, -10, -0.3, -0.2, 0.2], [0.4, 3.4, -11, 0.6, 0, -0.2]]
  return (
    <group>
      {sheets.map((s, i) => (
        <Float key={i} speed={1.2} floatIntensity={0.7} rotationIntensity={0.3}>
          <RoundedBox args={[2, 2.7, 0.04]} radius={0.02} position={[s[0], s[1], s[2]]} rotation={[s[3], s[4], s[5]]}>
            <Mat color={PAL.white} rough={0.6} />
          </RoundedBox>
        </Float>
      ))}
      <mesh ref={cursor} position={[0, 0.3, -7]}><boxGeometry args={[0.07, 0.8, 0.07]} /><meshBasicMaterial color={PAL.violet} /></mesh>
    </group>
  )
}

/* ---------- 02 The Sketchbook ---------- */
function Sketchbook() {
  return (
    <group>
      <Float speed={1.4} floatIntensity={1}><mesh position={[-3.4, 0.9, -6]}><sphereGeometry args={[0.9, 48, 48]} /><Mat color={PAL.peach} /></mesh></Float>
      <Float speed={2} rotationIntensity={1.5}><mesh position={[3.4, -0.4, -5.5]}><torusGeometry args={[0.65, 0.26, 32, 64]} /><Mat color={PAL.coral} /></mesh></Float>
      <Float speed={1.7} rotationIntensity={1}><mesh position={[2.8, 2.2, -8]}><coneGeometry args={[0.6, 1.2, 48]} /><Mat color={PAL.butter} /></mesh></Float>
      <Float speed={2.2}><mesh position={[-2.2, -1.4, -8.5]}><icosahedronGeometry args={[0.5, 0]} /><Mat color={PAL.lilac} /></mesh></Float>
      {/* a giant pencil drawing across the path */}
      <Float speed={1} floatIntensity={0.4} rotationIntensity={0.1}>
        <group position={[0.6, 3.2, -10]} rotation={[0, 0, -0.5]}>
          <mesh><cylinderGeometry args={[0.28, 0.28, 4.2, 6]} /><Mat color={PAL.butter} /></mesh>
          <mesh position={[0, -2.45, 0]}><coneGeometry args={[0.28, 0.7, 6]} /><Mat color="#F3D6B5" /></mesh>
          <mesh position={[0, -2.72, 0]}><coneGeometry args={[0.09, 0.2, 6]} /><Mat color={PAL.ink} /></mesh>
          <mesh position={[0, 2.25, 0]}><cylinderGeometry args={[0.29, 0.29, 0.35, 12]} /><Mat color={PAL.coral} /></mesh>
        </group>
      </Float>
    </group>
  )
}

/* ---------- 03 The Grid ---------- */
function Grid() {
  const ref = useRef()
  const tiles = useMemo(() => {
    const out = []
    for (let x = -4; x <= 4; x++) for (let z = -6; z <= 0; z++) out.push([x * 0.95, z * 0.95])
    return out
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    tiles.forEach((_, i) => ref.current.setColorAt(i, new THREE.Color(i % 3 === 0 ? PAL.mint : i % 7 === 0 ? PAL.violet : PAL.white)))
    ref.current.instanceColor.needsUpdate = true
  }, [tiles])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    tiles.forEach(([x, z], i) => {
      const h = 0.3 + (Math.sin(x * 0.8 + t * 1.6) * Math.cos(z * 0.6 + t) + 1) * 0.45
      dummy.position.set(x, -2.2 + h / 2, z - 3)
      dummy.scale.set(1, h / 0.3, 1)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, tiles.length]}>
      <boxGeometry args={[0.85, 0.3, 0.85]} />
      <Mat color="#ffffff" />
    </instancedMesh>
  )
}

/* ---------- 04 The Code Forest ---------- */
function CodeForest() {
  const towers = useMemo(() => {
    const out = []
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1
      out.push({ x: side * (2.8 + Math.random() * 2.6), z: -2.5 - i * 0.75, h: 3 + Math.floor(Math.random() * 5) })
    }
    return out
  }, [])
  return (
    <group position={[0, -2.4, 0]}>
      {towers.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          {Array.from({ length: t.h }, (_, k) => (
            <RoundedBox key={k} args={[0.62, 0.62, 0.62]} radius={0.1} position={[(k % 2) * 0.06, k * 0.66, 0]}>
              <Mat color={k === t.h - 1 ? PAL.violet : k % 2 ? PAL.lilac : PAL.white} />
            </RoundedBox>
          ))}
        </group>
      ))}
    </group>
  )
}

/* ---------- 05 The Bridge ---------- */
function Bridge() {
  return (
    <group>
      <mesh position={[-4.5, -2.6, -6]}><cylinderGeometry args={[2.4, 1.6, 1.2, 40]} /><Mat color={PAL.lilac} /></mesh>
      <mesh position={[4.5, -2.6, -6]}><cylinderGeometry args={[2.4, 1.6, 1.2, 40]} /><Mat color={PAL.peach} /></mesh>
      {Array.from({ length: 13 }, (_, i) => {
        const x = -3 + i * 0.5
        const y = -1.9 + Math.sin((i / 12) * Math.PI) * 0.9
        return (
          <RoundedBox key={i} args={[0.42, 0.14, 1.6]} radius={0.05} position={[x, y, -6]} rotation={[0, 0, Math.cos((i / 12) * Math.PI) * -0.35]}>
            <Mat color={i < 6 ? PAL.lilac : i > 6 ? PAL.peach : PAL.butter} />
          </RoundedBox>
        )
      })}
      <Float speed={1.5}><mesh position={[-4.5, -1.4, -6]}><icosahedronGeometry args={[0.45, 0]} /><Mat color={PAL.violet} /></mesh></Float>
      <Float speed={1.5}><mesh position={[4.5, -1.4, -6]}><torusGeometry args={[0.35, 0.14, 24, 48]} /><Mat color={PAL.coral} /></mesh></Float>
    </group>
  )
}

/* ---------- 06 The Launch Pad ---------- */
function LaunchPad() {
  const rocket = useRef()
  const rings = useRef()
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (rocket.current) rocket.current.position.y = -0.6 + Math.sin(t * 1.4) * 0.25
    if (rings.current) rings.current.rotation.z = t * 0.4
  })
  return (
    <group position={[3.2, 0, -7]}>
      <mesh position={[0, -2.4, 0]}><cylinderGeometry args={[1.6, 1.8, 0.4, 40]} /><Mat color={PAL.ink} /></mesh>
      <group ref={rocket}>
        <mesh><cylinderGeometry args={[0.5, 0.5, 2, 32]} /><Mat color={PAL.white} /></mesh>
        <mesh position={[0, 1.45, 0]}><coneGeometry args={[0.5, 0.9, 32]} /><Mat color={PAL.coral} /></mesh>
        <mesh position={[0, 0.2, 0.46]}><circleGeometry args={[0.18, 32]} /><Mat color={PAL.mint} /></mesh>
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[Math.sin((k / 3) * Math.PI * 2) * 0.55, -0.85, Math.cos((k / 3) * Math.PI * 2) * 0.55]} rotation={[0, (k / 3) * Math.PI * 2, 0]}>
            <boxGeometry args={[0.08, 0.6, 0.4]} /><Mat color={PAL.coral} />
          </mesh>
        ))}
      </group>
      <group ref={rings} rotation={[1.2, 0, 0]}>
        <mesh><torusGeometry args={[2.2, 0.04, 16, 128]} /><Mat color={PAL.ink} /></mesh>
        <mesh position={[2.2, 0, 0]}><sphereGeometry args={[0.18, 24, 24]} /><Mat color={PAL.butter} /></mesh>
      </group>
    </group>
  )
}

/* ---------- 07 The Open Sky ---------- */
function OpenSky() {
  const logo = useRef()
  useFrame((s) => { if (logo.current) logo.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.4) * 0.35 })
  const stars = useMemo(() => {
    const a = new Float32Array(600 * 3)
    for (let i = 0; i < 600; i++) { a[i * 3] = (Math.random() - 0.5) * 60; a[i * 3 + 1] = Math.random() * 30 - 6; a[i * 3 + 2] = -Math.random() * 30 - 2 }
    return a
  }, [])
  return (
    <group>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry>
        <pointsMaterial color="#FFF6E0" size={0.09} sizeAttenuation transparent opacity={0.9} />
      </points>
      {/* the Mubisquire mark: three isometric layers */}
      <group ref={logo} position={[0, 3.2, -9]} rotation={[0.55, 0, 0]}>
        {[PAL.mint, PAL.peach, PAL.lilac].map((c, i) => (
          <Float key={i} speed={1.3} floatIntensity={0.4} rotationIntensity={0}>
            <RoundedBox args={[2.6, 0.3, 2.6]} radius={0.12} position={[0, i * 0.85 - 0.85, 0]} rotation={[0, Math.PI / 4, 0]}>
              <Mat color={c} emissive={c} emissiveIntensity={0.35} />
            </RoundedBox>
          </Float>
        ))}
      </group>
    </group>
  )
}

/* ---------- I · Gateway: three logo-coloured diamond rings to fly through ---------- */
function Gateway() {
  const g = useRef()
  useFrame((s) => { if (g.current) g.current.children.forEach((r, i) => { r.rotation.z = Math.PI / 4 + Math.sin(s.clock.elapsedTime * 0.6 + i) * 0.08 }) })
  return (
    <group ref={g}>
      {[PAL.mint, PAL.peach, PAL.lilac].map((c, i) => (
        <mesh key={i} position={[0, 0.2, -3 - i * 3.2]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[3.4 - i * 0.25, 0.22, 12, 4]} />
          <Mat color={c} />
        </mesh>
      ))}
      <Float speed={1.4} floatIntensity={0.6}>
        <group position={[0, 0.3, -14]} rotation={[0.5, Math.PI / 4, 0]}>
          {[PAL.mint, PAL.peach, PAL.lilac].map((c, i) => (
            <RoundedBox key={i} args={[1.5, 0.18, 1.5]} radius={0.07} position={[0, i * 0.42 - 0.42, 0]}><Mat color={c} /></RoundedBox>
          ))}
        </group>
      </Float>
    </group>
  )
}

/* ---------- I · Globe: a remote team, pinned and connected ---------- */
function Globe() {
  const g = useRef()
  const R = 2.3
  const { pins, arcs } = useMemo(() => {
    const ll = [[6, 3], [9, 7], [-1, 37], [-26, 28], [30, 31], [5, -0.2], [51, 0], [40, -74], [25, 55], [1, 104], [-4, 15], [14, -17]]
    const v = ll.map(([la, lo]) => {
      const phi = (90 - la) * Math.PI / 180, th = (lo + 180) * Math.PI / 180
      return new THREE.Vector3(-R * Math.sin(phi) * Math.cos(th), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(th))
    })
    const pairs = [[0, 1], [0, 2], [0, 3], [0, 6], [2, 4], [6, 7], [4, 8], [8, 9], [0, 10], [0, 11], [1, 5]]
    const a = pairs.map(([i, j]) => {
      const mid = v[i].clone().add(v[j]).multiplyScalar(0.5)
      mid.setLength(R + v[i].distanceTo(v[j]) * 0.35)
      return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v[i], mid, v[j]), 40, 0.018, 6, false)
    })
    return { pins: v, arcs: a }
  }, [])
  useFrame((s) => { if (g.current) g.current.rotation.y = 1.2 + s.clock.elapsedTime * 0.12 })
  return (
    <group position={[3.4, 0.6, -7]}>
      <group ref={g} rotation={[0.25, 1.2, 0]}>
        <mesh><sphereGeometry args={[R, 64, 64]} /><Mat color="#FFF8F3" rough={0.7} /></mesh>
        <mesh><sphereGeometry args={[R * 1.004, 24, 16]} /><meshBasicMaterial color={PAL.peach} wireframe transparent opacity={0.45} /></mesh>
        {pins.map((p, i) => (
          <mesh key={i} position={p}><sphereGeometry args={[i === 0 ? 0.13 : 0.08, 16, 16]} /><meshStandardMaterial color={i === 0 ? PAL.coral : PAL.violet} emissive={i === 0 ? PAL.coral : PAL.violet} emissiveIntensity={0.6} /></mesh>
        ))}
        {arcs.map((geo, i) => <mesh key={i} geometry={geo}><meshBasicMaterial color={i % 2 ? PAL.violet : PAL.coral} /></mesh>)}
      </group>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}><torusGeometry args={[3.1, 0.03, 8, 128]} /><Mat color={PAL.ink} /></mesh>
    </group>
  )
}

/* ---------- II · The spark: blank pages around a glowing idea ---------- */
function Spark() {
  const s = useRef()
  useFrame((st) => {
    if (!s.current) return
    const t = st.clock.elapsedTime
    s.current.rotation.set(t * 0.4, t * 0.6, 0)
    s.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06)
  })
  return (
    <group>
      <BlankCanvas />
      <group position={[0, 1.3, -7.5]}>
        <mesh ref={s}><icosahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color={PAL.butter} emissive="#FFC94D" emissiveIntensity={1.1} roughness={0.3} /></mesh>
        <pointLight color="#FFD36B" intensity={18} distance={9} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Float key={k} speed={2 + k * 0.2} floatIntensity={1.2}>
            <mesh position={[Math.cos(k) * 1.6, Math.sin(k * 1.7) * 1, Math.sin(k) * 1.2]} rotation={[k, k * 0.5, 0]}>
              <boxGeometry args={[0.38, 0.38, 0.02]} /><Mat color={[PAL.butter, PAL.peach, PAL.mint][k % 3]} rough={0.8} />
            </mesh>
          </Float>
        ))}
      </group>
    </group>
  )
}

/* ---------- III · Mailsquire: envelopes and paper planes ---------- */
const planeGeo = (() => {
  const g = new THREE.BufferGeometry()
  const v = new Float32Array([0, 0, -1, -0.7, 0.05, 0.45, 0, 0, 0.45, 0, 0, -1, 0, 0, 0.45, 0.7, 0.05, 0.45, 0, 0, -1, 0, -0.22, 0.45, 0, 0, 0.45])
  g.setAttribute('position', new THREE.BufferAttribute(v, 3))
  g.computeVertexNormals()
  return g
})()
const flapGeo = (() => { const s = new THREE.Shape(); s.moveTo(-0.8, 0.5); s.lineTo(0.8, 0.5); s.lineTo(0, -0.12); s.closePath(); return new THREE.ShapeGeometry(s) })()

function Envelope({ color, ...p }) {
  return (
    <group {...p}>
      <RoundedBox args={[1.6, 1, 0.07]} radius={0.03}><Mat color={color} rough={0.6} /></RoundedBox>
      <mesh geometry={flapGeo} position={[0, 0, 0.04]}><Mat color="#ffffff" rough={0.6} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.12, 0.05]}><circleGeometry args={[0.1, 24]} /><Mat color={PAL.coral} /></mesh>
    </group>
  )
}

function Mail() {
  const planes = useRef([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    planes.current.forEach((m, i) => {
      if (!m) return
      const a = t * 0.5 + i * 2.1, r = 2.6 + i * 0.6
      m.position.set(Math.cos(a) * r, 0.8 + Math.sin(t + i) * 0.5, -7 + Math.sin(a) * r)
      m.rotation.set(0, -a, Math.sin(t + i) * 0.3)
    })
  })
  return (
    <group>
      <Float speed={1.4} rotationIntensity={0.4}><Envelope color={PAL.lilac} position={[-3, 0.6, -6]} rotation={[0.1, 0.5, -0.15]} /></Float>
      <Float speed={1.8} rotationIntensity={0.4}><Envelope color="#ffffff" position={[3.2, 1.6, -8]} rotation={[-0.1, -0.5, 0.2]} /></Float>
      <Float speed={1.2} rotationIntensity={0.4}><Envelope color={PAL.peach} position={[2.4, -1.1, -5.5]} rotation={[0.2, -0.3, 0.1]} /></Float>
      {[PAL.white, PAL.lilac, PAL.mint].map((c, i) => (
        <mesh key={i} ref={(el) => (planes.current[i] = el)} geometry={planeGeo} scale={0.8}>
          <meshStandardMaterial color={c} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- III · Squirepay: the bridge, cards and coins ---------- */
function PayCard({ color, ...p }) {
  return (
    <group {...p}>
      <RoundedBox args={[1.7, 1.07, 0.05]} radius={0.08}><Mat color={color} rough={0.3} metal={0.15} /></RoundedBox>
      <mesh position={[-0.5, 0.12, 0.03]}><boxGeometry args={[0.3, 0.22, 0.02]} /><Mat color={PAL.butter} metal={0.6} rough={0.3} /></mesh>
      <mesh position={[0, -0.28, 0.03]}><boxGeometry args={[1.3, 0.07, 0.01]} /><Mat color="#ffffff" /></mesh>
    </group>
  )
}
function Pay() {
  const coins = useRef()
  useFrame((s) => { if (coins.current) coins.current.rotation.y = s.clock.elapsedTime * 0.8 })
  return (
    <group>
      <Bridge />
      <Float speed={1.6} rotationIntensity={0.5}><PayCard color={PAL.coral} position={[-2.6, 1.4, -7]} rotation={[0.2, 0.5, -0.2]} /></Float>
      <Float speed={1.3} rotationIntensity={0.5}><PayCard color={PAL.violet} position={[2.8, 1.8, -8.5]} rotation={[-0.1, -0.4, 0.25]} /></Float>
      <group ref={coins} position={[0, 1.6, -9]}>
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} position={[Math.cos(k * 1.26) * 1.2, Math.sin(k * 2) * 0.3, Math.sin(k * 1.26) * 1.2]} rotation={[Math.PI / 2, 0, k]}>
            <cylinderGeometry args={[0.32, 0.32, 0.07, 32]} /><Mat color={PAL.butter} metal={0.7} rough={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------- III · CQuence: a production board, a hard hat, a schedule grid ---------- */
function Cquence() {
  const clap = useRef()
  useFrame((s) => { if (clap.current) clap.current.rotation.z = 0.05 + Math.max(0, Math.sin(s.clock.elapsedTime * 2)) * 0.45 })
  return (
    <group>
      <Grid />
      <Float speed={1.3} rotationIntensity={0.25}>
        <group position={[-2.8, 1, -6.5]} rotation={[0, 0.5, 0]}>
          <RoundedBox args={[1.9, 1.3, 0.12]} radius={0.04}><Mat color={PAL.ink} /></RoundedBox>
          {[0, 1, 2].map((k) => <mesh key={k} position={[0, 0.2 - k * 0.3, 0.07]}><boxGeometry args={[1.6, 0.03, 0.01]} /><Mat color="#ffffff" /></mesh>)}
          <group ref={clap} position={[-0.95, 0.7, 0]}>
            <group position={[0.95, 0.12, 0]}>
              <mesh><boxGeometry args={[1.9, 0.24, 0.12]} /><Mat color="#ffffff" /></mesh>
              {[0, 1, 2, 3].map((k) => <mesh key={k} position={[-0.7 + k * 0.46, 0, 0.065]} rotation={[0, 0, 0.6]}><boxGeometry args={[0.16, 0.3, 0.01]} /><Mat color={PAL.ink} /></mesh>)}
            </group>
          </group>
        </group>
      </Float>
      <Float speed={1.6} rotationIntensity={0.4}>
        <group position={[3, 1.4, -8]} rotation={[0.3, -0.4, 0.15]}>
          <mesh><sphereGeometry args={[0.75, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat color={PAL.butter} /></mesh>
          <mesh position={[0, 0.02, 0.35]}><cylinderGeometry args={[0.95, 0.95, 0.05, 40, 1, false, -Math.PI / 2, Math.PI]} /><Mat color={PAL.butter} /></mesh>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.16, 0.12, 1.3]} /><Mat color="#F2C94C" /></mesh>
        </group>
      </Float>
    </group>
  )
}

/* ---------- III · BinjHub: a big screen, a play button and a mic ---------- */
function Binj() {
  const play = useRef()
  useFrame((s) => { if (play.current) play.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 3) * 0.08) })
  return (
    <group>
      <group position={[0, 1.4, -9]}>
        <RoundedBox args={[4.6, 2.7, 0.16]} radius={0.12}><Mat color={PAL.ink} /></RoundedBox>
        <mesh position={[0, 0, 0.09]}><planeGeometry args={[4.2, 2.3]} /><meshBasicMaterial color="#FFB85C" /></mesh>
        <mesh position={[0, 0, 0.1]}><planeGeometry args={[4.2, 1.1]} /><meshBasicMaterial color="#FF8A5B" transparent opacity={0.55} /></mesh>
        <mesh ref={play} position={[0.06, 0, 0.12]}><circleGeometry args={[0.45, 3]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0, -1.6, 0]}><boxGeometry args={[0.2, 0.6, 0.2]} /><Mat color={PAL.ink} /></mesh>
      </group>
      <Float speed={1.5} rotationIntensity={0.4}>
        <group position={[-3.2, 0.2, -6]} rotation={[0.1, 0.3, 0.25]}>
          <mesh position={[0, 0.7, 0]}><sphereGeometry args={[0.38, 32, 32]} /><Mat color="#D9D6E8" metal={0.6} rough={0.35} /></mesh>
          <mesh><cylinderGeometry args={[0.16, 0.12, 1.1, 24]} /><Mat color={PAL.ink} /></mesh>
        </group>
      </Float>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Float key={k} speed={2 + k * 0.3} floatIntensity={1.4}>
          <mesh position={[2.4 + (k % 3) * 0.6, -0.4 + Math.floor(k / 3) * 0.7, -5.5 - k * 0.3]}><icosahedronGeometry args={[0.16, 1]} /><Mat color={k % 2 ? '#FFF6E0' : PAL.butter} rough={0.9} /></mesh>
        </Float>
      ))}
    </group>
  )
}

/* ---------- III · Built for others: a phone, a laptop and the launch pad ---------- */
function Clients() {
  return (
    <group>
      <LaunchPad />
      <Float speed={1.4} rotationIntensity={0.35}>
        <group position={[-3, 0.8, -6.5]} rotation={[0, 0.5, 0.08]}>
          <RoundedBox args={[0.9, 1.8, 0.09]} radius={0.12}><Mat color={PAL.ink} /></RoundedBox>
          <mesh position={[0, 0, 0.05]}><planeGeometry args={[0.76, 1.6]} /><meshBasicMaterial color={PAL.lilac} /></mesh>
          {[0, 1, 2].map((k) => <mesh key={k} position={[0, 0.45 - k * 0.38, 0.06]}><planeGeometry args={[0.6, 0.26]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
        </group>
      </Float>
      <Float speed={1.1} rotationIntensity={0.25}>
        <group position={[-1.2, -0.6, -9]} rotation={[0.25, 0.3, 0]}>
          <RoundedBox args={[2.4, 0.08, 1.6]} radius={0.03}><Mat color="#E4E1EE" metal={0.3} /></RoundedBox>
          <group position={[0, 0.04, -0.8]} rotation={[-0.25, 0, 0]}>
            <RoundedBox args={[2.4, 1.6, 0.06]} radius={0.03} position={[0, 0.8, 0]}><Mat color="#E4E1EE" metal={0.3} /></RoundedBox>
            <mesh position={[0, 0.8, 0.035]}><planeGeometry args={[2.2, 1.4]} /><meshBasicMaterial color={PAL.mint} /></mesh>
          </group>
        </group>
      </Float>
    </group>
  )
}

/* ==================================================================
   Real-model scenes (Kenney CC0). Each stop is a cluster of floating
   islands the camera glides past; people, furniture and props tell
   the story of that stop.
=================================================================== */
const Who = (p) => <Character {...p} />

function GatewayR() {
  return (
    <group>
      <Gateway />
      <Island size={1.5} position={[-4.6, -1.7, -8]}>
        <Model name="platformer-flag" position={[-0.6, 0, -0.4]} />
        <Model name="nature-tree_oak" position={[0.7, 0, -0.5]} />
        <Who v="female-c" anim="emote-yes" position={[0.1, 0, 0.6]} rotation={[0, 0.6, 0]} />
        <Model name="nature-flower_yellowA" position={[-0.9, 0, 0.8]} />
      </Island>
      <Island size={1.4} position={[4.8, -1.3, -11]}>
        <Model name="platformer-sign" position={[-0.4, 0, 0.3]} rotation={[0, -0.5, 0]} />
        <Model name="nature-tree_default" position={[0.6, 0, -0.6]} />
        <Who v="male-f" position={[0.3, 0, 0.7]} rotation={[0, -0.7, 0]} />
      </Island>
    </group>
  )
}

/* Who we are: a remote team — everyone on their own island, all connected */
function Workspot({ v, flip = 1, extra }) {
  return (
    <group>
      <Model name="furniture-rugRound" position={[0, 0.01, 0]} />
      <Model name="furniture-desk" position={[0, 0, -0.35]} />
      <Model name="furniture-laptop" position={[0.15 * flip, 0.91, -0.35]} rotation={[0, Math.PI, 0]} />
      <Model name="furniture-chairDesk" position={[0, 0, 0.45]} rotation={[0, Math.PI, 0]} />
      <Who v={v} anim="interact-right" offset={flip > 0 ? 0 : 0.4} position={[-0.95 * flip, 0, 0.35]} rotation={[0, 0.5 * flip, 0]} />
      <Model name="furniture-pottedPlant" position={[1.0 * flip, 0, -0.6]} />
      {extra}
    </group>
  )
}
function GlobeR() {
  return (
    <group>
      <group position={[0.6, 1.2, -2.5]} scale={0.6}><Globe /></group>
      <Island size={1.7} position={[-4, -1.7, -6.5]}><Workspot v="female-d" extra={<Model name="food-cup-coffee" position={[-0.25, 0.91, -0.25]} />} /></Island>
      <Island size={1.5} position={[3.9, -2.1, -5.5]} ><Workspot v="male-f" flip={-1} /></Island>
      <Island size={1.4} position={[-4.6, 0.4, -12]}><Workspot v="female-b" /></Island>
      <Island size={1.4} position={[4.8, 0.2, -13]}><Workspot v="male-d" flip={-1} /></Island>
    </group>
  )
}

/* The spark: someone at a desk lamp, notes everywhere */
function SparkR() {
  return (
    <group>
      <Spark />
      <Island size={1.6} position={[3.8, -1.9, -6]}>
        <Model name="furniture-table" position={[0, 0, -0.2]} />
        <Model name="furniture-lampRoundTable" position={[-0.6, 0.8, -0.3]} />
        <Model name="furniture-books" position={[0.5, 0.8, -0.2]} rotation={[0, 0.4, 0]} />
        <Who v="male-a" anim="emote-yes" position={[0.1, 0, 0.8]} rotation={[0, Math.PI + 0.3, 0]} />
        <Model name="furniture-plantSmall1" position={[0.9, 0.8, -0.4]} />
      </Island>
    </group>
  )
}

/* On paper first: the sketching table */
function SketchR() {
  return (
    <group>
      <Sketchbook />
      <Island size={1.7} position={[-4, -1.9, -7]}>
        <Model name="furniture-table" position={[0, 0, -0.2]} />
        <Model name="furniture-books" position={[-0.6, 0.8, -0.1]} />
        <Model name="furniture-cardboardBoxOpen" position={[0.4, 0.8, -0.3]} />
        <Model name="furniture-bookcaseOpenLow" position={[1.1, 0, -0.9]} />
        <Who v="female-c" anim="interact-right" position={[0.5, 0, 0.8]} rotation={[0, Math.PI - 0.4, 0]} />
        <Who v="male-e" position={[-0.7, 0, 0.9]} rotation={[0, Math.PI + 0.4, 0]} />
      </Island>
    </group>
  )
}

/* Built to last: a construction site */
function BuiltR() {
  return (
    <group>
      <Island size={2.3} position={[3.8, -2.2, -7.5]}>
        <Model name="building-floor" position={[-0.6, 0, -0.4]} />
        <Model name="building-column" position={[-1.5, 0, -1.3]} />
        <Model name="building-column" position={[0.3, 0, -1.3]} />
        <Model name="building-wall-window-square" position={[-0.6, 0, -1.35]} rotation={[0, Math.PI / 2, 0]} />
        <Model name="building-stairs-open" position={[1.3, 0, 0.2]} scale={0.6} />
        <Model name="platformer-ladder-long" position={[-1.9, 0, 0.4]} rotation={[-0.2, 0.4, 0]} />
        <Model name="platformer-crate" position={[0.6, 0, 1.2]} />
        <Model name="platformer-crate" position={[1.3, 0, 1.4]} rotation={[0, 0.5, 0]} />
        <Who v="male-e" anim="pick-up" position={[-0.4, 0, 1.2]} rotation={[0, -0.4, 0]} />
      </Island>
      <Island size={1.6} position={[-4, -1.6, -9.5]}>
        <Model name="nature-log_stack" position={[-0.4, 0, -0.3]} />
        <Model name="platformer-crate" position={[0.7, 0, -0.5]} />
        <Model name="furniture-laptop" position={[0.7, 0.8, -0.5]} rotation={[0, Math.PI - 0.3, 0]} />
        <Who v="female-e" anim="interact-left" position={[0.4, 0, 0.6]} rotation={[0, Math.PI + 0.2, 0]} />
      </Island>
    </group>
  )
}

/* Mailsquire: a little post office in the clouds */
function MailR() {
  return (
    <group>
      <Mail />
      <Island size={1.6} position={[-4.2, -1.9, -9.5]}>
        <Model name="platformer-sign" position={[-0.6, 0, 0.2]} rotation={[0, 0.4, 0]} />
        <Model name="furniture-desk" position={[0.3, 0, -0.5]} />
        <Model name="furniture-computerScreen" position={[0.3, 0.91, -0.6]} rotation={[0, 0, 0]} />
        <Who v="female-e" anim="interact-right" position={[0.4, 0, 0.6]} rotation={[0, Math.PI, 0]} />
        <Model name="nature-tree_small" position={[1.2, 0, -0.9]} />
      </Island>
    </group>
  )
}

/* Squirepay: two islands, a real bridge, and money moving across */
function PayR() {
  const coins = useRef()
  useFrame((s) => {
    if (!coins.current) return
    const t = s.clock.elapsedTime
    coins.current.children.forEach((c, i) => {
      const k = ((t * 0.25 + i / 6) % 1)
      c.position.set(-3.6 + k * 7.2, -0.6 + Math.sin(k * Math.PI) * 1.6, -7)
      c.rotation.y = t * 3 + i
    })
  })
  return (
    <group>
      <Island size={1.7} bob={false} position={[-4.6, -2.2, -7]}>
        <Model name="platformer-chest" position={[-0.5, 0, -0.4]} rotation={[0, 0.6, 0]} />
        <Who v="male-f" anim="holding-both" position={[0.7, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} />
        <Model name="nature-tree_oak" position={[-0.9, 0, 0.8]} />
      </Island>
      <Island size={1.7} bob={false} position={[4.6, -2.2, -7]}>
        <Model name="furniture-desk" position={[0.2, 0, -0.5]} />
        <Model name="furniture-laptop" position={[0.2, 0.91, -0.5]} rotation={[0, Math.PI, 0]} />
        <Who v="female-d" anim="emote-yes" position={[-0.7, 0, 0.2]} rotation={[0, -Math.PI / 2, 0]} />
      </Island>
      {[-2.2, 0, 2.2].map((x) => <Model key={x} name="nature-bridge_wood" position={[x, -2.25, -7]} rotation={[0, Math.PI / 2, 0]} />)}
      <group ref={coins}>
        {[0, 1, 2, 3, 4, 5].map((i) => <Model key={i} name={i % 2 ? 'platformer-coin-silver' : 'platformer-coin-gold'} />)}
      </group>
      <Float speed={1.6} rotationIntensity={0.5}><PayCard color={PAL.coral} position={[-2.6, 2, -9]} rotation={[0.2, 0.5, -0.2]} /></Float>
      <Float speed={1.3} rotationIntensity={0.5}><PayCard color={PAL.violet} position={[2.8, 2.3, -10]} rotation={[-0.1, -0.4, 0.25]} /></Float>
    </group>
  )
}

/* CQuence: a film set, a building site and an event, side by side */
function CquenceR() {
  const clap = useRef()
  useFrame((s) => { if (clap.current) clap.current.rotation.z = 0.05 + Math.max(0, Math.sin(s.clock.elapsedTime * 2)) * 0.45 })
  return (
    <group>
      <Island size={1.7} position={[-4.2, -1.9, -7]}>
        <Model name="holiday-lantern" position={[-0.9, 0, -0.6]} scale={0.8} />
        <Model name="furniture-speaker" position={[1, 0, -0.7]} />
        <Who v="female-c" anim="interact-right" position={[0.2, 0, 0.5]} rotation={[0, 0.5, 0]} />
        <Who v="male-e" position={[-0.6, 0, 0.9]} rotation={[0, 0.9, 0]} />
        <group position={[0.3, 2.2, -0.6]} rotation={[0, 0.4, 0]} scale={0.7}>
          <RoundedBox args={[1.9, 1.3, 0.12]} radius={0.04}><Mat color={PAL.ink} /></RoundedBox>
          {[0, 1, 2].map((k) => <mesh key={k} position={[0, 0.2 - k * 0.3, 0.07]}><boxGeometry args={[1.6, 0.03, 0.01]} /><Mat color="#ffffff" /></mesh>)}
          <group ref={clap} position={[-0.95, 0.7, 0]}>
            <group position={[0.95, 0.12, 0]}>
              <mesh><boxGeometry args={[1.9, 0.24, 0.12]} /><Mat color="#ffffff" /></mesh>
              {[0, 1, 2, 3].map((k) => <mesh key={k} position={[-0.7 + k * 0.46, 0, 0.065]} rotation={[0, 0, 0.6]}><boxGeometry args={[0.16, 0.3, 0.01]} /><Mat color={PAL.ink} /></mesh>)}
            </group>
          </group>
        </group>
      </Island>
      <Island size={1.9} position={[4, -2.1, -9]}>
        <Model name="building-floor" position={[-0.5, 0, -0.3]} />
        <Model name="building-column" position={[-1.4, 0, -1.2]} />
        <Model name="building-wall" position={[-0.5, 0, -1.25]} rotation={[0, Math.PI / 2, 0]} />
        <Model name="platformer-crate" position={[0.9, 0, 0.6]} />
        <Who v="male-e" anim="pick-up" position={[0.1, 0, 0.9]} rotation={[0, -0.6, 0]} />
        <group position={[1, 1.1, -0.8]} rotation={[0.3, -0.4, 0.15]} scale={0.6}>
          <mesh><sphereGeometry args={[0.75, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat color={PAL.butter} /></mesh>
          <mesh position={[0, 0.02, 0.35]}><cylinderGeometry args={[0.95, 0.95, 0.05, 40, 1, false, -Math.PI / 2, Math.PI]} /><Mat color={PAL.butter} /></mesh>
        </group>
      </Island>
      <Island size={1.8} position={[-0.6, -3, -14]}>
        <Model name="furniture-rugRound" scale={1.6} />
        <Model name="furniture-table" position={[0, 0, -0.6]} />
        <Model name="furniture-speaker" position={[-1.3, 0, -0.9]} />
        <Model name="furniture-speaker" position={[1.3, 0, -0.9]} />
        <Who v="female-d" anim="emote-yes" position={[-0.5, 0, 0.6]} rotation={[0, 0.3, 0]} />
        <Who v="male-f" position={[0.5, 0, 0.7]} rotation={[0, -0.3, 0]} />
      </Island>
    </group>
  )
}

/* BinjHub: a movie night in the sky */
function BinjR() {
  return (
    <group>
      <group position={[0.4, 0.2, -11]}>
        <Model name="furniture-televisionModern" scale={2.4} />
        <mesh position={[0, 1.55, 0.42]}><planeGeometry args={[3.3, 1.85]} /><meshBasicMaterial color="#FFB85C" /></mesh>
        <mesh position={[0, 1.2, 0.43]}><planeGeometry args={[3.3, 1.1]} /><meshBasicMaterial color="#FF8A5B" transparent opacity={0.5} /></mesh>
        <mesh position={[0.08, 1.55, 0.44]}><circleGeometry args={[0.4, 3]} /><meshBasicMaterial color="#ffffff" /></mesh>
      </group>
      <Island size={2} position={[-3.8, -2, -7]}>
        <Model name="furniture-loungeSofa" position={[0, 0, -0.3]} rotation={[0, 0.5, 0]} />
        <Who v="female-e" anim="emote-yes" position={[-0.9, 0, 0.6]} rotation={[0, 0.8, 0]} />
        <Who v="male-f" position={[0.7, 0, 0.7]} rotation={[0, 0.5, 0]} />
        <Model name="food-fries" position={[1.4, 0, -0.2]} />
        <Model name="food-soda" position={[1.6, 0, 0.3]} />
        <Model name="furniture-speaker" position={[-1.6, 0, -0.9]} />
      </Island>
      <Island size={1.4} position={[4, -1.4, -8]}>
        <Model name="furniture-radio" position={[-0.3, 0, -0.3]} />
        <Who v="female-c" position={[0.3, 0, 0.4]} rotation={[0, -0.6, 0]} />
        <Model name="food-popsicle" position={[0.8, 0, -0.4]} />
      </Island>
      {['food-hot-dog', 'food-donut-sprinkles', 'food-soda', 'platformer-star', 'platformer-heart'].map((n, k) => (
        <Float key={k} speed={1.6 + k * 0.3} floatIntensity={1.4} rotationIntensity={1.2}>
          <Model name={n} position={[-1.8 + k * 1.1, 2.6 + (k % 2) * 0.6, -8 - k * 0.4]} />
        </Float>
      ))}
    </group>
  )
}

/* Built for others: client desks and a rocket ready to launch */
function ClientsR() {
  const rocket = useRef()
  useFrame((s) => { if (rocket.current) rocket.current.position.y = Math.max(0, Math.sin(s.clock.elapsedTime * 0.8)) * 0.6 })
  return (
    <group>
      <Island size={2} bob={false} position={[3.6, -2.3, -8]}>
        <Model name="space-platform_large" scale={1.3} position={[0, 0.01, 0]} />
        <group ref={rocket} position={[0, 0.12, 0]} scale={0.75}>
          <Model name="space-rocket_baseA" />
          <Model name="space-rocket_fuelA" position={[0, 1.92, 0]} />
          <Model name="space-rocket_sidesA" position={[0, 2.52, 0]} />
          <Model name="space-rocket_topA" position={[0, 3.72, 0]} />
        </group>
      </Island>
      <Island size={1.8} position={[-4, -1.8, -6.5]}>
        <Model name="furniture-desk" position={[0, 0, -0.4]} />
        <Model name="furniture-computerScreen" position={[0, 0.91, -0.5]} />
        <Model name="furniture-computerKeyboard" position={[0, 0.91, -0.2]} />
        <Model name="furniture-chairDesk" position={[0, 0, 0.4]} rotation={[0, Math.PI, 0]} />
        <Who v="male-e" anim="interact-right" position={[-1, 0, 0.4]} rotation={[0, 0.5, 0]} />
        <Who v="female-d" anim="emote-yes" offset={0.5} position={[1, 0, 0.5]} rotation={[0, -0.5, 0]} />
      </Island>
      <Island size={1.3} position={[-1.2, 1.4, -13]}>
        <Model name="furniture-laptop" position={[0, 0, 0]} rotation={[0, Math.PI, 0]} scale={1.4} />
        <Who v="male-f" position={[0.6, 0, 0.3]} rotation={[0, -0.5, 0]} />
      </Island>
    </group>
  )
}

/* What's next: three gifts still being wrapped */
function OpenSkyR() {
  return (
    <group>
      <OpenSky />
      {['holiday-present-a-cube', 'holiday-present-b-round', 'holiday-present-a-rectangle'].map((n, i) => (
        <Float key={n} speed={1.2 + i * 0.3} floatIntensity={0.8} rotationIntensity={0.6}>
          <Model name={n} scale={1.6} position={[-3 + i * 3, 0.2 + (i === 1 ? 0.6 : 0), -6.5]} />
        </Float>
      ))}
      <Float speed={1} floatIntensity={1} rotationIntensity={0.8}><Model name="space-astronautA" scale={1.6} position={[4.6, 2.4, -10]} rotation={[0.3, -0.6, 0.4]} /></Float>
      <Model name="space-satelliteDish_large" scale={1.6} position={[-4.8, 1.8, -11]} rotation={[0.2, 0.7, 0]} />
      <Float speed={0.8} rotationIntensity={1.5}><Model name="space-meteor_detailed" position={[3.4, 4.6, -14]} /></Float>
    </group>
  )
}

/* ---------- The road: one continuous ribbon of layered tiles ---------- */
function Road({ curve }) {
  const ref = useRef()
  const COUNT = 520
  useEffect(() => {
    const d = new THREE.Object3D()
    for (let i = 0; i < COUNT; i++) {
      const u = (i / COUNT) * 0.985
      const p = curve.getPointAt(u)
      const t = curve.getTangentAt(u)
      d.position.copy(p).add(new THREE.Vector3(0, -1.35, 0))
      d.lookAt(p.clone().add(t).add(new THREE.Vector3(0, -1.35, 0)))
      d.scale.setScalar(1)
      d.updateMatrix()
      ref.current.setMatrixAt(i, d.matrix)
      // colour by nearest chapter
      let k = 0
      for (let c = 0; c < N; c++) if (u >= sceneU(c) - 0.04) k = c
      ref.current.setColorAt(i, new THREE.Color(i % 4 === 0 ? PAL.white : CHAPTERS[k].tile))
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  }, [curve])
  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <boxGeometry args={[1.5, 0.1, 0.32]} />
      <Mat color="#ffffff" />
    </instancedMesh>
  )
}

/* ---------- camera + sky driven by scroll ---------- */
const SKY = CHAPTERS.map((c) => new THREE.Color(c.sky))
function skyAt(p, out) {
  if (p <= CENTER[0]) return out.copy(SKY[0])
  for (let i = 0; i < N - 1; i++) {
    if (p <= CENTER[i + 1]) return out.copy(SKY[i]).lerp(SKY[i + 1], (p - CENTER[i]) / (CENTER[i + 1] - CENTER[i]))
  }
  return out.copy(SKY[N - 1])
}

function Rig({ curve }) {
  const { scene, camera } = useThree()
  const tmp = useMemo(() => ({ c: new THREE.Color(), look: new THREE.Vector3(), pos: new THREE.Vector3() }), [])
  useEffect(() => {
    scene.background = new THREE.Color(SKY[0])
    scene.fog = new THREE.Fog(SKY[0], 10, 34)
  }, [scene])
  useFrame((state, dt) => {
    store.current = THREE.MathUtils.damp(store.current, store.target, 3.2, Math.min(dt, 0.1))
    const p = store.current
    const u = camU(p)
    tmp.pos.copy(curve.getPointAt(u))
    tmp.look.copy(curve.getPointAt(Math.min(1, u + 0.02)))
    // gentle head-sway from the pointer
    tmp.pos.x += state.pointer.x * 0.35
    tmp.pos.y += state.pointer.y * 0.2
    camera.position.copy(tmp.pos)
    camera.lookAt(tmp.look)
    skyAt(p, tmp.c)
    scene.background.copy(tmp.c)
    scene.fog.color.copy(tmp.c)
  })
  return null
}

const SCENES = { Gateway: GatewayR, Globe: GlobeR, Spark: SparkR, Sketchbook: SketchR, CodeForest: BuiltR, Mail: MailR, Pay: PayR, Cquence: CquenceR, Binj: BinjR, Clients: ClientsR, OpenSky: OpenSkyR }

function World() {
  const curve = useCurve()
  return (
    <>
      <Rig curve={curve} />
      <hemisphereLight args={['#ffffff', '#C9BCFF', 0.9]} />
      <directionalLight position={[6, 10, 4]} intensity={1.5} />
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 5, -5]} scale={[10, 5, 1]} />
        <Lightformer intensity={1.4} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 6, 1]} color="#FFD9CC" />
        <Lightformer intensity={1.4} position={[5, 0, 2]} rotation-y={-Math.PI / 2} scale={[6, 6, 1]} color="#CFF5EA" />
      </Environment>
      <Road curve={curve} />
      {CHAPTERS.map((ch, i) => {
        const S = SCENES[ch.scene]
        return <Anchor key={i} curve={curve} u={sceneU(i)}><Suspense fallback={null}><S /></Suspense></Anchor>
      })}
    </>
  )
}

/* ---------- HTML overlay: intro, captions, act rail, finale ---------- */
const clamp01 = (x) => Math.max(0, Math.min(1, x))
const pad = (n) => String(n).padStart(2, '0')

function Overlay({ onJump }) {
  const root = useRef()
  const intro = useRef()
  const caps = useRef([])
  const fill = useRef()
  const finale = useRef()
  const [active, setActive] = useState(0)
  useEffect(() => {
    let raf = 0
    const c = new THREE.Color()
    let last = -1
    const loop = () => {
      const p = store.current
      if (intro.current) {
        const o = clamp01(1 - p / 0.025)
        intro.current.style.opacity = o
        intro.current.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }
      const span = 0.5 * (CENTER[1] - CENTER[0])
      CENTER.forEach((ctr, i) => {
        const el = caps.current[i]
        if (!el) return
        const o = i === N - 1 ? 0 : clamp01(1 - (Math.abs(p - ctr) / span - 0.3) * 2.4)
        el.style.opacity = o
        el.style.transform = `translateY(${(p - ctr) * -900}px)`
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      })
      if (finale.current) {
        const o = clamp01((p - (CENTER[N - 1] - span * 0.9)) / (span * 0.6))
        finale.current.style.opacity = o
        finale.current.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }
      if (fill.current) fill.current.style.transform = `scaleY(${p})`
      skyAt(p, c)
      const dark = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b < 0.35
      if (root.current) { root.current.dataset.dark = dark ? '1' : '0'; root.current.style.setProperty('--sky', '#' + c.getHexString()) }
      let a = 0
      CENTER.forEach((ctr, i) => { if (p >= ctr - span) a = i })
      if (a !== last) { last = a; setActive(a) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const act = CHAPTERS[active].act
  return (
    <div ref={root} className="sw-ui" data-dark="0">
      <header className="sw-top">
        <Wordmark size={18} color="currentColor" markColor={active === N - 1 ? '#FFF8F0' : '#1E1B3A'} />
        <span className="sw-kicker">Act {ROMAN[act]} · {ACTS[act]}</span>
      </header>

      <section ref={intro} className="sw-intro">
        <span className="sw-kicker">A journey through Mubisquire</span>
        <h1>Come along for the ride.</h1>
        <p>Who we are, how our ideas take shape, and what we’ve built so far. Four acts, eleven stops, one continuous flight.</p>
        <span className="sw-hint" aria-hidden="true"><span className="sw-mouse"><i /></span>Scroll to begin</span>
      </section>

      {CHAPTERS.map((ch, i) => (
        <article key={ch.name} ref={(el) => (caps.current[i] = el)} className="sw-cap" style={{ '--acc': ch.accent }} aria-hidden={active !== i}>
          <span className="sw-act">Act {ROMAN[ch.act]} · {ACTS[ch.act]} <b>{pad(i + 1)} / {pad(N)}</b></span>
          <span className="sw-kicker sw-acc">{ch.kicker}</span>
          <h2>{ch.name}</h2>
          <p>{ch.body}</p>
          {ch.href && <a className="sw-link" href={ch.href} target="_blank" rel="noreferrer">Visit {ch.name} ↗</a>}
        </article>
      ))}

      <section ref={finale} className="sw-finale">
        <span className="sw-kicker">Act IV · {ACTS[3]}</span>
        <h2>Let’s build what’s next, together.</h2>
        <p>{CHAPTERS[N - 1].body} Have a problem worth solving? Tell us about it.</p>
        <div className="sw-ctas">
          <a className="btn sw-btn-solid" href="mailto:hello@mubisquire.com">Contact us</a>
          <a className="btn sw-btn-line" href="#scroll-world" onClick={(e) => { e.preventDefault(); onJump(0) }}>Take the journey again</a>
        </div>
        <span className="sw-mail">hello@mubisquire.com</span>
      </section>

      <nav className="sw-rail" aria-label="Journey">
        <span className="sw-track"><span ref={fill} className="sw-fill" /></span>
        <ol>
          {CHAPTERS.map((ch, i) => (
            <li key={ch.name}>
              {(i === 0 || CHAPTERS[i - 1].act !== ch.act) && <span className="sw-actlabel">{ROMAN[ch.act]} · {ACTS[ch.act]}</span>}
              <button type="button" aria-current={active === i} onClick={() => onJump(i)}>
                <span className="sw-dot" />
                <span className="sw-rnum">{pad(i + 1)}</span>
                <span className="sw-rname">{ch.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}

export default function ScrollWorld() {
  useEffect(() => {
    const max = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const on = () => { store.target = clamp01(window.scrollY / max()) }
    store.target = 0; store.current = 0
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    const prev = document.body.style.background
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      document.body.style.background = prev
    }
  }, [])

  const jump = (i) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: (i === 0 && store.current > 0.9 ? 0 : CENTER[i]) * max, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="sw-stage" aria-hidden="true">
        <Canvas camera={{ position: [0, 0, 12], fov: 55, near: 0.1, far: 80 }} dpr={[1, 1.75]}>
          <World />
        </Canvas>
      </div>
      <Overlay onJump={jump} />
      {/* scroll length: the whole flight is scrubbed by this spacer */}
      <div style={{ height: `${N * 110 + 100}vh` }} />
    </>
  )
}

const CSS = `
.sw-stage { position: fixed; inset: 0; z-index: 0; }
.sw-ui { position: fixed; inset: 0; z-index: 10; pointer-events: none; color: #1E1B3A; --muted: #4A4766; transition: color .6s ease; }
.sw-ui[data-dark="1"] { color: #FFF8F0; --muted: #D9D3F2; }
.sw-ui a, .sw-ui button { pointer-events: auto; }
.sw-kicker { font-weight: 700; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; }
.sw-top { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: calc(20px + env(safe-area-inset-top, 0px)) max(20px, 4vw) 0; }
.sw-top .sw-kicker { color: var(--muted); font-variant-numeric: tabular-nums; }

.sw-intro { position: absolute; left: max(20px, 6vw); top: 50%; transform: translateY(-50%); max-width: 640px; display: flex; flex-direction: column; gap: 18px; }
.sw-intro h1 { margin: 0; font-family: var(--display); font-weight: 800; font-size: clamp(52px, 8.5vw, 124px); line-height: .92; letter-spacing: -0.04em; text-wrap: balance; }
.sw-intro p { margin: 0; font-size: clamp(17px, 1.5vw, 20px); line-height: 1.55; color: var(--muted); max-width: 30em; }
.sw-hint { display: inline-flex; align-items: center; gap: 12px; font-weight: 700; font-size: 13px; margin-top: 8px; }
.sw-mouse { width: 22px; height: 34px; border: 2px solid currentColor; border-radius: 12px; display: inline-flex; justify-content: center; padding-top: 6px; }
.sw-mouse i { width: 3px; height: 7px; border-radius: 2px; background: currentColor; animation: swDrop 1.6s ease-in-out infinite; }
@keyframes swDrop { 0% { transform: translateY(0); opacity: 1 } 70% { transform: translateY(9px); opacity: 0 } 100% { opacity: 0 } }

.sw-cap::before, .sw-intro::before, .sw-finale::before { content: ''; position: absolute; inset: -60px -90px; z-index: -1; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--sky, #F7F5FF) 82%, transparent), transparent); filter: blur(6px); }
.sw-cap { position: absolute; left: max(20px, 6vw); bottom: calc(110px + env(safe-area-inset-bottom, 0px)); max-width: 520px; display: flex; flex-direction: column; gap: 10px; opacity: 0; visibility: hidden; will-change: transform, opacity; }
.sw-act { font-weight: 700; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); display: flex; gap: 10px; align-items: baseline; }
.sw-act b { font-family: var(--display); letter-spacing: 0; font-variant-numeric: tabular-nums; color: inherit; }
.sw-link { pointer-events: auto; font-weight: 700; color: inherit; margin-top: 4px; align-self: flex-start; }
.sw-actlabel { display: block; font-weight: 800; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; padding: 10px 8px 2px 25px; opacity: .7; white-space: nowrap; }
.sw-num { font-family: var(--display); font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums; }
.sw-acc { color: var(--acc); }
.sw-ui[data-dark="1"] .sw-acc { color: #FFD9CC; }
.sw-cap h2 { margin: 0; font-family: var(--serif); font-weight: 400; font-style: italic; font-size: clamp(44px, 6vw, 88px); line-height: .95; letter-spacing: -0.02em; text-wrap: balance; }
.sw-cap p { margin: 0; font-size: clamp(16px, 1.3vw, 18px); line-height: 1.55; color: var(--muted); max-width: 28em; }

.sw-finale { position: absolute; left: 50%; top: 52%; transform: translate(-50%, -30%); width: min(620px, calc(100vw - 40px)); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; opacity: 0; visibility: hidden; }
.sw-finale h2 { margin: 0; font-family: var(--display); font-weight: 800; font-size: clamp(40px, 6vw, 80px); line-height: .95; letter-spacing: -0.035em; text-wrap: balance; }
.sw-finale p { margin: 0; font-size: 18px; line-height: 1.55; color: var(--muted); }
.sw-ctas { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
.sw-btn-solid { background: #FFF8F0; color: #1E1B3A; border-color: #FFF8F0; }
.sw-btn-line { background: transparent; color: #FFF8F0; border-color: rgba(255,248,240,.6); }
.sw-mail { font-size: 13px; color: var(--muted); user-select: all; pointer-events: auto; }

.sw-rail { position: absolute; right: max(16px, 3vw); top: 50%; transform: translateY(-50%); display: flex; gap: 14px; }
.sw-track { position: relative; width: 2px; border-radius: 2px; background: color-mix(in srgb, currentColor 18%, transparent); overflow: hidden; }
.sw-fill { position: absolute; inset: 0; background: currentColor; transform-origin: top; transform: scaleY(0); }
.sw-rail ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.sw-rail button { display: flex; align-items: center; gap: 10px; min-height: 30px; padding: 0 8px; border: 0; background: transparent; color: inherit; cursor: pointer; border-radius: 10px; font: inherit; opacity: .55; transition: opacity .25s ease; }
.sw-rail button:hover, .sw-rail button[aria-current="true"] { opacity: 1; }
.sw-rail button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.sw-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.sw-rail button[aria-current="true"] .sw-dot { transform: scale(1.6); }
.sw-rnum { font-weight: 800; font-size: 12px; font-variant-numeric: tabular-nums; }
.sw-rname { font-weight: 600; font-size: 13px; white-space: nowrap; }

@media (max-width: 760px) {
  .sw-rname { display: none; }
  .sw-actlabel { display: none; }
  .sw-rail { right: 6px; }
  .sw-rail button { min-height: 44px; padding: 0 6px; }
  .sw-cap { right: 64px; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  .sw-intro { right: 64px; }
  .sw-intro h1 { font-size: 44px; }
  .sw-top .sw-kicker { display: none; }
}
@media (prefers-reduced-motion: reduce) { .sw-mouse i { animation: none; } }
`
