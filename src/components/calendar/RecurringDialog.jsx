import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Repeat } from 'lucide-react';
import { KINDS, KIND_ORDER, kindOf } from '@/lib/blocks';
import { isoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const PATTERNS = [
  { id: 'daily', label: 'every day' },
  { id: 'weekdays', label: 'every weekday' },
  { id: 'weekly', label: 'every week on…' },
  { id: 'interval', label: 'every few days' },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function buildDates({ start, pattern, weekdays, interval, until, occurrences }) {
  const out = [];
  const begin = new Date(start);
  const end = until ? new Date(until) : null;
  const cursor = new Date(begin);

  const push = () => {
    const iso = isoDate(cursor);
    if (!out.includes(iso)) out.push(iso);
  };

  let guard = 0;
  if (pattern === 'interval') {
    const step = Math.max(1, interval);
    while (out.length < occurrences && guard < 400) {
      if (end && cursor > end) break;
      push();
      cursor.setDate(cursor.getDate() + step);
      guard += 1;
    }
    return out;
  }

  while (out.length < occurrences && guard < 800) {
    if (end && cursor > end) break;
    const dow = (cursor.getDay() + 6) % 7; // monday = 0
    if (pattern === 'daily') push();
    else if (pattern === 'weekdays') {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) push();
    } else if (pattern === 'weekly') {
      if (weekdays.length === 0 || weekdays.includes(DAYS[dow])) push();
    }
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return out;
}

export default function RecurringDialog({ open, onOpenChange, date, onSaved }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('task');
  const [start, setStart] = useState(date || isoDate(new Date()));
  const [pattern, setPattern] = useState('daily');
  const [weekdays, setWeekdays] = useState([]);
  const [interval, setInterval] = useState(2);
  const [until, setUntil] = useState('');
  const [occurrences, setOccurrences] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) {
      setError('give it a name first');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const dates = buildDates({ start, pattern, weekdays, interval, until, occurrences });
      await base44.entities.Block.bulkCreate(
        dates.map((due) => ({ title: title.trim(), kind, due_date: due, done: false }))
      );
      onOpenChange(false);
      onSaved?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md gap-3 overflow-y-auto rounded-[1.9rem] border-0 p-5 shadow-lift sm:rounded-[1.9rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-black">recurring event</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="revision, lecture, gym…" className="h-11" autoFocus />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] text-muted-foreground">starts</span>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-11" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-muted-foreground">times</span>
              <Input
                type="number"
                min={1}
                max={60}
                value={occurrences}
                onChange={(e) => setOccurrences(Math.min(60, Math.max(1, Number(e.target.value) || 1)))}
                className="h-11"
              />
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">what is it</p>
            <div className="flex flex-wrap gap-1.5">
              {KIND_ORDER.map((k) => {
                const meta = kindOf(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[12px] transition-colors',
                      kind === k ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {KINDS[k].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">repeats</p>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPattern(p.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[12px] transition-colors',
                    pattern === p.id ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {pattern === 'weekly' && (
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[12px]',
                    weekdays.includes(d) ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {pattern === 'interval' && (
            <label className="flex items-center gap-3">
              <span className="text-[12px] text-muted-foreground">every</span>
              <Input
                type="number"
                min={1}
                max={30}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value) || 1)}
                className="h-10 w-20"
              />
              <span className="text-[12px] text-muted-foreground">days</span>
            </label>
          )}

          <label className="flex items-center gap-3">
            <span className="shrink-0 text-[11px] text-muted-foreground">until</span>
            <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="h-11 flex-1" />
          </label>

          {error && <p className="text-[12px] text-destructive">{error}</p>}

          <Button className="h-11 w-full rounded-full font-medium" onClick={save} disabled={busy}>
            <Repeat className="mr-2 h-4 w-4" /> {busy ? 'adding…' : 'add recurring'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}