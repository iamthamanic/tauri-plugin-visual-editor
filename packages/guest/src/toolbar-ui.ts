/**
 * DOM helpers: tooltips, chips, element info popover, drag handle.
 * Location: packages/guest/src/toolbar-ui.ts
 */

import { ICON_CHECK, ICON_CHIP } from './toolbar-icons.js';
import { mountFloatingElement } from './floating-ui.js';
import { normalizeComposerInlines, setupComposerChip } from './composer-flow.js';
import type { SelectedElement } from './toolbar-types.js';

let activeTooltip: HTMLDivElement | null = null;
let activeInfo: HTMLDivElement | null = null;

export function attachTooltip(anchor: HTMLElement, text: string): void {
  anchor.addEventListener('mouseenter', () => {
    hideTooltip();
    const tip = document.createElement('div');
    tip.textContent = text;
    Object.assign(tip.style, {
      position: 'fixed',
      maxWidth: '220px',
      padding: '6px 10px',
      borderRadius: '6px',
      background: '#0d1117',
      color: '#e6edf3',
      fontSize: '11px',
      lineHeight: '1.35',
      boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
      border: '1px solid #3d3d3d',
      pointerEvents: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transform: 'translateY(-50%)',
    });
    const rect = anchor.getBoundingClientRect();
    mountFloatingElement(tip);
    const gap = 8;
    const left = Math.max(8, rect.left - tip.offsetWidth - gap);
    tip.style.left = `${left}px`;
    tip.style.top = `${rect.top + rect.height / 2}px`;
    activeTooltip = tip;
  });
  anchor.addEventListener('mouseleave', hideTooltip);
}

function hideTooltip(): void {
  activeTooltip?.remove();
  activeTooltip = null;
}

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

function section(title: string, body: string): string {
  return `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:600;color:#8b949e;margin-bottom:4px">${title}</div><div style="font-family:ui-monospace,monospace;font-size:11px;color:#e6edf3;white-space:pre-wrap;word-break:break-all">${body}</div></div>`;
}

export function buildElementInfoHtml(el: SelectedElement): string {
  const snap = el.snapshot;
  const attrs = snap.attributes
    .filter(([k]) => !k.startsWith('data-cursor-'))
    .slice(0, 12)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const layout = snap.computed_layout
    .slice(0, 16)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const elementLine = elementChipLabel(el);
  return (
    section('ELEMENT', elementLine) +
    section('PATH', el.selector || snap.dom_path) +
    (attrs ? section('ATTRIBUTES', attrs) : '') +
    (layout ? section('COMPUTED STYLES', layout) : '')
  );
}

function hideElementInfo(): void {
  activeInfo?.remove();
  activeInfo = null;
}

export function createChipRemoveButton(
  composer: HTMLElement,
  chip: HTMLElement,
  onRemove: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Chip entfernen');
  btn.setAttribute('data-visual-editor-chip-remove', 'true');
  btn.setAttribute('data-visual-editor-ui', 'true');
  btn.textContent = '×';
  Object.assign(btn.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '14px',
    height: '14px',
    marginLeft: '2px',
    padding: '0',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    color: '#8b949e',
    fontSize: '13px',
    lineHeight: '1',
    cursor: 'pointer',
    flexShrink: '0',
  });
  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(248,81,73,0.2)';
    btn.style.color = '#f85149';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'transparent';
    btn.style.color = '#8b949e';
  });
  btn.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideElementInfo();
    onRemove();
  });
  return btn;
}

export function attachElementInfo(chip: HTMLElement, el: SelectedElement): void {
  chip.addEventListener('mouseenter', () => {
    hideElementInfo();
    const pop = document.createElement('div');
    pop.innerHTML = buildElementInfoHtml(el);
    Object.assign(pop.style, {
      position: 'fixed',
      width: '320px',
      maxHeight: '360px',
      overflow: 'auto',
      padding: '12px',
      borderRadius: '8px',
      background: '#0d1117',
      border: '1px solid #3d3d3d',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    });
    const rect = chip.getBoundingClientRect();
    mountFloatingElement(pop);
    let left = rect.left;
    let top = rect.bottom + 8;
    if (left + 320 > window.innerWidth - 8) left = window.innerWidth - 328;
    if (top + 200 > window.innerHeight - 8) top = rect.top - pop.offsetHeight - 8;
    pop.style.left = `${Math.max(8, left)}px`;
    pop.style.top = `${Math.max(8, top)}px`;
    activeInfo = pop;
  });
  chip.addEventListener('mouseleave', hideElementInfo);
}

