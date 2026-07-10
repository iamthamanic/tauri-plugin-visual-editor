/**
 * Tauri invoke wrappers for the visual-editor plugin.
 * Location: packages/inspector-app/src/api.ts
 */

import { invoke } from '@tauri-apps/api/core';
import type { HubSnapshot, PersistentSettingsPatch } from './types.js';

export type ComposerBlockExport =
  | { type: 'text'; content: string }
  | { type: 'element'; id: string }
  | { type: 'capture'; id: string };

const PLUGIN = 'plugin:visual-editor';

export async function getState(): Promise<HubSnapshot> {
  return invoke<HubSnapshot>(`${PLUGIN}|get_state`);
}

export async function enable(): Promise<void> {
  await invoke(`${PLUGIN}|enable`);
}

export async function disable(): Promise<void> {
  await invoke(`${PLUGIN}|disable`);
}

export async function setTargetWebview(webviewId: string): Promise<void> {
  await invoke(`${PLUGIN}|set_target_webview`, { webviewId });
}

export async function pinTargetWebview(webviewId: string): Promise<void> {
  await invoke(`${PLUGIN}|pin_target_webview`, { webviewId });
}

export async function unpinTargetWebview(): Promise<void> {
  await invoke(`${PLUGIN}|unpin_target_webview`);
}

export async function clearSession(): Promise<void> {
  await invoke(`${PLUGIN}|clear_session`);
}

export async function revalidate(): Promise<number> {
  return invoke<number>(`${PLUGIN}|revalidate`);
}

export async function hardReload(webviewId?: string, clearCache = true): Promise<void> {
  await invoke(`${PLUGIN}|hard_reload`, {
    webviewId: webviewId ?? null,
    clearCache,
  });
}

export async function toggleDevtools(webviewId?: string): Promise<boolean> {
  return invoke<boolean>(`${PLUGIN}|toggle_devtools`, {
    webviewId: webviewId ?? null,
  });
}

export async function copyContextBundle(
  full = false,
  blocks?: ComposerBlockExport[],
): Promise<void> {
  await invoke(`${PLUGIN}|copy_context_bundle`, {
    full,
    blocks: full ? null : blocks ?? null,
  });
}

export async function copyScreenshotImage(captureId?: string): Promise<void> {
  await invoke(`${PLUGIN}|copy_screenshot_image`, { captureId: captureId ?? null });
}

export async function copyScreenshotPath(captureId?: string): Promise<void> {
  await invoke(`${PLUGIN}|copy_screenshot_path`, { captureId: captureId ?? null });
}

export async function setIssueText(text: string): Promise<void> {
  await invoke(`${PLUGIN}|set_issue_text`, { text });
}

export async function removeElement(elementId: string): Promise<void> {
  await invoke(`${PLUGIN}|remove_element`, { elementId });
}

export async function removeCapture(captureId: string): Promise<void> {
  await invoke(`${PLUGIN}|remove_capture`, { captureId });
}

export async function setPrimaryCapture(captureId: string): Promise<void> {
  await invoke(`${PLUGIN}|set_primary_capture`, { captureId });
}

export async function setCaptureIncluded(captureId: string, include: boolean): Promise<void> {
  await invoke(`${PLUGIN}|set_capture_included`, { captureId, include });
}

export async function updateSettings(patch: PersistentSettingsPatch): Promise<void> {
  await invoke(`${PLUGIN}|update_settings`, { patch });
}

export async function saveCaptureImage(captureId: string, pngBytes: number[]): Promise<void> {
  await invoke(`${PLUGIN}|save_capture_image`, { captureId, pngBytes });
}

export async function readCaptureImage(captureId: string): Promise<Uint8Array> {
  const bytes = await invoke<number[]>(`${PLUGIN}|read_capture_image`, { captureId });
  return Uint8Array.from(bytes);
}

export async function loadCaptureBlobUrl(captureId: string): Promise<string> {
  const bytes = await readCaptureImage(captureId);
  return URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type: 'image/png' }));
}

export async function capture(options?: { mode?: string }): Promise<string> {
  return invoke<string>(`${PLUGIN}|capture`, { options: options ?? null });
}

export async function exportContext(): Promise<string> {
  return invoke<string>(`${PLUGIN}|export_context`);
}

export const STATE_EVENT = 'visual-editor://state-updated';
