/**
 * Guest bootstrap entry — activated by Rust eval injection on enable.
 * Location: packages/guest/src/guest-runtime.ts
 */

import { invoke } from '@tauri-apps/api/core';
import { SelectionEngine } from './selection.js';
import { resumeCaptureUi, suspendCaptureUi } from './capture-ui.js';
import { InspectorToolbar } from './toolbar.js';
import type { ElementSnapshot } from './types.js';

type GuestGlobal = {
  activate(webviewId: string): void;
  deactivate(): void;
  configure(options: { overlayColor?: string; cropPadding?: number }): void;
  openToolbar(): Promise<void>;
  closeToolbar(): void;
  version: string;
};

declare global {
  interface Window {
    __VISUAL_EDITOR_GUEST__?: GuestGlobal;
  }
}

let engine: SelectionEngine | null = null;
let toolbar: InspectorToolbar | null = null;

async function reportSelection(
  snapshot: ElementSnapshot,
  action: 'add' | 'replace' | 'toggle',
): Promise<void> {
  await invoke('plugin:visual-editor|report_selection', { snapshot, action });
}

async function notifyNavigation(webviewId: string): Promise<void> {
  await invoke('plugin:visual-editor|notify_navigation', { webviewId });
}

const runtime: GuestGlobal = window.__VISUAL_EDITOR_GUEST__ ?? {
  version: '0.1.0',
  activate(webviewId: string) {
    if (!engine) {
      engine = new SelectionEngine({
        webviewId,
        reportSelection,
        onNavigation: (id) => {
          void notifyNavigation(id).catch(() => undefined);
        },
      });
    }
    engine.activate();
  },
  deactivate() {
    engine?.destroy();
    engine = null;
  },
  configure(options) {
    engine?.configure(options);
  },
  async openToolbar() {
    if (!toolbar) {
      toolbar = new InspectorToolbar({
        onPickerChange: (enabled) => {
          if (enabled && engine) {
            engine.activate();
          } else {
            engine?.deactivate();
          }
        },
        onChipFocus: (element) => {
          engine?.highlightElement(element);
        },
      });
    }
    await toolbar.open();
  },
  closeToolbar() {
    toolbar?.close();
  },
};

window.__VISUAL_EDITOR_GUEST__ = runtime;

declare global {
  interface Window {
    __VISUAL_EDITOR_SUSPEND_CAPTURE_UI__?: () => void;
    __VISUAL_EDITOR_RESUME_CAPTURE_UI__?: () => void;
  }
}

window.__VISUAL_EDITOR_SUSPEND_CAPTURE_UI__ = suspendCaptureUi;
window.__VISUAL_EDITOR_RESUME_CAPTURE_UI__ = resumeCaptureUi;

export default runtime;
