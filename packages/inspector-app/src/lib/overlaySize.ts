/**
 * Resizes the overlay window when the context panel expands.
 * Location: packages/inspector-app/src/lib/overlaySize.ts
 */

import { LogicalSize } from '@tauri-apps/api/dpi';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const COMPACT = new LogicalSize(72, 280);
const EXPANDED = new LogicalSize(340, 380);

export async function setOverlayExpanded(expanded: boolean): Promise<void> {
  const window = getCurrentWebviewWindow();
  await window.setSize(expanded ? EXPANDED : COMPACT);
}
