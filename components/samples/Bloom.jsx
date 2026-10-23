'use client'

import { useRef } from 'react'
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'
import { useLiquidGlass, useViewport } from '../Glass.jsx'
import { Wordmark } from '../logo.jsx'
import { ProductsSection, ServicesSection, ContactSection } from '../company.jsx'

const navRect = () => {
  const w = Math.min(820, window.innerWidth - 24)
  return { x: Math.round((window.innerWidth - w) / 2), y: 16, width: w, height: 64 }
}

export default function Bloom() {
  const bgRef = useRef(null)
  useViewport()
  useLiquidGlass(bgRef, {
    place: navRect,
    options: { radius: 32, scale: 34, depth: 22, curvature: 2.6, chroma: 0.18, blur: 1.5, glow: 0.12, edge: 0.8, tint: 0.28, tintColor: '#ffffff' },
  })
  const r = navRect()

  return (
    <>
      <div ref={bgRef} style={{ position: 'relative' }}>
        {/* HERO — ShaderGradient (react-three-fiber under the hood) */}
        <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
            <ShaderGradientCanvas style={{ position: 'absolute', inset: 0 }} pixelDensity={1.2} fov={45} lazyLoad={false} pointerEvents="none">
              <ShaderGradient
                control="props"
                type="waterPlane"
                animate="on"
                uSpeed={0.22}
                uStrength={3.2}
                uDensity={1.3}
                uFrequency={0}
                uAmplitude={0}
                positionX={0}
                positionY={0.9}
                positionZ={-0.3}
                rotationX={45}
                rotationY={0}
                rotationZ={0}
                color1="#FFC4B0"
                color2="#D8CCFF"
                color3="#C6F6E8"
                lightType="3d"
                brightness={1.05}
                grain="off"
                cAzimuthAngle={170}
                cPolarAngle={70}
                cDistance={4.4}
                cameraZoom={1}
              />
            </ShaderGradientCanvas>
          </div>
          <div className="wrap" style={{ position: 'relative', width: '100%', paddingTop: 120, paddingBottom: 120, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
            <span className="eyebrow" style={{ padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,.55)', border: '1.5px solid rgba(30,27,58,.2)' }}>
              A remote-first tech company
            </span>
            <h1 className="h-display" style={{ fontSize: 'clamp(54px, 10vw, 148px)', maxWidth: 1100 }}>
              Software that<br />thinks in <span style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }}>layers.</span>
            </h1>
            <p className="lead" style={{ color: '#2F2B52', textAlign: 'center' }}>
              We build software for startups and larger companies, and we run products of our own: Mailsquire, Squirepay, CQuence and BinjHub. Built in Africa, for the world.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a className="btn btn-dark" href="#features">See our products</a>
              <a className="btn btn-ghost" href="#cta">Contact us</a>
            </div>
          </div>
        </section>

        <ProductsSection id="features" />
        <ServicesSection id="services" />
        <ContactSection id="cta" />
      </div>

      {/* Fixed nav — sits on top of the liquid-glass lens */}
      <header className="glass-nav" style={{ left: r.x, top: r.y, width: r.width, height: r.height }}>
        <Wordmark size={20} />
        <div className="links">
          <a className="nl" href="#features">Products</a>
          <a className="nl" href="#services">Build with us</a>
          <a className="nl" href="#cta">Contact</a>
        </div>
        <a className="btn btn-dark" href="#cta" style={{ minHeight: 44, padding: '0 18px', boxShadow: 'none' }}>Contact us</a>
      </header>
    </>
  )
}
