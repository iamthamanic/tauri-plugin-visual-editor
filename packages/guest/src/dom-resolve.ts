/**
 * Resolve live DOM nodes from inspector snapshots / selectors.
 * Location: packages/guest/src/dom-resolve.ts
 */

import type { ElementSnapshot } from './types.js';

export function findElementBySelector(selector: string): Element | null {
  if (!selector.trim()) return null;
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

export function findElementForSnapshot(snapshot: ElementSnapshot, selector: string): Element | null {
  const bySelector = findElementBySelector(selector);
  if (bySelector) return bySelector;

  const id = snapshot.attributes.find(([key]) => key === 'id')?.[1];
  if (id) {
    const byId = document.getElementById(id);
    if (byId) return byId;
  }

  const inspectorId = snapshot.attributes.find(([key]) => key === 'data-inspector-id')?.[1];
  if (inspectorId) {
    const byInspector = document.querySelector(`[data-inspector-id="${CSS.escape(inspectorId)}"]`);
    if (byInspector) return byInspector;
  }

  return null;
}
