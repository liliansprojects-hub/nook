import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const SIZE = 160;
const RING = 24;

// 24 hue stops, so the ring reads as a smooth spread of shades rather than blocks.
export const HUE_RING = `conic-gradient(from 0deg, ${Array.from(
  { length: 25 },
  (_, i) => `hsl(${i * 15} 72% 76%)`
).join(', ')})`;

function hueAt(e, box) {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
  return Math.round(((deg % 360) + 360) % 360);
}

// A colour wheel for mixing your own accent: drag around the ring for the hue,
// then set the opacity and lightness of it.
export default function AccentWheel({ initial, active, onUse }) {
  const [h, setH] = useState(initial?.h ?? 8);
  const [s, setS] = useState(initial?.s ?? 78);
  const [l, setL] = useState(initial?.l ?? 76);
  const [dragging, setDragging] = useState(false);
  const ring = useRef(null);

  const pick = (e) => setH(hueAt(e, ring.current.getBoundingClientRect()));
  const angle = ((h - 90) * Math.PI) / 180;
  const dot = { left: `${50 + 41 * Math.cos(angle)}%`, top: `${50 + 41 * Math.sin(angle)}%` };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div
        ref={ring}
        role="slider"
        aria-label="hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={h}
        onPointerDown={(e) => {
          setDragging(true);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (dragging) pick(e);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="relative shrink-0 touch-none rounded-full"
        style={{ width: SIZE, height: SIZE, background: HUE_RING }}
      >
        <span className="absolute rounded-full bg-card" style={{ inset: RING }} />
        <span
          className={cn('absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-lift', active && 'ring-2 ring-foreground')}
          style={{ ...dot, background: `hsl(${h} ${s}% ${l}%)` }}
        />
      </div>

      <div className="min-w-[190px] flex-1 space-y-3">
        <label className="block">
          <span className="text-[11px] font-bold text-muted-foreground">opacity</span>
          <input type="range" min={30} max={95} value={s} onChange={(e) => setS(Number(e.target.value))} className="w-full accent-brand" />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold text-muted-foreground">lightness</span>
          <input type="range" min={52} max={88} value={l} onChange={(e) => setL(Number(e.target.value))} className="w-full accent-brand" />
        </label>
        <button
          type="button"
          onClick={() => onUse?.({ h, s, l })}
          className="press flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-[12px] text-background"
        >
          <span className="h-4 w-4 rounded-full" style={{ background: `hsl(${h} ${s}% ${l}%)` }} /> use this colour
        </button>
      </div>
    </div>
  );
}