# tauri-plugin-visual-editor

Visual Inspector plugin for **Tauri 2** — select UI elements, capture screenshots, and copy **Context Bundles** into AI editors like Cursor.

> Bridge between your running Tauri app and AI-assisted development. Not a Cursor replacement.

**Repository:** [github.com/iamthamanic/tauri-plugin-visual-editor](https://github.com/iamthamanic/tauri-plugin-visual-editor)

## Features (V1 target)

- Visual element inspection with hover + multi-select
- Native screenshots (window, webview, element crop)
- Structured **Context Bundle** export for AI editors
- Optional SDK for `data-inspector-*` metadata
- Five-gate security model (dev-safe by default)

## Documentation

- [PRD](docs/PRD.md)
- [Architecture](docs/architecture.md)
- [Integration Guide](docs/integration-guide.md)
- [Plugin API](docs/plugin-api.md)
- [Context Bundle Format](docs/context-bundle-format.md)

## Prerequisites

- Rust 1.77+ (stable)
- Node.js 20+
- npm 10+
- Tauri 2 CLI (`cargo install tauri-cli`)

## Setup

```bash
git clone https://github.com/iamthamanic/tauri-plugin-visual-editor.git
cd tauri-plugin-visual-editor
npm install
```

## Development

```bash
# Run example app (once scaffolded)
npm run dev --workspace=examples/react-vite

# Rust checks
cargo test --workspace
cargo clippy --workspace -- -D warnings
```

## Checks (quality gate)

```bash
npm run checks
```

Runs workspace lint, typecheck, Rust tests, and clippy.

## Project structure

```
tauri-plugin-visual-editor/
├── crates/              # Rust plugin + core logic
├── packages/            # guest, sdk, inspector-app
├── examples/            # react-vite, vanilla
├── bench/               # idle overhead benchmarks
├── docs/                # PRD, architecture
├── .qa/                 # design, acceptance, agent config
└── AGENTS.md            # agent instructions
```

## Install in a host app (target API)

```bash
cargo add tauri-plugin-visual-editor
npm install @tauri-plugin/visual-editor
```

See [docs/integration-guide.md](docs/integration-guide.md) and [docs/plugin-api.md](docs/plugin-api.md) for registration and capabilities.

## Agent workflow

1. `@project-setup` — bootstrap (done)
2. `@pingpong-solution` — design before features
3. `@implement` — code + acceptance artifact
4. `@verify-ui` — browser verification

See [AGENTS.md](AGENTS.md).

## License

MIT — see [LICENSE](LICENSE)
