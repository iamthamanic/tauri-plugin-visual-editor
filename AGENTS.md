# AGENTS.md — tauri-plugin-visual-editor

Dieses Dokument ist die **verbindliche Projektkarte** für Menschen und KI-Agenten.
Lies es zuerst, bevor du Code änderst.

## Was ist dieses Projekt?

Universelles **Tauri-2-Plugin** für visuelle UI-Inspektion in Desktop-Apps. Entwickler selektieren DOM-Elemente, erstellen Screenshots und kopieren **Context Bundles** in AI-Editoren wie Cursor.

**PRD:** [docs/PRD.md](docs/PRD.md)  
**Architektur:** [docs/architecture.md](docs/architecture.md)

### Was dieses Repo **ist**

- Tauri-Plugin (Rust) + Guest-JS + Inspector-Window-UI + optionales SDK
- Monorepo für Plugin-Entwicklung und Examples
- Brücke zwischen laufender Tauri-App und AI-Codeeditoren

### Was dieses Repo **nicht** ist

- Kein AI-Editor / kein Cursor-Ersatz
- Keine Host-Anwendung (nur Examples)
- Kein Tauri-1-Support

---

## Tech Stack (verbindlich)

| Bereich | Technologie | Notiz |
|---------|-------------|-------|
| Plugin Core | Rust, Tauri 2, serde | `crates/plugin`, `crates/core` |
| Guest (injected) | TypeScript, DOM APIs | `packages/guest` → `@tauri-plugin/visual-editor` |
| Inspector UI | React, Tailwind | `packages/inspector-app` only |
| SDK | TypeScript | `packages/sdk` — framework-neutral |
| Examples | react-vite, vanilla | Release-Blocker für 0.1.0 |
| Tests / Bench | TypeScript, Cargo test | `bench/`, CI smoke |

**Nicht verwenden:** html2canvas, React Fiber introspection, Source-Map-Hacks für Component Names

---

## Architektur

```
tauri-plugin-visual-editor/
├── crates/
│   ├── core/           # Session, selector, bundle export (canonical logic)
│   └── plugin/         # Tauri plugin, hub, commands, screenshot
├── packages/
│   ├── guest/          # Injected overlay + DOM measurement
│   ├── sdk/            # data-inspector-* helpers
│   └── inspector-app/  # Global inspector window UI
├── examples/
│   ├── react-vite/
│   └── vanilla/
├── bench/
└── docs/
```

### Schichtenregeln

1. **Selector + Bundle-Logik nur in `crates/core`** — Guest sendet `ElementSnapshot`, kein duplizierter Selector in TS
2. **Guest = DOM only** — keine Business-Logik, kein Session-State
3. **Inspector Hub (Rust) = Single Source of Truth** — Push-Events, `getState` nur Hydration
4. **Host-Apps** dürfen SDK nutzen; Plugin funktioniert ohne SDK auf L1 (DOM-only)

---

## Sprache & Naming

| Bereich | Sprache |
|---------|---------|
| UI (Inspector-Fenster, Fehler) | Deutsch |
| Context Bundle Export | Englisch |
| Code, Commits, Issues | Englisch |
| npm scope | `@tauri-plugin/visual-editor` |

Canonical attributes: `data-inspector-component`, `data-inspector-file`, `data-inspector-id`, `data-inspector-entity`

---

## Validation

- **Checks:** `npm run checks`
- **Rust:** `cargo test --workspace`, `cargo clippy --workspace`
- **E2E:** `npm run test:e2e` (Playwright via @verify-ui when ready)

Run checks before push. Do not bypass hooks.

---

## UI / Design

- Styleguide: [docs/UI_STYLEGUIDE.md](docs/UI_STYLEGUIDE.md) — gilt nur für `packages/inspector-app`
- Host-App-UI wird nicht gestylt (nur dünnes Overlay)

---

## Security

Fünf Gates (alle UND): Cargo feature, config.enabled, config.allow, Tauri capability, devModeAllowed.

Siehe [docs/architecture.md#security-model](docs/architecture.md#security-model).

---

## QA Pipeline

```
@pingpong-solution  →  @implement  →  @verify-ui
```

- Design artifacts: `.qa/design/`
- Acceptance: `.qa/acceptance/`
- Project config: `.qa/project.yaml`

---

## README

Keep README in sync when adding features, scripts, or env vars.