export function renderChip(
  el: SelectedElement,
  composer: HTMLElement,
  onChipClick?: (element: SelectedElement) => void,
  onRemove?: (elementId: string) => void,
): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.setAttribute('data-visual-editor-chip', 'true');
  Object.assign(chip.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(88,166,255,0.55)',
    background: 'rgba(88,166,255,0.12)',
    color: '#e6edf3',
    fontSize: '11px',
    fontFamily: 'ui-monospace, monospace',
    cursor: 'pointer',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    userSelect: 'none',
    margin: '4px 6px 10px 0',
  });
  const icon = document.createElement('span');
  icon.innerHTML = ICON_CHIP;
  icon.style.display = 'flex';
  icon.style.color = '#58a6ff';
  const label = document.createElement('span');
  label.textContent = elementChipLabel(el);
  chip.append(icon, label);
  if (onRemove) {
    chip.append(createChipRemoveButton(composer, chip, () => onRemove(el.id)));
  }
  attachElementInfo(chip, el);
  setupComposerChip(chip, composer, {
    onChipClick: () => onChipClick?.(el),
  });
  return chip;
}

export function makeDraggable(shell: HTMLElement, handle: HTMLElement): void {
  handle.style.cursor = 'grab';
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const root = shell.parentElement as HTMLElement;
    const rect = root.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    handle.style.cursor = 'grabbing';

    const onMove = (ev: PointerEvent): void => {
      const x = Math.min(Math.max(0, ev.clientX - offsetX), window.innerWidth - rect.width);
      const y = Math.min(Math.max(0, ev.clientY - offsetY), window.innerHeight - 40);
      root.style.left = `${x}px`;
      root.style.top = `${y}px`;
      root.style.right = 'auto';
    };
    const onUp = (): void => {
      handle.style.cursor = 'grab';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

export function iconButton(label: string, tooltip: string, svg: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', label);
  btn.setAttribute('data-visual-editor-ui', 'true');
  btn.innerHTML = svg;
  const baseBg = '#2a2a2a';
  const hoverBg = '#3d444d';
  const baseBorder = '#3d3d3d';
  Object.assign(btn.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    border: `1px solid ${baseBorder}`,
    background: baseBg,
    color: '#e6edf3',
    cursor: 'pointer',
    transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
  });
  btn.addEventListener('mouseenter', () => {
    if (btn.dataset.active === 'true') return;
    btn.style.background = hoverBg;
    btn.style.borderColor = '#58a6ff66';
  });
  btn.addEventListener('mouseleave', () => {
    if (btn.dataset.active === 'true') return;
    btn.style.background = baseBg;
    btn.style.borderColor = baseBorder;
  });
  btn.addEventListener('mousedown', (event) => {
    event.stopPropagation();
    btn.style.transform = 'scale(0.96)';
  });
  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'scale(1)';
  });
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    onClick();
  });
  attachTooltip(btn, tooltip);
  return btn;
}

const PANEL_BTN_BASE = {
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid #3d3d3d',
  background: 'transparent',
  color: '#e6edf3',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
} as const;

export function createPanelButton(
  label: string,
  onClick: (event: MouseEvent) => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  Object.assign(btn.style, PANEL_BTN_BASE);
  btn.addEventListener('mouseenter', () => {
    if (btn.dataset.state === 'success') return;
    btn.style.background = '#2a2a2a';
    btn.style.borderColor = '#58a6ff66';
  });
  btn.addEventListener('mouseleave', () => {
    if (btn.dataset.state === 'success') return;
    btn.style.background = 'transparent';
    btn.style.borderColor = '#3d3d3d';
  });
  btn.addEventListener('click', (event) => onClick(event));
  return btn;
}

export function showCopySuccess(btn: HTMLButtonElement, resetMs = 2000): void {
  btn.dataset.state = 'success';
  btn.innerHTML = ICON_CHECK;
  Object.assign(btn.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: '#58a6ff',
    borderColor: '#58a6ff',
    color: '#fff',
    minWidth: '56px',
  });
  window.setTimeout(() => {
    btn.dataset.state = '';
    btn.textContent = 'Copy';
    Object.assign(btn.style, PANEL_BTN_BASE);
  }, resetMs);
}

export function runClearWipe(textareaWrap: HTMLElement, onDone: () => void): void {
  const wipe = document.createElement('div');
  Object.assign(wipe.style, {
    position: 'absolute',
    inset: '0',
    borderRadius: '6px',
    background: 'linear-gradient(90deg, transparent 0%, #0d1117 50%, transparent 100%)',
    pointerEvents: 'none',
    transform: 'translateX(-100%)',
    animation: 've-clear-wipe 0.45s ease forwards',
  });
  if (!document.getElementById('ve-clear-wipe-style')) {
    const style = document.createElement('style');
    style.id = 've-clear-wipe-style';
    style.textContent = `@keyframes ve-clear-wipe { to { transform: translateX(100%); } }`;
    document.head.append(style);
  }
  textareaWrap.style.position = 'relative';
  textareaWrap.append(wipe);
  wipe.addEventListener('animationend', () => {
    wipe.remove();
    onDone();
  });
}
