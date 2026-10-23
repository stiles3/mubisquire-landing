'use client'

import dynamic from 'next/dynamic'

// 3D / WebGL concepts render in the browser only.
const SAMPLES = {
  'scroll-world': dynamic(() => import('./samples/ScrollWorld.jsx'), { ssr: false }),
  bloom: dynamic(() => import('./samples/Bloom.jsx'), { ssr: false }),
  'liquid-logo': dynamic(() => import('./samples/LiquidLogo.jsx'), { ssr: false }),
  'glass-lab': dynamic(() => import('./samples/GlassLab.jsx'), { ssr: false }),
  'layer-stack': dynamic(() => import('./samples/LayerStack.jsx'), { ssr: false }),
}

export default function Sample({ id }) {
  const C = SAMPLES[id]
  return <C />
}
