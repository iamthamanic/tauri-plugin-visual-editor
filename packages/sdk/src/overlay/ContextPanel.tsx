/**
 * Context text panel with element + screenshot chips, issue input, copy and clear.
 */

import { useEffect, useRef, useState } from 'react';
import { CaptureChip } from './CaptureChip.js';
import { ElementChip } from './ElementChip.js';
import { PanelActions } from './PanelActions.js';
import { extractComposerBlocks, handleComposerChipKeydown } from './composerBlocks.js';
import * as client from './client.js';
import type { ComposerBlockExport } from './client.js';
import type { Capture, SelectedElement } from './types.js';

const PLACEHOLDER = 'Write some context...';
const CHIP_SELECTOR = '[data-ve-chip], [data-ve-capture-chip]';

type Props = {
  elements: SelectedElement[];
  captures: Capture[];
  issueText: string;
  busy: boolean;
  message: string | null;
  onIssueChange: (value: string) => void;
  onCopy: (full: boolean, blocks?: ComposerBlockExport[]) => void | Promise<void>;
  onClear: () => void | Promise<void>;
};

function extractComposerText(root: HTMLElement): string {
  const parts: string[] = [];
  for (const node of root.childNodes) {
    if (node instanceof HTMLElement) {
      if (node.dataset.veChip || node.dataset.veCaptureChip) continue;
      parts.push((node.textContent ?? '').replace(/\u200B/g, ''));
      continue;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push((node.textContent ?? '').replace(/\u200B/g, ''));
    }
  }
  return parts.join('');
}

function isChipNode(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && Boolean(node.matches(CHIP_SELECTOR));
}

function focusComposerAtChip(composer: HTMLElement, clientX: number, clientY: number): void {
  composer.focus();
  const hit = document.elementFromPoint(clientX, clientY);
  const chip = hit?.closest(CHIP_SELECTOR);
  if (!(chip instanceof HTMLElement) || !composer.contains(chip)) return;
  const rect = chip.getBoundingClientRect();
  const after = clientX > rect.left + rect.width / 2;
  const range = document.createRange();
  if (after) {
    range.setStartAfter(chip);
  } else {
    range.setStartBefore(chip);
  }
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function sanitizeComposerWhileTyping(composer: HTMLElement): void {
  composer.querySelectorAll('[data-ve-composer-tail]').forEach((node) => node.remove());
  for (const node of [...composer.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const text = node.textContent ?? '';
    const cleaned = text.replace(/\u200B/g, '');
    if (!cleaned) {
      const prev = node.previousSibling;
      const next = node.nextSibling;
      const besideChip =
        (prev instanceof HTMLElement && isChipNode(prev)) ||
        (next instanceof HTMLElement && isChipNode(next));
      if (!besideChip) node.remove();
      continue;
    }
    if (cleaned !== text) node.textContent = cleaned;
  }
}

export function ContextPanel({
  elements,
  captures,
  issueText,
  busy,
  message,
  onIssueChange,
  onCopy,
  onClear,
}: Props) {
  const [wiping, setWiping] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    setWiping(true);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(async () => {
      setWiping(false);
      await onClear();
    }, 450);
  };

  const syncEmpty = () => {
    const composer = composerRef.current;
    if (!composer) return;
    const hasChips = composer.querySelector('[data-ve-chip], [data-ve-capture-chip]');
    const hasText = extractComposerText(composer).trim().length > 0;
    composer.dataset.empty = hasText || hasChips ? 'false' : 'true';
  };

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    const onKeydown = (event: KeyboardEvent) => {
      handleComposerChipKeydown(
        composer,
        event,
        {
          onRemoveElement: (elementId) => client.removeElement(elementId),
          onRemoveCapture: (captureId) => client.removeCapture(captureId),
        },
        { removeFromDom: false },
      );
    };
    composer.addEventListener('keydown', onKeydown);
    return () => composer.removeEventListener('keydown', onKeydown);
  }, []);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    if (document.activeElement === composer) return;
    if (extractComposerText(composer) === issueText) return;
    composer.querySelectorAll('[data-ve-composer-tail]').forEach((node) => node.remove());
    for (const node of [...composer.childNodes]) {
      if (node instanceof HTMLElement && (node.dataset.veChip || node.dataset.veCaptureChip)) continue;
      node.remove();
    }
    if (issueText) {
      const firstChip = composer.querySelector(CHIP_SELECTOR);
      composer.insertBefore(document.createTextNode(issueText), firstChip);
    }
    syncEmpty();
  }, [issueText]);

  return (
    <section className="ve-panel">
      <div className="ve-panel__composer">
        <div
          ref={composerRef}
          className="ve-panel__composer-flow"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={PLACEHOLDER}
          data-empty={issueText.trim() || elements.length || captures.length ? 'false' : 'true'}
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            const hit = document.elementFromPoint(event.clientX, event.clientY);
            const chip = hit?.closest(CHIP_SELECTOR);
            if (!(chip instanceof HTMLElement) || !event.currentTarget.contains(chip)) return;
            event.preventDefault();
            focusComposerAtChip(event.currentTarget, event.clientX, event.clientY);
          }}
          onInput={(event) => {
            sanitizeComposerWhileTyping(event.currentTarget);
            syncEmpty();
            onIssueChange(extractComposerText(event.currentTarget));
          }}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
        >
          {elements.map((el) => (
            <ElementChip key={el.id} element={el} />
          ))}
          {captures.map((capture, index) => (
            <CaptureChip key={capture.id} capture={capture} index={index} />
          ))}
        </div>
        {wiping ? <span className="ve-clear-wipe" /> : null}
      </div>
      <PanelActions
        busy={busy || wiping}
        message={message}
        onCopy={(full) => {
          const blocks = composerRef.current
            ? extractComposerBlocks(composerRef.current)
            : undefined;
          return onCopy(full, blocks);
        }}
        onClear={handleClear}
      />
    </section>
  );
}
