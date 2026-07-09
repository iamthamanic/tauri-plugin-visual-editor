/**
 * Hover target resolution — upward walk from elementFromPoint.
 * Location: packages/guest/src/hover.ts
 */

const INTERACTIVE_TAGS = new Set(['button', 'input', 'a', 'select', 'textarea', 'label']);

function hasInspectorId(el: Element): boolean {
  return el.hasAttribute('data-inspector-id');
}

function hasInspectorComponent(el: Element): boolean {
  return el.hasAttribute('data-inspector-component');
}

function isInteractive(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (INTERACTIVE_TAGS.has(tag)) {
    return true;
  }
  const role = el.getAttribute('role');
  return role !== null && role.length > 0;
}

function isSensibleSize(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width >= 8 && rect.height >= 8;
}

function scoreCandidate(el: Element): number {
  if (hasInspectorId(el)) {
    return 50;
  }
  if (hasInspectorComponent(el)) {
    return 40;
  }
  if (isInteractive(el)) {
    return 30;
  }
  if (isSensibleSize(el)) {
    return 20;
  }
  if (el.children.length === 0) {
    return 10;
  }
  return 0;
}

/**
 * Walk upward from the raw target to the best inspectable element.
 */
export function resolveHoverTarget(raw: Element | null): Element | null {
  let current = raw;
  let best: Element | null = null;
  let bestScore = -1;

  while (current && current !== document.documentElement) {
    const score = scoreCandidate(current);
    if (score > bestScore) {
      best = current;
      bestScore = score;
    }
    if (score >= 50) {
      return current;
    }
    current = current.parentElement;
  }

  return best ?? raw;
}
