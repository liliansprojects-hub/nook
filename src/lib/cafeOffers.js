// Café offers. Everything is worked out from the clock, so every device sees
// the same half-price picks and the same daily offers without a server.
import { MENU, DRINKS, PASTRIES, menuItem } from '@/lib/cafeMenu';

const SIX_HOURS = 6 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

function seeded(seed) {
  let s = Math.abs(Math.floor(seed)) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function windowIndex(date = new Date()) {
  return Math.floor(date.getTime() / SIX_HOURS);
}

export function nextWindowAt(date = new Date()) {
  return new Date((windowIndex(date) + 1) * SIX_HOURS);
}

// 2–3 items go half price every six hours; they are pulled to the top of the shop.
export function featuredIds(date = new Date()) {
  const rand = seeded(windowIndex(date) * 7919);
  const count = 2 + Math.floor(rand() * 2); // 2 or 3
  const pool = [...DRINKS, ...PASTRIES];
  const picked = [];
  while (picked.length < count && picked.length < pool.length) {
    const candidate = pool[Math.floor(rand() * pool.length)];
    if (!picked.includes(candidate.id)) picked.push(candidate.id);
  }
  return picked;
}

// The offers change once a day.
export function dailyOffers(date = new Date()) {
  const day = Math.floor(date.getTime() / DAY);
  const rand = seeded(day * 104729);

  const cheapPastries = PASTRIES.filter((p) => p.price <= 18);
  const freeItem = cheapPastries[Math.floor(rand() * cheapPastries.length)] || PASTRIES[0];
  const giftPool = PASTRIES.filter((p) => p.id !== freeItem.id && p.price <= 21);
  const giftItem = giftPool[Math.floor(rand() * giftPool.length)] || PASTRIES[0];
  const minSpend = 45 + Math.floor(rand() * 3) * 5; // 45, 50 or 55

  return {
    featured: featuredIds(date),
    freeItem,
    giftItem,
    minSpend,
    code: 'nook20',
    codePercent: 20,
  };
}

// Prices, offers and the final total — the same maths the checkout shows.
export function quote(lines = [], { code = '', offers, skipFree = false } = {}) {
  const today = offers || dailyOffers();
  const featured = new Set(today.featured || []);

  const priced = lines.map((line) => {
    const isFeatured = featured.has(line.id);
    const unit = isFeatured ? Math.round(line.price * 0.5) : line.price;
    return { ...line, unit, wasUnit: line.price, featured: isFeatured, lineTotal: unit * (line.qty || 1) };
  });

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);
  const discounts = [];
  const drinks = priced.filter((l) => l.kind === 'drink');
  const pastries = priced.filter((l) => l.kind === 'pastry');

  if (drinks.length >= 2) {
    const cheapest = drinks.reduce((min, l) => (l.unit < min.unit ? l : min), drinks[0]);
    discounts.push({ id: 'bogo', label: `bogo — ${cheapest.name} free`, amount: cheapest.unit });
  }

  // A free item is not money off: it is that item, added to the order at no
  // cost, so it still lands on your desk like anything else you bought. It can
  // be taken out of the basket (skipFree) and then stays out.
  const freebies = [];
  if (drinks.length >= 1) {
    const best = subtotal >= today.minSpend && pastries.length === 0 ? today.giftItem : today.freeItem;
    freebies.push({
      item: best,
      reason: best.id === today.giftItem.id ? `over ${today.minSpend} coins` : 'with any drink',
    });
  }

  const freeLines = freebies.map((f) => ({
    key: `free::${f.item.id}`,
    id: f.item.id,
    name: f.item.name,
    kind: f.item.kind,
    art: f.item.art,
    price: 0,
    wasUnit: f.item.price,
    unit: 0,
    lineTotal: 0,
    qty: 1,
    free: true,
    free_reason: f.reason,
    featured: false,
    options: {},
    options_text: '',
  }));

  const offeredFree = skipFree ? freeLines : [];
  const givenFree = skipFree ? [] : freeLines;

  const afterOffers = Math.max(0, subtotal - discounts.reduce((sum, d) => sum + d.amount, 0));

  const normalised = (code || '').trim().toLowerCase().replace(/\s+/g, '');
  const codeOk = normalised === today.code;
  if (codeOk && afterOffers > 0) {
    discounts.push({ id: 'code', label: `code ${today.code} — ${today.codePercent}% off`, amount: Math.round(afterOffers * (today.codePercent / 100)) });
  }

  const total = Math.max(0, afterOffers - (codeOk ? Math.round(afterOffers * (today.codePercent / 100)) : 0));

  return { lines: [...priced, ...givenFree], subtotal, discounts, freebies: givenFree, offeredFree, total, codeOk };
}

export function offerHeadline(item) {
  return menuItem(item?.id)?.name || MENU[0].name;
}