import { useEffect, useRef } from 'react';

// A saved board is strokes, not a picture — so a preview is the same strokes
// drawn again, smaller, fitted into whatever box it is dropped into.
export default function WhiteboardPreview({ data, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let parsed = {};
    try {
      parsed = JSON.parse(data || '{}');
    } catch (err) {
      parsed = {};
    }
    const strokes = parsed.strokes || [];
    const boardW = parsed.w || 600;
    const boardH = parsed.h || 380;

    const box = canvas.parentElement?.getBoundingClientRect();
    const w = Math.max(1, Math.round(box?.width || 240));
    const h = Math.max(1, Math.round(box?.height || 120));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const fit = Math.min(w / boardW, h / boardH);
    ctx.translate((w - boardW * fit) / 2, (h - boardH * fit) / 2);
    ctx.scale(fit, fit);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      // points live in the width the board was drawn at
      const k = boardW / (stroke.w0 || boardW);
      ctx.strokeStyle = stroke.c;
      ctx.lineWidth = Math.max(0.5, stroke.w * k);
      ctx.beginPath();
      stroke.p.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x * k, y * k);
        else ctx.lineTo(x * k, y * k);
      });
      if (stroke.p.length === 1) ctx.lineTo(stroke.p[0][0] * k + 0.01, stroke.p[0][1] * k);
      ctx.stroke();
    });
  }, [data]);

  return <canvas ref={ref} className={className} />;
}