# tauri-plugin-visual-editor

[![Checks](https://github.com/iamthamanic/tauri-plugin-visual-editor/actions/workflows/checks.yml/badge.svg)](https://github.com/iamthamanic/tauri-plugin-visual-editor/actions/workflows/checks.yml)
[![crates.io](https://img.shields.io/crates/v/tauri-plugin-visual-editor.svg)](https://crates.io/crates/tauri-plugin-visual-editor)
[![npm](https://img.shields.io/npm/v/@tauri-plugin/visual-editor-sdk.svg)](https://www.npmjs.com/package/@tauri-plugin/visual-editor-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Visual Inspector plugin for **Tauri 2** — select UI elements, capture screenshots, and copy **Context Bundles** into AI editors like Cursor.

> Bridge between your running Tauri app and AI-assisted development. Not a Cursor replacement.

## Features

- Embedded floating toolbar (no extra window required)
- Visual element inspection with hover + multi-select
- Native screenshots (window, webview, element crop)
- Context composer with element + screenshot chips
- Structured **Context Bundle** export for AI editors
- Optional SDK for `data-inspector-*` metadata (recommended)
- DevTools toggle, hard reload, five-gate security model

## Quick install (host app)

### 1. Rust

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-visual-editor = { version = "0.1", features = ["visual-inspector"] }
```

```rust
// src-tauri/src/lib.rs
.plugin(tauri_plugin_visual_editor::init())
```

### 2. Config

```json
// src-tauri/tauri.conf.json
{
  "plugins": {
    "visualEditor": {
      "enabled": true,
      "allow": true,
      "overlayMode": "embedded",
      "autoOpen": true,
      "overlayDeferMs": 100
    }
  }
}
```

### 3. Capabilities

```json
"permissions": ["core:default", "visual-editor:all"]
```

No frontend import required — the overlay auto-injects into your webview.

### 4. Best bundle quality (recommended)

```bash
npm install @tauri-plugin/visual-editor-sdk
```

```tsx
import { InspectorMeta } from '@tauri-plugin/visual-editor-sdk/react';

<InspectorMeta component="SaveButton" file="src/SaveButton.tsx" id="save">
  <button>Save</button>
</InspectorMeta>
```

**Full guide:** [docs/quick-start.md](docs/quick-start.md)

## Packages

| Package | Registry | Purpose |
|---------|----------|---------|
| `tauri-plugin-visual-editor` | [crates.io](https://crates.io/crates/tauri-plugin-visual-editor) | Tauri plugin (includes guest overlay) |
| `@tauri-plugin/visual-editor-sdk` | [npm](https://www.npmjs.com/package/@tauri-plugin/visual-editor-sdk) | `InspectorMeta` + metadata helpers |

Hosts do **not** need `npm install @tauri-plugin/visual-editor` — guest JS ships inside the Rust crate.

## Update in consuming apps

```bash
cargo update -p tauri-plugin-visual-editor
npm update @tauri-plugin/visual-editor-sdk
```

See [docs/consuming-apps.md](docs/consuming-apps.md).

## Examples

```bash
git clone https://github.com/iamthamanic/tauri-plugin-visual-editor.git
cd tauri-plugin-visual-editor
npm install
npm run checks
npm run tauri:dev --workspace=example-react-vite
```

- [examples/react-vite](examples/react-vite/) — React + Vite + SDK metadata
- [examples/vanilla](examples/vanilla/) — vanilla JS + manual `data-inspector-*` attrs

## Documentation

| Doc | Description |
|-----|-------------|
| [Quick Start](docs/quick-start.md) | Complete host setup checklist |
| [Integration Guide](docs/integration-guide.md) | Multi-webview, security, API usage |
| [Plugin API](docs/plugin-api.md) | Commands and types |
| [Context Bundle Format](docs/context-bundle-format.md) | Export structure |
| [Architecture](docs/architecture.md) | Hub, guest injection, screenshots |
| [Release](docs/RELEASE.md) | Publishing workflow |

## Development

```bash
npm run checks          # quality gate (Rust + TypeScript)
cargo test --workspace
npm run tauri:dev --workspace=example-react-vite
```

## Project structure

```
tauri-plugin-visual-editor/
├── crates/              # Rust plugin + core
├── packages/            # guest, sdk, inspector-app
├── examples/            # react-vite, vanilla
├── docs/
└── templates/           # dependabot + local patch templates for hosts
```

## License

MIT — see [LICENSE](LICENSE)
