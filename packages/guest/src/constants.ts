/**
 * Guest measurement constants.
 * Location: packages/guest/src/constants.ts
 */

/** Curated computed-style keys (max 20) exported to the hub. */
export const CURATED_CSS_PROPERTIES = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'margin',
  'padding',
  'flex',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'z-index',
  'overflow',
  'pointer-events',
  'opacity',
  'transform',
] as const;

export const MAX_CSS_PROPERTIES = 20;

/** Controlled failure when element capture is requested off-viewport. */
export const OFF_VIEWPORT_CAPTURE_ERROR =
  'Element is outside the viewport. Scroll it into view before capture.';

/** Appended to dom_path when a closed shadow root blocks traversal. */
export const CLOSED_SHADOW_HINT = ' [closed shadow root — outer host only]';
