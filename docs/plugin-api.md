# Plugin API — Visual Editor (V1)

Public API for host app integrators. For step-by-step setup see [integration-guide.md](./integration-guide.md).

---

## Installation

```bash
cargo add tauri-plugin-visual-editor --features visual-inspector
npm install @tauri-plugin/visual-editor
npm install @tauri-plugin/visual-editor-sdk   # optional metadata helpers
```

---

## Host registration (Rust)

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_visual_editor::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

| Cargo feature | Behavior |
|---------------|----------|
| `visual-inspector` (required for V1) | Full hub, commands, guest injection, inspector window |
| *(none)* | Inert plugin shell — compile-time zero overhead |

---

## Configuration (`tauri.conf.json`)

```json
{
  "plugins": {
    "visualEditor": {
      "enabled": true,
      "allow": true,
      "allowInProduction": false,
      "projectRoot": "/Users/you/my-app"
    }
  }
}
```

Both `visualEditor` and `visual-editor` keys are accepted.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `false` | Master enable switch |
| `allow` | `bool` | `false` | Secondary allow gate |
| `allowInProduction` | `bool` | `false` | Must be `true` for release builds |
| `projectRoot` | `string?` | — | Project root for `screenshotDir: "project"` |

---

## Capabilities

Grant permissions on windows that call plugin commands. Permission identifiers use **hyphens** (Tauri 2 ACL).

```json
{
  "identifier": "dev",
  "windows": ["main", "modal", "visual-inspector"],
  "permissions": [
    "core:default",
    "visual-editor:all"
  ]
}
```

### Permission sets

| Set | Commands covered |
|-----|------------------|
| `visual-editor:default` | `open`, `close`, `get_state`, `export_context`, `copy_context_bundle`, `copy_screenshot_path`, `open_screenshot_folder` |
| `visual-editor:inspect` | `enable`, `disable`, `toggle`, `set_target_webview`, `pin_target_webview`, `unpin_target_webview`, `revalidate`, `clear_session`, `emit_state`, `report_selection`, `set_issue_text`, `set_primary_capture`, `set_capture_included`, `update_settings`, `hard_reload` |
| `visual-editor:capture` | `capture`, `copy_screenshot_image` |
| `visual-editor:all` | All of the above |

Missing capability → Tauri permission error. The plugin also logs a diagnostic via `log_capability_denial`.

---

## Invoking commands (TypeScript)

All commands use the Tauri 2 plugin invoke prefix:

```ts
import { invoke } from '@tauri-apps/api/core';

const PLUGIN = 'plugin:visual-editor';
await invoke(`${PLUGIN}|get_state`);
```

Rust command names are **snake_case** in the invoke string.

### Hub state event

```ts
import { listen } from '@tauri-apps/api/event';

listen('visual-editor://state-updated', (event) => {
  // HubSnapshot payload
});
```

`get_state` is for cold hydration when the inspector window opens; runtime updates are push-only via the event above.

---

## Commands reference

### Session & window

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `get_state` | — | `HubSnapshot` | Current hub snapshot (hydration / debug) |
| `emit_state` | — | `void` | Force-push state event to inspector UI |
| `enable` | — | `void` | Activate inspector; inject guest into all registered webviews |
| `disable` | — | `void` | Remove overlays; session and window preserved |
| `open` | `options?: { autoEnable?: boolean }` | `void` | Open inspector window (`autoEnable` default `false`) |
| `close` | — | `void` | Close inspector window; session preserved |
| `toggle` | — | `boolean` | Toggle window visibility; returns new visible state |
| `clear_session` | — | `void` | Clear selections and captures |

### Target webview

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `set_target_webview` | `{ webviewId: string }` | `void` | Set active inspection target |
| `pin_target_webview` | `{ webviewId: string }` | `void` | Pin target (blocks accidental changes) |
| `unpin_target_webview` | — | `void` | Release pin |

### Selection & export

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `report_selection` | `{ snapshot: ElementSnapshot, action: string }` | `void` | Guest → hub selection report (internal) |
| `revalidate` | — | `number` | Re-resolve selectors in target webview; returns count updated |
| `export_context` | — | `string` | Generate context bundle markdown |
| `copy_context_bundle` | `{ full?: boolean }` | `void` | Default: composer text + screenshot (HTML). `full: true`: technical bundle |
| `set_issue_text` | `{ text: string }` | `void` | Attach user issue description to session |

### Screenshots

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `capture` | `options?: CaptureOptions` | `string` | Capture screenshot; returns file path |
| `set_primary_capture` | `{ captureId: string }` | `void` | Mark primary capture for bundle |
| `set_capture_included` | `{ captureId: string, include: boolean }` | `void` | Include/exclude capture in export |
| `copy_screenshot_image` | `{ captureId?: string }` | `void` | Copy PNG to clipboard (primary if omitted) |
| `copy_screenshot_path` | `{ captureId?: string }` | `void` | Copy file path to clipboard |
| `open_screenshot_folder` | — | `void` | Open screenshots directory in file manager |

#### `CaptureOptions`

```ts
interface CaptureOptions {
  mode?: 'window' | 'webview' | 'element' | 'region';  // default: 'webview'
  webviewId?: string;
  devicePixelRatio?: number;
  cssBounds?: { x: number; y: number; width: number; height: number };
  regionBounds?: { x: number; y: number; width: number; height: number };
  cropPaddingCss?: number;
  viewportSizeCss?: [number, number];
}
```

| Mode | Behavior |
|------|----------|
| `window` | Entire OS window (all visible webviews) |
| `webview` | Active target webview only |
| `element` | Webview capture + crop to element bounds + padding |
| `region` | Webview capture + drag rectangle crop |

