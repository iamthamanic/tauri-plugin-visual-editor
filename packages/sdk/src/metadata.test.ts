import { describe, expect, it } from 'vitest';
import {
  createInspectorAttributes,
  getInspectorMetadata,
  INSPECTOR_ATTRIBUTES,
  setInspectorMetadata,
} from './index.js';

describe('createInspectorAttributes', () => {
  it('maps canonical attribute names', () => {
    const attrs = createInspectorAttributes({
      component: 'Button',
      file: 'src/Button.tsx',
      id: 'btn-1',
    });
    expect(attrs[INSPECTOR_ATTRIBUTES.component]).toBe('Button');
    expect(attrs[INSPECTOR_ATTRIBUTES.file]).toBe('src/Button.tsx');
    expect(attrs[INSPECTOR_ATTRIBUTES.id]).toBe('btn-1');
    expect(attrs[INSPECTOR_ATTRIBUTES.entity]).toBeUndefined();
  });

  it('includes entity when provided', () => {
    const attrs = createInspectorAttributes({
      component: 'Card',
      file: 'src/Card.tsx',
      id: 'card-1',
      entity: 'dashboard',
    });
    expect(attrs[INSPECTOR_ATTRIBUTES.entity]).toBe('dashboard');
  });
});

describe('setInspectorMetadata / getInspectorMetadata', () => {
  it('roundtrips metadata on an element', () => {
    const el = document.createElement('button');
    setInspectorMetadata(el, {
      component: 'Submit',
      file: 'src/Form.tsx',
      id: 'submit',
      entity: 'form',
    });
    expect(getInspectorMetadata(el)).toEqual({
      component: 'Submit',
      file: 'src/Form.tsx',
      id: 'submit',
      entity: 'form',
    });
  });
});
