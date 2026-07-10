/**
 * Toggle native Tauri WebView DevTools — always visible below the context panel.
 * Location: packages/inspector-app/src/components/DevtoolsButton.tsx
 */

import { useState } from 'react';
import { IconDevtools } from '../lib/icons.js';
import { Tooltip } from './Tooltip.js';

type Props = {
  busy?: boolean;
  onToggle: () => Promise<boolean>;
};

export function DevtoolsButton({ busy = false, onToggle }: Props) {
  const [active, setActive] = useState(false);

  return (
    <div
      className="flex justify-center border-t border-[var(--inspector-border)] px-2 pb-2 pt-1.5"
      data-visual-editor-ui="true"
    >
      <Tooltip text="Devtools (Elements, Console, Network etc..)">
        <button
          type="button"
          aria-label="Console"
          disabled={busy}
          data-visual-editor-ui="true"
          onClick={() => {
            void onToggle()
              .then((open) => setActive(open))
              .catch(() => undefined);
          }}
          className={[
            'flex h-11 w-11 items-center justify-center rounded-lg border transition-colors',
            active
              ? 'border-[var(--inspector-accent)] bg-[var(--inspector-accent)] text-white'
              : 'border-[var(--inspector-border)] bg-[#2a2a2a] text-[var(--inspector-text)] hover:border-[var(--inspector-accent)] hover:bg-[#3d444d] active:scale-95',
            busy ? 'opacity-50' : '',
          ].join(' ')}
        >
          <IconDevtools />
        </button>
      </Tooltip>
    </div>
  );
}
