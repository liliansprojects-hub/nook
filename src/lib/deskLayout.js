// Geometry for the café desk. Everything is in pixels of the desk box:
//   x = centre of an item, from the left edge
//   b = distance of the item's base (its feet) above the bottom edge
// An item occupies [x - w/2, x + w/2] by [b, b + h]. Items never overlap and may
// sit only GAP pixels apart. The table is a trapezoid whose far edge is FAR px
// below the top of the desk; the desk grows taller when more rows are needed.

export const BASE_H = 340;
export const FAR = 104;
export const SLOPE = 0.11; // how far each side edge leans in per px of depth
export const PAD_BOTTOM = 6;
export const GAP = 2;
const SIDE_PAD = 3;
const STEP = 3;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// highest base position that still stands on the wood for a desk H tall
export const farLimit = (H) => H - FAR - 6;

// the table's side edge at depth b, in px from the box side
export const tableInset = (b) => b * SLOPE;

// how tall the desk must be for rects {b, h}
export function deskHeight(rects) {
  let H = BASE_H;
  for (const r of rects) H = Math.max(H, r.b + FAR + 6, r.b + r.h + 6);
  return Math.ceil(H);
}

export function xRange(b, w, W) {
  const inset = tableInset(b) + SIDE_PAD;
  return [inset + w / 2, W - inset - w / 2];
}

export function clampSpot(spot, size, W, H = Infinity) {
  const b = clamp(spot.b, PAD_BOTTOM, Math.max(PAD_BOTTOM, farLimit(H)));
  const [lo, hi] = xRange(b, size.w, W);
  const x = lo <= hi ? clamp(spot.x, lo, hi) : W / 2;
  return { x, b };
}

export function overlaps(a, o, gap = GAP) {
  return (
    a.x - a.w / 2 < o.x + o.w / 2 + gap &&
    o.x - o.w / 2 < a.x + a.w / 2 + gap &&
    a.b < o.b + o.h + gap &&
    o.b < a.b + a.h + gap
  );
}

export const hitsAny = (rect, obstacles, gap = GAP) => obstacles.some((o) => overlaps(rect, o, gap));

// Walks from `from` towards `to` in small steps, sliding along whatever is in the
// way (x first, then y), so a fast drag can never jump over or into a neighbour.
export function moveWithCollision(from, to, size, obstacles, W, H, gap = GAP) {
  const dx = to.x - from.x;
  const db = to.b - from.b;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(db)) / 2));
  let cur = { ...from };
  const free = (spot) => !hitsAny({ ...spot, ...size }, obstacles, gap);
  for (let i = 0; i < steps; i += 1) {
    const tryX = clampSpot({ x: cur.x + dx / steps, b: cur.b }, size, W, H);
    if (free(tryX)) cur = tryX;
    const tryB = clampSpot({ x: cur.x, b: cur.b + db / steps }, size, W, H);
    if (free(tryB)) cur = tryB;
  }
  return cur;
}

// The free spot nearest to `pref`; looks further up the table (taller desk) when it is full.
export function findSpot(pref, size, obstacles, W, gap = GAP) {
  let from = PAD_BOTTOM;
  let limit = farLimit(BASE_H);
  for (let round = 0; round < 80; round += 1) {
    let best = null;
    let bestScore = Infinity;
    for (let b = from; b <= limit; b += STEP) {
      const [lo, hi] = xRange(b, size.w, W);
      if (lo > hi) continue;
      for (let x = lo; x <= hi + 0.01; x += STEP) {
        const cx = Math.min(x, hi);
        const rect = { x: cx, b, ...size };
        if (hitsAny(rect, obstacles, gap)) continue;
        const score = (cx - pref.x) ** 2 + (b - pref.b) ** 2;
        if (score < bestScore) {
          bestScore = score;
          best = { x: cx, b };
        }
      }
    }
    if (best) return best;
    from = limit;
    limit += 40;
  }
  return { x: W / 2, b: limit };
}

// Places items oldest first at their preferred spots; any that would overlap
// something (or hang off the table) move to the nearest free spot.
// items: [{ id, w, h, x, b }]. Returns { [id]: { x, b } }.
export function settle(items, W, fixed = [], gap = GAP) {
  const placed = [];
  const out = {};
  for (const it of items) {
    const size = { w: it.w, h: it.h };
    const pref = clampSpot({ x: it.x, b: it.b }, size, W);
    const obstacles = [...fixed, ...placed];
    const spot = hitsAny({ ...pref, ...size }, obstacles, gap) ? findSpot(pref, size, obstacles, W, gap) : pref;
    placed.push({ ...spot, ...size });
    out[it.id] = spot;
  }
  return out;
}

// stored positions are percentages: x of the width, y of BASE_H measured from the top
export const toPx = (item, W) => ({
  x: ((item.desk_x ?? 50) / 100) * W,
  b: ((100 - (item.desk_y ?? 90)) / 100) * BASE_H,
});
export const toPct = (spot, W) => ({
  desk_x: Math.round((spot.x / W) * 10000) / 100,
  desk_y: Math.round((100 - (spot.b / BASE_H) * 100) * 100) / 100,
});
