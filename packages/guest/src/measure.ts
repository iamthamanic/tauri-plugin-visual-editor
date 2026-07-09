/**
 * DOM measurement: bounds, visibility, curated computedStyle, attributes.
 * Location: packages/guest/src/measure.ts
 */

import {
  CURATED_CSS_PROPERTIES,
  MAX_CSS_PROPERTIES,
  OFF_VIEWPORT_CAPTURE_ERROR,
} from './constants.js';
import { buildDomPath } from './dom-path.js';
import type { Bounds, ElementSnapshot, Visibility } from './types.js';

export { OFF_VIEWPORT_CAPTURE_ERROR };

export type MeasureContext = {
  webviewId: string;
  devicePixelRatio?: number;
  viewportWidth?: number;
  viewportHeight?: number;
};

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function rectToBounds(rect: DOMRect): Bounds {
  return {
    x: round(rect.x),
    y: round(rect.y),
    width: round(rect.width),
    height: round(rect.height),
  };
}

function intersectBounds(a: Bounds, b: Bounds): Bounds | null {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  if (x2 <= x1 || y2 <= y1) {
    return null;
  }
  return { x: round(x1), y: round(y1), width: round(x2 - x1), height: round(y2 - y1) };
}

export function resolveViewport(ctx: MeasureContext): Bounds {
  const width = ctx.viewportWidth ?? globalThis.innerWidth ?? 0;
  const height = ctx.viewportHeight ?? globalThis.innerHeight ?? 0;
  return { x: 0, y: 0, width, height };
}

export function computeVisibility(
  cssBounds: Bounds,
  viewport: Bounds,
): { visibility: Visibility; visibleBounds: Bounds | null; fullBounds: Bounds | null } {
  if (cssBounds.width <= 0 || cssBounds.height <= 0) {
    return {
      visibility: 'outside_viewport',
      visibleBounds: null,
      fullBounds: cssBounds,
    };
  }

  const intersection = intersectBounds(cssBounds, viewport);
  if (!intersection) {
    return {
      visibility: 'outside_viewport',
      visibleBounds: null,
      fullBounds: cssBounds,
    };
  }

  const fullyVisible =
    intersection.x <= cssBounds.x + 0.001 &&
    intersection.y <= cssBounds.y + 0.001 &&
    intersection.width >= cssBounds.width - 0.001 &&
    intersection.height >= cssBounds.height - 0.001;

  if (fullyVisible) {
    return { visibility: 'visible', visibleBounds: null, fullBounds: null };
  }

  return {
    visibility: 'partially_visible',
    visibleBounds: intersection,
    fullBounds: cssBounds,
  };
}

export function collectAttributes(element: Element): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const attr of Array.from(element.attributes)) {
    pairs.push([attr.name, attr.value]);
  }
  return pairs;
}

export function collectComputedLayout(element: Element): Array<[string, string]> {
  const style = globalThis.getComputedStyle(element);
  const layout: Array<[string, string]> = [];
  for (const key of CURATED_CSS_PROPERTIES) {
    if (layout.length >= MAX_CSS_PROPERTIES) {
      break;
    }
    const value = style.getPropertyValue(key);
    if (value) {
      layout.push([key, value]);
    }
  }
  return layout;
}

function toPhysical(bounds: Bounds, dpr: number): Bounds {
  return {
    x: round(bounds.x * dpr),
    y: round(bounds.y * dpr),
    width: round(bounds.width * dpr),
    height: round(bounds.height * dpr),
  };
}

function elementText(element: Element): string | null {
  const text = element.textContent?.trim() ?? '';
  if (!text) {
    return null;
  }
  return text.length > 200 ? `${text.slice(0, 197)}...` : text;
}

/**
 * Measure a DOM element into an ElementSnapshot for the hub.
 */
export function measureElement(element: Element, ctx: MeasureContext): ElementSnapshot {
  const dpr = ctx.devicePixelRatio ?? globalThis.devicePixelRatio ?? 1;
  const rect = element.getBoundingClientRect();
  const cssBounds = rectToBounds(rect);
  const viewport = resolveViewport(ctx);
  const { visibility, visibleBounds, fullBounds } = computeVisibility(cssBounds, viewport);

  return {
    webview_id: ctx.webviewId,
    tag: element.tagName.toLowerCase(),
    text: elementText(element),
    attributes: collectAttributes(element),
    dom_path: buildDomPath(element),
    visibility,
    css_bounds: cssBounds,
    physical_bounds: toPhysical(cssBounds, dpr),
    visible_bounds: visibleBounds,
    full_bounds: fullBounds,
    computed_layout: collectComputedLayout(element),
  };
}

/** Returns an error when capture should be blocked for off-viewport elements. */
export function captureBlockedReason(snapshot: ElementSnapshot): string | null {
  if (snapshot.visibility === 'outside_viewport') {
    return OFF_VIEWPORT_CAPTURE_ERROR;
  }
  return null;
}
