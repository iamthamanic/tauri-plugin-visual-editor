/**
 * Simple hover tooltip for overlay toolbar buttons.
 * Location: packages/inspector-app/src/components/Tooltip.tsx
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
    <span ref={anchorRef} className="relative inline-flex" onMouseEnter={show} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible ? (
        <span
          className="pointer-events-none fixed z-[2147483647] max-w-[220px] -translate-y-1/2 rounded-md border border-[var(--inspector-border)] bg-[#0d1117] px-2.5 py-1.5 text-[11px] leading-snug text-[var(--inspector-text)] shadow-lg"
          style={{ left: pos.left, top: pos.top }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
