const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useCallback, useEffect, useState } from 'react';

const QUEUE_KEY = 'nook.queue';

export function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — nothing to do */
  }
}

// Tries the account first, falls back to what was last seen on this device.
export async function loadCached(key, loader) {
  try {
    const data = await loader();
    writeCache(key, data);
    return { data, offline: false };
  } catch (err) {
    const cached = readCache(key);
    if (cached !== null && cached !== undefined) return { data: cached, offline: true };
    throw err;
  }
}

export function useCached(key, loader, deps = []) {
  const [state, setState] = useState(() => ({ data: readCache(key), loading: true, offline: false }));

  const reload = useCallback(async () => {
    try {
      const { data, offline } = await loadCached(key, loader);
      setState({ data, loading: false, offline });
    } catch (err) {
      setState((s) => ({ ...s, loading: false }));
    }
  }, deps);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data, offline } = await loadCached(key, loader);
        if (live) setState({ data, loading: false, offline });
      } catch (err) {
        if (live) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => {
      live = false;
    };
  }, [reload]);

  return { ...state, reload };
}

export function queueWrite(item) {
  const q = readCache(QUEUE_KEY) || [];
  q.push({ ...item, at: Date.now() });
  writeCache(QUEUE_KEY, q);
}

export function pendingWrites() {
  return (readCache(QUEUE_KEY) || []).length;
}

export async function flushQueue() {
  const q = readCache(QUEUE_KEY) || [];
  if (!q.length) return 0;
  const remaining = [];
  for (const item of q) {
    const entity = db.entities[item.entity];
    try {
      if (!entity) throw new Error('unknown entity');
      if (item.op === 'create') await entity.create(item.payload);
      else if (item.op === 'update') await entity.update(item.payload.id, item.payload.data);
      else if (item.op === 'delete') await entity.delete(item.payload.id);
    } catch (err) {
      remaining.push(item);
    }
  }
  writeCache(QUEUE_KEY, remaining);
  return q.length - remaining.length;
}