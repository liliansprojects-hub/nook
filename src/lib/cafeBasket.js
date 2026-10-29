// The basket lives in local storage so it survives a refresh or a lost signal.
import { readCache, writeCache } from '@/lib/offline';
import { optionsText } from '@/lib/cafeMenu';

const KEY = 'nook.basket.v2';

export function readBasket() {
  const saved = readCache(KEY);
  if (!saved || typeof saved !== 'object') return { roomId: '', lines: [], skipFree: false };
  return {
    roomId: saved.roomId || '',
    lines: Array.isArray(saved.lines) ? saved.lines : [],
    // true once the free offer item has been taken out of the basket: it is not put back on its own
    skipFree: !!saved.skipFree,
  };
}

export function writeBasket(basket) {
  writeCache(KEY, basket);
  return basket;
}

export function lineKey(item, chosen) {
  const signature = (item.options || [])
    .map((key) => `${key}:${Array.isArray(chosen[key]) ? (chosen[key] || []).slice().sort().join('+') : chosen[key]}`)
    .join('|');
  return `${item.id}::${signature}`;
}

export function addLine(basket, item, chosen, qty = 1) {
  const key = lineKey(item, chosen);
  const existing = basket.lines.find((l) => l.key === key);
  const lines = existing
    ? basket.lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
    : [
        ...basket.lines,
        {
          key,
          id: item.id,
          name: item.name,
          kind: item.kind,
          price: item.price,
          art: item.art,
          options: chosen,
          options_text: optionsText(item, chosen),
          qty,
        },
      ];
  return { ...basket, lines };
}

export function setQty(basket, key, qty) {
  const next = Math.max(0, Math.min(20, qty));
  const lines = next === 0 ? basket.lines.filter((l) => l.key !== key) : basket.lines.map((l) => (l.key === key ? { ...l, qty: next } : l));
  return { ...basket, lines };
}

export function removeLine(basket, key) {
  return { ...basket, lines: basket.lines.filter((l) => l.key !== key) };
}

export function clearBasket(basket) {
  return { ...basket, lines: [], skipFree: false };
}

// Taking the free offer item out of the basket sticks until you add it back.
export function declineFree(basket) {
  return { ...basket, skipFree: true };
}

export function restoreFree(basket) {
  return { ...basket, skipFree: false };
}

export function countItems(basket) {
  return basket.lines.reduce((sum, l) => sum + (l.qty || 1), 0);
}