import { base44 } from '@/api/base44Client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Check, Coins, MapPin, Pencil, Trash2 } from 'lucide-react';
import { clock, dayLabel, timeLabel } from '@/lib/format';
import SessionEditDialog from '@/components/session/SessionEditDialog';
import { cn } from '@/lib/utils';

export default function LogList({ sessions = [], blocks = [], loading, onChanged, emptyText = 'nothing here yet.' }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);

  const toggleSelected = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const deleteOne = async (session) => {
    await base44.entities.StudySession.update(session.id, { deleted: true });
    onChanged?.();
  };

  const deleteSelected = async () => {
    if (!selected.length) return;
    await base44.entities.StudySession.bulkUpdate(selected.map((id) => ({ id, deleted: true })));
    setSelected([]);
    setSelectMode(false);
    onChanged?.();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[1.5rem] bg-secondary/70" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold text-muted-foreground">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </span>
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectMode((v) => !v);
              setSelected([]);
            }}
            className="text-[12px] font-extrabold text-brand"
          >
            {selectMode ? 'cancel' : 'select'}
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-border p-10 text-center text-[12px] font-bold text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((session) => (
            <div key={session.id} className="surface animate-fade-up flex items-start gap-3 p-3.5">
              {selectMode && (
                <button
                  type="button"
                  onClick={() => toggleSelected(session.id)}
                  className={cn(
                    'mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
                    selected.includes(session.id) ? 'border-brand bg-brand text-brand-foreground' : 'border-border'
                  )}
                >
                  {selected.includes(session.id) && <Check className="h-3.5 w-3.5" />}
                </button>
              )}

              <span
                className="mt-1 h-9 w-2 shrink-0 rounded-full"
                style={{ background: session.tag_colour || 'hsl(var(--border))' }}
              />

              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing(session)}>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-[15px] font-extrabold">{session.room_name || 'Study session'}</span>
                  {session.is_free && <span className="pill bg-secondary text-muted-foreground">free</span>}
                  {session.block_label && <span className="pill bg-brand-soft text-brand-ink">{session.block_label}</span>}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <span>{dayLabel(session.started_at)} · {timeLabel(session.started_at)}</span>
                  <span className="font-heading text-[12px] font-black text-foreground">{clock(session.duration_seconds)}</span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-3 w-3" /> {session.coins || 0}
                  </span>
                  {session.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {session.location}
                    </span>
                  )}
                </p>
                {session.description && (
                  <p className="mt-1 line-clamp-2 text-[12px] font-semibold text-muted-foreground">{session.description}</p>
                )}
              </button>

              {!selectMode && (
                <div className="flex shrink-0 items-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditing(session)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-destructive"
                    onClick={() => deleteOne(session)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectMode && selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-3 rounded-full bg-foreground px-4 py-3 text-background shadow-lift md:bottom-8">
          <span className="flex-1 text-[12px] font-extrabold">{selected.length} selected</span>
          <button type="button" className="text-[12px] font-extrabold text-destructive-foreground/80" onClick={deleteSelected}>
            delete
          </button>
        </div>
      )}

      <SessionEditDialog
        open={!!editing}
        onOpenChange={() => setEditing(null)}
        session={editing}
        blocks={blocks}
        onSaved={() => {
          setEditing(null);
          onChanged?.();
        }}
      />
    </div>
  );
}