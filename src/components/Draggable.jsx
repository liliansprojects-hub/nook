import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const KEY = (id) => `nook.drag.${id}`;

// Anything floating can be picked up and dropped anywhere, and stays there
// next time. A real drag never counts as a tap, so dragging the timer moves it
// without opening anything.
export default function Draggable({ id, defaultClass, className, children, disabled = false, onDragStart }) {
  const [pos, setPos] = useState(null);
  const [dragging, setDragging] = useState(false);
  const box = useRef(null);
  const start = useRef(null);
  const draggedAt = useRef(0);
  const startCb = useRef(onDragStart);
  startCb.current = onDragStart;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(id));
      if (raw) setPos(JSON.parse(raw));
    } catch {
      /* starts where it always does */
    }
  }, [id]);

  // keep a remembered spot on screen after a resize
  useEffect(() => {
    const el = box.current;
    if (!pos || !el) return;
    const x = Math.max(8, Math.min(pos.x, window.innerWidth - el.offsetWidth - 8));
    const y = Math.max(8, Math.min(pos.y, window.innerHeight - el.offsetHeight - 8));
    if (x !== pos.x || y !== pos.y) setPos({ x, y });
  }, [pos]);

  useEffect(() => {
    if (!dragging) return undefined;

    const move = (e) => {
      const s = start.current;
      const el = box.current;
      if (!s || !el) return;
      if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8) return;
      if (!s.moved) {
        s.moved = true;
        draggedAt.current = Date.now();
        startCb.current?.();
      }
      const x = Math.min(Math.max(8, s.left + (e.clientX - s.x)), Math.max(8, window.innerWidth - el.offsetWidth - 8));
      const y = Math.min(Math.max(8, s.top + (e.clientY - s.y)), Math.max(8, window.innerHeight - el.offsetHeight - 8));
      s.last = { x, y };
      setPos({ x, y });
    };

    const end = () => {
      const s = start.current;
      start.current = null;
      setDragging(false);
      if (s?.moved && s.last) {
        draggedAt.current = Date.now();
        try {
          localStorage.setItem(KEY(id), JSON.stringify(s.last));
        } catch {
          /* not kept */
        }
      }
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [dragging, id]);

  const down = (e) => {
    const el = box.current;
    if (disabled || !el) return;
    const rect = el.getBoundingClientRect();
    start.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top, moved: false, last: { x: rect.left, y: rect.top } };
    setDragging(true);
  };

  return (
    <div
      ref={box}
      data-draggable={id}
      onPointerDown={down}
      onClickCapture={(e) => {
        // a drag just finished: the release must not also count as a tap
        if (Date.now() - draggedAt.current < 400) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className={cn('fixed touch-none', pos ? 'cursor-grab active:cursor-grabbing' : defaultClass, className)}
      style={pos ? { left: `${pos.x}px`, top: `${pos.y}px` } : undefined}
    >
      {children}
    </div>
  );
}