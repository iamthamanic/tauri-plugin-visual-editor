# Feature: crates/plugin: IPC commands API

<!-- seeded by ecc-runner from issue #6 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #6: crates/plugin: IPC commands API

## Happy Path
- [ ] - [ ] `open()` default autoEnable=false; `open({ autoEnable: true })` enables
- [ ] - [ ] `disable` removes overlay state but preserves session
- [ ] - [ ] `toggle` only affects inspector window visibility
- [ ] - [ ] Integration tests with mock webview

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
