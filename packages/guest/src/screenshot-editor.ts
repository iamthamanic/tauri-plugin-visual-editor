/**
 * Full-screen screenshot annotation editor (draw + draggable text boxes).
 * Location: packages/guest/src/screenshot-editor.ts
 */

import { loadCaptureBlobUrl } from './capture-image.js';
import { mountFloatingModal } from './floating-ui.js';
import {
  createEditorHistory,
  type CropRect,
  type EditorSnapshot,
  type Stroke,
} from './screenshot-editor-history.js';
import { drawTextBoxOnCanvas } from './screenshot-text-box-canvas.js';
import { ICON_DRAW, ICON_REDO, ICON_SAVE, ICON_SCISSORS, ICON_TEXT, ICON_UNDO } from './toolbar-icons.js';

type TextOverlay = { x: number; y: number; el: HTMLDivElement };
type EditorMode = 'draw' | 'text' | 'crop';

type EditorOptions = {
  captureId: string;
  onSave: (pngBytes: number[]) => Promise<void>;
};

let editorOpen = false;

export function openScreenshotEditor(options: EditorOptions): void {
  if (editorOpen) return;
  editorOpen = true;

  let blobUrl: string | null = null;
  let mode: EditorMode = 'draw';
  const strokes: Stroke[] = [];
  const textOverlays: TextOverlay[] = [];
  let currentStroke: Stroke | null = null;
  let drawing = false;
  let cropRect: CropRect | null = null;
  let cropDragging = false;
  let cropStart: { x: number; y: number } | null = null;
  const history = createEditorHistory();

  const overlay = document.createElement('div');
  overlay.setAttribute('data-visual-editor-screenshot-editor', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: 'rgba(0,0,0,0.75)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  });

  const toolbar = document.createElement('div');
  Object.assign(toolbar.style, {
    display: 'flex',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #3d3d3d',
    background: '#1a1a1a',
    alignItems: 'center',
  });

  const statusEl = document.createElement('span');
  Object.assign(statusEl.style, { fontSize: '12px', color: '#8b949e', marginRight: '4px' });
  statusEl.textContent = 'Lädt…';

  const mkIconBtn = (
    icon: string,
    title: string,
    active: boolean,
    onClick: () => void,
    accent?: boolean,
  ): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.innerHTML = icon;
    const border = accent ? '#238636' : active ? '#58a6ff' : '#3d3d3d';
    const bg = accent ? '#238636' : active ? '#58a6ff' : '#2a2a2a';
    Object.assign(btn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      border: `1px solid ${border}`,
      background: bg,
      color: '#fff',
      cursor: 'pointer',
    });
    btn.addEventListener('click', onClick);
    return btn;
  };

  const mkLabelBtn = (label: string, accent: boolean, onClick: () => void): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: '6px 12px',
      borderRadius: '6px',
      border: `1px solid ${accent ? '#238636' : '#3d3d3d'}`,
      background: accent ? '#238636' : '#2a2a2a',
      color: '#fff',
      fontSize: '12px',
      cursor: 'pointer',
    });
    btn.addEventListener('click', onClick);
    return btn;
  };

  const drawBtn = mkIconBtn(ICON_DRAW, 'Zeichnen', true, () => {
    mode = 'draw';
    refreshTools();
  });
  const textBtn = mkIconBtn(ICON_TEXT, 'Text hinzufügen', false, () => {
    mode = 'text';
    refreshTools();
    spawnDefaultTextBox();
  });
  const cropBtn = mkIconBtn(ICON_SCISSORS, 'Zuschneiden', false, () => {
    mode = 'crop';
    refreshTools();
  });
  const saveBtn = mkIconBtn(ICON_SAVE, 'Speichern', false, () => void save(), true);
  const undoBtn = mkIconBtn(ICON_UNDO, 'Zurück', false, () => undo());
  const redoBtn = mkIconBtn(ICON_REDO, 'Vor', false, () => redo());
  const cancelBtn = mkLabelBtn('Abbrechen', false, close);

  const refreshUndoButtons = (): void => {
    const canUndo = history.canUndo();
    const canRedo = history.canRedo();
    undoBtn.disabled = !canUndo;
    redoBtn.disabled = !canRedo;
    undoBtn.style.opacity = canUndo ? '1' : '0.4';
    redoBtn.style.opacity = canRedo ? '1' : '0.4';
    undoBtn.style.cursor = canUndo ? 'pointer' : 'not-allowed';
    redoBtn.style.cursor = canRedo ? 'pointer' : 'not-allowed';
  };

  const refreshTools = (): void => {
    for (const [btn, active] of [
      [drawBtn, mode === 'draw'],
      [textBtn, mode === 'text'],
      [cropBtn, mode === 'crop'],
    ] as const) {
      if (btn === saveBtn) continue;
      btn.style.borderColor = active ? '#58a6ff' : '#3d3d3d';
      btn.style.background = active ? '#58a6ff' : '#2a2a2a';
      btn.style.color = active ? '#fff' : '#e6edf3';
    }
    canvas.style.cursor = mode === 'draw' ? 'crosshair' : mode === 'text' ? 'text' : 'crosshair';
    textLayer.style.pointerEvents = mode === 'text' ? 'auto' : 'none';
    for (const item of textOverlays) {
      item.el.style.pointerEvents = mode === 'text' ? 'auto' : 'none';
    }
  };

  toolbar.append(statusEl, drawBtn, textBtn, cropBtn, undoBtn, redoBtn, saveBtn, cancelBtn);
  refreshUndoButtons();

  const canvasWrap = document.createElement('div');
  Object.assign(canvasWrap.style, {
    maxWidth: '90vw',
    maxHeight: 'calc(100vh - 80px)',
    overflow: 'hidden',
    borderRadius: '8px',
    border: '1px solid #3d3d3d',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const canvasHost = document.createElement('div');
  Object.assign(canvasHost.style, { position: 'relative', display: 'block', lineHeight: '0' });

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.cursor = 'crosshair';

  const textLayer = document.createElement('div');
  Object.assign(textLayer.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });

  const fitCanvasToView = (): void => {
    if (!canvas.width || !canvas.height) return;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight - 100;
    const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
    const displayW = Math.round(canvas.width * scale);
    const displayH = Math.round(canvas.height * scale);
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    canvasHost.style.width = `${displayW}px`;
    canvasHost.style.height = `${displayH}px`;
    syncAllTextPositions();
  };

  const spawnDefaultTextBox = (): void => {
    if (!canvas.width || !canvas.height) return;
    const x = Math.max(16, canvas.width * 0.25);
    const y = Math.max(16, canvas.height * 0.35);
    createTextOverlay(x, y, true);
  };

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    editorOpen = false;
    return;
  }

  const bg = new Image();

  const syncTextOverlayPosition = (item: TextOverlay): void => {
    if (!canvas.width || !canvas.height) return;
    const rect = canvas.getBoundingClientRect();
    item.el.style.left = `${(item.x / canvas.width) * rect.width}px`;
    item.el.style.top = `${(item.y / canvas.height) * rect.height}px`;
  };

  const syncAllTextPositions = (): void => {
    for (const item of textOverlays) {
      syncTextOverlayPosition(item);
    }
  };

  const createTextOverlay = (
    x: number,
    y: number,
    focusInput = false,
    skipHistory = false,
  ): void => {
    if (!skipHistory) beginMutation();
    const box = document.createElement('div');
    box.setAttribute('data-visual-editor-ui', 'true');
    Object.assign(box.style, {
      position: 'absolute',
      minWidth: '120px',
      maxWidth: '280px',
      border: '2px solid #f85149',
      borderRadius: '6px',
      background: 'rgba(13,17,23,0.92)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
      pointerEvents: 'auto',
      zIndex: '2',
    });

    const handle = document.createElement('div');
    handle.title = 'Verschieben';
    Object.assign(handle.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '18px',
      cursor: 'move',
      background: '#21262d',
      borderBottom: '1px solid #3d3d3d',
      color: '#8b949e',
      fontSize: '10px',
      userSelect: 'none',
    });
    handle.textContent = '⋮⋮';

    const content = document.createElement('textarea');
    content.placeholder = 'Text eingeben…';
    content.rows = 2;
    Object.assign(content.style, {
      display: 'block',
      boxSizing: 'border-box',
      width: '100%',
      padding: '6px 8px',
      minHeight: '48px',
      outline: 'none',
      resize: 'none',
      border: 'none',
      background: 'transparent',
      color: '#f85149',
      font: 'bold 16px system-ui, sans-serif',
      cursor: 'text',
    });

    box.append(handle, content);
    textLayer.append(box);

    const item: TextOverlay = { x, y, el: box };
    textOverlays.push(item);
    syncTextOverlayPosition(item);

    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const moveDrag = (event: PointerEvent): void => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      item.x = Math.max(0, Math.min(canvas.width, (event.clientX - rect.left - dragOffsetX) * scaleX));
      item.y = Math.max(0, Math.min(canvas.height, (event.clientY - rect.top - dragOffsetY) * scaleY));
      syncTextOverlayPosition(item);
    };

    const endDrag = (): void => {
      dragging = false;
      window.removeEventListener('pointermove', moveDrag);
      window.removeEventListener('pointerup', endDrag);
    };

    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      beginMutation();
      const rect = box.getBoundingClientRect();
      dragging = true;
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      handle.setPointerCapture(event.pointerId);
      window.addEventListener('pointermove', moveDrag);
      window.addEventListener('pointerup', endDrag);
    });

    content.addEventListener('pointerdown', (event) => event.stopPropagation());
    content.addEventListener('mousedown', (event) => event.stopPropagation());
    content.addEventListener('keydown', (event) => event.stopPropagation());
    content.addEventListener('keyup', (event) => event.stopPropagation());
    if (focusInput) {
      requestAnimationFrame(() => content.focus());
    }
  };

  const captureSnapshot = (): EditorSnapshot => ({
    strokes: strokes.map((s) => ({ points: s.points.map((p) => ({ x: p.x, y: p.y })) })),
    texts: textOverlays.map((item) => {
      const input = item.el.querySelector('textarea');
      return {
        x: item.x,
        y: item.y,
        text: input instanceof HTMLTextAreaElement ? input.value : '',
      };
    }),
    cropRect: cropRect ? { ...cropRect } : null,
  });

  const restoreSnapshot = (snapshot: EditorSnapshot): void => {
    strokes.length = 0;
    for (const stroke of snapshot.strokes) {
      strokes.push({ points: stroke.points.map((p) => ({ x: p.x, y: p.y })) });
    }
    cropRect = snapshot.cropRect ? { ...snapshot.cropRect } : null;
    for (const item of textOverlays) {
      item.el.remove();
    }
    textOverlays.length = 0;
    for (const t of snapshot.texts) {
      createTextOverlay(t.x, t.y, false, true);
      const last = textOverlays[textOverlays.length - 1];
      const input = last.el.querySelector('textarea');
      if (input instanceof HTMLTextAreaElement) {
        input.value = t.text;
      }
    }
    refreshTools();
    redraw();
    refreshUndoButtons();
  };

  const beginMutation = (): void => {
    history.push(captureSnapshot());
    refreshUndoButtons();
  };

  const undo = (): void => {
    const prev = history.undo(captureSnapshot());
    if (prev) restoreSnapshot(prev);
  };

  const redo = (): void => {
    const next = history.redo(captureSnapshot());
    if (next) restoreSnapshot(next);
  };

  const normalizeCropRect = (x1: number, y1: number, x2: number, y2: number): CropRect => {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    return { x, y, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
  };

  const redraw = (): void => {
    if (!ctx || !bg.naturalWidth) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
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

  const flattenTextToCanvas = (): void => {
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const scale = Math.min(scaleX, scaleY);

    for (const item of textOverlays) {
      const input = item.el.querySelector('textarea');
      const text = input instanceof HTMLTextAreaElement ? input.value.trim() : '';
      if (!text) continue;
      const w = item.el.offsetWidth * scaleX;
      const h = item.el.offsetHeight * scaleY;
      drawTextBoxOnCanvas(ctx, item.x, item.y, w, h, text, scale);
    }
  };

  const canvasPoint = (event: PointerEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    if (!bg.naturalWidth) return;
    event.preventDefault();
    const pt = canvasPoint(event);
    if (mode === 'text') {
      createTextOverlay(pt.x, pt.y, true);
      return;
    }
    if (mode === 'crop') {
      beginMutation();
      cropDragging = true;
      cropStart = pt;
      cropRect = { x: pt.x, y: pt.y, width: 0, height: 0 };
      canvas.setPointerCapture(event.pointerId);
      redraw();
      return;
    }
    drawing = true;
    beginMutation();
    currentStroke = { points: [pt] };
    strokes.push(currentStroke);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (cropDragging && cropStart) {
      cropRect = normalizeCropRect(cropStart.x, cropStart.y, canvasPoint(event).x, canvasPoint(event).y);
      redraw();
      return;
    }
    if (!drawing || !currentStroke) return;
    currentStroke.points.push(canvasPoint(event));
    redraw();
  });

  const endStroke = (): void => {
    drawing = false;
    currentStroke = null;
    cropDragging = false;
    cropStart = null;
  };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointerleave', endStroke);

  const resizeObserver = new ResizeObserver(() => fitCanvasToView());
  resizeObserver.observe(canvas);
  window.addEventListener('resize', fitCanvasToView);

  canvasHost.append(canvas, textLayer);
  canvasWrap.append(canvasHost);
  overlay.append(toolbar, canvasWrap);
  mountFloatingModal(overlay);

  const onEditorKeyDown = (event: KeyboardEvent): void => {
    if (!(event.metaKey || event.ctrlKey)) return;
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
      return;
    }
    if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      redo();
    }
  };
  overlay.addEventListener('keydown', onEditorKeyDown);
  overlay.tabIndex = -1;
  requestAnimationFrame(() => overlay.focus());

  void loadCaptureBlobUrl(options.captureId)
    .then((url) => {
      blobUrl = url;
      bg.onload = () => {
        canvas.width = bg.naturalWidth;
        canvas.height = bg.naturalHeight;
        statusEl.textContent = '';
        fitCanvasToView();
        redraw();
        syncAllTextPositions();
      };
      bg.onerror = () => {
        statusEl.textContent = 'Screenshot konnte nicht geladen werden';
        statusEl.style.color = '#f85149';
      };
      bg.src = url;
    })
    .catch((error) => {
      statusEl.textContent = error instanceof Error ? error.message : 'Laden fehlgeschlagen';
      statusEl.style.color = '#f85149';
    });

  function close(): void {
    resizeObserver.disconnect();
    window.removeEventListener('resize', fitCanvasToView);
    overlay.removeEventListener('keydown', onEditorKeyDown);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    overlay.remove();
    editorOpen = false;
  }

  async function save(): Promise<void> {
    if (!bg.naturalWidth) return;
    saveBtn.disabled = true;
    try {
      redraw();
      flattenTextToCanvas();
      let exportCanvas: HTMLCanvasElement = canvas;
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
      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('Export fehlgeschlagen');
      const buffer = await blob.arrayBuffer();
      await options.onSave(Array.from(new Uint8Array(buffer)));
      close();
    } catch {
      saveBtn.disabled = false;
      redraw();
    }
  }
}
