import { NodeIO } from '@gltf-transform/core'
import { getBounds } from '@gltf-transform/core'
import { readdirSync } from 'node:fs'
const io = new NodeIO()
for (const f of readdirSync('public/models')) {
  const doc = await io.read('public/models/' + f)
  const b = getBounds(doc.getRoot().listScenes()[0])
  const s = b.max.map((v, i) => (v - b.min[i]).toFixed(2))
  console.log(f.replace('.glb', '').padEnd(36), 'size', s.join(' x '), ' minY', b.min[1].toFixed(2))
}
