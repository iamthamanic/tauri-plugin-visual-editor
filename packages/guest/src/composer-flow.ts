/**
 * Contenteditable composer helpers — inline chips + free typing (Cursor-style).
 * Location: packages/guest/src/composer-flow.ts
 */

export const COMPOSER_TAIL_ATTR = 'data-visual-editor-composer-tail';
const ZWSP = '\u200B';
const CHIP_SELECTOR = '[data-visual-editor-chip], [data-visual-editor-capture-chip]';

export function stripComposerZwsp(text: string): string {
  return text.replace(/\u200B/g, '');
}

export function isComposerChipNode(node: Node): boolean {
  return (
    node instanceof HTMLElement &&
    (node.hasAttribute('data-visual-editor-chip') ||
      node.hasAttribute('data-visual-editor-capture-chip'))
  );
}

function isLegacyTailNode(node: Node): boolean {
  return node instanceof HTMLElement && node.hasAttribute(COMPOSER_TAIL_ATTR);
}

function isGapTextNode(node: Node): boolean {
  return node.nodeType === Node.TEXT_NODE && stripComposerZwsp(node.textContent ?? '').length === 0;
}

function hasVisibleText(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return stripComposerZwsp(node.textContent ?? '').length > 0;
  }
  if (node instanceof HTMLElement && !isComposerChipNode(node) && !isLegacyTailNode(node)) {
    return stripComposerZwsp(node.textContent ?? '').length > 0;
  }
  return false;
}

/** Remove legacy non-editable tail spans from older builds. */
function removeLegacyTails(composer: HTMLElement): void {
  composer.querySelectorAll(`[${COMPOSER_TAIL_ATTR}]`).forEach((node) => node.remove());
}

function removeGapTextNodes(composer: HTMLElement): void {
  for (const node of [...composer.childNodes]) {
    if (isGapTextNode(node)) node.remove();
  }
}

function stripZwspFromTextNodes(composer: HTMLElement): void {
  for (const node of [...composer.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const cleaned = stripComposerZwsp(node.textContent ?? '');
      if (!cleaned) {
        node.remove();
      } else if (cleaned !== node.textContent) {
        node.textContent = cleaned;
      }
      continue;
    }
    if (node instanceof HTMLElement && !isComposerChipNode(node) && !isLegacyTailNode(node)) {
      stripZwspFromTextNodes(node);
    }
  }
}

function mergeAdjacentTextNodes(composer: HTMLElement): void {
  let i = 0;
  while (i < composer.childNodes.length) {
    const node = composer.childNodes[i];
    if (node.nodeType !== Node.TEXT_NODE) {
      i++;
      continue;
    }

    let text = stripComposerZwsp(node.textContent ?? '');
    if (!text) {
      node.remove();
      continue;
    }

    let j = i + 1;
    while (j < composer.childNodes.length) {
      const next = composer.childNodes[j];
      if (next.nodeType === Node.TEXT_NODE) {
        text += stripComposerZwsp(next.textContent ?? '');
        next.remove();
        continue;
      }
      break;
    }

    node.textContent = text;
    i++;
  }
}

function insertGapBefore(composer: HTMLElement, ref: ChildNode | null): void {
  const prev = ref?.previousSibling;
  if (prev && isGapTextNode(prev)) return;
  composer.insertBefore(document.createTextNode(ZWSP), ref);
}

function removeOrphanGapNodes(composer: HTMLElement): void {
  for (const node of [...composer.childNodes]) {
    if (!isGapTextNode(node)) continue;
    const prev = node.previousSibling;
    const next = node.nextSibling;
    const besideChip =
      (prev instanceof HTMLElement && isComposerChipNode(prev)) ||
      (next instanceof HTMLElement && isComposerChipNode(next));
    if (!besideChip) node.remove();
  }

  let last = composer.lastChild;
  while (last && isGapTextNode(last)) {
    const prev = last.previousSibling;
    if (prev instanceof HTMLElement && isComposerChipNode(prev)) break;
    const orphan = last;
    last = prev;
    orphan.remove();
  }
}

