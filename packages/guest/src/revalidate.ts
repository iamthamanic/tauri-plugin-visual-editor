/**
 * Revalidate selections via querySelector + remeasure.
 * Location: packages/guest/src/revalidate.ts
 */

import { measureElement, type MeasureContext } from './measure.js';
import type { RevalidateResult } from './types.js';

export type RevalidateInput = {
  selector: string;
  root?: Document | ShadowRoot | Element;
};

/**
 * Re-resolve an element by selector and remeasure.
 * Relationships are recalculated in `crates/core` when the hub applies updates.
 */
export function revalidateElement(
  input: RevalidateInput,
  ctx: MeasureContext,
): RevalidateResult {
  const root = input.root ?? globalThis.document;
  const found =
    root instanceof Element
      ? root.querySelector(input.selector)
      : root.querySelector(input.selector);

  if (!found) {
    return { status: 'not_found' };
  }

  return {
    status: 'valid',
    snapshot: measureElement(found, ctx),
  };
}
