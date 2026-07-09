/**
 * Inspector enable/open/toggle controls for the demo host app.
 * Location: examples/react-vite/src/components/InspectorToolbar.tsx
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const PLUGIN = 'plugin:visual-editor';

async function runInspectorAction(
  label: string,
  fn: () => Promise<unknown>,
  setMessage: (value: string | null) => void,
): Promise<void> {
  setMessage(null);
  try {
    await fn();
    setMessage(label);
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Aktion fehlgeschlagen');
  }
}

export function InspectorToolbar() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="toolbar" aria-label="Inspector-Steuerung">
      <button
        type="button"
        className="primary"
        onClick={() =>
          void runInspectorAction(
            'Inspector aktiviert',
            () => invoke(`${PLUGIN}|enable`),
            setMessage,
          )
        }
      >
        Inspector aktivieren
      </button>
      <button
        type="button"
        onClick={() =>
          void runInspectorAction(
            'Inspector-Fenster geöffnet',
            () => invoke(`${PLUGIN}|open`, { options: { autoEnable: true } }),
            setMessage,
          )
        }
      >
        Inspector öffnen
      </button>
      <button
        type="button"
        onClick={() =>
          void runInspectorAction(
            'Inspector umgeschaltet',
            () => invoke(`${PLUGIN}|toggle`),
            setMessage,
          )
        }
      >
        Inspector umschalten
      </button>
      {message ? <span style={{ fontSize: 13, color: '#656d76', alignSelf: 'center' }}>{message}</span> : null}
    </section>
  );
}
