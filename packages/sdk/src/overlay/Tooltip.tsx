/**
 * Simple hover tooltip for overlay toolbar buttons.
 * Location: packages/sdk/src/overlay/Tooltip.tsx
 */

import { useRef, useState, type ReactNode } from 'react';

type Props = {
  text: string;
  children: ReactNode;
};

export function Tooltip({ text, children }: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      left: Math.max(8, rect.left - 228),
      top: rect.top + rect.height / 2,
    });
    setVisible(true);
  };

  return (
    <span ref={anchorRef} className="ve-tooltip-anchor" onMouseEnter={show} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible ? (
        <span className="ve-tooltip" style={{ left: pos.left, top: pos.top }}>
          {text}
        </span>
      ) : null}
    </span>
  );
}
