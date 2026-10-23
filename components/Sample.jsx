'use client'

import dynamic from 'next/dynamic'

// 3D / WebGL renders in the browser only.
const SAMPLES = {
  'scroll-world': dynamic(() => import('./samples/ScrollWorld.jsx'), { ssr: false }),
}

export default function Sample({ id }) {
  const C = SAMPLES[id]
  return <C />
}
