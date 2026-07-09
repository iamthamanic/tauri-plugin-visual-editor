# Feature: crates/core: selector algorithm and stable-class heuristic

<!-- seeded by ecc-runner from issue #3 on 2026-07-09 — @implement may refine -->

## Intent
From GitHub issue #3: crates/core: selector algorithm and stable-class heuristic

## Happy Path
- [ ] - [ ] Priority: data-inspector-id > component+id > id > aria > stable class > nth-child
- [ ] - [ ] Legacy fallback for data-component/data-file (undocumented)
- [ ] - [ ] Conservative unstable-class detection (hash patterns)
- [ ] - [ ] Open shadow DOM boundary hints in selector string
- [ ] - [ ] Unit tests with fixture snapshots (L1, L2, L3 inputs)

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
