# Consuming apps (Scriptony & other hosts)

How host apps depend on **published** plugin releases.

## Principle

| Where you work | Source of truth |
|----------------|-----------------|
| **Host app** (Scriptony, etc.) | crates.io `tauri-plugin-visual-editor` |
| **Metadata SDK** (recommended) | npm `@iamthamanic/visual-editor-sdk` |
| **This repo** (plugin dev) | Publish → host runs `cargo update` |

Guest overlay JS is **inside the Rust crate** — hosts do **not** `npm install @tauri-plugin/visual-editor`.

**Full setup guide:** [quick-start.md](./quick-start.md)

---

## Minimal Rust setup

```toml
# src-tauri/Cargo.toml
tauri-plugin-visual-editor = { version = "0.1", features = ["visual-inspector"] }
```

```rust
// src-tauri/src/lib.rs
.plugin(tauri_plugin_visual_editor::init())
```

```json
// tauri.conf.json → plugins.visualEditor
{
  "enabled": true,
  "allow": true,
  "overlayMode": "embedded",
  "autoOpen": true,
  "overlayDeferMs": 100
}
```

```json
// capabilities — add your window label
"permissions": ["core:default", "visual-editor:all"]
```

**No frontend import** for the toolbar. Optional SDK below for best bundle quality.

---

## Recommended: SDK metadata (best Context Bundle quality)

```bash
npm install @iamthamanic/visual-editor-sdk
```

```tsx
import { InspectorMeta } from '@iamthamanic/visual-editor-sdk/react';

<InspectorMeta component="SaveButton" file="src/SaveButton.tsx" id="save">
  <button>Save</button>
</InspectorMeta>
```

Without `InspectorMeta`, inspection uses DOM-only selectors (L1) — works, but Cursor gets weaker file/component hints.

Annotate every component you expect users to inspect: buttons, forms, panels, modals.

---

## After a new plugin release

```bash
cargo update -p tauri-plugin-visual-editor
npm update @iamthamanic/visual-editor-sdk
```

**Dependabot:** copy [templates/consuming-app/dependabot.yml](../templates/consuming-app/dependabot.yml) → host `.github/dependabot.yml`

---

## Local plugin development (do not commit in host)

[patch.crates-io] with path to this monorepo — see [templates/consuming-app/cargo-patch-local.toml](../templates/consuming-app/cargo-patch-local.toml). Remove patch before relying on crates.io again.

---

See [RELEASE.md](./RELEASE.md) for publishing from this repository.
