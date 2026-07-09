# Feature: crates/plugin: native screenshot capture and crop

<!-- seeded by ecc-runner from issue #8 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #8: crates/plugin: native screenshot capture and crop

## Happy Path
- [ ] - [ ] Modes: window, webview, element, region
- [ ] - [ ] PNG to configurable dir (default AppData/visual-editor/screenshots/)
- [ ] - [ ] Physical pixel crops with DPR from guest metadata
- [ ] - [ ] Element crop: default 24px CSS padding, configurable
- [ ] - [ ] Async with 5s timeout; error preserves session
- [ ] - [ ] No html2canvas

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
