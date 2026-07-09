# Integration Guide — Visual Editor Plugin

Step-by-step setup for host Tauri 2 applications. For command parameters and security details see [plugin-api.md](./plugin-api.md).

Reference implementations:

- [examples/react-vite](../examples/react-vite/) — React + Vite + SDK metadata
- [examples/vanilla](../examples/vanilla/) — manual `data-inspector-*` attributes

---

## 1. Install dependencies

```bash
# Rust plugin (enable the inspector feature)
cargo add tauri-plugin-visual-editor --features visual-inspector

# Guest runtime injected into host webviews
npm install @tauri-plugin/visual-editor

# Optional: metadata helpers for React or vanilla
npm install @tauri-plugin/visual-editor-sdk
```

In a monorepo or path dependency, mirror the examples:

```toml
# src-tauri/Cargo.toml
tauri-plugin-visual-editor = { path = "../../crates/plugin", features = ["visual-inspector"] }
```

---

## 2. Register the plugin (Rust)

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

Without the `visual-inspector` Cargo feature the plugin registers an inert shell — no commands, no guest injection, zero runtime overhead.

---

## 3. Configure the plugin

Add to `tauri.conf.json`:

```json
{
  "plugins": {
    "visualEditor": {
      "enabled": true,
      "allow": true,
      "allowInProduction": false,
      "projectRoot": "/absolute/path/to/your/project"
    }
  }
}
```

| Field | Purpose |
|-------|---------|
| `enabled` | Master switch — when `false`, all commands are denied |
| `allow` | Secondary opt-in — set `false` to hard-block inspector even if enabled |
| `allowInProduction` | Required `true` for release builds (see [Security gates](./plugin-api.md#security-gates)) |
| `projectRoot` | Optional — required when screenshot directory mode is `project` |

---

## 4. Capabilities (Tauri ACL)

Grant permissions to windows that invoke plugin commands. The inspector window label defaults to `visual-inspector`.

**Development (full access):**

```json
{
  "identifier": "dev",
  "windows": ["main", "visual-inspector"],
  "permissions": [
    "core:default",
    "visual-editor:all"
  ]
}
```

**Least privilege** — split permission sets:

| Permission set | Use for |
|----------------|---------|
| `visual-editor:default` | Read-only: open/close window, `getState`, export/copy bundle |
| `visual-editor:inspect` | Enable/disable, target webview, revalidate, session |
| `visual-editor:capture` | Screenshot capture |
| `visual-editor:all` | All of the above |

If your app creates additional webviews (modals, panels), include their labels in `windows` and ensure they are registered before targeting them.

See [examples/react-vite/src-tauri/capabilities/default.json](../examples/react-vite/src-tauri/capabilities/default.json).

---

## 5. Guest runtime (automatic)

When all runtime gates pass and the inspector is **enabled**, the plugin injects the guest bootstrap into each registered webview via Tauri init scripts. No manual `import` from the host frontend is required for overlay/selection.

The guest package (`@tauri-plugin/visual-editor`) is bundled into the Rust crate at build time.

---

## 6. Optional SDK metadata

Annotate components so the selector algorithm can produce stable `data-inspector-*` attributes:

```tsx
import { InspectorMeta } from '@tauri-plugin/visual-editor-sdk/react';

export function SaveButton() {
  return (
    <InspectorMeta component="SaveButton" file="src/SaveButton.tsx" id="save-btn">
      <button type="button">Save</button>
    </InspectorMeta>
  );
}
```

Vanilla HTML:

```html
<button
  data-inspector-component="SaveButton"
  data-inspector-file="src/SaveButton.html"
  data-inspector-id="save-btn"
>
  Save
</button>
```

Build the SDK before typechecking examples in CI:

```bash
npm run build --workspace=@tauri-plugin/visual-editor-sdk
```

---

## 7. Open the inspector from your host UI

From TypeScript (host toolbar, menu, shortcut):

```ts
import { invoke } from '@tauri-apps/api/core';

const PLUGIN = 'plugin:visual-editor';

// Enable overlay on all registered webviews
await invoke(`${PLUGIN}|enable`);

// Open inspector panel (does not enable by default)
await invoke(`${PLUGIN}|open`);

// Open and enable in one step
await invoke(`${PLUGIN}|open`, { options: { autoEnable: true } });

// Toggle inspector window visibility
await invoke(`${PLUGIN}|toggle`);
```

Listen for hub state pushes in custom UI:

```ts
import { listen } from '@tauri-apps/api/event';

await listen('visual-editor://state-updated', (event) => {
  console.log('hub snapshot', event.payload);
});
```

---

## 8. Multi-webview apps

1. Create webviews with distinct labels (`main`, `modal`, …).
2. The plugin auto-registers them via `on_webview_created`.
3. Switch the inspection target:

```ts
await invoke('plugin:visual-editor|set_target_webview', { webviewId: 'modal' });
```

4. Pin a target to prevent accidental switches:

```ts
await invoke('plugin:visual-editor|pin_target_webview', { webviewId: 'main' });
```

---

## 9. Verify the integration

```bash
# From monorepo root
npm run checks

# Run reference host
npm run tauri:dev --workspace=example-react-vite
```

Checklist:

- [ ] Inspector window opens at `tauri://visual-editor/`
- [ ] Hover highlight appears on annotated elements
- [ ] `get_state` returns webview registrations
- [ ] Context bundle copies to clipboard
- [ ] Release build blocked until `allowInProduction: true`

---

## Related docs

- [plugin-api.md](./plugin-api.md) — commands, types, troubleshooting
- [architecture.md](./architecture.md) — hub, events, screenshot pipeline
- [context-bundle-format.md](./context-bundle-format.md) — export template
