/**
 * Shared guest types aligned with `crates/core` ElementSnapshot.
 * Location: packages/guest/src/types.ts
 */

export type Visibility = 'visible' | 'partially_visible' | 'outside_viewport';

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Raw DOM facts sent to the Rust hub before selector building. */
export type ElementSnapshot = {
  webview_id: string;
  tag: string;
  text: string | null;
  attributes: Array<[string, string]>;
  dom_path: string;
  visibility: Visibility;
  css_bounds: Bounds;
  physical_bounds: Bounds;
  visible_bounds: Bounds | null;
  full_bounds: Bounds | null;
  computed_layout: Array<[string, string]>;
};

export type RevalidateStatus = 'valid' | 'not_found';

export type RevalidateResult =
  | { status: 'valid'; snapshot: ElementSnapshot }
  | { status: 'not_found' };
