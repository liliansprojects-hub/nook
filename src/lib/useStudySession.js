import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';

import { loadCached, queueWrite } from '@/lib/offline';

const KEY = 'nook.activeSession';
export const COINS_PER_MINUTE = 8;

let listeners = new Set();

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

function writeLocal(value) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    /* nothing kept */
  }
  listeners.forEach((fn) => fn());
}

export function getActiveSession() {
  return readLocal();
}

// A block you tapped "study this now" on — the finish dialog offers it as the tag.
export function setPendingTag(tag) {
  try {
    if (tag) localStorage.setItem('nook.pendingTag', JSON.stringify(tag));
    else localStorage.removeItem('nook.pendingTag');
  } catch {
    /* nothing kept */
  }
}

export function getPendingTag() {
  try {
    return JSON.parse(localStorage.getItem('nook.pendingTag')) || null;
  } catch {
    return null;
  }
}

export function subscribeActiveSession(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === KEY) fn();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

function measure(session, now = Date.now()) {
  if (!session) return { elapsedSec: 0, breakSec: 0, coins: 0 };
  const pausedMs = (session.pausedMs || 0) + (session.pausedAt ? now - session.pausedAt : 0);
  const breakMs = (session.breakMs || 0) + (session.pausedAt && session.onBreak ? now - session.pausedAt : 0);
  const elapsedSec = Math.max(0, Math.round((now - session.startedAt - pausedMs) / 1000));
  // Coins land minute by minute, and any part of a minute at the end is paid in
  // proportion — 1 min 20 s earns 11, not 8.
  const coins = Math.round((elapsedSec / 60) * COINS_PER_MINUTE);
  return { elapsedSec, breakSec: Math.round(breakMs / 1000), coins };
}

export function startSession(room) {
  writeLocal({
    key: crypto.randomUUID(),
    roomId: room?.id || null,
    roomName: room?.name || 'Free study',
    roomTheme: room?.theme || 'oat',
    isFree: !room?.id,
    startedAt: Date.now(),
    pausedAt: null,
    onBreak: false,
    pausedMs: 0,
    breakMs: 0,
    pauses: 0,
  });
}

export function pauseSession(onBreak = false) {
  const s = readLocal();
  if (!s || s.pausedAt) return;
  writeLocal({ ...s, pausedAt: Date.now(), onBreak, pauses: (s.pauses || 0) + 1 });
}

export function resumeSession() {
  const s = readLocal();
  if (!s || !s.pausedAt) return;
  const delta = Date.now() - s.pausedAt;
  writeLocal({
    ...s,
    pausedAt: null,
    pausedMs: (s.pausedMs || 0) + delta,
    breakMs: (s.breakMs || 0) + (s.onBreak ? delta : 0),
    onBreak: false,
  });
}

export function discardSession() {
  writeLocal(null);
}

export async function finishSession(meta = {}) {
  const s = readLocal();
  if (!s) return null;
  const now = Date.now();
  const { elapsedSec, breakSec, coins } = measure(s, now);
  const record = {
    session_key: s.key,
    room_id: s.roomId || '',
    room_name: meta.roomName || s.roomName,
    room_theme: s.roomTheme,
    block_id: meta.blockId || '',
    block_label: meta.blockLabel || '',
    description: meta.description || '',
    location: meta.location || '',
    started_at: new Date(s.startedAt).toISOString(),
    ended_at: new Date(now).toISOString(),
    duration_seconds: elapsedSec,
    break_seconds: breakSec,
    pauses: s.pauses || 0,
    coins,
    tag_colour: meta.tagColour || '',
    is_free: !!s.isFree,
  };

  let savedId = null;
  try {
    const created = await base44.entities.StudySession.create(record);
    savedId = created?.id || null;
  } catch (err) {
    queueWrite({ entity: 'StudySession', op: 'create', payload: record });
  }

  let orders = [];
  try {
    const { data } = await loadCached(`nook.orders.${s.key}`, async () => {
      const page = await base44.entities.Purchase.filter(
        { session_key: s.key, deleted: { $ne: true } },
        { limit: 50 }
      );
      return page.items || [];
    });
    orders = Array.isArray(data) ? data : [];
  } catch (err) {
    orders = [];
  }

  writeLocal(null);
  return { ...record, id: savedId, purchases: orders };
}

export function useStudySession() {
  const [session, setSession] = useState(readLocal);
  const [now, setNow] = useState(Date.now());

  useEffect(() => subscribeActiveSession(() => setSession(readLocal())), []);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const live = measure(session, now);
  return {
    session,
    active: !!session,
    isPaused: !!session?.pausedAt,
    onBreak: !!session?.onBreak,
    startedAt: session?.startedAt || null,
    elapsedSec: live.elapsedSec,
    breakSec: live.breakSec,
    coins: live.coins,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    finish: finishSession,
    discard: discardSession,
  };
}