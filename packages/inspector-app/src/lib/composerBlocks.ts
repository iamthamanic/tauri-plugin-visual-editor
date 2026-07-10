/**
 * Ordered composer block extraction for copy export.
 * Location: packages/inspector-app/src/lib/composerBlocks.ts
 */

const TAIL_ATTR = 'data-ve-composer-tail';
const ZWSP = '\u200B';

export type ComposerBlockExport =
  | { type: 'text'; content: string }
  | { type: 'element'; id: string }
  | { type: 'capture'; id: string };

function stripZwsp(text: string): string {
  return text.replace(/\u200B/g, '');
}

/** Walk composer DOM in document order for ordered clipboard export. */
export function extractComposerBlocks(composer: HTMLElement): ComposerBlockExport[] {
  const blocks: ComposerBlockExport[] = [];

  const pushText = (raw: string) => {
    const text = stripZwsp(raw);
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
      if (node instanceof HTMLElement && node.hasAttribute(TAIL_ATTR)) continue;

      if (node instanceof HTMLElement) {
        if (node.hasAttribute('data-ve-chip')) {
          const id = node.getAttribute('data-ve-chip-id');
          if (id) blocks.push({ type: 'element', id });
          continue;
        }
        if (node.hasAttribute('data-ve-capture-chip')) {
          const id = node.getAttribute('data-ve-capture-chip');
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

function isGapTextNode(node: Node): boolean {
  return node.nodeType === Node.TEXT_NODE && stripZwsp(node.textContent ?? '').length === 0;
}

function isChipNode(node: Node): node is HTMLElement {
  return (
    node instanceof HTMLElement &&
    (node.hasAttribute('data-ve-chip') || node.hasAttribute('data-ve-capture-chip'))
  );
}

function resolveChipSibling(node: Node | null, direction: 'before' | 'after'): HTMLElement | null {
  if (!node) return null;
  if (isChipNode(node)) return node;
  if (isGapTextNode(node)) {
    const adjacent = direction === 'before' ? node.previousSibling : node.nextSibling;
    if (adjacent && isChipNode(adjacent)) return adjacent;
  }
  return null;
}

function getAdjacentChip(composer: HTMLElement, direction: 'before' | 'after'): HTMLElement | null {
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
        if (stripZwsp(beforeCaret).length === 0) {
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
      if (stripZwsp(afterCaret).length === 0) {
        return resolveChipSibling(textNode.nextSibling, 'after');
      }
    }
    return null;
  }

  if (startContainer === composer) {
    const index = direction === 'before' ? startOffset - 1 : startOffset;
    const node = composer.childNodes[index];
    if (node && isChipNode(node)) return node;
    if (node) return resolveChipSibling(node, direction);
  }

  return null;
}

export type ComposerChipKeydownHandlers = {
  onRemoveElement?: (id: string) => void | Promise<void>;
  onRemoveCapture?: (id: string) => void | Promise<void>;
};

export function handleComposerChipKeydown(
  composer: HTMLElement,
  event: KeyboardEvent,
  handlers: ComposerChipKeydownHandlers,
  options?: { removeFromDom?: boolean },
): void {
  if (event.key !== 'Backspace' && event.key !== 'Delete') return;
  if (event.isComposing) return;

  const chip = getAdjacentChip(composer, event.key === 'Backspace' ? 'before' : 'after');
  if (!chip) return;

  event.preventDefault();
  const elementId = chip.getAttribute('data-ve-chip-id');
  const captureId = chip.getAttribute('data-ve-capture-chip');
  if (options?.removeFromDom !== false) {
    chip.remove();
  }

  if (elementId) void handlers.onRemoveElement?.(elementId);
  if (captureId) void handlers.onRemoveCapture?.(captureId);

  composer.dispatchEvent(new InputEvent('input', { bubbles: true }));
}
