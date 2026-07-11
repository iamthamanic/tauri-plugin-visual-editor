/**
 * Undo/redo stacks for screenshot editor snapshots.
 */

export type Stroke = { points: Array<{ x: number; y: number }> };
export type CropRect = { x: number; y: number; width: number; height: number };
export type TextSnapshot = { id: string; x: number; y: number; text: string };

export type EditorSnapshot = {
  strokes: Stroke[];
  texts: TextSnapshot[];
  cropRect: CropRect | null;
};

const MAX_HISTORY = 50;

function cloneSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    strokes: snapshot.strokes.map((s) => ({
      points: s.points.map((p) => ({ x: p.x, y: p.y })),
    })),
    texts: snapshot.texts.map((t) => ({ id: t.id, x: t.x, y: t.y, text: t.text })),
    cropRect: snapshot.cropRect ? { ...snapshot.cropRect } : null,
  };
}

export function createEditorHistory() {
  const undoStack: EditorSnapshot[] = [];
  const redoStack: EditorSnapshot[] = [];

  return {
    push(snapshot: EditorSnapshot): void {
      undoStack.push(cloneSnapshot(snapshot));
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack.length = 0;
    },
    undo(current: EditorSnapshot): EditorSnapshot | null {
      if (undoStack.length === 0) return null;
      redoStack.push(cloneSnapshot(current));
      return undoStack.pop() ?? null;
    },
    redo(current: EditorSnapshot): EditorSnapshot | null {
      if (redoStack.length === 0) return null;
      undoStack.push(cloneSnapshot(current));
      return redoStack.pop() ?? null;
    },
    canUndo(): boolean {
      return undoStack.length > 0;
    },
    canRedo(): boolean {
      return redoStack.length > 0;
    },
  };
}
