# Visual Editor — React + Vite Reference Host

Release-blocker example demonstrating full `tauri-plugin-visual-editor` integration.

## Prerequisites

- Rust toolchain
- Node.js 20+
- From repo root: `npm install` and `npm run checks` (builds guest + inspector assets)

## Dev workflow

```bash
# From repo root
npm install
npm run build:sdk

# Run the Tauri host app
cd examples/react-vite
npm run tauri:dev
```

Or from the monorepo root:

```bash
npm run tauri:dev --workspace=example-react-vite
```

## Using the inspector

1. Start the app (`npm run tauri:dev`)
2. Click **Inspector aktivieren** or **Inspector öffnen** in the demo toolbar
3. Hover and click elements annotated with `data-inspector-*` (via SDK)
4. Optionally open **Modal-WebView öffnen** for a second target webview

## What's included

| Piece | Location |
|-------|----------|
| Plugin registration | `src-tauri/src/lib.rs` |
| Dev capability `visual-editor:all` | `src-tauri/capabilities/default.json` |
| Plugin config | `src-tauri/tauri.conf.json` → `plugins.visualEditor` |
| SDK metadata demo | `src/App.tsx`, `src/ModalApp.tsx` |
| Multi-webview demo | `src/lib/openModalWebview.ts` → label `modal` |

## Commands

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server on port 1420 |
| `npm run tauri:dev` | Full Tauri dev (frontend + Rust) |
| `npm run build` | Production frontend build |
| `npm run tauri:build` | Production app bundle |
