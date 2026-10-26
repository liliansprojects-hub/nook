import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Draggable from '@/components/Draggable';
import { KINDS, WHEEL_KINDS, kindOf } from '@/lib/blocks';

// The wheel fans out over a wide arc — from wherever the button has been dragged
// to — with every icon at the same distance from the button and the same angle
// apart, each with its own label underneath and nothing overlapping.
const SPAN = 150;
const BOX = 62;
const EDGE = 8;

// The fan opens as wide as the space around the button allows: it points away
// from the nearest screen edges, and if an icon would drift off the screen the
// arc narrows just enough to bring it back — so every icon keeps an even gap
// from its neighbours and none of them ever leaves the frame.
function geometry(rect) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const up = cy > h * 0.45;
  const leftward = cx > w * 0.5;
  const centre = up ? (leftward ? 225 : 315) : leftward ? 135 : 45;
  const room = {
    left: cx - EDGE - BOX / 2,
    right: w - cx - EDGE - BOX / 2,
    up: cy - EDGE - BOX / 2,
    down: h - cy - EDGE - BOX / 2,
  };

  const radiusFor = (span) => {
    const step = span / Math.max(1, WHEEL_KINDS.length - 1);
    let radius = 210;
    for (let i = 0; i < WHEEL_KINDS.length; i++) {
      const angle = ((centre - span / 2 + i * step) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      if (cos > 0.02) radius = Math.min(radius, room.right / cos);
      if (cos < -0.02) radius = Math.min(radius, room.left / -cos);
      if (sin > 0.02) radius = Math.min(radius, room.down / sin);
      if (sin < -0.02) radius = Math.min(radius, room.up / -sin);
    }
    return radius;
  };

  let span = SPAN;
  let radius = radiusFor(span);
  while (span > 88 && radius < 150) {
    span -= 6;
    radius = radiusFor(span);
  }

  return {
    radius: Math.round(Math.max(120, Math.min(210, radius))),
    start: centre - span / 2,
    step: span / Math.max(1, WHEEL_KINDS.length - 1),
  };
}

export default function AddBlockButton({ onPick }) {
  const [wheel, setWheel] = useState(false);
  const [panel, setPanel] = useState(false);
  const [ring, setRing] = useState(null);
  const holdRef = useRef(null);
  const heldRef = useRef(false);
  const startRef = useRef(null);
  const btnRef = useRef(null);

  const close = () => {
    setWheel(false);
    setPanel(false);
  };

  const pick = (kind) => {
    close();
    onPick?.(kind);
  };

  const openWheel = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setRing(geometry(rect));
    setWheel(true);
  };

  const cancelHold = () => {
    clearTimeout(holdRef.current);
    if (startRef.current) startRef.current.cancelled = true;
  };

  const handleDown = (e) => {
    heldRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, cancelled: false };
    holdRef.current = setTimeout(() => {
      heldRef.current = true;
      openWheel();
    }, 320);
  };

  const handleMove = (e) => {
    const start = startRef.current;
    if (!start || start.cancelled) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) cancelHold();
  };

  const handleUp = () => {
    clearTimeout(holdRef.current);
    if (startRef.current?.cancelled) return; // that was a drag
    if (wheel) {
      close(); // the x really closes the wheel
      return;
    }
    if (heldRef.current) return; // the hold already opened it
    setPanel(true);
  };

  const items = ring
    ? WHEEL_KINDS.map((kind, i) => {
        const angle = ((ring.start + i * ring.step) * Math.PI) / 180;
        return { kind, dx: Math.round(Math.cos(angle) * ring.radius), dy: Math.round(Math.sin(angle) * ring.radius) };
      })
    : [];

  return (
    <>
      {(wheel || panel) && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={close} />
      )}

      <Draggable
        id="add-block"
        defaultClass="bottom-8 right-5 md:bottom-10 md:right-10"
        className="z-50"
        disabled={wheel}
        onDragStart={cancelHold}
      >
        <div className="relative">
          {wheel && ring && (
            <div className="absolute left-1/2 top-1/2 h-0 w-0">
              {items.map(({ kind, dx, dy }) => {
                const k = kindOf(kind);
                const Icon = k.icon;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => pick(kind)}
                    title={k.label}
                    aria-label={k.label}
                    className="absolute left-0 top-0 flex w-[62px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-transform duration-200 hover:scale-110"
                    style={{ marginLeft: dx, marginTop: dy }}
                  >
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full shadow-lift"
                      style={{ background: k.tint, color: k.accent }}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="w-full truncate text-center text-[9px] font-bold leading-tight text-muted-foreground">
                      {k.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            ref={btnRef}
            type="button"
            aria-label={wheel ? 'Close the wheel' : 'Add block'}
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerLeave={() => clearTimeout(holdRef.current)}
            onContextMenu={(e) => e.preventDefault()}
            className="grid h-14 w-14 select-none place-items-center rounded-full bg-brand text-brand-foreground shadow-lift transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{ touchAction: 'none' }}
          >
            {wheel ? <X className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
          </button>
        </div>
      </Draggable>

      {panel && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-sheet-up rounded-t-[2rem] bg-card p-5 pb-8 shadow-lift md:inset-x-auto md:bottom-28 md:right-10 md:w-[400px] md:rounded-[2rem]">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border md:hidden" />
          <p className="mb-3 font-heading text-lg font-black">add a block</p>
          <div className="grid grid-cols-4 gap-2.5">
            {WHEEL_KINDS.map((kind) => {
              const k = kindOf(kind);
              const Icon = k.icon;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => pick(kind)}
                  className="press flex flex-col items-center gap-1.5 rounded-[1.1rem] bg-secondary/70 p-2.5"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: k.tint, color: k.accent }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold">{k.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[11px] font-bold text-muted-foreground">hold for the wheel</p>
        </div>
      )}
    </>
  );
}