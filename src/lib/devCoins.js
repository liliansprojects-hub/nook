import { base44 } from '@/api/base44Client';
import { readCache, writeCache } from '@/lib/offline';

// A hidden developer code: typed into the café discount box it adds coins to the
// balance instead of discounting anything.
export const DEV_COINS = 25;
const DEV_CODE = 'DEVELOPERCOINS118';
const LEDGER_KEY = 'nook.coinGrants';

export function isDevCode(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase() === DEV_CODE;
}

function readLedger() {
  const ledger = readCache(LEDGER_KEY);
  return Array.isArray(ledger) ? ledger : [];
}

// grants that could not be saved to the account yet (offline, or the CoinGrant
// entity is not deployed to the backend) — they still count towards the balance
export function localGrantTotal() {
  return readLedger().reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
}

export function clearLocalGrants() {
  writeCache(LEDGER_KEY, []);
}

// Tries to move any held grants onto the account. Whatever succeeds leaves the ledger.
export async function syncLocalGrants() {
  const ledger = readLedger();
  if (!ledger.length) return;
  const remaining = [];
  for (const grant of ledger) {
    try {
      await base44.entities.CoinGrant.create({ amount: grant.amount, reason: grant.reason, granted_at: grant.granted_at });
    } catch {
      remaining.push(grant);
    }
  }
  writeCache(LEDGER_KEY, remaining);
}

// +25 coins every time the code is entered. Returns where it was saved.
export async function grantDevCoins() {
  const grant = { amount: DEV_COINS, reason: 'developer code', granted_at: new Date().toISOString() };
  try {
    await base44.entities.CoinGrant.create(grant);
    return { amount: DEV_COINS, savedTo: 'account' };
  } catch {
    writeCache(LEDGER_KEY, [...readLedger(), grant]);
    return { amount: DEV_COINS, savedTo: 'device' };
  }
}
