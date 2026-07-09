/**
 * Guest runtime for tauri-plugin-visual-editor.
 * DOM measurement and revalidate (bootstrap/overlay in issue #10).
 * Location: packages/guest/src/index.ts
 */

export const GUEST_VERSION = '0.1.0';

export type GuestApi = {
  readonly version: string;
};

export function createGuestApi(): GuestApi {
  return { version: GUEST_VERSION };
}

export * from './constants.js';
export * from './dom-path.js';
export * from './measure.js';
export * from './revalidate.js';
export * from './types.js';
