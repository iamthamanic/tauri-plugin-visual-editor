/**
 * Opens or focuses the modal WebView window for multi-webview demos.
 * Location: examples/react-vite/src/lib/openModalWebview.ts
 */

import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export async function openModalWebview(): Promise<void> {
  const existing = await WebviewWindow.getByLabel('modal');
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }

  const isDev = import.meta.env.DEV;
  const url = isDev ? 'http://localhost:1420/modal.html' : '/modal.html';

  new WebviewWindow('modal', {
    url,
    title: 'Modal WebView',
    width: 520,
    height: 380,
    center: true,
    resizable: true,
  });
}
