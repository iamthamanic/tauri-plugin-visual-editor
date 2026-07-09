# Feature: packages/inspector-app: Inspector window UI

<!-- seeded by ecc-runner from issue #12 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #12: packages/inspector-app: Inspector window UI

## Happy Path
- [x] WebviewWindow label `visual-inspector`, URL `tauri://visual-editor/index.html`
- [x] Label conflict → clear init error
- [x] Target dropdown + pin mode
- [x] Selected elements list with stale/webview_closed badges
- [x] Capture thumbnails with primary/include controls
- [x] Buttons: Copy Context Bundle, Copy Screenshot Image, Copy Path, Clear, Enable, Revalidate, Hard Reload
- [x] German UI per docs/UI_STYLEGUIDE.md
- [x] getState hydration + push updates only

## Edge Cases
- [ ] (from .qa/edge-cases.md + @implement)

## Regression
- [ ] Feed and topic routes still load

## Assumptions
- none

## Screenshots
| Step | Filename |
|------|----------|
| 1 | `01-happy-path.png` |

## Implementation Notes
<!-- filled after coding -->
