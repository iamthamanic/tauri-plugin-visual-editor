import { describe, expect, it } from 'vitest';
import { resolveHoverTarget } from './hover.js';

describe('resolveHoverTarget', () => {
  it('prefers data-inspector-id ancestor', () => {
    document.body.innerHTML = `
      <div data-inspector-id="card-1">
        <button><span id="leaf">Save</span></button>
      </div>
    `;
    const leaf = document.getElementById('leaf')!;
    expect(resolveHoverTarget(leaf)?.getAttribute('data-inspector-id')).toBe('card-1');
  });

  it('prefers interactive element over generic wrapper', () => {
    document.body.innerHTML = `<div><button id="btn">OK</button></div>`;
    const btn = document.getElementById('btn')!;
    expect(resolveHoverTarget(btn)?.tagName).toBe('BUTTON');
  });
});
