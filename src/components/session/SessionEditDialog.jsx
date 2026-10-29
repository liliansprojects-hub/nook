import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TAG_COLOURS } from '@/lib/accents';
import { cn } from '@/lib/utils';

export default function SessionEditDialog({ open, onOpenChange, session, blocks = [], onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [blockId, setBlockId] = useState('');
  const [colour, setColour] = useState(TAG_COLOURS[0]);

  useEffect(() => {
    if (!open || !session) return;
    setTitle(session.room_name || '');
    setDescription(session.description || '');
    setLocation(session.location || '');
    setBlockId(session.block_id || '');
    setColour(session.tag_colour || TAG_COLOURS[0]);
  }, [open, session]);

  if (!session) return null;
  const block = blocks.find((b) => b.id === blockId);

  const save = async () => {
    await base44.entities.StudySession.update(session.id, {
      room_name: title,
      description,
      location,
      block_id: blockId,
      block_label: block?.title || '',
      tag_colour: colour,
      is_free: !blockId && session.is_free,
    });
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.8rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-black">Edit session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-extrabold text-muted-foreground">Name</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-extrabold text-muted-foreground">What was it about?</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-[1.2rem] border border-input bg-card p-3 text-sm font-semibold outline-none focus:border-brand"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-extrabold text-muted-foreground">Where</span>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11" placeholder="Library" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-extrabold text-muted-foreground">Tag</span>
            <Select value={blockId || 'none'} onValueChange={(value) => setBlockId(value === 'none' ? '' : value)}>
              <SelectTrigger className="h-11 w-full rounded-[1.2rem] border-input bg-card px-3 text-sm font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No tag</SelectItem>
                {blocks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="space-y-1.5">
            <span className="text-[12px] font-extrabold text-muted-foreground">Colour</span>
            <div className="flex flex-wrap gap-2">
              {TAG_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColour(c)}
                  style={{ background: c }}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform',
                    colour === c ? 'scale-110 ring-2 ring-foreground ring-offset-2' : 'hover:scale-105'
                  )}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>

          <Button className="h-12 w-full rounded-full font-extrabold" onClick={save}>
            Save session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}