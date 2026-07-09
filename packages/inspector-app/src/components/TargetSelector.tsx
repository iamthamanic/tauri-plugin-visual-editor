/**
 * Target webview dropdown and pin toggle.
 * Location: packages/inspector-app/src/components/TargetSelector.tsx
 */

import type { HubSnapshot } from '../types.js';

type Props = {
  state: HubSnapshot;
  onTargetChange: (webviewId: string) => void;
  onPinToggle: (webviewId: string, pinned: boolean) => void;
};

export function TargetSelector({ state, onTargetChange, onPinToggle }: Props) {
  const activeId = state.active_target?.webview_id ?? state.webviews[0]?.id ?? '';
  const pinned = state.active_target?.pinned ?? false;

  return (
    <section className="flex items-center gap-2">
      <label className="text-xs font-semibold uppercase text-[var(--inspector-muted)]" htmlFor="target-webview">
        Ziel-WebView
      </label>
      <select
        id="target-webview"
        className="min-w-0 flex-1 rounded border border-[var(--inspector-border)] bg-white px-2 py-1 text-[13px]"
        value={activeId}
        onChange={(event) => onTargetChange(event.target.value)}
      >
        {state.webviews.map((webview) => (
          <option key={webview.id} value={webview.id}>
            {webview.label} ({webview.status})
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label={pinned ? 'Ziel lösen' : 'Ziel anheften'}
        className={`rounded border px-2 py-1 text-xs ${pinned ? 'border-[var(--inspector-accent)] text-[var(--inspector-accent)]' : 'border-[var(--inspector-border)]'}`}
        onClick={() => onPinToggle(activeId, !pinned)}
      >
        {pinned ? 'Angeheftet' : 'Anheften'}
      </button>
    </section>
  );
}
