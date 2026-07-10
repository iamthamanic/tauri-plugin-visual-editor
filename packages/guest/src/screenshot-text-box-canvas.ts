/**
 * Flatten screenshot editor text boxes onto a canvas for export.
 * Location: packages/guest/src/screenshot-text-box-canvas.ts
 */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/(\s+)/);
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line + word;
      if (ctx.measureText(test).width > maxWidth && line.trim()) {
        ctx.fillText(line, x, cy);
        line = word.trimStart();
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line.trim()) {
      ctx.fillText(line, x, cy);
      y = cy + lineHeight;
    }
  }
}

/** Draw a screenshot editor text box (chrome + label) at canvas coordinates. */
export function drawTextBoxOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  scale: number,
): void {
  const handleH = 18 * scale;
  const radius = 6 * scale;
  const padding = 8 * scale;
  const fontSize = 16 * scale;
  const lineHeight = 20 * scale;

  roundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = 'rgba(13,17,23,0.92)';
  ctx.fill();

  ctx.strokeStyle = '#f85149';
  ctx.lineWidth = 2 * scale;
  roundRect(ctx, x, y, w, h, radius);
  ctx.stroke();

  ctx.fillStyle = '#21262d';
  ctx.fillRect(x, y, w, handleH);
  ctx.strokeStyle = '#3d3d3d';
  ctx.lineWidth = Math.max(1, scale);
  ctx.beginPath();
  ctx.moveTo(x, y + handleH);
  ctx.lineTo(x + w, y + handleH);
  ctx.stroke();

  ctx.fillStyle = '#f85149';
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  wrapFillText(ctx, text, x + padding, y + handleH + padding + fontSize * 0.85, w - padding * 2, lineHeight);
}
