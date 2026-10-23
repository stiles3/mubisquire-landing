'use client'

import { useEffect, useRef, useState } from 'react'
import { LiquidGlass } from 'liquid-glass-js'

/**
 * Thin React wrapper around liquid-glass-js.
 * The library clones `bgRef.current` (DOM only) and refracts it through an SVG
 * displacement map, so the glass is fixed on screen and the page moves beneath it.
 *
 * place(): returns { x, y } in viewport px — re-run on resize.
 * onFrame(glass): optional per-frame callback (e.g. to make labels follow a dragged lens).
 */
export function useLiquidGlass(bgRef, { place, options, onFrame, refreshKey } = {}) {
  const glassRef = useRef(null)

  useEffect(() => {
    const bg = bgRef.current
    if (!bg) return
    const p = place ? place() : { x: 40, y: 40 }
    const glass = new LiquidGlass({ background: bg, draggable: false, zIndex: 40, ...options, ...p })
    glassRef.current = glass

    const onResize = () => {
      if (place) {
        const q = place()
        if (q.width || q.height) glass.set({ width: q.width ?? glass.get('width'), height: q.height ?? glass.get('height') })
        glass.moveTo(q.x, q.y)
      }
      glass.refresh()
    }
    window.addEventListener('resize', onResize)
    // Re-clone once fonts and late layout have settled.
    const t1 = setTimeout(() => glass.refresh(), 400)
    document.fonts?.ready?.then(() => glassRef.current === glass && glass.refresh())

    let raf = 0
    if (onFrame) {
      const loop = () => { onFrame(glass); raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }
    return () => {
      clearTimeout(t1)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      glass.destroy()
      glassRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  return glassRef
}

export function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}
