import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Coins, Minus, Plus, Sparkles, Utensils } from 'lucide-react';
import { OPTIONS, defaultOptions, nutritionFor } from '@/lib/cafeMenu';
import { cn } from '@/lib/utils';
import ItemArt from '@/components/cafe/ItemArt';

export default function ItemSheet({ item, open, onOpenChange, featured, onAdd }) {
  const [chosen, setChosen] = useState({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!item) return;
    setChosen(defaultOptions(item));
    setQty(1);
  }, [item]);

  const price = useMemo(() => {
    if (!item) return 0;
    return featured ? Math.round(item.price * 0.5) : item.price;
  }, [item, featured]);

  // the contents below move with the ice, sugar, milk and toppings chosen
  const facts = useMemo(() => nutritionFor(item, chosen), [item, chosen]);

  if (!item) return null;

  const optionKeys = item.options || [];

  const toggle = (key, value, multi) => {
    setChosen((prev) => {
      if (!multi) return { ...prev, [key]: value };
      const list = Array.isArray(prev[key]) ? prev[key] : [];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-[1.9rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-medium">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="grid place-items-center rounded-[1.5rem] bg-secondary/50 p-4">
          <ItemArt item={item} className="h-40 w-full" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="pill bg-secondary text-muted-foreground">{item.kind === 'drink' ? 'drink' : 'pastry'}</span>
          <span className="pill bg-brand-soft text-brand-ink">
            <Coins className="h-3 w-3" /> {price} coins
          </span>
          {featured && <span className="pill bg-destructive/12 text-destructive">50% off today</span>}
          <span className="pill bg-secondary text-muted-foreground">{facts.kcal}</span>
          {facts.caffeine && <span className="pill bg-secondary text-muted-foreground">{facts.caffeine} caffeine</span>}
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/80">{item.blurb}</p>

        {item.culture && (
          <p className="rounded-[1.2rem] bg-secondary/60 p-3 text-[12px] leading-relaxed text-muted-foreground">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
            {item.culture}
          </p>
        )}

        {optionKeys.length > 0 && (
          <div className="space-y-3 rounded-[1.4rem] border border-border/70 p-3.5">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground">options</p>
            {optionKeys.map((key) => {
              const spec = OPTIONS[key];
              const value = chosen[key];
              return (
                <div key={key}>
                  <p className="mb-1.5 text-[12px] text-muted-foreground">{spec.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {spec.choices.map((choice) => {
                      const active = spec.multi ? (value || []).includes(choice) : value === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => toggle(key, choice, spec.multi)}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-[12px] transition-colors',
                            active ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-[1.4rem] bg-secondary/50 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] tracking-[0.16em] text-muted-foreground">
            <Utensils className="h-3.5 w-3.5" /> recipe
          </p>
          <ol className="space-y-1.5">
            {item.recipe.map((step, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-foreground/80">
                <span className="text-muted-foreground">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[1.4rem] border border-border/70 p-3.5">
          <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground">contents</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
            <Nutrient label="energy" value={facts.kcal} />
            <Nutrient label="protein" value={facts.protein} />
            <Nutrient label="carbs" value={facts.carbs} />
            <Nutrient label="fat" value={facts.fat} />
            {facts.sugar && <Nutrient label="sugar" value={facts.sugar} />}
            {facts.caffeine && <Nutrient label="caffeine" value={facts.caffeine} />}
          </div>
          <p className="mt-3 flex gap-1.5 text-[12px] leading-relaxed text-foreground/70">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            {item.benefits}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-card" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-[13px]">{qty}</span>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-card" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            className="h-12 flex-1 rounded-full font-medium"
            onClick={() => {
              onAdd?.(item, chosen, qty);
              onOpenChange(false);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> add · {price * qty}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Nutrient({ label, value }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </p>
  );
}