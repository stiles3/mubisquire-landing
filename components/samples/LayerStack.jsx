'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, MeshTransmissionMaterial, Environment, Lightformer, Html, ContactShadows, Float } from '@react-three/drei'
import * as THREE from 'three'
import { Wordmark } from '../logo.jsx'
import { ProductsSection, ServicesSection, ContactSection } from '../company.jsx'

const LAYERS = [
  { name: 'Mailsquire', color: '#C9BCFF' },
  { name: 'Squirepay', color: '#FFB8A1' },
  { name: 'CQuence', color: '#9FE9D4' },
  { name: 'BinjHub', color: null }, // glass
]

function Slab({ i, layer, spread }) {
  const ref = useRef()
  const tag = useRef()
  useFrame((_, dt) => {
    if (tag.current) tag.current.style.opacity = Math.max(0, spread.current * 1.4 - 0.4).toFixed(2)
    if (!ref.current) return
    const targetY = i * (0.42 + spread.current * 0.55) - 0.8
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, targetY, 6, dt)
  })
  return (
    <group ref={ref} position={[0, i * 0.42 - 0.8, 0]}>
      <RoundedBox args={[2.8, 0.26, 2.8]} radius={0.12} smoothness={5} castShadow>
        {layer.color ? (
          <meshStandardMaterial color={layer.color} roughness={0.3} metalness={0.05} />
        ) : (
          <MeshTransmissionMaterial backside thickness={0.6} roughness={0.05} transmission={1} ior={1.35} chromaticAberration={0.25} anisotropy={0.2} distortion={0.3} distortionScale={0.4} temporalDistortion={0.1} color="#ffffff" samples={6} resolution={512} />
        )}
      </RoundedBox>
      <Html position={[1.75, 0, 1.45]} center distanceFactor={5} style={{ pointerEvents: 'none' }}>
        <span ref={tag} style={{ opacity: 0, transition: 'none', display: 'inline-block', padding: '6px 12px', borderRadius: 999, background: '#1E1B3A', color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', fontFamily: 'var(--body)' }}>
          0{i + 1} · {layer.name}
        </span>
      </Html>
    </group>
  )
}

function Stack({ hovered }) {
  const g = useRef()
  const spread = useRef(0)
  useFrame((state, dt) => {
    spread.current = THREE.MathUtils.damp(spread.current, hovered ? 1 : 0, 4, dt)
    if (!g.current) return
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, -0.7 + state.pointer.x * 0.6, 4, dt)
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, 0.45 - state.pointer.y * 0.3, 4, dt)
  })
  return (
    <group ref={g} rotation={[0.45, -0.7, 0]}>
      {/* a little object living between the layers, seen through the glass */}
      <Float speed={2} floatIntensity={0.6}>
        <mesh position={[0, 0.2, 0]}>
          <icosahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#FF7A59" roughness={0.3} />
        </mesh>
      </Float>
      {LAYERS.map((l, i) => <Slab key={l.name} i={i} layer={l} spread={spread} />)}
    </group>
  )
}

export default function LayerStack() {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ background: 'linear-gradient(180deg, #F7F5FF 0%, #FFF4EE 100%)', minHeight: '100vh' }}>
      <header className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24 }}>
        <Wordmark size={20} />
        <nav style={{ display: 'flex', gap: 10 }}>
          <a className="btn btn-light hide-sm" href="#ls-how" style={{ minHeight: 44 }}>Products</a>
          <a className="btn btn-dark" href="#ls-cta" style={{ minHeight: 44 }}>Contact us</a>
        </nav>
      </header>

      <section className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'center', gap: 24, minHeight: 'calc(100vh - 92px)', paddingTop: 24, paddingBottom: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span className="eyebrow" style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 999, background: '#fff', border: '2px solid var(--ink)' }}>Four products. One team.</span>
          <h1 className="h-display" style={{ fontSize: 'clamp(50px, 6.4vw, 96px)' }}>
            Our products.<br />Your software.<br /><span style={{ color: 'var(--coral)' }}>One team.</span>
          </h1>
          <p className="lead">Mailsquire, Squirepay, CQuence and BinjHub are built and run by Mubisquire. The same remote-first team builds custom software for startups and larger companies. Hover the stack to pull it apart.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn btn-dark" href="#ls-cta">Contact us</a>
            <a className="btn btn-light" href="#ls-how">See our products</a>
          </div>
        </div>
        <div
          style={{ position: 'relative', height: 'min(640px, 80vh)', minHeight: 380 }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <Canvas shadows camera={{ position: [0, 1.2, 7.2], fov: 38 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 8, 4]} intensity={1.4} castShadow />
            <Environment resolution={256}>
              <Lightformer intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
              <Lightformer intensity={2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#FFD9CC" />
              <Lightformer intensity={2} position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#CFF5EA" />
              <Lightformer intensity={1.5} position={[0, 1, -6]} scale={[8, 3, 1]} color="#E3DCFF" />
            </Environment>
            <Stack hovered={hovered} />
            <ContactShadows position={[0, -1.9, 0]} opacity={0.35} scale={10} blur={2.6} far={4} color="#1E1B3A" />
          </Canvas>
          <span className="eyebrow" style={{ position: 'absolute', left: '50%', bottom: 8, transform: 'translateX(-50%)', fontSize: 11, color: 'var(--ink-2)', opacity: hovered ? 0 : 1, transition: 'opacity .3s' }}>Hover to see all four products</span>
        </div>
      </section>

      <div style={{ background: '#fff', borderTop: '2px solid var(--ink)' }}>
        <ProductsSection id="ls-how" />
        <ServicesSection id="ls-services" />
      </div>
      <ContactSection id="ls-cta" />
    </div>
  )
}
