import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KIND_ORDER, kindOf } from '@/lib/blocks';
import { cn } from '@/lib/utils';

export default function BlockDialog({ open, onOpenChange, kind = 'task', parent = null, block = null, onSaved }) {
  const [title, setTitle] = useState('');
  const [chosenKind, setChosenKind] = useState(kind);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (block) {
      setTitle(block.title || '');
      setChosenKind(block.kind || 'task');
      setDueDate(block.due_date || '');
      setNotes(block.notes || '');
    } else {
      setTitle('');
      setChosenKind(kind);
      setDueDate('');
      setNotes('');
    }
    setError('');
  }, [open, block, kind]);

  const save = async () => {
    if (!title.trim()) {
      setError('needs a name');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        kind: chosenKind,
        due_date: dueDate,
        notes,
        parent_id: block ? block.parent_id || '' : parent?.id || '',
      };
      if (block) await base44.entities.Block.update(block.id, payload);
      else await base44.entities.Block.create(payload);
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err.message || 'could not save');
    } finally {
      setBusy(false);
    }
  };

  const heading = block ? 'edit' : parent ? `add to ${parent.title}` : 'new block';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.8rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{heading}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="what is it?"
            className="h-12"
          />

          <div className="flex flex-wrap gap-2">
            {KIND_ORDER.map((k) => {
              const meta = kindOf(k);
              const Icon = meta.icon;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChosenKind(k)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-all',
                    chosenKind === k ? 'text-foreground ring-2 ring-foreground' : 'text-muted-foreground'
                  )}
                  style={{ background: meta.tint }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: meta.accent }} />
                  {meta.label}
                </button>
              );
            })}
          </div>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-muted-foreground">due</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-11 w-full rounded-[1.2rem] border border-input bg-card px-3 text-sm font-bold outline-none focus:border-brand"
            />
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="notes"
            className="w-full rounded-[1.2rem] border border-input bg-card p-3 text-sm outline-none focus:border-brand"
          />

          {error && <p className="text-[12px] font-bold text-destructive">{error}</p>}

          <Button className="h-12 w-full rounded-full" onClick={save} disabled={busy}>
            {busy ? 'saving…' : 'save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}