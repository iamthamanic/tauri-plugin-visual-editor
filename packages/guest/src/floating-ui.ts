/**
 * Mount transient popovers above the inspector toolbar.
 * The toolbar lives on document.documentElement; body-mounted UI paints underneath it.
 * Location: packages/guest/src/floating-ui.ts
 */

export const FLOATING_ROOT_ID = 'visual-editor-floating-root';
export const Z_FLOATING_LAYER = 2147483647;

function ensureFloatingRoot(): HTMLElement {
  let host = document.getElementById(FLOATING_ROOT_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = FLOATING_ROOT_ID;
    Object.assign(host.style, {
      position: 'fixed',
      inset: '0',
      zIndex: String(Z_FLOATING_LAYER),
      pointerEvents: 'none',
      overflow: 'visible',
    });
    document.documentElement.appendChild(host);
  }
  // Keep the floating layer last so it stacks above the toolbar on documentElement.
  document.documentElement.appendChild(host);
  return host;
}

/** Append a fixed-position popover so it renders above the inspector shell. */
export function mountFloatingElement(el: HTMLElement): void {
  ensureFloatingRoot().appendChild(el);
}

/** Full-screen modal (editor, dialogs) — must receive pointer events. */
export function mountFloatingModal(el: HTMLElement): void {
  if (!el.style.pointerEvents) {
    el.style.pointerEvents = 'auto';
  }
  if (!el.style.zIndex) {
    el.style.zIndex = String(Z_FLOATING_LAYER);
  }
  document.documentElement.appendChild(el);
}
