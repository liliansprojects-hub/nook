import { Coins, Gift, Sparkles, Tag, Timer } from 'lucide-react';
import ItemArt from '@/components/cafe/ItemArt';
import { dailyOffers, nextWindowAt } from '@/lib/cafeOffers';
import { menuItem } from '@/lib/cafeMenu';

function untilNext() {
  const ms = Math.max(0, nextWindowAt().getTime() - Date.now());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function OfferBoard({ onOpenItem }) {
  const offers = dailyOffers();
  const featured = offers.featured.map((id) => menuItem(id)).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 font-heading text-[15px] font-medium">
            <Sparkles className="h-4 w-4 text-brand" /> discounts
          </h2>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Timer className="h-3 w-3" /> new picks in {untilNext()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {featured.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenItem?.(item, true)}
              className="press relative overflow-hidden rounded-[1.4rem] bg-secondary/50 p-2.5 text-left"
            >
              <span className="absolute left-2.5 top-2.5 rounded-full bg-destructive px-2 py-0.5 text-[10px] text-white">
                50% off
              </span>
              <ItemArt item={item} className="mx-auto h-24 w-full" />
              <p className="mt-1.5 truncate text-[12px]">{item.name}</p>
              <p className="text-[11px] text-muted-foreground">
                <span className="line-through">{item.price}</span> · {Math.round(item.price * 0.5)} coins
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 font-heading text-[15px] font-medium">
          <Gift className="h-4 w-4 text-brand" /> offers
        </h2>
        <ul className="space-y-2.5">
          <Offer
            title={`free ${offers.freeItem.name}`}
            detail="with any drink"
            art={offers.freeItem}
            onOpen={() => onOpenItem?.(offers.freeItem, false)}
          />
          <Offer
            title={`free ${offers.giftItem.name}`}
            detail={`spend ${offers.minSpend}+ coins`}
            art={offers.giftItem}
            onOpen={() => onOpenItem?.(offers.giftItem, false)}
          />
          <li className="flex items-center gap-3 rounded-[1.2rem] bg-secondary/50 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem] bg-brand-soft text-brand-ink">
              <Tag className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px]">buy one get one</span>
              <span className="block text-[11px] text-muted-foreground">two drinks, cheaper one free</span>
            </span>
          </li>
        </ul>

        <div className="mt-3 flex items-center gap-3 rounded-[1.2rem] border border-dashed border-border p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem] bg-secondary text-muted-foreground">
            <Coins className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px]">today's code · {offers.code}</span>
            <span className="block text-[11px] text-muted-foreground">20% off · use it at checkout</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Offer({ title, detail, art, onOpen }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="press flex w-full items-center gap-3 rounded-[1.2rem] bg-secondary/50 p-2.5 text-left">
        <ItemArt item={art} className="h-11 w-11 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px]">{title}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{detail}</span>
        </span>
        <span className="pill shrink-0 bg-brand-soft text-brand-ink">free</span>
      </button>
    </li>
  );
}