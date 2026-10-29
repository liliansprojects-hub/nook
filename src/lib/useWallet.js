import { base44 } from '@/api/base44Client';

import { useCallback, useEffect, useState } from 'react';

import { loadCached } from '@/lib/offline';
import { localGrantTotal, syncLocalGrants } from '@/lib/devCoins';

// Coins come from finished sessions (and developer grants); spending comes from café orders.
export function useWallet() {
  const [state, setState] = useState({ earned: 0, spent: 0, granted: 0, minutes: 0, sessions: 0, loading: true });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let live = true;
    (async () => {
      await syncLocalGrants().catch(() => {});
      const [earnedCache, spentCache, grantCache] = await Promise.all([
        loadCached('nook.wallet.earned', async () => {
          const res = await base44.entities.StudySession.aggregate({
            query: { deleted: { $ne: true } },
            sum: ['coins', 'duration_seconds'],
          });
          return (res?.rows && res.rows[0]) || {};
        }),
        loadCached('nook.wallet.spent', async () => {
          const res = await base44.entities.Purchase.aggregate({
            query: { deleted: { $ne: true } },
            sum: ['price'],
          });
          return (res?.rows && res.rows[0]) || {};
        }),
        // the CoinGrant entity may not be deployed yet: that is just zero granted
        loadCached('nook.wallet.granted', async () => {
          const res = await base44.entities.CoinGrant.aggregate({ query: {}, sum: ['amount'] });
          return (res?.rows && res.rows[0]) || {};
        }).catch(() => ({ data: {} })),
      ]);
      if (!live) return;
      const earned = Math.round(earnedCache.data?.sum_coins || 0);
      const spent = Math.round(spentCache.data?.sum_price || 0);
      const granted = Math.round(grantCache.data?.sum_amount || 0) + localGrantTotal();
      setState({
        earned,
        spent,
        granted,
        minutes: Math.round((earnedCache.data?.sum_duration_seconds || 0) / 60),
        sessions: earnedCache.data?.count || 0,
        balance: earned + granted - spent,
        loading: false,
      });
    })();
    return () => {
      live = false;
    };
  }, [tick]);

  return { ...state, reload };
}
