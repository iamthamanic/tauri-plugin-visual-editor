/**
 * Primary action buttons for inspector operations.
 * Location: packages/inspector-app/src/components/ActionBar.tsx
 */

type Props = {
  enabled: boolean;
  busy: boolean;
  message: string | null;
  onEnable: () => void;
  onDisable: () => void;
  onCopyBundle: () => void;
  onCopyImage: () => void;
  onCopyPath: () => void;
  onClear: () => void;
  onRevalidate: () => void;
  onHardReload: () => void;
};

export function ActionBar({
  enabled,
  busy,
  message,
  onEnable,
  onDisable,
  onCopyBundle,
  onCopyImage,
  onCopyPath,
  onClear,
  onRevalidate,
  onHardReload,
}: Props) {
  const btn =
    'rounded border border-[var(--inspector-border)] px-2 py-1 text-[12px] hover:bg-[#eef2f6] disabled:opacity-50';

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {enabled ? (
          <button type="button" className={btn} disabled={busy} onClick={onDisable}>
            Deaktivieren
          </button>
        ) : (
          <button type="button" className={btn} disabled={busy} onClick={onEnable}>
            Aktivieren
          </button>
        )}
        <button type="button" className={btn} disabled={busy} onClick={onRevalidate}>
          Revalidieren
        </button>
        <button type="button" className={btn} disabled={busy} onClick={onHardReload}>
          Hard Reload
        </button>
        <button type="button" className={btn} disabled={busy} onClick={onClear}>
          Leeren
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={busy} onClick={onCopyBundle}>
          Context Bundle kopieren
        </button>
        <button type="button" className={btn} disabled={busy} onClick={onCopyImage}>
          Screenshot-Bild kopieren
        </button>
        <button type="button" className={btn} disabled={busy} onClick={onCopyPath}>
          Screenshot-Pfad kopieren
        </button>
      </div>
      {message ? <p className="text-[12px] text-[var(--inspector-muted)]">{message}</p> : null}
    </section>
  );
}
