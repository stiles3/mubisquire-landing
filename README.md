# Mubisquire landing

The Mubisquire website: a scroll-through 3D journey — four acts, eleven stops, one continuous camera flight. Built with react-three-fiber, drei and Kenney CC0 models.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

### With Docker

```bash
docker build -t mubisquire-landing .
docker run -p 3000:3000 mubisquire-landing   # http://localhost:3000
```

The image uses Next.js `output: 'standalone'`, so it ships only the server, static assets and `public/models`.

## Where things live

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
