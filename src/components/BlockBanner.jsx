import { Check } from 'lucide-react';
import { kindOf, formatDue } from '@/lib/blocks';
import { cn } from '@/lib/utils';

export default function BlockBanner({ block, childCount = 0, onToggle, onOpen }) {
  const kind = kindOf(block.kind);
  const Icon = kind.icon;
  const due = formatDue(block.due_date);
  const late = due && (due.includes('late') || due === 'Yesterday');
  const done = !!block.done;

  return (
    <div
      className={cn(
        'group surface animate-fade-up flex items-center gap-3 p-3 pr-4 transition-all duration-300 hover:shadow-lift',
        done && 'opacity-55'
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem]"
          style={{ background: kind.tint, color: kind.accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate font-heading text-[15px] font-extrabold', done && 'line-through decoration-2')}>
            {block.title}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="pill" style={{ background: kind.tint, color: kind.accent }}>
              {kind.label}
            </span>
            {due && (
              <span className={cn('pill', late ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground')}>
                {due}
              </span>
            )}
            {childCount > 0 && (
              <span className="pill bg-secondary text-muted-foreground">
                {childCount} {childCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Mark done"
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-all duration-200',
          done ? 'border-brand bg-brand text-brand-foreground' : 'border-border text-transparent hover:border-brand'
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}