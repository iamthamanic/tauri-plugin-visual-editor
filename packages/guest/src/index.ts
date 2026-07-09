/**
 * Guest runtime for tauri-plugin-visual-editor.
 * Bootstrap, overlay, and selection are implemented in later issues.
 */
export const GUEST_VERSION = '0.1.0';

export type GuestApi = {
  readonly version: string;
};

export function createGuestApi(): GuestApi {
  return { version: GUEST_VERSION };
}
