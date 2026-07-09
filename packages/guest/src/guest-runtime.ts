/**
 * Guest bootstrap entry — activated by Rust eval injection on enable.
 * Location: packages/guest/src/guest-runtime.ts
 */

import { invoke } from '@tauri-apps/api/core';
import { SelectionEngine } from './selection.js';
import type { ElementSnapshot } from './types.js';

type GuestGlobal = {
  activate(webviewId: string): void;
  deactivate(): void;
  version: string;
};

declare global {
  interface Window {
    __VISUAL_EDITOR_GUEST__?: GuestGlobal;
  }
}

let engine: SelectionEngine | null = null;

async function reportSelection(
  snapshot: ElementSnapshot,
  action: 'replace' | 'toggle',
): Promise<void> {
  await invoke('plugin:visual-editor|report_selection', { snapshot, action });
}

const runtime: GuestGlobal = {
  version: '0.1.0',
  activate(webviewId: string) {
    if (!engine) {
      engine = new SelectionEngine({ webviewId, reportSelection });
    }
    engine.activate();
  },
  deactivate() {
    engine?.deactivate();
    engine = null;
  },
};

window.__VISUAL_EDITOR_GUEST__ = runtime;

export default runtime;
