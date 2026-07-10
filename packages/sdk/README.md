# @iamthamanic/visual-editor-sdk

Framework-neutral helpers for canonical `data-inspector-*` metadata attributes used by the Visual Editor plugin.

## Install

```bash
npm install @iamthamanic/visual-editor-sdk
```

React is optional — only required for `InspectorMeta`.

## Core API (no React)

```ts
import {
  createInspectorAttributes,
  getInspectorMetadata,
  INSPECTOR_ATTRIBUTES,
  setInspectorMetadata,
} from '@iamthamanic/visual-editor-sdk';

const attrs = createInspectorAttributes({
  component: 'PrimaryButton',
  file: 'src/components/PrimaryButton.tsx',
  id: 'primary-btn',
  entity: 'checkout',
});

// Vanilla DOM
const button = document.querySelector('button')!;
setInspectorMetadata(button, {
  component: 'PrimaryButton',
  file: 'src/components/PrimaryButton.tsx',
  id: 'primary-btn',
});

console.log(getInspectorMetadata(button));
// { component: 'PrimaryButton', file: '...', id: 'primary-btn' }

console.log(INSPECTOR_ATTRIBUTES.id);
// data-inspector-id
```

## React helper (optional)

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

## Canonical attributes

| Field | Attribute |
|-------|-----------|
| component | `data-inspector-component` |
| file | `data-inspector-file` |
| id | `data-inspector-id` |
| entity | `data-inspector-entity` |

See [docs/PRD.md](../../docs/PRD.md) for selector priority and bundle export behavior.
