/**
 * Inspect-mode pointer handling with passthrough and multi-select.
 * Location: packages/guest/src/selection.ts
 */

import { resolveHoverTarget } from './hover.js';
import { findElementForSnapshot } from './dom-resolve.js';
import { eventHitsInspectorUi, isInspectorUiElement } from './inspector-ui-guard.js';
import { measureElement } from './measure.js';
import { watchNavigation } from './navigation-watch.js';
import { OverlayRenderer, type OverlaySelection } from './overlay.js';
import type { ElementSnapshot } from './types.js';
import type { SelectedElement } from './toolbar-types.js';

export type SelectionReporter = (
  snapshot: ElementSnapshot,
  action: 'add' | 'replace' | 'toggle',
) => Promise<void>;

export type GuestRuntimeOptions = {
  webviewId: string;
  reportSelection: SelectionReporter;
  onNavigation?: (webviewId: string) => void;
};

export class SelectionEngine {
  private readonly overlay = new OverlayRenderer();
  private readonly options: GuestRuntimeOptions;
  private active = false;
  private passthrough = false;
  private hoverTarget: Element | null = null;
  private selections: OverlaySelection[] = [];
  private nextId = 1;
  private unwatchNavigation: (() => void) | null = null;

  constructor(options: GuestRuntimeOptions) {
    this.options = options;
    this.unwatchNavigation = watchNavigation(() => this.handleNavigation());
  }

  /** Remove all overlay boxes (selection, hover, chip focus). */
  clearVisuals(): void {
    this.selections = [];
    this.hoverTarget = null;
    this.overlay.setHover(null);
    this.overlay.setFocus(null);
    this.overlay.renderSelections([]);
  }

  private handleNavigation(): void {
    this.clearVisuals();
    this.options.onNavigation?.(this.options.webviewId);
  }

  destroy(): void {
    this.unwatchNavigation?.();
    this.unwatchNavigation = null;
    this.deactivate();
    this.overlay.unmount();
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
    window.addEventListener('pointerdown', this.onPointerDown, true);
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
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    this.clearVisuals();
  }

  highlightElement(element: SelectedElement): void {
    const hubSnapshot = element.snapshot as unknown as ElementSnapshot;
    const live = findElementForSnapshot(hubSnapshot, element.selector);
    const snapshot = live ? this.measure(live) : hubSnapshot;
    this.overlay.mount();
    this.overlay.setFocus(snapshot);
    live?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  private measure(el: Element): ElementSnapshot {
    return measureElement(el, { webviewId: this.options.webviewId });
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.active) {
      return;
    }
    if (eventHitsInspectorUi(event)) {
      this.hoverTarget = null;
      this.overlay.setHover(null);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.active || this.passthrough) {
      return;
    }
    const raw = document.elementFromPoint(event.clientX, event.clientY);
    if (isInspectorUiElement(raw)) {
      this.hoverTarget = null;
      this.overlay.setHover(null);
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
    if (eventHitsInspectorUi(event)) {
      this.hoverTarget = null;
      return;
    }
    if (this.passthrough || event.altKey) {
      return;
    }

    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const target = resolveHoverTarget(hit);
    if (!target) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const snapshot = this.measure(target);
    const action = event.shiftKey ? 'toggle' : 'add';
    void this.options.reportSelection(snapshot, action).then(() => {
      const existing = this.selections.findIndex(
        (s) => s.snapshot.dom_path === snapshot.dom_path,
      );
      if (action === 'add') {
        if (existing < 0) {
          const id = `sel-${this.nextId++}`;
          this.selections.push({ id, label: id, snapshot });
        }
      } else if (existing >= 0) {
        this.selections.splice(existing, 1);
      } else {
        const id = `sel-${this.nextId++}`;
        this.selections.push({ id, label: id, snapshot });
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
