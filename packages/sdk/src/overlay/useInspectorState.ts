import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getState, STATE_EVENT } from './client.js';
import type { HubSnapshot } from './types.js';

export function useInspectorState() {
  const [state, setState] = useState<HubSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    void getState()
      .then((snapshot) => {
        if (mounted.current) {
          setState(snapshot);
        }
      })
      .catch((err: unknown) => {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : 'Zustand laden fehlgeschlagen');
        }
      });

    const unlistenPromise = listen<HubSnapshot>(STATE_EVENT, (event) => {
      setState(event.payload);
    });

    return () => {
      mounted.current = false;
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return { state, error };
}
