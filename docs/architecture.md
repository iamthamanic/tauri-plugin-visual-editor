# Architecture — Tauri Visual Editor

Technical architecture for the Visual Inspector plugin. Product decisions live in [PRD.md](./PRD.md).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Tauri Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Main WebView │  │ Side WebView │  │ Modal WebView│       │
│  │  (guest JS)  │  │  (guest JS)  │  │  (guest JS)  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           ▼                                  │
│              ┌────────────────────────┐                      │
│              │   Inspector Hub (Rust)   │  ← Single Source    │
│              │   crates/plugin + core │     of Truth         │
│              └───────────┬────────────┘                      │
│                          │ push events                       │
│                          ▼                                   │
│              ┌────────────────────────┐                      │
│              │  Inspector Window UI   │                      │
│              │  packages/inspector-app│                      │
│              │  tauri://visual-editor │                      │
│              └────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    Cursor / AI Editor
                    (Context Bundle paste)
```

---

## Package Responsibilities

### `crates/core`

**Canonical business logic (Rust).**

| Module | Responsibility |
|--------|----------------|
| `session` | Session state: elements, captures, issue text, target, pin |
| `selector` | Selector algorithm from `ElementSnapshot` |
| `relationships` | Overlap, DOM parent-child, visual containment from stored bounds |
| `bundle` | Context Bundle text export (English, fixed template) |
| `types` | Shared structs: `ElementSnapshot`, `Capture`, `WebViewRegistration` |

**Rule:** Selector logic lives **only** in Rust. Guest sends raw facts; core builds selectors and bundle output.

### `crates/plugin`

**Tauri 2 plugin surface.**

| Module | Responsibility |
|--------|----------------|
| `lib.rs` | Plugin registration, builder |
| `hub` | Hub state machine, event broadcast |
| `commands` | IPC command handlers |
| `screenshot` | Native window/webview capture + crop |
| `clipboard` | System clipboard (text + PNG) |
| `reload` | Hard reload orchestration |
| `permissions` | Capability permission definitions |
| `config` | Runtime config parsing (enabled, allow, allowInProduction) |
| `webview` | `on_webview_created` registration, bootstrap injection |

### `packages/guest` (`@tauri-plugin/visual-editor`)

**Injected into host WebViews. DOM access only.**

| Module | Responsibility |
|--------|----------------|
| `bootstrap` | Minimal init: RPC, event bus, API registration |
| `activate` | Dynamic load overlay/selection on enable |
| `overlay` | Hover highlight, bounding boxes, labels |
| `selection` | Click handling, multi-select, passthrough (Space/Alt) |
| `measure` | `getBoundingClientRect`, curated `computedStyle`, attributes |
| `revalidate` | `querySelector` + remeasure, send new snapshot to hub |

**Injection model:**

```
WebView created → (if fully enabled) bootstrap.js injected via init script
enable()        → eval/inject overlay + selection from embedded assets
disable()       → remove overlay, stop listeners, disconnect from hub
```

No `import()` from host context. Rust holds embedded JS strings.

### `packages/inspector-app`

**Standalone `WebviewWindow` for inspector UI.**

- Label default: `visual-inspector` (configurable; conflict = init error)
- URL: `tauri://visual-editor/index.html`
- React + Tailwind (inspector UI only — not host apps)
- Hydration: `getState()` once on open, then push events only

### `packages/sdk`

**Framework-neutral metadata helpers (optional for host apps).**

```ts
setInspectorMetadata(element, metadata)
getInspectorMetadata(element)
createInspectorAttributes(metadata)

// Optional React peer:
<InspectorMeta component="..." file="..." id="...">
```

Canonical attributes:

```html
data-inspector-component="TimelineClip"
data-inspector-file="src/features/timeline/TimelineClip.tsx"
data-inspector-id="timeline.clip.clip_123"
data-inspector-entity="clip_123"
```

Legacy fallback (undocumented): `data-component`, `data-file`, `data-inspect-id`

---

## Inspector Hub

### WebView Registration

Automatic via Tauri lifecycle `on_webview_created`:

```
WebViewID, Label, Window, URL, Status
```

- Inspector already enabled → bootstrap immediately
- Inspector disabled → register only; bootstrap on later `enable()` for all registered webviews

### State Model

```rust
HubState {
  enabled: bool,
  inspector_window_open: bool,
  active_target_webview_id: Option<String>,
  pin_target: bool,
  webviews: HashMap<WebViewId, WebViewRegistration>,
  session: Session {
    selected_elements: Vec<SelectedElement>,
    captures: Vec<Capture>,
    primary_capture_id: Option<String>,
    issue_text: Option<String>,
  },
  settings: PersistentSettings,
}
```

### Event Flow (push-only)

```
guest overlay → IPC event → hub updates state → emit to inspector-app UI
```

No polling. `getState` only for cold hydration when inspector window opens.

---

## Commands API