function ensureBoundaryGaps(composer: HTMLElement): void {
  const children = [...composer.childNodes].filter((node) => !isLegacyTailNode(node));
  for (let i = children.length - 1; i > 0; i--) {
    const prev = children[i - 1];
    const curr = children[i];
    if (isGapTextNode(prev) || isGapTextNode(curr)) continue;
    if (!isComposerChipNode(prev) && !isComposerChipNode(curr)) continue;
    composer.insertBefore(document.createTextNode(ZWSP), curr);
  }

  const first = composer.firstChild;
  if (first && isComposerChipNode(first)) {
    insertGapBefore(composer, first);
  }

  const last = composer.lastChild;
  if (last && isComposerChipNode(last)) {
    const next = last.nextSibling;
    if (!next || !isGapTextNode(next)) {
      composer.appendChild(document.createTextNode(ZWSP));
    }
  }

  removeOrphanGapNodes(composer);
}

/** Ensure ZWSP-only gap nodes around chips; never embed ZWSP inside user text. */
export function normalizeComposerInlines(composer: HTMLElement): void {
  removeLegacyTails(composer);
  removeGapTextNodes(composer);
  stripZwspFromTextNodes(composer);
  mergeAdjacentTextNodes(composer);
  ensureBoundaryGaps(composer);
}

export function ensureComposerTail(composer: HTMLElement): void {
  removeLegacyTails(composer);
  const hasChips = composer.querySelector(CHIP_SELECTOR);
  if (hasChips) {
    normalizeComposerInlines(composer);
    return;
  }
  removeOrphanGapNodes(composer);
  stripZwspFromTextNodes(composer);
  mergeAdjacentTextNodes(composer);
}

export function saveComposerCaret(composer: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const anchor = sel.anchorNode;
  if (!anchor || !composer.contains(anchor)) return null;
  return sel.getRangeAt(0).cloneRange();
}

