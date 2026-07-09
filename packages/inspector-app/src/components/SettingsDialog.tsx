/**
 * Persistent settings editor dialog.
 * Location: packages/inspector-app/src/components/SettingsDialog.tsx
 */

import { useEffect, useRef, useState } from 'react';
import type { PersistentSettings, PersistentSettingsPatch, ScreenshotDirMode, ThemeMode } from '../types.js';

type Props = {
  open: boolean;
  settings: PersistentSettings;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (patch: PersistentSettingsPatch) => void;
};

const PADDING_OPTIONS = [0, 8, 16, 24, 48] as const;

const SCREENSHOT_DIR_LABELS: Record<ScreenshotDirMode, string> = {
  appData: 'App-Daten',
  project: 'Projektordner',
  temp: 'Temporär',
  absolutePath: 'Absoluter Pfad',
};

export function SettingsDialog({ open, settings, busy, error, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const fieldClass =
    'w-full rounded border border-[var(--inspector-border)] bg-white px-2 py-1 text-[13px] dark:bg-[#2d2d2d]';

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(92vw,360px)] rounded border border-[var(--inspector-border)] bg-[var(--inspector-bg)] p-4 text-[var(--inspector-text)] shadow-lg backdrop:bg-black/30"
      onClose={onClose}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            theme: draft.theme,
            shortcut: draft.shortcut,
            overlay_color: draft.overlay_color,
            crop_padding: draft.crop_padding,
            screenshot_dir: draft.screenshot_dir,
            screenshot_absolute_path: draft.screenshot_absolute_path,
          });
        }}
      >
        <header className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Einstellungen</h2>
          <button type="button" className="text-[12px] text-[var(--inspector-muted)]" onClick={onClose}>
            Schließen
          </button>
        </header>

        <label className="block space-y-1 text-[12px]">
          <span className="font-semibold uppercase text-[var(--inspector-muted)]">Theme</span>
          <select
            className={fieldClass}
            value={draft.theme}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, theme: event.target.value as ThemeMode }))
            }
          >
            <option value="system">System</option>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </select>
        </label>

        <label className="block space-y-1 text-[12px]">
          <span className="font-semibold uppercase text-[var(--inspector-muted)]">Shortcut</span>
          <input
            className={fieldClass}
            value={draft.shortcut}
            onChange={(event) => setDraft((prev) => ({ ...prev, shortcut: event.target.value }))}
          />
        </label>

        <label className="block space-y-1 text-[12px]">
          <span className="font-semibold uppercase text-[var(--inspector-muted)]">Overlay-Farbe</span>
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded border border-[var(--inspector-border)]"
            value={draft.overlay_color}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, overlay_color: event.target.value }))
            }
          />
        </label>

        <label className="block space-y-1 text-[12px]">
          <span className="font-semibold uppercase text-[var(--inspector-muted)]">Crop-Padding</span>
          <select
            className={fieldClass}
            value={draft.crop_padding}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, crop_padding: Number(event.target.value) }))
            }
          >
            {PADDING_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}px
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-[12px]">
          <span className="font-semibold uppercase text-[var(--inspector-muted)]">Screenshot-Ordner</span>
          <select
            className={fieldClass}
            value={draft.screenshot_dir}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                screenshot_dir: event.target.value as ScreenshotDirMode,
              }))
            }
          >
            {(Object.keys(SCREENSHOT_DIR_LABELS) as ScreenshotDirMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {SCREENSHOT_DIR_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>

        {draft.screenshot_dir === 'absolutePath' ? (
          <label className="block space-y-1 text-[12px]">
            <span className="font-semibold uppercase text-[var(--inspector-muted)]">Absoluter Pfad</span>
            <input
              className={fieldClass}
              value={draft.screenshot_absolute_path ?? ''}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  screenshot_absolute_path: event.target.value || null,
                }))
              }
            />
          </label>
        ) : null}

        {error ? <p className="text-[12px] text-[var(--inspector-danger)]">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="rounded border border-[var(--inspector-border)] px-3 py-1 text-[12px]"
            onClick={onClose}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="rounded bg-[var(--inspector-accent)] px-3 py-1 text-[12px] text-white disabled:opacity-50"
            disabled={busy}
          >
            Speichern
          </button>
        </div>
      </form>
    </dialog>
  );
}
