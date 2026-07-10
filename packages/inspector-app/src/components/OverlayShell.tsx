/**
 * Draggable, collapsible shell wrapping toolbar + context panel.
 * Location: packages/inspector-app/src/components/OverlayShell.tsx
 */

import { useRef, useState, type ReactNode } from 'react';
import { IconChevronDown, IconChevronUp, IconGrip } from '../lib/icons.js';
import { Tooltip } from './Tooltip.js';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  /** When false, shell shrinks to toolbar-only width (no context panel). */
  panelOpen?: boolean;
};

export function OverlayShell({ children, footer, panelOpen = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const root = rootRef.current;
    if (!root) return;
    event.preventDefault();
    const rect = root.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const onMove = (ev: PointerEvent) => {
      const x = Math.min(Math.max(0, ev.clientX - offsetX), window.innerWidth - rect.width);
      const y = Math.min(Math.max(0, ev.clientY - offsetY), window.innerHeight - 40);
      setPos({ left: x, top: y });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const style = pos
    ? { left: pos.left, top: pos.top, right: 'auto' as const }
    : { top: 8, right: 8 };

  return (
    <div
      ref={rootRef}
      className="fixed z-[99999] flex w-fit flex-col overflow-hidden rounded-xl border border-[var(--inspector-border)] bg-[rgba(26,26,26,0.96)] shadow-xl"
      style={style}
    >
      <header className="flex select-none items-center justify-between gap-1.5 border-b border-[var(--inspector-border)] bg-[#1a1a1a] px-2 py-1">
        <Tooltip text="Overlay verschieben">
          <span
            className="flex cursor-grab text-[var(--inspector-muted)] active:cursor-grabbing"
            onPointerDown={onPointerDown}
          >
            <IconGrip />
          </span>
        </Tooltip>
        {panelOpen ? (
          <span className="flex-1 text-center text-[10px] text-[var(--inspector-muted)]">Visual Inspector</span>
        ) : null}
        <Tooltip text={collapsed ? 'Overlay ausklappen' : 'Overlay einklappen'}>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent text-[var(--inspector-text)] hover:bg-[#2a2a2a]"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Ausklappen' : 'Einklappen'}
          >
            {collapsed ? <IconChevronDown /> : <IconChevronUp />}
          </button>
        </Tooltip>
      </header>
      {!collapsed ? <div className="flex w-fit items-start gap-2 p-2">{children}</div> : null}
      {footer}
    </div>
  );
}
