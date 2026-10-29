import { useEffect, useMemo, useState } from 'react';

// Removes the white studio backdrop from a product photo so the item sits on the
// desk with real transparency. Only white that is connected to the picture's
// edge is removed, so white cream, foam or a white cup inside the item survive.

// A pixel counts as backdrop when it is this light and nearly colourless.
// Lower it if a faint backdrop halo is left; raise it if light parts of an item get eaten.
export const CUTOUT_WHITE = 226;
const NEUTRAL = 22;
const MAX_SIDE = 384;

const isBackdrop = (d, i) => {
  if (d[i + 3] < 12) return true;
  const r = d[i];
  const g = d[i + 1];
  const b = d[i + 2];
  const lo = Math.min(r, g, b);
  return lo >= CUTOUT_WHITE && Math.max(r, g, b) - lo <= NEUTRAL;
};

// data: RGBA bytes (modified in place). Returns the bounding box of what is left.
export function cutoutPixels(data, w, h) {
  const n = w * h;
  const bg = new Uint8Array(n);
  const stack = new Int32Array(n);
  let sp = 0;
  const push = (p) => {
    if (!bg[p] && isBackdrop(data, p * 4)) {
      bg[p] = 1;
      stack[sp++] = p;
    }
  };
  for (let x = 0; x < w; x += 1) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y += 1) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (sp > 0) {
    const p = stack[--sp];
    const x = p % w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (p >= w) push(p - w);
    if (p < n - w) push(p + w);
  }

  // clear the backdrop
  for (let p = 0; p < n; p += 1) if (bg[p]) data[p * 4 + 3] = 0;

  // soften the rim: pixels touching the backdrop fade with how white they are,
  // and lose the white they picked up from it
  const rim = [];
  for (let p = 0; p < n; p += 1) {
    if (bg[p]) continue;
    const x = p % w;
    const y = (p - x) / w;
    let touches = false;
    for (let dy = -1; dy <= 1 && !touches; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (bg[ny * w + nx]) {
          touches = true;
          break;
        }
      }
    }
    if (touches) rim.push(p);
  }
  for (const p of rim) {
    const i = p * 4;
    const lo = Math.min(data[i], data[i + 1], data[i + 2]);
    const white = Math.min(1, Math.max(0, (lo - 170) / (CUTOUT_WHITE - 170)));
    const a = 1 - white * 0.85;
    for (let c = 0; c < 3; c += 1) {
      data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - (1 - a) * 255) / Math.max(a, 0.15))));
    }
    data[i + 3] = Math.round(a * 255);
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let p = 0; p < n; p += 1) {
    if (data[p * 4 + 3] > 24) {
      const x = p % w;
      const y = (p - x) / w;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

const done = new Map(); // src -> result
const pending = new Map(); // src -> promise

function process(src) {
  return new Promise((resolve) => {
    const fallback = { url: src, aspect: null, cut: false };
    const img = new window.Image();
    // anonymous CORS is what lets us read the pixels; if the host refuses, the plain picture is used
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h); // throws if the canvas is tainted
        const box = cutoutPixels(frame.data, w, h);
        if (!box) return resolve(fallback);
        ctx.putImageData(frame, 0, 0);
        const pad = 2;
        const x0 = Math.max(0, box.minX - pad);
        const y0 = Math.max(0, box.minY - pad);
        const cw = Math.min(w, box.maxX + pad + 1) - x0;
        const ch = Math.min(h, box.maxY + pad + 1) - y0;
        const out = document.createElement('canvas');
        out.width = cw;
        out.height = ch;
        out.getContext('2d').drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
        out.toBlob((blob) => {
          if (!blob) return resolve(fallback);
          resolve({ url: URL.createObjectURL(blob), aspect: cw / ch, cut: true });
        }, 'image/png');
      } catch {
        resolve(fallback);
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = src;
  });
}

export function loadCutout(src) {
  if (done.has(src)) return Promise.resolve(done.get(src));
  if (!pending.has(src)) {
    pending.set(
      src,
      process(src).then((result) => {
        done.set(src, result);
        pending.delete(src);
        return result;
      })
    );
  }
  return pending.get(src);
}

// sources: { [key]: imageUrl }  ->  { [key]: { url, aspect, cut } } as each one finishes
export function useCutouts(sources) {
  const [results, setResults] = useState({});
  const signature = JSON.stringify(sources);
  const wanted = useMemo(() => JSON.parse(signature), [signature]);

  useEffect(() => {
    let live = true;
    Object.entries(wanted).forEach(([key, src]) => {
      if (!src) return;
      loadCutout(src).then((result) => {
        if (live) setResults((prev) => (prev[key]?.src === src ? prev : { ...prev, [key]: { ...result, src } }));
      });
    });
    return () => {
      live = false;
    };
  }, [wanted]);

  return results;
}
