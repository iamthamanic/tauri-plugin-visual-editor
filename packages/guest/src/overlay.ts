/**
 * Thin overlay visuals — hover and numbered selection boxes.
 * Location: packages/guest/src/overlay.ts
 */

import type { ElementSnapshot } from './types.js';
import { markCaptureHideRoot } from './capture-ui.js';

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
    markCaptureHideRoot(root);
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
  private focusEl: HTMLDivElement | null = null;
  private focusLabel: HTMLDivElement | null = null;
  private overlayColor = '#3b82f6';
  private selectionColor = '#22c55e';
  private focusColor = '#f59e0b';

  configure(options: { overlayColor?: string }): void {
    if (options.overlayColor) {
      this.overlayColor = options.overlayColor;
    }
  }

  mount(): void {
    ensureRoot();
  }

  unmount(): void {
    document.getElementById(ROOT_ID)?.remove();
    this.hoverEl = null;
    this.hoverLabel = null;
    this.focusEl = null;
    this.focusLabel = null;
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

    Object.assign(this.hoverEl!.style, boxStyle(snapshot.css_bounds, this.overlayColor));
    Object.assign(this.hoverLabel!.style, {
      left: `${snapshot.css_bounds.x}px`,
      top: `${Math.max(0, snapshot.css_bounds.y - 16)}px`,
    });
    this.hoverLabel!.textContent = labelFor(snapshot);
  }

  setFocus(snapshot: ElementSnapshot | null): void {
    const root = ensureRoot();
    if (!snapshot) {
      this.focusEl?.remove();
      this.focusLabel?.remove();
      this.focusEl = null;
      this.focusLabel = null;
      return;
    }

    if (!this.focusEl) {
      this.focusEl = document.createElement('div');
      this.focusLabel = document.createElement('div');
      Object.assign(this.focusLabel.style, {
        position: 'fixed',
        font: '11px/1.2 system-ui, sans-serif',
        background: 'rgba(245,158,11,0.95)',
        color: '#111',
        padding: '2px 6px',
        borderRadius: '2px',
        pointerEvents: 'none',
        fontWeight: '600',
      });
      root.appendChild(this.focusEl);
      root.appendChild(this.focusLabel);
    }

    Object.assign(this.focusEl!.style, {
      ...boxStyle(snapshot.css_bounds, this.focusColor),
      borderWidth: '2px',
      boxShadow: '0 0 0 2px rgba(245,158,11,0.35)',
    });
    Object.assign(this.focusLabel!.style, {
      left: `${snapshot.css_bounds.x}px`,
      top: `${Math.max(0, snapshot.css_bounds.y - 18)}px`,
    });
    this.focusLabel!.textContent = labelFor(snapshot);
  }

  renderSelections(selections: OverlaySelection[]): void {
    const root = ensureRoot();
    root.querySelectorAll('[data-ve-selection]').forEach((el) => el.remove());

    selections.forEach((item, index) => {
      const box = document.createElement('div');
      box.setAttribute('data-ve-selection', item.id);
      const badge = document.createElement('div');
      badge.textContent = `#${index + 1}`;
      Object.assign(box.style, boxStyle(item.snapshot.css_bounds, this.selectionColor));
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
