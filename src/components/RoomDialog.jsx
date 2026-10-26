const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { ROOM_THEMES, getTheme, themeShade } from '@/lib/roomThemes';
import AccentWheel, { HUE_RING } from '@/components/settings/AccentWheel';
import { cn } from '@/lib/utils';

export default function RoomDialog({ open, onOpenChange, room = null, onSaved, onDeleted }) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('sunrise');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [showWheel, setShowWheel] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(room?.name || '');
    setTheme(room?.theme || 'sunrise');
    setDescription(room?.description || '');
    setShowWheel(!!themeShade(room?.theme));
  }, [open, room]);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const saved = room
        ? await db.entities.StudyRoom.update(room.id, { name: name.trim(), theme, description })
        : await db.entities.StudyRoom.create({ name: name.trim(), theme, description });
      onOpenChange(false);
      onSaved?.(saved);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!room) return;
    await db.entities.StudyRoom.update(room.id, { deleted: true });
    onOpenChange(false);
    onDeleted?.();
  };

  const shade = themeShade(theme);
  const chosen = getTheme(theme);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.8rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-black">{room ? 'room' : 'new room'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="room name"
            className="h-12"
            autoFocus
          />

          <div className="grid grid-cols-5 gap-2">
            {ROOM_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-label={t.name}
                className={cn(
                  'h-14 rounded-[1rem] transition-transform',
                  theme === t.id ? 'scale-105 ring-2 ring-foreground ring-offset-2' : 'hover:scale-105'
                )}
                style={{ background: t.from, boxShadow: `inset 0 -18px 0 ${t.to}` }}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowWheel((v) => !v)}
              aria-label="mix your own colour"
              aria-expanded={showWheel}
              className={cn(
                'relative h-14 overflow-hidden rounded-[1rem] transition-transform',
                shade ? 'scale-105 ring-2 ring-foreground ring-offset-2' : 'hover:scale-105'
              )}
              style={{ background: HUE_RING }}
            >
              {shade && (
                <span
                  className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-lift"
                  style={{ background: chosen.from }}
                />
              )}
            </button>
          </div>

          {showWheel && (
            <AccentWheel
              initial={shade || undefined}
              active={!!shade}
              onUse={(shadePicked) => setTheme(`custom:${shadePicked.h},${shadePicked.s},${shadePicked.l}`)}
            />
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="notes"
            className="w-full rounded-[1.2rem] border border-input bg-card p-3 text-sm outline-none focus:border-brand"
          />

          <div className="flex gap-2">
            <Button className="h-12 flex-1 rounded-full" onClick={save} disabled={busy}>
              {room ? 'save' : 'create'}
            </Button>
            {room && (
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full text-destructive"
                onClick={() => {
                  if (window.confirm('delete this room? your sessions are kept.')) remove();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}