export function restoreComposerCaret(range: Range | null): void {
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCaretInTextNode(textNode: Text, offset: number): void {
  const range = document.createRange();
  range.setStart(textNode, Math.max(0, Math.min(offset, textNode.length)));
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function ensureZwspGapBefore(chip: HTMLElement): Text {
  const prev = chip.previousSibling;
  if (prev && isGapTextNode(prev)) return prev as Text;
  const gap = document.createTextNode(ZWSP);
  chip.parentElement?.insertBefore(gap, chip);
  return gap;
}

function ensureZwspGapAfter(chip: HTMLElement): Text {
  const next = chip.nextSibling;
  if (next && isGapTextNode(next)) return next as Text;
  const gap = document.createTextNode(ZWSP);
  chip.parentElement?.insertBefore(gap, chip.nextSibling);
  return gap;
}

export function placeCaretBesideChip(chip: HTMLElement, after: boolean): void {
  const gap = after ? ensureZwspGapAfter(chip) : ensureZwspGapBefore(chip);
  // Always offset 0 so Backspace at "after chip" finds the chip in one keypress.
  placeCaretInTextNode(gap, 0);
}

/** Place caret beside a chip after click; text clicks use native browser placement. */
export function focusComposerAtChip(composer: HTMLElement, clientX: number, clientY: number): void {
  normalizeComposerInlines(composer);
  composer.focus();

  const hit = document.elementFromPoint(clientX, clientY);
  const chip = hit?.closest(CHIP_SELECTOR);
  if (!(chip instanceof HTMLElement) || !composer.contains(chip)) return;

  const rect = chip.getBoundingClientRect();
  placeCaretBesideChip(chip, clientX > rect.left + rect.width / 2);
}

export function extractComposerText(composer: HTMLElement): string {
  const parts: string[] = [];
  for (const node of composer.childNodes) {
    if (isLegacyTailNode(node) || isComposerChipNode(node) || isGapTextNode(node)) continue;
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(stripComposerZwsp(node.textContent ?? ''));
      continue;
    }
    if (node instanceof HTMLElement) {
      if (node.tagName === 'BR') {
        parts.push('\n');
        continue;
      }
      if (node.tagName === 'DIV' || node.tagName === 'P') {
        if (parts.length > 0) parts.push('\n');
        parts.push(stripComposerZwsp(node.textContent ?? ''));
        continue;
      }
      if (hasVisibleText(node)) {
        parts.push(stripComposerZwsp(node.textContent ?? ''));
      }
    }
  }
  return parts.join('');
}

export type ComposerBlockExport =
  | { type: 'text'; content: string }
  | { type: 'element'; id: string }
  | { type: 'capture'; id: string };

function readElementChipId(chip: HTMLElement): string | null {
  return chip.getAttribute('data-chip-id');
}

function readCaptureChipId(chip: HTMLElement): string | null {
  return chip.getAttribute('data-visual-editor-capture-chip');
}

/** Walk composer DOM in document order for ordered clipboard export. */
export function extractComposerBlocks(composer: HTMLElement): ComposerBlockExport[] {
  const blocks: ComposerBlockExport[] = [];

  const pushText = (raw: string) => {
    const text = stripComposerZwsp(raw);
    if (!text) return;
    const last = blocks[blocks.length - 1];
    if (last?.type === 'text') {
      last.content += text;
      return;
    }
    blocks.push({ type: 'text', content: text });
  };

  const walk = (parent: Node) => {
    for (const node of parent.childNodes) {
      if (isLegacyTailNode(node) || isGapTextNode(node)) continue;

      if (node instanceof HTMLElement) {
        if (node.hasAttribute('data-visual-editor-chip')) {
          const id = readElementChipId(node);
          if (id) blocks.push({ type: 'element', id });
          continue;
        }
        if (node.hasAttribute('data-visual-editor-capture-chip')) {
          const id = readCaptureChipId(node);
          if (id) blocks.push({ type: 'capture', id });
          continue;
        }
        if (node.tagName === 'BR') {
          pushText('\n');
          continue;
        }
        if (node.tagName === 'DIV' || node.tagName === 'P') {
          if (blocks.length > 0) pushText('\n');
          walk(node);
          continue;
        }
        pushText(node.textContent ?? '');
        continue;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        pushText(node.textContent ?? '');
      }
    }
  };

  walk(composer);
  return blocks;
}

type ChipSetupOptions = {
  onChipClick?: () => void;
};

/** Cursor-style chip: click sets caret before/after, drag reorders inside composer. */
export function setupComposerChip(
  chip: HTMLElement,
  composer: HTMLElement,
  options: ChipSetupOptions = {},
): void {
  chip.setAttribute('contenteditable', 'false');
  chip.draggable = true;
  chip.style.cursor = 'grab';

  chip.addEventListener('dragstart', (event) => {
    const id =
      chip.getAttribute('data-chip-id') ??
      chip.getAttribute('data-visual-editor-capture-chip') ??
      '';
    event.dataTransfer?.setData('application/x-visual-editor-chip', id);
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    chip.style.opacity = '0.55';
  });

  chip.addEventListener('dragend', () => {
    chip.style.opacity = '';
    normalizeComposerInlines(composer);
  });

  chip.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    normalizeComposerInlines(composer);
    composer.focus();
    const rect = chip.getBoundingClientRect();
    placeCaretBesideChip(chip, event.clientX > rect.left + rect.width / 2);
  });

  chip.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.onChipClick?.();
  });
}

function findChipById(composer: HTMLElement, id: string): HTMLElement | null {
  const el = composer.querySelector(`[data-chip-id="${id}"]`);
  if (el instanceof HTMLElement) return el;
  const cap = composer.querySelector(`[data-visual-editor-capture-chip="${id}"]`);
  return cap instanceof HTMLElement ? cap : null;
}

