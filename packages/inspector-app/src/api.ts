/**
 * Tauri invoke wrappers for the visual-editor plugin.
 * Location: packages/inspector-app/src/api.ts
 */

import { invoke } from '@tauri-apps/api/core';
import type { HubSnapshot } from './types.js';

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

export async function hardReload(webviewId?: string): Promise<void> {
  await invoke(`${PLUGIN}|hard_reload`, { webviewId: webviewId ?? null });
}

export async function copyContextBundle(): Promise<void> {
  await invoke(`${PLUGIN}|copy_context_bundle`);
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

export async function setPrimaryCapture(captureId: string): Promise<void> {
  await invoke(`${PLUGIN}|set_primary_capture`, { captureId });
}

export async function setCaptureIncluded(captureId: string, include: boolean): Promise<void> {
  await invoke(`${PLUGIN}|set_capture_included`, { captureId, include });
}

export const STATE_EVENT = 'visual-editor://state-updated';
