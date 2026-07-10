/**
 * Copy / Clear panel actions with success animation.
 * Location: packages/inspector-app/src/components/PanelActions.tsx
 */

import { useState } from 'react';
import { IconCheck } from '../lib/icons.js';

type Props = {
  busy: boolean;
  message: string | null;
  onCopy: (full: boolean) => void | Promise<void>;
  onClear: () => void | Promise<void>;
};

export function PanelActions({ busy, message, onCopy, onClear }: Props) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async (full: boolean) => {
    await onCopy(full);
    if (!full) {
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const baseBtn =
    'rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-50';
  const idleBtn = `${baseBtn} border-[var(--inspector-border)] bg-transparent text-[var(--inspector-text)] hover:border-[var(--inspector-accent)] hover:bg-[#2a2a2a]`;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          title="Issue + Kontext-Refs kopieren (Shift: volles Bundle)"
          onClick={(event) => void handleCopy(event.shiftKey)}
          className={
            copySuccess
              ? `${baseBtn} inline-flex min-w-[56px] items-center justify-center border-[var(--inspector-accent)] bg-[var(--inspector-accent)] text-white`
              : idleBtn
          }
        >
          {copySuccess ? <IconCheck /> : 'Copy'}
        </button>
        <button type="button" className={idleBtn} disabled={busy} onClick={() => void onClear()}>
          Clear
        </button>
      </div>
      {message ? <span className="text-[11px] text-[var(--inspector-muted)]">{message}</span> : null}
    </div>
  );
}
