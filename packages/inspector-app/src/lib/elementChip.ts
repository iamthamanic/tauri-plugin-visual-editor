/**
 * Chip label and inspector info sections for selected elements.
 * Location: packages/inspector-app/src/lib/elementChip.ts
 */

import type { SelectedElement } from '../types.js';

function attrValue(attributes: [string, string][], key: string): string | undefined {
  return attributes.find(([k]) => k === key)?.[1];
}

function isLayoutUtilityClass(className: string): boolean {
  const lower = className.toLowerCase();
  const single = new Set([
    'flex',
    'inline-flex',
    'grid',
    'inline-grid',
    'block',
    'inline-block',
    'inline',
    'hidden',
    'contents',
    'relative',
    'absolute',
    'fixed',
    'sticky',
    'static',
    'container',
    'truncate',
    'sr-only',
  ]);
  if (single.has(lower)) return true;
  const prefixes = [
    'flex-',
    'items-',
    'justify-',
    'gap-',
    'space-',
    'p-',
    'px-',
    'py-',
    'pt-',
    'pb-',
    'pl-',
    'pr-',
    'm-',
    'mx-',
    'my-',
    'mt-',
    'mb-',
    'ml-',
    'mr-',
    'w-',
    'h-',
    'min-',
    'max-',
    'col-',
    'row-',
    'grid-',
    'self-',
    'place-',
    'overflow-',
    'z-',
    'order-',
    'basis-',
  ];
  return prefixes.some((prefix) => lower.startsWith(prefix));
}

function chipClassFromAttributes(attributes: [string, string][]): string | undefined {
  const cls = attrValue(attributes, 'class');
  if (!cls) return undefined;
  for (const token of cls.split(/\s+/).filter(Boolean)) {
    if (!isLayoutUtilityClass(token)) return token;
  }
  return undefined;
}

export function elementChipLabel(el: SelectedElement): string {
  const { tag, attributes } = el.snapshot;
  const component = el.component || attrValue(attributes, 'data-inspector-component');
  if (component) return `<${component}>`;
  const inspectorId = el.inspector_id || attrValue(attributes, 'data-inspector-id');
  if (inspectorId) return `<${tag} data-inspector-id="${inspectorId}">`;
  const id = attrValue(attributes, 'id');
  if (id) return `<${tag} id="${id}">`;
  const cls = chipClassFromAttributes(attributes);
  if (cls) return `<${tag} class="${cls}">`;
  return `<${tag}>`;
}

export type ElementInfoSection = {
  title: string;
  body: string;
};

export function buildElementInfoSections(el: SelectedElement): ElementInfoSection[] {
  const snap = el.snapshot;
  const sections: ElementInfoSection[] = [
    { title: 'ELEMENT', body: elementChipLabel(el) },
    { title: 'PATH', body: el.selector || snap.dom_path },
  ];
  const attrs = snap.attributes
    .filter(([k]) => !k.startsWith('data-cursor-'))
    .slice(0, 12)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  if (attrs) sections.push({ title: 'ATTRIBUTES', body: attrs });
  const layout = snap.computed_layout
    .slice(0, 16)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  if (layout) sections.push({ title: 'COMPUTED STYLES', body: layout });
  return sections;
}
