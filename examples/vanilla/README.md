# Visual Editor — Vanilla Reference Host

Release-blocker example with **manual** `data-inspector-*` attributes (L1 DOM-only, no SDK).

## Dev workflow

```bash
# From repo root
npm install
npm run build:guest
npm run build:inspector

cd examples/vanilla
npm run tauri:dev
```

## Using the inspector

1. Start the app (`npm run tauri:dev` on port **1421**)
2. Click **Inspector aktivieren** or **Inspector öffnen**
3. Hover and click the annotated HTML elements

## Manual attributes

```html
<article
  data-inspector-component="HeroCard"
  data-inspector-file="index.html"
  data-inspector-id="hero-card"
  data-inspector-entity="landing"
>
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (:1421) |
| `npm run tauri:dev` | Full Tauri dev |
| `npm run build` | Production frontend |
