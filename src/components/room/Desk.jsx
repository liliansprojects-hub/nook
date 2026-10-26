const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useRef, useState } from 'react';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useCached, queueWrite } from '@/lib/offline';
import { useStudySession } from '@/lib/useStudySession';
import { menuItem } from '@/lib/cafeMenu';
import ItemArt from '@/components/cafe/ItemArt';
import { cn } from '@/lib/utils';

// A brown wooden table in perspective. Food and drink sit straight on the wood
// with no card behind them, and the finished part of a cup sinks into the grain.
const WOOD = '#E2C49F';
const WOOD_EDGE = '#D0AE87';
const WOOD_GRAIN = '#D8BA95';
const LEVEL_INTO_WOOD = { background: '#DEC7A8', mixBlendMode: 'multiply' };
const DRAIN = 16; // percent finished per second of holding on

// Where an item may sit, in percent of the desk box: the whole tabletop and
// nothing off its edge. The anchor is the middle of the item itself.
const TABLE_X = [10, 90];
const TABLE_Y = [55, 72];
const onWood = (value, [min, max]) => Math.min(max, Math.max(min, value));
const itemSize = (pastry) => (pastry ? { w: 92, h: 74 } : { w: 76, h: 104 });

export default function Desk({ roomId }) {
  const { session } = useStudySession();
  const sessionKey = session?.key || '';
  const [items, setItems] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hold, setHold] = useState(null);
  const dragging = useRef(null);
  const holdTimer = useRef(null);
  const drainTimer = useRef(null);
  const moved = useRef(false);
  const deskRef = useRef(null);

  const cacheKey = roomId ? `nook.desk.${roomId}` : `nook.desk.free.${sessionKey}`;

  const { data, reload } = useCached(
    cacheKey,
    async () => {
      if (!roomId && !sessionKey) return [];
      const query = roomId
        ? { room_id: roomId, deleted: { $ne: true }, remaining: { $gt: 0 } }
        : { session_key: sessionKey, deleted: { $ne: true }, remaining: { $gt: 0 } };
      const page = await db.entities.Purchase.filter(query, { sort: '-created_date', limit: 10 });
      return page.items || [];
    },
    [roomId, sessionKey]
  );

  useEffect(() => {
    setItems(Array.isArray(data) ? data : []);
  }, [data]);

  useEffect(() => {
    const unsubscribe = db.entities.Purchase.subscribe(() => reload());
    return unsubscribe;
  }, [reload]);

  // every change is written at once, and queued if the signal drops
  const write = (id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    db.entities.Purchase.update(id, patch).catch(() =>
      queueWrite({ entity: 'Purchase', op: 'update', payload: { id, data: patch } })
    );
  };

  const stopDrain = () => {
    if (drainTimer.current) {
      clearInterval(drainTimer.current);
      drainTimer.current = null;
    }
    setHold(null);
  };

  const finish = (item) => {
    stopDrain();
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    write(item.id, { remaining: 0 });
  };

  // held down: the ring counts the seconds and the cup empties as you hold
  const startDrain = (item) => {
    const from = item.remaining ?? 100;
    const startedAt = Date.now();
    setHold({ id: item.id, seconds: 0 });
    drainTimer.current = setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, from - seconds * DRAIN);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, remaining } : i)));
      setHold({ id: item.id, seconds });
      if (remaining <= 0) finish(item);
    }, 100);
  };

  const onPointerDown = (e, item) => {
    if (e.target.closest('[data-desk-ui]')) return;
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      x: onWood(item.desk_x ?? 30, TABLE_X),
      y: onWood(item.desk_y ?? 55, TABLE_Y),
    };
    holdTimer.current = setTimeout(() => {
      dragging.current = null;
      startDrain(item);
    }, 180);
  };

  const onPointerMove = (e) => {
    const drag = dragging.current;
    if (!drag || !deskRef.current) return;
    const rect = deskRef.current.getBoundingClientRect();
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      moved.current = true;
      clearTimeout(holdTimer.current);
    }
    // free across the tabletop, never past its edge
    const x = onWood(drag.x + (dx / rect.width) * 100, TABLE_X);
    const y = onWood(drag.y + (dy / rect.height) * 100, TABLE_Y);
    setItems((prev) => prev.map((i) => (i.id === drag.id ? { ...i, desk_x: x, desk_y: y } : i)));
  };

  const onPointerUp = (e, item) => {
    clearTimeout(holdTimer.current);
    const wasDraining = !!drainTimer.current;
    const drag = dragging.current;
    dragging.current = null;

    if (wasDraining) {
      stopDrain();
      const current = items.find((i) => i.id === item.id);
      if (current) write(item.id, { remaining: Math.max(0, Math.round(current.remaining ?? 100)) });
      return;
    }

    if (!drag || !moved.current) return;
    const current = items.find((i) => i.id === item.id);
    if (current) write(item.id, { desk_x: current.desk_x, desk_y: current.desk_y });
  };

  const remove = (item) => {
    setMenuOpen(false);
    stopDrain();
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    db.entities.Purchase.update(item.id, { deleted: true }).catch(() =>
      queueWrite({ entity: 'Purchase', op: 'update', payload: { id: item.id, data: { deleted: true } } })
    );
  };

  return (
    <div>
      <h3 className="mb-2 font-heading text-sm font-black">desk</h3>

      <div ref={deskRef} className="relative h-[340px] overflow-hidden rounded-[1.8rem] border border-brand-soft bg-background">
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-secondary/50" />

        <div
          className="absolute inset-x-3 bottom-[-6%] h-[90%] origin-bottom"
          style={{
            transform: 'perspective(900px) rotateX(30deg)',
            background: WOOD,
            boxShadow: `inset 0 0 0 1px ${WOOD_EDGE}`,
          }}
        >
          {[18, 42, 66, 88].map((top) => (
            <span key={top} className="absolute left-0 right-0 h-[2px]" style={{ top: `${top}%`, background: WOOD_GRAIN, opacity: 0.8 }} />
          ))}
        </div>

        {items.length === 0 && (
          <p className="absolute inset-x-0 top-[16%] px-10 text-center text-[12px] font-bold text-muted-foreground">
            empty.
          </p>
        )}

        {items.map((item) => {
          const line = menuItem(item.item_id) || { id: item.item_id, kind: item.item_kind, name: item.item_name };
          const level = item.remaining ?? 100;
          const isHolding = hold?.id === item.id;
          const pastry = item.item_kind === 'pastry';
          const gone = Math.round(100 - level);
          // nothing here may transform the item: a transform would cut the art
          // off from the wood behind it and leave its white backdrop showing.
          const size = itemSize(pastry);
          return (
            <div
              key={item.id}
              className="absolute touch-none select-none"
              style={{
                left: `${onWood(item.desk_x ?? 30, TABLE_X)}%`,
                top: `${onWood(item.desk_y ?? 55, TABLE_Y)}%`,
                marginLeft: -size.w / 2,
                marginTop: -size.h / 2,
              }}
              onPointerDown={(e) => onPointerDown(e, item)}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerUp(e, item)}
              onPointerCancel={() => {
                clearTimeout(holdTimer.current);
                stopDrain();
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div
                className={cn(
                  'relative cursor-grab active:cursor-grabbing',
                  pastry ? 'h-[74px] w-[92px]' : 'h-[104px] w-[76px]'
                )}
              >
                <ItemArt item={line} remaining={level} reflection={!pastry} levelStyle={LEVEL_INTO_WOOD} className="h-full w-full" />

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
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold text-background">
                    {hold.seconds.toFixed(1)}s
                  </span>
                )}

                {(item.quantity || 1) > 1 && (
                  <span className="absolute -right-2 top-0 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold text-brand-ink">
                    ×{item.quantity}
                  </span>
                )}
              </div>

              <p className="mt-0.5 max-w-[100px] truncate text-center text-[9px] font-bold text-muted-foreground">{item.item_name}</p>

              {gone > 0 && (
                <div className="mx-auto mt-1 w-[64px]">
                  <div className="h-1.5 overflow-hidden rounded-full bg-foreground/15">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${gone}%` }} />
                  </div>
                  <p className="mt-0.5 text-center text-[9px] font-bold text-muted-foreground">
                    {gone}% {pastry ? 'eaten' : 'drunk'}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {menuOpen && <div data-desk-ui className="absolute inset-0 z-10" onClick={() => setMenuOpen(false)} />}

        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            data-desk-ui
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="items on the desk"
            aria-expanded={menuOpen}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card/90 text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div
              data-desk-ui
              className="absolute right-0 top-10 w-[196px] animate-fade-up rounded-[1.3rem] border border-border bg-card p-2 shadow-lift"
            >
              <p className="mb-1.5 px-1 text-[10px] font-bold tracking-[0.14em] text-muted-foreground">remove</p>
              {items.length === 0 ? (
                <p className="px-1 pb-1 text-[11px] text-muted-foreground">nothing on the desk.</p>
              ) : (
                <div className="max-h-[190px] space-y-1 overflow-y-auto">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => remove(item)}
                      className="flex w-full items-center gap-2 rounded-full px-2.5 py-2 text-left text-[11px] font-bold hover:bg-secondary"
                    >
                      <span className="min-w-0 flex-1 truncate">{item.item_name}</span>
                      <Trash2 className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}