| Command | Effect |
|---------|--------|
| `enable` | Activate inspector; inject bootstrap into all registered webviews |
| `disable` | Remove overlays; stop events; session + window remain |
| `open` | Open inspector window (`autoEnable: false` default) |
| `open({ autoEnable: true })` | Open + enable |
| `close` | Close inspector window; session preserved |
| `toggle` | Toggle window open/close; enable state unchanged |
| `capture` | Screenshot per mode (window/webview/element/region) |
| `revalidate` | Re-resolve selections in target webview |
| `clearSession` | Clear selections and captures |
| `setTargetWebView` | Change active target |
| `pinTargetWebView` | Pin target |
| `unpinTargetWebView` | Unpin |
| `exportContext` | Generate context bundle string |
| `getState` | Return hub state (hydration / debug) |

---

## Screenshot Pipeline

```
guest: bounds + DPR + scroll + webview_id
  ↓
Rust: native capture (window | webview)
  ↓
Rust: crop (element | region) in physical pixels
  ↓
Save PNG → <AppData>/visual-editor/screenshots/
  ↓
Hub: add to session.captures; set primary if first/last
```

| Mode | Capture source |
|------|----------------|
| `window` | Entire OS window (all visible webviews) |
| `webview` | Active target webview only |
| `element` | Webview capture + crop with padding (default 24 CSS px) |
| `region` | Webview capture + drag rectangle crop |

Async with 5s timeout. On failure: selection preserved, bundle copy still works without screenshot.

---

## Context Bundle Format

Fixed English template. See [context-bundle-format.md](./context-bundle-format.md).

Sections:

- Target (window, webview, URL, timestamp)
- Primary screenshot (+ additional if included)
- Selected elements (numbered)
- Relationship hints (DOM / Visual separate)
- Issue (only if user entered text)

Copy workflow: **two actions** — bundle text + screenshot image separately.

---

## Overlay Interaction

| Input | Behavior |
|-------|----------|
| Click | Select element (replace) |
| Shift+Click | Add/remove from selection |
| Space hold | Passthrough — no hover, full host interaction |
| Alt+Click | Passthrough click |
| Esc | Clear hover; keep selections and pin |

### Hover Heuristic (upward walk from `elementFromPoint`)

1. Nearest `data-inspector-id`
2. Nearest `data-inspector-component`
3. Interactive element (button, input, a, [role])
4. Sensible size element
5. Leaf element

Inspector window also offers: Select parent / Select child.

### Overlay Visuals

- Hover: 1px border + small label (component or tag)
- Selected: numbered borders (#1, #2, …)
- No dimming overlay in V1

---

## Security Model

All five gates must pass (AND):

```
Cargo feature visual-inspector
  AND config.enabled
  AND config.allow
  AND Tauri capability permits command
  AND devModeAllowed (debug OR allowInProduction)
```

### Capability Permission Sets

| Set | Commands |
|-----|----------|
| `visual-editor:default` | open, close, getState, exportContext |
| `visual-editor:inspect` | enable, disable, toggle, setTarget, pin/unpin, revalidate, clearSession |
| `visual-editor:capture` | capture |
| `visual-editor:all` | all above |

Missing capability → Tauri permission error + plugin diagnostic log.

### Production Modes

| Mode | Behavior |
|------|----------|
| Feature off | No code, no bootstrap, zero overhead |
| Feature on, disabled | Plugin compiled; no webview injection |
| Feature on, enabled + all gates | Full inspector |

---

## Hard Reload Lifecycle

```
webview.reload()
  → Tauri re-runs init script (bootstrap)
  → bootstrap reconnects to hub
  → if was enabled: overlay restored
  → all selections: stale_after_reload
  → user clicks Revalidate → found | not_found
```

---

## Selector Algorithm (Rust, canonical)

Priority:

1. `[data-inspector-id="..."]`
2. `[data-inspector-component="..."][data-inspector-id="..."]`
3. `#id` if unique
4. Stable aria-label / role / name
5. Stable class selectors (conservative heuristic)
6. `nth-child` fallback

Unstable classes (CSS modules hashes) → skip to next fallback.

Revalidate: guest runs `querySelector(stored_selector)` in browser.

---

## Settings Persistence

| Persistent (disk) | Session-only (hub) |
|-------------------|-------------------|
| theme | selectedElements |
| shortcut | captures |
| overlayColor | issueText |
| cropPadding | activeTarget |
| screenshotDir | pinTarget |

---

## Performance Targets

| State | Requirement |
|-------|-------------|
| Feature off | No plugin activity |
| Feature on, disabled | No webview injection |
| Enabled, idle | <0.05% CPU, <100KB heap, no DOM nodes in host |

Verified via `bench/idle-overhead.ts` in examples (documented release criteria, not hard CI gate).

---

## Build & Versioning

Monorepo, synchronized `0.1.0`:

```
crates/plugin
crates/core
packages/guest
packages/sdk
packages/inspector-app
```

Release blockers for 0.1.0:

- `examples/react-vite`
- `examples/vanilla`

---

## Known V1 Limitations

- CSP strict apps may block eval injection
- Cross-origin iframes not inspectable
- Closed shadow roots: outer host only
- Canvas inner semantics require SDK metadata
- Two paste actions for Cursor (text + image)
- No session persistence across app restart

---

## Related Docs

- [PRD.md](./PRD.md)
- [context-bundle-format.md](./context-bundle-format.md)
- [plugin-api.md](./plugin-api.md) (TODO)
- [roadmap.md](./roadmap.md) (TODO)
