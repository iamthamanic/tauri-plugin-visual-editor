/**
 * Load screenshot PNG bytes from the plugin hub (avoids asset:// scope issues).
 * Location: packages/guest/src/capture-image.ts
 */

import { invoke } from '@tauri-apps/api/core';

const PLUGIN = 'plugin:visual-editor';

export async function loadCaptureBlobUrl(captureId: string): Promise<string> {
  const bytes = await invoke<number[]>(`${PLUGIN}|read_capture_image`, { captureId });
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'image/png' });
  return URL.createObjectURL(blob);
}
