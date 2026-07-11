# Changelog

All notable changes to this project are documented here. Version numbers stay in sync across the Rust crates and `@iamthamanic/visual-editor-sdk`.

## [0.1.2] - 2026-07-12

### Added

- Screenshot editor undo/redo: **Zurück** / **Vor** toolbar buttons and **Cmd/Ctrl+Z** (plus redo via **Cmd+Shift+Z** / **Ctrl+Y**) in guest, inspector-app, and SDK overlay

## [0.1.1] - 2026-07-10

### Fixed

- Embedded toolbar no longer disappears after Hard Reload on slow hosts (e.g. Scriptony): restore waits for page readiness, verifies toolbar mount, extends retry window to 15s, and falls back to `open_overlay_for_app`.

## [0.1.0] - 2026-07-10

### Added

- Tauri 2 visual inspector plugin with embedded overlay (default `overlayMode: embedded`)
- Element picker, multi-select, native screenshots, context bundle clipboard export
- Context panel with composer chips, screenshot editor, DevTools toggle
- Five-gate security model (dev-safe by default)
- Optional `@iamthamanic/visual-editor-sdk` for `data-inspector-*` metadata
- Examples: `react-vite`, `vanilla`

[0.1.2]: https://github.com/iamthamanic/tauri-plugin-visual-editor/releases/tag/v0.1.2
[0.1.1]: https://github.com/iamthamanic/tauri-plugin-visual-editor/releases/tag/v0.1.1
[0.1.0]: https://github.com/iamthamanic/tauri-plugin-visual-editor/releases/tag/v0.1.0
