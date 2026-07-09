/**
 * Numbered selected elements with status badges.
 * Location: packages/inspector-app/src/components/SelectedElements.tsx
 */

import type { SelectedElement } from '../types.js';

type Props = {
  elements: SelectedElement[];
};

function statusLabel(status: SelectedElement['status']): string {
  switch (status) {
    case 'stale_after_reload':
      return 'Veraltet';
    case 'not_found':
      return 'Nicht gefunden';
    case 'webview_closed':
      return 'WebView geschlossen';
    default:
      return 'OK';
  }
}

function statusClass(status: SelectedElement['status']): string {
  if (status === 'valid') {
    return 'bg-green-100 text-green-800';
  }
  return 'bg-red-100 text-[var(--inspector-danger)]';
}

export function SelectedElements({ elements }: Props) {
  if (elements.length === 0) {
    return <p className="text-[13px] text-[var(--inspector-muted)]">Keine Elemente ausgewählt</p>;
  }

  return (
    <ul className="space-y-2">
      {elements.map((element, index) => (
        <li key={element.id} className="rounded border border-[var(--inspector-border)] p-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">#{index + 1}</span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] ${statusClass(element.status)}`}>
              {statusLabel(element.status)}
            </span>
          </div>
          <div className="text-[13px] font-medium">{element.component ?? element.snapshot.tag}</div>
          <div className="truncate font-mono text-[12px] text-[var(--inspector-muted)]">{element.selector}</div>
        </li>
      ))}
    </ul>
  );
}
