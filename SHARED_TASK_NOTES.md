# Shared Task Notes — tauri-plugin-visual-editor

Cross-issue context for `@ecc-runner`.

## Product decisions (frozen v0.2)

- Main output: **Context Bundle** (not Prompt Generator)
- npm: `@tauri-plugin/visual-editor`
- Selector logic: **Rust only** (`crates/core`)
- Guest: DOM measurement only
- Security: 5 AND gates

## Implementation order

1. #1 Monorepo scaffold
2. #2–#4 crates/core (parallel after #1)
3. #5–#7 crates/plugin hub + commands + security
4. #9 packages/guest overlay
5. #11 packages/inspector-app UI
6. #8, #10, #12 plugin/guest follow-ups
7. #13 SDK
8. #14–#15 examples (release blockers)
9. #16–#18 bench, CI, docs

## Docs

- PRD: docs/PRD.md
- Architecture: docs/architecture.md
- Context format: docs/context-bundle-format.md
