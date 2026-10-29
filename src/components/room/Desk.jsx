import { base44 } from '@/api/base44Client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Check, Trash2, X } from 'lucide-react';
import { useCached, queueWrite } from '@/lib/offline';
import { useStudySession } from '@/lib/useStudySession';
import { menuItem } from '@/lib/cafeMenu';
import { PHOTOS } from '@/lib/cafeArt';
import { useCutouts } from '@/lib/cutout';
import {
  BASE_H,
  FAR,
  GAP,
  PAD_BOTTOM,
  clampSpot,
  deskHeight,
  moveWithCollision,
  settle,
  tableInset,
  toPct,
  toPx,
} from '@/lib/deskLayout';
import { cn } from '@/lib/utils';

// A wooden table. Every purchase arrives on it with its background removed, can be
// dragged anywhere on the wood, and never overlaps another item (2px apart at most).
const WOOD = '#E2C49F';
const WOOD_EDGE = '#D0AE87';
const WOOD_GRAIN = '#D8BA95';
const DRAIN = 45; // percent finished per second of holding on (about 2 seconds for a full cup)
const HOLD_MS = 130; // how long to keep a finger down before it counts as "holding"
const MOVE_SLOP = 6;
const PROG_H = 8; // room under each item for its progress bar
const MAX_ITEMS = 80;
const CORNER = 44; // the delete button's keep-out square in the table's corner
const FIT = { drink: { w: 64, h: 92 }, pastry: { w: 84, h: 62 } };

const sourceFor = (item) => {
  const line = menuItem(item.item_id);
  return PHOTOS[item.item_id] || line?.art || '';
};

// art size from the cut-out's real proportions
function artSize(kind, aspect) {
  const box = kind === 'pastry' ? FIT.pastry : FIT.drink;
  if (!aspect) return box;
  let w = box.w;
  let h = w / aspect;
  if (h > box.h) {
    h = box.h;
    w = h * aspect;
  }
  return { w: Math.max(28, Math.round(w)), h: Math.max(28, Math.round(h)) };
}

// the eaten / drunk part fades out; drinks empty from the top, pastries from the left
function levelMask(kind, gone) {
  if (gone <= 0) return {};
  const dir = kind === 'pastry' ? 'to right' : 'to bottom';
  const g = `linear-gradient(${dir}, rgba(0,0,0,0.14) 0, rgba(0,0,0,0.14) ${gone}%, #000 ${gone}%)`;
  return { maskImage: g, WebkitMaskImage: g };
}

