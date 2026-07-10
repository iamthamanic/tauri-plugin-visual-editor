/**
 * Embedded visual editor overlay — mount once in the host Tauri app root.
 * Import `@iamthamanic/visual-editor-sdk/overlay.css` in your host entry.
 */

import { useEffect, useRef, useState } from 'react';
import * as client from './client.js';
import { ContextPanel } from './ContextPanel.js';
import { FloatingToolbar } from './FloatingToolbar.js';
import { OverlayShell } from './OverlayShell.js';
import { useInspectorState } from './useInspectorState.js';

export type VisualEditorOverlayProps = {
  /** Calls `open` with picker enabled on mount (default: true). */
  autoEnable?: boolean;
  /** Hide when hub reports inspector closed (default: false — always visible while mounted). */
  respectHubVisibility?: boolean;
  className?: string;
};

const MESSAGE_TTL_MS = 2500;

async function runAction(
  fn: () => Promise<unknown>,
  setBusy: (value: boolean) => void,
  setMessage: (value: string | null) => void,
  success: string,
  messageTimer: { current: ReturnType<typeof setTimeout> | null },
): Promise<void> {
  if (messageTimer.current) clearTimeout(messageTimer.current);
  setBusy(true);
  setMessage(null);
  try {
    await fn();
    setMessage(success);
    messageTimer.current = setTimeout(() => {
      setMessage(null);
      messageTimer.current = null;
    }, MESSAGE_TTL_MS);
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Aktion fehlgeschlagen');
    messageTimer.current = setTimeout(() => {
      setMessage(null);
      messageTimer.current = null;
    }, 4000);
  } finally {
    setBusy(false);
  }
}

export function VisualEditorOverlay({
  autoEnable = true,
  respectHubVisibility = false,
  className,
}: VisualEditorOverlayProps) {
  const { state, error } = useInspectorState();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [devtoolsActive, setDevtoolsActive] = useState(false);
  const [issueText, setIssueText] = useState('');
  const issueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSelectionCount = useRef(0);
  const prevCaptureCount = useRef(0);
  const booted = useRef(false);

  useEffect(() => {
    if (!autoEnable || booted.current) return;
    booted.current = true;
    void client.open({ autoEnable: true }).catch(() => undefined);
  }, [autoEnable]);

  useEffect(() => {
    if (state?.session.issue_text != null) {
      setIssueText(state.session.issue_text);
    }
  }, [state?.session.issue_text]);

  useEffect(() => {
    const count = state?.session.selected_elements.length ?? 0;
    if (count > 0 && count !== prevSelectionCount.current) {
      setPanelOpen(true);
    }
    prevSelectionCount.current = count;
  }, [state?.session.selected_elements.length]);

  useEffect(() => {
    const count = state?.session.captures.length ?? 0;
    if (count > 0 && count !== prevCaptureCount.current) {
      setPanelOpen(true);
    }
    prevCaptureCount.current = count;
  }, [state?.session.captures.length]);

  useEffect(() => {
    if (issueTimer.current) {
      clearTimeout(issueTimer.current);
    }
    issueTimer.current = setTimeout(() => {
      void client.setIssueText(issueText).catch(() => undefined);
    }, 400);
    return () => {
      if (issueTimer.current) {
        clearTimeout(issueTimer.current);
      }
    };
  }, [issueText]);

  if (error) {
    return (
      <div className={['ve-root', className].filter(Boolean).join(' ')}>
        <div className="ve-status ve-status--error">{error}</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className={['ve-root', className].filter(Boolean).join(' ')} data-visual-editor-capture-hide="true">
        <div className="ve-status">Lädt…</div>
      </div>
    );
  }

  if (respectHubVisibility && !state.inspector_window_open) {
    return null;
  }

  const handleToggleDevtools = async (): Promise<boolean> => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setBusy(true);
    setMessage(null);
    try {
      const open = await client.toggleDevtools();
      setDevtoolsActive(open);
      setMessage(open ? 'DevTools geöffnet' : 'DevTools geschlossen');
      messageTimer.current = setTimeout(() => {
        setMessage(null);
        messageTimer.current = null;
      }, MESSAGE_TTL_MS);
      return open;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'DevTools fehlgeschlagen');
      messageTimer.current = setTimeout(() => {
        setMessage(null);
        messageTimer.current = null;
      }, 4000);
      throw error;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={['ve-root', className].filter(Boolean).join(' ')} data-visual-editor-capture-hide="true">
      <OverlayShell panelOpen={panelOpen}>
        {panelOpen ? (
        <ContextPanel
          elements={state.session.selected_elements}
          captures={state.session.captures}
          issueText={issueText}
          busy={busy}
          message={message}
          onIssueChange={(value) => {
            setIssueText(value);
            if (value.trim() && state.enabled) {
              void client.disable().catch(() => undefined);
            }
          }}
          onCopy={(full, blocks) =>
            void runAction(
              () => client.copyContextBundle(full, blocks),
              setBusy,
              setMessage,
              full ? 'Context Bundle kopiert' : 'Composer kopiert',
              messageTimer,
            )
          }
          onClear={async () => {
            setIssueText('');
            await runAction(client.clearSession, setBusy, setMessage, 'Session geleert', messageTimer);
          }}
        />
        ) : null}

        <FloatingToolbar
          pickerActive={state.enabled}
          panelOpen={panelOpen}
          devtoolsActive={devtoolsActive}
          busy={busy}
          onHardReload={() =>
            void runAction(() => client.hardReload(), setBusy, setMessage, 'Hard Reload ausgeführt', messageTimer)
          }
          onScreenshot={() =>
            void runAction(
              () => client.capture({ mode: 'webview' }),
              setBusy,
              setMessage,
              'Screenshot erstellt',
              messageTimer,
            )
          }
          onTogglePicker={() => {
            if (state.enabled) {
              void runAction(client.disable, setBusy, setMessage, 'Picker aus', messageTimer);
            } else {
              void runAction(client.enable, setBusy, setMessage, 'Picker an', messageTimer);
            }
          }}
          onTogglePanel={() => {
            if (messageTimer.current) clearTimeout(messageTimer.current);
            setMessage(null);
            setPanelOpen((open) => !open);
          }}
          onToggleDevtools={() => void handleToggleDevtools()}
        />
      </OverlayShell>
    </div>
  );
}

export { useInspectorState } from './useInspectorState.js';
export * as visualEditorClient from './client.js';
