import { useEffect, useState } from 'react';
import { Coins, Plus } from 'lucide-react';
import { MENU, CATEGORIES } from '@/lib/cafeMenu';
import { dailyOffers, quote } from '@/lib/cafeOffers';
import { addLine, readBasket, writeBasket, countItems } from '@/lib/cafeBasket';
import { useWallet } from '@/lib/useWallet';
import { getActiveSession } from '@/lib/useStudySession';
import ItemArt from '@/components/cafe/ItemArt';
import ItemSheet from '@/components/cafe/ItemSheet';
import BasketButton from '@/components/cafe/BasketButton';
import OfferBoard from '@/components/cafe/OfferBoard';
import { cn } from '@/lib/utils';

export default function CafeShop({ roomId }) {
  const [category, setCategory] = useState('all');
  const [basket, setBasket] = useState(readBasket);
  const [openItem, setOpenItem] = useState(null);
  const [openFeatured, setOpenFeatured] = useState(false);
  const wallet = useWallet();
  const offers = dailyOffers();

  useEffect(() => {
    const session = getActiveSession();
    if (roomId && basket.roomId !== roomId) {
      setBasket((prev) => writeBasket({ ...prev, roomId: roomId || session?.roomId || '' }));
    }
  }, [roomId]);

  const featuredSet = new Set(offers.featured);
  const list = (category === 'all' ? MENU : MENU.filter((m) => m.cat === category)).slice();
  // Half-price picks are pulled to the top of the shop.
  list.sort((a, b) => Number(featuredSet.has(b.id)) - Number(featuredSet.has(a.id)));

  const { total } = quote(basket.lines, { code: '', skipFree: basket.skipFree });

  const add = (item, chosen, qty) => {
    setBasket((prev) => {
      const next = addLine(prev, item, chosen, qty);
      writeBasket(next);
      return next;
    });
  };

  return (
    <div className="pb-28">
      <div className="surface mb-5 flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1">
          <p className="text-[12px] text-muted-foreground">your coins</p>
          <p className="font-heading text-3xl leading-none">{wallet.balance ?? wallet.earned - wallet.spent}</p>
        </div>
        <div className="space-y-0.5 text-right text-[11px] text-muted-foreground">
          <p>
            {wallet.earned} earned · {wallet.minutes} min
          </p>
          <p>{wallet.spent} spent</p>
          <p className="text-brand">8 coins a minute</p>
        </div>
      </div>

      <OfferBoard onOpenItem={(item, isFeatured) => { setOpenItem(item); setOpenFeatured(!!isFeatured); }} />

      <div className="no-scrollbar -mx-4 my-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          all
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((item) => {
          const featured = featuredSet.has(item.id);
          const price = featured ? Math.round(item.price * 0.5) : item.price;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setOpenItem(item); setOpenFeatured(featured); }}
              className="surface animate-fade-up flex flex-col p-3 text-left"
            >
              <div className="relative mb-2 grid h-28 place-items-center rounded-[1.2rem] bg-secondary/45">
                {featured && (
                  <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] text-white">50% off</span>
                )}
                <ItemArt item={item} className="h-24 w-full" />
              </div>
              <p className="text-[13px] leading-tight">{item.name}</p>
              <p className="mb-2 mt-0.5 flex-1 text-[11px] text-muted-foreground">{item.note}</p>
              <div className="flex items-center justify-between">
                <span className="pill bg-secondary text-muted-foreground">
                  <Coins className="h-3 w-3" /> {price}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-brand-on" aria-hidden="true">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {countItems(basket) > 0 && (
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {countItems(basket)} in basket · {total} coins
        </p>
      )}

      <ItemSheet
        item={openItem}
        featured={openFeatured}
        open={!!openItem}
        onOpenChange={(v) => !v && setOpenItem(null)}
        onAdd={add}
      />

      <BasketButton basket={basket} />
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] transition-colors',
        active ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}