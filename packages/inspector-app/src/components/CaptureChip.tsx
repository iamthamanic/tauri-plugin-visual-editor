/**
 * Screenshot chip with hover preview; click opens annotation editor.
 * Location: packages/inspector-app/src/components/CaptureChip.tsx
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as api from '../api.js';
import { IconCaptureChip } from '../lib/icons.js';
import type { Capture } from '../types.js';
import { ChipRemoveButton } from './ChipRemoveButton.js';
import { ScreenshotEditor } from './ScreenshotEditor.js';

type Props = {
  capture: Capture;
  index: number;
};

function captureLabel(capture: Capture, index: number): string {
  const type = capture.capture_type === 'webview' ? 'Screenshot' : capture.capture_type;
  return `${type} #${index + 1}`;
}

export function CaptureChip({ capture, index }: Props) {
  const chipRef = useRef<HTMLSpanElement>(null);
  const [preview, setPreview] = useState<{ left: number; top: number; src: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [version, setVersion] = useState(0);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const showPreview = () => {
    const rect = chipRef.current?.getBoundingClientRect();
    if (!rect) return;
    let left = rect.left;
    let top = rect.bottom + 8;
    if (left + 300 > window.innerWidth - 8) left = window.innerWidth - 308;
    if (top + 220 > window.innerHeight - 8) top = rect.top - 228;
    void api.loadCaptureBlobUrl(capture.id).then((src) => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = src;
      setPreview({ left: Math.max(8, left), top: Math.max(8, top), src });
    }).catch(() => undefined);
  };

  const hidePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
  };

  return (
    <>
      <span
        ref={chipRef}
        role="button"
        tabIndex={0}
        data-ve-capture-chip={capture.id}
        className="inline-flex max-w-full cursor-pointer items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-[rgba(63,185,80,0.55)] bg-[rgba(63,185,80,0.12)] px-2 py-0.5 text-[11px] text-[var(--inspector-text)] transition-colors hover:border-[#3fb950] hover:bg-[rgba(63,185,80,0.22)]"
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('[data-ve-chip-remove]')) return;
          hidePreview();
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            hidePreview();
            setEditing(true);
          }
        }}
      >
        <span className="flex text-[#3fb950]">
          <IconCaptureChip />
        </span>
        {captureLabel(capture, index)}
        <ChipRemoveButton onRemove={() => api.removeCapture(capture.id)} />
      </span>
      {preview
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[2147483647] rounded-lg border border-[var(--inspector-border)] bg-[#0d1117] p-2 shadow-xl"
              style={{ left: preview.left, top: preview.top }}
            >
              <img src={preview.src} alt="Screenshot Vorschau" className="block max-h-[200px] max-w-[280px] rounded-md" />
            </div>,
            document.documentElement,
          )
        : null}
      {editing ? (
        <ScreenshotEditor
          key={`${capture.id}-${version}`}
          captureId={capture.id}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setVersion(Date.now());
          }}
        />
      ) : null}
    </>
  );
}
