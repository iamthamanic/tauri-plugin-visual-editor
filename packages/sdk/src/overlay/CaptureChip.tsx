/**
 * Screenshot chip with hover preview; click opens annotation editor.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as client from './client.js';
import { ChipRemoveButton } from './ChipRemoveButton.js';
import { IconCaptureChip } from './icons.js';
import { ScreenshotEditor } from './ScreenshotEditor.js';
import type { Capture } from './types.js';

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
    void client.loadCaptureBlobUrl(capture.id).then((src) => {
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
        className="ve-capture-chip"
        data-ve-capture-chip={capture.id}
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
        <span className="ve-capture-chip__icon">
          <IconCaptureChip />
        </span>
        {captureLabel(capture, index)}
        <ChipRemoveButton onRemove={() => client.removeCapture(capture.id)} />
      </span>
      {preview
        ? createPortal(
            <div className="ve-capture-preview" style={{ left: preview.left, top: preview.top }}>
              <img src={preview.src} alt="Screenshot Vorschau" />
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
