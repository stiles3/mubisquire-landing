# Mubisquire landing

The Mubisquire website: a scroll-through 3D journey (home) plus four alternative landing concepts.

| Route | Concept | Built with |
|---|---|---|
| `/` | **Journey** — four acts, eleven stops, one continuous camera flight | react-three-fiber, drei, Kenney CC0 models |
| `/bloom` | Moving gradient hero with a liquid-glass nav | @shadergradient/react, liquid-glass-js |
| `/liquid-logo` | Liquid-metal Mubisquire mark | @paper-design/shaders-react |
| `/glass-lab` | Draggable liquid-glass lenses | liquid-glass-js |
| `/layer-stack` | Four product layers, glass top, hover to explode | react-three-fiber, drei |

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Where things live

- `components/company.jsx` — all company copy (products, services, clients, contact email). Edit here and every page updates.
- `components/samples/ScrollWorld.jsx` — the journey: chapter text (`CHAPTERS`), 3D scenes per stop, camera path and overlay.
- `components/models.jsx` — loads `public/models/*.glb`, recolours them to the brand palette, animated `Character`, floating `Island`.
- `public/models/` — 3D models (Kenney, CC0; see `CREDITS.txt`).
- `scripts/pack-models.mjs` — re-exports chosen Kenney models as self-contained GLBs:
  `node scripts/pack-models.mjs <path-to-unzipped-kenney-kits> public/models`

## Replacing a model

Drop a `.glb` into `public/models/`, add its name to `MODEL_FILES` in `components/models.jsx`, then use
`<Model name="your-file-name" />` in a scene. Keep each file under ~2–3 MB.

## Fonts

Self-hosted via Fontsource (Bricolage Grotesque, Manrope, Instrument Serif) — no Google Fonts request at build or runtime.
