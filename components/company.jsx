'use client'

import { useState } from 'react'

/* ------------------------------------------------------------
   Mubisquire — single source of truth for company copy
------------------------------------------------------------- */
export const EMAIL = 'hello@mubisquire.com'

export const COMPANY = {
  name: 'Mubisquire',
  oneLiner: 'Mubisquire is a remote-first tech company. We build software for startups and larger companies, and we run products of our own.',
  market: 'Built in Africa, for the world.',
}

export const PRODUCTS = [
  {
    name: 'Mailsquire',
    kind: 'Email',
    tint: '#E3DCFF',
    body: 'Email marketing and a transactional email API in one place, with AI that writes custom templates for you.',
    points: ['Campaigns & newsletters', 'Email API for receipts and OTPs', 'AI-generated templates'],
  },
  {
    name: 'Squirepay',
    kind: 'Payments',
    tint: '#FFD9CC',
    body: 'A payment gateway for businesses that also helps people keep track of and manage their subscriptions.',
    points: ['Accept online payments', 'Keep track of subscriptions', 'Manage subscriptions in one place'],
  },
  {
    name: 'CQuence',
    kind: 'Projects',
    tint: '#CFF5EA',
    body: 'Run film and TV productions, construction projects and events from one account, with an AI assistant that answers from your project’s own records.',
    points: ['Scenes, cast, crew & call sheets', 'Site stages, logs & inspections', 'Guests, vendors, seating & budgets'],
    href: 'https://cquence.mubisquire.com',
  },
  {
    name: 'BinjHub',
    kind: 'Entertainment',
    tint: '#FFF1B8',
    body: 'Streaming and a community hub where creators share their work and find their audience.',
    points: ['Watch and discover', 'Creator community', 'Share and collaborate'],
  },
]

export const IN_THE_WORKS = [
  { name: 'Content Squire', note: 'In the works' },
  { name: 'Squabble', note: 'Game engine' },
  { name: 'Company Brain', note: 'In the works' },
]

export const SERVICES = [
  { title: 'Custom web & mobile apps', body: 'We design and build products end to end, from first screens to launch.' },
  { title: 'AI features & automation', body: 'Assistants, generation and workflow automation, built into the tools your team already uses.' },
  { title: 'Payments & fintech integration', body: 'Checkout, subscriptions and payouts, built by the team behind Squirepay.' },
]

export const CLIENTS = ['SEVNINE', 'Bani']

/* ------------------------------------------------------------
   Shared sections (light theme, used by four of the samples)
------------------------------------------------------------- */
const h2 = { fontSize: 'clamp(38px, 5.5vw, 68px)', textWrap: 'balance' }

export function CopyEmail({ dark = false }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setDone(true); setTimeout(() => setDone(false), 1600) } catch {
      const r = document.createRange(); const el = document.getElementById('mq-email'); if (el) { r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
    }
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      <span id="mq-email" style={{ fontWeight: 700, fontSize: 17, userSelect: 'all', color: dark ? '#fff' : 'var(--ink)' }}>{EMAIL}</span>
      <button type="button" onClick={copy} className="btn" style={{ minHeight: 40, padding: '0 14px', fontSize: 13, background: 'transparent', color: dark ? '#fff' : 'var(--ink)', borderColor: dark ? 'rgba(255,255,255,.5)' : 'var(--ink)' }}>
        {done ? 'Copied' : 'Copy'}
      </button>
    </span>
  )
}

export function ProductsSection({ id = 'products', variant = 'card' }) {
  const soft = variant === 'soft'
  return (
    <section id={id} style={{ padding: '100px 0 70px' }}>
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          <span className="eyebrow" style={{ color: 'var(--violet)' }}>Our products</span>
          <h2 className="h-display" style={h2}>Products we build and run.</h2>
          <p className="lead">Four live products, each built and run by the Mubisquire team.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          {PRODUCTS.map((p) => (
            <article key={p.name} className={soft ? '' : 'card'} style={soft
              ? { borderRadius: 28, padding: 28, background: 'rgba(255,255,255,.72)', border: '1.5px solid rgba(30,27,58,.12)', boxShadow: '0 20px 50px rgba(30,27,58,.08)', display: 'flex', flexDirection: 'column', gap: 12 }
              : { background: p.tint, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="eyebrow" style={{ fontSize: 11, alignSelf: 'flex-start', padding: '6px 10px', borderRadius: 999, background: soft ? p.tint : 'rgba(255,255,255,.7)' }}>{p.kind}</span>
              <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 28, letterSpacing: '-0.02em' }}>{p.name}</h3>
              <p style={{ margin: 0, color: 'var(--ink-2)', lineHeight: 1.55 }}>{p.body}</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)', lineHeight: 1.7, fontSize: 14 }}>
                {p.points.map((x) => <li key={x}>{x}</li>)}
              </ul>
              {p.href && <a href={p.href} target="_blank" rel="noreferrer" style={{ fontWeight: 700, marginTop: 'auto' }}>Visit {p.name} ↗</a>}
            </article>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <span className="eyebrow" style={{ marginRight: 6 }}>Coming next</span>
          {IN_THE_WORKS.map((w) => (
            <span key={w.name} style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline', padding: '10px 14px', borderRadius: 999, border: '1.5px dashed rgba(30,27,58,.35)', background: 'rgba(255,255,255,.5)' }}>
              <strong style={{ fontFamily: 'var(--display)' }}>{w.name}</strong>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{w.note}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ServicesSection({ id = 'services' }) {
  return (
    <section id={id} style={{ padding: '60px 0 70px' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="eyebrow" style={{ color: 'var(--violet)' }}>Build with us</span>
          <h2 className="h-display" style={h2}>Software for startups and larger companies.</h2>
          <p className="lead">The team that runs our own products builds yours.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600 }}>Teams we’ve built with:</span>
            {CLIENTS.map((c) => (
              <span key={c} style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, padding: '6px 14px', borderRadius: 12, background: '#fff', border: '1.5px solid rgba(30,27,58,.15)' }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '2px solid var(--ink)' }}>
          {SERVICES.map((s) => (
            <div key={s.title} style={{ padding: '22px 0', borderBottom: '1.5px solid rgba(30,27,58,.18)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 24, letterSpacing: '-0.02em' }}>{s.title}</h3>
              <p style={{ margin: 0, color: 'var(--ink-2)', lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactSection({ id = 'contact', dark = false, bg }) {
  return (
    <section id={id} style={{ padding: '40px 0 160px' }}>
      <div className="wrap">
        <div style={{ borderRadius: 40, padding: 'clamp(40px, 7vw, 84px) 28px', background: bg || (dark ? '#1E1B3A' : 'linear-gradient(120deg, #FFD9CC, #E3DCFF 55%, #CFF5EA)'), color: dark ? '#fff' : 'var(--ink)', border: dark ? '0' : '2px solid var(--ink)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <span className="eyebrow">Remote-first · {COMPANY.market}</span>
          <h2 className="h-display" style={{ fontSize: 'clamp(40px, 6vw, 80px)', textWrap: 'balance' }}>Let’s build something.</h2>
          <p className="lead" style={{ textAlign: 'center', color: dark ? '#D9D5F0' : 'var(--ink-2)' }}>Tell us about your product or project, or ask about any of ours.</p>
          <a className="btn btn-dark" href={`mailto:${EMAIL}`} style={dark ? { background: '#fff', color: '#1E1B3A', borderColor: '#fff', boxShadow: 'none' } : undefined}>Contact us</a>
          <CopyEmail dark={dark} />
        </div>
      </div>
    </section>
  )
}
