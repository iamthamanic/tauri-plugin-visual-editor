/**
 * SVG icon markup for the embedded inspector toolbar.
 * Location: packages/guest/src/toolbar-icons.ts
 */

/** Lucide-style rotate-cw reload arrow. */
export const ICON_RELOAD = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Lucide-style search magnifier. */
export const ICON_SEARCH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2"/>
  <path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** Lucide-style mouse pointer. */
export const ICON_POINTER = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4 4l7 16 2.5-6.5L20 11 4 4z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`;

/** Inspector picker — search + pointer side by side. */
export const ICON_INSPECT_PICKER = `<span style="display:inline-flex;align-items:center;gap:1px" aria-hidden="true">${ICON_SEARCH}${ICON_POINTER}</span>`;

export const ICON_SCREENSHOT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
</svg>`;

export const ICON_CONTEXT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
</svg>`;

export const ICON_CHIP = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
  <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

export const ICON_CHEVRON_UP = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M6 14l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const ICON_CHEVRON_DOWN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M6 10l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const ICON_GRIP = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <circle cx="9" cy="8" r="1.2"/><circle cx="15" cy="8" r="1.2"/>
  <circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/>
  <circle cx="9" cy="16" r="1.2"/><circle cx="15" cy="16" r="1.2"/>
</svg>`;

/** Terminal / DevTools console. */
export const ICON_DEVTOOLS = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
  <path d="M7 9l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 15h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export const ICON_CAPTURE_CHIP = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

export const ICON_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M5 12l5 5L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Pencil / draw tool. */
export const ICON_DRAW = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

/** Type / text annotation tool. */
export const ICON_TEXT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4 7V5h16v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M8 19h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** Crop / scissors tool. */
export const ICON_SCISSORS = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="6" cy="6" r="3" stroke="currentColor" stroke-width="2"/>
  <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
  <path d="M8.5 8.5L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M8.5 15.5L20 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** Save / disk icon. */
export const ICON_SAVE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  <path d="M17 21v-8H7v8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  <path d="M7 3v5h8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

/** @deprecated use ICON_SCISSORS */
export const ICON_CROP = ICON_SCISSORS;
