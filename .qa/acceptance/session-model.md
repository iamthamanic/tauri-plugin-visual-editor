# Feature: crates/core: session model, types, and hub state

<!-- seeded by ecc-runner from issue #2 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #2: crates/core: session model, types, and hub state

## Happy Path
- [ ] - [ ] `ElementSnapshot`, `SelectedElement`, `Capture`, `Session`, `WebViewRegistration` types
- [ ] - [ ] Session supports unlimited selections and captures
- [ ] - [ ] `primary_capture_id`, element status (`valid`, `stale_after_reload`, `not_found`, `webview_closed`)
- [ ] - [ ] Unit tests for session mutations (add/remove element, set primary capture)
- [ ] - [ ] No Tauri dependency in `crates/core`

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
