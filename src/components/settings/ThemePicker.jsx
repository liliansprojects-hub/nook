import { ACCENTS, getAccent } from '@/lib/accents';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import AccentWheel from '@/components/settings/AccentWheel';

export default function ThemePicker({ value, onChange, onCustom }) {
  const custom = value === 'custom' ? getAccent('custom') : null;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
        {ACCENTS.map((accent) => (
          <button
            key={accent.id}
            type="button"
            onClick={() => onChange(accent.id)}
            className="press flex flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                'grid h-12 w-12 place-items-center rounded-full transition-transform',
                value === accent.id && 'ring-2 ring-foreground ring-offset-2'
              )}
              style={{ background: `hsl(${accent.brand})` }}
            >
              {value === accent.id && <Check className="h-4 w-4 text-white" />}
            </span>
            <span className="text-[10px] font-extrabold text-muted-foreground">{accent.name}</span>
          </button>
        ))}
      </div>

      {onCustom && (
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="mb-3 text-[12px] font-extrabold text-brand-ink">mix your own</p>
          <AccentWheel initial={custom ? { h: custom.h, s: custom.s, l: custom.l } : undefined} active={!!custom} onUse={onCustom} />
        </div>
      )}
    </div>
  );
}