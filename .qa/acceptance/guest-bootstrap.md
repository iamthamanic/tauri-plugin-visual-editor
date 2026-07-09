# Feature: packages/guest: bootstrap, overlay, and selection engine

<!-- seeded by ecc-runner from issue #10 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #10: packages/guest: bootstrap, overlay, and selection engine

## Happy Path
- [ ] - [ ] Minimal bootstrap on enable only (not when disabled)
- [ ] - [ ] Embedded asset injection via Rust eval (no dynamic import)
- [ ] - [ ] Inspect mode default; Space/Alt passthrough
- [ ] - [ ] Click=replace, Shift+click=add/remove, Esc clears hover only
- [ ] - [ ] Hover upward heuristic per architecture
- [ ] - [ ] 1px borders, numbered selected labels, no dimming
- [ ] - [ ] Sends ElementSnapshot to hub on selection

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