function insertChipAtPoint(composer: HTMLElement, chip: HTMLElement, clientX: number, clientY: number): void {
  const doc = composer.ownerDocument;
  const range = doc.caretRangeFromPoint?.(clientX, clientY);
  if (!range || !composer.contains(range.startContainer)) {
    composer.appendChild(chip);
    return;
  }
  insertChipAtRange(composer, chip, range);
}

export function insertChipAtRange(composer: HTMLElement, chip: HTMLElement, range: Range): void {
  const { startContainer, startOffset } = range;
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = startContainer as Text;
    if (isGapTextNode(textNode)) {
      composer.insertBefore(chip, textNode);
      return;
    }
    const text = textNode.textContent ?? '';
    const before = stripComposerZwsp(text.slice(0, startOffset));
    const after = stripComposerZwsp(text.slice(startOffset));
    textNode.textContent = before;
    const afterNode = document.createTextNode(after);
    const parent = textNode.parentNode;
    if (!parent) return;
    parent.insertBefore(chip, textNode.nextSibling);
    if (after) {
      parent.insertBefore(afterNode, chip.nextSibling);
    }
    return;
  }

  if (startContainer === composer) {
    const ref = composer.childNodes[startOffset] ?? null;
    composer.insertBefore(chip, ref);
    return;
  }

  composer.appendChild(chip);
}

