/**
 * Copy / Clear panel actions with success animation.
 */

import { useState } from 'react';
import { IconCheck } from './icons.js';

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

  return (
    <div className="ve-panel__actions">
      <div className="ve-panel__btn-row">
        <button
          type="button"
          className={copySuccess ? 've-panel__btn ve-panel__btn--success' : 've-panel__btn'}
          disabled={busy}
          title="Issue + Kontext-Refs kopieren (Shift: volles Bundle)"
          onClick={(event) => void handleCopy(event.shiftKey)}
        >
          {copySuccess ? <IconCheck /> : 'Copy'}
        </button>
        <button type="button" className="ve-panel__btn" disabled={busy} onClick={() => void onClear()}>
          Clear
        </button>
      </div>
      {message ? <span className="ve-panel__message">{message}</span> : null}
    </div>
  );
}
