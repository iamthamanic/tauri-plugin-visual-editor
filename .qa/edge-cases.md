# tauri-plugin-visual-editor — project-specific edge cases for verify-ui

Extends the universal matrix in the verify-ui skill.

## Global

| ID | Case | Fail if |
|----|------|---------|
| G-01 | Plugin feature off | Any bootstrap/IPC activity measurable |
| G-02 | Production release build | Inspector enable without allowInProduction |
| G-03 | Inspector UI locale | Labels not German per AGENTS.md |

## Inspector / Overlay

| ID | Case | Fail if |
|----|------|---------|
| I-01 | Inspect mode click | Host app receives click event |
| I-02 | Space passthrough | Selection fires while Space held |
| I-03 | Shift+click | Element not added/removed from selection |
| I-04 | Pin mode | Target changes on focus switch |
| I-05 | Esc | Selections cleared (should remain) |

## Multi-WebView

| ID | Case | Fail if |
|----|------|---------|
| M-01 | Modal webview | Not listed in target selector |
| M-02 | Webview destroyed | Status not `webview_closed` |
| M-03 | Two visible webviews | Hover works on non-target webview |

## Screenshot

| ID | Case | Fail if |
|----|------|---------|
| S-01 | Element off-viewport | Auto-scroll occurs |
| S-02 | Capture timeout | Selection lost |
| S-03 | Copy Screenshot Image | PNG not pasteable as image |

## Context Bundle

| ID | Case | Fail if |
|----|------|---------|
| C-01 | L1 only | Bundle contains invented file paths |
| C-02 | No issue entered | Empty Issue block in clipboard |
| C-03 | After reload | Selections not marked stale |

## Security

| ID | Case | Fail if |
|----|------|---------|
| SEC-01 | Missing capability | Command succeeds |
| SEC-02 | Release + no allowInProduction | enable() succeeds |
