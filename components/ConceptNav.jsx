'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const CONCEPTS = [
  { href: '/', label: 'Journey' },
  { href: '/bloom', label: 'Bloom' },
  { href: '/liquid-logo', label: 'Liquid Logo' },
  { href: '/glass-lab', label: 'Glass Lab' },
  { href: '/layer-stack', label: 'Layer Stack' },
]

export default function ConceptNav() {
  const path = usePathname()
  return (
    <nav className="switcher" aria-label="Landing page concepts">
      {CONCEPTS.map((c) => (
        <Link key={c.href} href={c.href} aria-current={path === c.href ? 'page' : undefined}>{c.label}</Link>
      ))}
    </nav>
  )
}
