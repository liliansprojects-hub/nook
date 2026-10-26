const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useCallback, useEffect, useState } from 'react';

import { loadCached } from '@/lib/offline';

// Coins come from finished sessions; spending comes from café orders.
export function useWallet() {
  const [state, setState] = useState({ earned: 0, spent: 0, minutes: 0, sessions: 0, loading: true });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let live = true;
    (async () => {
      const [earnedCache, spentCache] = await Promise.all([
        loadCached('nook.wallet.earned', async () => {
          const res = await db.entities.StudySession.aggregate({
            query: { deleted: { $ne: true } },
            sum: ['coins', 'duration_seconds'],
          });
          return (res?.rows && res.rows[0]) || {};
        }),
        loadCached('nook.wallet.spent', async () => {
          const res = await db.entities.Purchase.aggregate({
            query: { deleted: { $ne: true } },
            sum: ['price'],
          });
          return (res?.rows && res.rows[0]) || {};
        }),
      ]);
      if (!live) return;
      const earned = Math.round(earnedCache.data?.sum_coins || 0);
      const spent = Math.round(spentCache.data?.sum_price || 0);
      setState({
        earned,
        spent,
        minutes: Math.round((earnedCache.data?.sum_duration_seconds || 0) / 60),
        sessions: earnedCache.data?.count || 0,
        balance: earned - spent,
        loading: false,
      });
    })();
    return () => {
      live = false;
    };
  }, [tick]);

  return { ...state, reload };
}