Capture is async with a 5s timeout. On failure, selections are preserved; bundle export still works without a screenshot.

### Settings & reload

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `update_settings` | `{ patch: PersistentSettingsPatch }` | `void` | Merge settings patch and persist to disk |
| `hard_reload` | `{ webviewId?: string, clearCache?: boolean }` | `void` | Reload target webview; default `clearCache: true` clears HTTP cache and storage before reload. Hub session is preserved; selections marked stale. Embedded toolbar/picker are restored after reload. |

#### `PersistentSettingsPatch`

```ts
interface PersistentSettingsPatch {
  theme?: 'system' | 'light' | 'dark';
  shortcut?: string;
  overlayColor?: string;       // hex, e.g. "#3b82f6"
  cropPadding?: 0 | 8 | 16 | 24 | 48;
  screenshotDir?: 'appData' | 'project' | 'temp' | 'absolutePath';
  screenshotAbsolutePath?: string;
}
```

Settings are stored at `<appData>/visual-editor/settings.json`.

---

## Security gates

All five gates must pass (**AND**) before any command handler runs:

```
1. Cargo feature `visual-inspector` compiled
2. plugins.visualEditor.enabled === true
3. plugins.visualEditor.allow === true
4. Tauri capability permits the specific command
5. devModeAllowed: debug build OR allowInProduction === true
```

### Examples

**Development (default safe posture):**

```json
{
  "plugins": {
    "visualEditor": {
      "enabled": true,
      "allow": true,
      "allowInProduction": false
    }
  }
}
```

Works in `cargo tauri dev` (debug). **Blocked** in `cargo tauri build` (release).

**Explicit production unlock (use with care):**

```json
{
  "plugins": {
    "visualEditor": {
      "enabled": true,
      "allow": true,
      "allowInProduction": true
    }
  }
}
```

**Compiled but inactive (zero webview injection):**

```json
{
  "plugins": {
    "visualEditor": {
      "enabled": false,
      "allow": true,
      "allowInProduction": false
    }
  }
}
```

### Error messages

| Failed gate | Typical error fragment |
|-------------|------------------------|
| Feature | `visual-inspector Cargo feature is not enabled` |
| enabled | `plugins.visualEditor.enabled is false` |
| allow | `plugins.visualEditor.allow is false` |
| devMode | `release build requires plugins.visualEditor.allowInProduction=true` |
| capability | Tauri ACL denial (check capability JSON) |

---

## Guest init (TypeScript)

The guest runtime is **not** imported by host apps at runtime. Rust embeds and injects it when the inspector is enabled.

The npm package `@tauri-plugin/visual-editor` exists for bundling into the plugin crate and for development/type reference.

---

## SDK (optional)

```ts
import {
  createInspectorAttributes,
  setInspectorMetadata,
  getInspectorMetadata,
} from '@tauri-plugin/visual-editor-sdk';

// React peer import
import { InspectorMeta } from '@tauri-plugin/visual-editor-sdk/react';
```

Canonical attributes:

| Field | HTML attribute |
|-------|----------------|
| component | `data-inspector-component` |
| file | `data-inspector-file` |
| id | `data-inspector-id` |
| entity | `data-inspector-entity` |

See [packages/sdk/README.md](../packages/sdk/README.md).

---

## Troubleshooting

### CSP blocks guest injection

**Symptom:** Inspector enables but no overlay; console may show eval/script errors.

**Cause:** Strict Content-Security-Policy without `'unsafe-eval'` or inline script allowance.

**Mitigation:**

- Relax CSP for dev builds only
- Or keep inspector disabled in CSP-strict production builds (`enabled: false`)
- See [architecture.md — Known V1 Limitations](./architecture.md#known-v1-limitations)

### Capability / permission errors

**Symptom:** `Command ... not allowed` or plugin log `missing visual-editor:...`

**Fix:**

1. Add the required permission set to your capability file
2. Include the calling window label in `windows` array
3. Include `visual-inspector` in `windows` if the inspector panel invokes commands
4. Use hyphenated permission IDs (`allow-get-state`, not `allow-get_state`)

### Inspector window label conflict

**Symptom:** Init error about duplicate `visual-inspector` window.

**Fix:** Only one inspector window per app. Close existing instance or rename before creating a conflicting window.

### `set_target_webview` rejects unknown webview

**Symptom:** `Unknown webview` error.

**Fix:** Ensure the webview was created and registered (plugin hooks `on_webview_created`). Pass the webview **ID**, not the window label.

### Release build: all commands denied

**Symptom:** `allowInProduction` error on every command.

**Fix:** Expected by design. Set `allowInProduction: true` only if you intentionally ship the inspector in production.

### Screenshots fail silently

**Symptom:** Capture returns error; bundle still exports without image.

**Fix:**

- On Linux CI/headless: screen capture requires display server (not available in GitHub Actions)
- Check screenshot directory permissions for `appData` / `absolutePath` modes
- For `project` mode, set `projectRoot` in plugin config

### TypeScript: cannot find `@tauri-plugin/visual-editor-sdk/react`

**Fix:** Build the SDK before workspace typecheck:

```bash
npm run build --workspace=@tauri-plugin/visual-editor-sdk
```

`npm run checks` does this automatically.

---

## Related docs

- [integration-guide.md](./integration-guide.md) — setup walkthrough
- [architecture.md](./architecture.md) — hub, events, selector algorithm
- [context-bundle-format.md](./context-bundle-format.md) — export format
- [PRD.md](./PRD.md) — product requirements
