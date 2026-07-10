/**
 * Detect DOM nodes that belong to the visual editor overlay (not host app).
 * Location: packages/guest/src/inspector-ui-guard.ts
 */

const INSPECTOR_UI_SELECTOR = [
  '#visual-editor-overlay-root',
  '#visual-editor-toolbar-root',
  '[data-visual-editor-toolbar]',
  '[data-visual-editor-ui]',
  '[data-visual-editor-picker-toggle]',
  '[data-visual-editor-screenshot-editor]',
  '[data-visual-editor-chip]',
  '[data-visual-editor-capture-chip]',
  '[data-visual-editor-composer-tail]',
  '[data-visual-editor-nav]',
].join(',');

export function isInspectorUiElement(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  return Boolean(el.closest(INSPECTOR_UI_SELECTOR));
}

export function eventHitsInspectorUi(event: Event): boolean {
  if (typeof event.composedPath === 'function') {
    for (const node of event.composedPath()) {
      if (isInspectorUiElement(node as Element)) {
        return true;
      }
    }
  }
  if (event.target instanceof Element && isInspectorUiElement(event.target)) {
    return true;
  }
  if (
    'clientX' in event &&
    'clientY' in event &&
    typeof event.clientX === 'number' &&
    typeof event.clientY === 'number'
  ) {
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    return isInspectorUiElement(hit);
  }
  return false;
}
