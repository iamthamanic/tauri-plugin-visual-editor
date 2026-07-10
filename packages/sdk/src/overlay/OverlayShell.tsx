/**
 * Draggable, collapsible shell wrapping toolbar + context panel.
 * Location: packages/sdk/src/overlay/OverlayShell.tsx
 */

import { useRef, useState, type ReactNode } from 'react';
import { IconChevronDown, IconChevronUp, IconGrip } from './icons.js';
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

  const onPointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
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
    : undefined;

  return (
    <div ref={rootRef} className="ve-shell" style={style}>
      <header className="ve-shell__header">
        <Tooltip text="Overlay verschieben">
          <span className="ve-shell__grip" onPointerDown={onPointerDown}>
            <IconGrip />
          </span>
        </Tooltip>
        {panelOpen ? <span className="ve-shell__title">Visual Inspector</span> : null}
        <Tooltip text={collapsed ? 'Overlay ausklappen' : 'Overlay einklappen'}>
          <button
            type="button"
            className="ve-shell__collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Ausklappen' : 'Einklappen'}
          >
            {collapsed ? <IconChevronDown /> : <IconChevronUp />}
          </button>
        </Tooltip>
      </header>
      {!collapsed ? <div className="ve-shell__body">{children}</div> : null}
      {footer}
    </div>
  );
}
