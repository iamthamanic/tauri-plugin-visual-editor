/**
 * Cursor-style element chip with hover inspector popover.
 * Location: packages/inspector-app/src/components/ElementChip.tsx
 */

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as api from '../api.js';
import { buildElementInfoSections, elementChipLabel } from '../lib/elementChip.js';
import { IconChip } from '../lib/icons.js';
import type { SelectedElement } from '../types.js';
import { ChipRemoveButton } from './ChipRemoveButton.js';

type Props = {
  element: SelectedElement;
};

export function ElementChip({ element }: Props) {
  const chipRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const show = () => {
    const rect = chipRef.current?.getBoundingClientRect();
    if (!rect) return;
    let left = rect.left;
    let top = rect.bottom + 8;
    if (left + 320 > window.innerWidth - 8) left = window.innerWidth - 328;
    if (top + 200 > window.innerHeight - 8) top = rect.top - 220;
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
    setVisible(true);
  };

  const sections = buildElementInfoSections(element);

  return (
    <>
      <span
        ref={chipRef}
        className="inline-flex max-w-full cursor-default items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-[rgba(88,166,255,0.55)] bg-[rgba(88,166,255,0.12)] px-2 py-0.5 font-mono text-[11px] text-[var(--inspector-text)]"
        contentEditable={false}
        data-ve-chip="true"
        data-ve-chip-id={element.id}
        suppressContentEditableWarning
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
      >
        <span className="flex text-[var(--inspector-accent)]">
          <IconChip />
        </span>
        {elementChipLabel(element)}
        <ChipRemoveButton onRemove={() => api.removeElement(element.id)} />
      </span>
      {visible
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[2147483647] max-h-[360px] w-[320px] overflow-auto rounded-lg border border-[var(--inspector-border)] bg-[#0d1117] p-3 shadow-xl"
              style={{ left: pos.left, top: pos.top }}
            >
              {sections.map((section) => (
                <div key={section.title} className="mb-2.5 last:mb-0">
                  <div className="mb-1 text-[10px] font-semibold text-[var(--inspector-muted)]">{section.title}</div>
                  <div className="whitespace-pre-wrap break-all font-mono text-[11px] text-[var(--inspector-text)]">
                    {section.body}
                  </div>
                </div>
              ))}
            </div>,
            document.documentElement,
          )
        : null}
    </>
  );
}
