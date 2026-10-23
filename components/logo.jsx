'use client'

// Mubisquire mark: three isometric layers stacked with a gap between them.
const rh = (cx, cy, w, h) => `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`

function markSvg(fill = '#000', size = 512) {
  const c = 256, w = 170, h = 92, step = 78
  const top = rh(c, 256 - step, w, h)
  const mid = rh(c, 256, w, h)
  const bot = rh(c, 256 + step, w, h)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
<defs>
<mask id="m1" maskUnits="userSpaceOnUse"><rect width="512" height="512" fill="#fff"/><polygon points="${top}" fill="#000" stroke="#000" stroke-width="36" stroke-linejoin="round"/></mask>
<mask id="m2" maskUnits="userSpaceOnUse"><rect width="512" height="512" fill="#fff"/><polygon points="${mid}" fill="#000" stroke="#000" stroke-width="36" stroke-linejoin="round"/></mask>
</defs>
<polygon points="${bot}" fill="${fill}" stroke="${fill}" stroke-width="18" stroke-linejoin="round" mask="url(#m2)"/>
<polygon points="${mid}" fill="${fill}" stroke="${fill}" stroke-width="18" stroke-linejoin="round" mask="url(#m1)"/>
<polygon points="${top}" fill="${fill}" stroke="${fill}" stroke-width="18" stroke-linejoin="round"/>
</svg>`
}

export const logoDataUrl = (fill = '#000') =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markSvg(fill))

export function LogoMark({ size = 28, color = 'currentColor' }) {
  return (
    <img
      src={logoDataUrl(color)}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  )
}

export function Wordmark({ size = 22, color = '#1E1B3A', markColor }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color }}>
      <LogoMark size={size + 8} color={markColor || color} />
      <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: size, letterSpacing: '-0.03em' }}>
        mubisquire
      </span>
    </span>
  )
}