/** Enable dropping chips at the caret position inside the composer. */
export function setupComposerDropTarget(composer: HTMLElement): void {
  composer.addEventListener('dragover', (event) => {
    if (!event.dataTransfer?.types.includes('application/x-visual-editor-chip')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });

  composer.addEventListener('drop', (event) => {
    const id = event.dataTransfer?.getData('application/x-visual-editor-chip');
    if (!id) return;
    event.preventDefault();
    const chip = findChipById(composer, id);
    if (!chip) return;
    chip.remove();
    insertChipAtPoint(composer, chip, event.clientX, event.clientY);
    normalizeComposerInlines(composer);
    composer.focus();
    composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromDrop' }));
  });
}

/** Light cleanup during typing — never append trailing gaps after plain text; preserve caret. */
export function sanitizeComposerWhileTyping(composer: HTMLElement): void {
  removeLegacyTails(composer);

  const sel = window.getSelection();
  const anchorNode = sel?.anchorNode ?? null;
  const anchorOffset = sel?.anchorOffset ?? 0;
  const hadFocus = document.activeElement === composer;

  for (const node of [...composer.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const text = node.textContent ?? '';
    const cleaned = stripComposerZwsp(text);

    const isActiveText = node === anchorNode || node.contains(anchorNode);

    if (!cleaned) {
      const prev = node.previousSibling;
      const next = node.nextSibling;
      const besideChip =
        (prev instanceof HTMLElement && isComposerChipNode(prev)) ||
        (next instanceof HTMLElement && isComposerChipNode(next));
      if (!besideChip) {
        if (isActiveText && sel) {
          const target = next ?? prev;
          if (target) {
            const range = document.createRange();
            if (target instanceof Text) {
              range.setStart(target, next ? 0 : target.length);
            } else {
              range.setStartBefore(target);
            }
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        node.remove();
      }
      continue;
    }

    if (cleaned !== text) {
      if (isActiveText && sel) {
        const leadingZwsp = text.length - text.replace(/^\u200B+/, '').length;
        const offset = Math.max(0, anchorOffset - leadingZwsp);
        node.textContent = cleaned;
        const clamped = Math.min(offset, cleaned.length);
        const range = document.createRange();
        range.setStart(node, clamped);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        node.textContent = cleaned;
      }
    }
  }

  removeOrphanGapNodes(composer);

  if (hadFocus) composer.focus();
}

export function isAnyComposerChip(node: Node): node is HTMLElement {
  return (
    isComposerChipNode(node) ||
    (node instanceof HTMLElement &&
      (node.hasAttribute('data-ve-chip') || node.hasAttribute('data-ve-capture-chip')))
  );
}

function chipElementId(chip: HTMLElement): string | null {
  return chip.getAttribute('data-chip-id') ?? chip.getAttribute('data-ve-chip-id');
}

function chipCaptureId(chip: HTMLElement): string | null {
  const id =
    chip.getAttribute('data-visual-editor-capture-chip') ??
    chip.getAttribute('data-ve-capture-chip');
  if (!id || id === 'true') return null;
  return id;
}

function resolveChipSibling(node: Node | null, direction: 'before' | 'after'): HTMLElement | null {
  if (!node) return null;
  if (isAnyComposerChip(node)) return node;
  if (isGapTextNode(node)) {
    const adjacent = direction === 'before' ? node.previousSibling : node.nextSibling;
    if (adjacent instanceof HTMLElement && isAnyComposerChip(adjacent)) return adjacent;
  }
  return null;
}

/** Chip adjacent to caret for Backspace (before) or Delete (after). */
export function getAdjacentComposerChip(
  composer: HTMLElement,
  direction: 'before' | 'after',
): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  if (!sel.anchorNode || !composer.contains(sel.anchorNode)) return null;

  const { startContainer, startOffset } = sel.getRangeAt(0);

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = startContainer as Text;
    if (direction === 'before') {
      if (startOffset === 0) {
        return resolveChipSibling(textNode.previousSibling, 'before');
      }
      if (isGapTextNode(textNode)) {
        const beforeCaret = textNode.textContent?.slice(0, startOffset) ?? '';
        if (stripComposerZwsp(beforeCaret).length === 0) {
          return resolveChipSibling(textNode.previousSibling, 'before');
        }
      }
      return null;
    }
    if (direction === 'after' && startOffset === textNode.length) {
      return resolveChipSibling(textNode.nextSibling, 'after');
    }
    if (direction === 'after' && isGapTextNode(textNode)) {
      const afterCaret = textNode.textContent?.slice(startOffset) ?? '';
      if (stripComposerZwsp(afterCaret).length === 0) {
        return resolveChipSibling(textNode.nextSibling, 'after');
      }
    }
    return null;
  }

  if (startContainer === composer) {
    const index = direction === 'before' ? startOffset - 1 : startOffset;
    const node = composer.childNodes[index];
    if (node instanceof HTMLElement && isAnyComposerChip(node)) return node;
    if (node) return resolveChipSibling(node, direction);
  }

  return null;
}

export type ComposerChipKeydownHandlers = {
  onRemoveElement?: (id: string) => void | Promise<void>;
  onRemoveCapture?: (id: string) => void | Promise<void>;
};

/** Backspace/Delete removes element or screenshot chips like text. */
export function handleComposerChipKeydown(
  composer: HTMLElement,
  event: KeyboardEvent,
  handlers: ComposerChipKeydownHandlers,
): void {
  if (event.key !== 'Backspace' && event.key !== 'Delete') return;
  if (event.isComposing) return;

  const direction = event.key === 'Backspace' ? 'before' : 'after';
  const chip = getAdjacentComposerChip(composer, direction);
  if (!chip) return;

  event.preventDefault();
  const elementId = chipElementId(chip);
  const captureId = chipCaptureId(chip);

  if (elementId) void handlers.onRemoveElement?.(elementId);
  if (captureId) void handlers.onRemoveCapture?.(captureId);

  composer.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

export function setupComposerChipKeydown(
  composer: HTMLElement,
  handlers: ComposerChipKeydownHandlers,
): void {
  composer.addEventListener('keydown', (event) => {
    handleComposerChipKeydown(composer, event, handlers);
  });
}
