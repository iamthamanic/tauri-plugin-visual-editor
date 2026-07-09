# Feature: packages/guest: DOM measurement and revalidate

<!-- seeded by ecc-runner from issue #11 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #11: packages/guest: DOM measurement and revalidate

## Happy Path
- [ ] - [ ] partial visibility: visibleBounds + fullBounds
- [ ] - [ ] off-viewport: controlled capture failure message
- [ ] - [ ] revalidate: found → valid; not found → not_found; relationships recalculated in core
- [ ] - [ ] Max 20 CSS properties sent to hub
- [ ] - [ ] Shadow DOM: open traverse, closed → hint only

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
