'use client'

import { useRef } from 'react'
import { useLiquidGlass } from '../Glass.jsx'
import { Wordmark } from '../logo.jsx'
import { ProductsSection, ServicesSection, ContactSection } from '../company.jsx'

function Lens({ bgRef, label, place, options }) {
  const tag = useRef(null)
  useLiquidGlass(bgRef, {
    place,
    options: { draggable: true, zIndex: 40, ...options },
    onFrame: (g) => {
      const el = tag.current
      if (!el) return
      const w = g.get('width'), h = g.get('height')
      el.style.transform = `translate(${Math.round(g.lensX + w / 2)}px, ${Math.round(g.lensY + h + 12)}px) translateX(-50%)`
    },
  })
  return (
    <span ref={tag} aria-hidden="true" style={{ position: 'fixed', left: 0, top: 0, zIndex: 45, pointerEvents: 'none', padding: '6px 12px', borderRadius: 999, background: '#1E1B3A', color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

const WORDS = [
  { t: 'BUILD', c: '#5B4BDB', o: false },
  { t: 'DESIGN', c: '#FF7A59', o: true },
  { t: 'SHIP', c: '#1F9E7E', o: false },
]

export default function GlassLab() {
  const bgRef = useRef(null)
  const vw = () => window.innerWidth
  const vh = () => window.innerHeight
  const small = () => vw() < 760

  return (
    <>
      <div ref={bgRef} style={{ position: 'relative', overflow: 'hidden', background: '#F7F5FF' }}>
        <section style={{ position: 'relative', minHeight: '100vh' }}>
          {/* Refractable artwork — plain DOM so liquid-glass-js can bend it */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '50%', right: 0, top: '30%', height: 96, background: 'repeating-linear-gradient(90deg, #1E1B3A 0 14px, transparent 14px 28px)', opacity: 0.9 }} />
            <div className="hide-sm" style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', right: '-60px', top: '6%', background: '#FFD9CC', border: '2px solid #1E1B3A' }} />
            <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: 48, left: '-60px', bottom: '-40px', background: '#CFF5EA', border: '2px solid #1E1B3A', transform: 'rotate(-12deg)' }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', left: '40%', bottom: '6%', background: 'repeating-radial-gradient(circle, #5B4BDB 0 8px, #E3DCFF 8px 16px)', border: '2px solid #1E1B3A' }} />
            <div style={{ position: 'absolute', right: '-2vw', bottom: '-3vw', textAlign: 'right' }}>
              {WORDS.map((w) => (
                <div key={w.t} style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(76px, 12vw, 200px)', lineHeight: 0.82, letterSpacing: '-0.05em', color: w.o ? 'transparent' : w.c, WebkitTextStroke: w.o ? `3px ${w.c}` : '0' }}>
                  {w.t}
                </div>
              ))}
            </div>
          </div>

          <header className="wrap" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24 }}>
            <Wordmark size={20} />
            <a className="btn btn-dark" href="#gl-contact" style={{ minHeight: 44 }}>Contact us</a>
          </header>

          <div className="wrap" style={{ position: 'relative', paddingTop: 'clamp(40px, 9vh, 110px)', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1200 }}>
            <span className="eyebrow" style={{ color: 'var(--violet)' }}>A remote-first tech company</span>
            <h1 className="h-display" style={{ fontSize: 'clamp(52px, 7.6vw, 116px)', maxWidth: 680 }}>
              Look closer.<br />We build<br />what you need.
            </h1>
            <p className="lead" style={{ maxWidth: 440 }}>
              Mubisquire builds custom software for startups and larger companies, and runs Mailsquire, Squirepay, CQuence and BinjHub. Drag the glass to take a closer look.
            </p>
          </div>
        </section>

        <div style={{ background: '#fff', borderTop: '2px solid #1E1B3A' }}>
          <ProductsSection id="gl-products" />
          <ServicesSection id="gl-services" />
          <ContactSection id="gl-contact" />
        </div>
      </div>

      <Lens
        bgRef={bgRef}
        label="drag me · lens"
        place={() => (small() ? { x: vw() - 190, y: vh() * 0.3, width: 170, height: 170 } : { x: vw() * 0.52, y: vh() * 0.16, width: 240, height: 240 })}
        options={{ radius: 999, scale: 60, depth: 60, curvature: 2.4, chroma: 0.25, edge: 0.9, glow: 0.15 }}
      />
      <Lens
        bgRef={bgRef}
        label="drag me · pill"
        place={() => (small() ? { x: 20, y: vh() * 0.62, width: 220, height: 90 } : { x: vw() * 0.36, y: vh() * 0.72, width: 340, height: 120 })}
        options={{ radius: 60, scale: 44, depth: 40, chroma: 0.15, tint: 0.08 }}
      />
      <Lens
        bgRef={bgRef}
        label="drag me · frost"
        place={() => (small() ? { x: vw() - 200, y: vh() * 0.68, width: 170, height: 130 } : { x: vw() * 0.74, y: vh() * 0.5, width: 260, height: 190 })}
        options={{ radius: 40, scale: 30, depth: 30, blur: 3, tint: 0.2, convexity: -0.4, chroma: 0.1 }}
      />
    </>
  )
}
