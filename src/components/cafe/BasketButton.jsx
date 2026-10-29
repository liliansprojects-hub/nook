import { useNavigate } from 'react-router-dom';
import { ShoppingBasket } from 'lucide-react';
import { countItems } from '@/lib/cafeBasket';
import { quote } from '@/lib/cafeOffers';

export default function BasketButton({ basket, code }) {
  const navigate = useNavigate();
  const count = countItems(basket);
  if (!count) return null;
  const { total } = quote(basket.lines, { code, skipFree: basket.skipFree });

  return (
    <button
      type="button"
      onClick={() => navigate('/checkout')}
      className="press fixed bottom-8 right-5 z-40 flex items-center gap-2.5 rounded-full bg-brand px-4 py-3 text-brand-ink shadow-lift md:bottom-10 md:right-10"
      data-testid="basket-button"
    >
      <span className="relative grid h-7 w-7 place-items-center rounded-full bg-background/15">
        <ShoppingBasket className="h-3.5 w-3.5" />
      </span>
      <span className="text-[12px]">
        {count} item{count === 1 ? '' : 's'} · {total} coins
      </span>
    </button>
  );
}