import { describe, expect, it } from 'vitest';
import { buildDomPath } from './dom-path.js';
import {
  captureBlockedReason,
  collectComputedLayout,
  computeVisibility,
  measureElement,
  OFF_VIEWPORT_CAPTURE_ERROR,
} from './measure.js';
import { revalidateElement } from './revalidate.js';

function mount(html: string, width = 800, height = 600): HTMLElement {
  document.body.innerHTML = html;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  return document.body.firstElementChild as HTMLElement;
}

describe('computeVisibility', () => {
  it('marks fully inside viewport as visible', () => {
    const result = computeVisibility(
      { x: 10, y: 10, width: 100, height: 50 },
      { x: 0, y: 0, width: 800, height: 600 },
    );
    expect(result.visibility).toBe('visible');
    expect(result.visibleBounds).toBeNull();
    expect(result.fullBounds).toBeNull();
  });

  it('provides visibleBounds and fullBounds when partially visible', () => {
    const result = computeVisibility(
      { x: 750, y: 10, width: 100, height: 50 },
      { x: 0, y: 0, width: 800, height: 600 },
    );
    expect(result.visibility).toBe('partially_visible');
    expect(result.visibleBounds).toEqual({ x: 750, y: 10, width: 50, height: 50 });
    expect(result.fullBounds).toEqual({ x: 750, y: 10, width: 100, height: 50 });
  });

  it('marks completely outside viewport', () => {
    const result = computeVisibility(
      { x: 900, y: 10, width: 100, height: 50 },
      { x: 0, y: 0, width: 800, height: 600 },
    );
    expect(result.visibility).toBe('outside_viewport');
    expect(result.visibleBounds).toBeNull();
    expect(result.fullBounds).not.toBeNull();
  });
});

describe('measureElement', () => {
  it('measures visible element with curated layout capped at 20', () => {
    const el = mount('<div id="box" style="display:flex; padding:4px;">Hello</div>');
    el.getBoundingClientRect = () =>
      ({
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        top: 10,
        left: 10,
        right: 110,
        bottom: 60,
        toJSON: () => ({}),
      }) as DOMRect;
    const snapshot = measureElement(el, {
      webviewId: 'main',
      devicePixelRatio: 2,
      viewportWidth: 800,
      viewportHeight: 600,
    });
    expect(snapshot.webview_id).toBe('main');
    expect(snapshot.tag).toBe('div');
    expect(snapshot.visibility).toBe('visible');
    expect(snapshot.physical_bounds.width).toBe(snapshot.css_bounds.width * 2);
    expect(snapshot.computed_layout.length).toBeLessThanOrEqual(20);
    expect(snapshot.computed_layout.some(([k]) => k === 'display')).toBe(true);
  });

  it('blocks capture for off-viewport elements', () => {
    const el = mount('<div style="position:fixed; left:900px; width:40px; height:40px;"></div>');
    const snapshot = measureElement(el, {
      webviewId: 'main',
      viewportWidth: 800,
      viewportHeight: 600,
    });
    expect(snapshot.visibility).toBe('outside_viewport');
    expect(captureBlockedReason(snapshot)).toBe(OFF_VIEWPORT_CAPTURE_ERROR);
  });
});

describe('shadow DOM', () => {
  it('traverses open shadow roots in dom_path', () => {
    const host = mount('<div id="host"></div>');
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('span');
    inner.id = 'inner';
    shadow.appendChild(inner);
    expect(buildDomPath(inner)).toContain('div#host');
    expect(buildDomPath(inner)).toContain('span#inner');
  });

  it('adds hint for closed shadow roots', () => {
    const host = mount('<div id="host"></div>');
    const shadow = host.attachShadow({ mode: 'closed' });
    const inner = document.createElement('button');
    shadow.appendChild(inner);
    expect(buildDomPath(inner)).toContain('closed shadow root');
  });
});

describe('revalidateElement', () => {
  it('returns valid snapshot when selector matches', () => {
    mount('<div id="target">Item</div>');
    const result = revalidateElement({ selector: '#target' }, { webviewId: 'main' });
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.snapshot.tag).toBe('div');
    }
  });

  it('returns not_found when selector misses', () => {
    mount('<div></div>');
    const result = revalidateElement({ selector: '#missing' }, { webviewId: 'main' });
    expect(result.status).toBe('not_found');
  });
});

describe('collectComputedLayout', () => {
  it('never exceeds 20 properties', () => {
    const el = mount('<div style="display:grid; position:relative; opacity:0.9;"></div>');
    const layout = collectComputedLayout(el);
    expect(layout.length).toBeLessThanOrEqual(20);
  });
});
