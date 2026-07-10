# Quick Start — Tauri Visual Inspector

Complete setup for a **new or existing Tauri 2 app**. Estimated time: ~5 minutes.

## What you get

- Floating toolbar in your app (no extra window by default)
- Click elements → screenshots → copy **Context Bundle** into Cursor
- With SDK metadata: component names, file paths, stable IDs in the bundle (**recommended**)

---

## Checklist

| Step | Required | Where |
|------|----------|--------|
| 1. Rust plugin + feature | ✅ | `src-tauri/Cargo.toml` |
| 2. `.plugin(...)` one line | ✅ | `src-tauri/src/lib.rs` |
| 3. Plugin config | ✅ | `src-tauri/tauri.conf.json` |
| 4. Capability permission | ✅ | `src-tauri/capabilities/*.json` |
| 5. SDK + `InspectorMeta` | ⭐ Recommended | Host frontend (React/Vanilla) |

Steps 1–4 work without frontend code. Step 5 gives **L3 selectors** and much better AI context.

---

## 1. Rust dependency

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-visual-editor = { version = "0.1", features = ["visual-inspector"] }
```

## 2. Register plugin

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_visual_editor::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 3. Plugin config

```json
// src-tauri/tauri.conf.json
{
  "plugins": {
    "visualEditor": {
      "enabled": true,
      "allow": true,
      "overlayMode": "embedded",
      "autoOpen": true,
      "overlayDeferMs": 100
    }
  }
}
```

| Field | Default | Meaning |
|-------|---------|---------|
| `enabled` / `allow` | — | Master switches (both must allow) |
| `overlayMode` | `embedded` | Toolbar injected into your webview |
| `autoOpen` | `true` | Show toolbar after app start |
| `overlayDeferMs` | `100` | Wait before injecting overlay (host paints first). Use `0` for instant toolbar |
| `allowInProduction` | `false` | Set `true` only if you ship inspector in release builds |

## 4. Capabilities

```json
// src-tauri/capabilities/default.json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "visual-editor:all"
  ]
}
```

Replace `"main"` with your window label(s). Add `"visual-inspector"` only if `overlayMode: "window"`.

---

## 5. Best bundle quality — SDK metadata (recommended)

Install once:

```bash
npm install @iamthamanic/visual-editor-sdk
```

### React

Wrap interactive UI you want to inspect:

```tsx
import { InspectorMeta } from '@iamthamanic/visual-editor-sdk/react';

export function SaveButton() {
  return (
    <InspectorMeta component="SaveButton" file="src/SaveButton.tsx" id="save">
      <button type="button">Save</button>
    </InspectorMeta>
  );
}
```

| Prop | Attribute | Example |
|------|-----------|---------|
| `component` | `data-inspector-component` | `SaveButton` |
| `file` | `data-inspector-file` | `src/SaveButton.tsx` |
| `id` | `data-inspector-id` | `save` |
| `entity` | `data-inspector-entity` | `checkout` (optional) |

### Vanilla HTML / other frameworks

```html
<button
  data-inspector-component="SaveButton"
  data-inspector-file="src/SaveButton.html"
  data-inspector-id="save-btn"
>
  Save
</button>
```

Or in JS:

```ts
import { setInspectorMetadata } from '@iamthamanic/visual-editor-sdk';

setInspectorMetadata(button, {
  component: 'SaveButton',
  file: 'src/SaveButton.tsx',
  id: 'save-btn',
});
```

### Without SDK (L1 DOM-only)

Still works — selectors fall back to DOM path / classes. Context bundles are usable but harder for AI to map to your source files.

---

## Where is the inspector UI?

You do **not** add a React component for the toolbar.

```
Your Tauri app starts
    → plugin registers webview
    → (after overlayDeferMs) guest JS injects toolbar into your webview
    → icon bar top-right: Reload | Screenshot | Picker | Context | DevTools
```

No `import` of overlay CSS/JS in your host entry — the Rust plugin ships the guest bundle.

Optional alternative: `overlayMode: "window"` opens a separate `visual-inspector` window (legacy / multi-monitor setups).

---

## Developer workflow

1. `tauri dev` — toolbar appears automatically
2. **Visual Inspector** (crosshair) — click elements (with `InspectorMeta` = rich labels)
3. **Context Box** — type issue text, edit screenshot chips
4. **Copy** — context bundle to clipboard → paste in Cursor
5. **DevTools** — native webview inspector

---

## Faster startup

| Setting | Effect |
|---------|--------|
| `overlayDeferMs: 100` (default) | Host UI paints first, then toolbar |
| `overlayDeferMs: 0` | Toolbar as soon as webview is ready |
| `autoOpen: false` | No toolbar until you call `invoke('plugin:visual-editor\|open')` — fastest cold start |

Guest JS loads **only when the overlay opens**, not during initial webview registration.

---

## Updating the plugin (Scriptony, etc.)

```bash
cargo update -p tauri-plugin-visual-editor
npm update @iamthamanic/visual-editor-sdk
```

See [consuming-apps.md](./consuming-apps.md) and [RELEASE.md](./RELEASE.md).

---

## Related

- [integration-guide.md](./integration-guide.md) — multi-webview, security, API
- [plugin-api.md](./plugin-api.md) — all commands
- [context-bundle-format.md](./context-bundle-format.md) — export structure
