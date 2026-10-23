'use client'

import { LiquidMetal } from '@paper-design/shaders-react'
import { Wordmark } from '../logo.jsx'
import { PRODUCTS, IN_THE_WORKS, ServicesSection, ContactSection } from '../company.jsx'

const SHAPES = ['circle', 'daisy', 'metaballs', 'diamond']
const LOGO = '/mark.png'

const metal = {
  colorBack: '#00000000',
  colorTint: '#FFFFFF',
  repetition: 2.4,
  softness: 0.18,
  shiftRed: 0.35,
  shiftBlue: 0.35,
  distortion: 0.08,
  contour: 0.45,
  angle: 70,
  speed: 0.9,
}

export default function LiquidLogo() {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(120% 80% at 50% 0%, #FFFFFF 0%, #EEEBFA 55%, #E4E0F4 100%)' }}>
      <header className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, paddingBottom: 24 }}>
        <Wordmark size={20} />
        <a className="btn btn-light" href="#ll-cta" style={{ minHeight: 44 }}>Contact us</a>
      </header>

      {/* HERO — Paper Shaders LiquidMetal applied to the Mubisquire mark */}
      <section className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 8, paddingBottom: 90 }}>
        <div style={{ width: 'min(380px, 42vh, 80vw)', aspectRatio: '1 / 1' }}>
          <LiquidMetal image={LOGO} {...metal} scale={0.85} fit="contain" style={{ width: '100%', height: '100%' }} />
        </div>
        <h1 className="h-display" style={{ fontSize: 'clamp(60px, min(12vw, 18vh), 170px)', marginTop: 8, background: 'linear-gradient(180deg, #1E1B3A 30%, #6C67A0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          mubisquire
        </h1>
        <p className="lead" style={{ textAlign: 'center', marginTop: 18 }}>
          A remote-first tech company. We build software for startups and larger companies, and run products of our own. Built in Africa, for the world.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a className="btn btn-dark" href="#ll-products" style={{ boxShadow: '0 5px 0 #B9A8FF' }}>See our products</a>
          <a className="btn btn-light" href="#ll-cta">Contact us</a>
        </div>
      </section>

      {/* PRODUCTS — each gets its own liquid-metal shape */}
      <section id="ll-products" style={{ padding: '40px 0 70px' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
            <span className="eyebrow" style={{ color: 'var(--violet)' }}>Our products</span>
            <h2 className="h-display" style={{ fontSize: 'clamp(38px, 5.5vw, 68px)', textWrap: 'balance' }}>Products we build and run.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {PRODUCTS.map((c, i) => (
              <article key={c.name} style={{ borderRadius: 28, padding: 28, background: 'rgba(255,255,255,.7)', border: '1.5px solid rgba(30,27,58,.12)', boxShadow: '0 20px 50px rgba(30,27,58,.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: 88, height: 88 }} aria-hidden="true">
                  <LiquidMetal {...metal} shape={SHAPES[i % SHAPES.length]} colorTint={c.tint} scale={0.8} style={{ width: '100%', height: '100%' }} />
                </div>
                <span className="eyebrow" style={{ fontSize: 11, marginTop: 8 }}>{c.kind}</span>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 28, margin: 0, letterSpacing: '-0.02em' }}>{c.name}</h3>
                <p style={{ margin: 0, color: 'var(--ink-2)', lineHeight: 1.55 }}>{c.body}</p>
                {c.href && <a href={c.href} target="_blank" rel="noreferrer" style={{ fontWeight: 700, marginTop: 'auto' }}>Visit {c.name} ↗</a>}
              </article>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span className="eyebrow" style={{ marginRight: 6 }}>Coming next</span>
            {IN_THE_WORKS.map((w) => (
              <span key={w.name} style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline', padding: '10px 14px', borderRadius: 999, border: '1.5px dashed rgba(30,27,58,.35)' }}>
                <strong style={{ fontFamily: 'var(--display)' }}>{w.name}</strong>
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{w.note}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <ServicesSection id="ll-services" />
      <ContactSection id="ll-cta" dark />
    </div>
  )
}