export default function Desk({ roomId }) {
  const { session } = useStudySession();
  const sessionKey = session?.key || '';
  const [items, setItems] = useState([]);
  const [pos, setPos] = useState({}); // id -> { x, b } in px
  const [width, setWidth] = useState(360);
  const [hold, setHold] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const deskRef = useRef(null);
  const itemsRef = useRef([]);
  const posRef = useRef({});
  const sizesRef = useRef({});
  const dragging = useRef(null);
  const holdTimer = useRef(null);
  const drainRaf = useRef(null);
  const moved = useRef(false);
  const busy = useRef(false);
  const pending = useRef(null);

  itemsRef.current = items;
  posRef.current = pos;

  const cacheKey = roomId ? `nook.desk.${roomId}` : `nook.desk.free.${sessionKey}`;

  const { data, reload } = useCached(
    cacheKey,
    async () => {
      if (!roomId && !sessionKey) return [];
      const query = roomId
        ? { room_id: roomId, deleted: { $ne: true }, remaining: { $gt: 0 } }
        : { session_key: sessionKey, deleted: { $ne: true }, remaining: { $gt: 0 } };
      const page = await base44.entities.Purchase.filter(query, { sort: '-created_date', limit: MAX_ITEMS });
      return page.items || [];
    },
    [roomId, sessionKey]
  );

  // new data is held back while an item is being dragged or held, then applied on release
  useEffect(() => {
    const next = Array.isArray(data) ? data : [];
    if (busy.current) pending.current = next;
    else setItems(next);
  }, [data]);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = base44.entities.Purchase.subscribe(() => reload());
    } catch {
      /* realtime unavailable (offline): the desk still loads on open */
    }
    return () => unsubscribe?.();
  }, [reload]);

  useEffect(() => {
    const el = deskRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // background removal for every item on the desk
  const sources = useMemo(() => {
    const map = {};
    for (const item of items) if (!map[item.item_id]) map[item.item_id] = sourceFor(item);
    return map;
  }, [items]);
  const cutouts = useCutouts(sources);
  const allResolved = items.every((i) => !sources[i.item_id] || cutouts[i.item_id]);

  // footprint of every item: its art plus the strip for its progress bar
  const sizes = useMemo(() => {
    const out = {};
    for (const item of items) {
      const art = artSize(item.item_kind, cutouts[item.item_id]?.aspect);
      out[item.id] = { w: art.w, h: art.h + PROG_H, artH: art.h };
    }
    return out;
  }, [items, cutouts]);
  sizesRef.current = sizes;

  const cornerRect = useMemo(() => ({ x: width - 6 - CORNER / 2, b: 6, w: CORNER, h: CORNER }), [width]);

  const write = useCallback((id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    base44.entities.Purchase.update(id, patch).catch(() =>
      queueWrite({ entity: 'Purchase', op: 'update', payload: { id, data: patch } })
    );
  }, []);

  // arrival and resize: find every item a free spot. Items that had to move are saved there.
  const layoutKey = `${items.map((i) => i.id).join(',')}|${width}|${items.map((i) => `${sizes[i.id]?.w}x${sizes[i.id]?.h}`).join(',')}`;
  useEffect(() => {
    if (busy.current) return;
    const ordered = [...items].sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')));
    const input = ordered.map((i) => ({ id: i.id, ...sizes[i.id], ...toPx(i, width) }));
    const out = settle(input, width, [cornerRect]);
    setPos(out);
    if (!allResolved) return;
    for (const i of ordered) {
      const want = toPx(i, width);
      const got = out[i.id];
      if (got && (Math.abs(got.x - want.x) > 1 || Math.abs(got.b - want.b) > 1)) {
        const patch = toPct(got, width);
        base44.entities.Purchase.update(i.id, patch).catch(() =>
          queueWrite({ entity: 'Purchase', op: 'update', payload: { id: i.id, data: patch } })
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey, allResolved]);

  const deskH = deskHeight(items.map((i) => ({ ...(pos[i.id] || { b: PAD_BOTTOM }), h: sizes[i.id]?.h || 0 })));
  const tableTop = FAR;
  const farB = deskH - FAR;
  const sideInset = Math.round(tableInset(farB));

  const releaseBusy = () => {
    busy.current = false;
    if (pending.current) {
      setItems(pending.current);
      pending.current = null;
    }
  };

  const stopDrain = () => {
    if (drainRaf.current !== null) {
      cancelAnimationFrame(drainRaf.current);
      drainRaf.current = null;
    }
    setHold(null);
  };

  const finish = (item) => {
    stopDrain();
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    write(item.id, { remaining: 0 });
    releaseBusy();
  };

  // held down: the ring and bar run as you hold and the cup empties in about two seconds
  const startDrain = (item) => {
    busy.current = true;
    const from = itemsRef.current.find((i) => i.id === item.id)?.remaining ?? 100;
    const startedAt = performance.now();
    setHold({ id: item.id, seconds: 0 });
    const tick = (now) => {
      const seconds = (now - startedAt) / 1000;
      const remaining = Math.max(0, from - seconds * DRAIN);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, remaining } : i)));
      setHold({ id: item.id, seconds });
      if (remaining <= 0) {
        finish(item);
        return;
      }
      drainRaf.current = requestAnimationFrame(tick);
    };
    drainRaf.current = requestAnimationFrame(tick);
  };

  const toggleSelected = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onPointerDown = (e, item) => {
    if (e.target.closest('[data-desk-ui]')) return;
    if (selecting) return;
    moved.current = false;
    busy.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const at = posRef.current[item.id] || toPx(item, width);
    dragging.current = { id: item.id, startX: e.clientX, startY: e.clientY, x: at.x, b: at.b };
    holdTimer.current = setTimeout(() => {
      dragging.current = null;
      startDrain(item);
    }, HOLD_MS);
  };

  const onPointerMove = (e) => {
    const drag = dragging.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!moved.current && Math.abs(dx) <= MOVE_SLOP && Math.abs(dy) <= MOVE_SLOP) return;
    moved.current = true;
    clearTimeout(holdTimer.current);
    const size = sizesRef.current[drag.id];
    if (!size) return;
    const others = itemsRef.current
      .filter((i) => i.id !== drag.id && posRef.current[i.id] && sizesRef.current[i.id])
      .map((i) => ({ ...posRef.current[i.id], w: sizesRef.current[i.id].w, h: sizesRef.current[i.id].h }));
    const H = deskHeight(
      itemsRef.current.map((i) => ({ ...(posRef.current[i.id] || { b: PAD_BOTTOM }), h: sizesRef.current[i.id]?.h || 0 }))
    );
    const from = posRef.current[drag.id] || { x: drag.x, b: drag.b };
    const to = clampSpot({ x: drag.x + dx, b: drag.b - dy }, size, width, H);
    const next = moveWithCollision(from, to, size, [...others, cornerRect], width, H, GAP);
    setPos((prev) => ({ ...prev, [drag.id]: next }));
  };

  const onPointerUp = (e, item) => {
    clearTimeout(holdTimer.current);
    const wasDraining = drainRaf.current !== null;
    const drag = dragging.current;
    dragging.current = null;

    if (wasDraining) {
      stopDrain();
      const current = itemsRef.current.find((i) => i.id === item.id);
      if (current) write(item.id, { remaining: Math.max(0, Math.round(current.remaining ?? 100)) });
      releaseBusy();
      return;
    }

    if (drag && moved.current) {
      const at = posRef.current[item.id];
      if (at) write(item.id, toPct(at, width));
    }
    releaseBusy();
  };

  const onPointerCancel = () => {
    clearTimeout(holdTimer.current);
    dragging.current = null;
    stopDrain();
    releaseBusy();
  };

  // ---- select and delete ----
  const exitSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const deleteSelected = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    for (const id of ids) {
      base44.entities.Purchase.update(id, { deleted: true }).catch(() =>
        queueWrite({ entity: 'Purchase', op: 'update', payload: { id, data: { deleted: true } } })
      );
    }
    exitSelecting();
  };

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-heading text-sm font-black">desk</h3>
        {selecting && (
          <p className="text-[11px] font-bold text-muted-foreground">
            {selected.size === 0 ? 'tap items to select' : `${selected.size} selected`}
          </p>
        )}
      </div>

      <div
        ref={deskRef}
        data-testid="desk"
        className="relative overflow-hidden rounded-[1.8rem] border border-brand-soft bg-background transition-[height] duration-300"
        style={{ height: Math.max(BASE_H, deskH) }}
      >
        <div className="absolute inset-x-0 bottom-0 bg-secondary/50" style={{ top: tableTop - 24 }} />

        {/* the tabletop: far edge at the top, flaring out to the full width in front */}
        <div
          data-testid="table"
          className="absolute inset-x-0 bottom-0"
          style={{
            top: tableTop,
            background: WOOD,
            clipPath: `polygon(${sideInset}px 0, calc(100% - ${sideInset}px) 0, 100% 100%, 0 100%)`,
          }}
        >
          {[0.2, 0.42, 0.64, 0.84].map((f) => (
            <span
              key={f}
              className="absolute left-0 right-0 h-[2px]"
              style={{ top: `${f * 100}%`, background: WOOD_GRAIN, opacity: 0.8 }}
            />
          ))}
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: WOOD_EDGE }} />
        </div>

        {items.length === 0 && (
          <p className="absolute inset-x-0 top-[16%] px-10 text-center text-[12px] font-bold text-muted-foreground">empty.</p>
        )}

        {items.map((item) => {
          const at = pos[item.id];
          const size = sizes[item.id];
          if (!at || !size) return null;
          const cut = cutouts[item.item_id];
          const src = sourceFor(item);
          const level = item.remaining ?? 100;
          const gone = Math.round(100 - level);
          const isHolding = hold?.id === item.id;
          const isSelected = selected.has(item.id);
          const pastry = item.item_kind === 'pastry';
          const fresh = Date.now() - Date.parse(item.paid_at || item.created_date || 0) < 12000;
          const artStyle = cut?.cut
            ? { filter: 'drop-shadow(0 2px 2px rgba(70,40,10,0.35))', ...levelMask(item.item_kind, gone) }
            : { mixBlendMode: 'multiply', filter: 'contrast(1.12) brightness(1.04)', ...levelMask(item.item_kind, gone) };
          const bottom = at.b;

          return (
            <div
              key={item.id}
              data-testid="desk-item"
              data-item-id={item.id}
              className={cn('group absolute select-none', selecting ? 'cursor-pointer' : 'cursor-grab touch-none active:cursor-grabbing')}
              style={{
                left: at.x - size.w / 2,
                bottom,
                width: size.w,
                height: size.h,
                zIndex: dragging.current?.id === item.id || isHolding ? 10 : 1,
                // arrival drop uses margin, never a transform: a transform would isolate the item from the wood
                '--drop': `${size.h + 70}px`,
                animation: fresh ? 'deskDrop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both' : undefined,
              }}
              onClick={() => selecting && toggleSelected(item.id)}
              onPointerDown={(e) => onPointerDown(e, item)}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerUp(e, item)}
              onPointerCancel={onPointerCancel}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="relative" style={{ width: size.w, height: size.artH }}>
                {src ? (
                  <img
                    src={cut?.url || src}
                    alt={item.item_name || ''}
                    draggable={false}
                    className="h-full w-full object-contain"
                    style={artStyle}
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center rounded-[0.8rem] bg-secondary px-1 text-center text-[9px] font-bold text-muted-foreground">
                    {item.item_name}
                  </span>
                )}

                {isHolding && (
                  <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-2 -rotate-90">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--brand))" strokeOpacity="0.3" strokeWidth="5" />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="hsl(var(--brand))"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={2 * Math.PI * 46 * (level / 100)}
                    />
                  </svg>
                )}

                {isHolding && (
                  <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold text-background">
                    {hold.seconds.toFixed(1)}s
                  </span>
                )}

                {!isHolding && (
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden max-w-[140px] -translate-x-1/2 truncate rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold text-background group-hover:block">
                    {item.item_name}
                  </span>
                )}

                {(item.quantity || 1) > 1 && (
                  <span className="pointer-events-none absolute -right-1 top-0 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold text-brand-ink">
                    ×{item.quantity}
                  </span>
                )}

                {selecting && (
                  <span
                    className={cn(
                      'pointer-events-none absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2',
                      isSelected ? 'border-brand bg-brand text-brand-ink' : 'border-foreground/40 bg-card/90 text-transparent'
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                )}
                {selecting && isSelected && <span className="pointer-events-none absolute inset-0 rounded-[0.8rem] ring-2 ring-brand" />}
              </div>

              <div className="mt-[2px] h-[6px] overflow-hidden rounded-full bg-foreground/15" style={{ opacity: gone > 0 ? 1 : 0 }}>
                <div className="h-full rounded-full bg-brand" style={{ width: `${gone}%` }} />
              </div>
            </div>
          );
        })}

        {/* the delete button sits in the table's corner; items keep out of it */}
        <button
          type="button"
          data-desk-ui
          data-testid="desk-select"
          onClick={() => (selecting ? exitSelecting() : setSelecting(true))}
          aria-label={selecting ? 'stop selecting' : 'select items to delete'}
          aria-pressed={selecting}
          className={cn(
            'absolute z-20 grid place-items-center rounded-full border shadow-sm',
            selecting ? 'border-brand bg-brand text-brand-ink' : 'border-border bg-card/90 text-muted-foreground'
          )}
          style={{ right: 6, bottom: 6, width: CORNER, height: CORNER }}
        >
          {selecting ? <X className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
        </button>
      </div>

      {selecting && (
        <div data-desk-ui className="mt-2 flex items-center gap-2">
          <button
            type="button"
            data-testid="desk-select-all"
            disabled={items.length === 0}
            onClick={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))}
            className="rounded-full bg-secondary px-4 py-2.5 text-[12px] font-bold text-foreground disabled:opacity-50"
          >
            {allSelected ? 'clear' : 'select all'}
          </button>
          <button
            type="button"
            data-testid="desk-delete"
            disabled={selected.size === 0}
            onClick={deleteSelected}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-[12px] font-bold text-destructive-foreground disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {selected.size > 0 ? `delete ${selected.size}` : 'delete'}
          </button>
        </div>
      )}
    </div>
  );
}
