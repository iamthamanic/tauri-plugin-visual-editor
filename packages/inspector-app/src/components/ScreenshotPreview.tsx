/**
 * Capture thumbnails with primary/include controls.
 * Location: packages/inspector-app/src/components/ScreenshotPreview.tsx
 */

import type { Capture } from '../types.js';

type Props = {
  captures: Capture[];
  primaryCaptureId: string | null;
  onPrimary: (captureId: string) => void;
  onIncludeToggle: (captureId: string, include: boolean) => void;
};

export function ScreenshotPreview({
  captures,
  primaryCaptureId,
  onPrimary,
  onIncludeToggle,
}: Props) {
  if (captures.length === 0) {
    return <p className="text-[13px] text-[var(--inspector-muted)]">Kein Screenshot</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {captures.map((capture) => {
        const isPrimary = capture.id === primaryCaptureId;
        return (
          <article key={capture.id} className="rounded border border-[var(--inspector-border)] p-2">
            <div className="mb-2 flex h-16 items-center justify-center rounded bg-[#eef2f6] text-[11px] text-[var(--inspector-muted)]">
              {capture.capture_type}
            </div>
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <button
                type="button"
                className={`rounded px-1 py-0.5 ${isPrimary ? 'bg-[var(--inspector-accent)] text-white' : 'border border-[var(--inspector-border)]'}`}
                onClick={() => onPrimary(capture.id)}
                aria-label="Als primär markieren"
              >
                {isPrimary ? '★ Primär' : '☆ Primär'}
              </button>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={capture.include_in_copy}
                  onChange={(event) => onIncludeToggle(capture.id, event.target.checked)}
                />
                Export
              </label>
            </div>
          </article>
        );
      })}
    </div>
  );
}
