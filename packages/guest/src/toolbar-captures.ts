/**
 * Screenshot capture chips with hover preview and edit entry.
 * Location: packages/guest/src/toolbar-captures.ts
 */

import { invoke } from '@tauri-apps/api/core';
import { loadCaptureBlobUrl } from './capture-image.js';
import { setupComposerChip } from './composer-flow.js';
import { mountFloatingElement } from './floating-ui.js';
import { ICON_CAPTURE_CHIP } from './toolbar-icons.js';
import { createChipRemoveButton } from './toolbar-ui.js';
import { openScreenshotEditor } from './screenshot-editor.js';
import type { Capture } from './toolbar-types.js';

const PLUGIN = 'plugin:visual-editor';

let activePreview: HTMLDivElement | null = null;
let activePreviewUrl: string | null = null;

function hidePreview(): void {
  activePreview?.remove();
  activePreview = null;
  if (activePreviewUrl) {
    URL.revokeObjectURL(activePreviewUrl);
    activePreviewUrl = null;
  }
}

function captureLabel(capture: Capture, index: number): string {
  const type = capture.capture_type === 'webview' ? 'Screenshot' : capture.capture_type;
  return `${type} #${index + 1}`;
}

export function renderCaptureChip(
  capture: Capture,
  index: number,
  _cacheBust: string | number,
  composer: HTMLElement,
  onSaved: () => void,
  onRemove?: (captureId: string) => void,
): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.setAttribute('data-visual-editor-capture-chip', capture.id);
  chip.setAttribute('contenteditable', 'false');
  Object.assign(chip.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(63,185,80,0.55)',
    background: 'rgba(63,185,80,0.12)',
    color: '#e6edf3',
    fontSize: '11px',
    cursor: 'pointer',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    userSelect: 'none',
    margin: '4px 6px 10px 0',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  });

  const icon = document.createElement('span');
  icon.innerHTML = ICON_CAPTURE_CHIP;
  icon.style.display = 'flex';
  icon.style.color = '#3fb950';

  const label = document.createElement('span');
  label.textContent = captureLabel(capture, index);

  chip.append(icon, label);
  if (onRemove) {
    chip.append(
      createChipRemoveButton(composer, chip, () => {
        hidePreview();
        onRemove(capture.id);
      }),
    );
  }

  chip.addEventListener('mouseenter', () => {
    hidePreview();
    chip.style.background = 'rgba(63,185,80,0.22)';
    chip.style.borderColor = '#3fb950';
    void loadCaptureBlobUrl(capture.id)
      .then((url) => {
        activePreviewUrl = url;
        const pop = document.createElement('div');
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Screenshot Vorschau';
        Object.assign(img.style, {
          display: 'block',
          maxWidth: '280px',
          maxHeight: '200px',
          borderRadius: '6px',
        });
        Object.assign(pop.style, {
          position: 'fixed',
          padding: '8px',
          borderRadius: '8px',
          background: '#0d1117',
          border: '1px solid #3d3d3d',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        });
        pop.append(img);
        mountFloatingElement(pop);
        activePreview = pop;
        const rect = chip.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + 8;
        if (left + 300 > window.innerWidth - 8) left = window.innerWidth - 308;
        if (top + 220 > window.innerHeight - 8) top = rect.top - 228;
        pop.style.left = `${Math.max(8, left)}px`;
        pop.style.top = `${Math.max(8, top)}px`;
      })
      .catch(() => undefined);
  });

  chip.addEventListener('mouseleave', () => {
    hidePreview();
    chip.style.background = 'rgba(63,185,80,0.12)';
    chip.style.borderColor = 'rgba(63,185,80,0.55)';
  });

  setupComposerChip(chip, composer, {
    onChipClick: () => {
      hidePreview();
      openScreenshotEditor({
        captureId: capture.id,
        onSave: async (pngBytes) => {
          await invoke(`${PLUGIN}|save_capture_image`, {
            captureId: capture.id,
            pngBytes,
          });
          onSaved();
        },
      });
    },
  });

  return chip;
}
