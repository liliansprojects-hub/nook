import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react';
import BlockSheet from '@/components/BlockSheet';
import RecurringDialog from '@/components/calendar/RecurringDialog';
import { kindOf } from '@/lib/blocks';
import { isoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(isoDate(new Date()));
  const [blocks, setBlocks] = useState([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [openBlock, setOpenBlock] = useState(null);
  const [recurringOpen, setRecurringOpen] = useState(false);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  const load = async () => {
    try {
      const page = await base44.entities.Block.filter(
        { due_date: { $gte: isoDate(first), $lte: isoDate(last) }, deleted: { $ne: true } },
        { sort: 'due_date', limit: 300 }
      );
      setBlocks(page.items || []);
    } catch (err) {
      setBlocks([]);
    }
  };

  useEffect(() => {
    load();
  }, [cursor.getMonth(), cursor.getFullYear()]);

  const startOffset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(first);
    date.setDate(1 - startOffset + i);
    return date;
  });

  const dueOn = (date) => blocks.filter((b) => b.due_date === isoDate(date));
  const dayItems = blocks.filter((b) => b.due_date === selected);
  const todayIso = isoDate(new Date());

  const toggle = async (block) => {
    await base44.entities.Block.update(block.id, { done: !block.done });
    load();
  };

  const addTask = async () => {
    if (!quickTitle.trim()) return;
    await base44.entities.Block.create({ title: quickTitle.trim(), kind: 'task', due_date: selected });
    setQuickTitle('');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black">calendar</h1>
          <p className="text-[12px] font-bold text-muted-foreground">due dates at a glance.</p>
        </div>
        <Button
          variant="outline"
          className="h-10 shrink-0 rounded-full px-4 font-bold"
          onClick={() => setRecurringOpen(true)}
          aria-label="add a recurring event"
          data-testid="recurring-button"
        >
          <Repeat className="mr-1.5 h-4 w-4" /> recurring
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-heading text-sm font-extrabold">
              {cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-center text-[10px] font-extrabold text-muted-foreground">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date) => {
              const iso = isoDate(date);
              const items = dueOn(date);
              const inMonth = date.getMonth() === cursor.getMonth();
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center rounded-[1rem] text-[12px] font-extrabold transition-colors',
                    inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                    selected === iso && 'bg-brand text-brand-foreground',
                    selected !== iso && iso === todayIso && 'bg-brand-soft text-brand-ink'
                  )}
                >
                  {date.getDate()}
                  <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                    {items.slice(0, 3).map((item) => {
                      const meta = kindOf(item.kind);
                      return (
                        <span
                          key={item.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: selected === iso ? '#fff' : meta.accent }}
                        />
                      );
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="surface p-4">
          <p className="font-heading text-sm font-extrabold">
            {new Date(selected).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
            {dayItems.length} {dayItems.length === 1 ? 'item' : 'items'} due
          </p>

          <div className="mt-4 flex gap-2">
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task for this day"
              className="h-11 flex-1 rounded-full border border-input bg-card px-4 text-[13px] font-bold outline-none focus:border-brand"
            />
            <Button size="icon" className="h-11 w-11 rounded-full" onClick={addTask} aria-label="Add task">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {dayItems.length === 0 ? (
              <div className="rounded-[1.4rem] border-2 border-dashed border-border p-8 text-center text-[12px] font-bold text-muted-foreground">
                Nothing due on this day.
              </div>
            ) : (
              dayItems.map((item) => {
                const meta = kindOf(item.kind);
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className={cn('flex items-center gap-3 rounded-[1.2rem] bg-secondary/60 p-3', item.done && 'opacity-55')}
                  >
                    <button type="button" onClick={() => setOpenBlock(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem]"
                        style={{ background: meta.tint, color: meta.accent }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={cn('min-w-0 flex-1 truncate text-[13px] font-extrabold', item.done && 'line-through')}>
                        {item.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      aria-label="Mark done"
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-full border-2',
                        item.done ? 'border-brand bg-brand text-brand-foreground' : 'border-border text-transparent'
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <BlockSheet
        open={!!openBlock}
        onOpenChange={() => setOpenBlock(null)}
        block={openBlock}
        children={[]}
        onChanged={load}
      />

      <RecurringDialog
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        date={selected}
        onSaved={load}
      />
    </div>
  );
}