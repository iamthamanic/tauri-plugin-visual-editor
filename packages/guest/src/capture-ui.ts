/**
 * Hide all visual-editor DOM overlays during native screenshot capture.
 * Location: packages/guest/src/capture-ui.ts
 */

const HIDE_ATTR = 'data-visual-editor-capture-hide';

export function markCaptureHideRoot(el: HTMLElement): void {
  el.setAttribute(HIDE_ATTR, 'true');
}

export function suspendCaptureUi(): void {
  for (const el of document.querySelectorAll(`[${HIDE_ATTR}]`)) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.dataset.veCaptureHidden === 'true') continue;
    el.dataset.veCaptureHidden = 'true';
    el.dataset.veCapturePrevDisplay = el.style.display;
    el.style.display = 'none';
  }
}

export function resumeCaptureUi(): void {
  for (const el of document.querySelectorAll(`[${HIDE_ATTR}]`)) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.dataset.veCaptureHidden !== 'true') continue;
    el.style.display = el.dataset.veCapturePrevDisplay ?? '';
    delete el.dataset.veCaptureHidden;
    delete el.dataset.veCapturePrevDisplay;
  }
}
