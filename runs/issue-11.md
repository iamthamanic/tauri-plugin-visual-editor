# Issue #11 — Guest DOM measurement and revalidate

## Done
- `measureElement`: bounds, visibility, curated computedStyle (max 20), attributes
- `visibleBounds` + `fullBounds` for partial visibility
- `OFF_VIEWPORT_CAPTURE_ERROR` for off-viewport capture
- `revalidateElement` via querySelector → valid | not_found
- Open shadow DOM path traversal; closed shadow hint
- Vitest unit tests (10 cases)
