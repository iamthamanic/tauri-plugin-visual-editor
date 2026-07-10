/**
 * Full-screen screenshot annotation editor (draw + draggable text boxes).
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import * as client from './client.js';
import { IconDraw, IconSave, IconScissors, IconText } from './icons.js';
import { drawTextBoxOnCanvas } from './screenshotTextBoxCanvas.js';

type Stroke = { points: Array<{ x: number; y: number }> };
type TextItem = { id: string; x: number; y: number; text: string };
type CropRect = { x: number; y: number; width: number; height: number };
type EditorMode = 'draw' | 'text' | 'crop';

type Props = {
  captureId: string;
  onClose: () => void;
  onSaved: () => void;
};

let textId = 0;

export function ScreenshotEditor({ captureId, onClose, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('draw');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Lädt…');
  const [ready, setReady] = useState(false);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const textInputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const cropRectRef = useRef<CropRect | null>(null);
  const cropDraggingRef = useRef(false);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);

  const normalizeCropRect = (x1: number, y1: number, x2: number, y2: number): CropRect => {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    return { x, y, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const bg = bgRef.current;
    if (!canvas || !ctx || !bg) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    const cropRect = cropRectRef.current;
    if (cropRect && cropRect.width > 1 && cropRect.height > 1) {
      ctx.save();
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, canvas.width, cropRect.y);
      ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height);
      ctx.fillRect(
        cropRect.x + cropRect.width,
        cropRect.y,
        canvas.width - cropRect.x - cropRect.width,
        cropRect.height,
      );
      ctx.fillRect(
        0,
        cropRect.y + cropRect.height,
        canvas.width,
        canvas.height - cropRect.y - cropRect.height,
      );
      ctx.restore();
    }
  };

  const fitCanvasToView = (canvas: HTMLCanvasElement) => {
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight - 100;
    const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
    setDisplaySize({ w: Math.round(canvas.width * scale), h: Math.round(canvas.height * scale) });
  };

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    fitCanvasToView(canvas);
    const onResize = () => fitCanvasToView(canvas);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [ready]);

  useEffect(() => {
    let cancelled = false;
    void client.loadCaptureBlobUrl(captureId).then((url) => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      blobUrlRef.current = url;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        bgRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        fitCanvasToView(canvas);
        setReady(true);
        setStatus('');
        redraw();
      };
      img.onerror = () => {
        if (!cancelled) setStatus('Screenshot konnte nicht geladen werden');
      };
      img.src = url;
    }).catch((error) => {
      if (!cancelled) {
        setStatus(error instanceof Error ? error.message : 'Laden fehlgeschlagen');
      }
    });
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [captureId]);

  const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const addTextBox = (x: number, y: number, focus = false) => {
    const id = `t-${++textId}`;
    setTextItems((items) => [...items, { id, x, y, text: '' }]);
    if (focus) {
      requestAnimationFrame(() => textInputRefs.current.get(id)?.focus());
    }
  };

  const spawnDefaultTextBox = () => {
    const canvas = canvasRef.current;
    if (!canvas?.width) return;
    addTextBox(Math.max(16, canvas.width * 0.25), Math.max(16, canvas.height * 0.35), true);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    event.preventDefault();
    const pt = canvasPoint(event);
    if (mode === 'text') {
      addTextBox(pt.x, pt.y, true);
      return;
    }
    if (mode === 'crop') {
      cropDraggingRef.current = true;
      cropStartRef.current = pt;
      cropRectRef.current = { x: pt.x, y: pt.y, width: 0, height: 0 };
      event.currentTarget.setPointerCapture(event.pointerId);
      redraw();
      return;
    }
    drawingRef.current = true;
    currentStrokeRef.current = { points: [pt] };
    strokesRef.current.push(currentStrokeRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (cropDraggingRef.current && cropStartRef.current) {
      const pt = canvasPoint(event);
      cropRectRef.current = normalizeCropRect(
        cropStartRef.current.x,
        cropStartRef.current.y,
        pt.x,
        pt.y,
      );
      redraw();
      return;
    }
    if (!drawingRef.current || !currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(canvasPoint(event));
    redraw();
  };

  const endStroke = () => {
    drawingRef.current = false;
    currentStrokeRef.current = null;
    cropDraggingRef.current = false;
    cropStartRef.current = null;
  };

  const overlayStyle = (item: TextItem): CSSProperties => {
    const canvas = canvasRef.current;
    if (!canvas?.width) return { display: 'none' };
    const rect = canvas.getBoundingClientRect();
    return {
      left: `${(item.x / canvas.width) * rect.width}px`,
      top: `${(item.y / canvas.height) * rect.height}px`,
    };
  };

  const startDrag = (id: string, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const item = textItems.find((t) => t.id === id);
    if (!item) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const offsetX = event.clientX - rect.left - item.x / scaleX;
    const offsetY = event.clientY - rect.top - item.y / scaleY;

    const onMove = (ev: PointerEvent) => {
      const x = Math.max(0, Math.min(canvas.width, (ev.clientX - rect.left - offsetX) * scaleX));
      const y = Math.max(0, Math.min(canvas.height, (ev.clientY - rect.top - offsetY) * scaleY));
      setTextItems((items) => items.map((t) => (t.id === id ? { ...t, x, y } : t)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const flattenText = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const scale = Math.min(scaleX, scaleY);

    for (const item of textItems) {
      const text = item.text.trim();
      if (!text) continue;
      const textarea = textInputRefs.current.get(item.id);
      const box = textarea?.parentElement;
      if (!box) continue;
      const w = box.offsetWidth * scaleX;
      const h = box.offsetHeight * scaleY;
      drawTextBoxOnCanvas(ctx, item.x, item.y, w, h, text, scale);
    }
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    setBusy(true);
    try {
      redraw();
      const ctx = canvas.getContext('2d');
      if (ctx) flattenText(ctx);
      let exportCanvas: HTMLCanvasElement = canvas;
      const cropRect = cropRectRef.current;
      if (cropRect && cropRect.width >= 4 && cropRect.height >= 4) {
        const cropped = document.createElement('canvas');
        const x = Math.round(cropRect.x);
        const y = Math.round(cropRect.y);
        const w = Math.round(cropRect.width);
        const h = Math.round(cropRect.height);
        cropped.width = w;
        cropped.height = h;
        const croppedCtx = cropped.getContext('2d');
        if (!croppedCtx) throw new Error('Export fehlgeschlagen');
        croppedCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
        exportCanvas = cropped;
      }
      const blob = await new Promise<Blob | null>((resolve) => exportCanvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Export fehlgeschlagen');
      const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
      await client.saveCaptureImage(captureId, bytes);
      onSaved();
    } catch {
      setBusy(false);
      redraw();
    }
  };

  const iconBtn = (
    active: boolean,
    title: string,
    onClick: () => void,
    icon: ReactNode,
    accent?: boolean,
  ) => (
    <button
      type="button"
      title={title}
      disabled={busy}
      onClick={onClick}
      className={
        accent
          ? 've-editor__btn ve-editor__btn--save ve-editor__btn--icon'
          : active
            ? 've-editor__btn ve-editor__btn--active ve-editor__btn--icon'
            : 've-editor__btn ve-editor__btn--icon'
      }
    >
      {icon}
    </button>
  );

  return (
    <div className="ve-editor">
      <div className="ve-editor__toolbar">
        {status ? <span className="ve-editor__status">{status}</span> : null}
        {iconBtn(mode === 'draw', 'Zeichnen', () => setMode('draw'), <IconDraw />)}
        {iconBtn(mode === 'text', 'Text hinzufügen', () => {
          setMode('text');
          spawnDefaultTextBox();
        }, <IconText />)}
        {iconBtn(mode === 'crop', 'Zuschneiden', () => setMode('crop'), <IconScissors />)}
        {iconBtn(false, 'Speichern', () => void save(), <IconSave />, true)}
        <button type="button" className="ve-editor__btn" onClick={onClose} disabled={busy}>
          Abbrechen
        </button>
      </div>
      <div className="ve-editor__canvas-wrap">
        <div
          className="ve-editor__canvas-host"
          style={displaySize ? { width: displaySize.w, height: displaySize.h } : undefined}
        >
          <canvas
            ref={canvasRef}
            style={displaySize ? { width: displaySize.w, height: displaySize.h } : undefined}
            className={
              mode === 'draw'
                ? 've-editor__canvas ve-editor__canvas--draw'
                : mode === 'text'
                  ? 've-editor__canvas ve-editor__canvas--text'
                  : 've-editor__canvas ve-editor__canvas--draw'
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerLeave={endStroke}
          />
          <div className={`ve-editor__text-layer${mode === 'text' ? ' ve-editor__text-layer--active' : ''}`}>
            {textItems.map((item) => (
              <div key={item.id} className="ve-editor__text-box" style={overlayStyle(item)}>
                <div className="ve-editor__text-handle" onPointerDown={(e) => startDrag(item.id, e)}>
                  ⋮⋮
                </div>
                <textarea
                  ref={(el) => {
                    if (el) textInputRefs.current.set(item.id, el);
                    else textInputRefs.current.delete(item.id);
                  }}
                  placeholder="Text eingeben…"
                  rows={2}
                  value={item.text}
                  className="ve-editor__text-input"
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const text = e.target.value;
                    setTextItems((items) =>
                      items.map((t) => (t.id === item.id ? { ...t, text } : t)),
                    );
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
