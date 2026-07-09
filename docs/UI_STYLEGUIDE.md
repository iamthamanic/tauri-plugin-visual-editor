# UI Styleguide — Inspector App

Applies **only** to `packages/inspector-app`. Host app overlays use minimal inline styles (1px borders).

## Principles

- DevTools aesthetic: compact, information-dense, low visual noise
- German UI labels; English only in exported Context Bundle
- No dimming overlays; preserve host app visibility

## Stack

- React 18+
- Tailwind CSS 3+
- System font stack

## Color Tokens

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--inspector-bg` | `#f8f9fa` | `#1e1e1e` | Panel background |
| `--inspector-border` | `#d0d7de` | `#3d3d3d` | Dividers |
| `--inspector-accent` | `#0969da` | `#58a6ff` | Primary actions |
| `--inspector-hover` | `#0969da33` | `#58a6ff33` | Selection highlight ref |
| `--inspector-text` | `#1f2328` | `#e6edf3` | Body text |
| `--inspector-muted` | `#656d76` | `#8b949e` | Secondary text |
| `--inspector-danger` | `#cf222e` | `#f85149` | Errors, stale |

Theme: `system` | `light` | `dark` (persistent setting)

## Typography

| Element | Size | Weight |
|---------|------|--------|
| Panel title | 14px | 600 |
| Section header | 12px | 600 uppercase |
| Body | 13px | 400 |
| Mono (selectors, paths) | 12px | 400, `font-mono` |

## Components

### InspectorPanel

Main layout: header (target selector + pin) → element list → captures → issue textarea → action bar

### Toolbar

Actions: Enable/Disable, Capture, Revalidate, Clear, Hard Reload

### SelectedElements

Numbered list; stale/webview_closed badges; Select parent/child buttons

### ScreenshotPreview

Thumbnail grid; primary star; include/exclude checkbox

### SettingsDialog

Theme, shortcut, overlay color, cropPadding, screenshotDir

## States

Every async action: **loading** | **success** | **error** (German message)

Empty states:

- No selections: „Keine Elemente ausgewählt“
- No captures: „Kein Screenshot“
- Disabled: „Inspector deaktiviert“ + Enable button

## Spacing

- Panel padding: `12px`
- Section gap: `16px`
- List item gap: `8px`

## Accessibility

- Focus visible on all interactive elements
- Keyboard: Tab through actions; Enter activates primary button
- ARIA labels on icon-only buttons (German)
