/**
 * Cursor-style element chip with hover inspector popover.
 * Location: packages/sdk/src/overlay/ElementChip.tsx
 */

import { useRef, useState } from 'react';
import { buildElementInfoSections, elementChipLabel } from './chipHelpers.js';
import { ChipRemoveButton } from './ChipRemoveButton.js';
import * as client from './client.js';
import { IconChip } from './icons.js';
import type { SelectedElement } from './types.js';

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
        className="ve-chip"
        contentEditable={false}
        data-ve-chip="true"
        data-ve-chip-id={element.id}
        suppressContentEditableWarning
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
      >
        <span className="ve-chip__icon">
          <IconChip />
        </span>
        {elementChipLabel(element)}
        <ChipRemoveButton onRemove={() => client.removeElement(element.id)} />
      </span>
      {visible ? (
        <div className="ve-chip-popover" style={{ left: pos.left, top: pos.top }}>
          {sections.map((section) => (
            <div key={section.title} className="ve-chip-popover__section">
              <div className="ve-chip-popover__title">{section.title}</div>
              <div className="ve-chip-popover__body">{section.body}</div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
