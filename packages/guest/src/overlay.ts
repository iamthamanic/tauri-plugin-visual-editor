/**
 * Thin overlay visuals — hover and numbered selection boxes.
 * Location: packages/guest/src/overlay.ts
 */

import type { ElementSnapshot } from './types.js';

const ROOT_ID = 'visual-editor-overlay-root';

export type OverlaySelection = {
  id: string;
  label: string;
  snapshot: ElementSnapshot;
};

function ensureRoot(): HTMLDivElement {
  let root = document.getElementById(ROOT_ID) as HTMLDivElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('data-visual-editor-overlay', 'true');
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '2147483646',
    });
    document.documentElement.appendChild(root);
  }
  return root;
}

function boxStyle(bounds: ElementSnapshot['css_bounds'], color: string): Partial<CSSStyleDeclaration> {
  return {
    position: 'fixed',
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    border: `1px solid ${color}`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
  };
}

function labelFor(snapshot: ElementSnapshot): string {
  const component = snapshot.attributes.find(([k]) => k === 'data-inspector-component')?.[1];
  return component ?? snapshot.tag;
}

export class OverlayRenderer {
  private hoverEl: HTMLDivElement | null = null;
  private hoverLabel: HTMLDivElement | null = null;

  mount(): void {
    ensureRoot();
  }

  unmount(): void {
    document.getElementById(ROOT_ID)?.remove();
    this.hoverEl = null;
    this.hoverLabel = null;
  }

  setHover(snapshot: ElementSnapshot | null): void {
    const root = ensureRoot();
    if (!snapshot) {
      this.hoverEl?.remove();
      this.hoverLabel?.remove();
      this.hoverEl = null;
      this.hoverLabel = null;
      return;
    }

    if (!this.hoverEl) {
      this.hoverEl = document.createElement('div');
      this.hoverLabel = document.createElement('div');
      Object.assign(this.hoverLabel.style, {
        position: 'fixed',
        font: '11px/1.2 system-ui, sans-serif',
        background: 'rgba(59,130,246,0.9)',
        color: '#fff',
        padding: '2px 4px',
        borderRadius: '2px',
        pointerEvents: 'none',
      });
      root.appendChild(this.hoverEl);
      root.appendChild(this.hoverLabel);
    }

    Object.assign(this.hoverEl!.style, boxStyle(snapshot.css_bounds, '#3b82f6'));
    Object.assign(this.hoverLabel!.style, {
      left: `${snapshot.css_bounds.x}px`,
      top: `${Math.max(0, snapshot.css_bounds.y - 16)}px`,
    });
    this.hoverLabel!.textContent = labelFor(snapshot);
  }

  renderSelections(selections: OverlaySelection[]): void {
    const root = ensureRoot();
    root.querySelectorAll('[data-ve-selection]').forEach((el) => el.remove());

    selections.forEach((item, index) => {
      const box = document.createElement('div');
      box.setAttribute('data-ve-selection', item.id);
      const badge = document.createElement('div');
      badge.textContent = `#${index + 1}`;
      Object.assign(box.style, boxStyle(item.snapshot.css_bounds, '#22c55e'));
      Object.assign(badge.style, {
        position: 'fixed',
        left: `${item.snapshot.css_bounds.x}px`,
        top: `${Math.max(0, item.snapshot.css_bounds.y - 16)}px`,
        font: '11px/1.2 system-ui, sans-serif',
        background: 'rgba(34,197,94,0.95)',
        color: '#fff',
        padding: '2px 4px',
        borderRadius: '2px',
        pointerEvents: 'none',
      });
      root.appendChild(box);
      root.appendChild(badge);
    });
  }
}
