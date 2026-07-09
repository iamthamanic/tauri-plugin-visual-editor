# Plugin API (V1)

> TODO: Implement alongside `crates/plugin`. See [architecture.md](./architecture.md).

## Installation

```bash
cargo add tauri-plugin-visual-editor
npm install @tauri-plugin/visual-editor
```

## Host registration (Rust)

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_visual_editor::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

## Configuration

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

## Capabilities

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

## Commands

See [architecture.md#commands-api](./architecture.md#commands-api).

## Guest init (TypeScript)

```ts
import { initVisualEditor } from '@tauri-plugin/visual-editor';
// Called automatically via plugin init script when enabled
```

## SDK (optional)

```ts
import { createInspectorAttributes } from '@tauri-plugin/visual-editor/sdk';

<div {...createInspectorAttributes({
  component: 'MyComponent',
  file: 'src/MyComponent.tsx',
  id: 'my-component-1',
})} />
```
