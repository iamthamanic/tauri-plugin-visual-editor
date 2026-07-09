/**
 * Inspect-mode pointer handling with passthrough and multi-select.
 * Location: packages/guest/src/selection.ts
 */

import { resolveHoverTarget } from './hover.js';
import { measureElement } from './measure.js';
import { OverlayRenderer, type OverlaySelection } from './overlay.js';
import type { ElementSnapshot } from './types.js';

export type SelectionReporter = (
  snapshot: ElementSnapshot,
  action: 'replace' | 'toggle',
) => Promise<void>;

export type GuestRuntimeOptions = {
  webviewId: string;
  reportSelection: SelectionReporter;
};

export class SelectionEngine {
  private readonly overlay = new OverlayRenderer();
  private readonly options: GuestRuntimeOptions;
  private active = false;
  private passthrough = false;
  private hoverTarget: Element | null = null;
  private selections: OverlaySelection[] = [];
  private nextId = 1;

  constructor(options: GuestRuntimeOptions) {
    this.options = options;
  }

  configure(options: { overlayColor?: string; cropPadding?: number }): void {
    this.overlay.configure(options);
  }

  activate(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    this.overlay.mount();
    window.addEventListener('pointermove', this.onPointerMove, true);
    window.addEventListener('click', this.onClick, true);
    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('keyup', this.onKeyUp, true);
  }

  deactivate(): void {
    if (!this.active) {
      return;
    }
    this.active = false;
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    this.overlay.unmount();
    this.hoverTarget = null;
  }

  private measure(el: Element): ElementSnapshot {
    return measureElement(el, { webviewId: this.options.webviewId });
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.active || this.passthrough) {
      return;
    }
    const raw = document.elementFromPoint(event.clientX, event.clientY);
    if (raw instanceof HTMLElement && raw.closest('#visual-editor-overlay-root')) {
      return;
    }
    const target = resolveHoverTarget(raw);
    this.hoverTarget = target;
    this.overlay.setHover(target ? this.measure(target) : null);
  };

  private readonly onClick = (event: MouseEvent): void => {
    if (!this.active) {
      return;
    }
    if (this.passthrough || event.altKey) {
      return;
    }
    const target = this.hoverTarget ?? resolveHoverTarget(event.target as Element | null);
    if (!target) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const snapshot = this.measure(target);
    const action = event.shiftKey ? 'toggle' : 'replace';
    void this.options.reportSelection(snapshot, action).then(() => {
      if (action === 'replace') {
        const id = `sel-${this.nextId++}`;
        this.selections = [{ id, label: id, snapshot }];
      } else {
        const existing = this.selections.findIndex(
          (s) => s.snapshot.dom_path === snapshot.dom_path,
        );
        if (existing >= 0) {
          this.selections.splice(existing, 1);
        } else {
          const id = `sel-${this.nextId++}`;
          this.selections.push({ id, label: id, snapshot });
        }
      }
      this.overlay.renderSelections(this.selections);
    });
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.active) {
      return;
    }
    if (event.code === 'Space') {
      this.passthrough = true;
      this.overlay.setHover(null);
    }
    if (event.code === 'Escape') {
      this.hoverTarget = null;
      this.overlay.setHover(null);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      this.passthrough = false;
    }
  };
}
