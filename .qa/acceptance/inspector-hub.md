# Feature: crates/plugin: Tauri plugin registration and Inspector Hub

<!-- seeded by ecc-runner from issue #5 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #5: crates/plugin: Tauri plugin registration and Inspector Hub

## Happy Path
- [ ] - [ ] Plugin registers with `tauri-plugin` builder pattern
- [ ] - [ ] Hub holds `HubState`; thread-safe
- [ ] - [ ] `on_webview_created` auto-registers webviews
- [ ] - [ ] Push events to inspector window on state change
- [ ] - [ ] `getState` for one-time hydration
- [ ] - [ ] Feature flag `visual-inspector`: off = zero compiled runtime

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
