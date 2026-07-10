/**
 * Toggle native Tauri WebView DevTools — always visible below the context panel.
 * Location: packages/sdk/src/overlay/DevtoolsButton.tsx
 */

import { useState } from 'react';
import { IconDevtools } from './icons.js';
import { Tooltip } from './Tooltip.js';

type Props = {
  busy?: boolean;
  onToggle: () => Promise<boolean>;
};

export function DevtoolsButton({ busy = false, onToggle }: Props) {
  const [active, setActive] = useState(false);

  return (
    <div className="ve-shell__footer" data-visual-editor-ui="true">
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
          className={['ve-btn', active ? 've-btn--active' : ''].filter(Boolean).join(' ')}
        >
          <IconDevtools />
        </button>
      </Tooltip>
    </div>
  );
}
