/**
 * Main inspector panel layout.
 * Location: packages/inspector-app/src/App.tsx
 */

import { useEffect, useRef, useState } from 'react';
import * as api from './api.js';
import { ActionBar } from './components/ActionBar.js';
import { IssueField } from './components/IssueField.js';
import { ScreenshotPreview } from './components/ScreenshotPreview.js';
import { SelectedElements } from './components/SelectedElements.js';
import { SettingsDialog } from './components/SettingsDialog.js';
import { TargetSelector } from './components/TargetSelector.js';
import { useInspectorState } from './hooks/useInspectorState.js';
import type { ActionState, PersistentSettingsPatch } from './types.js';

async function runAction(
  fn: () => Promise<unknown>,
  setBusy: (value: boolean) => void,
  setMessage: (value: string | null) => void,
  success: string,
): Promise<void> {
  setBusy(true);
  setMessage(null);
  try {
    await fn();
    setMessage(success);
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Aktion fehlgeschlagen');
  } finally {
    setBusy(false);
  }
}

function applyTheme(theme: 'system' | 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
    return;
  }
  root.setAttribute('data-theme', theme);
}

export function App() {
  const { state, error } = useInspectorState();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [issueText, setIssueText] = useState('');
  const issueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [actionState, setActionState] = useState<ActionState>('idle');

  useEffect(() => {
    if (state?.session.issue_text != null) {
      setIssueText(state.session.issue_text);
    }
  }, [state?.session.issue_text]);

  useEffect(() => {
    if (state?.settings.theme) {
      applyTheme(state.settings.theme);
    }
  }, [state?.settings.theme]);

  useEffect(() => {
    if (issueTimer.current) {
      clearTimeout(issueTimer.current);
    }
    issueTimer.current = setTimeout(() => {
      void api.setIssueText(issueText).catch(() => undefined);
    }, 400);
    return () => {
      if (issueTimer.current) {
        clearTimeout(issueTimer.current);
      }
    };
  }, [issueText]);

  async function saveSettings(patch: PersistentSettingsPatch) {
    setSettingsError(null);
    setBusy(true);
    try {
      await api.updateSettings(patch);
      setSettingsOpen(false);
      setMessage('Einstellungen gespeichert');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--inspector-bg)] p-3 text-sm text-[var(--inspector-danger)]">
        {error}
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-[var(--inspector-bg)] p-3 text-sm text-[var(--inspector-muted)]">
        Lädt…
      </main>
    );
  }

  const settingsButton = (
    <button
      type="button"
      className="rounded border border-[var(--inspector-border)] px-2 py-1 text-[12px]"
      onClick={() => setSettingsOpen(true)}
    >
      Einstellungen
    </button>
  );

  if (!state.enabled) {
    return (
      <main className="min-h-screen bg-[var(--inspector-bg)] p-3 text-sm text-[var(--inspector-text)]">
        <header className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold">Visual Inspector</h1>
          {settingsButton}
        </header>
        <p className="mt-2 text-[var(--inspector-muted)]">Inspector deaktiviert</p>
        <button
          type="button"
          className="mt-3 rounded bg-[var(--inspector-accent)] px-3 py-1.5 text-white"
          onClick={() => void runAction(api.enable, setBusy, setMessage, 'Inspector aktiviert')}
        >
          Aktivieren
        </button>
        <SettingsDialog
          open={settingsOpen}
          settings={state.settings}
          busy={busy}
          error={settingsError}
          onClose={() => setSettingsOpen(false)}
          onSave={(patch) => void saveSettings(patch)}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--inspector-bg)] p-3 text-[13px] text-[var(--inspector-text)]">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold">Visual Inspector</h1>
          <p className="text-[12px] text-[var(--inspector-muted)]">
            {state.inspector_window_open ? 'Fenster geöffnet' : 'Fenster geschlossen'}
          </p>
        </div>
        {settingsButton}
      </header>

      <div className="space-y-4">
        <TargetSelector
          state={state}
          onTargetChange={(webviewId) =>
            void runAction(
              () => api.setTargetWebview(webviewId),
              setBusy,
              setMessage,
              'Ziel-WebView gesetzt',
            )
          }
          onPinToggle={(webviewId, pinned) =>
            void runAction(
              () => (pinned ? api.pinTargetWebview(webviewId) : api.unpinTargetWebview()),
              setBusy,
              setMessage,
              pinned ? 'Ziel angeheftet' : 'Anheftung gelöst',
            )
          }
        />

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-[var(--inspector-muted)]">Elemente</h2>
          <SelectedElements elements={state.session.selected_elements} />
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-[var(--inspector-muted)]">Screenshots</h2>
          <ScreenshotPreview
            captures={state.session.captures}
            primaryCaptureId={state.session.primary_capture_id}
            onPrimary={(captureId) =>
              void runAction(
                () => api.setPrimaryCapture(captureId),
                setBusy,
                setMessage,
                'Primärer Screenshot gesetzt',
              )
            }
            onIncludeToggle={(captureId, include) =>
              void runAction(
                () => api.setCaptureIncluded(captureId, include),
                setBusy,
                setMessage,
                include ? 'In Export aufgenommen' : 'Aus Export entfernt',
              )
            }
          />
        </section>

        <IssueField value={issueText} onChange={setIssueText} />

        <ActionBar
          enabled={state.enabled}
          busy={busy}
          message={message ?? (actionState === 'loading' ? 'Läuft…' : null)}
          onEnable={() =>
            void runAction(api.enable, setBusy, setMessage, 'Inspector aktiviert').then(() =>
              setActionState('success'),
            )
          }
          onDisable={() =>
            void runAction(api.disable, setBusy, setMessage, 'Inspector deaktiviert').then(() =>
              setActionState('success'),
            )
          }
          onCopyBundle={() =>
            void runAction(api.copyContextBundle, setBusy, setMessage, 'Context Bundle kopiert')
          }
          onCopyImage={() =>
            void runAction(api.copyScreenshotImage, setBusy, setMessage, 'Screenshot-Bild kopiert')
          }
          onCopyPath={() =>
            void runAction(api.copyScreenshotPath, setBusy, setMessage, 'Screenshot-Pfad kopiert')
          }
          onClear={() =>
            void runAction(api.clearSession, setBusy, setMessage, 'Session geleert')
          }
          onRevalidate={() =>
            void runAction(
              () => api.revalidate(),
              setBusy,
              setMessage,
              'Revalidierung abgeschlossen',
            )
          }
          onHardReload={() =>
            void runAction(() => api.hardReload(), setBusy, setMessage, 'Hard Reload ausgeführt')
          }
        />
      </div>

      <SettingsDialog
        open={settingsOpen}
        settings={state.settings}
        busy={busy}
        error={settingsError}
        onClose={() => setSettingsOpen(false)}
        onSave={(patch) => void saveSettings(patch)}
      />
    </main>
  );
}
